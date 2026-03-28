import React, { useState } from 'react';
import {
  format, addMonths, subMonths,
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  eachDayOfInterval,
  isSameDay, isBefore, isSameMonth, isWeekend,
} from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const today = new Date();
today.setHours(0, 0, 0, 0);

const RANGE_BG = '#EEF2FF'; // light indigo for range highlight

/**
 * Airbnb-style inline date range picker.
 * Props:
 *   start    – string 'YYYY-MM-DD' or ''
 *   end      – string 'YYYY-MM-DD' or ''
 *   onChange – (start: string, end: string) => void
 */
const DateRangePicker = ({ start, end, onChange }) => {
  const initMonth = start
    ? new Date(start + 'T00:00:00')
    : new Date(today.getFullYear(), today.getMonth(), 1);

  const [currentMonth, setCurrentMonth] = useState(initMonth);
  const [hoverDate,    setHoverDate]    = useState(null);

  const monthStart = startOfMonth(currentMonth);
  const calDays    = eachDayOfInterval({
    start: startOfWeek(monthStart,          { weekStartsOn: 1 }),
    end:   endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 }),
  });

  const startDate = start ? new Date(start + 'T00:00:00') : null;
  const endDate   = end   ? new Date(end   + 'T00:00:00') : null;

  const handleClick = (day) => {
    if (isBefore(day, today) && !isSameDay(day, today)) return;
    const str = format(day, 'yyyy-MM-dd');

    if (!start || (start && end)) {
      // Start a new selection
      onChange(str, '');
    } else {
      // Second click
      if (str < start) {
        onChange(str, '');          // clicked before start → new start
      } else if (str === start) {
        onChange('', '');           // deselect
      } else {
        onChange(start, str);       // complete the range
      }
    }
  };

  const getDayProps = (day) => {
    const str        = format(day, 'yyyy-MM-dd');
    const isPast     = isBefore(day, today) && !isSameDay(day, today);
    const isStart    = !!startDate && isSameDay(day, startDate);
    const isEnd      = !!endDate   && isSameDay(day, endDate);
    const isToday    = isSameDay(day, today);
    const inRange    = !!startDate && !!endDate && day > startDate && day < endDate;
    const inHover    = !!startDate && !endDate && !!hoverDate && day > startDate && str <= hoverDate;
    const isWeekd    = isWeekend(day);
    const inCurMonth = isSameMonth(day, currentMonth);

    // Range background spans full cell width; endpoints are half-filled
    let cellBg = 'transparent';
    const hasRangeRight = isStart && (endDate || (hoverDate && str < hoverDate));
    const hasRangeLeft  = isEnd;

    if (hasRangeRight && !isEnd) {
      cellBg = `linear-gradient(to right, transparent 50%, ${RANGE_BG} 50%)`;
    } else if (hasRangeLeft && !isStart) {
      cellBg = `linear-gradient(to left, transparent 50%, ${RANGE_BG} 50%)`;
    } else if (isStart && isEnd) {
      cellBg = 'transparent';
    } else if (inRange || inHover) {
      cellBg = RANGE_BG;
    }

    return { str, isPast, isStart, isEnd, isToday, inRange, inHover, isWeekd, inCurMonth, cellBg };
  };

  const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className="select-none w-full">
      {/* Month navigation — 44px touch targets */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="w-11 h-11 flex items-center justify-center hover:bg-bg border border-border rounded-xl transition-colors cursor-pointer touch-manipulation active:scale-95"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-bold text-text capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: pt })}
        </span>
        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="w-11 h-11 flex items-center justify-center hover:bg-bg border border-border rounded-xl transition-colors cursor-pointer touch-manipulation active:scale-95"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-[11px] font-bold text-text-muted text-center py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid — h-11 cells (44px) for comfortable mobile tapping */}
      <div className="grid grid-cols-7" onMouseLeave={() => setHoverDate(null)}>
        {calDays.map((day, i) => {
          const { str, isPast, isStart, isEnd, isToday, inRange, inHover, isWeekd, inCurMonth, cellBg } = getDayProps(day);

          if (!inCurMonth) return <div key={i} className="h-11" />;

          const isSelected = isStart || isEnd;
          const highlighted = inRange || inHover;

          return (
            <div
              key={i}
              style={{ background: cellBg }}
              className="h-11 flex items-center justify-center"
              onMouseEnter={() => {
                if (!endDate && startDate && !isPast) setHoverDate(str);
              }}
            >
              <button
                type="button"
                disabled={isPast}
                onClick={() => handleClick(day)}
                className={[
                  'w-10 h-10 rounded-full flex flex-col items-center justify-center text-sm relative transition-colors touch-manipulation active:scale-95',
                  isPast
                    ? 'text-slate-300 line-through cursor-not-allowed'
                    : 'cursor-pointer',
                  isSelected
                    ? 'bg-slate-900 text-white font-bold'
                    : highlighted
                    ? 'text-text hover:bg-white/60'
                    : isToday
                    ? 'font-bold text-primary hover:bg-bg'
                    : isWeekd
                    ? 'text-text-muted hover:bg-bg'
                    : 'text-text hover:bg-bg',
                ].join(' ')}
              >
                {format(day, 'd')}
                {/* Today dot */}
                {isToday && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Selection summary */}
      <div className="mt-3 h-6 text-center">
        {start && !end && (
          <p className="text-xs text-text-muted">Escolhe a data de fim</p>
        )}
        {start && end && (
          <p className="text-xs font-semibold text-text">
            {format(new Date(start + 'T00:00:00'), 'd MMM', { locale: pt })}
            {' → '}
            {format(new Date(end + 'T00:00:00'), 'd MMM yyyy', { locale: pt })}
          </p>
        )}
      </div>
    </div>
  );
};

export default DateRangePicker;
