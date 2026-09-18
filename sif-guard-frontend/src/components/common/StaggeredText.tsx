import React, { useEffect, useState } from 'react';

interface StaggeredTextProps {
  lines: string[];
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'div';
  className?: string;
  style?: React.CSSProperties;
  lineStyles?: (index: number) => React.CSSProperties;
  delayMs?: number;
  staggerMs?: number;
}

/**
 * Editorial Staggered Text Reveal inspired by React Bits Pro.
 * Uses a slow, deliberate line-by-line reveal with blur clearance and vertical translation.
 * Runs strictly once on mount.
 */
export const StaggeredText: React.FC<StaggeredTextProps> = ({
  lines,
  as: Component = 'h1',
  className = '',
  style = {},
  lineStyles,
  delayMs = 150,
  staggerMs = 120,
}) => {
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const isReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPrefersReducedMotion(isReduced);

    const timer = setTimeout(() => {
      setMounted(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs]);

  return (
    <Component className={className} style={{ ...style, overflow: 'hidden' }}>
      {lines.map((line, idx) => {
        const isRevealed = mounted || prefersReducedMotion;
        const lineDelay = prefersReducedMotion ? 0 : idx * staggerMs;
        const customLineStyle = lineStyles ? lineStyles(idx) : {};

        return (
          <span
            key={idx}
            style={{
              display: 'block',
              opacity: isRevealed ? 1 : 0,
              transform: isRevealed
                ? 'translateY(0)'
                : 'translateY(36px)',
              filter: isRevealed ? 'blur(0px)' : 'blur(8px)',
              transition: prefersReducedMotion
                ? 'none'
                : `opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${lineDelay}ms, transform 0.95s cubic-bezier(0.16, 1, 0.3, 1) ${lineDelay}ms, filter 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${lineDelay}ms`,
              willChange: isRevealed ? 'auto' : 'transform, opacity, filter',
              ...customLineStyle,
            }}
          >
            {line}
          </span>
        );
      })}
    </Component>
  );
};
