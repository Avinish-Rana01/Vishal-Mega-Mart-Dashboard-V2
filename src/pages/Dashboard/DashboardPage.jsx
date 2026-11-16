import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import WorkInProgress from '../../components/common/WorkInProgress';
import { useAuth } from '../../context/AuthContext';
import { DashboardDataProvider } from '../../context/DashboardDataContext';
import { useDashboardSharedData } from '../../context/dashboardDataContextValue';
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
    label: 'Stock & cycle count',
    sections: ['live_stock', 'cycle_count'],
  },
  {
    id: 'sales_checkout',
    label: 'Sales & checkout',
    sections: ['sale'],
  },
  {
    id: 'validation_void_return',
    label: 'Validation, void & return',
    sections: ['store_validation', 'void', 'return'],
  },
  {
    id: 'dc_encoding',
    label: 'DC & encoding',
    sections: ['dc_validation', 'dc_encoding', 'tag_management'],
  },
  {
    id: 'vendors',
    label: 'Vendors',
    sections: ['vendor_discrepancy'],
  },
  {
    id: 'daily_history',
    label: 'Daily history',
    sections: [],
    placeholderTitle: 'Daily history',
    placeholderMessage: 'Historical day-by-day trends and snapshots will appear here soon.',
  },
];

const SECTION_TO_TAB = DASHBOARD_TABS.reduce((acc, tab) => {
  tab.sections.forEach((sec) => {
    acc[sec] = tab.id;
  });
  return acc;
}, {});

function DashboardPageContent() {
  const { hasSection } = useAuth();
  const shared = useDashboardSharedData();

  const visibleTabs = useMemo(
    () => DASHBOARD_TABS.filter((tab) => {
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
  const [indicator, setIndicator] = useState({ left: 0, width: 0, animate: false });

  // Resolve active tab: report return point > permitted session tab > Overview / first live tab
  const activeTab = useMemo(() => {
    const returnPoint = getDashboardReturnPoint();
    const returnTabId = returnPoint?.sectionId ? SECTION_TO_TAB[returnPoint.sectionId] : null;
    if (returnTabId && visibleTabs.some((t) => t.id === returnTabId)) {
      return returnTabId;
    }
    if (visibleTabs.some((t) => t.id === storedTab)) {
      return storedTab;
    }
    return defaultTabId;
  }, [visibleTabs, storedTab, defaultTabId]);

  const handleTabSelect = (tabId) => {
    clearDashboardReturnPoint();
    setStoredTab(tabId);
    const container = getDashboardScrollContainer();
    if (container) container.scrollTop = 0;
  };

  const handleJumpToSection = useCallback((sectionKey, storeCode) => {
    const targetTab = SECTION_TO_TAB[sectionKey];
    if (!targetTab || !visibleTabs.some((t) => t.id === targetTab)) return;

    clearDashboardReturnPoint();
    setStoredTab(targetTab);
    if (storeCode && shared?.triggerSpotlight) {
      shared.triggerSpotlight(sectionKey, storeCode);
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(`section-${sectionKey}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }, [visibleTabs, setStoredTab, shared]);

  // Slide the underline indicator smoothly beneath the active tab button
  useLayoutEffect(() => {
    const updateIndicator = (shouldAnimate) => {
      const btn = tabRefs.current[activeTab];
      if (!btn) return;
      setIndicator({
        left: btn.offsetLeft,
        width: btn.offsetWidth,
        animate: shouldAnimate,
      });
    };

    const animate = indicatorReadyRef.current;
    updateIndicator(animate);
    indicatorReadyRef.current = true;

    const btn = tabRefs.current[activeTab];
    if (animate && btn?.scrollIntoView) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }

    const listEl = tabListRef.current;
    if (!listEl || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => updateIndicator(false));
    ro.observe(listEl);
    return () => ro.disconnect();
  }, [activeTab, visibleTabs]);

  // Keep session tab aligned when returning from a detail report or when role permissions change
  useEffect(() => {
    if (activeTab && storedTab !== activeTab) {
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
                {tab.label}
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

export default function DashboardPage() {
  return (
    <DashboardDataProvider>
      <DashboardPageContent />
    </DashboardDataProvider>
  );
}


