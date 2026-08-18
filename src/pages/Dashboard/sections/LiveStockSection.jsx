import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveStock } from '../../../hooks/useDashboardData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,LabelList } from 'recharts';
import { RefreshCw } from 'lucide-react';
import ChartPaginator from '../../../components/common/ChartPaginator';
import KpiCard from '../../../components/charts/KpiCard';
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

// Custom tooltip for the aggregate pie chart (Moved outside render to prevent recreation)
const AccuracyTooltip = React.memo(({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  const name = item.name || item.payload?.name;
  const value = item.value;
  const fill = item.payload?.fill || item.fill || '#0f172a';

  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 8px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', minWidth: '140px' }}>
      <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', marginBottom: '6px' }}>{name}</div>
      <div style={{ fontSize: '13px', color: '#475569' }}>
        Stores: <span style={{ fontWeight: 700, color: fill, marginLeft: '6px' }}>{value}</span>
      </div>
    </div>
  );
});

// Custom tooltip for the store performance bar chart
const StoreBarTooltip = React.memo(({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9', minWidth: '180px' }}>
      <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
        {data.fullName || label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: '#64748b' }}>Accuracy:</span>
          <span style={{ fontWeight: 700, color: data.PERCENTAGE >= 95 ? '#16a34a' : data.PERCENTAGE >= 80 ? '#d97706' : '#dc2626' }}>
            {Number(data.PERCENTAGE).toFixed(2)}%
          </span>
        </div>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.fill === 'url(#striped-bar)' ? '#ff5c5c' : '#406bde' }}></div>
              {entry.name}:
            </span>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default function LiveStockSection() {
  const { data: realData, totals: realTotals, isLoading, error, refresh } = useLiveStock();
  
  // USE MOCK DATA OVERRIDE
  const data = mockStores;
  const totals = mockTotals;
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];

  // Filters State
  const [searchStore, setSearchStore] = React.useState('');
  const [filterField, setFilterField] = React.useState('ALL');
  const [filterOp, setFilterOp] = React.useState('<');
  const [filterVal, setFilterVal] = React.useState('');
  const [appliedFilter, setAppliedFilter] = React.useState({ field: 'ALL', op: '<', val: '' });
  const [filterError, setFilterError] = React.useState('');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const handleApplyFilter = React.useCallback(() => {
    const value = String(filterVal).trim();
    if (value === '') {
      setFilterError('Please enter a value');
      return;
    }
    const numValue = Number(value);
    if (!Number.isFinite(numValue)) {
      setFilterError('Please enter a valid number');
      return;
    }
    if (numValue < 0 || numValue > 100) {
      setFilterError('Accuracy must be between 0 and 100');
      return;
    }
    setFilterError('');
    setAppliedFilter({ field: 'Accuracy', op: filterOp, val: numValue });
  }, [filterVal, filterOp]);

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

    if (appliedFilter.field !== 'ALL') {
      result = result.filter(row => {
        let fieldVal = 0;
        if (appliedFilter.field === 'Accuracy') {
          fieldVal = Number(row.PERCENTAGE) || 0;
        } else if (appliedFilter.field === 'SAP Stock') {
          fieldVal = Number(row.SAP_STOCK) || 0;
        } else if (appliedFilter.field === 'RFID Stock') {
          fieldVal = Number(row.RFID_STOCK) || 0;
        } else if (appliedFilter.field === 'Difference') {
          const sap = Number(row.SAP_STOCK) || 0;
          const rfid = Number(row.RFID_STOCK) || 0;
          fieldVal = sap > rfid ? sap - rfid : 0;
        }
        
        if (appliedFilter.op === '<') return fieldVal < appliedFilter.val;
        if (appliedFilter.op === '>') return fieldVal > appliedFilter.val;
        if (appliedFilter.op === '=') return fieldVal === appliedFilter.val;
        return true;
      });
    }

    return result;
  }, [data, searchStore, appliedFilter]);

  const barChartData = React.useMemo(() => {
    return filteredData.map(row => {
      const percentage = Number(row.PERCENTAGE) || 0;
      const sap = Number(row.SAP_STOCK) || 0;
      const rfid = Number(row.RFID_STOCK) || 0;
      const difference = sap > rfid ? sap - rfid : 0;
      
      return {
        name: row.STORE_CODE,
        fullName: row.STORE_NAME || row.STORE_CODE,
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

  const handleBarClick = React.useCallback((dataProps) => {
    const storeCode = dataProps?.name || dataProps?.payload?.name;
    if (storeCode) {
      navigate('/reports/live-stock', { state: { store: storeCode, date: todayStr } });
    }
  }, [navigate, todayStr]);

  // Extract total numbers
  const { rawSap, rawRfid, rawDiff, accuracyPercent } = React.useMemo(() => {
    const sap = parseInt(totals?.SAP_STOCK?.toString().replace(/,/g, '') || 0, 10);
    const rfid = parseInt(totals?.RFID_STOCK?.toString().replace(/,/g, '') || 0, 10);
    const diff = parseInt(totals?.DIFFERENCE?.toString().replace(/,/g, '') || 0, 10);
    const percent = sap > 0 ? ((rfid / sap) * 100).toFixed(0) : 0;
    return { rawSap: sap, rawRfid: rfid, rawDiff: diff, accuracyPercent: percent };
  }, [totals]);

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
          <pattern id="striped-bar" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#fcf8f8ff" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#ff5c5cff" strokeWidth="4" />
          </pattern>
          <linearGradient id="blue-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#406bdeff" />
            <stop offset="100%" stopColor="#4370ecff" />
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
        <KpiCard
          title="Total SAP Stock"
          value={totals?.SAP_STOCK || '0'}
          subtext="Total expected volume"
          badge="System Data"
          badgeVariant="default"
          icon={<ArrowUpRight />}
        />

        <KpiCard
          title="Total RFID Scanned"
          value={totals?.RFID_STOCK || '0'}
          subtext="Actual scanned items"
          badge="Physical"
          badgeVariant="default"
          icon={<ArrowUpRight />}
        />

        <KpiCard
          title="Global Variance"
          value={totals?.DIFFERENCE || '0'}
          subtext="Items missing"
          badge="Gap"
          badgeVariant="warning"
          icon={<ArrowUpRight />}
        />

        {/* Overall Accuracy */}
        <KpiCard
          title="Overall Accuracy"
          value={`${accuracyPercent}%`}
          subtext="Current global accuracy"
          badge="Live"
          badgeVariant="info"
          icon={<ArrowUpRight />}
        />

        {/* ROW 2: Store Performance Bar Chart (Span 3 columns) */}
        <div className="ls-card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px' }}>
            <h3 className="ls-section-title" style={{ margin: 0 }}>Store Performance</h3>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Dynamic Filter Controls */}
              <div className="ls-filter-container">
                <div className="ls-filter-label">
                  All Stores
                </div>

                <div 
                  style={{ position: 'relative' }}
                  tabIndex={0}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setIsDropdownOpen(false);
                    }
                  }}
                >
                  <button 
                    className="ls-filter-select"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{ paddingRight: '24px' }}
                  >
                    {filterOp === '<' ? 'Less (<)' : filterOp === '>' ? 'Greater (>)' : 'Equal (=)'}
                  </button>

                  {isDropdownOpen && (
                    <div className="ls-dropdown-menu">
                      <div 
                        className={`ls-dropdown-item ${filterOp === '<' ? 'active' : ''}`} 
                        onClick={() => { setFilterOp('<'); setIsDropdownOpen(false); }}
                      >
                        Less (&lt;)
                      </div>
                      <div 
                        className={`ls-dropdown-item ${filterOp === '>' ? 'active' : ''}`} 
                        onClick={() => { setFilterOp('>'); setIsDropdownOpen(false); }}
                      >
                        Greater (&gt;)
                      </div>
                      <div 
                        className={`ls-dropdown-item ${filterOp === '=' ? 'active' : ''}`} 
                        onClick={() => { setFilterOp('='); setIsDropdownOpen(false); }}
                      >
                        Equal (=)
                      </div>
                    </div>
                  )}
                </div>

                <div className="ls-filter-input-wrapper">
                  <input 
                    type="number" 
                    className="ls-filter-input"
                    value={filterVal} 
                    onChange={(e) => {
                      setFilterVal(e.target.value);
                      setFilterError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleApplyFilter();
                    }}
                    placeholder="Value"
                  />
                  <span className="ls-filter-percent">%</span>
                </div>

                <button 
                  className="ls-filter-btn"
                  onClick={handleApplyFilter}
                  disabled={!String(filterVal).trim()}
                >
                  OK
                </button>
              </div>

              {/* Search */}
              <div className="ls-search-container">
                <span className="ls-search-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19C12.8487 19 14.551 18.3729 15.9056 17.3199L19.2929 20.7071C19.6834 21.0976 20.3166 21.0976 20.7071 20.7071C21.0976 20.3166 21.0976 19.6834 20.7071 19.2929L17.3199 15.9056C18.3729 14.551 19 12.8487 19 11C19 6.58172 15.4183 3 11 3ZM5 11C5 7.68629 7.68629 5 11 5C14.3137 5 17 7.68629 17 11C17 14.3137 14.3137 17 11 17C7.68629 17 5 14.3137 5 11Z" fill="#94a3b8"/>
                  </svg>
                </span>
                <input 
                  type="text" 
                  className="ls-search-input"
                  placeholder="Search Store..."
                  value={searchStore}
                  onChange={e => setSearchStore(e.target.value)}
                />
              </div>
            </div>
          </div>

          {filterError && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px', marginTop: '-8px' }}>
              <span style={{ color: '#dc2626', fontSize: '12px', fontWeight: '500' }}>
                {filterError}
              </span>
            </div>
          )}

          {/* Sticky Legend & Active Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px' }}>
            {/* Active Filter Chip */}
            <div style={{ height: '28px', display: 'flex', alignItems: 'center' }}>
              {appliedFilter.field !== 'ALL' && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e0e7ff', color: '#4338ca', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                  Accuracy {appliedFilter.op} {appliedFilter.val}%
                  <button 
                    onClick={() => {
                      setFilterVal('');
                      setAppliedFilter({ field: 'ALL', op: '<', val: '' });
                      setFilterError('');
                    }} 
                    style={{ background: 'transparent', border: 'none', color: '#4338ca', cursor: 'pointer', padding: '0 2px', fontSize: '16px', lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Custom Chart Legend */}
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#475569', fontWeight: '500' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 14 14">
                  <circle cx="7" cy="7" r="6.5" fill="url(#striped-bar)" stroke="#e2e8f0" strokeWidth="1" />
                </svg>
                Difference
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', background: '#406bdeff', borderRadius: '50%' }}></div>
                RFID
              </div>
            </div>
          </div>

          <div style={{ height: '350px', overflowY: 'auto', paddingRight: '10px' }}>
            <div style={{ height: `${Math.max(barChartData.length * 28, 240)}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical"
                  data={barChartData} 
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }} 
                >
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={60} 
                    tick={{ fontSize: 13, fill: '#475569', fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <RechartsTooltip 
                    cursor={{ fill: '#f1f5f9' }} 
                    content={<StoreBarTooltip />}
                  />
                  
                  {/* Stacked bars: RFID on left, Difference on right */}
                  <Bar dataKey="RFID" stackId="a" fill="url(#blue-gradient)" barSize={20} radius={[4, 0, 0, 4]} cursor="pointer" onClick={handleBarClick} />
                  <Bar dataKey="Difference" stackId="a" fill="url(#striped-bar)" stroke="#e2e8f0" strokeWidth={1} barSize={20} radius={[0, 4, 4, 0]} cursor="pointer" onClick={handleBarClick} />
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
                    <RechartsTooltip content={<AccuracyTooltip />} wrapperStyle={{ zIndex: 1000, outline: 'none' }} />
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
                      <div style={{ width: '100%', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: entry.fill, borderRadius: '6px' }} />
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
