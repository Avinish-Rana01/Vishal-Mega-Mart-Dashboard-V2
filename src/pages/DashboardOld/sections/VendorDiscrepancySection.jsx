import React, { useMemo, useState } from 'react';
import { useVendorDiscrepancy } from '../../../hooks/useDashboardData';
import SectionHeader, { DateBadge } from '../../../components/common/SectionHeader';
import KpiCard from '../../../components/charts/KpiCard';
import GroupedBarChart from '../../../components/charts/GroupedBarChart';
import ComposedChart from '../../../components/charts/ComposedChart';
import SemiDonutChart from '../../../components/charts/SemiDonutChart';
import ChartToolbar from '../../../components/common/ChartToolbar';
import CustomDropdown from '../../../components/common/CustomDropdown';
import '../../../components/charts/DashboardSection.css';
import WorkInProgress from '../../../components/common/WorkInProgress';
import * as Icons from 'lucide-react';

export default function VendorDiscrepancySection() {
  const { data, totals, isLoading, error } = useVendorDiscrepancy();
  const [chartView, setChartView] = useState('volume');
  const [sortBy, setSortBy] = useState('EXPECTED_DESC');

  // Derived Metrics for Charts & Lists
  const { barData, composedData, totalExpectedRaw, totalScannedRaw, discrepancyPercent } = useMemo(() => {
    if (!data || !totals) return { barData: [], composedData: [], totalExpectedRaw: 0, totalScannedRaw: 0, discrepancyPercent: '0%' };

    // 1. Sort and Extract Top 10
    const sortedData = [...data].sort((a, b) => {
      switch (sortBy) {
        case 'EXPECTED_DESC':
          return Number(b.ACTUAL_QTY || 0) - Number(a.ACTUAL_QTY || 0);
        case 'DIFF_QTY_DESC':
          return Math.abs(Number(b.DIFF_QTY || 0)) - Math.abs(Number(a.DIFF_QTY || 0));
        case 'DIFF_PER_DESC':
          return Number(b.DIFF_PER || 0) - Number(a.DIFF_PER || 0);
        default:
          return Number(b.ACTUAL_QTY || 0) - Number(a.ACTUAL_QTY || 0);
      }
    });

    const top10 = sortedData.slice(0, 10);

    const barData = top10.map(row => ({
      name: row.VENDOR_NAME,
      fullName: row.VENDOR_NAME,
      TOTAL_QTY: Number(row.TOTAL_QTY || 0),
      Expected: Number(row.ACTUAL_QTY || 0),
      Scanned: Number(row.SCANNED_QTY || 0)
    }));

    const composedData = top10.map(row => ({
      name: row.VENDOR_NAME,
      fullName: row.VENDOR_NAME,
      TOTAL_QTY: Number(row.TOTAL_QTY || 0),
      DIFF_QTY: Math.abs(Number(row.DIFF_QTY || 0)),
      DIFF_PER: Number(row.DIFF_PER || 0)
    }));

    // 2. Global Breakdowns
    const totalExpectedRaw = Number((totals.ACTUAL_QTY || '0').replace(/,/g, ''));
    const totalScannedRaw = Number((totals.SCANNED_QTY || '0').replace(/,/g, ''));
    const totalDiffRaw = Number((totals.DIFF_QTY || '0').replace(/,/g, ''));

    const discrepancyPercent = totalExpectedRaw > 0
      ? `${((Math.abs(totalDiffRaw) / totalExpectedRaw) * 100).toFixed(2)}%`
      : '0%';

    return { barData, composedData, totalExpectedRaw, totalScannedRaw, discrepancyPercent };
  }, [data, totals, sortBy]);

  if (isLoading) {
    return (
      <section className="ds-section">
        <SectionHeader title="VENDOR DISCREPANCY" rightContent={<DateBadge />} />

        {/* 1. KPI Skeleton Row */}
        <div className="ds-kpi-row">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="ds-skeleton-box" style={{ height: '80px', borderRadius: '12px' }}>
              <div className="ds-shimmer" />
            </div>
          ))}
        </div>

        {/* 2. Charts Skeleton Row */}
        <div className="ds-charts-row ds-charts-row--2col">
          <div className="ds-skeleton-box" style={{ height: '330px', borderRadius: '20px' }}>
            <div className="ds-shimmer" />
          </div>
          <div className="ds-skeleton-box" style={{ height: '330px', borderRadius: '20px' }}>
            <div className="ds-shimmer" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return <div className="ds-error">{error}</div>;
  }

  // return (
  //   <section className="ds-section">
  //     <SectionHeader title="VENDOR DISCREPANCY" rightContent={<DateBadge />} />
  //     <div style={{ height: '370px' }}>
  //       <WorkInProgress 
  //         title="VENDOR DISCREPANCY" 
  //         description="We are currently upgrading this section."  
  //         targetDate="2026-08-29T16:00:00"
  //       />
  //     </div>
  //   </section>
  // );

  return (
    <section className="ds-section">
      <SectionHeader title="VENDOR DISCREPANCY" rightContent={<DateBadge />} />

      {/* 1. KPI Row */}
      <div className="ds-kpi-row">
        <KpiCard
          title="Total Expected Qty"
          value={totals?.ACTUAL_QTY || '0'}
          icon={<Icons.Truck size={20} />}
        />
        <KpiCard
          title="Total Actual Qty"
          value={totals?.SCANNED_QTY || '0'}
          badgeVariant="success"
          icon={<Icons.PackageCheck size={20} />}
        />
        <KpiCard
          title="Current Discrepancy"
          value={totals?.DIFF_QTY || '0'}
          badge="Action Needed"
          badgeVariant="danger"
          icon={<Icons.AlertTriangle size={20} />}
        />
        <KpiCard
          title="Discrepancy Rate"
          value={discrepancyPercent}
          subtext="Overall % of missing items"
          badgeVariant="warning"
          icon={<Icons.Percent size={20} />}
        />
      </div>

      {/* 2. Charts Row */}
      <div className="ds-charts-row ds-charts-row--2col">
        {/* Left: Chart */}
        <div className="ds-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <ChartToolbar
            leftContent={
              <CustomDropdown
                options={[
                  { value: 'volume', label: 'Expected vs Actual' },
                  { value: 'variance', label: 'Discrepancy Data' }
                ]}
                value={chartView}
                onChange={setChartView}
                buttonStyle={{
                  backgroundColor: 'transparent',
                  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%231e3a8a\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                  backgroundPosition: 'right 4px center',
                  border: 'none',
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingLeft: 0,
                  paddingRight: '18px',
                  fontSize: 'inherit',
                  fontWeight: 'inherit',
                  color: 'inherit',
                  boxShadow: 'none',
                  textTransform: 'uppercase'
                }}
                menuStyle={{ left: 0, right: 'auto', minWidth: '320px', textTransform: 'none' }}
              />
            }
            rightContent={
              <CustomDropdown
                options={[
                  { value: 'EXPECTED_DESC', label: 'Highest Expected' },
                  { value: 'DIFF_QTY_DESC', label: 'Highest Variance' },
                  { value: 'DIFF_PER_DESC', label: 'Highest Discrepancy %' }
                ]}
                value={sortBy}
                onChange={setSortBy}
                prefix="Sort:"
                buttonStyle={{ minWidth: 'auto', gap: '8px' }}
                menuStyle={{ left: 'auto', right: 0, minWidth: '220px' }}
              />
            }
            style={{ marginBottom: '8px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              {chartView === 'volume' ? "Comparison of expected vs physically scanned quantities" : "Discrepancy volume and percentage by vendor"}
            </p>

            {/* Fixed Custom Legend - Aligned Right */}
            {chartView === 'volume' ? (
              <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#64748b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#94a3b8' }}></span>
                  Expected Qty
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0d9488' }}></span>
                  Actual Qty
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#64748b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0d9488' }}></span>
                  Discrepancy %
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#94a3b8' }}></span>
                  Discrepancy Qty
                </div>
              </div>
            )}
          </div>

          {/* Scrollable Chart Area */}
          <div className="vmm-chart-scroll-container">
            <div style={{ width: '200%', height: '220px' }}>
              {chartView === 'volume' ? (
                <GroupedBarChart
                  data={barData}
                  bars={[
                    { dataKey: 'Expected', color: '#94a3b8', label: 'Expected Qty' },
                    { dataKey: 'Scanned', color: '#0d9488', label: 'Actual Qty' }
                  ]}
                  height={220}
                  hideLegend={true}
                  showValues={true}
                  margin={{ top: 30, right: 0, left: -20, bottom: 10 }}
                  xAxisTickFormatter={(val) => val}
                  customTooltip={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const dataObj = payload[0].payload;
                      return (
                        <div style={{ backgroundColor: '#fff', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                          <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: '#1e293b' }}>{dataObj.fullName || label}</p>
                          <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0' }}>
                            <span style={{ color: '#475569', fontSize: '13px', marginRight: '16px' }}>Total Stock:</span>
                            <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '13px', marginLeft: 'auto' }}>{dataObj.TOTAL_QTY}</span>
                          </div>
                          {payload.map((entry, index) => (
                            <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', margin: '4px 0' }}>
                              <div style={{ width: '10px', height: '10px', backgroundColor: entry.color, marginRight: '8px', borderRadius: '50%' }}></div>
                              <span style={{ color: '#475569', fontSize: '13px', marginRight: '16px' }}>{entry.name}:</span>
                              <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '13px', marginLeft: 'auto' }}>{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              ) : (
                <ComposedChart
                  data={composedData}
                  bars={[
                    { dataKey: 'DIFF_QTY', color: '#94a3b8', label: 'Discrepancy Qty', yAxisId: 'left' }
                  ]}
                  lines={[
                    { dataKey: 'DIFF_PER', color: '#0d9488', label: 'Discrepancy %', yAxisId: 'right' }
                  ]}
                  height={220}
                  hideLegend={true}
                  showValues={true}
                  tooltipFormatter={(val, name) => name === 'Discrepancy Qty' ? `-${val}` : `${val}%`}
                />
              )}
            </div>
          </div>
        </div>

        <div className="ds-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="ds-card-title">Global Receiving Accuracy</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>Overall receipt fulfillment rate across all vendor shipments</p>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '10px' }}>
            <SemiDonutChart
              value={totalScannedRaw}
              maxValue={totalExpectedRaw}
              centerLabel="Received"
              primaryColor="#0d9488"
            />
          </div>
        </div>
      </div>
    </section>
  );
}


