import React, { useState, useRef } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  eachDayOfInterval,
  isWeekend,
  parseISO,
} from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';

/**
 * TeamCalendar
 *
 * Props:
 *  - teamAbsences: Array<{ date: string 'YYYY-MM-DD', name: string }>
 *  - holidays:     Array<{ date: string, name: string, scope: string }>
 */
const TeamCalendar = ({ teamAbsences = [], holidays = [] }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [tooltip, setTooltip] = useState(null);
  const calendarRef = useRef(null);

  // Build lookup maps for fast access
  const absenceMap = {};
  teamAbsences.forEach(({ date, name }) => {
    if (!absenceMap[date]) absenceMap[date] = [];
    absenceMap[date].push(name);
  });

  const holidayMap = {};
  holidays.forEach(({ date, name, scope }) => {
    holidayMap[date] = { name, scope };
  });

  const handleDayEnter = (e, dateStr, absences, holiday) => {
    if (!absences.length && !holiday) return;
    if (!calendarRef.current) return;
    const calRect = calendarRef.current.getBoundingClientRect();
    const cellRect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      absences,
      holiday,
      top: cellRect.top - calRect.top - 8,
      left: cellRect.left - calRect.left + cellRect.width / 2,
    });
  };

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const days = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd),
  });

  return (
    <div className="bg-white p-5 rounded-radius border border-border shadow-sm h-full flex flex-col">
      {/* Section label */}
      <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
        <Users className="w-4 h-4" />
        Calendário da Equipa
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-sm capitalize text-text">
          {format(currentMonth, 'MMMM yyyy', { locale: pt })}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 hover:bg-bg border border-border rounded-md transition-colors cursor-pointer"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 hover:bg-bg border border-border rounded-md transition-colors cursor-pointer"
            aria-label="Mês seguinte"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {days.map((d, i) => (
          <div key={i} className="text-xs font-bold text-text-muted text-center py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid — relative container for tooltip */}
      <div className="grid grid-cols-7 gap-0.5 flex-1 relative" ref={calendarRef}
        onMouseLeave={() => setTooltip(null)}>
        {calendarDays.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, today);
          const isDayWeekend = isWeekend(day);
          const absences = absenceMap[dateStr] || [];
          const holiday = holidayMap[dateStr] || null;
          const hasAbsence = absences.length > 0;

          if (!isCurrentMonth) {
            return <div key={i} className="aspect-square" />;
          }

          return (
            <div
              key={i}
              className={`
                aspect-square flex items-center justify-center text-xs rounded-md relative cursor-default select-none
                ${isToday
                  ? 'bg-primary text-white font-bold'
                  : hasAbsence
                  ? 'bg-amber-100 text-amber-900 font-semibold'
                  : holiday
                  ? 'bg-violet-50 text-violet-700 font-semibold'
                  : isDayWeekend
                  ? 'text-text-light'
                  : 'text-text hover:bg-bg'}
              `}
              onMouseEnter={(e) => handleDayEnter(e, dateStr, absences, holiday)}
            >
              {format(day, 'd')}

              {/* Absence count badge */}
              {hasAbsence && absences.length > 1 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-amber-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center leading-none">
                  {absences.length}
                </span>
              )}

              {/* Holiday dot (when no absence) */}
              {!hasAbsence && holiday && !isToday && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-violet-400 rounded-full" />
              )}
            </div>
          );
        })}

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-20 bg-text text-white text-xs rounded-lg px-3 py-2 shadow-xl pointer-events-none -translate-x-1/2 -translate-y-full"
            style={{ top: tooltip.top, left: tooltip.left }}
          >
            {tooltip.holiday && (
              <div className="font-semibold text-violet-300 mb-1">{tooltip.holiday.name}</div>
            )}
            {tooltip.absences.map((name, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" />
                {name}
              </div>
            ))}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-text" />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-3 border-t border-border">
        <LegendDot color="bg-primary" label="Hoje" />
        <LegendDot color="bg-amber-300" label="Equipa ausente" />
        <LegendDot color="bg-violet-300" label="Feriado" />
        <LegendDot color="bg-text-light" label="Fim de semana" />
      </div>
    </div>
  );
};

const LegendDot = ({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <span className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${color}`} />
    <span className="text-xs text-text-muted">{label}</span>
  </div>
);

export default TeamCalendar;
