import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Ban, CheckCircle, MinusCircle } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import CustomDatePicker from '../../components/common/CustomDatePicker';
import CurvedCard from '../../components/common/CurvedCard';
import ReportStatsHeader from '../../components/common/ReportStatsHeader';
import { ClearButton, BackButton } from '../../components/common/ReportActionButton';
import './LiveStockReport.css'; // Import standard report styles
import { getVoidDetails, getBindStores } from '../../services/stockService';
import { dateRenderer, numRenderer } from '../../utils/dashboardColumns';
import { useNavigate } from 'react-router-dom';
import './common-reports.css';

export default function VoidDetailsReportPage() {
  const location = useLocation();
  const { storeCode: initialStore, date: initialDate } = location.state || {};

  const defaultDate = initialDate || '2026-07-21';
  const [selectedStore, setSelectedStore] = useState(initialStore || '');
  const [fromDate, setFromDate] = useState(defaultDate);
  const [toDate, setToDate] = useState(defaultDate);
  const [storeOptions, setStoreOptions] = useState([]);
  
  const navigate = useNavigate();
  
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortColumn, setSortColumn] = useState('DATE');
  const [sortDirection, setSortDirection] = useState('asc');

  // Totals
  const [totals, setTotals] = useState({
    voidQty: 0,
    encodeQty: 0,
    differenceQty: 0
  });

  const exportFilters = useMemo(() => ({
    storeCode: selectedStore,
    fromDate,
    toDate,
    sortColumn,
    sortDirection
  }), [selectedStore, fromDate, toDate, sortColumn, sortDirection]);

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
  }, [fromDate, toDate]);

  // Fetch Report Data
  const fetchReportData = async (signal) => {
    setIsLoading(true);
    setReportData([]);
    setError(null);
    try {
      const result = await getVoidDetails(selectedStore, fromDate, toDate, pageIndex, pageSize, sortColumn || 'DATE', sortDirection || 'asc', signal);
      setReportData(result?.data || result?.Data || []);
      setTotalRecords(result?.recordCount || result?.RecordCount || 0);
      setTotals({
        voidQty: result?.voidQty || result?.VoidQty || 0,
        encodeQty: result?.encodeQty || result?.EncodeQty || 0,
        differenceQty: result?.differenceQty || result?.DifferenceQty || 0
      });
    } catch (err) {
      if (err.name !== 'AbortError' && err.message !== 'canceled' && err.code !== 'ERR_CANCELED') {
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
  }, [pageIndex, pageSize, selectedStore, fromDate, toDate, sortColumn, sortDirection]);

  const handleClear = () => {
    setSelectedStore(initialStore || '');
    setFromDate(defaultDate);
    setToDate(defaultDate);
    setSortColumn('DATE');
    setSortDirection('asc');
    setPageIndex(1);
  };

  const handleNavigateToRecon = (row) => {
    // If the row doesn't have a DATE string, handle gracefully
    let rowDate = '';
    if (row && row.DATE) {
      rowDate = String(row.DATE).split('T')[0];
    }
    
    navigate('/reports/void-reconciliation', {
      state: {
        storeCode: selectedStore,
        date: rowDate
      }
    });
  };

  const columns = [
    { key: 'SR_NO', label: 'SR.NO', render: (val, row, idx) => ((pageIndex - 1) * pageSize) + idx + 1 },
    { key: 'DATE', label: 'DATE', render: dateRenderer },
    { key: 'VOID_QTY', label: 'VOID QTY', render: (val, row) => (
        <span 
          className="report-link-action"
          onClick={() => handleNavigateToRecon(row)}
        >
          {numRenderer(val)}
        </span>
      )
    },
    { key: 'ENCODE_QTY', label: 'ENCODED VS VOID (QTY)', render: (val, row) => (
        <span 
          className="report-link-action"
          onClick={() => handleNavigateToRecon(row)}
        >
          {numRenderer(val)}
        </span>
      )
    },
    { key: 'DIFFERENCE_QTY', label: 'PENDING QTY', render: (val, row) => (
        <span 
          className="report-link-action-danger"
          onClick={() => handleNavigateToRecon(row)}
        >
          {numRenderer(val)}
        </span>
      )
    }
  ];

  const getStoreName = () => {
    if (!selectedStore) return 'ALL STORES';
    const storeObj = storeOptions.find(s => s.id === selectedStore || s.text?.startsWith(selectedStore));
    if (storeObj) return storeObj.text;
    return selectedStore;
  };

  return (
    <AppLayout 
      headerProps={{
        breadcrumb: <>HOME - PAGES - REPORT - <span className="active">VOID REPORT</span></>,
        showBackButton: true,
        onBackClick: () => window.history.back()
      }}
    >
      <div className="report-search-card">
        <div className="report-search-header">
            <span>NOTE : FIELDS MARKED WITH (*) ARE REQUIRED</span>
          </div>
          <div className="report-search-body">
            <div className="search-field">
              <label>Store Code</label>
              <SearchableDropdown
                options={storeOptions}
                value={selectedStore}
                onChange={setSelectedStore}
                placeholder="All Stores"
              />
            </div>
            
            <div className="search-field">
              <label>From Date *</label>
              <CustomDatePicker value={fromDate} onChange={(val) => { setFromDate(val); setPageIndex(1); }} />
            </div>

            <div className="search-field">
              <label>To Date</label>
              <CustomDatePicker value={toDate} onChange={(val) => { setToDate(val); setPageIndex(1); }} />
            </div>

            <div className="search-buttons">
              <ClearButton onClick={handleClear} />
              <BackButton onClick={() => navigate(-1)} label="Back to Void Summary" />
            </div>
          </div>
        </div>

      {error && <div className="report-error-banner">{error}</div>}

      <ReportStatsHeader 
        storeName={selectedStore || 'ALL STORES'}
        fromDate={fromDate}
        toDate={toDate}
      />

      <div className="ds-kpi-row">
          <div className="ds-kpi-item">
            <CurvedCard
              title="VOID QUANTITY"
              value={totals.voidQty.toLocaleString('en-IN')}
              waveColor={['#f472b6', '#db2777']}
              icon={<Ban size={20} color="#ffffff" />}
            />
          </div>
          <div className="ds-kpi-item">
            <CurvedCard
              title="ENCODE QUANTITY"
              value={totals.encodeQty.toLocaleString('en-IN')}
              waveColor={['#7dd3fc', '#0284c7']}
              icon={<CheckCircle size={20} color="#ffffff" />}
            />
          </div>
          <div className="ds-kpi-item">
            <CurvedCard
              title="DIFFERENCE QUANTITY"
              value={totals.differenceQty.toLocaleString('en-IN')}
              waveColor={['#fcd34d', '#ea580c']}
              icon={<MinusCircle size={20} color="#ffffff" />}
            />
        </div>
      </div>

      <div className="report-table-wrapper">
        <ReportDataTableCard
          title="Void Details Data"
          columns={columns}
          data={reportData}
          totalRecords={totalRecords}
          pageIndex={pageIndex}
          pageSize={pageSize}
          reportName="VOID_DETAILS"
          exportFilters={exportFilters}
          exportFileName={`Void_Details_${selectedStore || 'ALL'}_${fromDate}_to_${toDate}.xlsx`}
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
        />
      </div>
    </AppLayout>
  );
}

