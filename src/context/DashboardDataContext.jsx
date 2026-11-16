import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { DashboardDataContext } from './dashboardDataContextValue';
import {
  useLiveStockCore,
  useCycleCountCore,
  useVendorDiscrepancyCore,
  useStoreDashboardCore,
  useSaleDashboardCore,
  useVoidDashboardCore,
  useReturnDashboardCore,
  useDcValidationCore,
  useTagChartsCore,
  useWarehouseEncodingCore,
} from '../hooks/useDashboardData';
import { getWHEncodingDetails } from '../services/stockService';
import { DEFAULT_EPC_RANGES } from '../components/common/EpcRangeBreakdown';

/**
 * Provides a single shared instance of every permitted dashboard module hook so
 * Overview and individual detail tabs read live HTTP + SignalR data without duplicate fetches.
 */
export function DashboardDataProvider({ children }) {
  const { hasSection } = useAuth();

  const canLiveStock = hasSection('live_stock');
  const canCycleCount = hasSection('cycle_count');
  const canVendor = hasSection('vendor_discrepancy');
  const canStoreValidation = hasSection('store_validation');
  const canSale = hasSection('sale');
  const canVoid = hasSection('void');
  const canReturn = hasSection('return');
  const canDcValidation = hasSection('dc_validation');
  const canTagManagement = hasSection('tag_management');
  const canDcEncoding = hasSection('dc_encoding');

  const liveStock = useLiveStockCore(canLiveStock);
  const cycleCount = useCycleCountCore(canCycleCount);
  const vendorDiscrepancy = useVendorDiscrepancyCore(canVendor);
  const storeValidation = useStoreDashboardCore(canStoreValidation);
  const sale = useSaleDashboardCore(canSale);
  const voidData = useVoidDashboardCore(canVoid);
  const returnData = useReturnDashboardCore(canReturn);
  const dcValidation = useDcValidationCore(canDcValidation);
  const tagManagement = useTagChartsCore(canTagManagement);
  const dcEncoding = useWarehouseEncodingCore(canDcEncoding);

  const [dcEncodingErrors, setDcEncodingErrors] = useState({
    totalEncoded: 0,
    totalErrors: 0,
    errorPct: null,
    isLoading: canDcEncoding,
  });

  const [spotlight, setSpotlight] = useState(null);
  const spotlightTimerRef = useRef(null);

  const triggerSpotlight = useCallback((sectionKey, storeCode) => {
    if (!sectionKey || !storeCode) return;
    if (spotlightTimerRef.current) clearTimeout(spotlightTimerRef.current);
    setSpotlight({ sectionKey, storeCode: String(storeCode).trim().toUpperCase(), token: Date.now() });
    spotlightTimerRef.current = setTimeout(() => {
      setSpotlight(null);
    }, 2600);
  }, []);

  useEffect(() => () => {
    if (spotlightTimerRef.current) clearTimeout(spotlightTimerRef.current);
  }, []);

  // Fetch today's hourly DC encoding error summary once (reuses /api/dc-encoding/details)
  useEffect(() => {
    if (!canDcEncoding) {
      setDcEncodingErrors({ totalEncoded: 0, totalErrors: 0, errorPct: null, isLoading: false });
      return;
    }

    const controller = new AbortController();
    const fetchEncodingErrorSummary = async () => {
      try {
        const fromDate = dcEncoding.fromDate || new Date().toLocaleDateString('en-CA');
        const toDate = dcEncoding.toDate || fromDate;
        const result = await getWHEncodingDetails(
          { pageIndex: 1, pageSize: 1, fromDate, toDate },
          controller.signal
        );
        if (controller.signal.aborted || !result) return;

        let hourlyCount = 0;
        let hourlyErrors = 0;
        DEFAULT_EPC_RANGES.forEach(({ summaryKey, summaryErrKey }) => {
          hourlyCount += Number(result?.[summaryKey] ?? result?.[summaryKey.toUpperCase()] ?? 0);
          hourlyErrors += Number(result?.[summaryErrKey] ?? result?.[summaryErrKey.toUpperCase()] ?? 0);
        });

        const totalEncoded = hourlyCount > 0
          ? hourlyCount
          : Number(result?.encqty ?? result?.ENCQTY ?? result?.totalCount ?? result?.TotalCount ?? 0);
        const totalErrors = hourlyErrors > 0
          ? hourlyErrors
          : Number(result?.errorqty ?? result?.ERRORQTY ?? 0);
        const errorPct = totalEncoded > 0 ? Number(((totalErrors / totalEncoded) * 100).toFixed(1)) : 0;

        setDcEncodingErrors({ totalEncoded, totalErrors, errorPct, isLoading: false });
      } catch (err) {
        if (err.name === 'AbortError' || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
        setDcEncodingErrors((prev) => ({ ...prev, isLoading: false }));
      }
    };

    fetchEncodingErrorSummary();
    return () => controller.abort();
  }, [canDcEncoding, dcEncoding.fromDate, dcEncoding.toDate]);

  const hooks = useMemo(() => ({
    live_stock: liveStock,
    cycle_count: cycleCount,
    vendor_discrepancy: vendorDiscrepancy,
    store_validation: storeValidation,
    sale,
    void: voidData,
    return: returnData,
    dc_validation: dcValidation,
    tag_management: tagManagement,
    dc_encoding: dcEncoding,
  }), [
    liveStock,
    cycleCount,
    vendorDiscrepancy,
    storeValidation,
    sale,
    voidData,
    returnData,
    dcValidation,
    tagManagement,
    dcEncoding,
  ]);

  const value = useMemo(() => ({
    hooks,
    dcEncodingErrors,
    spotlight,
    triggerSpotlight,
  }), [hooks, dcEncodingErrors, spotlight, triggerSpotlight]);

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}
