import React, { useMemo } from 'react';
import { useVoidDashboard } from '../../../hooks/useDashboardData';
import CurvedCard from '../../../components/common/CurvedCard';
import KpiCard from '../../../components/charts/KpiCard';
import GroupedBarChart from '../../../components/charts/GroupedBarChart';
import SemiDonutChart from '../../../components/charts/SemiDonutChart';
import StoreRankList from '../../../components/charts/StoreRankList';
import '../../../components/charts/DashboardSection.css';

// SVG Icons
const Icons = {
  Trash: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  Barcode: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5v14M8 5v14M12 5v14M17 5v14M21 5v14"></path></svg>,
  Alert: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>,
};

export default function VoidDashboardSection() {
  const { data, totals, isLoading, error } = useVoidDashboard();

  // Derived Metrics for Charts & Lists
  const { barData, rankList, encodePercent, totalVoidRaw, encodeRaw } = useMemo(() => {
    if (!data || !totals) return { barData: [], rankList: [], encodePercent: 0, totalVoidRaw: 0, encodeRaw: 0 };

    // 1. Bar Chart Data (Top 10 stores by Void Qty)
    const sortedData = [...data].sort((a, b) => Number(b.VOID_QTY || 0) - Number(a.VOID_QTY || 0));
    const barData = sortedData.slice(0, 10).map(row => ({
      name: row.STORE,
      fullName: row.STORE_NAME,
      Void: Number(row.VOID_QTY || 0),
      Encoded: Number(row.ENCODE_QTY || 0)
    }));

    // 2. Global Breakdown for SemiDonut
    const totalVoidRaw = Number((totals.VOID_QTY || '0').replace(/,/g, ''));
    const encodeRaw = Number((totals.ENCODE_QTY || '0').replace(/,/g, ''));
    const encodePercent = totalVoidRaw > 0 ? ((encodeRaw / totalVoidRaw) * 100) : 0;

    // 3. Rank List (Stores with Highest Pending/Difference)
    const rankList = [...data]
      .filter(row => Number(row.DIFFERENCE_QTY || 0) > 0)
      .sort((a, b) => Number(b.DIFFERENCE_QTY || 0) - Number(a.DIFFERENCE_QTY || 0))
      .slice(0, 5);

    return { barData, rankList, encodePercent, totalVoidRaw, encodeRaw };
  }, [data, totals]);

  const handleStoreClick = (storeData) => {
    console.log('Navigate to store void report:', storeData.STORE || storeData.name);
  };

  if (isLoading) {
    return (
      <section className="ds-section">
        <div className="ds-skeleton-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[1,2,3].map(i => <div key={i} className="ds-skeleton-box" style={{ height: '140px' }}><div className="ds-shimmer" /></div>)}
        </div>
        <div className="ds-skeleton-row ds-charts-row--equal">
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
      <div className="ds-header">
        <div className="ds-header-text">
          <h1>Void Dashboard</h1>
          <p>Track voided items vs successfully encoded items.</p>
        </div>
      </div>

      {/* 1. KPI Row (3 cols since Void only has 3 main stats) */}
      <div className="ds-kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <CurvedCard
          title="Total Void Qty"
          value={totals?.VOID_QTY || '0'}
          waveColor={['#475569', '#0f172a']}
          icon={<Icons.Trash />}
        />
        <KpiCard
          title="Encoded Qty"
          value={totals?.ENCODE_QTY || '0'}
          badgeVariant="success"
          icon={<Icons.Barcode />}
        />
        <KpiCard
          title="Pending Voids"
          value={totals?.DIFFERENCE_QTY || '0'}
          badge="Action Needed"
          badgeVariant="danger"
          icon={<Icons.Alert />}
        />
      </div>

      {/* 2. Charts Row */}
      <div className="ds-charts-row ds-charts-row--equal">
        {/* Left: Grouped Bar Chart */}
        <div className="ds-card">
          <div className="ds-card-title--flex">
            <h3>Void vs Encoded (Top 10)</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Click a bar for details</span>
          </div>
          <GroupedBarChart
            data={barData}
            bars={[
              { dataKey: 'Void', color: '#64748b', label: 'Void Qty' },
              { dataKey: 'Encoded', color: '#8b5cf6', label: 'Encoded Qty' }
            ]}
            height={280}
            onBarClick={handleStoreClick}
          />
        </div>

        {/* Right: SemiDonut Chart */}
        <div className="ds-card">
          <h3 className="ds-card-title">Overall Encoding Completion</h3>
          <div style={{ marginTop: '20px' }}>
            <SemiDonutChart
              value={encodeRaw}
              maxValue={totalVoidRaw}
              centerLabel="Encoded"
              primaryColor="#8b5cf6"
            />
          </div>
        </div>
      </div>

      {/* 3. Quick-List Row */}
      <div className="ds-charts-row ds-charts-row--single">
        <div className="ds-card">
          <div className="ds-card-title--flex">
            <h3>Highest Pending Voids</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Click a store for detailed report</span>
          </div>
          <StoreRankList
            items={rankList}
            labelKey="STORE_NAME"
            sublabelKey="STORE"
            valueKey="DIFFERENCE_QTY"
            diffKey="VOID_QTY"
            diffLabel="Total Voids:"
            formatValue={(val) => `${Number(val).toLocaleString('en-IN')} Pending`}
            statusFn={() => 'danger'}
            emptyText="All voids have been successfully encoded."
            onItemClick={handleStoreClick}
          />
        </div>
      </div>

    </section>
  );
}
