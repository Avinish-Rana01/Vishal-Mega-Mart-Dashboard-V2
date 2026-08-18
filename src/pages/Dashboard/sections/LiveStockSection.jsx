import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveStock } from '../../../hooks/useDashboardData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,LabelList } from 'recharts';
import { RefreshCw } from 'lucide-react';
import ChartPaginator from '../../../components/common/ChartPaginator';
import './LiveStockSection.css';

// Minimalist Icons
const ArrowUpRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7"></line>
    <polyline points="7 7 17 7 17 17"></polyline>
  </svg>
);

// --- MOCK DATA GENERATOR ---
const generateMockData = () => {
  const stores = [];
  let totalSap = 0;
  let totalRfid = 0;

  for (let i = 1; i <= 125; i++) {
    const storeCode = `ST${i.toString().padStart(3, '0')}`;
    const sapStock = Math.floor(Math.random() * 50000) + 10000; // 10k-60k
    
    // Distribute accuracy: 46% >=95, 26% 90-95, 17% 80-90, 11% <80
    const rand = Math.random();
    let accuracy;
    if (rand < 0.46) accuracy = 0.95 + Math.random() * 0.05; // 95-100%
    else if (rand < 0.72) accuracy = 0.90 + Math.random() * 0.05; // 90-95%
    else if (rand < 0.89) accuracy = 0.80 + Math.random() * 0.10; // 80-90%
    else accuracy = 0.60 + Math.random() * 0.20; // 60-80%

    const rfidStock = Math.floor(sapStock * accuracy);
    const diff = sapStock - rfidStock;
    const percentage = ((rfidStock / sapStock) * 100).toFixed(2);

    totalSap += sapStock;
    totalRfid += rfidStock;

    stores.push({
      STORE_CODE: storeCode,
      STORE_NAME: `${storeCode} - Mock Store ${i}`,
      SAP_STOCK: sapStock,
      RFID_STOCK: rfidStock,
      DIFFERENCE: diff,
      PERCENTAGE: percentage
    });
  }

  const mockTotals = {
    SAP_STOCK: totalSap.toLocaleString('en-IN'),
    RFID_STOCK: totalRfid.toLocaleString('en-IN'),
    DIFFERENCE: (totalSap - totalRfid).toLocaleString('en-IN')
  };

  return { mockStores: stores, mockTotals };
};

const { mockStores, mockTotals } = generateMockData();
// ---------------------------

export default function LiveStockSection() {
  const { data: realData, totals: realTotals, isLoading, error, refresh } = useLiveStock();
  
  // USE MOCK DATA OVERRIDE
  const data = mockStores;
  const totals = mockTotals;
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];

  // Filters State
  const [filterAcc, setFilterAcc] = React.useState('ALL');
  const [searchStore, setSearchStore] = React.useState('');

  const filteredData = React.useMemo(() => {
    if (!data) return [];
    let result = data;

    if (searchStore.trim()) {
      const term = searchStore.toLowerCase();
      result = result.filter(row => 
        (row.STORE_CODE && row.STORE_CODE.toLowerCase().includes(term)) ||
        (row.STORE_NAME && row.STORE_NAME.toLowerCase().includes(term))
      );
    }

    if (filterAcc !== 'ALL') {
      result = result.filter(row => {
        const acc = Number(row.PERCENTAGE) || 0;
        if (filterAcc === '<80') return acc < 80;
        if (filterAcc === '80-90') return acc >= 80 && acc < 90;
        if (filterAcc === '90-95') return acc >= 90 && acc < 95;
        if (filterAcc === '>=95') return acc >= 95;
        return true;
      });
    }

    return result;
  }, [data, searchStore, filterAcc]);

  const barChartData = React.useMemo(() => {
    return filteredData.map(row => {
      const percentage = Number(row.PERCENTAGE) || 0;
      const sap = Number(row.SAP_STOCK) || 0;
      const rfid = Number(row.RFID_STOCK) || 0;
      const difference = sap > rfid ? sap - rfid : 0;
      
      return {
        name: row.STORE_CODE,
        PERCENTAGE: percentage,
        RFID: rfid,
        Difference: difference
      };
    });
  }, [filteredData]);

  // Global Store Coverage Distribution Pie Chart Data
  const accuracyPieData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    let excellent = 0; // >= 95%
    let good = 0;      // 90 - 94.99%
    let average = 0;   // 80 - 89.99%
    let poor = 0;      // < 80%

    data.forEach(row => {
      const acc = Number(row.PERCENTAGE) || 0;
      if (acc >= 95) excellent++;
      else if (acc >= 90) good++;
      else if (acc >= 80) average++;
      else poor++;
    });

    const pieData = [];
    if (excellent > 0) pieData.push({ name: '>= 95%', value: excellent, fill: '#4ade80' }); // Green
    if (good > 0) pieData.push({ name: '90% - 95%', value: good, fill: '#2dd4bf' });      // Teal
    if (average > 0) pieData.push({ name: '80% - 90%', value: average, fill: '#fbbf24' });   // Yellow
    if (poor > 0) pieData.push({ name: '< 80%', value: poor, fill: '#f87171' });         // Red

    return pieData;
  }, [data]);

  const totalPieStores = accuracyPieData.reduce((sum, item) => sum + item.value, 0);

  // Custom tooltip for the aggregate pie chart
  const AccuracyTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload[0]) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: '#fff', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: 'none', minWidth: '160px' }}>
        <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', marginBottom: '6px' }}>{d.name}</div>
        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.8' }}>
          Stores: <span style={{ fontWeight: 600, color: d.fill }}>{d.value}</span>
        </div>
      </div>
    );
  };

  const handleBarClick = (dataProps) => {
    const storeCode = dataProps?.name || dataProps?.payload?.name;
    if (storeCode) {
      navigate('/reports/live-stock', { state: { store: storeCode, date: todayStr } });
    }
  };

  // Extract total numbers
  const rawSap = parseInt(totals?.SAP_STOCK?.toString().replace(/,/g, '') || 0, 10);
  const rawRfid = parseInt(totals?.RFID_STOCK?.toString().replace(/,/g, '') || 0, 10);
  const rawDiff = parseInt(totals?.DIFFERENCE?.toString().replace(/,/g, '') || 0, 10);
  const accuracyPercent = rawSap > 0 ? ((rawRfid / rawSap) * 100).toFixed(0) : 0;

  if (isLoading) {
    return (
      <div className="ls-dashboard-container" style={{ gap: '4px' }}>
        <div className="ds-skeleton-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '0' }}>
          {[1,2,3,4].map(i => <div key={i} className="ds-skeleton-box" style={{ height: '140px', borderRadius: '20px' }}><div className="ds-shimmer" /></div>)}
        </div>
        <div className="ds-skeleton-row" style={{ gridTemplateColumns: '1fr', marginBottom: '0' }}>
          <div className="ds-skeleton-box" style={{ height: '280px', borderRadius: '20px' }}><div className="ds-shimmer" /></div>
        </div>
        <div className="ds-skeleton-row" style={{ gridTemplateColumns: '1fr', marginBottom: '0' }}>
          <div className="ds-skeleton-box" style={{ height: '350px', borderRadius: '20px' }}><div className="ds-shimmer" /></div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div style={{ color: 'red', padding: '20px', background: '#fee2e2', borderRadius: '8px' }}>{error}</div>;
  }

  return (
    <div className="ls-dashboard-container">
      {/* Global SVG Defs for Gradients and Patterns */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <pattern id="striped-bar" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="#f8fafc" />
            <line x1="0" y="0" x2="0" y2="8" stroke="#cbd5e1" strokeWidth="2" />
          </pattern>
          <linearGradient id="blue-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#406bdeff" />
            <stop offset="100%" stopColor="#4370ecff" />
          </linearGradient>
          <linearGradient id="teal-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
          <linearGradient id="orange-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="red-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b91c1c" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
      </svg>
      
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

      <div className="ls-grid">
        
        {/* ROW 1: 4 KPI Cards */}
        <div className="ls-card ls-card-active">
          <h3 className="ls-card-title">Total SAP Stock</h3>
          <div className="ls-card-value">{totals?.SAP_STOCK || '0'}</div>
          <div className="ls-card-subtext">
            <span className="ls-badge">System Data</span>
            <span>Total expected volume</span>
          </div>
          <div className="ls-card-icon"><ArrowUpRight /></div>
        </div>

        <div className="ls-card">
          <h3 className="ls-card-title">Total RFID Scanned</h3>
          <div className="ls-card-value">{totals?.RFID_STOCK || '0'}</div>
          <div className="ls-card-subtext">
            <span className="ls-badge">Physical</span>
            <span>Actual scanned items</span>
          </div>
          <div className="ls-card-icon"><ArrowUpRight /></div>
        </div>

        <div className="ls-card">
          <h3 className="ls-card-title">Global Variance</h3>
          <div className="ls-card-value">{totals?.DIFFERENCE || '0'}</div>
          <div className="ls-card-subtext">
            <span className="ls-badge" style={{ background: '#fef3c7', color: '#b45309' }}>Gap</span>
            <span>Items missing</span>
          </div>
          <div className="ls-card-icon"><ArrowUpRight /></div>
        </div>

        {/* Overall Accuracy — moved up to top row */}
        <div className="ls-card">
          <h3 className="ls-card-title">Overall Accuracy</h3>
          <div className="ls-card-value">{accuracyPercent}%</div>
          <div className="ls-card-subtext">
            <span className="ls-badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>Live</span>
            <span>Current global accuracy</span>
          </div>
          <div className="ls-card-icon"><ArrowUpRight /></div>
        </div>

        {/* ROW 2: Store Performance Bar Chart (Span 3 columns) */}
        <div className="ls-card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px' }}>
            <h3 className="ls-section-title" style={{ margin: 0 }}>Store Performance</h3>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Filter Buttons */}
              <div style={{ display: 'flex', gap: '4px', background: '#f8fafc', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                {['ALL', '<80', '80-90', '90-95', '>=95'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setFilterAcc(f)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      border: 'none',
                      cursor: 'pointer',
                      background: filterAcc === f ? '#ffffff' : 'transparent',
                      color: filterAcc === f ? '#0f172a' : '#64748b',
                      boxShadow: filterAcc === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {f === 'ALL' ? 'All Stores' : f === '<80' ? '<80%' : f === '80-90' ? '80–90%' : f === '90-95' ? '90-95%' : '≥95%'}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px' }}>🔍</span>
                <input 
                  type="text" 
                  placeholder="Search Store..."
                  value={searchStore}
                  onChange={e => setSearchStore(e.target.value)}
                  style={{
                    padding: '8px 12px 8px 30px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                    width: '180px',
                    outline: 'none',
                    background: '#f8fafc'
                  }}
                />
              </div>
            </div>
          </div>
                   <div style={{ height: '350px', marginTop: '10px', overflowY: 'auto', paddingRight: '10px' }}>
            <div style={{ height: `${Math.max(barChartData.length * 60, 240)}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical"
                  data={barChartData} 
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }} 
                >
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 13, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f1f5f9' }} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  
                  {/* Stacked bars: RFID on left, Difference on right */}
                  <Bar dataKey="RFID" stackId="a" fill="url(#blue-gradient)" barSize={40} radius={[15, 0, 0, 15]} cursor="pointer" onClick={handleBarClick} />
                  <Bar dataKey="Difference" stackId="a" fill="url(#striped-bar)" stroke="#e2e8f0" strokeWidth={1} barSize={40} radius={[0, 15, 15, 0]} cursor="pointer" onClick={handleBarClick} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ROW 3: Coverage Distribution Donut Chart */}
        <div className="ls-card" style={{ gridColumn: '1 / -1', background: '#eceef0', padding: '24px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e3a8a', textTransform: 'uppercase', margin: 0 }}>
              COVERAGE DISTRIBUTION
            </h3>
          </div>

          {accuracyPieData.length > 0 && totalPieStores > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '60px', alignItems: 'center' }}>
              
              {/* Left Side: Pie Chart */}
              <div style={{ position: 'relative', width: '220px', height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={accuracyPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="65%"
                      outerRadius="100%"
                      paddingAngle={3}
                      stroke="none"
                      isAnimationActive={true}
                      cornerRadius={5}
                    >
                      {accuracyPieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<AccuracyTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center Label */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', lineHeight: 1 }}>{totalPieStores}</div>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', marginTop: '6px' }}>Total Stores</div>
                </div>
              </div>

              {/* Right Side: Custom Legend with Progress Bars */}
              <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {accuracyPieData.map((entry, idx) => {
                  const percentage = ((entry.value / totalPieStores) * 100).toFixed(2);
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#475569' }}>
                          <div style={{ width: '10px', height: '10px', backgroundColor: entry.fill, borderRadius: '50%' }} />
                          <span>{entry.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontWeight: '700', color: '#0f172a' }}>{entry.value}</span>
                          <span style={{ color: '#94a3b8', fontSize: '13px', minWidth: '45px', textAlign: 'right' }}>{percentage}%</span>
                        </div>
                      </div>
                      
                      {/* Horizontal Progress Bar */}
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: entry.fill, borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 0', fontSize: '14px' }}>
              No store data available.
            </div>
          )}

          {/* <div style={{ textAlign: 'right', marginTop: '20px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#2563eb', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              View Data <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </span>
          </div> */}
        </div>

      </div>
    </div>
  );
}
