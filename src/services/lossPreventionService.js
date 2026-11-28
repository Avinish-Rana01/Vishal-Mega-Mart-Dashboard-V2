import axios from 'axios';
import { getActiveUserId, getReportStores } from './stockService';

/**
 * Loss Prevention & Goods Security API Service
 *
 * Dedicated service layer for all Loss Prevention endpoints
 * (Dashboard, Live Check stream, Analytics, Incident Reports, Stores).
 *
 * Authentication is handled by the host VMM AuthContext (`sessionStorage['vmm_user']`),
 * so standalone login logic is intentionally excluded.
 */

export const LP_STORAGE_KEYS = {
  SELECTED_STORE: 'lp_selected_store',
  CACHED_STORES: 'lp_cached_stores',
};

export const LP_EVENTS = {
  DASHBOARD_SYNC: 'loss-prevention:dashboard-sync',
  STORE_CHANGED: 'lp-store-changed',
  STORE_RESET: 'lp-store-reset',
  POPOVER_OPEN: 'lp-popover-open',
};

export function notifyPopoverOpened(source) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LP_EVENTS.POPOVER_OPEN, { detail: { source } }));
  }
}

export const DASHBOARD_SYNC_EVENT = LP_EVENTS.DASHBOARD_SYNC;

const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const lossPreventionUrl = `${apiBase}/api/LossPrevention`;

/**
 * Formats numeric or string rupee values consistently using Indian locale formatting.
 * @param {string|number} val
 * @returns {string}
 */
export function formatCurrency(val) {
  if (val == null || val === '') return '₹0';
  const str = String(val).trim();
  if (str === 'N/A' || str === 'NA' || str === '₹N/A' || str === '₹NA') return '₹0';
  if (str.startsWith('₹')) {
    const numPart = str.slice(1).replace(/,/g, '').trim();
    const num = Number(numPart);
    if (!isNaN(num)) return `₹${num.toLocaleString('en-IN')}`;
    return '₹0';
  }
  const num = Number(str.replace(/,/g, ''));
  if (!isNaN(num)) {
    return `₹${num.toLocaleString('en-IN')}`;
  }
  return '₹0';
}

/**
 * Normalizes any date representation (DD-MM-YYYY, ISO, or Date) to YYYY-MM-DD.
 * @param {string|Date} d
 * @returns {string|undefined}
 */
export function toIsoDate(d) {
  if (!d) return undefined;
  if (typeof d === 'string') {
    const trimmed = d.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parts = trimmed.split('-');
    if (parts.length === 3 && parts[0].length <= 2) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  const dateObj = new Date(d);
  if (!isNaN(dateObj.getTime())) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return String(d);
}

function getTodayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Checks whether an incident date string belongs to today.
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isTodayIncident(dateStr) {
  if (!dateStr) return true;
  const str = String(dateStr).trim();
  if (!str) return true;

  const today = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const d = pad(today.getDate());
  const m = pad(today.getMonth() + 1);
  const y = String(today.getFullYear());
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[today.getMonth()].toLowerCase();

  const lower = str.toLowerCase();
  if (lower.includes(monthName) && (lower.includes(d) || lower.includes(String(today.getDate())))) {
    return true;
  }

  const cleaned = str.replace(/[/.]/g, '-');
  if (cleaned.includes(`${d}-${m}`) || cleaned.includes(`${m}-${d}`) || cleaned.includes(`${y}-${m}-${d}`)) {
    return true;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const localMatch = parsed.getDate() === today.getDate() && parsed.getMonth() === today.getMonth();
    const utcMatch = parsed.getUTCDate() === today.getDate() && parsed.getUTCMonth() === today.getMonth();
    return localMatch || utcMatch;
  }

  return true;
}

/**
 * Broadcasts a Loss Prevention dashboard/alert sync event across module components.
 * @param {Object} data
 */
export function broadcastDashboardSync(data) {
  if (typeof window !== 'undefined' && data) {
    try {
      window.dispatchEvent(new CustomEvent(LP_EVENTS.DASHBOARD_SYNC, { detail: data }));
    } catch (e) {
      console.warn('Failed to broadcast Loss Prevention dashboard sync event:', e);
    }
  }
}

/**
 * Subscribes to Loss Prevention dashboard sync events.
 * @param {Function} callback
 * @returns {Function} Unsubscribe teardown
 */
export function onDashboardSync(callback) {
  if (typeof window === 'undefined') return () => {};
  const handler = (e) => {
    if (e.detail && callback) {
      callback(e.detail);
    }
  };
  window.addEventListener(LP_EVENTS.DASHBOARD_SYNC, handler);
  return () => window.removeEventListener(LP_EVENTS.DASHBOARD_SYNC, handler);
}

/**
 * Normalizes raw `/api/LossPrevention/todayDashboard` payload into structured metrics and incidents.
 * @param {Object} data
 * @param {Object} requestBody
 * @returns {Object|null}
 */
export function normalizeDashboardData(data, requestBody = {}) {
  if (!data) return null;
  const summary = data.Summary || data;

  const rawLoss =
    summary.PotentialLossDisplay &&
    summary.PotentialLossDisplay !== 'N/A' &&
    summary.PotentialLossDisplay !== 'NA'
      ? summary.PotentialLossDisplay
      : (summary.PotentialLoss ?? '0');

  const savedStore = getSavedStore();
  const fallbackStoreCode = requestBody.StoreCode || savedStore?.storeCode || '';
  const fallbackStoreName = requestBody.StoreName || savedStore?.cleanName || savedStore?.storeName || '';

  const incidents = (data.SecurityIncidents?.Incidents || data.Incidents || []).map((inc, index) => {
    const rawAmt = inc.Amount ?? inc.AmountDisplay ?? 0;
    let safeAmt = 0;
    if (typeof rawAmt === 'number' && !isNaN(rawAmt)) {
      safeAmt = rawAmt;
    } else if (rawAmt && rawAmt !== 'N/A' && rawAmt !== 'NA') {
      const parsed = Number(String(rawAmt).replace(/[₹,\s]/g, ''));
      safeAmt = isNaN(parsed) ? 0 : parsed;
    }

    let status = inc.AlertStatus || 'Loss Alert';
    if (status.toLowerCase().includes('theft')) status = status.replace(/theft/gi, 'Loss');
    if (status.toLowerCase().includes('untagged')) status = status.replace(/untagged/gi, 'Checkout');

    return {
      id: inc.EPC || inc.Id || `inc-${index}`,
      articleDescription: inc.ArticleDescription || inc.ItemName || inc.ArticleDesc || 'Untitled Article',
      articleNo: inc.ArticleNo || inc.Material || inc.EAN_UPC || 'N/A',
      epc: inc.EPC || 'N/A',
      amount: safeAmt,
      amountDisplay: `₹${safeAmt.toLocaleString('en-IN')}`,
      date: inc.IncidentDate || inc.Date || '',
      time: inc.IncidentTime || inc.Time || '',
      status,
      variant: 'loss',
      storeCode: inc.StoreCode || fallbackStoreCode,
      storeName: inc.StoreName || fallbackStoreName,
    };
  });

  return {
    date: data.Date || null,
    totalTags: summary.TotalTags != null ? String(summary.TotalTags) : '0',
    checkout: summary.Checkout != null ? String(summary.Checkout) : (summary.Untagged != null ? String(summary.Untagged) : '0'),
    untagged: summary.Untagged != null ? String(summary.Untagged) : (summary.Checkout != null ? String(summary.Checkout) : '0'),
    loss: summary.Loss != null ? String(summary.Loss) : (summary.TheftAlerts != null ? String(summary.TheftAlerts) : '0'),
    theftAlerts: summary.TheftAlerts != null ? String(summary.TheftAlerts) : (summary.Loss != null ? String(summary.Loss) : '0'),
    potentialLoss: formatCurrency(rawLoss),
    incidents,
  };
}

/**
 * Normalizes a single live incident payload.
 * @param {Object} inc
 * @param {number} index
 * @returns {Object|null}
 */
export function normalizeSingleIncident(inc, index = 0) {
  if (!inc) return null;
  const rawAmt = inc.Amount ?? inc.AmountDisplay ?? 0;
  let safeAmt = 0;
  if (typeof rawAmt === 'number' && !isNaN(rawAmt)) {
    safeAmt = rawAmt;
  } else if (rawAmt && rawAmt !== 'N/A' && rawAmt !== 'NA') {
    const parsed = Number(String(rawAmt).replace(/[₹,\s]/g, ''));
    safeAmt = isNaN(parsed) ? 0 : parsed;
  }

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const defaultDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const defaultTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  let status = inc.AlertStatus || inc.EventType || 'Loss Alert';
  if (status.toLowerCase().includes('theft')) status = status.replace(/theft/gi, 'Loss');
  if (status.toLowerCase().includes('untagged')) status = status.replace(/untagged/gi, 'Checkout');

  return {
    id: inc.EPC || inc.EpcCode || inc.Id || `inc-${Date.now()}-${index}`,
    articleDescription: inc.ArticleDescription || inc.ItemName || inc.ArticleDesc || 'Untitled Article',
    articleNo: inc.ArticleNo || inc.Material || inc.EAN_UPC || 'N/A',
    epc: inc.EPC || inc.EpcCode || 'N/A',
    amount: safeAmt,
    amountDisplay: `₹${safeAmt.toLocaleString('en-IN')}`,
    date: inc.IncidentDate || inc.Date || defaultDate,
    time: inc.IncidentTime || inc.Time || defaultTime,
    status,
    variant: 'loss',
    storeCode: inc.StoreCode || '',
    storeName: inc.StoreName || '',
  };
}

/**
 * Fetches today's Loss Prevention dashboard cards and gate alarm incidents.
 * POST /api/LossPrevention/todayDashboard
 */
export async function fetchDashboardRecord(payload = {}, signal) {
  try {
    const body = {};
    const dateVal = payload.Date || payload.date || payload.IncidentDate;
    body.Date = dateVal ? toIsoDate(dateVal) : getTodayIso();

    const rawStoreId = payload.StoreId ?? payload.storeId ?? payload.id;
    if (rawStoreId != null) {
      const numStoreId = Number(rawStoreId);
      if (!isNaN(numStoreId) && numStoreId > 0) {
        body.StoreId = numStoreId;
      }
    } else {
      const saved = getSavedStore();
      if (saved) {
        const numStoreId = Number(saved.storeId ?? saved.id);
        if (!isNaN(numStoreId) && numStoreId > 0) {
          body.StoreId = numStoreId;
        }
      }
    }

    if (payload.StoreCode || payload.storeCode) {
      body.StoreCode = payload.StoreCode || payload.storeCode;
    }

    const { data } = await axios.post(`${lossPreventionUrl}/todayDashboard`, body, { signal });
    const normalized = normalizeDashboardData(data, body);
    if (normalized) {
      broadcastDashboardSync(normalized);
    }
    return normalized;
  } catch (error) {
    console.error('Error fetching Loss Prevention today dashboard data:', error);
    throw error;
  }
}

export const fetchTodayRecord = fetchDashboardRecord;

// ============================================================================
// Shared Live Check Polling Stream (GET /api/LossPrevention/liveCheck)
// ============================================================================

const liveSubscribers = new Set();
let livePollInterval = null;
let lastMaxTagId = null;
let liveScope = null;
let isCheckingLive = false;
let currentLiveStatus = 'connecting';

function broadcastToSubscribers(type, data) {
  liveSubscribers.forEach((sub) => {
    try {
      if (type === 'message' && sub.onMessage) sub.onMessage(data);
      if (type === 'status' && sub.onStatusChange) sub.onStatusChange(data);
      if (type === 'error' && sub.onError) sub.onError(data);
    } catch (e) {
      console.warn('Error in Loss Prevention live stream subscriber:', e);
    }
  });
}

async function pollLiveCheck() {
  if (liveSubscribers.size === 0 || isCheckingLive) return;
  isCheckingLive = true;

  try {
    const store = getSavedStore();
    const scope = JSON.stringify([getActiveUserId(), store?.storeId, store?.storeCode]);
    if (liveScope !== scope) {
      liveScope = scope;
      lastMaxTagId = null;
    }
    const params = { lastMaxTagId: lastMaxTagId ?? 0 };
    if (store?.storeId) params.storeId = store.storeId;
    if (store?.storeCode) params.storeCode = store.storeCode;
    const { data: result } = await axios.get(`${lossPreventionUrl}/liveCheck`, { params });
    if (liveScope !== scope || liveSubscribers.size === 0) return;

    if (currentLiveStatus !== 'connected') {
      currentLiveStatus = 'connected';
      broadcastToSubscribers('status', 'connected');
    }

    if (lastMaxTagId === null) {
      lastMaxTagId = result.maxTagId;
      broadcastToSubscribers('message', { event: 'connected', maxTagId: result.maxTagId });
    } else if (result.hasNew || result.maxTagId > lastMaxTagId) {
      lastMaxTagId = result.maxTagId;
      const eventData = {
        event: 'new_record',
        maxTagId: result.maxTagId,
        timestamp: result.timestamp || new Date().toISOString(),
      };
      broadcastToSubscribers('message', eventData);
      broadcastDashboardSync(eventData);
    }
  } catch (err) {
    if (currentLiveStatus !== 'disconnected') {
      currentLiveStatus = 'disconnected';
      broadcastToSubscribers('status', 'disconnected');
    }
    broadcastToSubscribers('error', err);
  } finally {
    isCheckingLive = false;
  }
}

/**
 * Subscribes to real-time live updates from GET /api/LossPrevention/liveCheck.
 * Shares a single 2.5s poll loop across all mounted Loss Prevention components
 * and automatically stops polling when all subscribers unmount.
 *
 * @param {Function} onMessage
 * @param {Function} [onError]
 * @param {Function} [onStatusChange]
 * @returns {Function} Unsubscribe teardown
 */
export function subscribeToLiveStream(onMessage, onError, onStatusChange) {
  if (typeof window === 'undefined') {
    if (onStatusChange) onStatusChange('disconnected');
    return () => {};
  }

  const sub = { onMessage, onError, onStatusChange };
  liveSubscribers.add(sub);

  if (onStatusChange) {
    onStatusChange(currentLiveStatus);
  }

  if (!livePollInterval) {
    pollLiveCheck();
    livePollInterval = setInterval(pollLiveCheck, 2500);
  }

  return () => {
    liveSubscribers.delete(sub);
    if (liveSubscribers.size === 0 && livePollInterval) {
      clearInterval(livePollInterval);
      livePollInterval = null;
      liveScope = null;
      currentLiveStatus = 'connecting';
    }
  };
}

/**
 * Fetches Loss Prevention analytics charts and top stolen articles.
 * POST /api/LossPrevention/analyticsDashboard
 */
export async function fetchAnalyticsDashboard(payload = {}, signal) {
  try {
    const todayStr = getTodayIso();
    const startDate = toIsoDate(payload.StartDate || payload.FromDate || (payload.Preset ? undefined : todayStr));
    const endDate = toIsoDate(payload.EndDate || payload.ToDate || (payload.Preset ? undefined : todayStr));

    const body = {};
    if (startDate && endDate) {
      body.FromDate = startDate;
      body.ToDate = endDate;
      body.StartDate = startDate;
      body.EndDate = endDate;
    } else if (payload.Preset) {
      body.Preset = payload.Preset;
    }

    const rawStoreId = payload.StoreId ?? payload.storeId ?? payload.id;
    if (rawStoreId != null) {
      const numStoreId = Number(rawStoreId);
      if (!isNaN(numStoreId) && numStoreId > 0) {
        body.StoreId = numStoreId;
      }
    } else {
      const saved = getSavedStore();
      if (saved) {
        const numStoreId = Number(saved.storeId ?? saved.id);
        if (!isNaN(numStoreId) && numStoreId > 0) {
          body.StoreId = numStoreId;
        }
      }
    }

    if (payload.StoreCode || payload.storeCode) {
      body.StoreCode = payload.StoreCode || payload.storeCode;
    }

    const { data } = await axios.post(`${lossPreventionUrl}/analyticsDashboard`, body, { signal });
    const summary = data.Summary || data;
    const rawLoss =
      summary.PotentialLossDisplay &&
      summary.PotentialLossDisplay !== 'N/A' &&
      summary.PotentialLossDisplay !== 'NA'
        ? summary.PotentialLossDisplay
        : (summary.PotentialLoss ?? '0');

    const rawTopItems = data.TopStolenArticles || data.HighIncidentTargets?.TopItems || data.TopItems || [];
    const highIncidentTargets = {
      TotalArticles: data.HighIncidentTargets?.TotalArticles ?? rawTopItems.length,
      TotalThefts:
        data.HighIncidentTargets?.TotalThefts ??
        rawTopItems.reduce((acc, i) => acc + (i.IncidentCount ?? i.Thefts ?? 0), 0),
      TotalLossAmount:
        data.HighIncidentTargets?.TotalLossAmount ??
        rawTopItems.reduce((acc, i) => acc + (i.TotalLossAmount ?? 0), 0),
      TopItems: rawTopItems.map((item, idx) => ({
        ...item,
        Rank: item.Rank ?? idx + 1,
        ArticleNo: item.ArticleNo || item.Material || 'N/A',
        Material: item.Material || item.ArticleNo || 'N/A',
        ArticleDesc: item.ItemName || item.ArticleDesc || item.ArticleDescription || 'Untitled Item',
        ItemName: item.ItemName || item.ArticleDesc || item.ArticleDescription || 'Untitled Item',
        Thefts: item.Thefts ?? item.IncidentCount ?? 0,
        IncidentCount: item.IncidentCount ?? item.Thefts ?? 0,
        TotalLossAmount: item.TotalLossAmount ?? 0,
      })),
    };

    const hourlyThefts = Array.isArray(data.TheftByTimeOfDay)
      ? {
          TimeSlots: data.TheftByTimeOfDay,
          TotalThefts: data.TheftByTimeOfDay.reduce((sum, s) => sum + (s.Thefts ?? s.count ?? 0), 0),
        }
      : (data.TheftByTimeOfDay || data.HourlyThefts || null);

    const weeklyThefts = Array.isArray(data.TheftByDayOfWeek)
      ? {
          Days: data.TheftByDayOfWeek,
          WeeklyTotal: data.TheftByDayOfWeek.reduce((sum, d) => sum + (d.Thefts ?? d.count ?? 0), 0),
        }
      : (data.TheftByDayOfWeek || data.WeeklyThefts || null);

    return {
      preset: data.Preset,
      startDate: data.StartDate || body.FromDate,
      endDate: data.EndDate || body.ToDate,
      totalTags: summary.TotalTags != null ? String(summary.TotalTags) : '0',
      checkout: summary.Checkout != null ? String(summary.Checkout) : (summary.Untagged != null ? String(summary.Untagged) : '0'),
      untagged: summary.Untagged != null ? String(summary.Untagged) : (summary.Checkout != null ? String(summary.Checkout) : '0'),
      loss: summary.Loss != null ? String(summary.Loss) : (summary.TheftAlerts != null ? String(summary.TheftAlerts) : '0'),
      theftAlerts: summary.TheftAlerts != null ? String(summary.TheftAlerts) : (summary.Loss != null ? String(summary.Loss) : '0'),
      potentialLoss: formatCurrency(rawLoss),
      tagStatusDistribution: data.TagStatusDistribution || null,
      highIncidentTargets,
      hourlyThefts,
      weeklyThefts,
    };
  } catch (error) {
    console.error('Error fetching Loss Prevention analytics dashboard data:', error);
    throw error;
  }
}

/**
 * Fetches incident report summary with pagination and KPI totals.
 * POST /api/LossPrevention/incidentReportSummary
 */
export async function fetchIncidentReportSummary(payload = {}, signal) {
  try {
    let rawEventType = payload.EventType ?? 'All';
    if (rawEventType.toLowerCase() === 'theft') rawEventType = 'Loss';
    else if (rawEventType.toLowerCase() === 'untagged') rawEventType = 'Checkout';

    const body = {
      PageSize: payload.PageSize ?? 10,
      PageNumber: payload.PageNumber ?? 1,
    };

    if (rawEventType && rawEventType !== 'All') body.EventType = rawEventType;
    if (payload.Search) body.Search = payload.Search;
    if (payload.Preset) body.Preset = payload.Preset;

    const fromDate = toIsoDate(payload.StartDate || payload.FromDate);
    const toDate = toIsoDate(payload.EndDate || payload.ToDate);

    if (fromDate) {
      body.FromDate = fromDate;
      body.StartDate = fromDate;
    }
    if (toDate) {
      body.ToDate = toDate;
      body.EndDate = toDate;
    }

    if (payload.StoreCode) body.StoreCode = String(payload.StoreCode);
    if (payload.StoreId) {
      body.StoreId = Number(payload.StoreId);
    }

    const { data } = await axios.post(`${lossPreventionUrl}/incidentReportSummary`, body, { signal });
    let kpiData = null;
    if (!data?.Summary) {
      try {
        const result = await axios.post(`${lossPreventionUrl}/incidentReportDetails`, {
          ...body,
          PageNumber: 1,
          PageSize: 1,
        }, { signal });
        kpiData = result.data;
      } catch (e) {
        console.warn('Failed to fetch fallback Loss Prevention KPI data:', e);
      }
    }

    const rawRecords = Array.isArray(data)
      ? data
      : (data.Records || data.value || data.records || []);
    const totalRecords = Number(data.TotalRecords ?? data.Count ?? rawRecords.length);

    const summaryObj = data?.Summary || kpiData?.Summary || kpiData || {};
    const totalTags = Number(
      data?.TotalAll ??
        data?.TotalTags ??
        summaryObj.TotalTags ??
        kpiData?.TotalTags ??
        rawRecords.reduce((acc, r) => acc + (Number(r.Qty) || 0), 0),
    );
    const totalCheckout = Number(
      data?.TotalCheckout ??
        data?.TotalUntagged ??
        summaryObj.Checkout ??
        summaryObj.Untagged ??
        kpiData?.TotalCheckout ??
        kpiData?.TotalUntagged ??
        0,
    );
    const totalLoss = Number(
      data?.TotalLoss ??
        data?.TotalTheft ??
        summaryObj.Loss ??
        summaryObj.TheftAlerts ??
        kpiData?.TotalLoss ??
        kpiData?.TotalTheft ??
        0,
    );

    let potentialLoss =
      data?.PotentialLossDisplay ??
      data?.TotalLossDisplay ??
      data?.PotentialLoss ??
      summaryObj.PotentialLossDisplay ??
      kpiData?.PotentialLossDisplay ??
      summaryObj.PotentialLoss;

    if (!potentialLoss || potentialLoss === 'N/A' || potentialLoss === 'NA') {
      const sumLoss = rawRecords.reduce(
        (acc, r) => acc + (typeof r.Amount === 'number' && !isNaN(r.Amount) ? r.Amount : 0),
        0,
      );
      potentialLoss = formatCurrency(sumLoss);
    } else {
      potentialLoss = formatCurrency(potentialLoss);
    }

    const records = rawRecords.map((item, idx) => {
      let itemEventType = item.EventType || 'Loss';
      if (itemEventType.toLowerCase() === 'theft') itemEventType = 'Loss';
      if (itemEventType.toLowerCase() === 'untagged') itemEventType = 'Checkout';

      let articleCount = item.ArticleCount;
      if (articleCount === 'N/A' || articleCount === 'NA' || (articleCount === null && itemEventType === 'Checkout')) {
        articleCount = 'N/A';
      } else {
        const parsedCount = Number(articleCount);
        articleCount =
          !isNaN(parsedCount) && articleCount !== null && articleCount !== ''
            ? parsedCount
            : (itemEventType === 'Checkout' ? 'N/A' : 0);
      }

      const rawAmt = item.Amount;
      const rawAmtDisplay = item.AmountDisplay;
      let safeAmt = 0;
      let isAmountNA = false;

      if (
        rawAmt === 'N/A' ||
        rawAmt === 'NA' ||
        (rawAmtDisplay === 'N/A' && (rawAmt === null || rawAmt === undefined || rawAmt === 0))
      ) {
        isAmountNA = true;
        safeAmt = 'N/A';
      } else if (typeof rawAmt === 'number' && !isNaN(rawAmt)) {
        safeAmt = rawAmt;
      } else if (rawAmt !== null && rawAmt !== undefined && rawAmt !== '') {
        const parsed = Number(String(rawAmt).replace(/[₹,$,\s]/g, ''));
        if (!isNaN(parsed)) {
          safeAmt = parsed;
        } else {
          isAmountNA = true;
          safeAmt = 'N/A';
        }
      } else if (itemEventType === 'Checkout') {
        isAmountNA = true;
        safeAmt = 'N/A';
      } else {
        safeAmt = 0;
      }

      const amountDisplay =
        isAmountNA || safeAmt === 'N/A'
          ? 'N/A'
          : (rawAmtDisplay && rawAmtDisplay !== 'N/A' ? formatCurrency(rawAmtDisplay) : formatCurrency(safeAmt));

      return {
        id: `summary-${item.Date || idx}-${item.StoreCode || ''}-${itemEventType}-${idx}`,
        srNo: item.SrNo ?? idx + 1,
        date: item.Date || '',
        storeCode: item.StoreCode || '',
        storeName: item.StoreName || '',
        eventType: itemEventType,
        articleCount,
        qty: Number(item.Qty ?? 0),
        amount: safeAmt,
        amountDisplay,
      };
    });

    return {
      code: data.Code || 1,
      msg: data.Msg || 'Success',
      preset: payload.Preset || data.Preset,
      startDate: fromDate,
      endDate: toDate,
      summary: summaryObj,
      totalAll: totalTags,
      totalTags,
      totalLoss,
      theftAlerts: totalLoss,
      loss: totalLoss,
      totalCheckout,
      untagged: totalCheckout,
      checkout: totalCheckout,
      potentialLoss,
      pageNumber: Number(data.PageNumber ?? body.PageNumber),
      pageSize: Number(data.PageSize ?? body.PageSize),
      totalRecords,
      totalPages: Number(data.TotalPages ?? (Math.ceil(totalRecords / (body.PageSize || 10)) || 1)),
      records,
    };
  } catch (error) {
    console.error('Error fetching Loss Prevention incident report summary:', error);
    throw error;
  }
}

export async function fetchIncidentReport(payload = {}, signal) {
  return fetchIncidentReportSummary(payload, signal);
}

/**
 * Fetches detailed EPC-level incident report rows.
 * POST /api/LossPrevention/incidentReportDetails
 */
export async function fetchIncidentReportDetails(payload = {}, signal) {
  try {
    let rawEventType = payload.EventType ?? 'All';
    if (rawEventType.toLowerCase() === 'theft') rawEventType = 'Loss';
    else if (rawEventType.toLowerCase() === 'untagged') rawEventType = 'Checkout';

    const body = {
      PageSize: payload.PageSize ?? 10,
      PageNumber: payload.PageNumber ?? 1,
    };

    if (payload.Date) {
      body.Date = payload.Date;
    } else {
      const fromDate = toIsoDate(payload.StartDate || payload.FromDate);
      const toDate = toIsoDate(payload.EndDate || payload.ToDate);
      if (fromDate) body.FromDate = fromDate;
      if (toDate) body.ToDate = toDate;
    }

    if (payload.StoreCode) body.StoreCode = String(payload.StoreCode);
    if (payload.StoreId) body.StoreId = Number(payload.StoreId);
    if (rawEventType && rawEventType !== 'All') body.EventType = rawEventType;
    if (payload.Search) body.Search = payload.Search;

    const { data } = await axios.post(`${lossPreventionUrl}/incidentReportDetails`, body, { signal });
    const summary = data.Summary || {};
    const totalAll = Number(data.TotalAll ?? data.TotalTags ?? summary.TotalTags ?? data.TotalRecords ?? 0);
    const totalTheft = Number(data.TotalTheft ?? data.TotalLoss ?? data.TheftAlerts ?? data.Loss ?? summary.TheftAlerts ?? summary.Loss ?? 0);
    const totalUntagged = Number(data.TotalUntagged ?? data.TotalCheckout ?? data.Untagged ?? data.Checkout ?? summary.Untagged ?? summary.Checkout ?? 0);
    const totalTags = Number(data.TotalTags ?? summary.TotalTags ?? totalAll);
    const theftAlerts = Number(data.TheftAlerts ?? data.Loss ?? summary.TheftAlerts ?? summary.Loss ?? totalTheft);
    const untagged = Number(data.Untagged ?? data.Checkout ?? summary.Untagged ?? summary.Checkout ?? totalUntagged);

    let potentialLoss = data.PotentialLossDisplay || data.TotalLossDisplay || summary.PotentialLossDisplay;
    if (!potentialLoss || potentialLoss === 'N/A' || potentialLoss === 'NA') {
      const rawLoss = data.PotentialLoss ?? summary.PotentialLoss ?? 0;
      const numLoss = Number(rawLoss);
      potentialLoss = `₹${(isNaN(numLoss) ? 0 : numLoss).toLocaleString('en-IN')}`;
    } else if (!potentialLoss.startsWith('₹')) {
      const numLoss = Number(String(potentialLoss).replace(/,/g, ''));
      potentialLoss = !isNaN(numLoss) ? `₹${numLoss.toLocaleString('en-IN')}` : '₹0';
    }

    return {
      code: data.Code,
      msg: data.Msg,
      preset: data.Preset,
      startDate: data.StartDate,
      endDate: data.EndDate,
      summary: data.Summary || null,
      totalAll,
      totalTheft,
      totalLoss: totalTheft,
      totalUntagged,
      totalCheckout: totalUntagged,
      totalTags,
      theftAlerts,
      loss: theftAlerts,
      untagged,
      checkout: untagged,
      potentialLoss,
      pageNumber: Number(data.PageNumber ?? body.PageNumber),
      pageSize: Number(data.PageSize ?? body.PageSize),
      totalRecords: Number(data.TotalRecords ?? (data.Records ? data.Records.length : 0)),
      totalPages: Number(data.TotalPages ?? 1),
      records: (data.Records || data.value || []).map((item, idx) => {
        const rawAmt = item.Amount ?? item.AmountDisplay ?? 0;
        let safeAmt = 0;
        if (typeof rawAmt === 'number' && !isNaN(rawAmt)) {
          safeAmt = rawAmt;
        } else if (rawAmt && rawAmt !== 'N/A' && rawAmt !== 'NA') {
          const parsed = Number(String(rawAmt).replace(/[₹,\s]/g, ''));
          safeAmt = isNaN(parsed) ? 0 : parsed;
        }

        const rawMrp = item.MRP ?? item.MRPDisplay ?? 0;
        let safeMrp = 0;
        if (typeof rawMrp === 'number' && !isNaN(rawMrp)) {
          safeMrp = rawMrp;
        } else if (rawMrp && rawMrp !== 'N/A' && rawMrp !== 'NA') {
          const parsed = Number(String(rawMrp).replace(/[₹,\s]/g, ''));
          safeMrp = isNaN(parsed) ? 0 : parsed;
        }

        let itemEventType = item.EventType || 'Loss';
        if (itemEventType.toLowerCase() === 'theft') itemEventType = 'Loss';
        if (itemEventType.toLowerCase() === 'untagged') itemEventType = 'Checkout';

        return {
          id: item.EpcCode || item.EPC || `detail-${item.SrNo || idx}`,
          srNo: item.SrNo ?? idx + 1,
          date: item.Date || '',
          time: item.Time || '',
          storeCode: item.StoreCode || '',
          storeName: item.StoreName || '',
          epc: item.EpcCode || item.EPC || '',
          articleNo: item.ArticleNo || '',
          articleDescription: item.ArticleDescription || '',
          mrp: safeMrp,
          mrpDisplay: item.MRPDisplay || formatCurrency(safeMrp),
          qty: item.Qty ?? 1,
          amount: safeAmt,
          amountDisplay: item.AmountDisplay || formatCurrency(safeAmt),
          eventType: itemEventType,
        };
      }),
    };
  } catch (error) {
    console.error('Error fetching Loss Prevention incident report details:', error);
    throw error;
  }
}

// ============================================================================
// Stores Lookup & Scoped Selection Persistence
// ============================================================================

export function normalizeStore(s) {
  if (!s) return null;
  const storeId = s.StoreId ?? s.storeId ?? s.id ?? '';
  const storeCode = String(s.StoreCode ?? s.storeCode ?? '').trim();
  const rawName = String(s.StoreName ?? s.storeName ?? s.DisplayText ?? s.displayText ?? s.name ?? '').trim();

  let cleanName = rawName;
  if (storeCode && rawName.toLowerCase().startsWith(storeCode.toLowerCase())) {
    cleanName = rawName.slice(storeCode.length).replace(/^[\s\-–—:]+/, '').trim();
  }
  if (!cleanName) {
    cleanName = rawName || storeCode;
  }

  return {
    id: storeId,
    storeId,
    storeCode,
    storeName: rawName,
    displayText: s.DisplayText || s.displayText || rawName,
    cleanName,
    location: s.Location || s.location || (storeCode.startsWith('HH') ? 'Gurgaon' : 'Delhi'),
  };
}

export const DEFAULT_STORES = [
  { id: 6, storeId: 6, storeCode: 'HD44', storeName: 'HD44 - Uttam Nagar 2', displayText: 'HD44 - Uttam Nagar 2', cleanName: 'Uttam Nagar 2', location: 'Delhi' },
  { id: 1, storeId: 1, storeCode: 'HD55', storeName: 'HD55 - Dwarka', displayText: 'HD55 - Dwarka', cleanName: 'Dwarka', location: 'Delhi' },
  { id: 5, storeId: 5, storeCode: 'HH15', storeName: 'HH15 - Dundahera', displayText: 'HH15 - Dundahera', cleanName: 'Dundahera', location: 'Delhi' },
  { id: 11, storeId: 11, storeCode: 'HH40', storeName: 'HH40 - GURGAON SEC-89', displayText: 'HH40 - GURGAON SEC-89', cleanName: 'GURGAON SEC-89', location: 'Gurgaon' },
  { id: 13, storeId: 13, storeCode: 'HH43', storeName: 'HH43 - GURGAON SEC-102', displayText: 'HH43 - GURGAON SEC-102', cleanName: 'GURGAON SEC-102', location: 'Gurgaon' },
  { id: 12, storeId: 12, storeCode: 'HH45', storeName: 'HH45 - GURGAON SEC-92', displayText: 'HH45 - GURGAON SEC-92', cleanName: 'GURGAON SEC-92', location: 'Gurgaon' },
];

// Revalidate assignments on mount and share simultaneous requests from different views.
const pendingStoreRequests = new Map();

function getStoreCacheKey() {
  const userId = getActiveUserId();
  const loginTime = sessionStorage.getItem('vmm_login_time') || 'active';
  return userId ? `${LP_STORAGE_KEYS.CACHED_STORES}:${userId}:${loginTime}` : null;
}

export function getCachedStores() {
  try {
    const key = getStoreCacheKey();
    const rows = key && JSON.parse(sessionStorage.getItem(key));
    return Array.isArray(rows) ? rows : null;
  } catch {
    return null;
  }
}

export async function fetchStores(forceRefresh = false) {
  const key = getStoreCacheKey();
  const userId = getActiveUserId();
  if (!key || !userId) return [];

  if (forceRefresh) {
    pendingStoreRequests.delete(key);
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore storage errors
    }
  } else if (pendingStoreRequests.has(key)) {
    return pendingStoreRequests.get(key);
  }

  const request = axios
    .get(`${lossPreventionUrl}/stores`, { params: { userId } })
    .then(({ data }) => {
      const raw = data?.Code === 0 ? [] : (data?.Stores ?? data);
      const stores = Array.isArray(raw) ? raw.map(normalizeStore).filter(Boolean) : [];
      if (key !== getStoreCacheKey()) return [];
      try {
        sessionStorage.setItem(key, JSON.stringify(stores));
      } catch {
        // Storage can be unavailable or full.
      }
      return stores;
    })
    .catch(async (error) => {
      if (key !== getStoreCacheKey()) return [];
      if (error.response?.status === 401 || error.response?.status === 403) {
        sessionStorage.removeItem(key);
        return [];
      }
      // Fallback to VMM's original role-based store dropdown endpoint (/api/report/stores)
      try {
        const reportStores = await getReportStores();
        if (Array.isArray(reportStores) && key === getStoreCacheKey()) {
          const stores = reportStores
            .map((item) => {
              const code = String(item?.Value ?? item?.value ?? item?.STORE_CODE ?? item?.storeCode ?? item?.Text ?? item?.text ?? '').trim();
              if (!code) return null;
              const matched = DEFAULT_STORES.find((d) => d.storeCode.toLowerCase() === code.toLowerCase());
              return matched
                ? { ...matched }
                : normalizeStore({ StoreCode: code, StoreName: item?.Text ?? item?.text ?? code });
            })
            .filter(Boolean);
          try {
            sessionStorage.setItem(key, JSON.stringify(stores));
          } catch {
            // ignore storage errors
          }
          return stores;
        }
      } catch {
        // ignore fallback error
      }
      console.warn('Could not fetch Loss Prevention stores:', error.message);
      return getCachedStores() || [];
    })
    .finally(() => pendingStoreRequests.delete(key));

  pendingStoreRequests.set(key, request);
  return request;
}

/**
 * Reads the currently signed-in VMM username from VMM's `sessionStorage['vmm_user']`.
 */
export function getCurrentUsername() {
  try {
    const raw = sessionStorage.getItem('vmm_user');
    if (raw) {
      const user = JSON.parse(raw);
      return String(user?.userName ?? user?.UserName ?? user?.username ?? '').trim().toLowerCase();
    }
  } catch {
    // ignore storage errors
  }
  return '';
}

export function getSavedStore() {
  try {
    const raw =
      localStorage.getItem(LP_STORAGE_KEYS.SELECTED_STORE) ||
      sessionStorage.getItem(LP_STORAGE_KEYS.SELECTED_STORE);
    if (raw) {
      const parsed = JSON.parse(raw);
      const userId = getActiveUserId();
      const belongsToUser = parsed.authUserId != null
        ? String(parsed.authUserId) === String(userId)
        : parsed.authUsername && parsed.authUsername === getCurrentUsername();
      if (!userId || !belongsToUser) {
        localStorage.removeItem(LP_STORAGE_KEYS.SELECTED_STORE);
        sessionStorage.removeItem(LP_STORAGE_KEYS.SELECTED_STORE);
        return null;
      }
      return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

export function saveSelectedStore(store) {
  if (!store) return;
  try {
    const currentUsername = getCurrentUsername();
    const storeToSave = {
      ...store,
      authUserId: getActiveUserId(),
      ...(currentUsername ? { authUsername: currentUsername } : {}),
    };
    localStorage.setItem(LP_STORAGE_KEYS.SELECTED_STORE, JSON.stringify(storeToSave));
    sessionStorage.setItem(LP_STORAGE_KEYS.SELECTED_STORE, JSON.stringify(storeToSave));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(LP_EVENTS.STORE_CHANGED, { detail: storeToSave }));
    }
  } catch {
    // ignore storage errors
  }
}

export function clearSavedStore() {
  try {
    localStorage.removeItem(LP_STORAGE_KEYS.SELECTED_STORE);
    sessionStorage.removeItem(LP_STORAGE_KEYS.SELECTED_STORE);
    const cacheKey = getStoreCacheKey();
    if (cacheKey) sessionStorage.removeItem(cacheKey);

    const resetStore = {
      noStore: true,
      storeCode: '',
      storeId: '',
      storeName: 'No stores assigned',
      cleanName: 'No stores assigned',
      displayText: 'No stores assigned',
      reset: true,
      userSelected: false,
    };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(LP_EVENTS.STORE_CHANGED, { detail: resetStore }));
      window.dispatchEvent(new CustomEvent(LP_EVENTS.STORE_RESET, { detail: resetStore }));
    }
  } catch {
    // ignore storage errors
  }
}
