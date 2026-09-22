import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import CustomDatePicker from '../../components/common/CustomDatePicker';
import CurvedCard from '../../components/common/CurvedCard';
import ReportStatsHeader from '../../components/common/ReportStatsHeader';
import { ClearButton, BackButton } from '../../components/common/ReportActionButton';
import './LiveStockReport.css';
import './DcReport.css';
import { getDCDetails, getBindStores } from '../../services/stockService';
import { dateRenderer, numRenderer } from '../../utils/dashboardColumns';
import * as Icons from 'lucide-react';

export default function DcReportPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Helper for date calculations
  const getSevenDaysAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // State initialization
  const initialStore = location.state?.storeCode || 'HD44';
  const initialStoreName = location.state?.storeName || '';
  const initialFromDate = location.state?.fromDate || getSevenDaysAgo();
  const initialToDate = location.state?.toDate || getTodayDate();

  const [selectedStore, setSelectedStore] = useState(initialStore);
  const [storeDisplayName, setStoreDisplayName] = useState(initialStoreName);
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);

  const [storeOptions, setStoreOptions] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination & Sorting
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('DATE');
  const [sortDirection, setSortDirection] = useState('desc');

  // KPI Totals from API response
  const [totals, setTotals] = useState({
    processedCount: 0,
    unprocessedCount: 0,
    validatedCount: 0
  });

  // Fetch Store Dropdown Options
  useEffect(() => {
    const controller = new AbortController();
    const fetchStores = async () => {
      try {
        const data = await getBindStores(fromDate, toDate, controller.signal);
        const options = Array.isArray(data) ? data : (data?.stores || data?.Stores || []);
        setStoreOptions(options);

        // Update display name if available in options
        if (selectedStore) {
          const match = options.find(s => s.id === selectedStore || s.value === selectedStore || s.text?.startsWith(selectedStore));
          if (match && match.text) {
            setStoreDisplayName(match.text);
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.error("Failed to fetch stores", err);
      }
    };
    fetchStores();
    return () => controller.abort();
  }, [fromDate, toDate, selectedStore]);

  // Fetch DC Report Data
  const fetchReportData = useCallback(async (signal) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getDCDetails({
        storeName: selectedStore,
        fromDate,
        toDate,
        pageIndex,
        pageSize,
        searchTerm,
        sortColumn,
        sortDirection
      }, signal);

      const items = result?.data || result?.Data || [];
      setReportData(items);
      setTotalRecords(result?.recordCount || result?.RecordCount || 0);
      setTotals({
        processedCount: result?.processedCount ?? result?.ProcessedCount ?? 0,
        unprocessedCount: result?.unprocessedCount ?? result?.UnprocessedCount ?? 0,
        validatedCount: result?.validatedCount ?? result?.ValidatedCount ?? 0
      });

      if (!storeDisplayName && items.length > 0 && items[0]?.STORE_NAME) {
        setStoreDisplayName(items[0].STORE_NAME);
      }
    } catch (err) {
      if (err.name !== 'AbortError' && err.message !== 'canceled' && err.code !== 'ERR_CANCELED') {
        setError(err.message || 'Failed to fetch DC details.');
        setReportData([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedStore, fromDate, toDate, pageIndex, pageSize, searchTerm, sortColumn, sortDirection, storeDisplayName]);

  useEffect(() => {
    const controller = new AbortController();
    fetchReportData(controller.signal);
    return () => controller.abort();
  }, [fetchReportData]);

  // Search & Filter actions

  const handleClear = () => {
    setSelectedStore(initialStore || '');
    setFromDate(getSevenDaysAgo());
    setToDate(getTodayDate());
    setSearchTerm('');
    setSortColumn('DATE');
    setSortDirection('desc');
    setPageIndex(1);
  };

  // Drilldown navigations
  const getRowDateString = (row) => {
    if (!row || !row.DATE) return '';
    return String(row.DATE).split('T')[0];
  };

  const handleNavigateToHuReport = (row, huStatus) => {
    const rowDate = getRowDateString(row);
    navigate('/reports/hu-report', {
      state: {
        receivingPlant: selectedStore || row.Reciving_Plant,
        date: rowDate,
        huStatus: huStatus,
        fromDate: rowDate,
        toDate: rowDate
      }
    });
  };

  const handleNavigateToEncodingReport = (row) => {
    const rowDate = getRowDateString(row);
    navigate('/reports/encoding-store-report', {
      state: {
        storeCode: selectedStore || row.Reciving_Plant,
        date: rowDate,
        fromDate: rowDate,
        toDate: rowDate
      }
    });
  };

  // Table Columns matching user's screenshot
  const columns = useMemo(() => [
    {
      key: 'RowNumber',
      label: 'SR.NO',
      render: (val, row, idx) => ((pageIndex - 1) * pageSize) + idx + 1
    },
    {
      key: 'DATE',
      label: 'DATE',
      render: (val) => dateRenderer(val)
    },
    {
      key: 'PROCESSED_HU',
      label: 'PROCESSED HU QTY',
      render: (val, row) => (
        <span
          className="dc-drilldown-link"
          onClick={() => handleNavigateToHuReport(row, '1')}
          title="Click to view Processed HU details"
        >
          {numRenderer(val ?? 0)}
        </span>
      )
    },
    {
      key: 'UNPROCESSED_HU',
      label: 'UNPROCESSED HU QTY',
      render: (val, row) => (
        <span
          className="dc-drilldown-link"
          onClick={() => handleNavigateToHuReport(row, '0')}
          title="Click to view Unprocessed HU details"
        >
          {numRenderer(val ?? 0)}
        </span>
      )
    },
    {
      key: 'PROCESSED_ARTICLE_QTY',
      label: 'VALIDATE HU ARTICLE QTY',
      render: (val, row) => (
        <span
          className="dc-drilldown-link"
          onClick={() => handleNavigateToEncodingReport(row)}
          title="Click to view Validated Article details"
        >
          {numRenderer(val ?? 0)}
        </span>
      )
    }
  ], [pageIndex, pageSize, selectedStore]);

  const displayStoreTitle = useMemo(() => {
    if (storeDisplayName) {
      return storeDisplayName.includes(selectedStore) ? storeDisplayName : `${selectedStore} - ${storeDisplayName}`;
    }
    return selectedStore || 'ALL STORES';
  }, [storeDisplayName, selectedStore]);

  return (
    <AppLayout
      headerProps={{
        breadcrumb: (
          <>
            HOME - PAGES - REPORT - <span className="active">DC REPORT</span>
          </>
        ),
        showBackButton: true,
        onBackClick: () => navigate('/dashboard')
      }}
    >
      <div className="dc-report-page-container">
        {/* Filter Card */}
        <div className="report-search-card">
          <div className="report-search-header">
            <span>NOTE : FIELDS MARKED WITH (*) ARE REQUIRED</span>
          </div>
          <div className="report-search-body">
            <div className="search-field">
              <label>Store Code</label>
              <div className="input-group">
                <input
                  type="text"
                  value={selectedStore}
                  onChange={(e) => { setSelectedStore(e.target.value.toUpperCase()); setPageIndex(1); }}
                  placeholder="Enter Store Code (e.g. HD44)"
                />
                {selectedStore && (
                  <button
                    type="button"
                    className="btn-input-clear"
                    onClick={() => setSelectedStore('')}
                    title="Clear Store"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="search-field">
              <label>From Date *</label>
              <CustomDatePicker value={fromDate} onChange={(val) => { setFromDate(val); setPageIndex(1); }} />
            </div>

            <div className="search-field">
              <label>To Date</label>
              <CustomDatePicker value={toDate} onChange={(val) => { setToDate(val); setPageIndex(1); }} />
            </div>

            <div className="search-buttons">
              <ClearButton
                onClick={handleClear}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {error && <div className="report-error-banner">{error}</div>}

        {/* Selected Store / Date Subheader Bar */}
        <ReportStatsHeader 
            storeName={displayStoreTitle}
            fromDate={fromDate}
            toDate={toDate}
          />

        {/* 3 Curved KPI Cards */}
        <div className="report-curved-cards">
          <div className="ds-kpi-item">
            <CurvedCard
              title="PROCESSED HU QTY"
              value={totals.processedCount.toLocaleString('en-IN')}
              waveColor={['#f472b6', '#db2777']}
              icon={<Icons.PackageCheck size={20} color="#ffffff" />}
            />
          </div>
          <div className="ds-kpi-item">
            <CurvedCard
              title="UNPROCESSED HU QTY"
              value={totals.unprocessedCount.toLocaleString('en-IN')}
              waveColor={['#86efac', '#22c55e']}
              icon={<Icons.Clock size={20} color="#ffffff" />}
            />
          </div>
          <div className="ds-kpi-item">
            <CurvedCard
              title="VALIDATED ARTICLE QTY"
              value={totals.validatedCount.toLocaleString('en-IN')}
              waveColor={['#c084fc', '#9333ea']}
              icon={<Icons.FileText size={20} color="#ffffff" />}
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="report-table-wrapper">
          <ReportDataTableCard
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
            exportFileName={`DC_Report_${selectedStore}_${fromDate}_${toDate}.csv`}
            searchPlaceholder="Search Records"
            onSearch={(term) => setSearchTerm(term)}
          />
        </div>
      </div>
    </AppLayout>
  );
}
