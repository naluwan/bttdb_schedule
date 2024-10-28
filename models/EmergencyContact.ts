import mongoose from 'mongoose';

const EmergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  relationship: { type: String, required: true },
  phone: { type: String, required: true },
});

EmergencyContactSchema.set('timestamps', true);

export default mongoose.models.EmergencyContact ||
  mongoose.model('EmergencyContact', EmergencyContactSchema);
