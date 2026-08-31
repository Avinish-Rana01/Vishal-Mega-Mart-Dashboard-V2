import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import CycleCountModal from '../../components/modals/CycleCountModal';
import { getCycleCountReport, getBindStores } from '../../services/stockService';
import { dateRenderer, numRenderer } from '../Dashboard/dashboardColumns';

export default function CycleCountReportPage() {
  const location = useLocation();
  const { storeCode: initialStore, date: initialDate } = location.state || {};

  const [selectedStore, setSelectedStore] = useState(initialStore || '');
  const [fromDate, setFromDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [storeOptions, setStoreOptions] = useState([]);
  
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);

  // Fetch Store Dropdown Options
  useEffect(() => {
    const controller = new AbortController();
    const fetchStores = async () => {
      try {
        const data = await getBindStores(fromDate, toDate, controller.signal);
        // BindStoreResponse has a Stores array
        setStoreOptions(data?.stores || data?.Stores || []);
      } catch (err) {
        if (err.name !== 'AbortError') console.error("Failed to fetch stores", err);
      }
    };
    fetchStores();
    return () => controller.abort();
  }, [fromDate, toDate]);

  // Fetch Report Data
  const fetchReportData = async (signal) => {
    if (!selectedStore) {
      setReportData([]);
      setTotalRecords(0);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await getCycleCountReport(pageIndex, pageSize, searchTerm, selectedStore, fromDate, toDate, signal);
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
  }, [pageIndex, pageSize, searchTerm, selectedStore]); // fetch when store or pagination changes

  const handleSearch = () => {
    setPageIndex(1);
    const controller = new AbortController();
    fetchReportData(controller.signal);
  };

  const handleClear = () => {
    setSelectedStore('');
    setFromDate('');
    setToDate('');
    setReportData([]);
    setTotalRecords(0);
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
                <div className="input-group">
                  <input 
                    type="date" 
                    value={fromDate} 
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="search-field">
                <label>To Date</label>
                <div className="input-group">
                  <input 
                    type="date" 
                    value={toDate} 
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="search-buttons" style={{ alignSelf: 'flex-end', display: 'flex', gap: '10px' }}>
                <button className="btn-search" onClick={handleSearch} style={{ padding: '8px 24px', backgroundColor: '#0284c7', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Search</button>
                <button className="btn-clear" onClick={handleClear} style={{ padding: '8px 24px', backgroundColor: '#94a3b8', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Clear</button>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          {selectedStore && (
            <div className="report-selected-info-bar">
              <div>SELECTED STORE : {storeDisplay}</div>
            </div>
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
              onPageSizeChange={setPageSize}
              totalRecords={totalRecords}
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
