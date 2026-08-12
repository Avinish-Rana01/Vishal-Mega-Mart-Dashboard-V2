import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import CurvedCard from '../../components/common/CurvedCard';
import { getReportStores, getStoreGrcReport } from '../../services/stockService';
import './StoreGrcReport.css'; // We will create this or use LiveStockReport.css

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

  const [cardGradients, setCardGradients] = useState([
    ['#fff', '#fff'], ['#fff', '#fff'], ['#fff', '#fff'], ['#fff', '#fff'], ['#fff', '#fff']
  ]);

  // Generate 5 random distinct gradients on initial load
  useEffect(() => {
    const baseHue = Math.floor(Math.random() * 360);
    const gradients = [0, 1, 2, 3, 4]
      .map(i => {
        const hue = Math.floor((baseHue + i * (360 / 5)) % 360);
        // Create a beautiful gradient by shifting the hue slightly and dropping the lightness
        return [
          `hsl(${hue}, 80%, 75%)`, 
          `hsl(${(hue + 30) % 360}, 85%, 55%)`
        ];
      })
      .sort(() => Math.random() - 0.5); // Shuffle them
    setCardGradients(gradients);
  }, []);

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
      setError(null);
      try {
        const result = await getStoreGrcReport(selectedStore, fromDate, toDate, pageIndex, pageSize, controller.signal);
        
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
  }, [selectedStore, fromDate, toDate, pageIndex, pageSize]);

  const getSelectedStoreName = () => {
    if (reportSummary?.storeName) return reportSummary.storeName;
    if (!selectedStore) return 'None';
    const options = Array.isArray(storeOptions) ? storeOptions : [];
    const opt = options.find(o => o?.STORE === selectedStore || o?.value === selectedStore);
    return opt?.STORE_NAME || opt?.label || selectedStore;
  };

  const numRenderer = (val) => <span className="vmm-link-num">{typeof val === 'number' ? val.toLocaleString('en-IN') : val}</span>;

  const columns = [
    { key: 'srNo', label: 'SR.NO' },
    { key: 'date', label: 'DATE' },
    { key: 'huReceivedQty', label: 'HU RECEIVED QTY', render: numRenderer },
    { key: 'whValidatedQty', label: 'WH VALIDATED QTY', render: numRenderer },
    { key: 'storeValidatedQty', label: 'STORE VALIDATED QTY', render: numRenderer },
    { key: 'pendingQty', label: 'STORE PENDING FOR VALIDATION (QTY)', render: numRenderer },
    { key: 'wrongHuQty', label: 'WRONG HU QTY', render: numRenderer }
  ];

  return (
    <div className="vmm-dashboard-layout">
      <Sidebar />

      <div className="vmm-main-wrapper">
        <Header 
          breadcrumb={<>HOME - PAGES - REPORT - <span className="active">STORE GRC REPORT</span></>}
          showBackButton={true}
          onBackClick={() => navigate('/dashboard')}
        />

        <main className="vmm-dashboard-body">
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
                <div className="input-group">
                  <input 
                    type="date" 
                    value={fromDate} 
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setPageIndex(1);
                    }} 
                  />
                </div>
              </div>
              <div className="search-field">
                <label>To Date *</label>
                <div className="input-group">
                  <input 
                    type="date" 
                    value={toDate} 
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setPageIndex(1);
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Selected Info Bar */}
          <div className="report-selected-info-bar">
            <div>
              SELECTED STORE : { getSelectedStoreName() }
            </div>
            <div>
              FROM DATE : {fromDate} | TO DATE : {toDate}
            </div>
          </div>

          {/* Curved Cards */}
          <div className="report-curved-cards grc-report-cards">
            <CurvedCard 
              title="HU RECEIVED QTY" 
              value={reportSummary?.huReceivedQty?.toLocaleString('en-IN') || '0'} 
              waveColor={cardGradients[0]}
              icon={
                <svg width="20" height="20" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <path d="M60,160 Q40,160 45,130 Q50,70 100,70 Q150,70 155,130 Q160,160 140,160 Z" fill="black" stroke="black" strokeWidth="2"></path>
                  <path d="M85,70 L75,40 Q100,30 125,40 L115,70 Z" fill="black" stroke="black" strokeWidth="2"></path>
                  <rect x="82" y="65" width="36" height="8" rx="4" fill="black" stroke="black" strokeWidth="1"></rect>
                  <text x="100" y="130" fontFamily="Arial" fontSize="35" fill="white" textAnchor="middle" fontWeight="bold">$</text>
                  <path d="M70,100 Q80,105 90,100" fill="none"></path>
                </svg>
              }
            />

            <CurvedCard 
              title="WH VALIDATED QTY" 
              value={reportSummary?.whValidatedQty?.toLocaleString('en-IN') || '0'} 
              waveColor={cardGradients[1]}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 21H21" stroke="#334155" strokeWidth="2" strokeLinecap="round"></path>
                  <path d="M4 21V11H20V21" stroke="#334155" strokeWidth="2" strokeLinejoin="round"></path>
                  <path d="M3 7L4 11H20L21 7H3Z" fill="#334155" stroke="#334155" strokeWidth="2" strokeLinejoin="round"></path>
                  <path d="M3 7L12 3L21 7" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                  <rect x="10" y="15" width="4" height="6" stroke="#334155" strokeWidth="2" strokeLinejoin="round"></rect>
                  <rect x="6" y="14" width="2" height="3" rx="0.5" fill="#334155" stroke="#334155" strokeWidth="1"></rect>
                  <rect x="16" y="14" width="2" height="3" rx="0.5" fill="#334155" stroke="#334155" strokeWidth="1"></rect>
                </svg>
              }
            />

            <CurvedCard 
              title="STORE VALIDATED QTY" 
              value={reportSummary?.storeValidatedQty?.toLocaleString('en-IN') || '0'} 
              waveColor={cardGradients[2]}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 21H21" stroke="#334155" strokeWidth="2" strokeLinecap="round"></path>
                  <path d="M4 21V11H20V21" stroke="#334155" strokeWidth="2" strokeLinejoin="round"></path>
                  <path d="M3 7L4 11H20L21 7H3Z" fill="#334155" stroke="#334155" strokeWidth="2" strokeLinejoin="round"></path>
                  <path d="M3 7L12 3L21 7" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                  <rect x="10" y="15" width="4" height="6" stroke="#334155" strokeWidth="2" strokeLinejoin="round"></rect>
                  <rect x="6" y="14" width="2" height="3" rx="0.5" fill="#334155" stroke="#334155" strokeWidth="1"></rect>
                  <rect x="16" y="14" width="2" height="3" rx="0.5" fill="#334155" stroke="#334155" strokeWidth="1"></rect>
                </svg>
              }
            />

            <CurvedCard 
              title="PENDING FOR VALIDATION" 
              value={reportSummary?.pendingQty?.toLocaleString('en-IN') || '0'} 
              waveColor={cardGradients[3]}
              icon={
                <svg width="20" height="20" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <path d="M60,160 Q40,160 45,130 Q50,70 100,70 Q150,70 155,130 Q160,160 140,160 Z" fill="#000000" stroke="#000000" strokeWidth="3"></path>
                  <path d="M85,70 L75,40 Q100,20 125,40 L115,70 Z" fill="#000000" stroke="#000000" strokeWidth="3"></path>
                  <rect x="82" y="65" width="36" height="8" rx="4" fill="#000000"></rect>
                  <circle cx="100" cy="120" r="28" fill="white" stroke="#000000" strokeWidth="4"></circle>
                  <line x1="100" y1="120" x2="100" y2="105" stroke="#000000" strokeWidth="4" strokeLinecap="round"></line>
                  <line x1="100" y1="120" x2="112" y2="128" stroke="#000000" strokeWidth="4" strokeLinecap="round"></line>
                </svg>
              }
            />

            <CurvedCard 
              title="WRONG HU QTY" 
              value={reportSummary?.wrongHuQty?.toLocaleString('en-IN') || '0'} 
              waveColor={cardGradients[4]}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="black" strokeWidth="2"></circle>
                  <path d="M9 9L15 15M15 9L9 15" stroke="black" strokeWidth="2" strokeLinecap="round"></path>
                </svg>
              }
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
              onPageSizeChange={setPageSize}
              totalRecords={reportSummary?.totalRecords || 0}
            />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
