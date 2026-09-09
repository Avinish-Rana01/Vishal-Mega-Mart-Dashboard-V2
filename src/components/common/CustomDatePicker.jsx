import React, { forwardRef, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import './CustomDatePicker.css';

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Custom Input component forwardRef for react-datepicker
 */
const CustomDateInput = forwardRef(({ value, onClick, placeholder, disabled, isClearable, onClear }, ref) => {
  return (
    <div 
      className={`vmm-date-input-container ${disabled ? 'disabled' : ''}`}
      onClick={!disabled ? onClick : undefined}
      ref={ref}
    >
      <span className={`vmm-date-input-text ${value ? 'has-value' : 'placeholder'}`}>
        {value || placeholder || 'Select Date'}
      </span>
      <div className="vmm-date-input-actions">
        {isClearable && value && !disabled && (
          <button
            type="button"
            className="vmm-date-clear-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClear?.();
            }}
            title="Clear date"
            aria-label="Clear date"
          >
            <X size={14} />
          </button>
        )}
        <CalendarIcon className="vmm-date-calendar-icon" size={16} />
      </div>
    </div>
  );
});

CustomDateInput.displayName = 'CustomDateInput';

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = 'Select Date',
  minDate,
  maxDate,
  disabled = false,
  isClearable = false,
  className = '',
  id,
  name
}) {
  // Parse incoming YYYY-MM-DD string or Date object safely without timezone shift
  const parseDate = (val) => {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    if (typeof val === 'string') {
      const parts = val.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
      const parsed = new Date(val);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  };

  const pickerRef = useRef(null);

  const selectedDate = parseDate(value);

  // Emit standard YYYY-MM-DD string
  const handleDateChange = (date) => {
    if (!date || isNaN(date.getTime())) {
      onChange?.('');
      return;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    onChange?.(`${year}-${month}-${day}`, date);
  };

  const handleClear = () => {
    onChange?.('', null);
    pickerRef.current?.setOpen(false);
  };

  const handleSelectToday = () => {
    handleDateChange(new Date());
    pickerRef.current?.setOpen(false);
  };

  // Generate a reasonable range of years (e.g. 2018 to currentYear + 3)
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = 2018; y <= currentYear + 3; y++) {
    years.push(y);
  }

  return (
    <div className={`vmm-datepicker-wrapper ${className}`}>
      <DatePicker
        ref={pickerRef}
        selected={selectedDate}
        onChange={handleDateChange}
        dateFormat="dd - MMM - yyyy"
        minDate={minDate ? parseDate(minDate) : undefined}
        maxDate={maxDate ? parseDate(maxDate) : undefined}
        disabled={disabled}
        id={id}
        name={name}
        popperPlacement="bottom-start"
        customInput={
          <CustomDateInput 
            placeholder={placeholder} 
            disabled={disabled}
            isClearable={isClearable}
            onClear={handleClear}
          />
        }
        renderCustomHeader={({
          date,
          changeYear,
          changeMonth,
          decreaseMonth,
          increaseMonth,
          prevMonthButtonDisabled,
          nextMonthButtonDisabled,
        }) => (
          <div className="vmm-datepicker-custom-header">
            <button
              type="button"
              className="vmm-dp-nav-btn"
              onClick={decreaseMonth}
              disabled={prevMonthButtonDisabled}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="vmm-dp-selects-group">
              <select
                className="vmm-dp-month-select"
                value={date.getMonth()}
                onChange={({ target: { value } }) =>
                  changeMonth(Number(value))
                }
              >
                {MONTH_SHORT.map((month, idx) => (
                  <option key={month} value={idx}>
                    {month}
                  </option>
                ))}
              </select>

              <select
                className="vmm-dp-year-select"
                value={date.getFullYear()}
                onChange={({ target: { value } }) => changeYear(Number(value))}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="vmm-dp-nav-btn"
              onClick={increaseMonth}
              disabled={nextMonthButtonDisabled}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      >
        <div className="vmm-datepicker-footer">
          <button
            type="button"
            className="vmm-dp-today-btn"
            onClick={handleSelectToday}
          >
            Today
          </button>
          {isClearable && (
            <button
              type="button"
              className="vmm-dp-footer-clear-btn"
              onClick={handleClear}
            >
              Clear
            </button>
          )}
        </div>
      </DatePicker>
    </div>
  );
}
