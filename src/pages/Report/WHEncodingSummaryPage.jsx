import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import CustomDatePicker from '../../components/common/CustomDatePicker';
import CurvedCard from '../../components/common/CurvedCard';
import ReportStatsHeader from '../../components/common/ReportStatsHeader';
import { ClearButton, BackButton } from '../../components/common/ReportActionButton';
import { getWHEncodingDetails } from '../../services/stockService';
import { dateRenderer, numRenderer, numRendererRed } from '../../utils/dashboardColumns';
import EpcRangeBreakdown, { DEFAULT_EPC_RANGES as EPC_RANGES } from '../../components/common/EpcRangeBreakdown';
import * as Icons from 'lucide-react';
import './common-reports.css';
import './WHEncodingSummary.css';

// ---- Helper: date string generator ----
const getTodayDate = () => new Date().toISOString().split('T')[0];

export default function WHEncodingSummaryPage() {
  const navigate = useNavigate();

  // Filter state - default to current date
  const [fromDate, setFromDate] = useState(getTodayDate());
  const [toDate, setToDate] = useState(getTodayDate());
  const [selectedUser, setSelectedUser] = useState('');

  // Data state
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

  // Summary KPI totals from API
  const [summary, setSummary] = useState({
    totalCount: 0,
    userCount: 0,
    encQty: 0,
    errorQty: 0,
    mrgQty: 0,
    avgQty: 0,
    t_ENC_QTY: 0,
    t_ENC_USERS: 0,
  });

  // EPC Range summary data
  const [rangeSummary, setRangeSummary] = useState({});

  // ---- Fetch data ----
  const fetchData = useCallback(async (signal) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getWHEncodingDetails({
        searchTerm,
        pageIndex,
        pageSize,
        user: selectedUser,
        fromDate,
        toDate,
        sortColumn,
        sortDirection
      }, signal);

      const items = result?.data || result?.Data || [];
      setReportData(items);
      setTotalRecords(result?.recordCount ?? result?.RecordCount ?? 0);

      // Summary KPIs
      setSummary({
        totalCount: result?.totalCount ?? result?.TotalCount ?? 0,
        userCount: result?.userCount ?? result?.UserCount ?? 0,
        encQty: result?.encqty ?? result?.ENCQTY ?? 0,
        errorQty: result?.errorqty ?? result?.ERRORQTY ?? 0,
        mrgQty: result?.mrgqty ?? result?.MRGQTY ?? 0,
        avgQty: result?.avgqty ?? result?.AVGQTY ?? 0,
        t_ENC_QTY: result?.t_ENC_QTY ?? result?.T_ENC_QTY ?? 0,
        t_ENC_USERS: result?.t_ENC_USERS ?? result?.T_ENC_USERS ?? 0,
      });

      // EPC Range summary
      const ranges = {};
      EPC_RANGES.forEach(({ key, summaryKey, summaryErrKey }) => {
        ranges[key] = {
          count: result?.[summaryKey] ?? result?.[summaryKey.toUpperCase()] ?? 0,
          error: result?.[summaryErrKey] ?? result?.[summaryErrKey.toUpperCase()] ?? 0,
        };
      });
      setRangeSummary(ranges);
    } catch (err) {
      if (err.name !== 'AbortError' && err.message !== 'canceled' && err.code !== 'ERR_CANCELED') {
        setError(err.message || 'Failed to fetch encoding details.');
        setReportData([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, pageIndex, pageSize, selectedUser, fromDate, toDate, sortColumn, sortDirection]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  // ---- Handlers ----
  const handleClear = () => {
    setFromDate(getTodayDate());
    setToDate(getTodayDate());
    setSelectedUser('');
    setSearchTerm('');
    setSortColumn('ENCODE_DATE');
    setSortDirection('desc');
    setPageIndex(1);
  };

  // ---- Table Columns ----
  const columns = useMemo(() => {
    const cols = [
      {
        key: 'RowNumber',
        label: 'SR.NO',
        render: (val, row, idx) => ((pageIndex - 1) * pageSize) + idx + 1
      },
      {
        key: 'ENCODE_DATE',
        label: 'DATE',
        render: (val, row) => dateRenderer(row.ENCODE_DATE ?? val)
      },
      {
        key: 'User_Name',
        label: 'USER',
        render: (val, row) => row.User_Name ?? row.ENCODE_USER ?? row.Encode_By ?? val ?? '-'
      },
    ];

    // Add 12 range columns
    EPC_RANGES.forEach(({ dataKey, label }) => {
      cols.push({
        key: dataKey,
        label: label,
        subLabel: '↑ ENC',
        render: (val, row) => numRenderer(row[dataKey] ?? val ?? 0)
      });
    });

    // Total count, error and error %
    cols.push({
      key: 'TOTAL_ENCODE_EPC',
      label: 'TOTAL COUNT',
      className: 'wh-col-total-count',
      render: (val, row) => (
        <span className="wh-badge-count">
          {(row.TOTAL_ENCODE_EPC ?? row.TOTAL_ENC ?? val ?? 0).toLocaleString('en-IN')}
        </span>
      )
    });

    cols.push({
      key: 'TOTAL_ERROR_EPC',
      label: 'TOTAL ERROR',
      className: 'wh-col-total-error',
      render: (val, row) => {
        const err = row.TOTAL_ERROR_EPC ?? val ?? 0;
        return (
          <span className={err > 0 ? 'wh-badge-error' : 'wh-badge-error--zero'}>
            {err.toLocaleString('en-IN')}
          </span>
        );
      }
    });

    cols.push({
      key: 'ERR_PER',
      label: 'TOTAL ERROR %',
      render: (val, row) => {
        const pct = parseFloat(row.ERR_PER ?? row.ERROR_PERCENT ?? val ?? 0);
        return (
          <span className={pct > 0 ? 'wh-error-cell' : 'wh-error-cell--zero'}>
            {pct.toFixed(2)}%
          </span>
        );
      }
    });

    return cols;
  }, [pageIndex, pageSize]);

  return (
    <AppLayout
      headerProps={{
        breadcrumb: (
          <>
            HOME - PAGES - REPORT - <span className="active">WAREHOUSE ENCODING SUMMARY REPORT</span>
          </>
        ),
        showBackButton: true,
        onBackClick: () => navigate('/dashboard')
      }}
    >
      <div className="wh-encoding-page">
        {/* Filter Card */}
        <div className="report-search-card">
          <div className="report-search-header">
            <span>NOTE : FIELDS MARKED WITH (*) ARE REQUIRED</span>
          </div>
          <div className="report-search-body">
            <div className="search-field">
              <label>From Date *</label>
              <CustomDatePicker value={fromDate} onChange={(val) => { setFromDate(val); setPageIndex(1); }} />
            </div>

            <div className="search-field">
              <label>To Date</label>
              <CustomDatePicker value={toDate} onChange={(val) => { setToDate(val); setPageIndex(1); }} />
            </div>

            <div className="search-field">
              <label>Username</label>
              <div className="input-group">
                <input
                  type="text"
                  value={selectedUser}
                  onChange={(e) => { setSelectedUser(e.target.value); setPageIndex(1); }}
                  placeholder="Select User"
                />
                {selectedUser && (
                  <button
                    type="button"
                    className="btn-input-clear"
                    onClick={() => setSelectedUser('')}
                    title="Clear User"
                  >
                    ×
                  </button>
                )}
              </div>
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

        {/* Stats Sub-header */}
        <ReportStatsHeader
          storeName={selectedUser ? `USER: ${selectedUser}` : 'ALL USERS'}
          fromDate={fromDate}
          toDate={toDate}
        />

        {/* 5 KPI Curved Cards */}
        <div className="report-curved-cards">
          <div className="ds-kpi-item">
            <CurvedCard
              title="TOTAL MACHINES USED"
              value={(summary.userCount || summary.t_ENC_USERS || 0).toLocaleString('en-IN')}
              waveColor={['#f472b6', '#db2777']}
              icon={<Icons.Monitor size={20} color="#ffffff" />}
            />
          </div>
          <div className="ds-kpi-item">
            <CurvedCard
              title="TOTAL ENCODED"
              value={(summary.totalCount || summary.encQty || summary.t_ENC_QTY || 0).toLocaleString('en-IN')}
              waveColor={['#86efac', '#22c55e']}
              icon={<Icons.Tag size={20} color="#ffffff" />}
            />
          </div>
          <div className="ds-kpi-item">
            <CurvedCard
              title="TOTAL ENCODING ERROR"
              value={(summary.errorQty || 0).toLocaleString('en-IN')}
              waveColor={['#fca5a5', '#ef4444']}
              icon={<Icons.AlertTriangle size={20} color="#ffffff" />}
            />
          </div>
          <div className="ds-kpi-item">
            <CurvedCard
              title="TOTAL ENCODING MTD"
              value={(summary.mrgQty || 0).toLocaleString('en-IN')}
              waveColor={['#c084fc', '#9333ea']}
              icon={<Icons.BarChart3 size={20} color="#ffffff" />}
            />
          </div>
          <div className="ds-kpi-item">
            <CurvedCard
              title="AVG ENCODING MTD"
              value={(summary.avgQty || 0).toLocaleString('en-IN')}
              waveColor={['#67e8f9', '#06b6d4']}
              icon={<Icons.TrendingUp size={20} color="#ffffff" />}
            />
          </div>
        </div>

        {/* Reusable EPC Range Breakdown Component */}
        <EpcRangeBreakdown rangeSummary={rangeSummary} />

        {/* Data Table */}
        <div className="report-table-wrapper" style={{ marginTop: '6px' }}>
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
            exportFileName={`WH_Encoding_Summary_${fromDate}_${toDate}.csv`}
            searchPlaceholder="Search Records"
            onSearch={(term) => { setSearchTerm(term); setPageIndex(1); }}
          />
        </div>
      </div>
    </AppLayout>
  );
}
