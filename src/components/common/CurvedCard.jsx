import React, { useMemo } from 'react';

export default function CurvedCard({ title, value, waveColor = ['#f472b6', '#db2777'], icon, progress, progressText }) {
  // Ensure we have an array for gradient, fallback to same color if string passed
  const colors = Array.isArray(waveColor) ? waveColor : [waveColor, waveColor];
  // We need a unique ID for the SVG gradient so they don't clash on the page
  const gradientId = `wave-grad-${title.replace(/[^a-zA-Z0-9]/g, '')}`;

  // Generate a smooth random wave path on mount using summed sine waves
  const wavePath = useMemo(() => {
    const numWaves = 3;
    const waves = [];
    
    // Generate parameters for 3 sine waves tuned for 1440px width
    for (let i = 0; i < numWaves; i++) {
      waves.push({
        // Higher amplitude for more prominent peaks and valleys (30 to 70px)
        amplitude: Math.random() * 40 + 10, 
        // Higher frequency for more waves across the 1440 width (1-3 full waves)
        frequency: Math.random() * 0.008 + 0.005, 
        phase: Math.random() * Math.PI * 2 // Random starting phase
      });
    }

    let path = '';
    const width = 1440;
    
    // Draw the wave horizontally in 20px increments for a smooth curve
    for (let x = 0; x <= width; x += 20) {
      let y = 190; // Base baseline height on the card (out of 320 max)
      
      // Sum the sine waves
      for (let i = 0; i < waves.length; i++) {
        y += Math.sin(waves[i].frequency * x + waves[i].phase) * waves[i].amplitude;
      }
      
      if (x === 0) {
        path += `M0,${y} `;
      } else {
        path += `L${x},${y} `;
      }
    }

    // Ensure the wave fills down to the bottom of the card
    path += `L${width},320 L0,320 Z`;
    return path;
  }, []);

  return (
    <div className="curve-card" style={{ backgroundColor: '#ffffff', borderTop: 'none' }}>
      <div className="card-top">
        <div className="card-content" style={{ flex: 1, marginRight: '16px' }}>
          <p>{title}</p>
          <h3 style={{ marginBottom: progress !== undefined ? '8px' : '0' }}>{value}</h3>
          
          {progress !== undefined && (
            <div style={{ width: '100%', maxWidth: '200px' }}>
              <div style={{ 
                height: '8px', 
                background: '#e2e8f0', 
                borderRadius: '4px', 
                overflow: 'hidden',
                marginBottom: '4px'
              }}>
                <div style={{ 
                  height: '100%', 
                  width: `${Math.min(100, Math.max(0, progress))}%`, 
                  background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`,
                  borderRadius: '4px',
                  transition: 'width 0.5s ease-out'
                }} />
              </div>
              {progressText && (
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                  {progressText}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Dynamic Circular Icon */}
        <div className="card-icon" style={{ 
          position: 'relative', 
          width: '40px', 
          height: '40px', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginTop: 0 // override default css if any
        }}>
          {/* Soft light background for the icon */}
          <div style={{ position: 'absolute', inset: 0, backgroundColor: colors[0], opacity: 0.25, borderRadius: '50%' }}></div>
          
          {/* The Icon */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex' }}>
            {icon || (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="black">
                <path d="M21.6 5.34l-3.23-1.78c-.28-.15-.59-.22-.91-.22H6.54c-.32 0-.63.07-.91.22L2.4 5.34C1.56 5.81 1.25 6.89 1.7 7.73l.6 1.08c.46.84 1.53 1.15 2.38.68l.32-.18V20c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V9.31l.32.18c.85.47 1.92.16 2.38-.68l.6-1.08c.45-.84.14-1.92-.7-2.39zM12 4c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2z"/>
              </svg>
            )}
          </div>
        </div>

      </div>
      <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: '40px', zIndex: 0 }}>
        <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors[0]} />
              <stop offset="100%" stopColor={colors[1]} />
            </linearGradient>
          </defs>
          <path fill={`url(#${gradientId})`} fillOpacity="1" d={wavePath}></path>
        </svg>
      </div>
      <style>{`
        .curve-card::after { display: none !important; }
      `}</style>
    </div>
  );
}
