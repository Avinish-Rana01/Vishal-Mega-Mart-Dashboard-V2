import React, { useState } from 'react';
import { Calendar, ArrowRight, X, TrendingUp } from 'lucide-react';

export default function TheftByDayOfWeek({
  data = [],
  summary = null,
  weeklyThefts = null,
  className = '',
}) {
  const [activeDay, setActiveDay] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const rawDays = weeklyThefts?.Days || (Array.isArray(data) ? data : []);
  const weeklyTotal = weeklyThefts?.WeeklyTotal ?? weeklyThefts?.TotalThefts ?? summary?.totalIncidents ?? 0;
  const highestDayCount = Math.max(...rawDays.map((item) => item.Thefts ?? item.count ?? 0), 0);
  const weekendTheftsDisplay = weeklyThefts?.WeekendTheftsDisplay || (summary ? `${summary.weekendTotal} (${((summary.weekendTotal / (summary.totalIncidents || 1)) * 100).toFixed(1)}%)` : '0 (0%)');
  const midweekSurgeDisplay = weeklyThefts?.MidweekSurgeDisplay || (summary?.midweekRushPercentage ? `Wed-Fri (${summary.midweekRushPercentage}%)` : 'Wed–Fri (0%)');
  const midweekSurgeText = String(midweekSurgeDisplay).replace(/^Midweek Surge:\s*/i, '');

  const chartData = rawDays.map((item, idx) => {
    const day = item.DayShort || item.day || '';
    const fullDay = item.Day || item.fullDay || day;
    const count = item.Thefts ?? item.count ?? 0;
    const dayType = item.DayType || (day === 'Sat' || day === 'Sun' ? 'Weekend' : 'Weekday');
    const percentage = item.PercentageOfWeek ?? item.Percentage ?? (weeklyTotal > 0 ? ((count / weeklyTotal) * 100) : 0);
    const isPeak = Boolean(
      (highestDayCount > 0 && count === highestDayCount) ||
      item.IsPeakDay ||
      fullDay === (weeklyThefts?.PeakDay || summary?.peakDay) ||
      day === (weeklyThefts?.PeakDay || summary?.peakDay)
    );

    return {
      day,
      fullDay,
      count,
      dayType,
      percentage: Number(percentage).toFixed(1),
      isPeak,
      order: item.DayOrder ?? idx + 1,
    };
  });

  const peakItems = chartData.filter((d) => d.isPeak);
  const peakDay = peakItems.length > 1
    ? peakItems.map((p) => p.fullDay).join(' & ')
    : (weeklyThefts?.PeakDay || summary?.peakDay || (peakItems[0]?.fullDay ?? ''));
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

  const maxVal = highestDayCount <= 10 ? 10 : highestDayCount <= 40 ? 40 : Math.ceil(highestDayCount / 20) * 20;

  // Y-axis grid levels (dynamic ticks)
  const yTicks = [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal];
  const getY = (val) => chartBottom - (maxVal > 0 ? (val / maxVal) * chartHeight : 0);

  // X-axis bar positions
  const plotWidth = chartRight - chartLeft;
  const slotCount = chartData.length || 7;
  const slotWidth = plotWidth / slotCount;
  const barWidth = Math.min(46, slotWidth * 0.55);

  return (
    <div
      className={`bg-white border-2 border-sky-200/80 rounded-2xl overflow-hidden shadow-xs flex flex-col transition-all hover:shadow-sm min-h-[310px] sm:min-h-[340px] xl:min-h-[385px] 2xl:min-h-[425px] ${className}`}
    >
      {/* 1. Header Banner matching reference with View Details link */}
      <div className="bg-gradient-to-r from-sky-50 via-sky-50/50 to-white px-3.5 py-2.5 sm:px-4 sm:py-3 xl:px-5 xl:py-3.5 border-b border-sky-100 flex items-center justify-between gap-3 shrink-0 h-[56px] sm:h-[60px] xl:h-[64px]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 xl:w-9 xl:h-9 rounded-xl bg-[#00a8e7] text-white flex items-center justify-center shadow-xs shadow-sky-500/25 shrink-0">
            <Calendar className="w-4 h-4 xl:w-4.5 xl:h-4.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-[#00a8e7] block leading-none mb-0.5">
              Weekly Trends
            </span>
            <h3 className="text-xs sm:text-[13px] xl:text-sm 2xl:text-[15px] font-bold text-slate-900 tracking-tight truncate leading-tight">
              Day-wise theft trends
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
              {/* Subtle top-to-bottom blue gradient */}
              <linearGradient id="skyBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#00a8e7" />
              </linearGradient>

              {/* Hover highlight gradient */}
              <linearGradient id="skyBarHover" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7dd3fc" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>

              {/* Peak Bar Gradient */}
              <linearGradient id="skyBarPeak" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00a8e7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Labels */}
            {yTicks.map((tick) => {
              const y = getY(tick);
              const isBase = tick === 0;

              return (
                <g key={`ytick-dow-${tick}`}>
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
              const isHovered = activeDay === item.day;
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
                  key={item.day}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setActiveDay(item.day)}
                  onMouseLeave={() => setActiveDay(null)}
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
                    fill={isHovered ? 'url(#skyBarHover)' : isPeak ? 'url(#skyBarPeak)' : 'url(#skyBarGrad)'}
                    className="transition-all duration-200"
                    filter={isHovered ? 'drop-shadow(0 4px 6px rgba(0, 168, 231, 0.35))' : undefined}
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

                  {/* X-Axis Day Label */}
                  <text
                    x={xCenter}
                    y={chartBottom + 19}
                    textAnchor="middle"
                    className={`text-[11px] font-bold tracking-tight ${isHovered ? 'fill-[#00a8e7] font-extrabold' : 'fill-slate-700'
                      }`}
                    style={{ fontFamily: 'inherit' }}
                  >
                    {item.day}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 3. Bottom Context Sub-bar: Peak Day & Weekend Ratio */}
      <div
        onClick={() => setShowDetailsModal(true)}
        className="px-3.5 py-1.5 sm:px-4 sm:py-2 xl:px-5 xl:py-2.5 bg-sky-50/40 border-t border-sky-100/70 flex items-center justify-between text-[10.5px] sm:text-[11px] xl:text-xs h-7 sm:h-8 xl:h-9 shrink-0 cursor-pointer hover:bg-sky-50/70 transition-colors"
      >
        <span className="truncate mr-2">
          Peak Day:{' '}
          <strong className="text-[#00a8e7] font-bold">{peakDay}</strong> ({peakCount} Thefts ·{' '}
          {peakPercentage}%)
        </span>
        <span className="font-semibold text-slate-500 shrink-0 flex items-center gap-1">
          <TrendingUp className="w-3 h-3 xl:w-3.5 xl:h-3.5 text-[#00a8e7]" />
          Midweek Surge: {midweekSurgeText}
        </span>
      </div>

      {/* 4. Details Modal (Opened via "View Details ->") */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-sky-50 via-sky-50/60 to-white px-4 py-3 border-b border-sky-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#00a8e7] text-white flex items-center justify-center shadow-xs">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Day-wise theft trends - Weekly Trends
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Day-by-day incident volume & weekly risk profile
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

            {/* Modal Content */}
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Weekly Total</span>
                  <span className="text-base font-black text-slate-900">{weeklyTotal}</span>
                </div>
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-2.5">
                  <span className="text-[10px] uppercase font-bold text-[#00a8e7] block">Peak Day</span>
                  <span className="text-sm font-black text-sky-800">{peakDay}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 block">Weekend Thefts</span>
                  <span className="text-sm font-black text-emerald-800">{weekendTheftsDisplay}</span>
                </div>
              </div>

              {/* Day Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-100/80 px-3 py-2 font-bold text-slate-700 grid grid-cols-4">
                  <span>Day</span>
                  <span>Day Type</span>
                  <span className="text-center">Thefts</span>
                  <span className="text-right">% of Week</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {chartData.map((item) => (
                    <div
                      key={item.day}
                      className={`px-3 py-2 grid grid-cols-4 items-center ${item.isPeak ? 'bg-sky-50/60 font-semibold text-sky-950' : 'text-slate-700'
                        }`}
                    >
                      <span className="font-bold flex items-center gap-1.5">
                        {item.fullDay}
                        {item.isPeak && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-700 font-extrabold">
                            Peak
                          </span>
                        )}
                      </span>
                      <span className="text-slate-500">{item.dayType}</span>
                      <span className={`text-center font-bold ${item.isPeak ? 'text-sky-600' : 'text-slate-800'}`}>{item.count}</span>
                      <span className={`text-right ${item.isPeak ? 'text-sky-600 font-bold' : 'text-slate-600'}`}>{item.percentage}%</span>
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
