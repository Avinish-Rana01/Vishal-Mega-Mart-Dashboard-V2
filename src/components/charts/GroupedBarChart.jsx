import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { useIsInViewport } from '../../hooks/useIsInViewport';

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
  stacked = false,
  customTooltip,
  maxBarWidth,
  barCategoryGap = '10%',
  barGap = 2,
  hideLegend = false,
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

  const [containerRef, hasBeenVisible] = useIsInViewport({ threshold: 0.1 });

  return (
    <div ref={containerRef} style={{ width: '100%', height: height }}>
      {hasBeenVisible && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 30, right: 0, left: -20, bottom: 0 }} barGap={barGap} barCategoryGap={barCategoryGap}>
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
              content={customTooltip ? customTooltip : undefined}
              contentStyle={customTooltip ? undefined : { borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '13px' }}
              formatter={customTooltip ? undefined : (tooltipFormatter || ((value) => value.toLocaleString('en-IN')))}
            />
            {!hideLegend && <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />}

            {bars.map((bar, idx) => (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                name={bar.label || bar.dataKey}
                stackId={stacked ? "a" : undefined}
                fill={striped && idx === 0 ? 'url(#gchart-stripe)' : bar.color}
                radius={stacked ? 0 : 12}
                barSize={maxBarWidth || (stacked ? 32 : 24)}
                onClick={onBarClick ? (data) => onBarClick(data.payload) : undefined}
                cursor={onBarClick ? 'pointer' : 'default'}
              >
                {showValues && (
                  <LabelList 
                    dataKey={bar.dataKey} 
                    position="top" 
                    style={{ fontSize: '11px', fontWeight: 600, fill: bar.color }}
                    formatter={(val) => val > 0 ? val.toLocaleString('en-IN') : ''}
                  />
                )}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
