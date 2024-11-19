// utils/attendanceUtils.js
import dayjs from 'dayjs';
import { AttendanceRecordsType } from '@/type';

export function getShiftTimes(attendanceRecords: AttendanceRecordsType[]) {
  const sortedTimes = attendanceRecords
    .map((record) => dayjs(record.time))
    .sort((a, b) => a.valueOf() - b.valueOf());
  const start = sortedTimes[0];
  const end = sortedTimes[sortedTimes.length - 1];
  return { start, end, employee: attendanceRecords[0].employee };
}
