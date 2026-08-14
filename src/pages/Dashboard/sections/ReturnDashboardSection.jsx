import React, { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { useReturnDashboard } from '../../../hooks/useDashboardData';
import CurvedCard from '../../../components/common/CurvedCard';
import KpiCard from '../../../components/charts/KpiCard';
import GroupedBarChart from '../../../components/charts/GroupedBarChart';
import SemiDonutChart from '../../../components/charts/SemiDonutChart';
import StoreRankList from '../../../components/charts/StoreRankList';
import '../../../components/charts/DashboardSection.css';

// SVG Icons
const Icons = {
  CornerUpLeft: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></svg>,
  Barcode: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5v14M8 5v14M12 5v14M17 5v14M21 5v14"></path></svg>,
  Alert: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>,
};

export default function ReturnDashboardSection() {
  const { data, totals, isLoading, error, refresh } = useReturnDashboard();

  // Derived Metrics for Charts & Lists
  const { barData, rankList, encodePercent, totalReturnRaw, encodeRaw } = useMemo(() => {
    if (!data || !totals) return { barData: [], rankList: [], encodePercent: 0, totalReturnRaw: 0, encodeRaw: 0 };

    // 1. Bar Chart Data (Top 10 stores by Return Qty)
    const sortedData = [...data].sort((a, b) => Number(b.RETURN_QTY || 0) - Number(a.RETURN_QTY || 0));
    const barData = sortedData.slice(0, 10).map(row => ({
      name: row.Store_Code || row.STORE_CODE, // Return API uses Store_Code
      fullName: row.STORE_NAME,
      Return: Number(row.RETURN_QTY || 0),
      Encoded: Number(row.ENCODE_QTY || 0)
    }));

    // 2. Global Breakdown for SemiDonut
    const totalReturnRaw = Number((totals.RETURN_QTY || '0').replace(/,/g, ''));
    const encodeRaw = Number((totals.ENCODE_QTY || '0').replace(/,/g, ''));
    const encodePercent = totalReturnRaw > 0 ? ((encodeRaw / totalReturnRaw) * 100) : 0;

    // 3. Rank List (Stores with Highest Pending/Difference)
    const rankList = [...data]
      .filter(row => Number(row.DIFFERENCE_QTY || 0) > 0)
      .sort((a, b) => Number(b.DIFFERENCE_QTY || 0) - Number(a.DIFFERENCE_QTY || 0))
      .slice(0, 5);

    return { barData, rankList, encodePercent, totalReturnRaw, encodeRaw };
  }, [data, totals]);

  const handleStoreClick = (storeData) => {
    console.log('Navigate to store return report:', storeData.Store_Code || storeData.name);
  };

  if (isLoading) {
    return (
      <section className="ds-section">
        <div className="ds-skeleton-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[1,2,3].map(i => <div key={i} className="ds-skeleton-box" style={{ height: '140px' }}><div className="ds-shimmer" /></div>)}
        </div>
        <div className="ds-skeleton-row ds-charts-row--equal">
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
          <h1>Return</h1>
          <p>Track customer returns vs successfully encoded items.</p>
        </div>
        <div className="ds-header-actions" style={{ alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
          <button onClick={refresh} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#0f172a', fontWeight: '500' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* 1. KPI Row (3 cols since Return only has 3 main stats) */}
      <div className="ds-kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <CurvedCard
          title="Total Return Qty"
          value={totals?.RETURN_QTY || '0'}
          waveColor={['#a21caf', '#f6afffff']} // Fuchsia gradient
          icon={<Icons.CornerUpLeft />}
        />
        <KpiCard
          title="Encoded Qty"
          value={totals?.ENCODE_QTY || '0'}
          badgeVariant="success"
          icon={<Icons.Barcode />}
        />
        <KpiCard
          title="Pending Returns"
          value={totals?.DIFFERENCE_QTY || '0'}
          badge="Action Needed"
          badgeVariant="danger"
          icon={<Icons.Alert />}
        />
      </div>

      {/* 2. Charts Row */}
      <div className="ds-charts-row ds-charts-row--equal">
        {/* Left: Grouped Bar Chart */}
        <div className="ds-card">
          <div className="ds-card-title--flex">
            <h3>Return vs Encoded (Top 10)</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Click a bar for details</span>
          </div>
          <GroupedBarChart
            data={barData}
            bars={[
              { dataKey: 'Return', color: '#c026d3', label: 'Return Qty' },
              { dataKey: 'Encoded', color: '#f0abfc', label: 'Encoded Qty' }
            ]}
            height={280}
            onBarClick={handleStoreClick}
          />
        </div>

        {/* Right: SemiDonut Chart */}
        <div className="ds-card">
          <h3 className="ds-card-title">Overall Encoding Completion</h3>
          <div style={{ marginTop: '20px' }}>
            <SemiDonutChart
              value={encodeRaw}
              maxValue={totalReturnRaw}
              centerLabel="Encoded"
              primaryColor="#c026d3"
            />
          </div>
        </div>
      </div>

      {/* 3. Quick-List Row */}


    </section>
  );
}
