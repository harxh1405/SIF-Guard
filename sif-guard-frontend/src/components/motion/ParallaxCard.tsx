import React, { useRef, useCallback } from 'react';

interface ParallaxCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  maxTilt?: number;
  glowColor?: string;
  theme?: 'light' | 'dark';
}

/**
 * High-performance specular 3D tilt card with ZERO React re-renders during mouse tracking.
 * Manipulates transform and radial gradient directly on the DOM nodes for pure 120fps performance.
 */
export const ParallaxCard: React.FC<ParallaxCardProps> = ({
  children,
  className = '',
  style = {},
  onClick,
  maxTilt = 5,
  glowColor,
  theme = 'dark',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const isLight = theme === 'light';
  const defaultGlow = isLight
    ? 'rgba(255, 115, 0, 0.08)'
    : 'rgba(255, 115, 0, 0.14)';
  const activeGlowColor = glowColor || defaultGlow;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const normX = (x - centerX) / centerX;
      const normY = (y - centerY) / centerY;

      const rotY = normX * maxTilt;
      const rotX = -normY * maxTilt;

      card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
      card.style.transition = 'transform 0.08s ease-out';

      if (glowRef.current) {
        const glowX = ((x / rect.width) * 100).toFixed(1);
        const glowY = ((y / rect.height) * 100).toFixed(1);
        glowRef.current.style.background = `radial-gradient(circle 240px at ${glowX}% ${glowY}%, ${activeGlowColor}, transparent 75%)`;
      }
    },
    [maxTilt, activeGlowColor]
  );

  const handleMouseEnter = () => {
    if (glowRef.current) {
      glowRef.current.style.opacity = '1';
    }
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (card) {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      card.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    }
    if (glowRef.current) {
      glowRef.current.style.opacity = '0';
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transformStyle: 'preserve-3d',
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        willChange: 'transform',
        ...style,
      }}
      className={className}
    >
      {/* Specular Radial Spotlight Layer */}
      <div
        ref={glowRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          borderRadius: 'inherit',
          opacity: 0,
          zIndex: 1,
          transition: 'opacity 0.25s ease',
        }}
      />
      <div style={{ position: 'relative', zIndex: 2, height: '100%' }}>{children}</div>
    </div>
  );
};
