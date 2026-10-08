import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shirt, 
  Boxes, 
  ScanLine, 
  MinusCircle, 
  ChevronsDown, 
  ChevronsUp 
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import CustomDatePicker from '../../components/common/CustomDatePicker';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import CurvedCard from '../../components/common/CurvedCard';
import ReportStatsHeader from '../../components/common/ReportStatsHeader';
import { SearchButton, ClearButton } from '../../components/common/ReportActionButton';
import { getStockTakeData, getBindStores } from '../../services/stockService';
import './common-reports.css';

export default function StockTakeReportPage() {
  const navigate = useNavigate();

  // Helper to format date as YYYY-MM-DD
  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = useMemo(() => formatDate(new Date()), []);

  // Filter form state
  const [selectedStore, setSelectedStore] = useState('');
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [storeOptions, setStoreOptions] = useState([]);

  // Active applied query state
  const [appliedFilters, setAppliedFilters] = useState({
    storeCode: '',
    fromDate: todayStr,
    toDate: todayStr,
    searchTerm: ''
  });

  // Table pagination & sorting state
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState('SR_NO');
  const [sortDirection, setSortDirection] = useState('asc');

  // Data & loading state
  const [reportData, setReportData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summaryStats, setSummaryStats] = useState({
    noOfArticles: 0,
    systemStock: 0,
    scannedStock: 0,
    netDifference: 0,
    shortQty: 0,
    excessQty: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to extract store code from option
  const getStoreCode = (opt) => {
    if (!opt) return '';
    if (typeof opt === 'string' || typeof opt === 'number') return String(opt);
    return opt.value ?? opt.id ?? opt.code ?? opt.storeCode ?? opt.Store_Code ?? opt.text ?? '';
  };

  // Fetch Store dropdown options
  useEffect(() => {
    const controller = new AbortController();
    const fetchStores = async () => {
      try {
        const data = await getBindStores(fromDate, toDate, controller.signal);
        const list = Array.isArray(data) ? data : (data?.stores || data?.Stores || []);
        setStoreOptions(list);

        // Keep one default store selected from the dropdown
        if (list.length > 0) {
          const firstCode = getStoreCode(list[0]);
          if (firstCode) {
            setSelectedStore((prev) => {
              if (prev) return prev;
              // If no store was selected, set default and apply it immediately
              setAppliedFilters((currentFilters) => ({
                ...currentFilters,
                storeCode: currentFilters.storeCode || firstCode
              }));
              return firstCode;
            });
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch stores:', err);
        }
      }
    };
    fetchStores();
    return () => controller.abort();
  }, [fromDate, toDate]);

  // Fetch Stock Take data from API
  const fetchData = useCallback(async (signal) => {
    if (!appliedFilters.storeCode) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await getStockTakeData({
        storeCode: appliedFilters.storeCode,
        fromDate: appliedFilters.fromDate,
        toDate: appliedFilters.toDate,
        searchTerm: appliedFilters.searchTerm,
        pageIndex,
        pageSize,
        sortColumn,
        sortDirection
      }, signal);

      if (response) {
        const rows = response.data || response.Data || [];
        setReportData(rows);
        setTotalRecords(response.recordCount ?? response.RecordCount ?? rows.length);
        setSummaryStats({
          noOfArticles: response.noOfArticles ?? response.NoOfArticles ?? response.totalCount ?? response.TotalCount ?? 0,
          systemStock: response.systemStock ?? response.SystemStock ?? response.actualQty ?? response.ActualQty ?? 0,
          scannedStock: response.scannedStock ?? response.ScannedStock ?? response.scannedQty ?? response.ScannedQty ?? 0,
          netDifference: response.netDifference ?? response.NetDifference ?? 0,
          shortQty: response.shortQty ?? response.ShortQty ?? response.differenceQty ?? response.DifferenceQty ?? 0,
          excessQty: response.excessQty ?? response.ExcessQty ?? 0
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        console.error('Failed to load Stock Take Report:', err);
        setError('Failed to fetch Stock Take report data. Please check your network or try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters, pageIndex, pageSize, sortColumn, sortDirection]);

  // Load data when filters, pagination, or sorting change
  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  // Handle Search click
  const handleSearch = () => {
    if (!selectedStore) {
      setError('Please select a store from the dropdown to view stock take data.');
      return;
    }
    setError(null);
    setPageIndex(1);
    setAppliedFilters({
      storeCode: selectedStore,
      fromDate,
      toDate,
      searchTerm: ''
    });
  };

  // Handle Clear click
  const handleClear = () => {
    const defaultStore = storeOptions.length > 0 ? getStoreCode(storeOptions[0]) : '';
    setSelectedStore(defaultStore);
    setFromDate(todayStr);
    setToDate(todayStr);
    setPageIndex(1);
    setAppliedFilters({
      storeCode: defaultStore,
      fromDate: todayStr,
      toDate: todayStr,
      searchTerm: ''
    });
    setReportData([]);
    setTotalRecords(0);
    setSummaryStats({
      noOfArticles: 0,
      systemStock: 0,
      scannedStock: 0,
      netDifference: 0,
      shortQty: 0,
      excessQty: 0
    });
    setError(null);
  };

  // Table search handler (in-table search keyword)
  const handleTableSearch = (term) => {
    setPageIndex(1);
    setAppliedFilters((prev) => ({
      ...prev,
      searchTerm: term
    }));
  };

  // Define 13 table columns matching legacy UI
  const columns = useMemo(() => [
    {
      key: 'SR_NO',
      label: 'SR.NO',
      align: 'center',
      width: '80px',
      sortable: false,
      render: (val, row, idx) => (
        <span style={{ fontWeight: 600, color: '#475569' }}>
          {row?.RowNumber || row?.rowNumber || ((pageIndex - 1) * pageSize + idx + 1)}
        </span>
      )
    },
    {
      key: 'REF_NO',
      label: 'REFERENCE NO',
      align: 'center',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 600, color: '#1e293b' }}>
          {val || row?.REF_NO || row?.ref_NO || row?.Ref_No || '—'}
        </span>
      )
    },
    {
      key: 'STORE_NAME',
      label: 'STORE NAME',
      align: 'left',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 600, color: '#334155' }}>
          {val || row?.STORE_NAME || row?.store_NAME || row?.Store_Code || '—'}
        </span>
      )
    },
    {
      key: 'MC_CODE',
      label: 'MC',
      align: 'center',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 600, color: '#475569' }}>
          {val || row?.MC_CODE || row?.mC_CODE || '—'}
        </span>
      )
    },
    {
      key: 'MC_DESC',
      label: 'MC DESCRIPTION',
      align: 'left',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 500, color: '#334155' }}>
          {val || row?.MC_DESC || row?.mC_DESC || '—'}
        </span>
      )
    },
    {
      key: 'ARTICLE_CODE',
      label: 'ARTICLE NO',
      align: 'center',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 600, color: '#1e293b' }}>
          {val || row?.ARTICLE_CODE || row?.article_CODE || '—'}
        </span>
      )
    },
    {
      key: 'ARTICLE_DESCRIPTION',
      label: 'ARTICLE DESCRIPTION',
      align: 'left',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 500, color: '#334155' }}>
          {val || row?.ARTICLE_DESCRIPTION || row?.article_DESCRIPTION || '—'}
        </span>
      )
    },
    {
      key: 'SYSTEM_STOCK',
      label: 'SYSTEM STOCK',
      align: 'center',
      sortable: true,
      render: (val, row) => {
        const num = Number(val ?? row?.SYSTEM_STOCK ?? row?.system_STOCK ?? 0);
        return (
          <span style={{ fontWeight: 700, color: '#1e293b' }}>
            {num.toLocaleString('en-IN')}
          </span>
        );
      }
    },
    {
      key: 'STOCKTAKE_STOCK',
      label: 'SCANNED STOCK',
      align: 'center',
      sortable: true,
      render: (val, row) => {
        const num = Number(val ?? row?.STOCKTAKE_STOCK ?? row?.stocktake_STOCK ?? 0);
        return (
          <span style={{ fontWeight: 700, color: '#0284c7' }}>
            {num.toLocaleString('en-IN')}
          </span>
        );
      }
    },
    {
      key: 'NET_DIFF',
      label: 'NET DIFFERENCE',
      align: 'center',
      sortable: true,
      render: (val, row) => {
        const raw = val ?? row?.NET_DIFF ?? row?.net_DIFF ?? 0;
        const num = Number(raw);
        const color = num < 0 ? '#ef4444' : num > 0 ? '#16a34a' : '#64748b';
        const prefix = num > 0 ? '+' : '';
        return (
          <span style={{ fontWeight: 700, color }}>
            {prefix}{num.toLocaleString('en-IN')}
          </span>
        );
      }
    },
    {
      key: 'STARTED_ON',
      label: 'STARTED ON',
      align: 'center',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 500, color: '#475569' }}>
          {val || row?.STARTED_ON || row?.started_ON || '—'}
        </span>
      )
    },
    {
      key: 'ENDED_ON',
      label: 'ENDED ON',
      align: 'center',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 500, color: '#475569' }}>
          {val || row?.ENDED_ON || row?.ended_ON || '—'}
        </span>
      )
    },
    {
      key: 'TIME_TAKEN',
      label: 'TIME TAKEN',
      align: 'center',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 500, color: '#475569' }}>
          {val || row?.TIME_TAKEN || row?.time_TAKEN || '—'}
        </span>
      )
    }
  ], [pageIndex, pageSize]);

  // Export filters for universal streaming export
  const exportFilters = useMemo(() => ({
    storeCode: appliedFilters.storeCode,
    fromDate: appliedFilters.fromDate,
    toDate: appliedFilters.toDate
  }), [appliedFilters.storeCode, appliedFilters.fromDate, appliedFilters.toDate]);

  return (
    <AppLayout
      headerProps={{
        breadcrumb: (
          <>
            HOME - PAGES - REPORTS - <span className="active">STOCK TAKE</span>
          </>
        ),
        showBackButton: true,
        onBackClick: () => navigate(-1)
      }}
    >
      {/* Search / Filter Card */}
      <div className="report-search-card">
        <div className="report-search-header">
          <span>NOTE : FIELDS MARKED WITH (*) ARE REQUIRED</span>
        </div>
        <div className="report-search-body">
          <div className="search-field">
            <label>Select Store *</label>
            <SearchableDropdown
              options={storeOptions}
              value={selectedStore}
              onChange={setSelectedStore}
              placeholder="Select Store Name"
            />
          </div>

          <div className="search-field">
            <label>From Date *</label>
            <CustomDatePicker value={fromDate} onChange={setFromDate} />
          </div>

          <div className="search-field">
            <label>To Date *</label>
            <CustomDatePicker value={toDate} onChange={setToDate} />
          </div>

          <div className="search-buttons">
            <SearchButton onClick={handleSearch} disabled={isLoading} />
            <ClearButton onClick={handleClear} disabled={isLoading} />
          </div>
        </div>
      </div>

      {error && <div className="report-error-banner">{error}</div>}

      {/* Date Range & Store Subheader Banner */}
      <ReportStatsHeader
        storeName={appliedFilters.storeCode || selectedStore || 'SELECT STORE'}
        fromDate={appliedFilters.fromDate}
        toDate={appliedFilters.toDate}
      />

      {/* KPI Cards Row (6 Curved Cards) */}
      <div className="ds-kpi-row" style={{ marginTop: '12px' }}>
        <div className="ds-kpi-item">
          <CurvedCard
            title="NO OF ARTICLES"
            value={summaryStats.noOfArticles.toLocaleString('en-IN')}
            waveColor={['#86efac', '#22c55e']}
            icon={<Shirt size={20} color="#ffffff" />}
          />
        </div>
        <div className="ds-kpi-item">
          <CurvedCard
            title="SYSTEM STOCK"
            value={summaryStats.systemStock.toLocaleString('en-IN')}
            waveColor={['#c084fc', '#9333ea']}
            icon={<Boxes size={20} color="#ffffff" />}
          />
        </div>
        <div className="ds-kpi-item">
          <CurvedCard
            title="SCANNED STOCK"
            value={summaryStats.scannedStock.toLocaleString('en-IN')}
            waveColor={['#7dd3fc', '#0284c7']}
            icon={<ScanLine size={20} color="#ffffff" />}
          />
        </div>
        <div className="ds-kpi-item">
          <CurvedCard
            title="NET DIFFERENCE"
            value={(summaryStats.netDifference > 0 ? '+' : '') + summaryStats.netDifference.toLocaleString('en-IN')}
            waveColor={['#bef264', '#84cc16']}
            icon={<MinusCircle size={20} color="#ffffff" />}
          />
        </div>
        <div className="ds-kpi-item">
          <CurvedCard
            title="SHORT QTY"
            value={summaryStats.shortQty.toLocaleString('en-IN')}
            waveColor={['#fda4af', '#f43f5e']}
            icon={<ChevronsDown size={20} color="#ffffff" />}
          />
        </div>
        <div className="ds-kpi-item">
          <CurvedCard
            title="EXCESS QTY"
            value={(summaryStats.excessQty > 0 ? '+' : '') + summaryStats.excessQty.toLocaleString('en-IN')}
            waveColor={['#a5b4fc', '#6366f1']}
            icon={<ChevronsUp size={20} color="#ffffff" />}
          />
        </div>
      </div>

      {/* Report Data Table Card */}
      <div className="report-table-wrapper" style={{ marginTop: '12px' }}>
        <ReportDataTableCard
          title="Stock Take Data"
          columns={columns}
          data={reportData}
          totalRecords={totalRecords}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageChange={setPageIndex}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPageIndex(1);
          }}
          isLoading={isLoading}
          onSortChange={(col, dir) => {
            setSortColumn(col || 'SR_NO');
            setSortDirection(dir || 'asc');
            setPageIndex(1);
          }}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSearch={handleTableSearch}
          searchPlaceholder="Search Records..."
          reportName="STOCK_TAKE_REPORT"
          exportFilters={exportFilters}
          exportFileName={`Stock_Take_Report_${appliedFilters.storeCode || 'ALL'}_${appliedFilters.fromDate}_to_${appliedFilters.toDate}.xlsx`}
        />
      </div>
    </AppLayout>
  );
}
