import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Store, Tags, Settings } from 'lucide-react';
import { clearDashboardReturnPoint } from '../../utils/dashboardNavigationMemory';
import './Sidebar.css';

export default function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const isDashboardActive = location.pathname.startsWith('/dashboard');
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  // Close tooltip whenever the sidebar closes on mobile
  useEffect(() => {
    if (!isOpen) {
      setIsTooltipOpen(false);
    }
  }, [isOpen]);

  const handleDashboardClick = () => {
    clearDashboardReturnPoint();
    setIsTooltipOpen(false);
    const container = document.querySelector('.vmm-dashboard-body-v2') || document.querySelector('.vmm-dashboard-body');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <aside className={`vmm-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="vmm-sidebar-logo" title="Vishal Mega Mart">
        <Link to="/dashboard" onClick={handleDashboardClick}>
          <img src="/assets/images/vishal_mega_mart_icon.png" alt="VMM Icon" />
        </Link>
      </div>
      <nav className="vmm-sidebar-nav">
        <div 
          className="vmm-nav-dropdown"
          onMouseEnter={() => setIsTooltipOpen(true)}
          onMouseLeave={() => setIsTooltipOpen(false)}
        >
          <div
            className={`vmm-nav-item ${isDashboardActive ? 'active' : ''}`}
            title="Dashboard Menu"
            style={{ cursor: 'pointer' }}
            onClick={() => setIsTooltipOpen(!isTooltipOpen)}
            tabIndex="0"
          >
            <LayoutDashboard size={20} strokeWidth={2} />
          </div>
          <div className={`vmm-nav-tooltip ${isTooltipOpen ? 'force-show' : ''}`}>
            <h4 className="vmm-nav-tooltip-title">Home</h4>
            <ul>
              <li>
                <NavLink to="/dashboard" className={({ isActive }) => `vmm-nav-tooltip-link ${isActive ? 'active' : ''}`} onClick={handleDashboardClick}>
                  Dashboard V2
                </NavLink>
              </li>
              <li>
                <NavLink to="/dashboard-old" end className={({ isActive }) => `vmm-nav-tooltip-link ${isActive ? 'active' : ''}`} onClick={() => setIsTooltipOpen(false)}>
                  Legacy Dashboard
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
        <NavLink
          to="/stores"
          className={({ isActive }) => `vmm-nav-item ${isActive ? 'active' : ''}`}
          title="Store Reports"
        >
          <Store size={20} strokeWidth={2} />
        </NavLink>
        <NavLink
          to="/tags"
          className={({ isActive }) => `vmm-nav-item ${isActive ? 'active' : ''}`}
          title="Tag Management"
        >
          <Tags size={20} strokeWidth={2} />
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => `vmm-nav-item ${isActive ? 'active' : ''}`}
          title="Settings"
        >
          <Settings size={20} strokeWidth={2} />
        </NavLink>
      </nav>
    </aside>
  );
}