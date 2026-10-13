import { Attendance } from '../src/models/Attendance.js';
import { addDays, fromDateKey, toDateKey, todayKey } from '../src/utils/date.js';
import { api, postEmployee, registerHr } from './helpers/api.js';
import { useTestDb } from './helpers/db.js';

useTestDb();

let auth;
let alice;
let bob;
let carol;

const TODAY = todayKey();
const YESTERDAY = toDateKey(addDays(fromDateKey(TODAY), -1));

const mark = (employeeId, overrides = {}) =>
  api()
    .put('/api/attendance')
    .set(auth)
    .send({ employeeId, date: TODAY, status: 'Present', ...overrides });

beforeEach(async () => {
  auth = await registerHr();
  alice = (await postEmployee(auth, { fullName: 'Alice Brown', email: 'alice@example.com', department: 'Design', role: 'Junior' })).body.data;
  bob = (await postEmployee(auth, { fullName: 'Bob Green', email: 'bob@example.com', department: 'Engineering', role: 'Senior' })).body.data;
  carol = (await postEmployee(auth, { fullName: 'Carol White', email: 'carol@example.com', department: 'Engineering', role: 'Manager' })).body.data;
  await postEmployee(auth, { fullName: 'Dan Inactive', email: 'dan@example.com', status: 'Inactive' });
});

describe('PUT /api/attendance (upsert)', () => {
  it('creates and then updates the record for the same employee and date', async () => {
    const created = await mark(alice._id, { task: 'Design review' }).expect(200);
    expect(created.body.message).toBe('Attendance marked');
    expect(created.body.data).toMatchObject({ status: 'Present', task: 'Design review' });
    expect(created.body.data.date).toBe(`${TODAY}T00:00:00.000Z`);

    const updated = await mark(alice._id, { status: 'Half Day', task: 'Left early' }).expect(200);
    expect(updated.body.message).toBe('Attendance updated');
    expect(updated.body.data._id).toBe(created.body.data._id);
    expect(updated.body.data).toMatchObject({ status: 'Half Day', task: 'Left early' });

    expect(await Attendance.countDocuments()).toBe(1);
  });

  it('keeps the existing task when only the status changes', async () => {
    await mark(alice._id, { task: 'Wireframes' }).expect(200);
    const res = await mark(alice._id, { status: 'Work From Home' }).expect(200);
    expect(res.body.data.task).toBe('Wireframes');
  });

  it('rejects future dates with 400', async () => {
    const future = toDateKey(addDays(fromDateKey(TODAY), 3));
    const res = await mark(alice._id, { date: future }).expect(400);
    expect(res.body.errors).toEqual([{ field: 'date', message: 'Attendance cannot be marked for a future date' }]);
  });

  it('validates the payload', async () => {
    const res = await api()
      .put('/api/attendance')
      .set(auth)
      .send({ employeeId: 'abc', date: '2024-02-30', status: 'Sleeping' })
      .expect(400);
    expect(res.body.errors.map((error) => error.field)).toEqual(['employeeId', 'date', 'status']);
  });

  it('returns 404 for an unknown employee', async () => {
    const res = await mark('507f1f77bcf86cd799439011').expect(404);
    expect(res.body.message).toBe('Employee not found');
  });
});

describe('GET /api/attendance (daily roster)', () => {
  beforeEach(async () => {
    await mark(alice._id, { status: 'Present', task: 'Icons' }).expect(200);
    await mark(bob._id, { status: 'Absent' }).expect(200);
    await mark(bob._id, { date: YESTERDAY, status: 'Present' }).expect(200);
  });

  it('lists every active employee with that day\'s attendance or null', async () => {
    const res = await api().get(`/api/attendance?date=${TODAY}`).set(auth).expect(200);

    expect(res.body.data).toHaveLength(3);
    const rows = Object.fromEntries(res.body.data.map((row) => [row.employee.fullName, row]));
    expect(rows['Alice Brown'].attendance).toMatchObject({ status: 'Present', task: 'Icons' });
    expect(rows['Bob Green'].attendance.status).toBe('Absent');
    expect(rows['Carol White'].attendance).toBeNull();
    expect(rows['Carol White'].employee).toEqual({
      _id: carol._id,
      fullName: 'Carol White',
      email: 'carol@example.com',
      position: carol.position,
      department: 'Engineering',
      role: 'Manager',
    });

    expect(res.body.meta).toMatchObject({ page: 1, limit: 10, total: 3, totalPages: 1, date: TODAY });
    expect(res.body.meta.summary).toEqual({
      Present: 1,
      Absent: 1,
      'Half Day': 0,
      'Work From Home': 0,
      'On Leave': 0,
      'Not Marked': 1,
    });
  });

  it('defaults to today when no date is given', async () => {
    const res = await api().get('/api/attendance').set(auth).expect(200);
    expect(res.body.meta.date).toBe(TODAY);
  });

  it('shows another day independently', async () => {
    const res = await api().get(`/api/attendance?date=${YESTERDAY}`).set(auth).expect(200);
    expect(res.body.meta.summary).toMatchObject({ Present: 1, 'Not Marked': 2 });
  });

  it('filters by status including Not Marked (summary ignores the status filter)', async () => {
    const notMarked = await api().get(`/api/attendance?date=${TODAY}&status=Not%20Marked`).set(auth).expect(200);
    expect(notMarked.body.data.map((row) => row.employee.fullName)).toEqual(['Carol White']);
    expect(notMarked.body.meta.total).toBe(1);
    expect(notMarked.body.meta.summary.Present).toBe(1);

    const absent = await api().get(`/api/attendance?date=${TODAY}&status=Absent`).set(auth).expect(200);
    expect(absent.body.data.map((row) => row.employee.fullName)).toEqual(['Bob Green']);
  });

  it('filters by department, role and search', async () => {
    const engineering = await api().get('/api/attendance?department=Engineering').set(auth).expect(200);
    expect(engineering.body.data.map((row) => row.employee.fullName)).toEqual(['Bob Green', 'Carol White']);
    expect(engineering.body.meta.summary).toMatchObject({ Absent: 1, 'Not Marked': 1, Present: 0 });

    const managers = await api().get('/api/attendance?role=Manager').set(auth).expect(200);
    expect(managers.body.data.map((row) => row.employee.fullName)).toEqual(['Carol White']);

    const search = await api().get('/api/attendance?search=alice').set(auth).expect(200);
    expect(search.body.data.map((row) => row.employee.fullName)).toEqual(['Alice Brown']);
  });

  it('paginates the roster', async () => {
    const res = await api().get('/api/attendance?limit=2&page=2').set(auth).expect(200);
    expect(res.body.data.map((row) => row.employee.fullName)).toEqual(['Carol White']);
    expect(res.body.meta).toMatchObject({ total: 3, totalPages: 2, page: 2 });
  });

  it('rejects an invalid status filter', async () => {
    await api().get('/api/attendance?status=Sleeping').set(auth).expect(400);
  });
});

describe('attendance record operations', () => {
  let record;

  beforeEach(async () => {
    record = (await mark(alice._id, { task: 'Initial task' })).body.data;
  });

  it('patches status and task', async () => {
    const res = await api()
      .patch(`/api/attendance/${record._id}`)
      .set(auth)
      .send({ status: 'Work From Home', task: 'Remote design sync' })
      .expect(200);
    expect(res.body.data).toMatchObject({ status: 'Work From Home', task: 'Remote design sync' });
  });

  it('requires at least one field when patching', async () => {
    await api().patch(`/api/attendance/${record._id}`).set(auth).send({}).expect(400);
  });

  it('deletes a record', async () => {
    await api().delete(`/api/attendance/${record._id}`).set(auth).expect(200);
    expect(await Attendance.countDocuments()).toBe(0);
    await api().delete(`/api/attendance/${record._id}`).set(auth).expect(404);
  });

  it('returns employee attendance history sorted by date desc', async () => {
    await mark(alice._id, { date: YESTERDAY, status: 'Absent' }).expect(200);

    const all = await api().get(`/api/attendance/employee/${alice._id}`).set(auth).expect(200);
    expect(all.body.data.map((item) => item.date.slice(0, 10))).toEqual([TODAY, YESTERDAY]);

    const ranged = await api()
      .get(`/api/attendance/employee/${alice._id}?from=${YESTERDAY}&to=${YESTERDAY}`)
      .set(auth)
      .expect(200);
    expect(ranged.body.data).toHaveLength(1);
    expect(ranged.body.data[0].status).toBe('Absent');
  });

  it('returns 404 history for an unknown employee and 400 for an invalid id', async () => {
    await api().get('/api/attendance/employee/507f1f77bcf86cd799439011').set(auth).expect(404);
    const res = await api().get('/api/attendance/employee/not-an-id').set(auth).expect(400);
    expect(res.body.message).toBe('Invalid employee id');
  });
});
