// models/Settings.js
import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema({
  weekdayMin: {
    type: Number,
  },
  weekendMin: {
    type: Number,
  },
  isOpenSchedule: {
    type: Boolean,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
});

SettingSchema.set('timestamps', true);

export default mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
