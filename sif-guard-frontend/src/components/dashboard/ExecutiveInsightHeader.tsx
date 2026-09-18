import React from 'react';
import { ShieldAlert, TrendingUp, AlertTriangle, ChevronRight, Filter } from 'lucide-react';
import type { SafetyInsight } from '../../utils/insightFormatter';

interface ExecutiveInsightHeaderProps {
  insights: SafetyInsight[];
  onExploreClick?: (insight: SafetyInsight) => void;
}

export const ExecutiveInsightHeader: React.FC<ExecutiveInsightHeaderProps> = ({
  insights = [],
  onExploreClick,
}) => {
  const primaryInsight = insights[0] || {
    type: 'BARRIER',
    severity: 'critical',
    title: 'PRESSURE ISOLATION — PRIMARY CONTROL PRECURSOR',
    description: 'Pressure-isolation failures are appearing more frequently across maintenance activities, concentrated across 6 operational locations.',
    metric: 17,
    change: 38,
    evidence: [
      'Observed in 17 reports across 6 locations',
      'Concentrated around Maintenance and Hot Work activities',
      'Increased by 38% compared with previous observation period',
    ],
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          badgeBg: '#fef2f2',
          badgeColor: '#dc2626',
          badgeBorder: '#fecaca',
          topBorder: '#dc2626',
          icon: <ShieldAlert size={18} color="#dc2626" />,
        };
      case 'warning':
        return {
          badgeBg: '#fef3c7',
          badgeColor: '#b45309',
          badgeBorder: '#fde68a',
          topBorder: '#ff9933',
          icon: <AlertTriangle size={18} color="#b45309" />,
        };
      default:
        return {
          badgeBg: '#f0fdf4',
          badgeColor: '#15803d',
          badgeBorder: '#bbf7d0',
          topBorder: '#16a34a',
          icon: <TrendingUp size={18} color="#15803d" />,
        };
    }
  };

  const style = getSeverityStyle(primaryInsight.severity);

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderTop: `4px solid ${style.topBorder}`,
        borderRadius: 'var(--radius-md)',
        padding: '22px 26px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
        marginBottom: '20px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {style.icon}
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: style.badgeColor,
                backgroundColor: style.badgeBg,
                border: `1px solid ${style.badgeBorder}`,
                padding: '3px 9px',
                borderRadius: '4px',
              }}
            >
              HSE STATUTORY ADVISORY · {primaryInsight.type}
            </span>
          </div>

          {primaryInsight.change !== undefined && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: primaryInsight.change >= 0 ? '#dc2626' : '#16a34a',
                backgroundColor: primaryInsight.change >= 0 ? '#fef2f2' : '#f0fdf4',
                padding: '2px 8px',
                borderRadius: '4px',
                border: `1px solid ${primaryInsight.change >= 0 ? '#fecaca' : '#bbf7d0'}`,
              }}
            >
              <TrendingUp size={13} style={{ transform: primaryInsight.change < 0 ? 'rotate(180deg)' : 'none' }} />
              <span>
                {primaryInsight.change >= 0 ? `+${primaryInsight.change}%` : `${primaryInsight.change}%`}{' '}
                vs previous baseline
              </span>
            </div>
          )}
        </div>

        {/* Title & Statement */}
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.32rem',
              fontWeight: 700,
              color: 'var(--primary)',
              margin: '0 0 6px 0',
              lineHeight: 1.35,
              letterSpacing: '-0.015em',
            }}
          >
            "{primaryInsight.description}"
          </h2>

          {/* Key Evidence Points */}
          {primaryInsight.evidence && primaryInsight.evidence.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '14px',
                marginTop: '10px',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
              }}
            >
              {primaryInsight.evidence.map((ev, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'var(--surface-hover)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      backgroundColor: style.badgeColor,
                    }}
                  />
                  <span>{ev}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action button */}
        {onExploreClick && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={() => onExploreClick(primaryInsight)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 14px',
                backgroundColor: '#003366',
                border: '1px solid #002244',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#002244';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#003366';
              }}
            >
              <Filter size={13} color="#ff9933" />
              <span>Explore Underlying Precursor Reports</span>
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
