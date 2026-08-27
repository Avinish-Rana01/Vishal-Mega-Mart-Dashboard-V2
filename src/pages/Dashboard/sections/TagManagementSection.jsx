import React from 'react';
import { useTagCharts } from '../../../hooks/useDashboardData';
import KpiCard from '../../../components/charts/KpiCard';
import GroupedBarChart from '../../../components/charts/GroupedBarChart';
import DonutChart from '../../../components/charts/DonutChart';
import StoreRankList from '../../../components/charts/StoreRankList';
import SectionHeader, { DateBadge } from '../../../components/common/SectionHeader';
import WorkInProgress from '../../../components/common/WorkInProgress';
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
    isLoading
  } = useTagCharts();

  if (isLoading) {
    return (
      <section className="ds-section">
        <div className="ds-skeleton-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[1, 2, 3].map(i => <div key={i} className="ds-skeleton-box" style={{ height: '140px' }}><div className="ds-shimmer" /></div>)}
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
      <SectionHeader title="TAG MANAGEMENT" rightContent={<DateBadge />} />
      <div style={{ height: '370px' }}>
        <WorkInProgress title="Tag Management" description="We are currently upgrading this section." />
      </div>
    </section>
  );

  return (
    <section className="ds-section">
      <SectionHeader title="TAG MANAGEMENT" rightContent={<DateBadge />} />

      {/* 1. KPI Row */}
      <div className="ds-kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <KpiCard
          title="Total Tags"
          value={locationTotal.toLocaleString('en-IN')}
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
        <div className="ds-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="ds-card-title">Inventory Breakdown</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>Tag distribution across sites</p>

          <div style={{ display: 'flex', flex: 1, minHeight: 0, alignItems: 'center', gap: '16px' }}>
            {/* Donut Chart */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <DonutChart
                segments={locationData}
                centerText={locationTotal.toLocaleString('en-IN')}
                centerSubtext="Total Tags"
                height={250}
                showLegend={false}
              />
            </div>

            {/* Progress Bars */}
            <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {locationData.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
                      <span style={{ fontSize: '15px', color: '#475569', fontWeight: 500 }}>{item.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{item.displayValue}</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8', width: '52px', textAlign: 'right' }}>{item.percent}%</span>
                    </div>
                  </div>
                  <div style={{ height: '10px', backgroundColor: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${item.percent}%`, backgroundColor: item.color, borderRadius: '5px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Grouped Bar Chart for Cycle Count */}
        <div className="ds-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="ds-card-title--flex" style={{ marginBottom: '1px' }}>
            <h3 className="ds-card-title" style={{ margin: 0 }}>Tag Recycling Distribution</h3>
          </div>

          <div style={{ display: 'flex', flex: 1, minHeight: 0, alignItems: 'center', gap: '8px' }}>
            {/* Semi Donut Chart */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <DonutChart
                segments={cycleData}
                centerText={cycleTotal.toLocaleString('en-IN')}
                centerSubtext="Total Tag Count"
                height={250}
                showLegend={false}
                halfCircle={true}
              />
            </div>

            {/* Progress Bars */}
            <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {cycleData.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
                      <span style={{ fontSize: '15px', color: '#475569', fontWeight: 500 }}>{item.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{item.displayValue}</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8', width: '52px', textAlign: 'right' }}>{item.percent}%</span>
                    </div>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${item.percent}%`, backgroundColor: item.color, borderRadius: '4px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
