import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import CurvedCard from '../../components/common/CurvedCard';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import CustomDatePicker from '../../components/common/CustomDatePicker';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import ReportStatsHeader from '../../components/common/ReportStatsHeader';
import { SearchButton, ClearButton, BackButton } from '../../components/common/ReportActionButton';
import { useEncodingStoreData } from '../../hooks/useEncodingStoreData';
import { getReportStores, getEncodingStoreSearchEAN, getEncodingStoreSearchArticle } from '../../services/stockService';
import { Store, Tag, Hash } from 'lucide-react';
import './common-reports.css';
import './LiveStockReport.css';
import './AllocatedStoreReport.css';

export default function AllocatedStoreReportPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Parse state from navigation (e.g. from Dashboard click)
  const passedState = location.state || {};
  
  const [fromDate, setFromDate] = useState(passedState.fromDate || new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(passedState.toDate || new Date().toISOString().split('T')[0]);
  const [storeName, setStoreName] = useState(passedState.storeCode || '');
  const [articleNo, setArticleNo] = useState('');
  const [ean, setEan] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [storeOptions, setStoreOptions] = useState([]);

  // Async dropdown states
  const [eanSearchTerm, setEanSearchTerm] = useState('');
  const [eanOptions, setEanOptions] = useState([]);
  const [isEanSearching, setIsEanSearching] = useState(false);

  const [articleSearchTerm, setArticleSearchTerm] = useState('');
  const [articleOptions, setArticleOptions] = useState([]);
  const [isArticleSearching, setIsArticleSearching] = useState(false);

  // Fetch store options for SearchableDropdown
  useEffect(() => {
    const controller = new AbortController();
    const fetchStores = async () => {
      try {
        const data = await getReportStores(controller.signal);
        if (Array.isArray(data) && data.length > 0) {
          setStoreOptions(data.map(item => ({
            value: item.id || item.STORE_CODE || item.storeCode || item.code || item.text,
            text: item.text || item.STORE_NAME || item.storeName || item.name || `${item.id}`
          })));
        }
      } catch (err) {
        // Fallback gracefully to manual code entry if store list is unavailable
      }
    };
    fetchStores();
    return () => controller.abort();
  }, []);
  
  // Fetch EAN Options
  useEffect(() => {
    const trimmed = eanSearchTerm.trim();
    if (!trimmed) {
      setEanOptions([]);
      setIsEanSearching(false);
      return;
    }

    const controller = new AbortController();
    const delayDebounceFn = setTimeout(async () => {
      setIsEanSearching(true);
      try {
        const data = await getEncodingStoreSearchEAN(storeName, fromDate, toDate, trimmed, controller.signal);
        setEanOptions(Array.isArray(data) ? data : (data?.eans || []));
      } catch (err) {
        if (err.name !== 'AbortError') console.error("Failed to fetch EANs", err);
      } finally {
        if (!controller.signal.aborted) setIsEanSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [eanSearchTerm, storeName, fromDate, toDate]);

  // Fetch Article Options
  useEffect(() => {
    const trimmed = articleSearchTerm.trim();
    if (!trimmed) {
      setArticleOptions([]);
      setIsArticleSearching(false);
      return;
    }

    const controller = new AbortController();
    const delayDebounceFn = setTimeout(async () => {
      setIsArticleSearching(true);
      try {
        const data = await getEncodingStoreSearchArticle(storeName, fromDate, toDate, trimmed, controller.signal);
        setArticleOptions(Array.isArray(data) ? data : (data?.articles || []));
      } catch (err) {
        if (err.name !== 'AbortError') console.error("Failed to fetch Articles", err);
      } finally {
        if (!controller.signal.aborted) setIsArticleSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [articleSearchTerm, storeName, fromDate, toDate]);

  // Search parameters actually sent to API
  const [searchParams, setSearchParams] = useState({
    fromDate: passedState.fromDate || new Date().toISOString().split('T')[0],
    toDate: passedState.toDate || new Date().toISOString().split('T')[0],
    storeName: passedState.storeCode || '',
    articleNo: '',
    ean: '',
    searchTerm: ''
  });

  const {
    data,
    isLoading,
    isRefreshing,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    totalRecords,
    totalPages
  } = useEncodingStoreData(searchParams);

  // Derive unique Article options from currently loaded table rows
  const tableArticleOptions = useMemo(() => {
    if (!data || data.length === 0) return [];
    const seen = new Set();
    const list = [];
    for (const row of data) {
      const article = row.ARTICLE ?? row.Material ?? row.MATERIAL;
      if (article && !seen.has(String(article))) {
        seen.add(String(article));
        list.push({ id: String(article), value: String(article), text: String(article) });
      }
    }
    return list;
  }, [data]);

  // Derive unique EAN options from currently loaded table rows
  const tableEanOptions = useMemo(() => {
    if (!data || data.length === 0) return [];
    const seen = new Set();
    const list = [];
    for (const row of data) {
      const eanVal = row.EAN ?? row.Ean ?? row.ean;
      if (eanVal && !seen.has(String(eanVal))) {
        seen.add(String(eanVal));
        list.push({ id: String(eanVal), value: String(eanVal), text: String(eanVal) });
      }
    }
    return list;
  }, [data]);

  // When no search term typed, show table-derived options; otherwise show API search results
  const displayArticleOptions = articleSearchTerm.trim() ? articleOptions : tableArticleOptions;
  const displayEanOptions = eanSearchTerm.trim() ? eanOptions : tableEanOptions;

  const handleSearch = () => {
    setPageIndex(1);
    setSearchParams({
      fromDate,
      toDate,
      storeName,
      articleNo,
      ean,
      searchTerm
    });
  };

  const handleClear = () => {
    const today = new Date().toISOString().split('T')[0];
    setFromDate(today);
    setToDate(today);
    setStoreName('');
    setArticleNo('');
    setEan('');
    setSearchTerm('');
    setEanSearchTerm('');
    setArticleSearchTerm('');
    setPageIndex(1);
    
    // Auto trigger search on clear
    setSearchParams({
      fromDate: today,
      toDate: today,
      storeName: '',
      articleNo: '',
      ean: '',
      searchTerm: ''
    });
  };

  // Columns based on standard and screenshot: SR.NO, ASSIGNED STORE NAME, ARTICLE NO, ARTICLE DESCRIPTION, EAN, ENCODING TAGS, ENCODE DATE
  const columns = [
    {
      key: 'sr_no',
      label: 'SR.NO',
      render: (val, row, idx) => ((pageIndex - 1) * pageSize) + idx + 1
    },
    {
      key: 'ASSIGNED_STORE_NAME',
      label: 'ASSIGNED STORE NAME',
      render: (val, row) => row.ASSIGNED_STORE_NAME ?? row.Assigned_Store_Name ?? row.Store_Name ?? row.STORE_NAME ?? row.Store_Code ?? row.STORE_CODE ?? '—'
    },
    {
      key: 'ARTICLE_NO',
      label: 'ARTICLE NO',
      render: (val, row) => row.ARTICLE_NO ?? row.Article_No ?? row.ARTICLE ?? row.Material ?? row.MATERIAL ?? '—'
    },
    {
      key: 'ARTICLE_DESCRIPTION',
      label: 'ARTICLE DESCRIPTION',
      render: (val, row) => row.ARTICLE_DESC ?? row.Article_Desc ?? row.ARTICLE_DESCRIPTION ?? row.Article_Description ?? row.DESCRIPTION ?? '—'
    },
    {
      key: 'EAN',
      label: 'EAN',
      render: (val, row) => {
        const eanVal = row.EAN ?? row.Ean ?? row.ean;
        return (
          <span style={{ color: '#16a34a', fontWeight: 600 }}>
            {eanVal || '—'}
          </span>
        );
      }
    },
    {
      key: 'ENCODING_TAGS',
      label: 'ENCODING TAGS',
      render: (val, row) => {
        const tagVal = row.ENCODING_TAGS ?? row.Encoding_Tags ?? row.TAGS ?? row.QTY ?? row.Qty ?? 0;
        return (
          <span style={{ color: '#16a34a', fontWeight: 600 }}>
            {Number(tagVal).toLocaleString('en-IN')}
          </span>
        );
      }
    },
    {
      key: 'ENCODE_DATE',
      label: 'ENCODE DATE',
      render: (val, row) => {
        const rawDate = row.ENCODE_DATE ?? row.Encode_Date ?? row.DATE ?? row.Date;
        if (!rawDate) return '—';
        return String(rawDate).split('T')[0];
      }
    }
  ];

  // Dynamic KPI calculations based on current visible data
  const totalEan = new Set(data.map(d => d.EAN || d.Ean || d.ean)).size;
  const totalTags = data.reduce((sum, row) => sum + (Number(row.ENCODING_TAGS || row.Encoding_Tags || row.TAGS || row.QTY) || 0), 0);

  return (
    <AppLayout
      headerProps={{
        breadcrumb: (
          <>
            HOME - PAGES - REPORT - ENCODING - <span className="active">ALLOCATED STORE REPORT</span>
          </>
        ),
        showBackButton: true,
        onBackClick: () => navigate('/dashboard')
      }}
    >
      <div className="allocated-store-report-container">
        {/* /apply-report-standards layout */}
        <div className="report-search-card">
          <div className="report-search-header">
            <span>NOTE : FIELDS MARKED WITH (*) ARE REQUIRED</span>
          </div>
          
          <div className="report-search-body">
            <div className="search-field">
              <label>Assigned Store *</label>
              {storeOptions.length > 0 ? (
                <SearchableDropdown
                  value={storeName}
                  onChange={(val) => setStoreName(val || '')}
                  options={storeOptions}
                  placeholder="Select Store"
                  labelKey="text"
                  valueKey="value"
                />
              ) : (
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Store Code"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value.toUpperCase())}
                  />
                </div>
              )}
            </div>
            
            <div className="search-field">
              <label>From Date *</label>
              <CustomDatePicker
                value={fromDate}
                onChange={(date) => setFromDate(date)}
                portalId="root-portal"
              />
            </div>

            <div className="search-field">
              <label>To Date *</label>
              <CustomDatePicker
                value={toDate}
                onChange={(date) => setToDate(date)}
                portalId="root-portal"
              />
            </div>
            
            <div className="search-field">
              <label>Article No</label>
              <SearchableDropdown
                options={displayArticleOptions}
                value={articleNo}
                onChange={setArticleNo}
                placeholder="Select Article No"
                searchPlaceholder="Search Article No..."
                isAsync={true}
                onSearchChange={setArticleSearchTerm}
                isLoading={isArticleSearching}
                valueKey="id"
                closeOnSelect={true}
              />
            </div>
            
            <div className="search-field">
              <label>EAN</label>
              <SearchableDropdown
                options={displayEanOptions}
                value={ean}
                onChange={setEan}
                placeholder="Select EAN"
                searchPlaceholder="Search EAN..."
                isAsync={true}
                onSearchChange={setEanSearchTerm}
                isLoading={isEanSearching}
                valueKey="id"
                closeOnSelect={true}
              />
            </div>
          </div>

          <div className="report-search-center-actions">
            <SearchButton onClick={handleSearch} disabled={isLoading} />
            <ClearButton onClick={handleClear} disabled={isLoading} />
            <BackButton onClick={() => navigate('/dashboard')} label="Back to DC Summary" />
          </div>
        </div>

        {/* Selected Store / Date Subheader Bar */}
        <ReportStatsHeader 
            storeName={searchParams.storeName || 'ALL STORES'}
            fromDate={searchParams.fromDate}
            toDate={searchParams.toDate}
          />

        {/* 3 KPI Curved Cards in one row */}
        <div className="allocated-curved-cards">
          <CurvedCard
            title="ASSIGNED STORE"
            value={searchParams.storeName || 'ALL'}
            icon={<Store size={20} />}
            waveColor={['#bfdbfe', '#60a5fa']}
          />
          <CurvedCard
            title="EAN COUNT"
            value={totalEan}
            icon={<Hash size={20} />}
            waveColor={['#ede9fe', '#a78bfa']}
          />
          <CurvedCard
            title="ENCODING TAGS COUNT"
            value={totalTags.toLocaleString('en-IN')}
            icon={<Tag size={20} />}
            waveColor={['#fed7aa', '#fb923c']}
          />
        </div>

        {/* Data Table */}
        <div className="allocated-table-wrapper">
          <ReportDataTableCard
            columns={columns}
            data={data}
            totalRecords={totalRecords}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            pageIndex={pageIndex}
            pageSize={pageSize}
            onPageChange={setPageIndex}
            onPageSizeChange={setPageSize}
            onSearch={(term) => setSearchTerm(term)}
            exportFileName={`Allocated_Store_Report_${searchParams.fromDate}`}
          />
        </div>
      </div>
    </AppLayout>
  );
}
