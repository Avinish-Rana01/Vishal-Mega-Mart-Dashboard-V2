import React, { useState, useMemo } from 'react';
import { RefreshCw, Search, ClipboardList, Calendar, Clock, Hourglass, Filter, Download } from 'lucide-react';
import KpiCard from '../../../components/charts/KpiCard';
import SectionHeader, { DateBadge } from '../../../components/common/SectionHeader';
import CycleCountModal from '../../../components/modals/CycleCountModal';
import BaseDataTable from '../../../components/common/BaseDataTable';
import CustomDropdown from '../../../components/common/CustomDropdown';
import { useCycleCount } from '../../../hooks/useDashboardData';
import { useCycleCountMetrics } from '../../../hooks/useCycleCountMetrics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { generateMockCycleCount } from '../../../utils/mockCycleCount';
import '../../../components/charts/DashboardSection.css';
import './common.css';
import './CycleCountSection.css';

// Generate mock data once (same pattern as LiveStock)
const mockCycleCountData = generateMockCycleCount(20);

// ---- Custom Tooltip for the Duration Bar Chart ----
function DurationTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="cc-card" style={{ padding: '14px 18px', minWidth: '200px', background: '#fff', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0' }}>
      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px', fontSize: '14px' }}>{d.STORE_NAME || d.STORE_CODE}</div>
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
  return (
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
        <Bar dataKey="durationMins" radius={[0, 4, 4, 0]} maxBarSize={20} fill="#ff8800ff">
          <LabelList
            dataKey="rawDuration"
            position="right"
            style={{ fontSize: '12px', fontWeight: 600, fill: '#334155' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

// ---- Memoized Distribution Chart Component ----
const MemoizedDistributionChart = React.memo(({ distributionData }) => {
  return (
    <div style={{ height: '280px', width: '100%', paddingTop: '20px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={distributionData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }} barSize={45}>
          <defs>
            <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={1}/>
              <stop offset="100%" stopColor="#059669" stopOpacity={1}/>
            </linearGradient>
            <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity={1}/>
              <stop offset="100%" stopColor="#2563eb" stopOpacity={1}/>
            </linearGradient>
            <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" stopOpacity={1}/>
              <stop offset="100%" stopColor="#dc2626" stopOpacity={1}/>
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
    </div>
  );
});

// ---- Main Component ----
export default function CycleCountSection() {
  const { data: realData, isLoading, error, refresh } = useCycleCount();
  const data = mockCycleCountData; // USE MOCK DATA OVERRIDE
  // const data = realData;
  const metrics = useCycleCountMetrics(data);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState('DURATION_DESC');
  const [tableSort, setTableSort] = useState('latest');
  const [chartView, setChartView] = useState('store');

  const viewOptions = useMemo(() => [
    { value: 'store', label: 'Audit Duration by Store' },
    { value: 'distribution', label: 'Duration Distribution' }
  ], []);

  const sortOptions = useMemo(() => [
    { value: 'DURATION_DESC', label: 'Duration (Longest first)' },
    { value: 'DURATION_ASC', label: 'Duration (Shortest first)' },
    { value: 'STORE_ASC', label: 'Store Code (A-Z)' }
  ], []);

  const tableSortOptions = useMemo(() => [
    { value: 'latest', label: 'Latest 5' },
    { value: 'longest', label: 'Longest 5' },
    { value: 'fastest', label: 'Fastest 5' }
  ], []);

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

  const chartHeight = Math.max(250, chartData.length * 32);



  const handleRowClick = (row) => {
    setSelectedRowData(row);
    setIsModalOpen(true);
  };

  // ---- Loading State ----
  if (isLoading) {
    return (
      <div className="cc-container">
        <SectionHeader title="Cycle Count" rightContent={<DateBadge />} />
        
        <div className="cc-kpi-row">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="ds-skeleton-box" style={{ height: '80px', borderRadius: '12px' }}>
              <div className="ds-shimmer" />
            </div>
          ))}
        </div>
        
        <div className="ds-skeleton-box" style={{ height: '380px', borderRadius: '12px' }}>
          <div className="ds-shimmer" />
        </div>
        
        <div className="ds-skeleton-box" style={{ height: '400px', borderRadius: '12px' }}>
          <div className="ds-shimmer" />
        </div>
      </div>
    );
  }

  // ---- Error State ----
  if (error) {
    return (
      <div className="cc-container">
        <div className="cc-error">Unable to load cycle count data. Please check your connection and try again.</div>
      </div>
    );
  }

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
        <KpiCard
          title="Stores Reported"
          value={metrics.storesReported}
          subtext="In current view"
          icon={<ClipboardList size={18} />}
        />
        <KpiCard
          title="Counted Today"
          value={metrics.todayCount}
          subtext="Audits completed today"
          icon={<Calendar size={18} />}
        />
        <KpiCard
          title="Avg Duration"
          value={metrics.avgDurationFormatted}
          subtext="Across reported stores"
          icon={<Clock size={18} />}
        />
        <KpiCard
          title="Longest Audit"
          value={metrics.slowestDurationFormatted}
          subtext={metrics.slowestStore}
          icon={<Hourglass size={18} />}
        />
      </div>

      {/* DURATION BAR CHART */}
      <div className="cc-card">

        {/* Toolbar */}
        <div className="vmm-toolbar-header" style={{ minHeight: '40px' }}>
          <h3 className="vmm-toolbar-title" style={{ display: 'flex', alignItems: 'center' }}>
            <CustomDropdown
              options={viewOptions}
              value={chartView}
              onChange={(val) => setChartView(val)}
              buttonStyle={{ backgroundColor: 'transparent', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%231e3a8a\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundPosition: 'right 4px center', border: 'none', paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: '18px', fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit', boxShadow: 'none' }}
              menuStyle={{ left: 0, right: 'auto', minWidth: '220px' }}
            />
          </h3>

          <div className="vmm-toolbar-controls">
            {chartView === 'store' && (
              <>
                <CustomDropdown
                  options={sortOptions}
                  value={sortBy}
                  onChange={(val) => setSortBy(val)}
                  prefix="Sort:"
                  buttonStyle={{ minWidth: '200px', justifyContent: 'space-between' }}
                  menuStyle={{ left: 'auto', right: 0, minWidth: '200px' }}
                />

                <div className="vmm-search-container">
                  <span className="vmm-search-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19C12.8487 19 14.551 18.3729 15.9056 17.3199L19.2929 20.7071C19.6834 21.0976 20.3166 21.0976 20.7071 20.7071C21.0976 20.3166 21.0976 19.6834 20.7071 19.2929L17.3199 15.9056C18.3729 14.551 19 12.8487 19 11C19 6.58172 15.4183 3 11 3ZM5 11C5 7.68629 7.68629 5 11 5C14.3137 5 17 7.68629 17 11C17 14.3137 14.3137 17 11 17C7.68629 17 5 14.3137 5 11Z" fill="#94a3b8" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    className="vmm-search-input"
                    placeholder="Search store..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    style={{ paddingRight: searchFilter ? '32px' : '16px' }}
                  />
                  {searchFilter && (
                    <button
                      className="vmm-search-clear"
                      onClick={() => setSearchFilter('')}
                    >
                      ×
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="cc-chart-scroll">
          {chartView === 'store' ? (
            chartData.length === 0 ? (
              <div style={{ height: '100%', minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
                  <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                No matching cycle count records found.
                <button
                  onClick={() => setSearchFilter('')}
                  style={{ marginTop: '16px', background: '#fff', border: '1px solid #e2e8f0', color: '#4338ca', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <MemoizedChart chartData={chartData} chartHeight={chartHeight} />
            )
          ) : (
            <MemoizedDistributionChart distributionData={distributionData} />
          )}
        </div>
      </div>

      {/* NATIVE HTML DATA GRID */}
      <div className="cc-data-grid-card">
        <div className="cc-data-grid-header">
          <h3 className="cc-data-grid-title">
            LATEST CYCLE COUNT BY STORE
          </h3>
          <CustomDropdown
            options={tableSortOptions}
            value={tableSort}
            onChange={(val) => setTableSort(val)}
            prefix="Sort:"
            buttonStyle={{ maginBottom: '10px', }}
            menuStyle={{ left: 'auto', right: 0, minWidth: '160px' }}
          />
        </div>

        {/* Scrollable Wrapper - The key to native scrollbars */}
        <div className="cc-native-table-scroll">
          <div className="cc-data-grid-inner-wrapper">
            <table className="cc-data-grid-table">
              <thead className="cc-data-grid-thead">
                <tr>
                  <th className="cc-data-grid-th">Store Code</th>
                  <th className="cc-data-grid-th">Store Name</th>
                  <th className="cc-data-grid-th">Type</th>
                  <th className="cc-data-grid-th">Ref No</th>
                  <th className="cc-data-grid-th">Date</th>
                  <th className="cc-data-grid-th">Start Time</th>
                  <th className="cc-data-grid-th">End Time</th>
                  <th className="cc-data-grid-th">Duration</th>
                  <th className="cc-data-grid-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <motion.tr
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td colSpan={9} className="cc-data-grid-empty-cell">
                      No cycle counts found
                    </td>
                  </motion.tr>
                ) : (
                  tableData.map((row) => (
                    <motion.tr
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
                      key={row.REF_NO || row.STORE_CODE}
                      className="cc-data-grid-tr"
                      onClick={() => handleRowClick(row)}
                    >
                      <td className="cc-data-grid-td cc-data-grid-td-bold">{row.STORE_CODE || '—'}</td>
                      <td className="cc-data-grid-td">{row.STORE_NAME || '—'}</td>
                      <td className="cc-data-grid-td">{row.CYCLE_COUNT_TYPE || '—'}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
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
