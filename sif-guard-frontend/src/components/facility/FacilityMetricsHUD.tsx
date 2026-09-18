import React from 'react';
import type { FacilityRiskSummary } from '../../types/facility';
import { ShieldAlert, ShieldCheck, Flame, Activity, AlertTriangle } from 'lucide-react';
import { getRiskColor } from '../../utils/riskUtils';
import { RiskLegend } from './RiskLegend';

interface FacilityMetricsHUDProps {
  summary: FacilityRiskSummary;
  activeZoneCount?: number;
  variant?: 'cards' | 'floating-ribbon';
  theme?: 'dark' | 'light';
}

export const FacilityMetricsHUD: React.FC<FacilityMetricsHUDProps> = ({
  summary,
  variant = 'cards',
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const riskColor = getRiskColor(summary.risk_level);

  // Highest risk zone for summary callout
  const hotspotZone = summary.zones && summary.zones.length > 0
    ? [...summary.zones].sort((a, b) => b.risk_score - a.risk_score)[0]
    : null;

  // Total compromised barriers
  const degradedBarriersCount = summary.zones
    ? summary.zones.filter((z) => z.dominant_barrier_failure).length
    : 0;

  if (variant === 'floating-ribbon') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          padding: '6px 14px',
          borderRadius: '12px',
          backgroundColor: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(10, 18, 30, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${isLight ? 'rgba(203, 213, 225, 0.8)' : 'rgba(255, 255, 255, 0.12)'}`,
          boxShadow: isLight
            ? '0 4px 16px rgba(0, 51, 102, 0.08)'
            : '0 8px 24px rgba(0, 0, 0, 0.45)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Overall Risk Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '4px 10px',
            borderRadius: '8px',
            backgroundColor: `${riskColor}18`,
            border: `1px solid ${riskColor}44`,
          }}
        >
          {summary.overall_risk_score >= 60 ? (
            <Flame size={14} color={riskColor} />
          ) : (
            <ShieldCheck size={14} color={riskColor} />
          )}
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Facility Risk:</span>
          <span style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: riskColor }}>
            {summary.overall_risk_score}
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: '3px',
              backgroundColor: `${riskColor}28`,
              color: riskColor,
              letterSpacing: '0.04em',
            }}
          >
            {summary.risk_level}
          </span>
        </div>

        <div style={{ width: '1px', height: '18px', backgroundColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }} />

        {/* Active Precursor Flares */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: summary.critical_incidents > 0 ? '#FF3B30' : '#FF9500',
              boxShadow: summary.critical_incidents > 0 ? '0 0 8px #FF3B30' : 'none',
              display: 'inline-block',
            }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>Active Flares:</span>
          <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {summary.active_incidents}
          </span>
          {summary.critical_incidents > 0 && (
            <span style={{ color: '#FF3B30', fontSize: '10px', fontWeight: 700 }}>
              ({summary.critical_incidents} crit)
            </span>
          )}
        </div>

        <div style={{ width: '1px', height: '18px', backgroundColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }} />

        {/* Degraded Barriers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
          <ShieldAlert size={13} color="#FF9500" />
          <span style={{ color: 'var(--text-secondary)' }}>Degraded Barriers:</span>
          <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#FF9500' }}>
            {degradedBarriersCount}
          </span>
        </div>

        {/* Hotspot Sector */}
        {hotspotZone && (
          <>
            <div style={{ width: '1px', height: '18px', backgroundColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Hotspot:</span>
              <span style={{ fontWeight: 700, color: 'var(--primary, #FF7300)' }}>
                {hotspotZone.code}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                ({hotspotZone.name})
              </span>
            </div>
          </>
        )}

        <div style={{ width: '1px', height: '18px', backgroundColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }} />

        {/* Active Monitored Records */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <Activity size={12} />
          <span>{summary.total_incidents} telemetry events</span>
        </div>

        {/* Right-aligned Spectrum Legend Popover */}
        <div style={{ marginLeft: 'auto' }}>
          <RiskLegend variant="compact-dock" theme={theme} />
        </div>
      </div>
    );
  }

  // Original cards layout
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
        marginBottom: '20px',
      }}
    >
      {/* Overall Facility Risk Score */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          borderLeft: `4px solid ${riskColor}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: `${riskColor}18`,
            border: `1px solid ${riskColor}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: riskColor,
            flexShrink: 0,
          }}
        >
          {summary.overall_risk_score >= 60 ? (
            <Flame size={24} />
          ) : (
            <ShieldCheck size={24} />
          )}
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
            Overall Facility Risk
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {summary.overall_risk_score}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ 100</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: `${riskColor}22`,
                color: riskColor,
                border: `1px solid ${riskColor}44`,
                marginLeft: '4px',
              }}
            >
              {summary.risk_level}
            </span>
          </div>
        </div>
      </div>

      {/* High-Risk Zones */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          borderLeft: '4px solid #FF9500',
        }}
      >
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: '#FF950018',
            border: '1px solid #FF950040',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FF9500',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={24} />
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
            Elevated Sectors
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {summary.high_risk_zones_count}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>of {summary.zones?.length || 0} zones</span>
          </div>
        </div>
      </div>

      {/* Critical Precursors */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          borderLeft: '4px solid #FF3B30',
        }}
      >
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: '#FF3B3018',
            border: '1px solid #FF3B3040',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FF3B30',
            flexShrink: 0,
          }}
        >
          <ShieldAlert size={24} />
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
            Critical SIF Precursors
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {summary.critical_incidents}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>high-risk events</span>
          </div>
        </div>
      </div>

      {/* Total Active Observations */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          borderLeft: '4px solid var(--primary)',
        }}
      >
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'rgba(255, 106, 0, 0.12)',
            border: '1px solid rgba(255, 106, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            flexShrink: 0,
          }}
        >
          <Activity size={24} />
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
            Active Observations
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {summary.total_incidents}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>mapped records</span>
          </div>
        </div>
      </div>
    </div>
  );
};
