import mongoose from 'mongoose';
import { CANDIDATE_STATUSES, DEPARTMENTS, PHONE_REGEX } from '../config/constants.js';
import { fileSchema } from './fileSchema.js';

const candidateSchema = new mongoose.Schema(
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
    experience: {
      type: Number,
      required: [true, 'Experience is required'],
      min: [0, 'Experience cannot be negative'],
      max: [50, 'Experience cannot exceed 50 years'],
    },
    status: {
      type: String,
      enum: { values: CANDIDATE_STATUSES, message: 'Select a valid status' },
      default: 'New',
    },
    resume: { type: fileSchema, required: [true, 'Resume is required'] },
    notes: { type: String, trim: true, maxlength: [500, 'Notes must be at most 500 characters'], default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, versionKey: false },
);

candidateSchema.index({ fullName: 1 });
candidateSchema.index({ email: 1 }, { unique: true });
candidateSchema.index({ status: 1, department: 1, createdAt: -1 });
candidateSchema.index({ position: 1 });

export const Candidate = mongoose.model('Candidate', candidateSchema);
