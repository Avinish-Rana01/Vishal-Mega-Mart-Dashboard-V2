import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import AppLayout from '../layout/AppLayout';
import ReportDataTableCard from './ReportDataTableCard';
import SearchableDropdown from './SearchableDropdown';
import CustomDatePicker from './CustomDatePicker';
import CurvedCard from './CurvedCard';
import '../../pages/Report/LiveStockReport.css'; // Standard report styles
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

export default function ReconciliationReportView({ type = 'return' }) {
  const isReturn = type === 'return';
  const location = useLocation();
  const { storeCode: initialStore, date: initialDate } = location.state || {};

  const defaultDate = initialDate || (isReturn ? '2026-08-01' : '2026-07-21');
  const [selectedStore, setSelectedStore] = useState(initialStore || '');
  const [fromDate, setFromDate] = useState(defaultDate);
  const [toDate, setToDate] = useState(defaultDate);
  const [pos, setPos] = useState('');
  const [ean, setEan] = useState('');
  const [storeOptions, setStoreOptions] = useState([]);
  
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

  // Fetch EAN Options based on search term (debounced)
  useEffect(() => {
    const controller = new AbortController();
    const delayDebounceFn = setTimeout(async () => {
      setIsEanSearching(true);
      try {
        const fetchApi = isReturn ? getReturnSearchEAN : getVoidSearchEAN;
        const data = await fetchApi(selectedStore, fromDate, toDate, eanSearchTerm, pos, controller.signal);
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
      const result = await fetchApi(selectedStore, fromDate, toDate, pos, ean, pageIndex, pageSize, sortColumn, sortDirection, signal);
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
  }, [isReturn, pageIndex, pageSize, selectedStore, fromDate, toDate, pos, ean, sortColumn, sortDirection]);

  const handleClear = () => {
    setSelectedStore(initialStore || '');
    setFromDate(defaultDate);
    setToDate(defaultDate);
    setPos('');
    setEan('');
    setEanSearchTerm('');
    setSortColumn(isReturn ? 'BILL_DATE' : 'DATE');
    setSortDirection('asc');
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
      render: (val, row) => (
        <span 
          onClick={() => setSelectedModalRow(row)}
          style={{ color: '#16a34a', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', cursor: 'pointer', width: '100%' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          View Details
        </span>
      )
    }
  ];

  const getStoreName = () => {
    if (!selectedStore) return 'ALL STORES';
    const storeObj = storeOptions.find(s => s.id === selectedStore || s.text?.startsWith(selectedStore));
    if (storeObj) return storeObj.text;
    return selectedStore;
  };

  return (
    <AppLayout 
      headerProps={{
        breadcrumb: <>HOME - PAGES - REPORT - <span className="active">{isReturn ? 'RETURN RECONCILIATION REPORT' : 'VOID RECONCILIATION REPORT'}</span></>,
        showBackButton: true,
        onBackClick: () => window.history.back()
      }}
    >
      <div className="report-search-card">
        <div className="report-search-header">
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
              <label>From Date *</label>
              <CustomDatePicker value={fromDate} onChange={setFromDate} />
            </div>

            <div className="search-field">
              <label>To Date</label>
              <CustomDatePicker value={toDate} onChange={setToDate} />
            </div>

            <div className="search-field">
              <label>POS Counter</label>
              <SearchableDropdown
                options={posOptions}
                value={pos}
                onChange={setPos}
                placeholder="Select POS Counter"
                valueKey="id"
              />
            </div>

            <div className="search-field">
              <label>EAN</label>
              <SearchableDropdown
                options={eanOptions}
                value={ean}
                onChange={setEan}
                placeholder="Select EAN"
                searchPlaceholder="Search EAN"
                isAsync={true}
                onSearchChange={setEanSearchTerm}
                isLoading={isEanSearching}
                valueKey="id"
                closeOnSelect={false}
              />
            </div>

            <div className="search-buttons" style={{ alignSelf: 'flex-end', display: 'flex', gap: '10px' }}>
              <button className="btn-clear" onClick={handleClear} disabled={isLoading} style={{ height: '38px', padding: '0 24px', backgroundColor: '#ef4444', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '12px' }}>
                Clear
              </button>
              <button onClick={() => navigate(-1)} style={{ height: '38px', padding: '0 24px', backgroundColor: '#9ca3af', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '12px' }}>
                {isReturn ? 'Back to Return Summary' : 'Back to Void Summary'}
              </button>
            </div>
          </div>
        </div>

      {error && <div className="ds-error" style={{ margin: '0 15px' }}>{error}</div>}

      <div className="report-selected-info-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          SELECTED STORE : {getStoreName()}
        </div>
        <div>
          FROM DATE : {fromDate} | TO DATE : {toDate}
        </div>
      </div>

      <div className="ds-kpi-row" style={{ margin: '0 12px 20px 15px', gap: '20px', display: 'flex', flexDirection: 'row' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <CurvedCard
              title="STORE"
              value={getStoreName()}
              waveColor={['#ecfccb', '#d9f99d']} // Lime/Yellowish
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4d7c0f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              }
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <CurvedCard
              title={isReturn ? "RETURN QUANTITY" : "VOID QUANTITY"}
              value={totals.qty.toLocaleString('en-IN')}
              waveColor={['#fbcfe8', '#f9a8d4']} // Pinkish
              icon={isReturn 
                ? <RotateCcw size={18} color="#be185d" />
                : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#be185d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
              }
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <CurvedCard
              title="ENCODE QUANTITY"
              value={totals.encodeQty.toLocaleString('en-IN')}
              waveColor={['#bae6fd', '#93c5fd']} // Blueish
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="8" y2="16"></line><line x1="12" y1="8" x2="12" y2="16"></line><line x1="16" y1="10" x2="16" y2="16"></line></svg>
              }
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <CurvedCard
              title="DIFFERENCE QUANTITY"
              value={totals.differenceQty.toLocaleString('en-IN')}
              waveColor={['#ccfbf1', '#99f6e4']} // Teal
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
              }
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
        />
      </div>

      {selectedModalRow && (
        <ReconciliationDetailsModal
          type={type}
          modalData={{
            ...selectedModalRow,
            selectedStore,
            fromDate,
            toDate,
            pos: selectedModalRow.COUNTER_NO || selectedModalRow.pos || pos,
            ean: selectedModalRow.EAN || ean
          }}
          onClose={() => setSelectedModalRow(null)}
        />
      )}
    </AppLayout>
  );
}
