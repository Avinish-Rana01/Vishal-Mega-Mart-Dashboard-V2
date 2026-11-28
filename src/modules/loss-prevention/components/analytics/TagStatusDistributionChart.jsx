import React, { useState } from 'react';
import { PieChart as PieIcon, Tag, TagX, AlertTriangle, TrendingDown } from 'lucide-react';

export default function TagStatusDistributionChart({
  data = null,
  metrics,
  className = '',
}) {
  const [activeSegment, setActiveSegment] = useState(null);

  const fallbackTotal = data?.total ?? 0;
  const fallbackUntagged = data?.segments?.find((s) => s.id === 'untagged' || s.id === 'checkout')?.count ?? 0;
  const fallbackTheft = data?.segments?.find((s) => s.id === 'theft-alerts' || s.id === 'loss-alerts')?.count ?? 0;

  // Parse numerical values from metrics or fallback to defaults
  const parsedTotal = metrics?.totalTags != null && metrics.totalTags !== '...'
    ? Number(String(metrics.totalTags).replace(/,/g, ''))
    : null;
  const parsedUntagged = (metrics?.checkout != null && metrics.checkout !== '...')
    ? Number(String(metrics.checkout).replace(/,/g, ''))
    : null;
  const parsedLoss = (metrics?.loss != null && metrics.loss !== '...')
    ? Number(String(metrics.loss).replace(/,/g, ''))
    : null;

  const dist = metrics?.tagStatusDistribution;

  const totalNum = dist?.TotalTags != null
    ? Number(dist.TotalTags)
    : (parsedTotal != null ? parsedTotal : fallbackTotal);

  const untaggedNum = dist?.Checkout != null ? Number(dist.Checkout) : dist?.Untagged != null
    ? Number(dist.Untagged)
    : (parsedUntagged != null ? parsedUntagged : fallbackUntagged);

  const theftNum = dist?.Loss != null ? Number(dist.Loss) : dist?.TheftAlerts != null
    ? Number(dist.TheftAlerts)
    : (parsedLoss != null ? parsedLoss : fallbackTheft);

  // Sum of the 3 values for 3-slice proportional calculation
  const valueSum = totalNum + untaggedNum + theftNum;

  // Dynamically calculate exact percentages based on all 3 values (Total Tags, Untagged, Theft Alerts)
  let totalPct = 0;
  let untaggedPct = 0;
  let theftPct = 0;

  if (valueSum > 0) {
    totalPct = Number(((totalNum / valueSum) * 100).toFixed(1));
    untaggedPct = Number(((untaggedNum / valueSum) * 100).toFixed(1));
    theftPct = Math.max(0, Number((100 - totalPct - untaggedPct).toFixed(1)));
  }

  const potentialLossDisplay = metrics?.potentialLoss && metrics.potentialLoss !== '...'
    ? metrics.potentialLoss
    : (dist?.PotentialLossDisplay ? `₹${dist.PotentialLossDisplay}` : '₹4,23,010');

  // 3D Isometric Geometry Parameters
  const cx = 110;
  const cy = 56;
  const rx = 82;
  const ry = 42;
  const depth = 20;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const pt = (deg) => ({
    x: cx + rx * Math.cos(toRad(deg)),
    y: cy + ry * Math.sin(toRad(deg)),
  });

  // Slice configurations for the 3 StatCard data items
  const SLICES = [
    {
      id: 'total-tags',
      label: 'Total Tags',
      sublabel: 'Active & verified in store',
      count: totalNum,
      percentage: totalPct,
      slicePct: totalPct,
      color: '#10b981',
      darkColor: '#047857',
      topGrad: 'url(#emeraldTop3D)',
      sideGrad: 'url(#emeraldSide3D)',
      icon: Tag,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'untagged',
      label: 'Checkout',
      sublabel: 'Tag not removed at POS',
      count: untaggedNum,
      percentage: untaggedPct,
      slicePct: untaggedPct,
      color: '#00a8e7',
      darkColor: '#0284c7',
      topGrad: 'url(#skyTop3D)',
      sideGrad: 'url(#skySide3D)',
      icon: TagX,
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      id: 'theft-alerts',
      label: 'Loss Alerts',
      sublabel: 'Gate scanner alarms',
      count: theftNum,
      percentage: theftPct,
      slicePct: theftPct,
      color: '#f43f5e',
      darkColor: '#be123c',
      topGrad: 'url(#roseTop3D)',
      sideGrad: 'url(#roseSide3D)',
      icon: AlertTriangle,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  ];

  const getFrontRimIntervals = (startDeg, endDeg) => {
    const intervals = [];
    for (let k = -2; k <= 2; k++) {
      const frontStart = k * 360;
      const frontEnd = k * 360 + 180;
      const overlapStart = Math.max(startDeg, frontStart);
      const overlapEnd = Math.min(endDeg, frontEnd);
      if (overlapEnd - overlapStart > 0.1) {
        intervals.push({
          start: overlapStart,
          end: overlapEnd,
        });
      }
    }
    return intervals;
  };

  // Filter slices that have a visible percentage on the pie
  const activePieSlices = SLICES.filter((s) => s.slicePct > 0.5);

  const sliceAngles = {};
  if (activePieSlices.length === 1) {
    const singleSlice = activePieSlices[0];
    sliceAngles[singleSlice.id] = {
      start: 0,
      end: 360,
      sweep: 360,
      mid: 180,
      pullDx: 0,
      pullDy: 8,
    };
  } else if (activePieSlices.length === 2) {
    const smaller = activePieSlices[0].slicePct <= activePieSlices[1].slicePct ? activePieSlices[0] : activePieSlices[1];
    const larger = activePieSlices.find((s) => s.id !== smaller.id);

    const smallSweep = (smaller.slicePct / 100) * 360;
    const largeSweep = 360 - smallSweep;

    const smallStart = 90 - smallSweep / 2;
    const smallEnd = smallStart + smallSweep;
    const smallMid = 90;

    const largeStart = smallEnd;
    const largeEnd = largeStart + largeSweep;
    const largeMid = (largeStart + largeEnd) / 2;

    sliceAngles[smaller.id] = {
      start: smallStart,
      end: smallEnd,
      sweep: smallSweep,
      mid: smallMid,
      pullDx: Math.round(Math.cos(toRad(smallMid)) * 8),
      pullDy: Math.round(Math.sin(toRad(smallMid)) * 7),
    };

    sliceAngles[larger.id] = {
      start: largeStart,
      end: largeEnd,
      sweep: largeSweep,
      mid: largeMid,
      pullDx: Math.round(Math.cos(toRad(largeMid)) * 8),
      pullDy: Math.round(Math.sin(toRad(largeMid)) * 7),
    };
  } else if (activePieSlices.length >= 3) {
    // 3 slices: Green (Total Tags), Blue (Untagged), Red (Theft Alerts)
    // Slices meet in the front-facing arc (around 90 deg) for optimal 3D perspective
    const uSlice = activePieSlices.find((s) => s.id === 'untagged') || activePieSlices[1];
    const tSlice = activePieSlices.find((s) => s.id === 'theft-alerts') || activePieSlices[2];
    const gSlice = activePieSlices.find((s) => s.id === 'total-tags') || activePieSlices[0];

    const uSweep = (uSlice.slicePct / 100) * 360;
    const tSweep = (tSlice.slicePct / 100) * 360;
    const gSweep = 360 - uSweep - tSweep;

    // Untagged is centered on the front-center (90 - uSweep to 90 deg)
    // Red (Theft) goes from 90 deg leftward to 90 + tSweep
    // Green (Total) wraps the rest
    const uStart = 90 - uSweep;
    const uEnd = 90;
    const uMid = (uStart + uEnd) / 2;

    const tStart = 90;
    const tEnd = 90 + tSweep;
    const tMid = (tStart + tEnd) / 2;

    const gStart = tEnd;
    const gEnd = gStart + gSweep;
    const gMid = (gStart + gEnd) / 2;

    sliceAngles[uSlice.id] = {
      start: uStart,
      end: uEnd,
      sweep: uSweep,
      mid: uMid,
      pullDx: Math.round(Math.cos(toRad(uMid)) * 8),
      pullDy: Math.round(Math.sin(toRad(uMid)) * 7),
    };

    sliceAngles[tSlice.id] = {
      start: tStart,
      end: tEnd,
      sweep: tSweep,
      mid: tMid,
      pullDx: Math.round(Math.cos(toRad(tMid)) * 8),
      pullDy: Math.round(Math.sin(toRad(tMid)) * 7),
    };

    sliceAngles[gSlice.id] = {
      start: gStart,
      end: gEnd,
      sweep: gSweep,
      mid: gMid,
      pullDx: Math.round(Math.cos(toRad(gMid)) * 8),
      pullDy: Math.round(Math.sin(toRad(gMid)) * 7),
    };
  }

  const sortedSlices = [...activePieSlices]
    .filter((s) => sliceAngles[s.id] && sliceAngles[s.id].sweep > 0.5)
    .sort((a, b) => {
      const midA = sliceAngles[a.id].mid;
      const midB = sliceAngles[b.id].mid;
      return Math.sin(toRad(midA)) - Math.sin(toRad(midB));
    });

  // Render SVG paths for a slice in 3D
  const render3DSlice = (slice) => {
    if (totalNum === 0 && valueSum === 0) return null;
    const angleInfo = sliceAngles[slice.id];
    if (!angleInfo || angleInfo.sweep <= 0.5) return null;

    const { start, end, sweep, pullDx, pullDy } = angleInfo;
    const isHovered = activeSegment === slice.id;
    const transformStyle = isHovered
      ? `translate(${pullDx}px, ${pullDy}px)`
      : 'translate(0px, 0px)';

    if (sweep >= 359.5) {
      return (
        <g
          key={slice.id}
          className="cursor-pointer transition-transform duration-300 ease-out"
          style={{ transform: transformStyle }}
          onMouseEnter={() => setActiveSegment(slice.id)}
          onMouseLeave={() => setActiveSegment(null)}
        >
          <path
            d={`M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy} L ${cx + rx} ${cy + depth} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy + depth} Z`}
            fill={slice.sideGrad}
          />
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={slice.topGrad} stroke="#ffffff" strokeWidth="0.75" />
        </g>
      );
    }

    const pStart = pt(start);
    const pEnd = pt(end);
    const largeArc = sweep > 180 ? 1 : 0;

    const topPath = `M ${cx} ${cy} L ${pStart.x} ${pStart.y} A ${rx} ${ry} 0 ${largeArc} 1 ${pEnd.x} ${pEnd.y} Z`;
    const wallStart = `M ${cx} ${cy} L ${pStart.x} ${pStart.y} L ${pStart.x} ${pStart.y + depth} L ${cx} ${cy + depth} Z`;
    const wallEnd = `M ${cx} ${cy} L ${pEnd.x} ${pEnd.y} L ${pEnd.x} ${pEnd.y + depth} L ${cx} ${cy + depth} Z`;

    const rimIntervals = getFrontRimIntervals(start, end);

    return (
      <g
        key={slice.id}
        className="cursor-pointer transition-transform duration-300 ease-out"
        style={{
          transform: transformStyle,
          filter: isHovered ? `drop-shadow(0 10px 14px ${slice.color}55)` : 'none',
        }}
        onMouseEnter={() => setActiveSegment(slice.id)}
        onMouseLeave={() => setActiveSegment(null)}
      >
        <path d={wallStart} fill={slice.darkColor || slice.color} opacity="0.82" />
        <path d={wallEnd} fill={slice.darkColor || slice.color} opacity="0.9" />
        {rimIntervals.map((interval, i) => {
          const p1 = pt(interval.start);
          const p2 = pt(interval.end);
          const d = `M ${p1.x} ${p1.y} A ${rx} ${ry} 0 0 1 ${p2.x} ${p2.y} L ${p2.x} ${p2.y + depth} A ${rx} ${ry} 0 0 0 ${p1.x} ${p1.y + depth} Z`;
          return <path key={i} d={d} fill={slice.sideGrad} />;
        })}
        <path d={topPath} fill={slice.topGrad} stroke="#ffffff" strokeWidth="0.75" />
      </g>
    );
  };

  const activeData = SLICES.find((s) => s.id === activeSegment);

  return (
    <div
      className={`bg-white border-2 border-emerald-200/70 rounded-2xl overflow-hidden shadow-xs flex flex-col transition-all hover:shadow-sm min-h-[310px] sm:min-h-[340px] xl:min-h-[385px] 2xl:min-h-[425px] ${className}`}
    >
      {/* 1. Creative Header Banner (Matching DashboardOverview Theme) */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white px-3.5 py-2.5 sm:px-4 sm:py-3 xl:px-5 xl:py-3.5 border-b border-emerald-100 flex items-center justify-between gap-3 shrink-0 h-[56px] sm:h-[60px] xl:h-[64px]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 xl:w-9 xl:h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs shadow-emerald-500/25 shrink-0">
            <PieIcon className="w-4 h-4 xl:w-4.5 xl:h-4.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-emerald-600 block leading-none mb-0.5">
              Incident Tracking
            </span>
            <h3 className="text-xs sm:text-[13px] xl:text-sm 2xl:text-[15px] font-bold text-slate-900 tracking-tight truncate leading-tight">
              Theft Alert Overview
            </h3>
          </div>
        </div>

        {/* Total Tags Badge on Right Side */}
        <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10.5px] sm:text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 shadow-2xs">
          {totalNum.toLocaleString('en-IN')} Total Tags
        </span>
      </div>

      {/* 2. Compact Body: 3D SVG Pie on Left, StatCard Legend on Right */}
      <div className="p-3 sm:p-4 xl:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 xl:gap-6 flex-1 bg-slate-50/20">
        {/* 3D SVG Pie Container with Floating Metric Badge */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <div className="relative w-48 h-34 sm:w-56 sm:h-40 xl:w-68 xl:h-48 2xl:w-80 2xl:h-56 flex items-center justify-center shrink-0">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 220 135"
            >
              <defs>
                {/* Emerald 3D Gradients */}
                <linearGradient id="emeraldTop3D" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="60%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="emeraldSide3D" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>

                {/* Sky 3D Gradients */}
                <linearGradient id="skyTop3D" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="60%" stopColor="#00a8e7" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
                <linearGradient id="skySide3D" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#0369a1" />
                </linearGradient>

                {/* Rose 3D Gradients */}
                <linearGradient id="roseTop3D" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fb7185" />
                  <stop offset="60%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#e11d48" />
                </linearGradient>
                <linearGradient id="roseSide3D" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#e11d48" />
                  <stop offset="100%" stopColor="#9f1239" />
                </linearGradient>

                {/* Filter for realistic 3D cylinder drop shadow */}
                <filter id="shadow3D" x="-20%" y="-20%" width="140%" height="150%">
                  <feGaussianBlur stdDeviation="5" />
                </filter>
              </defs>

              {/* 3D Ambient Drop Shadow under Cylinder */}
              <ellipse
                cx={cx}
                cy={cy + depth + 10}
                rx={rx + 4}
                ry={ry + 2}
                fill="#0f172a"
                opacity="0.14"
                filter="url(#shadow3D)"
              />
              <ellipse
                cx={cx}
                cy={cy + depth + 4}
                rx={rx - 4}
                ry={ry * 0.88}
                fill="#0f172a"
                opacity="0.2"
                filter="url(#shadow3D)"
              />

              {/* Draw 3D Slices: Back slice first, Front slices on top */}
              {totalNum === 0 ? (
                <g>
                  <path
                    d={`M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy} L ${cx + rx} ${cy + depth} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy + depth} Z`}
                    fill="#e2e8f0"
                  />
                  <ellipse
                    cx={cx}
                    cy={cy}
                    rx={rx}
                    ry={ry}
                    fill="#f8fafc"
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                    strokeDasharray="5 3"
                  />
                  <text
                    x={cx}
                    y={cy + 4}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="11"
                    fontWeight="600"
                    letterSpacing="0.02em"
                  >
                    0 Tags Recorded
                  </text>
                </g>
              ) : (
                sortedSlices.map((slice) => render3DSlice(slice))
              )}
            </svg>
          </div>

          {/* Dynamic 3D Focus Indicator */}
          <div className="mt-1 text-center">
            {activeData ? (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-slate-200/90 shadow-2xs text-[10.5px]">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: activeData.color }}
                />
                <span className="font-semibold text-slate-800">
                  {activeData.label}:
                </span>
                <span className="font-bold text-slate-900">
                  {activeData.count.toLocaleString('en-IN')}
                </span>
                <span className="text-slate-500 font-medium">
                  ({activeData.percentage}%)
                </span>
              </div>
            ) : (
              <span className="text-[10.5px] font-semibold text-slate-400">
                {totalNum === 0 ? 'No tag data recorded' : 'Hover slices to inspect 3D layers'}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Exact StatCard Data Items (Clean Compact Rows matching Image 2) */}
        <div className="flex flex-col gap-2 xl:gap-2.5 2xl:gap-3 w-full flex-1 min-w-0">
          {SLICES.map((slice) => {
            const isHovered = activeSegment === slice.id;
            const Icon = slice.icon;

            return (
              <div
                key={slice.id}
                onMouseEnter={() => setActiveSegment(slice.id)}
                onMouseLeave={() => setActiveSegment(null)}
                style={
                  isHovered
                    ? {
                        borderColor: slice.color,
                        boxShadow: `0 0 0 1.5px ${slice.color}60, 0 2px 8px ${slice.color}25`,
                      }
                    : {}
                }
                className={`flex items-center justify-between p-2 sm:p-2.5 xl:p-3 2xl:p-3.5 rounded-xl transition-all border cursor-pointer ${
                  isHovered
                    ? 'bg-white shadow-xs'
                    : 'bg-white/70 border-slate-200/70 hover:bg-white hover:border-slate-300'
                }`}
              >
                {/* Left: Icon + Clean Label matching Image 2 (NO parenthesis clutter) */}
                <div className="flex items-center gap-2 sm:gap-2.5 xl:gap-3 min-w-0">
                  <div
                    className="w-6 h-6 sm:w-7 sm:h-7 xl:w-8 xl:h-8 2xl:w-9 2xl:h-9 rounded-lg flex items-center justify-center shrink-0 shadow-2xs"
                    style={{ backgroundColor: `${slice.color}18`, color: slice.color }}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 xl:w-4.5 xl:h-4.5" />
                  </div>
                  <span className="text-xs sm:text-[13px] xl:text-sm 2xl:text-[14.5px] font-bold text-slate-900 truncate">
                    {slice.label}
                  </span>
                </div>

                {/* Right: Count & Percentage Only (NO loss amount here) */}
                <div className="flex items-center gap-1.5 text-xs shrink-0 text-right">
                  <span className="font-bold text-slate-900 text-xs sm:text-[13px] xl:text-sm 2xl:text-base">
                    {slice.count.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Context Sub-bar: Potential Loss shown ONLY here */}
      <div className="px-3.5 py-1.5 sm:px-4 sm:py-2 xl:px-5 xl:py-2.5 bg-emerald-50/40 border-t border-emerald-100/70 flex items-center justify-between text-[10.5px] sm:text-[11px] xl:text-xs h-7 sm:h-8 xl:h-9 shrink-0 cursor-pointer">
        <span className="truncate mr-2">
          Total Tags: <strong className="text-emerald-700 font-bold">{totalNum.toLocaleString('en-IN')}</strong>
        </span>
        <span className="font-semibold text-rose-600 shrink-0 flex items-center gap-1">
          <TrendingDown className="w-3 h-3 xl:w-3.5 xl:h-3.5" />
          Potential Loss: {potentialLossDisplay}
        </span>
      </div>
    </div>
  );
}
