import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import CurvedCard from '../../components/common/CurvedCard';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import { getTagDetails } from '../../services/stockService';
import * as Icons from 'lucide-react';
import './common-reports.css';
import './TagInventoryDistribution.css';

// Helper to get formatted today date
const getTodayDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function TagInventoryDistributionPage() {
  const navigate = useNavigate();
  const sliderRef = useRef(null);

  // Table & Pager state
  const [reportData, setReportData] = useState([]);
  const [storeInventory, setStoreInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('CYCLE_COUNT');
  const [sortDirection, setSortDirection] = useState('desc');

  const exportFilters = useMemo(() => ({
    sortColumn,
    sortDirection
  }), [sortColumn, sortDirection]);

  // KPI Summary
  const [summary, setSummary] = useState({
    recordCount: 0,
    cycleCount: 0,
    storeCount: 0,
    whCount: 0,
    avgRecycle: '0.00',
    snapshotDate: getTodayDate()
  });

  // Fetch Tag Management details
  const fetchData = useCallback(async (signal) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getTagDetails({
        searchTerm,
        pageIndex,
        pageSize,
        sortColumn,
        sortDirection
      }, signal);

      const items = result?.tagData || result?.TagData || [];
      const stores = result?.storeInventory || result?.StoreInventory || [];
      const pager = result?.pager || result?.Pager || {};

      setReportData(items);
      setStoreInventory(stores);

      const recCount = pager.recordCount ?? pager.RecordCount ?? 0;
      const cycCount = pager.cycleCount ?? pager.CycleCount ?? 0;
      const avg = recCount > 0 ? (cycCount / recCount).toFixed(2) : '0.00';

      setTotalRecords(recCount);
      setSummary({
        recordCount: recCount,
        cycleCount: cycCount,
        storeCount: pager.storeCount ?? pager.StoreCount ?? 0,
        whCount: pager.whCount ?? pager.WhCount ?? 0,
        avgRecycle: avg,
        snapshotDate: items[0]?.date ? String(items[0].date).split('T')[0] : getTodayDate()
      });
    } catch (err) {
      if (err.name !== 'AbortError' && err.message !== 'canceled' && err.code !== 'ERR_CANCELED') {
        console.error('Error fetching Tag Details:', err);
        setError(err.message || 'Failed to fetch tag inventory data.');
        setReportData([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, pageIndex, pageSize, sortColumn, sortDirection]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  // Carousel scroll controls
  const handleScrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -260, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 260, behavior: 'smooth' });
    }
  };

  // Formatted Store items for the slider
  const storeCards = useMemo(() => {
    const themes = ['purple', 'green', 'orange', 'blue'];
    return storeInventory.map((item, idx) => {
      const name = item.storE_NAME || item.STORE_NAME || item.store_Name || 'Unknown';
      const count = item.taG_COUNT ?? item.TAG_COUNT ?? item.tag_Count ?? 0;
      const isGrc = name.toUpperCase().includes('GRC');
      const theme = isGrc ? 'blue' : themes[idx % themes.length];
      return {
        id: idx,
        name,
        count,
        isGrc,
        theme
      };
    });
  }, [storeInventory]);

  // Aggregate metrics for store inventory header
  const totalStoresCount = useMemo(() => {
    return storeCards.filter(s => !s.isGrc).length || storeCards.length;
  }, [storeCards]);

  const totalStoreTags = useMemo(() => {
    if (summary.storeCount > 0) return summary.storeCount;
    return storeCards.reduce((acc, s) => acc + (s.count || 0), 0);
  }, [storeCards, summary.storeCount]);

  // Table Columns Definition
  const columns = useMemo(() => [
    {
      key: 'RowNumber',
      label: 'SR.NO',
      sortable: true,
      render: (val, row, idx) => (row.rowNumber ?? row.RowNumber ?? (pageIndex - 1) * pageSize + idx + 1)
    },
    {
      key: 'TID',
      label: 'TAG ID',
      sortable: true,
      render: (val, row) => (
        <span className="tag-id-cell">{row.tid || row.TID || row.tag_Id || row.taG_ID || val || '-'}</span>
      )
    },
    {
      key: 'CYCLE_COUNT',
      label: 'RECYCLE COUNT',
      sortable: true,
      render: (val, row) => (row.cycle_Count ?? row.cyclE_COUNT ?? row.CYCLE_COUNT ?? row.recycle_Count ?? row.recyclE_COUNT ?? val ?? 0)
    },
    {
      key: 'LOCATION',
      label: 'TAG LOCATION (LAST KNOWN)',
      sortable: true,
      render: (val, row) => {
        const loc = row.location || row.LOCATION || row.tag_Location || row.taG_LOCATION || val || '';
        const isWh = String(loc).toLowerCase().includes('ware');
        return (
          <span className={`tag-location-pill ${isWh ? 'tag-location-pill--warehouse' : 'tag-location-pill--store'}`}>
            {loc}
          </span>
        );
      }
    },
    {
      key: 'LOCATION_NAME',
      label: 'LOCATION NAME (LAST KNOWN)',
      sortable: true,
      render: (val, row) => (row.location_Name || row.locatioN_NAME || row.LOCATION_NAME || row.store_Name || row.storE_NAME || val || '-')
    },
    {
      key: 'STATUS',
      label: 'STATUS (LAST KNOWN)',
      sortable: true,
      render: (val, row) => {
        const status = row.status || row.STATUS || val || '';
        const lower = String(status).toLowerCase();
        let variant = 'default';
        if (lower.includes('encod')) variant = 'warehouse';
        else if (lower.includes('grc')) variant = 'grc';
        else if (lower.includes('cycle')) variant = 'cycle';
        return (
          <span className={`tag-status-pill tag-status-pill--${variant}`}>
            {status}
          </span>
        );
      }
    }
  ], [pageIndex, pageSize]);

  return (
    <AppLayout
      headerProps={{
        breadcrumb: (
          <>
            HOME - PAGES - TAG MANAGEMENT - <span className="active">TAG INVENTORY/RECYCLE DISTRIBUTION</span>
          </>
        ),
        showBackButton: true,
        onBackClick: () => navigate('/dashboard')
      }}
      mainClassName="flex-col-main"
    >
      <div className="report-page-container tag-dist-page">
        {error && <div className="report-error-banner">{error}</div>}

        {/* 1. Top Row: 3 Curved Cards using common-reports structure */}
        <div className="report-curved-cards">
          {/* Card 1: Data As Of */}
          <div className="ds-kpi-item">
            <CurvedCard
              title="DATA AS OF"
              value={summary.snapshotDate}
              animate={false}
              waveColor={['#fca5a5', '#ef4444']}
              icon={<Icons.Calendar size={18} color="#ef4444" />}
              badge={
                <div className="tag-kpi-pill tag-kpi-pill--red">
                  <span className="tag-pill-dot" /> Latest Snapshot
                </div>
              }
            />
          </div>

          {/* Card 2: Total Tag Count */}
          <div className="ds-kpi-item">
            <CurvedCard
              title="TOTAL TAG COUNT"
              value={summary.recordCount.toLocaleString('en-IN')}
              animate={false}
              waveColor={['#d8b4fe', '#c026d3']}
              icon={<Icons.Tag size={18} color="#a855f7" />}
              badge={
                <div className="tag-kpi-pill tag-kpi-pill--purple">
                  # Unique Tags
                </div>
              }
            />
          </div>

          {/* Card 3: Total Recycle Count */}
          <div className="ds-kpi-item">
            <CurvedCard
              title="TOTAL RECYCLE COUNT"
              value={summary.cycleCount.toLocaleString('en-IN')}
              animate={false}
              waveColor={['#86efac', '#10b981']}
              icon={<Icons.RefreshCw size={18} color="#10b981" />}
              badge={
                <div className="tag-kpi-pill tag-kpi-pill--green">
                  <Icons.TrendingUp size={13} style={{ strokeWidth: 2.5 }} /> Average {summary.avgRecycle}
                </div>
              }
            />
          </div>
        </div>

        {/* Subtle Separator */}
        <div className="tag-section-divider" />

        {/* 2. Middle Section: Store Wise Tag Inventory */}
        <div className="tag-store-inventory-card">
          <div className="tag-store-header-row">
            <div className="tag-store-title-left">
              <div className="tag-store-header-icon">
                <Icons.Store size={20} />
              </div>
              <h3>Store Wise Tag Inventory</h3>
            </div>

            <div className="tag-store-header-badges">
              <div className="tag-stat-badge">
                Total Stores : <strong>{totalStoresCount}</strong>
              </div>
              <div className="tag-stat-badge">
                Total Tags : <strong>{totalStoreTags.toLocaleString('en-IN')}</strong>
              </div>
              <button 
                type="button" 
                className="tag-chart-icon-btn" 
                title="Inventory Analytics"
                aria-label="View Analytics"
              >
                <Icons.TrendingUp size={16} />
              </button>
            </div>
          </div>

          {/* Footnote on GRC Incomplete */}
          <div className="tag-grc-note-row">
            <div className="tag-grc-note">
              <span className="tag-grc-note-star">*</span>
              <span className="tag-grc-note-bold">GRC INCOMPLETE :</span> Received at store but not validated at warehouse.
            </div>
          </div>

          {/* Horizontal Slider / Carousel */}
          <div className="tag-slider-wrapper">
            <button
              type="button"
              className="tag-slider-arrow prev"
              onClick={handleScrollLeft}
              title="Previous stores"
              aria-label="Previous stores"
            >
              <Icons.ChevronLeft size={20} />
            </button>

            <div className="tag-slider-track" ref={sliderRef}>
              {storeCards.length > 0 ? (
                storeCards.map((store) => (
                  <div key={store.id} className="tag-store-item-card">
                    <div className={`tag-store-item-icon-box tag-store-item-icon-box--${store.theme}`}>
                      <Icons.Store size={20} />
                    </div>
                    <div className="tag-store-item-name" title={store.name}>
                      {store.name}
                      {store.isGrc && <span className="star">*</span>}
                    </div>
                    <div className="tag-store-item-count">
                      {store.count.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px', color: '#94a3b8', fontSize: '13px' }}>
                  No store inventory data available.
                </div>
              )}
            </div>

            <button
              type="button"
              className="tag-slider-arrow next"
              onClick={handleScrollRight}
              title="Next stores"
              aria-label="Next stores"
            >
              <Icons.ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* 3. Bottom Section: Data Table */}
        <div className="report-table-wrapper" style={{ marginTop: '4px' }}>
          <ReportDataTableCard
            columns={columns}
            data={reportData}
            isLoading={isLoading}
            pageIndex={pageIndex}
            onPageChange={setPageIndex}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            totalRecords={totalRecords}
            onSearch={setSearchTerm}
            searchValue={searchTerm}
            searchPlaceholder="Search Records"
            onSortChange={(col, dir) => {
              setSortColumn(col);
              setSortDirection(dir);
              setPageIndex(1);
            }}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            reportName="TAG_INVENTORY_DISTRIBUTION"
            exportFilters={exportFilters}
            exportFileName="Tag_Inventory_Recycle_Distribution.xlsx"
          />
        </div>
      </div>
    </AppLayout>
  );
}
