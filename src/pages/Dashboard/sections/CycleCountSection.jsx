import React, { useState, useMemo, useRef } from 'react';
import { RefreshCw, Search, ClipboardList, Calendar, Clock, Hourglass, Filter, Download } from 'lucide-react';
import KpiCard2 from '../../../components/charts/KpiCard2';
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
const MemoizedChart = React.memo(({ chartData, chartHeight }) => {
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
            <Bar dataKey="durationMins" radius={[0, 4, 4, 0]} maxBarSize={20} fill="#ff8800ff" isAnimationActive={true}>
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
    <div ref={ref} style={{ height: '280px', width: '100%', paddingTop: '20px' }}>
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

  const netDiff = d.NET_DIFFERENCE || 0;
  const netColor = netDiff > 0 ? '#10b981' : netDiff < 0 ? '#ef4444' : '#64748b';

  return (
    <div className="cc-card" style={{ padding: '8px 12px', minWidth: '180px', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
      <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '6px', fontSize: '13px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{d.STORE_NAME || d.STORE_CODE}</span>
        {d.STORE_CODE && d.STORE_CODE !== d.STORE_NAME && (
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{d.STORE_CODE}</span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 12px', fontSize: '11px', color: '#475569' }}>
        <span style={{ color: '#64748b' }}>Articles</span>       <span style={{ fontWeight: 700, color: '#0f172a' }}>{d.NO_OF_ARTICLES || 0}</span>
        <span style={{ color: '#64748b' }}>Difference</span>     <span style={{ fontWeight: 700, color: netColor }}>{netDiff > 0 ? '+' : ''}{netDiff}</span>
        <span style={{ color: '#64748b' }}>Short Qty</span>      <span style={{ fontWeight: 700, color: '#f97316' }}>{Math.abs(d.SHORT_QTY || 0)}</span>
        <span style={{ color: '#64748b' }}>Excess Qty</span>     <span style={{ fontWeight: 700, color: '#10b981' }}>{d.EXCESS_QTY || 0}</span>
      </div>
    </div>
  );
}

// ---- Left Chart: System vs Scanned ----
const CycleCountStockChart = React.memo(({ chartData, chartHeight }) => {
  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 15, right: 40, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#e2e8f0" />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis
          dataKey="STORE_CODE"
          type="category"
          tick={{ fontSize: 12, fill: '#0f172a', fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
          width={50}
        />
        <Tooltip content={<CycleInfoTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
        <Bar dataKey="SYSTEM_STOCK" barSize={12} fill="#3b82f6" radius={[4, 4, 4, 4]} isAnimationActive={false}>
          <LabelList dataKey="SYSTEM_STOCK" position="right" fill="#3b82f6" fontSize={11} fontWeight={600} />
        </Bar>
        <Bar dataKey="SCANNED_QTY" barSize={12} fill="#10b981" radius={[4, 4, 4, 4]} isAnimationActive={false}>
          <LabelList dataKey="SCANNED_QTY" position="right" fill="#10b981" fontSize={11} fontWeight={600} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

// ---- Flex-based Net Difference Badge Column (scrolls with chart) ----
const NetDifferenceBadgeColumn = ({ chartData }) => {
  return (
    <div style={{ width: '75px', display: 'flex', flexDirection: 'column', pointerEvents: 'none', flexShrink: 0 }}>
      {chartData.map((d, i) => {
        const netDiff = Number(d.NET_DIFFERENCE || 0);

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
            <div style={{
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
const CycleCountVarianceChart = React.memo(({ chartData, chartHeight }) => {
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
              <Bar dataKey="SHORT_BAR" stackId="a" barSize={14} fill="#f97316" radius={4} isAnimationActive={false}>
                <LabelList dataKey="SHORT_VAL" content={<CustomVarianceLabel fill="#f97316" />} />
              </Bar>
              <Bar dataKey="SPACER_FG" stackId="a" fill="transparent" isAnimationActive={false} />
              <Bar dataKey="EXCESS_BAR" stackId="a" barSize={14} fill="#10b981" radius={4} isAnimationActive={false}>
                <LabelList dataKey="EXCESS_VAL" content={<CustomVarianceLabel fill="#10b981" />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Net Difference Badge Column — in normal flow, scrolls with chart */}
      <NetDifferenceBadgeColumn chartData={chartData} />
    </div>
  );
});

// ---- Split Layout Wrapper (Now a Tabbed Carousel) ----
const MemoizedCycleSplitCharts = React.memo(({ chartData, chartHeight, activeTab }) => {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>


      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginBottom: '8px', paddingRight: '16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'inline-block' }}></span>
                    System Stock
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                    Scanned Qty
                  </span>
                </div>
              </div>
              <CycleCountStockChart chartData={chartData} chartHeight={chartHeight} />
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
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f97316', display: 'inline-block' }}></span>
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
              <CycleCountVarianceChart chartData={chartData} chartHeight={chartHeight} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

// ---- Main Component ----
export default function CycleCountSection() {
  const { data: realData, isLoading, error, refresh } = useCycleCount();
  const data = realData;
  const metrics = useCycleCountMetrics(data);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState('DURATION_DESC');
  const [tableSort, setTableSort] = useState('latest');
  const [chartView, setChartView] = useState('store');
  const [infoTab, setInfoTab] = useState('system');

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
    let under4 = 0;
    let between4and8 = 0;
    let over8 = 0;

    (metrics.parsedData || []).forEach(row => {
      if (row.durationMins == null) return;
      if (row.durationMins < 4 * 60) under4++;
      else if (row.durationMins <= 8 * 60) between4and8++;
      else over8++;
    });

    return [
      { name: '< 4 Hours', count: under4, fill: 'url(#colorGreen)' },
      { name: '4 - 8 Hours', count: between4and8, fill: 'url(#colorBlue)' },
      { name: '> 8 Hours', count: over8, fill: 'url(#colorRed)' }
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
    : Math.max(280, chartData.length * 44);



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
        rightContent={<DateBadge />}
      />

      {/* KPI ROW — 4 cards */}
      <div className="cc-kpi-row">
        <KpiCard2
          title="Stores Reported"
          value={metrics.storesReported}
          subtext="In current view"
          icon={<ClipboardList />}
        />
        <KpiCard2
          title="Counted Today"
          value={metrics.todayCount}
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
          value={metrics.inProgressCount}
          subtext="Audits missing end time"
          icon={<Hourglass />}
        />
      </div>

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
        <div className="cc-chart-scroll">
          {chartView === 'store' ? (
            chartData.length === 0 ? (
              <SearchEmptyState 
                searchFilter={searchFilter}
                title={`No Cycle Count Records Found for "${searchFilter}"`}
                subtitle="Try a different search term or clear your filters."
                onClearSearch={() => setSearchFilter('')}
              />
            ) : (
              <MemoizedChart chartData={chartData} chartHeight={chartHeight} />
            )
          ) : chartView === 'distribution' ? (
            <MemoizedDistributionChart distributionData={distributionData} />
          ) : (
            <MemoizedCycleSplitCharts chartData={chartData} chartHeight={chartHeight} activeTab={infoTab} />
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
          'Store Code', 'Type', 'Ref No', 'Date', 'Start Time', 'End Time', 'Duration', 'Status'
        ]}
        data={tableData}
        emptyStateContent={
          <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <td colSpan={8} className="cc-data-grid-empty-cell">
              No cycle counts found
            </td>
          </motion.tr>
        }
        renderRow={(row) => (
          <motion.tr
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
            key={row.REF_NO || row.STORE_CODE}
            className="cc-data-grid-tr"
            onClick={() => handleRowClick(row)}
          >
            <td className="cc-data-grid-td cc-data-grid-td-bold">
              <div className="cc-row-tooltip-wrapper">
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
            <td className="cc-data-grid-td"><span className="cc-data-grid-ref-link">{row.REF_NO || '—'}</span></td>
            <td className="cc-data-grid-td">{row.formattedDate || '—'}</td>
            <td className="cc-data-grid-td">{row.Start_DateTime || '—'}</td>
            <td className="cc-data-grid-td">{row.END_DateTime || '—'}</td>
            <td className="cc-data-grid-td">{row.rawDuration || '—'}</td>
            <td className="cc-data-grid-td">
              <span className={`cc-data-grid-status-pill ${row.exceedsThreshold ? 'cc-data-grid-status-high' : 'cc-data-grid-status-normal'}`}>
                {row.exceedsThreshold ? 'Very High' : 'Normal'}
              </span>
            </td>
          </motion.tr>
        )}
      />

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





