import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Package, Building2, Store, Clock, AlertTriangle } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import CustomDatePicker from '../../components/common/CustomDatePicker';
import CurvedCard from '../../components/common/CurvedCard';
import ReportStatsHeader from '../../components/common/ReportStatsHeader';
import { getReportStores, getStoreGrcReport } from '../../services/stockService';
import './StoreGrcReport.css';

export default function StoreGrcReportPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to format date without timezone shift
  const formatDate = (date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  // Determine dates for past 7 days by default, or from passed rowDate
  const rowDate = location.state?.rowDate;
  let defaultToDate, defaultFromDate;

  if (rowDate) {
    // The API might send "2026-07-19 12:00 AM Sunday". Extract just the date part.
    const dateOnlyStr = String(rowDate).split(' ')[0];
    let passedDate = new Date(dateOnlyStr);
    
    // If it failed to parse natively, try to parse DD-MM-YYYY or DD-MMM-YYYY manually
    if (isNaN(passedDate)) {
      const parts = dateOnlyStr.split(/[-/]/);
      if (parts.length >= 3 && parts[0].length === 2 && parts[2].length === 4) {
        let monthStr = parts[1];
        if (isNaN(monthStr)) {
          const mNames = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
          monthStr = mNames[monthStr.toLowerCase()] || '01';
        }
        passedDate = new Date(`${parts[2]}-${monthStr}-${parts[0]}`);
      }
    }

    if (!isNaN(passedDate)) {
      defaultToDate = formatDate(passedDate);
      const lastWeek = new Date(passedDate);
      lastWeek.setDate(lastWeek.getDate() - 7);
      defaultFromDate = formatDate(lastWeek);
    }
  }

  if (!defaultToDate || !defaultFromDate) {
    const today = new Date();
    defaultToDate = formatDate(today);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    defaultFromDate = formatDate(lastWeek);
  }

  const { store: initialStore = 'HD44' } = location.state || {};

  const [selectedStore, setSelectedStore] = useState(initialStore);
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [storeOptions, setStoreOptions] = useState([]);
  
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortColumn, setSortColumn] = useState('DATE');
  const [sortDirection, setSortDirection] = useState('DESC');

  const exportFilters = useMemo(() => ({
    storeCode: selectedStore,
    fromDate,
    toDate,
    sortColumn,
    sortDirection
  }), [selectedStore, fromDate, toDate, sortColumn, sortDirection]);

  const handleClear = () => {
    setSelectedStore(initialStore);
    setFromDate(defaultFromDate);
    setToDate(defaultToDate);
    setSortColumn('DATE');
    setSortDirection('DESC');
    setPageIndex(1);
  };

  // Vibrant gradient pairs matching Store Sale Report design
  const cardGradients = useMemo(() => [
    ['#7dd3fc', '#0284c7'], // Blue: HU RECEIVED QTY
    ['#86efac', '#22c55e'], // Green: WH VALIDATED QTY
    ['#c084fc', '#9333ea'], // Purple: STORE VALIDATED QTY
    ['#fcd34d', '#ea580c'], // Orange: PENDING FOR VALIDATION
    ['#f472b6', '#db2777']  // Pink: WRONG HU QTY
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

  // Fetch Report Data
  useEffect(() => {
    const controller = new AbortController();
    const fetchReport = async () => {
      setIsLoading(true);
      setTableData([]);
      setError(null);
      try {
        const result = await getStoreGrcReport(selectedStore, fromDate, toDate, pageIndex, pageSize, sortColumn, sortDirection, controller.signal);
        
        if (controller.signal.aborted) return;
        
        const mappedData = (result.items || []).map((item) => ({
          srNo: item.RowNumber || item.SR_NO || item.srNo,
          date: (item.GRC_DATE || item.DATE) ? (item.GRC_DATE || item.DATE).split('T')[0] : '',
          huReceivedQty: item.HU_RECEIVED_QTY,
          whValidatedQty: item.HU_VALIDATED_QTY,
          storeValidatedQty: item.HHT_VALIDATE_QTY,
          pendingQty: item.STORE_PENDING_QTY,
          wrongHuQty: item.HU_WRONG_QTY
        }));
        
        setTableData(mappedData);
        setTotalRecords(result.summary?.totalCount || result.totalRecords || 0);

        if (result.summary) {
          // Calculate pending if not provided directly in summary
          const received = result.summary.huReceivedQty || 0;
          const hhtValidated = result.summary.hhtValidateQty || 0;
          const pending = received - hhtValidated;

          setReportSummary({
            huReceivedQty: result.summary.huReceivedQty,
            whValidatedQty: result.summary.whValidatedQty,
            storeValidatedQty: result.summary.hhtValidateQty,
            pendingQty: pending,
            wrongHuQty: result.summary.wrongHuQty,
            storeName: result.summary.storeName || (result.items && result.items.length > 0 ? result.items[0].STORE_NAME : null)
          });
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error("Error fetching store GRC report:", err);
        setError("Unable to load report data.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    fetchReport();
    return () => controller.abort();
  }, [selectedStore, fromDate, toDate, pageIndex, pageSize, sortColumn, sortDirection]);

  const getSelectedStoreName = () => {
    if (reportSummary?.storeName) return reportSummary.storeName;
    if (!selectedStore) return 'None';
    const options = Array.isArray(storeOptions) ? storeOptions : [];
    const opt = options.find(o => o?.STORE === selectedStore || o?.value === selectedStore);
    return opt?.STORE_NAME || opt?.label || selectedStore;
  };

  const numRenderer = (val) => <span className="vmm-link-num">{typeof val === 'number' ? val.toLocaleString('en-IN') : val}</span>;

  const columns = [
    { 
      key: 'srNo', 
      label: 'SR.NO', 
      sortable: false,
      render: (val, row, idx) => val || ((pageIndex - 1) * pageSize + idx + 1) 
    },
    { key: 'date', label: 'DATE', sortKey: 'DATE' },
    { key: 'huReceivedQty', label: 'HU RECEIVED QTY', sortKey: 'HU_RECEIVED_QTY', render: numRenderer },
    { key: 'whValidatedQty', label: 'WH VALIDATED QTY', sortKey: 'WH_VALIDATED_QTY', render: numRenderer },
    { key: 'storeValidatedQty', label: 'STORE VALIDATED QTY', sortKey: 'STORE_VALIDATED_QTY', render: numRenderer },
    { key: 'pendingQty', label: 'STORE PENDING FOR VALIDATION (QTY)', sortKey: 'PENDING_QTY', render: numRenderer },
    { key: 'wrongHuQty', label: 'WRONG HU QTY', sortKey: 'WRONG_HU_QTY', render: numRenderer }
  ];

  return (
    <AppLayout 
      headerProps={{
        breadcrumb: <>HOME - PAGES - REPORT - <span className="active">STORE GRC REPORT</span></>,
        showBackButton: true,
        onBackClick: () => navigate('/dashboard')
      }}
    >
          {/* Search Card */}
          <div className="report-search-card">
            <div className="report-search-header">
              <span>NOTE : FIELDS MARKED WITH (*) ARE REQUIRED</span>
            </div>
            <div className="report-search-body report-search-body-grid">
              <div className="search-field">
                <label>Store Code *</label>
                <SearchableDropdown
                  value={selectedStore}
                  onChange={(val) => {
                    setSelectedStore(val);
                    setPageIndex(1);
                  }}
                  options={storeOptions}
                  placeholder="Select Store Code"
                />
              </div>
              <div className="search-field">
                <label>From Date *</label>
                <CustomDatePicker
                  value={fromDate}
                  onChange={(dateStr) => {
                    setFromDate(dateStr);
                    setPageIndex(1);
                  }}
                  placeholder="From Date"
                />
              </div>
              <div className="search-field">
                <label>To Date *</label>
                <CustomDatePicker
                  value={toDate}
                  onChange={(dateStr) => {
                    setToDate(dateStr);
                    setPageIndex(1);
                  }}
                  placeholder="To Date"
                />
              </div>
            </div>
          </div>

          {/* Selected Info Bar */}
          <ReportStatsHeader 
            storeName={getSelectedStoreName()}
            fromDate={fromDate}
            toDate={toDate}
          />

          {/* Curved Cards */}
          <div className="report-curved-cards grc-report-cards">
            <CurvedCard 
              title="HU RECEIVED QTY" 
              value={reportSummary?.huReceivedQty?.toLocaleString('en-IN') || '0'} 
              waveColor={cardGradients[0]}
              icon={<Package size={20} color="#ffffff" />}
            />

            <CurvedCard 
              title="WH VALIDATED QTY" 
              value={reportSummary?.whValidatedQty?.toLocaleString('en-IN') || '0'} 
              waveColor={cardGradients[1]}
              icon={<Building2 size={20} color="#ffffff" />}
            />

            <CurvedCard 
              title="STORE VALIDATED QTY" 
              value={reportSummary?.storeValidatedQty?.toLocaleString('en-IN') || '0'} 
              waveColor={cardGradients[2]}
              icon={<Store size={20} color="#ffffff" />}
            />

            <CurvedCard 
              title="PENDING FOR VALIDATION" 
              value={reportSummary?.pendingQty?.toLocaleString('en-IN') || '0'} 
              waveColor={cardGradients[3]}
              icon={<Clock size={20} color="#ffffff" />}
            />

            <CurvedCard 
              title="WRONG HU QTY" 
              value={reportSummary?.wrongHuQty?.toLocaleString('en-IN') || '0'} 
              waveColor={cardGradients[4]}
              icon={<AlertTriangle size={20} color="#ffffff" />}
            />
          </div>

          {/* Data Table */}
          <div className="report-table-wrapper">
            <ReportDataTableCard 
              columns={columns} 
              data={tableData} 
              isLoading={isLoading} 
              striped={true}
              pageIndex={pageIndex}
              onPageChange={setPageIndex}
              pageSize={pageSize}
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
              totalRecords={totalRecords}
              reportName="STORE_GRC_SUMMARY"
              exportFilters={exportFilters}
              exportFileName={`Store_GRC_Report_${selectedStore}_${fromDate}_${toDate}.xlsx`}
            />
          </div>
    </AppLayout>
  );
}
