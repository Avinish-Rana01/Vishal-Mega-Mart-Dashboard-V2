import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './StoreValidationSection.css';
import { useStoreDashboard } from '../../../hooks/useDashboardData';
import { useIsInViewport } from '../../../hooks/useIsInViewport';
import KpiCard2 from '../../../components/charts/KpiCard2';
import LiveTickerValue from '../../../components/common/LiveTickerValue';
import SectionHeader, { DateBadge } from '../../../components/common/SectionHeader';
import DashboardShimmer from '../../../components/common/DashboardShimmer';
import DashboardDataGrid from '../../../components/charts/DashboardDataGrid';
import CustomDropdown from '../../../components/common/CustomDropdown';
import { SearchEmptyState, GlobalEmptyState } from '../../../components/common/ChartEmptyState';
import ChartToolbar from '../../../components/common/ChartToolbar';
import ChartSearchInput from '../../../components/common/ChartSearchInput';
import ChartLegend from '../../../components/common/ChartLegend';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import '../../../components/charts/DashboardSection.css';
import * as Icons from 'lucide-react';
import './common.css';
import './CycleCountShared.css';



// ─── Colors ───────────────────────────────────────────────────────────────────
const COLOR_RECEIVED  = '#3b82f6'; // blue
const COLOR_VALIDATED = '#ff8800ff'; // orange (from cycle count)
const COLOR_HHT       = '#6366f1'; // indigo
const COLOR_PENDING   = '#fcd34d'; // amber/yellow gap
const COLOR_WRONG     = '#ef4444'; // red

// ─── Tooltips ────────────────────────────────────────────────────────────────
function ValidationTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const pending = Number(d.STORE_PENDING_QTY || 0);
  const wrong   = Number(d.HU_WRONG_QTY || 0);
  return (
    <div style={{ padding: '12px 16px', minWidth: '210px', background: '#fff', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0' }}>
      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '10px', fontSize: '13px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{d.STORE_NAME || d.STORE}</span>
        {d.STORE && d.STORE !== d.STORE_NAME && (
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{d.STORE}</span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 14px', fontSize: '12px' }}>
        <span style={{ color: '#94a3b8' }}>Received HU</span>  <span style={{ fontWeight: 700, color: COLOR_RECEIVED }}>{Number(d.HU_RECEIVED_QTY || 0).toLocaleString('en-IN')}</span>
        <span style={{ color: '#94a3b8' }}>Validated HU</span> <span style={{ fontWeight: 700, color: COLOR_VALIDATED }}>{Number(d.HU_VALIDATED_QTY || 0).toLocaleString('en-IN')}</span>
        <span style={{ color: '#94a3b8' }}>HHT Validated</span><span style={{ fontWeight: 700, color: COLOR_HHT }}>{Number(d.HHT_VALIDATE_QTY || 0).toLocaleString('en-IN')}</span>
        <span style={{ color: '#94a3b8' }}>Pending</span>      <span style={{ fontWeight: 700, color: pending > 0 ? '#f59e0b' : '#10b981' }}>{pending.toLocaleString('en-IN')}</span>
        <span style={{ color: '#94a3b8' }}>Wrong HU</span>     <span style={{ fontWeight: 700, color: wrong > 0 ? '#ef4444' : '#10b981' }}>{wrong.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}

// ─── Side Badge Columns ───────────────────────────────────────────────────────
const WrongHUBadgeColumn = ({ chartData, chartHeight, showPending = true, onCellClick }) => (
  <div style={{ width: '70px', height: chartHeight, display: 'flex', flexDirection: 'column', flexShrink: 0, paddingTop: '20px', paddingBottom: '35px' }}>
    {chartData.map((d, i) => {
      const wrong = Number(d.HU_WRONG_QTY || 0);
      const pending = Number(d.STORE_PENDING_QTY || 0);
      const hasError = wrong > 0;
      const hasPending = pending > 0;

      return (
        <div key={d.STORE || i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '4px' }}>
          {hasError ? (
            <div 
              className="sv-clickable-badge"
              onClick={(e) => onCellClick && onCellClick(d, '0', e)}
              title="Click to view Wrong HUs in GRC Report (Status: 0)"
              style={{ width: '42px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fee2e2', color: '#dc2626', borderRadius: '6px', padding: '2px 0', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              {wrong}
            </div>
          ) : (
            <div style={{ width: '42px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#dcfce7', color: '#16a34a', borderRadius: '6px', padding: '2px 0', fontSize: '11px', fontWeight: 700 }}>
              ✓
            </div>
          )}
          {showPending && hasPending && (
            <div 
              className="sv-clickable-badge"
              onClick={(e) => onCellClick && onCellClick(d, '3', e)}
              title="Click to view Pending HUs in GRC Report (Status: 3)"
              style={{ width: '42px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fef3c7', color: '#d97706', borderRadius: '6px', padding: '2px 0', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              {pending}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

// ─── Custom Gap Label for Validated Bar ─────────────────────────────────────────
const CustomGapLabel = (props) => {
  const { x, y, width, height, value, index, data } = props;
  const row = data ? data[index] : null;
  const pending = row ? Number(row.STORE_PENDING_QTY || 0) : 0;
  
  return (
    <g>
      <text x={x + width + 5} y={y + height / 2 + 4} fill={COLOR_VALIDATED} fontSize="11px" fontWeight="600">
        {value}
      </text>
      {pending > 0 && (
        <text x={x + width + 30} y={y + height / 2 + 4} fill="#ef4444" fontSize="11px" fontWeight="700">
          (-{pending} gap)
        </text>
      )}
    </g>
  );
};

// ─── 1. Grouped Bar Chart (Received vs Validated) ─────────────────────────────
const MemoizedValidationChart = React.memo(({ chartData, onCellClick }) => {
  const ROW_HEIGHT = 16;
  const GROUP_GAP = 16;
  const chartHeight = Math.max(220, chartData.length * (ROW_HEIGHT * 2 + GROUP_GAP) + 40);
  const [ref, hasBeenVisible] = useIsInViewport();

  return (
    <div ref={ref} style={{ display: 'flex', width: '100%', minHeight: chartHeight }}>
      {hasBeenVisible && (
        <div style={{ flex: 1, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 80, left: 0, bottom: 5 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="STORE" type="category" tick={{ fontSize: 12, fill: '#0f172a', fontWeight: 600 }} axisLine={false} tickLine={false} width={52} />
              <Tooltip content={<ValidationTooltip />} cursor={{ fill: 'rgba(241,245,249,0.6)' }} />
              <Bar 
                dataKey="HU_RECEIVED_QTY" 
                name="Received HU" 
                barSize={ROW_HEIGHT} 
                fill={COLOR_RECEIVED} 
                radius={[4,4,4,4]} 
                isAnimationActive={true} 
                animationDuration={500} 
                animationEasing="ease-out"
                cursor="pointer"
                onClick={(entry) => onCellClick && onCellClick(entry, '4')}
              >
                <LabelList dataKey="HU_RECEIVED_QTY" position="right" style={{ fontSize: '11px', fontWeight: 600, fill: COLOR_RECEIVED }} />
              </Bar>
              <Bar 
                dataKey="HU_VALIDATED_QTY" 
                name="Validated HU" 
                barSize={ROW_HEIGHT} 
                fill={COLOR_VALIDATED} 
                radius={[4,4,4,4]} 
                isAnimationActive={true} 
                animationDuration={500} 
                animationEasing="ease-out"
                cursor="pointer"
                onClick={(entry) => onCellClick && onCellClick(entry, '1')}
              >
                <LabelList dataKey="HU_VALIDATED_QTY" content={<CustomGapLabel data={chartData} />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
});

// ─── 2. Progress Bar Chart (HHT Validated + Pending) ──────────────────────────
const MemoizedProgressChart = React.memo(({ chartData, onCellClick }) => {
  const ROW_HEIGHT = 20;
  const GROUP_GAP = 16;
  const chartHeight = Math.max(220, chartData.length * (ROW_HEIGHT + GROUP_GAP) + 40);
  const [ref, hasBeenVisible] = useIsInViewport();

  return (
    <div ref={ref} style={{ display: 'flex', width: '100%', minHeight: chartHeight }}>
      {hasBeenVisible && (
        <>
          <div style={{ flex: 1, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 50, left: 0, bottom: 5 }} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="STORE" type="category" tick={{ fontSize: 12, fill: '#0f172a', fontWeight: 600 }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<ValidationTooltip />} cursor={{ fill: 'rgba(241,245,249,0.6)' }} />
                <Bar 
                  dataKey="HHT_VALIDATE_QTY" 
                  stackId="a" 
                  name="HHT Validated" 
                  barSize={ROW_HEIGHT} 
                  fill={COLOR_HHT} 
                  radius={[4,0,0,4]} 
                  isAnimationActive={true} 
                  animationDuration={500} 
                  animationEasing="ease-out"
                  cursor="pointer"
                  onClick={(entry) => onCellClick && onCellClick(entry, '2')}
                >
                  <LabelList dataKey="HHT_VALIDATE_QTY" position="insideLeft" style={{ fontSize: '11px', fontWeight: 600, fill: '#fff' }} formatter={(val) => val > 0 ? val : ''} />
                </Bar>
                <Bar 
                  dataKey="STORE_PENDING_QTY" 
                  stackId="a" 
                  name="Pending" 
                  barSize={ROW_HEIGHT} 
                  fill={COLOR_PENDING} 
                  radius={[0,4,4,0]} 
                  isAnimationActive={true} 
                  animationDuration={500} 
                  animationEasing="ease-out"
                  cursor="pointer"
                  onClick={(entry) => onCellClick && onCellClick(entry, '3')}
                >
                  <LabelList dataKey="STORE_PENDING_QTY" position="right" style={{ fontSize: '11px', fontWeight: 600, fill: '#d97706' }} formatter={(val) => val > 0 ? val : ''} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <WrongHUBadgeColumn chartData={chartData} chartHeight={chartHeight} showPending={false} onCellClick={onCellClick} />
        </>
      )}
    </div>
  );
});

// ─── 3. Wrong HU Distribution Chart ───────────────────────────────────────────
const MemoizedWrongHUChart = React.memo(({ chartData, searchFilter, onClearSearch, onCellClick }) => {
  const ROW_HEIGHT = 20;
  const GROUP_GAP = 16;
  const filteredData = chartData.filter(d => Number(d.HU_WRONG_QTY || 0) > 0);
  const chartHeight = Math.max(220, filteredData.length * (ROW_HEIGHT + GROUP_GAP) + 40);
  const [ref, hasBeenVisible] = useIsInViewport();

  if (filteredData.length === 0) {
    if (searchFilter && searchFilter.trim().length > 0) {
      return (
        <SearchEmptyState 
          searchFilter={searchFilter}
          title={`No Wrong HUs Found for "${searchFilter}"`}
          subtitle="Try another store or clear your search."
          onClearSearch={onClearSearch}
        />
      );
    }

    return (
      <GlobalEmptyState 
        title="No Wrong HUs Detected"
        subtitle="All stores are currently clean"
        icon={Icons.ShieldCheck}
        iconColor="#059669"
      />
    );
  }

  return (
    <div ref={ref} style={{ display: 'flex', width: '100%', minHeight: chartHeight }}>
      {hasBeenVisible && (
        <div style={{ flex: 1, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={filteredData} layout="vertical" margin={{ top: 20, right: 50, left: 0, bottom: 5 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="STORE" type="category" tick={{ fontSize: 12, fill: '#0f172a', fontWeight: 600 }} axisLine={false} tickLine={false} width={52} />
              <Tooltip content={<ValidationTooltip />} cursor={{ fill: 'rgba(254,226,226,0.6)' }} />
              <Bar 
                dataKey="HU_WRONG_QTY" 
                name="Wrong HU" 
                barSize={ROW_HEIGHT} 
                fill={COLOR_WRONG} 
                radius={[4,4,4,4]} 
                isAnimationActive={true} 
                animationDuration={500} 
                animationEasing="ease-out"
                cursor="pointer"
                onClick={(entry) => onCellClick && onCellClick(entry, '0')}
              >
                <LabelList dataKey="HU_WRONG_QTY" position="right" style={{ fontSize: '11px', fontWeight: 600, fill: COLOR_WRONG }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
});

// ─── View & Sort options ──────────────────────────────────────────────────────
const VIEW_OPTIONS = [
  { value: 'grouped', label: 'Received vs Validated' },
  { value: 'progress', label: 'Validation Progress' },
  { value: 'wrong_hu', label: 'Wrong HU Distribution' },
];

// Note: SORT_OPTIONS is generated dynamically inside the component based on view

// ═══════════════════════════════════════════════════════════════════════════════
export default function StoreValidationSection() {
  const navigate = useNavigate();
  const { data: realData, totals: realTotals, isLoading, isRefreshing, error, highlightedStore, connectionStatus } = useStoreDashboard();
  const data = realData;
  const totals = realTotals;


  const [chartView, setChartView] = useState('grouped');
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState('PENDING_DESC');
  const [tableSort, setTableSort] = useState('PENDING_DESC');

  const handleStoreClick = useCallback((storeCode, rowDate) => {
    if (!storeCode) return;
    navigate('/reports/store-grc', {
      state: {
        store: storeCode,
        rowDate: rowDate || undefined,
      }
    });
  }, [navigate]);

  const handleCellClick = useCallback((row, status) => {
    const storeCode = row?.STORE || row?.Store_Code || row?.STORE_CODE;
    if (!storeCode) return;

    let dateOnly = '';
    if (row?.DATE) {
      dateOnly = String(row.DATE).split(' ')[0];
    } else {
      const now = new Date();
      dateOnly = now.toISOString().split('T')[0];
    }

    navigate('/reports/grc', {
      state: {
        store: storeCode,
        fromDate: dateOnly,
        toDate: dateOnly,
        grcStatus: String(status)
      }
    });
  }, [navigate]);

  const tableSortOptions = useMemo(() => [
    { value: 'PENDING_DESC', label: 'Highest Pending' },
    { value: 'WRONG_DESC', label: 'Highest Wrong HU' },
    { value: 'RECEIVED_DESC', label: 'Most Received' }
  ], []);

  // Dynamically generate sort options based on current view
  const sortOptions = useMemo(() => {
    if (chartView === 'wrong_hu') {
      return [
        { value: 'WRONG_DESC', label: 'Highest Wrong HU' },
        { value: 'WRONG_ASC', label: 'Lowest Wrong HU' }
      ];
    }
    const baseOptions = [
      { value: 'PENDING_DESC', label: 'Highest Pending' },
      { value: 'VALIDATED_ASC', label: 'Lowest Validated' },
      { value: 'VALIDATED_DESC', label: 'Highest Validated' },
    ];
    if (chartView !== 'grouped') {
      // Insert Wrong HU option before Store Code (spread, no mutation)
      return [
        ...baseOptions.slice(0, 2),
        { value: 'WRONG_DESC', label: 'Highest Wrong HU' },
        ...baseOptions.slice(2),
      ];
    }
    return baseOptions;
  }, [chartView]);

  // Ensure current sort is valid for current view
  useEffect(() => {
    if (!sortOptions.find(opt => opt.value === sortBy)) {
      setSortBy(sortOptions[0].value);
    }
  }, [sortOptions, sortBy]);

  // Filtered + sorted data for the chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    let result = [...data];

    // Search
    if (searchFilter.trim()) {
      const term = searchFilter.toLowerCase();
      result = result.filter(row =>
        (row.STORE     && row.STORE.toLowerCase().includes(term)) ||
        (row.STORE_NAME && row.STORE_NAME.toLowerCase().includes(term))
      );
    }

    // Sort
    if (sortBy === 'PENDING_DESC') {
      result.sort((a, b) => Number(b.STORE_PENDING_QTY || 0) - Number(a.STORE_PENDING_QTY || 0));
    } else if (sortBy === 'VALIDATED_ASC') {
      result.sort((a, b) => Number(a.HU_VALIDATED_QTY || 0) - Number(b.HU_VALIDATED_QTY || 0));
    } else if (sortBy === 'WRONG_DESC') {
      result.sort((a, b) => Number(b.HU_WRONG_QTY || 0) - Number(a.HU_WRONG_QTY || 0));
    } else if (sortBy === 'WRONG_ASC') {
      result.sort((a, b) => Number(a.HU_WRONG_QTY || 0) - Number(b.HU_WRONG_QTY || 0));
    } else if (sortBy === 'VALIDATED_DESC') {
      result.sort((a, b) => Number(b.HU_VALIDATED_QTY || 0) - Number(a.HU_VALIDATED_QTY || 0));
    } else {
      result.sort((a, b) => (a.STORE || '').localeCompare(b.STORE || ''));
    }

    return result;
  }, [data, searchFilter, sortBy]);

  const hasWrongHUs = useMemo(() => chartData.some(d => Number(d.HU_WRONG_QTY || 0) > 0), [chartData]);

  // Separate sorted data for the Data Grid (Table)
  const tableData = useMemo(() => {
    if (!data || data.length === 0) return [];
    let result = [...data];

    // Sort for table
    if (tableSort === 'PENDING_DESC') {
      result.sort((a, b) => Number(b.STORE_PENDING_QTY || 0) - Number(a.STORE_PENDING_QTY || 0));
    } else if (tableSort === 'WRONG_DESC') {
      result.sort((a, b) => Number(b.HU_WRONG_QTY || 0) - Number(a.HU_WRONG_QTY || 0));
    } else if (tableSort === 'RECEIVED_DESC') {
      result.sort((a, b) => Number(b.HU_RECEIVED_QTY || 0) - Number(a.HU_RECEIVED_QTY || 0));
    }

    return result;
  }, [data, tableSort]);

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) return <DashboardShimmer title="Store Validation" />;

  // if (error) return <div className="ds-error">{error}</div>;

  return (
    <section className="cc-container">
      <SectionHeader 
        title="Store Validation" 
        subtitle="Overview of store GRN validation process"
        icon={<Icons.CheckCircle size={44} color="#3b82f6" strokeWidth={2.2} />}
        rightContent={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className={`live-sync-pill ${connectionStatus || 'connecting'}`} title={`Real-time sync: ${connectionStatus}`}>
              <span className="live-sync-dot"></span>
              {connectionStatus === 'connected' ? 'Live Sync (12s)' : connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </div>
            <DateBadge />
          </div>
        } 
      />

      {/* ── KPI Row ─────────────────────────────────────────────────────── */}
      <div className="cc-kpi-row">
        <KpiCard2
          title="HU Received"
          value={<LiveTickerValue value={totals?.HU_RECEIVED_QTY || 0} />}
          badge="Expected"
          badgeVariant="default"
          icon={<Icons.Box />}
        />
        <KpiCard2
          title="HU Validated"
          value={<LiveTickerValue value={totals?.HU_VALIDATED_QTY || 0} />}
          badge="Processed"
          badgeVariant="success"
          icon={<Icons.CheckCircle />}
        />
        <KpiCard2
          title="HHT Validated"
          value={<LiveTickerValue value={totals?.HHT_VALIDATE_QTY || 0} />}
          badge="Verified"
          badgeVariant="purple"
          icon={<Icons.Smartphone />}
        />
        <KpiCard2
          title="Store Pending"
          value={<LiveTickerValue value={totals?.STORE_PENDING_QTY || 0} />}
          badge="Action Required"
          badgeVariant="warning"
          icon={<Icons.Clock />}
        />
        <KpiCard2
          title="Wrong HU"
          value={<LiveTickerValue value={totals?.HU_WRONG_QTY || 0} />}
          badge="Discrepancy"
          badgeVariant="danger"
          icon={<Icons.AlertTriangle />}
        />
      </div>

      {/* ── Main Chart Card ──────────────────────────────────────────────── */}
      <div className="cc-card" style={{ overflow: 'hidden' }}>

        <ChartToolbar
          tabOptions={VIEW_OPTIONS}
          activeTab={chartView}
          onTabChange={(view) => {
            setChartView(view);
            const valid = sortOptions.some(o => o.value === sortBy);
            if (!valid) setSortBy(sortOptions[0].value);
          }}
          searchQuery={searchFilter}
          onSearchChange={setSearchFilter}
          searchPlaceholder="Search store..."
          sortOptions={sortOptions}
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalCount={chartData.length}
        />

        {/* ── Legend Strip (Dynamic based on View) ────────────────── */}
        {chartView === 'grouped' && (
          <ChartLegend items={[
            { color: COLOR_RECEIVED, label: 'Received HU' },
            { color: COLOR_VALIDATED, label: 'Validated HU' },
          ]} />
        )}
        {chartView === 'progress' && (
          <ChartLegend items={[
            { color: COLOR_HHT, label: 'HHT Validated' },
            { color: COLOR_PENDING, label: 'Pending' },
          ]} />
        )}
        {chartView === 'wrong_hu' && (
          hasWrongHUs ? (
            <ChartLegend items={[{ color: COLOR_WRONG, label: 'Wrong HU' }]} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', padding: '4px 8px 6px', fontSize: '12px', color: '#059669', fontWeight: 500, borderBottom: '1px solid #e8eaf0' }}>
              <Icons.Check size={14} strokeWidth={3} /> All Clear
            </div>
          )
        )}

        {/* ── Chart Scroll Area (fixed height, scrolls internally) ────────── */}
        <div className="cc-chart-scroll" style={{ minHeight: '265px', maxHeight: '265px' }}>
          {chartData.length === 0 ? (
            <SearchEmptyState 
              searchFilter={searchFilter}
              title={`No Stores Found for "${searchFilter}"`}
              subtitle="Try a different store code or clear your search."
              onClearSearch={() => setSearchFilter('')}
            />
          ) : (
            <>
              {chartView === 'grouped' && <MemoizedValidationChart chartData={chartData} onCellClick={handleCellClick} />}
              {chartView === 'progress' && <MemoizedProgressChart chartData={chartData} onCellClick={handleCellClick} />}
              {chartView === 'wrong_hu' && <MemoizedWrongHUChart chartData={chartData} searchFilter={searchFilter} onClearSearch={() => setSearchFilter('')} onCellClick={handleCellClick} />}
            </>
          )}
        </div>
      </div>

      {/* ── Native Data Grid ─────────────────────────────────────────────── */}
      <DashboardDataGrid
        title={
          <span>
            STORE VALIDATION{' '}
            <span className="hide-on-mobile">SUMMARY </span>
            <span className="hide-on-mobile" style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', textTransform: 'none' }}>
              ({tableData.length} store{tableData.length !== 1 ? 's' : ''})
            </span>
          </span>
        }
        headerAction={
          <CustomDropdown
            options={tableSortOptions}
            value={tableSort}
            onChange={(val) => setTableSort(val)}
            prefix="Sort:"
            buttonStyle={{ minWidth: 'auto', gap: '8px' }}
            menuStyle={{ left: 'auto', right: 0, minWidth: '180px' }}
          />
        }
        headers={[
          'Store', 'Date', 'Received HU', 'Validated HU', 'HHT Validated', 'Pending', 'Wrong HU'
        ]}
        data={tableData}
        emptyStateContent={
          <tr>
            <td colSpan={7} className="cc-data-grid-empty-cell">
              No validation data found
            </td>
          </tr>
        }
        renderRow={(row, idx) => {
          const pending = Number(row.STORE_PENDING_QTY || 0);
          const wrong = Number(row.HU_WRONG_QTY || 0);
          const received = Number(row.HU_RECEIVED_QTY || 0);
          const validated = Number(row.HU_VALIDATED_QTY || 0);
          const hhtValidated = Number(row.HHT_VALIDATE_QTY || 0);

          const validatedColor = validated < received ? '#dc2626' : '#16a34a';
          const hhtColor = hhtValidated < validated ? '#dc2626' : COLOR_HHT;

          return (
            <tr key={row.STORE || idx} className="cc-data-grid-tr">
              <td className="cc-data-grid-td cc-data-grid-td-bold">
                <div 
                  className="cc-row-tooltip-wrapper sv-clickable-store"
                  onClick={() => handleStoreClick(row.STORE, row.DATE)}
                  title="Click to view Store GRC Report"
                >
                  {row.STORE || '—'}
                  {row.STORE_NAME && (
                    <div className="cc-row-tooltip">
                      {row.STORE_NAME}
                    </div>
                  )}
                </div>
              </td>
              <td className="cc-data-grid-td" style={{ fontSize: '12px', color: '#64748b' }}>
                {row.DATE ? row.DATE.split(' ')[0] : '—'}
              </td>
              <td className="cc-data-grid-td">
                <span 
                  className="sv-clickable-cell"
                  style={{ color: COLOR_RECEIVED, fontWeight: 700 }}
                  onClick={() => handleCellClick(row, '4')}
                  title="Click to view Received HUs in GRC Report (Status: 4)"
                >
                  {received.toLocaleString('en-IN')}
                </span>
              </td>
              <td className="cc-data-grid-td">
                <span 
                  className="sv-clickable-cell"
                  style={{ color: validatedColor, fontWeight: 700 }}
                  onClick={() => handleCellClick(row, '1')}
                  title="Click to view Validated HUs in GRC Report (Status: 1)"
                >
                  {validated.toLocaleString('en-IN')}
                </span>
              </td>
              <td className="cc-data-grid-td">
                <span 
                  className="sv-clickable-cell"
                  style={{ color: hhtColor, fontWeight: 700 }}
                  onClick={() => handleCellClick(row, '2')}
                  title="Click to view HHT Validated in GRC Report (Status: 2)"
                >
                  {hhtValidated.toLocaleString('en-IN')}
                </span>
              </td>
              <td className="cc-data-grid-td">
                {pending > 0 ? (
                  <span 
                    className="sv-clickable-badge"
                    onClick={() => handleCellClick(row, '3')}
                    title="Click to view Pending HUs in GRC Report (Status: 3)"
                    style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', minWidth: '70px', background: '#fef3c7', color: '#d97706', fontWeight: 700, borderRadius: '6px', padding: '2px 8px', fontSize: '12px' }}
                  >
                    {pending.toLocaleString('en-IN')}
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', minWidth: '70px', background: '#dcfce7', color: '#16a34a', fontWeight: 700, borderRadius: '6px', padding: '2px 8px', fontSize: '12px' }}>✓ Clear</span>
                )}
              </td>
              <td className="cc-data-grid-td">
                {wrong > 0 ? (
                  <span 
                    className="sv-clickable-badge"
                    onClick={() => handleCellClick(row, '0')}
                    title="Click to view Wrong HUs in GRC Report (Status: 0)"
                    style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', minWidth: '70px', background: '#fee2e2', color: '#dc2626', fontWeight: 700, borderRadius: '6px', padding: '2px 8px', fontSize: '12px' }}
                  >
                    ✕ {wrong.toLocaleString('en-IN')}
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', minWidth: '70px', background: '#dcfce7', color: '#16a34a', fontWeight: 700, borderRadius: '6px', padding: '2px 8px', fontSize: '12px' }}>✓ Clean</span>
                )}
              </td>
            </tr>
          );
        }}
      />

    </section>
  );
}




