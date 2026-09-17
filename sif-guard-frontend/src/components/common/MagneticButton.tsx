import React, { useRef, useState, useCallback } from 'react';

interface MagneticButtonProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
  style?: React.CSSProperties;
  theme?: 'dark' | 'light';
}

/**
 * Subtle Magnetic Button inspired by React Bits Pro.
 * Pulls gently 2-4px towards cursor with independent icon shift and specular border highlight.
 * Free of exaggerated spring wobbles.
 */
export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  icon,
  onClick,
  variant = 'primary',
  className = '',
  style = {},
  theme = 'dark',
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const isLight = theme === 'light';

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Subtle 2-4px magnetic translation
    const maxPull = 3.5;
    const pullX = Math.max(-maxPull, Math.min(maxPull, (e.clientX - centerX) * 0.08));
    const pullY = Math.max(-maxPull, Math.min(maxPull, (e.clientY - centerY) * 0.08));

    setOffset({ x: pullX, y: pullY });
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setOffset({ x: 0, y: 0 });
  };

  const isPrimary = variant === 'primary';

  const baseStyles: React.CSSProperties = isPrimary
    ? {
        backgroundColor: isHovered ? '#FF8A2A' : '#FF7300',
        color: '#FFFFFF',
        border: '1px solid rgba(255, 138, 42, 0.45)',
        boxShadow: isHovered
          ? '0 6px 24px rgba(255, 115, 0, 0.35)'
          : '0 4px 16px rgba(255, 115, 0, 0.22)',
      }
    : {
        backgroundColor: isLight
          ? isHovered
            ? '#FFFFFF'
            : 'rgba(255, 255, 255, 0.92)'
          : isHovered
            ? 'rgba(23, 20, 17, 0.95)'
            : 'rgba(18, 16, 14, 0.85)',
        color: isLight ? '#1C1815' : '#F5F1EA',
        border: isHovered
          ? '1px solid rgba(255, 115, 0, 0.5)'
          : isLight
            ? '1px solid rgba(195, 182, 168, 0.75)'
            : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: isHovered
          ? isLight
            ? '0 6px 20px rgba(40, 30, 20, 0.08)'
            : '0 6px 24px rgba(0, 0, 0, 0.55)'
          : 'none',
      };

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '9px',
        padding: isPrimary ? '13px 28px' : '13px 26px',
        borderRadius: '10px',
        fontSize: '0.94rem',
        fontWeight: 600,
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: isHovered
          ? 'transform 0.12s cubic-bezier(0.2, 0, 0.2, 1), background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease'
          : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        willChange: 'transform',
        ...baseStyles,
        ...style,
      }}
    >
      <span>{children}</span>
      {icon && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            transform: `translate3d(${offset.x * 0.4}px, ${offset.y * 0.4}px, 0)`,
            transition: isHovered
              ? 'transform 0.12s cubic-bezier(0.2, 0, 0.2, 1)'
              : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {icon}
        </span>
      )}
    </button>
  );
};
