import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import CustomDatePicker from '../../components/common/CustomDatePicker';
import CurvedCard from '../../components/common/CurvedCard';
import ReportStatsHeader from '../../components/common/ReportStatsHeader';
import { ClearButton, SearchButton } from '../../components/common/ReportActionButton';
import { getVendorHUDiscrepancyData } from '../../services/stockService';
import { dateRenderer, numRenderer } from '../../utils/dashboardColumns';
import * as Icons from 'lucide-react';
import './common-reports.css';

// Helper for date string
const getTodayDate = () => new Date().toISOString().split('T')[0];

export default function VendorDiscrepancySummaryPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Initial parameters from navigation state or defaults
  const initialFromDate = location.state?.fromDate || getTodayDate();
  const initialToDate = location.state?.toDate || getTodayDate();
  const initialVendorCode = location.state?.vendorCode || '';
  const initialVendorName = location.state?.vendorName || '';

  // Filter state
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);
  const [vendorCode, setVendorCode] = useState(initialVendorCode);
  const [vendorName, setVendorName] = useState(initialVendorName);

  // Active query parameters actually used for fetching
  const [activeFilters, setActiveFilters] = useState({
    fromDate: initialFromDate,
    toDate: initialToDate,
    vendorCode: initialVendorCode,
    vendorName: initialVendorName
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
  const [sortColumn, setSortColumn] = useState('DATE');
  const [sortDirection, setSortDirection] = useState('desc');

  // KPI Summary Totals from API Response
  const [summary, setSummary] = useState({
    huCount: 0,
    actualQty: 0,
    scannedQty: 0,
    differenceQty: 0,
    shortQty: 0,
    excessQty: 0
  });

  // Fetch report data from API
  const fetchData = useCallback(async (signal) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getVendorHUDiscrepancyData({
        searchTerm,
        vendorCode: activeFilters.vendorCode,
        fromDate: activeFilters.fromDate,
        toDate: activeFilters.toDate,
        pageIndex,
        pageSize,
        sortColumn,
        sortDirection
      }, signal);

      if (result) {
        const rows = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.Data)
            ? result.Data
            : [];

        setReportData(rows);

        const recCount = result.recordCount ?? result.RecordCount ?? rows.length;
        setTotalRecords(recCount);

        const expQty = result.actualQty ?? result.ActualQty ?? 0;
        const actQty = result.scannedQty ?? result.ScannedQty ?? 0;
        const diffQty = result.differenceQty ?? result.DifferenceQty ?? 0;
        const excQty = result.excessQty ?? result.ExcessQty ?? 0;
        const huTotal = (result.huCount && result.huCount > 0) 
          ? result.huCount 
          : (result.totalCount ?? result.TotalCount ?? 0);

        // Calculate shortQty: Short Qty is the negative variance (diffQty - excQty or based on shortfall)
        const shortQty = diffQty < 0 ? diffQty : (actQty - expQty - excQty);

        setSummary({
          huCount: huTotal,
          actualQty: expQty,     // In SP: ACTUALQTY = Invoice Expected Qty
          scannedQty: actQty,    // In SP: SCANQTY = Physically Scanned Actual Qty
          differenceQty: diffQty,
          shortQty: shortQty,
          excessQty: excQty
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        console.error('Error fetching Vendor HU Discrepancy Report:', err);
        setError('Failed to load Vendor HU Discrepancy Report. Please check parameters and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, activeFilters, pageIndex, pageSize, sortColumn, sortDirection]);

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
      vendorCode,
      vendorName
    });
  };

  // Handle Clear click
  const handleClear = () => {
    const today = getTodayDate();
    setFromDate(today);
    setToDate(today);
    setVendorCode('');
    setVendorName('');
    setSearchTerm('');
    setPageIndex(1);
    setActiveFilters({
      fromDate: today,
      toDate: today,
      vendorCode: '',
      vendorName: ''
    });
  };

  // Auto-detect vendor name from loaded rows if vendorCode was provided without name
  const displayVendorName = useMemo(() => {
    if (activeFilters.vendorName) return activeFilters.vendorName;
    if (activeFilters.vendorCode && reportData?.length > 0) {
      const match = reportData.find(r => (r.VENDOR_CODE || r.vendor_code) === activeFilters.vendorCode);
      if (match?.VENDOR_NAME || match?.vendor_name) {
        return match.VENDOR_NAME || match.vendor_name;
      }
    }
    return '';
  }, [activeFilters.vendorName, activeFilters.vendorCode, reportData]);

  // Columns definition matching legacy requirements & screenshot
  const columns = useMemo(() => [
    {
      key: 'RowNumber',
      label: 'SR.NO',
      className: 'text-center',
      sortable: false,
      render: (val, row, idx) => ((pageIndex - 1) * pageSize) + idx + 1
    },
    {
      key: 'DATE',
      label: 'DATE',
      className: 'text-center',
      render: (val, row) => dateRenderer(val || row?.date || row?.Date || '—')
    },
    {
      key: 'HU_NO',
      label: 'HU NO',
      className: 'text-center',
      render: (val, row) => {
        const hu = val || row?.hu_no || row?.HU_No || row?.hU_NO || row?.HU_NUMBER || '—';
        return (
          <span style={{ color: '#2563eb', fontWeight: 700 }}>
            {hu}
          </span>
        );
      }
    },
    {
      key: 'VENDOR_CODE',
      label: 'VENDOR CODE',
      className: 'text-center',
      render: (val, row) => val || row?.vendor_code || row?.Vendor_Code || row?.VENDOR_CODE || '—'
    },
    {
      key: 'VENDOR_NAME',
      label: 'VENDOR NAME',
      className: 'text-center',
      render: (val, row) => val || row?.vendor_name || row?.Vendor_Name || row?.VENDOR_NAME || '—'
    },
    {
      key: 'ARTICLE_NO',
      label: 'ARTICLE NO',
      className: 'text-center',
      render: (val, row) => val || row?.article_no || row?.Article_No || row?.ARTICLE_NO || '—'
    },
    {
      key: 'ARTICLE_DESCRIPTION',
      label: 'ARTICLE DESCRIPTION',
      className: 'text-left',
      render: (val, row) => val || row?.article_description || row?.Article_Description || row?.ARTICLE_DESCRIPTION || '—'
    },
    {
      key: 'ACTUAL_QTY',
      label: 'EXPECTED QTY',
      className: 'text-center',
      render: (val, row) => {
        const num = Number(val ?? row?.actual_qty ?? row?.Actual_Qty ?? row?.ACTUAL_QTY ?? 0);
        return num.toFixed(2);
      }
    },
    {
      key: 'SCANNED_QTY',
      label: 'ACTUAL QTY',
      className: 'text-center',
      render: (val, row) => {
        const num = Number(val ?? row?.scanned_qty ?? row?.Scanned_Qty ?? row?.SCANNED_QTY ?? 0);
        return num.toFixed(2);
      }
    },
    {
      key: 'DIFFERENCE_QTY',
      label: 'DIFFERENCE QTY',
      className: 'text-center',
      render: (val, row) => {
        const num = Number(val ?? row?.difference_qty ?? row?.Difference_Qty ?? row?.DIFFERENCE_QTY ?? 0);
        const isNegative = num < 0;
        const isPositive = num > 0;
        const color = isNegative ? '#ef4444' : isPositive ? '#16a34a' : '#475569';
        const formatted = `${isPositive ? '+' : ''}${num.toFixed(2)}`;
        return (
          <span style={{ color, fontWeight: 700 }}>
            {formatted}
          </span>
        );
      }
    }
  ], [pageIndex, pageSize]);

  return (
    <AppLayout
      headerProps={{
        breadcrumb: (
          <>
            HOME - PAGES - REPORT - <span className="active">HU DISCREPANCY (VENDOR-WISE) REPORT</span>
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

            {/* Vendor Code */}
            <div className="search-field">
              <label>Vendor Code</label>
              <div className="input-group">
                <input
                  type="text"
                  value={vendorCode}
                  onChange={(e) => setVendorCode(e.target.value.trim())}
                  placeholder="Enter Vendor Code (e.g. 212718)"
                />
                {vendorCode && (
                  <button
                    type="button"
                    className="btn-input-clear"
                    onClick={() => {
                      setVendorCode('');
                      setVendorName('');
                    }}
                    title="Clear Vendor Code"
                  >
                    ×
                  </button>
                )}
              </div>
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
          leftLabel="VENDOR"
          leftValue={
            activeFilters.vendorCode
              ? (displayVendorName ? `${activeFilters.vendorCode} - ${displayVendorName}` : activeFilters.vendorCode)
              : 'ALL VENDORS'
          }
          fromDate={activeFilters.fromDate}
          toDate={activeFilters.toDate}
        />

        {/* 6 KPI Curved Cards (Matching Reference Screenshot) */}
        <div className="report-curved-cards">
          {/* 1. HU COUNT */}
          <div className="ds-kpi-item">
            <CurvedCard
              title="HU COUNT"
              value={summary.huCount.toLocaleString('en-IN')}
              waveColor={['#86efac', '#22c55e']}
              icon={<Icons.ShoppingBag size={20} color="#ffffff" />}
            />
          </div>

          {/* 2. EXPECTED QTY */}
          <div className="ds-kpi-item">
            <CurvedCard
              title="EXPECTED QTY"
              value={summary.actualQty.toLocaleString('en-IN')}
              waveColor={['#f472b6', '#db2777']}
              icon={<Icons.FileText size={20} color="#ffffff" />}
            />
          </div>

          {/* 3. ACTUAL QTY */}
          <div className="ds-kpi-item">
            <CurvedCard
              title="ACTUAL QTY"
              value={summary.scannedQty.toLocaleString('en-IN')}
              waveColor={['#6ee7b7', '#10b981']}
              icon={<Icons.ScanLine size={20} color="#ffffff" />}
            />
          </div>

          {/* 4. NET DIFFERENCE */}
          <div className="ds-kpi-item">
            <CurvedCard
              title="NET DIFFERENCE"
              value={summary.differenceQty.toLocaleString('en-IN')}
              waveColor={['#c084fc', '#9333ea']}
              icon={<Icons.MinusCircle size={20} color="#ffffff" />}
            />
          </div>

          {/* 5. SHORT QTY */}
          <div className="ds-kpi-item">
            <CurvedCard
              title="SHORT QTY"
              value={summary.shortQty.toLocaleString('en-IN')}
              waveColor={['#7dd3fc', '#0284c7']}
              icon={<Icons.ChevronsDown size={20} color="#ffffff" />}
            />
          </div>

          {/* 6. EXCESS QTY */}
          <div className="ds-kpi-item">
            <CurvedCard
              title="EXCESS QTY"
              value={(summary.excessQty > 0 ? `+${summary.excessQty.toLocaleString('en-IN')}` : summary.excessQty.toLocaleString('en-IN'))}
              waveColor={['#fdba74', '#f97316']}
              icon={<Icons.ChevronsUp size={20} color="#ffffff" />}
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
            exportFileName={`HU_Discrepancy_VendorWise_Report_${activeFilters.fromDate}_${activeFilters.toDate}.csv`}
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
