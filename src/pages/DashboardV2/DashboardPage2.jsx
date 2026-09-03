import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import LiveStockSectionV2 from './sections/LiveStockSectionV2';
import CycleCountSectionV2 from './sections/CycleCountSectionV2';
import StoreValidationSectionV2 from './sections/StoreValidationSectionV2';
import SaleDashboardSectionV2 from './sections/SaleDashboardSectionV2';
import VoidDashboardSectionV2 from './sections/VoidDashboardSectionV2';
import ReturnDashboardSectionV2 from './sections/ReturnDashboardSectionV2';
import DcValidationSectionV2 from './sections/DcValidationSectionV2';
import DcEncodingSectionV2 from './sections/DcEncodingSectionV2';
import TagManagementSectionV2 from './sections/TagManagementSectionV2';
import VendorDiscrepancySectionV2 from './sections/VendorDiscrepancySectionV2';

import '../Dashboard/Dashboard.css'; // Reuse core layout styles
import './DashboardV2.css'; // V2 specific layout overrides

export default function DashboardPage2() {
  return (
    <AppLayout mainClassName="vmm-dashboard-body-v2">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px'}}>
        <div className="vmm-dashboard-stack">
          <LiveStockSectionV2 />
        </div>
        <div className="vmm-dashboard-stack">
          <CycleCountSectionV2 />
        </div>
        <div className="vmm-dashboard-stack">
          <StoreValidationSectionV2 />
        </div>
        <div className="vmm-dashboard-stack">
          <SaleDashboardSectionV2 />
        </div>
        <div className="vmm-dashboard-stack">
          <VoidDashboardSectionV2 />
        </div>
        <div className="vmm-dashboard-stack">
          <ReturnDashboardSectionV2 />
        </div>
        <div className="vmm-dashboard-stack">
          <DcValidationSectionV2 />
        </div>
        <div className="vmm-dashboard-stack">
          <DcEncodingSectionV2 />
        </div>
        <div className="vmm-dashboard-stack">
          <TagManagementSectionV2 />
        </div>
        <div className="vmm-dashboard-stack">
          <VendorDiscrepancySectionV2 />
        </div>
      </div>
    </AppLayout>
  );
}

