import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Sparkles } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import CustomDatePicker from '../../components/common/CustomDatePicker';
import CurvedCard from '../../components/common/CurvedCard';
import ReportStatsHeader from '../../components/common/ReportStatsHeader';
import TagCleaningDetailModal from '../../components/modals/TagCleaningDetailModal';
import { SearchButton, ClearButton } from '../../components/common/ReportActionButton';
import { getTagCleaningReport } from '../../services/stockService';
import { dateRenderer } from '../../utils/dashboardColumns';
import './common-reports.css';

export default function TagCleaningReportPage() {
  const navigate = useNavigate();

  // Helper to format date as YYYY-MM-DD
  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Compute default date range (Last 7 days)
  const { defaultFromDate, defaultToDate } = useMemo(() => {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 7);
    return {
      defaultFromDate: formatDate(past),
      defaultToDate: formatDate(today)
    };
  }, []);

  // Filter form state
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);

  // Active applied query state
  const [appliedFilters, setAppliedFilters] = useState({
    fromDate: defaultFromDate,
    toDate: defaultToDate,
    searchTerm: ''
  });

  // Table pagination & sorting state
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState('TAG_CLEANED_DATE');
  const [sortDirection, setSortDirection] = useState('desc');

  // Data & loading state
  const [reportData, setReportData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summaryStats, setSummaryStats] = useState({
    totalValidatedCount: 0,
    totalCleanedCount: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Detail Modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailModalDate, setDetailModalDate] = useState('');
  const [detailModalRowData, setDetailModalRowData] = useState(null);

  // Open detail modal for a specific row
  const openDetailModal = (row) => {
    const rawDate =
      row?.TAG_CLEANED_DATE ||
      row?.taG_CLEANED_DATE ||
      row?.tagCleanedDate ||
      row?.tag_CLEANED_DATE ||
      row?.Tag_Cleaned_Date ||
      row?.inward_DATE ||
      row?.INWARD_DATE ||
      row?.Date ||
      row?.date;
    setDetailModalDate(rawDate || '');
    setDetailModalRowData(row);
    setIsDetailModalOpen(true);
  };

  // Fetch report data from API
  const fetchData = useCallback(async (signal) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getTagCleaningReport({
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
          totalValidatedCount: response.totalValidatedCount ?? response.TotalValidatedCount ?? 0,
          totalCleanedCount: response.totalCleanedCount ?? response.TotalCleanedCount ?? response.totalCount ?? response.TotalCount ?? 0
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        console.error('Failed to load Tag Cleaning Report:', err);
        setError('Failed to fetch Tag Cleaning report data. Please check your network or try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters, pageIndex, pageSize, sortColumn, sortDirection]);

  // Load data on filter/pagination changes
  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  // Handle Search click
  const handleSearch = () => {
    setPageIndex(1);
    setAppliedFilters((prev) => ({
      ...prev,
      fromDate,
      toDate
    }));
  };

  // Handle Clear click
  const handleClear = () => {
    setFromDate(defaultFromDate);
    setToDate(defaultToDate);
    setPageIndex(1);
    setAppliedFilters({
      fromDate: defaultFromDate,
      toDate: defaultToDate,
      searchTerm: ''
    });
  };

  // Table search handler (in-table search keyword)
  const handleTableSearch = (term) => {
    setPageIndex(1);
    setAppliedFilters((prev) => ({
      ...prev,
      searchTerm: term
    }));
  };

  // Define table columns matching the legacy UI
  const columns = useMemo(() => [
    {
      key: 'SR_NO',
      label: 'SR.NO',
      align: 'center',
      width: '90px',
      sortable: false,
      render: (val, row, idx) => (
        <span style={{ fontWeight: 600, color: '#475569' }}>
          {row?.RowNumber || row?.rowNumber || row?.srNo || row?.sR_NO || row?.SR_NO || ((pageIndex - 1) * pageSize + idx + 1)}
        </span>
      )
    },
    {
      key: 'TAG_CLEANED_DATE',
      label: 'TAG CLEANED DATE',
      align: 'center',
      sortable: true,
      render: (val, row) => {
        const rawDate = 
          val || 
          row?.taG_CLEANED_DATE || 
          row?.tagCleanedDate || 
          row?.tag_CLEANED_DATE || 
          row?.TAG_CLEANED_DATE || 
          row?.Tag_Cleaned_Date || 
          row?.inward_DATE || 
          row?.INWARD_DATE || 
          row?.Date || 
          row?.date;
        return (
          <span style={{ fontWeight: 600, color: '#1e293b' }}>
            {rawDate ? (dateRenderer(rawDate) || String(rawDate).slice(0, 10)) : '—'}
          </span>
        );
      }
    },
    {
      key: 'TOTAL_VALIDATED_QTY',
      label: 'TOTAL VALIDATED QTY',
      align: 'center',
      sortable: true,
      render: (val, row) => {
        const qty = 
          val ?? 
          row?.totalValidatedQty ?? 
          row?.totaL_VALIDATED_QTY ?? 
          row?.total_VALIDATED_QTY ?? 
          row?.TOTAL_VALIDATED_QTY ?? 
          0;
        return (
          <span
            className="vmm-clickable-cell"
            style={{
              fontWeight: 700,
              color: '#16a34a',
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationStyle: 'dotted',
              textUnderlineOffset: '3px'
            }}
            onClick={(e) => {
              e.stopPropagation();
              openDetailModal(row);
            }}
            title="Click to view store-level breakdown"
          >
            {Number(qty).toLocaleString('en-IN')}
          </span>
        );
      }
    },
    {
      key: 'TOTAL_CLEANED_QTY',
      label: 'TOTAL CLEANED QTY',
      align: 'center',
      sortable: true,
      render: (val, row) => {
        const qty = 
          val ?? 
          row?.totalCleanedQty ?? 
          row?.totaL_CLEANED_QTY ?? 
          row?.total_CLEANED_QTY ?? 
          row?.TOTAL_CLEANED_QTY ?? 
          row?.total_COUNT ?? 
          0;
        return (
          <span
            className="vmm-clickable-cell"
            style={{
              fontWeight: 700,
              color: '#9333ea',
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationStyle: 'dotted',
              textUnderlineOffset: '3px'
            }}
            onClick={(e) => {
              e.stopPropagation();
              openDetailModal(row);
            }}
            title="Click to view store-level breakdown"
          >
            {Number(qty).toLocaleString('en-IN')}
          </span>
        );
      }
    }
  ], [pageIndex, pageSize]);

  // Export filters for universal streaming export
  const exportFilters = useMemo(() => ({
    fromDate: appliedFilters.fromDate,
    toDate: appliedFilters.toDate
  }), [appliedFilters.fromDate, appliedFilters.toDate]);

  return (
    <AppLayout
      headerProps={{
        breadcrumb: (
          <>
            HOME - PAGES - REPORTS - <span className="active">TAG CLEANING</span>
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

      {/* Date Range Subheader Banner */}
      <ReportStatsHeader
        leftLabel="MODULE"
        leftValue="TAG CLEANING"
        fromDate={appliedFilters.fromDate}
        toDate={appliedFilters.toDate}
      />

      {/* KPI Cards Row */}
      <div className="ds-kpi-row" style={{ marginTop: '12px' }}>
        <div className="ds-kpi-item" style={{ flex: 1 }}>
          <CurvedCard
            title="TOTAL VALIDATED QTY"
            value={summaryStats.totalValidatedCount.toLocaleString('en-IN')}
            waveColor={['#86efac', '#22c55e']}
            icon={<CheckCircle size={20} color="#ffffff" />}
          />
        </div>
        <div className="ds-kpi-item" style={{ flex: 1 }}>
          <CurvedCard
            title="TOTAL CLEANED QTY"
            value={summaryStats.totalCleanedCount.toLocaleString('en-IN')}
            waveColor={['#c084fc', '#9333ea']}
            icon={<Sparkles size={20} color="#ffffff" />}
          />
        </div>
      </div>

      {/* Report Data Table Card */}
      <div className="report-table-wrapper" style={{ marginTop: '12px' }}>
        <ReportDataTableCard
          title="Tag Cleaning Data"
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
            setSortColumn(col || 'TAG_CLEANED_DATE');
            setSortDirection(dir || 'desc');
            setPageIndex(1);
          }}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSearch={handleTableSearch}
          searchPlaceholder="Search Records..."
          reportName="TAG_CLEANING_REPORT"
          exportFilters={exportFilters}
          exportFileName={`Tag_Cleaning_Report_${appliedFilters.fromDate}_to_${appliedFilters.toDate}.xlsx`}
        />
      </div>

      {/* Tag Cleaning Detail Modal */}
      <TagCleaningDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        rowDate={detailModalDate}
        rowData={detailModalRowData}
      />
    </AppLayout>
  );
}
