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
 * 🎆 Realistic Canvas Firecracker Engine (Adapted from Crackers suite)
 * Scaled & tuned specifically for the 61px sidebar:
 * - Ultra-thin hairline sparks (lineWidth ~0.85px) with white-hot burning tips.
 * - Limited particle counts (6–9 stars) so the bursts remain elegant, uncluttered, and non-distracting.
 * - 100% silent and strictly bounded within the sidebar width.
 */
export const RealisticSidebarCrackers = () => {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId = null;
    let width = 61;
    let height = 600;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        width = parent.clientWidth || 61;
        height = parent.clientHeight || 600;
      }
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Particle storage pools
    let rocket = null;
    const stars = [];
    const sparks = [];
    const flashes = [];

    // Shell sequencer: cycles through the 3 realistic effects
    const SHELL_EFFECTS = ['crysanthemum', 'willow', 'crackle'];
    let shellIndex = 0;
    let launchTimer = 45; // First launch after ~0.8s

    // Colors derived from Crackers suite
    const PALETTE = {
      gold: '#fbbf24',
      ruby: '#f43f5e',
      emerald: '#10b981',
      white: '#ffffff',
      warmGold: '#facc15',
      orange: '#f97316'
    };

    const spawnRocket = () => {
      const currentEffect = SHELL_EFFECTS[shellIndex % SHELL_EFFECTS.length];
      shellIndex++;

      // Launch position: strictly centered in sidebar above Diya
      const startX = width / 2;
      const startY = height - 52;

      // Target apex: between 38% and 55% from the top of the sidebar
      const targetApexY = height * 0.40 + Math.random() * (height * 0.15);
      const distance = startY - targetApexY;
      const gravity = 0.075;
      const initialVy = -Math.sqrt(2 * gravity * distance);

      let shellColor = PALETTE.gold;
      if (currentEffect === 'crysanthemum') {
        const colors = [PALETTE.gold, PALETTE.ruby, PALETTE.emerald];
        shellColor = colors[Math.floor(Math.random() * colors.length)];
      }

      rocket = {
        x: startX,
        y: startY,
        prevX: startX,
        prevY: startY,
        vx: (Math.random() - 0.5) * 0.12,
        vy: initialVy,
        gravity,
        effect: currentEffect,
        color: shellColor,
        sparkTimer: 0
      };
    };

    const detonateRocket = (r) => {
      // 1. Subtle micro-flash at detonation center (tiny, non-blobby)
      flashes.push({
        x: r.x,
        y: r.y,
        radius: 6,
        alpha: 0.65
      });

      // 2. Spawn thin, limited stars tailored for the 61px sidebar
      if (r.effect === 'crysanthemum') {
        // --- Effect 1: Thin Crysanthemum (8–10 delicate radiant needles) ---
        const starCount = 9;
        for (let i = 0; i < starCount; i++) {
          const angle = (i / starCount) * Math.PI * 2 + (Math.random() * 0.2 - 0.1);
          // Max spread speed ~0.65px ensures radius never exceeds 14px from center
          const speed = 0.45 + Math.random() * 0.28;
          stars.push({
            x: r.x,
            y: r.y,
            prevX: r.x,
            prevY: r.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            drag: 0.94,
            gravity: 0.032,
            color: r.color,
            life: 32 + Math.floor(Math.random() * 12),
            fullLife: 44,
            effect: 'crysanthemum',
            glitter: true
          });
        }
      } else if (r.effect === 'willow') {
        // --- Effect 2: Willow (7 golden silk threads weeping down) ---
        const starCount = 7;
        for (let i = 0; i < starCount; i++) {
          const angle = (i / starCount) * Math.PI * 2 + (Math.random() * 0.2 - 0.1);
          const speed = 0.35 + Math.random() * 0.25;
          stars.push({
            x: r.x,
            y: r.y,
            prevX: r.x,
            prevY: r.y,
            vx: Math.cos(angle) * speed * 0.8,
            vy: Math.sin(angle) * speed - 0.12, // small initial upward lift
            drag: 0.92,
            gravity: 0.042, // heavier gravity for weeping waterfall effect
            color: PALETTE.gold,
            life: 55 + Math.floor(Math.random() * 20),
            fullLife: 75,
            effect: 'willow'
          });
        }
      } else if (r.effect === 'crackle') {
        // --- Effect 3: Crackle (7 palm tracers with micro-pop finale) ---
        const starCount = 7;
        for (let i = 0; i < starCount; i++) {
          const angle = (i / starCount) * Math.PI * 2 + (Math.random() * 0.2 - 0.1);
          const speed = 0.48 + Math.random() * 0.26;
          stars.push({
            x: r.x,
            y: r.y,
            prevX: r.x,
            prevY: r.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            drag: 0.935,
            gravity: 0.030,
            color: PALETTE.warmGold,
            life: 20 + Math.floor(Math.random() * 8),
            fullLife: 28,
            effect: 'crackle'
          });
        }
      }
    };

    // Main animation loop
    let lastTime = performance.now();
    let isPageVisible = true;

    const onVisibilityChange = () => {
      isPageVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const tick = (now) => {
      animId = requestAnimationFrame(tick);
      if (!isPageVisible) return;

      const delta = Math.min((now - lastTime) / 16.67, 2);
      lastTime = now;

      // 1. Clean alpha fading: removes previous frame trails directly to transparent
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
      ctx.fillRect(0, 0, width, height);

      // Return to source-over for rendering bright luminous particles
      ctx.globalCompositeOperation = 'source-over';

      // 2. Render subtle micro-flashes
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.alpha -= 0.22 * delta;
        if (f.alpha <= 0) {
          flashes.splice(i, 1);
          continue;
        }
        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
        grad.addColorStop(0, `rgba(255, 255, 255, ${f.alpha})`);
        grad.addColorStop(0.5, `rgba(254, 240, 138, ${f.alpha * 0.3})`);
        grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Update & render Rocket
      if (rocket) {
        rocket.prevX = rocket.x;
        rocket.prevY = rocket.y;
        rocket.vy += rocket.gravity * delta;
        rocket.x += rocket.vx * delta;
        rocket.y += rocket.vy * delta;

        // Bounded strictly inside sidebar
        rocket.x = Math.max(10, Math.min(width - 10, rocket.x));

        // Draw thin ascending rocket streak
        ctx.lineWidth = 0.85;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rocket.prevX, rocket.prevY);
        ctx.lineTo(rocket.x, rocket.y);
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Rocket exhaust: occasional single micro-spark
        rocket.sparkTimer += delta;
        if (rocket.sparkTimer >= 2.5) {
          rocket.sparkTimer = 0;
          sparks.push({
            x: rocket.x,
            y: rocket.y + 1,
            prevX: rocket.x,
            prevY: rocket.y,
            vx: (Math.random() - 0.5) * 0.2,
            vy: Math.random() * 0.8 + 0.4,
            color: PALETTE.orange,
            life: 10 + Math.floor(Math.random() * 6),
            drag: 0.90,
            gravity: 0.04
          });
        }

        // Apex reached (when upward velocity slows to near 0)
        if (rocket.vy >= -0.15) {
          detonateRocket(rocket);
          rocket = null;
          // Natural pause: 4.5s to 6.0s before next elegant cracker
          launchTimer = 270 + Math.floor(Math.random() * 90);
        }
      } else {
        launchTimer -= delta;
        if (launchTimer <= 0) {
          spawnRocket();
        }
      }

      // 4. Update & render Thin Stars
      ctx.lineWidth = 0.85;
      ctx.lineCap = 'round';

      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.life -= delta;

        if (s.life <= 0) {
          // If crackle effect star dies, pop into 2-3 crisp micro-crackles!
          if (s.effect === 'crackle') {
            const microCount = 3;
            for (let m = 0; m < microCount; m++) {
              const microAngle = Math.random() * Math.PI * 2;
              const microSpeed = 0.25 + Math.random() * 0.35;
              sparks.push({
                x: s.x,
                y: s.y,
                prevX: s.x,
                prevY: s.y,
                vx: Math.cos(microAngle) * microSpeed,
                vy: Math.sin(microAngle) * microSpeed,
                color: '#ffffff',
                life: 6 + Math.floor(Math.random() * 5),
                drag: 0.85,
                gravity: 0.03
              });
            }
          }
          stars.splice(i, 1);
          continue;
        }

        s.prevX = s.x;
        s.prevY = s.y;
        s.vx *= Math.pow(s.drag, delta);
        s.vy *= Math.pow(s.drag, delta);
        s.vy += s.gravity * delta;
        s.x += s.vx * delta;
        s.y += s.vy * delta;

        // Strict sidebar boundary clamp: keep within [8, width - 8]
        if (s.x < 8) {
          s.x = 8;
          s.vx = Math.abs(s.vx) * 0.15;
        } else if (s.x > width - 8) {
          s.x = width - 8;
          s.vx = -Math.abs(s.vx) * 0.15;
        }

        // Draw thin star hairline trail
        ctx.beginPath();
        ctx.moveTo(s.prevX, s.prevY);
        ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = s.color;
        ctx.stroke();

        // Draw white-hot incandescent burning tip at the leading head
        ctx.beginPath();
        ctx.arc(s.x, s.y, 0.65, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Emit delicate trailing micro-specks for Willow weeping
        if (s.effect === 'willow') {
          if (Math.random() < 0.30) {
            sparks.push({
              x: s.x,
              y: s.y,
              prevX: s.x,
              prevY: s.y,
              vx: s.vx * 0.1 + (Math.random() - 0.5) * 0.1,
              vy: s.vy * 0.1 + (Math.random() * 0.2),
              color: PALETTE.gold,
              life: 14,
              drag: 0.92,
              gravity: 0.03
            });
          }
        }
      }

      // 5. Update & render Sparks (hairline micro-particles)
      ctx.lineWidth = 0.65;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.life -= delta;
        if (sp.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        sp.prevX = sp.x;
        sp.prevY = sp.y;
        sp.vx *= Math.pow(sp.drag, delta);
        sp.vy *= Math.pow(sp.drag, delta);
        sp.vy += sp.gravity * delta;
        sp.x += sp.vx * delta;
        sp.y += sp.vy * delta;

        // Strict sidebar boundary clamp
        if (sp.x < 6) sp.x = 6;
        else if (sp.x > width - 6) sp.x = width - 6;

        ctx.beginPath();
        ctx.moveTo(sp.prevX, sp.prevY);
        ctx.lineTo(sp.x, sp.y);
        ctx.strokeStyle = sp.color;
        ctx.stroke();
      }
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="diwali-sidebar-canvas"
      aria-hidden="true"
    />
  );
};

/**
 * Animated Sky Shot Rocket & Radial Burst (Legacy CSS fallback)
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
      {/* 🎆 Realistic Canvas Firecracker Engine (Crysanthemum, Willow, Crackle from Crackers) */}
      <RealisticSidebarCrackers />

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
