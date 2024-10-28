// models/Shift.js
import mongoose from 'mongoose';

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
});

ShiftSchema.set('timestamps', true);

export default mongoose.models.Shift || mongoose.model('Shift', ShiftSchema);
