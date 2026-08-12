import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

/**
 * TimelineChart - A single-series bar chart for time-block / hourly data.
 * Highlights the bar with the highest value automatically.
 *
 * @param {Array} data - Array of { label, value } objects
 * @param {string} dataKey - Key for the value (default 'value')
 * @param {string} labelKey - Key for the X-axis label (default 'label')
 * @param {string} color - Base bar color (default '#1d4ed8')
 * @param {string} highlightColor - Color for the peak bar (default '#f59e0b')
 * @param {number} height - Chart height in px (default 250)
 * @param {string} tooltipLabel - Label shown in tooltip
 */
export default function TimelineChart({
  data = [],
  dataKey = 'value',
  labelKey = 'label',
  color = '#1d4ed8',
  highlightColor = '#f59e0b',
  height = 250,
  tooltipLabel = 'Count',
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
        No data available.
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => Number(d[dataKey]) || 0));

  // Normalize data for recharts
  const chartData = data.map(d => ({
    name: d[labelKey],
    [dataKey]: Number(d[dataKey]) || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(241,245,249,0.7)' }}
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '13px' }}
          formatter={(value) => [value.toLocaleString('en-IN'), tooltipLabel]}
        />
        <Bar dataKey={dataKey} radius={[8, 8, 0, 0]} maxBarSize={40}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry[dataKey] === maxValue && maxValue > 0 ? highlightColor : color}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
