import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, RotateCcw, Tag, Package, FileText, FileSpreadsheet } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import CustomDatePicker from '../../components/common/CustomDatePicker';
import CurvedCard from '../../components/common/CurvedCard';
import { getReportStores, getStoreSaleReport } from '../../services/stockService';
import './StoreSaleReport.css';

const DEFAULT_STORES = [
  { value: 'HD44', text: 'HD44 - Uttam Nagar 2' },
  { value: 'HD55', text: 'HD55 - Paschim Vihar' },
  { value: 'HH15', text: 'HH15 - Rohini' }
];

export default function StoreSaleReportPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to format Date to YYYY-MM-DD without UTC shifts
  const formatDate = (date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  // Extract initial parameters from dashboard or previous navigation
  const state = location.state || {};
  const initialStore = state.store || 'HD44';

  const defaultToDate = state.toDate || formatDate(new Date());
  const defaultFromDate = state.fromDate || (() => {
    const [y, m, d] = defaultToDate.split('-').map(Number);
    const base = new Date(y, m - 1, d);
    base.setDate(base.getDate() - 7);
    return formatDate(base);
  })();

  // Filter States
  const [selectedStore, setSelectedStore] = useState(initialStore);
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [storeOptions, setStoreOptions] = useState([]);

  // Data States
  const [tableData, setTableData] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination States
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Card Gradient Wave Colors (Matching Reference Image)
  const cardGradients = useMemo(() => [
    ['#86efac', '#22c55e'], // Green: SALE QTY
    ['#7dd3fc', '#0284c7'], // Blue/Cyan: RFID CHECKOUT QTY
    ['#f472b6', '#db2777'], // Pink: TAFFETA SALE QTY
    ['#fcd34d', '#ea580c']  // Orange: MANUAL SALE QTY
  ], []);

  // 1. Fetch Store Dropdown Options
  useEffect(() => {
    const controller = new AbortController();
    const fetchStores = async () => {
      try {
        const data = await getReportStores(controller.signal);
        if (Array.isArray(data) && data.length > 0) {
          setStoreOptions(data.map(item => ({
            value: item.id || item.STORE_CODE || item.storeCode || item.code || item.text,
            text: item.text || item.STORE_NAME || item.storeName || item.name || `${item.id}`
          })));
        } else {
          setStoreOptions(DEFAULT_STORES);
        }
      } catch (err) {
        if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
          console.error("Failed to fetch stores", err);
        }
        setStoreOptions(DEFAULT_STORES);
      }
    };
    fetchStores();
    return () => controller.abort();
  }, []);

  const fetchControllerRef = useRef(null);

  // 2. Fetch Store Sale Report Data
  const fetchReport = useCallback(async (pIndex, pSize) => {
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }
    const controller = new AbortController();
    fetchControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    try {
      const result = await getStoreSaleReport({
        storeCode: selectedStore,
        fromDate,
        toDate,
        pageIndex: pIndex,
        pageSize: pSize
      }, controller.signal);

      if (controller.signal.aborted) return;

      if (result) {
        setTableData(result.items || []);
        const recCount = result.summary?.recordCount ?? result.items?.length ?? 0;
        setTotalRecords(recCount);
        setReportSummary(result.summary || null);
      } else {
        setTableData([]);
        setTotalRecords(0);
        setReportSummary(null);
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'CanceledError') return;
      console.error("Failed to fetch store sale report", err);
      setError("Failed to load store sale data. Please check your connection.");
      setTableData([]);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [selectedStore, fromDate, toDate]);

  // Initial and reactive fetch
  useEffect(() => {
    fetchReport(pageIndex, pageSize);
    return () => {
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }
    };
  }, [fetchReport, pageIndex, pageSize]);

  // Handle Search button
  const handleSearch = () => {
    if (pageIndex === 1) {
      fetchReport(1, pageSize);
    } else {
      setPageIndex(1);
    }
  };

  // Handle Clear / Reset
  const handleClear = () => {
    const today = new Date();
    const tDate = formatDate(today);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const fDate = formatDate(lastWeek);

    setFromDate(fDate);
    setToDate(tDate);
    if (pageIndex === 1) {
      fetchReport(1, pageSize);
    } else {
      setPageIndex(1);
    }
  };

  // Get Store Display Name for info banner
  const getSelectedStoreName = () => {
    const found = storeOptions.find(s => s.value === selectedStore);
    if (found) return found.text;
    if (tableData[0]?.STORE_NAME) return tableData[0].STORE_NAME;
    return selectedStore ? `${selectedStore} - Uttam Nagar 2` : 'All Stores';
  };

  // Drill down to Tier 2: Item-Level Detailed Sales Report (/reports/sale)
  const handleDrillDown = (row, columnName) => {
    const rowDate = row?.DATE ? String(row.DATE).split('T')[0] : fromDate;
    navigate('/reports/sale', {
      state: {
        store: selectedStore,
        fromDate: rowDate,
        toDate: rowDate,
        columnName
      }
    });
  };

  // Columns definition for ReportDataTableCard
  const tableColumns = useMemo(() => [
    { 
      key: 'RowNumber', 
      label: 'SR.NO', 
      sortable: true,
      render: (val, row, idx) => val || ((pageIndex - 1) * pageSize + idx + 1)
    },
    { 
      key: 'DATE', 
      label: 'DATE', 
      sortable: true,
      render: (val) => val ? String(val).split('T')[0] : '—'
    },
    { 
      key: 'TOTAL_DPOS_SALE', 
      label: 'TOTAL SALE QTY', 
      sortable: true,
      render: (val, row) => (
        <span 
          className="store-sale-link"
          onClick={() => handleDrillDown(row, 'TOTAL_DPOS_SALE')}
          title="Click to view POS Sale item details"
        >
          {Number(val || 0).toLocaleString('en-IN')}
        </span>
      )
    },
    { 
      key: 'TOTAL_RFID_CHECKOUT', 
      label: 'TOTAL RFID CHECKOUT QTY', 
      sortable: true,
      render: (val, row) => (
        <span 
          className="store-sale-link"
          onClick={() => handleDrillDown(row, 'TOTAL_RFID_CHECKOUT')}
          title="Click to view RFID Checkout item details"
        >
          {Number(val || 0).toLocaleString('en-IN')}
        </span>
      )
    },
    { 
      key: 'TOTAL_TAFFETA_SALE', 
      label: 'TOTAL TAFFETA SALE QTY', 
      sortable: true,
      render: (val) => Number(val || 0).toLocaleString('en-IN')
    },
    { 
      key: 'TOTAL_MANUAL_SALE', 
      label: 'TOTAL MANUAL SALE QTY', 
      sortable: true,
      render: (val, row) => (
        <span 
          className="store-sale-link"
          onClick={() => handleDrillDown(row, 'TOTAL_MANUAL_SALE')}
          title="Click to view Manual Sale item details"
        >
          {Number(val || 0).toLocaleString('en-IN')}
        </span>
      )
    }
  ], [selectedStore, fromDate, pageIndex, pageSize]);

  return (
    <AppLayout 
      headerProps={{
        breadcrumb: <>HOME - PAGES - DASHBOARD - <span className="active">STORE SALE REPORT</span></>,
        showBackButton: true,
        onBackClick: () => navigate('/dashboard')
      }}
    >
      <main className="vmm-dashboard-body">
        
        {/* Filter Card */}
        <div className="report-search-card">
          <div className="report-search-header">
            <span>NOTE : FIELDS MARKED WITH (*) ARE REQUIRED</span>
          </div>
          <div className="report-search-body report-search-body-grid">
            <div className="search-field">
              <label>Store Code *</label>
              <SearchableDropdown
                value={selectedStore}
                onChange={(val) => {
                  setSelectedStore(val);
                  setPageIndex(1);
                }}
                options={storeOptions}
                placeholder="Select Store Code"
                labelKey="text"
                valueKey="value"
              />
            </div>

            <div className="search-field">
              <label>From Date</label>
              <CustomDatePicker
                value={fromDate}
                onChange={(dateStr) => {
                  setFromDate(dateStr);
                  setPageIndex(1);
                }}
                placeholder="From Date"
              />
            </div>

            <div className="search-field">
              <label>To Date</label>
              <CustomDatePicker
                value={toDate}
                onChange={(dateStr) => {
                  setToDate(dateStr);
                  setPageIndex(1);
                }}
                placeholder="To Date"
              />
            </div>

            <div className="store-sale-search-actions">
              <button 
                type="button" 
                className="store-sale-btn-search"
                onClick={handleSearch}
              >
                <Search size={15} /> Search
              </button>
              <button 
                type="button" 
                className="store-sale-btn-clear"
                onClick={handleClear}
              >
                <RotateCcw size={15} /> Clear
              </button>
            </div>
          </div>
        </div>

        {/* Selected Store & Date Info Bar (Image 2) */}
        <div className="report-selected-info-bar">
          <div>
            SELECTED STORE : {getSelectedStoreName()}
          </div>
          <div>
            FROM DATE : {fromDate} | TO DATE : {toDate}
          </div>
        </div>

        {/* 4 KPI Curved Cards (Image 2) */}
        <div className="store-sale-cards">
          <CurvedCard 
            title="SALE QTY" 
            value={(reportSummary?.posSaleQty || 0).toLocaleString('en-IN')} 
            waveColor={cardGradients[0]}
            icon={<Tag size={20} color="#ffffff" />}
          />

          <CurvedCard 
            title="RFID CHECKOUT QTY" 
            value={(reportSummary?.rfidCheckoutQty || 0).toLocaleString('en-IN')} 
            waveColor={cardGradients[1]}
            icon={<Package size={20} color="#ffffff" />}
          />

          <CurvedCard 
            title="TAFFETA SALE QTY" 
            value={(reportSummary?.taffetaSaleQty || 0).toLocaleString('en-IN')} 
            waveColor={cardGradients[2]}
            icon={<FileText size={20} color="#ffffff" />}
          />

          <CurvedCard 
            title="MANUAL SALE QTY" 
            value={(reportSummary?.manualSaleQty || 0).toLocaleString('en-IN')} 
            waveColor={cardGradients[3]}
            icon={<FileSpreadsheet size={20} color="#ffffff" />}
          />
        </div>

        {/* Data Table Card */}
        <div className="report-table-wrapper">
          <ReportDataTableCard
            columns={tableColumns}
            data={tableData}
            isLoading={isLoading}
            skeletonRowsCount={7}
            totalRecords={totalRecords}
            pageIndex={pageIndex}
            pageSize={pageSize}
            exportFileName={`Store_Sale_Report_${selectedStore}_${fromDate}_to_${toDate}.csv`}
            onPageChange={(newPg) => setPageIndex(newPg)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPageIndex(1);
            }}
          />
        </div>

      </main>
    </AppLayout>
  );
}
