import React from 'react';
import './ProgressBar.css';

export default function ProgressBar({ percent, color = '#4ade80', height = 8 }) {
  // Ensure percent is between 0 and 100
  const clampedPercent = Math.min(Math.max(percent, 0), 100);
  
  return (
    <div className="vmm-progress-track" style={{ height: `${height}px` }}>
      <div 
        className="vmm-progress-fill" 
        style={{ 
          width: `${clampedPercent}%`, 
          backgroundColor: color,
          height: `${height}px`
        }} 
      />
    </div>
  );
}
