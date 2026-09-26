import React, { useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { getDashboardReturnPoint, clearDashboardReturnPoint } from '../../utils/dashboardNavigationMemory';
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

  // Instant scroll restoration on returning from detail reports
  useEffect(() => {
    const returnPoint = getDashboardReturnPoint();
    if (!returnPoint) return;

    const container = document.querySelector('.vmm-dashboard-body-v2') || document.querySelector('.vmm-dashboard-body');

    const restoreScroll = () => {
      if (container && typeof returnPoint.scrollTop === 'number' && returnPoint.scrollTop > 0) {
        container.scrollTop = returnPoint.scrollTop;
      } else if (returnPoint.sectionId) {
        const el = document.getElementById(`section-${returnPoint.sectionId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      }
    };

    // Immediate attempt
    requestAnimationFrame(restoreScroll);

    // Secondary attempt to compensate for any initial layout expansion
    const timer = setTimeout(() => {
      restoreScroll();
      clearDashboardReturnPoint();
    }, 120);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AppLayout mainClassName="vmm-dashboard-body-v2">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* {hasSection('live_stock') && (
          <div id="section-live_stock" className="vmm-dashboard-stack">
            <LiveStockSection />
          </div>
        )}
        {hasSection('cycle_count') && (
          <div id="section-cycle_count" className="vmm-dashboard-stack">
            <CycleCountSection />
          </div>
        )}
        {hasSection('store_validation') && (
          <div id="section-store_validation" className="vmm-dashboard-stack">
            <StoreValidationSection />
          </div>
        )}
        {hasSection('sale') && (
          <div id="section-sale" className="vmm-dashboard-stack">
            <SaleDashboardSection />
          </div>
        )}
        {hasSection('void') && (
          <div id="section-void" className="vmm-dashboard-stack">
            <VoidDashboardSection />
          </div>
        )}
        {hasSection('return') && (
          <div id="section-return" className="vmm-dashboard-stack">
            <ReturnDashboardSection />
          </div>
        )} */}
          {/* {hasSection('dc_validation') && (
            <div id="section-dc_validation" className="vmm-dashboard-stack">
              <DcValidationSection />
            </div>
          )}
          {hasSection('dc_encoding') && (
            <div id="section-dc_encoding" className="vmm-dashboard-stack">
              <DcEncodingSection />
            </div>
          )}
          {hasSection('tag_management') && (
            <div id="section-tag_management" className="vmm-dashboard-stack">
              <TagManagementSection />
            </div>
          )} */}
        {hasSection('vendor_discrepancy') && (
          <div id="section-vendor_discrepancy" className="vmm-dashboard-stack">
            <VendorDiscrepancySection />
          </div>
        )}
      </div>
    </AppLayout>
  );
}


