import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Tag, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { clearDashboardReturnPoint } from '../../utils/dashboardNavigationMemory';
import './Sidebar.css';

export default function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasSection, userRole } = useAuth();
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
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
    } else {
      const container = document.querySelector('.vmm-dashboard-body-v2') || document.querySelector('.vmm-dashboard-body');
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Dedicated standalone report routes that live under the Reports menu
  const standaloneReportPaths = [
    '/reports/tag-cleaning',
    '/reports/stock-take'
  ];

  const menuConfig = useMemo(() => {
    const list = [
      {
        id: 'dashboard',
        title: 'Home',
        icon: LayoutDashboard,
        tooltipTitle: 'Home',
        defaultTo: '/dashboard',
        isActive: (pathname) => {
          if (pathname.startsWith('/dashboard')) return true;
          if (pathname.startsWith('/stores')) return false;
          if (pathname.startsWith('/auth') || pathname.startsWith('/settings')) return false;
          if (standaloneReportPaths.some(p => pathname.startsWith(p))) return false;
          return pathname.startsWith('/reports') || pathname.startsWith('/tags') || pathname.startsWith('/tag-management');
        },
        onIconClick: handleDashboardClick,
        items: [
          { label: 'Dashboard', to: '/dashboard', onClick: handleDashboardClick }
        ]
      }
    ];

    // Store Module: Store Counter Status
    const canSeeStoreCounter = hasSection('store_counter_status');
    if (canSeeStoreCounter) {
      list.push({
        id: 'store',
        title: 'Store',
        icon: Building2,
        tooltipTitle: 'Store',
        defaultTo: '/stores/counter-status',
        isActive: (pathname) => pathname.startsWith('/stores'),
        items: [
          { label: 'Store Counter Status', to: '/stores/counter-status' }
        ]
      });
    }

    // Reports Module: Tag Cleaning & Stock Take (SAP Stock Take)
    const reportItems = [];
    if (hasSection('tag_cleaning') || userRole === 'Super Admin' || userRole === 'Tag Admin') {
      reportItems.push({ label: 'Tag Cleaning', to: '/reports/tag-cleaning' });
    }
    if (hasSection('get_sap_stock_take') || userRole === 'Super Admin' || userRole === 'Store Admin') {
      reportItems.push({ label: 'Stock Take', to: '/reports/stock-take' });
    }

    if (reportItems.length > 0) {
      list.push({
        id: 'reports',
        title: 'Reports',
        icon: Tag,
        tooltipTitle: 'Reports',
        defaultTo: reportItems[0].to,
        isActive: (pathname) => standaloneReportPaths.some(p => pathname.startsWith(p)),
        items: reportItems
      });
    }

    // Authentication / Master Registration Module
    const isSuperAdmin = userRole === 'Super Admin';
    const canManageUsers = hasSection('user_registration') || isSuperAdmin || ['Store Admin', 'Warehouse Admin', 'WH Admin'].includes(userRole);
    const authItems = [];

    if (canManageUsers) {
      authItems.push({ label: 'User Registration', to: '/auth/user-registration' });
    }
    if (isSuperAdmin) {
      authItems.push({ label: 'Store Registration', to: '/auth/store-registration' });
      authItems.push({ label: 'Warehouse Registration', to: '/auth/warehouse-registration' });
    }

    if (authItems.length > 0) {
      list.push({
        id: 'auth',
        title: 'Authentication',
        icon: Settings,
        tooltipTitle: 'Authentication',
        defaultTo: authItems[0].to,
        isActive: (pathname) => pathname.startsWith('/auth') || pathname.startsWith('/settings'),
        items: authItems
      });
    }

    return list;
  }, [hasSection, userRole, location.pathname]);

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
                  if (menu.onIconClick) {
                    menu.onIconClick(e);
                  } else if (menu.defaultTo) {
                    setHoveredMenuId(null);
                    navigate(menu.defaultTo);
                  }
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