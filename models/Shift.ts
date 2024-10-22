// models/Shift.js
import mongoose from 'mongoose';

const ShiftSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

export default mongoose.models.Shift || mongoose.model('Shift', ShiftSchema);
