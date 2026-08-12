import React, { memo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReactWrapper from 'highcharts-react-official';
const HighchartsReact = HighchartsReactWrapper.default || HighchartsReactWrapper;
import { Recycle } from 'lucide-react';
import ProgressBar from '../common/ProgressBar';
import './Charts.css';

import { useIsInViewport } from '../../hooks/useIsInViewport';

export default memo(function SemiCircleChartCard({
  title = "TAG CYCLE COUNT",
  subtitle = "Distribution of Cycle Count ranges.",
  data = [],
  totalLabel = "Total Tag Count",
  totalValue = "0",
  avgCount = "0",
  isLoading = false
}) {
  const [containerRef, hasBeenVisible] = useIsInViewport({ threshold: 0.1 });
  if (isLoading) {
    return (
      <div className="vmm-chart-card vmm-flex-col">
        <div className="vmm-chart-header vmm-mb-large" style={{ position: 'relative' }}>
          <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>{title}</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>{subtitle}</p>
        </div>
        <div className="vmm-chart-container">
          <div className="vmm-chart-graphic vmm-semi-circle-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '150px' }}>
             <div className="vmm-shimmer" style={{ width: '200px', height: '100px', borderTopLeftRadius: '100px', borderTopRightRadius: '100px' }}></div>
          </div>
          <div className="vmm-chart-legend">
            <div className="vmm-chart-legend-items vmm-compact-items">
              <div className="vmm-shimmer" style={{ width: '100%', height: '33px', borderRadius: '6px' }}></div>
              <div className="vmm-shimmer" style={{ width: '100%', height: '33px', borderRadius: '6px' }}></div>
              <div className="vmm-shimmer" style={{ width: '100%', height: '33px', borderRadius: '6px' }}></div>
              <div className="vmm-shimmer" style={{ width: '100%', height: '33px', borderRadius: '6px' }}></div>
              <div className="vmm-shimmer" style={{ width: '100%', height: '33px', borderRadius: '6px' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const chartData = data.map(item => ({
    name: item.name,
    y: item.value,
    color: item.color
  }));

  const options = {
    chart: {
      type: 'pie',
      height: 150,
      backgroundColor: 'transparent',
      margin: [0, 0, 0, 0],
      spacing: [0, 0, 0, 0]
    },
    title: {
      text: null
    },
    credits: {
      enabled: false
    },
    tooltip: {
      enabled: true,
      useHTML: true,
      backgroundColor: '#ffffff',
      borderColor: '#7cb5ec',
      borderRadius: 2,
      borderWidth: 1,
      shadow: true,
      padding: 8,
      formatter: function() {
        return `<div style="font-size: 12px; font-family: 'Inter', sans-serif; min-width: 120px;">
                  <div style="color: #333333; margin-bottom: 4px;">${this.point.name}</div>
                  <div style="color: #333333;">
                    <strong>${this.point.y.toLocaleString('en-US').replace(/,/g, ' ')}</strong> Tags (${this.point.percentage.toFixed(2)}%)
                  </div>
                </div>`;
      }
    },
    plotOptions: {
      pie: {
        innerSize: '70%',
        startAngle: -90,
        endAngle: 90,
        center: ['50%', '100%'],
        size: '190%',
        borderWidth: 2,
        borderColor: '#ffffff',
        dataLabels: {
          enabled: false
        },
        states: {
          hover: {
            enabled: true,
            halo: {
              size: 0
            }
          }
        }
      }
    },
    series: [{
      name: 'Value',
      data: chartData
    }]
  };

  return (
    <div className="vmm-chart-card vmm-flex-col">
      {/* Header spanning full width at top */}
      <div className="vmm-chart-header vmm-mb-large" style={{ position: 'relative' }}>
        <h3>{title}</h3>
        <p>{subtitle}</p>
        <div className="vmm-chart-badge-corner">
          <span className="vmm-trend-icon">&#x2197;</span> Avg Recycle Count : <strong>{avgCount}</strong>
        </div>
      </div>

      <div className="vmm-chart-container">
        {/* Left Side: Graphic */}
        <div ref={containerRef} className="vmm-chart-graphic vmm-semi-circle-wrapper" style={{ minHeight: '150px' }}>
          {hasBeenVisible ? (
            <HighchartsReact
              highcharts={Highcharts}
              options={options}
              containerProps={{ style: { height: '100%', width: '100%' } }}
            />
          ) : (
            <div className="vmm-shimmer" style={{ width: '200px', height: '100px', borderTopLeftRadius: '100px', borderTopRightRadius: '100px', margin: '0 auto' }}></div>
          )}
          
          {/* Custom HTML overlay for the center text of the semi-circle */}
          {hasBeenVisible && (
            <div className="vmm-semi-circle-center-text">
              <Recycle size={20} color="#22c55e" className="vmm-recycle-icon" />
              <div className="vmm-semi-circle-label">{totalLabel}</div>
              <div className="vmm-semi-circle-value">{totalValue}</div>
            </div>
          )}
        </div>

        {/* Right Side: Legend */}
        <div className="vmm-chart-legend">
          <div className="vmm-chart-legend-items vmm-compact-items">
            {data.map((item, index) => (
              <div key={index} className="vmm-legend-item vmm-compact">
                <div className="vmm-legend-header">
                  <div className="vmm-legend-label">
                    <span className="vmm-legend-dot" style={{ backgroundColor: item.color }}></span>
                    {item.name}
                  </div>
                  <div className="vmm-legend-stats">
                    <span className="vmm-legend-value">{item.displayValue || item.value}</span>
                    <span className="vmm-legend-percent">{item.percent}%</span>
                  </div>
                </div>
                <ProgressBar percent={parseFloat(item.percent)} color={item.color} height={6} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
