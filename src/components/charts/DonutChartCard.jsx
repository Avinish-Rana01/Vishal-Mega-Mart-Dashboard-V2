import React, { memo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReactWrapper from 'highcharts-react-official';
const HighchartsReact = HighchartsReactWrapper.default || HighchartsReactWrapper;
import ProgressBar from '../common/ProgressBar';
import './Charts.css';

import { useIsInViewport } from '../../hooks/useIsInViewport';

export default memo(function DonutChartCard({ 
  title = "Inventory Breakdown", 
  subtitle = "Tag distribution across sites",
  data = [],
  totalLabel = "Total Tags",
  totalValue = "0",
  isLoading = false
}) {
  const [containerRef, hasBeenVisible] = useIsInViewport({ threshold: 0.1 });
  if (isLoading) {
    return (
      <div className="vmm-chart-card">
        <div className="vmm-chart-container">
          <div className="vmm-chart-graphic" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <div className="vmm-shimmer" style={{ width: '170px', height: '170px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'white' }}></div>
            </div>
          </div>
          <div className="vmm-chart-legend">
            <div className="vmm-chart-header" style={{ marginBottom: '16px' }}>
              <h3>{title}</h3>
              <p>{subtitle}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div className="vmm-shimmer" style={{ width: '100%', height: '36px', borderRadius: '6px' }}></div>
              <div className="vmm-shimmer" style={{ width: '100%', height: '36px', borderRadius: '6px' }}></div>
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
      height: 200,
      backgroundColor: 'transparent',
      margin: [0, 0, 0, 0],
      spacing: [0, 0, 0, 0]
    },
    title: {
      text: `<div style="text-align:center;line-height:1.2"><span style="font-size:22px;font-weight:700;color:#000000">${totalValue}</span><br><span style="font-size:13px;font-weight:500;color:#94a3b8">${totalLabel}</span></div>`,
      align: 'center',
      verticalAlign: 'middle',
      useHTML: true,
      y: 16
    },
    credits: {
      enabled: false
    },
    tooltip: {
      enabled: true,
      useHTML: true,
      backgroundColor: '#1e293b',
      borderColor: '#1e293b',
      borderRadius: 4,
      borderWidth: 0,
      shadow: true,
      padding: 10,
      formatter: function() {
        return `<div style="font-size: 12px; font-family: 'Inter', sans-serif; color: #ffffff;">
                  <div style="margin-bottom: 4px; font-weight: 500;">${this.point.name}</div>
                  <div>
                    <span style="font-size: 14px; font-weight: 700;">${this.point.y.toLocaleString('en-US').replace(/,/g, ' ')}</span> tags<br/>
                    <span style="color: #e0f2fe;">${this.point.percentage.toFixed(2)}%</span>
                  </div>
                </div>`;
      }
    },
    plotOptions: {
      pie: {
        innerSize: '75%',
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
    <div className="vmm-chart-card">
      <div className="vmm-chart-container">
        <div ref={containerRef} className="vmm-chart-graphic" style={{ minHeight: '170px' }}>
          {hasBeenVisible ? (
            <HighchartsReact
              highcharts={Highcharts}
              options={options}
              containerProps={{ style: { height: '100%', width: '100%' } }}
            />
          ) : (
            <div className="vmm-shimmer" style={{ width: '170px', height: '170px', borderRadius: '50%', margin: '0 auto' }}></div>
          )}
        </div>
        
        <div className="vmm-chart-legend">
          <div className="vmm-chart-header">
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
          
          <div className="vmm-chart-legend-items">
            {data.map((item, index) => (
              <div key={index} className="vmm-legend-item">
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
                <ProgressBar percent={parseFloat(item.percent)} color={item.color} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
