import { Attendance } from '../src/models/Attendance.js';
import { Employee } from '../src/models/Employee.js';
import { Leave } from '../src/models/Leave.js';
import { addDays, fromDateKey, toDateKey, todayKey } from '../src/utils/date.js';
import { api, pdfBuffer, postEmployee, postLeave, registerHr } from './helpers/api.js';
import { gridFsFileExists, useTestDb } from './helpers/db.js';

useTestDb();

let auth;

beforeEach(async () => {
  auth = await registerHr();
});

const names = (res) => res.body.data.map((employee) => employee.fullName);

describe('employee CRUD', () => {
  it('creates an employee with defaults', async () => {
    const res = await postEmployee(auth).expect(201);
    expect(res.body.data).toMatchObject({
      fullName: 'John Smith',
      email: 'john.smith@example.com',
      role: 'Senior',
      employmentType: 'Full Time',
      status: 'Active',
      fromCandidate: false,
    });
    expect(res.body.data.dateOfJoining.slice(0, 10)).toBe(todayKey());
  });

  it('stores dateOfJoining at UTC midnight', async () => {
    const res = await postEmployee(auth, { dateOfJoining: '2024-03-15' }).expect(201);
    expect(res.body.data.dateOfJoining).toBe('2024-03-15T00:00:00.000Z');
  });

  it('validates required fields', async () => {
    const res = await api().post('/api/employees').set(auth).send({ role: 'Boss' }).expect(400);
    const fields = res.body.errors.map((error) => error.field);
    expect(fields).toEqual(
      expect.arrayContaining(['fullName', 'email', 'phone', 'position', 'department', 'role']),
    );
  });

  it('returns 409 for a duplicate email', async () => {
    await postEmployee(auth).expect(201);
    const res = await postEmployee(auth, { fullName: 'Other Person' }).expect(409);
    expect(res.body).toEqual({
      success: false,
      message: 'Email already exists',
      errors: [{ field: 'email', message: 'Email already exists' }],
    });
  });

  it('returns 409 when updating to an email that is already used', async () => {
    await postEmployee(auth).expect(201);
    const other = (await postEmployee(auth, { email: 'other@example.com' })).body.data;
    await api()
      .patch(`/api/employees/${other._id}`)
      .set(auth)
      .send({ email: 'john.smith@example.com' })
      .expect(409);
  });

  it('gets, updates and deletes an employee', async () => {
    const employee = (await postEmployee(auth)).body.data;

    const fetched = await api().get(`/api/employees/${employee._id}`).set(auth).expect(200);
    expect(fetched.body.data.email).toBe(employee.email);

    const updated = await api()
      .patch(`/api/employees/${employee._id}`)
      .set(auth)
      .send({ department: 'Product', status: 'Inactive', experience: '7' })
      .expect(200);
    expect(updated.body.data).toMatchObject({ department: 'Product', status: 'Inactive', experience: 7 });

    await api().delete(`/api/employees/${employee._id}`).set(auth).expect(200);
    await api().get(`/api/employees/${employee._id}`).set(auth).expect(404);
  });

  it('rejects an empty update', async () => {
    const employee = (await postEmployee(auth)).body.data;
    const res = await api().patch(`/api/employees/${employee._id}`).set(auth).send({}).expect(400);
    expect(res.body.errors[0].message).toBe('Provide at least one field to update');
  });

  it('assigns a role', async () => {
    const employee = (await postEmployee(auth)).body.data;
    const res = await api()
      .patch(`/api/employees/${employee._id}/role`)
      .set(auth)
      .send({ role: 'Team Lead' })
      .expect(200);
    expect(res.body.data.role).toBe('Team Lead');
    expect(res.body.message).toBe('Role updated to Team Lead');

    await api().patch(`/api/employees/${employee._id}/role`).set(auth).send({ role: 'CEO' }).expect(400);
  });

  it('returns 404 for the resume of an employee without one', async () => {
    const employee = (await postEmployee(auth)).body.data;
    const res = await api().get(`/api/employees/${employee._id}/resume`).set(auth).expect(404);
    expect(res.body.message).toBe('Resume not found for this employee');
  });
});

describe('GET /api/employees filters', () => {
  beforeEach(async () => {
    await postEmployee(auth, { fullName: 'Asha Rao', email: 'asha@example.com', department: 'Design', role: 'Junior', position: 'UI Designer' });
    await postEmployee(auth, { fullName: 'Ben Stone', email: 'ben@example.com', department: 'Engineering', role: 'Manager', status: 'Inactive' });
    await postEmployee(auth, { fullName: 'Chen Li', email: 'chen@example.com', department: 'Engineering', role: 'Senior', employmentType: 'Contract' });
  });

  it('filters by department, role, status and employment type', async () => {
    expect(names(await api().get('/api/employees?department=Design').set(auth))).toEqual(['Asha Rao']);
    expect(names(await api().get('/api/employees?role=Manager').set(auth))).toEqual(['Ben Stone']);
    expect(names(await api().get('/api/employees?status=Inactive').set(auth))).toEqual(['Ben Stone']);
    expect(names(await api().get('/api/employees?employmentType=Contract').set(auth))).toEqual(['Chen Li']);
    expect(names(await api().get('/api/employees?position=UI%20Designer').set(auth))).toEqual(['Asha Rao']);
  });

  it('searches by name, email or position and sorts', async () => {
    expect(names(await api().get('/api/employees?search=chen').set(auth))).toEqual(['Chen Li']);
    expect(names(await api().get('/api/employees?search=designer').set(auth))).toEqual(['Asha Rao']);

    const sorted = await api().get('/api/employees?sortBy=fullName&sortOrder=asc').set(auth).expect(200);
    expect(names(sorted)).toEqual(['Asha Rao', 'Ben Stone', 'Chen Li']);
    expect(sorted.body.meta).toEqual({ page: 1, limit: 10, total: 3, totalPages: 1 });
  });

  it('combines filters', async () => {
    const res = await api().get('/api/employees?department=Engineering&role=Senior&search=li').set(auth);
    expect(names(res)).toEqual(['Chen Li']);
  });
});

describe('cascade delete and summary', () => {
  it('deletes attendance, leaves and leave documents with the employee', async () => {
    const employee = (await postEmployee(auth)).body.data;
    await api()
      .put('/api/attendance')
      .set(auth)
      .send({ employeeId: employee._id, date: todayKey(), status: 'Present' })
      .expect(200);
    const leave = (
      await postLeave(
        auth,
        { employeeId: employee._id, leaveType: 'Sick', startDate: todayKey(), endDate: todayKey(), reason: 'Flu' },
        { buffer: pdfBuffer('Note'), filename: 'note.pdf', contentType: 'application/pdf' },
      ).expect(201)
    ).body.data;

    const res = await api().delete(`/api/employees/${employee._id}`).set(auth).expect(200);
    expect(res.body.data).toMatchObject({ attendanceDeleted: 1, leavesDeleted: 1 });

    expect(await Employee.countDocuments()).toBe(0);
    expect(await Attendance.countDocuments()).toBe(0);
    expect(await Leave.countDocuments()).toBe(0);
    expect(await gridFsFileExists(leave.document.fileId)).toBe(false);
  });

  it('returns an employee summary with attendance counts and approved leave days', async () => {
    const employee = (await postEmployee(auth)).body.data;
    const today = fromDateKey(todayKey());
    const statuses = ['Present', 'Present', 'Absent'];
    await Promise.all(
      statuses.map((status, index) =>
        api()
          .put('/api/attendance')
          .set(auth)
          .send({ employeeId: employee._id, date: toDateKey(addDays(today, -index)), status })
          .expect(200),
      ),
    );
    await postLeave(auth, {
      employeeId: employee._id,
      leaveType: 'Casual',
      startDate: todayKey(),
      endDate: todayKey(),
      reason: 'Personal work',
      status: 'Approved',
    }).expect(201);

    const res = await api().get(`/api/employees/${employee._id}/summary`).set(auth).expect(200);
    const { data } = res.body;
    expect(data.employee._id).toBe(employee._id);
    expect(data.attendance.counts).toMatchObject({ Present: 2, Absent: 1, 'Half Day': 0 });
    expect(data.attendance.recent).toHaveLength(3);
    expect(data.leaves.recent).toHaveLength(1);
    expect(data.leaves.approvedDays).toBe(1);
  });
});
