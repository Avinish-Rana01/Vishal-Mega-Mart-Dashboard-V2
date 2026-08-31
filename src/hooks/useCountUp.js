import { useState, useEffect } from 'react';
import { useIsInViewport } from './useIsInViewport';

/**
 * useCountUp
 * Animates a number from 0 to its target value over a fixed duration when it scrolls into view.
 * 
 * @param {string|number} endValue - The target value (e.g. "1,29,759", "92%", or 1234)
 * @param {number} duration - Animation duration in ms
 */
export function useCountUp(endValue, duration = 2000) {
  const [containerRef, hasBeenVisible] = useIsInViewport({ threshold: 0.1 });
  const [currentValue, setCurrentValue] = useState('0');

  useEffect(() => {
    // Wait until the element is actually on screen before counting
    if (!hasBeenVisible || endValue === undefined || endValue === null) {
      return;
    }

    const parseValue = (val) => {
      if (typeof val === 'number') {
        return { num: val, prefix: '', suffix: '', isFloat: !Number.isInteger(val), hasCommas: false };
      }
      
      const strVal = String(val);
      const numMatch = strVal.match(/[\d,.]+/);
      
      // If there are no numbers at all, just return it as a string
      if (!numMatch) {
        return { num: NaN, prefix: strVal, suffix: '', isFloat: false, hasCommas: false };
      }
      
      const numStr = numMatch[0];
      const prefix = strVal.substring(0, strVal.indexOf(numStr));
      const suffix = strVal.substring(strVal.indexOf(numStr) + numStr.length);
      const hasCommas = numStr.includes(',');
      const cleanNumStr = numStr.replace(/,/g, '');
      const isFloat = cleanNumStr.includes('.');
      const num = isFloat ? parseFloat(cleanNumStr) : parseInt(cleanNumStr, 10);
      
      return { num, prefix, suffix, isFloat, hasCommas };
    };

    const { num: targetNum, prefix, suffix, isFloat, hasCommas } = parseValue(endValue);
    
    // If it's pure text or invalid number, just set it immediately
    if (isNaN(targetNum)) {
      setCurrentValue(String(endValue));
      return;
    }

    let startTime = null;
    let animationFrameId = null;

    // Ease out exponential for a fast start and smooth deceleration
    const easeOutExpo = (t) => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutExpo(progress);
      
      const currentNum = targetNum * easedProgress;
      
      let formattedNum;
      if (isFloat) {
        // Keep 1 decimal place if it's a float
        formattedNum = currentNum.toFixed(1);
      } else {
        formattedNum = Math.floor(currentNum).toString();
      }
      
      if (hasCommas) {
        // En-IN handles the Indian numbering system correctly e.g. 1,29,759
        formattedNum = new Intl.NumberFormat('en-IN').format(parseFloat(formattedNum));
      }
      
      setCurrentValue(`${prefix}${formattedNum}${suffix}`);
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        // Make absolutely sure it ends exactly on the target value string
        setCurrentValue(String(endValue));
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [endValue, hasBeenVisible, duration]);

  // Before being visible, show '0' with the same format if possible
  const getInitialValue = () => {
    if (hasBeenVisible) return currentValue;
    
    if (endValue === undefined || endValue === null) return '0';
    const strVal = String(endValue);
    const numMatch = strVal.match(/[\d,.]+/);
    if (!numMatch) return strVal;
    
    const numStr = numMatch[0];
    const prefix = strVal.substring(0, strVal.indexOf(numStr));
    const suffix = strVal.substring(strVal.indexOf(numStr) + numStr.length);
    return `${prefix}0${suffix}`;
  };

  return { ref: containerRef, animatedValue: getInitialValue() };
}
