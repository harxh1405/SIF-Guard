import React from 'react';
import type { LucideIcon } from 'lucide-react';

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
  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '6px 0', color: 'var(--text-primary)' }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {subtitle}
            </div>
          )}
        </div>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          background: 'rgba(0, 141, 218, 0.12)',
          border: '1px solid rgba(0, 141, 218, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-cyan)'
        }}>
          <Icon size={22} />
        </div>
      </div>
      {trend && (
        <div style={{ marginTop: '12px', fontSize: '0.75rem', fontWeight: 600, color: trendColor === 'red' ? 'var(--accent-sif-red)' : trendColor === 'green' ? 'var(--accent-nonsif-green)' : 'var(--accent-cyan)' }}>
          {trend}
        </div>
      )}
    </div>
  );
};
