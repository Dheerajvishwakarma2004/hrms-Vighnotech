import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { api, HR_USER, registerHr } from './helpers/api.js';
import { useTestDb } from './helpers/db.js';

useTestDb();

const TWO_HOURS_IN_SECONDS = 2 * 60 * 60;

const fieldsOf = (res) => res.body.errors.map((error) => error.field);

describe('POST /api/auth/register', () => {
  it('creates an HR user and returns a 2 hour session', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ ...HR_USER, confirmPassword: HR_USER.password })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({ fullName: HR_USER.fullName, email: HR_USER.email, role: 'HR' });
    expect(res.body.data.user.password).toBeUndefined();

    const decoded = jwt.decode(res.body.data.token);
    expect(decoded.exp - decoded.iat).toBe(TWO_HOURS_IN_SECONDS);
    expect(res.body.data.expiresAt).toBe(decoded.exp * 1000);

    const stored = await User.findOne({ email: HR_USER.email }).select('+password');
    expect(stored.password).not.toBe(HR_USER.password);
  });

  it('returns field errors for invalid input', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ fullName: 'A', email: 'not-an-email', password: 'weak', confirmPassword: 'different' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
    expect(fieldsOf(res)).toEqual(expect.arrayContaining(['fullName', 'email', 'password', 'confirmPassword']));
  });

  it('reports missing fields as required', async () => {
    const res = await api().post('/api/auth/register').send({}).expect(400);
    const messages = Object.fromEntries(res.body.errors.map((error) => [error.field, error.message]));
    expect(messages.fullName).toBe('Full name is required');
    expect(messages.email).toBe('Email is required');
    expect(messages.password).toBe('Password is required');
  });

  it('rejects passwords without the required character mix', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ ...HR_USER, password: 'password123', confirmPassword: 'password123' })
      .expect(400);
    expect(res.body.errors).toEqual([
      { field: 'password', message: 'Password must include uppercase, lowercase, number and special character' },
    ]);
  });

  it('rejects mismatching password confirmation', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ ...HR_USER, confirmPassword: 'Other1!pass' })
      .expect(400);
    expect(res.body.errors).toEqual([{ field: 'confirmPassword', message: 'Passwords do not match' }]);
  });

  it('returns 409 for an already registered email (case-insensitive)', async () => {
    await registerHr();
    const res = await api()
      .post('/api/auth/register')
      .send({ ...HR_USER, email: HR_USER.email.toUpperCase(), confirmPassword: HR_USER.password })
      .expect(409);
    expect(res.body.errors).toEqual([{ field: 'email', message: 'Email is already registered' }]);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(registerHr);

  it('logs in with valid credentials', async () => {
    const res = await api()
      .post('/api/auth/login')
      .send({ email: HR_USER.email, password: HR_USER.password })
      .expect(200);

    expect(res.body.data.user.email).toBe(HR_USER.email);
    const decoded = jwt.decode(res.body.data.token);
    expect(decoded.exp - decoded.iat).toBe(TWO_HOURS_IN_SECONDS);
    expect(res.body.data.expiresAt).toBe(decoded.exp * 1000);
  });

  it('returns 401 for a wrong password', async () => {
    const res = await api()
      .post('/api/auth/login')
      .send({ email: HR_USER.email, password: 'Wrong1!pass' })
      .expect(401);
    expect(res.body).toEqual({ success: false, message: 'Invalid email or password' });
  });

  it('returns 401 for an unknown email', async () => {
    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: HR_USER.password })
      .expect(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('returns field errors for invalid input', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'bad', password: '' }).expect(400);
    expect(fieldsOf(res)).toEqual(['email', 'password']);
  });
});

describe('session handling', () => {
  it('GET /api/auth/me returns the user and token expiry', async () => {
    const auth = await registerHr();
    const decoded = jwt.decode(auth.Authorization.slice(7));

    const res = await api().get('/api/auth/me').set(auth).expect(200);
    expect(res.body.data.user.email).toBe(HR_USER.email);
    expect(res.body.data.expiresAt).toBe(decoded.exp * 1000);
  });

  it('returns 401 when the token is missing', async () => {
    const res = await api().get('/api/auth/me').expect(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Not authenticated, please log in');
  });

  it('returns 401 "Session expired" for an expired token', async () => {
    await registerHr();
    const user = await User.findOne({ email: HR_USER.email });
    const expired = jwt.sign(
      { sub: String(user._id), exp: Math.floor(Date.now() / 1000) - 60 },
      env.JWT_SECRET,
    );

    const res = await api().get('/api/employees').set('Authorization', `Bearer ${expired}`).expect(401);
    expect(res.body).toEqual({ success: false, message: 'Session expired, please log in again' });
  });

  it('returns 401 for a tampered token', async () => {
    const forged = jwt.sign({ sub: '507f1f77bcf86cd799439011' }, 'some-other-secret-value', { expiresIn: '2h' });
    const res = await api().get('/api/auth/me').set('Authorization', `Bearer ${forged}`).expect(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 when the user no longer exists', async () => {
    const auth = await registerHr();
    await User.deleteMany({});
    await api().get('/api/auth/me').set(auth).expect(401);
  });

  it('POST /api/auth/logout succeeds for an authenticated user', async () => {
    const auth = await registerHr();
    const res = await api().post('/api/auth/logout').set(auth).expect(200);
    expect(res.body.success).toBe(true);
  });
});
