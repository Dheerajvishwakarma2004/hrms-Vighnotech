import mongoose from 'mongoose';
import { LEAVE_STATUSES, LEAVE_TYPES } from '../config/constants.js';
import { inclusiveDays } from '../utils/date.js';
import { fileSchema } from './fileSchema.js';

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee is required'],
    },
    leaveType: {
      type: String,
      required: [true, 'Leave type is required'],
      enum: { values: LEAVE_TYPES, message: 'Select a valid leave type' },
    },
    startDate: { type: Date, required: [true, 'Start date is required'] },
    endDate: { type: Date, required: [true, 'End date is required'] },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      minlength: [3, 'Reason must be at least 3 characters'],
      maxlength: [500, 'Reason must be at most 500 characters'],
    },
    status: {
      type: String,
      enum: { values: LEAVE_STATUSES, message: 'Select a valid leave status' },
      default: 'Pending',
    },
    document: { type: fileSchema, default: undefined },
    days: { type: Number, min: 1 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, versionKey: false },
);

leaveSchema.pre('validate', function computeDays(next) {
  if (this.startDate && this.endDate) {
    if (this.endDate < this.startDate) {
      this.invalidate('endDate', 'End date cannot be before start date');
    } else {
      this.days = inclusiveDays(this.startDate, this.endDate);
    }
  }
  next();
});

leaveSchema.index({ status: 1, startDate: 1, endDate: 1 });
leaveSchema.index({ employee: 1 });

export const Leave = mongoose.model('Leave', leaveSchema);
