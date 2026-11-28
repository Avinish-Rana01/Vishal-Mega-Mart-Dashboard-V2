import React from 'react';
import { AlertTriangle, TagX, Clock, Calendar } from 'lucide-react';

export default function EpcCard({
  articleDescription,
  title,
  articleNo,
  articleNumber,
  epc,
  epcData,
  amount,
  price,
  date,
  time,
  variant = 'untagged',
  status,
  loading = false,
  className = '',
  isLatest = false,
}) {
  const desc = articleDescription || title || 'Untitled Article';
  const artNo = articleNo || articleNumber || 'N/A';
  const epcVal = epc || epcData || 'N/A';
  const isTheft = variant === 'theft' || variant === 'loss';
  const rawAmount = amount !== undefined ? amount : price;
  const formattedAmount =
    rawAmount !== undefined && rawAmount !== null
      ? typeof rawAmount === 'number'
        ? rawAmount.toLocaleString('en-IN')
        : rawAmount.toString()
      : null;

  // 1. Shimmer Skeleton Loading State (Compact with thin left border)
  if (loading) {
    return (
      <div
        className={`relative w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 overflow-hidden shadow-2xs ${
          isTheft ? 'border-l-2 border-l-rose-400' : 'border-l-2 border-l-sky-400'
        } ${className}`}
        role="status"
        aria-label="Loading EPC card"
      >
        <div
          className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-slate-200/50 to-transparent pointer-events-none z-20"
          aria-hidden="true"
        />
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="h-3.5 w-36 sm:w-48 bg-slate-200/80 rounded" />
          <div className="h-4 w-20 bg-slate-200/60 rounded-full" />
        </div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-20 bg-slate-200/60 rounded" />
            <div className="h-3 w-24 bg-slate-200/50 rounded" />
          </div>
          <div className="h-3 w-16 bg-slate-200/60 rounded" />
        </div>
        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100">
          <div className="h-3 w-20 bg-slate-200/60 rounded" />
          <div className="h-3 w-16 bg-slate-200/60 rounded" />
        </div>
      </div>
    );
  }

  // 2. Active Compact EpcCard
  return (
    <div
      className={`group relative w-full rounded-xl px-3.5 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer ${
        isLatest
          ? 'border border-rose-300 animate-theft-blink'
          : 'bg-white border border-slate-300'
      } ${
        isTheft
          ? 'border-l-4 border-l-rose-500 hover:border-rose-400'
          : 'border-l-4 border-l-[#00a8e7] hover:border-sky-400'
      } ${className}`}
    >
      {/* Row 1: Article Description on left, Status chip on right */}
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 truncate tracking-tight">
          {desc}
        </h4>

        <div className="flex items-center gap-1.5 shrink-0">
          {isLatest && (
            <span className="shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-rose-50 text-rose-700 border border-rose-200/90 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
              </span>
              Latest Loss
            </span>
          )}
          <span
            className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
              isTheft
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-sky-50 text-sky-700 border border-sky-200'
            }`}
          >
            {isTheft ? (
              <AlertTriangle className="w-2.5 h-2.5 text-rose-500 shrink-0" />
            ) : (
              <TagX className="w-2.5 h-2.5 text-sky-500 shrink-0" />
            )}
            <span>{status || (isTheft ? 'Loss Alert' : 'Tag Not Removed')}</span>
          </span>
        </div>
      </div>

      {/* Row 2: Article No & EPC on left, Amount on right */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 mt-1.5 text-xs">
        {/* Left Group: Article No & EPC */}
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {/* Article No */}
          <span className="inline-flex items-center bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10.5px] font-medium shrink-0">
            Article No: <strong className="text-slate-900 font-semibold ml-1">{artNo}</strong>
          </span>

          {/* EPC Monospace Chip */}
          <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-1.5 py-0.5 rounded shrink-0">
            <span className="text-[9.5px] font-bold uppercase text-slate-500">EPC:</span>
            <span className="font-mono text-[10.5px] font-semibold text-slate-800 tracking-tight truncate max-w-[130px] sm:max-w-[180px]">
              {epcVal}
            </span>
          </div>
        </div>

        {/* Right Group: Amount aligned to the right */}
        {formattedAmount && (
          <span className="inline-flex items-center bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10.5px] font-medium ml-auto shrink-0">
            Amount:{' '}
            <strong className="text-slate-900 font-bold ml-1">
              {formattedAmount.startsWith('₹') || formattedAmount.toLowerCase().startsWith('rs')
                ? formattedAmount
                : `₹${formattedAmount}`}
            </strong>
          </span>
        )}
      </div>

      {/* Row 3: Date on Left, Time on Right with Clock icon (Darker Text) */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-slate-100 text-[11px]">
        {/* Date on Left */}
        <div className="flex items-center gap-1 text-slate-700 font-semibold">
          <Calendar className="w-3 h-3 text-slate-600 shrink-0" />
          <span>{date}</span>
        </div>

        {/* Time on Right with Clock icon */}
        <div className="flex items-center gap-1 text-slate-700 font-semibold">
          <Clock className="w-3 h-3 text-slate-600 shrink-0" />
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
}
