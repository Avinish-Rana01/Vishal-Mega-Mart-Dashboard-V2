import React, { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Radio, Scale } from 'lucide-react';
import ReportDataTableCard from "../common/ReportDataTableCard";
import SearchableDropdown from "../common/SearchableDropdown";
import CustomDatePicker from "../common/CustomDatePicker";
import CurvedCard from "../common/CurvedCard";
import ReportStatsHeader from "../common/ReportStatsHeader";
import { ClearButton } from "../common/ReportActionButton";
import { getReportStores, searchReportArticles, getReportLiveStock } from "../../services/stockService";
import './LiveStockTableView.css'; // We'll copy LiveStockReport.css styles here
import '../../pages/Report/common-reports.css';

export default function LiveStockTableView({ initialStore = 'HD44', initialDate = new Date().toISOString().split('T')[0] }) {
  const [selectedStore, setSelectedStore] = useState(initialStore);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [storeOptions, setStoreOptions] = useState([]);
  
  const [articleData, setArticleData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);

  // Vibrant gradient pairs matching Store Sale Report design
  const cardGradients = useMemo(() => [
    ['#7dd3fc', '#0284c7'], // Blue: SAP STOCK COUNT
    ['#86efac', '#22c55e'], // Green: RFID STOCK COUNT
    ['#f472b6', '#db2777']  // Pink: DIFFERENCE COUNT
  ], []);

  // Fetch Store Dropdown Options
  useEffect(() => {
    const controller = new AbortController();
    const fetchStores = async () => {
      try {
        const data = await getReportStores(controller.signal);
        setStoreOptions(data);
      } catch (err) {
        if (err.name !== 'AbortError') console.error("Failed to fetch stores", err);
      }
    };
    fetchStores();
    return () => controller.abort();
  }, []);

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState('STOCK_DATE');
  const [sortDirection, setSortDirection] = useState('asc');

  // Article Options derived from current table data
  const tableArticleOptions = useMemo(() => {
    if (!articleData || articleData.length === 0) return [];
    const seen = new Set();
    const list = [];
    for (const row of articleData) {
      const art = row.articleNo || row.ARTICLE || row.Article;
      if (art && !seen.has(String(art))) {
        seen.add(String(art));
        list.push({ id: String(art), value: String(art), text: String(art) });
      }
    }
    return list;
  }, [articleData]);

  // Article Autocomplete State
  const [articleSearchTerm, setArticleSearchTerm] = useState('');
  const [articleOptions, setArticleOptions] = useState([]);
  const [isArticleSearching, setIsArticleSearching] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState('');

  const exportFilters = useMemo(() => ({
    storeCode: selectedStore,
    fromDate: selectedDate,
    toDate: selectedDate,
    articleNo: selectedArticle,
    sortColumn,
    sortDirection
  }), [selectedStore, selectedDate, selectedArticle, sortColumn, sortDirection]);

  // Sync Article options: use table data by default; only call search API when user actively types a search query
  useEffect(() => {
    const trimmed = articleSearchTerm.trim();
    if (!trimmed) {
      setArticleOptions(tableArticleOptions);
      setIsArticleSearching(false);
      return;
    }

    const controller = new AbortController();
    const delayDebounceFn = setTimeout(async () => {
      setIsArticleSearching(true);
      try {
        const data = await searchReportArticles(trimmed, selectedStore, selectedDate, selectedDate, controller.signal);
        setArticleOptions(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== 'AbortError') console.error("Failed to fetch articles", err);
      } finally {
        if (!controller.signal.aborted) setIsArticleSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [articleSearchTerm, selectedStore, selectedDate, tableArticleOptions]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchReport = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getReportLiveStock(selectedStore, selectedDate, selectedArticle, pageIndex, pageSize, sortColumn, sortDirection, controller.signal);
        
        if (controller.signal.aborted) return;
        
        const itemsArray = result.items || result.data || [];
        const mappedData = itemsArray.map((item) => ({
          srNo: item.RowNumber,
          stockDate: (item.STOCK_DATE || item.DATE) ? (item.STOCK_DATE || item.DATE).split('T')[0] : '',
          articleNo: item.ARTICLE,
          sapStock: item.SAP_STOCK,
          rfidStock: item.RFID_STOCK,
          diff: item.DIFFERENCE || item.DIFF
        }));
        
        setArticleData(mappedData);

        if (result.summary) {
          setReportSummary({
            sapQty: result.summary.sapQty || result.summary.sapStockCount,
            rfidQty: result.summary.rfidQty || result.summary.rfidStockCount,
            diffQty: result.summary.diffQty || result.summary.differenceCount,
            totalRecords: result.summary.totalCount || result.summary.totalRecords,
            storeName: result.summary.storeName || (itemsArray.length > 0 ? itemsArray[0].STORE_NAME : null)
          });
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error("Error fetching live stock report:", err);
        setError("Unable to load report data.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    fetchReport();
    return () => controller.abort();
  }, [selectedStore, selectedDate, pageIndex, pageSize, selectedArticle, sortColumn, sortDirection]);

  const numRenderer = (val) => <span className="vmm-link-num">{typeof val === 'number' ? val.toLocaleString('en-IN') : val}</span>;
  const linkRenderer = (val) => <span className="vmm-link-num">{val}</span>;

  const getSelectedStoreName = () => {
    if (reportSummary?.storeName) return reportSummary.storeName;
    if (!selectedStore) return 'None';
    const options = Array.isArray(storeOptions) ? storeOptions : [];
    const opt = options.find(o => o?.STORE === selectedStore || o?.value === selectedStore);
    return opt?.STORE_NAME || opt?.label || selectedStore;
  };

  const columns = [
    { 
      key: 'srNo', 
      label: 'Sr.No', 
      render: (val, row, idx) => val || ((pageIndex - 1) * pageSize + idx + 1) 
    },
    { key: 'stockDate', label: 'Stock Date' },
    { key: 'articleNo', label: 'Article No', render: linkRenderer },
    { key: 'sapStock', label: 'SAP Stock', render: numRenderer },
    { key: 'rfidStock', label: 'RFID Stock', render: numRenderer },
    { key: 'diff', label: 'Difference', render: numRenderer }
  ];

  return (
    <div className="livestock-table-view">
      {/* Search Card */}
      <div className="report-search-card">
        <div className="report-search-header">
          <span>NOTE : FIELDS MARKED WITH (*) ARE REQUIRED</span>
        </div>
        <div className="report-search-body">
          <div className="search-field">
            <label>Store Code</label>
            <SearchableDropdown
              value={selectedStore}
              onChange={(val) => {
                setSelectedStore(val);
                setSelectedArticle('');
                setArticleSearchTerm('');
                setPageIndex(1);
              }}
              options={storeOptions}
              placeholder="Select Store Code"
            />
          </div>
          <div className="search-field">
            <label>Stock Date</label>
            <CustomDatePicker
              value={selectedDate}
              onChange={(val) => setSelectedDate(val)}
              placeholder="Select Stock Date"
            />
          </div>
          <div className="search-field">
            <label>Article No</label>
            <SearchableDropdown
              value={selectedArticle}
              onChange={(val) => {
                setSelectedArticle(val);
                setPageIndex(1);
              }}
              options={articleOptions}
              placeholder="Select Article No"
              searchPlaceholder="Search Article No"
              isAsync={true}
              onSearchChange={setArticleSearchTerm}
              isLoading={isArticleSearching}
              valueKey="id"
              closeOnSelect={true}
            />
          </div>
          <div className="search-buttons">
            <ClearButton
              onClick={() => {
                setSelectedArticle('');
                setArticleSearchTerm('');
                setPageIndex(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Selected Info Bar */}
      <ReportStatsHeader 
        storeName={getSelectedStoreName()}
        date={selectedDate}
      />

      {/* KPI Cards */}
      <div className="report-curved-cards">
        <CurvedCard 
          title="SAP STOCK COUNT" 
          value={reportSummary?.sapQty?.toLocaleString('en-IN') || '0'} 
          waveColor={cardGradients[0]}
          icon={<ClipboardList size={20} color="#ffffff" />}
        />

        <CurvedCard 
          title="RFID STOCK COUNT" 
          value={reportSummary?.rfidQty?.toLocaleString('en-IN') || '0'} 
          waveColor={cardGradients[1]}
          icon={<Radio size={20} color="#ffffff" />}
        />

        <CurvedCard 
          title="DIFFERENCE COUNT" 
          value={reportSummary?.diffQty?.toLocaleString('en-IN') || '0'} 
          waveColor={cardGradients[2]}
          icon={<Scale size={20} color="#ffffff" />}
        />
      </div>

      {/* Data Table */}
      <div className="livestock-report-table-wrapper report-table-wrapper">
        <ReportDataTableCard 
          columns={columns} 
          data={articleData}
          isLoading={isLoading}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPageIndex(1);
          }}
          totalRecords={reportSummary?.totalRecords || articleData.length}
          onSortChange={(col, dir) => {
            setSortColumn(col);
            setSortDirection(dir);
            setPageIndex(1);
          }}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          reportName="LIVE_STOCK_REPORT"
          exportFilters={exportFilters}
          exportFileName={`Live_Stock_Report_${selectedStore}_${selectedDate}.xlsx`}
        />
      </div>
    </div>
  );
}
