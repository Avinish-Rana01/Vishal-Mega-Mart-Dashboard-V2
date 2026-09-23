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
import './HuReport.css';
import { getHuDetails, searchValidationHuNumbers } from '../../services/stockService';
import { dateRenderer } from '../../utils/dashboardColumns';
import * as Icons from 'lucide-react';
import HuDetailsModal from '../../components/modals/HuDetailsModal';

export default function HuReportPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Helper for date formatting
  const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // State initialization from navigation or defaults
  // Note: both fromDate & toDate default to same date per user confirmation
  const initialPlant = location.state?.receivingPlant || location.state?.storeCode || 'HD44';
  const initialStatus = location.state?.huStatus !== undefined ? String(location.state.huStatus) : '1';
  const initialDate = location.state?.date || location.state?.fromDate || getTodayDate();

  const [huStatus, setHuStatus] = useState(initialStatus);
  const [receivingPlant, setReceivingPlant] = useState(initialPlant);
  const [huNumber, setHuNumber] = useState('');
  const [fromDate, setFromDate] = useState(initialDate);
  const [toDate, setToDate] = useState(initialDate);

  // HU Status dropdown options (Only Processed HU and Unprocessed HU, no "All")
  const statusOptions = useMemo(() => [
    { id: '1', text: 'Processed HU', value: '1' },
    { id: '0', text: 'Unprocessed HU', value: '0' }
  ], []);

  // Table Data State
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHuRow, setSelectedHuRow] = useState(null);

  // Pagination & Sorting
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('HU_Number');
  const [sortDirection, setSortDirection] = useState('asc');

  // KPI Totals
  const [totals, setTotals] = useState({
    recordCount: 0,
    materialQty: 0,
    actualQty: 0,
    scannedQty: 0,
    invalidTags: 0
  });

  // HU Number Options derived from current table data
  const tableHuOptions = useMemo(() => {
    if (!reportData || reportData.length === 0) return [];
    const seen = new Set();
    const list = [];
    for (const row of reportData) {
      const hu = row.HU_Number || row.Hu_Number || row.HUNO || row.hu_number;
      if (hu && !seen.has(String(hu))) {
        seen.add(String(hu));
        list.push({ id: String(hu), value: String(hu), text: String(hu) });
      }
    }
    return list;
  }, [reportData]);

  // HU Number Autocomplete / Searchable dropdown options
  const [huSearchTerm, setHuSearchTerm] = useState('');
  const [huOptions, setHuOptions] = useState([]);
  const [isHuSearching, setIsHuSearching] = useState(false);

  // Sync HU options: use table data by default; only call search API when user actively types a search query
  useEffect(() => {
    const trimmed = huSearchTerm.trim();
    if (!trimmed) {
      setHuOptions(tableHuOptions);
      setIsHuSearching(false);
      return;
    }

    const controller = new AbortController();
    const delayDebounceFn = setTimeout(async () => {
      setIsHuSearching(true);
      try {
        const data = await searchValidationHuNumbers({
          huStatus,
          receivingPlant,
          fromDate,
          toDate,
          searchTerm: trimmed
        }, controller.signal);

        setHuOptions(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Failed to search HU numbers", err);
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
  }, [huSearchTerm, huStatus, receivingPlant, fromDate, toDate, tableHuOptions]);

  // Fetch HU details
  const fetchReportData = useCallback(async (signal) => {
    setIsLoading(true);
    setReportData([]);
    setError(null);
    try {
      const result = await getHuDetails({
        receivingPlant,
        huStatus,
        fromDate,
        toDate,
        huNo: huNumber,
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
        recordCount: result?.recordCount || result?.RecordCount || 0,
        materialQty: result?.materialQty ?? result?.MaterialQty ?? 0,
        actualQty: result?.actualQty ?? result?.ActualQty ?? 0,
        scannedQty: result?.scannedQty ?? result?.ScannedQty ?? 0,
        invalidTags: result?.invalidTags ?? result?.InvalidTags ?? 0
      });
    } catch (err) {
      if (err.name !== 'AbortError' && err.message !== 'canceled' && err.code !== 'ERR_CANCELED') {
        setError(err.message || 'Failed to fetch HU details.');
        setReportData([]);
      }
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [receivingPlant, huStatus, fromDate, toDate, huNumber, pageIndex, pageSize, searchTerm, sortColumn, sortDirection]);

  useEffect(() => {
    const controller = new AbortController();
    fetchReportData(controller.signal);
    return () => controller.abort();
  }, [fetchReportData]);

  const handleClear = () => {
    setHuStatus(initialStatus);
    setReceivingPlant(initialPlant);
    setHuNumber('');
    setHuSearchTerm('');
    setFromDate(initialDate);
    setToDate(initialDate);
    setSearchTerm('');
    setSortColumn('HU_Number');
    setSortDirection('asc');
    setPageIndex(1);
  };

  // Table Columns matching user's screenshot
  const columns = useMemo(() => [
    {
      key: 'RowNumber',
      label: 'SR.NO',
      render: (val, row, idx) => ((pageIndex - 1) * pageSize) + idx + 1
    },
    {
      key: 'Sending_Plant',
      label: 'SENDING PLANT',
      render: (val) => val || '—'
    },
    {
      key: 'Receiving_Plant',
      label: 'RECEIVING PLANT',
      render: (val) => val || '—'
    },
    {
      key: 'HU_Number',
      label: 'HU NUMBER',
      render: (val, row) => (
        <span
          className="hu-drilldown-link"
          title={`Click to view details for HU: ${val}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedHuRow(row);
          }}
        >
          {val || '—'}
        </span>
      )
    },
    {
      key: 'MATERIAL_COUNT',
      label: 'MATERIAL COUNT',
      render: (val) => (typeof val === 'number' ? val.toLocaleString('en-IN') : (val ?? 0))
    },
    {
      key: 'Act_Qty',
      label: 'ACTUAL QUANTITY',
      render: (val) => (typeof val === 'number' ? val.toLocaleString('en-IN') : (val ?? 0))
    },
    {
      key: 'Scan_Qty',
      label: 'SCANNED QUANTITY',
      render: (val) => (typeof val === 'number' ? val.toLocaleString('en-IN') : (val ?? 0))
    },
    {
      key: 'Status',
      label: 'STATUS',
      render: (val) => val || '—'
    },
    {
      key: 'Scan_Date',
      label: 'SCANNED DATE',
      render: (val) => dateRenderer(val)
    },
    {
      key: 'HU_Created_By',
      label: 'HU CREATED BY',
      render: (val, row) => val || row?.HU_Created_By || '—'
    },
    {
      key: 'HU_Validation_By',
      label: 'HU VALIDATED BY',
      render: (val, row) => val || row?.HU_Validation_By || row?.Hu_Validation_By || '—'
    }
  ], [pageIndex, pageSize, huStatus]);

  const displayStatusLabel = useMemo(() => {
    if (huStatus === '0') return 'UNPROCESSED HU';
    return 'PROCESSED HU';
  }, [huStatus]);

  return (
    <AppLayout
      headerProps={{
        breadcrumb: (
          <>
            HOME - PAGES - REPORT - <span className="active">HU VALIDATION REPORT</span>
          </>
        ),
        showBackButton: true,
        onBackClick: () => navigate(-1)
      }}
    >
      <div className="hu-report-page-container">
        {/* Filter Card */}
        <div className="report-search-card">
          <div className="report-search-header">
            <span>NOTE : FIELDS MARKED WITH (*) ARE REQUIRED</span>
          </div>
          <div className="report-search-body">
            <div className="search-field" style={{ minWidth: '170px' }}>
              <label>HU Status *</label>
              <SearchableDropdown
                value={huStatus}
                onChange={(val) => {
                  setHuStatus(val || '1');
                  setPageIndex(1);
                }}
                options={statusOptions}
                placeholder="Select HU Status"
                closeOnSelect={true}
              />
            </div>

            <div className="search-field">
              <label>Receiving Plant *</label>
              <div className="input-group">
                <input
                  type="text"
                  value={receivingPlant}
                  onChange={(e) => setReceivingPlant(e.target.value.toUpperCase())}
                  placeholder="Enter Plant (e.g. HD44)"
                />
                {receivingPlant && (
                  <button
                    type="button"
                    className="btn-input-clear"
                    onClick={() => setReceivingPlant('')}
                    title="Clear Plant"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="search-field" style={{ minWidth: '180px' }}>
              <label>HU Number</label>
              <SearchableDropdown
                value={huNumber}
                onChange={(val) => {
                  setHuNumber(val || '');
                  setPageIndex(1);
                }}
                options={huOptions}
                placeholder="Select HU Number"
                searchPlaceholder="Search HU Number..."
                isAsync={true}
                onSearchChange={setHuSearchTerm}
                isLoading={isHuSearching}
                closeOnSelect={true}
              />
            </div>

            <div className="search-field">
              <label>From Date</label>
              <CustomDatePicker value={fromDate} onChange={setFromDate} />
            </div>

            <div className="search-field">
              <label>To Date</label>
              <CustomDatePicker value={toDate} onChange={setToDate} />
            </div>

            <div className="search-buttons">
              <ClearButton
                onClick={handleClear}
                disabled={isLoading}
              />
              <BackButton
                onClick={() => navigate('/reports/dc-report', { state: { storeCode: receivingPlant } })}
                label="Back to DC Summary"
              />
            </div>
          </div>
        </div>

        {error && <div className="report-error-banner">{error}</div>}

        {/* Selected Status / Date Subheader Bar */}
        <ReportStatsHeader 
            leftLabel="HU STATUS"
            leftValue={receivingPlant ? `${displayStatusLabel} | PLANT: ${receivingPlant}` : displayStatusLabel}
            fromDate={fromDate}
            toDate={toDate}
          />

        {/* 5 Curved KPI Cards */}
        <div className="hu-curved-cards">
          <CurvedCard
            title="HU COUNT"
            value={totals.recordCount.toLocaleString('en-IN')}
            waveColor={['#7dd3fc', '#0284c7']}
            icon={<Icons.Package size={20} color="#ffffff" />}
          />
          <CurvedCard
            title="MATERIAL COUNT"
            value={totals.materialQty.toLocaleString('en-IN')}
            waveColor={['#f472b6', '#db2777']}
            icon={<Icons.Layers size={20} color="#ffffff" />}
          />
          <CurvedCard
            title="ACTUAL QTY"
            value={totals.actualQty.toLocaleString('en-IN')}
            waveColor={['#c084fc', '#9333ea']}
            icon={<Icons.FileText size={20} color="#ffffff" />}
          />
          <CurvedCard
            title="SCANNED QTY"
            value={totals.scannedQty.toLocaleString('en-IN')}
            waveColor={['#fcd34d', '#ea580c']}
            icon={<Icons.ScanLine size={20} color="#ffffff" />}
          />
          <CurvedCard
            title="INVALID TAGS"
            value={totals.invalidTags.toLocaleString('en-IN')}
            waveColor={['#86efac', '#22c55e']}
            icon={<Icons.Tag size={20} color="#ffffff" />}
          />
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
            exportFileName={`HU_Report_${receivingPlant}_${huStatus}_${fromDate}.csv`}
            searchPlaceholder="Search Records"
            onSearch={(term) => setSearchTerm(term)}
          />
        </div>

        {selectedHuRow && (
          <HuDetailsModal
            huRow={selectedHuRow}
            huStatus={huStatus}
            fromDate={fromDate}
            toDate={toDate}
            onClose={() => setSelectedHuRow(null)}
          />
        )}
      </div>
    </AppLayout>
  );
}
