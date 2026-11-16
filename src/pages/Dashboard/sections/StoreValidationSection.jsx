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
import { saveDashboardReturnPoint, useSessionState } from '../../../utils/dashboardNavigationMemory';



// ─── Colors ───────────────────────────────────────────────────────────────────
const COLOR_VALIDATED = '#10b981'; // green (WH Validated)
const COLOR_HHT       = '#6366f1'; // indigo (Store Validated)
const COLOR_PENDING   = '#f59e0b'; // amber (Pending for Validation)
const COLOR_WRONG     = '#ef4444'; // red (Error)

// ─── Legend All-Clear Pill ────────────────────────────────────────────────────
function AllClearLegend() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', padding: '4px 8px 6px', fontSize: '12px', color: '#059669', fontWeight: 500, borderBottom: '1px solid #e8eaf0' }}>
      <Icons.Check size={14} strokeWidth={3} /> All Clear
    </div>
  );
}

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
        <span style={{ color: '#94a3b8' }}>WH Validated</span>     <span style={{ fontWeight: 700, color: COLOR_VALIDATED }}>{Number(d.HU_VALIDATED_QTY || 0).toLocaleString('en-IN')}</span>
        <span style={{ color: '#94a3b8' }}>Store Validated</span>  <span style={{ fontWeight: 700, color: COLOR_HHT }}>{Number(d.HHT_VALIDATE_QTY || 0).toLocaleString('en-IN')}</span>
        <span style={{ color: '#94a3b8' }}>Pending</span>          <span style={{ fontWeight: 700, color: pending > 0 ? '#f59e0b' : '#10b981' }}>{pending.toLocaleString('en-IN')}</span>
        <span style={{ color: '#94a3b8' }}>Wrong HU</span>         <span style={{ fontWeight: 700, color: wrong > 0 ? '#ef4444' : '#10b981' }}>{wrong.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}

// ─── 1. Grouped Bar Chart (WH Validated vs Store Validated) ──────────────────
const MemoizedValidationChart = React.memo(({ chartData, onCellClick }) => {
  const ROW_HEIGHT = 16;
  const GROUP_GAP = 16;
  const chartHeight = Math.max(220, chartData.length * (ROW_HEIGHT * 2 + GROUP_GAP) + 40);
  const [ref, hasBeenVisible, shouldAnimate] = useIsInViewport();

  return (
    <div ref={ref} style={{ display: 'flex', width: '100%', minHeight: chartHeight }}>
      {hasBeenVisible && (
        <div style={{ flex: 1, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 65, left: 0, bottom: 5 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="STORE" type="category" tick={{ fontSize: 12, fill: '#0f172a', fontWeight: 600 }} axisLine={false} tickLine={false} width={52} />
              <Tooltip content={<ValidationTooltip />} cursor={{ fill: 'rgba(241,245,249,0.6)' }} />
              <Bar 
                dataKey="HU_VALIDATED_QTY" 
                name="WH Validated" 
                barSize={ROW_HEIGHT} 
                fill={COLOR_VALIDATED} 
                radius={[4,4,4,4]} 
                isAnimationActive={shouldAnimate} 
                animationDuration={500} 
                animationEasing="ease-out"
                cursor="pointer"
                minPointSize={2}
                onClick={(entry) => onCellClick && onCellClick(entry, '1')}
              >
                <LabelList dataKey="HU_VALIDATED_QTY" position="right" style={{ fontSize: '11px', fontWeight: 600, fill: COLOR_VALIDATED }} />
              </Bar>
              <Bar 
                dataKey="HHT_VALIDATE_QTY" 
                name="Store Validated" 
                barSize={ROW_HEIGHT} 
                fill={COLOR_HHT} 
                radius={[4,4,4,4]} 
                isAnimationActive={shouldAnimate} 
                animationDuration={500} 
                animationEasing="ease-out"
                cursor="pointer"
                minPointSize={2}
                onClick={(entry) => onCellClick && onCellClick(entry, '2')}
              >
                <LabelList dataKey="HHT_VALIDATE_QTY" position="right" style={{ fontSize: '11px', fontWeight: 600, fill: COLOR_HHT }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
});

// ─── 2. Store Pending for Validation Chart (Highest Pending First) ───────────
const MemoizedPendingChart = React.memo(({ chartData, searchFilter, onClearSearch, onCellClick, sortDescending = true }) => {
  const ROW_HEIGHT = 20;
  const GROUP_GAP = 16;
  const filteredData = useMemo(() => {
    const nonZero = chartData.filter(d => Number(d.STORE_PENDING_QTY || 0) > 0);
    return nonZero.sort((a, b) => sortDescending
      ? Number(b.STORE_PENDING_QTY || 0) - Number(a.STORE_PENDING_QTY || 0)
      : Number(a.STORE_PENDING_QTY || 0) - Number(b.STORE_PENDING_QTY || 0)
    );
  }, [chartData, sortDescending]);
  const chartHeight = Math.max(220, filteredData.length * (ROW_HEIGHT + GROUP_GAP) + 40);
  const [ref, hasBeenVisible, shouldAnimate] = useIsInViewport();

  if (filteredData.length === 0) {
    if (searchFilter && searchFilter.trim().length > 0) {
      return (
        <SearchEmptyState 
          searchFilter={searchFilter}
          title={`No Pending Validations Found for "${searchFilter}"`}
          subtitle="Try another store or clear your search."
          onClearSearch={onClearSearch}
        />
      );
    }

    return (
      <GlobalEmptyState 
        title="No Pending Validations"
        subtitle="All stores are currently up to date"
        icon={Icons.CheckCircle}
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
              <Tooltip content={<ValidationTooltip />} cursor={{ fill: 'rgba(254,243,199,0.55)' }} />
              <Bar 
                dataKey="STORE_PENDING_QTY" 
                name="Store Pending" 
                barSize={ROW_HEIGHT} 
                fill={COLOR_PENDING} 
                radius={[4,4,4,4]} 
                isAnimationActive={shouldAnimate} 
                animationDuration={500} 
                animationEasing="ease-out"
                cursor="pointer"
                onClick={(entry) => onCellClick && onCellClick(entry, '3')}
              >
                <LabelList dataKey="STORE_PENDING_QTY" position="right" style={{ fontSize: '11px', fontWeight: 600, fill: '#d97706' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
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
  const [ref, hasBeenVisible, shouldAnimate] = useIsInViewport();

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
                isAnimationActive={shouldAnimate} 
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
  { value: 'grouped', label: 'WH Validated vs Store Validated' },
  { value: 'progress', label: 'Store Pending for Validation' },
  { value: 'wrong_hu', label: 'Wrong HU Distribution' },
];

// Note: SORT_OPTIONS is generated dynamically inside the component based on view

// ═══════════════════════════════════════════════════════════════════════════════
export default function StoreValidationSection() {
  const navigate = useNavigate();
  const { data: realData, totals: realTotals, isLoading, isRefreshing, error, highlightedStore, connectionStatus } = useStoreDashboard();
  const data = realData;
  const totals = useMemo(() => {
    if (!realTotals && (!data || data.length === 0)) return realTotals;
    const computedPending = (data && data.length > 0)
      ? data.reduce((sum, r) => sum + Number(r.STORE_PENDING_QTY || 0), 0)
      : realTotals?.STORE_PENDING_QTY || 0;

    return {
      ...(realTotals || {}),
      STORE_PENDING_QTY: typeof computedPending === 'number' ? computedPending.toLocaleString('en-IN') : computedPending
    };
  }, [realTotals, data]);


  const [chartView, setChartView] = useSessionState('sv_chart_view', 'grouped');
  const [searchFilter, setSearchFilter] = useSessionState('sv_search_filter', '');
  const [sortBy, setSortBy] = useSessionState('sv_sort_by', 'PENDING_DESC');
  const [tableSort, setTableSort] = useSessionState('sv_table_sort', 'PENDING_DESC');

  const handleStoreClick = useCallback((storeCode, rowDate) => {
    if (!storeCode) return;
    saveDashboardReturnPoint('store_validation');
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

    saveDashboardReturnPoint('store_validation');
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
    { value: 'VALIDATED_DESC', label: 'Highest WH Validated' }
  ], []);

  // Dynamically generate sort options based on current view
  const sortOptions = useMemo(() => {
    if (chartView === 'wrong_hu') {
      return [
        { value: 'WRONG_DESC', label: 'Highest Wrong HU' },
        { value: 'WRONG_ASC', label: 'Lowest Wrong HU' }
      ];
    }
    if (chartView === 'progress') {
      return [
        { value: 'PENDING_DESC', label: 'Highest Pending' },
        { value: 'PENDING_ASC', label: 'Lowest Pending' }
      ];
    }
    return [
      { value: 'PENDING_DESC', label: 'Highest Pending' },
      { value: 'VALIDATED_DESC', label: 'Highest WH Validated' },
      { value: 'VALIDATED_ASC', label: 'Lowest WH Validated' },
      { value: 'HHT_DESC', label: 'Highest Store Validated' }
    ];
  }, [chartView]);

  // Ensure cached/active sorts remain valid after view or option changes
  useEffect(() => {
    if (!sortOptions.find(opt => opt.value === sortBy)) {
      setSortBy(sortOptions[0].value);
    }
  }, [sortOptions, sortBy, setSortBy]);

  useEffect(() => {
    if (!tableSortOptions.find(opt => opt.value === tableSort)) {
      setTableSort(tableSortOptions[0].value);
    }
  }, [tableSortOptions, tableSort, setTableSort]);

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
    } else if (sortBy === 'PENDING_ASC') {
      result.sort((a, b) => Number(a.STORE_PENDING_QTY || 0) - Number(b.STORE_PENDING_QTY || 0));
    } else if (sortBy === 'VALIDATED_ASC') {
      result.sort((a, b) => Number(a.HU_VALIDATED_QTY || 0) - Number(b.HU_VALIDATED_QTY || 0));
    } else if (sortBy === 'WRONG_DESC') {
      result.sort((a, b) => Number(b.HU_WRONG_QTY || 0) - Number(a.HU_WRONG_QTY || 0));
    } else if (sortBy === 'WRONG_ASC') {
      result.sort((a, b) => Number(a.HU_WRONG_QTY || 0) - Number(b.HU_WRONG_QTY || 0));
    } else if (sortBy === 'VALIDATED_DESC') {
      result.sort((a, b) => Number(b.HU_VALIDATED_QTY || 0) - Number(a.HU_VALIDATED_QTY || 0));
    } else if (sortBy === 'HHT_DESC') {
      result.sort((a, b) => Number(b.HHT_VALIDATE_QTY || 0) - Number(a.HHT_VALIDATE_QTY || 0));
    } else {
      result.sort((a, b) => (a.STORE || '').localeCompare(b.STORE || ''));
    }

    return result;
  }, [data, searchFilter, sortBy]);

  const hasPendingHUs = useMemo(() => chartData.some(d => Number(d.STORE_PENDING_QTY || 0) > 0), [chartData]);
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
    } else if (tableSort === 'VALIDATED_DESC') {
      result.sort((a, b) => Number(b.HU_VALIDATED_QTY || 0) - Number(a.HU_VALIDATED_QTY || 0));
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
              {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </div>
            <DateBadge />
          </div>
        } 
      />

      {/* ── KPI Row ─────────────────────────────────────────────────────── */}
      <div className="cc-kpi-row" style={{ '--kpi-cols': 4 }}>
        <KpiCard2
          title="WH Validated"
          value={<LiveTickerValue value={totals?.HU_VALIDATED_QTY || 0} />}
          badge="Processed"
          badgeVariant="success"
          icon={<Icons.CheckCircle />}
        />
        <KpiCard2
          title="Store Validated"
          value={<LiveTickerValue value={totals?.HHT_VALIDATE_QTY || 0} />}
          badge="Verified"
          badgeVariant="purple"
          icon={<Icons.Smartphone />}
        />
        <KpiCard2
          title="Store Pending for Validation"
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

      {/* SPLIT LAYOUT FOR CHART AND TABLE */}
      <div className="cc-split-layout">
        {/* ── Main Chart Card ──────────────────────────────────────────────── */}
        <div className="cc-card">

        <ChartToolbar
          leftContent={
            <CustomDropdown
              options={VIEW_OPTIONS}
              value={chartView}
              onChange={(val) => {
                setChartView(val);
                const valid = sortOptions.some(o => o.value === sortBy);
                if (!valid) setSortBy(sortOptions[0].value);
              }}
              buttonStyle={{ backgroundColor: 'transparent', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%231e3a8a\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundPosition: 'right 4px center', border: 'none', paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: '18px', fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit', boxShadow: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              menuStyle={{ left: 0, right: 'auto', minWidth: '260px', textTransform: 'none', letterSpacing: 'normal' }}
            />
          }
          rightContent={
            <>
              <CustomDropdown
                options={sortOptions}
                value={sortBy}
                onChange={setSortBy}
                prefix="Sort:"
                buttonStyle={{ minWidth: 'auto', gap: '8px' }}
                menuStyle={{ left: 'auto', right: 0, minWidth: '200px' }}
              />
              <ChartSearchInput
                value={searchFilter}
                onChange={setSearchFilter}
                onClear={() => setSearchFilter('')}
                placeholder="Search store..."
              />
            </>
          }
        />

        {/* ── Legend Strip (Dynamic based on View) ────────────────── */}
        {chartView === 'grouped' && (
          <ChartLegend items={[
            { color: COLOR_VALIDATED, label: 'WH Validated' },
            { color: COLOR_HHT, label: 'Store Validated' },
          ]} />
        )}
        {chartView === 'progress' && (
          hasPendingHUs ? (
            <ChartLegend items={[{ color: COLOR_PENDING, label: 'Store Pending' }]} />
          ) : (
            <AllClearLegend />
          )
        )}
        {chartView === 'wrong_hu' && (
          hasWrongHUs ? (
            <ChartLegend items={[{ color: COLOR_WRONG, label: 'Wrong HU' }]} />
          ) : (
            <AllClearLegend />
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
              {chartView === 'progress' && <MemoizedPendingChart chartData={chartData} searchFilter={searchFilter} onClearSearch={() => setSearchFilter('')} onCellClick={handleCellClick} sortDescending={sortBy !== 'PENDING_ASC'} />}
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
          'Store', 'Date', 'WH Validated', 'Store Validated', 'Store Pending for Validation', 'Wrong HU'
        ]}
        data={tableData}
        tableClassName="sv-grid-table"
        innerWrapperStyle={{ minWidth: 'auto', width: '100%' }}
        tableStyle={{ width: '100%', tableLayout: 'auto' }}
        emptyStateContent={
          <tr>
            <td colSpan={6} className="cc-data-grid-empty-cell">
              No validation data found
            </td>
          </tr>
        }
        renderRow={(row, idx) => {
          const pending = Number(row.STORE_PENDING_QTY || 0);
          const wrong = Number(row.HU_WRONG_QTY || 0);
          const validated = Number(row.HU_VALIDATED_QTY || 0);
          const hhtValidated = Number(row.HHT_VALIDATE_QTY || 0);

          const validatedColor = '#16a34a';
          const hhtColor = hhtValidated < validated ? '#dc2626' : COLOR_HHT;

          const isRowHighlighted = highlightedStore && String(highlightedStore).toUpperCase() === String(row.STORE || '').toUpperCase();

          return (
            <tr key={row.STORE || idx} className={`cc-data-grid-tr ${isRowHighlighted ? 'row-updated-pulse' : ''}`}>
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
              <td className="cc-data-grid-td" style={{ fontSize: '11px', color: '#64748b' }}>
                {row.DATE ? row.DATE.split(' ')[0] : '—'}
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
                    style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', minWidth: '54px', background: '#fef3c7', color: '#d97706', fontWeight: 700, borderRadius: '6px', padding: '2px 6px', fontSize: '11px' }}
                  >
                    {pending.toLocaleString('en-IN')}
                  </span>
                ) : (
                  <span 
                    className="sv-clickable-badge"
                    onClick={() => handleCellClick(row, '3')}
                    title="Click to view Pending HUs in GRC Report (Status: 3)"
                    style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', minWidth: '54px', background: '#dcfce7', color: '#16a34a', fontWeight: 700, borderRadius: '6px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    ✓ Clear
                  </span>
                )}
              </td>
              <td className="cc-data-grid-td">
                {wrong > 0 ? (
                  <span 
                    className="sv-clickable-badge"
                    onClick={() => handleCellClick(row, '0')}
                    title="Click to view Wrong HUs in GRC Report (Status: 0)"
                    style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', minWidth: '54px', background: '#fee2e2', color: '#dc2626', fontWeight: 700, borderRadius: '6px', padding: '2px 6px', fontSize: '11px' }}
                  >
                    ✕ {wrong.toLocaleString('en-IN')}
                  </span>
                ) : (
                  <span 
                    className="sv-clickable-badge"
                    onClick={() => handleCellClick(row, '0')}
                    title="Click to view Wrong HUs in GRC Report (Status: 0)"
                    style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', minWidth: '54px', background: '#dcfce7', color: '#16a34a', fontWeight: 700, borderRadius: '6px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    ✓ Clean
                  </span>
                )}
              </td>
            </tr>
          );
        }}
      />
      </div>

    </section>
  );
}




