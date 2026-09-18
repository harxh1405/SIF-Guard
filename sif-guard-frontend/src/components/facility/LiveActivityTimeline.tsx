import React from 'react';
import type { ZoneIncident } from '../../types/facility';
import { ShieldAlert, AlertTriangle, ShieldCheck, Zap, Radio } from 'lucide-react';

interface LiveActivityTimelineProps {
  timeline: ZoneIncident[];
  onSelectZone: (zoneId: string) => void;
}

export const LiveActivityTimeline: React.FC<LiveActivityTimelineProps> = ({
  timeline,
  onSelectZone,
}) => {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: '#FF3B3018',
          text: '#FF3B30',
          border: '#FF3B3044',
          icon: <ShieldAlert size={12} />,
          label: 'CRITICAL SIF',
        };
      case 'HIGH':
        return {
          bg: '#FF950018',
          text: '#FF9500',
          border: '#FF950044',
          icon: <AlertTriangle size={12} />,
          label: 'HIGH RISK',
        };
      case 'MODERATE':
        return {
          bg: '#FFCC0018',
          text: '#FFCC00',
          border: '#FFCC0044',
          icon: <AlertTriangle size={12} />,
          label: 'MODERATE',
        };
      default:
        return {
          bg: '#20D99718',
          text: '#20D997',
          border: '#20D99744',
          icon: <ShieldCheck size={12} />,
          label: 'ROUTINE',
        };
    }
  };

  return (
    <div className="glass-card" style={{ padding: '16px 18px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={16} color="var(--primary)" style={{ animation: 'spin 4s linear infinite' }} />
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
            Live Safety Telemetry & Event Feed
          </h3>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {timeline.length} events logged
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '420px', paddingRight: '4px' }}>
        {timeline.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            No incident activity recorded in the active operational window.
          </div>
        ) : (
          timeline.map((item) => {
            const badge = getSeverityBadge(item.severity);

            return (
              <div
                key={item.id}
                onClick={() => onSelectZone(item.zone_id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: item.is_demo ? 'rgba(255, 106, 0, 0.08)' : 'var(--background-secondary)',
                  border: item.is_demo ? '1px dashed var(--primary)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {badge.icon} {badge.label}
                    </span>

                    {item.is_demo && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '1px 4px',
                          borderRadius: '3px',
                          backgroundColor: 'var(--primary)',
                          color: '#000',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        <Zap size={9} /> SIMULATED
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {item.formatted_time || 'Recent'}
                  </span>
                </div>

                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  {item.report_summary || item.report_text.slice(0, 80)}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{item.zone_name}</span>
                  {item.barrier_failure && (
                    <span>• Barrier: <strong style={{ color: '#FF9500' }}>{item.barrier_failure}</strong></span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
