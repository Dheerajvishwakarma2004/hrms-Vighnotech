import request from 'supertest';
import app from '../../src/app.js';
import { createSimplePdf } from '../../src/utils/pdf.js';

export const api = () => request(app);

export const HR_USER = Object.freeze({
  fullName: 'Test Recruiter',
  email: 'recruiter@test.com',
  password: 'Passw0rd!',
});

/** Registers the test HR user and returns a ready-to-use Authorization header. */
export const registerHr = async () => {
  const res = await api()
    .post('/api/auth/register')
    .send({ ...HR_USER, confirmPassword: HR_USER.password })
    .expect(201);
  return { Authorization: `Bearer ${res.body.data.token}` };
};

export const pdfBuffer = (title = 'Resume') => createSimplePdf({ title, lines: ['Generated for tests'] });

/** Supertest parser that collects the raw response body into a Buffer. */
export const binaryParser = (res, callback) => {
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
};

export const candidateData = (overrides = {}) => ({
  fullName: 'Jane Doe',
  email: 'jane.doe@example.com',
  phone: '+919876543210',
  position: 'Frontend Developer',
  department: 'Engineering',
  experience: 3,
  notes: 'Strong React skills',
  ...overrides,
});

export const employeeData = (overrides = {}) => ({
  fullName: 'John Smith',
  email: 'john.smith@example.com',
  phone: '9876543210',
  position: 'Backend Developer',
  department: 'Engineering',
  role: 'Senior',
  experience: 5,
  ...overrides,
});

const withFields = (req, fields) =>
  Object.entries(fields).reduce((acc, [key, value]) => acc.field(key, String(value)), req);

/**
 * Multipart candidate creation.
 * @param {object} auth Authorization header
 * @param {object} overrides field overrides
 * @param {{ buffer?: Buffer, filename?: string, contentType?: string } | null} file `null` to omit the resume
 */
export const postCandidate = (auth, overrides = {}, file = {}) => {
  const req = withFields(api().post('/api/candidates').set(auth), candidateData(overrides));
  if (file === null) return req;
  return req.attach('resume', file.buffer ?? pdfBuffer(), {
    filename: file.filename ?? 'resume.pdf',
    contentType: file.contentType ?? 'application/pdf',
  });
};

export const postEmployee = (auth, overrides = {}) =>
  api().post('/api/employees').set(auth).send(employeeData(overrides));

/** Multipart leave creation with an optional document. */
export const postLeave = (auth, fields, file) => {
  const req = withFields(api().post('/api/leaves').set(auth), fields);
  if (!file) return req;
  return req.attach('document', file.buffer, { filename: file.filename, contentType: file.contentType });
};
