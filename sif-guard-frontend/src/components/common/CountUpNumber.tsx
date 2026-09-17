import React, { useEffect, useRef, useState } from 'react';

interface CountUpNumberProps {
  value?: number;
  end?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Fast, deliberate spring/eased counter inspired by React Bits Pro.
 * Triggers once upon entering the viewport with easeOutExpo.
 */
export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  value,
  end,
  decimals = 0,
  prefix = '',
  suffix = '',
  durationMs = 850,
  className = '',
  style = {},
}) => {
  const targetValue = end !== undefined ? end : (value !== undefined ? value : 0);
  const [displayValue, setDisplayValue] = useState<number>(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayValue(targetValue);
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          observer.disconnect();

          const startTime = performance.now();
          const startVal = 0;
          const endVal = targetValue;

          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            // easeOutExpo
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = startVal + (endVal - startVal) * easeProgress;

            setDisplayValue(current);

            if (progress < 1) {
              requestAnimationFrame(tick);
            } else {
              setDisplayValue(endVal);
            }
          };

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [targetValue, durationMs, hasAnimated]);

  return (
    <span ref={containerRef} className={className} style={style}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
};
