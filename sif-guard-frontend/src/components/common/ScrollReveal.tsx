import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  delayMs?: number;
  threshold?: number;
  className?: string;
  style?: React.CSSProperties;
  direction?: 'up' | 'down' | 'none';
  distance?: number;
}

/**
 * Unified Scroll Reveal Component inspired by React Bits Pro.
 * Reveals content deliberately upon entering the viewport with blur clearance and smooth translation.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  delayMs = 0,
  threshold = 0.12,
  className = '',
  style = {},
  direction = 'up',
  distance = 36,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [threshold]);

  const translateY = direction === 'up' ? distance : direction === 'down' ? -distance : 0;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : `translateY(${translateY}px)`,
        filter: isVisible ? 'blur(0px)' : 'blur(6px)',
        transition: `opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms, filter 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`,
        willChange: isVisible ? 'auto' : 'transform, opacity, filter',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
