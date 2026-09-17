import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import refineryMapImage from '../../assets/refinery-digital-twin.png';
import {
  Radar,
  ArrowRight,
  Activity,
} from 'lucide-react';
import type { TabId } from '../layout/Navigation';

interface RefineryHeroSectionProps {
  onNavigate: (tab: TabId) => void;
  theme?: 'dark' | 'light';
  totalReports?: number;
  sifCount?: number;
  monitoredSites?: number;
}

interface SpatialPin {
  id: string;
  name: string;
  code: string;
  xPercent: number; // 0 - 100
  yPercent: number; // 0 - 100
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  sifCount: number;
  totalReports: number;
  dominantHazard: string;
  barrierDefect: string;
}

const REFINERY_PINS: SpatialPin[] = [
  {
    id: 'wellhead-area',
    name: 'Wellhead & Manifold Area',
    code: 'QUAD-01',
    xPercent: 17,
    yPercent: 32,
    riskLevel: 'HIGH',
    sifCount: 14,
    totalReports: 28,
    dominantHazard: 'High-Pressure Hydrocarbon',
    barrierDefect: 'Physical Barrier Integrity',
  },
  {
    id: 'pump-station',
    name: 'Main Booster Pump Station',
    code: 'QUAD-02',
    xPercent: 36,
    yPercent: 38,
    riskLevel: 'CRITICAL',
    sifCount: 22,
    totalReports: 36,
    dominantHazard: 'Pressure Release & Flammable Vapor',
    barrierDefect: 'Energy Isolation Verification',
  },
  {
    id: 'pipeline-corridor',
    name: 'Inter-Unit Pipeline Corridor',
    code: 'QUAD-03',
    xPercent: 58,
    yPercent: 52,
    riskLevel: 'MODERATE',
    sifCount: 9,
    totalReports: 42,
    dominantHazard: 'Mechanical Vibration',
    barrierDefect: 'Inspection Compliance',
  },
  {
    id: 'tank-farm',
    name: 'Crude Storage Tank Farm',
    code: 'QUAD-04',
    xPercent: 78,
    yPercent: 33,
    riskLevel: 'HIGH',
    sifCount: 18,
    totalReports: 51,
    dominantHazard: 'Toxic Gas & Vapor Ingress',
    barrierDefect: 'Vapor Monitoring Alarm',
  },
  {
    id: 'loading-area',
    name: 'Gantry Loading & Distribution',
    code: 'QUAD-05',
    xPercent: 82,
    yPercent: 72,
    riskLevel: 'MODERATE',
    sifCount: 11,
    totalReports: 46,
    dominantHazard: 'Kinetic & Heavy Transport',
    barrierDefect: 'Administrative Work Permit',
  },
];

export const RefineryHeroSection: React.FC<RefineryHeroSectionProps> = ({
  onNavigate,
  theme = 'dark',
  totalReports = 372,
  sifCount = 85,
  monitoredSites = 9,
}) => {
  const [activePin, setActivePin] = useState<SpatialPin | null>(REFINERY_PINS[1]); // Default to Pump Station
  const [isHovered, setIsHovered] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const isLight = theme === 'light';

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // Subtle 2-4px parallax shift
    setMouseOffset({
      x: x * 6,
      y: y * 6,
    });
  }, []);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMouseOffset({ x: 0, y: 0 });
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return '#E85D5D';
      case 'HIGH':
        return '#FFB347';
      case 'MODERATE':
        return '#FF7300';
      default:
        return '#20D997';
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        borderRadius: '20px',
        background: isLight
          ? 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)'
          : 'linear-gradient(180deg, #090807 0%, #060505 100%)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        boxShadow: isLight
          ? '0 10px 30px rgba(0, 0, 0, 0.06)'
          : '0 12px 40px rgba(0, 0, 0, 0.65)',
        minHeight: '440px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Background Visual Layer: Atmospheric Gradients & Refinery Canvas */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* Deep ambient radial lighting */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '20%',
            width: '60%',
            height: '70%',
            background: isLight
              ? 'radial-gradient(ellipse at center, rgba(255, 115, 0, 0.08) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at center, rgba(255, 115, 0, 0.15) 0%, transparent 70%)',
            filter: 'blur(40px)',
            opacity: 0.8,
          }}
        />

        {/* Layered Refinery Asset with smooth edge fade and parallax */}
        <div
          style={{
            position: 'absolute',
            inset: '-10px',
            transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0) scale(${isHovered ? 1.02 : 1.00})`,
            transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
            backgroundImage: `url(${refineryMapImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 45%',
            opacity: isLight ? 0.35 : 0.45,
            filter: isLight ? 'contrast(1.1) brightness(0.95)' : 'contrast(1.15) brightness(0.75)',
          }}
        />

        {/* Industrial Vignette & Gradient Fade */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: isLight
              ? 'linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.65) 45%, rgba(255,255,255,0.85) 100%), linear-gradient(180deg, transparent 60%, rgba(255,255,255,0.98) 100%)'
              : 'linear-gradient(90deg, rgba(9,8,7,0.95) 0%, rgba(9,8,7,0.65) 45%, rgba(9,8,7,0.90) 100%), linear-gradient(180deg, transparent 60%, rgba(6,5,5,0.98) 100%)',
          }}
        />
      </div>

      {/* Foreground Content: Command Header & Interactive Quadrant Overlay */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '28px 32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
        }}
      >
        {/* Top Operational Status Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  background: 'rgba(255, 115, 0, 0.12)',
                  color: 'var(--primary)',
                  border: '1px solid rgba(255, 115, 0, 0.25)',
                }}
              >
                FACILITY DIGITAL TWIN
              </span>

              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--success, #20D997)',
                    boxShadow: '0 0 6px rgba(32, 217, 151, 0.8)',
                    display: 'inline-block',
                  }}
                />
                Live Telemetry Active • {monitoredSites} Sites Monitored ({sifCount} SIF / {totalReports} Total)
              </span>
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: '1.65rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              See the precursor before the incident.
            </h1>
            <p
              style={{
                margin: '6px 0 0 0',
                fontSize: '0.84rem',
                color: 'var(--text-secondary)',
                maxWidth: '620px',
              }}
            >
              Real-time spatial precursor mapping, systemic barrier degradation tracking, and automated IOGP Life-Saving Rule correlation for Oil India Limited facilities.
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('facility')}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            >
              <Radar size={15} />
              <span>Explore 3D Digital Twin</span>
            </button>

            <button
              onClick={() => onNavigate('analytics')}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            >
              <Activity size={15} color="var(--primary)" />
              <span>Temporal Trends</span>
            </button>
          </div>
        </div>

        {/* Spatial Pins Overlay (Interactive Pins on Refinery Plane) */}
        <div
          style={{
            position: 'relative',
            height: '140px',
            margin: '20px 0 10px 0',
            borderRadius: '12px',
            border: '1px dashed var(--border-subtle)',
            background: isLight ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
          }}
        >
          {REFINERY_PINS.map((pin) => {
            const isSelected = activePin?.id === pin.id;
            const riskColor = getRiskColor(pin.riskLevel);

            return (
              <div
                key={pin.id}
                onClick={() => setActivePin(pin)}
                style={{
                  position: 'absolute',
                  left: `${pin.xPercent}%`,
                  top: `${pin.yPercent}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  zIndex: isSelected ? 10 : 5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {/* Pulsing Signal Pin Marker */}
                <div
                  style={{
                    position: 'relative',
                    width: isSelected ? '18px' : '14px',
                    height: isSelected ? '18px' : '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Subtle breathing animation for active/critical pins */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: '-4px',
                      borderRadius: '50%',
                      background: riskColor,
                      opacity: isSelected ? 0.35 : 0.2,
                      animation: 'pulse 2.5s infinite ease-in-out',
                    }}
                  />
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      backgroundColor: riskColor,
                      border: '2px solid #FFFFFF',
                      boxShadow: `0 0 10px ${riskColor}`,
                    }}
                  />
                </div>

                {/* Spatial Pin Label Badge */}
                <div
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: isSelected
                      ? isLight
                        ? '#1C1917'
                        : '#FFFFFF'
                      : isLight
                        ? 'rgba(255, 255, 255, 0.85)'
                        : 'rgba(18, 16, 14, 0.85)',
                    color: isSelected
                      ? isLight
                        ? '#FFFFFF'
                        : '#000000'
                      : 'var(--text-primary)',
                    border: `1px solid ${isSelected ? riskColor : 'var(--border-subtle)'}`,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {pin.code} • {pin.sifCount} SIF
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Zone Intelligence HUD Drawer / Pill */}
        {activePin && (
          <motion.div
            key={activePin.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              padding: '14px 18px',
              borderRadius: '12px',
              background: isLight
                ? 'rgba(255, 255, 255, 0.95)'
                : 'rgba(18, 16, 14, 0.92)',
              border: `1px solid ${getRiskColor(activePin.riskLevel)}40`,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    padding: '3px 7px',
                    borderRadius: '5px',
                    backgroundColor: `${getRiskColor(activePin.riskLevel)}20`,
                    color: getRiskColor(activePin.riskLevel),
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    border: `1px solid ${getRiskColor(activePin.riskLevel)}40`,
                  }}
                >
                  {activePin.riskLevel} RISK
                </span>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {activePin.name}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span>
                  SIF Precursors: <strong style={{ color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>{activePin.sifCount}</strong>
                </span>
                <span>
                  Precursor Density: <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{((activePin.sifCount / activePin.totalReports) * 100).toFixed(0)}%</strong>
                </span>
                <span>
                  Dominant Hazard: <strong style={{ color: 'var(--text-primary)' }}>{activePin.dominantHazard}</strong>
                </span>
                <span>
                  Barrier Breakdown: <strong style={{ color: 'var(--primary-bright)' }}>{activePin.barrierDefect}</strong>
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('facility')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'background 0.15s ease',
              }}
            >
              <span>Inspect in Digital Twin</span>
              <ArrowRight size={13} />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
