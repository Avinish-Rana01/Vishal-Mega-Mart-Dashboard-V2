import React from 'react';
import './DiwaliTheme.css';

/**
 * 🌟 MASTER FESTIVE THEME TOGGLE 🌟
 * - Set to `true`  -> Festive theme renders in Header & Sidebar.
 * - Set to `false` -> Completely disabled (returns null, 0 DOM nodes, 0 CPU).
 */
export const IS_DIWALI_THEME_ENABLED = false;
export const Diya = ({ size = 36, flameDelayClass = '' }) => {
  const width = size;
  const height = size * 0.70;

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 100 70" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible', display: 'block' }}
    >
      <defs>
        {/* Clay Bowl Gradient */}
        <radialGradient id="diyaClay" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="50%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#78350f" />
        </radialGradient>

        {/* Diya Rim Highlight */}
        <linearGradient id="diyaGoldRim" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* Outer Flame Gradient */}
        <linearGradient id="flameOuter" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="50%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#fef08a" />
        </linearGradient>

        {/* Inner Flame Glow */}
        <linearGradient id="flameInner" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="40%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>

      {/* Flame & Wick */}
      <g className={`diwali-flame ${flameDelayClass}`} style={{ transformOrigin: '50px 38px' }}>
        {/* Outer Flame Glow */}
        <path
          d="M50 4 C44 18, 38 24, 38 34 C38 41, 43 46, 50 46 C57 46, 62 41, 62 34 C62 24, 56 18, 50 4 Z"
          fill="url(#flameOuter)"
          opacity="0.95"
        />
        {/* Inner Bright Flame Core */}
        <path
          d="M50 14 C46 22, 43 27, 43 34 C43 39, 46 43, 50 43 C54 43, 57 39, 57 34 C57 27, 54 22, 50 14 Z"
          fill="url(#flameInner)"
        />
        {/* Tiny white heat point */}
        <ellipse cx="50" cy="35" rx="2.5" ry="4" fill="#ffffff" opacity="0.9" />
      </g>

      {/* Clay Diya Base */}
      <path
        d="M12 45 C18 68, 82 68, 88 45 C92 42, 85 40, 50 38 C15 40, 8 42, 12 45 Z"
        fill="url(#diyaClay)"
      />

      {/* Golden Decorative Rim */}
      <ellipse cx="50" cy="42" rx="38" ry="6" fill="url(#diyaGoldRim)" stroke="#92400e" strokeWidth="0.8" />
      <ellipse cx="50" cy="42" rx="34" ry="4.5" fill="#78350f" opacity="0.5" />

      {/* Rim Beading / Ornamental dots */}
      <circle cx="26" cy="43" r="1.5" fill="#fef08a" />
      <circle cx="34" cy="44" r="1.5" fill="#fef08a" />
      <circle cx="42" cy="44.5" r="1.5" fill="#fef08a" />
      <circle cx="50" cy="44.8" r="1.8" fill="#fef08a" />
      <circle cx="58" cy="44.5" r="1.5" fill="#fef08a" />
      <circle cx="66" cy="44" r="1.5" fill="#fef08a" />
      <circle cx="74" cy="43" r="1.5" fill="#fef08a" />

      {/* Base Footing */}
      <path
        d="M40 64 C42 69, 58 69, 60 64 Z"
        fill="#78350f"
      />
    </svg>
  );
};

/**
 * Golden Mandala / Rangoli Art SVG
 */
export const Mandala = () => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />
    <circle cx="50" cy="50" r="38" stroke="#d97706" strokeWidth="1.2" />
    <circle cx="50" cy="50" r="28" stroke="#f59e0b" strokeWidth="0.8" />
    <circle cx="50" cy="50" r="16" stroke="#d97706" strokeWidth="1.2" fill="#fef3c7" fillOpacity="0.15" />
    <circle cx="50" cy="50" r="6" fill="#f59e0b" />

    {/* 8 Floral Petals */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => (
      <g key={idx} transform={`rotate(${angle} 50 50)`}>
        <path
          d="M50 12 C44 24, 44 32, 50 38 C56 32, 56 24, 50 12 Z"
          stroke="#d97706"
          strokeWidth="1"
          fill="#fbbf24"
          fillOpacity="0.2"
        />
        <circle cx="50" cy="22" r="1.8" fill="#d97706" />
      </g>
    ))}
  </svg>
);

/**
 * Festive Firework / Sparkler Burst SVG
 */
export const Firework = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Center Glow */}
    <circle cx="30" cy="30" r="3" fill="#ffffff" />
    <circle cx="30" cy="30" r="5" fill="#facc15" opacity="0.6" />

    {/* Radiating Rays */}
    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
      const isLong = i % 2 === 0;
      const r = isLong ? 24 : 16;
      const rad = (deg * Math.PI) / 180;
      const x2 = 30 + r * Math.cos(rad);
      const y2 = 30 + r * Math.sin(rad);
      const dotR = isLong ? 1.5 : 1.2;
      return (
        <g key={i}>
          <line
            x1="30"
            y1="30"
            x2={x2}
            y2={y2}
            stroke={isLong ? "#facc15" : "#f59e0b"}
            strokeWidth={isLong ? "1.5" : "1"}
            strokeLinecap="round"
          />
          <circle cx={x2} cy={y2} r={dotR} fill={isLong ? "#fde047" : "#ea580c"} />
        </g>
      );
    })}
  </svg>
);

/**
 * Hanging String Lights (Garland) SVG
 */
export const Garland = () => (
  <svg viewBox="0 0 300 35" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    {/* Swag 1 */}
    <path d="M0 4 Q 50 20, 100 4" stroke="#d97706" strokeWidth="1.2" fill="none" />
    {/* Swag 2 */}
    <path d="M100 4 Q 150 22, 200 4" stroke="#d97706" strokeWidth="1.2" fill="none" />
    {/* Swag 3 */}
    <path d="M200 4 Q 250 20, 300 4" stroke="#d97706" strokeWidth="1.2" fill="none" />

    {/* Glowing Light Bulbs */}
    {[
      { cx: 25, cy: 14, color: '#facc15' },
      { cx: 50, cy: 20, color: '#f59e0b' },
      { cx: 75, cy: 14, color: '#facc15' },
      { cx: 100, cy: 4, color: '#ea580c' },
      { cx: 125, cy: 15, color: '#facc15' },
      { cx: 150, cy: 22, color: '#fde047' },
      { cx: 175, cy: 15, color: '#f59e0b' },
      { cx: 200, cy: 4, color: '#ea580c' },
      { cx: 225, cy: 14, color: '#facc15' },
      { cx: 250, cy: 20, color: '#fde047' },
      { cx: 275, cy: 14, color: '#f59e0b' }
    ].map((bulb, idx) => (
      <g key={idx} className="diwali-fairy-bulb">
        <circle cx={bulb.cx} cy={bulb.cy} r="3" fill={bulb.color} />
        <circle cx={bulb.cx} cy={bulb.cy} r="5" fill={bulb.color} opacity="0.3" />
      </g>
    ))}
  </svg>
);

/**
 * Hanging Traditional Lantern (Kandil) SVG
 */
export const Kandil = ({ primaryColor = '#ec4899', secondaryColor = '#f59e0b', className = '' }) => (
  <svg width="24" height="48" viewBox="0 0 30 65" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Hanging String */}
    <line x1="15" y1="0" x2="15" y2="10" stroke="#b45309" strokeWidth="1" />

    {/* Top Cap */}
    <polygon points="12,10 18,10 20,13 10,13" fill="#b45309" />

    {/* Lantern Body (Diamond Faceted) */}
    <polygon points="15,13 27,27 15,41 3,27" fill={primaryColor} stroke={secondaryColor} strokeWidth="1.2" />
    <polygon points="15,18 23,27 15,36 7,27" fill={secondaryColor} opacity="0.8" />
    <circle cx="15" cy="27" r="3.5" fill="#fef08a" />

    {/* Bottom Cap */}
    <polygon points="11,41 19,41 17,44 13,44" fill="#b45309" />

    {/* Hanging Tassels / Ribbons */}
    <line x1="11" y1="44" x2="9" y2="62" stroke={secondaryColor} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="15" y1="44" x2="15" y2="65" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
    <line x1="19" y1="44" x2="21" y2="62" stroke={secondaryColor} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * Full Diwali Header Festive Overlay
 */
export const DiwaliHeaderDecorations = ({ enabled = IS_DIWALI_THEME_ENABLED }) => {
  if (!enabled) return null;

  return (
    <div className="diwali-header-decorations" aria-hidden="true">
      {/* 1. Golden Mandala Art in Center-Left */}
      <div className="diwali-header-mandala">
        <Mandala />
      </div>

      {/* 2. Sparkler 1 */}
      <div className="diwali-header-firework-1">
        <Firework size={34} />
      </div>

      {/* 3. Hanging String Lights Garland */}
      <div className="diwali-header-garland">
        <Garland />
      </div>

      {/* 4. Hanging Paper Lanterns (Kandils) */}
      <div className="diwali-lantern-group">
        <Kandil primaryColor="#e11d48" secondaryColor="#f59e0b" className="diwali-kandil-1" />
        <Kandil primaryColor="#f59e0b" secondaryColor="#eab308" className="diwali-kandil-2" />
      </div>

      {/* 5. Trio of Lit Diyas before User Avatar */}
      <div className="diwali-header-diyas">
        <Diya size={26} flameDelayClass="diwali-flame-delay-1" />
        <Diya size={32} />
        <Diya size={26} flameDelayClass="diwali-flame-delay-2" />
      </div>
    </div>
  );
};

/**
 * Animated Sky Shot Rocket & Radial Burst
 */
export const SkyShot = ({ className = '', colorTheme = 'gold' }) => {
  const angles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

  return (
    <div className={`diwali-skyshot ${className} theme-${colorTheme}`}>
      {/* Rocket spark ascending */}
      <div className="diwali-skyshot-rocket">
        <span className="diwali-rocket-head" />
        <span className="diwali-rocket-tail" />
      </div>

      {/* Radiant explosion at apex */}
      <div className="diwali-skyshot-burst">
        <div className="diwali-burst-core" />
        {angles.map((deg, i) => (
          <span
            key={i}
            className="diwali-burst-spark"
            style={{
              '--angle': `${deg}deg`,
              '--distance': `${i % 2 === 0 ? 20 : 13}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Full Diwali Sidebar Festive Overlay
 */
export const DiwaliSidebarDecorations = ({ enabled = IS_DIWALI_THEME_ENABLED }) => {
  if (!enabled) return null;

  return (
    <div className="diwali-sidebar-decorations" aria-hidden="true">
      {/* Dynamic Sky Shots bursting from bottom upwards */}
      <SkyShot className="diwali-skyshot-1" colorTheme="gold" />
      <SkyShot className="diwali-skyshot-2" colorTheme="ruby" />
      <SkyShot className="diwali-skyshot-3" colorTheme="emerald" />

      {/* Twinkling Sparklers */}
      <div className="diwali-sidebar-sparkle-1">
        <Firework size={28} />
      </div>

      <div className="diwali-sidebar-sparkle-2">
        <Firework size={26} />
      </div>

      {/* Mandala Arc on bottom left edge */}
      <div className="diwali-sidebar-mandala">
        <Mandala />
      </div>

      {/* Big Glowing Diya at bottom of Sidebar */}
      <div className="diwali-sidebar-bottom-diya">
        <Diya size={42} />
      </div>
    </div>
  );
};
