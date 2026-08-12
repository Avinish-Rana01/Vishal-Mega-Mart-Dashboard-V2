import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Store, Tags, Settings } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="vmm-sidebar">
      <div className="vmm-sidebar-logo" title="Vishal Mega Mart">
        <Link to="/dashboard">
          <img src="/assets/images/vishal_mega_mart_icon.png" alt="VMM Icon" />
        </Link>
      </div>
      <nav className="vmm-sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `vmm-nav-item ${isActive ? 'active' : ''}`}
          title="Dashboard Home"
        >
          <LayoutDashboard size={24} strokeWidth={2} />
        </NavLink>
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