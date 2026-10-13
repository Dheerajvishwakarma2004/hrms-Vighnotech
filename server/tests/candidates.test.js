import { Candidate } from '../src/models/Candidate.js';
import { Employee } from '../src/models/Employee.js';
import { todayKey } from '../src/utils/date.js';
import {
  api,
  binaryParser,
  pdfBuffer,
  postCandidate,
  postEmployee,
  registerHr,
} from './helpers/api.js';
import { gridFsFileExists, useTestDb } from './helpers/db.js';

useTestDb();

let auth;

beforeEach(async () => {
  auth = await registerHr();
});

describe('POST /api/candidates', () => {
  it('creates a candidate with a PDF resume stored in GridFS', async () => {
    const res = await postCandidate(auth).expect(201);

    const { data } = res.body;
    expect(data).toMatchObject({
      fullName: 'Jane Doe',
      email: 'jane.doe@example.com',
      experience: 3,
      status: 'New',
      department: 'Engineering',
    });
    expect(data.resume).toMatchObject({ filename: 'resume.pdf', mimetype: 'application/pdf' });
    expect(await gridFsFileExists(data.resume.fileId)).toBe(true);
  });

  it('requires a resume and validates fields together', async () => {
    const res = await postCandidate(auth, { phone: '12', experience: 'abc', department: 'Space' }, null).expect(400);
    const fields = res.body.errors.map((error) => error.field);
    expect(fields).toEqual(expect.arrayContaining(['phone', 'experience', 'department', 'resume']));
  });

  it('rejects a non-PDF resume with 415', async () => {
    const res = await postCandidate(auth, {}, {
      buffer: Buffer.from('plain text resume'),
      filename: 'resume.txt',
      contentType: 'text/plain',
    }).expect(415);
    expect(res.body.message).toBe('Resume must be a PDF file');
    expect(res.body.errors[0].field).toBe('resume');
  });

  it('rejects a file that claims to be a PDF but is not (magic bytes) with 415', async () => {
    const res = await postCandidate(auth, {}, {
      buffer: Buffer.from('this is not really a pdf'),
      filename: 'fake.pdf',
      contentType: 'application/pdf',
    }).expect(415);
    expect(res.body.success).toBe(false);
  });

  it('rejects resumes larger than 5 MB with 413', async () => {
    const big = Buffer.concat([pdfBuffer(), Buffer.alloc(5 * 1024 * 1024)]);
    const res = await postCandidate(auth, {}, { buffer: big }).expect(413);
    expect(res.body.message).toMatch(/too large/i);
  });

  it('rejects creating a candidate directly as Selected', async () => {
    const res = await postCandidate(auth, { status: 'Selected' }).expect(400);
    expect(res.body.errors).toEqual([
      { field: 'status', message: 'Create the candidate first, then select them' },
    ]);
    expect(await Candidate.countDocuments()).toBe(0);
    expect(await Employee.countDocuments()).toBe(0);
  });

  it('returns 409 for a duplicate candidate email', async () => {
    await postCandidate(auth).expect(201);
    const res = await postCandidate(auth, { email: 'JANE.DOE@example.com' }).expect(409);
    expect(res.body.errors).toEqual([{ field: 'email', message: 'Email already exists' }]);
  });
});

describe('GET /api/candidates', () => {
  beforeEach(async () => {
    await postCandidate(auth, { fullName: 'Alice Walker', email: 'alice@example.com', experience: 1, status: 'New' });
    await postCandidate(auth, {
      fullName: 'Bob Marley',
      email: 'bob@example.com',
      position: 'Product Designer',
      department: 'Design',
      experience: 5,
      status: 'Scheduled',
    });
    await postCandidate(auth, {
      fullName: 'Carol (C++) King',
      email: 'carol@example.com',
      phone: '+911234567890',
      experience: 8,
      status: 'Ongoing',
    });
  });

  it('lists candidates with pagination meta', async () => {
    const res = await api().get('/api/candidates?page=1&limit=2').set(auth).expect(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });

    const page2 = await api().get('/api/candidates?page=2&limit=2').set(auth).expect(200);
    expect(page2.body.data).toHaveLength(1);
  });

  it('searches case-insensitively across name, email, phone and position', async () => {
    const byName = await api().get('/api/candidates?search=ALICE').set(auth).expect(200);
    expect(byName.body.data.map((c) => c.fullName)).toEqual(['Alice Walker']);

    const byPosition = await api().get('/api/candidates?search=designer').set(auth).expect(200);
    expect(byPosition.body.data.map((c) => c.fullName)).toEqual(['Bob Marley']);

    const byPhone = await api().get('/api/candidates?search=1234567890').set(auth).expect(200);
    expect(byPhone.body.data.map((c) => c.fullName)).toEqual(['Carol (C++) King']);
  });

  it('escapes regex characters in the search term', async () => {
    const res = await api().get(`/api/candidates?search=${encodeURIComponent('(C++)')}`).set(auth).expect(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('filters by status, department and experience range', async () => {
    const byStatus = await api().get('/api/candidates?status=Scheduled').set(auth).expect(200);
    expect(byStatus.body.data.map((c) => c.fullName)).toEqual(['Bob Marley']);

    const byDepartment = await api().get('/api/candidates?department=Engineering').set(auth).expect(200);
    expect(byDepartment.body.meta.total).toBe(2);

    const byExperience = await api()
      .get('/api/candidates?minExperience=2&maxExperience=8&sortBy=experience&sortOrder=asc')
      .set(auth)
      .expect(200);
    expect(byExperience.body.data.map((c) => c.experience)).toEqual([5, 8]);
  });

  it('ignores empty-string params', async () => {
    const res = await api().get('/api/candidates?status=&department=&search=').set(auth).expect(200);
    expect(res.body.meta.total).toBe(3);
  });

  it('rejects invalid filters', async () => {
    const res = await api()
      .get('/api/candidates?status=Unknown&limit=500&minExperience=5&maxExperience=1&sortBy=password')
      .set(auth)
      .expect(400);
    const fields = res.body.errors.map((error) => error.field);
    expect(fields).toEqual(expect.arrayContaining(['status', 'limit', 'sortBy']));
  });

  it('rejects an inverted experience range', async () => {
    const res = await api().get('/api/candidates?minExperience=5&maxExperience=1').set(auth).expect(400);
    expect(res.body.errors[0].field).toBe('maxExperience');
  });
});

describe('single candidate operations', () => {
  let candidate;

  beforeEach(async () => {
    candidate = (await postCandidate(auth)).body.data;
  });

  it('gets a candidate by id', async () => {
    const res = await api().get(`/api/candidates/${candidate._id}`).set(auth).expect(200);
    expect(res.body.data.email).toBe('jane.doe@example.com');
  });

  it('returns 404 for a missing candidate', async () => {
    await api().get('/api/candidates/507f1f77bcf86cd799439011').set(auth).expect(404);
  });

  it('updates fields and replaces the resume (old file removed)', async () => {
    const oldFileId = candidate.resume.fileId;
    const res = await api()
      .patch(`/api/candidates/${candidate._id}`)
      .set(auth)
      .field('position', 'Senior Frontend Developer')
      .field('experience', '6')
      .attach('resume', pdfBuffer('Updated'), { filename: 'new-resume.pdf', contentType: 'application/pdf' })
      .expect(200);

    expect(res.body.data.moved).toBe(false);
    expect(res.body.data.candidate).toMatchObject({ position: 'Senior Frontend Developer', experience: 6 });
    expect(res.body.data.candidate.resume.filename).toBe('new-resume.pdf');
    expect(await gridFsFileExists(oldFileId)).toBe(false);
    expect(await gridFsFileExists(res.body.data.candidate.resume.fileId)).toBe(true);
  });

  it('accepts JSON updates without a file', async () => {
    const res = await api()
      .patch(`/api/candidates/${candidate._id}`)
      .set(auth)
      .send({ status: 'Scheduled', notes: '' })
      .expect(200);
    expect(res.body.data.candidate).toMatchObject({ status: 'Scheduled', notes: '' });
  });

  it('validates update fields', async () => {
    const res = await api().patch(`/api/candidates/${candidate._id}`).set(auth).send({ email: 'nope' }).expect(400);
    expect(res.body.errors).toEqual([{ field: 'email', message: 'Enter a valid email address' }]);
  });

  it('downloads the resume as a PDF attachment', async () => {
    const res = await api()
      .get(`/api/candidates/${candidate._id}/resume`)
      .set(auth)
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toBe('attachment; filename="Jane_Doe_Resume.pdf"');
    expect(res.body.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('exposes Content-Disposition to browsers via CORS', async () => {
    const res = await api()
      .get(`/api/candidates/${candidate._id}/resume`)
      .set(auth)
      .set('Origin', 'http://localhost:5173')
      .buffer(true)
      .parse(binaryParser)
      .expect(200);
    expect(res.headers['access-control-expose-headers']).toBe('Content-Disposition');
  });

  it('deletes the candidate and its GridFS resume', async () => {
    await api().delete(`/api/candidates/${candidate._id}`).set(auth).expect(200);
    expect(await Candidate.countDocuments()).toBe(0);
    expect(await gridFsFileExists(candidate.resume.fileId)).toBe(false);
    await api().get(`/api/candidates/${candidate._id}/resume`).set(auth).expect(404);
  });
});

describe('selecting a candidate', () => {
  let candidate;

  beforeEach(async () => {
    candidate = (await postCandidate(auth)).body.data;
  });

  it('PATCH /:id/status with Selected moves the candidate to employees with details intact', async () => {
    const res = await api()
      .patch(`/api/candidates/${candidate._id}/status`)
      .set(auth)
      .send({ status: 'Selected', role: 'Senior' })
      .expect(200);

    expect(res.body.message).toBe('Candidate moved to employees');
    expect(res.body.data.moved).toBe(true);
    const { employee } = res.body.data;
    expect(employee).toMatchObject({
      fullName: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone,
      position: candidate.position,
      department: candidate.department,
      experience: candidate.experience,
      notes: candidate.notes,
      role: 'Senior',
      status: 'Active',
      fromCandidate: true,
    });
    expect(employee.dateOfJoining.slice(0, 10)).toBe(todayKey());
    expect(employee.resume).toEqual(candidate.resume);

    expect(await Candidate.exists({ _id: candidate._id })).toBeNull();
    expect(await gridFsFileExists(candidate.resume.fileId)).toBe(true);

    const download = await api()
      .get(`/api/employees/${employee._id}/resume`)
      .set(auth)
      .buffer(true)
      .parse(binaryParser)
      .expect(200);
    expect(download.headers['content-disposition']).toBe('attachment; filename="Jane_Doe_Resume.pdf"');
    expect(download.body.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('defaults the employee role to Junior', async () => {
    const res = await api()
      .patch(`/api/candidates/${candidate._id}/status`)
      .set(auth)
      .send({ status: 'Selected' })
      .expect(200);
    expect(res.body.data.employee.role).toBe('Junior');
  });

  it('PATCH /:id with status Selected also moves the candidate', async () => {
    const res = await api()
      .patch(`/api/candidates/${candidate._id}`)
      .set(auth)
      .field('status', 'Selected')
      .field('position', 'Lead Frontend Developer')
      .expect(200);

    expect(res.body.data.moved).toBe(true);
    expect(res.body.data.employee.position).toBe('Lead Frontend Developer');
    expect(await Candidate.countDocuments()).toBe(0);
    expect(await Employee.countDocuments()).toBe(1);
  });

  it('non-selected statuses only update the candidate', async () => {
    const res = await api()
      .patch(`/api/candidates/${candidate._id}/status`)
      .set(auth)
      .send({ status: 'Ongoing' })
      .expect(200);
    expect(res.body.data).toMatchObject({ moved: false, candidate: { status: 'Ongoing' } });
    expect(await Employee.countDocuments()).toBe(0);
  });

  it('returns 409 when an employee with the same email exists (candidate kept)', async () => {
    await postEmployee(auth, { email: candidate.email }).expect(201);

    const res = await api()
      .patch(`/api/candidates/${candidate._id}/status`)
      .set(auth)
      .send({ status: 'Selected' })
      .expect(409);

    expect(res.body.errors[0].field).toBe('email');
    expect(await Candidate.exists({ _id: candidate._id })).not.toBeNull();
    expect(await Employee.countDocuments()).toBe(1);
  });

  it('validates the status value', async () => {
    const res = await api()
      .patch(`/api/candidates/${candidate._id}/status`)
      .set(auth)
      .send({ status: 'Hired' })
      .expect(400);
    expect(res.body.errors).toEqual([{ field: 'status', message: 'Select a valid status' }]);
  });
});
