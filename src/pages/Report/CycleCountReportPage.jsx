import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import CustomDatePicker from '../../components/common/CustomDatePicker';
import CycleCountModal from '../../components/modals/CycleCountModal';
import ReportStatsHeader from '../../components/common/ReportStatsHeader';
import { ClearButton } from '../../components/common/ReportActionButton';
import { getCycleCountReport, getBindStores } from '../../services/stockService';
import { dateRenderer, numRenderer } from '../../utils/dashboardColumns';
import './common-reports.css';

export default function CycleCountReportPage() {
  const location = useLocation();
  const { storeCode: initialStore, date: initialDate } = location.state || {};

  const defaultDate = initialDate || '2026-07-21';
  const [selectedStore, setSelectedStore] = useState(initialStore || '');
  const [fromDate, setFromDate] = useState(defaultDate);
  const [toDate, setToDate] = useState(defaultDate);
  const [storeOptions, setStoreOptions] = useState([]);
  
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);

  // Fetch Store Dropdown Options
  useEffect(() => {
    const controller = new AbortController();
    const fetchStores = async () => {
      try {
        const data = await getBindStores(fromDate, toDate, controller.signal);
        setStoreOptions(Array.isArray(data) ? data : (data?.stores || data?.Stores || []));
      } catch (err) {
        if (err.name !== 'AbortError') console.error("Failed to fetch stores", err);
      }
    };
    fetchStores();
    return () => controller.abort();
  }, []);

  // Fetch Report Data
  const fetchReportData = async (signal) => {
    if (!selectedStore) {
      setReportData([]);
      setTotalRecords(0);
      return;
    }
    
    setIsLoading(true);
    setReportData([]);
    setError(null);
    try {
      const result = await getCycleCountReport(pageIndex, pageSize, searchTerm, selectedStore, fromDate, toDate, sortColumn, sortDirection, signal);
      setReportData(result?.items || result?.Items || []);
      setTotalRecords(result?.summary?.recordCount || result?.Summary?.RecordCount || 0);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch report data.');
        setReportData([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchReportData(controller.signal);
    return () => controller.abort();
  }, [pageIndex, pageSize, searchTerm, selectedStore, fromDate, toDate, sortColumn, sortDirection]);

  const handleClear = () => {
    setSelectedStore('');
    setFromDate('');
    setToDate('');
    setReportData([]);
    setTotalRecords(0);
    setSortColumn('DATE');
    setSortDirection('DESC');
    setPageIndex(1);
  };

  const handleRefClick = (row) => {
    setSelectedRowData(row);
    setIsModalOpen(true);
  };

  const columns = [
    { 
      key: 'RowNumber', 
      label: 'SR.NO', 
      render: (val, row, idx) => val || ((pageIndex - 1) * pageSize + idx + 1)
    },
    { key: 'DATE', label: 'DATE', render: dateRenderer },
    { key: 'Ref_ID', label: 'REFERENCE NO', render: (val, row) => (
        <span 
          className="vmm-link-num text-blue" 
          style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }} 
          onClick={(e) => {
            e.stopPropagation();
            handleRefClick(row);
          }}
        >
          {val}
        </span>
      ) 
    },
    { key: 'CYCLE_COUNT_TYPE', label: 'CYCLE COUNT TYPE' },
    { key: 'NO_OF_ARTICLE', label: 'NO OF ARTICLES', render: numRenderer },
    { key: 'SYSTEM_STOCK', label: 'SYSTEM STOCK', render: numRenderer },
    { key: 'SCANNED_QTY', label: 'SCANNED QTY', render: numRenderer },
    { key: 'NET_DIFF', label: 'NET DIFFERENCE', render: numRenderer },
    { key: 'SHORT_QTY', label: 'SHORT QTY', render: numRenderer },
    { key: 'EXCESS_QTY', label: 'EXCESS QTY', render: numRenderer },
    { key: 'Start_DateTime', label: 'STARTED ON', render: dateRenderer },
    { key: 'END_DateTime', label: 'ENDED ON', render: dateRenderer },
    { key: 'Time_Taken', label: 'TIME TAKEN' }
  ];

  const storeDisplay = storeOptions.find(s => s.value === selectedStore)?.text || selectedStore;

  return (
    <AppLayout 
      headerProps={{
        breadcrumb: <>HOME - PAGES - REPORT - <span className="active">CYCLE COUNT REPORT</span></>,
        showBackButton: true,
        onBackClick: () => window.history.back()
      }}
    >
          {/* Filter Bar */}
          <div className="report-search-card">
            <div className="report-search-header">
              <span>NOTE : FIELDS MARKED WITH (*) ARE REQUIRED</span>
            </div>
            <div className="report-search-body">
              <div className="search-field">
                <label>Store Code *</label>
                <SearchableDropdown 
                  options={storeOptions} 
                  value={selectedStore} 
                  onChange={setSelectedStore} 
                  placeholder="Select Store"
                />
              </div>

              <div className="search-field">
                <label>From Date</label>
                <CustomDatePicker 
                  value={fromDate} 
                  onChange={(val) => setFromDate(val)}
                  placeholder="From Date"
                />
              </div>

              <div className="search-field">
                <label>To Date</label>
                <CustomDatePicker 
                  value={toDate} 
                  onChange={(val) => setToDate(val)}
                  placeholder="To Date"
                />
              </div>

              <div className="search-buttons" style={{ alignSelf: 'flex-end', display: 'flex', gap: '10px' }}>
                <ClearButton onClick={handleClear} />
              </div>
            </div>
          </div>

          {/* Info Banner */}
          {selectedStore && (
            <ReportStatsHeader 
              storeName={storeDisplay}
              fromDate={fromDate}
              toDate={toDate}
            />
          )}

          {/* Data Table */}
          <div className="report-table-wrapper">
            <ReportDataTableCard 
              columns={columns}
              data={reportData}
              isLoading={isLoading}
              error={error}
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
              reportName="CYCLE_COUNT_SUMMARY"
              exportFilters={exportFilters}
              exportFileName={`Cycle_Count_${selectedStore || 'ALL'}_${fromDate || 'ALL'}_${toDate || 'ALL'}.xlsx`}
              onSearch={setSearchTerm}
              searchPlaceholder="Search Records"
            />
          </div>

      {isModalOpen && (
        <CycleCountModal 
          modalData={selectedRowData}
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </AppLayout>
  );
}
