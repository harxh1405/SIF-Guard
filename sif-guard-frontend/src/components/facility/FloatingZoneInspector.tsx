import React, { useState } from 'react';
import type { FacilityZone, ZoneIncident } from '../../types/facility';
import { getRiskColor } from '../../utils/riskUtils';
import {
  X,
  ShieldAlert,
  Flame,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FloatingZoneInspectorProps {
  zone: FacilityZone | null;
  onClose: () => void;
  onSimulateInZone?: (zoneId: string) => void;
  onFocusCamera?: () => void;
  theme?: 'dark' | 'light';
  isDocked?: boolean;
}

export const FloatingZoneInspector: React.FC<FloatingZoneInspectorProps> = ({
  zone,
  onClose,
  onSimulateInZone,
  onFocusCamera,
  theme = 'dark',
  isDocked = false,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'incidents' | 'actions'>('overview');

  if (!zone) return null;

  const isLight = theme === 'light';
  const riskColor = getRiskColor(zone.risk_level);

  const getTrendBadge = () => {
    if (zone.risk_trend === 'INCREASE') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            color: '#FF453A',
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
          }}
        >
          <TrendingUp size={12} /> +{zone.risk_trend_delta}%
        </span>
      );
    }
    if (zone.risk_trend === 'DECREASE') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            color: '#30D158',
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
          }}
        >
          <TrendingDown size={12} /> -{Math.abs(zone.risk_trend_delta)}%
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          color: 'var(--text-muted)',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <Minus size={12} /> STABLE
      </span>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        key={zone.id}
        initial={isDocked ? { opacity: 0 } : { opacity: 0, x: -20, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={isDocked ? { opacity: 0 } : { opacity: 0, x: -16, scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: isDocked ? 'relative' : 'absolute',
          top: isDocked ? 'auto' : '64px',
          left: isDocked ? 'auto' : '20px',
          zIndex: isDocked ? 'auto' : 40,
          width: isDocked ? '100%' : '380px',
          maxWidth: isDocked ? '100%' : 'calc(100vw - 40px)',
          height: isDocked ? '100%' : 'auto',
          maxHeight: isDocked ? '100%' : 'calc(100% - 84px)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(10, 18, 30, 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: isDocked ? '10px' : '14px',
          border: isDocked ? 'none' : `1px solid ${isLight ? 'rgba(203, 213, 225, 0.8)' : 'rgba(255, 255, 255, 0.12)'}`,
          boxShadow: isDocked
            ? 'none'
            : isLight
            ? '0 16px 36px rgba(0, 51, 102, 0.16), 0 0 0 1px rgba(255, 255, 255, 0.8)'
            : '0 20px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
        }}
      >
        {/* Top Decorative Risk Bar */}
        <div
          style={{
            height: '3.5px',
            width: '100%',
            backgroundColor: riskColor,
            boxShadow: `0 0 10px ${riskColor}88`,
            flexShrink: 0,
          }}
        />

        {/* Card Header */}
        <div
          style={{
            padding: '12px 14px 10px 14px',
            borderBottom: `1px solid ${isLight ? 'rgba(226, 232, 240, 0.8)' : 'rgba(255, 255, 255, 0.08)'}`,
            flexShrink: 0,
          }}
        >
          {isDocked && (
            <button
              onClick={onClose}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '5px',
                backgroundColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
                border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)'}`,
                color: 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <ChevronLeft size={13} /> Back to Zone List
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '5px',
                  backgroundColor: 'rgba(255, 115, 0, 0.15)',
                  color: 'var(--primary, #FF7300)',
                  border: '1px solid rgba(255, 115, 0, 0.3)',
                  letterSpacing: '0.04em',
                }}
              >
                {zone.code}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  backgroundColor: `${riskColor}22`,
                  color: riskColor,
                  border: `1px solid ${riskColor}44`,
                  letterSpacing: '0.06em',
                }}
              >
                {zone.risk_level} RISK
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {onFocusCamera && (
                <button
                  onClick={onFocusCamera}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Focus camera on this zone"
                >
                  <Compass size={14} />
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Close Inspector"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          <h3
            style={{
              margin: '2px 0 0 0',
              fontSize: '14.5px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              lineHeight: 1.25,
            }}
          >
            {zone.name}
          </h3>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {zone.description}
          </p>
        </div>

        {/* Diagnostic Metric Gauges Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: isLight ? 'rgba(241, 245, 249, 0.5)' : 'rgba(0, 0, 0, 0.25)',
            borderBottom: `1px solid ${isLight ? 'rgba(226, 232, 240, 0.8)' : 'rgba(255, 255, 255, 0.08)'}`,
            flexShrink: 0,
          }}
        >
          {/* SIF Risk Index */}
          <div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Risk Index
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginTop: '1px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: riskColor }}>
                {zone.risk_score}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/100</span>
            </div>
          </div>

          {/* Active Precursors */}
          <div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Precursors
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '1px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {zone.active_incidents}
              </span>
              {zone.critical_incidents > 0 && (
                <span style={{ fontSize: '10px', color: '#FF453A', fontWeight: 700 }}>
                  ({zone.critical_incidents} crit)
                </span>
              )}
            </div>
          </div>

          {/* 24h Trajectory */}
          <div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Trajectory
            </div>
            <div style={{ marginTop: '3px' }}>
              {getTrendBadge()}
            </div>
          </div>
        </div>

        {/* Sub-tabs for Deep Diagnostics */}
        <div
          style={{
            display: 'flex',
            borderBottom: `1px solid ${isLight ? 'rgba(226, 232, 240, 0.8)' : 'rgba(255, 255, 255, 0.08)'}`,
            padding: '4px 14px 0 14px',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          {(['overview', 'incidents', 'actions'] as const).map((tab) => {
            const isActive = activeTab === tab;
            const labels = {
              overview: 'Telemetry',
              incidents: `Flares (${zone.incidents?.length || 0})`,
              actions: 'Safeguards',
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--primary, #FF7300)' : '2px solid transparent',
                  padding: '6px 0',
                  fontSize: '11px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body */}
        <div
          style={{
            padding: '12px 14px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {activeTab === 'overview' && (
            <>
              {/* Dominant Hazard Callout */}
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  backgroundColor: isLight ? '#fef2f2' : 'rgba(255, 59, 48, 0.08)',
                  border: `1px solid ${isLight ? '#fecaca' : 'rgba(255, 59, 48, 0.2)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#FF453A', fontWeight: 700, textTransform: 'uppercase' }}>
                  <Flame size={12} /> Dominant Precursor Hazard
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {zone.dominant_hazard || 'Multi-stream process hazard'}
                </div>
              </div>

              {/* Dominant Barrier Failure */}
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  backgroundColor: isLight ? '#fffbeb' : 'rgba(255, 149, 0, 0.08)',
                  border: `1px solid ${isLight ? '#fde68a' : 'rgba(255, 149, 0, 0.2)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#FF9500', fontWeight: 700, textTransform: 'uppercase' }}>
                  <ShieldAlert size={12} /> Primary Compromised Barrier
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {zone.dominant_barrier_failure || 'Pressure Relief & Containment Integrity'}
                </div>
              </div>

              {/* Life-Saving Rule Alignment */}
              {zone.dominant_lsr && (
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: isLight ? '#f0fdf4' : 'rgba(48, 209, 88, 0.08)',
                    border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(48, 209, 88, 0.2)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#30D158', fontWeight: 700, textTransform: 'uppercase' }}>
                    <ShieldCheck size={12} /> Mandatory Rule (OISD / DGMS)
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {zone.dominant_lsr}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'incidents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(!zone.incidents || zone.incidents.length === 0) ? (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                  No active incidents recorded in this zone.
                </div>
              ) : (
                zone.incidents.map((inc: ZoneIncident) => (
                  <div
                    key={inc.id}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: isLight ? 'rgba(241, 245, 249, 0.8)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${isLight ? 'rgba(203, 213, 225, 0.8)' : 'rgba(255, 255, 255, 0.08)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 700 }}>
                        {inc.source_record_id || inc.id}
                      </span>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '3px',
                          backgroundColor: inc.severity === 'CRITICAL' ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 149, 0, 0.2)',
                          color: inc.severity === 'CRITICAL' ? '#FF453A' : '#FF9500',
                        }}
                      >
                        {inc.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-primary)', marginTop: '3px', lineHeight: 1.3 }}>
                      {inc.report_summary || inc.report_text?.slice(0, 90)}...
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'actions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(!zone.recommended_actions || zone.recommended_actions.length === 0) ? (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                  All baseline safety controls verified for this sector.
                </div>
              ) : (
                zone.recommended_actions.map((act: string, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: isLight ? 'rgba(241, 245, 249, 0.8)' : 'rgba(255, 255, 255, 0.04)',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.35,
                    }}
                  >
                    <ChevronRight size={13} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                    <span>{act}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '10px 14px',
            borderTop: `1px solid ${isLight ? 'rgba(226, 232, 240, 0.8)' : 'rgba(255, 255, 255, 0.08)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            backgroundColor: isLight ? 'rgba(248, 250, 252, 0.8)' : 'rgba(0, 0, 0, 0.3)',
            flexShrink: 0,
          }}
        >
          {onSimulateInZone && (
            <button
              onClick={() => onSimulateInZone(zone.id)}
              style={{
                flex: 1,
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: 'linear-gradient(135deg, #FF7300 0%, #E65100 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                boxShadow: '0 2px 8px rgba(255, 115, 0, 0.3)',
              }}
            >
              <Zap size={12} /> Flare Sector
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)'}`,
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
