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
      period: 'vs prev 30d',
      state: 'mint',
      icon: <FileText size={18} color="#4DCEA0" />,
    },
    {
      id: 'sif',
      label: 'SIF POTENTIAL',
      value: summary?.sif_precursor_count ? summary.sif_precursor_count.toString() : '38',
      change: '+15%',
      period: 'high risk density',
      state: 'red',
      icon: <AlertTriangle size={18} color="#E54F4F" />,
    },
    {
      id: 'barriers',
      label: 'FAILED BARRIERS',
      value: summary?.top_barrier_failures ? summary.top_barrier_failures.length.toString() : '17',
      change: '+8%',
      period: 'control failures',
      state: 'amber',
      icon: <ShieldOff size={18} color="#F2A933" />,
    },
    {
      id: 'patterns',
      label: 'EMERGING PATTERNS',
      value: summary?.emerging_patterns ? summary.emerging_patterns.length.toString() : '6',
      change: 'HDBSCAN',
      period: 'discovered clusters',
      state: 'amber',
      icon: <GitBranch size={18} color="#F2A933" />,
    },
    {
      id: 'locations',
      label: 'ACTIVE SITES',
      value: summary?.sites ? summary.sites.toString() : '8',
      change: 'OIL Facilities',
      period: 'operational hubs',
      state: 'mint',
      icon: <MapPin size={18} color="#4DCEA0" />,
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '14px',
        marginBottom: '20px',
      }}
    >
      {kpis.map((kpi) => (
        <div
          key={kpi.id}
          onClick={() => onKpiClick && onKpiClick(kpi.id as any)}
          style={{
            backgroundColor: 'var(--bg-card, #0D171A)',
            border: '1px solid var(--border, #203238)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: onKpiClick ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            if (onKpiClick) {
              e.currentTarget.style.borderColor = 'var(--amber, #F2A933)';
              e.currentTarget.style.backgroundColor = 'var(--bg-slate, #112429)';
            }
          }}
          onMouseLeave={(e) => {
            if (onKpiClick) {
              e.currentTarget.style.borderColor = 'var(--border, #203238)';
              e.currentTarget.style.backgroundColor = 'var(--bg-card, #0D171A)';
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: 'var(--text-secondary, #9CA8AA)',
              }}
            >
              {kpi.label}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {kpi.icon}
              <ArrowUpRight size={14} color="#647477" />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span
              style={{
                fontFamily: 'var(--font-sans, sans-serif)',
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--text-primary, #F4F3EE)',
                lineHeight: 1,
              }}
            >
              {kpi.value}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: kpi.state === 'red' ? '#E54F4F' : kpi.state === 'amber' ? '#F2A933' : '#4DCEA0',
              }}
            >
              {kpi.change}
            </span>
          </div>

          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted, #647477)',
              marginTop: '6px',
            }}
          >
            {kpi.period}
          </span>
        </div>
      ))}
    </div>
  );
};
