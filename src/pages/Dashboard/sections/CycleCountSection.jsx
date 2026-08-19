import React, { useState, useMemo } from 'react';
import { RefreshCw, Search, ClipboardList, Calendar, Clock, Hourglass } from 'lucide-react';
import KpiCard from '../../../components/charts/KpiCard';
import SectionHeader, { DateBadge } from '../../../components/common/SectionHeader';
import CycleCountModal from '../../../components/modals/CycleCountModal';
import BaseDataTable from '../../../components/common/BaseDataTable';
import { useCycleCount } from '../../../hooks/useDashboardData';
import { useCycleCountMetrics } from '../../../hooks/useCycleCountMetrics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { generateMockCycleCount } from '../../../utils/mockCycleCount';
import '../../../components/charts/DashboardSection.css';
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

// ---- Main Component ----
export default function CycleCountSection() {
  const { data: realData, isLoading, error, refresh } = useCycleCount();
  const data = mockCycleCountData; // USE MOCK DATA OVERRIDE
  const metrics = useCycleCountMetrics(data);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

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

  // Chart data: filter valid durations, sort longest→shortest
  const chartData = useMemo(() => {
    return [...filteredData]
      .filter(r => r.durationMins !== null)
      .sort((a, b) => b.durationMins - a.durationMins);
  }, [filteredData]);

  // Table data: top 5 latest counts globally (ignores search filter)
  const top5LatestData = useMemo(() => {
    return [...metrics.parsedData]
      .sort((a, b) => {
        // Sort by DATE descending, then END_DateTime descending
        const dateA = new Date(`${a.DATE}T${a.END_DateTime || '00:00:00'}`);
        const dateB = new Date(`${b.DATE}T${b.END_DateTime || '00:00:00'}`);
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [metrics.parsedData]);

  const chartHeight = Math.max(250, chartData.length * 32);

  const tableColumns = useMemo(() => [
    { key: 'STORE_CODE', label: 'Store', render: (val) => <span className="cc-col-store">{val || '—'}</span> },
    { key: 'STORE_NAME', label: 'Store Name', render: (val) => val || '—' },
    { key: 'formattedDate', label: 'Date' },
    { key: 'CYCLE_COUNT_TYPE', label: 'Type', render: (val) => val || '—' },
    { key: 'REF_NO', label: 'Reference No.', render: (val) => <span className="cc-col-ref">{val || '—'}</span> },
    { key: 'Start_DateTime', label: 'Start Time', render: (val) => val || '—' },
    { key: 'END_DateTime', label: 'End Time', render: (val) => val || '—' },
    { key: 'rawDuration', label: 'Time Taken', render: (val) => <span className="cc-col-duration">{val || '—'}</span> }
  ], []);

  const handleRowClick = (row) => {
    setSelectedRowData(row);
    setIsModalOpen(true);
  };

  // ---- Loading State ----
  if (isLoading) {
    return (
      <div className="cc-container">
        <div className="ds-skeleton-row" style={{ gridTemplateColumns: '1fr' }}>
          <div className="ds-skeleton-box" style={{ height: '60px', borderRadius: '12px' }}><div className="ds-shimmer" /></div>
        </div>
        <div className="ds-skeleton-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
          {[1,2,3,4].map(i => <div key={i} className="ds-skeleton-box" style={{ height: '100px', borderRadius: '10px' }}><div className="ds-shimmer" /></div>)}
        </div>
        <div className="ds-skeleton-row" style={{ gridTemplateColumns: '1fr' }}>
          <div className="ds-skeleton-box" style={{ height: '280px', borderRadius: '20px' }}><div className="ds-shimmer" /></div>
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
        <div className="cc-toolbar">
          <h3 className="cc-toolbar-title">Audit Duration by Store</h3>

          <div className="cc-search-container">
            <span className="cc-search-icon">
              <Search size={14} />
            </span>
            <input
              type="text"
              className="cc-search-input"
              placeholder="Search store..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
            />
            {searchFilter && (
              <button
                className="cc-search-clear"
                onClick={() => setSearchFilter('')}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="cc-chart-scroll">
          {chartData.length === 0 ? (
            <div className="cc-empty">
              <Search size={32} />
              <p>No matching cycle count records found.</p>
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* DATA GRID */}
      <div className="cc-card" style={{ padding: 10}}>
        <div className="cc-grid-header">
          <h3 className="cc-grid-title">Latest 5 Audits</h3>
          <span className="cc-grid-count">{top5LatestData.length} Records</span>
        </div>
        <BaseDataTable
          columns={tableColumns}
          data={top5LatestData}
          onRowClick={handleRowClick}
          enablePagination={false} // Only 5 records, no need for pagination
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
