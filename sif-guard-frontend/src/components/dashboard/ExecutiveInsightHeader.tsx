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
          badgeBg: 'rgba(229, 79, 79, 0.15)',
          badgeColor: '#E54F4F',
          badgeBorder: 'rgba(229, 79, 79, 0.35)',
          glow: '0 0 24px rgba(229, 79, 79, 0.18)',
          icon: <ShieldAlert size={20} color="#E54F4F" />,
        };
      case 'warning':
        return {
          badgeBg: 'rgba(242, 169, 51, 0.15)',
          badgeColor: '#F2A933',
          badgeBorder: 'rgba(242, 169, 51, 0.35)',
          glow: '0 0 24px rgba(242, 169, 51, 0.18)',
          icon: <AlertTriangle size={20} color="#F2A933" />,
        };
      default:
        return {
          badgeBg: 'rgba(77, 206, 160, 0.15)',
          badgeColor: '#4DCEA0',
          badgeBorder: 'rgba(77, 206, 160, 0.35)',
          glow: '0 0 24px rgba(77, 206, 160, 0.18)',
          icon: <TrendingUp size={20} color="#4DCEA0" />,
        };
    };
  };

  const style = getSeverityStyle(primaryInsight.severity);

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card, #0D171A)',
        border: '1px solid var(--border, #203238)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '24px 28px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `${style.glow}, 0 8px 32px rgba(0,0,0,0.4)`,
        marginBottom: '24px',
      }}
    >
      {/* Background Accent Bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '4px',
          backgroundColor: style.badgeColor,
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {style.icon}
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: style.badgeColor,
                backgroundColor: style.badgeBg,
                border: `1px solid ${style.badgeBorder}`,
                padding: '4px 10px',
                borderRadius: '4px',
              }}
            >
              SAFETY SIGNAL BRIEFING · {primaryInsight.type}
            </span>
          </div>

          {primaryInsight.change !== undefined && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: primaryInsight.change >= 0 ? '#E54F4F' : '#4DCEA0',
              }}
            >
              <TrendingUp size={14} style={{ transform: primaryInsight.change < 0 ? 'rotate(180deg)' : 'none' }} />
              <span>
                {primaryInsight.change >= 0 ? `+${primaryInsight.change}%` : `${primaryInsight.change}%`}{' '}
                vs previous period
              </span>
            </div>
          )}
        </div>

        {/* Title & Statement */}
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-serif, Fraunces, serif)',
              fontSize: '1.45rem',
              fontWeight: 600,
              color: 'var(--text-primary, #F4F3EE)',
              margin: '0 0 8px 0',
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
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
                gap: '16px',
                marginTop: '12px',
                fontSize: '0.82rem',
                color: 'var(--text-secondary, #9CA8AA)',
              }}
            >
              {primaryInsight.evidence.map((ev, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: style.badgeColor }} />
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
              onClick={() => onExploreClick(primaryInsight)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: 'rgba(32, 50, 56, 0.6)',
                border: '1px solid var(--border, #203238)',
                borderRadius: '6px',
                color: 'var(--text-primary, #F4F3EE)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = style.badgeColor;
                e.currentTarget.style.backgroundColor = style.badgeBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border, #203238)';
                e.currentTarget.style.backgroundColor = 'rgba(32, 50, 56, 0.6)';
              }}
            >
              <Filter size={14} />
              <span>Explore Underlying Reports</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
