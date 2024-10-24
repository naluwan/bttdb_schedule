import { format, setYear } from 'date-fns';
import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { CalendarIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { zhTW } from 'date-fns/locale';

interface DatePickerProps {
  openDatePicker: boolean;
  setOpenDatePicker: (open: boolean) => void;
  defaultDate: Date | undefined;
  updateDate: (e: Date | undefined) => void;
  isEdit: boolean;
  yearsRange?: number[];
  customClass?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  openDatePicker,
  setOpenDatePicker,
  defaultDate,
  updateDate,
  isEdit,
  yearsRange,
  customClass,
}) => {
  const [currentMonth, setCurrentMonth] = React.useState<Date | undefined>(new Date());

  // 生成年份列表，範圍可以自行調整
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 51 }, (_, i) => currentYear - 25 + i);

  // 處理年份選擇的邏輯
  const handleDateYearChange = (year: string) => {
    if (defaultDate) {
      const updatedDate = setYear(defaultDate, parseInt(year));
      setCurrentMonth(updatedDate); // 確保日曆顯示選擇的年份
      updateDate(updatedDate); // 同步更新 record.date
    }
  };

  const currentYearsRange = yearsRange ? yearsRange : years;

  return (
    <Popover open={openDatePicker} onOpenChange={setOpenDatePicker}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'mt-1 hidden w-full justify-start text-left font-normal',
            !defaultDate && 'text-muted-foreground',
            isEdit && 'flex',
            customClass,
          )}
        >
          <CalendarIcon className='mr-2 h-4 w-4 md:h-7 md:w-7' />
          {defaultDate ? format(defaultDate, 'yyyy-MM-dd') : <span>請選擇日期</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='flex w-auto flex-col space-y-2 p-2'>
        {/* 年份選擇器 */}
        <Select
          value={defaultDate ? new Date(defaultDate).getFullYear().toString() : ''}
          onValueChange={handleDateYearChange}
        >
          <SelectTrigger>
            <SelectValue placeholder='選擇年份' />
          </SelectTrigger>
          <SelectContent position='popper'>
            {currentYearsRange.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* 日曆選擇器 */}
        <div className='rounded-md border'>
          <Calendar
            mode='single'
            selected={defaultDate}
            onSelect={(e) => {
              updateDate(e); // 同步更新 record.date
              setOpenDatePicker(false);
            }}
            locale={zhTW}
            initialFocus
            month={currentMonth} // 控制日曆顯示當前月份
            onMonthChange={(e) => {
              setCurrentMonth(e);
              updateDate(e); // 同步更新 record.date
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;
