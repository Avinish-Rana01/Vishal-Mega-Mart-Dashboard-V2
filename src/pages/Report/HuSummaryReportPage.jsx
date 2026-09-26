import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import CustomDatePicker from '../../components/common/CustomDatePicker';
import CurvedCard from '../../components/common/CurvedCard';
import ReportStatsHeader from '../../components/common/ReportStatsHeader';
import { ClearButton, SearchButton } from '../../components/common/ReportActionButton';
import { getHUSummaryDetails, searchValidationHuNumbers } from '../../services/stockService';
import { dateRenderer, numRenderer } from '../../utils/dashboardColumns';
import * as Icons from 'lucide-react';
import './common-reports.css';

// Helper for date string
const getTodayDate = () => new Date().toISOString().split('T')[0];

export default function HuSummaryReportPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Initial parameters from navigation state or defaults
  const initialFromDate = location.state?.fromDate || getTodayDate();
  const initialToDate = location.state?.toDate || getTodayDate();
  const initialHu = location.state?.huNumber || location.state?.hu || '';

  // Filter state
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);
  const [selectedHu, setSelectedHu] = useState(initialHu);

  // Active query parameters actually used for fetching
  const [activeFilters, setActiveFilters] = useState({
    fromDate: initialFromDate,
    toDate: initialToDate,
    hu: initialHu
  });

  // Table Data State
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Sorting
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('ENCODE_DATE');
  const [sortDirection, setSortDirection] = useState('desc');

  // KPI Summary Totals from API Pager
  const [summary, setSummary] = useState({
    recordCount: 0,
    actualCount: 0,
    scanCount: 0
  });

  const exportFilters = useMemo(() => ({
    huNo: activeFilters.hu,
    fromDate: activeFilters.fromDate,
    toDate: activeFilters.toDate,
    sortColumn,
    sortDirection
  }), [activeFilters, sortColumn, sortDirection]);

  // 1. Derive unique HU options from currently loaded table rows (default view)
  const tableHuOptions = useMemo(() => {
    const list = [{ id: '', value: '', text: 'ALL HU' }];
    if (!reportData || reportData.length === 0) return list;
    const seen = new Set();
    for (const row of reportData) {
      const hu = row.HU_NUMBER || row.hU_NUMBER || row.HU_No || row.hU_NO || row.HU_NO;
      if (hu && !seen.has(String(hu))) {
        seen.add(String(hu));
        list.push({ id: String(hu), value: String(hu), text: String(hu) });
      }
    }
    return list;
  }, [reportData]);

  // 2. State for async HU search
  const [huSearchTerm, setHuSearchTerm] = useState('');
  const [huOptions, setHuOptions] = useState([]);
  const [isHuSearching, setIsHuSearching] = useState(false);

  // 3. Fetch HU Options via API (/api/Stock/hu-numbers/search) when search term is typed
  useEffect(() => {
    const trimmed = huSearchTerm.trim();
    if (!trimmed) {
      setHuOptions([]);
      setIsHuSearching(false);
      return;
    }

    const controller = new AbortController();
    const delayDebounceFn = setTimeout(async () => {
      setIsHuSearching(true);
      try {
        const data = await searchValidationHuNumbers({
          searchTerm: trimmed
        }, controller.signal);

        const list = Array.isArray(data)
          ? data.map(item => ({
              id: String(item.id || item.value || item.HU_NUMBER || item),
              value: String(item.value || item.id || item.HU_NUMBER || item),
              text: String(item.text || item.value || item.HU_NUMBER || item)
            }))
          : [];

        // Include ALL HU option at the top of search results
        setHuOptions([
          { id: '', value: '', text: 'ALL HU' },
          ...list.filter(item => item.value !== '')
        ]);
      } catch (err) {
        if (err.name !== 'AbortError' && err.message !== 'canceled' && err.code !== 'ERR_CANCELED') {
          console.error('Failed to search HU numbers', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsHuSearching(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [huSearchTerm]);

  // 4. When no search term typed, show table-derived options; otherwise show API search results
  const displayHuOptions = useMemo(() => {
    if (huSearchTerm.trim()) {
      return huOptions;
    }
    return tableHuOptions;
  }, [huSearchTerm, huOptions, tableHuOptions]);

  // Fetch report data from API
  const fetchData = useCallback(async (signal) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getHUSummaryDetails({
        searchTerm,
        pageIndex,
        pageSize,
        hu: activeFilters.hu,
        fromDate: activeFilters.fromDate,
        toDate: activeFilters.toDate,
        sortColumn,
        sortDirection
      }, signal);

      if (result) {
        const rows = Array.isArray(result.huData)
          ? result.huData
          : Array.isArray(result.HUData)
            ? result.HUData
            : [];

        setReportData(rows);

        const pager = result.pager || result.Pager || {};
        const total = pager.recordCount ?? pager.RecordCount ?? rows.length;
        setTotalRecords(total);

        setSummary({
          recordCount: pager.recordCount ?? pager.RecordCount ?? rows.length,
          actualCount: pager.actualCount ?? pager.ActualCount ?? 0,
          scanCount: pager.scanCount ?? pager.ScanCount ?? 0
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        console.error('Error fetching HU Summary Report:', err);
        setError('Failed to load HU Summary Report. Please check parameters and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, pageIndex, pageSize, activeFilters, sortColumn, sortDirection]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  // Handle Search click
  const handleSearch = () => {
    setPageIndex(1);
    setActiveFilters({
      fromDate,
      toDate,
      hu: selectedHu
    });
  };

  // Handle Clear click
  const handleClear = () => {
    const today = getTodayDate();
    setFromDate(today);
    setToDate(today);
    setSelectedHu('');
    setHuSearchTerm('');
    setSearchTerm('');
    setPageIndex(1);
    setActiveFilters({
      fromDate: today,
      toDate: today,
      hu: ''
    });
  };

  // Columns definition matching legacy requirements & BaseDataTable schema
  const columns = useMemo(() => [
    {
      key: 'RowNumber',
      label: 'Sr.No',
      className: 'text-center',
      sortable: false,
      render: (val, row, idx) => ((pageIndex - 1) * pageSize) + idx + 1
    },
    {
      key: 'STORE_NAME',
      label: 'Store',
      className: 'text-center',
      render: (val, row) => val || row?.storE_NAME || row?.Store_Name || row?.STORE_NAME || '—'
    },
    {
      key: 'HU_NUMBER',
      label: 'HU Number',
      className: 'text-center',
      render: (val, row) => {
        const hu = val || row?.hU_NUMBER || row?.HU_No || row?.hU_NO || row?.HU_NO || '—';
        return (
          <span style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
            {hu}
          </span>
        );
      }
    },
    {
      key: 'ACT_QTY',
      label: 'Article Quantity',
      className: 'text-center',
      render: (val, row) => numRenderer(val ?? row?.acT_QTY ?? row?.ACTUAL_QTY ?? row?.actuaL_QTY ?? row?.Act_Qty ?? 0)
    },
    {
      key: 'SCAN_QTY',
      label: 'Scanned Quantity',
      className: 'text-center',
      render: (val, row) => numRenderer(val ?? row?.scaN_QTY ?? row?.Scan_Qty ?? row?.SCAN_QTY ?? 0)
    },
    {
      key: 'HU_SCAN_DATE',
      label: 'Scanned Date',
      className: 'text-center',
      render: (val, row) => dateRenderer(val || row?.hU_SCAN_DATE || row?.Scanned_Date || row?.HU_SCAN_DATE || '—')
    }
  ], [pageIndex, pageSize]);

  return (
    <AppLayout
      headerProps={{
        breadcrumb: (
          <>
            HOME - PAGES - REPORT - <span className="active">HU SUMMARY REPORT</span>
          </>
        ),
        showBackButton: true,
        onBackClick: () => navigate('/dashboard')
      }}
      mainClassName="flex-col-main"
    >
      <div className="report-page-container">
        {/* Filter Card */}
        <div className="report-search-card">
          <div className="report-search-header">
            <span>NOTE : FIELDS MARKED WITH (*) ARE REQUIRED</span>
          </div>

          <div className="report-search-body">
            {/* From Date */}
            <div className="search-field">
              <label>From Date</label>
              <CustomDatePicker
                value={fromDate}
                onChange={setFromDate}
                placeholder="Select From Date"
              />
            </div>

            {/* To Date */}
            <div className="search-field">
              <label>To Date</label>
              <CustomDatePicker
                value={toDate}
                onChange={setToDate}
                placeholder="Select To Date"
              />
            </div>

            {/* HU Number Dropdown */}
            <div className="search-field">
              <label>HU Number</label>
              <SearchableDropdown
                options={displayHuOptions}
                value={selectedHu}
                onChange={(val) => setSelectedHu(val || '')}
                placeholder="Select HU Number"
                searchPlaceholder="Search HU Number..."
                isAsync={true}
                onSearchChange={setHuSearchTerm}
                isLoading={isHuSearching}
                valueKey="id"
                closeOnSelect={true}
              />
            </div>

            {/* Action Buttons */}
            <div className="search-buttons">
              <SearchButton
                onClick={handleSearch}
                disabled={isLoading}
              />
              <ClearButton
                onClick={handleClear}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {error && <div className="report-error-banner">{error}</div>}

        {/* Stats Sub-Header */}
        <ReportStatsHeader
          storeName={activeFilters.hu ? `HU: ${activeFilters.hu}` : 'ALL HU'}
          fromDate={activeFilters.fromDate}
          toDate={activeFilters.toDate}
        />

        {/* 4 KPI Curved Cards (Matching Legacy Screenshot) */}
        <div className="report-curved-cards">
          <div className="ds-kpi-item">
            <CurvedCard
              title="SELECTED HU NUMBER"
              value={activeFilters.hu || 'ALL HU'}
              waveColor={['#86efac', '#22c55e']}
              icon={<Icons.Check size={20} color="#ffffff" />}
            />
          </div>
          <div className="ds-kpi-item">
            <CurvedCard
              title="TOTAL HU COUNT"
              value={summary.recordCount.toLocaleString('en-IN')}
              waveColor={['#fdba74', '#f97316']}
              icon={<Icons.Package size={20} color="#ffffff" />}
            />
          </div>
          <div className="ds-kpi-item">
            <CurvedCard
              title="TOTAL ARTICLE COUNT"
              value={summary.actualCount.toLocaleString('en-IN')}
              waveColor={['#7dd3fc', '#0284c7']}
              icon={<Icons.FileText size={20} color="#ffffff" />}
            />
          </div>
          <div className="ds-kpi-item">
            <CurvedCard
              title="TOTAL SCANNED COUNT"
              value={summary.scanCount.toLocaleString('en-IN')}
              waveColor={['#f472b6', '#db2777']}
              icon={<Icons.ScanLine size={20} color="#ffffff" />}
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="report-table-wrapper" style={{ marginTop: '8px' }}>
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
            reportName="HU_SUMMARY_VALIDATION"
            exportFilters={exportFilters}
            exportFileName={`HU_Summary_Report_${activeFilters.fromDate}_${activeFilters.toDate}.xlsx`}
            searchPlaceholder="Search Records"
            onSearch={(term) => {
              setSearchTerm(term);
              setPageIndex(1);
            }}
          />
        </div>
      </div>
    </AppLayout>
  );
}
