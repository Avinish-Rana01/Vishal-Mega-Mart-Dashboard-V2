import { useState, useEffect, useCallback } from 'react';
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

/**
 * Generic hook for dashboard table endpoints.
 * Handles state management, debouncing, and API fetching with AbortController.
 */
const useDashboardFetch = (apiFn, filterFn, totalsMapper, initialPageSize = API_DEFAULTS.PAGE_SIZE) => {
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Pagination State
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchData = async () => {
      setIsLoading(true);
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

        if (response.summary) {
          if (totalsMapper) {
            setTotals(totalsMapper(response.summary));
          }
          const total = response.summary.totalRecords ?? response.summary.totalCount ?? response.summary.recordCount;
          if (total !== undefined && total > 0) {
            setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
          }
        }
      } catch (err) {
        if (err.name === 'AbortError' || err.name === 'CanceledError') return;
        console.error("Error fetching data:", err);
        setError("Unable to load data. Please check your connection.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [searchQuery, pageIndex, pageSize, refreshTrigger, apiFn, filterFn, totalsMapper]);

  const refresh = useCallback(() => setRefreshTrigger(prev => prev + 1), []);

  return { 
    data, totals, isLoading, error, 
    searchQuery, setSearchQuery, refresh,
    pageIndex, setPageIndex, pageSize, setPageSize, totalPages 
  };
};

// ==========================================
// 1. Live Stock
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

export const useLiveStock = () => useDashboardFetch(getLiveStock, liveStockFilter, liveStockTotals);

// ==========================================
// 2. Cycle Count
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

export const useCycleCount = () => useDashboardFetch(getCycleCount, cycleCountFilter, cycleCountTotals);

// ==========================================
// 3. Vendor Discrepancy
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

export const useVendorDiscrepancy = () => useDashboardFetch(getVendorDiscrepancy, vendorFilter, vendorTotals);

// ==========================================
// 4. Store Dashboard
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

export const useStoreDashboard = () => useDashboardFetch(getStoreDashboard, storeDashboardFilter, storeDashboardTotals);

// ==========================================
// 5. Sale Dashboard
// ==========================================
import { generateMockSaleDashboard } from '../utils/mockSaleDashboard';

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

// Temporarily mock getSaleDashboard for 20 stores due to empty backend data
const mockGetSaleDashboard = async (signal) => {
  return generateMockSaleDashboard(20);
};

export const useSaleDashboard = () => useDashboardFetch(mockGetSaleDashboard, saleDashboardFilter, saleDashboardTotals);

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

import { generateMockVoidDashboard } from '../utils/mockVoidDashboard';

const mockGetVoidDashboard = async (signal) => {
  return generateMockVoidDashboard(20);
};

export const useVoidDashboard = () => useDashboardFetch(mockGetVoidDashboard, voidDashboardFilter, voidDashboardTotals);

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

import { generateMockReturnDashboard } from '../utils/mockReturnDashboard';

const mockGetReturnDashboard = async (signal) => {
  return generateMockReturnDashboard();
};

export const useReturnDashboard = () => useDashboardFetch(mockGetReturnDashboard, returnDashboardFilter, returnDashboardTotals);

// ==========================================
// 8. DC Validation
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

export const useDcValidation = () => useDashboardFetch(getDcValidation, dcValidationFilter, dcValidationTotals);

// ==========================================
// 9. Tag Management Charts (NOT REFACTORED)
// ==========================================
export const useTagCharts = () => {
  const [locationData, setLocationData] = useState([]);
  const [locationTotal, setLocationTotal] = useState(0);
  const [cycleData, setCycleData] = useState([]);
  const [cycleTotal, setCycleTotal] = useState(0);
  const [avgRecycle, setAvgRecycle] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const fetchTagCharts = async () => {
      setIsLoading(true);
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
        setAvgRecycle(cycData.summary?.avgTagPercentage || 0);

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
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error("Error fetching tag management charts:", err);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchTagCharts();
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [trigger]);

  const refresh = () => setTrigger(t => t + 1);

  return {
    locationData,
    locationTotal,
    cycleData,
    cycleTotal,
    avgRecycle,
    isLoading,
    refresh
  };
};

// ==========================================
// 10. Warehouse Encoding (NOT REFACTORED)
// ==========================================
export const useWarehouseEncoding = () => {
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date range state (default to today)
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getWarehouseEncoding(fromDate, toDate, controller.signal);
        if (controller.signal.aborted) return;
        
        // Transform the summary object into an array for both table and chart
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

          // Prepend a "TOTAL" row for the table view
          setData([
            { timeBlock: 'TOTAL', count: total },
            ...formattedData
          ]);

          // Set chart data (excluding the TOTAL row)
          setChartData(formattedData);
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
        }
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [fromDate, toDate, trigger]);

  const refresh = () => setTrigger(t => t + 1);

  return { data, chartData, isLoading, error, fromDate, setFromDate, toDate, setToDate, refresh };
};
