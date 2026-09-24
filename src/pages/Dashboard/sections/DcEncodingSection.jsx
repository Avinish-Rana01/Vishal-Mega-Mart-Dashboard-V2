import React, { useState, useMemo } from 'react';
import './DcEncodingSection.css';
import { useWarehouseEncoding } from '../../../hooks/useDashboardData';
import { useIsInViewport } from '../../../hooks/useIsInViewport';
import SectionHeader, { DateBadge } from '../../../components/common/SectionHeader';
import KpiCard2 from '../../../components/charts/KpiCard2';
import LiveTickerValue from '../../../components/common/LiveTickerValue';
import DonutChart from '../../../components/charts/DonutChart';
import ChartToolbar from '../../../components/common/ChartToolbar';
import DashboardShimmer from '../../../components/common/DashboardShimmer';
import { SearchEmptyState } from '../../../components/common/ChartEmptyState';
import ChartLegend from '../../../components/common/ChartLegend';
import NeuromorphicButton from '../../../components/common/NeuromorphicButton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import '../../../components/charts/DashboardSection.css';
import * as Icons from 'lucide-react';


export default function DcEncodingSection() {
  const { chartData: apiData, isLoading, isRefreshing, error, highlightedBlock, connectionStatus } = useWarehouseEncoding();
  const [chartRef, chartVisible] = useIsInViewport({ threshold: 0.1 });

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
      <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 25, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
              interval={0}
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
            <Bar dataKey="Encoded" name="Tags Encoded" fill="#3b82f6" radius={12} barSize={24} isAnimationActive={false}>
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
    <div className="vmm-section-container ds-section">
      <SectionHeader 
        title="DC Encoding" 
        subtitle="Overview of hourly tag encoding in the Distribution Center"
        icon={<Icons.Barcode size={44} color="#3b82f6" strokeWidth={2.2} />}
        rightContent={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className={`live-sync-pill ${connectionStatus || 'connecting'}`} title={`Real-time sync: ${connectionStatus}`}>
              <span className="live-sync-dot"></span>
              {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </div>
            <DateBadge />
          </div>
        } 
      />

      <div className="ds-kpi-row">
        <KpiCard2 title="Tags Encoded" value={<LiveTickerValue value={totalEncoded || 0} />} icon={<Icons.Tag />} />
        <KpiCard2 title="Peak Encoding Hour" value={peakHour} icon={<Icons.Clock />} />
        <KpiCard2 title="Peak Hour Volume" value={totalEncoded > 0 ? `${peakCount.toLocaleString('en-IN')} (${((peakCount / totalEncoded) * 100).toFixed(1)}%)` : '0 (0%)'} icon={<Icons.Activity />} />
        <KpiCard2 title="Average Encoding / Hour" value={<LiveTickerValue value={Number(avgPerHour) || 0} />} icon={<Icons.TrendingUp />} />
      </div>

      {/* 2. Side-by-side Charts Row (70% Hourly Activity + 30% Target Progress) */}
      <div className="ds-charts-row" style={{ gridTemplateColumns: '7fr 3fr', height: '320px' }}>
        {/* Left (70%): Hourly Encoding Activity Bar Graph */}
        <div className="ds-card ds-card--main" style={{ display: 'flex', flexDirection: 'column' }}>
          <ChartToolbar
            leftContent={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="ds-card-title" style={{ color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, fontSize: '15px' }}>
                  Hourly Encoding Activity
                </h3>
              </div>
            }
            rightContent={
              <NeuromorphicButton value="Here" />
            }
          />

          {/* Legend */}
          <ChartLegend items={[
            { color: '#3b82f6', label: 'Tags Encoded' }
          ]} />

          <div style={{ flex: 1, minHeight: 0, width: '100%', height: '100%', position: 'relative' }} ref={chartRef}>
            {chartVisible && memoizedChart}
          </div>
        </div>

        {/* Right (30%): Encoding Target Progress Semicircle */}
        <div className="ds-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <ChartToolbar
            leftContent={
              <h3 className="ds-card-title" style={{ color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, fontSize: '15px' }}>
                Encoding Target Progress
              </h3>
            }
          />
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {(() => {
              const TARGET_ENCODING = 5000;
              const percent = totalEncoded > 0 ? Math.min((totalEncoded / TARGET_ENCODING) * 100, 100).toFixed(0) : 0;
              const remaining = Math.max(TARGET_ENCODING - totalEncoded, 0);
              
              return (
                <DonutChart
                  segments={[
                    { name: 'Encoded', value: totalEncoded, color: '#3b82f6' },
                    { name: 'Remaining', value: remaining, color: '#e2e8f0' }
                  ]}
                  centerText={`${percent}%`}
                  centerSubtext={
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                        {`${totalEncoded.toLocaleString('en-IN')} / ${TARGET_ENCODING.toLocaleString('en-IN')}`}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>
                        Tags Target
                      </span>
                    </div>
                  }
                  height={220}
                  innerRadius="64%"
                  outerRadius="88%"
                  cy="78%"
                  centerTop="73%"
                  showLegend={false}
                  halfCircle={true}
                  tooltipFormatter={(value, name) => 
                    name === 'Encoded' 
                      ? `${value.toLocaleString('en-IN')} / ${TARGET_ENCODING.toLocaleString('en-IN')}` 
                      : value.toLocaleString('en-IN')
                  }
                />
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}





