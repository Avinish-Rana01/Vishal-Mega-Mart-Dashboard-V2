import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import LiveStockSectionV2 from './LiveStockSectionV2';
import '../Dashboard/Dashboard.css'; // Reuse core layout styles
import './DashboardV2.css'; // V2 specific layout overrides

export default function DashboardPage2() {
  return (
    <AppLayout mainClassName="vmm-dashboard-body-v2">
      {/* Dashboard V2 uses a single column stacked layout instead of a grid */}
      <div className="vmm-dashboard-stack">
        <LiveStockSectionV2 />
      </div>
    </AppLayout>
  );
}
