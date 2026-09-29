import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { saveDashboardReturnPoint } from '../../utils/dashboardNavigationMemory';

/**
 * Common Layout Wrapper for the application.
 * Manages the mobile Sidebar state and the overarching grid structure.
 *
 * @param {Object} props.headerProps - Props to pass directly to the Header component (e.g. breadcrumb, title)
 */
export default function AppLayout({ children, headerProps = {}, mainClassName = "" }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Auto-close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Save dashboard return point on navigation away from /dashboard
  useEffect(() => {
    if (location.pathname !== '/dashboard') return;

    // 1. Immediately capture scroll and clicked section on any click or navigation trigger
    const handleTrigger = (e) => {
      const target = e.target;
      if (!target) return;

      // Check if click originates from inside a known section
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
      // Only fallback-save on unmount if not already captured with a section
      import('../../utils/dashboardNavigationMemory').then(({ getDashboardReturnPoint, saveDashboardReturnPoint }) => {
        const existing = getDashboardReturnPoint();
        if (!existing || !existing.sectionId) {
          saveDashboardReturnPoint();
        }
      }).catch(() => {});
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

  return (
    <div className="vmm-dashboard-layout">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="vmm-main-wrapper">
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)} 
          {...headerProps} 
        />
        
        <main className={`vmm-dashboard-body ${mainClassName}`.trim()}>
          {children}
        </main>
        
        <Footer />
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="vmm-sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
