import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Store, RotateCcw, Ban, CheckCircle, MinusCircle, Calendar, CalendarRange } from 'lucide-react';
import AppLayout from '../layout/AppLayout';
import ReportDataTableCard from './ReportDataTableCard';
import SearchableDropdown from './SearchableDropdown';
import CustomDatePicker from './CustomDatePicker';
import CurvedCard from './CurvedCard';
import ReportStatsHeader from './ReportStatsHeader';
import { SearchButton, ClearButton, BackButton } from './ReportActionButton';
import '../../pages/Report/common-reports.css';
import {
  getVoidReconciliationData,
  getVoidPosCounters,
  getVoidSearchEAN,
  getReturnReconciliationData,
  getReturnPosCounters,
  getReturnSearchEAN,
  getBindStores
} from '../../services/stockService';
import { dateRenderer } from '../../utils/dashboardColumns';
import ReconciliationDetailsModal from '../modals/ReconciliationDetailsModal';
import ViewDetailsButton from './ViewDetailsButton';

export default function ReconciliationReportView({ type = 'return' }) {
  const isReturn = type === 'return';
  const location = useLocation();
  const { storeCode: initialStore, date: initialDate, fromDate: initialFromDate, toDate: initialToDate } = location.state || {};

  const { defaultFromDate, defaultToDate } = useMemo(() => {
    if (initialDate) return { defaultFromDate: initialDate, defaultToDate: initialDate };
    if (initialFromDate && initialToDate) return { defaultFromDate: initialFromDate, defaultToDate: initialToDate };

    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 7);

    const fmt = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    return { defaultFromDate: fmt(past), defaultToDate: fmt(today) };
  }, [initialDate, initialFromDate, initialToDate]);

  const isInitialSingleDate = Boolean(initialDate || (initialFromDate && initialToDate && initialFromDate === initialToDate));
  const [dateMode, setDateMode] = useState(isInitialSingleDate ? 'single' : 'range');
  const [savedToDate, setSavedToDate] = useState(defaultToDate);

  const [selectedStore, setSelectedStore] = useState(initialStore || '');
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(isInitialSingleDate ? defaultFromDate : defaultToDate);
  const [pos, setPos] = useState('');
  const [ean, setEan] = useState('');
  const [storeOptions, setStoreOptions] = useState([]);

  const handleDateModeChange = (mode) => {
    if (mode === dateMode) return;
    setDateMode(mode);
    if (mode === 'single') {
      setSavedToDate(toDate);
      setToDate(fromDate);
    } else {
      const restored = (savedToDate && savedToDate !== fromDate) ? savedToDate : defaultToDate;
      setToDate(restored);
    }
  };

  const handleFromDateChange = (val) => {
    setFromDate(val);
    if (dateMode === 'single') {
      setToDate(val);
    }
  };

  // Applied Filters State (only updated on Search / Mount / Clear)
  const [appliedFilters, setAppliedFilters] = useState({
    storeCode: initialStore || '',
    fromDate: defaultFromDate,
    toDate: isInitialSingleDate ? defaultFromDate : defaultToDate,
    pos: '',
    ean: '',
    mode: isInitialSingleDate ? 'single' : 'range'
  });
  
  const [posOptions, setPosOptions] = useState([]);
  const [eanSearchTerm, setEanSearchTerm] = useState('');
  const [eanOptions, setEanOptions] = useState([]);
  const [isEanSearching, setIsEanSearching] = useState(false);
  
  const navigate = useNavigate();
  
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedModalRow, setSelectedModalRow] = useState(null);
  
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortColumn, setSortColumn] = useState(isReturn ? 'BILL_DATE' : 'DATE');
  const [sortDirection, setSortDirection] = useState('asc');

  // Totals
  const [totals, setTotals] = useState({
    qty: 0,
    encodeQty: 0,
    differenceQty: 0
  });

  const exportFilters = useMemo(() => ({
    storeCode: appliedFilters.storeCode,
    pos: appliedFilters.pos,
    ean: appliedFilters.ean,
    fromDate: appliedFilters.fromDate,
    toDate: appliedFilters.toDate,
    mode: appliedFilters.mode,
    sortColumn,
    sortDirection
  }), [appliedFilters, sortColumn, sortDirection]);

  const isSingleDateApplied = appliedFilters.mode === 'single';

  const exportFileName = useMemo(() => {
    const prefix = isReturn ? 'Return' : 'Void';
    const store = appliedFilters.storeCode || 'ALL';
    if (isSingleDateApplied) {
      return `${prefix}_Reconciliation_${store}_${appliedFilters.fromDate}.xlsx`;
    }
    return `${prefix}_Reconciliation_${store}_${appliedFilters.fromDate}_${appliedFilters.toDate}.xlsx`;
  }, [isReturn, appliedFilters.storeCode, appliedFilters.fromDate, appliedFilters.toDate, isSingleDateApplied]);

  // Fetch Store Dropdown Options
  useEffect(() => {
    const controller = new AbortController();
    const fetchStores = async () => {
      try {
        const data = await getBindStores(fromDate, toDate, controller.signal);
        setStoreOptions(Array.isArray(data) ? data : (data?.stores || data?.Stores || []));
      } catch (err) {
        if (err.name !== 'AbortError') console.error("Failed to fetch stores", err);
      }
    };
    fetchStores();
    return () => controller.abort();
  }, [fromDate, toDate]);

  // Fetch POS Dropdown Options
  useEffect(() => {
    const controller = new AbortController();
    const fetchPos = async () => {
      try {
        const fetchApi = isReturn ? getReturnPosCounters : getVoidPosCounters;
        const data = await fetchApi(selectedStore, fromDate, toDate, controller.signal);
        setPosOptions(Array.isArray(data) ? data : (data?.posCounters || []));
      } catch (err) {
        if (err.name !== 'AbortError') console.error("Failed to fetch POS counters", err);
      }
    };
    fetchPos();
    return () => controller.abort();
  }, [isReturn, selectedStore, fromDate, toDate]);

  // POS Counter Options derived from current table data
  const tablePosOptions = useMemo(() => {
    if (!reportData || reportData.length === 0) return [];
    const seen = new Set();
    const list = [];
    for (const row of reportData) {
      const counter = row.COUNTER_NO || row.POS || row.CounterNo;
      if (counter && !seen.has(String(counter))) {
        seen.add(String(counter));
        list.push({ id: String(counter), value: String(counter), text: String(counter) });
      }
    }
    return list;
  }, [reportData]);

  const displayPosOptions = useMemo(() => {
    if (tablePosOptions && tablePosOptions.length > 0) return tablePosOptions;
    return posOptions;
  }, [tablePosOptions, posOptions]);

  // Fetch EAN Options based on search term (only when user actively types)
  useEffect(() => {
    const trimmed = eanSearchTerm.trim();
    if (!trimmed) {
      setEanOptions([]);
      setIsEanSearching(false);
      return;
    }

    const controller = new AbortController();
    const delayDebounceFn = setTimeout(async () => {
      setIsEanSearching(true);
      try {
        const fetchApi = isReturn ? getReturnSearchEAN : getVoidSearchEAN;
        const data = await fetchApi(selectedStore, fromDate, toDate, trimmed, pos, controller.signal);
        setEanOptions(Array.isArray(data) ? data : (data?.eans || []));
      } catch (err) {
        if (err.name !== 'AbortError') console.error("Failed to fetch EAN numbers", err);
      } finally {
        if (!controller.signal.aborted) setIsEanSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [isReturn, eanSearchTerm, selectedStore, fromDate, toDate, pos]);

  // Fetch Report Data
  const fetchReportData = async (signal) => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchApi = isReturn ? getReturnReconciliationData : getVoidReconciliationData;
      const result = await fetchApi(
        appliedFilters.storeCode, 
        appliedFilters.fromDate, 
        appliedFilters.toDate, 
        appliedFilters.pos, 
        appliedFilters.ean, 
        pageIndex, 
        pageSize, 
        sortColumn, 
        sortDirection, 
        signal,
        appliedFilters.mode
      );
      setReportData(result?.data || result?.Data || []);
      setTotalRecords(result?.recordCount ?? result?.RecordCount ?? 0);
      setTotals({
        qty: (isReturn ? (result?.returnQty ?? result?.ReturnQty) : (result?.voidQty ?? result?.VoidQty)) ?? 0,
        encodeQty: result?.encodeQty ?? result?.EncodeQty ?? 0,
        differenceQty: result?.differenceQty ?? result?.DifferenceQty ?? 0
      });
    } catch (err) {
      if (err.name !== 'AbortError' && err.message !== 'canceled' && err.code !== 'ERR_CANCELED') {
        setError(err.message || 'Failed to fetch reconciliation data.');
        setReportData([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchReportData(controller.signal);
    return () => controller.abort();
  }, [isReturn, pageIndex, pageSize, appliedFilters, sortColumn, sortDirection]);

  const handleSearch = () => {
    const effectiveToDate = dateMode === 'single' ? fromDate : toDate;
    setAppliedFilters({
      storeCode: selectedStore,
      fromDate,
      toDate: effectiveToDate,
      pos,
      ean,
      mode: dateMode
    });
    setPageIndex(1);
  };

  const handleClear = () => {
    setSelectedStore(initialStore || '');
    setFromDate(defaultFromDate);
    setToDate(isInitialSingleDate ? defaultFromDate : defaultToDate);
    setSavedToDate(defaultToDate);
    setDateMode(isInitialSingleDate ? 'single' : 'range');
    setPos('');
    setEan('');
    setEanSearchTerm('');
    setSortColumn(isReturn ? 'BILL_DATE' : 'DATE');
    setSortDirection('asc');
    setAppliedFilters({
      storeCode: initialStore || '',
      fromDate: defaultFromDate,
      toDate: isInitialSingleDate ? defaultFromDate : defaultToDate,
      pos: '',
      ean: '',
      mode: isInitialSingleDate ? 'single' : 'range'
    });
    setPageIndex(1);
  };

  const columns = [
    { key: 'SR_NO', label: 'SR.NO', render: (val, row, idx) => ((pageIndex - 1) * pageSize) + idx + 1 },
    { 
      key: isReturn ? 'BILL_DATE' : 'VOID_DATE', 
      label: isReturn ? 'RETURN DATE' : 'VOID DATE', 
      render: (val, row) => dateRenderer(val || row.BILL_DATE || row.VOID_DATE || row.RETURN_DATE || row.DATE) 
    },
    { key: 'STORE_CODE', label: 'STORE CODE', render: (val, row) => val || row.STORE || row.Store_Code },
    { key: 'COUNTER_NO', label: 'POS COUNTER', render: (val, row) => val || row.POS || row.CounterNo },
    { 
      key: isReturn ? 'RETURN_QTY' : 'VOID_QTY', 
      label: isReturn ? 'RETURN QUANTITY' : 'VOID QUANTITY', 
      render: (val, row) => {
        const v = val ?? (isReturn ? (row.RETURN_QTY ?? row.QTY) : (row.VOID_QTY ?? row.QTY)) ?? 0;
        return typeof v === 'number' ? v.toLocaleString('en-IN') : v;
      }
    },
    { 
      key: 'ENCODE_QTY', 
      label: 'ENCODE QUANTITY', 
      render: (val, row) => {
        const v = val ?? row.ENCQTY ?? row.ENCODED_QTY ?? 0;
        return typeof v === 'number' ? v.toLocaleString('en-IN') : v;
      }
    },
    { 
      key: 'DIFFERENCE_QTY', 
      label: 'DIFFERENCE QUANTITY', 
      render: (val, row) => {
        const v = val ?? row.DIFFQTY ?? row.DIFF_QTY ?? 0;
        return typeof v === 'number' ? v.toLocaleString('en-IN') : v;
      }
    },
    { 
      key: 'STATUS', 
      label: 'STATUS', 
      render: (val) => {
        const statusStr = String(val || 'PENDING').toUpperCase();
        return (
          <span style={{ 
            display: 'inline-flex', justifyContent: 'center', alignItems: 'center', minWidth: '70px',
            background: statusStr === 'PENDING' ? '#fef3c7' : '#dcfce7',
            color: statusStr === 'PENDING' ? '#d97706' : '#16a34a',
            fontWeight: 700, borderRadius: '6px', padding: '2px 8px', fontSize: '12px' 
          }}>
            {statusStr}
          </span>
        );
      }
    },
    { 
      key: 'ACTION', 
      label: 'ACTION', 
      align: 'center',
      render: (val, row) => (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <ViewDetailsButton 
            label="View Details"
            variant="blue"
            title="Click to view full reconciliation details"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedModalRow(row);
            }}
          />
        </div>
      )
    }
  ];

  const getStoreName = () => {
    if (!appliedFilters.storeCode) return 'ALL STORES';
    const storeObj = storeOptions.find(s => s.id === appliedFilters.storeCode || s.text?.startsWith(appliedFilters.storeCode));
    if (storeObj) return storeObj.text;
    return appliedFilters.storeCode;
  };

  return (
    <AppLayout 
      headerProps={{
        breadcrumb: <>HOME - PAGES - REPORT - <span className="active">{isReturn ? 'RETURN RECONCILIATION REPORT' : 'VOID RECONCILIATION REPORT'}</span></>,
        showBackButton: true,
        onBackClick: () => navigate(-1)
      }}
    >
      <div className="report-search-card">
        <div className="report-search-header">
          <div className="report-date-mode-toggle-group">
            <button
              type="button"
              className={`report-date-mode-pill ${dateMode === 'single' ? 'active' : ''}`}
              onClick={() => handleDateModeChange('single')}
              title="Filter by single day"
            >
              <Calendar size={13} />
              <span>Single Date</span>
            </button>
            <button
              type="button"
              className={`report-date-mode-pill ${dateMode === 'range' ? 'active' : ''}`}
              onClick={() => handleDateModeChange('range')}
              title="Filter by date range"
            >
              <CalendarRange size={13} />
              <span>Date Range</span>
            </button>
          </div>
          <span>NOTE : FIELDS MARKED WITH (*) ARE REQUIRED</span>
        </div>
        <div className="report-search-body">
          <div className="search-field">
            <label>Store Code</label>
            <SearchableDropdown
              options={storeOptions}
              value={selectedStore}
              onChange={setSelectedStore}
              placeholder="All Stores"
            />
          </div>
          
          <div className="search-field">
            <label>{dateMode === 'single' ? 'Date *' : 'From Date *'}</label>
            <CustomDatePicker value={fromDate} onChange={handleFromDateChange} />
          </div>

          {dateMode === 'range' && (
            <div className="search-field">
              <label>To Date</label>
              <CustomDatePicker value={toDate} onChange={setToDate} />
            </div>
          )}

            <div className="search-field">
              <label>POS Counter</label>
              <SearchableDropdown
                options={displayPosOptions}
                value={pos}
                onChange={setPos}
                placeholder="Select POS Counter"
                valueKey="id"
                closeOnSelect={true}
              />
            </div>

            <div className="search-field">
              <label>EAN</label>
              <SearchableDropdown
                options={eanOptions}
                value={ean}
                onChange={setEan}
                placeholder="Select EAN"
                searchPlaceholder="Search EAN..."
                isAsync={true}
                onSearchChange={setEanSearchTerm}
                isLoading={isEanSearching}
                valueKey="id"
                closeOnSelect={true}
              />
            </div>

            <div className="search-buttons">
              <SearchButton
                onClick={handleSearch}
                disabled={isLoading}
                loading={isLoading}
              />
              <ClearButton onClick={handleClear} />
              <BackButton 
                onClick={() => navigate(-1)} 
                label={isReturn ? 'Back to Return Summary' : 'Back to Void Summary'} 
              />
            </div>
          </div>
        </div>

      {error && <div className="report-error-banner">{error}</div>}

      <ReportStatsHeader 
        storeName={getStoreName()}
        fromDate={appliedFilters.fromDate}
        toDate={appliedFilters.toDate}
      />

      <div className="ds-kpi-row">
          <div className="ds-kpi-item">
            <CurvedCard
              title="STORE"
              value={getStoreName()}
              waveColor={['#7dd3fc', '#0284c7']}
              icon={<Store size={20} color="#ffffff" />}
            />
          </div>
          <div className="ds-kpi-item">
            <CurvedCard
              title={isReturn ? "RETURN QUANTITY" : "VOID QUANTITY"}
              value={totals.qty.toLocaleString('en-IN')}
              waveColor={['#f472b6', '#db2777']}
              icon={isReturn 
                ? <RotateCcw size={20} color="#ffffff" />
                : <Ban size={20} color="#ffffff" />
              }
            />
          </div>
          <div className="ds-kpi-item">
            <CurvedCard
              title="ENCODE QUANTITY"
              value={totals.encodeQty.toLocaleString('en-IN')}
              waveColor={['#86efac', '#22c55e']}
              icon={<CheckCircle size={20} color="#ffffff" />}
            />
          </div>
          <div className="ds-kpi-item">
            <CurvedCard
              title="DIFFERENCE QUANTITY"
              value={totals.differenceQty.toLocaleString('en-IN')}
              waveColor={['#fcd34d', '#ea580c']}
              icon={<MinusCircle size={20} color="#ffffff" />}
            />
        </div>
      </div>

      <div className="report-table-wrapper">
        <ReportDataTableCard
          title={isReturn ? "Return Reconciliation Data" : "Reconciliation Data"}
          columns={columns}
          data={reportData}
          totalRecords={totalRecords}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageChange={setPageIndex}
          onPageSizeChange={setPageSize}
          isLoading={isLoading}
          onSortChange={(col, dir) => {
            setSortColumn(col);
            setSortDirection(dir);
            setPageIndex(1);
          }}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          reportName={isReturn ? "RETURN_RECONCILIATION_SUMMARY" : "VOID_RECONCILIATION_SUMMARY"}
          exportFilters={exportFilters}
          exportFileName={exportFileName}
        />
      </div>

      {selectedModalRow && (
        <ReconciliationDetailsModal
          type={type}
          modalData={{
            ...selectedModalRow,
            selectedStore: appliedFilters.storeCode,
            fromDate: appliedFilters.fromDate,
            toDate: appliedFilters.toDate,
            mode: appliedFilters.mode,
            pos: selectedModalRow.COUNTER_NO || selectedModalRow.pos || appliedFilters.pos,
            ean: selectedModalRow.EAN || appliedFilters.ean
          }}
          onClose={() => setSelectedModalRow(null)}
        />
      )}
    </AppLayout>
  );
}
