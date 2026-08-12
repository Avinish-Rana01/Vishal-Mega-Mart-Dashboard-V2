import React, { useMemo } from 'react';
import { useLiveStock } from '../../../hooks/useDashboardData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './LiveStockSection.css'; // The new CSS

// Minimalist Icons
const ArrowUpRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7"></line>
    <polyline points="7 7 17 7 17 17"></polyline>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"></polyline>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
  </svg>
);

export default function LiveStockSection() {
  const { data, totals, isLoading, error, refresh } = useLiveStock();

  // Extract total numbers
  const rawSap = parseInt(totals?.SAP_STOCK?.toString().replace(/,/g, '') || 0, 10);
  const rawRfid = parseInt(totals?.RFID_STOCK?.toString().replace(/,/g, '') || 0, 10);
  const rawDiff = parseInt(totals?.DIFFERENCE?.toString().replace(/,/g, '') || 0, 10);
  const accuracyPercent = rawSap > 0 ? ((rawRfid / rawSap) * 100).toFixed(0) : 0;

  // Process data for the Bar Chart
  const barChartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.slice(0, 7).map(row => ({
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
      <div className="ls-header">
        <div>
          <h1>Live Stock</h1>
          <p>Monitor SAP vs RFID inventory differences across all stores.</p>
        </div>
        <div className="ls-header-actions">
          <button className="ls-btn ls-btn-primary" onClick={refresh}>
            <RefreshIcon /> Refresh Data
          </button>
          <button className="ls-btn ls-btn-secondary">
            Import Data
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

        <div className="ls-card">
          <h3 className="ls-card-title">Overall Accuracy</h3>
          <div className="ls-card-value">{accuracyPercent}%</div>
          <div className="ls-card-subtext">
            <span className="ls-badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>Live</span>
            Current global accuracy
          </div>
          <div className="ls-card-icon"><ArrowUpRight /></div>
        </div>

        {/* ROW 2 */}
        
        {/* 1. Store Performance Bar Chart (Span 2) */}
        <div className="ls-card ls-span-2">
          <h3 className="ls-section-title">Store Performance</h3>
          <div style={{ height: '240px', marginTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barGap={2}>
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
        </div>

        {/* 2. Global Accuracy Semi-Circle (Span 1) */}
        <div className="ls-card ls-span-1">
          <h3 className="ls-section-title">Stock Progress</h3>
          <div style={{ position: 'relative', height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <pattern id="striped-donut" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                    <rect width="8" height="8" fill="#f8fafc" />
                    <line x1="0" y="0" x2="0" y2="8" stroke="#e2e8f0" strokeWidth="3" />
                  </pattern>
                </defs>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="75%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius="65%"
                  outerRadius="100%"
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={10} /* Rounded edges for the slices */
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => value.toLocaleString('en-IN')} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Text inside Donut */}
            <div style={{ position: 'absolute', bottom: '15px', textAlign: 'center', width: '100%' }}>
              <div style={{ fontSize: '36px', fontWeight: '800', color: '#0f172a', lineHeight: '1' }}>{accuracyPercent}%</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Accuracy Rate</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px', fontSize: '12px', color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1d4ed8' }}></div> Scanned</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: 'url(#striped-donut)' }}></div> Missing</span>
          </div>
        </div>

        {/* 3. Store Accuracy Breakdown List (Span 1) */}
        <div className="ls-card ls-span-1">
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
  );
}
