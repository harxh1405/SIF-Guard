import React, { useState } from 'react';

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'danger' | 'warning' | 'info';
  dotOnly?: boolean;
  tooltip?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  children,
  variant = 'success',
  dotOnly = false,
  tooltip,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          bg: 'rgba(232, 93, 93, 0.10)',
          border: 'rgba(232, 93, 93, 0.25)',
          color: 'var(--danger, #E85D5D)',
          dot: 'var(--danger, #E85D5D)',
        };
      case 'warning':
        return {
          bg: 'rgba(245, 158, 11, 0.10)',
          border: 'rgba(245, 158, 11, 0.25)',
          color: '#F59E0B',
          dot: '#F59E0B',
        };
      case 'info':
        return {
          bg: 'rgba(59, 130, 246, 0.10)',
          border: 'rgba(59, 130, 246, 0.25)',
          color: '#3B82F6',
          dot: '#3B82F6',
        };
      case 'success':
      default:
        return {
          bg: 'rgba(16, 185, 129, 0.10)',
          border: 'rgba(16, 185, 129, 0.25)',
          color: 'var(--success, #10B981)',
          dot: 'var(--success, #10B981)',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: dotOnly ? '4px 10px' : '5px 12px',
          borderRadius: '20px',
          background: styles.bg,
          border: `1px solid ${styles.border}`,
          color: styles.color,
          fontSize: '0.78rem',
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          cursor: tooltip ? 'pointer' : 'default',
          transition: 'all 0.15s ease',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: styles.dot,
            boxShadow: `0 0 8px ${styles.dot}`,
            flexShrink: 0,
          }}
        />
        <span>{children}</span>
      </div>

      {tooltip && showTooltip && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--surface-elevated, #1a1d24)',
            color: 'var(--text-primary, #ffffff)',
            border: '1px solid var(--border, #2a2e39)',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '0.72rem',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
};
