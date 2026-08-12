import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

/**
 * GroupedBarChart - A reusable side-by-side bar chart for comparisons.
 *
 * @param {Array} data - Array of objects with at least a `name` key.
 * @param {Array} bars - Array of bar configs: [{ dataKey, color, label }]
 *   Example: [{ dataKey: 'SAP', color: '#6366f1', label: 'SAP Stock' }, { dataKey: 'RFID', color: '#10b981' }]
 * @param {number} height - Height of the chart in px (default 250)
 * @param {boolean} showGrid - Whether to show the grid (default true)
 * @param {boolean} striped - Whether the first bar is striped (default false)
 * @param {Function} tooltipFormatter - Optional custom tooltip value formatter
 * @param {string} emptyText - Text shown when data is empty
 */
export default function GroupedBarChart({
  data = [],
  bars = [],
  height = 250,
  showGrid = true,
  striped = false,
  tooltipFormatter,
  emptyText = 'No data available.',
  onBarClick,
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

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barGap={2}>
        <defs>
          <pattern id="gchart-stripe" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
            <rect width="10" height="10" fill="#f8fafc" />
            <line x1="0" y="0" x2="0" y2="10" stroke="#cbd5e1" strokeWidth="4" />
          </pattern>
        </defs>

        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        )}

        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          interval={0}
          tickFormatter={(val) => val.length > 6 ? val.substring(0, 6) + '…' : val}
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
          formatter={tooltipFormatter || ((value) => value.toLocaleString('en-IN'))}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />

        {bars.map((bar, idx) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.label || bar.dataKey}
            fill={striped && idx === 0 ? 'url(#gchart-stripe)' : bar.color}
            radius={12}
            maxBarSize={32}
            onClick={onBarClick ? (data) => onBarClick(data.payload) : undefined}
            cursor={onBarClick ? 'pointer' : 'default'}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
