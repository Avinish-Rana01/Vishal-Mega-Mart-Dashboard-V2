import React, { useState, useMemo } from 'react';
import { useWarehouseEncoding } from '../../../hooks/useDashboardData';
import SectionHeader, { DateBadge } from '../../../components/common/SectionHeader';
import KpiCard from '../../../components/charts/KpiCard';
import StoreRankList from '../../../components/charts/StoreRankList';
import DonutChart from '../../../components/charts/DonutChart';
import ChartToolbar from '../../../components/common/ChartToolbar';
import DashboardShimmer from '../../../components/common/DashboardShimmer';
import { SearchEmptyState } from '../../../components/common/ChartEmptyState';
import ChartLegend from '../../../components/common/ChartLegend';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import '../../../components/charts/DashboardSection.css';
import WorkInProgress from '../../../components/common/WorkInProgress';
import * as Icons from 'lucide-react';

const CHART_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#2dd4bf', '#fb923c', '#818cf8', '#a3e635', '#22d3ee', '#facc15'];

export default function DcEncodingSection() {
  const { chartData: apiData, isLoading, error } = useWarehouseEncoding();
  
  const { totalEncoded, peakHour, peakCount, avgPerHour, rankList, chartData, donutData } = useMemo(() => {
    if (!apiData || apiData.length === 0) return { totalEncoded: 0, peakHour: 'None', peakCount: 0, avgPerHour: 0, rankList: [], chartData: [], donutData: [] };

    let total = 0;
    let max = 0;
    let peak = 'None';
    let activeHoursCount = 0;
    const formattedTable = [];
    const formattedChart = [];

    let amCount = 0;
    let pmCount = 0;

    apiData.forEach(d => {
      const c = Number(d.count);
      total += c;
      if (c > 0) activeHoursCount++;
      if (c > max) {
        max = c;
        peak = d.timeBlock;
      }
      
      const startHour = parseInt(d.timeBlock.split('-')[0].trim(), 10);
      if (startHour < 12) {
         amCount += c;
      } else {
         pmCount += c;
      }

      formattedChart.push({
        name: d.timeBlock,
        Encoded: c
      });
      
      formattedTable.push({
        timeBlock: d.timeBlock,
        count: c
      });
    });

    const avg = activeHoursCount > 0 ? (total / activeHoursCount).toFixed(0) : 0;
    formattedTable.sort((a, b) => b.count - a.count);

    const donutSegments = [
      { name: 'Morning', value: amCount, color: '#60a5fa' },
      { name: 'Afternoon', value: pmCount, color: '#f87171' }
    ];

    return { totalEncoded: total, peakHour: peak, peakCount: max, avgPerHour: avg, rankList: formattedTable, chartData: formattedChart, donutData: donutSegments };
  }, [apiData]);

  const memoizedChart = useMemo(() => {
    if (chartData.length === 0) {
      return (
        <SearchEmptyState 
          title="No Encoding Data Found"
          subtitle="There is no encoding activity for today."
        />
      );
    }
    return (
      <div style={{ width: '100%', height: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 30, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              interval={0}
              tickFormatter={(val) => val && val.length > 10 ? val.substring(0, 10) + '…' : val}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            />
            <Tooltip
              cursor={{ fill: 'rgba(241,245,249,0.7)' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '13px' }}
              formatter={(value) => value.toLocaleString('en-IN')}
            />
            <Bar dataKey="Encoded" name="Tags Encoded" radius={12} barSize={24} isAnimationActive={true}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
              <LabelList 
                dataKey="Encoded" 
                position="top" 
                style={{ fontSize: '11px', fontWeight: 600, fill: '#64748b' }}
                formatter={(val) => val > 0 ? val.toLocaleString('en-IN') : ''}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }, [chartData]);

  if (isLoading) {
    return <DashboardShimmer />;
  }

  if (error) {
    return <div className="ds-error">{error}</div>;
  }

  
      return (
    <div className="cc-container" style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
      <SectionHeader title="DC ENCODING" rightContent={<DateBadge />} />
      <WorkInProgress 
        title="Revamping DC DC ENCODING"
        message="We are currently building this dashboard. It will be available on 27 AUG 2026 4:00 PM."
        version="V2.0"
      />
    </div>
  );

  return (
    <div className="vmm-section-container ds-section">
      <SectionHeader title="DC Encoding" rightContent={<DateBadge />} />

      <div className="ds-charts-row ds-charts-row--kpi" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
        <KpiCard
          title="Tags Encoded"
          value={totalEncoded.toLocaleString('en-IN')}
        />
        <KpiCard
          title="Peak Encoding Hour"
          value={peakHour}
        />
        <KpiCard
          title="Peak Hour Volume"
          value={totalEncoded > 0 ? `${peakCount.toLocaleString('en-IN')} (${((peakCount / totalEncoded) * 100).toFixed(1)}%)` : '0 (0%)'}
        />
        <KpiCard
          title="Average Encoding / Hour"
          value={Number(avgPerHour).toLocaleString('en-IN')}
        />
      </div>

      {/* 2. Charts Row */}
      <div className="ds-charts-row" style={{ height: '370px' }}>
        <div className="ds-card ds-card--main" style={{ display: 'flex', flexDirection: 'column' }}>
          <ChartToolbar
            leftContent={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="ds-card-title" style={{ color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, fontSize: '15px' }}>
                  Hourly Encoding Activity
                </h3>
              </div>
            }
          />
          
          {/* Legend */}
          <ChartLegend items={[
            { color: '#0ea5e9', label: 'Tags Encoded' }
          ]} />

          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
              {memoizedChart}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Split Layout (Rank List & Donut Chart) */}
      <div className="ds-charts-row ds-charts-row--equal" style={{ height: '264px', flexShrink: 0 }}>
        {/* Left: Most Active Hours */}
        <div className="ds-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="ds-card-title" style={{ color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, fontSize: '15px' }}>
            Most Active Hours
          </h3>
          <div style={{ flex: 1, minHeight: 0, marginTop: '16px', overflowY: 'auto' }}>
            <StoreRankList
              items={rankList}
              labelKey="timeBlock"
              sublabelKey=""
              valueKey="count"
              statusFn={() => 'info'}
              formatValue={(val) => `${val} Tags`}
              maxItems={3}
            />
          </div>
        </div>

        {/* Right: AM vs PM Distribution */}
        <div className="ds-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="ds-card-title" style={{ color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, fontSize: '15px' }}>
            Overall Encoding Breakdown
          </h3>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DonutChart
              segments={donutData}
              centerText={totalEncoded.toLocaleString('en-IN')}
              centerSubtext="Total Tags"
              height={220}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
