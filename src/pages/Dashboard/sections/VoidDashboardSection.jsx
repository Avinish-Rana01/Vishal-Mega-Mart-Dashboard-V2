import React, { useMemo } from 'react';
import './VoidDashboardSection.css';
import { RefreshCw } from 'lucide-react';
import { useVoidDashboard } from '../../../hooks/useDashboardData';

import KpiCard2 from '../../../components/charts/KpiCard2';
import GroupedBarChart from '../../../components/charts/GroupedBarChart';
import SemiDonutChart from '../../../components/charts/SemiDonutChart';
import StoreRankList from '../../../components/charts/StoreRankList';
import SectionHeader, { DateBadge } from '../../../components/common/SectionHeader';
import { GlobalEmptyState } from '../../../components/common/ChartEmptyState';
import ChartToolbar from '../../../components/common/ChartToolbar';
import CustomDropdown from '../../../components/common/CustomDropdown';
import DashboardShimmer from '../../../components/common/DashboardShimmer';

import { useIsInViewport } from '../../../hooks/useIsInViewport';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import '../../../components/charts/DashboardSection.css';

// SVG Icons
const Icons = {
  Trash: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  Barcode: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5v14M8 5v14M12 5v14M17 5v14M21 5v14"></path></svg>,
  Alert: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>,
  Percent: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>,
};

const VIEW_OPTIONS = [
  { value: 'grouped', label: 'Void vs Encoded' },
  { value: 'pending', label: 'Highest Pending Voids' },
  { value: 'encoding', label: 'Highest Encoding Rates' },
];

const SORT_OPTIONS = [
  { value: 'VOID_DESC', label: 'Highest Voids' },
  { value: 'ENCODE_DESC', label: 'Highest Encoded' },
  { value: 'PENDING_DESC', label: 'Highest Pending' },
  { value: 'RATE_DESC', label: 'Highest Rate' },
  { value: 'STORE_ASC', label: 'Store (A-Z)' },
];

const VoidVsEncodedTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ background: 'white', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', minWidth: '160px' }}>
        <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{data.fullName || data.name}</span>
          {data.name && data.name !== data.fullName && (
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', marginLeft: '12px' }}>{data.name}</span>
          )}
        </div>
        <div style={{ fontSize: '13px', color: '#d97706', marginBottom: '4px' }}>Void Qty : <span style={{ fontWeight: 600 }}>{data.Void}</span></div>
        <div style={{ fontSize: '13px', color: '#eab308', marginBottom: '8px' }}>Encoded Qty : <span style={{ fontWeight: 600 }}>{data.Encoded}</span></div>
        <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0 8px 0' }}></div>
        <div style={{ fontSize: '13px', color: '#ef4444' }}>Pending Voids : <span style={{ fontWeight: 600 }}>{data.Difference}</span></div>
      </div>
    );
  }
  return null;
};

const MemoizedPendingChart = React.memo(({ data }) => {
  const [ref, hasBeenVisible] = useIsInViewport();
  const height = Math.max(data.length * 35, 300);
  return (
    <div ref={ref} style={{ flex: 1, minHeight: '275px', position: 'relative' }}>
      {hasBeenVisible && (
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', paddingRight: '10px' }}>
          <ResponsiveContainer width="100%" height={height}>
          <BarChart layout="vertical" data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 13, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
            <RechartsTooltip cursor={{ fill: '#f1f5f9' }} content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div style={{ background: 'white', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{data.fullName || data.name}</span>
                      {data.name && data.name !== data.fullName && (
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', marginLeft: '12px' }}>{data.name}</span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#ef4444' }}>Pending Voids: <span style={{ fontWeight: 600 }}>{data.pending}</span></div>
                  </div>
                );
              }
              return null;
            }} />
              <Bar dataKey="pending" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} isAnimationActive={true} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
});

const MemoizedEncodingChart = React.memo(({ data }) => {
  const [ref, hasBeenVisible] = useIsInViewport();
  const height = Math.max(data.length * 35, 300);
  return (
    <div ref={ref} style={{ flex: 1, minHeight: '275px', position: 'relative' }}>
      {hasBeenVisible && (
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', paddingRight: '10px' }}>
          <ResponsiveContainer width="100%" height={height}>
          <BarChart layout="vertical" data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(val) => `${val}%`} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 13, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
            <RechartsTooltip cursor={{ fill: '#f1f5f9' }} content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div style={{ background: 'white', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{data.fullName || data.name}</span>
                      {data.name && data.name !== data.fullName && (
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', marginLeft: '12px' }}>{data.name}</span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#10b981' }}>Encode Rate: <span style={{ fontWeight: 600 }}>{data.rate.toFixed(1)}%</span></div>
                  </div>
                );
              }
              return null;
            }} />
            <Bar dataKey="rate" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} isAnimationActive={true} animationDuration={800}>
              <LabelList dataKey="rate" position="right" formatter={(val) => `${val.toFixed(1)}%`} style={{ fontSize: '11px', fontWeight: 600, fill: '#10b981' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      )}
    </div>
  );
});

export default function VoidDashboardSection() {
  const { data, totals, isLoading, error, refresh } = useVoidDashboard();
  const [chartView, setChartView] = React.useState('grouped');
  const [sortBy, setSortBy] = React.useState('VOID_DESC');

  // Smart defaults for sorting when switching views
  React.useEffect(() => {
    if (chartView === 'grouped') setSortBy('VOID_DESC');
    if (chartView === 'pending') setSortBy('PENDING_DESC');
    if (chartView === 'encoding') setSortBy('RATE_DESC');
  }, [chartView]);

  // Derived Metrics for Charts & Lists
  const { barData, rankList, encodePercent, totalVoidRaw, encodeRaw, pendingChartData, encodingChartData } = useMemo(() => {
    if (!data || !totals) return { barData: [], rankList: [], encodePercent: 0, totalVoidRaw: 0, encodeRaw: 0, pendingChartData: [], encodingChartData: [] };

    const sortFn = (a, b) => {
      if (sortBy === 'STORE_ASC') return (a.STORE || '').localeCompare(b.STORE || '');
      if (sortBy === 'ENCODE_DESC') return Number(b.ENCODE_QTY || 0) - Number(a.ENCODE_QTY || 0);
      if (sortBy === 'PENDING_DESC') return Number(b.DIFFERENCE_QTY || 0) - Number(a.DIFFERENCE_QTY || 0);
      if (sortBy === 'RATE_DESC') {
         const rateA = Number(a.VOID_QTY || 0) > 0 ? (Number(a.ENCODE_QTY || 0)/Number(a.VOID_QTY || 0)) : 0;
         const rateB = Number(b.VOID_QTY || 0) > 0 ? (Number(b.ENCODE_QTY || 0)/Number(b.VOID_QTY || 0)) : 0;
         return rateB - rateA;
      }
      return Number(b.VOID_QTY || 0) - Number(a.VOID_QTY || 0); // default VOID_DESC
    };

    // 1. Bar Chart Data (Sorted dynamically)
    const sortedData = [...data].sort(sortFn);
    const barData = sortedData.map(row => ({
      name: row.STORE,
      fullName: row.STORE_NAME,
      Void: Number(row.VOID_QTY || 0),
      Encoded: Number(row.ENCODE_QTY || 0),
      Difference: Number(row.DIFFERENCE_QTY || 0)
    }));

    // 2. Global Breakdown for SemiDonut
    const totalVoidRaw = Number((totals.VOID_QTY || '0').replace(/,/g, ''));
    const encodeRaw = Number((totals.ENCODE_QTY || '0').replace(/,/g, ''));
    const encodePercent = totalVoidRaw > 0 ? ((encodeRaw / totalVoidRaw) * 100) : 0;

    // 3. Rank List (Stores with Highest Pending/Difference) - Always Top 3 pending
    const rankList = [...data]
      .filter(row => Number(row.DIFFERENCE_QTY || 0) > 0)
      .sort((a, b) => Number(b.DIFFERENCE_QTY || 0) - Number(a.DIFFERENCE_QTY || 0))
      .slice(0, 3);

    // 4. Pending Voids Chart Data (Horizontal)
    const pendingChartData = [...data]
      .filter(row => Number(row.DIFFERENCE_QTY || 0) > 0)
      .sort(sortFn)
      .map(row => ({ name: row.STORE, fullName: row.STORE_NAME, pending: Number(row.DIFFERENCE_QTY || 0) }));

    // 5. Encoding Rates Chart Data (Horizontal)
    const encodingChartData = [...data]
      .sort(sortFn)
      .map(row => {
        const voidQ = Number(row.VOID_QTY || 0);
        const encQ = Number(row.ENCODE_QTY || 0);
        const rate = voidQ > 0 ? (encQ / voidQ) * 100 : 0;
        return { name: row.STORE, fullName: row.STORE_NAME, rate: rate };
      });

    return { barData, rankList, encodePercent, totalVoidRaw, encodeRaw, pendingChartData, encodingChartData };
  }, [data, totals, sortBy]);

  const handleStoreClick = (storeData) => {
    console.log('Navigate to store void report:', storeData.STORE || storeData.name);
  };

  if (isLoading) return <DashboardShimmer title="Void Dashboard" />;

  if (error) {
    return <div className="ds-error">{error}</div>;
  }

  if (!data || data.length === 0) {
    return (
      <section className="ds-section">
        <GlobalEmptyState
          title="No Void Data Available"
          subtitle="There are currently no void transactions for the selected period."
        />
      </section>
    );
  }


  return (
    <section className="ds-section">
      <SectionHeader 
        title="Void Dashboard"
        // subtitle="Track voided transactions vs successfully encoded items."
        rightContent={<DateBadge />}
      />

      {/* 1. KPI Row */}
      <div className="ds-kpi-row">
        <KpiCard2
          title="Total Void Qty"
          value={totals?.VOID_QTY || '0'}
          icon={<Icons.Trash />}
        />
        <KpiCard2
          title="Encoded Qty"
          value={totals?.ENCODE_QTY || '0'}
          badgeVariant="success"
          icon={<Icons.Barcode />}
        />
        <KpiCard2
          title="Pending Voids"
          value={totals?.DIFFERENCE_QTY || '0'}
          badge="Action Needed"
          badgeVariant="danger"
          icon={<Icons.Alert />}
        />
        <KpiCard2
          title="Encode Rate"
          value={`${encodePercent.toFixed(1)}%`}
          badgeVariant="info"
          icon={<Icons.Percent />}
        />
      </div>

      {/* 2. Charts Row (Full Width Bar Chart) */}
      <div className="ds-charts-row ds-grow">
        <div className="ds-card ds-grow" style={{height: '359px'}}>
          <ChartToolbar
            leftContent={
              <CustomDropdown
                options={VIEW_OPTIONS}
                value={chartView}
                onChange={setChartView}
                buttonStyle={{ backgroundColor: 'transparent', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%231e3a8a\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundPosition: 'right 4px center', border: 'none', paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: '18px', fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit', boxShadow: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                menuStyle={{ left: 0, right: 'auto', textTransform: 'none', letterSpacing: 'normal' }}
              />
            }
            rightContent={
              <CustomDropdown
                options={SORT_OPTIONS}
                value={sortBy}
                onChange={setSortBy}
                prefix="Sort:"
                buttonStyle={{ minWidth: 'auto', gap: '8px' }}
                menuStyle={{ right: 0, left: 'auto', minWidth: '180px' }}
              />
            }
          />
          <div style={{ flex: 1, minHeight: 0, minWidth: 0, width: '100%', marginTop: '10px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            
            {/* Custom Sticky Legend */}
            <div style={{ position: 'absolute', top: -5, right: 10, display: 'flex', gap: '16px', zIndex: 10 }}>
              {chartView === 'grouped' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#fcd34d' }} />
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Encoded Qty</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#d97706' }} />
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Void Qty</span>
                  </div>
                </>
              )}
              {chartView === 'pending' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Pending Voids</span>
                </div>
              )}
              {chartView === 'encoding' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Encode Rate</span>
                </div>
              )}
            </div>

            {chartView === 'grouped' && (
              <div style={{ flex: 1, minHeight: '275px', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, overflowX: 'auto', overflowY: 'hidden' }}>
                  <div style={{ minWidth: `max(100%, ${barData.length * 70}px)`, height: '100%' }}>
                    <GroupedBarChart
                      data={barData}
                      bars={[
                        { dataKey: 'Void', color: '#d97706', label: 'Void Qty' },
                        { dataKey: 'Encoded', color: '#fcd34d', label: 'Encoded Qty' }
                      ]}
                      height="100%"
                      hideLegend={true}
                      customTooltip={<VoidVsEncodedTooltip />}
                    />
                  </div>
                </div>
              </div>
            )}
            {chartView === 'pending' && <MemoizedPendingChart data={pendingChartData} />}
            {chartView === 'encoding' && <MemoizedEncodingChart data={encodingChartData} />}
          </div>
        </div>
      </div>

      {/* 3. Quick-List & Donut Row */}
      <div className="ds-charts-row ds-charts-row--equal" style={{ height: '264px', flexShrink: 0 }}>
        {/* Left: Store Rank List */}
        <div className="ds-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="ds-card-title" style={{ color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, fontSize: '15px' }}>Highest Voids</h3>
          <div style={{ flex: 1, minHeight: 0, marginTop: '16px', overflowY: 'auto' }}>
            <StoreRankList
              items={rankList}
              labelKey="STORE_NAME"
              sublabelKey="STORE"
              valueKey="DIFFERENCE_QTY"
              diffKey="VOID_QTY"
              diffLabel="Total Voids:"
              statusFn={() => 'danger'}
              formatValue={(val) => `${val} Pending`}
            />
          </div>
        </div>

        {/* Right: SemiDonut Chart */}
        <div className="ds-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="ds-card-title" style={{ color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, fontSize: '15px' }}>Overall Encoding Completion</h3>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SemiDonutChart
              value={encodeRaw}
              maxValue={totalVoidRaw}
              centerLabel="Encoded"
              primaryColor="#d97706"
            />
          </div>
        </div>
      </div>

    </section>
  );
}







