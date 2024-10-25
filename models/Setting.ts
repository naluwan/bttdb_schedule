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
});

export default mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
