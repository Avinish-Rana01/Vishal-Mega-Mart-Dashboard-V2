import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Tag, Settings } from 'lucide-react';
import { clearDashboardReturnPoint } from '../../utils/dashboardNavigationMemory';
import './Sidebar.css';

export default function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const [hoveredMenuId, setHoveredMenuId] = useState(null);

  // Close tooltip whenever the sidebar closes on mobile
  useEffect(() => {
    if (!isOpen) {
      setHoveredMenuId(null);
    }
  }, [isOpen]);

  const handleDashboardClick = () => {
    clearDashboardReturnPoint();
    setHoveredMenuId(null);
    const container = document.querySelector('.vmm-dashboard-body-v2') || document.querySelector('.vmm-dashboard-body');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const menuConfig = [
    {
      id: 'dashboard',
      title: 'Home',
      icon: LayoutDashboard,
      tooltipTitle: 'Home',
      isActive: (pathname) => pathname.startsWith('/dashboard'),
      onIconClick: handleDashboardClick,
      items: [
        { label: 'Dashboard', to: '/dashboard', onClick: handleDashboardClick }
      ]
    },
    {
      id: 'store',
      title: 'Store',
      icon: Building2,
      tooltipTitle: 'Store',
      isActive: (pathname) => pathname.startsWith('/stores'),
      items: [
        { label: 'Store Counter Status', to: '/stores/counter-status' }
      ]
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: Tag,
      tooltipTitle: 'Reports',
      isActive: (pathname) => pathname.startsWith('/reports') || pathname.startsWith('/tags'),
      items: [
        { label: 'Tag Cleaning', to: '/reports/tag-cleaning' },
        { label: 'Stock Take', to: '/reports/stock-take' }
      ]
    },
    {
      id: 'auth',
      title: 'Authentication',
      icon: Settings,
      tooltipTitle: 'Authentication',
      isActive: (pathname) => pathname.startsWith('/auth') || pathname.startsWith('/settings'),
      items: [
        { label: 'User Registration', to: '/auth/user-registration' },
        { label: 'Store Registration', to: '/auth/store-registration' },
        { label: 'Warehouse Registration', to: '/auth/warehouse-registration' }
      ]
    }
  ];

  return (
    <aside className={`vmm-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="vmm-sidebar-logo">
        <Link to="/dashboard" onClick={handleDashboardClick} aria-label="Vishal Mega Mart Home">
          <img src="/assets/images/vishal_mega_mart_icon.png" alt="VMM Icon" />
        </Link>
      </div>

      <nav className="vmm-sidebar-nav">
        {menuConfig.map((menu) => {
          const Icon = menu.icon;
          const isHovered = hoveredMenuId === menu.id;
          const isParentActive = menu.isActive(location.pathname);

          return (
            <div
              key={menu.id}
              className="vmm-nav-dropdown"
              onMouseEnter={() => setHoveredMenuId(menu.id)}
              onMouseLeave={() => setHoveredMenuId(null)}
            >
              <div
                className={`vmm-nav-item ${isParentActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
                aria-label={menu.title}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  if (menu.onIconClick) menu.onIconClick(e);
                }}
                tabIndex="0"
                role="button"
              >
                <Icon size={20} strokeWidth={2} />
              </div>

              <div className={`vmm-nav-tooltip ${isHovered ? 'hover-visible' : ''}`}>
                <h4 className="vmm-nav-tooltip-title">{menu.tooltipTitle}</h4>
                <ul>
                  {menu.items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          `vmm-nav-tooltip-link ${isActive ? 'active' : ''}`
                        }
                        onClick={(e) => {
                          setHoveredMenuId(null);
                          if (item.onClick) item.onClick(e);
                        }}
                      >
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}