import { addDays, fromDateKey, toDateKey, todayKey } from '../src/utils/date.js';
import { api, postCandidate, postEmployee, postLeave, registerHr } from './helpers/api.js';
import { useTestDb } from './helpers/db.js';

useTestDb();

const TODAY = todayKey();
const day = (offset) => toDateKey(addDays(fromDateKey(TODAY), offset));

describe('platform behaviour', () => {
  it('GET /api/health is public', async () => {
    const res = await api().get('/api/health').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(typeof res.body.data.uptime).toBe('number');
  });

  it('returns the 404 envelope for unknown routes', async () => {
    const res = await api().get('/api/does-not-exist').expect(404);
    expect(res.body).toEqual({ success: false, message: 'Route not found: GET /api/does-not-exist' });
  });

  it('protects every resource route', async () => {
    const routes = ['/api/candidates', '/api/employees', '/api/attendance', '/api/leaves', '/api/dashboard/stats', '/api/meta/options'];
    const responses = await Promise.all(routes.map((route) => api().get(route)));
    responses.forEach((res) => expect(res.status).toBe(401));
  });

  it('returns 400 "Invalid id" for malformed ObjectIds', async () => {
    const auth = await registerHr();
    const res = await api().get('/api/employees/123').set(auth).expect(400);
    expect(res.body).toEqual({
      success: false,
      message: 'Invalid id',
      errors: [{ field: 'id', message: 'Invalid id' }],
    });
  });

  it('returns 400 for malformed JSON bodies', async () => {
    const res = await api()
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "broken"')
      .expect(400);
    expect(res.body).toEqual({ success: false, message: 'Malformed JSON in request body' });
  });

  it('returns 400 for a truncated multipart body', async () => {
    const auth = await registerHr();
    const boundary = 'hrms-test-boundary';
    const res = await api()
      .post('/api/candidates')
      .set(auth)
      .set('Content-Type', `multipart/form-data; boundary=${boundary}`)
      .send(`--${boundary}
Content-Disposition: form-data; name="fullName"

Jane`)
      .expect(400);
    expect(res.body).toMatchObject({ success: false, message: 'Malformed multipart request' });
  });

  it('returns 400 for a multipart request without a boundary', async () => {
    const auth = await registerHr();
    const res = await api()
      .post('/api/leaves')
      .set(auth)
      .set('Content-Type', 'multipart/form-data')
      .send('fullName=Jane')
      .expect(400);
    expect(res.body.message).toBe('Malformed multipart request');
  });

  it('caps the number of multipart fields', async () => {
    const auth = await registerHr();
    const req = api().post('/api/candidates').set(auth);
    Array.from({ length: 25 }, (_, index) => req.field(`extra${index}`, 'x'));
    const res = await req.expect(400);
    expect(res.body.message).toBe('Too many form fields');
  });

  it('sets security headers', async () => {
    const res = await api().get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('GET /api/meta/options', () => {
  it('returns enum options and distinct positions from candidates and employees', async () => {
    const auth = await registerHr();
    await postCandidate(auth, { position: 'Zeta Engineer' }).expect(201);
    await postEmployee(auth, { position: 'Alpha Analyst' }).expect(201);
    await postEmployee(auth, { email: 'x@example.com', position: 'Zeta Engineer' }).expect(201);

    const res = await api().get('/api/meta/options').set(auth).expect(200);
    expect(res.body.data).toMatchObject({
      departments: expect.arrayContaining(['Engineering', 'Human Resources']),
      roles: ['Intern', 'Junior', 'Senior', 'Team Lead', 'Manager', 'Director'],
      candidateStatuses: ['New', 'Scheduled', 'Ongoing', 'Selected', 'Rejected'],
      employmentTypes: ['Full Time', 'Part Time', 'Contract', 'Internship'],
      employeeStatuses: ['Active', 'Inactive'],
      attendanceStatuses: ['Present', 'Absent', 'Half Day', 'Work From Home', 'On Leave'],
      attendanceFilterStatuses: ['Present', 'Absent', 'Half Day', 'Work From Home', 'On Leave', 'Not Marked'],
      leaveTypes: expect.arrayContaining(['Sick', 'Casual']),
      leaveStatuses: ['Pending', 'Approved', 'Rejected'],
      positions: ['Alpha Analyst', 'Zeta Engineer'],
    });
  });
});

describe('GET /api/dashboard/stats', () => {
  it('aggregates candidates, employees, attendance and leaves', async () => {
    const auth = await registerHr();
    await postCandidate(auth, { email: 'c1@example.com', status: 'New' }).expect(201);
    await postCandidate(auth, { email: 'c2@example.com', status: 'Scheduled' }).expect(201);

    const alice = (await postEmployee(auth, { fullName: 'Alice', email: 'a@example.com', department: 'Design' })).body.data;
    const bob = (await postEmployee(auth, { fullName: 'Bob', email: 'b@example.com', department: 'Engineering' })).body.data;
    const cara = (await postEmployee(auth, { fullName: 'Cara', email: 'c@example.com', department: 'Engineering', status: 'Inactive' })).body.data;

    await api().put('/api/attendance').set(auth).send({ employeeId: alice._id, date: TODAY, status: 'Present' }).expect(200);
    // Attendance of an inactive employee is not part of the roster, so it must not be counted.
    await api().put('/api/attendance').set(auth).send({ employeeId: cara._id, date: TODAY, status: 'Absent' }).expect(200);

    const base = { leaveType: 'Casual', reason: 'Personal' };
    await postLeave(auth, { ...base, employeeId: alice._id, startDate: day(0), endDate: day(1), status: 'Approved' }).expect(201);
    await postLeave(auth, { ...base, employeeId: bob._id, startDate: day(3), endDate: day(3), status: 'Approved' }).expect(201);
    await postLeave(auth, { ...base, employeeId: bob._id, startDate: day(0), endDate: day(0) }).expect(201);

    const res = await api().get(`/api/dashboard/stats?date=${TODAY}`).set(auth).expect(200);
    const { data } = res.body;

    expect(data.candidates).toEqual({
      total: 2,
      byStatus: { New: 1, Scheduled: 1, Ongoing: 0, Selected: 0, Rejected: 0 },
    });
    expect(data.employees.total).toBe(3);
    expect(data.employees.active).toBe(2);
    expect(data.employees.byDepartment).toEqual([
      { department: 'Engineering', count: 2 },
      { department: 'Design', count: 1 },
    ]);
    expect(data.attendance).toMatchObject({ date: TODAY, marked: 1, notMarked: 1 });
    expect(data.attendance.byStatus).toEqual({
      Present: 1,
      Absent: 0,
      'Half Day': 0,
      'Work From Home': 0,
      'On Leave': 0,
    });

    const roster = await api().get(`/api/attendance?date=${TODAY}`).set(auth).expect(200);
    const { 'Not Marked': rosterNotMarked, ...rosterByStatus } = roster.body.meta.summary;
    expect(rosterByStatus).toEqual(data.attendance.byStatus);
    expect(rosterNotMarked).toBe(data.attendance.notMarked);
    expect(data.leaves.pending).toBe(1);
    expect(data.leaves.upcomingApproved).toBe(1);
    expect(data.leaves.approvedOnDate).toHaveLength(1);
    expect(data.leaves.approvedOnDate[0].employee.fullName).toBe('Alice');
    expect(data.recentCandidates).toHaveLength(2);
    expect(data.recentLeaves).toHaveLength(3);
    expect(data.recentLeaves[0].employee).toHaveProperty('fullName');
  });

  it('validates the date parameter', async () => {
    const auth = await registerHr();
    await api().get('/api/dashboard/stats?date=13-10-2026').set(auth).expect(400);
  });
});
