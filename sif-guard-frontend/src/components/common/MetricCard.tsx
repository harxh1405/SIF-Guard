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
          color: 'var(--accent-sif-red)',
          bg: 'var(--accent-sif-bg)',
          border: 'rgba(248, 113, 113, 0.3)',
          glow: 'rgba(248, 113, 113, 0.15)',
          topBorder: 'var(--accent-sif-red)',
        };
      case 'green':
        return {
          color: 'var(--accent-nonsif-green)',
          bg: 'var(--accent-nonsif-bg)',
          border: 'rgba(52, 211, 153, 0.3)',
          glow: 'rgba(52, 211, 153, 0.15)',
          topBorder: 'var(--accent-nonsif-green)',
        };
      case 'amber':
        return {
          color: 'var(--accent-uncertain-amber)',
          bg: 'var(--accent-uncertain-bg)',
          border: 'rgba(251, 191, 36, 0.3)',
          glow: 'rgba(251, 191, 36, 0.15)',
          topBorder: 'var(--accent-uncertain-amber)',
        };
      default:
        return {
          color: 'var(--accent-cyan)',
          bg: 'var(--accent-primary-bg)',
          border: 'rgba(56, 189, 248, 0.3)',
          glow: 'rgba(56, 189, 248, 0.15)',
          topBorder: 'var(--accent-cyan)',
        };
    }
  };

  const trendStyle = getTrendColorStyle();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card"
      style={{
        padding: '22px',
        position: 'relative',
        overflow: 'hidden',
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
          opacity: 0.7,
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
              fontSize: '2.4rem',
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
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'var(--accent-primary-bg)',
            border: '1px solid var(--border-hover)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-cyan)',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
          }}
        >
          <Icon size={22} />
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
            fontWeight: 700,
            color: trendStyle.color,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {trend}
        </div>
      )}
    </motion.div>
  );
};
