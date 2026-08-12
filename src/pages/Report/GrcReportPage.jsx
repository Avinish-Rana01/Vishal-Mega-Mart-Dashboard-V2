import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import CurvedCard from '../../components/common/CurvedCard';
import { getReportStores, searchGrcHuNumbers, getGrcDetails } from '../../services/stockService';
import './GrcReport.css';

export default function GrcReportPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // If navigated from store validation, it might pass these state params
  const { 
    store: initialStore = 'HD44', 
    fromDate: rawFromDate = '2026-08-01',
    toDate: rawToDate = '2026-08-01',
    grcStatus: initialGrcStatus = '1'
  } = location.state || {};

  // Ensure dates are just YYYY-MM-DD (Store Validation passes "2026-07-19 12:00 AM Sunday")
  const initialFromDate = rawFromDate.substring(0, 10);
  const initialToDate = rawToDate.substring(0, 10);

  const [selectedStore, setSelectedStore] = useState(initialStore);
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);
  const [grcStatus, setGrcStatus] = useState(initialGrcStatus);
  const [storeOptions, setStoreOptions] = useState([]);

  const [cardGradients, setCardGradients] = useState([
    ['#fff', '#fff'], ['#fff', '#fff'], ['#fff', '#fff'], ['#fff', '#fff'], ['#fff', '#fff']
  ]);

  // Generate 5 random distinct gradients on initial load
  React.useEffect(() => {
    const baseHue = Math.floor(Math.random() * 360);
    const gradients = [0, 1, 2, 3, 4]
      .map(i => {
        const hue = Math.floor((baseHue + i * (360 / 5)) % 360);
        return [
          `hsl(${hue}, 80%, 75%)`, 
          `hsl(${(hue + 30) % 360}, 85%, 55%)`
        ];
      })
      .sort(() => Math.random() - 0.5); // Shuffle them
    setCardGradients(gradients);
  }, []);

  // Ensure state updates if we navigate with new state
  React.useEffect(() => {
    if (location.state) {
      if (location.state.store) setSelectedStore(location.state.store);
      if (location.state.fromDate) setFromDate(location.state.fromDate.substring(0, 10));
      if (location.state.toDate) setToDate(location.state.toDate.substring(0, 10));
      if (location.state.grcStatus) setGrcStatus(location.state.grcStatus);
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

  // HU Autocomplete State
  const [huSearchTerm, setHuSearchTerm] = useState('');
  const [huOptions, setHuOptions] = useState([]);
  const [initialHuNumbers, setInitialHuNumbers] = useState([]);
  const [isHuSearching, setIsHuSearching] = useState(false);
  const [selectedHu, setSelectedHu] = useState('');

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
      setError(null);
      try {
        const result = await getGrcDetails(pageIndex, pageSize, grcStatus, selectedStore, selectedHu, fromDate, toDate, controller.signal);
        
        if (controller.signal.aborted) return;
        
        // Map the new API fields to the table columns expected
        const mappedData = (result.data || []).map((item) => ({
          srNo: item.RowNumber,
          storeCode: item.STORE_CODE,
          huNumber: item.HU,
          status: item.RECEIVED_STATUS || item.GRC_STATUS,
          grcDate: item.GRC_DATE ? String(item.GRC_DATE).split('T')[0] : '',
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
  }, [selectedStore, fromDate, toDate, pageIndex, pageSize, selectedHu, grcStatus]);

  const actionRenderer = (val) => (
    <button className="vmm-btn-view-details" onClick={() => console.log('Open Modal', val)}>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
      {val}
    </button>
  );

  const columns = [
    { key: 'srNo', label: 'SR.NO' },
    { key: 'storeCode', label: 'STORE CODE' },
    { key: 'huNumber', label: 'HU NUMBER' },
    { key: 'status', label: 'STATUS' },
    { key: 'grcDate', label: 'GRC DATE' },
    { key: 'action', label: 'ACTION', render: actionRenderer }
  ];

  // Helper text mapping for the purple card
  const getGrcStatusText = () => {
    switch (grcStatus) {
      case '0': return 'HHT GRC QTY';
      case '1': return 'HU RECEIVED QTY';
      case '2': return 'HHT GRC QTY';
      case '3': return 'STORE PENDING GRC QTY';
      case '4': return 'HU RECEIVED QTY';
      default: return 'HU RECEIVED QTY';
    }
  };

  return (
    <div className="vmm-dashboard-layout">
      <Sidebar />

      <div className="vmm-main-wrapper">
        <Header 
          breadcrumb={<>HOME - PAGES - REPORT - <span className="active">GRC REPORT</span></>}
          showBackButton={true}
          onBackClick={() => navigate(-1)}
        />

        <main className="vmm-dashboard-body">
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
              <button className="btn-search">Search</button>
              <button 
                className="btn-clear"
                onClick={() => {
                  setSelectedHu('');
                  setHuSearchTerm('');
                  setPageIndex(1);
                }}
              >
                Clear
              </button>
              <button className="btn-back-summary" onClick={() => navigate(-1)}>
                Back to GRC Summary
              </button>
            </div>
          </div>

          {/* Stats Header */}
          <div className="report-stats-header">
            <div className="date-info">FROM DATE : {fromDate} | TO DATE : {toDate}</div>
          </div>

          <div className="report-curved-cards">
            <CurvedCard 
              title="GRC STATUS" 
              value={getGrcStatusText()} 
              waveColor={cardGradients[0]}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                  <path d="M3 6h18"></path>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              }
            />

            <CurvedCard 
              title="HU COUNT" 
              value={totalRecords.toLocaleString('en-IN')} 
              waveColor={cardGradients[1]}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              }
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
              onPageSizeChange={setPageSize}
              totalRecords={totalRecords}
            />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
