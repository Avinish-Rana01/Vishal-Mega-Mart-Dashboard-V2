import React from 'react';
import DonutChartCard from '../../../components/charts/DonutChartCard';
import SemiCircleChartCard from '../../../components/charts/SemiCircleChartCard';
import { useTagCharts } from '../../../hooks/useDashboardData';

export default function TagManagementSection() {
  const {
    locationData,
    locationTotal,
    cycleData,
    cycleTotal,
    avgRecycle,
    isLoading
  } = useTagCharts();

  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const dateString = now.toISOString().split('T')[0];

  return (
    <div className="vmm-card vmm-card-full-width">
      <div className="vmm-card-header">
        <span className="vmm-card-title">TAG MANAGEMENT</span>
        <div className="vmm-card-meta">
          <span className="vmm-meta-btn1">{dayName}</span>
          <span className="vmm-meta-btn">{dateString}</span>
        </div>
      </div>
      <div className="vmm-card-body vmm-card-body-tag">
        <div className="vmm-tag-actions">
          <button className="vmm-btn-primary">View Summary</button>
        </div>
        <div className="vmm-charts-grid">
          <DonutChartCard
            data={locationData}
            totalValue={locationTotal.toLocaleString('en-IN')}
            isLoading={isLoading}
          />
          <SemiCircleChartCard
            data={cycleData}
            totalValue={cycleTotal.toLocaleString('en-IN')}
            avgCount={avgRecycle.toString()}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
