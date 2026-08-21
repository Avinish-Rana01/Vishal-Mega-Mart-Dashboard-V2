import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useSaleDashboard } from '../../../hooks/useDashboardData';
import CurvedCard from '../../../components/common/CurvedCard';
import KpiCard from '../../../components/charts/KpiCard';
import GroupedBarChart from '../../../components/charts/GroupedBarChart';
import DonutChart from '../../../components/charts/DonutChart';
import StoreRankList from '../../../components/charts/StoreRankList';
import '../../../components/charts/DashboardSection.css';

// SVG Icons
const Icons = {
  Cart: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>,
  Tag: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>,
  Match: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
  Manual: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
};

export default function SaleDashboardSection() {
  const { data, totals, isLoading, error, refresh } = useSaleDashboard();
  const navigate = useNavigate();

  // Derived Metrics for Charts & Lists
  const { barData, donutData, rankList, overallMatchPercent } = useMemo(() => {
    if (!data || !totals) return { barData: [], donutData: [], rankList: [], overallMatchPercent: 0 };

    // 1. Bar Chart Data (Top 10 stores by DPOS Sale)
    const sortedData = [...data].sort((a, b) => Number(b.TOTAL_DPOS_SALE || 0) - Number(a.TOTAL_DPOS_SALE || 0));
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
    const rankList = [...data]
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
  }, [data, totals]);

  const handleStoreClick = (storeData) => {
    console.log('Navigate to store:', storeData.STORE || storeData.name);
    // Future: navigate(`/reports/sales?store=${storeData.STORE}`);
  };

  // Loading Skeleton
  if (isLoading) {
    return (
      <section className="ds-section">
        <div className="ds-skeleton-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[1,2,3,4].map(i => <div key={i} className="ds-skeleton-box" style={{ height: '140px' }}><div className="ds-shimmer" /></div>)}
        </div>
        <div className="ds-skeleton-row" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <div className="ds-skeleton-box" style={{ height: '350px' }}><div className="ds-shimmer" /></div>
          <div className="ds-skeleton-box" style={{ height: '350px' }}><div className="ds-shimmer" /></div>
        </div>
      </section>
    );
  }

  if (error) {
    return <div className="ds-error">{error}</div>;
  }

  return (
    <section className="ds-section">
      <div className="ds-header" style={{ alignItems: 'center', padding: '20px', background: '#fff', flexWrap: 'nowrap' }}>
        <div className="ds-header-text">
          <h1 style={{ whiteSpace: 'nowrap' }}>Sale Operations</h1>
          <p>Monitor RFID vs. POS sales, discrepancies, and manual overrides.</p>
        </div>
        <div className="ds-header-actions" style={{ alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
          <button onClick={refresh} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#0f172a', fontWeight: '500' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* 1. KPI Row */}
      <div className="ds-kpi-row">
        <CurvedCard
          title="Total DPOS Sale"
          value={totals?.TOTAL_DPOS_SALE || '0'}
          waveColor={['#047857', '#b2ffe7ff']} // Emerald gradient
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
      </div>

      {/* 2. Charts Row */}
      <div className="ds-charts-row ds-charts-row--2col">
        {/* Left: Grouped Bar Chart */}
        <div className="ds-card">
          <div className="ds-card-title--flex">
            <h3>Store Sales Comparison (Top 10)</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Click a bar for details</span>
          </div>
          <GroupedBarChart
            data={barData}
            bars={[
              { dataKey: 'DPOS', color: '#059669', label: 'DPOS Sale' },
              { dataKey: 'RFID', color: '#34d399', label: 'RFID Checkout' }
            ]}
            height={280}
            /* onBarClick={handleStoreClick} */
          />
        </div>

        {/* Right: Donut Chart Breakdown */}
        <div className="ds-card">
          <h3 className="ds-card-title">Transaction Breakdown</h3>
          <DonutChart
            segments={donutData}
            centerText={totals?.TOTAL_RFID_CHECKOUT || '0'}
            centerSubtext="Total Checked Out"
            height={280}
          />
        </div>
      </div>

      {/* 3. Quick-List Row */}
      <div className="ds-charts-row ds-charts-row--single ds-grow">
        <div className="ds-card">
          <div className="ds-card-title--flex">
            <h3>Highest Mismatch Rates</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Click a store for detailed report</span>
          </div>
          <StoreRankList
            items={rankList}
            labelKey="STORE_NAME"
            sublabelKey="STORE"
            valueKey="MISMATCH_PERCENT"
            diffKey="MISMATCH_QTY"
            diffLabel="Mismatched Items:"
            formatValue={(val) => `${val}%`}
            statusFn={(val) => val > 5 ? 'danger' : 'warning'}
            emptyText="All stores have 100% match accuracy."
            onItemClick={handleStoreClick}
          />
        </div>
      </div>

    </section>
  );
}
