import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import CurvedCard from '../../components/common/CurvedCard';
import { getReportStores, searchReportArticles, getReportLiveStock } from '../../services/stockService';
import './LiveStockReport.css';

export default function LiveStockReportPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { store: initialStore = 'HD44', date: initialDate = '2026-07-20' } = location.state || {};

  const [selectedStore, setSelectedStore] = useState(initialStore);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [storeOptions, setStoreOptions] = useState([]);
  
  const [articleData, setArticleData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);

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

  // Article Autocomplete State
  const [articleSearchTerm, setArticleSearchTerm] = useState('');
  const [articleOptions, setArticleOptions] = useState([]);
  const [initialArticles, setInitialArticles] = useState([]);
  const [isArticleSearching, setIsArticleSearching] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState('');

  // Fetch Article Options based on search term
  React.useEffect(() => {
    const controller = new AbortController();
    const delayDebounceFn = setTimeout(async () => {
      setIsArticleSearching(true);
      try {
        const data = await searchReportArticles(articleSearchTerm, selectedStore, selectedDate, selectedDate, controller.signal);
        setArticleOptions(data);
      } catch (err) {
        if (err.name !== 'AbortError') console.error("Failed to fetch articles", err);
      } finally {
        if (!controller.signal.aborted) setIsArticleSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [articleSearchTerm, selectedStore, selectedDate]);

  React.useEffect(() => {
    const controller = new AbortController();
    const fetchReport = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getReportLiveStock(selectedStore, selectedDate, selectedArticle, pageIndex, pageSize, controller.signal);
        
        if (controller.signal.aborted) return;
        
        // Map the new API fields to the table columns expected
        const itemsArray = result.items || result.data || [];
        const mappedData = itemsArray.map((item) => ({
          srNo: item.RowNumber,
          stockDate: (item.STOCK_DATE || item.DATE) ? (item.STOCK_DATE || item.DATE).split('T')[0] : '',
          articleNo: item.ARTICLE,
          sapStock: item.SAP_STOCK,
          rfidStock: item.RFID_STOCK,
          diff: item.DIFFERENCE || item.DIFF
        }));
        
        setArticleData(mappedData);

        // We no longer rely on initialArticles from the table
        // if (!selectedArticle) {
        //   setInitialArticles(Array.from(new Set(mappedData.map(a => a.articleNo))).filter(Boolean).map(a => ({ id: a, text: a })));
        // }

        if (result.summary) {
          const itemsArray = result.items || result.data || [];
          setReportSummary({
            sapQty: result.summary.sapQty || result.summary.sapStockCount,
            rfidQty: result.summary.rfidQty || result.summary.rfidStockCount,
            diffQty: result.summary.diffQty || result.summary.differenceCount,
            totalRecords: result.summary.totalCount || result.summary.totalRecords,
            storeName: result.summary.storeName || (itemsArray.length > 0 ? itemsArray[0].STORE_NAME : null)
          });
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error("Error fetching live stock report:", err);
        setError("Unable to load report data.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    fetchReport();
    return () => controller.abort();
  }, [selectedStore, selectedDate, pageIndex, pageSize, selectedArticle]);

  const numRenderer = (val) => <span className="vmm-link-num">{typeof val === 'number' ? val.toLocaleString('en-IN') : val}</span>;
  const linkRenderer = (val) => <span className="vmm-link-num">{val}</span>;

  const getSelectedStoreName = () => {
    if (reportSummary?.storeName) return reportSummary.storeName;
    if (!selectedStore) return 'None';
    const options = Array.isArray(storeOptions) ? storeOptions : [];
    const opt = options.find(o => o?.STORE === selectedStore || o?.value === selectedStore);
    return opt?.STORE_NAME || opt?.label || selectedStore;
  };

  const columns = [
    { key: 'srNo', label: 'SR.NO' },
    { key: 'stockDate', label: 'STOCK DATE' },
    { key: 'articleNo', label: 'ARTICLE NO', render: linkRenderer },
    { key: 'sapStock', label: 'SAP STOCK', render: numRenderer },
    { key: 'rfidStock', label: 'RFID STOCK', render: numRenderer },
    { key: 'diff', label: 'DIFFERENCE', render: numRenderer }
  ];

  return (
    <div className="vmm-dashboard-layout">
      <Sidebar />

      <div className="vmm-main-wrapper">
        <Header 
          breadcrumb={<>HOME - PAGES - REPORT - <span className="active">LIVE STOCK REPORT</span></>}
          showBackButton={true}
          onBackClick={() => navigate('/dashboard')}
        />

        <main className="vmm-dashboard-body">
          {/* Page Header Area */}


          {/* Search Card */}
          <div className="report-search-card">
            <div className="report-search-header">
              <span>NOTE : FIELDS MARKED WITH (*) ARE REQUIRED</span>
            </div>
            <div className="report-search-body">
              <div className="search-field">
                <label>Store Code</label>
                <SearchableDropdown
                  value={selectedStore}
                  onChange={(val) => {
                    setSelectedStore(val);
                    setSelectedArticle('');
                    console.log("storeOptions",storeOptions);
                    setArticleSearchTerm('');
                    setPageIndex(1);
                  }}
                  options={storeOptions}
                  placeholder="Select Store Code"
                />
              </div>
              <div className="search-field">
                <label>Stock Date</label>
                <div className="input-group">
                  <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                  />
                </div>
              </div>
              <div className="search-field">
                <label>Article No</label>
                <SearchableDropdown
                  value={selectedArticle}
                  onChange={(val) => {
                    setSelectedArticle(val);
                    setPageIndex(1);
                  }}
                  options={articleOptions}
                  placeholder="Select Article No"
                  searchPlaceholder="Search Article No"
                  isAsync={true}
                  onSearchChange={setArticleSearchTerm}
                  isLoading={isArticleSearching}
                  valueKey="id"
                  closeOnSelect={false}
                />
              </div>
              <div className="search-buttons">
                <button 
                  className="btn-clear"
                  onClick={() => {
                    setSelectedArticle('');
                    setArticleSearchTerm('');
                    setPageIndex(1);
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Selected Info Bar */}
          <div className="report-selected-info-bar">
            <div>
              SELECTED STORE : { getSelectedStoreName() }
            </div>
            <div>
              STOCK DATE : {selectedDate}
            </div>
          </div>

          <div className="report-curved-cards">
            <CurvedCard 
              title="SAP STOCK COUNT" 
              value={reportSummary?.sapQty?.toLocaleString('en-IN') || '1,03,803'} 
              waveColor={cardGradients[0]}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <path d="M9 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
                  <path d="M15 3h2a2 2 0 0 1 2 2v4" />
                  <path d="M5 8h2" />
                  <path d="M17 8h2" />
                  <path d="M9 11h6" />
                  <path d="M9 15h3" />
                  <circle cx="16" cy="16" r="4" fill="#ffffff" />
                  <path d="M18.8 18.8L22 22" />
                </svg>
              }
            />

            <CurvedCard 
              title="RFID STOCK COUNT" 
              value={reportSummary?.rfidQty?.toLocaleString('en-IN') || '76,983'} 
              waveColor={cardGradients[1]}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                  <path d="m3.3 7 8.7 5 8.7-5"/>
                  <path d="M12 22V12"/>
                </svg>
              }
            />

            <CurvedCard 
              title="DIFFERENCE COUNT" 
              value={reportSummary?.diffQty?.toLocaleString('en-IN') || '26,820'} 
              waveColor={cardGradients[2]}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 12h8"/>
                </svg>
              }
            />
          </div>

          {/* Data Table */}
          <div className="livestock-report-table-wrapper report-table-wrapper">
            <ReportDataTableCard 
              columns={columns} 
              data={articleData} 
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
