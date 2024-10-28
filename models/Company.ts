import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  nickName: {
    type: String,
    required: true,
  },
  enName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
  isLocked: {
    type: Boolean,
    required: true,
    default: true,
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
});

CompanySchema.set('timestamps', true);

export default mongoose.models.Company || mongoose.model('Company', CompanySchema);
