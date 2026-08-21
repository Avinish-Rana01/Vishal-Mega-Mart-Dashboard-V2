import React, { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { useVendorDiscrepancy } from '../../../hooks/useDashboardData';
import CurvedCard from '../../../components/common/CurvedCard';
import KpiCard from '../../../components/charts/KpiCard';
import GroupedBarChart from '../../../components/charts/GroupedBarChart';
import SemiDonutChart from '../../../components/charts/SemiDonutChart';
import StoreRankList from '../../../components/charts/StoreRankList';
import '../../../components/charts/DashboardSection.css';

// SVG Icons
const Icons = {
  Truck: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>,
  Box: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
  Alert: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
  History: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
};

export default function VendorDiscrepancySection() {
  const { data, totals, isLoading, error, refresh } = useVendorDiscrepancy();

  // Derived Metrics for Charts & Lists
  const { barData, rankList, totalExpectedRaw, totalScannedRaw } = useMemo(() => {
    if (!data || !totals) return { barData: [], rankList: [], totalExpectedRaw: 0, totalScannedRaw: 0 };

    // 1. Bar Chart Data (Top 10 vendors by Expected Qty)
    const sortedData = [...data].sort((a, b) => Number(b.ACTUAL_QTY || 0) - Number(a.ACTUAL_QTY || 0));
    const barData = sortedData.slice(0, 10).map(row => ({
      name: row.VENDOR_CODE,
      fullName: row.VENDOR_NAME,
      Expected: Number(row.ACTUAL_QTY || 0),
      Scanned: Number(row.SCANNED_QTY || 0)
    }));

    // 2. Global Breakdowns
    const totalExpectedRaw = Number((totals.ACTUAL_QTY || '0').replace(/,/g, ''));
    const totalScannedRaw = Number((totals.SCANNED_QTY || '0').replace(/,/g, ''));

    // 3. Rank List (Vendors with Highest Discrepancy)
    const rankList = [...data]
      .filter(row => Number(row.DIFF_QTY || 0) > 0)
      .sort((a, b) => Number(b.DIFF_QTY || 0) - Number(a.DIFF_QTY || 0))
      .slice(0, 5);

    return { barData, rankList, totalExpectedRaw, totalScannedRaw };
  }, [data, totals]);

  const handleVendorClick = (vendorData) => {
    console.log('Navigate to vendor report:', vendorData.VENDOR_CODE || vendorData.name);
  };

  if (isLoading) {
    return (
      <section className="ds-section">
        <div className="ds-skeleton-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[1,2,3,4].map(i => <div key={i} className="ds-skeleton-box" style={{ height: '140px' }}><div className="ds-shimmer" /></div>)}
        </div>
        <div className="ds-skeleton-row ds-charts-row--2col">
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
          <h1 style={{ whiteSpace: 'nowrap' }}>Vendor Discrepancy</h1>
          <p>Track ASNs with missing or surplus goods at receiving.</p>
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
          title="Total Qty"
          value={totals?.ACTUAL_QTY || '0'}
          waveColor={['#0f766e', '#77d2cbff']} // Teal gradient
          icon={<Icons.Truck />}
        />
        <KpiCard
          title="Total Scanned Qty"
          value={totals?.SCANNED_QTY || '0'}
          badgeVariant="success"
          icon={<Icons.Box />}
        />
        <KpiCard
          title="Current Discrepancy"
          value={totals?.DIFF_QTY || '0'}
          badge="Action Needed"
          badgeVariant="danger"
          icon={<Icons.Alert />}
        />
        <KpiCard
          title="Historical Discrepancy"
          value={totals?.DIFF_TILL_DATE || '0'}
          subtext="Cumulative shortfalls"
          badgeVariant="warning"
          icon={<Icons.History />}
        />
      </div>

      {/* 2. Charts Row */}
      <div className="ds-charts-row ds-charts-row--2col">
        {/* Left: Grouped Bar Chart */}
        <div className="ds-card">
          <div className="ds-card-title--flex">
            <h3>Expected vs Scanned (Top 10 Vendors)</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Click a bar for details</span>
          </div>
          <GroupedBarChart
            data={barData}
            bars={[
              { dataKey: 'Expected', color: '#94a3b8', label: 'Expected Qty' },
              { dataKey: 'Scanned', color: '#0d9488', label: 'Scanned Qty' }
            ]}
            height={280}
            /* onBarClick={handleVendorClick} */
          />
        </div>

        {/* Right: SemiDonut Chart */}
        <div className="ds-card">
          <h3 className="ds-card-title">Global Receiving Accuracy</h3>
          <div style={{ marginTop: '20px' }}>
            <SemiDonutChart
              value={totalScannedRaw}
              maxValue={totalExpectedRaw}
              centerLabel="Received"
              primaryColor="#0d9488"
            />
          </div>
        </div>
      </div>

      {/* 3. Quick-List Row */}


    </section>
  );
}
