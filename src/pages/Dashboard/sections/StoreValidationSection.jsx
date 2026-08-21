import React, { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { useStoreDashboard } from '../../../hooks/useDashboardData';
import CurvedCard from '../../../components/common/CurvedCard';
import KpiCard from '../../../components/charts/KpiCard';
import GroupedBarChart from '../../../components/charts/GroupedBarChart';
import DonutChart from '../../../components/charts/DonutChart';
import StoreRankList from '../../../components/charts/StoreRankList';
import '../../../components/charts/DashboardSection.css';

// SVG Icons
const Icons = {
  Truck: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>,
  CheckCircle: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
  Clock: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  AlertTriangle: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
};

export default function StoreValidationSection() {
  const { data, totals, isLoading, error, refresh } = useStoreDashboard();

  // Derived Metrics for Charts & Lists
  const { barData, donutData, rankList, totalReceived } = useMemo(() => {
    if (!data || !totals) return { barData: [], donutData: [], rankList: [], totalReceived: 0 };

    // 1. Bar Chart Data (Top 10 stores by Received Qty)
    const sortedData = [...data].sort((a, b) => Number(b.HU_RECEIVED_QTY || 0) - Number(a.HU_RECEIVED_QTY || 0));
    const barData = sortedData.slice(0, 10).map(row => ({
      name: row.STORE,
      fullName: row.STORE_NAME,
      Received: Number(row.HU_RECEIVED_QTY || 0),
      Validated: Number(row.HU_VALIDATED_QTY || 0)
    }));

    // 2. Donut Chart Data (Global Breakdowns)
    const totalReceived = Number((totals.HU_RECEIVED_QTY || '0').replace(/,/g, ''));
    const validatedRaw = Number((totals.HU_VALIDATED_QTY || '0').replace(/,/g, ''));
    const pendingRaw = Number((totals.STORE_PENDING_QTY || '0').replace(/,/g, ''));
    const wrongRaw = Number((totals.HU_WRONG_QTY || '0').replace(/,/g, ''));
    
    const donutData = [
      { name: 'Validated', value: validatedRaw, color: '#10b981' },
      { name: 'Pending', value: pendingRaw, color: '#f59e0b' },
      { name: 'Wrong/Error', value: wrongRaw, color: '#ef4444' }
    ].filter(d => d.value > 0);

    // 3. Rank List (Stores with Highest Pending Validations)
    const rankList = [...data]
      .filter(row => Number(row.STORE_PENDING_QTY || 0) > 0)
      .sort((a, b) => Number(b.STORE_PENDING_QTY || 0) - Number(a.STORE_PENDING_QTY || 0))
      .slice(0, 5);

    return { barData, donutData, rankList, totalReceived };
  }, [data, totals]);

  const handleStoreClick = (storeData) => {
    console.log('Navigate to store validation report:', storeData.STORE || storeData.name);
  };

  if (isLoading) {
    return (
      <section className="ds-section">
        <div className="ds-skeleton-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[1,2,3,4].map(i => <div key={i} className="ds-skeleton-box" style={{ height: '140px' }}><div className="ds-shimmer" /></div>)}
        </div>
        <div className="ds-skeleton-row ds-charts-row--2col">
          <div className="ds-skeleton-box" style={{ height: '350px' }}><div className="ds-shimmer" /></div>
          <div className="ds-skeleton-box" style={{ height: '350px' }}><div className="ds-shimmer" /></div>
        </div>
      </section>
    );
  }

  if (error) {
    return <div className="ds-error">{error}</div>;
  }

  return (
    <section className="ds-section">
      <div className="ds-header" style={{ alignItems: 'center', padding: '20px', background: '#fff', flexWrap: 'nowrap' }}>
        <div className="ds-header-text">
          <h1 style={{ whiteSpace: 'nowrap' }}>Store Validation</h1>
          <p>Monitor HU validation pipeline, store GRC processing, and pending discrepancies.</p>
        </div>
        <div className="ds-header-actions" style={{ alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
          <button onClick={refresh} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#0f172a', fontWeight: '500' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* 1. KPI Row (4 cols) */}
      <div className="ds-kpi-row">
        <CurvedCard
          title="Total HU Received"
          value={totals?.HU_RECEIVED_QTY || '0'}
          waveColor={['#ff0000ff', '#ffaeaeff']} // Crimson gradient
          icon={<Icons.Truck />}
        />
        <KpiCard
          title="Total HU Validated"
          value={totals?.HU_VALIDATED_QTY || '0'}
          badge="Processed"
          badgeVariant="success"
          icon={<Icons.CheckCircle />}
        />
        <KpiCard
          title="Pending Validation"
          value={totals?.STORE_PENDING_QTY || '0'}
          subtext="waiting on stores"
          badgeVariant="warning"
          icon={<Icons.Clock />}
        />
        <KpiCard
          title="Wrong / Error HU"
          value={totals?.HU_WRONG_QTY || '0'}
          badgeVariant="danger"
          icon={<Icons.AlertTriangle />}
        />
      </div>

      {/* 2. Charts Row */}
      <div className="ds-charts-row ds-charts-row--2col">
        {/* Left: Grouped Bar Chart */}
        <div className="ds-card">
          <div className="ds-card-title--flex">
            <h3>Received vs Validated (Top 10 Stores)</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Click a bar for details</span>
          </div>
          <GroupedBarChart
            data={barData}
            bars={[
              { dataKey: 'Received', color: '#e11d48', label: 'Received HU' },
              { dataKey: 'Validated', color: '#fda4af', label: 'Validated HU' }
            ]}
            height={280}
            /* onBarClick={handleStoreClick} */
          />
        </div>

        {/* Right: Donut Chart Breakdown */}
        <div className="ds-card">
          <h3 className="ds-card-title">Global Validation Status</h3>
          <DonutChart
            segments={donutData}
            centerText={totalReceived.toLocaleString('en-IN')}
            centerSubtext="Total Received"
            height={280}
          />
        </div>
      </div>

      {/* 3. Quick-List Row */}
      <div className="ds-charts-row ds-charts-row--single ds-grow">
        <div className="ds-card">
          <div className="ds-card-title--flex">
            <h3>Highest Pending Backlogs</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Click a store for detailed report</span>
          </div>
          <StoreRankList
            items={rankList}
            labelKey="STORE_NAME"
            sublabelKey="STORE"
            valueKey="STORE_PENDING_QTY"
            diffKey="HU_WRONG_QTY"
            diffLabel="Wrong HUs:"
            formatValue={(val) => `${Number(val).toLocaleString('en-IN')} Pending`}
            statusFn={() => 'warning'}
            emptyText="All stores have fully validated their shipments."
            onItemClick={handleStoreClick}
          />
        </div>
      </div>

    </section>
  );
}
