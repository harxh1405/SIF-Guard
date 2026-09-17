import React from 'react';
import type { FacilityRiskSummary } from '../../types/facility';
import { ShieldAlert, ShieldCheck, Flame, Activity, AlertTriangle } from 'lucide-react';

interface FacilityMetricsHUDProps {
  summary: FacilityRiskSummary;
  activeZoneCount: number;
}

export const FacilityMetricsHUD: React.FC<FacilityMetricsHUDProps> = ({ summary }) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return '#FF3B30';
      case 'HIGH':
        return '#FF9500';
      case 'MODERATE':
        return '#FFCC00';
      case 'LOW':
      default:
        return '#20D997';
    }
  };

  const riskColor = getRiskColor(summary.risk_level);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
            Elevated Zones
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {summary.high_risk_zones_count}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>of {summary.zones.length} zones</span>
          </div>
        </div>
      </div>

      {/* SIF Potential Incidents */}
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
