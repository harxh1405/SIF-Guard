import React from 'react';
import { FileText, AlertTriangle, ShieldOff, GitBranch, MapPin, ArrowUpRight } from 'lucide-react';
import type { DashboardSummary } from '../../types/api';

interface KpiStripProps {
  summary?: DashboardSummary | null;
  onKpiClick?: (type: 'reports' | 'sif' | 'barriers' | 'patterns' | 'locations') => void;
}

export const KpiStrip: React.FC<KpiStripProps> = ({ summary, onKpiClick }) => {
  const kpis = [
    {
      id: 'reports',
      label: 'REPORTS ANALYZED',
      value: summary?.total_reports ? summary.total_reports.toLocaleString() : '1,284',
      change: '+12%',
      period: 'vs prev 30d baseline',
      topColor: '#003366',
      badgeBg: '#f0fdf4',
      badgeColor: '#15803d',
      icon: <FileText size={17} color="#003366" />,
    },
    {
      id: 'sif',
      label: 'CRITICAL SIF POTENTIAL',
      value: summary?.sif_precursor_count ? summary.sif_precursor_count.toString() : '38',
      change: '+15%',
      period: 'high risk precursor density',
      topColor: '#dc2626',
      badgeBg: '#fef2f2',
      badgeColor: '#dc2626',
      icon: <AlertTriangle size={17} color="#dc2626" />,
    },
    {
      id: 'barriers',
      label: 'FAILED DEFENSE BARRIERS',
      value: summary?.top_barrier_failures ? summary.top_barrier_failures.length.toString() : '17',
      change: '+8%',
      period: 'active control bypasses',
      topColor: '#ff9933',
      badgeBg: '#fef3c7',
      badgeColor: '#b45309',
      icon: <ShieldOff size={17} color="#ff9933" />,
    },
    {
      id: 'patterns',
      label: 'EMERGING CLUSTERS',
      value: summary?.emerging_patterns ? summary.emerging_patterns.length.toString() : '6',
      change: 'HDBSCAN',
      period: 'uncovered hazard precursors',
      topColor: '#003366',
      badgeBg: '#e6f0fa',
      badgeColor: '#003366',
      icon: <GitBranch size={17} color="#003366" />,
    },
    {
      id: 'locations',
      label: 'MONITORED OIL SITES',
      value: summary?.sites ? summary.sites.toString() : '8',
      change: 'Category-I',
      period: 'Assam & Rajasthan assets',
      topColor: '#16a34a',
      badgeBg: '#f0fdf4',
      badgeColor: '#15803d',
      icon: <MapPin size={17} color="#16a34a" />,
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '20px',
      }}
    >
      {kpis.map((kpi) => (
        <div
          key={kpi.id}
          onClick={() => onKpiClick && onKpiClick(kpi.id as any)}
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderTop: `3.5px solid ${kpi.topColor}`,
            borderRadius: 'var(--radius-md)',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: onKpiClick ? 'pointer' : 'default',
            transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
            position: 'relative',
            boxShadow: 'var(--shadow-card)',
          }}
          onMouseEnter={(e) => {
            if (onKpiClick) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 51, 102, 0.10)';
              e.currentTarget.style.borderColor = '#94a3b8';
            }
          }}
          onMouseLeave={(e) => {
            if (onKpiClick) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-card)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.67rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                color: 'var(--text-secondary)',
              }}
            >
              {kpi.label}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {kpi.icon}
              <ArrowUpRight size={13} color="#94a3b8" />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0 2px 0' }}>
            <span
              style={{
                fontFamily: 'var(--font-sans, sans-serif)',
                fontSize: '1.85rem',
                fontWeight: 800,
                color: 'var(--primary)',
                lineHeight: 1.1,
              }}
            >
              {kpi.value}
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: kpi.badgeColor,
                backgroundColor: kpi.badgeBg,
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              {kpi.change}
            </span>
          </div>

          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginTop: '4px',
            }}
          >
            {kpi.period}
          </span>
        </div>
      ))}
    </div>
  );
};
