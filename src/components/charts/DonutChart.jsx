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
  halfCircle = false,
  innerRadius,
  outerRadius,
  cy,
  centerTop,
  tooltipFormatter = (value) => value.toLocaleString('en-IN'),
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

  const defaultCy = halfCircle ? "75%" : (showLegend ? "45%" : "50%");
  const defaultInner = innerRadius || (halfCircle ? "65%" : "55%");
  const defaultOuter = outerRadius || (halfCircle ? "95%" : "80%");
  const defaultCenterTop = centerTop || (halfCircle ? '72%' : (showLegend ? '45%' : '50%'));

  return (
    <div ref={containerRef} style={{ position: 'relative', height: height, width: '100%' }}>
      {hasBeenVisible && (
        <>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segments}
                cx="50%"
                cy={cy || defaultCy}
                startAngle={halfCircle ? 180 : 360}
                endAngle={0}
                innerRadius={defaultInner}
                outerRadius={defaultOuter}
                paddingAngle={1.5}
                dataKey="value"
                stroke="none"
                cornerRadius={4}
              >
                {segments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={tooltipFormatter}
                contentStyle={{ zIndex: 1000, backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '13px' }}
                itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                wrapperStyle={{ zIndex: 1000 }}
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
              top: defaultCenterTop,
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
              zIndex: 0,
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
