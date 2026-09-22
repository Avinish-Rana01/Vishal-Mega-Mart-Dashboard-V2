import React, { useMemo } from 'react';

let currentHue = 0.5; // Start at a specific hue for determinism
const GOLDEN_RATIO_CONJUGATE = 0.618033988749895;
const colorMap = new Map();

function getCardColor(title) {
  if (!title) return { border: '#5ea6f1', bg: '#f9f9fb', iconBg: '#e0f2fe' };
  if (colorMap.has(title)) return colorMap.get(title);

  // Generate a mathematically unique hue using the golden ratio sequence
  currentHue += GOLDEN_RATIO_CONJUGATE;
  currentHue %= 1; 

  const h = Math.floor(currentHue * 360);

  const color = {
    border: `hsl(${h}, 85%, 55%)`,
    bg: `hsl(${h}, 85%, 96%)`,
    iconBg: `hsl(${h}, 85%, 90%)`
  };

  colorMap.set(title, color);
  return color;
}

export default function KpiCard2({ title, value, subtext, badge, badgeVariant = 'default', icon }) {
  const cardColor = useMemo(() => getCardColor(title), [title]);
  
  return (
    <div style={{
      background: cardColor.bg,
      borderRadius: '10px',
      padding: '12px 14px',
      boxShadow: '0 2px 6px -2px rgba(0,0,0,0.03)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      border: '1px solid #f1f5f9',
      borderTop: `4px solid ${cardColor.border}`,
      minWidth: '0',
      flex: 1,
      overflow: 'hidden',
      gap: '8px'
    }}>
      {/* Row 1: Full-width Header Title */}
      <h3 
        style={{ 
          fontSize: '11.5px', 
          fontWeight: '700', 
          color: '#1e293b', 
          margin: 0, 
          textTransform: 'uppercase', 
          letterSpacing: '0.04em',
          width: '100%',
          lineHeight: 1.25,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }} 
        title={typeof title === 'string' ? title : undefined}
      >
        {title}
      </h3>
      
      {/* Row 2: Value on Left & Icon on Right */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        width: '100%',
        gap: '8px'
      }}>
        <div style={{ 
          fontSize: '20px', 
          fontWeight: '700', 
          color: '#0f172a', 
          margin: 0, 
          lineHeight: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {value}
        </div>

        {icon && (
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: cardColor.border, 
            opacity: 0.35, 
            flexShrink: 0
          }}>
            {React.isValidElement(icon) 
              ? React.cloneElement(icon, { 
                  size: 32,
                  strokeWidth: icon.props.strokeWidth || 2
                }) 
              : icon}
          </div>
        )}
      </div>
    </div>
  );
}
