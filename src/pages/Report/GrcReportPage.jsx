import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Package } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import CustomDatePicker from '../../components/common/CustomDatePicker';
import CurvedCard from '../../components/common/CurvedCard';
import ReportStatsHeader from '../../components/common/ReportStatsHeader';
import { ClearButton, BackButton } from '../../components/common/ReportActionButton';
import { getReportStores, searchGrcHuNumbers, getGrcDetails } from '../../services/stockService';
import GrcDetailsModal from '../../components/modals/GrcDetailsModal';
import './GrcReport.css';

export default function GrcReportPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // If navigated from store validation, it might pass these state params
  const { 
    store: initialStore = 'HD44', 
    fromDate: rawFromDate = '2026-08-01',
    toDate: rawToDate = '2026-08-01',
    grcStatus: rawGrcStatus
  } = location.state || {};

  const initialGrcStatus = (rawGrcStatus !== undefined && rawGrcStatus !== null && rawGrcStatus !== '')
    ? String(rawGrcStatus)
    : '1';

  // Ensure dates are just YYYY-MM-DD (Store Validation passes "2026-07-19 12:00 AM Sunday")
  const initialFromDate = rawFromDate.substring(0, 10);
  const initialToDate = rawToDate.substring(0, 10);

  const [selectedStore, setSelectedStore] = useState(initialStore);
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);
  const [grcStatus, setGrcStatus] = useState(initialGrcStatus);
  const [selectedModalRow, setSelectedModalRow] = useState(null);
  const [storeOptions, setStoreOptions] = useState([]);

  // Vibrant gradient wave colors matching Store Sale Report design
  const cardGradients = useMemo(() => [
    ['#7dd3fc', '#0284c7'], // Blue: GRC STATUS
    ['#86efac', '#22c55e']  // Green: HU COUNT
  ], []);

  // Ensure state updates if we navigate with new state
  React.useEffect(() => {
    if (location.state) {
      if (location.state.store) setSelectedStore(location.state.store);
      if (location.state.fromDate) setFromDate(location.state.fromDate.substring(0, 10));
      if (location.state.toDate) setToDate(location.state.toDate.substring(0, 10));
      if (location.state.grcStatus !== undefined && location.state.grcStatus !== null && location.state.grcStatus !== '') {
        setGrcStatus(String(location.state.grcStatus));
      }
    }
  }, [location.state]);
  
  const [grcData, setGrcData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);

  // Fetch Store Dropdown Options
  React.useEffect(() => {
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

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState('GRC_DATE');
  const [sortDirection, setSortDirection] = useState('asc');

  // HU Autocomplete State
  const [huSearchTerm, setHuSearchTerm] = useState('');
  const [huOptions, setHuOptions] = useState([]);
  const [initialHuNumbers, setInitialHuNumbers] = useState([]);
  const [isHuSearching, setIsHuSearching] = useState(false);
  const [selectedHu, setSelectedHu] = useState('');

  const exportFilters = useMemo(() => ({
    storeCode: selectedStore,
    huNo: selectedHu,
    grcStatus,
    fromDate,
    toDate,
    sortColumn,
    sortDirection
  }), [selectedStore, selectedHu, grcStatus, fromDate, toDate, sortColumn, sortDirection]);

  // Fetch HU Options based on search term
  React.useEffect(() => {
    const controller = new AbortController();
    const delayDebounceFn = setTimeout(async () => {
      setIsHuSearching(true);
      try {
        const data = await searchGrcHuNumbers(huSearchTerm, grcStatus, selectedStore, fromDate, toDate, controller.signal);
        setHuOptions(data);
      } catch (err) {
        if (err.name !== 'AbortError') console.error("Failed to fetch HU numbers", err);
      } finally {
        if (!controller.signal.aborted) setIsHuSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [huSearchTerm, selectedStore, fromDate, toDate, grcStatus]);

  React.useEffect(() => {
    const controller = new AbortController();
    const fetchReport = async () => {
      setIsLoading(true);
      setGrcData([]);
      setError(null);
      try {
        const result = await getGrcDetails(pageIndex, pageSize, grcStatus, selectedStore, selectedHu, fromDate, toDate, sortColumn, sortDirection, controller.signal);
        
        if (controller.signal.aborted) return;
        
        // Map the new API fields to the table columns expected
        const mappedData = (result.data || []).map((item) => ({
          srNo: item.RowNumber,
          storeCode: item.STORE_CODE,
          huNumber: item.HU,
          status: item.RECEIVED_STATUS || item.GRC_STATUS,
          grcStatus: grcStatus,
          grcDate: item.GRC_DATE ? String(item.GRC_DATE).split('T')[0] : '',
          rawGrcDate: item.GRC_DATE || '',
          action: 'View Details'
        }));
        
        setGrcData(mappedData);

        // We no longer rely on initialHuNumbers from the table
        // if (!selectedHu) {
        //   setInitialHuNumbers(Array.from(new Set(mappedData.map(a => a.huNumber))).filter(Boolean).map(a => ({ id: a, text: a })));
        // }

        setTotalRecords(result.totalRecords || 0);

      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error("Error fetching GRC details:", err);
        setError("Unable to load report data.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    fetchReport();
    return () => controller.abort();
  }, [selectedStore, fromDate, toDate, pageIndex, pageSize, selectedHu, grcStatus, sortColumn, sortDirection]);

  const actionRenderer = (val, row) => (
    <button 
      className="vmm-btn-view-details" 
      onClick={(e) => {
        e.stopPropagation();
        setSelectedModalRow(row);
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
      {val}
    </button>
  );

  const columns = [
    { 
      key: 'srNo', 
      label: 'SR.NO', 
      sortable: false,
      render: (val, row, idx) => val || ((pageIndex - 1) * pageSize + idx + 1) 
    },
    { key: 'storeCode', label: 'STORE CODE', sortKey: 'STORE_CODE' },
    { key: 'huNumber', label: 'HU NUMBER', sortKey: 'HU' },
    { key: 'status', label: 'STATUS', sortKey: 'RECEIVED_STATUS' },
    { key: 'grcDate', label: 'GRC DATE', sortKey: 'GRC_DATE' },
    { key: 'action', label: 'ACTION', sortable: false, render: actionRenderer }
  ];

  // Helper text mapping for the purple card
  const getGrcStatusText = () => {
    switch (grcStatus) {
      case '0': return 'WRONG HU QTY';
      case '1': return 'WH VALIDATED QTY';
      case '2': return 'STORE VALIDATED QTY';
      case '3': return 'STORE PENDING GRC QTY';
      case '4': return 'HU RECEIVED QTY';
      default: return 'HU RECEIVED QTY';
    }
  };

  return (
    <AppLayout 
      headerProps={{
        breadcrumb: <>HOME - PAGES - REPORT - <span className="active">GRC REPORT</span></>,
        showBackButton: true,
        onBackClick: () => navigate(-1)
      }}
    >
          {/* Search Card */}
          <div className="report-search-card">
            <div className="report-search-header">
              <span>NOTE : FIELDS MARKED WITH (*) ARE REQUIRED</span>
            </div>
            <div className="report-search-body">
              <div className="search-field">
                <label>Store Code <span>*</span></label>
                <SearchableDropdown
                  value={selectedStore}
                  onChange={(val) => {
                    setSelectedStore(val);
                    setSelectedHu('');
                    setHuSearchTerm('');
                    setPageIndex(1);
                  }}
                  options={storeOptions}
                  placeholder="Select Store Code"
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
              <div className="search-field">
                <label>HU Number</label>
                <SearchableDropdown
                  value={selectedHu}
                  onChange={(val) => {
                    setSelectedHu(val);
                    setPageIndex(1);
                  }}
                  options={huOptions}
                  placeholder="Select HU Number"
                  searchPlaceholder="Search HU Number"
                  isAsync={true}
                  onSearchChange={setHuSearchTerm}
                  isLoading={isHuSearching}
                  valueKey="id"
                  closeOnSelect={false}
                />
              </div>
            </div>
            
            <div className="search-buttons">
              <ClearButton 
                onClick={() => {
                  setSelectedHu('');
                  setHuSearchTerm('');
                  setPageIndex(1);
                }}
              />
              <BackButton 
                onClick={() => navigate(-1)} 
                label="Back to GRC Summary" 
              />
            </div>
          </div>

          {/* Stats Header */}
          <ReportStatsHeader 
            storeName={storeOptions.find(s => s.id === selectedStore)?.text || selectedStore || 'ALL STORES'}
            fromDate={fromDate}
            toDate={toDate}
          />

          <div className="report-curved-cards">
            <CurvedCard 
              title="GRC STATUS" 
              value={getGrcStatusText()} 
              waveColor={cardGradients[0]}
              icon={<ShoppingBag size={20} color="#ffffff" />}
            />

            <CurvedCard 
              title="HU COUNT" 
              value={totalRecords.toLocaleString('en-IN')} 
              waveColor={cardGradients[1]}
              icon={<Package size={20} color="#ffffff" />}
            />
          </div>

          {/* Data Table */}
          <div className="report-table-container">
            <ReportDataTableCard 
              columns={columns} 
              data={grcData} 
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
              reportName="GRC_DETAILS"
              exportFilters={exportFilters}
              exportFileName={`GRC_Report_${selectedStore}_${grcStatus}_${fromDate}_${toDate}.xlsx`}
            />
          </div>

          {/* Details Modal */}
          {selectedModalRow && (
            <GrcDetailsModal 
              modalData={selectedModalRow} 
              grcStatus={grcStatus}
              date={selectedModalRow.rawGrcDate || selectedModalRow.grcDate}
              onClose={() => setSelectedModalRow(null)} 
            />
          )}
    </AppLayout>
  );
}
