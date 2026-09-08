import React from 'react';
import type { FacilityZone } from '../../types/facility';
import { ChevronRight, TrendingUp, TrendingDown, Minus, ShieldAlert } from 'lucide-react';

interface ZoneStatusListProps {
  zones: FacilityZone[];
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
}

export const ZoneStatusList: React.FC<ZoneStatusListProps> = ({
  zones,
  selectedZoneId,
  onSelectZone,
}) => {
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

  const getTrendIcon = (trend: string, delta: number) => {
    if (trend === 'INCREASE') {
      return (
        <span style={{ color: '#FF3B30', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', fontWeight: 600 }}>
          <TrendingUp size={12} /> +{delta}%
        </span>
      );
    }
    if (trend === 'DECREASE') {
      return (
        <span style={{ color: '#20D997', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', fontWeight: 600 }}>
          <TrendingDown size={12} /> -{Math.abs(delta)}%
        </span>
      );
    }
    return (
      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px' }}>
        <Minus size={12} /> STABLE
      </span>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
          Zone Risk Matrix ({zones.length})
        </h3>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ranked by Severity</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {zones.map((zone) => {
          const isSelected = selectedZoneId === zone.id;
          const riskColor = getRiskColor(zone.risk_level);

          return (
            <div
              key={zone.id}
              onClick={() => onSelectZone(zone.id)}
              className="glass-card"
              style={{
                padding: '12px 14px',
                cursor: 'pointer',
                borderLeft: `4px solid ${riskColor}`,
                backgroundColor: isSelected ? 'var(--surface-elevated)' : 'var(--surface)',
                borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                transition: 'all 0.15s ease-in-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 700 }}>
                    {zone.code}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {zone.name}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: `${riskColor}18`,
                      color: riskColor,
                      border: `1px solid ${riskColor}33`,
                    }}
                  >
                    {zone.risk_level}
                  </span>

                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {zone.total_incidents} report{zone.total_incidents === 1 ? '' : 's'}
                  </span>

                  {zone.critical_incidents > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#FF3B30', fontSize: '11px', fontWeight: 600 }}>
                      <ShieldAlert size={12} /> {zone.critical_incidents} SIF
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', marginLeft: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {zone.risk_score}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/100</span>
                </div>
                {getTrendIcon(zone.risk_trend, zone.risk_trend_delta)}
              </div>

              <ChevronRight size={16} style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)', marginLeft: '8px' }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
