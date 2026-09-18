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
      change: '+12% BASELINE',
      period: 'OISD-156 Compliance Baseline',
      topColor: '#205493',
      badgeBg: '#ECFDF5',
      badgeColor: '#065F46',
      badgeBorder: '#6EE7B7',
      icon: <FileText size={16} color="#205493" />,
    },
    {
      id: 'sif',
      label: 'CRITICAL SIF PRECURSORS',
      value: summary?.sif_precursor_count ? summary.sif_precursor_count.toString() : '38',
      change: '+15% DENSITY',
      period: 'High Potential Risk Signals',
      topColor: '#DC2626',
      badgeBg: '#FEF2F2',
      badgeColor: '#991B1B',
      badgeBorder: '#FCA5A5',
      icon: <AlertTriangle size={16} color="#DC2626" />,
    },
    {
      id: 'barriers',
      label: 'FAILED DEFENSE BARRIERS',
      value: summary?.top_barrier_failures ? summary.top_barrier_failures.length.toString() : '17',
      change: '+8% BYPASSED',
      period: 'Active Barrier Controls Failure',
      topColor: '#D97706',
      badgeBg: '#FFFBEB',
      badgeColor: '#92400E',
      badgeBorder: '#FCD34D',
      icon: <ShieldOff size={16} color="#D97706" />,
    },
    {
      id: 'patterns',
      label: 'EMERGING CLUSTERS',
      value: summary?.emerging_patterns ? summary.emerging_patterns.length.toString() : '6',
      change: 'HDBSCAN',
      period: 'Systemic Precursor Patterns',
      topColor: '#205493',
      badgeBg: '#E6F0FA',
      badgeColor: '#1E3A8A',
      badgeBorder: '#93C5FD',
      icon: <GitBranch size={16} color="#205493" />,
    },
    {
      id: 'locations',
      label: 'MONITORED PSU SITES',
      value: summary?.sites ? summary.sites.toString() : '8',
      change: 'CATEGORY-I',
      period: 'Assam & Rajasthan Installations',
      topColor: '#059669',
      badgeBg: '#ECFDF5',
      badgeColor: '#065F46',
      badgeBorder: '#6EE7B7',
      icon: <MapPin size={16} color="#059669" />,
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
        width: '100%',
      }}
    >
      {kpis.map((kpi) => (
        <div
          key={kpi.id}
          onClick={() => onKpiClick && onKpiClick(kpi.id as any)}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #D1D5DB',
            borderTop: `3px solid ${kpi.topColor}`,
            borderRadius: '3px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: onKpiClick ? 'pointer' : 'default',
            transition: 'border-color 0.15s ease',
            position: 'relative',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            minHeight: '130px',
          }}
          onMouseEnter={(e) => {
            if (onKpiClick) {
              e.currentTarget.style.borderColor = '#205493';
            }
          }}
          onMouseLeave={(e) => {
            if (onKpiClick) {
              e.currentTarget.style.borderColor = '#D1D5DB';
              e.currentTarget.style.borderTopColor = kpi.topColor;
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: '#4B5563',
                textTransform: 'uppercase',
              }}
            >
              {kpi.label}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {kpi.icon}
              <ArrowUpRight size={13} color="#9CA3AF" />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', margin: '2px 0 2px 0' }}>
            <span
              style={{
                fontFamily: 'var(--font-sans, sans-serif)',
                fontSize: '2rem',
                fontWeight: 800,
                color: '#111827',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              {kpi.value}
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: kpi.badgeColor,
                backgroundColor: kpi.badgeBg,
                border: `1px solid ${kpi.badgeBorder}`,
                padding: '2px 6px',
                borderRadius: '2px',
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '0.02em',
              }}
            >
              {kpi.change}
            </span>
          </div>

          <span
            style={{
              fontSize: '0.72rem',
              color: '#6B7280',
              marginTop: '4px',
              fontWeight: 500,
            }}
          >
            {kpi.period}
          </span>
        </div>
      ))}
    </div>
  );
};
