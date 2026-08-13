import React, { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { useWarehouseEncoding } from '../../../hooks/useDashboardData';
import CurvedCard from '../../../components/common/CurvedCard';
import KpiCard from '../../../components/charts/KpiCard';
import TimelineChart from '../../../components/charts/TimelineChart';
import StoreRankList from '../../../components/charts/StoreRankList';
import '../../../components/charts/DashboardSection.css';

// SVG Icons
const Icons = {
  Barcode: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5v14M8 5v14M12 5v14M17 5v14M21 5v14"></path></svg>,
  TrendingUp: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
  Activity: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
};

export default function DcEncodingSection() {
  const { chartData, isLoading, error, fromDate, setFromDate, toDate, setToDate, refresh } = useWarehouseEncoding();

  // Derived Metrics
  const { totalEncoded, peakHour, avgPerHour, topHours } = useMemo(() => {
    if (!chartData || chartData.length === 0) return { totalEncoded: 0, peakHour: 'None', avgPerHour: 0, topHours: [] };

    let total = 0;
    let max = 0;
    let peak = 'None';
    let activeHoursCount = 0;

    const topHoursData = [...chartData]
      .filter(d => {
        const c = Number(d.count);
        total += c;
        if (c > 0) activeHoursCount++;
        if (c > max) {
          max = c;
          peak = d.timeBlock;
        }
        return c > 0; // Filter out 0 hours for the ranking list
      })
      .sort((a, b) => Number(b.count) - Number(a.count))
      .slice(0, 5); // Top 5 busiest hours

    const avg = activeHoursCount > 0 ? (total / activeHoursCount).toFixed(0) : 0;

    return { totalEncoded: total, peakHour: peak, avgPerHour: avg, topHours: topHoursData };
  }, [chartData]);

  if (isLoading) {
    return (
      <section className="ds-section">
        <div className="ds-skeleton-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[1,2,3].map(i => <div key={i} className="ds-skeleton-box" style={{ height: '140px' }}><div className="ds-shimmer" /></div>)}
        </div>
        <div className="ds-skeleton-row ds-charts-row--single">
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
      
      {/* Interactive Header with Date Pickers */}
      <div className="ds-header" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', background: '#fff', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div className="ds-header-text">
            <h1 style={{ whiteSpace: 'nowrap' }}>DC Encoding Performance</h1>
            <p>Track warehouse encoding throughput and hourly trends.</p>
          </div>
          <button onClick={refresh} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#0f172a', fontWeight: '500', whiteSpace: 'nowrap' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>From:</span>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>To:</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
          </div>
        </div>
      </div>

      {/* 1. KPI Row (3 cols) */}
      <div className="ds-kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <CurvedCard
          title="Tags Encoded"
          value={totalEncoded.toLocaleString('en-IN')}
          waveColor={['#3b82f6', '#ffffffff']} // Orange gradient
          icon={<Icons.Barcode />}
        />
        <KpiCard
          title="Peak Encoding Hour"
          value={peakHour}
          badge="Busiest Block"
          badgeVariant="warning"
          icon={<Icons.TrendingUp />}
        />
        <KpiCard
          title="Average Encoding / Hour"
          value={Number(avgPerHour).toLocaleString('en-IN')}
          subtext="across active hours"
          badgeVariant="info"
          icon={<Icons.Activity />}
        />
      </div>

      {/* 2. Charts Row (Full Width Timeline) */}
      <div className="ds-charts-row ds-charts-row--single">
        <div className="ds-card">
          <div className="ds-card-title--flex">
            <h3>Hourly Encoding Activity</h3>
          </div>
          <TimelineChart
            data={chartData}
            dataKey="count"
            labelKey="timeBlock"
            color="#3b82f6" // blue
            highlightColor="#f59e0b" // amber peak
            height={280}
            tooltipLabel="Tags Encoded"
          />
        </div>
      </div>

      {/* 3. Quick-List Row */}


    </section>
  );
}
