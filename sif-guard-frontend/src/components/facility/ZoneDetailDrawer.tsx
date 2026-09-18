import React from 'react';
import type { FacilityZone } from '../../types/facility';
import {
  X,
  CheckCircle2,
  Sparkles,
  Activity,
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';

interface ZoneDetailDrawerProps {
  zone: FacilityZone | null;
  onClose: () => void;
}

export const ZoneDetailDrawer: React.FC<ZoneDetailDrawerProps> = ({ zone, onClose }) => {
  if (!zone) return null;

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

  const riskColor = getRiskColor(zone.risk_level);

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '520px',
          maxWidth: '90vw',
          backgroundColor: 'var(--surface-elevated)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.7)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            background: 'var(--background-secondary)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 700 }}>
                {zone.code}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: `${riskColor}22`,
                  color: riskColor,
                  border: `1px solid ${riskColor}44`,
                }}
              >
                {zone.risk_level} RISK
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {zone.name}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
              {zone.description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="action-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body Scroll */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* Risk Score & Key Metrics Banner */}
          <div
            className="glass-card"
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderLeft: `4px solid ${riskColor}`,
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
                Zone Dynamic Risk Score
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {zone.risk_score}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ 100</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', textAlign: 'right' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reports</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {zone.total_incidents}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SIF Precursors</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#FF3B30', fontFamily: 'var(--font-mono)' }}>
                  {zone.critical_incidents}
                </div>
              </div>
            </div>
          </div>

          {/* Explainable Risk Factors */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Sparkles size={16} color="var(--primary)" />
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
                Explainable Risk Breakdown
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {zone.risk_factors.map((factor, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--background-secondary)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {factor.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {factor.description}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: factor.impact.startsWith('+') ? '#FF9500' : 'var(--text-muted)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 149, 0, 0.1)',
                      border: '1px solid rgba(255, 149, 0, 0.25)',
                      whiteSpace: 'nowrap',
                      marginLeft: '12px',
                    }}
                  >
                    {factor.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Signatures (Dominant Dimensions) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
            }}
          >
            <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Dominant Hazard</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {zone.dominant_hazard || 'General Operational'}
              </div>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Dominant Barrier Defect</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#FF9500', marginTop: '2px' }}>
                {zone.dominant_barrier_failure || 'None identified'}
              </div>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Dominant Activity</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {zone.dominant_activity || 'Routine Inspection'}
              </div>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Life-Saving Rule</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', marginTop: '2px' }}>
                {zone.dominant_lsr || 'General Standards'}
              </div>
            </div>
          </div>

          {/* Recommended Safety Actions & Mitigations */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <CheckCircle2 size={16} color="#20D997" />
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
                Recommended Safety Mitigations
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {zone.recommended_actions.map((act, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(32, 217, 151, 0.06)',
                    border: '1px solid rgba(32, 217, 151, 0.2)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <span style={{ color: '#20D997', fontWeight: 700, fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                    0{i + 1}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {act}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Zone Observations & Incidents */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} color="var(--primary)" />
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
                  Observations in this Zone ({zone.incidents.length})
                </h4>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {zone.incidents.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No incident reports currently associated with this zone.
                </div>
              ) : (
                zone.incidents.map((inc) => (
                  <div
                    key={inc.id}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--background-secondary)',
                      border: inc.is_demo ? '1px dashed var(--primary)' : '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '3px',
                            backgroundColor: inc.severity === 'CRITICAL' ? '#FF3B3022' : '#FF950022',
                            color: inc.severity === 'CRITICAL' ? '#FF3B30' : '#FF9500',
                            border: `1px solid ${inc.severity === 'CRITICAL' ? '#FF3B3044' : '#FF950044'}`,
                          }}
                        >
                          {inc.severity}
                        </span>
                        {inc.is_demo && (
                          <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 4px', borderRadius: '3px', backgroundColor: 'var(--primary)', color: '#000' }}>
                            DEMO
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {inc.source_record_id}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.4', marginBottom: '8px' }}>
                      {inc.report_text}
                    </div>

                    {inc.barrier_failure && (
                      <div style={{ fontSize: '11px', color: '#FF9500', marginBottom: '4px' }}>
                        <strong>Barrier Defect:</strong> {inc.barrier_failure}
                      </div>
                    )}

                    {inc.life_saving_rules && inc.life_saving_rules.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                        {inc.life_saving_rules.map((rule, rIdx) => {
                          const name = typeof rule === 'object' ? (rule as any).rule_name || (rule as any).rule_code : String(rule);
                          return (
                            <span
                              key={rIdx}
                              style={{
                                fontSize: '10px',
                                padding: '1px 6px',
                                borderRadius: '3px',
                                backgroundColor: 'var(--surface-elevated)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
