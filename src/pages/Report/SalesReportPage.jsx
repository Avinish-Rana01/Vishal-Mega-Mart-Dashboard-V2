import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, RotateCcw, ShoppingBag, BarChart2, Hash, Layers } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import CustomDatePicker from '../../components/common/CustomDatePicker';
import CurvedCard from '../../components/common/CurvedCard';
import { 
  getReportStores, 
  getSaleData, 
  getSalePosCounters, 
  searchSaleArticles, 
  searchSaleEans 
} from '../../services/stockService';
import './SalesReport.css';

const COLUMN_TYPES = [
  { value: 'TOTAL_DPOS_SALE', label: 'Total POS Sale' },
  { value: 'TOTAL_RFID_CHECKOUT', label: 'Total RFID Checkout' },
  { value: 'TOTAL_MANUAL_SALE', label: 'Total Manual Sale' }
];

export default function SalesReportPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to extract clean YYYY-MM-DD
  const formatDateStr = (dateVal) => {
    if (!dateVal) {
      const now = new Date();
      return now.toISOString().split('T')[0];
    }
    return String(dateVal).split(' ')[0].split('T')[0];
  };

  // Read passed state from Dashboard navigation
  const state = location.state || {};
  const initialStore = state.store || 'HD44';
  const initialFromDate = formatDateStr(state.fromDate);
  const initialToDate = formatDateStr(state.toDate);
  const initialColumnName = state.columnName || 'TOTAL_DPOS_SALE';

  // Filters State
  const [selectedStore, setSelectedStore] = useState(initialStore);
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);
  const [columnName, setColumnName] = useState(initialColumnName);
  const [selectedPos, setSelectedPos] = useState('');
  const [selectedArticle, setSelectedArticle] = useState('');
  const [selectedEan, setSelectedEan] = useState('');

  // Dropdown Options
  const [storeOptions, setStoreOptions] = useState([]);
  const [posOptions, setPosOptions] = useState([]);
  const [articleOptions, setArticleOptions] = useState([]);
  const [eanOptions, setEanOptions] = useState([]);

  // Data & Pagination State
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState({ recordCount: 0, qty: 0 });
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Gradient presets for CurvedCard
  const [cardGradients] = useState([
    ['hsl(220, 80%, 75%)', 'hsl(250, 85%, 55%)'],
    ['hsl(160, 80%, 70%)', 'hsl(190, 85%, 50%)'],
    ['hsl(280, 80%, 75%)', 'hsl(310, 85%, 55%)'],
    ['hsl(35, 90%, 70%)', 'hsl(15, 90%, 55%)']
  ]);

  // Sync state if location.state changes
  useEffect(() => {
    if (location.state) {
      if (location.state.store) setSelectedStore(location.state.store);
      if (location.state.fromDate) setFromDate(formatDateStr(location.state.fromDate));
      if (location.state.toDate) setToDate(formatDateStr(location.state.toDate));
      if (location.state.columnName) setColumnName(location.state.columnName);
    }
  }, [location.state]);

  const DEFAULT_STORES = useMemo(() => [
    { value: 'HD44', text: 'HD44 - UTTAMNAGAR-2' },
    { value: 'HD55', text: 'HD55 - DWARKA PALAM EXTN' },
    { value: 'HH15', text: 'HH15 - DUNDEHERA' }
  ], []);

  // 1. Fetch Store List once
  useEffect(() => {
    const controller = new AbortController();
    const fetchStores = async () => {
      try {
        const data = await getReportStores(controller.signal);
        if (Array.isArray(data) && data.length > 0) {
          setStoreOptions(data.map(s => {
            const code = s.STORE_CODE || s.store_Code || s.value || s.id || s.STORE;
            const name = s.STORE_NAME || s.store_Name || s.text || '';
            return {
              value: code,
              text: name ? `${code} - ${name}` : code
            };
          }));
        } else {
          setStoreOptions(DEFAULT_STORES);
        }
      } catch (err) {
        if (err.name !== 'AbortError' && err.name !== 'CanceledError') console.error("Failed to load stores", err);
        setStoreOptions(DEFAULT_STORES);
      }
    };
    fetchStores();
    return () => controller.abort();
  }, [DEFAULT_STORES]);

  // 2. Fetch POS Counters when store, date, or column changes
  useEffect(() => {
    const controller = new AbortController();
    const fetchCounters = async () => {
      try {
        const data = await getSalePosCounters({
          columnName,
          store: selectedStore,
          fromDate,
          toDate
        }, controller.signal);
        if (Array.isArray(data)) {
          setPosOptions(data.map(item => ({
            value: item.id || item.text,
            text: item.text || item.id
          })));
        } else {
          setPosOptions([]);
        }
      } catch (err) {
        if (err.name !== 'AbortError' && err.name !== 'CanceledError') console.error("Failed to load POS counters", err);
      }
    };
    if (selectedStore && fromDate) {
      fetchCounters();
    }
    return () => controller.abort();
  }, [selectedStore, fromDate, toDate, columnName]);

  // 3. Search Articles
  const handleArticleSearch = useCallback(async (term) => {
    try {
      const data = await searchSaleArticles({
        columnName,
        store: selectedStore,
        pos: selectedPos,
        fromDate,
        toDate,
        searchTerm: term
      });
      if (Array.isArray(data)) {
        setArticleOptions(data.map(item => ({ value: item.id || item.text, text: item.text || item.id })));
      }
    } catch (err) {
      console.error("Failed to search articles", err);
    }
  }, [columnName, selectedStore, selectedPos, fromDate, toDate]);

  // 4. Search EANs
  const handleEanSearch = useCallback(async (term) => {
    try {
      const data = await searchSaleEans({
        columnName,
        store: selectedStore,
        pos: selectedPos,
        fromDate,
        toDate,
        material: selectedArticle,
        searchTerm: term
      });
      if (Array.isArray(data)) {
        setEanOptions(data.map(item => ({ value: item.id || item.text, text: item.text || item.id })));
      }
    } catch (err) {
      console.error("Failed to search EANs", err);
    }
  }, [columnName, selectedStore, selectedPos, fromDate, toDate, selectedArticle]);

  // 5. Fetch Table Data & Summary
  const fetchData = useCallback(async (pIndex = pageIndex, pSize = pageSize) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getSaleData({
        columnName,
        store: selectedStore,
        storeCode: selectedStore,
        storeName: selectedStore,
        fromDate,
        toDate,
        pos: selectedPos,
        articleNo: selectedArticle,
        ean: selectedEan,
        pageIndex: pIndex,
        pageSize: pSize
      });

      if (result) {
        setTableData(result.items || []);
        const recCount = result.summary?.recordCount || result.items?.length || 0;
        setTotalRecords(recCount);
        setSummaryData({
          recordCount: recCount,
          qty: result.summary?.qty || 0
        });
      } else {
        setTableData([]);
        setTotalRecords(0);
        setSummaryData({ recordCount: 0, qty: 0 });
      }
    } catch (err) {
      console.error("Failed to load sale report data", err);
      setError("Failed to fetch report data. Please verify your connection.");
      setTableData([]);
    } finally {
      setIsLoading(false);
    }
  }, [columnName, selectedStore, fromDate, toDate, selectedPos, selectedArticle, selectedEan, pageIndex, pageSize]);

  // Initial fetch
  useEffect(() => {
    fetchData(pageIndex, pageSize);
  }, [fetchData, pageIndex, pageSize]);

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedPos('');
    setSelectedArticle('');
    setSelectedEan('');
    setPageIndex(1);
    fetchData(1, pageSize);
  };

  // Get dynamic report title badge
  const activeColumnLabel = useMemo(() => {
    const matched = COLUMN_TYPES.find(c => c.value === columnName);
    return matched ? matched.label : 'Sale Report';
  }, [columnName]);

  // Columns definition for ReportDataTableCard
  const tableColumns = useMemo(() => [
    { key: 'RowNumber', label: 'SR.NO', sortable: true },
    { 
      key: 'BILL_DATE', 
      label: 'SALE DATE', 
      sortable: true,
      render: (val, row) => {
        const d = val || row?.CHECKOUT_DATE || row?.checkout_date || row?.bill_date;
        return d ? String(d).split('T')[0] : '—';
      }
    },
    { key: 'STORE_CODE', label: 'STORE CODE', sortable: true },
    { key: 'POS_TYPE', label: 'POS TYPE', sortable: true },
    { key: 'COUNTER_NO', label: 'POS COUNTER', sortable: true },
    { key: 'MAKER_ID', label: 'CASHIER ID', sortable: true },
    { key: 'ITEM_CD', label: 'ARTICLE NO', sortable: true },
    { key: 'EAN', label: 'EAN', sortable: true },
    { 
      key: 'SALE_QTY', 
      label: 'SALE QTY', 
      sortable: true,
      render: (val) => Number(val || 0).toLocaleString('en-IN')
    }
  ], []);

  return (
    <AppLayout
      headerProps={{
        breadcrumb: <>HOME - PAGES - DASHBOARD - <span className="active">SALES REPORT</span></>,
        showBackButton: true,
        onBackClick: () => navigate(-1)
      }}
    >
      <div className="sales-report-container">
        {/* Filter Card */}
        <div className="sales-filter-card">
          <div className="sales-filter-header">
            NOTE : FIELDS MARKED WITH (*) ARE REQUIRED
          </div>

          <div className="sales-filter-body">
            {/* Store Selection */}
            <div className="sales-filter-field">
              <label>Store <span>*</span></label>
              <SearchableDropdown
                value={selectedStore}
                onChange={(val) => setSelectedStore(val)}
                options={storeOptions}
                placeholder="Select Store"
                labelKey="text"
                valueKey="value"
              />
            </div>

            {/* From Date */}
            <div className="sales-filter-field">
              <label>From Date <span>*</span></label>
              <CustomDatePicker
                value={fromDate}
                onChange={(dateStr) => setFromDate(dateStr)}
                placeholder="From Date"
              />
            </div>

            {/* To Date */}
            <div className="sales-filter-field">
              <label>To Date <span>*</span></label>
              <CustomDatePicker
                value={toDate}
                onChange={(dateStr) => setToDate(dateStr)}
                placeholder="To Date"
              />
            </div>

            {/* POS Counter */}
            <div className="sales-filter-field">
              <label>POS Counter</label>
              <SearchableDropdown
                value={selectedPos}
                onChange={(val) => setSelectedPos(val)}
                options={posOptions}
                placeholder="All Counters"
                labelKey="text"
                valueKey="value"
              />
            </div>

            {/* Article No (Async search) */}
            <div className="sales-filter-field">
              <label>Article No</label>
              <SearchableDropdown
                value={selectedArticle}
                onChange={(val) => setSelectedArticle(val)}
                options={articleOptions}
                placeholder="Search Article..."
                isAsync={true}
                onSearchChange={handleArticleSearch}
                labelKey="text"
                valueKey="value"
              />
            </div>

            {/* EAN (Async search) */}
            <div className="sales-filter-field">
              <label>EAN</label>
              <SearchableDropdown
                value={selectedEan}
                onChange={(val) => setSelectedEan(val)}
                options={eanOptions}
                placeholder="Search EAN..."
                isAsync={true}
                onSearchChange={handleEanSearch}
                labelKey="text"
                valueKey="value"
              />
            </div>

            {/* Action Buttons */}
            <div className="sales-actions-wrapper">
              <button 
                type="button" 
                className="sales-btn-search"
                onClick={() => {
                  setPageIndex(1);
                  fetchData(1, pageSize);
                }}
              >
                <Search size={15} /> Search
              </button>

              <button 
                type="button" 
                className="sales-btn-reset"
                onClick={handleResetFilters}
              >
                <RotateCcw size={15} /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: KPI Summary Cards */}
        <div className="sales-kpi-container">
          <CurvedCard
            title="ASSIGNED STORE"
            value={selectedStore || '—'}
            waveColor={cardGradients[0]}
            icon={<ShoppingBag size={20} color="#ffffff" />}
            animate={false}
          />

          <CurvedCard
            title="TOTAL ARTICLES / ROWS"
            value={(summaryData.recordCount || 0).toLocaleString('en-IN')}
            waveColor={cardGradients[1]}
            icon={<Hash size={20} color="#ffffff" />}
          />

          <CurvedCard
            title="TOTAL SALE QUANTITY"
            value={(summaryData.qty || 0).toLocaleString('en-IN')}
            waveColor={cardGradients[2]}
            icon={<BarChart2 size={20} color="#ffffff" />}
          />

          <CurvedCard
            title="POS COUNTERS DETECTED"
            value={posOptions.length ? String(posOptions.length) : '0'}
            waveColor={cardGradients[3]}
            icon={<Layers size={20} color="#ffffff" />}
          />
        </div>

        {/* Row 3: Data Table Card */}
        <div className="sales-table-wrapper">
          <ReportDataTableCard
            columns={tableColumns}
            data={tableData}
            isLoading={isLoading}
            skeletonRowsCount={10}
            totalRecords={totalRecords}
            pageIndex={pageIndex}
            pageSize={pageSize}
            exportFileName={`Sale_Report_${selectedStore || 'All'}_${fromDate || 'Date'}.csv`}
            onPageChange={(newPg) => {
              setPageIndex(newPg);
              fetchData(newPg, pageSize);
            }}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPageIndex(1);
              fetchData(1, newSize);
            }}
          />
        </div>

      </div>
    </AppLayout>
  );
}
