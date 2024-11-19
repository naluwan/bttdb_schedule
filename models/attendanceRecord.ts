import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
  time: {
    type: Date,
    required: true,
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
});

attendanceRecordSchema.set('timestamps', true);

export default mongoose.models.AttendanceRecord ||
  mongoose.model('AttendanceRecord', attendanceRecordSchema);
