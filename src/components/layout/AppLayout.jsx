import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

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
