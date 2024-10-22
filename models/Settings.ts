// models/Settings.js
import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  weekdayMin: {
    type: Number,
    required: true,
  },
  weekendMin: {
    type: Number,
    required: true,
  },
});

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
