// models/Shift.js
import mongoose from 'mongoose';

export interface ShiftType {
  startDate: Date;
  endDate: Date;
  isAvailable: boolean;
  employee: string;
  scheduleType: 'manual' | 'automatic';
  month: number;
  company: string;
  isComplete: boolean;
}

const ShiftSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    required: true,
    default: true,
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  scheduleType: {
    type: String,
    required: true,
    enum: ['manual', 'automatic'],
  },
  month: {
    type: Number,
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  isComplete: {
    type: Boolean,
    required: true,
    default: false,
  },
});

ShiftSchema.set('timestamps', true);

export default mongoose.models.Shift || mongoose.model('Shift', ShiftSchema);
