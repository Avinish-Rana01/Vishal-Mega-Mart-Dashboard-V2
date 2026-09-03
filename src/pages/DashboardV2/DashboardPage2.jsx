import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import LiveStockSectionV2 from './LiveStockSectionV2';
import CycleCountSectionV2 from './CycleCountSectionV2';
import StoreValidationSectionV2 from './StoreValidationSectionV2';
import SaleDashboardSectionV2 from './SaleDashboardSectionV2';
import VoidDashboardSectionV2 from './VoidDashboardSectionV2';
import ReturnDashboardSectionV2 from './ReturnDashboardSectionV2';
import DcValidationSectionV2 from './DcValidationSectionV2';
import DcEncodingSectionV2 from './DcEncodingSectionV2';
import TagManagementSectionV2 from './TagManagementSectionV2';
import VendorDiscrepancySectionV2 from './VendorDiscrepancySectionV2';

import '../Dashboard/Dashboard.css'; // Reuse core layout styles
import './DashboardV2.css'; // V2 specific layout overrides

export default function DashboardPage2() {
  return (
    <AppLayout mainClassName="vmm-dashboard-body-v2">
      {/* Dashboard V2 uses a single column stacked layout instead of a grid */}
      <div className="vmm-dashboard-stack">
        <LiveStockSectionV2 />
        <CycleCountSectionV2 />
        <StoreValidationSectionV2 />
        <SaleDashboardSectionV2 />
        <VoidDashboardSectionV2 />
        <ReturnDashboardSectionV2 />
        <DcValidationSectionV2 />
        <DcEncodingSectionV2 />
        <TagManagementSectionV2 />
        <VendorDiscrepancySectionV2 />
      </div>
    </AppLayout>
  );
}
