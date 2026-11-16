import { useState, useEffect, useCallback } from 'react';

/**
 * Custom Hook: useIsInViewport
 * Triggers hasBeenVisible strictly when the element enters the visible screen viewport,
 * and limits initial chart animations (shouldAnimate) to play only once on first reveal.
 */
export function useIsInViewport(options = { rootMargin: '0px', threshold: 0.15 }, animationDurationMs = 950) {
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const [hasAnimatedOnce, setHasAnimatedOnce] = useState(false);
  const [node, setNode] = useState(null);

  const ref = useCallback((element) => {
    if (element !== null) {
      setNode(element);
    }
  }, []);

  useEffect(() => {
    if (!node || hasBeenVisible) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setHasBeenVisible(true);
        observer.disconnect();
      }
    }, options);

    observer.observe(node);

    return () => observer.disconnect();
  }, [node, hasBeenVisible]);

  useEffect(() => {
    if (!hasBeenVisible || hasAnimatedOnce) return;
    const timer = setTimeout(() => setHasAnimatedOnce(true), animationDurationMs);
    return () => clearTimeout(timer);
  }, [hasBeenVisible, hasAnimatedOnce, animationDurationMs]);

  const shouldAnimate = hasBeenVisible && !hasAnimatedOnce;
  return [ref, hasBeenVisible, shouldAnimate];
}
