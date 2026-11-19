import React, { useState } from 'react';
import { Clock, ArrowRight, X, AlertTriangle } from 'lucide-react';


export default function TheftByTimeOfDay({
  data = [],
  summary = null,
  hourlyThefts = null,
  className = '',
}) {
  const [activeSlot, setActiveSlot] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const rawSlots = hourlyThefts?.TimeSlots || (Array.isArray(data) ? data : []);
  const totalThefts = hourlyThefts?.TotalThefts ?? summary?.totalIncidents ?? 0;
  const highestCount = Math.max(...rawSlots.map((item) => item.Thefts ?? item.count ?? 0), 0);
  const highRiskWindow = hourlyThefts?.HighRiskWindow || '9AM – 3PM';
  const rushWindowRaw = hourlyThefts?.RushWindow || (summary?.rushWindowPercentage ? `12PM-6PM (${summary.rushWindowPercentage}%)` : '9AM – 3PM');
  const rushWindowText = String(rushWindowRaw).replace(/^Rush:\s*/i, '');

  const chartData = rawSlots.map((item, idx) => {
    const timeSlot = item.TimeSlot || item.timeSlot || '';
    const count = item.Thefts ?? item.count ?? 0;
    const label = item.Category || item.label || '';
    const percentage = item.PercentageOfDay ?? item.Percentage ?? (totalThefts > 0 ? ((count / totalThefts) * 100) : 0);
    const isPeak = Boolean(
      (highestCount > 0 && count === highestCount) ||
      item.IsPeakSlot ||
      timeSlot === (hourlyThefts?.PeakSlot || summary?.peakSlot)
    );

    return {
      timeSlot,
      count,
      label,
      percentage: Number(percentage).toFixed(1),
      isPeak,
      order: item.SlotOrder ?? idx + 1,
    };
  });

  const peakItems = chartData.filter((d) => d.isPeak);
  const peakSlot = peakItems.length > 1
    ? peakItems.map((p) => p.timeSlot).join(' & ')
    : (hourlyThefts?.PeakSlot || summary?.peakSlot || (peakItems[0]?.timeSlot ?? ''));
  const peakCount = peakItems[0]?.count ?? (summary?.peakCount ?? 0);
  const peakPercentage = peakItems[0]?.percentage ?? (summary?.peakPercentage ?? 0);

  // SVG Chart Geometry Constants
  const viewBoxWidth = 660;
  const viewBoxHeight = 290;
  const chartLeft = 44;
  const chartRight = 640;
  const chartTop = 24;
  const chartBottom = 250;
  const chartHeight = chartBottom - chartTop; // 226px

  const maxVal = highestCount <= 10 ? 10 : highestCount <= 30 ? 30 : Math.ceil(highestCount / 20) * 20;

  // Y-axis grid levels (0, 10, 20, 30)
  const yTicks = [0, Math.round(maxVal / 3), Math.round((maxVal * 2) / 3), maxVal];
  const getY = (val) => chartBottom - (maxVal > 0 ? (val / maxVal) * chartHeight : 0);

  // X-axis bar positions
  const plotWidth = chartRight - chartLeft;
  const slotCount = chartData.length || 6;
  const slotWidth = plotWidth / slotCount;
  const barWidth = Math.min(52, slotWidth * 0.55);

  return (
    <div
      className={`bg-white border-2 border-rose-200/80 rounded-2xl overflow-hidden shadow-xs flex flex-col transition-all hover:shadow-sm min-h-[310px] sm:min-h-[340px] xl:min-h-[385px] 2xl:min-h-[425px] ${className}`}
    >
      {/* 1. Header Banner matching reference with View Details link */}
      <div className="bg-gradient-to-r from-rose-50 via-rose-50/50 to-white px-3.5 py-2.5 sm:px-4 sm:py-3 xl:px-5 xl:py-3.5 border-b border-rose-100 flex items-center justify-between gap-3 shrink-0 h-[56px] sm:h-[60px] xl:h-[64px]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 xl:w-9 xl:h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs shadow-rose-500/25 shrink-0">
            <Clock className="w-4 h-4 xl:w-4.5 xl:h-4.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-rose-600 block leading-none mb-0.5">
              Hourly Incidents
            </span>
            <h3 className="text-xs sm:text-[13px] xl:text-sm 2xl:text-[15px] font-bold text-slate-900 tracking-tight truncate leading-tight">
              Hourly theft trends
            </h3>
          </div>
        </div>

        {/* View Details Link */}
        <button
          type="button"
          onClick={() => setShowDetailsModal(true)}
          className="text-xs sm:text-[12.5px] font-bold text-[#00a8e7] hover:text-sky-600 transition-colors flex items-center gap-1 shrink-0 py-1 px-2 rounded-lg hover:bg-sky-50 cursor-pointer"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* 2. Main Bar Chart Area - Fills vertical height of card */}
      <div className="px-2 sm:px-4 xl:px-5 py-2 sm:py-2.5 flex-1 relative flex flex-col justify-center min-h-[220px]">
        <div className="w-full h-full flex items-center justify-center">
          <svg
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            className="w-full h-full select-none"
          >
            <defs>
              {/* Subtle top-to-bottom bar gradient */}
              <linearGradient id="roseBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>

              {/* Hover highlight gradient */}
              <linearGradient id="roseBarHover" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb7185" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>

              {/* Peak Bar Gradient */}
              <linearGradient id="roseBarPeak" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#be123c" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Labels */}
            {yTicks.map((tick) => {
              const y = getY(tick);
              const isBase = tick === 0;

              return (
                <g key={`ytick-${tick}`}>
                  {/* Y-Axis Label */}
                  <text
                    x={chartLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[12px] font-bold fill-slate-500"
                    style={{ fontFamily: 'inherit' }}
                  >
                    {tick}
                  </text>

                  {/* Horizontal Grid Line */}
                  <line
                    x1={chartLeft}
                    y1={y}
                    x2={chartRight}
                    y2={y}
                    stroke={isBase ? '#cbd5e1' : '#e2e8f0'}
                    strokeWidth={isBase ? '1.5' : '1'}
                    strokeDasharray={isBase ? undefined : '3 3'}
                  />
                </g>
              );
            })}

            {/* Vertical Y-Axis Line */}
            <line
              x1={chartLeft}
              y1={chartTop - 6}
              x2={chartLeft}
              y2={chartBottom}
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />

            {/* Bars and Values */}
            {chartData.map((item, idx) => {
              const barHeight = maxVal > 0 ? (item.count / maxVal) * chartHeight : 0;
              const xCenter = chartLeft + (idx + 0.5) * slotWidth;
              const barX = xCenter - barWidth / 2;
              const barY = chartBottom - barHeight;
              const isHovered = activeSlot === item.timeSlot;
              const isPeak = item.isPeak;
              const radius = 5;

              // Rounded-top only SVG path
              const barPath = `
                M ${barX},${chartBottom}
                L ${barX},${barY + radius}
                Q ${barX},${barY} ${barX + radius},${barY}
                L ${barX + barWidth - radius},${barY}
                Q ${barX + barWidth},${barY} ${barX + barWidth},${barY + radius}
                L ${barX + barWidth},${chartBottom}
                Z
              `;

              return (
                <g
                  key={item.timeSlot}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setActiveSlot(item.timeSlot)}
                  onMouseLeave={() => setActiveSlot(null)}
                >
                  {/* Invisible Hitbox for easier hover */}
                  <rect
                    x={xCenter - slotWidth / 2}
                    y={chartTop}
                    width={slotWidth}
                    height={chartBottom - chartTop + 35}
                    fill="transparent"
                  />

                  {/* Vertical Bar */}
                  <path
                    d={barPath}
                    fill={isHovered ? 'url(#roseBarHover)' : isPeak ? 'url(#roseBarPeak)' : 'url(#roseBarGrad)'}
                    className="transition-all duration-200"
                    filter={isHovered ? 'drop-shadow(0 4px 6px rgba(244, 63, 94, 0.35))' : undefined}
                  />

                  {/* Value Above Bar */}
                  <text
                    x={xCenter}
                    y={barY - 8}
                    textAnchor="middle"
                    className={`text-[13px] font-bold ${isPeak ? 'fill-slate-950 font-black' : 'fill-slate-800'
                      }`}
                    style={{ fontFamily: 'inherit' }}
                  >
                    {item.count}
                  </text>

                  {/* X-Axis Interval Label */}
                  <text
                    x={xCenter}
                    y={chartBottom + 19}
                    textAnchor="middle"
                    className={`text-[10.5px] font-bold tracking-tight ${isHovered ? 'fill-rose-600 font-extrabold' : 'fill-slate-700'
                      }`}
                    style={{ fontFamily: 'inherit' }}
                  >
                    {item.timeSlot}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 3. Bottom Context Sub-bar: Peak Window & Security Patrol Note */}
      <div
        onClick={() => setShowDetailsModal(true)}
        className="px-3.5 py-1.5 sm:px-4 sm:py-2 xl:px-5 xl:py-2.5 bg-rose-50/40 border-t border-rose-100/70 flex items-center justify-between text-[10.5px] sm:text-[11px] xl:text-xs h-7 sm:h-8 xl:h-9 shrink-0 cursor-pointer hover:bg-rose-50/70 transition-colors"
      >
        <span className="truncate mr-2">
          Peak Window:{' '}
          <strong className="text-rose-600 font-bold">{peakSlot}</strong> ({peakCount} Thefts ·{' '}
          {peakPercentage}%)
        </span>
        <span className="font-semibold text-slate-500 shrink-0 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 xl:w-3.5 xl:h-3.5 text-amber-500" />
          Rush: {rushWindowText}
        </span>
      </div>

      {/* 4. Details Modal (Opened via "View Details ->") */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-rose-50 via-rose-50/60 to-white px-4 py-3 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Hourly theft trends - Detailed Analysis
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Incident frequency & security shift allocation
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content Table */}
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Thefts</span>
                  <span className="text-base font-black text-slate-900">{totalThefts}</span>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                  <span className="text-[10px] uppercase font-bold text-rose-500 block">Peak Slot</span>
                  <span className="text-sm font-black text-rose-700">{peakSlot}</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                  <span className="text-[10px] uppercase font-bold text-amber-600 block">High Risk Window</span>
                  <span className="text-sm font-black text-amber-800">{highRiskWindow}</span>
                </div>
              </div>

              {/* Time Slots Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-100/80 px-3 py-2 font-bold text-slate-700 grid grid-cols-4">
                  <span>Time Slot</span>
                  <span>Category</span>
                  <span className="text-center">Thefts</span>
                  <span className="text-right">% of Day</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {chartData.map((item) => (
                    <div
                      key={item.timeSlot}
                      className={`px-3 py-2 grid grid-cols-4 items-center ${item.isPeak ? 'bg-rose-50/50 font-semibold text-rose-900' : 'text-slate-700'
                        }`}
                    >
                      <span className="font-bold flex items-center gap-1.5">
                        {item.timeSlot}
                        {item.isPeak && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 font-extrabold">
                            Peak
                          </span>
                        )}
                      </span>
                      <span className="text-slate-500">{item.label}</span>
                      <span className={`text-center font-bold ${item.isPeak ? 'text-rose-600' : 'text-slate-800'}`}>{item.count}</span>
                      <span className={`text-right ${item.isPeak ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
