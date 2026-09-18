import React, { useState, useMemo } from 'react';
import type { FacilityZone } from '../../types/facility';
import { ChevronRight, TrendingUp, TrendingDown, Minus, Flame } from 'lucide-react';
import { getRiskColor } from '../../utils/riskUtils';

interface ZoneStatusListProps {
  zones: FacilityZone[];
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
  onHoverZone?: (zoneId: string | null) => void;
  theme?: 'dark' | 'light';
}

type FilterType = 'all' | 'high_critical' | 'flares';

export const ZoneStatusList: React.FC<ZoneStatusListProps> = ({
  zones,
  selectedZoneId,
  onSelectZone,
  onHoverZone,
  theme = 'dark',
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const isLight = theme === 'light';

  const filteredZones = useMemo(() => {
    switch (filter) {
      case 'high_critical':
        return zones.filter((z) => z.risk_level === 'CRITICAL' || z.risk_level === 'HIGH');
      case 'flares':
        return zones.filter((z) => z.active_incidents > 0 || z.critical_incidents > 0);
      case 'all':
      default:
        return zones;
    }
  }, [zones, filter]);

  const highCriticalCount = zones.filter(
    (z) => z.risk_level === 'CRITICAL' || z.risk_level === 'HIGH'
  ).length;

  const activeFlaresCount = zones.filter(
    (z) => z.active_incidents > 0 || z.critical_incidents > 0
  ).length;

  const getTrendIcon = (trend: string, delta: number) => {
    if (trend === 'INCREASE') {
      return (
        <span style={{ color: '#FF3B30', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
          <TrendingUp size={11} /> +{delta}%
        </span>
      );
    }
    if (trend === 'DECREASE') {
      return (
        <span style={{ color: '#20D997', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
          <TrendingDown size={11} /> -{Math.abs(delta)}%
        </span>
      );
    }
    return (
      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
        <Minus size={11} /> STABLE
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Quick Filter Chips Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '4px 9px',
            borderRadius: '6px',
            border: `1px solid ${filter === 'all' ? 'var(--primary, #FF7300)' : 'var(--border)'}`,
            backgroundColor: filter === 'all' ? 'rgba(255, 115, 0, 0.15)' : 'transparent',
            color: filter === 'all' ? 'var(--primary, #FF7300)' : 'var(--text-muted)',
            fontSize: '11px',
            fontWeight: filter === 'all' ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          All ({zones.length})
        </button>

        <button
          onClick={() => setFilter('high_critical')}
          style={{
            padding: '4px 9px',
            borderRadius: '6px',
            border: `1px solid ${filter === 'high_critical' ? '#FF3B30' : 'var(--border)'}`,
            backgroundColor: filter === 'high_critical' ? 'rgba(255, 59, 48, 0.15)' : 'transparent',
            color: filter === 'high_critical' ? '#FF3B30' : 'var(--text-muted)',
            fontSize: '11px',
            fontWeight: filter === 'high_critical' ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          High/Critical ({highCriticalCount})
        </button>

        <button
          onClick={() => setFilter('flares')}
          style={{
            padding: '4px 9px',
            borderRadius: '6px',
            border: `1px solid ${filter === 'flares' ? '#FF9500' : 'var(--border)'}`,
            backgroundColor: filter === 'flares' ? 'rgba(255, 149, 0, 0.15)' : 'transparent',
            color: filter === 'flares' ? '#FF9500' : 'var(--text-muted)',
            fontSize: '11px',
            fontWeight: filter === 'flares' ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Flame size={11} /> Flares ({activeFlaresCount})
        </button>
      </div>

      {/* Streamlined Zone Card Stack */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          maxHeight: 'calc(100vh - 360px)',
          overflowY: 'auto',
          paddingRight: '2px',
        }}
      >
        {filteredZones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)', fontSize: '11px' }}>
            No zones match the current filter.
          </div>
        ) : (
          filteredZones.map((zone) => {
            const isSelected = selectedZoneId === zone.id;
            const riskColor = getRiskColor(zone.risk_level);
            const isLowRisk = zone.risk_level === 'LOW';

            return (
              <div
                key={zone.id}
                onClick={() => onSelectZone(zone.id)}
                onMouseEnter={() => onHoverZone?.(zone.id)}
                onMouseLeave={() => onHoverZone?.(null)}
                className="glass-card"
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  borderLeft: `3.5px solid ${riskColor}`,
                  backgroundColor: isSelected
                    ? (isLight ? 'rgba(241, 245, 249, 0.95)' : 'rgba(255, 115, 0, 0.12)')
                    : (isLight ? 'rgba(255, 255, 255, 0.7)' : 'rgba(15, 23, 38, 0.6)'),
                  borderColor: isSelected ? 'var(--primary, #FF7300)' : 'var(--border)',
                  boxShadow: isSelected ? `0 0 16px rgba(255, 115, 0, 0.18)` : 'none',
                  opacity: isLowRisk && !isSelected ? 0.85 : 1,
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: '8px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--primary, #FF7300)',
                        fontWeight: 700,
                      }}
                    >
                      {zone.code}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {zone.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: `${riskColor}18`,
                        color: riskColor,
                        border: `1px solid ${riskColor}33`,
                      }}
                    >
                      {zone.risk_level}
                    </span>

                    {zone.active_incidents > 0 && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          fontSize: '10px',
                          color: zone.critical_incidents > 0 ? '#FF3B30' : '#FF9500',
                          fontWeight: 700,
                        }}
                      >
                        <Flame size={10} /> {zone.active_incidents} flare{zone.active_incidents > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', marginLeft: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                    <span
                      style={{
                        fontSize: '16px',
                        fontWeight: 800,
                        color: riskColor,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {zone.risk_score}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>/100</span>
                  </div>
                  {getTrendIcon(zone.risk_trend, zone.risk_trend_delta)}
                </div>

                <ChevronRight
                  size={14}
                  style={{
                    color: isSelected ? 'var(--primary, #FF7300)' : 'var(--text-muted)',
                    marginLeft: '6px',
                    opacity: isSelected ? 1 : 0.4,
                  }}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
