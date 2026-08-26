import React from 'react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import LiveStockSectionV2 from './LiveStockSectionV2';
import '../Dashboard/Dashboard.css'; // Reuse core layout styles
import './DashboardV2.css'; // V2 specific layout overrides

export default function DashboardPage2() {
  return (
    <div className="vmm-dashboard-layout">
      <Sidebar />
      <div className="vmm-main-wrapper">
        <Header />
        <main className="vmm-dashboard-body vmm-dashboard-body-v2">
          {/* Dashboard V2 uses a single column stacked layout instead of a grid */}
          <div className="vmm-dashboard-stack">
            <LiveStockSectionV2 />
          </div>
        </main>
      </div>
    </div>
  );
}
