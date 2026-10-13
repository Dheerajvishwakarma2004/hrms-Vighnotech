import mongoose from 'mongoose';
import {
  DEPARTMENTS,
  EMPLOYEE_ROLES,
  EMPLOYEE_STATUSES,
  EMPLOYMENT_TYPES,
  PHONE_REGEX,
} from '../config/constants.js';
import { todayDate } from '../utils/date.js';
import { fileSchema } from './fileSchema.js';

const employeeSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [50, 'Full name must be at most 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
      match: [PHONE_REGEX, 'Phone must be 10-15 digits, optionally starting with +'],
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      trim: true,
      minlength: [2, 'Position must be at least 2 characters'],
      maxlength: [60, 'Position must be at most 60 characters'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: { values: DEPARTMENTS, message: 'Select a valid department' },
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: { values: EMPLOYEE_ROLES, message: 'Select a valid role' },
      default: 'Junior',
    },
    employmentType: {
      type: String,
      enum: { values: EMPLOYMENT_TYPES, message: 'Select a valid employment type' },
      default: 'Full Time',
    },
    status: {
      type: String,
      enum: { values: EMPLOYEE_STATUSES, message: 'Select a valid status' },
      default: 'Active',
    },
    experience: {
      type: Number,
      min: [0, 'Experience cannot be negative'],
      max: [50, 'Experience cannot exceed 50 years'],
      default: 0,
    },
    dateOfJoining: { type: Date, default: todayDate },
    resume: { type: fileSchema, default: undefined },
    fromCandidate: { type: Boolean, default: false },
    notes: { type: String, trim: true, maxlength: [500, 'Notes must be at most 500 characters'], default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, versionKey: false },
);

employeeSchema.index({ fullName: 1 });
employeeSchema.index({ email: 1 }, { unique: true });
employeeSchema.index({ department: 1, role: 1, status: 1 });

export const Employee = mongoose.model('Employee', employeeSchema);
