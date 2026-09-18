import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import CustomDatePicker from '../../components/common/CustomDatePicker';
import CurvedCard from '../../components/common/CurvedCard';
import './LiveStockReport.css'; // Import standard report styles
import { getVoidReconciliationData, getBindStores, getVoidPosCounters, getVoidSearchEAN } from '../../services/stockService';
import { dateRenderer, numRenderer } from '../../utils/dashboardColumns';
import { useNavigate } from 'react-router-dom';

export default function VoidReconciliationReportPage() {
  const location = useLocation();
  const { storeCode: initialStore, date: initialDate } = location.state || {};

  const defaultDate = initialDate || '2026-07-21';
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
  
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortColumn, setSortColumn] = useState('DATE');
  const [sortDirection, setSortDirection] = useState('asc');

  // Totals
  const [totals, setTotals] = useState({
    voidQty: 0,
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
        const data = await getVoidPosCounters(selectedStore, fromDate, toDate, controller.signal);
        setPosOptions(Array.isArray(data) ? data : (data?.posCounters || []));
      } catch (err) {
        if (err.name !== 'AbortError') console.error("Failed to fetch POS counters", err);
      }
    };
    fetchPos();
    return () => controller.abort();
  }, [selectedStore, fromDate, toDate]);

  // Fetch EAN Options based on search term (debounced)
  useEffect(() => {
    const controller = new AbortController();
    const delayDebounceFn = setTimeout(async () => {
      setIsEanSearching(true);
      try {
        const data = await getVoidSearchEAN(selectedStore, fromDate, toDate, eanSearchTerm, pos, controller.signal);
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
  }, [eanSearchTerm, selectedStore, fromDate, toDate, pos]);

  // Fetch Report Data
  const fetchReportData = async (signal) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getVoidReconciliationData(selectedStore, fromDate, toDate, pos, ean, pageIndex, pageSize, sortColumn || 'DATE', sortDirection || 'asc', signal);
      setReportData(result?.data || result?.Data || []);
      setTotalRecords(result?.recordCount || result?.RecordCount || 0);
      setTotals({
        voidQty: result?.voidQty || result?.VoidQty || 0,
        encodeQty: result?.encodeQty || result?.EncodeQty || 0,
        differenceQty: result?.differenceQty || result?.DifferenceQty || 0
      });
    } catch (err) {
      if (err.name !== 'AbortError' && err.message !== 'canceled' && err.code !== 'ERR_CANCELED') {
        setError(err.message || 'Failed to fetch report data.');
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
  }, [pageIndex, pageSize, selectedStore, fromDate, toDate, pos, ean, sortColumn, sortDirection]);

  const handleClear = () => {
    setSelectedStore(initialStore || '');
    setFromDate(defaultDate);
    setToDate(defaultDate);
    setPos('');
    setEan('');
    setEanSearchTerm('');
    setSortColumn('DATE');
    setSortDirection('asc');
    setPageIndex(1);
  };

  const columns = [
    { key: 'SR_NO', label: 'SR.NO', render: (val, row, idx) => ((pageIndex - 1) * pageSize) + idx + 1 },
    { key: 'VOID_DATE', label: 'VOID DATE', render: dateRenderer },
    { key: 'STORE_CODE', label: 'STORE CODE' },
    { key: 'COUNTER_NO', label: 'POS COUNTER' },
    { key: 'VOID_QTY', label: 'VOID QUANTITY', render: (val) => typeof val === 'number' ? val.toLocaleString('en-IN') : val },
    { key: 'ENCODE_QTY', label: 'ENCODE QUANTITY', render: (val) => typeof val === 'number' ? val.toLocaleString('en-IN') : val },
    { key: 'DIFFERENCE_QTY', label: 'DIFFERENCE QUANTITY', render: (val) => typeof val === 'number' ? val.toLocaleString('en-IN') : val },
    { key: 'STATUS', label: 'STATUS', render: (val) => (
        <span style={{ 
          display: 'inline-flex', justifyContent: 'center', alignItems: 'center', minWidth: '70px',
          background: val === 'PENDING' ? '#fef3c7' : '#dcfce7',
          color: val === 'PENDING' ? '#d97706' : '#16a34a',
          fontWeight: 700, borderRadius: '6px', padding: '2px 8px', fontSize: '12px' 
        }}>
          {val}
        </span>
      )
    },
    { key: 'ACTION', label: 'ACTION', render: () => (
        <span style={{ color: '#16a34a', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', cursor: 'pointer', width: '100%' }}>
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
        breadcrumb: <>HOME - PAGES - REPORT - <span className="active">VOID RECONCILIATION REPORT</span></>,
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
                Back to Void Summary
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
              title="VOID QUANTITY"
              value={totals.voidQty.toLocaleString('en-IN')}
              waveColor={['#fbcfe8', '#f9a8d4']} // Pinkish
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#be185d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
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
          title="Reconciliation Data"
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
    </AppLayout>
  );
}
