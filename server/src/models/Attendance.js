import mongoose from 'mongoose';
import { ATTENDANCE_STATUSES } from '../config/constants.js';

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee is required'],
    },
    date: { type: Date, required: [true, 'Date is required'] },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: { values: ATTENDANCE_STATUSES, message: 'Select a valid attendance status' },
    },
    task: { type: String, trim: true, maxlength: [500, 'Task must be at most 500 characters'], default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, versionKey: false },
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1, status: 1 });

export const Attendance = mongoose.model('Attendance', attendanceSchema);
