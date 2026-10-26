import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Check, Clock } from 'lucide-react';

interface DatePickerPopoverProps {
  id: string;
  value: string; // dd/mm/yyyy
  onChange: (val: string) => void;
  onBlur?: () => void;
  hasError?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DECADES = [
  { label: '1960s', year: 1965 },
  { label: '1970s', year: 1975 },
  { label: '1980s', year: 1985 },
  { label: '1990s', year: 1995 },
  { label: '2000s', year: 2005 },
  { label: '2010s', year: 2015 },
];

export const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({
  id,
  value,
  onChange,
  onBlur,
  hasError,
  disabled,
  placeholder = 'DD/MM/YYYY (click to open calendar)',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const nativeDateInputRef = useRef<HTMLInputElement>(null);

  // Parse current value if valid dd/mm/yyyy
  const parseValue = (valStr: string) => {
    if (!valStr) return null;
    const parts = valStr.trim().split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y) && y >= 1900 && m >= 0 && m <= 11) {
        return { day: d, month: m, year: y };
      }
    }
    return null;
  };

  const parsed = parseValue(value);
  const today = new Date();

  // Calendar view state
  const [viewYear, setViewYear] = useState<number>(parsed?.year || 1995);
  const [viewMonth, setViewMonth] = useState<number>(parsed?.month ?? 5);

  // Sync view when parsed value changes
  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [value]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isOpen) {
          setIsOpen(false);
          if (onBlur) onBlur();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onBlur]);

  // Compute days in current view month
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  // Generate Year options (1920 to current year)
  const currentYear = today.getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 1920; y--) {
    years.push(y);
  }

  const handleSelectDay = (day: number) => {
    // Check if future
    const selectedDate = new Date(viewYear, viewMonth, day);
    if (selectedDate > today) return;

    const dd = String(day).padStart(2, '0');
    const mm = String(viewMonth + 1).padStart(2, '0');
    const yyyy = String(viewYear);
    const formatted = `${dd}/${mm}/${yyyy}`;

    onChange(formatted);
    setIsOpen(false);
    if (onBlur) onBlur();
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewYear === currentYear && viewMonth >= today.getMonth()) return;

    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectToday = () => {
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = String(today.getFullYear());
    onChange(`${dd}/${mm}/${yyyy}`);
    setIsOpen(false);
    if (onBlur) onBlur();
  };

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value; // yyyy-mm-dd
    if (raw) {
      const parts = raw.split('-');
      if (parts.length === 3) {
        const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
        onChange(formatted);
        setIsOpen(false);
      }
    }
  };

  const triggerNativePicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (nativeDateInputRef.current && typeof (nativeDateInputRef.current as any).showPicker === 'function') {
        (nativeDateInputRef.current as any).showPicker();
      } else if (nativeDateInputRef.current) {
        nativeDateInputRef.current.focus();
        nativeDateInputRef.current.click();
      }
    } catch {
      // Fallback to custom popover if browser blocks showPicker
      setIsOpen(true);
    }
  };

  // Convert current dd/mm/yyyy to yyyy-mm-dd for native input
  const getNativeInputValue = () => {
    if (!parsed) return '';
    const yyyy = String(parsed.year);
    const mm = String(parsed.month + 1).padStart(2, '0');
    const dd = String(parsed.day).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <div className="date-picker-wrapper" ref={containerRef}>
      {/* Hidden native date input to support browser date menu */}
      <input
        type="date"
        ref={nativeDateInputRef}
        value={getNativeInputValue()}
        max={today.toISOString().slice(0, 10)}
        onChange={handleNativeDateChange}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="input-wrapper">
        <button
          type="button"
          className="input-icon-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) setIsOpen(!isOpen);
          }}
          title="Open calendar date picker menu"
          aria-label="Open date picker menu"
          id={`${id}-calendar-btn`}
        >
          <CalendarIcon size={16} color={isOpen ? '#06b6d4' : '#94a3b8'} />
        </button>

        <input
          id={id}
          type="text"
          className={`form-input has-icon ${hasError ? 'input-error' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={() => !disabled && setIsOpen(true)}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
        />

        {value && !disabled && (
          <button
            type="button"
            className="clear-date-btn"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              if (onBlur) onBlur();
            }}
            title="Clear date"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Popover Calendar Menu */}
      {isOpen && (
        <div
          className="date-picker-popover glass-panel"
          id={`${id}-popover`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Month & Year Dropdowns + Arrows */}
          <div className="date-popover-header">
            <div className="month-year-selects">
              <select
                className="calendar-select"
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                aria-label="Select Month"
              >
                {MONTHS.map((m, idx) => (
                  <option
                    key={m}
                    value={idx}
                    disabled={viewYear === currentYear && idx > today.getMonth()}
                  >
                    {m}
                  </option>
                ))}
              </select>

              <select
                className="calendar-select year-select"
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                aria-label="Select Year"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="month-nav-btns">
              <button
                type="button"
                className="nav-arrow-btn"
                onClick={handlePrevMonth}
                title="Previous Month"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                className="nav-arrow-btn"
                onClick={handleNextMonth}
                disabled={viewYear === currentYear && viewMonth >= today.getMonth()}
                title="Next Month"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Quick Decade Jump Bar */}
          <div className="date-decade-bar">
            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Decade:</span>
            {DECADES.map((d) => (
              <button
                key={d.label}
                type="button"
                className={`decade-chip ${Math.floor(viewYear / 10) === Math.floor(d.year / 10) ? 'active' : ''}`}
                onClick={() => setViewYear(d.year)}
              >
                {d.label}
              </button>
            ))}
            <button
              type="button"
              className="decade-chip"
              onClick={triggerNativePicker}
              title="Open browser native date calendar"
              style={{ color: '#22d3ee', borderColor: 'rgba(6, 182, 212, 0.4)' }}
            >
              Native
            </button>
          </div>

          {/* Weekday Names */}
          <div className="calendar-weekdays">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Days Grid */}
          <div className="calendar-days-grid">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="calendar-day empty" />
            ))}

            {/* Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(viewYear, viewMonth, day);
              const isFuture = dateObj > today;
              const isSelected =
                parsed?.day === day &&
                parsed?.month === viewMonth &&
                parsed?.year === viewYear;
              const isToday =
                today.getDate() === day &&
                today.getMonth() === viewMonth &&
                today.getFullYear() === viewYear;

              return (
                <button
                  key={day}
                  type="button"
                  className={`calendar-day-btn ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${isFuture ? 'disabled' : ''}`}
                  onClick={() => handleSelectDay(day)}
                  disabled={isFuture}
                >
                  <span>{day}</span>
                  {isSelected && <Check size={10} className="day-check-icon" />}
                </button>
              );
            })}
          </div>

          {/* Footer with Presets & Done */}
          <div className="date-popover-footer">
            <span className="popover-hint">
              {parsed ? (
                <>Selected: <strong>{value}</strong></>
              ) : (
                <>Click day to apply</>
              )}
            </span>
            <div className="popover-actions-group">
              <button
                type="button"
                className="popover-btn popover-btn-clear"
                onClick={handleSelectToday}
                title="Set to today's date"
              >
                <Clock size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                Today
              </button>
              <button
                type="button"
                className="popover-btn popover-btn-done"
                onClick={() => setIsOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
