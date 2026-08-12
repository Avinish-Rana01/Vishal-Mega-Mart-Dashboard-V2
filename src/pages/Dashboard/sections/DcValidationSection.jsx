import React, { useMemo } from 'react';
import { useDcValidation } from '../../../hooks/useDashboardData';
import CurvedCard from '../../../components/common/CurvedCard';
import KpiCard from '../../../components/charts/KpiCard';
import GroupedBarChart from '../../../components/charts/GroupedBarChart';
import DonutChart from '../../../components/charts/DonutChart';
import StoreRankList from '../../../components/charts/StoreRankList';
import '../../../components/charts/DashboardSection.css';

// SVG Icons
const Icons = {
  CheckSquare: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>,
  Package: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
  Layers: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>,
};

export default function DcValidationSection() {
  const { data, totals, isLoading, error } = useDcValidation();

  // Derived Metrics for Charts & Lists
  const { barData, donutData, rankList } = useMemo(() => {
    if (!data || !totals) return { barData: [], donutData: [], rankList: [] };

    // 1. Bar Chart Data (Top 10 stores by Processed HU)
    const sortedData = [...data].sort((a, b) => Number(b.PROCESSED_HU || 0) - Number(a.PROCESSED_HU || 0));
    const barData = sortedData.slice(0, 10).map(row => ({
      name: row.Reciving_Plant?.substring(0, 8),
      fullName: row.Reciving_Plant,
      Processed: Number(row.PROCESSED_HU || 0),
      Unprocessed: Number(row.UNPROCESSED_HU || 0)
    }));

    // 2. Donut Chart Data (Global Breakdowns)
    const processedRaw = Number(totals.PROCESSED_HU || 0);
    const unprocessedRaw = Number(totals.UNPROCESSED_HU || 0);
    
    const donutData = [
      { name: 'Processed HU', value: processedRaw, color: '#10b981' },
      { name: 'Unprocessed HU', value: unprocessedRaw, color: '#f97316' },
    ].filter(d => d.value > 0);

    // 3. Rank List (Stores with Highest Unprocessed HU)
    const rankList = [...data]
      .filter(row => Number(row.UNPROCESSED_HU || 0) > 0)
      .sort((a, b) => Number(b.UNPROCESSED_HU || 0) - Number(a.UNPROCESSED_HU || 0))
      .slice(0, 5);

    return { barData, donutData, rankList };
  }, [data, totals]);

  const handleStoreClick = (storeData) => {
    console.log('Navigate to DC validation store:', storeData.fullName || storeData.Reciving_Plant);
  };

  if (isLoading) {
    return (
      <section className="ds-section">
        <div className="ds-skeleton-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[1,2,3].map(i => <div key={i} className="ds-skeleton-box" style={{ height: '140px' }}><div className="ds-shimmer" /></div>)}
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
      <div className="ds-header">
        <div className="ds-header-text">
          <h1>DC Validation</h1>
          <p>Handling Units (HU) processed and validated at the Distribution Center.</p>
        </div>
      </div>

      {/* 1. KPI Row (3 cols) */}
      <div className="ds-kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <CurvedCard
          title="Processed HUs"
          value={Number(totals?.PROCESSED_HU || 0).toLocaleString('en-IN')}
          waveColor={['#065f46', '#059669']} // Green gradient
          icon={<Icons.CheckSquare />}
        />
        <KpiCard
          title="Unprocessed HUs"
          value={Number(totals?.UNPROCESSED_HU || 0).toLocaleString('en-IN')}
          badge="Backlog"
          badgeVariant="warning"
          icon={<Icons.Package />}
        />
        <KpiCard
          title="Validated Articles"
          value={Number(totals?.PROCESSED_ARTICLE_QTY || 0).toLocaleString('en-IN')}
          subtext="Total items inside processed HUs"
          badgeVariant="info"
          icon={<Icons.Layers />}
        />
      </div>

      {/* 2. Charts Row */}
      <div className="ds-charts-row ds-charts-row--2col">
        {/* Left: Grouped Bar Chart */}
        <div className="ds-card">
          <div className="ds-card-title--flex">
            <h3>Processed vs Unprocessed HU (Top 10 Stores)</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Click a bar for details</span>
          </div>
          <GroupedBarChart
            data={barData}
            bars={[
              { dataKey: 'Processed', color: '#10b981', label: 'Processed HU' },
              { dataKey: 'Unprocessed', color: '#f97316', label: 'Unprocessed HU' }
            ]}
            height={280}
            onBarClick={handleStoreClick}
          />
        </div>

        {/* Right: Donut Chart Breakdown */}
        <div className="ds-card">
          <h3 className="ds-card-title">Global HU Validation</h3>
          <DonutChart
            segments={donutData}
            centerText={Number((totals?.PROCESSED_HU || 0) + (totals?.UNPROCESSED_HU || 0)).toLocaleString('en-IN')}
            centerSubtext="Total Handling Units"
            height={280}
          />
        </div>
      </div>

      {/* 3. Quick-List Row */}
      <div className="ds-charts-row ds-charts-row--single">
        <div className="ds-card">
          <div className="ds-card-title--flex">
            <h3>Highest Unprocessed Backlogs</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Click a store for detailed report</span>
          </div>
          <StoreRankList
            items={rankList}
            labelKey="Reciving_Plant"
            valueKey="UNPROCESSED_HU"
            diffKey="PROCESSED_ARTICLE_QTY"
            diffLabel="Validated Articles:"
            formatValue={(val) => `${Number(val).toLocaleString('en-IN')} Unprocessed HUs`}
            statusFn={() => 'warning'}
            emptyText="All Handling Units have been processed."
            onItemClick={handleStoreClick}
          />
        </div>
      </div>

    </section>
  );
}
