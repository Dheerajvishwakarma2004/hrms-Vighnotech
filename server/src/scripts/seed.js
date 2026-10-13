import mongoose from 'mongoose';
import { connectDB, disconnectDB, getBucket } from '../config/db.js';
import { env } from '../config/env.js';
import { Attendance, Candidate, Employee, Leave, User } from '../models/index.js';
import { saveFile } from '../services/file.service.js';
import { addDays, toDateKey, todayDate } from '../utils/date.js';
import { isMainModule } from '../utils/isMainModule.js';
import { createSimplePdf } from '../utils/pdf.js';

export const DEMO_HR = Object.freeze({
  fullName: 'Dheeraj Vishwakarma',
  email: 'hr@vighnotech.com',
  password: 'Hr@12345',
});

const CANDIDATES = [
  ['Aarav Mehta', 'Frontend Developer', 'Engineering', 2, 'New'],
  ['Diya Kapoor', 'UI/UX Designer', 'Design', 3, 'Scheduled'],
  ['Kabir Singh', 'Backend Developer', 'Engineering', 4, 'Ongoing'],
  ['Ananya Iyer', 'Product Analyst', 'Product', 1, 'New'],
  ['Rohan Gupta', 'Sales Executive', 'Sales', 5, 'Rejected'],
  ['Meera Nair', 'HR Generalist', 'Human Resources', 6, 'Scheduled'],
  ['Arjun Reddy', 'DevOps Engineer', 'Engineering', 7, 'Ongoing'],
  ['Ishita Bose', 'Content Marketer', 'Marketing', 2, 'New'],
  ['Vihaan Joshi', 'Financial Analyst', 'Finance', 3, 'Scheduled'],
  ['Saanvi Desai', 'Support Specialist', 'Support', 1, 'Ongoing'],
  ['Aditya Rao', 'Operations Associate', 'Operations', 0, 'New'],
  ['Kiara Malhotra', 'Product Designer', 'Design', 4, 'Rejected'],
];

const EMPLOYEES = [
  ['Rahul Verma', 'Engineering Manager', 'Engineering', 'Manager', 'Full Time', 11, 'Active'],
  ['Sneha Kulkarni', 'Senior Frontend Developer', 'Engineering', 'Senior', 'Full Time', 6, 'Active'],
  ['Amit Patel', 'Backend Developer', 'Engineering', 'Junior', 'Full Time', 2, 'Active'],
  ['Neha Agarwal', 'QA Engineer', 'Engineering', 'Junior', 'Contract', 3, 'Active'],
  ['Vikram Chauhan', 'Design Lead', 'Design', 'Team Lead', 'Full Time', 8, 'Active'],
  ['Pooja Menon', 'UI Designer', 'Design', 'Junior', 'Part Time', 1, 'Active'],
  ['Karan Malhotra', 'Product Manager', 'Product', 'Manager', 'Full Time', 9, 'Active'],
  ['Riya Sen', 'Marketing Specialist', 'Marketing', 'Senior', 'Full Time', 5, 'Active'],
  ['Siddharth Jain', 'Sales Director', 'Sales', 'Director', 'Full Time', 15, 'Active'],
  ['Tanvi Shah', 'Recruiter', 'Human Resources', 'Junior', 'Full Time', 2, 'Active'],
  ['Manish Tiwari', 'Accountant', 'Finance', 'Senior', 'Full Time', 7, 'Active'],
  ['Nisha Pillai', 'Operations Executive', 'Operations', 'Junior', 'Full Time', 3, 'Active'],
  ['Harsh Vardhan', 'Support Engineer', 'Support', 'Intern', 'Internship', 0, 'Active'],
  ['Divya Krishnan', 'Data Analyst', 'Product', 'Senior', 'Full Time', 4, 'Inactive'],
  ['Yash Thakur', 'Frontend Developer', 'Engineering', 'Intern', 'Internship', 0, 'Active'],
];

/** [employeeIndex, leaveType, startOffsetDays, lengthDays, status, reason, withDocument] */
const LEAVES = [
  [2, 'Sick', 0, 2, 'Approved', 'Fever and doctor-advised rest', true],
  [5, 'Casual', -1, 3, 'Approved', 'Family function out of town', false],
  [8, 'Earned', 0, 1, 'Approved', 'Personal errands', false],
  [11, 'Maternity/Paternity', -3, 10, 'Approved', 'Paternity leave for newborn', true],
  [1, 'Casual', 4, 2, 'Approved', 'Attending a friend\'s wedding', false],
  [6, 'Earned', 9, 3, 'Pending', 'Planned vacation with family', false],
  [3, 'Sick', -8, 2, 'Approved', 'Migraine and recovery', false],
  [9, 'Unpaid', 12, 2, 'Pending', 'Relocating to a new apartment', false],
  [12, 'Casual', 2, 1, 'Rejected', 'Overlaps with release week', false],
  [7, 'Other', 6, 1, 'Pending', 'Visa appointment at the consulate', false],
  [4, 'Earned', -12, 4, 'Approved', 'Annual trip to the hills', false],
];

const ATTENDANCE_DAYS = 5;
const ATTENDANCE_PATTERN = ['Present', 'Present', 'Work From Home', 'Present', 'Half Day', 'Present', 'Absent'];
const TASKS = [
  'Sprint planning and backlog grooming',
  'Implemented dashboard widgets',
  'Fixed reported production bugs',
  'Client demo preparation',
  'Code review and pair programming',
  'Prepared weekly status report',
  'Customer onboarding calls',
  'Updated design system components',
];

const slug = (name) => name.toLowerCase().replace(/[^a-z]+/g, '.');
const phoneFor = (index) => `+9198${String(76543210 + index * 7919).padStart(8, '0').slice(-8)}`;

const pdfUpload = (filename, title, lines) => {
  const buffer = createSimplePdf({ title, lines });
  return { originalname: filename, mimetype: 'application/pdf', size: buffer.length, buffer };
};

const resumeUpload = ({ fullName, position, department, experience, email, phone }) =>
  pdfUpload(`${fullName.replace(/\s+/g, '_')}_Resume.pdf`, fullName, [
    `${position} - ${department}`,
    `Email: ${email}  |  Phone: ${phone}`,
    `Experience: ${experience} year(s)`,
    '',
    'Summary',
    `Motivated ${position.toLowerCase()} with hands-on experience delivering quality work`,
    'in collaborative, fast-paced teams.',
  ]);

const clearDatabase = async () => {
  await Promise.all([
    User.deleteMany({}),
    Candidate.deleteMany({}),
    Employee.deleteMany({}),
    Attendance.deleteMany({}),
    Leave.deleteMany({}),
  ]);
  try {
    await getBucket().drop();
  } catch (err) {
    if (!/ns not found|file not found/i.test(err?.message ?? '')) throw err;
  }
};

const seedCandidates = (hr) =>
  Promise.all(
    CANDIDATES.map(async ([fullName, position, department, experience, status], index) => {
      const data = {
        fullName,
        email: `${slug(fullName)}@example.com`,
        phone: phoneFor(index),
        position,
        department,
        experience,
        status,
        notes: status === 'Scheduled' ? 'Interview scheduled with the hiring panel.' : '',
      };
      const resume = await saveFile(resumeUpload(data), { kind: 'resume' });
      return Candidate.create({ ...data, resume, createdBy: hr._id });
    }),
  );

const seedEmployees = (hr, today) =>
  Promise.all(
    EMPLOYEES.map(async ([fullName, position, department, role, employmentType, experience, status], index) => {
      const data = {
        fullName,
        email: `${slug(fullName)}@vighnotech.com`,
        phone: phoneFor(100 + index),
        position,
        department,
        role,
        employmentType,
        experience,
        status,
        dateOfJoining: addDays(today, -(60 + index * 45)),
        createdBy: hr._id,
      };
      if (index % 3 === 0) {
        data.resume = await saveFile(resumeUpload(data), { kind: 'resume' });
      }
      return Employee.create(data);
    }),
  );

const seedLeaves = (hr, employees, today) =>
  Promise.all(
    LEAVES.map(async ([employeeIndex, leaveType, offset, length, status, reason, withDocument]) => {
      const employee = employees[employeeIndex];
      const startDate = addDays(today, offset);
      const endDate = addDays(startDate, length - 1);
      const leave = { employee: employee._id, leaveType, startDate, endDate, reason, status, createdBy: hr._id };
      if (withDocument) {
        leave.document = await saveFile(
          pdfUpload(`${leaveType}_Leave_Certificate.pdf`, `${leaveType} Leave Certificate`, [
            `Employee: ${employee.fullName}`,
            `From ${toDateKey(startDate)} to ${toDateKey(endDate)}`,
            `Reason: ${reason}`,
          ]),
          { kind: 'leave-document' },
        );
      }
      return Leave.create(leave);
    }),
  );

const isOnApprovedLeave = (leaves, employeeId, date) =>
  leaves.some(
    (leave) =>
      leave.status === 'Approved' &&
      leave.employee.equals(employeeId) &&
      leave.startDate <= date &&
      leave.endDate >= date,
  );

/** Number of active employees left unmarked today so the "Not Marked" state is visible in the UI. */
const UNMARKED_TODAY = 2;

const seedAttendance = (hr, employees, leaves, today) => {
  const activeEmployees = employees.filter((employee) => employee.status === 'Active');
  const records = [];

  activeEmployees.forEach((employee, employeeIndex) => {
    for (let dayOffset = 0; dayOffset < ATTENDANCE_DAYS; dayOffset += 1) {
      const isUnmarkedToday = dayOffset === 0 && employeeIndex >= activeEmployees.length - UNMARKED_TODAY;
      if (!isUnmarkedToday) {
        const date = addDays(today, -dayOffset);
        const onLeave = isOnApprovedLeave(leaves, employee._id, date);
        const patternIndex = (employeeIndex + dayOffset) % ATTENDANCE_PATTERN.length;
        records.push({
          employee: employee._id,
          date,
          status: onLeave ? 'On Leave' : ATTENDANCE_PATTERN[patternIndex],
          task: onLeave ? '' : TASKS[(employeeIndex * 3 + dayOffset) % TASKS.length],
          updatedBy: hr._id,
        });
      }
    }
  });

  return Attendance.insertMany(records);
};

/** Resets the database and inserts demo data. Assumes an open mongoose connection. */
export const seedDatabase = async () => {
  await clearDatabase();
  await Promise.all([User, Candidate, Employee, Attendance, Leave].map((model) => model.syncIndexes()));

  const today = todayDate();
  const hr = await User.create(DEMO_HR);
  const candidates = await seedCandidates(hr);
  const employees = await seedEmployees(hr, today);
  const leaves = await seedLeaves(hr, employees, today);
  const attendance = await seedAttendance(hr, employees, leaves, today);

  return {
    users: 1,
    candidates: candidates.length,
    employees: employees.length,
    leaves: leaves.length,
    attendance: attendance.length,
    today: toDateKey(today),
  };
};

if (isMainModule(import.meta.url)) {
  const force = process.argv.includes('--force');
  if (env.isProduction && !force) {
    console.error('[seed] Refusing to wipe a production database. Re-run with --force if you are sure.');
    process.exit(1);
  }

  try {
    await connectDB(env.MONGODB_URI);
    console.log(`[seed] Connected to ${mongoose.connection.name}`);
    const summary = await seedDatabase();
    console.log('[seed] Done:', summary);
    console.log(`[seed] Login with ${DEMO_HR.email} / ${DEMO_HR.password}`);
  } catch (err) {
    console.error('[seed] Failed:', err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}
