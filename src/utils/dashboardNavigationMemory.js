import { useState, useEffect } from 'react';

const RETURN_POINT_KEY = 'VMM_DASHBOARD_RETURN_POINT';
const FILTER_PREFIX = 'VMM_DASH_STATE_';

/**
 * Saves the current scroll position and target section ID before navigating away from the dashboard.
 * @param {string} sectionId - Identifier of the section (e.g. 'store_validation', 'cycle_count')
 */
export function saveDashboardReturnPoint(sectionId) {
  try {
    const container = document.querySelector('.vmm-dashboard-body-v2') || document.querySelector('.vmm-dashboard-body');
    const scrollTop = container ? container.scrollTop : (window.scrollY || window.pageYOffset || 0);

    const payload = {
      sectionId,
      scrollTop,
      timestamp: Date.now()
    };

    sessionStorage.setItem(RETURN_POINT_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[DashboardNavigationMemory] Failed to save return point:', err);
  }
}

/**
 * Retrieves the pending dashboard return point if valid (under 2 hours old).
 * @returns {{ sectionId: string, scrollTop: number } | null}
 */
export function getDashboardReturnPoint() {
  try {
    const raw = sessionStorage.getItem(RETURN_POINT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    // Ignore if older than 2 hours
    if (Date.now() - (parsed.timestamp || 0) > 2 * 60 * 60 * 1000) {
      sessionStorage.removeItem(RETURN_POINT_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Clears the pending return point from sessionStorage.
 */
export function clearDashboardReturnPoint() {
  try {
    sessionStorage.removeItem(RETURN_POINT_KEY);
  } catch (err) {
    console.warn('[DashboardNavigationMemory] Failed to clear return point:', err);
  }
}

/**
 * Hook to persist component state (filters, search, active tabs) across page navigations within the session.
 * 
 * @param {string} key - Unique key for this state item (e.g. 'sv_chart_view')
 * @param {any} initialValue - Default fallback value
 * @returns {[any, Function]} - [state, setState]
 */
export function useSessionState(key, initialValue) {
  const fullKey = FILTER_PREFIX + key;

  const [state, setState] = useState(() => {
    try {
      const stored = sessionStorage.getItem(fullKey);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn(`[useSessionState] Error reading ${fullKey}:`, e);
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue;
  });

  useEffect(() => {
    try {
      if (state === undefined) {
        sessionStorage.removeItem(fullKey);
      } else {
        sessionStorage.setItem(fullKey, JSON.stringify(state));
      }
    } catch (e) {
      console.warn(`[useSessionState] Error saving ${fullKey}:`, e);
    }
  }, [fullKey, state]);

  return [state, setState];
}
