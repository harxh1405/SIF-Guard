import React, { useRef, useState, useCallback } from 'react';

interface ParallaxCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  theme?: 'dark' | 'light';
  glowColor?: string;
}

/**
 * Subtle Hardware-Inspired Parallax Card.
 * Gently translates 2-4px with an internal specular gradient following cursor movement.
 */
export const ParallaxCard: React.FC<ParallaxCardProps> = ({
  children,
  className = '',
  style = {},
  onClick,
  theme = 'dark',
  glowColor,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [lightPos, setLightPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const isLight = theme === 'light';
  const effectiveGlow = glowColor || (isLight ? 'rgba(255, 115, 0, 0.08)' : 'rgba(255, 115, 0, 0.14)');

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Percent for specular highlight
    const pctX = (x / rect.width) * 100;
    const pctY = (y / rect.height) * 100;
    setLightPos({ x: pctX, y: pctY });

    // Subtle 2-4px translation
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const maxShift = 3;
    const shiftX = Math.max(-maxShift, Math.min(maxShift, (x - centerX) * 0.025));
    const shiftY = Math.max(-maxShift, Math.min(maxShift, (y - centerY) * 0.025));

    setOffset({ x: shiftX, y: shiftY });
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        position: 'relative',
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: isHovered
          ? 'transform 0.12s cubic-bezier(0.2, 0, 0.2, 1), border-color 0.25s ease, box-shadow 0.25s ease'
          : 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease, box-shadow 0.25s ease',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {/* Specular ambient highlight overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.35s ease',
          background: `radial-gradient(circle at ${lightPos.x}% ${lightPos.y}%, ${effectiveGlow} 0%, transparent 60%)`,
          zIndex: 1,
        }}
      />
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  );
};
