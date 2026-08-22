import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSaleDashboard } from '../../../hooks/useDashboardData';
import KpiCard from '../../../components/charts/KpiCard';
import GroupedBarChart from '../../../components/charts/GroupedBarChart';
import DonutChart from '../../../components/charts/DonutChart';
import StoreRankList from '../../../components/charts/StoreRankList';
import SectionHeader, { DateBadge } from '../../../components/common/SectionHeader';
import DashboardShimmer from '../../../components/common/DashboardShimmer';
import ChartToolbar from '../../../components/common/ChartToolbar';
import ChartSearchInput from '../../../components/common/ChartSearchInput';
import { SearchEmptyState, GlobalEmptyState } from '../../../components/common/ChartEmptyState';
import '../../../components/charts/DashboardSection.css';
import './common.css';
import './CycleCountSection.css'; // For cc-container, cc-kpi-row, cc-split-layout, etc.

// SVG Icons
const Icons = {
  Cart: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>,
  Tag: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>,
  Match: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
  Manual: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Void: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>,
};

export default function SaleDashboardSection() {
  const { data, totals, isLoading, error } = useSaleDashboard();
  const navigate = useNavigate();
  const [searchFilter, setSearchFilter] = useState('');

  // Derived Metrics for Charts & Lists
  const { barData, donutData, rankList, overallMatchPercent } = useMemo(() => {
    if (!data || !totals) return { barData: [], donutData: [], rankList: [], overallMatchPercent: 0 };

    let filteredData = [...data];
    if (searchFilter.trim()) {
      const term = searchFilter.toLowerCase();
      filteredData = filteredData.filter(row => 
        (row.STORE && row.STORE.toLowerCase().includes(term)) ||
        (row.STORE_NAME && row.STORE_NAME.toLowerCase().includes(term))
      );
    }

    // 1. Bar Chart Data (Top 10 stores by DPOS Sale)
    const sortedData = [...filteredData].sort((a, b) => Number(b.TOTAL_DPOS_SALE || 0) - Number(a.TOTAL_DPOS_SALE || 0));
    const barData = sortedData.slice(0, 10).map(row => ({
      name: row.STORE,
      fullName: row.STORE_NAME,
      DPOS: Number(row.TOTAL_DPOS_SALE || 0),
      RFID: Number(row.TOTAL_RFID_CHECKOUT || 0)
    }));

    // 2. Donut Chart Data (Global Breakdowns)
    const matchRaw = Number((totals.RFID_CHECKOUT_MATCHING_WITH_DPOS_SALE || '0').replace(/,/g, ''));
    const mismatchRaw = Number((totals.RFID_CHECKOUT_NOT_MATCHING_WITH_DPOS_SALE || '0').replace(/,/g, ''));
    const manualRaw = Number((totals.TOTAL_MANUAL_SALE || '0').replace(/,/g, ''));
    const voidRaw = Number((totals.TOTAL_VOID || '0').replace(/,/g, ''));
    
    const donutData = [
      { name: 'Matched', value: matchRaw, color: '#22c55e' },
      { name: 'Mismatched', value: mismatchRaw, color: '#ef4444' },
      { name: 'Manual', value: manualRaw, color: '#f59e0b' },
      { name: 'Void', value: voidRaw, color: '#64748b' },
    ].filter(d => d.value > 0);

    const totalCheckout = matchRaw + mismatchRaw;
    const overallMatchPercent = totalCheckout > 0 ? ((matchRaw / totalCheckout) * 100).toFixed(1) : 0;

    // 3. Rank List (Stores with Highest Mismatches)
    const rankList = [...filteredData]
      .map(row => {
        const mismatch = Number(row.RFID_CHECKOUT_NOT_MATCHING_WITH_DPOS_SALE || 0);
        const rfid = Number(row.TOTAL_RFID_CHECKOUT || 0);
        const mismatchPercent = rfid > 0 ? (mismatch / rfid) * 100 : 0;
        return {
          ...row,
          MISMATCH_QTY: mismatch,
          MISMATCH_PERCENT: mismatchPercent.toFixed(1)
        };
      })
      .filter(row => row.MISMATCH_QTY > 0)
      .sort((a, b) => Number(b.MISMATCH_PERCENT) - Number(a.MISMATCH_PERCENT))
      .slice(0, 5);

    return { barData, donutData, rankList, overallMatchPercent };
  }, [data, totals, searchFilter]);

  const handleStoreClick = (storeData) => {
    console.log('Navigate to store:', storeData.STORE || storeData.name);
    // Future: navigate(`/reports/sales?store=${storeData.STORE}`);
  };

  // Loading Skeleton
  if (isLoading) return <DashboardShimmer title="Sale Operations" />;

  if (error) return <div className="ds-error">{error}</div>;

  if (!data || data.length === 0) {
    return (
      <div className="cc-container">
        <SectionHeader title="Sale Operations" rightContent={<DateBadge />} />
        <GlobalEmptyState 
          title="No Sales Data Available" 
          subtitle="There is currently no sales data for today." 
        />
      </div>
    );
  }

  return (
    <div className="cc-container">
      <SectionHeader title="Sale Operations" rightContent={<DateBadge />} />

      {/* 1. KPI Row */}
      <div className="cc-kpi-row">
        <KpiCard
          title="Total DPOS Sale"
          value={totals?.TOTAL_DPOS_SALE || '0'}
          badge="POS System"
          badgeVariant="default"
          icon={<Icons.Cart />}
        />
        <KpiCard
          title="Total RFID Checkout"
          value={totals?.TOTAL_RFID_CHECKOUT || '0'}
          badge="Scanned"
          badgeVariant="info"
          icon={<Icons.Tag />}
        />
        <KpiCard
          title="Match Accuracy"
          value={`${overallMatchPercent}%`}
          badge={totals?.RFID_CHECKOUT_MATCHING_WITH_DPOS_SALE || '0'}
          badgeVariant="success"
          subtext="items matched"
          icon={<Icons.Match />}
        />
        <KpiCard
          title="Manual Sales"
          value={totals?.TOTAL_MANUAL_SALE || '0'}
          badgeVariant="warning"
          icon={<Icons.Manual />}
        />
        <KpiCard
          title="Total Voids"
          value={totals?.TOTAL_VOID || '0'}
          badgeVariant="danger"
          icon={<Icons.Void />}
        />
      </div>

      {/* 2. Charts Row */}
      <div className="cc-split-layout">
        {/* Left: Grouped Bar Chart */}
        <div className="cc-card">
          <ChartToolbar 
            leftContent="Store Sales Comparison (Top 10)" 
            rightContent={
              <ChartSearchInput 
                value={searchFilter} 
                onChange={setSearchFilter} 
                onClear={() => setSearchFilter('')} 
                placeholder="Search Store..." 
              />
            } 
          />
          <div className="cc-chart-scroll">
            {barData.length === 0 ? (
              <SearchEmptyState searchFilter={searchFilter} onClearSearch={() => setSearchFilter('')} />
            ) : (
              <GroupedBarChart
                data={barData}
                bars={[
                  { dataKey: 'DPOS', color: '#059669', label: 'DPOS Sale' },
                  { dataKey: 'RFID', color: '#34d399', label: 'RFID Checkout' }
                ]}
                height={280}
                /* onBarClick={handleStoreClick} */
              />
            )}
          </div>
        </div>

        {/* Right: Donut Chart Breakdown */}
        <div className="cc-card">
          <ChartToolbar leftContent="Transaction Breakdown" />
          <div className="cc-chart-scroll">
            <DonutChart
              segments={donutData}
              centerText={totals?.TOTAL_RFID_CHECKOUT || '0'}
              centerSubtext="Total Checked Out"
              height={280}
            />
          </div>
        </div>
      </div>

      {/* 3. Quick-List Row */}
      <div className="cc-card">
        <ChartToolbar leftContent="Highest Mismatch Rates" />
        <div className="cc-chart-scroll" style={{ minHeight: '200px' }}>
          {rankList.length === 0 && searchFilter ? (
             <SearchEmptyState searchFilter={searchFilter} onClearSearch={() => setSearchFilter('')} />
          ) : (
            <StoreRankList
              items={rankList}
              labelKey="STORE_NAME"
              sublabelKey="STORE"
              valueKey="MISMATCH_PERCENT"
              diffKey="MISMATCH_QTY"
              diffLabel="Mismatched Items:"
              formatValue={(val) => `${val}%`}
              statusFn={(val) => val > 5 ? 'danger' : 'warning'}
              emptyText={searchFilter ? "No stores match your search." : "All stores have 100% match accuracy."}
              onItemClick={handleStoreClick}
            />
          )}
        </div>
      </div>

    </div>
  );
}
