import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import WorkInProgress from '../../components/common/WorkInProgress';
import { useAuth } from '../../context/AuthContext';
import { getDashboardReturnPoint, clearDashboardReturnPoint, getDashboardScrollContainer, useSessionState } from '../../utils/dashboardNavigationMemory';
import OverviewSection from './sections/OverviewSection';
import LiveStockSection from './sections/LiveStockSection';
import CycleCountSection from './sections/CycleCountSection';
import StoreValidationSection from './sections/StoreValidationSection';
import SaleDashboardSection from './sections/SaleDashboardSection';
import VoidDashboardSection from './sections/VoidDashboardSection';
import ReturnDashboardSection from './sections/ReturnDashboardSection';
import DcValidationSection from './sections/DcValidationSection';
import DcEncodingSection from './sections/DcEncodingSection';
import TagManagementSection from './sections/TagManagementSection';
import VendorDiscrepancySection from './sections/VendorDiscrepancySection';

const LossPreventionModule = React.lazy(() => import('../../modules/loss-prevention/LossPreventionModule'));

import './Dashboard-core.css'; // Core layout styles (decoupled)
import './Dashboard.css'; // V2 specific layout overrides

const SECTION_COMPONENTS = {
  live_stock: LiveStockSection,
  cycle_count: CycleCountSection,
  store_validation: StoreValidationSection,
  sale: SaleDashboardSection,
  void: VoidDashboardSection,
  return: ReturnDashboardSection,
  dc_validation: DcValidationSection,
  dc_encoding: DcEncodingSection,
  tag_management: TagManagementSection,
  vendor_discrepancy: VendorDiscrepancySection,
};

const OVERVIEW_SECTIONS = [
  'live_stock',
  'cycle_count',
  'store_validation',
  'sale',
  'void',
  'return',
  'dc_validation',
  'dc_encoding',
];

// Crisp 15x15 monochrome favicons per tab (inherits tab color: grey idle, blue active)
const TAB_FAVICONS = {
  overview: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  stock_cycle: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.5L20.5 7.2v9.6L12 21.5l-8.5-4.7V7.2L12 2.5z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 7.2L12 12l8.5-4.8M12 12v9.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7.8 4.8l8.4 4.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  sales_checkout: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.5 6.5h14l-1.5 7.8a1.8 1.8 0 0 1-1.8 1.5H9.3a1.8 1.8 0 0 1-1.8-1.5L6.5 6.5z"
        fill="currentColor"
        fillOpacity="0.14"
      />
      <path
        d="M3 3.5h2.4l2.1 10.8a1.8 1.8 0 0 0 1.8 1.5h7.9a1.8 1.8 0 0 0 1.8-1.5L20.5 6.5H6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.8" cy="20" r="1.6" fill="currentColor" />
      <circle cx="17.2" cy="20" r="1.6" fill="currentColor" />
    </svg>
  ),
  validation_void_return: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.5l7.5 3.2v5.8c0 5-3.2 8.9-7.5 10.2-4.3-1.3-7.5-5.2-7.5-10.2V5.7L12 2.5z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8.8 12.2l2.2 2.2 4.4-4.4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  dc_encoding: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M11.6 3.5H4.8A1.8 1.8 0 0 0 3 5.3v6.8c0 .5.2 1 .5 1.3l7.9 7.9a1.8 1.8 0 0 0 2.6 0l6.6-6.6a1.8 1.8 0 0 0 0-2.6l-7.7-8.1a1.8 1.8 0 0 0-1.3-.5z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="7.8" cy="8.2" r="1.4" fill="currentColor" />
    </svg>
  ),
  vendors: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 6.5A1.5 1.5 0 0 1 4.5 5H14v11.5H3V6.5z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M14 9h4.2l2.8 3.2v4.3H14V9z"
        fill="currentColor"
        fillOpacity="0.06"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="18.2" r="2.1" fill="#ffffff" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="18.2" r="2.1" fill="#ffffff" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  loss_prevention: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.5l7.5 3.2v5.8c0 5-3.2 8.9-7.5 10.2-4.3-1.3-7.5-5.2-7.5-10.2V5.7L12 2.5z"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 8v4.2" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <circle cx="12" cy="15.8" r="1.2" fill="currentColor" />
    </svg>
  ),
};

const DASHBOARD_TABS = [
  {
    id: 'overview',
    label: 'Overview',
    sections: [],
    isOverview: true,
    requiredAny: OVERVIEW_SECTIONS,
  },
  {
    id: 'stock_cycle',
    label: 'Stock & Cycle Count',
    sections: ['live_stock', 'cycle_count'],
  },
  {
    id: 'sales_checkout',
    label: 'Sales & Checkout',
    sections: ['sale'],
  },
  {
    id: 'validation_void_return',
    label: 'Validation, Void & Return',
    sections: ['store_validation', 'void', 'return'],
  },
  {
    id: 'dc_encoding',
    label: 'DC Validate & Encoding, Tag',
    sections: ['dc_validation', 'dc_encoding', 'tag_management'],
  },
  {
    id: 'vendors',
    label: 'Vendor Discrepancy',
    sections: ['vendor_discrepancy'],
  },
  {
    id: 'loss_prevention',
    label: 'Loss Prevention',
    sections: [],
    isLossPrevention: true,
  },
];

const SECTION_TO_TAB = DASHBOARD_TABS.reduce((acc, tab) => {
  tab.sections.forEach((sec) => {
    acc[sec] = tab.id;
  });
  return acc;
}, {});

// Preserve last tab indicator position & target tab across /dashboard <-> /loss-prevention/* route transitions
let lastTabIndicatorRect = null;
let pendingDashboardTab = null;

export default function DashboardPage() {
  const { hasSection } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isLossPreventionRoute = location.pathname.startsWith('/loss-prevention');
  const lastLpRouteRef = useRef('/loss-prevention/dashboard');
  const initialPendingTabRef = useRef(isLossPreventionRoute ? null : pendingDashboardTab);

  useEffect(() => {
    if (!isLossPreventionRoute && pendingDashboardTab) {
      pendingDashboardTab = null;
    }
  }, [isLossPreventionRoute]);

  useEffect(() => {
    if (isLossPreventionRoute) {
      lastLpRouteRef.current = location.pathname;
    }
  }, [isLossPreventionRoute, location.pathname]);

  const visibleTabs = useMemo(
    () => DASHBOARD_TABS.filter((tab) => {
      if (tab.isOverview) {
        return hasSection('overview') && tab.requiredAny.some((sec) => hasSection(sec));
      }
      if (tab.requiredAny) return tab.requiredAny.some((sec) => hasSection(sec));
      if (tab.sections.length === 0) return true;
      return tab.sections.some((sec) => hasSection(sec));
    }),
    [hasSection]
  );

  const defaultTabId = useMemo(() => {
    const firstLive = visibleTabs.find((tab) => tab.isOverview || tab.sections.length > 0);
    return firstLive?.id || visibleTabs[0]?.id || 'overview';
  }, [visibleTabs]);

  const [storedTab, setStoredTab] = useSessionState('dashboard_active_tab', defaultTabId);
  const tabListRef = useRef(null);
  const tabRefs = useRef({});
  const indicatorReadyRef = useRef(false);
  const [indicator, setIndicator] = useState(() =>
    lastTabIndicatorRect
      ? { left: lastTabIndicatorRect.left, width: lastTabIndicatorRect.width, animate: false }
      : { left: 0, width: 0, animate: false }
  );

  // Resolve active tab: /loss-prevention/* route > pending cross-route tab > report return point > permitted session tab > first live tab
  const activeTab = useMemo(() => {
    if (isLossPreventionRoute && visibleTabs.some((t) => t.id === 'loss_prevention')) {
      return 'loss_prevention';
    }
    const pendingTab = initialPendingTabRef.current;
    if (pendingTab && pendingTab !== 'loss_prevention' && visibleTabs.some((t) => t.id === pendingTab)) {
      return pendingTab;
    }
    const returnPoint = getDashboardReturnPoint();
    const returnTabId = returnPoint?.sectionId ? SECTION_TO_TAB[returnPoint.sectionId] : null;
    if (returnTabId && visibleTabs.some((t) => t.id === returnTabId)) {
      return returnTabId;
    }
    if (visibleTabs.some((t) => t.id === storedTab) && storedTab !== 'loss_prevention') {
      return storedTab;
    }
    return defaultTabId;
  }, [isLossPreventionRoute, visibleTabs, storedTab, defaultTabId]);

  const handleTabSelect = (tabId) => {
    clearDashboardReturnPoint();
    initialPendingTabRef.current = null;
    if (tabId === 'loss_prevention') {
      if (!isLossPreventionRoute) {
        navigate(lastLpRouteRef.current || '/loss-prevention/dashboard');
      }
    } else {
      setStoredTab(tabId);
      if (isLossPreventionRoute) {
        pendingDashboardTab = tabId;
        navigate('/dashboard');
      }
    }
    const container = getDashboardScrollContainer();
    if (container) container.scrollTop = 0;
  };

  const handleJumpToSection = useCallback((sectionKey) => {
    const targetTab = SECTION_TO_TAB[sectionKey];
    if (!targetTab || !visibleTabs.some((t) => t.id === targetTab)) return;
    clearDashboardReturnPoint();
    initialPendingTabRef.current = null;
    setStoredTab(targetTab);
    if (isLossPreventionRoute) {
      pendingDashboardTab = targetTab;
      navigate('/dashboard');
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(`section-${sectionKey}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }, [visibleTabs, setStoredTab, isLossPreventionRoute, navigate]);

  // Slide the underline indicator smoothly beneath the active tab button
  useLayoutEffect(() => {
    let rafId = null;

    const updateIndicator = (shouldAnimate) => {
      const btn = tabRefs.current[activeTab];
      if (!btn) return;
      const nextRect = { left: btn.offsetLeft, width: btn.offsetWidth };
      lastTabIndicatorRect = nextRect;
      setIndicator({
        left: nextRect.left,
        width: nextRect.width,
        animate: shouldAnimate,
      });
    };

    const wasReady = indicatorReadyRef.current;
    indicatorReadyRef.current = true;

    if (!wasReady && lastTabIndicatorRect) {
      // Smoothly animate from the previous route's tab position on first mount after crossing routes
      rafId = requestAnimationFrame(() => updateIndicator(true));
    } else {
      updateIndicator(wasReady);
    }

    const btn = tabRefs.current[activeTab];
    if ((wasReady || lastTabIndicatorRect) && btn?.scrollIntoView) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }

    const listEl = tabListRef.current;
    let ro = null;
    if (listEl && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updateIndicator(false));
      ro.observe(listEl);
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (ro) ro.disconnect();
    };
  }, [activeTab, visibleTabs]);

  // Keep session tab aligned when returning from a detail report or when role permissions change
  useEffect(() => {
    if (activeTab && activeTab !== 'loss_prevention' && storedTab !== activeTab) {
      setStoredTab(activeTab);
    }
  }, [activeTab, storedTab, setStoredTab]);

  // Restore scroll position (or section anchor) when returning from detail reports
  useEffect(() => {
    const returnPoint = getDashboardReturnPoint();
    if (!returnPoint) return;

    let isUserInteracting = false;
    let attempts = 0;
    const maxAttempts = 50; // Watch for up to 3.5 seconds across async data renders

    const restoreScroll = () => {
      if (isUserInteracting) return;

      const container = getDashboardScrollContainer();

      // 1. Element anchor restoration (guarantees section is brought directly to top)
      if (returnPoint.sectionId) {
        const el = document.getElementById(`section-${returnPoint.sectionId}`);
        if (el && el.offsetParent !== null) {
          el.scrollIntoView({ behavior: 'instant', block: 'start' });
          return;
        }
      }

      // 2. Exact coordinate restoration fallback (when no specific sectionId is known)
      if (typeof returnPoint.scrollTop === 'number' && returnPoint.scrollTop > 0) {
        if (container) {
          container.scrollTop = returnPoint.scrollTop;
        }
        window.scrollTo({ top: returnPoint.scrollTop, behavior: 'instant' });
        document.documentElement.scrollTop = returnPoint.scrollTop;
        document.body.scrollTop = returnPoint.scrollTop;
      }
    };

    // User interaction listeners: if user touches, wheels, or presses keys to scroll, release anchoring
    const handleUserInteraction = () => {
      isUserInteracting = true;
      clearDashboardReturnPoint();
    };

    const container = getDashboardScrollContainer() || window;
    container.addEventListener('wheel', handleUserInteraction, { passive: true });
    container.addEventListener('touchmove', handleUserInteraction, { passive: true });
    container.addEventListener('keydown', handleUserInteraction, { passive: true });

    // Immediate attempt
    restoreScroll();
    requestAnimationFrame(restoreScroll);

    // Watchdog loop that re-anchors during async data loading and chart layout expansion
    const interval = setInterval(() => {
      if (isUserInteracting) {
        clearInterval(interval);
        return;
      }

      attempts++;
      restoreScroll();

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        clearDashboardReturnPoint();
      }
    }, 70);

    // ResizeObserver on the container to immediately snap section back if height shifts
    let resizeObserver = null;
    const scrollContainer = getDashboardScrollContainer();
    if (scrollContainer && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (!isUserInteracting) {
          restoreScroll();
        }
      });
      resizeObserver.observe(scrollContainer);
    }

    return () => {
      clearInterval(interval);
      if (resizeObserver) resizeObserver.disconnect();
      container.removeEventListener('wheel', handleUserInteraction);
      container.removeEventListener('touchmove', handleUserInteraction);
      container.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  return (
    <AppLayout mainClassName="vmm-dashboard-body-v2">
      {/* Sticky Chrome-like Top Tab Bar */}
      <nav className="vmm-dash-tabs-bar" aria-label="Dashboard sections">
        <div className="vmm-dash-tabs-list" role="tablist" ref={tabListRef}>
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                type="button"
                role="tab"
                id={`dash-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`dash-panel-${tab.id}`}
                className={`vmm-dash-tab-btn${isActive ? ' is-active' : ''}`}
                onClick={() => handleTabSelect(tab.id)}
              >
                {TAB_FAVICONS[tab.id] && (
                  <span className="vmm-dash-tab-icon">{TAB_FAVICONS[tab.id]}</span>
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
          <span
            aria-hidden="true"
            className="vmm-dash-tab-indicator"
            style={{
              transform: `translateX(${indicator.left}px)`,
              width: `${indicator.width}px`,
              opacity: indicator.width > 0 ? 1 : 0,
              transition: indicator.animate ? undefined : 'none',
            }}
          />
        </div>
      </nav>

      {/* Scrollable Content Below Fixed Tab Header (keeps vertical scrollbar below the tab bar) */}
      <div className="vmm-dash-scroll-area">
        {/* Tab Panels: keep all mounted in DOM and toggle visibility via CSS */}
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <div
              key={tab.id}
              role="tabpanel"
              id={`dash-panel-${tab.id}`}
              aria-labelledby={`dash-tab-${tab.id}`}
              aria-hidden={!isActive}
              className={`vmm-dash-tab-panel${isActive ? '' : ' vmm-dash-tab-panel--hidden'}`}
            >
              {tab.isOverview ? (
                <div id="section-overview" className="vmm-dashboard-stack">
                  <OverviewSection onJumpToSection={handleJumpToSection} />
                </div>
              ) : tab.isLossPrevention ? (
                isActive ? (
                  <div id="section-loss-prevention" className="vmm-dashboard-stack">
                    <Suspense
                      fallback={
                        <div style={{ padding: '48px 16px', textAlign: 'center', color: '#64748b', fontSize: '14px', fontWeight: 500 }}>
                          Loading Loss Prevention &amp; Goods Security...
                        </div>
                      }
                    >
                      <LossPreventionModule />
                    </Suspense>
                  </div>
                ) : null
              ) : tab.sections.length === 0 ? (
                <div className="vmm-dash-empty-tab">
                  <WorkInProgress title={tab.placeholderTitle} message={tab.placeholderMessage} />
                </div>
              ) : (
                tab.sections.map((sectionKey) => {
                  if (!hasSection(sectionKey)) return null;
                  const SectionComponent = SECTION_COMPONENTS[sectionKey];
                  return (
                    <div key={sectionKey} id={`section-${sectionKey}`} className="vmm-dashboard-stack">
                      <SectionComponent />
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}


