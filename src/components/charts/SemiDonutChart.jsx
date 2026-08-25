import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useIsInViewport } from '../../hooks/useIsInViewport';

/**
 * SemiDonutChart - A semi-circle (180°) progress gauge chart.
 * Perfect for displaying a single accuracy / completion percentage.
 *
 * @param {number} value - The current value (e.g. 221565)
 * @param {number} maxValue - The maximum value (e.g. 255915)
 * @param {string} centerLabel - Label shown below the percentage in the center (e.g. 'Accuracy Rate')
 * @param {string} primaryColor - Color for the filled arc (default '#1d4ed8')
 * @param {string} emptyColor - Color for the unfilled arc (default '#e2e8f0')
 */
export default function SemiDonutChart({
  value = 0,
  maxValue = 100,
  centerLabel = 'Progress',
  primaryColor = '#1d4ed8',
  emptyColor = '#e2e8f0',
}) {
  const safeMax = maxValue > 0 ? maxValue : 1;
  const percent = Math.min(100, Math.max(0, (value / safeMax) * 100));
  const remaining = 100 - percent;

  const pieData = [
    { name: 'Completed', value: percent },
    { name: 'Remaining', value: remaining },
  ];

  const [containerRef, hasBeenVisible] = useIsInViewport({ threshold: 0.1 });

  return (
    <div ref={containerRef} style={{ position: 'relative', height: '190px', width: '100%' }}>
      {hasBeenVisible && (
        <>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="75%"
                startAngle={180}
                endAngle={0}
                innerRadius="65%"
                outerRadius="100%"
                paddingAngle={0}
                dataKey="value"
                stroke="none"
                cornerRadius={8}
              >
                <Cell fill={primaryColor} />
                <Cell fill={emptyColor} />
              </Pie>
              <Tooltip
                formatter={(val, name) => [`${Number(val).toFixed(1)}%`, name]}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '13px' }}
                itemStyle={{ color: '#0f172a' }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center text overlay */}
          <div style={{
            position: 'absolute',
            bottom: '8px',
            left: 0,
            right: 0,
            textAlign: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>
              {percent.toFixed(0)}%
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              {centerLabel}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
