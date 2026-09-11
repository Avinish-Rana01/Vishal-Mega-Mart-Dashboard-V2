import React, { useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LiveTickerValue.css';

/**
 * LiveTickerValue
 * 
 * YouTube Live Sub Count style rolling ticker animation for KPI values.
 * - Digits roll vertically: slides UP when increasing, slides DOWN when decreasing.
 * - Horizontal layout animation: commas, decimal points, and new digit columns glide smoothly.
 * - Initial mount: displays immediately without animation.
 * - Real-time updates: only the modified digits roll into view.
 * 
 * @param {string|number} value - The numerical or formatted value (e.g. "2,37,564", 237564, "90%")
 * @param {string} suffix - Optional suffix (e.g. "%")
 * @param {string} className - Optional container className
 */
export default function LiveTickerValue({ value, suffix = '', className = '', duration = 0.9 }) {
  const isFirstRender = useRef(true);
  const prevNumRef = useRef(null);

  // Parse raw number, formatted representation, and suffix
  const { rawNum, formattedString, finalSuffix } = useMemo(() => {
    if (value === undefined || value === null || value === '') {
      return { rawNum: 0, formattedString: '0', finalSuffix: suffix };
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
      return { rawNum: 0, formattedString: str, finalSuffix: detectedSuffix };
    }

    // Always enforce clean Indian number formatting
    const formatted = Number.isInteger(num)
      ? num.toLocaleString('en-IN')
      : cleanStr.includes(',')
        ? cleanStr
        : num.toLocaleString('en-IN');

    return { rawNum: num, formattedString: formatted, finalSuffix: detectedSuffix };
  }, [value, suffix]);

  // Determine direction: 'up' for increase, 'down' for decrease
  const direction = useMemo(() => {
    if (prevNumRef.current === null || isFirstRender.current) {
      return 'up';
    }
    return rawNum >= prevNumRef.current ? 'up' : 'down';
  }, [rawNum]);

  // Update previous number ref after calculating direction
  useEffect(() => {
    prevNumRef.current = rawNum;
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
  }, [rawNum]);

  // Break formatted string into structured items with stable right-to-left keys
  const characters = useMemo(() => {
    const chars = formattedString.split('');
    const len = chars.length;
    let digitCountFromRight = 0;
    let sepCountFromRight = 0;

    // Scan backwards to assign stable place values (ones, tens, hundreds...)
    const items = [];
    for (let i = len - 1; i >= 0; i--) {
      const char = chars[i];
      const isDigit = /^\d$/.test(char);

      if (isDigit) {
        items.unshift({
          char,
          isDigit: true,
          placeKey: `d_${digitCountFromRight}`
        });
        digitCountFromRight++;
      } else {
        items.unshift({
          char,
          isDigit: false,
          placeKey: `sep_${sepCountFromRight}_${char}`
        });
        sepCountFromRight++;
      }
    }

    return items;
  }, [formattedString]);

  // Smooth deceleration transition curve (YouTube Studio / odometer style)
  const rollTransition = useMemo(() => ({
    duration,
    ease: [0.16, 1, 0.3, 1]
  }), [duration]);

  return (
    <span className={`live-ticker-container ${className}`}>
      {characters.map((item) => {
        if (!item.isDigit) {
          return (
            <motion.span
              layout
              key={item.placeKey}
              transition={rollTransition}
              className="live-ticker-static"
            >
              {item.char}
            </motion.span>
          );
        }

        return (
          <motion.span
            layout
            key={item.placeKey}
            transition={rollTransition}
            className="live-ticker-digit-slot"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={`${item.placeKey}_${item.char}`}
                initial={
                  isFirstRender.current
                    ? false
                    : {
                        y: direction === 'up' ? '100%' : '-100%',
                        opacity: 0.2
                      }
                }
                animate={{
                  y: '0%',
                  opacity: 1
                }}
                exit={{
                  y: direction === 'up' ? '-100%' : '100%',
                  opacity: 0.2
                }}
                transition={rollTransition}
                className="live-ticker-digit"
              >
                {item.char}
              </motion.span>
            </AnimatePresence>
          </motion.span>
        );
      })}

      {finalSuffix && (
        <motion.span
          layout
          key="ticker_suffix"
          transition={rollTransition}
          className="live-ticker-static"
        >
          {finalSuffix}
        </motion.span>
      )}
    </span>
  );
}
