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

export const normalizeStoreCode = (code) => {
  const clean = String(code || '').trim().toUpperCase();
  if (!clean || clean === 'TOTAL' || clean === '—' || clean === 'NA') return '';
  return clean;
};

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
 * Formats cycle count row DATE + END_DateTime (or Start_DateTime) into "13 Nov 18:01".
 */
export const formatCycleCountTimestamp = (row) => {
  if (!row || !row.DATE) {
    return { label: '—', sortKey: '', inProgress: false };
  }

  const rawDate = String(row.DATE).trim().split('T')[0].split(' ')[0];
  let dateLabel = rawDate;
  const parts = rawDate.split('-');
  if (parts.length === 3) {
    const monthIdx = parseInt(parts[1], 10) - 1;
    const dayNum = parseInt(parts[2], 10);
    if (monthIdx >= 0 && monthIdx < 12 && !Number.isNaN(dayNum)) {
      dateLabel = `${dayNum} ${MONTHS[monthIdx]}`;
    }
  }

  const rawEnd = row.END_DateTime && row.END_DateTime !== '—' ? String(row.END_DateTime).trim() : '';
  const rawStart = row.Start_DateTime && row.Start_DateTime !== '—' ? String(row.Start_DateTime).trim() : '';
  const timeSource = rawEnd || rawStart;
  const timeMatch = timeSource.match(/(\d{1,2}:\d{2})/);
  const hhmm = timeMatch ? timeMatch[1].padStart(5, '0') : '';

  const sortKey = `${rawDate}T${timeSource || '00:00:00'}`;
  const label = hhmm ? `${dateLabel} ${hhmm}` : dateLabel;

  return {
    label,
    sortKey,
    inProgress: !rawEnd && Boolean(rawStart),
  };
};

/**
 * Provisional composite health score (0-100) combining coverage, RFID checkout,
 * and pending operational backlogs. Isolated in one pure function so weights
 * can be swapped cleanly once final business scoring rules are confirmed.
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
    const hygienePoints = clamp(30 - valPenalty - voidRetPenalty - dcPenalty, 0, 30);
    weightedPoints += hygienePoints;
    totalWeight += 30;
  }

  if (totalWeight === 0) return null;
  return Math.round(clamp((weightedPoints / totalWeight) * 100, 0, 100));
};

/**
 * Generates ordered, highlighted WHY badge items linking straight to the responsible module.
 */
export const buildStoreWhyReasons = (store, permissions = {}) => {
  const reasons = [];

  if (permissions.live_stock && store.hasLiveStock && store.coveragePct !== null && store.coveragePct < 90) {
    const isRed = store.coveragePct < 50;
    reasons.push({
      text: `Stock coverage ${Math.round(store.coveragePct)}% (RFID ${formatIn(store.rfidStock)} of SAP ${formatIn(store.sapStock)})`,
      severity: isRed ? 'red' : 'amber',
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
      reasons.push({
        text: `${formatIn(store.manualSale)} manual scans missed RFID (${store.checkoutPct.toFixed(1)}% checkout of ${formatIn(store.dposSale)})`,
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
    reasons.push({
      text: `${formatIn(store.validationPending)} HUs pending store validation`,
      severity: 'amber',
      sectionKey: 'store_validation',
    });
  }

  if (permissions.store_validation && store.huWrong > 0) {
    reasons.push({
      text: `${formatIn(store.huWrong)} wrong HUs flagged at store`,
      severity: 'red',
      sectionKey: 'store_validation',
    });
  }

  if (permissions.void && store.voidPending > 0) {
    reasons.push({
      text: `${formatIn(store.voidPending)} void items not encoded back`,
      severity: 'amber',
      sectionKey: 'void',
    });
  }

  if (permissions.return && store.returnPending > 0) {
    reasons.push({
      text: `${formatIn(store.returnPending)} return items not encoded back`,
      severity: 'amber',
      sectionKey: 'return',
    });
  }

  if (permissions.dc_validation && store.dcUnprocessed > 0) {
    reasons.push({
      text: `${formatIn(store.dcUnprocessed)} HUs not processed at DC`,
      severity: 'amber',
      sectionKey: 'dc_validation',
    });
  }

  if (reasons.length === 0) {
    const fallbackSection =
      (permissions.live_stock && 'live_stock') ||
      (permissions.sale && 'sale') ||
      (permissions.store_validation && 'store_validation') ||
      'live_stock';
    reasons.push({
      text: 'All tracked RFID metrics within target thresholds',
      severity: 'green',
      sectionKey: fallbackSection,
    });
  }

  return reasons;
};

const createEmptyStore = (code) => ({
  storeCode: code,
  storeName: '',
  hasLiveStock: false,
  sapStock: 0,
  rfidStock: 0,
  coveragePct: null,
  hasSale: false,
  dposSale: 0,
  rfidCheckout: 0,
  taffetaSale: 0,
  manualSale: 0,
  checkoutPct: null,
  hasStoreValidation: false,
  whValidated: 0,
  hhtValidated: 0,
  validationPending: 0,
  huWrong: 0,
  hasVoid: false,
  voidTotal: 0,
  voidPending: 0,
  hasReturn: false,
  returnTotal: 0,
  returnPending: 0,
  hasDcValidation: false,
  dcProcessed: 0,
  dcUnprocessed: 0,
  hasCycleCount: false,
  lastCycleCount: '—',
  cycleCountSortKey: '',
  cycleCountInProgress: false,
});

const getOrCreateStore = (map, rawCode, rawName) => {
  const code = normalizeStoreCode(rawCode);
  if (!code) return null;
  if (!map.has(code)) {
    map.set(code, createEmptyStore(code));
  }
  const entry = map.get(code);
  const name = String(rawName || '').trim();
  if (name && name.toUpperCase() !== 'TOTAL' && !entry.storeName) {
    entry.storeName = name.toUpperCase();
  }
  return entry;
};

/**
 * Combines live hooks and permission flags into the 6 Overview KPI card models
 * and unified per-store scorecard rows.
 */
export const buildOverviewData = ({ hooks = {}, dcEncodingErrors = {}, permissions = {} }) => {
  const storeMap = new Map();

  // 1. Live Stock
  if (permissions.live_stock) {
    (hooks.live_stock?.data || []).forEach((row) => {
      const entry = getOrCreateStore(storeMap, row.STORE_CODE, row.STORE_NAME);
      if (!entry) return;
      const sap = parseNum(row.SAP_STOCK);
      const rfid = parseNum(row.RFID_STOCK);
      const apiPct = parseNumOrNull(row.PERCENTAGE);
      entry.hasLiveStock = true;
      entry.sapStock += sap;
      entry.rfidStock += rfid;
      entry.coveragePct = entry.sapStock > 0
        ? (entry.rfidStock / entry.sapStock) * 100
        : (apiPct ?? entry.coveragePct);
    });
  }

  // 2. Sales & RFID Checkout
  if (permissions.sale) {
    (hooks.sale?.data || []).forEach((row) => {
      const entry = getOrCreateStore(storeMap, row.STORE || row.STORE_CODE, row.STORE_NAME);
      if (!entry) return;
      entry.hasSale = true;
      entry.dposSale += parseNum(row.TOTAL_DPOS_SALE);
      entry.rfidCheckout += parseNum(row.TOTAL_RFID_CHECKOUT);
      entry.taffetaSale += parseNum(row.TOTAL_TAFFETA_SALE);
      entry.manualSale += parseNum(row.TOTAL_MANUAL_SALE);
      entry.checkoutPct = entry.dposSale > 0 ? (entry.rfidCheckout / entry.dposSale) * 100 : null;
    });
  }

  // 3. Store Validation
  if (permissions.store_validation) {
    (hooks.store_validation?.data || []).forEach((row) => {
      const entry = getOrCreateStore(storeMap, row.STORE || row.STORE_CODE, row.STORE_NAME);
      if (!entry) return;
      entry.hasStoreValidation = true;
      entry.whValidated += parseNum(row.HU_VALIDATED_QTY);
      entry.hhtValidated += parseNum(row.HHT_VALIDATE_QTY);
      entry.validationPending += parseNum(row.STORE_PENDING_QTY);
      entry.huWrong += parseNum(row.HU_WRONG_QTY);
    });
  }

  // 4. Void
  if (permissions.void) {
    (hooks.void?.data || []).forEach((row) => {
      const entry = getOrCreateStore(storeMap, row.STORE || row.STORE_CODE, row.STORE_NAME);
      if (!entry) return;
      entry.hasVoid = true;
      entry.voidTotal += parseNum(row.VOID_QTY);
      entry.voidPending += parseNum(row.DIFFERENCE_QTY);
    });
  }

  // 5. Return
  if (permissions.return) {
    (hooks.return?.data || []).forEach((row) => {
      const entry = getOrCreateStore(storeMap, row.Store_Code || row.STORE_CODE || row.STORE, row.STORE_NAME);
      if (!entry) return;
      entry.hasReturn = true;
      entry.returnTotal += parseNum(row.RETURN_QTY);
      entry.returnPending += parseNum(row.DIFFERENCE_QTY);
    });
  }

  // 6. Cycle Count (most recent audit per store)
  if (permissions.cycle_count) {
    (hooks.cycle_count?.data || []).forEach((row) => {
      const entry = getOrCreateStore(storeMap, row.STORE_CODE || row.STORE, row.STORE_NAME);
      if (!entry) return;
      const formatted = formatCycleCountTimestamp(row);
      if (!entry.hasCycleCount || formatted.sortKey > entry.cycleCountSortKey) {
        entry.hasCycleCount = true;
        entry.lastCycleCount = formatted.label;
        entry.cycleCountSortKey = formatted.sortKey;
        entry.cycleCountInProgress = formatted.inProgress;
      }
    });
  }

  // 7. DC Validation (Receiving Plant mapped to Store Code)
  if (permissions.dc_validation) {
    (hooks.dc_validation?.data || []).forEach((row) => {
      const entry = getOrCreateStore(
        storeMap,
        row.Reciving_Plant || row.RECIVING_PLANT || row.Store_Code || row.STORE_CODE,
        row.STORE_NAME
      );
      if (!entry) return;
      entry.hasDcValidation = true;
      entry.dcProcessed += parseNum(row.PROCESSED_HU);
      entry.dcUnprocessed += parseNum(row.UNPROCESSED_HU);
    });
  }

  // Enrich each store with score, status tier, and WHY reasons
  let redStores = 0;
  let amberStores = 0;
  let greenStores = 0;

  const storeRows = Array.from(storeMap.values()).map((entry) => {
    const coverageTier = getCoverageTier(entry.coveragePct);
    if (entry.hasLiveStock && entry.coveragePct !== null) {
      if (coverageTier === 'red') redStores += 1;
      else if (coverageTier === 'amber') amberStores += 1;
      else greenStores += 1;
    }

    const score = calculateStoreScore(entry);
    const statusTier = coverageTier !== 'neutral'
      ? coverageTier
      : (score !== null ? getCoverageTier(score) : 'neutral');

    const reasons = buildStoreWhyReasons(entry, permissions);

    return {
      ...entry,
      coverageTier,
      statusTier,
      statusLabel: statusTier === 'red' ? 'Red' : statusTier === 'amber' ? 'Amber' : statusTier === 'green' ? 'Green' : '—',
      score,
      reasons,
    };
  });

  // ---- Build Top 6 KPI Summaries ----
  const liveTotals = hooks.live_stock?.totals;
  const totalSap = parseNumOrNull(liveTotals?.SAP_STOCK) ?? storeRows.reduce((acc, r) => acc + r.sapStock, 0);
  const totalRfid = parseNumOrNull(liveTotals?.RFID_STOCK) ?? storeRows.reduce((acc, r) => acc + r.rfidStock, 0);
  const overallCoveragePct = totalSap > 0 ? (totalRfid / totalSap) * 100 : 0;

  const saleTotals = hooks.sale?.totals;
  const totalDpos = parseNumOrNull(saleTotals?.TOTAL_DPOS_SALE) ?? storeRows.reduce((acc, r) => acc + r.dposSale, 0);
  const totalRfidSale = parseNumOrNull(saleTotals?.TOTAL_RFID_CHECKOUT) ?? storeRows.reduce((acc, r) => acc + r.rfidCheckout, 0);
  const totalTaffetaSale = parseNumOrNull(saleTotals?.TOTAL_TAFFETA_SALE) ?? storeRows.reduce((acc, r) => acc + r.taffetaSale, 0);
  const totalManualSale = parseNumOrNull(saleTotals?.TOTAL_MANUAL_SALE) ?? storeRows.reduce((acc, r) => acc + r.manualSale, 0);
  const overallCheckoutPct = totalDpos > 0 ? (totalRfidSale / totalDpos) * 100 : 0;
  const taggedDenominator = (totalRfidSale + totalManualSale) > 0
    ? (totalRfidSale + totalManualSale)
    : Math.max(0, totalDpos - totalTaffetaSale);
  const taggedCapturePct = taggedDenominator > 0 ? Math.min(100, (totalRfidSale / taggedDenominator) * 100) : 0;

  const valTotals = hooks.store_validation?.totals;
  const totalValidationPending = parseNumOrNull(valTotals?.STORE_PENDING_QTY) ?? storeRows.reduce((acc, r) => acc + r.validationPending, 0);
  const totalWhValidated = parseNumOrNull(valTotals?.HU_VALIDATED_QTY) ?? storeRows.reduce((acc, r) => acc + r.whValidated, 0);
  const totalWrongHu = parseNumOrNull(valTotals?.HU_WRONG_QTY) ?? storeRows.reduce((acc, r) => acc + r.huWrong, 0);

  const voidTotals = hooks.void?.totals;
  const returnTotals = hooks.return?.totals;
  const totalVoidPending = parseNumOrNull(voidTotals?.DIFFERENCE_QTY) ?? storeRows.reduce((acc, r) => acc + r.voidPending, 0);
  const totalVoidQty = parseNumOrNull(voidTotals?.VOID_QTY) ?? storeRows.reduce((acc, r) => acc + r.voidTotal, 0);
  const totalReturnPending = parseNumOrNull(returnTotals?.DIFFERENCE_QTY) ?? storeRows.reduce((acc, r) => acc + r.returnPending, 0);
  const totalReturnQty = parseNumOrNull(returnTotals?.RETURN_QTY) ?? storeRows.reduce((acc, r) => acc + r.returnTotal, 0);

  const dcValTotals = hooks.dc_validation?.totals;
  const totalDcUnprocessed = parseNumOrNull(dcValTotals?.UNPROCESSED_HU) ?? storeRows.reduce((acc, r) => acc + r.dcUnprocessed, 0);

  const dcEncChartData = hooks.dc_encoding?.chartData || [];
  const dcEncodedToday = dcEncChartData.reduce((sum, item) => sum + parseNum(item.count), 0)
    || dcEncodingErrors?.totalEncoded
    || 0;

  const liveStockStoreCount = redStores + amberStores + greenStores;

  return {
    kpis: {
      stores: {
        red: redStores,
        amber: amberStores,
        green: greenStores,
        total: liveStockStoreCount,
        accent: redStores > 0 ? 'red' : amberStores > 0 ? 'amber' : 'green',
      },
      stockCoverage: {
        pct: overallCoveragePct,
        rfid: totalRfid,
        sap: totalSap,
        accent: getCoverageTier(overallCoveragePct),
      },
      rfidCheckout: {
        pct: overallCheckoutPct,
        rfidSale: totalRfidSale,
        dposSale: totalDpos,
        taggedCapturePct,
        accent: getCoverageTier(overallCheckoutPct),
      },
      validationPending: {
        pending: totalValidationPending,
        whValidated: totalWhValidated,
        wrong: totalWrongHu,
        accent: totalWrongHu > 0 ? 'red' : totalValidationPending > 0 ? 'amber' : 'green',
      },
      voidReturnPending: {
        voidPending: totalVoidPending,
        returnPending: totalReturnPending,
        voidTotal: totalVoidQty,
        returnTotal: totalReturnQty,
        accent: (totalVoidPending > 0 || totalReturnPending > 0) ? 'amber' : 'green',
      },
      dcEncoding: {
        encodedToday: dcEncodedToday,
        errorPct: dcEncodingErrors?.errorPct ?? 0,
        errorLoading: Boolean(dcEncodingErrors?.isLoading),
        unprocessedHu: totalDcUnprocessed,
        accent: 'neutral',
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
