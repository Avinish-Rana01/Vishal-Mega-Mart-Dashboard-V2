import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
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
  const { hasSection } = useAuth();

  return (
    <AppLayout mainClassName="vmm-dashboard-body-v2">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px'}}>
        {hasSection('live_stock') && (
          <div className="vmm-dashboard-stack">
            <LiveStockSection />
          </div>
        )}
        {hasSection('cycle_count') && (
          <div className="vmm-dashboard-stack">
            <CycleCountSection />
          </div>
        )}
        {hasSection('store_validation') && (
          <div className="vmm-dashboard-stack">
            <StoreValidationSection />
          </div>
        )}
        {hasSection('sale') && (
          <div className="vmm-dashboard-stack">
            <SaleDashboardSection />
          </div>
        )}
        {hasSection('void') && (
          <div className="vmm-dashboard-stack">
            <VoidDashboardSection />
          </div>
        )}
        {hasSection('return') && (
          <div className="vmm-dashboard-stack">
            <ReturnDashboardSection />
          </div>
        )}
        {hasSection('dc_validation') && (
          <div className="vmm-dashboard-stack">
            <DcValidationSection />
          </div>
        )}
        {hasSection('dc_encoding') && (
          <div className="vmm-dashboard-stack">
            <DcEncodingSection />
          </div>
        )}
        {hasSection('tag_management') && (
          <div className="vmm-dashboard-stack">
            <TagManagementSection />
          </div>
        )}
        {hasSection('vendor_discrepancy') && (
          <div className="vmm-dashboard-stack">
            <VendorDiscrepancySection />
          </div>
        )}
      </div>
    </AppLayout>
  );
}


