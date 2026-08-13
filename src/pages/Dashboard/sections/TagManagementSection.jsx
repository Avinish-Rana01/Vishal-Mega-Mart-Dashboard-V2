import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useTagCharts } from '../../../hooks/useDashboardData';
import CurvedCard from '../../../components/common/CurvedCard';
import KpiCard from '../../../components/charts/KpiCard';
import GroupedBarChart from '../../../components/charts/GroupedBarChart';
import DonutChart from '../../../components/charts/DonutChart';
import StoreRankList from '../../../components/charts/StoreRankList';
import '../../../components/charts/DashboardSection.css';

// SVG Icons
const Icons = {
  Tag: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>,
  Refresh: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>,
  Store: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
};

export default function TagManagementSection() {
  const {
    locationData,
    locationTotal,
    cycleData,
    cycleTotal,
    avgRecycle,
    isLoading,
    refresh
  } = useTagCharts();

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

  // Format data for GroupedBarChart
  const barData = cycleData.map(item => ({
    name: item.name, // The Count_Range (e.g. "1 to 5")
    Count: item.value
  }));

  // Find store and warehouse totals for KPIs
  const storeInv = locationData.find(d => d.name.includes('Store'))?.value || 0;

  return (
    <section className="ds-section">
      <div className="ds-header" style={{ alignItems: 'center', padding: '20px', background: '#fff', flexWrap: 'nowrap' }}>
        <div className="ds-header-text">
          <h1 style={{ whiteSpace: 'nowrap' }}>Tag Management</h1>
          <p>Monitor RFID tag locations, lifecycle, and recycling metrics.</p>
        </div>
        <div className="ds-header-actions" style={{ alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
          <button onClick={refresh} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#0f172a', fontWeight: '500' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* 1. KPI Row */}
      <div className="ds-kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <CurvedCard
          title="Total Tags"
          value={locationTotal.toLocaleString('en-IN')}
          waveColor={['#8b5cf6', '#e9cfffff']} // Purple gradient
          icon={<Icons.Tag />}
        />
        <KpiCard
          title="Store Inventory"
          value={storeInv.toLocaleString('en-IN')}
          badge={`${((storeInv / (locationTotal || 1)) * 100).toFixed(1)}%`}
          badgeVariant="success"
          icon={<Icons.Store />}
        />
        <KpiCard
          title="Average Recycle Count"
          value={`${avgRecycle}x`}
          subtext="across all active tags"
          badgeVariant="info"
          icon={<Icons.Refresh />}
        />
      </div>

      {/* 2. Charts Row */}
      <div className="ds-charts-row ds-charts-row--equal">
        {/* Left: Donut Chart for Location */}
        <div className="ds-card">
          <h3 className="ds-card-title">Tag Location Distribution</h3>
          <DonutChart
            segments={locationData}
            centerText={locationTotal.toLocaleString('en-IN')}
            centerSubtext="Total Tags"
            height={280}
          />
        </div>

        {/* Right: Grouped Bar Chart for Cycle Count */}
        <div className="ds-card">
          <div className="ds-card-title--flex">
            <h3>Tag Recycling Distribution</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Total Valid Tags: {cycleTotal.toLocaleString('en-IN')}</span>
          </div>
          <GroupedBarChart
            data={barData}
            bars={[
              { dataKey: 'Count', color: '#8b5cf6', label: 'Number of Tags' }
            ]}
            height={280}
            tooltipFormatter={(val) => [`${Number(val).toLocaleString('en-IN')} Tags`, '']}
          />
        </div>
      </div>

      {/* 3. Quick-List Row */}


    </section>
  );
}
