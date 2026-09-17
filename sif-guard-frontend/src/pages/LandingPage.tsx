import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  Zap,
  Lock,
  Flame,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import { RefineryCanvas } from '../components/facility/3d/RefineryCanvas';
import { AmbientTelemetryCanvas } from '../components/common/AmbientTelemetryCanvas';
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
  risk_score: 28,
  risk_level: 'LOW',
  total_incidents: 2,
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

// Pre-defined sample observations for the interactive demo
const DEMO_SAMPLES = [
  {
    title: 'Confined Space Omission',
    text: 'Worker entered crude storage vessel Z-03 without atmospheric oxygen testing or continuous gas monitor.',
    sif: 'HIGH',
    score: '96%',
    rule: 'CONFINED SPACE ENTRY',
    barrier: 'Atmospheric Testing & Entry Permit',
    precursor: 'Toxic / Asphyxiating Vapor Exposure in Enclosed Compartment',
  },
  {
    title: 'Bypassed Energy Isolation',
    text: 'Technician overhauled high-pressure booster pump coupling while breaker was tagged but padlock was omitted.',
    sif: 'HIGH',
    score: '92%',
    rule: 'ENERGY ISOLATION',
    barrier: 'Physical Lockout / Tagout (LOTO)',
    precursor: 'Uncontrolled Electrical & Kinetic Energy Release',
  },
  {
    title: 'Hot Work Gas Hazard',
    text: 'Welder struck arc 3 meters from hydrocarbon flare header with portable gas detector battery depleted.',
    sif: 'CRITICAL',
    score: '98%',
    rule: 'HOT WORK',
    barrier: 'Combustible Gas Monitoring & Flammable Zone Clearance',
    precursor: 'Flammable Vapor Cloud Ignition in Hydrocarbon Process Area',
  },
  {
    title: 'Fall from Height Rigging',
    text: 'Rigger climbed temporary scaffolding tower at 16 meters without attaching dual-lanyard harness to anchor line.',
    sif: 'HIGH',
    score: '89%',
    rule: 'WORK AT HEIGHT',
    barrier: '100% Fall Arrest Tie-off & Certified Anchor Point',
    precursor: 'Unprotected Fall Hazard Over 1.8m on Elevated Structure',
  },
];

// Core IOGP 9 Life-Saving Rules Data
const LSR_RULES_DATA = [
  {
    id: 'energy-isolation',
    code: 'LSR-01',
    name: 'Energy Isolation',
    icon: Zap,
    summary: 'Verify zero-energy state and test all mechanical, electrical, and pressure isolations before work.',
    criteria: 'Locks and tags installed on all isolation points. Residual pressure bled down. Zero voltage verified.',
    oilZone: 'Pump Station (Z-02) & Main Switchgear',
    precursorsFlagged: 18,
  },
  {
    id: 'line-of-fire',
    code: 'LSR-02',
    name: 'Line of Fire',
    icon: AlertTriangle,
    summary: 'Position yourself and colleagues outside the path of moving machinery, suspended loads, and pressurized lines.',
    criteria: 'Exclusion zones established. Never stand beneath hoisted crane loads or in unbolted flange release paths.',
    oilZone: 'Pipeline Corridor (Z-04) & Rig Yard',
    precursorsFlagged: 14,
  },
  {
    id: 'hot-work',
    code: 'LSR-03',
    name: 'Hot Work',
    icon: Flame,
    summary: 'Identify and control all ignition sources. Test atmosphere continuously for combustible hydrocarbon vapors.',
    criteria: 'Continuous gas detection active. 15-meter spark barrier containment verified. Fire watch on station.',
    oilZone: 'Maintenance Yard (Z-06) & Process Skid',
    precursorsFlagged: 11,
  },
  {
    id: 'confined-space',
    code: 'LSR-04',
    name: 'Confined Space',
    icon: Lock,
    summary: 'Obtain authorized entry permit, verify gas atmospheric testing, and maintain active standby communication.',
    criteria: 'O2 levels 19.5% - 23.5%. LEL < 1%. Standby sentry with radio outside manway at all times.',
    oilZone: 'Tank Farm (Z-03) & Separator Vessels',
    precursorsFlagged: 9,
  },
  {
    id: 'work-at-height',
    code: 'LSR-05',
    name: 'Work at Height',
    icon: Activity,
    summary: 'Protect against falls from elevation. Enforce 100% tie-off using certified harness, dual lanyards, and anchor points.',
    criteria: 'Required above 1.8m (6 ft). Scaffold green-tag inspection verified. Secondary tool tethering enforced.',
    oilZone: 'Drilling Mast & Flare Stack (Z-01)',
    precursorsFlagged: 8,
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterPlatform }) => {
  const [zones, setZones] = useState<FacilityZone[]>(FALLBACK_ZONES);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>('pump-station');
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Active Interactive Rule selection
  const [activeRuleId, setActiveRuleId] = useState<string>('energy-isolation');

  // Interactive AI Demo State
  const [demoInput, setDemoInput] = useState<string>(DEMO_SAMPLES[0].text);
  const [demoResult, setDemoResult] = useState<typeof DEMO_SAMPLES[0] | null>(DEMO_SAMPLES[0]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Fetch real facility telemetry if backend is active
  useEffect(() => {
    let mounted = true;
    getFacilityOverview()
      .then((data) => {
        if (mounted && data.zones?.length > 0) {
          setZones(data.zones);
        }
      })
      .catch(() => {
        // Safe fallback
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Monitor scroll for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRunDemoAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const matched = DEMO_SAMPLES.find((s) => demoInput.toLowerCase().includes(s.title.toLowerCase().split(' ')[0])) || {
        title: 'Custom Observation Analysis',
        text: demoInput,
        sif: 'HIGH',
        score: '91%',
        rule: 'ENERGY ISOLATION / PROCESS SAFETY',
        barrier: 'Physical Isolation Barrier & Permit Adherence',
        precursor: 'Uncontrolled Potential Energy with Escalation Pathway',
      };
      setDemoResult(matched);
      setIsAnalyzing(false);
    }, 600);
  };

  const selectedRule = LSR_RULES_DATA.find((r) => r.id === activeRuleId) || LSR_RULES_DATA[0];

  return (
    <div
      style={{
        backgroundColor: '#0B0806',
        color: '#F5EFEB',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        position: 'relative',
      }}
    >
      {/* Background Ambient Telemetry Canvas */}
      <AmbientTelemetryCanvas />
      {/* =============================================================
          1. MINIMAL INDUSTRIAL NAVBAR
          ============================================================= */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '16px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          backgroundColor: isScrolled ? 'rgba(11, 8, 6, 0.88)' : 'transparent',
          backdropFilter: isScrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(16px)' : 'none',
          borderBottom: isScrolled ? '1px solid rgba(51, 37, 28, 0.7)' : '1px solid transparent',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              backgroundColor: 'rgba(255, 106, 0, 0.12)',
              border: '1px solid rgba(255, 106, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF6A00',
            }}
          >
            <ShieldAlert size={21} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#F5EFEB',
              }}
            >
              SIF-GUARD
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 106, 0, 0.08)',
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

        {/* Navigation Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
          }}
          className="desktop-nav"
        >
          {[
            { label: 'Intelligence', id: 'signals' },
            { label: 'Workflow', id: 'workflow' },
            { label: 'Analysis Case', id: 'analysis' },
            { label: 'Life-Saving Rules', id: 'rules' },
            { label: 'Interactive Demo', id: 'demo' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
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
              {item.label}
            </button>
          ))}
        </nav>

        {/* Enter Platform Button */}
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
          <span style={{ fontSize: '0.9rem' }}>↗</span>
        </button>
      </header>

      {/* =============================================================
          2. HERO SECTION — ASYMMETRIC SPLIT COMPOSITION
          ============================================================= */}
      <section
        style={{
          position: 'relative',
          padding: '130px 48px 60px 48px',
          maxWidth: '1440px',
          margin: '0 auto',
          minHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxSizing: 'border-box',
          zIndex: 2,
        }}
      >
        <div
          className="hero-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.25fr)',
            gap: '56px',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {/* Left Column: Focused, Powerful Typography & Actions */}
          <div>
            {/* Eyebrow with restrained orange status beacon */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 106, 0, 0.08)',
                border: '1px solid rgba(255, 106, 0, 0.25)',
                marginBottom: '22px',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#FF6A00',
                  boxShadow: '0 0 8px #FF6A00',
                  animation: 'beacon-pulse 2s infinite',
                }}
              />
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#FF8A1F',
                  textTransform: 'uppercase',
                }}
              >
                SIF PRECURSOR INTELLIGENCE · SIH 2026
              </span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontSize: 'clamp(2.5rem, 4.3vw, 3.8rem)',
                fontWeight: 800,
                lineHeight: 1.12,
                letterSpacing: '-0.03em',
                color: '#FFFFFF',
                margin: '0 0 20px 0',
                maxWidth: '560px',
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

            {/* Supporting Copy */}
            <p
              style={{
                fontSize: '1.05rem',
                color: '#B3A194',
                lineHeight: 1.6,
                maxWidth: '520px',
                margin: '0 0 32px 0',
                fontWeight: 400,
              }}
            >
              SIF-Guard transforms unstructured safety observations into actionable precursor
              intelligence — identifying SIF potential, Life-Saving Rules and recurring barrier failures
              before they escalate into serious injuries or fatalities.
            </p>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                flexWrap: 'wrap',
                marginBottom: '32px',
              }}
            >
              <button
                onClick={() => scrollToSection('signals')}
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

            {/* Micro Industrial Credential */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.76rem',
                color: '#736154',
                fontFamily: 'monospace',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#FF6A00',
                }}
              />
              <span>AI/NLP Engine · Oil India Limited · PS 165</span>
            </div>
          </div>

          {/* Right Column: Seamless, Natural 3D Refinery Twin */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '560px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Subtle soft ambient back-glow behind the 3D facility */}
            <div
              style={{
                position: 'absolute',
                width: '85%',
                height: '85%',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255, 106, 0, 0.08) 0%, rgba(255, 106, 0, 0.02) 50%, transparent 75%)',
                filter: 'blur(50px)',
                pointerEvents: 'none',
              }}
            />

            {/* Real 3D Refinery Canvas with high lighting and minimal overlay */}
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
                transparentBg={true}
              />
            </div>

            {/* High-Precision Architectural Viewport Header */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(11, 8, 6, 0.75)',
                border: '1px solid rgba(255, 106, 0, 0.28)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#FF6A00',
                  boxShadow: '0 0 8px #FF6A00',
                }}
              />
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: '#F5EFEB',
                  letterSpacing: '0.04em',
                }}
              >
                OIL REFINERY DIGITAL TWIN
              </span>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontFamily: 'monospace',
                  color: '#FF8A1F',
                  fontWeight: 600,
                  marginLeft: '4px',
                }}
              >
                DRAG TO ORBIT
              </span>
            </div>

            {/* Spatial Safety Signal Tags anchored cleanly along bottom */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                right: '12px',
                display: 'flex',
                gap: '8px',
                justifyContent: 'center',
                flexWrap: 'wrap',
                pointerEvents: 'auto',
              }}
            >
              {[
                { label: 'Z-02 Pump Station', flag: 'Energy Isolation', icon: Zap },
                { label: 'Z-04 Pipeline Corridor', flag: 'Line of Fire', icon: AlertTriangle },
                { label: 'Z-03 Storage Bund', flag: 'Confined Space', icon: Lock },
                { label: 'Z-06 Maintenance Skid', flag: 'Hot Work Permit', icon: Flame },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(18, 13, 9, 0.8)',
                      border: '1px solid rgba(51, 37, 28, 0.8)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <Icon size={12} color="#FF6A00" />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#F5EFEB' }}>
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        color: '#FF8A1F',
                        fontFamily: 'monospace',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255, 106, 0, 0.12)',
                      }}
                    >
                      {item.flag}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Subtle Continuous Scroll Prompt */}
        <div
          style={{
            marginTop: '44px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            opacity: 0.8,
            transition: 'opacity 0.2s ease',
            userSelect: 'none',
          }}
          onClick={() => scrollToSection('signals')}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
        >
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: '#736154',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
            }}
          >
            Scroll to Explore Precursor Intelligence
          </span>
          <span
            style={{
              color: '#FF6A00',
              fontSize: '1.1rem',
              lineHeight: 1,
              animation: 'bounce 2s infinite',
            }}
          >
            ↓
          </span>
        </div>
      </section>

      {/* =============================================================
          3. SECTION 2: SAFETY REPORTS CONTAIN SIGNALS
          ============================================================= */}
      <section
        id="signals"
        style={{
          padding: '100px 48px 80px 48px',
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 106, 0, 0.08)',
            border: '1px solid rgba(255, 106, 0, 0.2)',
            color: '#FF8A1F',
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '20px',
          }}
        >
          Observation Stream
        </div>

        <h2
          style={{
            fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            color: '#F5EFEB',
            margin: '0 0 10px 0',
          }}
        >
          Safety reports contain signals.
        </h2>

        <h2
          style={{
            fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            color: '#FF6A00',
            margin: '0 0 24px 0',
          }}
        >
          We surface them.
        </h2>

        <p
          style={{
            fontSize: '1.05rem',
            color: '#B3A194',
            maxWidth: '680px',
            margin: '0 auto 48px auto',
            lineHeight: 1.6,
          }}
        >
          Across drilling platforms, compressor skids, and pipeline right-of-ways, front-line teams
          log observations every day. When an event results in zero injury, it is often filed away.
          SIF-Guard recognizes that the precursor was fatal.
        </p>

        {/* Streaming Observation Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '18px',
            textAlign: 'left',
          }}
        >
          {[
            {
              id: 'UA-904',
              type: 'Unsafe Condition',
              zone: 'Wellhead Christmas Tree (Z-01)',
              narrative: 'High-pressure gauge isolation valve weeping condensate while bleed port was unbolted.',
              signal: 'Line of Fire / Pressure Release',
              flag: 'POTENTIAL SIF',
            },
            {
              id: 'NM-312',
              type: 'Near-Miss Event',
              zone: 'Pump & Compressor Station (Z-02)',
              narrative: 'Technician opened coupling guard before motor circuit was confirmed physically locked out.',
              signal: 'Energy Isolation Omission',
              flag: 'CRITICAL PRECURSOR',
            },
            {
              id: 'UA-671',
              type: 'Unsafe Act',
              zone: 'Storage Tank Bund (Z-03)',
              narrative: 'Contractor stepped into vessel manway without wearing harness or verifying atmospheric air sample.',
              signal: 'Confined Space / Asphyxiation',
              flag: 'POTENTIAL SIF',
            },
          ].map((card) => (
            <div
              key={card.id}
              style={{
                backgroundColor: 'rgba(23, 17, 13, 0.75)',
                border: '1px solid rgba(51, 37, 28, 0.8)',
                borderRadius: '14px',
                padding: '22px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 106, 0, 0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(51, 37, 28, 0.8)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                <span style={{ fontSize: '0.72rem', color: '#736154', fontFamily: 'monospace' }}>
                  {card.id} · {card.type}
                </span>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    color: '#FF8A1F',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 106, 0, 0.1)',
                    border: '1px solid rgba(255, 106, 0, 0.25)',
                  }}
                >
                  {card.flag}
                </span>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#F5EFEB', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                &ldquo;{card.narrative}&rdquo;
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(51, 37, 28, 0.6)',
                  fontSize: '0.75rem',
                }}
              >
                <span style={{ color: '#B3A194' }}>{card.zone}</span>
                <span style={{ color: '#FF6A00', fontWeight: 600 }}>{card.signal}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =============================================================
          4. SECTION 3: REPORT -> NLP -> INTELLIGENCE TRANSFORMATION
          ============================================================= */}
      <section
        style={{
          padding: '80px 48px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(18, 13, 9, 0.6)',
            border: '1px solid rgba(51, 37, 28, 0.8)',
            borderRadius: '20px',
            padding: '48px 36px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#FF8A1F',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              The AI Extraction Engine
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 12px 0', color: '#FFFFFF' }}>
              From Unstructured Narrative to Dense Precursor Signals
            </h2>
            <p style={{ color: '#B3A194', maxWidth: '640px', margin: '0 auto', fontSize: '0.95rem' }}>
              How SIF-Guard parses oilfield acronyms, evaluates energy potential, and maps barrier integrity.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              position: 'relative',
            }}
          >
            {/* Step 1 */}
            <div
              style={{
                backgroundColor: 'rgba(23, 17, 13, 0.9)',
                border: '1px solid rgba(51, 37, 28, 0.8)',
                borderRadius: '14px',
                padding: '24px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 106, 0, 0.1)',
                  color: '#FF6A00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                }}
              >
                01
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 8px 0', color: '#F5EFEB' }}>
                Acronym &amp; Terminology Expansion
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#B3A194', lineHeight: 1.5, margin: 0 }}>
                Domain-specific terminology cleaner automatically resolves oilfield acronyms (<code style={{ color: '#FF8A1F' }}>LOTO</code>, <code style={{ color: '#FF8A1F' }}>PTW</code>, <code style={{ color: '#FF8A1F' }}>H2S</code>, <code style={{ color: '#FF8A1F' }}>SIMOPS</code>) ensuring standard semantic representation.
              </p>
            </div>

            {/* Step 2 */}
            <div
              style={{
                backgroundColor: 'rgba(23, 17, 13, 0.9)',
                border: '1px solid rgba(51, 37, 28, 0.8)',
                borderRadius: '14px',
                padding: '24px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 106, 0, 0.1)',
                  color: '#FF6A00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                }}
              >
                02
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 8px 0', color: '#F5EFEB' }}>
                Dense Semantic Embeddings
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#B3A194', lineHeight: 1.5, margin: 0 }}>
                Generates 768-dimensional vector representations via <code style={{ color: '#FF8A1F' }}>BAAI/bge-base-en-v1.5</code> combined with 16 engineered domain indicator flags for energy exposure and consequence.
              </p>
            </div>

            {/* Step 3 */}
            <div
              style={{
                backgroundColor: 'rgba(23, 17, 13, 0.9)',
                border: '1px solid rgba(51, 37, 28, 0.8)',
                borderRadius: '14px',
                padding: '24px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 106, 0, 0.1)',
                  color: '#FF6A00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                }}
              >
                03
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 8px 0', color: '#F5EFEB' }}>
                Calibrated XGBoost Classification
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#B3A194', lineHeight: 1.5, margin: 0 }}>
                Classifier evaluates SIF potential (<code style={{ color: '#FF6A00' }}>SIF_POTENTIAL</code>, <code style={{ color: '#B3A194' }}>NON_SIF</code>, <code style={{ color: '#FF8A1F' }}>UNCERTAIN</code>) alongside probability scores and specific barrier failure explanations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =============================================================
          5. SECTION 4: HOW SIF-GUARD WORKS (6-STAGE WORKFLOW)
          ============================================================= */}
      <section
        id="workflow"
        style={{
          padding: '90px 48px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#FF8A1F',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            End-to-End System Architecture
          </span>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, margin: '8px 0 14px 0', color: '#FFFFFF' }}>
            How SIF-Guard Operates
          </h2>
          <p style={{ color: '#B3A194', maxWidth: '640px', margin: '0 auto', fontSize: '1rem' }}>
            Six coordinated intelligence stages transforming raw field notes into preventive operational decisions.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {[
            {
              step: '01',
              title: 'INGEST',
              desc: 'Continuous ingestion of Unsafe Act, Unsafe Condition, and Near-Miss records from OIL enterprise and OSHA reporting formats.',
            },
            {
              step: '02',
              title: 'UNDERSTAND',
              desc: 'Domain NLP engine parses free-text observations, expanding technical acronyms and extracting activity, equipment, and exposures.',
            },
            {
              step: '03',
              title: 'CLASSIFY',
              desc: 'Enforces the foundational thesis: Actual Outcome != Potential Outcome. Classifies true precursor potential regardless of zero actual injury.',
            },
            {
              step: '04',
              title: 'MAP',
              desc: 'Automatic semantic mapping against the IOGP 9 Life-Saving Rules (Energy Isolation, Line of Fire, Hot Work, Confined Space, Height).',
            },
            {
              step: '05',
              title: 'DISCOVER',
              desc: 'Correlates activity, facility location, and barrier failures to discover recurring multi-incident failure patterns using HDBSCAN.',
            },
            {
              step: '06',
              title: 'ACT',
              desc: 'Delivers actionable foresight via real-time SIF Precursor Density scores, site hotspot rankings, and prioritized supervisor interventions.',
            },
          ].map((stage) => (
            <div
              key={stage.step}
              style={{
                backgroundColor: 'rgba(23, 17, 13, 0.75)',
                border: '1px solid rgba(51, 37, 28, 0.8)',
                borderRadius: '14px',
                padding: '24px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: '#FF6A00',
                  letterSpacing: '0.06em',
                  marginBottom: '10px',
                }}
              >
                STAGE {stage.step}
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 10px 0' }}>
                {stage.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#B3A194', lineHeight: 1.55, margin: 0 }}>
                {stage.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* =============================================================
          6. SECTION 5: REAL REPORT ANALYSIS SHOWCASE
          ============================================================= */}
      <section
        id="analysis"
        style={{
          padding: '90px 48px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#FF8A1F',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Real Field Observation Showcase
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '8px 0 12px 0', color: '#FFFFFF' }}>
            Live Precursor Extraction
          </h2>
          <p style={{ color: '#B3A194', maxWidth: '600px', margin: '0 auto', fontSize: '0.95rem' }}>
            Examining how an uninjured maintenance event is instantly analyzed by the SIF-Guard engine.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)',
            gap: '28px',
            backgroundColor: 'rgba(18, 13, 9, 0.75)',
            border: '1px solid rgba(51, 37, 28, 0.8)',
            borderRadius: '18px',
            padding: '36px',
          }}
        >
          {/* Raw Report Box */}
          <div
            style={{
              backgroundColor: 'rgba(11, 8, 6, 0.85)',
              border: '1px solid rgba(51, 37, 28, 0.7)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#736154' }}>
                  RAW INCIDENT NARRATIVE #OIL-2026-881
                </span>
                <span style={{ fontSize: '0.68rem', color: '#FF8A1F', fontWeight: 700 }}>
                  UNSAFE CONDITION / NEAR-MISS
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.98rem',
                  lineHeight: 1.6,
                  color: '#F5EFEB',
                  fontStyle: 'italic',
                  margin: '0 0 20px 0',
                }}
              >
                &ldquo;Technician entered the maintenance area while equipment remained energized. Breaker was
                tagged with permit notice but physical padlock had not been secured. Pump discharge line
                remained pressurized at 42 bar during impeller inspection.&rdquo;
              </p>
            </div>

            <div
              style={{
                fontSize: '0.75rem',
                color: '#736154',
                paddingTop: '14px',
                borderTop: '1px solid rgba(51, 37, 28, 0.6)',
              }}
            >
              Outcome Recorded in Field: <strong style={{ color: '#F5EFEB' }}>No Injury (Near Miss)</strong>
            </div>
          </div>

          {/* Extracted Intelligence Box */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* SIF Potential Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 106, 0, 0.1)',
                border: '1px solid rgba(255, 106, 0, 0.35)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert size={20} color="#FF6A00" />
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#FF8A1F', fontWeight: 700, letterSpacing: '0.04em' }}>
                    SIF CLASSIFICATION
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
                    SIF_POTENTIAL — HIGH PRECURSOR RISK
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#FF6A00', fontFamily: 'monospace' }}>
                  92%
                </div>
                <div style={{ fontSize: '0.65rem', color: '#B3A194' }}>CONFIDENCE: 0.89</div>
              </div>
            </div>

            {/* Extracted Dimensions */}
            {[
              {
                label: 'IOGP LIFE-SAVING RULE',
                val: 'ENERGY ISOLATION (LSR-01)',
                detail: 'Failure to enforce physical lockout & zero-energy confirmation.',
              },
              {
                label: 'PRIMARY BARRIER FAILURE',
                val: 'ISOLATION & DEPRESSURIZATION',
                detail: 'Physical padlock omitted; line pressure not verified at zero before work.',
              },
              {
                label: 'FACILITY QUADRANT',
                val: 'PUMP STATION (ZONE Z-02)',
                detail: 'High-volume booster centrifugal skid.',
              },
              {
                label: 'PRECURSOR MECHANISM',
                val: 'UNCONTROLLED HYDRAULIC & KINETIC ENERGY',
                detail: 'Escalation to amputation or fatality if pump accidentally started.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(23, 17, 13, 0.85)',
                  border: '1px solid rgba(51, 37, 28, 0.7)',
                }}
              >
                <div style={{ fontSize: '0.66rem', color: '#736154', fontFamily: 'monospace', fontWeight: 700 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F5EFEB', margin: '2px 0' }}>
                  {item.val}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#B3A194' }}>{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================================
          7. SECTION 6: SIF INTELLIGENCE RADIAL GAUGE & METRICS
          ============================================================= */}
      <section
        style={{
          padding: '80px 48px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
            gap: '36px',
            alignItems: 'center',
            backgroundColor: 'rgba(18, 13, 9, 0.7)',
            border: '1px solid rgba(51, 37, 28, 0.8)',
            borderRadius: '20px',
            padding: '44px',
          }}
        >
          {/* Radial Intelligence Ring */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '220px', height: '220px' }}>
              <svg width="220" height="220" viewBox="0 0 220 220">
                {/* Background Ring */}
                <circle cx="110" cy="110" r="88" stroke="rgba(51, 37, 28, 0.6)" strokeWidth="12" fill="none" />
                {/* Active Indicator Ring */}
                <circle
                  cx="110"
                  cy="110"
                  r="88"
                  stroke="#FF6A00"
                  strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 88}
                  strokeDashoffset={2 * Math.PI * 88 * (1 - 0.92)}
                  strokeLinecap="round"
                  fill="none"
                  transform="rotate(-90 110 110)"
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '2.6rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                  92%
                </span>
                <span style={{ fontSize: '0.72rem', color: '#FF8A1F', fontWeight: 700, letterSpacing: '0.05em' }}>
                  SIF POTENTIAL
                </span>
                <span style={{ fontSize: '0.68rem', color: '#736154', marginTop: '2px' }}>
                  HIGH RISK SCORE
                </span>
              </div>
            </div>
            <div style={{ marginTop: '16px', fontSize: '0.85rem', color: '#B3A194' }}>
              Calibrated Predictive Precursor Likelihood
            </div>
          </div>

          {/* Metric Cards Cluster */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div
              style={{
                backgroundColor: 'rgba(23, 17, 13, 0.85)',
                border: '1px solid rgba(51, 37, 28, 0.8)',
                borderRadius: '12px',
                padding: '20px',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#736154', fontFamily: 'monospace', fontWeight: 700 }}>
                PRECURSOR SIGNALS
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FF6A00', margin: '4px 0' }}>
                3 Active
              </div>
              <div style={{ fontSize: '0.78rem', color: '#B3A194' }}>
                Uncontrolled energy, line break, unbolted guard.
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(23, 17, 13, 0.85)',
                border: '1px solid rgba(51, 37, 28, 0.8)',
                borderRadius: '12px',
                padding: '20px',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#736154', fontFamily: 'monospace', fontWeight: 700 }}>
                BARRIER FAILURES
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FF6A00', margin: '4px 0' }}>
                2 Breaches
              </div>
              <div style={{ fontSize: '0.78rem', color: '#B3A194' }}>
                Lockout padlock omitted, pressure un-vented.
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(23, 17, 13, 0.85)',
                border: '1px solid rgba(51, 37, 28, 0.8)',
                borderRadius: '12px',
                padding: '20px',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#736154', fontFamily: 'monospace', fontWeight: 700 }}>
                PRECURSOR DENSITY
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F5EFEB', margin: '4px 0' }}>
                24.8%
              </div>
              <div style={{ fontSize: '0.78rem', color: '#B3A194' }}>
                SIF Potential vs Total Near-Miss Reports.
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(23, 17, 13, 0.85)',
                border: '1px solid rgba(51, 37, 28, 0.8)',
                borderRadius: '12px',
                padding: '20px',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#736154', fontFamily: 'monospace', fontWeight: 700 }}>
                MODEL CONFIDENCE
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F5EFEB', margin: '4px 0' }}>
                0.89
              </div>
              <div style={{ fontSize: '0.78rem', color: '#B3A194' }}>
                XGBoost Probability Calibration Index.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =============================================================
          8. SECTION 7: INTERACTIVE LIFE-SAVING RULES MAP
          ============================================================= */}
      <section
        id="rules"
        style={{
          padding: '90px 48px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#FF8A1F',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            IOGP 9 Life-Saving Rules Integration
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '8px 0 12px 0', color: '#FFFFFF' }}>
            Life-Saving Rule Mapping
          </h2>
          <p style={{ color: '#B3A194', maxWidth: '620px', margin: '0 auto', fontSize: '0.95rem' }}>
            Automatic semantic matching across the industry-standard rules governing oil &amp; gas safety.
          </p>
        </div>

        {/* Rule Selector Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            marginBottom: '24px',
            paddingBottom: '6px',
          }}
        >
          {LSR_RULES_DATA.map((rule) => {
            const isSelected = activeRuleId === rule.id;
            const Icon = rule.icon;
            return (
              <button
                key={rule.id}
                onClick={() => setActiveRuleId(rule.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? 'rgba(255, 106, 0, 0.15)' : 'rgba(23, 17, 13, 0.8)',
                  border: isSelected ? '1px solid #FF6A00' : '1px solid rgba(51, 37, 28, 0.7)',
                  color: isSelected ? '#FFFFFF' : '#B3A194',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} color={isSelected ? '#FF6A00' : '#736154'} />
                <span>{rule.name}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Rule Detail Card */}
        <div
          style={{
            backgroundColor: 'rgba(23, 17, 13, 0.85)',
            border: '1px solid rgba(51, 37, 28, 0.8)',
            borderRadius: '16px',
            padding: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontFamily: 'monospace',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 106, 0, 0.12)',
                  color: '#FF8A1F',
                  fontWeight: 700,
                }}
              >
                {selectedRule.code}
              </span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                {selectedRule.name}
              </h3>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#B3A194', fontFamily: 'monospace' }}>
              FLAGGED PRECURSORS: <strong style={{ color: '#FF6A00' }}>{selectedRule.precursorsFlagged} INCIDENTS</strong>
            </div>
          </div>

          <p style={{ fontSize: '1.02rem', color: '#F5EFEB', lineHeight: 1.6, margin: '0 0 20px 0' }}>
            {selectedRule.summary}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(51, 37, 28, 0.6)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: '#736154', fontFamily: 'monospace', fontWeight: 700 }}>
                MANDATED SAFETY BARRIERS
              </div>
              <div style={{ fontSize: '0.86rem', color: '#B3A194', marginTop: '4px' }}>
                {selectedRule.criteria}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#736154', fontFamily: 'monospace', fontWeight: 700 }}>
                HIGH-RISK REFINERY QUADRANT
              </div>
              <div style={{ fontSize: '0.86rem', color: '#FF8A1F', marginTop: '4px' }}>
                {selectedRule.oilZone}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =============================================================
          9. SECTION 8: PRECURSOR INTELLIGENCE (CONNECTED NETWORK)
          ============================================================= */}
      <section
        style={{
          padding: '80px 48px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#FF8A1F',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Causal Correlation Engine
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '8px 0 12px 0', color: '#FFFFFF' }}>
            Precursor Intelligence Network
          </h2>
          <p style={{ color: '#B3A194', maxWidth: '640px', margin: '0 auto', fontSize: '0.95rem' }}>
            How isolated variables correlate into severe injury precursors before an incident occurs.
          </p>
        </div>

        {/* Connected Node Chain */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            backgroundColor: 'rgba(18, 13, 9, 0.65)',
            border: '1px solid rgba(51, 37, 28, 0.8)',
            borderRadius: '16px',
            padding: '36px 28px',
            overflowX: 'auto',
          }}
        >
          {[
            { step: 'ACTIVITY', title: 'Centrifugal Overhaul', desc: 'Mechanical pump skid maintenance', tag: 'High-Energy Task' },
            { step: 'LOCATION', title: 'Pump Station (Z-02)', desc: 'Hydrocarbon transfer manifold', tag: 'Restricted Area' },
            { step: 'BARRIER BREACH', title: 'LOTO Lockout Omission', desc: 'Physical padlock missing from hasp', tag: 'Critical Failure' },
            { step: 'SIF OUTCOME', title: 'HIGH SIF PRECURSOR', desc: 'Amputation / Fatality Potential', tag: '92% Confidence' },
          ].map((node, idx) => (
            <React.Fragment key={idx}>
              <div
                style={{
                  flex: 1,
                  minWidth: '200px',
                  backgroundColor: 'rgba(23, 17, 13, 0.9)',
                  border: idx === 3 ? '1px solid #FF6A00' : '1px solid rgba(51, 37, 28, 0.8)',
                  borderRadius: '12px',
                  padding: '18px',
                }}
              >
                <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#736154', fontWeight: 700 }}>
                  {node.step}
                </div>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: idx === 3 ? '#FF6A00' : '#FFFFFF', margin: '4px 0' }}>
                  {node.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#B3A194', marginBottom: '8px' }}>
                  {node.desc}
                </div>
                <span
                  style={{
                    fontSize: '0.64rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: idx === 3 ? 'rgba(255, 106, 0, 0.15)' : 'rgba(51, 37, 28, 0.5)',
                    color: idx === 3 ? '#FF8A1F' : '#B3A194',
                  }}
                >
                  {node.tag}
                </span>
              </div>
              {idx < 3 && (
                <div style={{ color: '#FF6A00', display: 'flex', alignItems: 'center' }}>
                  <ArrowRight size={20} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* =============================================================
          10. SECTION 9: BEFORE VS SIF-GUARD
          ============================================================= */}
      <section
        style={{
          padding: '80px 48px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#FF8A1F',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Paradigm Shift
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '8px 0 12px 0', color: '#FFFFFF' }}>
            Traditional HSSE vs. SIF-Guard Foresight
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Traditional */}
          <div
            style={{
              backgroundColor: 'rgba(23, 17, 13, 0.6)',
              border: '1px solid rgba(51, 37, 28, 0.7)',
              borderRadius: '16px',
              padding: '32px',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#736154', fontWeight: 700, marginBottom: '12px' }}>
              TRADITIONAL HSSE WORKFLOW
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#B3A194', margin: '0 0 16px 0' }}>
              Lagging &amp; Retrospective
            </h3>
            <ul style={{ paddingLeft: '18px', color: '#B3A194', fontSize: '0.88rem', lineHeight: 1.8, margin: 0 }}>
              <li>Focuses primarily on actual lost-time injury statistics.</li>
              <li>Near-miss reports with zero harm are archived without deep precursor analysis.</li>
              <li>Manual review audits take 3–6 weeks; patterns remain undiscovered.</li>
              <li>Corrective actions happen retroactively after serious harm occurs.</li>
            </ul>
          </div>

          {/* SIF-Guard */}
          <div
            style={{
              backgroundColor: 'rgba(255, 106, 0, 0.05)',
              border: '1px solid rgba(255, 106, 0, 0.3)',
              borderRadius: '16px',
              padding: '32px',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#FF8A1F', fontWeight: 700, marginBottom: '12px' }}>
              SIF-GUARD PRECURSOR ENGINE
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 16px 0' }}>
              Proactive Foresight
            </h3>
            <ul style={{ paddingLeft: '18px', color: '#F5EFEB', fontSize: '0.88rem', lineHeight: 1.8, margin: 0 }}>
              <li>Enforces: <code style={{ color: '#FF8A1F' }}>Actual Outcome != Potential Outcome</code>.</li>
              <li>Near-misses with fatal mechanisms are surfaced within seconds.</li>
              <li>Semantic NLP maps incidents automatically to IOGP Life-Saving Rules.</li>
              <li>Enables immediate barrier reinforcement before catastrophic release.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* =============================================================
          11. SECTION 10: INTERACTIVE AI OBSERVATION DEMO
          ============================================================= */}
      <section
        id="demo"
        style={{
          padding: '90px 48px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#FF8A1F',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Live Evaluation Sandbox
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '8px 0 12px 0', color: '#FFFFFF' }}>
            Analyze a Safety Observation
          </h2>
          <p style={{ color: '#B3A194', maxWidth: '620px', margin: '0 auto', fontSize: '0.95rem' }}>
            Select an operational oilfield observation or enter custom narrative to test the AI model.
          </p>
        </div>

        <div
          style={{
            backgroundColor: 'rgba(18, 13, 9, 0.8)',
            border: '1px solid rgba(51, 37, 28, 0.85)',
            borderRadius: '18px',
            padding: '32px',
          }}
        >
          {/* Quick Preset Buttons */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '18px' }}>
            <span style={{ fontSize: '0.74rem', color: '#736154', alignSelf: 'center', fontFamily: 'monospace' }}>
              SAMPLES:
            </span>
            {DEMO_SAMPLES.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDemoInput(sample.text);
                  setDemoResult(sample);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: demoInput === sample.text ? 'rgba(255, 106, 0, 0.15)' : 'rgba(23, 17, 13, 0.8)',
                  border: demoInput === sample.text ? '1px solid #FF6A00' : '1px solid rgba(51, 37, 28, 0.7)',
                  color: demoInput === sample.text ? '#FFFFFF' : '#B3A194',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {sample.title}
              </button>
            ))}
          </div>

          {/* Text Input Area & Action */}
          <div style={{ marginBottom: '24px' }}>
            <textarea
              value={demoInput}
              onChange={(e) => setDemoInput(e.target.value)}
              rows={3}
              placeholder="Enter an unsafe act, condition, or near-miss narrative..."
              style={{
                width: '100%',
                padding: '14px 18px',
                fontSize: '0.92rem',
                backgroundColor: 'rgba(11, 8, 6, 0.9)',
                border: '1px solid rgba(51, 37, 28, 0.85)',
                borderRadius: '10px',
                color: '#F5EFEB',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                onClick={handleRunDemoAnalysis}
                disabled={isAnalyzing || !demoInput.trim()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 24px',
                  borderRadius: '8px',
                  backgroundColor: '#FF6A00',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                }}
              >
                {isAnalyzing ? (
                  <span>Evaluating NLP Precursor Embeddings...</span>
                ) : (
                  <>
                    <span>Analyze Observation</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Output */}
          {demoResult && (
            <div
              style={{
                backgroundColor: 'rgba(23, 17, 13, 0.9)',
                border: '1px solid rgba(255, 106, 0, 0.3)',
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#736154', fontFamily: 'monospace', fontWeight: 700 }}>
                    SIF POTENTIAL SCORE
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FF6A00', margin: '4px 0' }}>
                    {demoResult.sif} ({demoResult.score})
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#B3A194' }}>Flagged Precursor Mechanism</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', color: '#736154', fontFamily: 'monospace', fontWeight: 700 }}>
                    LIFE-SAVING RULE
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', margin: '4px 0' }}>
                    {demoResult.rule}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#B3A194' }}>Semantic Match &gt; 0.85</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', color: '#736154', fontFamily: 'monospace', fontWeight: 700 }}>
                    PRIMARY BARRIER BREACH
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FF8A1F', margin: '4px 0' }}>
                    {demoResult.barrier}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#B3A194' }}>Mandated Control Failure</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', color: '#736154', fontFamily: 'monospace', fontWeight: 700 }}>
                    IDENTIFIED PRECURSOR
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#F5EFEB', margin: '4px 0', lineHeight: 1.4 }}>
                    {demoResult.precursor}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =============================================================
          12. SECTION 11: DASHBOARD PREVIEW
          ============================================================= */}
      <section
        style={{
          padding: '80px 48px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#FF8A1F',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Live Operational System
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '8px 0 12px 0', color: '#FFFFFF' }}>
            The SIF-Guard Platform
          </h2>
          <p style={{ color: '#B3A194', maxWidth: '600px', margin: '0 auto', fontSize: '0.95rem' }}>
            Built for enterprise safety leaders, inspectors, and operations managers.
          </p>
        </div>

        <div
          style={{
            backgroundColor: 'rgba(18, 13, 9, 0.85)',
            border: '1px solid rgba(51, 37, 28, 0.8)',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 24px 64px -16px rgba(0, 0, 0, 0.8)',
          }}
        >
          {/* Simulated App Header */}
          <div
            style={{
              padding: '12px 24px',
              backgroundColor: 'rgba(11, 8, 6, 0.95)',
              borderBottom: '1px solid rgba(51, 37, 28, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#E85D5D' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FFB347' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#20D997' }} />
              <span style={{ marginLeft: '12px', fontSize: '0.76rem', fontFamily: 'monospace', color: '#736154' }}>
                https://sif-guard.oilindia.in/dashboard
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#FF8A1F', fontWeight: 700 }}>
              AUTH PROTECTED · SUPABASE LIVE
            </span>
          </div>

          {/* Platform Preview Body */}
          <div style={{ padding: '36px', textAlign: 'center' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '28px',
                textAlign: 'left',
              }}
            >
              {[
                { label: 'SIF Precursor Density', val: '24.8%', sub: '+3.2% vs baseline' },
                { label: 'Unsafe Acts Ingested', val: '1,420', sub: '98% classified' },
                { label: 'Critical Site Hotspots', val: '3 Sites', sub: 'Z-02, Z-04, Z-06' },
                { label: 'LSR Adherence Index', val: '86.4%', sub: 'Target: 95%' },
              ].map((kpi, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(23, 17, 13, 0.9)',
                    border: '1px solid rgba(51, 37, 28, 0.7)',
                    borderRadius: '10px',
                    padding: '16px',
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: '#736154', fontWeight: 600 }}>{kpi.label}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: '4px 0' }}>{kpi.val}</div>
                  <div style={{ fontSize: '0.68rem', color: '#FF8A1F' }}>{kpi.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: '20px 0' }}>
              <button
                onClick={onEnterPlatform}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 32px',
                  borderRadius: '10px',
                  backgroundColor: '#FF6A00',
                  color: '#FFFFFF',
                  fontSize: '1rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 24px rgba(255, 106, 0, 0.35)',
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
                <span>Enter Intelligence Platform</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =============================================================
          13. SECTION 12: FINAL MINIMAL CTA
          ============================================================= */}
      <section
        style={{
          padding: '120px 48px 100px 48px',
          maxWidth: '900px',
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 106, 0, 0.12)',
            border: '1px solid rgba(255, 106, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FF6A00',
            margin: '0 auto 28px auto',
          }}
        >
          <ShieldAlert size={26} />
        </div>

        <h2
          style={{
            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            color: '#FFFFFF',
            margin: '0 0 16px 0',
          }}
        >
          Turn safety observations
          <br />
          <span
            style={{
              background: 'linear-gradient(180deg, #FFFFFF 20%, #FF6A00 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            into foresight.
          </span>
        </h2>

        <p
          style={{
            fontSize: '1.1rem',
            color: '#B3A194',
            maxWidth: '560px',
            margin: '0 auto 36px auto',
            lineHeight: 1.6,
          }}
        >
          SIF-Guard — Precursor Intelligence &amp; HSSE Safety Platform for Oil India Limited.
        </p>

        <button
          onClick={onEnterPlatform}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 36px',
            borderRadius: '10px',
            backgroundColor: '#FF6A00',
            color: '#FFFFFF',
            fontSize: '1rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(255, 106, 0, 0.35)',
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
          <span>Enter SIF-Guard</span>
          <span style={{ fontSize: '1.1rem' }}>↗</span>
        </button>
      </section>

      {/* =============================================================
          14. FOOTER
          ============================================================= */}
      <footer
        style={{
          borderTop: '1px solid rgba(51, 37, 28, 0.7)',
          padding: '40px 48px',
          backgroundColor: '#0B0806',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
            fontSize: '0.8rem',
            color: '#736154',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, color: '#F5EFEB', marginBottom: '4px' }}>
              SIF-Guard — Serious Injury &amp; Fatality Precursor Intelligence Platform
            </div>
            <div>Developed for Oil India Limited · Smart India Hackathon 2026 (Problem Statement 165)</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ color: '#B3A194' }}>FastAPI</span>
            <span style={{ color: '#B3A194' }}>Three.js WebGL</span>
            <span style={{ color: '#B3A194' }}>Supabase Auth</span>
            <span style={{ color: '#B3A194' }}>BAAI/bge-base</span>
            <span style={{ color: '#FF6A00' }}>© 2026 SIF-Guard Team</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
