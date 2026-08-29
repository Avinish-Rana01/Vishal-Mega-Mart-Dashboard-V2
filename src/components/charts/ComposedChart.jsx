import React from 'react';
import {
  ComposedChart as RechartsComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';

/**
 * ComposedChart - A reusable chart combining bars and lines on dual axes.
 *
 * @param {Array} data - Array of objects with at least a `name` key.
 * @param {Array} bars - Array of bar configs: [{ dataKey, color, label, yAxisId }]
 * @param {Array} lines - Array of line configs: [{ dataKey, color, label, yAxisId }]
 * @param {number} height - Height of the chart in px (default 250)
 * @param {boolean} showGrid - Whether to show the grid (default true)
 * @param {Function} tooltipFormatter - Optional custom tooltip value formatter
 * @param {string} emptyText - Text shown when data is empty
 */
export default function ComposedChart({
  data = [],
  bars = [],
  lines = [],
  height = 250,
  showGrid = true,
  tooltipFormatter,
  emptyText = 'No data available.',
  hideLegend = false,
  barSize = 20,
  showValues = false,
}) {
  if (!data || data.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8',
        fontSize: '14px',
        background: '#f8fafc',
        borderRadius: '12px',
      }}>
        {emptyText}
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataObj = payload[0].payload;
      return (
        <div style={{
          backgroundColor: '#fff',
          padding: '12px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: '#1e293b' }}>
            {dataObj.fullName || label}
          </p>
          {payload.map((entry, index) => {
            const val = tooltipFormatter ? tooltipFormatter(entry.value, entry.name, entry.payload) : entry.value;
            return (
              <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', margin: '4px 0' }}>
                <div style={{ width: '10px', height: '10px', backgroundColor: entry.color, marginRight: '8px', borderRadius: '50%' }}></div>
                <span style={{ color: '#475569', fontSize: '13px', marginRight: '16px' }}>{entry.name}:</span>
                <span style={{ 
                  fontWeight: 'bold', 
                  color: entry.name.includes('%') ? '#0d9488' : (String(val).includes('-') ? '#ef4444' : '#0f172a'), 
                  fontSize: '13px', 
                  marginLeft: 'auto' 
                }}>{val}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsComposedChart
          data={data}
          margin={{ top: 20, right: 10, left: -20, bottom: 10 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />}
          
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 11 }} 
            dy={10} 
            interval={0}
          />
          
          <YAxis 
            yAxisId="left"
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 11 }} 
            dx={-10}
            tickFormatter={(val) => val < 0 ? '' : val}
          />
          
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#0d9488', fontSize: 11 }} 
            dx={10}
            tickFormatter={(val) => `${val}%`}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
          
          {!hideLegend && (
            <Legend 
              iconType="circle" 
              wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#475569' }} 
            />
          )}

          {bars.map((bar, index) => (
            <Bar 
              key={`bar-${index}`} 
              yAxisId={bar.yAxisId || 'left'}
              dataKey={bar.dataKey} 
              name={bar.label || bar.dataKey} 
              fill={bar.color} 
              barSize={barSize}
              radius={[12, 12, 0, 0]} 
            >
              {data.map((entry, idx) => (
                <Cell key={`cell-${index}-${idx}`} fill={bar.color} />
              ))}
              {showValues && (
                <LabelList 
                  dataKey={bar.dataKey} 
                  position="top" 
                  style={{ fontSize: '11px', fontWeight: 600, fill: bar.color }}
                  formatter={(val) => Math.abs(val) > 0 ? Math.abs(val).toLocaleString('en-IN') : ''}
                />
              )}
            </Bar>
          ))}
          
          {lines.map((line, index) => (
            <Line
              key={`line-${index}`}
              yAxisId={line.yAxisId || 'right'}
              type="monotone"
              dataKey={line.dataKey}
              name={line.label || line.dataKey}
              stroke={line.color}
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: line.color }}
              activeDot={{ r: 6 }}
            />
          ))}
          
        </RechartsComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
