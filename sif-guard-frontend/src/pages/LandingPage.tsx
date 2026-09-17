import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ShieldAlert,
  ArrowRight,
  ChevronDown,
  Zap,
  Lock,
  Flame,
  AlertTriangle,
} from 'lucide-react';
import { RefineryCanvas } from '../components/facility/3d/RefineryCanvas';
import { ZONE_3D_CONFIGS } from '../components/facility/3d/zoneConfig';
import { getFacilityOverview } from '../api/facility';
import type { FacilityZone } from '../types/facility';

interface LandingPageProps {
  onEnterPlatform: () => void;
}

// Fallback facility zones derived from 3D zone configurations
const FALLBACK_ZONES: FacilityZone[] = Object.values(ZONE_3D_CONFIGS).map((cfg) => ({
  id: cfg.id,
  name: cfg.name,
  code: cfg.code,
  description: 'Oil India Limited production & processing facility quadrant.',
  risk_score: 24,
  risk_level: 'LOW',
  total_incidents: 1,
  active_incidents: 0,
  critical_incidents: 0,
  recent_incident_state: false,
  risk_trend: 'STABLE',
  risk_trend_delta: 0,
  risk_factors: [
    {
      title: 'Continuous Monitoring',
      impact: 'LOW',
      description: 'Telemetry and safety sensors active.',
      category: 'baseline',
    },
  ],
  dominant_hazard: 'Hydrocarbon Exposure',
  dominant_activity: 'Process Maintenance',
  dominant_barrier_failure: 'Isolation Verification',
  dominant_lsr: 'Energy Isolation',
  recommended_actions: ['Maintain standard operating procedures and permit adherence.'],
  incidents: [],
  svg_center: { x: 300, y: 300 },
}));

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterPlatform }) => {
  const [zones, setZones] = useState<FacilityZone[]>(FALLBACK_ZONES);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSignal, setActiveSignal] = useState<number>(0);

  // Pinned Hero Journey container reference
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Scroll Transforms for Hero & Seamless First Transition
  // 1. Hero Content Layer (0.0 -> 0.35)
  const heroOpacity = useTransform(scrollYProgress, [0, 0.22, 0.32], [1, 0.8, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.32], [0, -70]);
  const heroScale = useTransform(scrollYProgress, [0, 0.32], [1, 0.96]);

  // 2. 3D Facility Layer (starts full, shifts slightly, then smoothly dissolves into data points)
  const facilityScale = useTransform(scrollYProgress, [0, 0.35, 0.7, 1], [1, 1.05, 1.02, 0.95]);
  const facilityOpacity = useTransform(scrollYProgress, [0, 0.45, 0.7, 0.95], [0.92, 1, 0.45, 0.15]);

  // 3. Safety Signal Beacons Layer (0.22 -> 0.65)
  const signalsOpacity = useTransform(scrollYProgress, [0.24, 0.34, 0.58, 0.68], [0, 1, 1, 0]);
  const signalsY = useTransform(scrollYProgress, [0.24, 0.34, 0.58, 0.68], [40, 0, 0, -30]);

  // 4. Data Constellation & Statement Layer (0.58 -> 1.0)
  const statementOpacity = useTransform(scrollYProgress, [0.6, 0.72, 0.95], [0, 1, 1]);
  const statementScale = useTransform(scrollYProgress, [0.6, 0.75], [0.94, 1]);
  const constellationOpacity = useTransform(scrollYProgress, [0.55, 0.7, 1], [0, 0.95, 1]);

  // Fetch real facility telemetry if backend is reachable
  useEffect(() => {
    let mounted = true;
    getFacilityOverview()
      .then((data) => {
        if (mounted && data.zones?.length > 0) {
          setZones(data.zones);
        }
      })
      .catch(() => {
        // Fallback zones will be safely utilized
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Monitor window scroll for navbar glass styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cycle through signal beacons periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSignal((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleExploreClick = () => {
    if (containerRef.current) {
      const targetY = containerRef.current.offsetTop + window.innerHeight * 0.45;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#0B0806',
        color: '#F5EFEB',
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* -------------------------------------------------------------
          STEP 2: MINIMAL HIGH-END NAVBAR
          ------------------------------------------------------------- */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '16px 36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          backgroundColor: isScrolled ? 'rgba(11, 8, 6, 0.82)' : 'transparent',
          backdropFilter: isScrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(16px)' : 'none',
          borderBottom: isScrolled ? '1px solid rgba(51, 37, 28, 0.65)' : '1px solid transparent',
        }}
      >
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              backgroundColor: 'rgba(255, 106, 0, 0.12)',
              border: '1px solid rgba(255, 106, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF6A00',
            }}
          >
            <ShieldAlert size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: '#F5EFEB',
                }}
              >
                SIF-GUARD
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 106, 0, 0.09)',
                  color: '#FF8A1F',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  border: '1px solid rgba(255, 106, 0, 0.22)',
                }}
              >
                OIL INDIA LIMITED
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
          }}
          className="desktop-nav"
        >
          {['Platform', 'Intelligence', 'How It Works', 'About'].map((item) => (
            <button
              key={item}
              onClick={handleExploreClick}
              style={{
                background: 'none',
                border: 'none',
                color: '#B3A194',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'color 0.15s ease',
                padding: '4px 0',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#F5EFEB')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#B3A194')}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Enter Platform Action */}
        <button
          onClick={onEnterPlatform}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 106, 0, 0.12)',
            border: '1px solid rgba(255, 106, 0, 0.35)',
            color: '#FF8A1F',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FF6A00';
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 106, 0, 0.12)';
            e.currentTarget.style.color = '#FF8A1F';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span>Enter Platform</span>
          <ArrowRight size={15} />
        </button>
      </header>

      {/* -------------------------------------------------------------
          STEP 3: CONTINUOUS PINNED SCROLL JOURNEY (HERO -> FIRST TRANSITION)
          ------------------------------------------------------------- */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          height: '260vh', // Provides ample scroll runway for seamless transformation
        }}
      >
        {/* Sticky Viewport Window */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Layer A: Real 3D Refinery Twin in Background */}
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              scale: facilityScale,
              opacity: facilityOpacity,
              pointerEvents: 'none', // Allows effortless scroll pass-through
            }}
          >
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <RefineryCanvas
                zones={zones}
                selectedZoneId={selectedZoneId}
                onSelectZone={(id) => setSelectedZoneId(id)}
                hoveredZoneId={hoveredZoneId}
                onHoverZone={(id) => setHoveredZoneId(id)}
                activeIncidents={[]}
                theme="dark"
                minimalOverlay={true}
              />

              {/* Sophisticated Dark Radial Vignette */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'radial-gradient(circle at 50% 45%, rgba(11, 8, 6, 0.15) 0%, rgba(11, 8, 6, 0.75) 60%, #0B0806 95%)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </motion.div>

          {/* Layer B: Hero Headline & CTA (Stage 1) */}
          <motion.div
            style={{
              position: 'relative',
              zIndex: 10,
              maxWidth: '860px',
              padding: '0 24px',
              textAlign: 'center',
              opacity: heroOpacity,
              y: heroY,
              scale: heroScale,
            }}
          >
            {/* Status Indicator & Eyebrow */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 16px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(23, 17, 13, 0.75)',
                border: '1px solid rgba(51, 37, 28, 0.8)',
                backdropFilter: 'blur(10px)',
                marginBottom: '26px',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#20D997',
                  boxShadow: '0 0 10px #20D997',
                }}
              />
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  color: '#B3A194',
                  textTransform: 'uppercase',
                }}
              >
                SIF PRECURSOR INTELLIGENCE · SIH 2026
              </span>
            </div>

            {/* Main Headline */}
            <h1
              style={{
                fontSize: 'clamp(2.5rem, 5.5vw, 4.4rem)',
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: '-0.035em',
                margin: '0 0 22px 0',
                color: '#FFFFFF',
              }}
            >
              Predict the incident.
              <br />
              <span
                style={{
                  background: 'linear-gradient(180deg, #FFFFFF 20%, #B3A194 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Before it becomes one.
              </span>
            </h1>

            {/* Supporting Text */}
            <p
              style={{
                fontSize: 'clamp(1rem, 1.4vw, 1.2rem)',
                color: '#B3A194',
                lineHeight: 1.6,
                maxWidth: '680px',
                margin: '0 auto 34px auto',
                fontWeight: 400,
              }}
            >
              SIF-Guard transforms unstructured safety observations into actionable precursor
              intelligence — identifying SIF potential, Life-Saving Rules and recurring barrier failures
              before they escalate.
            </p>

            {/* Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={handleExploreClick}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '13px 28px',
                  borderRadius: '10px',
                  backgroundColor: '#FF6A00',
                  color: '#FFFFFF',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(255, 106, 0, 0.3)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF7A00';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF6A00';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>Explore Intelligence</span>
                <ArrowRight size={17} />
              </button>

              <button
                onClick={onEnterPlatform}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '13px 26px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(23, 17, 13, 0.8)',
                  border: '1px solid rgba(51, 37, 28, 0.9)',
                  color: '#F5EFEB',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 106, 0, 0.4)';
                  e.currentTarget.style.backgroundColor = 'rgba(33, 23, 16, 0.9)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(51, 37, 28, 0.9)';
                  e.currentTarget.style.backgroundColor = 'rgba(23, 17, 13, 0.8)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>Enter Platform</span>
                <span style={{ color: '#FF6A00' }}>↗</span>
              </button>
            </div>

            {/* Scroll Hint */}
            <div
              style={{
                marginTop: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.78rem',
                color: '#736154',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <span>Scroll to observe precursor transformation</span>
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ChevronDown size={14} color="#FF6A00" />
              </motion.div>
            </div>
          </motion.div>

          {/* Layer C: Safety Signal Beacons Over Facility (Stage 2) */}
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              opacity: signalsOpacity,
              y: signalsY,
            }}
          >
            {/* Spatial Safety Signal Overlays */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '1200px',
                height: '560px',
              }}
            >
              {[
                {
                  id: 0,
                  rule: 'Energy Isolation',
                  zone: 'Crude Booster & Motor Drive (Z-02)',
                  tag: '480V Switchgear · Lockout Bypassed',
                  risk: 'HIGH SIF POTENTIAL',
                  top: '22%',
                  left: '18%',
                  icon: Zap,
                },
                {
                  id: 1,
                  rule: 'Hot Work',
                  zone: 'Fabrication Workshop (Z-06)',
                  tag: 'Combustible Gas Sensor Muted',
                  risk: 'LSR VIOLATION DETECTED',
                  top: '55%',
                  left: '26%',
                  icon: Flame,
                },
                {
                  id: 2,
                  rule: 'Line of Fire',
                  zone: 'Main Gathering Pipeline (Z-04)',
                  tag: 'Pressurized Flange Decoupling',
                  risk: 'BARRIER FAILURE',
                  top: '30%',
                  right: '22%',
                  icon: AlertTriangle,
                },
                {
                  id: 3,
                  rule: 'Confined Space',
                  zone: 'Storage Tank Bund (Z-03)',
                  tag: 'Oxygen Atmospheric Depletion (18.4%)',
                  risk: 'CRITICAL PRECURSOR',
                  top: '62%',
                  right: '16%',
                  icon: Lock,
                },
              ].map((sig) => {
                const isSelected = activeSignal === sig.id;
                const IconComponent = sig.icon;

                return (
                  <motion.div
                    key={sig.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                      opacity: 1,
                      scale: isSelected ? 1.04 : 1,
                    }}
                    transition={{ duration: 0.4 }}
                    style={{
                      position: 'absolute',
                      top: sig.top,
                      left: sig.left,
                      right: sig.right,
                      backgroundColor: isSelected
                        ? 'rgba(23, 17, 13, 0.92)'
                        : 'rgba(18, 13, 9, 0.85)',
                      border: isSelected
                        ? '1px solid rgba(255, 106, 0, 0.55)'
                        : '1px solid rgba(51, 37, 28, 0.7)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      backdropFilter: 'blur(12px)',
                      boxShadow: isSelected
                        ? '0 12px 32px rgba(255, 106, 0, 0.2)'
                        : '0 8px 24px rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      maxWidth: '310px',
                      pointerEvents: 'auto',
                      cursor: 'pointer',
                      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                    }}
                    onClick={() => setActiveSignal(sig.id)}
                  >
                    {/* Radar Pulse Beacon */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: isSelected
                            ? 'rgba(255, 106, 0, 0.22)'
                            : 'rgba(255, 106, 0, 0.1)',
                          border: '1px solid rgba(255, 106, 0, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FF6A00',
                        }}
                      >
                        <IconComponent size={17} />
                      </div>
                      <span
                        style={{
                          position: 'absolute',
                          top: -3,
                          right: -3,
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#FF6A00',
                          boxShadow: '0 0 8px #FF6A00',
                        }}
                      />
                    </div>

                    {/* Telemetry Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          marginBottom: '2px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: '#F5EFEB',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {sig.rule}
                        </span>
                        <span
                          style={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            color: '#FF8A1F',
                            fontFamily: 'monospace',
                          }}
                        >
                          {sig.risk}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: '#B3A194',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {sig.tag}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Subtitle Caption for Safety Nodes */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  textAlign: 'center',
                  backgroundColor: 'rgba(11, 8, 6, 0.7)',
                  padding: '6px 20px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(51, 37, 28, 0.6)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.74rem',
                    color: '#B3A194',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  ● Active Telemetry Signals Mapped to Refinery Digital Twin
                </span>
              </div>
            </div>
          </motion.div>

          {/* Layer D: Data Constellation & Core Transition Statement (Stage 3) */}
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 24px',
              textAlign: 'center',
              pointerEvents: 'none',
              opacity: statementOpacity,
              scale: statementScale,
            }}
          >
            {/* Ambient Constellation Background Vectors */}
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: constellationOpacity,
                pointerEvents: 'none',
              }}
            >
              <svg
                width="100%"
                height="100%"
                style={{ position: 'absolute', inset: 0 }}
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF6A00" stopOpacity="0.6" />
                    <stop offset="50%" stopColor="#FF8A1F" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#FF6A00" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Flowing Vector Lines representing Safety Observation data ingestion */}
                <line x1="15%" y1="20%" x2="50%" y2="50%" stroke="url(#streamGrad)" strokeWidth="1.5" strokeDasharray="4 6" />
                <line x1="85%" y1="25%" x2="50%" y2="50%" stroke="url(#streamGrad)" strokeWidth="1.5" strokeDasharray="4 6" />
                <line x1="25%" y1="80%" x2="50%" y2="50%" stroke="url(#streamGrad)" strokeWidth="1.5" strokeDasharray="4 6" />
                <line x1="75%" y1="80%" x2="50%" y2="50%" stroke="url(#streamGrad)" strokeWidth="1.5" strokeDasharray="4 6" />
              </svg>
            </motion.div>

            {/* Small Eyebrow for the Transition */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 14px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 106, 0, 0.08)',
                border: '1px solid rgba(255, 106, 0, 0.25)',
                color: '#FF8A1F',
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '28px',
              }}
            >
              <span>From Observation to Precursor Intelligence</span>
            </div>

            {/* Transformative Statements */}
            <h2
              style={{
                fontSize: 'clamp(2.2rem, 5vw, 4rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                color: '#F5EFEB',
                margin: '0 0 16px 0',
                maxWidth: '900px',
              }}
            >
              Safety reports contain signals.
            </h2>

            <h2
              style={{
                fontSize: 'clamp(2.2rem, 5vw, 4rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                color: '#FF6A00',
                margin: '0 0 32px 0',
              }}
            >
              We surface them.
            </h2>

            {/* Floating Observation Stream Badges */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxWidth: '620px',
                width: '100%',
                margin: '0 auto',
              }}
            >
              {[
                {
                  id: 'obs-1',
                  source: 'OIL UA/UC Observation',
                  text: 'Technician entered pump manifold without verifying zero-energy state',
                  tag: 'SIF Signal: Energy Isolation',
                },
                {
                  id: 'obs-2',
                  source: 'Near-Miss Report',
                  text: 'Scaffolding upright base jack found improperly seated over soft mud',
                  tag: 'SIF Signal: Fall from Height',
                },
                {
                  id: 'obs-3',
                  source: 'Process Safety Observation',
                  text: 'Hydrocarbon valve flange weeping adjacent to operational heating burner',
                  tag: 'SIF Signal: Line of Fire / Hot Work',
                },
              ].map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    padding: '12px 18px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(23, 17, 13, 0.85)',
                    border: '1px solid rgba(51, 37, 28, 0.8)',
                    backdropFilter: 'blur(10px)',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#FF6A00',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#736154', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {item.source}
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#F5EFEB', fontWeight: 500 }}>
                        &ldquo;{item.text}&rdquo;
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: '#FF8A1F',
                      padding: '3px 8px',
                      borderRadius: '5px',
                      backgroundColor: 'rgba(255, 106, 0, 0.1)',
                      border: '1px solid rgba(255, 106, 0, 0.2)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {item.tag}
                  </span>
                </div>
              ))}
            </div>

            {/* Platform Enter Callout */}
            <div style={{ marginTop: '36px', pointerEvents: 'auto' }}>
              <button
                onClick={onEnterPlatform}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 26px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 106, 0, 0.12)',
                  border: '1px solid rgba(255, 106, 0, 0.35)',
                  color: '#FF8A1F',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF6A00';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 106, 0, 0.12)';
                  e.currentTarget.style.color = '#FF8A1F';
                }}
              >
                <span>Access Full Intelligence Platform</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
