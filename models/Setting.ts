// models/Settings.js
import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema({
  weekdayMin: {
    type: Number,
    required: true,
  },
  weekendMin: {
    type: Number,
    required: true,
  },
});

export default mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
