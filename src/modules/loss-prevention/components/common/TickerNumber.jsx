import React, { useState, useEffect, useRef } from 'react';

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Single character ticker column:
 * If numeric (0-9), renders a vertical rolling strip of 0-9 that slides to the target number.
 * If non-numeric (e.g. ₹, ,, .), renders the static symbol.
 */
function TickerDigit({ char, index, totalDigits }) {
  const isDigit = /^[0-9]$/.test(char);
  const targetNum = isDigit ? parseInt(char, 10) : 0;
  const [displayNum, setDisplayNum] = useState(0);

  useEffect(() => {
    if (!isDigit) return;
    const raf = requestAnimationFrame(() => {
      setDisplayNum(targetNum);
    });
    return () => cancelAnimationFrame(raf);
  }, [isDigit, targetNum]);

  if (!isDigit) {
    return (
      <span className="inline-block select-none" aria-hidden="true">
        {char}
      </span>
    );
  }

  // Stagger animation slightly from right-to-left for authentic stock ticker cascade
  const delay = Math.max(0, (totalDigits - 1 - index) * 35);

  return (
    <span
      className="inline-block relative overflow-hidden h-[1.16em] leading-[1.16em] align-top select-none"
      style={{ verticalAlign: 'baseline' }}
      aria-hidden="true"
    >
      <span
        className="flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
        style={{
          transform: `translateY(-${displayNum * 10}%)`,
          transitionDelay: `${delay}ms`,
        }}
      >
        {DIGITS.map((d) => (
          <span
            key={d}
            className="h-[1.16em] leading-[1.16em] flex items-center justify-center text-center font-bold"
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * Stock-market style rolling number ticker
 * @param {string|number} value The number or currency string to display (e.g., 2, '₹1,398')
 * @param {string} className Extra CSS classes
 */
export default function TickerNumber({ value, className = '' }) {
  const strValue = String(value ?? '0');
  const chars = strValue.split('');
  const totalDigits = chars.filter((c) => /^[0-9]$/.test(c)).length;
  let digitIndex = 0;

  return (
    <span
      className={`inline-flex items-baseline font-bold tracking-tight ${className}`}
      aria-label={strValue}
    >
      <span className="sr-only">{strValue}</span>
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
          />
        );
      })}
    </span>
  );
}

