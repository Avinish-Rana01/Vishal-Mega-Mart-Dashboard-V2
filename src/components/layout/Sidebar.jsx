import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faBuilding, faTag, faGear } from '@fortawesome/free-solid-svg-icons';

export default function Sidebar() {
  return (
    <aside className="vmm-sidebar">
      <div className="vmm-sidebar-logo" title="Vishal Mega Mart">
       <Link to="/dashboard"> <img src="/assets/images/vishal_mega_mart_icon.png" alt="VMM Icon" /></Link>
      </div>
      <nav className="vmm-sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `vmm-nav-item ${isActive ? 'active' : ''}`}
          title="Dashboard Home"
        >
          <FontAwesomeIcon icon={faHouse} style={{ fontSize: '20px' }} />
        </NavLink>
        <NavLink
          to="/stores"
          className={({ isActive }) => `vmm-nav-item ${isActive ? 'active' : ''}`}
          title="Store Reports"
        >
          <FontAwesomeIcon icon={faBuilding} style={{ fontSize: '20px' }} />
        </NavLink>
        <NavLink
          to="/tags"
          className={({ isActive }) => `vmm-nav-item ${isActive ? 'active' : ''}`}
          title="Tag Management"
        >
          <FontAwesomeIcon icon={faTag} style={{ fontSize: '20px' }} />
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => `vmm-nav-item ${isActive ? 'active' : ''}`}
          title="Settings"
        >
          <FontAwesomeIcon icon={faGear} style={{ fontSize: '20px' }} />
        </NavLink>
      </nav>
    </aside>
  );
}