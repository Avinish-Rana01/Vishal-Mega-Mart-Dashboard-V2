import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, FileText } from 'lucide-react';

const LP_VIEW_OPTIONS = [
  { to: '/loss-prevention/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/loss-prevention/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/loss-prevention/reports', label: 'Reports', icon: FileText },
];

export default function PageHeader({
  title,
  subtitle,
  children,
  className = '',
}) {
  const location = useLocation();

  const getPageTitle = () => {
    if (title) return title;
    const path = (location?.pathname || '').toLowerCase();
    if (path.includes('analytics')) return 'Analytics';
    if (path.includes('reports')) return 'Reports';
    return 'Dashboard';
  };

  const displayTitle = getPageTitle();

  return (
    <div
      className={`sticky top-0 z-20 bg-[#f8fafb]/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5 pt-2.5 pb-2.5 px-3 sm:px-4 rounded-xl border-b border-slate-200/80 shadow-2xs transition-all ${className}`}
    >
      {/* 1. Left Side: Page Title + 3-Way View Toggle (Dashboard / Analytics / Reports) */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="border-l-4 border-[#00a8e7] pl-3 py-0.5">
          <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-tight">
            {displayTitle}
          </h1>
          {subtitle && (
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-none">
              {subtitle}
            </p>
          )}
        </div>

        <nav
          aria-label="Loss Prevention views"
          className="h-8.5 p-0.5 inline-flex items-center gap-0.5 rounded-lg bg-white border border-slate-200/90 shadow-2xs"
        >
          {LP_VIEW_OPTIONS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group h-full inline-flex items-center gap-1.5 px-2.5 rounded-md text-xs transition-all duration-150 whitespace-nowrap select-none border ${
                  isActive
                    ? 'bg-sky-50 text-[#007ba8] border-sky-200/80 font-semibold shadow-2xs'
                    : 'bg-transparent text-slate-600 border-transparent font-medium hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isActive ? 'text-[#00a8e7]' : 'text-slate-400 group-hover:text-[#00a8e7]'
                    }`}
                  />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* 2. Right Side: Filters / Actions Slot */}
      {children && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 ml-auto">
          {children}
        </div>
      )}
    </div>
  );
}
