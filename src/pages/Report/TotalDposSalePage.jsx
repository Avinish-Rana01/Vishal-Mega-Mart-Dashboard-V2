import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, RotateCcw, ShoppingBag, BarChart2, Hash, Layers, FileText, Tag } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import CustomDatePicker from '../../components/common/CustomDatePicker';
import CurvedCard from '../../components/common/CurvedCard';
import ReportStatsHeader from '../../components/common/ReportStatsHeader';
import { ClearButton, BackButton } from '../../components/common/ReportActionButton';
import { 
  getReportStores, 
  getSaleData, 
  getSalePosCounters, 
  searchSaleArticles, 
  searchSaleEans 
} from '../../services/stockService';
import './SalesReport.css';
import './common-reports.css';

const COLUMN_TYPES = [
  { value: 'TOTAL_DPOS_SALE', label: 'Total POS Sale' },
  { value: 'TOTAL_RFID_CHECKOUT', label: 'Total RFID Checkout' },
  { value: 'TOTAL_MANUAL_SALE', label: 'Total Manual Sale' }
];

export default function TotalDposSalePage() {
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
  const [sortColumn, setSortColumn] = useState('ITEM_CD');
  const [sortDirection, setSortDirection] = useState('asc');

  // Vibrant gradient pairs matching Store Sale Report design
  const cardGradients = useMemo(() => [
    ['#7dd3fc', '#0284c7'], // Blue: STORE / ASSIGNED STORE
    ['#86efac', '#22c55e'], // Green: EAN COUNT / TOTAL ARTICLES
    ['#f472b6', '#db2777'], // Pink: SALE QTY
    ['#fcd34d', '#ea580c']  // Orange: POS COUNTERS
  ], []);

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

  // Table-derived options
  const tableArticleOptions = useMemo(() => {
    if (!tableData || tableData.length === 0) return [];
    const seen = new Set();
    const list = [];
    for (const row of tableData) {
      const art = row.ITEM_CD || row.item_cd || row.ARTICLE || row.article;
      if (art && !seen.has(String(art))) {
        seen.add(String(art));
        list.push({ value: String(art), id: String(art), text: String(art) });
      }
    }
    return list;
  }, [tableData]);

  const tableEanOptions = useMemo(() => {
    if (!tableData || tableData.length === 0) return [];
    const seen = new Set();
    const list = [];
    for (const row of tableData) {
      const eanVal = row.EAN || row.ean || row.BARCODE || row.barcode;
      if (eanVal && !seen.has(String(eanVal))) {
        seen.add(String(eanVal));
        list.push({ value: String(eanVal), id: String(eanVal), text: String(eanVal) });
      }
    }
    return list;
  }, [tableData]);

  const tablePosOptions = useMemo(() => {
    if (!tableData || tableData.length === 0) return [];
    const seen = new Set();
    const list = [];
    for (const row of tableData) {
      const posVal = row.COUNTER_NO || row.counter_no || row.POS || row.pos;
      if (posVal && !seen.has(String(posVal))) {
        seen.add(String(posVal));
        list.push({ value: String(posVal), id: String(posVal), text: String(posVal) });
      }
    }
    return list;
  }, [tableData]);

  const displayPosOptions = useMemo(() => {
    if (posOptions && posOptions.length > 0) return posOptions;
    return tablePosOptions;
  }, [posOptions, tablePosOptions]);

  const [articleSearchTerm, setArticleSearchTerm] = useState('');
  const [eanSearchTerm, setEanSearchTerm] = useState('');

  // Sync Article & EAN options with table data when not actively searching
  useEffect(() => {
    if (!articleSearchTerm.trim()) {
      setArticleOptions(tableArticleOptions);
    }
  }, [articleSearchTerm, tableArticleOptions]);

  useEffect(() => {
    if (!eanSearchTerm.trim()) {
      setEanOptions(tableEanOptions);
    }
  }, [eanSearchTerm, tableEanOptions]);

  // 3. Search Articles
  const handleArticleSearch = useCallback(async (term) => {
    setArticleSearchTerm(term || '');
    const trimmed = (term || '').trim();
    if (!trimmed) {
      setArticleOptions(tableArticleOptions);
      return;
    }
    try {
      const data = await searchSaleArticles({
        columnName,
        store: selectedStore,
        pos: selectedPos,
        fromDate,
        toDate,
        searchTerm: trimmed
      });
      if (Array.isArray(data)) {
        setArticleOptions(data.map(item => ({ value: item.id || item.text, text: item.text || item.id })));
      }
    } catch (err) {
      console.error("Failed to search articles", err);
    }
  }, [columnName, selectedStore, selectedPos, fromDate, toDate, tableArticleOptions]);

  // 4. Search EANs
  const handleEanSearch = useCallback(async (term) => {
    setEanSearchTerm(term || '');
    const trimmed = (term || '').trim();
    if (!trimmed) {
      setEanOptions(tableEanOptions);
      return;
    }
    try {
      const data = await searchSaleEans({
        columnName,
        store: selectedStore,
        pos: selectedPos,
        fromDate,
        toDate,
        material: selectedArticle,
        searchTerm: trimmed
      });
      if (Array.isArray(data)) {
        setEanOptions(data.map(item => ({ value: item.id || item.text, text: item.text || item.id })));
      }
    } catch (err) {
      console.error("Failed to search EANs", err);
    }
  }, [columnName, selectedStore, selectedPos, fromDate, toDate, selectedArticle, tableEanOptions]);

  const fetchControllerRef = useRef(null);

  // 5. Fetch Table Data & Summary
  const fetchData = useCallback(async (pIndex, pSize) => {
    // Abort previous in-flight request if still running
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }
    const controller = new AbortController();
    fetchControllerRef.current = controller;

    setIsLoading(true);
    setTableData([]);
    setError(null);
    try {
      const result = await getSaleData({
        columnName,
        store: selectedStore,
        storeCode: selectedStore,
        storeName: selectedStore,
        fromDate,
        toDate: toDate || fromDate,
        pos: selectedPos,
        articleNo: selectedArticle,
        ean: selectedEan,
        pageIndex: pIndex,
        pageSize: pSize,
        sortColumn,
        sortDirection
      }, controller.signal);

      if (controller.signal.aborted) return;

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
      if (err.name === 'AbortError' || err.name === 'CanceledError') return;
      console.error("Failed to load sale report data", err);
      setError("Failed to fetch report data. Please verify your connection.");
      setTableData([]);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [columnName, selectedStore, fromDate, toDate, selectedPos, selectedArticle, selectedEan, sortColumn, sortDirection]);

  // Single source of truth for pagination and initial fetch
  useEffect(() => {
    fetchData(pageIndex, pageSize);
    return () => {
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }
    };
  }, [fetchData, pageIndex, pageSize]);

  const handleResetFilters = () => {
    setSelectedPos('');
    setSelectedArticle('');
    setSelectedEan('');
    setSortColumn('ITEM_CD');
    setSortDirection('asc');
    if (pageIndex === 1) {
      fetchData(1, pageSize);
    } else {
      setPageIndex(1);
    }
  };

  const isRfidCheckout = columnName === 'TOTAL_RFID_CHECKOUT';
  const isManualSale = columnName === 'TOTAL_MANUAL_SALE';
  const isThreeCardMode = isRfidCheckout || isManualSale;

  const reportTitle = isRfidCheckout 
    ? 'TOTAL RFID CHECKOUT' 
    : isManualSale 
    ? 'TOTAL MANUAL SALE' 
    : 'TOTAL DPOS SALE';

  // Get dynamic report title badge
  const activeColumnLabel = useMemo(() => {
    if (isRfidCheckout) return 'TOTAL RFID CHECKOUT';
    if (isManualSale) return 'TOTAL MANUAL SALE';
    const matched = COLUMN_TYPES.find(c => c.value === columnName);
    return matched ? matched.label : 'Sale Report';
  }, [columnName, isRfidCheckout, isManualSale]);

  // Columns definition for ReportDataTableCard
  const tableColumns = useMemo(() => {
    if (isManualSale) {
      return [
        { key: 'RowNumber', label: 'SR.NO', sortable: true },
        { 
          key: 'CHECKOUT_DATE', 
          label: 'CHECKOUT DATE', 
          sortable: true,
          render: (val, row) => {
            const d = val || row?.BILL_DATE || row?.bill_date || row?.checkout_date;
            return d ? String(d).split('T')[0] : 'â€”';
          }
        },
        { key: 'STORE_CODE', label: 'STORE CODE', sortable: true },
        { key: 'POS_TYPE', label: 'POS TYPE', sortable: true },
        { key: 'COUNTER_NO', label: 'POS COUNTER', sortable: true },
        { key: 'ITEM_CD', label: 'ARTICLE NO', sortable: true },
        { key: 'EAN', label: 'EAN', sortable: true },
        { 
          key: 'CHECKOUT_TAGS', 
          label: 'CHECKOUT TAGS', 
          sortable: true,
          render: (val) => Number(val || 0).toLocaleString('en-IN')
        }
      ];
    }

    if (isRfidCheckout) {
      return [
        { key: 'RowNumber', label: 'SR.NO', sortable: true },
        { 
          key: 'CHECKOUT_DATE', 
          label: 'CHECKOUT DATE', 
          sortable: true,
          render: (val, row) => {
            const d = val || row?.BILL_DATE || row?.bill_date;
            return d ? String(d).split('T')[0] : 'â€”';
          }
        },
        { key: 'STORE_CODE', label: 'STORE CODE', sortable: true },
        { key: 'ITEM_CD', label: 'ARTICLE NO', sortable: true },
        { key: 'ARTICLE_DESC', label: 'ARTICLE DESCRIPTION', sortable: true },
        { key: 'EAN', label: 'EAN', sortable: true },
        { 
          key: 'CHECKOUT_TAGS', 
          label: 'CHECKOUT TAGS', 
          sortable: true,
          render: (val) => Number(val || 0).toLocaleString('en-IN')
        }
      ];
    }

    return [
      { key: 'RowNumber', label: 'SR.NO', sortable: true },
      { 
        key: 'BILL_DATE', 
        label: 'SALE DATE', 
        sortable: true,
        render: (val, row) => {
          const d = val || row?.CHECKOUT_DATE || row?.checkout_date || row?.bill_date;
          return d ? String(d).split('T')[0] : 'â€”';
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
    ];
  }, [isRfidCheckout, isManualSale]);

  const exportReportName = useMemo(() => {
    if (columnName === 'TOTAL_RFID_CHECKOUT') return 'RFID_CHECKOUT_SALE_DATA';
    if (columnName === 'TOTAL_MANUAL_SALE') return 'MANUAL_SALE_DATA';
    return 'TOTAL_DPOS_SALE_DATA';
  }, [columnName]);

  const exportParams = useMemo(() => ({
    storeCode: selectedStore,
    fromDate,
    toDate,
    pos: selectedPos,
    articleNo: selectedArticle,
    ean: selectedEan,
    columnName
  }), [selectedStore, fromDate, toDate, selectedPos, selectedArticle, selectedEan, columnName]);

  return (
    <AppLayout
      headerProps={{
        breadcrumb: (
          <>
            HOME - PAGES - DASHBOARD -{' '}
            <span className="active">
              {reportTitle}
            </span>
          </>
        ),
        showBackButton: true,
        onBackClick: () => navigate(-1)
      }}
    >
      <div className="sales-report-container">
        {/* Filter Card */}
        <div className="report-search-card">
          <div className="report-search-header">
            NOTE : FIELDS MARKED WITH (*) ARE REQUIRED
          </div>

          <div className={`report-search-body ${isThreeCardMode ? 'report-search-body' : ''}`}>
            {/* Store Selection */}
            <div className="search-field">
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
            <div className="search-field">
              <label>From Date {!isThreeCardMode && <span>*</span>}</label>
              <CustomDatePicker
                value={fromDate}
                onChange={(dateStr) => setFromDate(dateStr)}
                placeholder="From Date"
              />
            </div>

            {/* To Date */}
            <div className="search-field">
              <label>To Date {!isThreeCardMode && <span>*</span>}</label>
              <CustomDatePicker
                value={toDate}
                onChange={(dateStr) => setToDate(dateStr)}
                placeholder="To Date"
              />
            </div>

            {/* In DPOS mode: POS Counter, Article No, EAN */}
            {!isThreeCardMode && (
              <>
                <div className="search-field">
                  <label>POS Counter</label>
                  <SearchableDropdown
                    value={selectedPos}
                    onChange={(val) => setSelectedPos(val)}
                    options={displayPosOptions}
                    placeholder="All Counters"
                    labelKey="text"
                    valueKey="value"
                    closeOnSelect={true}
                  />
                </div>

                <div className="search-field">
                  <label>Article No</label>
                  <SearchableDropdown
                    value={selectedArticle}
                    onChange={(val) => setSelectedArticle(val)}
                    options={articleOptions}
                    placeholder="Search Article..."
                    searchPlaceholder="Search Article..."
                    isAsync={true}
                    onSearchChange={handleArticleSearch}
                    labelKey="text"
                    valueKey="value"
                    closeOnSelect={true}
                  />
                </div>

                <div className="search-field">
                  <label>EAN</label>
                  <SearchableDropdown
                    value={selectedEan}
                    onChange={(val) => setSelectedEan(val)}
                    options={eanOptions}
                    placeholder="Search EAN..."
                    searchPlaceholder="Search EAN..."
                    isAsync={true}
                    onSearchChange={handleEanSearch}
                    labelKey="text"
                    valueKey="value"
                    closeOnSelect={true}
                  />
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="search-buttons">
              <ClearButton onClick={handleResetFilters} />

              <BackButton
                onClick={() => navigate('/reports/store-sale', {
                  state: {
                    store: selectedStore,
                    fromDate,
                    toDate
                  }
                })}
                label="Back to Sale Summary"
              />
            </div>
          </div>
        </div>

        {/* Info Banner for RFID Checkout or Manual Sale */}
        {isThreeCardMode && (
          <ReportStatsHeader 
            leftLabel="REPORT TYPE"
            leftValue={reportTitle}
            fromDate={fromDate || '—'}
            toDate={toDate || '—'}
          />
        )}

        {/* Row 2: KPI Summary Cards */}
        {isThreeCardMode ? (
          /* 3 Cards for RFID Checkout and Manual Sale */
          <div className="report-curved-cards report-curved-cards">
            <CurvedCard
              title="STORE"
              value={selectedStore || '—'}
              waveColor={cardGradients[0]}
              icon={<ShoppingBag size={20} color="#ffffff" />}
              animate={false}
            />

            <CurvedCard
              title="EAN COUNT"
              value={(summaryData.recordCount || 0).toLocaleString('en-IN')}
              waveColor={cardGradients[1]}
              icon={<FileText size={20} color="#ffffff" />}
            />

            <CurvedCard
              title={isManualSale ? "MANUAL COUNT" : "CHECKOUT TAGS COUNT"}
              value={(summaryData.qty || 0).toLocaleString('en-IN')}
              waveColor={cardGradients[2]}
              icon={<Tag size={20} color="#ffffff" />}
            />
          </div>
        ) : (
          /* 4 Cards for Total DPOS Sale */
          <div className="report-curved-cards">
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
        )}

        {/* Row 3: Data Table Card */}
        <div className="report-table-wrapper">
          <ReportDataTableCard
            columns={tableColumns}
            data={tableData}
            isLoading={isLoading}
            skeletonRowsCount={10}
            totalRecords={totalRecords}
            pageIndex={pageIndex}
            pageSize={pageSize}
            reportName={exportReportName}
            exportParams={exportParams}
            exportFileName={`${reportTitle.replace(/\s+/g, '_')}_${selectedStore || 'All'}_${fromDate || 'Date'}.xlsx`}
            onPageChange={(newPg) => setPageIndex(newPg)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPageIndex(1);
            }}
            onSortChange={(col, dir) => {
              setSortColumn(col);
              setSortDirection(dir);
              setPageIndex(1);
            }}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
          />
        </div>

      </div>
    </AppLayout>
  );
}

