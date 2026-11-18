import * as XLSX from 'xlsx';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const parseNumOrNull = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;
  const cleaned = String(val).replace(/,/g, '').replace(/%/g, '').trim();
  if (!cleaned || cleaned === '—' || cleaned === '-' || cleaned.toUpperCase() === 'N/A') return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

export const parseNum = (val) => parseNumOrNull(val) ?? 0;

export const formatIn = (val) => Math.round(parseNum(val)).toLocaleString('en-IN');

export const clamp = (num, min, max) => Math.min(max, Math.max(min, num));

/**
 * Classifies percentage metrics using standard store thresholds:
 * < 50% Red, 50% - 90% Amber, > 90% Green.
 */
export const getCoverageTier = (pct) => {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return 'neutral';
  if (pct < 50) return 'red';
  if (pct <= 90) return 'amber';
  return 'green';
};

/**
 * Formats cycle count row lastCcDate + lastCcEndTime (or lastCcStartTime) into "13 Nov 18:01".
 */
export const formatCycleCountTimestamp = (dateStr, startTime, endTime) => {
  if (!dateStr) {
    return { label: '—', sortKey: '', inProgress: false };
  }

  const rawDate = String(dateStr).trim().split('T')[0].split(' ')[0];
  let dateLabel = rawDate;
  const parts = rawDate.split('-');
  if (parts.length === 3) {
    const monthIdx = parseInt(parts[1], 10) - 1;
    const dayNum = parseInt(parts[2], 10);
    if (monthIdx >= 0 && monthIdx < 12 && !Number.isNaN(dayNum)) {
      dateLabel = `${dayNum} ${MONTHS[monthIdx]}`;
    }
  }

  const rawEnd = endTime && endTime !== '—' ? String(endTime).trim() : '';
  const rawStart = startTime && startTime !== '—' ? String(startTime).trim() : '';
  const timeSource = rawEnd || rawStart;
  const timeMatch = timeSource.match(/(\d{1,2}:\d{2})/);
  const hhmm = timeMatch ? timeMatch[1].padStart(5, '0') : '';

  return {
    label: hhmm ? `${dateLabel} ${hhmm}` : dateLabel,
    sortKey: `${rawDate}T${timeSource || '00:00:00'}`,
    inProgress: !rawEnd && Boolean(rawStart),
  };
};

/**
 * Provisional composite health score (0-100) combining coverage, RFID checkout,
 * and pending operational backlogs.
 */
export const calculateStoreScore = (store) => {
  let weightedPoints = 0;
  let totalWeight = 0;

  if (store.hasLiveStock && store.coveragePct !== null) {
    weightedPoints += (clamp(store.coveragePct, 0, 100) / 100) * 45;
    totalWeight += 45;
  }

  if (store.hasSale && store.checkoutPct !== null) {
    weightedPoints += (clamp(store.checkoutPct, 0, 100) / 100) * 25;
    totalWeight += 25;
  }

  const hasHygieneData = store.hasStoreValidation || store.hasVoid || store.hasReturn || store.hasDcValidation;
  if (hasHygieneData) {
    const valPenalty = Math.min(10, (store.validationPending || 0) * 0.4) + Math.min(5, (store.huWrong || 0) * 2);
    const voidRetPenalty = Math.min(10, ((store.voidPending || 0) + (store.returnPending || 0)) * 0.25);
    const dcPenalty = Math.min(5, (store.dcUnprocessed || 0) * 2);
    weightedPoints += clamp(30 - valPenalty - voidRetPenalty - dcPenalty, 0, 30);
    totalWeight += 30;
  }

  if (totalWeight === 0) return null;
  return Math.round(clamp((weightedPoints / totalWeight) * 100, 0, 100));
};

const plural = (n, singular, pluralWord) => (n === 1 ? singular : pluralWord);

/**
 * Generates ordered, highlighted WHY items linking straight to the responsible module.
 */
export const buildStoreWhyReasons = (store, permissions = {}) => {
  const reasons = [];

  if (permissions.live_stock && store.hasLiveStock && store.coveragePct !== null && store.coveragePct < 90) {
    reasons.push({
      text: `Stock coverage ${Math.round(store.coveragePct)}% (RFID ${formatIn(store.rfidStock)} of SAP ${formatIn(store.sapStock)})`,
      severity: store.coveragePct < 50 ? 'red' : 'amber',
      sectionKey: 'live_stock',
    });
  }

  if (permissions.sale && store.hasSale && store.dposSale > 0 && store.checkoutPct !== null && store.checkoutPct < 90) {
    const taggedItems = Math.max(0, store.dposSale - store.taffetaSale);
    const taggedSharePct = Math.round((taggedItems / store.dposSale) * 100);

    if (store.taffetaSale > 0 && taggedSharePct < 90) {
      reasons.push({
        text: `Only ${taggedSharePct}% of sales are RFID-tagged items (${formatIn(store.taffetaSale)} taffeta of ${formatIn(store.dposSale)})`,
        severity: 'amber',
        sectionKey: 'sale',
      });
    } else if (store.manualSale > 0) {
      const n = Math.round(store.manualSale);
      reasons.push({
        text: `${formatIn(n)} manual ${plural(n, 'scan', 'scans')} missed RFID (${store.checkoutPct.toFixed(1)}% checkout of ${formatIn(store.dposSale)})`,
        severity: 'amber',
        sectionKey: 'sale',
      });
    } else {
      reasons.push({
        text: `RFID checkout ${store.checkoutPct.toFixed(1)}% (${formatIn(store.rfidCheckout)} of ${formatIn(store.dposSale)} sold)`,
        severity: 'amber',
        sectionKey: 'sale',
      });
    }
  }

  if (permissions.store_validation && store.validationPending > 0) {
    const n = Math.round(store.validationPending);
    reasons.push({
      text: `${formatIn(n)} ${plural(n, 'HU', 'HUs')} pending store validation`,
      severity: 'amber',
      sectionKey: 'store_validation',
    });
  }

  if (permissions.store_validation && store.huWrong > 0) {
    const n = Math.round(store.huWrong);
    reasons.push({
      text: `${formatIn(n)} wrong ${plural(n, 'HU', 'HUs')} flagged at store`,
      severity: 'red',
      sectionKey: 'store_validation',
    });
  }

  if (permissions.void && store.voidPending > 0) {
    const n = Math.round(store.voidPending);
    reasons.push({
      text: `${formatIn(n)} void ${plural(n, 'item', 'items')} not encoded back`,
      severity: 'amber',
      sectionKey: 'void',
    });
  }

  if (permissions.return && store.returnPending > 0) {
    const n = Math.round(store.returnPending);
    reasons.push({
      text: `${formatIn(n)} return ${plural(n, 'item', 'items')} not encoded back`,
      severity: 'amber',
      sectionKey: 'return',
    });
  }

  if (permissions.dc_validation && store.dcUnprocessed > 0) {
    const n = Math.round(store.dcUnprocessed);
    reasons.push({
      text: `${formatIn(n)} ${plural(n, 'HU', 'HUs')} not processed at DC`,
      severity: 'amber',
      sectionKey: 'dc_validation',
    });
  }

  if (reasons.length === 0) {
    const fallbackSection =
      (permissions.live_stock && 'live_stock') ||
      (permissions.sale && 'sale') ||
      (permissions.store_validation && 'store_validation') ||
      (permissions.dc_validation && 'dc_validation') ||
      'live_stock';
    reasons.push({
      text: 'All tracked RFID metrics within target thresholds',
      severity: 'green',
      sectionKey: fallbackSection,
    });
  }

  const severityRank = { red: 0, amber: 1, green: 2 };
  return reasons.sort((a, b) => (severityRank[a.severity] ?? 3) - (severityRank[b.severity] ?? 3));
};

/**
 * Maps the single `/api/stock/overview` response into permission-aware KPI card models
 * and unified Store Scorecard rows.
 */
export const buildOverviewData = (apiResponse, permissions = {}) => {
  const summary = apiResponse?.summary || {};
  const rawStores = Array.isArray(apiResponse?.stores) ? apiResponse.stores : [];

  let redStores = 0;
  let amberStores = 0;
  let greenStores = 0;

  const storeRows = rawStores
    .map((r) => {
      const storeCode = String(r.storeCode || '').trim().toUpperCase();
      if (!storeCode) return null;

      const hasLiveStock = Boolean(permissions.live_stock && r.hasLiveStock);
      const sapStock = hasLiveStock ? parseNum(r.sapStock) : 0;
      const rfidStock = hasLiveStock ? parseNum(r.rfidStock) : 0;
      const coveragePct = hasLiveStock
        ? (sapStock > 0 ? (rfidStock / sapStock) * 100 : parseNumOrNull(r.coveragePct))
        : null;

      const hasSale = Boolean(permissions.sale && r.hasSale);
      const dposSale = hasSale ? parseNum(r.totalDposSale) : 0;
      const rfidCheckout = hasSale ? parseNum(r.totalRfidCheckout) : 0;
      const taffetaSale = hasSale ? parseNum(r.totalTaffetaSale) : 0;
      const manualSale = hasSale ? parseNum(r.totalManualSale) : 0;
      const checkoutPct = hasSale && dposSale > 0 ? (rfidCheckout / dposSale) * 100 : null;

      const hasStoreValidation = Boolean(permissions.store_validation && r.hasStoreValidation);
      const whValidated = hasStoreValidation ? parseNum(r.huValidatedQty) : 0;
      const hhtValidated = hasStoreValidation ? parseNum(r.hhtValidateQty) : 0;
      const validationPending = hasStoreValidation ? parseNum(r.storePendingQty) : 0;
      const huWrong = hasStoreValidation ? parseNum(r.huWrongQty) : 0;

      const hasVoid = Boolean(permissions.void && r.hasVoid);
      const voidTotal = hasVoid ? parseNum(r.voidQty) : 0;
      const voidPending = hasVoid ? parseNum(r.voidPendingQty) : 0;

      const hasReturn = Boolean(permissions.return && r.hasReturn);
      const returnTotal = hasReturn ? parseNum(r.returnQty) : 0;
      const returnPending = hasReturn ? parseNum(r.returnPendingQty) : 0;

      const hasDcValidation = Boolean(permissions.dc_validation && r.hasDcValidation);
      const dcProcessed = hasDcValidation ? parseNum(r.dcProcessedHu) : 0;
      const dcUnprocessed = hasDcValidation ? parseNum(r.dcUnprocessedHu) : 0;

      const hasCycleCount = Boolean(permissions.cycle_count && r.hasCycleCount);
      const cycleFormatted = hasCycleCount
        ? formatCycleCountTimestamp(r.lastCcDate, r.lastCcStartTime, r.lastCcEndTime)
        : { label: '—', sortKey: '', inProgress: false };

      const storeModel = {
        storeCode,
        storeName: String(r.storeName || '').trim().toUpperCase(),
        hasLiveStock,
        sapStock,
        rfidStock,
        coveragePct,
        hasSale,
        dposSale,
        rfidCheckout,
        taffetaSale,
        manualSale,
        checkoutPct,
        hasStoreValidation,
        whValidated,
        hhtValidated,
        validationPending,
        huWrong,
        hasVoid,
        voidTotal,
        voidPending,
        hasReturn,
        returnTotal,
        returnPending,
        hasDcValidation,
        dcProcessed,
        dcUnprocessed,
        hasCycleCount,
        lastCycleCount: cycleFormatted.label,
        cycleCountSortKey: cycleFormatted.sortKey,
        cycleCountInProgress: cycleFormatted.inProgress,
      };

      const coverageTier = getCoverageTier(coveragePct);
      if (hasLiveStock && coveragePct !== null) {
        if (coverageTier === 'red') redStores += 1;
        else if (coverageTier === 'amber') amberStores += 1;
        else greenStores += 1;
      }

      const score = calculateStoreScore(storeModel);
      const statusTier = coverageTier !== 'neutral'
        ? coverageTier
        : (score !== null ? getCoverageTier(score) : 'neutral');

      return {
        ...storeModel,
        coverageTier,
        statusTier,
        statusLabel: statusTier === 'red' ? 'Critical' : statusTier === 'amber' ? 'Warning' : statusTier === 'green' ? 'Healthy' : '—',
        score,
        reasons: buildStoreWhyReasons(storeModel, permissions),
      };
    })
    .filter(Boolean);

  const totalSap = parseNum(summary.sapStock);
  const totalRfid = parseNum(summary.rfidStock);
  const overallCoveragePct = totalSap > 0 ? (totalRfid / totalSap) * 100 : parseNum(summary.coveragePct);

  const totalDpos = parseNum(summary.dposSale);
  const totalRfidSale = parseNum(summary.rfidCheckout);
  const taggedCapturePct = parseNum(summary.taggedCapturePct);
  const overallCheckoutPct = totalDpos > 0 ? (totalRfidSale / totalDpos) * 100 : parseNum(summary.checkoutPct);

  const totalValidationPending = parseNum(summary.storePendingQty);
  const totalWhValidated = parseNum(summary.huValidatedQty);
  const totalWrongHu = parseNum(summary.huWrongQty);

  const totalVoidPending = parseNum(summary.voidPendingQty);
  const totalVoidQty = parseNum(summary.voidQty);
  const totalReturnPending = parseNum(summary.returnPendingQty);
  const totalReturnQty = parseNum(summary.returnQty);

  const totalDcUnprocessed = parseNum(summary.dcUnprocessedHu);
  const dcEncodedToday = parseNum(summary.dcEncodedToday);
  const dcErrorPct = parseNum(summary.dcEncodingErrorPct);

  return {
    kpis: {
      stores: {
        red: redStores,
        amber: amberStores,
        green: greenStores,
        total: redStores + amberStores + greenStores,
      },
      stockCoverage: {
        pct: overallCoveragePct,
        rfid: totalRfid,
        sap: totalSap,
      },
      rfidCheckout: {
        pct: overallCheckoutPct,
        rfidSale: totalRfidSale,
        dposSale: totalDpos,
        taggedCapturePct,
      },
      validationPending: {
        pending: totalValidationPending,
        whValidated: totalWhValidated,
        wrong: totalWrongHu,
      },
      voidReturnPending: {
        voidPending: totalVoidPending,
        returnPending: totalReturnPending,
        voidTotal: totalVoidQty,
        returnTotal: totalReturnQty,
      },
      dcEncoding: {
        encodedToday: dcEncodedToday,
        errorPct: dcErrorPct,
        unprocessedHu: totalDcUnprocessed,
      },
    },
    storeRows,
  };
};

/**
 * Exports the unified Store Scorecard table directly to Excel (.xlsx).
 */
export const exportScorecardToExcel = (storeRows = []) => {
  const sheetRows = storeRows.map((r) => ({
    Status: r.statusLabel,
    'Store Code': r.storeCode,
    'Store Name': r.storeName || r.storeCode,
    Score: r.score !== null ? r.score : '',
    'Stock Coverage (%)': r.coveragePct !== null ? Number(r.coveragePct.toFixed(1)) : '',
    'RFID Stock': r.hasLiveStock ? r.rfidStock : '',
    'SAP Stock': r.hasLiveStock ? r.sapStock : '',
    'RFID Checkout (%)': r.checkoutPct !== null ? Number(r.checkoutPct.toFixed(1)) : '',
    'Validation Pending': r.hasStoreValidation ? r.validationPending : '',
    'WH Validated HUs': r.hasStoreValidation ? r.whValidated : '',
    'Wrong HUs': r.hasStoreValidation ? r.huWrong : '',
    'Void Pending': r.hasVoid ? r.voidPending : '',
    'Return Pending': r.hasReturn ? r.returnPending : '',
    'Last Cycle Count': r.lastCycleCount,
    'DC Unprocessed HUs': r.hasDcValidation ? r.dcUnprocessed : '',
    Reasons: r.reasons.map((item) => item.text).join(' | '),
  }));

  const worksheet = XLSX.utils.json_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Store Scorecard');
  const todayStr = new Date().toLocaleDateString('en-CA');
  XLSX.writeFile(workbook, `Store_Overview_Scorecard_${todayStr}.xlsx`);
};
