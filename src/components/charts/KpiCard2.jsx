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
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px -2px rgba(0,0,0,0.03)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid #f1f5f9',
      borderTop: `5px solid ${cardColor.border}`,
      minWidth: '0',
      flex: 1,
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 1, position: 'relative', width: 'calc(100% - 50px)' }}>
        <h3 style={{ fontSize: '11.5px', fontWeight: '700', color: '#1e293b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </h3>
        
        <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0, lineHeight: 1 }}>
          {value}
        </div>
      </div>

      {icon && (
        <div style={{ 
          position: 'absolute',
          right: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: cardColor.border, 
          opacity: 0.35, 
          zIndex: 0,
          pointerEvents: 'none'
        }}>
          {React.isValidElement(icon) ? React.cloneElement(icon, { size: 44, strokeWidth: 2 }) : icon}
        </div>
      )}
    </div>
  );
}
