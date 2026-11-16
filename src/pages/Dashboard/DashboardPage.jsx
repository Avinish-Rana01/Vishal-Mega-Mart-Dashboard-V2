import React, { useEffect, useMemo } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import WorkInProgress from '../../components/common/WorkInProgress';
import { useAuth } from '../../context/AuthContext';
import { getDashboardReturnPoint, clearDashboardReturnPoint, getDashboardScrollContainer, useSessionState } from '../../utils/dashboardNavigationMemory';
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

const DASHBOARD_TABS = [
  {
    id: 'overview',
    label: 'Overview',
    sections: [],
    placeholderTitle: 'Overview',
    placeholderMessage: 'High-level cross-module highlights and executive metrics will appear here soon.',
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

export default function DashboardPage() {
  const { hasSection } = useAuth();

  const visibleTabs = useMemo(
    () => DASHBOARD_TABS.filter((tab) => tab.sections.length === 0 || tab.sections.some((sec) => hasSection(sec))),
    [hasSection]
  );

  const defaultTabId = useMemo(() => {
    const firstPopulated = visibleTabs.find((tab) => tab.sections.length > 0);
    return firstPopulated?.id || visibleTabs[0]?.id || 'overview';
  }, [visibleTabs]);

  const [storedTab, setStoredTab] = useSessionState('dashboard_active_tab', defaultTabId);

  // Resolve active tab: report return point > permitted session tab > first live tab
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

  // Trigger resize after revealing a CSS-hidden tab so Recharts ResponsiveContainer re-measures cleanly
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
    return () => cancelAnimationFrame(rafId);
  }, [activeTab]);

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
        <div className="vmm-dash-tabs-list" role="tablist">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
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
              {tab.sections.length === 0 ? (
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


