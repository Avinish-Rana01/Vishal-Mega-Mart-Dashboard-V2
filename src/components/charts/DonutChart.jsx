import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useIsInViewport } from '../../hooks/useIsInViewport';

/**
 * DonutChart - A full 360° donut chart for multi-segment breakdowns.
 * 
 * @param {Array} segments - Array of: [{ name, value, color }]
 * @param {string} centerText - Big text in the center of the donut
 * @param {string} centerSubtext - Smaller text below the center text
 * @param {number} height - Height of the chart (default 220)
 * @param {boolean} showLegend - Whether to show the bottom legend (default true)
 */
export default function DonutChart({
  segments = [],
  centerText,
  centerSubtext,
  height = 220,
  showLegend = true,
}) {
  if (!segments || segments.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8',
        fontSize: '14px',
      }}>
        No data available.
      </div>
    );
  }

  const [containerRef, hasBeenVisible] = useIsInViewport({ threshold: 0.1 });

  return (
    <div ref={containerRef} style={{ position: 'relative', height: height, width: '100%' }}>
      {hasBeenVisible && (
        <>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segments}
                cx="50%"
                cy="45%"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={3}
                dataKey="value"
                stroke="none"
                cornerRadius={6}
              >
                {segments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => value.toLocaleString('en-IN')}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '13px' }}
              />
              {showLegend && (
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px', paddingTop: '0px' }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>

          {/* Center text overlay */}
          {(centerText || centerSubtext) && (
            <div style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}>
              {centerText && (
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>
                  {centerText}
                </div>
              )}
              {centerSubtext && (
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  {centerSubtext}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
