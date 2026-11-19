import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import LossPreventionHeaderControls from './components/layout/LossPreventionHeaderControls';
import DashboardOverview from './components/dashboard/DashboardOverview';
import AnalyticsView from './components/analytics/AnalyticsView';
import ReportsView from './components/reports/ReportsView';
import './lossPrevention.css';

/**
 * Self-contained Loss Prevention & Goods Security module mounted inside VMM's Dashboard shell.
 * - Lazy-loaded only when the Loss Prevention tab (`/loss-prevention/*`) is active
 * - Portals its 3-way view toggle (Dashboard | Analytics | Reports) & Live Security Alerts Bell
 *   directly into VMM's top Header (`#vmm-header-module-slot`) — no duplicate sidebar
 */
export default function LossPreventionModule() {
  const location = useLocation();
  const [headerSlotEl, setHeaderSlotEl] = useState(() =>
    typeof document !== 'undefined' ? document.getElementById('vmm-header-module-slot') : null,
  );

  useEffect(() => {
    if (!headerSlotEl && typeof document !== 'undefined') {
      setHeaderSlotEl(document.getElementById('vmm-header-module-slot'));
    }
  }, [headerSlotEl]);

  const pathname = (location?.pathname || '').toLowerCase();
  const activeView = pathname.includes('/loss-prevention/analytics')
    ? 'analytics'
    : pathname.includes('/loss-prevention/reports')
      ? 'reports'
      : 'dashboard';

  return (
    <>
      {headerSlotEl && createPortal(<LossPreventionHeaderControls />, headerSlotEl)}

      <div className="lp-module-root w-full space-y-5 pb-4">
        {activeView === 'analytics' ? (
          <AnalyticsView />
        ) : activeView === 'reports' ? (
          <ReportsView />
        ) : (
          <DashboardOverview />
        )}
      </div>
    </>
  );
}
