import React, { useId } from 'react';
import { useCountUp } from '../../hooks/useCountUp';
import './CurvedCard.css';

// Helper to safely generate hex or color-mix alpha for any color format (hex, rgb, hsl)
function getAlphaColor(color, alphaHex = '22') {
  if (!color || typeof color !== 'string') return '#3b82f622';
  const c = color.trim();
  if (c.startsWith('#')) {
    let hex = c.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    if (hex.length === 6) {
      return `#${hex}${alphaHex}`;
    }
    if (hex.length === 8) {
      return `#${hex.slice(0, 6)}${alphaHex}`;
    }
    return c;
  }
  const pct = alphaHex === '22' ? '15%' : alphaHex === '44' ? '28%' : '20%';
  return `color-mix(in srgb, ${c} ${pct}, transparent)`;
}

export default function CurvedCard({ 
  title, 
  value, 
  waveColor = ['#3b82f6', '#2563eb'], // Default elegant blue
  icon, 
  badge,
  progress, 
  progressText, 
  animate = true,
  onClick
}) {
  const autoId = useId();
  // Ensure we have an array for gradient, fallback to same color if string passed
  const colors = Array.isArray(waveColor) ? waveColor : [waveColor, waveColor];
  
  // Use unique ID to prevent gradient collisions across modals and page cards
  const gradientId = `wave-grad-${String(title || 'card').replace(/[^a-zA-Z0-9]/g, '')}-${autoId.replace(/[^a-zA-Z0-9]/g, '')}`;

  const { ref, animatedValue } = useCountUp(value, 1000, animate);

  return (
    <div 
      ref={ref} 
      className={`curve-card-modern ${onClick ? 'curve-card-clickable' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      
      {/* Content wrapper to stay above background waves */}
      <div className="curve-card-content">
        <div className="curve-card-text">
          <p className="curve-card-title">{title}</p>
          <h3 className="curve-card-value">{animatedValue}</h3>
          {badge && <div className="curve-card-badge-wrapper">{badge}</div>}
        </div>
        
        {/* Dynamic Glassmorphic Icon Wrapper */}
        <div 
          className="curve-card-icon-wrapper" 
          style={{ 
            background: `linear-gradient(135deg, ${getAlphaColor(colors[0], '22')}, ${getAlphaColor(colors[1], '38')})`,
            border: `1px solid ${getAlphaColor(colors[0], '44')}`,
            boxShadow: `0 4px 14px ${getAlphaColor(colors[1], '25')}`
          }}
        >
          <div style={{ position: 'relative', zIndex: 1, color: colors[1], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {React.isValidElement(icon)
              ? React.cloneElement(icon, {
                  size: icon.props?.size || 18,
                  color: colors[1],
                  stroke: colors[1]
                })
              : icon || (
                <svg width="18" height="18" viewBox="0 0 24 24" fill={colors[1]}>
                  <path d="M21.6 5.34l-3.23-1.78c-.28-.15-.59-.22-.91-.22H6.54c-.32 0-.63.07-.91.22L2.4 5.34C1.56 5.81 1.25 6.89 1.7 7.73l.6 1.08c.46.84 1.53 1.15 2.38.68l.32-.18V20c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V9.31l.32.18c.85.47 1.92.16 2.38-.68l.6-1.08c.45-.84.14-1.92-.7-2.39zM12 4c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2z"/>
                </svg>
              )}
          </div>
        </div>
      </div>

      {/* Optional Progress Bar */}
      {progress !== undefined && (
        <div className="curve-card-progress-container">
          <div className="curve-card-progress-bar">
            <div 
              className="curve-card-progress-fill"
              style={{ 
                width: `${Math.min(100, Math.max(0, progress))}%`, 
                background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`
              }} 
            />
          </div>
          {progressText && (
            <div className="curve-card-progress-text">{progressText}</div>
          )}
        </div>
      )}

      {/* Elegant Static Overlapping Waves */}
      <div className="curve-card-waves">
        <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors[0]} />
              <stop offset="100%" stopColor={colors[1]} />
            </linearGradient>
          </defs>
          <path fill={`url(#${gradientId})`} fillOpacity="0.1" d="M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,128C960,117,1056,171,1152,197.3C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          <path fill={`url(#${gradientId})`} fillOpacity="0.25" d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,250.7C1248,256,1344,288,1392,304L1440,320L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </div>
  );
}
