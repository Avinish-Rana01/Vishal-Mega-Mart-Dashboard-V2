import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Info } from 'lucide-react';
import { formatDate } from '../../utils/filterConstants';


export default function CurrentDateOption({
  date,
  className = '',
}) {
  const todayFormatted = formatDate(new Date());
  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayFormatted = formatDate(yesterdayObj);

  const formattedDate = date ? formatDate(date) : todayFormatted;

  const dateLabel =
    formattedDate === todayFormatted
      ? 'Today'
      : formattedDate === yesterdayFormatted
        ? 'Yesterday'
        : 'Date';

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Current Date Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8.5 px-3 bg-white border border-slate-200/90 hover:border-slate-300 rounded-lg flex items-center gap-2 text-xs font-medium text-slate-700 shadow-2xs transition-all cursor-pointer select-none"
        aria-label={`Current date: ${formattedDate}`}
        title="Dashboard overview displays real-time records for the current date only"
      >
        <Calendar className="w-3.5 h-3.5 text-[#00a8e7] shrink-0" />
        <span className="font-semibold text-slate-800 tracking-tight">{formattedDate}</span>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#007ba8] bg-sky-50 border border-sky-200/80 px-1.5 py-0.5 rounded-full">
          {dateLabel === 'Today' && <span className="w-1.5 h-1.5 rounded-full bg-[#00a8e7] animate-pulse" />}
          {dateLabel}
        </span>
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
          <div className="flex items-center gap-2 mb-1.5 text-slate-900 font-bold text-xs">
            <Info className="w-3.5 h-3.5 text-[#5236df]" />
            <span>Current Date</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Locked to Today's active operational hours. For historical and custom date range analysis, visit the Analytics or Incident Reports views.
          </p>
        </div>
      )}
    </div>
  );
}
