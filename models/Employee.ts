import mongoose, { Document } from 'mongoose';

export interface EmployeeType extends Document {
  _id: string;
  name: string;
  id: string;
  email: string;
  password: string;
  birthday: Date;
  phone: string;
  address: string;
  role: 'admin' | 'employee';
  isLock: boolean;
  dateEmployed: Date;
  emergencyContact: {
    _id: string;
    name: string;
    relationship: string;
    phone: string;
  };
  updatedAt: Date;
  updatedBy: { _id: mongoose.Schema.Types.ObjectId; name: string };
}

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  birthday: { type: Date, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'employee'] },
  isLock: { type: Boolean, default: false },
  dateEmployed: { type: Date, required: true },
  emergencyContact: { type: mongoose.Schema.Types.ObjectId, ref: 'EmergencyContact' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
});

EmployeeSchema.set('timestamps', true);

export default mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
