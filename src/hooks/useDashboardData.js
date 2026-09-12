import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getLiveStock,
  getCycleCount,
  getVendorDiscrepancy,
  getTagLocation,
  getTagCycleCount,
  getStoreDashboard,
  getSaleDashboard,
  getVoidDashboard,
  getReturnDashboard,
  getWarehouseEncoding,
  getDcValidation
} from '../services/stockService';
import { API_DEFAULTS, STORE_MAPPING } from '../config/constants';
import { liveStockSocket } from '../services/liveStockSocket';

/**
 * Generic hook for dashboard table endpoints.
 * Handles state management, debouncing, and API fetching with AbortController.
 */
const useDashboardFetch = (apiFn, filterFn, totalsMapper, initialPageSize = API_DEFAULTS.PAGE_SIZE) => {
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const hasDataRef = useRef(false);
  
  // Pagination State
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchData = async () => {
      if (!hasDataRef.current) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      try {
        const response = await apiFn(searchQuery, pageIndex, pageSize, controller.signal);
        
        if (controller.signal.aborted) return;

        let items = response.items || [];
        if (searchQuery.trim() && filterFn) {
          const term = searchQuery.toLowerCase();
          items = items.filter(row => filterFn(row, term));
        }

        // Apply CEO Store Name Mapping globally to all dashboard data
        items = items.map(row => {
          const code = row.STORE_CODE || row.STORE || row.Store_Code;
          if (code && STORE_MAPPING[code]) {
            return { ...row, STORE_NAME: STORE_MAPPING[code] };
          }
          return row;
        });

        setData(items);
        if (items.length > 0) {
          hasDataRef.current = true;
        }

        if (response.summary) {
          if (totalsMapper) {
            setTotals(totalsMapper(response.summary));
          }
          const total = response.summary.totalRecords ?? response.summary.totalCount ?? response.summary.recordCount;
          if (total !== undefined && total > 0) {
            setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
          }
        } else {
          setTotals(null);
          setTotalPages(1);
        }
      } catch (err) {
        if (err.name === 'AbortError' || err.name === 'CanceledError') return;
        console.error("Error fetching data:", err);
        setError("Unable to load data. Please check your connection.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    const delay = searchQuery ? 300 : 0;
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, delay);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [searchQuery, pageIndex, pageSize, refreshTrigger, apiFn, filterFn, totalsMapper]);

  const refresh = useCallback(() => setRefreshTrigger(prev => prev + 1), []);

  return { 
    data, totals, isLoading, isRefreshing, error, 
    searchQuery, setSearchQuery, refresh,
    pageIndex, setPageIndex, pageSize, setPageSize, totalPages 
  };
};

// ==========================================
// 1. Live Stock (Enhanced with Real-Time Delta Reducer & SignalR)
// ==========================================
const liveStockFilter = (row, term) => 
  (row.STORE_CODE && row.STORE_CODE.toLowerCase().includes(term)) ||
  (row.STORE_NAME && row.STORE_NAME.toLowerCase().includes(term)) ||
  (row.DATE && row.DATE.toLowerCase().includes(term));

const liveStockTotals = (summary) => ({
  STORE_CODE: 'TOTAL',
  SAP_STOCK: summary.sapQty?.toLocaleString('en-IN') || 0,
  RFID_STOCK: summary.rfidQty?.toLocaleString('en-IN') || 0,
  DIFFERENCE: summary.diffQty?.toLocaleString('en-IN') || 0
});

export const useLiveStock = () => {
  const baseFetch = useDashboardFetch(getLiveStock, liveStockFilter, liveStockTotals);
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState(null);
  const [highlightedStore, setHighlightedStore] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Sync initial and refreshed baseline data from HTTP API
  useEffect(() => {
    if (baseFetch.data) {
      setData(baseFetch.data);
    }
  }, [baseFetch.data]);

  useEffect(() => {
    setTotals(baseFetch.totals);
  }, [baseFetch.totals]);

  // Connect to SignalR as soon as initial API request completes
  useEffect(() => {
    if (!baseFetch.isLoading && connectionStatus === 'disconnected') {
      liveStockSocket.connect();
    }
  }, [baseFetch.isLoading, connectionStatus]);

  // Connect to SignalR LiveStockHub and apply in-place micro-delta patches
  useEffect(() => {
    let highlightTimer = null;

    const unsubStatus = liveStockSocket.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    const unsubPatch = liveStockSocket.onPatch((patch) => {
      if (!patch || !patch.storeCode) return;

      // 1. In-place row update using immutable .map()
      setData((prev) => {
        let storeFound = false;
        const updated = prev.map((row) => {
          if (row.STORE_CODE === patch.storeCode) {
            storeFound = true;
            return {
              ...row,
              RFID_STOCK: patch.newRfidStock !== undefined ? patch.newRfidStock : row.RFID_STOCK,
              SAP_STOCK: patch.newSapStock !== undefined ? patch.newSapStock : row.SAP_STOCK,
              DIFFERENCE: patch.newDifference !== undefined ? patch.newDifference : row.DIFFERENCE,
              PERCENTAGE: patch.newPercentage !== undefined ? String(patch.newPercentage) : row.PERCENTAGE,
              _lastUpdated: Date.now()
            };
          }
          return row;
        });

        // If newly scanned store is not in current view, prepend it smoothly
        if (!storeFound && patch.storeCode) {
          return [
            {
              RowNumber: 1,
              STORE_CODE: patch.storeCode,
              STORE_NAME: patch.storeName || STORE_MAPPING[patch.storeCode] || patch.storeCode,
              SAP_STOCK: patch.newSapStock || 0,
              RFID_STOCK: patch.newRfidStock || 0,
              DIFFERENCE: patch.newDifference || 0,
              PERCENTAGE: String(patch.newPercentage || 0),
              DATE: new Date().toISOString().split('T')[0],
              _lastUpdated: Date.now()
            },
            ...updated
          ];
        }

        return updated;
      });

      // 2. In-place global KPI counter updates
      if (patch.summaryDelta) {
        setTotals((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            RFID_STOCK: patch.summaryDelta.newTotalRfid !== undefined 
              ? patch.summaryDelta.newTotalRfid.toLocaleString('en-IN') 
              : prev.RFID_STOCK,
            DIFFERENCE: patch.summaryDelta.newTotalDiff !== undefined 
              ? patch.summaryDelta.newTotalDiff.toLocaleString('en-IN') 
              : prev.DIFFERENCE
          };
        });
      }

      // 3. Highlight updated store with 1.2s emerald glow
      setHighlightedStore(patch.storeCode);
      if (highlightTimer) clearTimeout(highlightTimer);
      highlightTimer = setTimeout(() => {
        setHighlightedStore(null);
      }, 1200);
    });

    return () => {
      unsubStatus();
      unsubPatch();
      if (highlightTimer) clearTimeout(highlightTimer);
    };
  }, []);

  return {
    ...baseFetch,
    data,
    totals: totals || baseFetch.totals,
    highlightedStore,
    connectionStatus
  };
};

// ==========================================
// 2. Cycle Count (Enhanced with Real-Time Delta Reducer & SignalR)
// ==========================================
const cycleCountFilter = (row, term) => 
  (row.STORE_CODE && row.STORE_CODE.toLowerCase().includes(term)) ||
  (row.STORE_NAME && row.STORE_NAME.toLowerCase().includes(term)) ||
  (row.DATE && row.DATE.toLowerCase().includes(term)) ||
  (row.REF_NO && row.REF_NO.toLowerCase().includes(term));

const cycleCountTotals = (summary) => ({
  STORE_CODE: 'TOTAL',
  REF_NO: summary.refNo || 0,
  recordCount: summary.recordCount || 0
});

export const useCycleCount = () => {
  const baseFetch = useDashboardFetch(getCycleCount, cycleCountFilter, cycleCountTotals);
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState(null);
  const [highlightedRow, setHighlightedRow] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    if (baseFetch.data) setData(baseFetch.data);
  }, [baseFetch.data]);

  useEffect(() => {
    setTotals(baseFetch.totals);
  }, [baseFetch.totals]);

  // Connect to SignalR as soon as initial API request completes
  useEffect(() => {
    if (!baseFetch.isLoading && connectionStatus === 'disconnected') {
      liveStockSocket.connect();
    }
  }, [baseFetch.isLoading, connectionStatus]);

  useEffect(() => {
    let highlightTimer = null;

    const unsubStatus = liveStockSocket.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    const unsub = liveStockSocket.onCycleCountPatch((patch) => {
      if (!patch) return;
      const matchKey = patch.refNo || patch.storeCode;

      setData((prev) => {
        return prev.map((row) => {
          if ((patch.refNo && row.REF_NO === patch.refNo) || (patch.storeCode && row.STORE_CODE === patch.storeCode)) {
            return {
              ...row,
              SCANNED_QTY: patch.newScannedQty !== undefined ? patch.newScannedQty : row.SCANNED_QTY,
              NET_DIFFERENCE: patch.newNetDifference !== undefined ? patch.newNetDifference : row.NET_DIFFERENCE,
              SHORT_QTY: patch.newShortQty !== undefined ? patch.newShortQty : row.SHORT_QTY,
              EXCESS_QTY: patch.newExcessQty !== undefined ? patch.newExcessQty : row.EXCESS_QTY,
              NO_OF_ARTICLES: patch.newNoOfArticles !== undefined ? patch.newNoOfArticles : row.NO_OF_ARTICLES,
              SYSTEM_STOCK: patch.newSystemStock !== undefined ? patch.newSystemStock : row.SYSTEM_STOCK,
              _lastUpdated: Date.now()
            };
          }
          return row;
        });
      });

      if (patch.summaryDelta) {
        setTotals((prev) => prev ? {
          ...prev,
          REF_NO: patch.summaryDelta.totalRefNo ?? prev.REF_NO,
          recordCount: patch.summaryDelta.recordCount ?? prev.recordCount
        } : prev);
      }

      setHighlightedRow(matchKey);
      if (highlightTimer) clearTimeout(highlightTimer);
      highlightTimer = setTimeout(() => setHighlightedRow(null), 1200);
    });

    return () => {
      unsubStatus();
      unsub();
      if (highlightTimer) clearTimeout(highlightTimer);
    };
  }, []);

  return { ...baseFetch, data, totals: totals || baseFetch.totals, highlightedRow, connectionStatus };
};

// ==========================================
// 3. Vendor Discrepancy (Enhanced with Real-Time Delta Reducer & SignalR)
// ==========================================
const vendorFilter = (row, term) => 
  (row.VENDOR_NAME && row.VENDOR_NAME.toLowerCase().includes(term)) ||
  (row.VENDOR_CODE && row.VENDOR_CODE.toLowerCase().includes(term));

const vendorTotals = (summary) => ({
  VENDOR_CODE: 'TOTAL',
  ACTUAL_QTY: summary.actualQty?.toLocaleString('en-IN') || 0,
  SCANNED_QTY: summary.scannedQty?.toLocaleString('en-IN') || 0,
  DIFF_QTY: summary.differenceQty?.toLocaleString('en-IN') || 0,
  DIFF_TILL_DATE: summary.differenceQtyTillDate?.toLocaleString('en-IN') || 0
});

export const useVendorDiscrepancy = () => {
  const baseFetch = useDashboardFetch(getVendorDiscrepancy, vendorFilter, vendorTotals);
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState(null);
  const [highlightedVendor, setHighlightedVendor] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    if (baseFetch.data) setData(baseFetch.data);
  }, [baseFetch.data]);

  useEffect(() => {
    setTotals(baseFetch.totals);
  }, [baseFetch.totals]);

  // Connect to SignalR as soon as initial API request completes
  useEffect(() => {
    if (!baseFetch.isLoading && connectionStatus === 'disconnected') {
      liveStockSocket.connect();
    }
  }, [baseFetch.isLoading, connectionStatus]);

  useEffect(() => {
    let highlightTimer = null;

    const unsubStatus = liveStockSocket.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    const unsub = liveStockSocket.onVendorDiscrepancyPatch((patch) => {
      if (!patch) return;
      const vendorKey = patch.vendorName || patch.vendorCode;

      setData((prev) => {
        return prev.map((row) => {
          if ((patch.vendorName && row.VENDOR_NAME === patch.vendorName) || (patch.vendorCode && row.VENDOR_CODE === patch.vendorCode)) {
            return {
              ...row,
              ACTUAL_QTY: patch.newActualQty !== undefined ? patch.newActualQty : row.ACTUAL_QTY,
              SCANNED_QTY: patch.newScannedQty !== undefined ? patch.newScannedQty : row.SCANNED_QTY,
              DIFF_QTY: patch.newDifferenceQty !== undefined ? patch.newDifferenceQty : row.DIFF_QTY,
              DIFF_TILL_DATE: patch.newDifferenceQtyTillDate !== undefined ? patch.newDifferenceQtyTillDate : row.DIFF_TILL_DATE,
              _lastUpdated: Date.now()
            };
          }
          return row;
        });
      });

      if (patch.summaryDelta) {
        setTotals((prev) => prev ? {
          ...prev,
          ACTUAL_QTY: patch.summaryDelta.totalActualQty?.toLocaleString('en-IN') ?? prev.ACTUAL_QTY,
          SCANNED_QTY: patch.summaryDelta.totalScannedQty?.toLocaleString('en-IN') ?? prev.SCANNED_QTY,
          DIFF_QTY: patch.summaryDelta.totalDifferenceQty?.toLocaleString('en-IN') ?? prev.DIFF_QTY,
          DIFF_TILL_DATE: patch.summaryDelta.totalDifferenceTillDate?.toLocaleString('en-IN') ?? prev.DIFF_TILL_DATE
        } : prev);
      }

      setHighlightedVendor(vendorKey);
      if (highlightTimer) clearTimeout(highlightTimer);
      highlightTimer = setTimeout(() => setHighlightedVendor(null), 1200);
    });

    return () => {
      unsubStatus();
      unsub();
      if (highlightTimer) clearTimeout(highlightTimer);
    };
  }, []);

  return { ...baseFetch, data, totals: totals || baseFetch.totals, highlightedVendor, connectionStatus };
};

// ==========================================
// 4. Store Dashboard (Enhanced with Real-Time Delta Reducer & SignalR)
// ==========================================
const storeDashboardFilter = (row, term) => 
  (row.STORE && row.STORE.toLowerCase().includes(term)) ||
  (row.STORE_NAME && row.STORE_NAME.toLowerCase().includes(term)) ||
  (row.DATE && row.DATE.toLowerCase().includes(term));

const storeDashboardTotals = (summary) => ({
  STORE: 'TOTAL',
  HU_RECEIVED_QTY: summary.huReceivedQty?.toLocaleString('en-IN') || 0,
  HU_VALIDATED_QTY: summary.huValidatedQty?.toLocaleString('en-IN') || 0,
  HHT_VALIDATE_QTY: summary.hhtValidateQty?.toLocaleString('en-IN') || 0,
  HU_WRONG_QTY: summary.huWrongQty?.toLocaleString('en-IN') || 0,
  ENCODED_QTY: summary.encodedQty?.toLocaleString('en-IN') || 0,
  STORE_PENDING_QTY: ((summary.huReceivedQty || 0) - (summary.huValidatedQty || 0)).toLocaleString('en-IN')
});

export const useStoreDashboard = () => {
  const baseFetch = useDashboardFetch(getStoreDashboard, storeDashboardFilter, storeDashboardTotals);
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState(null);
  const [highlightedStore, setHighlightedStore] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    if (baseFetch.data) setData(baseFetch.data);
  }, [baseFetch.data]);

  useEffect(() => {
    setTotals(baseFetch.totals);
  }, [baseFetch.totals]);

  // Connect to SignalR as soon as initial API request completes
  useEffect(() => {
    if (!baseFetch.isLoading && connectionStatus === 'disconnected') {
      liveStockSocket.connect();
    }
  }, [baseFetch.isLoading, connectionStatus]);

  useEffect(() => {
    let highlightTimer = null;

    const unsubStatus = liveStockSocket.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    const unsub = liveStockSocket.onStoreValidationPatch((patch) => {
      if (!patch || !patch.storeCode) return;

      setData((prev) => {
        return prev.map((row) => {
          const rowStore = row.STORE || row.STORE_CODE;
          if (rowStore === patch.storeCode) {
            return {
              ...row,
              HU_RECEIVED_QTY: patch.newHuReceivedQty !== undefined ? patch.newHuReceivedQty : row.HU_RECEIVED_QTY,
              HU_VALIDATED_QTY: patch.newHuValidatedQty !== undefined ? patch.newHuValidatedQty : row.HU_VALIDATED_QTY,
              HU_WRONG_QTY: patch.newHuWrongQty !== undefined ? patch.newHuWrongQty : row.HU_WRONG_QTY,
              HHT_VALIDATE_QTY: patch.newHhtValidateQty !== undefined ? patch.newHhtValidateQty : row.HHT_VALIDATE_QTY,
              ENCODED_QTY: patch.newEncodedQty !== undefined ? patch.newEncodedQty : row.ENCODED_QTY,
              STORE_PENDING_QTY: patch.newStorePendingQty !== undefined ? patch.newStorePendingQty : row.STORE_PENDING_QTY,
              _lastUpdated: Date.now()
            };
          }
          return row;
        });
      });

      if (patch.summaryDelta) {
        setTotals((prev) => prev ? {
          ...prev,
          HU_RECEIVED_QTY: patch.summaryDelta.totalHuReceived?.toLocaleString('en-IN') ?? prev.HU_RECEIVED_QTY,
          HU_VALIDATED_QTY: patch.summaryDelta.totalHuValidated?.toLocaleString('en-IN') ?? prev.HU_VALIDATED_QTY,
          HU_WRONG_QTY: patch.summaryDelta.totalHuWrong?.toLocaleString('en-IN') ?? prev.HU_WRONG_QTY,
          HHT_VALIDATE_QTY: patch.summaryDelta.totalHhtValidate?.toLocaleString('en-IN') ?? prev.HHT_VALIDATE_QTY,
          ENCODED_QTY: patch.summaryDelta.totalEncoded?.toLocaleString('en-IN') ?? prev.ENCODED_QTY,
          STORE_PENDING_QTY: patch.summaryDelta.totalPending?.toLocaleString('en-IN') ?? prev.STORE_PENDING_QTY
        } : prev);
      }

      setHighlightedStore(patch.storeCode);
      if (highlightTimer) clearTimeout(highlightTimer);
      highlightTimer = setTimeout(() => setHighlightedStore(null), 1200);
    });

    return () => {
      unsubStatus();
      unsub();
      if (highlightTimer) clearTimeout(highlightTimer);
    };
  }, []);

  return { ...baseFetch, data, totals: totals || baseFetch.totals, highlightedStore, connectionStatus };
};

// ==========================================
// 5. Sale Dashboard
// ==========================================
const saleDashboardFilter = (row, term) => 
  (row.STORE && row.STORE.toLowerCase().includes(term)) ||
  (row.STORE_NAME && row.STORE_NAME.toLowerCase().includes(term)) ||
  (row.DATE && row.DATE.toLowerCase().includes(term));

const saleDashboardTotals = (summary) => {
  const dpos = summary.totalDposSale || 0;
  const rfid = summary.totalRfidCheckout || 0;
  
  return {
    STORE: 'TOTAL',
    TOTAL_DPOS_SALE: dpos.toLocaleString('en-IN'),
    TOTAL_RFID_CHECKOUT: rfid.toLocaleString('en-IN'),
    TOTAL_TAFFETA_SALE: summary.totalTaffetaSale?.toLocaleString('en-IN') || 0,
    TOTAL_MANUAL_SALE: summary.totalManualSale?.toLocaleString('en-IN') || 0,
    RFID_SALES_SHARE: dpos === 0 ? 'N/A' : `${((rfid / dpos) * 100).toFixed(1)}%`
  };
};

export const useSaleDashboard = () => useDashboardFetch(
  getSaleDashboard, 
  saleDashboardFilter, 
  saleDashboardTotals
);

// ==========================================
// 6. Void Dashboard
// ==========================================
const voidDashboardFilter = (row, term) => 
  (row.STORE && row.STORE.toLowerCase().includes(term)) ||
  (row.STORE_NAME && row.STORE_NAME.toLowerCase().includes(term)) ||
  (row.DATE && row.DATE.toLowerCase().includes(term));

const voidDashboardTotals = (summary) => ({
  STORE: 'TOTAL',
  VOID_QTY: (summary.returnQty ?? summary.VOID_QTY ?? 0).toLocaleString('en-IN'),
  ENCODE_QTY: (summary.returnEncodedQty ?? summary.ENCODE_QTY ?? 0).toLocaleString('en-IN'),
  DIFFERENCE_QTY: (summary.pendingQty ?? summary.DIFFERENCE_QTY ?? 0).toLocaleString('en-IN')
});

export const useVoidDashboard = () => useDashboardFetch(
  getVoidDashboard, 
  voidDashboardFilter, 
  voidDashboardTotals
);

// ==========================================
// 7. Return Dashboard
// ==========================================
const returnDashboardFilter = (row, term) => 
  (row.Store_Code && row.Store_Code.toLowerCase().includes(term)) ||
  (row.STORE_NAME && row.STORE_NAME.toLowerCase().includes(term)) ||
  (row.DATE && row.DATE.toLowerCase().includes(term));

const returnDashboardTotals = (summary) => ({
  Store_Code: 'TOTAL',
  RETURN_QTY: (summary.returnQty ?? summary.RETURN_QTY ?? 0).toLocaleString('en-IN'),
  ENCODE_QTY: (summary.returnEncodedQty ?? summary.ENCODE_QTY ?? 0).toLocaleString('en-IN'),
  DIFFERENCE_QTY: (summary.pendingQty ?? summary.DIFFERENCE_QTY ?? 0).toLocaleString('en-IN')
});

export const useReturnDashboard = () => useDashboardFetch(
  getReturnDashboard, 
  returnDashboardFilter, 
  returnDashboardTotals
);

// ==========================================
// 8. DC Validation (Enhanced with Real-Time SignalR)
// ==========================================
const dcValidationFilter = (row, term) => 
  (row.STORE_NAME && row.STORE_NAME.toLowerCase().includes(term)) ||
  (row.Reciving_Plant && row.Reciving_Plant.toLowerCase().includes(term));

const dcValidationTotals = (summary) => ({
  recordCount: summary.recordCount || 0,
  PROCESSED_HU: summary.processedHu || 0,
  UNPROCESSED_HU: summary.unprocessedHu || 0,
  PROCESSED_ARTICLE_QTY: summary.articleQty || 0
});

export const useDcValidation = () => {
  const baseFetch = useDashboardFetch(
    getDcValidation, 
    dcValidationFilter, 
    dcValidationTotals
  );

  const [data, setData] = useState([]);
  const [totals, setTotals] = useState(null);
  const [highlightedPlant, setHighlightedPlant] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    if (baseFetch.data) setData(baseFetch.data);
  }, [baseFetch.data]);

  useEffect(() => {
    setTotals(baseFetch.totals);
  }, [baseFetch.totals]);

  // Connect to SignalR as soon as initial API request completes
  useEffect(() => {
    if (!baseFetch.isLoading && connectionStatus === 'disconnected') {
      liveStockSocket.connect();
    }
  }, [baseFetch.isLoading, connectionStatus]);

  useEffect(() => {
    let highlightTimer = null;

    const unsubStatus = liveStockSocket.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    const unsub = liveStockSocket.onDcValidationPatch((patch) => {
      if (!patch || !patch.recivingPlant) return;

      setData((prev) => {
        return prev.map((row) => {
          if (row.Reciving_Plant === patch.recivingPlant) {
            return {
              ...row,
              PROCESSED_HU: patch.newProcessedHu !== undefined ? patch.newProcessedHu : row.PROCESSED_HU,
              UNPROCESSED_HU: patch.newUnprocessedHu !== undefined ? patch.newUnprocessedHu : row.UNPROCESSED_HU,
              PROCESSED_ARTICLE_QTY: patch.newProcessedArticleQty !== undefined ? patch.newProcessedArticleQty : row.PROCESSED_ARTICLE_QTY,
              _lastUpdated: Date.now()
            };
          }
          return row;
        });
      });

      if (patch.summaryDelta) {
        setTotals((prev) => prev ? {
          ...prev,
          recordCount: patch.summaryDelta.recordCount ?? prev.recordCount,
          PROCESSED_HU: patch.summaryDelta.totalProcessedHu ?? prev.PROCESSED_HU,
          UNPROCESSED_HU: patch.summaryDelta.totalUnprocessedHu ?? prev.UNPROCESSED_HU,
          PROCESSED_ARTICLE_QTY: patch.summaryDelta.totalProcessedArticleQty ?? prev.PROCESSED_ARTICLE_QTY
        } : prev);
      }

      setHighlightedPlant(patch.recivingPlant);
      if (highlightTimer) clearTimeout(highlightTimer);
      highlightTimer = setTimeout(() => setHighlightedPlant(null), 1500);
    });

    return () => {
      unsubStatus();
      unsub();
      if (highlightTimer) clearTimeout(highlightTimer);
    };
  }, []);

  return { ...baseFetch, data, totals: totals || baseFetch.totals, highlightedPlant, connectionStatus };
};

// ==========================================
// 9. Tag Management Charts (Enhanced with Real-Time SignalR)
// ==========================================
export const useTagCharts = () => {
  const [locationData, setLocationData] = useState([]);
  const [locationTotal, setLocationTotal] = useState(0);
  const [cycleData, setCycleData] = useState([]);
  const [cycleTotal, setCycleTotal] = useState(0);
  const [avgRecycle, setAvgRecycle] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [trigger, setTrigger] = useState(0);
  const [highlightedLocation, setHighlightedLocation] = useState(null);
  const hasDataRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const fetchTagCharts = async () => {
      if (!hasDataRef.current) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      try {
        const [locData, cycData] = await Promise.all([
          getTagLocation(controller.signal),
          getTagCycleCount(controller.signal)
        ]);

        if (controller.signal.aborted) return;

        const locTotal = locData.summary?.recordCount || 0;
        const storeVal = locData.summary?.storeCount || 0;
        const whVal = locData.summary?.warehouseCount || 0;
        setLocationTotal(locTotal);
        setLocationData([
          { name: 'Inventory at Store', value: storeVal, displayValue: storeVal.toLocaleString('en-IN'), percent: ((storeVal / (locTotal || 1)) * 100).toFixed(2), color: '#8b5cf6' },
          { name: 'Inventory at Warehouse', value: whVal, displayValue: whVal.toLocaleString('en-IN'), percent: ((whVal / (locTotal || 1)) * 100).toFixed(2), color: '#2dd4bf' }
        ]);

        const cycTotal = cycData.summary?.recordCount || 0;
        setCycleTotal(cycTotal);
        setAvgRecycle(cycData.summary?.exactAverage || 0);

        const colors = ['#4ade80', '#fbbf24', '#2dd4bf', '#60a5fa', '#c084fc'];
        if (cycData.distribution) {
          const chartData = cycData.distribution.map((item, idx) => ({
            name: item.Count_Range,
            value: item.EPC_Count,
            displayValue: item.EPC_Count.toLocaleString('en-IN'),
            percent: ((item.EPC_Count / (cycTotal || 1)) * 100).toFixed(2),
            color: colors[idx % colors.length]
          }));
          setCycleData(chartData);
        }
        hasDataRef.current = true;
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error("Error fetching tag management charts:", err);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchTagCharts();
    }, 0);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [trigger]);

  const refresh = useCallback(() => setTrigger(t => t + 1), []);

  // Connect to SignalR as soon as initial API request completes
  useEffect(() => {
    if (!isLoading && connectionStatus === 'disconnected') {
      liveStockSocket.connect();
    }
  }, [isLoading, connectionStatus]);

  // Real-time SignalR subscription for Tag Management deltas
  useEffect(() => {
    let highlightTimer = null;

    const unsubStatus = liveStockSocket.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    const unsub = liveStockSocket.onTagManagementPatch((patch) => {
      if (!patch) return;
      const storeVal = patch.storeCount || 0;
      const whVal = patch.warehouseCount || 0;
      const locTotal = patch.recordCount || (storeVal + whVal);

      setLocationTotal(locTotal);
      setLocationData([
        { name: 'Inventory at Store', value: storeVal, displayValue: storeVal.toLocaleString('en-IN'), percent: ((storeVal / (locTotal || 1)) * 100).toFixed(2), color: '#8b5cf6' },
        { name: 'Inventory at Warehouse', value: whVal, displayValue: whVal.toLocaleString('en-IN'), percent: ((whVal / (locTotal || 1)) * 100).toFixed(2), color: '#2dd4bf' }
      ]);

      if (patch.avgRecycle) setAvgRecycle(patch.avgRecycle);

      setHighlightedLocation('all');
      if (highlightTimer) clearTimeout(highlightTimer);
      highlightTimer = setTimeout(() => setHighlightedLocation(null), 1200);
    });

    return () => {
      unsubStatus();
      unsub();
      if (highlightTimer) clearTimeout(highlightTimer);
    };
  }, [refresh]);

  return {
    locationData,
    locationTotal,
    cycleData,
    cycleTotal,
    avgRecycle,
    isLoading,
    isRefreshing,
    refresh,
    highlightedLocation,
    connectionStatus
  };
};

// ==========================================
// 10. Warehouse Encoding (Enhanced with Real-Time SignalR)
// ==========================================
export const useWarehouseEncoding = () => {
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const [highlightedBlock, setHighlightedBlock] = useState(null);
  const hasDataRef = useRef(false);
  
  // Date range state (default to today)
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      if (!hasDataRef.current) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      try {
        const response = await getWarehouseEncoding(fromDate, toDate, controller.signal);
        if (controller.signal.aborted) return;
        
        if (response.summary) {
          const rawSummary = response.summary;
          const timeBlocks = [
            { label: '08 - 09', key: 'hour8To9' },
            { label: '09 - 10', key: 'hour9To10' },
            { label: '10 - 11', key: 'hour10To11' },
            { label: '11 - 12', key: 'hour11To12' },
            { label: '12 - 13', key: 'hour12To13' },
            { label: '13 - 14', key: 'hour13To14' },
            { label: '14 - 15', key: 'hour14To15' },
            { label: '15 - 16', key: 'hour15To16' },
            { label: '16 - 17', key: 'hour16To17' },
            { label: '17 - 18', key: 'hour17To18' },
            { label: '18 - 19', key: 'hour18To19' },
            { label: '19 - 20', key: 'hour19To20' }
          ];

          let total = 0;
          const formattedData = timeBlocks.map(block => {
            const count = rawSummary[block.key] || 0;
            total += count;
            return {
              timeBlock: block.label,
              count: count
            };
          });

          setData([
            { timeBlock: 'TOTAL', count: total },
            ...formattedData
          ]);

          setChartData(formattedData);
          hasDataRef.current = true;
        } else {
          setData([]);
          setChartData([]);
        }

      } catch (err) {
        if (err.name === 'AbortError' || err.name === 'CanceledError') return;
        console.error("Error fetching warehouse encoding data:", err);
        setError(`Unable to load warehouse encoding data: ${err.message}`);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 0);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [fromDate, toDate, trigger]);

  const refresh = useCallback(() => setTrigger(t => t + 1), []);

  // Connect to SignalR as soon as initial API request completes
  useEffect(() => {
    if (!isLoading && connectionStatus === 'disconnected') {
      liveStockSocket.connect();
    }
  }, [isLoading, connectionStatus]);

  // Real-time SignalR subscription for DC Encoding deltas
  useEffect(() => {
    let highlightTimer = null;

    const unsubStatus = liveStockSocket.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    const unsub = liveStockSocket.onDcEncodingPatch((patch) => {
      if (!patch) return;

      if (patch.allHourCounts) {
        const timeBlocks = [
          '08 - 09', '09 - 10', '10 - 11', '11 - 12',
          '12 - 13', '13 - 14', '14 - 15', '15 - 16',
          '16 - 17', '17 - 18', '18 - 19', '19 - 20'
        ];

        let total = 0;
        const formatted = timeBlocks.map((label) => {
          const count = patch.allHourCounts[label] || 0;
          total += count;
          return { timeBlock: label, count };
        });

        setData([{ timeBlock: 'TOTAL', count: patch.totalCount || total }, ...formatted]);
        setChartData(formatted);
      } else if (patch.timeBlock) {
        setChartData((prev) => {
          return prev.map((item) => {
            if (item.timeBlock === patch.timeBlock) {
              return { ...item, count: patch.newCount };
            }
            return item;
          });
        });

        setData((prev) => {
          return prev.map((item) => {
            if (item.timeBlock === 'TOTAL' && patch.totalCount !== undefined) {
              return { ...item, count: patch.totalCount };
            }
            if (item.timeBlock === patch.timeBlock) {
              return { ...item, count: patch.newCount };
            }
            return item;
          });
        });
      }

      setHighlightedBlock(patch.timeBlock);
      if (highlightTimer) clearTimeout(highlightTimer);
      highlightTimer = setTimeout(() => setHighlightedBlock(null), 1200);
    });

    return () => {
      unsubStatus();
      unsub();
      if (highlightTimer) clearTimeout(highlightTimer);
    };
  }, [refresh]);

  return { data, chartData, isLoading, isRefreshing, error, fromDate, setFromDate, toDate, setToDate, refresh, highlightedBlock, connectionStatus };
};
