import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import LiveStockSection from './sections/LiveStockSection';
import CycleCountSection from './sections/CycleCountSection';
import StoreValidationSection from './sections/StoreValidationSection';
import SaleDashboardSection from './sections/SaleDashboardSection';
import VoidDashboardSection from './sections/VoidDashboardSection';
import ReturnDashboardSection from './sections/ReturnDashboardSection';
import DcValidationSection from './sections/DcValidationSection';
import DcEncodingSection from './sections/DcEncodingSection';
import TagManagementSection from './sections/TagManagementSection';
import VendorDiscrepancySection from './sections/VendorDiscrepancySection';

import './Dashboard-core.css'; // Core layout styles (decoupled)
import './Dashboard.css'; // V2 specific layout overrides

export default function DashboardPage() {
  return (
    <AppLayout mainClassName="vmm-dashboard-body-v2">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px'}}>
        <div className="vmm-dashboard-stack">
          <LiveStockSection />
        </div>
        <div className="vmm-dashboard-stack">
          <CycleCountSection />
        </div>
        {/* <div className="vmm-dashboard-stack">
          <StoreValidationSection />
        </div>
        <div className="vmm-dashboard-stack">
          <SaleDashboardSection />
        </div>
        <div className="vmm-dashboard-stack">
          <VoidDashboardSection />
        </div>
        <div className="vmm-dashboard-stack">
          <ReturnDashboardSection />
        </div>
        <div className="vmm-dashboard-stack">
          <DcValidationSection />
        </div>
        <div className="vmm-dashboard-stack">
          <DcEncodingSection />
        </div>
        <div className="vmm-dashboard-stack">
          <TagManagementSection />
        </div>
        <div className="vmm-dashboard-stack">
          <VendorDiscrepancySection />
        </div> */}
      </div>
    </AppLayout>
  );
}


