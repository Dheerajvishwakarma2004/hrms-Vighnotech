import { Leave } from '../src/models/Leave.js';
import { addDays, fromDateKey, toDateKey, todayKey } from '../src/utils/date.js';
import { api, binaryParser, pdfBuffer, postEmployee, postLeave, registerHr } from './helpers/api.js';
import { countGridFsFiles, gridFsFileExists, useTestDb } from './helpers/db.js';

useTestDb();

const TODAY = todayKey();
const day = (offset) => toDateKey(addDays(fromDateKey(TODAY), offset));
const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);

let auth;
let alice;
let bob;

const leaveFields = (overrides = {}) => ({
  employeeId: alice._id,
  leaveType: 'Casual',
  startDate: day(1),
  endDate: day(3),
  reason: 'Family function',
  ...overrides,
});

const pdfDocument = { buffer: pdfBuffer('Medical certificate'), filename: 'certificate.pdf', contentType: 'application/pdf' };

beforeEach(async () => {
  auth = await registerHr();
  alice = (await postEmployee(auth, { fullName: 'Alice Brown', email: 'alice@example.com', department: 'Design' })).body.data;
  bob = (await postEmployee(auth, { fullName: 'Bob Green', email: 'bob@example.com', department: 'Engineering', position: 'QA Engineer' })).body.data;
});

describe('POST /api/leaves', () => {
  it('creates a pending leave without a document and computes days', async () => {
    const res = await postLeave(auth, leaveFields()).expect(201);
    expect(res.body.data).toMatchObject({
      leaveType: 'Casual',
      status: 'Pending',
      days: 3,
      startDate: `${day(1)}T00:00:00.000Z`,
      endDate: `${day(3)}T00:00:00.000Z`,
    });
    expect(res.body.data.employee).toMatchObject({ _id: alice._id, fullName: 'Alice Brown' });
    expect(res.body.data.document).toBeUndefined();
  });

  it('creates a leave with a PDF document', async () => {
    const res = await postLeave(auth, leaveFields(), pdfDocument).expect(201);
    expect(res.body.data.document).toMatchObject({ filename: 'certificate.pdf', mimetype: 'application/pdf' });
    expect(await gridFsFileExists(res.body.data.document.fileId)).toBe(true);
  });

  it('accepts image documents', async () => {
    const res = await postLeave(auth, leaveFields(), {
      buffer: PNG_BYTES,
      filename: 'scan.png',
      contentType: 'image/png',
    }).expect(201);
    expect(res.body.data.document.mimetype).toBe('image/png');
  });

  it('rejects unsupported document types with 415', async () => {
    const res = await postLeave(auth, leaveFields(), {
      buffer: Buffer.from('MZ fake executable'),
      filename: 'virus.exe',
      contentType: 'application/x-msdownload',
    }).expect(415);
    expect(res.body.errors[0]).toEqual({
      field: 'document',
      message: 'Document must be a PDF, PNG, JPG, DOC or DOCX file',
    });
  });

  it('rejects an end date before the start date', async () => {
    const res = await postLeave(auth, leaveFields({ startDate: day(5), endDate: day(2) })).expect(400);
    expect(res.body.errors).toEqual([{ field: 'endDate', message: 'End date cannot be before start date' }]);
  });

  it('validates required fields', async () => {
    const res = await api().post('/api/leaves').set(auth).send({}).expect(400);
    expect(res.body.errors.map((error) => error.field)).toEqual(
      expect.arrayContaining(['employeeId', 'leaveType', 'startDate', 'endDate', 'reason']),
    );
  });

  it('returns 404 for an unknown employee', async () => {
    await postLeave(auth, leaveFields({ employeeId: '507f1f77bcf86cd799439011' })).expect(404);
  });

  it('returns 409 for an overlapping leave and removes the uploaded document', async () => {
    await postLeave(auth, leaveFields()).expect(201);
    const res = await postLeave(auth, leaveFields({ startDate: day(3), endDate: day(4) }), pdfDocument).expect(409);
    expect(res.body.message).toMatch(/Overlaps an existing pending leave/);
    expect(await Leave.countDocuments()).toBe(1);
    expect(await countGridFsFiles()).toBe(0);
  });

  it('allows overlapping leaves for different employees', async () => {
    await postLeave(auth, leaveFields()).expect(201);
    await postLeave(auth, leaveFields({ employeeId: bob._id })).expect(201);
  });

  it('does not let a rejected leave block a new one', async () => {
    await postLeave(auth, leaveFields({ status: 'Rejected' })).expect(201);
    await postLeave(auth, leaveFields()).expect(201);
  });
});

describe('leave updates', () => {
  let leave;

  beforeEach(async () => {
    leave = (await postLeave(auth, leaveFields(), pdfDocument)).body.data;
  });

  it('updates the status', async () => {
    const res = await api().patch(`/api/leaves/${leave._id}/status`).set(auth).send({ status: 'Approved' }).expect(200);
    expect(res.body.data.status).toBe('Approved');
    expect(res.body.message).toBe('Leave approved');
  });

  it('validates the status value', async () => {
    await api().patch(`/api/leaves/${leave._id}/status`).set(auth).send({ status: 'Maybe' }).expect(400);
  });

  it('re-checks overlap when a rejected leave is reopened', async () => {
    await api().patch(`/api/leaves/${leave._id}/status`).set(auth).send({ status: 'Rejected' }).expect(200);
    await postLeave(auth, leaveFields()).expect(201);
    await api().patch(`/api/leaves/${leave._id}/status`).set(auth).send({ status: 'Pending' }).expect(409);
  });

  it('updates fields, recomputes days and replaces the document', async () => {
    const res = await api()
      .patch(`/api/leaves/${leave._id}`)
      .set(auth)
      .field('endDate', day(5))
      .field('leaveType', 'Earned')
      .attach('document', PNG_BYTES, { filename: 'new.png', contentType: 'image/png' })
      .expect(200);

    expect(res.body.data).toMatchObject({ leaveType: 'Earned', days: 5 });
    expect(res.body.data.document.filename).toBe('new.png');
    expect(await gridFsFileExists(leave.document.fileId)).toBe(false);
  });

  it('rejects an update that makes the end date precede the stored start date', async () => {
    const res = await api().patch(`/api/leaves/${leave._id}`).set(auth).send({ endDate: day(0) }).expect(400);
    expect(res.body.errors[0].field).toBe('endDate');
  });

  it('downloads the document as an attachment', async () => {
    const res = await api()
      .get(`/api/leaves/${leave._id}/document`)
      .set(auth)
      .buffer(true)
      .parse(binaryParser)
      .expect(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toBe('attachment; filename="certificate.pdf"');
    expect(res.body.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('returns 404 when downloading from a leave without a document', async () => {
    const other = (await postLeave(auth, leaveFields({ employeeId: bob._id }))).body.data;
    const res = await api().get(`/api/leaves/${other._id}/document`).set(auth).expect(404);
    expect(res.body.message).toBe('No document attached to this leave');
  });

  it('deletes the leave and its document', async () => {
    await api().delete(`/api/leaves/${leave._id}`).set(auth).expect(200);
    expect(await Leave.countDocuments()).toBe(0);
    expect(await gridFsFileExists(leave.document.fileId)).toBe(false);
    await api().get(`/api/leaves/${leave._id}`).set(auth).expect(404);
  });
});

describe('GET /api/leaves', () => {
  beforeEach(async () => {
    await postLeave(auth, leaveFields({ leaveType: 'Sick', status: 'Approved', startDate: day(0), endDate: day(0) }));
    await postLeave(auth, leaveFields({ startDate: day(10), endDate: day(12) }));
    await postLeave(auth, leaveFields({ employeeId: bob._id, leaveType: 'Earned', status: 'Rejected', startDate: day(20), endDate: day(21) }));
  });

  it('lists leaves with populated employees and pagination meta', async () => {
    const res = await api().get('/api/leaves?sortBy=startDate&sortOrder=asc').set(auth).expect(200);
    expect(res.body.meta).toEqual({ page: 1, limit: 10, total: 3, totalPages: 1 });
    expect(res.body.data[0].employee).toEqual({
      _id: alice._id,
      fullName: 'Alice Brown',
      email: 'alice@example.com',
      position: alice.position,
      department: 'Design',
      role: alice.role,
    });
    expect(res.body.data.map((leave) => leave.startDate.slice(0, 10))).toEqual([day(0), day(10), day(20)]);
  });

  it('filters by status, leave type, department and employee', async () => {
    const approved = await api().get('/api/leaves?status=Approved').set(auth).expect(200);
    expect(approved.body.data.map((leave) => leave.leaveType)).toEqual(['Sick']);

    const earned = await api().get('/api/leaves?leaveType=Earned').set(auth).expect(200);
    expect(earned.body.meta.total).toBe(1);

    const engineering = await api().get('/api/leaves?department=Engineering').set(auth).expect(200);
    expect(engineering.body.data.map((leave) => leave.employee.fullName)).toEqual(['Bob Green']);

    const byEmployee = await api().get(`/api/leaves?employeeId=${alice._id}`).set(auth).expect(200);
    expect(byEmployee.body.meta.total).toBe(2);
  });

  it('searches by employee name, email or position', async () => {
    const byName = await api().get('/api/leaves?search=bob').set(auth).expect(200);
    expect(byName.body.data.map((leave) => leave.employee.fullName)).toEqual(['Bob Green']);

    const byPosition = await api().get('/api/leaves?search=qa%20eng').set(auth).expect(200);
    expect(byPosition.body.meta.total).toBe(1);

    const none = await api().get('/api/leaves?search=nobody').set(auth).expect(200);
    expect(none.body.data).toEqual([]);
    expect(none.body.meta.total).toBe(0);
  });

  it('filters by an overlapping date range', async () => {
    const res = await api().get(`/api/leaves?from=${day(11)}&to=${day(25)}`).set(auth).expect(200);
    expect(res.body.data.map((leave) => leave.startDate.slice(0, 10)).sort()).toEqual([day(10), day(20)]);
  });
});

describe('GET /api/leaves/calendar', () => {
  beforeEach(async () => {
    await postLeave(auth, leaveFields({ status: 'Approved', startDate: day(-2), endDate: day(1) }));
    await postLeave(auth, leaveFields({ employeeId: bob._id, status: 'Pending', startDate: day(0), endDate: day(0) }));
    await postLeave(auth, leaveFields({ employeeId: bob._id, status: 'Rejected', startDate: day(1), endDate: day(1) }));
    await postLeave(auth, leaveFields({ employeeId: bob._id, status: 'Approved', startDate: day(30), endDate: day(31) }));
  });

  it('returns only approved leaves overlapping the range, with employees', async () => {
    const res = await api().get(`/api/leaves/calendar?start=${day(0)}&end=${day(7)}`).set(auth).expect(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ status: 'Approved', employee: { fullName: 'Alice Brown' } });
    expect(res.body.meta).toBeUndefined();
  });

  it('returns today\'s approved leaves for a single-day range', async () => {
    const res = await api().get(`/api/leaves/calendar?start=${TODAY}&end=${TODAY}`).set(auth).expect(200);
    expect(res.body.data.map((leave) => leave.employee.fullName)).toEqual(['Alice Brown']);
    expect(res.body.data.every((leave) => leave.status === 'Approved')).toBe(true);
  });

  it('returns approved leaves on other dates sorted by start date', async () => {
    const res = await api().get(`/api/leaves/calendar?start=${day(-5)}&end=${day(40)}`).set(auth).expect(200);
    expect(res.body.data.map((leave) => leave.startDate.slice(0, 10))).toEqual([day(-2), day(30)]);
  });

  it('validates the range', async () => {
    await api().get('/api/leaves/calendar').set(auth).expect(400);
    const res = await api().get(`/api/leaves/calendar?start=${day(5)}&end=${day(1)}`).set(auth).expect(400);
    expect(res.body.errors[0].field).toBe('end');
  });
});
