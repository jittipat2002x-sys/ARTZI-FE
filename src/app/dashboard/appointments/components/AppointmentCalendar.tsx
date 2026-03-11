import React, { useMemo } from 'react';
import { Appointment } from '@/services/appointment.service';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday 
} from 'date-fns';
import { th } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import { useBranding } from '@/contexts/branding-context';
interface AppointmentCalendarProps {
  currentDate: Date;
  onMonthChange: (date: Date) => void;
  appointments: Appointment[];
  onDateSelect: (date: Date) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  currentDate,
  onMonthChange,
  appointments,
  onDateSelect,
  onAppointmentClick
}) => {
  const { brandColor } = useBranding();

  const nextMonth = () => onMonthChange(addMonths(currentDate, 1));
  const prevMonth = () => onMonthChange(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const dateFormat = 'd';
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

  // Group appointments by date string 'YYYY-MM-DD'
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach((app) => {
      const d = new Date(app.date);
      const dateKey = format(d, 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(app);
    });
    
    // Sort within each day by time
    map.forEach((apps) => {
       apps.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    
    return map;
  }, [appointments]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      case 'NO_SHOW': return 'bg-gray-200 text-gray-800 border-gray-300';
      case 'SCHEDULED': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          {format(currentDate, 'MMMM yyyy', { locale: th })}
        </h2>
        <div className="flex space-x-2">
          <button 
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <button 
            onClick={() => onMonthChange(new Date())}
            className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
          >
            วันนี้
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
        {weekDays.map((day, idx) => (
          <div key={idx} className="py-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {calendarDays.map((day, index) => {
          const formattedDate = format(day, 'yyyy-MM-dd');
          const dayAppointments = appointmentsByDate.get(formattedDate) || [];
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isTodayDate = isToday(day);

          return (
            <div 
              key={day.toString()} 
              className={`min-h-[120px] p-2 border-b border-r border-gray-100 dark:border-gray-700/50 relative group cursor-pointer transition-colors
                ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800/40 text-gray-400' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'}
              `}
              onClick={(e) => {
                // If they click the cell directly (not an appointment card), trigger onDateSelect
                if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('day-num')) {
                  onDateSelect(day);
                }
              }}
            >
              <div className={`day-num text-sm font-semibold mb-2 flex justify-between items-center relative z-10`}>
                {/* Hover Add Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDateSelect(day);
                  }}
                  className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="สร้างนัดหมายในวันนี้"
                >
                  <span className="font-bold text-lg leading-none mb-0.5">+</span>
                </button>

                <span className={`w-7 h-7 flex items-center justify-center rounded-full ${
                  isTodayDate ? 'text-white' : ''
                }`} style={{ backgroundColor: isTodayDate ? brandColor : 'transparent' }}>
                  {format(day, dateFormat)}
                </span>
              </div>
              
              <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                {dayAppointments.slice(0, 4).map((app) => {
                  
                  // Calculate group count for display (how many from same customer on this day)
                  const groupCount = dayAppointments.filter(a => a.pet.customer.id === app.pet.customer.id).length;

                  return (
                    <div 
                      key={app.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick(app);
                      }}
                      className={`text-xs p-1.5 rounded-md border ${getStatusColor(app.status)} cursor-pointer hover:opacity-80 transition flex flex-col gap-0.5 truncate`}
                      title={`${app.pet.name} (${app.pet.customer.firstName}) - ${app.reason}`}
                    >
                      <div className="flex items-center justify-between">
                         <span className="font-bold truncate">
                           {app.pet.name}
                           {groupCount > 1 && <span className="ml-1 text-[10px] font-medium opacity-80" title={`มี ${groupCount} คิวของลูกค้ารายนี้ในวันนี้`}>({groupCount})</span>}
                         </span>
                         <span className="text-[10px] opacity-80 whitespace-nowrap ml-1 flex items-center">
                            <Clock size={10} className="mr-0.5" />
                            {format(new Date(app.date), 'HH:mm')}
                         </span>
                      </div>
                      <div className="text-[10px] truncate opacity-90 flex items-center gap-1">
                        <User size={10} />
                        {app.pet.customer.firstName}
                      </div>
                    </div>
                  );
                })}
                {dayAppointments.length > 4 && (
                  <div 
                    className="text-xs text-center font-medium py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateSelect(day);
                    }}
                  >
                    + {dayAppointments.length - 4} เพิ่มเติม
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
