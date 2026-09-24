import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import CustomDatePicker from '../../components/common/CustomDatePicker';
import CurvedCard from '../../components/common/CurvedCard';
import ReportStatsHeader from '../../components/common/ReportStatsHeader';
import { ClearButton, BackButton } from '../../components/common/ReportActionButton';
import { getWHEncodingDetails } from '../../services/stockService';
import { dateRenderer, numRenderer } from '../../utils/dashboardColumns';
import * as Icons from 'lucide-react';
import './common-reports.css';
import './WHEncodingSummary.css';

// ---- EPC Range definition with exact DB column mappings ----
const EPC_RANGES = [
  { key: '8TO9',   dataKey: 'N8_TO_9',   errKey: 'N8_TO_9_ERR',   label: '8 TO 9',   summaryKey: 'c8TO9',   summaryErrKey: 'c8TO9_ERR' },
  { key: '9TO10',  dataKey: 'N9_TO_10',  errKey: 'N9_TO_10_ERR',  label: '9 TO 10',  summaryKey: 'c9TO10',  summaryErrKey: 'c9TO10_ERR' },
  { key: '10TO11', dataKey: 'N10_TO_11', errKey: 'N10_TO_11_ERR', label: '10 TO 11', summaryKey: 'c10TO11', summaryErrKey: 'c10TO11_ERR' },
  { key: '11TO12', dataKey: 'N11_TO_12', errKey: 'N11_TO_12_ERR', label: '11 TO 12', summaryKey: 'c11TO12', summaryErrKey: 'c11TO12_ERR' },
  { key: '12TO1',  dataKey: 'N12_TO_1',  errKey: 'N12_TO_1_ERR',  label: '12 TO 1',  summaryKey: 'c12TO13', summaryErrKey: 'c12TO13_ERR' },
  { key: '1TO2',   dataKey: 'N1_TO_2',   errKey: 'N1_TO_2_ERR',   label: '1 TO 2',   summaryKey: 'c13TO14', summaryErrKey: 'c13TO14_ERR' },
  { key: '2TO3',   dataKey: 'N2_TO_3',   errKey: 'N2_TO_3_ERR',   label: '2 TO 3',   summaryKey: 'c14TO15', summaryErrKey: 'c14TO15_ERR' },
  { key: '3TO4',   dataKey: 'N3_TO_4',   errKey: 'N3_TO_4_ERR',   label: '3 TO 4',   summaryKey: 'c15TO16', summaryErrKey: 'c15TO16_ERR' },
  { key: '4TO5',   dataKey: 'N4_TO_5',   errKey: 'N4_TO_5_ERR',   label: '4 TO 5',   summaryKey: 'c16TO17', summaryErrKey: 'c16TO17_ERR' },
  { key: '5TO6',   dataKey: 'N5_TO_6',   errKey: 'N5_TO_6_ERR',   label: '5 TO 6',   summaryKey: 'c17TO18', summaryErrKey: 'c17TO18_ERR' },
  { key: '6TO7',   dataKey: 'N6_TO_7',   errKey: 'N6_TO_7_ERR',   label: '6 TO 7',   summaryKey: 'c18TO19', summaryErrKey: 'c18TO19_ERR' },
  { key: '7TO8',   dataKey: 'N7_TO_8',   errKey: 'N7_TO_8_ERR',   label: '7 TO 8',   summaryKey: 'c19TO20', summaryErrKey: 'c19TO20_ERR' },
];

// ---- Helper: date string generators ----
const getSixMonthsAgo = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return d.toISOString().split('T')[0];
};
const getTodayDate = () => new Date().toISOString().split('T')[0];

export default function WHEncodingSummaryPage() {
  const navigate = useNavigate();

  // Filter state
  const [fromDate, setFromDate] = useState(getSixMonthsAgo());
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
    setFromDate(getSixMonthsAgo());
    setToDate(getTodayDate());
    setSelectedUser('');
    setSearchTerm('');
    setSortColumn('ENCODE_DATE');
    setSortDirection('desc');
    setPageIndex(1);
  };

  // ---- Compute total EPC range counts ----
  const totalRangeCount = useMemo(() => {
    return EPC_RANGES.reduce((sum, { key }) => sum + (rangeSummary[key]?.count || 0), 0);
  }, [rangeSummary]);

  const totalRangeError = useMemo(() => {
    return EPC_RANGES.reduce((sum, { key }) => sum + (rangeSummary[key]?.error || 0), 0);
  }, [rangeSummary]);

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
      render: (val, row) => (
        <span className="wh-total-cell">
          {numRenderer(row.TOTAL_ENCODE_EPC ?? row.TOTAL_ENC ?? val ?? 0)}
        </span>
      )
    });

    cols.push({
      key: 'TOTAL_ERROR_EPC',
      label: 'TOTAL ERROR',
      render: (val, row) => {
        const err = row.TOTAL_ERROR_EPC ?? val ?? 0;
        return (
          <span className={err > 0 ? 'wh-error-cell' : 'wh-error-cell--zero'}>
            {numRenderer(err)}
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

  // ---- Helper: compute error % for a range ----
  const getRangeErrorPct = (count, error) => {
    if (!count || count === 0) return 0;
    return ((error / count) * 100).toFixed(1);
  };

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

        {/* EPC Range Breakdown */}
        <div className="wh-range-container">
          <div className="wh-range-label">Total EPC Count By Range</div>
          <div className="wh-range-scroll">
            {EPC_RANGES.map(({ key, label }) => {
              const count = rangeSummary[key]?.count || 0;
              const error = rangeSummary[key]?.error || 0;
              const pct = getRangeErrorPct(count, error);
              return (
                <div key={key} className="wh-range-card">
                  <div className="wh-range-title">{label}</div>
                  <div className="wh-range-stats">
                    <span className="wh-range-check">
                      <Icons.Check size={11} /> {count.toLocaleString('en-IN')}
                    </span>
                    <span className="wh-range-error">
                      <Icons.Triangle size={11} /> {error.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className={`wh-range-pct ${parseFloat(pct) === 0 ? 'wh-range-pct--zero' : ''}`}>
                    {pct}% error
                  </div>
                </div>
              );
            })}
            {/* TOTAL TAGS card */}
            <div className="wh-range-card wh-range-card--total">
              <div className="wh-range-title">TOTAL TAGS</div>
              <div className="wh-range-stats">
                <span className="wh-range-check">
                  <Icons.Check size={11} /> {totalRangeCount.toLocaleString('en-IN')}
                </span>
                <span className="wh-range-error">
                  <Icons.Triangle size={11} /> {totalRangeError.toLocaleString('en-IN')}
                </span>
              </div>
              <div className={`wh-range-pct ${totalRangeCount === 0 ? 'wh-range-pct--zero' : ''}`}>
                {getRangeErrorPct(totalRangeCount, totalRangeError)}% error
              </div>
            </div>
          </div>
        </div>

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
