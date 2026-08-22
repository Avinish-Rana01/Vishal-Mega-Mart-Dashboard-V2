import React from 'react';
import SectionHeader, { DateBadge } from './SectionHeader';
import '../charts/DashboardSection.css';

export default function DashboardShimmer({ title }) {
  return (
    <div className="cc-container">
      <SectionHeader title={title} rightContent={<DateBadge />} />
      
      {/* 5-Card KPI Row */}
      <div className="cc-kpi-row">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="ds-skeleton-box" style={{ height: '80px', borderRadius: '12px' }}>
            <div className="ds-shimmer" />
          </div>
        ))}
      </div>
      
      {/* Chart Area */}
      <div className="ds-skeleton-box" style={{ height: '352px', borderRadius: '20px', flexShrink: 0 }}>
        <div className="ds-shimmer" />
      </div>
      
      {/* Data Grid Area */}
      <div className="ds-skeleton-box" style={{ flex: 1, minHeight: '200px', borderRadius: '20px' }}>
        <div className="ds-shimmer" />
      </div>
    </div>
  );
}
