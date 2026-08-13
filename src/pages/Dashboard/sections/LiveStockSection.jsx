import React, { useMemo } from 'react';
import { useLiveStock } from '../../../hooks/useDashboardData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { RefreshCw } from 'lucide-react';
import ChartPaginator from '../../../components/common/ChartPaginator';
import './LiveStockSection.css'; // The new CSS

// Minimalist Icons
const ArrowUpRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7"></line>
    <polyline points="7 7 17 7 17 17"></polyline>
  </svg>
);

export default function LiveStockSection() {
  const { data, totals, isLoading, error, refresh, pageIndex, totalPages, setPageIndex } = useLiveStock();

  // Extract total numbers
  const rawSap = parseInt(totals?.SAP_STOCK?.toString().replace(/,/g, '') || 0, 10);
  const rawRfid = parseInt(totals?.RFID_STOCK?.toString().replace(/,/g, '') || 0, 10);
  const rawDiff = parseInt(totals?.DIFFERENCE?.toString().replace(/,/g, '') || 0, 10);
  const accuracyPercent = rawSap > 0 ? ((rawRfid / rawSap) * 100).toFixed(0) : 0;

  // Process data for the Bar Chart
  const barChartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(row => ({
      name: row.STORE_CODE,
      SAP: Number(row.SAP_STOCK) || 0,
      RFID: Number(row.RFID_STOCK) || 0,
    }));
  }, [data]);

  // Semi-circle donut data
  const pieData = [
    { name: 'Completed', value: rawRfid, color: '#1d4ed8' }, // Dark blue
    { name: 'Pending', value: Math.abs(rawDiff), color: 'url(#striped-donut)' } // Striped
  ];

  // Store Accuracy Breakdown List
  const storeList = useMemo(() => {
    if (!data) return [];
    return data
      .sort((a, b) => Number(a.PERCENTAGE) - Number(b.PERCENTAGE)) // Worst first
      .slice(0, 5); // Show top 5
  }, [data]);

  if (isLoading) {
    return (
      <div className="ls-dashboard-container" style={{ minHeight: '600px' }}>
        <div className="vmm-shimmer" style={{ width: '100%', height: '100%', borderRadius: '16px' }}></div>
      </div>
    );
  }

  if (error) {
    return <div style={{ color: 'red', padding: '20px', background: '#fee2e2', borderRadius: '8px' }}>{error}</div>;
  }

  return (
    <div className="ls-dashboard-container">
      
      {/* Header */}
      <div className="ds-header">
        <div className="ds-header-text">
          <h1>Live Stock</h1>
          <p>Monitor SAP vs RFID inventory differences across all stores.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={refresh} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#475569' }}>
            <RefreshCw size={14} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="ls-grid">
        
        {/* ROW 1: 4 KPI Cards */}
        <div className="ls-card ls-card-active">
          <h3 className="ls-card-title">Total SAP Stock</h3>
          <div className="ls-card-value">{totals?.SAP_STOCK || '0'}</div>
          <div className="ls-card-subtext">
            <span className="ls-badge">System Data</span>
            Total expected volume
          </div>
          <div className="ls-card-icon"><ArrowUpRight /></div>
        </div>

        <div className="ls-card">
          <h3 className="ls-card-title">Total RFID Scanned</h3>
          <div className="ls-card-value">{totals?.RFID_STOCK || '0'}</div>
          <div className="ls-card-subtext">
            <span className="ls-badge">Physical</span>
            Actual scanned items
          </div>
          <div className="ls-card-icon"><ArrowUpRight /></div>
        </div>

        <div className="ls-card">
          <h3 className="ls-card-title">Global Variance</h3>
          <div className="ls-card-value">{totals?.DIFFERENCE || '0'}</div>
          <div className="ls-card-subtext">
            <span className="ls-badge" style={{ background: '#fef3c7', color: '#b45309' }}>Gap</span>
            Items missing
          </div>
          <div className="ls-card-icon"><ArrowUpRight /></div>
        </div>

        {/* ROW 2: Store Performance Bar Chart (Span 3 columns) */}
        <div className="ls-card" style={{ gridColumn: '1 / -1' }}>
          <h3 className="ls-section-title">Store Performance</h3>
          <div style={{ height: '240px', marginTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }} barGap={2}>
                <defs>
                  <pattern id="striped-bar" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                    <rect width="10" height="10" fill="#f8fafc" />
                    <line x1="0" y="0" x2="0" y2="10" stroke="#cbd5e1" strokeWidth="4" />
                  </pattern>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                {/* SAP is striped, RFID is solid blue with full rounded caps */}
                <Bar dataKey="SAP" fill="url(#striped-bar)" radius={15} maxBarSize={30} />
                <Bar dataKey="RFID" fill="#1d4ed8" radius={15} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ChartPaginator 
            currentPage={pageIndex} 
            totalPages={totalPages} 
            onPageChange={setPageIndex} 
          />
        </div>

        {/* ROW 3: Accuracy KPI + Store Accuracy Ranking (full width) */}
        <div className="ls-row-bottom">
          <div className="ls-card">
            <h3 className="ls-card-title">Overall Accuracy</h3>
            <div className="ls-card-value">{accuracyPercent}%</div>
            <div className="ls-card-subtext">
              <span className="ls-badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>Live</span>
              Current global accuracy
            </div>
            <div className="ls-card-icon"><ArrowUpRight /></div>
          </div>

          <div className="ls-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="ls-section-title" style={{ margin: 0 }}>Store Accuracy Ranking</h3>
          </div>
          
          <div className="ls-list-container">
            {storeList.map((row, i) => {
              const acc = Number(row.PERCENTAGE);
              let statusClass = 'status-success';
              if (acc < 85) statusClass = 'status-danger';
              else if (acc < 95) statusClass = 'status-warning';

              return (
                <div key={i} className="ls-list-item">
                  <div className="ls-item-icon">
                    {row.STORE_CODE.substring(0, 2)}
                  </div>
                  <div className="ls-item-content">
                    <h4 className="ls-item-title" title={row.STORE_NAME}>{row.STORE_NAME}</h4>
                    <p className="ls-item-subtitle">Diff: {Number(row.DIFFERENCE).toLocaleString('en-IN')}</p>
                  </div>
                  <div className={`ls-item-status ${statusClass}`}>
                    {acc}%
                  </div>
                </div>
              );
            })}
            
            {storeList.length === 0 && (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: '14px' }}>
                No store data available.
              </div>
            )}
          </div>
          </div>
        </div>

      </div>
    </div>
  );
}
