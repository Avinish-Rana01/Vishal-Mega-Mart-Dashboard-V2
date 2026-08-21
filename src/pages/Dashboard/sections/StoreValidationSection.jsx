import React, { useState, useMemo } from 'react';
import { useStoreDashboard } from '../../../hooks/useDashboardData';
import KpiCard from '../../../components/charts/KpiCard';
import SectionHeader, { DateBadge } from '../../../components/common/SectionHeader';
import CustomDropdown from '../../../components/common/CustomDropdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import '../../../components/charts/DashboardSection.css';
import './common.css';
import './CycleCountSection.css';

// SVG Icons
const Icons = {
  CheckCircle: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
  AlertTriangle: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
  Smartphone: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>,
  Tag: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>,
};

// ─── Colors ───────────────────────────────────────────────────────────────────
const COLOR_RECEIVED  = '#3b82f6'; // blue
const COLOR_VALIDATED = '#10b981'; // green
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
      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '10px', fontSize: '13px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
        {d.STORE_NAME || d.STORE}
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
const WrongHUBadgeColumn = ({ chartData, rowHeight, showPending = true }) => (
  <div style={{ width: '70px', display: 'flex', flexDirection: 'column', pointerEvents: 'none', flexShrink: 0, paddingTop: '20px' }}>
    {chartData.map((d, i) => {
      const wrong = Number(d.HU_WRONG_QTY || 0);
      const pending = Number(d.STORE_PENDING_QTY || 0);
      const hasError = wrong > 0;
      const hasPending = pending > 0;

      return (
        <div key={d.STORE || i} style={{ height: rowHeight, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '4px' }}>
          {hasError ? (
            <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: '6px', padding: '2px 7px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
              ✕ {wrong}
            </div>
          ) : (
            <div style={{ background: '#dcfce7', color: '#16a34a', borderRadius: '6px', padding: '2px 7px', fontSize: '11px', fontWeight: 700 }}>
              ✓
            </div>
          )}
          {showPending && hasPending && (
            <div style={{ background: '#fef3c7', color: '#d97706', borderRadius: '6px', padding: '2px 7px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {pending} ⏳
            </div>
          )}
        </div>
      );
    })}
  </div>
);

// ─── 1. Grouped Bar Chart (Received vs Validated) ─────────────────────────────
const MemoizedValidationChart = React.memo(({ chartData }) => {
  const ROW_HEIGHT = 16;
  const chartHeight = Math.max(220, chartData.length * ROW_HEIGHT * 2 + 40);

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 50, left: 0, bottom: 5 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis dataKey="STORE" type="category" tick={{ fontSize: 12, fill: '#0f172a', fontWeight: 600 }} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<ValidationTooltip />} cursor={{ fill: 'rgba(241,245,249,0.6)' }} />
            <Bar dataKey="HU_RECEIVED_QTY" name="Received HU" barSize={ROW_HEIGHT} fill={COLOR_RECEIVED} radius={[4,4,4,4]} isAnimationActive={false}>
              <LabelList dataKey="HU_RECEIVED_QTY" position="right" style={{ fontSize: '11px', fontWeight: 600, fill: COLOR_RECEIVED }} />
            </Bar>
            <Bar dataKey="HU_VALIDATED_QTY" name="Validated HU" barSize={ROW_HEIGHT} fill={COLOR_VALIDATED} radius={[4,4,4,4]} isAnimationActive={false}>
              <LabelList dataKey="HU_VALIDATED_QTY" position="right" style={{ fontSize: '11px', fontWeight: 600, fill: COLOR_VALIDATED }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <WrongHUBadgeColumn chartData={chartData} rowHeight={ROW_HEIGHT * 2} />
    </div>
  );
});

// ─── 2. Progress Bar Chart (HHT Validated + Pending) ──────────────────────────
const MemoizedProgressChart = React.memo(({ chartData }) => {
  const ROW_HEIGHT = 20;
  const chartHeight = Math.max(220, chartData.length * ROW_HEIGHT + 40);

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 50, left: 0, bottom: 5 }} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis dataKey="STORE" type="category" tick={{ fontSize: 12, fill: '#0f172a', fontWeight: 600 }} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<ValidationTooltip />} cursor={{ fill: 'rgba(241,245,249,0.6)' }} />
            <Bar dataKey="HHT_VALIDATE_QTY" stackId="a" name="HHT Validated" barSize={ROW_HEIGHT} fill={COLOR_HHT} radius={[4,0,0,4]} isAnimationActive={false}>
              <LabelList dataKey="HHT_VALIDATE_QTY" position="insideLeft" style={{ fontSize: '11px', fontWeight: 600, fill: '#fff' }} formatter={(val) => val > 0 ? val : ''} />
            </Bar>
            <Bar dataKey="STORE_PENDING_QTY" stackId="a" name="Pending" barSize={ROW_HEIGHT} fill={COLOR_PENDING} radius={[0,4,4,0]} isAnimationActive={false}>
              <LabelList dataKey="STORE_PENDING_QTY" position="right" style={{ fontSize: '11px', fontWeight: 600, fill: '#d97706' }} formatter={(val) => val > 0 ? val : ''} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <WrongHUBadgeColumn chartData={chartData} rowHeight={ROW_HEIGHT} showPending={false} />
    </div>
  );
});

// ─── 3. Wrong HU Distribution Chart ───────────────────────────────────────────
const MemoizedWrongHUChart = React.memo(({ chartData }) => {
  const ROW_HEIGHT = 20;
  const filteredData = chartData.filter(d => Number(d.HU_WRONG_QTY || 0) > 0);
  const chartHeight = Math.max(220, filteredData.length * ROW_HEIGHT + 40);

  if (filteredData.length === 0) {
    return (
      <div style={{ height: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '15px', background: '#ecfdf5', borderRadius: '12px', border: '1px solid #34d399' }}>
        <Icons.CheckCircle />
        <span style={{ marginTop: '12px', fontWeight: 600 }}>All stores are clean! No Wrong HUs detected.</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={filteredData} layout="vertical" margin={{ top: 20, right: 50, left: 0, bottom: 5 }} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis dataKey="STORE" type="category" tick={{ fontSize: 12, fill: '#0f172a', fontWeight: 600 }} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<ValidationTooltip />} cursor={{ fill: 'rgba(254,226,226,0.6)' }} />
            <Bar dataKey="HU_WRONG_QTY" name="Wrong HU" barSize={ROW_HEIGHT} fill={COLOR_WRONG} radius={[4,4,4,4]} isAnimationActive={false}>
              <LabelList dataKey="HU_WRONG_QTY" position="right" style={{ fontSize: '11px', fontWeight: 600, fill: COLOR_WRONG }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

// ─── View & Sort options ──────────────────────────────────────────────────────
const VIEW_OPTIONS = [
  { value: 'grouped', label: 'Received vs Validated' },
  { value: 'progress', label: 'Validation Progress' },
  { value: 'wrong_hu', label: 'Wrong HU Distribution' },
];

const SORT_OPTIONS = [
  { value: 'PENDING_DESC', label: 'Highest Pending' },
  { value: 'VALIDATED_ASC', label: 'Lowest Validated' },
  { value: 'WRONG_DESC',    label: 'Highest Wrong HU' },
  { value: 'STORE_ASC',     label: 'Store Code (A-Z)' },
];

// ═══════════════════════════════════════════════════════════════════════════════
export default function StoreValidationSection() {
  const { data, totals, isLoading, error } = useStoreDashboard();

  const [chartView, setChartView] = useState('grouped');
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState('PENDING_DESC');

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
    } else {
      result.sort((a, b) => (a.STORE || '').localeCompare(b.STORE || ''));
    }

    return result;
  }, [data, searchFilter, sortBy]);

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <section className="cc-container">
        <SectionHeader title="Store Validation" rightContent={<DateBadge />} />
        <div className="cc-kpi-row">
          {[1,2,3,4].map(i => <div key={i} className="ds-skeleton-box" style={{ height: '80px', borderRadius: '12px' }}><div className="ds-shimmer" /></div>)}
        </div>
        <div className="ds-skeleton-box" style={{ height: '380px', borderRadius: '12px' }}><div className="ds-shimmer" /></div>
      </section>
    );
  }

  if (error) return <div className="ds-error">{error}</div>;

  return (
    <section className="cc-container">
      <SectionHeader title="Store Validation" rightContent={<DateBadge />} />

      {/* ── KPI Row ─────────────────────────────────────────────────────── */}
      <div className="cc-kpi-row">
        <KpiCard
          title="Total HU Validated"
          value={`${totals?.HU_VALIDATED_QTY || '0'} / ${totals?.HU_RECEIVED_QTY || '0'}`}
          badge="Processed"
          badgeVariant="success"
          icon={<Icons.CheckCircle />}
        />
        <KpiCard
          title="HHT Validated"
          value={totals?.HHT_VALIDATE_QTY || '0'}
          badge="Scanned"
          badgeVariant="info"
          icon={<Icons.Smartphone />}
        />
        <KpiCard
          title="Encoded Qty"
          value={totals?.ENCODED_QTY || '0'}
          badge="Tags"
          badgeVariant="neutral"
          icon={<Icons.Tag />}
        />
        <KpiCard
          title="Wrong / Error HU"
          value={totals?.HU_WRONG_QTY || '0'}
          badgeVariant="danger"
          icon={<Icons.AlertTriangle />}
        />
      </div>

      {/* ── Main Chart Card ──────────────────────────────────────────────── */}
      <div className="cc-card" style={{ flex: 1, minHeight: 0 }}>

        {/* Top Toolbar: Title dropdown (left) + Sort + Search (right) */}
        <div className="vmm-toolbar-header" style={{ minHeight: '40px' }}>
          <h3 className="vmm-toolbar-title" style={{ display: 'flex', alignItems: 'center' }}>
            <CustomDropdown
              options={VIEW_OPTIONS}
              value={chartView}
              onChange={setChartView}
              buttonStyle={{ backgroundColor: 'transparent', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%231e3a8a\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundPosition: 'right 4px center', border: 'none', paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: '18px', fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit', boxShadow: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              menuStyle={{ left: 0, right: 'auto', minWidth: '260px', textTransform: 'none', letterSpacing: 'normal' }}
            />
          </h3>

          <div className="vmm-toolbar-controls">
            <CustomDropdown
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={setSortBy}
              prefix="Sort:"
              buttonStyle={{ minWidth: '180px', justifyContent: 'space-between' }}
              menuStyle={{ left: 'auto', right: 0, minWidth: '200px' }}
            />

            {/* Search */}
            <div className="vmm-search-container">
              <span className="vmm-search-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
                <button className="vmm-search-clear" onClick={() => setSearchFilter('')}>×</button>
              )}
            </div>
          </div>
        </div>

        {/* ── Fixed Legend Strip (Dynamic based on View) ────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px', padding: '4px 8px 6px', fontSize: '12px', color: '#475569', fontWeight: 500, borderBottom: '1px solid #e8eaf0' }}>
          {chartView === 'grouped' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: COLOR_RECEIVED }} /> Received HU
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: COLOR_VALIDATED }} /> Validated HU
              </div>
            </>
          )}
          {chartView === 'progress' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: COLOR_HHT }} /> HHT Validated
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: COLOR_PENDING }} /> Pending
              </div>
            </>
          )}
          {chartView === 'wrong_hu' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: COLOR_WRONG }} /> Wrong HU
            </div>
          )}
          {chartView !== 'wrong_hu' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#fee2e2', border: '1.5px solid #ef4444' }} /> Wrong HU
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#fef3c7', border: '1.5px solid #f59e0b' }} /> Pending
              </div>
            </>
          )}
        </div>

        {/* ── Chart Scroll Area (fixed height, scrolls internally) ────────── */}
        <div className="cc-chart-scroll">
          {chartData.length === 0 ? (
            <div style={{ height: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              No matching stores found.
              <button
                onClick={() => setSearchFilter('')}
                style={{ marginTop: '16px', background: '#fff', border: '1px solid #e2e8f0', color: '#4338ca', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Clear Search
              </button>
            </div>
          ) : (
            <>
              {chartView === 'grouped' && <MemoizedValidationChart chartData={chartData} />}
              {chartView === 'progress' && <MemoizedProgressChart chartData={chartData} />}
              {chartView === 'wrong_hu' && <MemoizedWrongHUChart chartData={chartData} />}
            </>
          )}
        </div>
      </div>

      {/* ── Native Data Grid ─────────────────────────────────────────────── */}
      <div className="cc-data-grid-card">
        <div className="cc-data-grid-header">
          <h3 className="cc-data-grid-title">ALL STORES · VALIDATION SUMMARY</h3>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{chartData.length} store{chartData.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="cc-native-table-scroll">
          <div className="cc-data-grid-inner-wrapper">
            <table className="cc-data-grid-table">
              <thead className="cc-data-grid-thead">
                <tr>
                  <th className="cc-data-grid-th">Store</th>
                  <th className="cc-data-grid-th">Date</th>
                  <th className="cc-data-grid-th">Received HU</th>
                  <th className="cc-data-grid-th">Validated HU</th>
                  <th className="cc-data-grid-th">HHT Validated</th>
                  <th className="cc-data-grid-th">Pending</th>
                  <th className="cc-data-grid-th">Wrong HU</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, idx) => {
                  const pending = Number(row.STORE_PENDING_QTY || 0);
                  const wrong   = Number(row.HU_WRONG_QTY || 0);
                  return (
                    <tr key={row.STORE || idx} className="cc-data-grid-tr">
                      <td className="cc-data-grid-td cc-data-grid-td-bold">
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>{row.STORE}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{row.STORE_NAME}</div>
                      </td>
                      <td className="cc-data-grid-td" style={{ fontSize: '12px', color: '#64748b' }}>
                        {row.DATE ? row.DATE.split(' ').slice(0, 3).join(' ') : '—'}
                      </td>
                      <td className="cc-data-grid-td">
                        <span style={{ color: COLOR_RECEIVED, fontWeight: 700 }}>{Number(row.HU_RECEIVED_QTY || 0).toLocaleString('en-IN')}</span>
                      </td>
                      <td className="cc-data-grid-td">
                        <span style={{ color: COLOR_VALIDATED, fontWeight: 700 }}>{Number(row.HU_VALIDATED_QTY || 0).toLocaleString('en-IN')}</span>
                      </td>
                      <td className="cc-data-grid-td">
                        <span style={{ color: COLOR_HHT, fontWeight: 700 }}>{Number(row.HHT_VALIDATE_QTY || 0).toLocaleString('en-IN')}</span>
                      </td>
                      <td className="cc-data-grid-td">
                        {pending > 0 ? (
                          <span style={{ background: '#fef3c7', color: '#d97706', fontWeight: 700, borderRadius: '6px', padding: '2px 8px', fontSize: '12px' }}>
                            {pending.toLocaleString('en-IN')} ⏳
                          </span>
                        ) : (
                          <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Clear</span>
                        )}
                      </td>
                      <td className="cc-data-grid-td">
                        {wrong > 0 ? (
                          <span style={{ background: '#fee2e2', color: '#dc2626', fontWeight: 700, borderRadius: '6px', padding: '2px 8px', fontSize: '12px' }}>
                            ✕ {wrong.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Clean</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {chartData.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                      No stores found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </section>
  );
}
