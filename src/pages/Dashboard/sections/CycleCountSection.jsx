import React, { useState, useMemo } from 'react';
import { RefreshCw, Search, ClipboardList, Calendar, Clock, Hourglass, Filter, Download } from 'lucide-react';
import KpiCard from '../../../components/charts/KpiCard';
import SectionHeader, { DateBadge } from '../../../components/common/SectionHeader';
import CycleCountModal from '../../../components/modals/CycleCountModal';
import BaseDataTable from '../../../components/common/BaseDataTable';
import CustomDropdown from '../../../components/common/CustomDropdown';
import { useCycleCount } from '../../../hooks/useDashboardData';
import { useCycleCountMetrics } from '../../../hooks/useCycleCountMetrics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
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

// ---- Main Component ----
export default function CycleCountSection() {
  const { data: realData, isLoading, error, refresh } = useCycleCount();
  const data = mockCycleCountData; // USE MOCK DATA OVERRIDE
  const metrics = useCycleCountMetrics(data);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState('DURATION_DESC');

  const sortOptions = useMemo(() => [
    { value: 'DURATION_DESC', label: 'Duration (Longest first)' },
    { value: 'DURATION_ASC', label: 'Duration (Shortest first)' },
    { value: 'STORE_ASC', label: 'Store Code (A-Z)' }
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
    { key: 'STORE_CODE', label: 'Store Code' },
    { key: 'STORE_NAME', label: 'Store Name', render: (val) => val || '—' },
    { key: 'CYCLE_COUNT_TYPE', label: 'Cycle Count Type', render: (val) => val || '—' },
    { key: 'REF_NO', label: 'Reference No', render: (val) => <span className="cc-ref-link">{val || '—'}</span> },
    { key: 'formattedDate', label: 'Date' },
    { key: 'Start_DateTime', label: 'Start Time', render: (val) => val || '—' },
    { key: 'END_DateTime', label: 'End Time', render: (val) => val || '—' },
    { key: 'rawDuration', label: 'Duration' },
    { key: 'exceedsThreshold', label: 'Status', render: (val) => (
        <span className={`cc-status-pill ${val ? 'cc-status-high' : 'cc-status-normal'}`}>
          {val ? 'Very High' : 'Normal'}
        </span>
      )
    }
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
        <div className="vmm-toolbar-header">
          <h3 className="vmm-toolbar-title">Audit Duration by Store</h3>

          <div className="vmm-toolbar-controls">
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
                  <path fillRule="evenodd" clipRule="evenodd" d="M11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19C12.8487 19 14.551 18.3729 15.9056 17.3199L19.2929 20.7071C19.6834 21.0976 20.3166 21.0976 20.7071 20.7071C21.0976 20.3166 21.0976 19.6834 20.7071 19.2929L17.3199 15.9056C18.3729 14.551 19 12.8487 19 11C19 6.58172 15.4183 3 11 3ZM5 11C5 7.68629 7.68629 5 11 5C14.3137 5 17 7.68629 17 11C17 14.3137 14.3137 17 11 17C7.68629 17 5 14.3137 5 11Z" fill="#94a3b8"/>
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
          </div>
        </div>

        {/* Chart */}
        <div className="cc-chart-scroll">
          {chartData.length === 0 ? (
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
      <div className="cc-card" style={{ padding: 0, background: '#eceef0', border: '1px solid #e2e8f0', borderRadius: '20px', boxShadow: 'none', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 16px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 class="vmm-toolbar-title">
            LATEST CYCLE COUNT BY STORE
          </h3>
          {/* <div style={{ display: 'flex', gap: '8px' }}>
            <button className="cc-action-btn"><Search size={16} /></button>
            <button className="cc-action-btn"><Filter size={16} /></button>
            <button className="cc-action-btn cc-export-btn"><Download size={16} /> Export</button>
          </div> */}
        </div>
        <BaseDataTable
          columns={tableColumns}
          data={top5LatestData}
          onRowClick={handleRowClick}
          enablePagination={false}
          ordering={false}
          containerClassName="cc-table-scroll"
          tableClassName="cc-table-custom"
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
