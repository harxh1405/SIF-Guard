import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendColor?: 'red' | 'green' | 'amber' | 'blue';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendColor = 'blue',
}) => {
  const getTrendColorStyle = () => {
    switch (trendColor) {
      case 'red':
        return {
          color: 'var(--danger)',
          bg: 'rgba(232, 93, 93, 0.12)',
          border: 'rgba(232, 93, 93, 0.25)',
          topBorder: 'var(--danger)',
        };
      case 'green':
        return {
          color: 'var(--success)',
          bg: 'rgba(32, 217, 151, 0.12)',
          border: 'rgba(32, 217, 151, 0.25)',
          topBorder: 'var(--success)',
        };
      case 'amber':
        return {
          color: 'var(--warning)',
          bg: 'rgba(255, 179, 71, 0.12)',
          border: 'rgba(255, 179, 71, 0.25)',
          topBorder: 'var(--warning)',
        };
      default:
        return {
          color: 'var(--primary-bright)',
          bg: 'rgba(255, 106, 0, 0.12)',
          border: 'rgba(255, 106, 0, 0.25)',
          topBorder: 'var(--primary)',
        };
    }
  };

  const trendStyle = getTrendColorStyle();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="card"
      style={{
        padding: '22px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Subtle top indicator bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '20px',
          right: '20px',
          height: '2px',
          background: `linear-gradient(90deg, transparent 0%, ${trendStyle.topBorder} 50%, transparent 100%)`,
          opacity: 0.6,
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span className="micro-label">
            {title}
          </span>
          <div
            className="numeric-display"
            style={{
              fontSize: '2rem',
              fontWeight: 600,
              margin: '8px 0 4px 0',
              color: 'var(--text-primary)',
            }}
          >
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {subtitle}
            </div>
          )}
        </div>

        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
          }}
        >
          <Icon size={20} />
        </div>
      </div>

      {trend && (
        <div
          style={{
            marginTop: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 8px',
            borderRadius: '6px',
            background: trendStyle.bg,
            border: `1px solid ${trendStyle.border}`,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: trendStyle.color,
            fontFamily: 'var(--font-mono)',
            fontVariantNumeric: 'tabular-nums',
            width: 'fit-content',
          }}
        >
          {trend}
        </div>
      )}
    </motion.div>
  );
};
