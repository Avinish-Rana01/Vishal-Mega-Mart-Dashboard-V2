import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Search, ClipboardList, Calendar, Clock, Hourglass, Filter, Download } from 'lucide-react';
import KpiCard2 from '../../../components/charts/KpiCard2';
import LiveTickerValue from '../../../components/common/LiveTickerValue';
import SectionHeader, { DateBadge } from '../../../components/common/SectionHeader';
import DashboardShimmer from '../../../components/common/DashboardShimmer';
import DashboardDataGrid from '../../../components/charts/DashboardDataGrid';
import CycleCountModal from '../../../components/modals/CycleCountModal';
import BaseDataTable from '../../../components/common/BaseDataTable';
import CustomDropdown from '../../../components/common/CustomDropdown';
import { SearchEmptyState, GlobalEmptyState } from '../../../components/common/ChartEmptyState';
import ChartToolbar from '../../../components/common/ChartToolbar';
import ChartSearchInput from '../../../components/common/ChartSearchInput';
import { useCycleCount } from '../../../hooks/useDashboardData';
import { useCycleCountMetrics } from '../../../hooks/useCycleCountMetrics';
import { useIsInViewport } from '../../../hooks/useIsInViewport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell, ComposedChart, Line, ReferenceLine } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import '../../../components/charts/DashboardSection.css';
import './common.css';
import './CycleCountSection.css';
import { saveDashboardReturnPoint, useSessionState } from '../../../utils/dashboardNavigationMemory';

const VIEW_OPTIONS = [
  { value: 'store', label: 'Audit Duration by Store' },
  { value: 'distribution', label: 'Duration Distribution by store' },
  { value: 'info', label: 'Cycle Count Info by store' }
];

const SORT_OPTIONS = [
  { value: 'DURATION_DESC', label: 'Duration (Longest first)' },
  { value: 'DURATION_ASC', label: 'Duration (Shortest first)' },
  { value: 'STORE_ASC', label: 'Store Code (A-Z)' }
];

const TABLE_SORT_OPTIONS = [
  { value: 'latest', label: 'Latest 5' },
  { value: 'longest', label: 'Longest 5' },
  { value: 'fastest', label: 'Fastest 5' }
];

// ---- Custom Tooltip for the Duration Bar Chart ----
function DurationTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="cc-card" style={{ padding: '14px 18px', minWidth: '200px', background: '#fff', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0' }}>
      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{d.STORE_NAME || d.STORE_CODE}</span>
        {d.STORE_CODE && d.STORE_CODE !== d.STORE_NAME && (
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{d.STORE_CODE}</span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: '12px', color: '#475569' }}>
        <span style={{ color: '#94a3b8' }}>Date</span>       <span style={{ fontWeight: 600 }}>{d.formattedDate}</span>
        <span style={{ color: '#94a3b8' }}>Type</span>       <span style={{ fontWeight: 600 }}>{d.CYCLE_COUNT_TYPE || '—'}</span>
        <span style={{ color: '#94a3b8' }}>Start</span>      <span style={{ fontWeight: 600 }}>{d.Start_DateTime || '—'}</span>
        <span style={{ color: '#94a3b8' }}>End</span>        <span style={{ fontWeight: 600 }}>{d.END_DateTime || '—'}</span>
        <span style={{ color: '#94a3b8' }}>Duration</span>   <span style={{ fontWeight: 700, color: '#0f172a' }}>{d.rawDuration}</span>
      </div>
    </div>
  );
}

// ---- Memoized Chart Component ----
const MemoizedChart = React.memo(({ chartData, chartHeight, onBarClick, highlightedRow }) => {
  const [ref, hasBeenVisible] = useIsInViewport();
  return (
    <div ref={ref} style={{ width: '100%', minHeight: chartHeight }}>
      {hasBeenVisible && (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 80, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#e2e8f0" />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              unit="m"
            />
            <YAxis
              dataKey="STORE_CODE"
              type="category"
              tick={{ fontSize: 12, fill: '#0f172a', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip
              content={<DurationTooltip />}
              cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
            />
            <Bar dataKey="durationMins" radius={[0, 4, 4, 0]} maxBarSize={20} fill="#3b82f6" isAnimationActive={true} onClick={(data) => onBarClick && onBarClick(data.payload || data)} style={{ cursor: 'pointer' }}>
              {chartData.map((entry, index) => {
                const isHighlighted = highlightedRow && (
                  String(highlightedRow).toUpperCase() === String(entry.STORE_CODE || '').toUpperCase() ||
                  String(highlightedRow) === String(entry.REF_NO || '')
                );
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    className={isHighlighted ? 'bar-updated-pulse' : ''}
                  />
                );
              })}
              <LabelList
                dataKey="rawDuration"
                position="right"
                style={{ fontSize: '12px', fontWeight: 600, fill: '#334155' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
});

// ---- Memoized Distribution Chart Component ----
const MemoizedDistributionChart = React.memo(({ distributionData }) => {
  const [ref, hasBeenVisible] = useIsInViewport();
  return (
    <div ref={ref} style={{ height: '230px', width: '100%', paddingTop: '8px' }}>
      {hasBeenVisible && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distributionData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }} barSize={45}>
            <defs>
              <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                <stop offset="100%" stopColor="#059669" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" stopOpacity={1} />
                <stop offset="100%" stopColor="#dc2626" stopOpacity={1} />
              </linearGradient>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.1" />
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} allowDecimals={false} />
            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" filter="url(#shadow)">
              {distributionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList dataKey="count" position="top" style={{ fill: '#1e293b', fontWeight: 800, fontSize: 16 }} offset={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
});

// ---- Custom Tooltip for Cycle Info Chart ----
function CycleInfoTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;

  const sys = Number(d.SYSTEM_STOCK || 0);
  const scn = Number(d.SCANNED_QTY || 0);
  const netDiff = Number(d.NET_DIFFERENCE || 0);
  const accuracy = sys > 0 ? Math.min(100, (scn / sys) * 100) : (scn === 0 ? 100 : 0);
  const netColor = netDiff > 0 ? '#10B981' : netDiff < 0 ? '#EF5350' : '#64748b';
  const accColor = accuracy >= 95 ? '#10B981' : accuracy >= 80 ? '#3B82F6' : '#EF5350';

  return (
    <div className="cc-info-tooltip">
      <div className="cc-info-tooltip-head">
        <span>{d.STORE_NAME || d.STORE_CODE}</span>
        {d.STORE_CODE && (
          <span className="cc-info-tooltip-code">{d.STORE_CODE}</span>
        )}
      </div>

      <div className="cc-info-tooltip-kpis">
        <div className="cc-info-tooltip-kpi">
          <span>System</span>
          <strong style={{ color: '#1E40AF' }}>{sys.toLocaleString('en-IN')}</strong>
        </div>
        <div className="cc-info-tooltip-kpi">
          <span>Scanned</span>
          <strong style={{ color: '#60A5FA' }}>{scn.toLocaleString('en-IN')}</strong>
        </div>
        <div className="cc-info-tooltip-kpi">
          <span>Accuracy</span>
          <strong style={{ color: accColor }}>{accuracy.toFixed(1)}%</strong>
        </div>
      </div>

      <div className="cc-info-tooltip-grid">
        <span>Articles</span><strong>{(d.NO_OF_ARTICLES || 0).toLocaleString('en-IN')}</strong>
        <span>Net Diff</span><strong style={{ color: netColor }}>{netDiff > 0 ? '+' : ''}{netDiff.toLocaleString('en-IN')}</strong>
        <span>Short Qty</span><strong style={{ color: '#EF5350' }}>{Math.abs(d.SHORT_QTY || 0).toLocaleString('en-IN')}</strong>
        <span>Excess Qty</span><strong style={{ color: '#10B981' }}>{(d.EXCESS_QTY || 0).toLocaleString('en-IN')}</strong>
        <span>Duration</span><strong>{d.rawDuration || '—'}</strong>
      </div>
    </div>
  );
}

// ---- Left Chart: System vs Scanned ----
const CycleCountStockChart = React.memo(({ chartData, chartHeight, onBarClick, highlightedRow }) => {
  return (
    <div className="cc-stock-split-body" style={{ height: chartHeight }}>
      <div className="cc-stock-bars-wrap">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartData} layout="vertical" barGap={2} barCategoryGap="22%" margin={{ top: 4, right: 44, left: 0, bottom: 2 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 10.5, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis
              dataKey="STORE_CODE"
              type="category"
              tick={{ fontSize: 12, fill: '#0f172a', fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<CycleInfoTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.7)' }} />
            <Bar dataKey="SYSTEM_STOCK" barSize={15} fill="#3B82F6" radius={[0, 3, 3, 0]} isAnimationActive={false} onClick={(data) => onBarClick && onBarClick(data.payload || data)} style={{ cursor: 'pointer' }}>
              {chartData.map((entry, index) => {
                const isHighlighted = highlightedRow && (
                  String(highlightedRow).toUpperCase() === String(entry.STORE_CODE || '').toUpperCase() ||
                  String(highlightedRow) === String(entry.REF_NO || '')
                );
                return (
                  <Cell key={`sys-${index}`} className={isHighlighted ? 'bar-updated-pulse' : ''} />
                );
              })}
              <LabelList
                dataKey="SYSTEM_STOCK"
                position="right"
                fill="#3B82F6"
                fontSize={11}
                fontWeight={700}
                formatter={(v) => Number(v || 0).toLocaleString('en-IN')}
              />
            </Bar>
            <Bar dataKey="SCANNED_QTY" barSize={15} fill="#93C5FD" radius={[0, 3, 3, 0]} isAnimationActive={false} onClick={(data) => onBarClick && onBarClick(data.payload || data)} style={{ cursor: 'pointer' }}>
              <LabelList
                dataKey="SCANNED_QTY"
                position="right"
                fill="#60A5FA"
                fontSize={11}
                fontWeight={700}
                formatter={(v) => Number(v || 0).toLocaleString('en-IN')}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Right-aligned Accuracy & Net Variance Indicator Strip per Store */}
      <div className="cc-stock-accuracy-col">
        {chartData.map((d, i) => {
          const sys = Number(d.SYSTEM_STOCK || 0);
          const scn = Number(d.SCANNED_QTY || 0);
          const net = Number(d.NET_DIFFERENCE || 0);
          const pct = sys > 0 ? Math.min(100, (scn / sys) * 100) : (scn === 0 ? 100 : 0);
          const tier = pct >= 95 ? 'green' : pct >= 85 ? 'blue' : 'red';
          const isHighlighted = highlightedRow && (
            String(highlightedRow).toUpperCase() === String(d.STORE_CODE || '').toUpperCase() ||
            String(highlightedRow) === String(d.REF_NO || '')
          );
          return (
            <button
              key={d.STORE_CODE || i}
              type="button"
              className={`cc-stock-acc-row${isHighlighted ? ' row-updated-pulse' : ''}`}
              onClick={() => onBarClick && onBarClick(d)}
              title={`${d.STORE_NAME || d.STORE_CODE}: ${pct.toFixed(1)}% scanned (${net > 0 ? '+' : ''}${net} net)`}
            >
              <span className={`cc-stock-acc-pill cc-stock-acc-pill--${tier}`}>
                {pct.toFixed(0)}%
              </span>
              <span className={`cc-stock-net-tag ${net < 0 ? 'is-neg' : net > 0 ? 'is-pos' : 'is-zero'}`}>
                {net === 0 ? 'Exact' : `${net > 0 ? '+' : ''}${net}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

// ---- Flex-based Net Difference Badge Column (scrolls with chart) ----
const NetDifferenceBadgeColumn = ({ chartData, highlightedRow }) => {
  return (
    <div style={{ width: '75px', display: 'flex', flexDirection: 'column', pointerEvents: 'none', flexShrink: 0 }}>
      {chartData.map((d, i) => {
        const netDiff = Number(d.NET_DIFFERENCE || 0);
        const isHighlighted = highlightedRow && (
          String(highlightedRow).toUpperCase() === String(d.STORE_CODE || '').toUpperCase() ||
          String(highlightedRow) === String(d.REF_NO || '')
        );

        let bgColor, textColor, icon;
        if (netDiff > 0) { bgColor = '#00ff592b'; textColor = '#16a34a'; icon = '↑'; }
        else if (netDiff < 0) { bgColor = '#fee2e2'; textColor = '#dc2626'; icon = '↓'; }
        else { bgColor = '#f1f5f9'; textColor = '#64748b'; icon = '-'; }

        return (
          <div key={d.STORE_CODE || i} style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}>
            <div 
              className={isHighlighted ? 'row-updated-pulse' : ''}
              style={{
                backgroundColor: bgColor,
                color: textColor,
                borderRadius: '6px',
                padding: '2px 7px',
                fontSize: '12px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                lineHeight: '20px',
                minWidth: '48px',
                textAlign: 'center',
              }}>
              {netDiff > 0 ? '+' : ''}{netDiff}
            </div>
            <span style={{ color: textColor, fontSize: '13px', fontWeight: 700 }}>{icon}</span>
          </div>
        );
      })}
    </div>
  );
};

// ---- Custom Labels for Recharts Stock Variance Bars ----
const CustomVarianceLabel = (props) => {
  const { x, y, width, height, value, fill } = props;
  const displayVal = value > 0 ? value : '—';

  return (
    <text x={x + width + 6} y={y + height / 2} dy={4} fill={value > 0 ? fill : '#94a3b8'} fontSize={11} fontWeight={600} textAnchor="start">
      {displayVal}
    </text>
  );
};

// ---- Right Chart: Stock Variance (Recharts Stacked Implementation) ----
const CycleCountVarianceChart = React.memo(({ chartData, chartHeight, onBarClick, highlightedRow }) => {
  const maxShort = Math.max(0, ...chartData.map(d => Math.abs(Number(d.SHORT_QTY || 0))));
  const maxExcess = Math.max(0, ...chartData.map(d => Number(d.EXCESS_QTY || 0)));

  const mappedData = useMemo(() => {
    return chartData.map(d => {
      const shortQty = Math.abs(Number(d.SHORT_QTY || 0));
      const excessQty = Number(d.EXCESS_QTY || 0);

      const shortBar = maxShort > 0 ? (shortQty / maxShort) * 35 : 0;
      const excessBar = maxExcess > 0 ? (excessQty / maxExcess) * 25 : 0;

      const finalShort = shortQty > 0 ? Math.max(shortBar, 1) : 0;
      const finalExcess = excessQty > 0 ? Math.max(excessBar, 1) : 0;

      return {
        ...d,
        SHORT_BG: 40,
        SPACER_BG: 5,
        EXCESS_BG: 30,
        SHORT_BAR: finalShort,
        SHORT_VAL: shortQty,
        SPACER_FG: 45 - finalShort,
        EXCESS_BAR: finalExcess,
        EXCESS_VAL: excessQty,
      };
    });
  }, [chartData, maxShort, maxExcess]);

  return (
    <div style={{ display: 'flex', height: chartHeight }}>
      {/* Chart layers (BG + FG) */}
      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        {/* Background Layer (Gray Tracks) */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mappedData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <XAxis type="number" hide domain={[0, 100]} />
              <YAxis dataKey="STORE_CODE" type="category" tick={{ fontSize: 12, fill: 'transparent', fontWeight: 600 }} axisLine={false} tickLine={false} width={60} />
              <Bar dataKey="SHORT_BG" stackId="a" barSize={14} fill="#f1f5f9" radius={4} isAnimationActive={false} />
              <Bar dataKey="SPACER_BG" stackId="a" fill="transparent" isAnimationActive={false} />
              <Bar dataKey="EXCESS_BG" stackId="a" barSize={14} fill="#f1f5f9" radius={4} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Foreground Layer (Interactive Bars & Tooltip) */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mappedData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <XAxis type="number" hide domain={[0, 100]} />
              <YAxis dataKey="STORE_CODE" type="category" tick={{ fontSize: 12, fill: '#0f172a', fontWeight: 600 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<CycleInfoTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
              <Bar dataKey="SHORT_BAR" stackId="a" barSize={14} fill="#ef4444" radius={4} isAnimationActive={false} onClick={(data) => onBarClick && onBarClick(data.payload || data)} style={{ cursor: 'pointer' }}>
                <LabelList dataKey="SHORT_VAL" content={<CustomVarianceLabel fill="#ef4444" />} />
              </Bar>
              <Bar dataKey="SPACER_FG" stackId="a" fill="transparent" isAnimationActive={false} />
              <Bar dataKey="EXCESS_BAR" stackId="a" barSize={14} fill="#10b981" radius={4} isAnimationActive={false} onClick={(data) => onBarClick && onBarClick(data.payload || data)} style={{ cursor: 'pointer' }}>
                <LabelList dataKey="EXCESS_VAL" content={<CustomVarianceLabel fill="#10b981" />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Net Difference Badge Column — in normal flow, scrolls with chart */}
      <NetDifferenceBadgeColumn chartData={chartData} highlightedRow={highlightedRow} />
    </div>
  );
});

// ---- Split Layout Wrapper (Now a Tabbed Carousel) ----
const MemoizedCycleSplitCharts = React.memo(({ chartData, chartHeight, activeTab, onBarClick, highlightedRow }) => {
  const { totalSystem, totalScanned, totalNet, overallAccuracy } = useMemo(() => {
    const sys = chartData.reduce((acc, r) => acc + Number(r.SYSTEM_STOCK || 0), 0);
    const scn = chartData.reduce((acc, r) => acc + Number(r.SCANNED_QTY || 0), 0);
    const net = chartData.reduce((acc, r) => acc + Number(r.NET_DIFFERENCE || 0), 0);
    const pct = sys > 0 ? Math.min(100, (scn / sys) * 100) : 0;
    return { totalSystem: sys, totalScanned: scn, totalNet: net, overallAccuracy: pct };
  }, [chartData]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'system' ? (
            <motion.div
              key="system"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{ minWidth: 0 }}
            >
              <div className="cc-info-summary-strip">
                <div className="cc-info-totals-chips">
                  <span className="cc-info-chip cc-info-chip--blue">
                    <span className="cc-info-dot cc-info-dot--blue" />
                    <span>System:</span>
                    <strong>{totalSystem.toLocaleString('en-IN')}</strong>
                  </span>
                  <span className="cc-info-chip cc-info-chip--sky">
                    <span className="cc-info-dot cc-info-dot--sky" />
                    <span>Scanned:</span>
                    <strong>{totalScanned.toLocaleString('en-IN')}</strong>
                  </span>
                  <span className="cc-info-chip cc-info-chip--slate">
                    <span>Match:</span>
                    <strong>{overallAccuracy.toFixed(1)}%</strong>
                  </span>
                  <span className={`cc-info-chip ${totalNet < 0 ? 'cc-info-chip--red' : 'cc-info-chip--green'}`}>
                    <span>Net:</span>
                    <strong>{totalNet > 0 ? '+' : ''}{totalNet.toLocaleString('en-IN')}</strong>
                  </span>
                </div>
                <span className="cc-info-col-hint">Accuracy / Net</span>
              </div>
              <CycleCountStockChart
                chartData={chartData}
                chartHeight={chartHeight}
                onBarClick={onBarClick}
                highlightedRow={highlightedRow}
              />
            </motion.div>
          ) : (
            <motion.div
              key="variance"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{ minWidth: 0 }}
            >
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginBottom: '4px', paddingRight: '16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }}></span>
                    Short Qty
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                    Excess Qty
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }}></span>
                    Net
                  </span>
                </div>
              </div>
              <CycleCountVarianceChart chartData={chartData} chartHeight={chartHeight} onBarClick={onBarClick} highlightedRow={highlightedRow} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

// ---- Main Component ----
export default function CycleCountSection() {
  const navigate = useNavigate();
  const { data: realData, isLoading, isRefreshing, error, refresh, highlightedRow, connectionStatus } = useCycleCount();
  const data = realData;
  const metrics = useCycleCountMetrics(data);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [searchFilter, setSearchFilter] = useSessionState('cc_search_filter', '');
  const [sortBy, setSortBy] = useSessionState('cc_sort_by', 'DURATION_DESC');
  const [tableSort, setTableSort] = useSessionState('cc_table_sort', 'latest');
  const [chartView, setChartView] = useSessionState('cc_chart_view', 'info');
  const [infoTab, setInfoTab] = useSessionState('cc_info_tab', 'system');

  // Single source of filtered data for both chart and table
  const filteredData = useMemo(() => {
    if (!metrics.parsedData || metrics.parsedData.length === 0) return [];
    if (!searchFilter.trim()) return metrics.parsedData;
    const term = searchFilter.toLowerCase();
    return metrics.parsedData.filter(row =>
      (row.STORE_CODE && row.STORE_CODE.toLowerCase().includes(term)) ||
      (row.STORE_NAME && row.STORE_NAME.toLowerCase().includes(term)) ||
      (row.REF_NO && row.REF_NO.toLowerCase().includes(term))
    );
  }, [metrics.parsedData, searchFilter]);

  // Chart data: filter valid durations, apply sorting
  const chartData = useMemo(() => {
    let result = [...filteredData].filter(r => r.durationMins !== null);

    if (sortBy === 'DURATION_DESC') {
      result.sort((a, b) => b.durationMins - a.durationMins);
    } else if (sortBy === 'DURATION_ASC') {
      result.sort((a, b) => a.durationMins - b.durationMins);
    } else if (sortBy === 'STORE_ASC') {
      result.sort((a, b) => (a.STORE_CODE || '').localeCompare(b.STORE_CODE || ''));
    }

    return result;
  }, [filteredData, sortBy]);

  // Distribution data: categorize durations into 3 buckets (ignores search/sort)
  const distributionData = useMemo(() => {
    let under2 = 0;
    let between2and4 = 0;
    let over4 = 0;

    (metrics.parsedData || []).forEach(row => {
      if (row.durationMins == null) return;
      if (row.durationMins < 2 * 60) under2++;
      else if (row.durationMins <= 4 * 60) between2and4++;
      else over4++;
    });

    return [
      { name: '< 2 Hours', count: under2, fill: 'url(#colorGreen)' },
      { name: '2 - 4 Hours', count: between2and4, fill: 'url(#colorBlue)' },
      { name: '> 4 Hours', count: over4, fill: 'url(#colorRed)' }
    ];
  }, [metrics.parsedData]);

  // Table data: top 5 based on selected sort (ignores search filter)
  const tableData = useMemo(() => {
    let sortedData = [...metrics.parsedData];

    if (tableSort === 'latest') {
      sortedData.sort((a, b) => {
        const dateA = new Date(`${a.DATE}T${a.END_DateTime || '00:00:00'}`);
        const dateB = new Date(`${b.DATE}T${b.END_DateTime || '00:00:00'}`);
        return dateB - dateA;
      });
    } else if (tableSort === 'longest') {
      sortedData.sort((a, b) => (b.durationMins || 0) - (a.durationMins || 0));
    } else if (tableSort === 'fastest') {
      sortedData.sort((a, b) => {
        const valA = a.durationMins != null ? a.durationMins : Infinity;
        const valB = b.durationMins != null ? b.durationMins : Infinity;
        return valA - valB;
      });
    }

    return sortedData.slice(0, 5);
  }, [metrics.parsedData, tableSort]);

  const chartHeight = chartView === 'store'
    ? Math.max(250, chartData.length * 30)
    : Math.max(280, chartData.length * 48);



  const handleRowClick = (row) => {
    setSelectedRowData(row);
    setIsModalOpen(true);
  };

  // ---- Loading State ----
  if (isLoading) return <DashboardShimmer title="Cycle Count" />;

  // ---- Error State ----
  // if (error) {
  //   return (
  //     <div className="cc-container">
  //       <div className="cc-error">Unable to load cycle count data. Please check your connection and try again.</div>
  //     </div>
  //   );
  // }

  // ---- Empty State ----
  if (!metrics.parsedData || metrics.parsedData.length === 0) {
    return (
      <div className="cc-container">
        <SectionHeader
          title="Cycle Count"
          subtitle="Real-time progress and duration of store cycle counts"
          icon={<ClipboardList size={44} color="#3b82f6" strokeWidth={2.2} />}
          rightContent={<DateBadge />}
        />
        <div className="cc-card">
          <div className="cc-empty">
            <ClipboardList size={40} />
            <p>No cycle count data is currently available.</p>
          </div>
        </div>
      </div>
    );
  }

  // ---- Main Render ----
  return (
    <div className="cc-container">

      {/* HEADER — same structure as LiveStock */}
      <SectionHeader
        title="Cycle Count"
        subtitle="Real-time progress and duration of store cycle counts"
        icon={<ClipboardList size={44} color="#3b82f6" strokeWidth={2.2} />}
        rightContent={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className={`live-sync-pill ${connectionStatus || 'connecting'}`} title={`Real-time sync: ${connectionStatus}`}>
              <span className="live-sync-dot"></span>
              {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </div>
            <DateBadge />
          </div>
        }
      />

      {/* KPI ROW — 4 cards */}
      <div className="cc-kpi-row">
        <KpiCard2
          title="Stores Reported"
          value={<LiveTickerValue value={metrics.storesReported || 0} />}
          subtext="In current view"
          icon={<ClipboardList />}
        />
        <KpiCard2
          title="Counted Today"
          value={<LiveTickerValue value={metrics.todayCount || 0} />}
          subtext="Audits completed today"
          icon={<Calendar />}
        />
        <KpiCard2
          title="Avg Duration"
          value={metrics.avgDurationFormatted}
          subtext="Across reported stores"
          icon={<Clock />}
        />
        <KpiCard2
          title="Longest Audit"
          value={metrics.slowestDurationFormatted}
          subtext={metrics.slowestStore}
          icon={<Hourglass />}
        />
        <KpiCard2
          title="In Progress"
          value={<LiveTickerValue value={metrics.inProgressCount || 0} />}
          subtext="Audits missing end time"
          icon={<Hourglass />}
        />
      </div>

      {/* SPLIT LAYOUT FOR CHART AND TABLE */}
      <div className="cc-split-layout">
        {/* DURATION BAR CHART */}
        <div className="cc-card">

        <ChartToolbar
          leftContent={
            <CustomDropdown
              options={VIEW_OPTIONS}
              value={chartView}
              onChange={(val) => setChartView(val)}
              buttonStyle={{ backgroundColor: 'transparent', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%231e3a8a\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundPosition: 'right 4px center', border: 'none', paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: '18px', fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit', boxShadow: 'none', textTransform: 'uppercase' }}
              menuStyle={{ left: 0, right: 'auto', minWidth: '260px', textTransform: 'none' }}
            />
          }
          rightContent={
            <>
              {chartView === 'info' && (
                <CustomDropdown
                  options={[
                    { value: 'system', label: 'System vs Scanned' },
                    { value: 'variance', label: 'Stock Variance' }
                  ]}
                  value={infoTab}
                  onChange={(val) => setInfoTab(val)}
                  prefix="View:"
                  buttonStyle={{ minWidth: 'auto', gap: '8px' }}
                  menuStyle={{ left: 'auto', right: 0, minWidth: '220px' }}
                />
              )}
              {chartView === 'store' && (
                <>
                  <CustomDropdown
                    options={SORT_OPTIONS}
                    value={sortBy}
                    onChange={(val) => setSortBy(val)}
                    prefix="Sort:"
                    buttonStyle={{ justifyContent: 'space-between' }}
                    menuStyle={{ left: 'auto', right: 0, minWidth: '150px' }}
                  />
                  <ChartSearchInput
                    value={searchFilter}
                    onChange={setSearchFilter}
                    onClear={() => setSearchFilter('')}
                  />
                </>
              )}
            </>
          }
        />

        {/* Chart */}
        <div
          className="cc-chart-scroll"
          style={chartView === 'distribution' ? { overflow: 'hidden' } : undefined}
        >
          {chartView === 'store' ? (
            chartData.length === 0 ? (
              <SearchEmptyState 
                searchFilter={searchFilter}
                title={`No Cycle Count Records Found for "${searchFilter}"`}
                subtitle="Try a different search term or clear your filters."
                onClearSearch={() => setSearchFilter('')}
              />
            ) : (
              <MemoizedChart chartData={chartData} chartHeight={chartHeight} onBarClick={handleRowClick} highlightedRow={highlightedRow} />
            )
          ) : chartView === 'distribution' ? (
            <MemoizedDistributionChart distributionData={distributionData} />
          ) : (
            <MemoizedCycleSplitCharts chartData={chartData} chartHeight={chartHeight} activeTab={infoTab} onBarClick={handleRowClick} highlightedRow={highlightedRow} />
          )}
        </div>
      </div>


      {/* NATIVE TABLE / DATA GRID */}
      <DashboardDataGrid
        title="ALL CYCLE COUNTS"
        subtitle={
          <span className="hide-on-mobile">
            {`${tableData.length} records`}
          </span>
        }
        headerAction={
          <CustomDropdown
            options={TABLE_SORT_OPTIONS}
            value={tableSort}
            onChange={(val) => setTableSort(val)}
            prefix="Sort:"
            buttonStyle={{ minWidth: 'auto', gap: '8px' }}
            menuStyle={{ left: 'auto', right: 0, minWidth: '150px' }}
          />
        }
        headers={[
          'Store Code', 'Type', 'Ref No', 'Date', 'Start Time', 'End Time', 'Duration'
        ]}
        data={tableData}
        tableClassName="cycle-count-grid-table"
        innerWrapperStyle={{ minWidth: 'auto', width: '100%' }}
        tableStyle={{ width: '100%', tableLayout: 'auto' }}
        emptyStateContent={
          <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <td colSpan={7} className="cc-data-grid-empty-cell">
              No cycle counts found
            </td>
          </motion.tr>
        }
        renderRow={(row) => {
          const isRowHighlighted = highlightedRow && (
            String(highlightedRow).toUpperCase() === String(row.STORE_CODE || '').toUpperCase() ||
            String(highlightedRow) === String(row.REF_NO || '')
          );
          return (
            <motion.tr
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
              key={row.REF_NO || row.STORE_CODE}
              className={`cc-data-grid-tr ${isRowHighlighted ? 'row-updated-pulse' : ''}`}
            >
            <td className="cc-data-grid-td cc-data-grid-td-bold">
              <div 
                className="cc-row-tooltip-wrapper cc-clickable-cell"
                style={{ color: '#2563eb' }}
                onClick={() => {
                  saveDashboardReturnPoint('cycle_count');
                  navigate('/reports/cycle-count', { state: { storeCode: row.STORE_CODE, date: row.DATE } });
                }}
              >
                {row.STORE_CODE || '—'}
                {row.STORE_NAME && (
                  <div className="cc-row-tooltip">
                    {row.STORE_NAME}
                  </div>
                )}
              </div>
            </td>
            <td className="cc-data-grid-td">
              {row.CYCLE_COUNT_TYPE === 'TA' ? 'Article Level' :
                row.CYCLE_COUNT_TYPE === 'MC' ? 'MC Level' :
                  (row.CYCLE_COUNT_TYPE || '—')}
            </td>
            <td className="cc-data-grid-td">
              <span 
                className="cc-data-grid-ref-link cc-clickable-cell"
                style={{ color: '#2563eb' }}
                onClick={() => handleRowClick(row)}
              >
                {row.REF_NO || '—'}
              </span>
            </td>
            <td className="cc-data-grid-td">{row.formattedDate || '—'}</td>
            <td className="cc-data-grid-td">{row.Start_DateTime || '—'}</td>
            <td className="cc-data-grid-td">{row.END_DateTime || '—'}</td>
            <td className="cc-data-grid-td">{row.rawDuration || '—'}</td>
          </motion.tr>
        );
      }}
      />
      </div>

      {/* Modal */}
      {isModalOpen && (
        <CycleCountModal
          modalData={selectedRowData}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}





