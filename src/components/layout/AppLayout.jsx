import React, { useState, useEffect, useContext, createContext } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { saveDashboardReturnPoint, getDashboardReturnPoint } from '../../utils/dashboardNavigationMemory';

const AppLayoutContext = createContext(false);

const ROUTE_BREADCRUMBS = {
  '/dashboard': 'HOME - PAGES - DASHBOARD',
  '/dashboard-old': 'HOME - PAGES - DASHBOARD (OLD)',
  '/stores/counter-status': 'HOME - PAGES - STORE COUNTER STATUS',
  '/reports/live-stock': 'HOME - PAGES - DASHBOARD - LIVE STOCK REPORT',
  '/reports/grc': 'HOME - PAGES - DASHBOARD - GRC REPORT',
  '/reports/store-grc': 'HOME - PAGES - DASHBOARD - STORE GRC REPORT',
  '/reports/cycle-count': 'HOME - PAGES - DASHBOARD - CYCLE COUNT REPORT',
  '/reports/store-sale': 'HOME - PAGES - DASHBOARD - STORE SALE REPORT',
  '/reports/sale': 'HOME - PAGES - DASHBOARD - TOTAL DPOS SALE REPORT',
  '/reports/void-details': 'HOME - PAGES - DASHBOARD - VOID DETAILS REPORT',
  '/reports/void-reconciliation': 'HOME - PAGES - DASHBOARD - VOID RECONCILIATION REPORT',
  '/reports/return-details': 'HOME - PAGES - DASHBOARD - RETURN DETAILS REPORT',
  '/reports/return-reconciliation': 'HOME - PAGES - DASHBOARD - RETURN RECONCILIATION REPORT',
  '/reports/dc': 'HOME - PAGES - DASHBOARD - DC VALIDATION REPORT',
  '/reports/dc-report': 'HOME - PAGES - DASHBOARD - DC REPORT',
  '/reports/hu': 'HOME - PAGES - DASHBOARD - HU VALIDATION REPORT',
  '/reports/hu-report': 'HOME - PAGES - DASHBOARD - HU REPORT',
  '/reports/allocated-store': 'HOME - PAGES - DASHBOARD - ALLOCATED STORE REPORT',
  '/reports/allocated-store-report': 'HOME - PAGES - DASHBOARD - ALLOCATED STORE REPORT',
  '/reports/wh-encoding': 'HOME - PAGES - DASHBOARD - WAREHOUSE ENCODING REPORT',
  '/reports/dc-encoding-summary': 'HOME - PAGES - DASHBOARD - WAREHOUSE ENCODING REPORT',
  '/reports/hu-summary': 'HOME - PAGES - DASHBOARD - HU SUMMARY REPORT',
  '/reports/tag-inventory-distribution': 'HOME - PAGES - DASHBOARD - TAG INVENTORY DISTRIBUTION',
  '/reports/tag-distribution': 'HOME - PAGES - DASHBOARD - TAG INVENTORY DISTRIBUTION',
  '/reports/vendor-discrepancy': 'HOME - PAGES - DASHBOARD - VENDOR DISCREPANCY SUMMARY',
  '/reports/vendor-discrepancy-summary': 'HOME - PAGES - DASHBOARD - VENDOR DISCREPANCY SUMMARY',
  '/reports/total-dpos-sale': 'HOME - PAGES - DASHBOARD - TOTAL DPOS SALE REPORT'
};

function getBreadcrumb(pathname) {
  if (ROUTE_BREADCRUMBS[pathname]) {
    return ROUTE_BREADCRUMBS[pathname];
  }
  const clean = pathname.replace(/^\//, '');
  if (!clean) return 'HOME - PAGES - DASHBOARD';
  const parts = clean.split('/').map(p => p.replace(/-/g, ' ').toUpperCase());
  return `HOME - PAGES - ${parts.join(' - ')}`;
}

/**
 * Common Persistent Layout Shell for the application.
 * Renders the persistent Sidebar, Header, and Footer with an <Outlet /> for child routes.
 * Also provides fallback de-duplication if individual pages still wrap <AppLayout>.
 */
export default function AppLayout({ children, headerProps = {}, mainClassName = "" }) {
  const isInsideLayout = useContext(AppLayoutContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // If already nested within a parent AppLayout, unroll to avoid duplicate layout shells
  if (isInsideLayout) {
    return children ? (
      <div className={mainClassName}>{children}</div>
    ) : null;
  }

  // Auto-close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Save dashboard return point on navigation away from /dashboard
  useEffect(() => {
    if (location.pathname !== '/dashboard') return;

    const handleTrigger = (e) => {
      const target = e.target;
      if (!target) return;

      const sectionEl = target.closest('[id^="section-"]');
      const clickedSectionId = sectionEl ? sectionEl.id.replace('section-', '') : undefined;

      if (
        target.closest('a') || 
        target.closest('button') || 
        target.closest('[role="button"]') || 
        target.closest('.vmm-nav-item') ||
        target.closest('.cursor-pointer') ||
        target.closest('.recharts-bar-rectangle') ||
        target.closest('tr') ||
        target.closest('td') ||
        target.closest('svg')
      ) {
        saveDashboardReturnPoint(clickedSectionId);
      }
    };

    window.addEventListener('click', handleTrigger, { capture: true });

    return () => {
      const existing = getDashboardReturnPoint();
      if (!existing || !existing.sectionId) {
        saveDashboardReturnPoint();
      }
      window.removeEventListener('click', handleTrigger, { capture: true });
    };
  }, [location.pathname]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  // Dynamically resolve breadcrumb and back button state from URL path
  const resolvedBreadcrumb = headerProps.breadcrumb || getBreadcrumb(location.pathname);
  const resolvedShowBackButton = headerProps.showBackButton !== undefined 
    ? headerProps.showBackButton 
    : (location.pathname !== '/dashboard');

  return (
    <AppLayoutContext.Provider value={true}>
      <div className="vmm-dashboard-layout">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <div className="vmm-main-wrapper">
          <Header 
            onMenuClick={() => setIsSidebarOpen(true)} 
            breadcrumb={resolvedBreadcrumb}
            showBackButton={resolvedShowBackButton}
            {...headerProps} 
          />
          
          <main className={`vmm-dashboard-body ${mainClassName}`.trim()}>
            {children || <Outlet />}
          </main>
          
          <Footer />
        </div>

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="vmm-sidebar-overlay" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </AppLayoutContext.Provider>
  );
}
