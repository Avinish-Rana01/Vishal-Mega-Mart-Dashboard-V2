import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Store, Tags, Settings } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar() {
  const location = useLocation();
  const isDashboardActive = location.pathname.startsWith('/dashboard');
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  return (
    <aside className="vmm-sidebar">
      <div className="vmm-sidebar-logo" title="Vishal Mega Mart">
        <Link to="/dashboard">
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
            <LayoutDashboard size={24} strokeWidth={2} />
          </div>
          <div className={`vmm-nav-tooltip ${isTooltipOpen ? 'force-show' : ''}`}>
            <h4 className="vmm-nav-tooltip-title">Home</h4>
            <ul>
              <li>
                <NavLink to="/dashboard" end className={({ isActive }) => `vmm-nav-tooltip-link ${isActive ? 'active' : ''}`} onClick={() => setIsTooltipOpen(false)}>
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/dashboard-2" className={({ isActive }) => `vmm-nav-tooltip-link ${isActive ? 'active' : ''}`} onClick={() => setIsTooltipOpen(false)}>
                  Dashboard 2
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
          <Store size={24} strokeWidth={2} />
        </NavLink>
        <NavLink
          to="/tags"
          className={({ isActive }) => `vmm-nav-item ${isActive ? 'active' : ''}`}
          title="Tag Management"
        >
          <Tags size={24} strokeWidth={2} />
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => `vmm-nav-item ${isActive ? 'active' : ''}`}
          title="Settings"
        >
          <Settings size={24} strokeWidth={2} />
        </NavLink>
      </nav>
    </aside>
  );
}