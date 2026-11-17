import React, { useState, useEffect, useMemo, useRef } from 'react';
import './LiveTickerValue.css';

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Single character ticker column:
 * If numeric (0-9), renders a vertical rolling strip of 0-9 that slides to the target number.
 * If non-numeric (e.g. ₹, ,, ., -), renders the static symbol.
 */
function TickerDigit({ char, index, totalDigits, isRevealed }) {
  const isDigit = /^[0-9]$/.test(char);
  const targetNum = isDigit ? parseInt(char, 10) : 0;
  const [displayNum, setDisplayNum] = useState(0);

  useEffect(() => {
    if (!isDigit) return undefined;

    if (!isRevealed) {
      setDisplayNum(0);
      return undefined;
    }

    // Two animation frames ensure a painted frame at 0 after leaving display:none
    // before enabling the CSS transform transition toward targetNum.
    let innerRaf = 0;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        setDisplayNum(targetNum);
      });
    });

    return () => {
      cancelAnimationFrame(outerRaf);
      cancelAnimationFrame(innerRaf);
    };
  }, [isDigit, targetNum, isRevealed]);

  if (!isDigit) {
    return (
      <span className="live-ticker-static" aria-hidden="true">
        {char}
      </span>
    );
  }

  // Stagger animation slightly from right-to-left for authentic stock ticker cascade
  const delay = isRevealed ? Math.max(0, (totalDigits - 1 - index) * 35) : 0;

  return (
    <span className="live-ticker-digit-slot" aria-hidden="true">
      <span
        className={isRevealed ? 'live-ticker-strip' : 'live-ticker-strip live-ticker-strip--resetting'}
        style={{
          transform: `translateY(-${displayNum * 10}%)`,
          transitionDelay: `${delay}ms`,
        }}
      >
        {DIGITS.map((d) => (
          <span key={d} className="live-ticker-digit">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * Stock-market style rolling number ticker
 * @param {string|number} value - The numerical or formatted value (e.g. "2,37,564", 237564, "90%")
 * @param {string} suffix - Optional suffix (e.g. "%")
 * @param {string} className - Extra CSS classes
 */
export default function LiveTickerValue({ value, suffix = '', className = '' }) {
  const containerRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const panel = el.closest('[role="tabpanel"]');
    const isHiddenByPanel = () => Boolean(
      panel && (
        panel.getAttribute('aria-hidden') === 'true' ||
        panel.classList.contains('vmm-dash-tab-panel--hidden')
      )
    );

    let observer = null;
    let pendingFrame = 0;

    const cleanupObserver = () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    };

    const startObserving = () => {
      cleanupObserver();
      if (isHiddenByPanel()) {
        setIsRevealed(false);
        return;
      }

      if (typeof IntersectionObserver === 'undefined') {
        pendingFrame = requestAnimationFrame(() => setIsRevealed(true));
        return;
      }

      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isHiddenByPanel()) {
            setIsRevealed(true);
            cleanupObserver();
          }
        },
        { threshold: 0.05 }
      );
      observer.observe(el);
    };

    startObserving();

    let mutationObserver = null;
    if (panel && typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver(() => {
        if (isHiddenByPanel()) {
          cancelAnimationFrame(pendingFrame);
          cleanupObserver();
          setIsRevealed(false);
        } else {
          startObserving();
        }
      });
      mutationObserver.observe(panel, {
        attributes: true,
        attributeFilter: ['class', 'aria-hidden'],
      });
    }

    return () => {
      cancelAnimationFrame(pendingFrame);
      cleanupObserver();
      if (mutationObserver) mutationObserver.disconnect();
    };
  }, []);

  const strValue = useMemo(() => {
    if (value === undefined || value === null || value === '') {
      return `0${suffix}`;
    }

    const str = String(value).trim();
    let detectedSuffix = suffix;
    let cleanStr = str;

    if (!detectedSuffix && cleanStr.endsWith('%')) {
      detectedSuffix = '%';
      cleanStr = cleanStr.slice(0, -1).trim();
    }

    const numOnly = cleanStr.replace(/,/g, '');
    const num = Number(numOnly);

    if (isNaN(num)) {
      return `${str}${suffix && !str.endsWith(suffix) ? suffix : ''}`;
    }

    const formatted = Number.isInteger(num)
      ? num.toLocaleString('en-IN')
      : cleanStr.includes(',')
        ? cleanStr
        : num.toLocaleString('en-IN');

    return `${formatted}${detectedSuffix}`;
  }, [value, suffix]);

  const chars = strValue.split('');
  const totalDigits = chars.filter((c) => /^[0-9]$/.test(c)).length;
  let digitIndex = 0;

  return (
    <span
      ref={containerRef}
      className={`live-ticker-container ${className}`.trim()}
      aria-label={strValue}
    >
      <span className="live-ticker-sr-only">{strValue}</span>
      {chars.map((char, idx) => {
        const isNum = /^[0-9]$/.test(char);
        const currentDigitIndex = isNum ? digitIndex++ : 0;
        // Key from right-to-left so existing digit positions remain mounted and animate smoothly
        const rightPos = chars.length - 1 - idx;
        const key = `${char === '₹' ? 'curr' : char === ',' ? 'sep' : 'pos'}-${rightPos}`;

        return (
          <TickerDigit
            key={key}
            char={char}
            index={currentDigitIndex}
            totalDigits={totalDigits}
            isRevealed={isRevealed}
          />
        );
      })}
    </span>
  );
}
