import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveStock } from '../../../hooks/useDashboardData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,LabelList } from 'recharts';
import { RefreshCw } from 'lucide-react';
import ChartPaginator from '../../../components/common/ChartPaginator';
import KpiCard from '../../../components/charts/KpiCard';
import SectionHeader, { DateBadge } from '../../../components/common/SectionHeader';
import { generateMockData } from '../../../utils/mockLiveStock';
import { AccuracyTooltip, StoreBarTooltip } from '../../../components/charts/LiveStockTooltips';
import CustomDropdown from '../../../components/common/CustomDropdown';
import '../../../components/charts/DashboardSection.css';
import './common.css';
import './LiveStockSection.css';

// Minimalist Icons
const ArrowUpRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7"></line>
    <polyline points="7 7 17 7 17 17"></polyline>
  </svg>
);

const { mockStores, mockTotals } = generateMockData();

const operatorOptions = [
  { value: '<', label: 'Less (<)' },
  { value: '>', label: 'Greater (>)' },
  { value: '=', label: 'Equal (=)' }
];

const sortOptions = [
  { value: 'CODE_ASC', label: 'Store Code (A-Z)' },
  { value: 'DIFF_DESC', label: 'Highest Variance' },
  { value: 'ACC_ASC', label: 'Lowest Accuracy' },
  { value: 'SAP_DESC', label: 'Highest Volume' }
];
// ---------------------------

export default function LiveStockSection() {
  // === STATE MANAGEMENT ===
  // Global Data & Context
  const { data: realData, totals: realTotals, isLoading, error, refresh } = useLiveStock();
  const data = mockStores; // USE MOCK DATA OVERRIDE
  const totals = mockTotals;
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];

  // Filtering & Search State
  const [searchStore, setSearchStore] = React.useState(''); // Text input for searching by store code/name
  const [filterField, setFilterField] = React.useState('ALL'); // Which metric to filter by
  const [filterOp, setFilterOp] = React.useState('<'); // Mathematical operator for filtering (<, >, =)
  const [filterVal, setFilterVal] = React.useState(''); // The numerical threshold for the filter
  const [appliedFilter, setAppliedFilter] = React.useState({ field: 'ALL', op: '<', val: '' }); // The active filter currently applied to the dataset
  const [filterError, setFilterError] = React.useState(''); // Validation error messages for filter input

  // Sorting State
  const [sortBy, setSortBy] = React.useState('CODE_ASC'); // Active sorting metric (e.g., Variance, Accuracy)

  /**
   * Validates and applies the user's custom filter criteria.
   * Ensures the input is a valid number and within the 0-100 range for accuracy.
   */
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

  /**
   * Computes the final dataset to be displayed in the charts.
   * This is a multi-step data pipeline:
   * 1. Search: Filters out stores that don't match the search text.
   * 2. Filter: Applies the mathematical comparison (e.g., Accuracy < 80).
   * 3. Sort: Orders the remaining data based on the selected metric.
   */
  const filteredData = React.useMemo(() => {
    if (!data) return [];
    let result = data;

    // Step 1: Text Search
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

    // Step 3: Apply Sorting
    if (sortBy === 'DIFF_DESC') {
      result = [...result].sort((a, b) => Number(b.DIFFERENCE) - Number(a.DIFFERENCE));
    } else if (sortBy === 'ACC_ASC') {
      result = [...result].sort((a, b) => Number(a.PERCENTAGE) - Number(b.PERCENTAGE));
    } else if (sortBy === 'SAP_DESC') {
      result = [...result].sort((a, b) => Number(b.SAP_STOCK) - Number(a.SAP_STOCK));
    } else {
      // Default: Alphabetical by Store Code
      result = [...result].sort((a, b) => a.STORE_CODE.localeCompare(b.STORE_CODE));
    }

    return result;
  }, [data, searchStore, appliedFilter, sortBy]);

  /**
   * Transforms the filtered data into the exact schema required by the Recharts BarChart.
   * Calculates the exact Difference integer for the stacked bar visual.
   */
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

  /**
   * Aggregates store performance into 4 distinct health buckets for the Coverage Distribution Donut Chart.
   * Calculates the total count of stores falling into: Excellent (>=95%), Good (90-95%), Average (80-90%), Poor (<80%).
   */
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

  /**
   * Navigates the user to a detailed report view for a specific store
   * when a bar in the chart is clicked.
   */
  const handleBarClick = React.useCallback((dataProps) => {
    const storeCode = dataProps?.name || dataProps?.payload?.name;
    if (storeCode) {
      navigate('/reports/live-stock', { state: { store: storeCode, date: todayStr } });
    }
  }, [navigate, todayStr]);

  /**
   * Parses the raw string totals (which contain commas) into pure integers
   * so they can be accurately displayed and calculated in the top KPI cards.
   */
  const { rawSap, rawRfid, rawDiff, accuracyPercent } = React.useMemo(() => {
    const sap = parseInt(totals?.SAP_STOCK?.toString().replace(/,/g, '') || 0, 10);
    const rfid = parseInt(totals?.RFID_STOCK?.toString().replace(/,/g, '') || 0, 10);
    const diff = parseInt(totals?.DIFFERENCE?.toString().replace(/,/g, '') || 0, 10);
    const percent = sap > 0 ? ((rfid / sap) * 100).toFixed(0) : 0;
    return { rawSap: sap, rawRfid: rfid, rawDiff: diff, accuracyPercent: percent };
  }, [totals]);

  if (isLoading) {
    return (
      <div className="ls-dashboard-container">
        <SectionHeader title="Live Stock" rightContent={<DateBadge />} />
        <div className="ls-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="ds-skeleton-box" style={{ height: '80px', borderRadius: '12px' }}>
              <div className="ds-shimmer" />
            </div>
          ))}
          <div className="ds-skeleton-box" style={{ gridColumn: '1 / -1', height: '380px', borderRadius: '12px' }}>
            <div className="ds-shimmer" />
          </div>
          <div className="ds-skeleton-box" style={{ gridColumn: '1 / -1', height: '350px', borderRadius: '12px' }}>
            <div className="ds-shimmer" />
          </div>
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
      <SectionHeader 
        title="Live Stock" 
        rightContent={<DateBadge />} 
      />

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
          <div className="vmm-toolbar-header">
            <h3 className="vmm-toolbar-title">
              STORE PERFORMANCE
            </h3>
            
            <div className="vmm-toolbar-controls">
              {/* Dynamic Filter Controls */}
              <div className="ls-filter-container">
                <div className="ls-filter-label">
                  All Stores
                </div>

                <CustomDropdown 
                  options={operatorOptions}
                  value={filterOp}
                  onChange={(val) => setFilterOp(val)}
                />

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
                    placeholder="90"
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
              <div className="vmm-search-container">
                <span className="vmm-search-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19C12.8487 19 14.551 18.3729 15.9056 17.3199L19.2929 20.7071C19.6834 21.0976 20.3166 21.0976 20.7071 20.7071C21.0976 20.3166 21.0976 19.6834 20.7071 19.2929L17.3199 15.9056C18.3729 14.551 19 12.8487 19 11C19 6.58172 15.4183 3 11 3ZM5 11C5 7.68629 7.68629 5 11 5C14.3137 5 17 7.68629 17 11C17 14.3137 14.3137 17 11 17C7.68629 17 5 14.3137 5 11Z" fill="#94a3b8"/>
                  </svg>
                </span>
                <input 
                  type="text" 
                  className="vmm-search-input"
                  placeholder="Search Store..."
                  value={searchStore}
                  onChange={e => setSearchStore(e.target.value)}
                  style={{ paddingRight: searchStore ? '32px' : '16px' }}
                />
                {searchStore && (
                  <button 
                    className="vmm-search-clear"
                    onClick={() => setSearchStore('')}
                  >
                    ×
                  </button>
                )}
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
          <div className="ls-toolbar-secondary">
            
            <div className="ls-toolbar-controls-left">
              {/* Sort By Controls */}
              <CustomDropdown 
                options={sortOptions}
                value={sortBy}
                onChange={(val) => setSortBy(val)}
                prefix="Sort:"
                buttonStyle={{ minWidth: '160px', justifyContent: 'space-between' }}
                menuStyle={{ left: 0, right: 'auto', minWidth: '180px' }}
              />

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

          <div style={{ height: '250px' }}>
            {barChartData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
                  <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                No stores match your search or filter criteria.
                <button 
                  onClick={() => { setSearchStore(''); setAppliedFilter({ field: 'ALL', op: '<', val: '' }); }}
                  style={{ marginTop: '16px', background: '#fff', border: '1px solid #e2e8f0', color: '#4338ca', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div style={{ height: '100%', overflowY: 'auto', paddingRight: '10px' }}>
                  <ResponsiveContainer width="100%" height={Math.max(barChartData.length * 28, 240)}>
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
            )}
          </div>
        </div>

        {/* ROW 3: Coverage Distribution Donut Chart */}
        <div className="ls-card" style={{ gridColumn: '1 / -1', background: '#eceef0', padding: '8  px 12px' }}>
          <div className="ls-toolbar-header">
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e3a8a', textTransform: 'uppercase', marginRight: '10px' }}>
              COVERAGE DISTRIBUTION
            </h3>
          </div>

          {accuracyPieData.length > 0 && totalPieStores > 0 ? (
            <div className="ls-donut-container">
              
              {/* Left Side: Pie Chart */}
              <div className="ls-donut-wrapper">
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
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', lineHeight: 1 }}>{totalPieStores}</div>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', marginTop: '6px' }}>Total Stores</div>
                </div>
              </div>

              {/* Right Side: Custom Legend with Progress Bars */}
              <div style={{ flex: 1, minWidth: '200px', maxWidth: '350px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {accuracyPieData.map((entry, idx) => {
                  const percentage = ((entry.value / totalPieStores) * 100).toFixed(2);
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'nowrap', fontSize: '16px', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>
                          <div style={{ width: '10px', height: '10px', backgroundColor: entry.fill, borderRadius: '50%', flexShrink: 0 }} />
                          <span>{entry.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          <span style={{ fontWeight: '700', color: '#0f172a' }}>{entry.value}</span>
                          <span style={{ color: '#94a3b8', fontSize: '14px', minWidth: '45px', textAlign: 'right' }}>{percentage}%</span>
                        </div>
                      </div>
                      
                      {/* Horizontal Progress Bar */}
                      <div style={{ width: '100%', height: '12px', backgroundColor: '#ffffffff', borderRadius: '6px', overflow: 'hidden' }}>
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
