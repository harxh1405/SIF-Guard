import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Sun,
  Moon,
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
import { useSmoothScroll } from '../hooks/useSmoothScroll';
import { StaggeredText } from '../components/common/StaggeredText';
import { MagneticButton } from '../components/common/MagneticButton';
import { CountUpNumber } from '../components/common/CountUpNumber';
import { ScrollReveal } from '../components/common/ScrollReveal';
import { ParallaxCard } from '../components/common/ParallaxCard';

interface LandingPageProps {
  onEnterPlatform: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
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

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterPlatform,
  theme = 'dark',
  onToggleTheme,
}) => {
  const isLight = theme === 'light';

  // SIF-Guard Industrial Theme Palette
  const t = {
    bg: isLight ? '#F5F2EB' : '#080706',
    bgSection: isLight ? '#EAE5DB' : '#0D0B09',
    bgCard: isLight ? '#FAF8F5' : '#12100E',
    bgCardSolid: isLight ? '#FAF8F5' : '#12100E',
    bgCardSubtle: isLight ? '#EFEAE0' : '#0D0B09',
    bgElevated: isLight ? '#FFFFFF' : '#171411',
    bgHeader: isLight ? 'rgba(245, 242, 235, 0.92)' : 'rgba(8, 7, 6, 0.88)',
    border: isLight ? 'rgba(195, 182, 168, 0.75)' : 'rgba(255, 255, 255, 0.08)',
    borderSubtle: isLight ? 'rgba(195, 182, 168, 0.45)' : 'rgba(255, 255, 255, 0.05)',
    textPrimary: isLight ? '#1C1815' : '#F5F1EA',
    textSecondary: isLight ? '#554B41' : '#A8A099',
    textMuted: isLight ? '#82766B' : '#716B64',
    accent: '#FF7300',
    accentHover: '#FF8A2A',
    accentSoft: '#FF8A2A',
    accentBright: isLight ? '#E65F00' : '#FF8A2A',
    cardShadow: isLight ? '0 4px 20px rgba(35, 28, 22, 0.06)' : '0 8px 32px rgba(0, 0, 0, 0.45)',
  };
  const [zones, setZones] = useState<FacilityZone[]>(FALLBACK_ZONES);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Lenis smooth scroll engine with canvas wheel isolation
  useSmoothScroll();

  const [heroMounted, setHeroMounted] = useState(false);
  const [activePipelineStage, setActivePipelineStage] = useState(0);
  const [activeStoryStep, setActiveStoryStep] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setHeroMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

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

  const [scrollY, setScrollY] = useState(0);

  // Monitor scroll for navbar styling and hero DOM receding transform
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          setIsScrolled(window.scrollY > 30);
          ticking = false;
        });
        ticking = true;
      }
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

  // DOM wrapper receding transform on scroll (leaves Three.js camera untouched)
  const heroRecede = Math.min(1, Math.max(0, scrollY / 600));
  const wrapperScale = (1 - heroRecede * 0.04).toFixed(4); // 1.0 -> 0.96
  const wrapperTranslateY = (-heroRecede * 30).toFixed(1);
  const wrapperOpacity = (1 - heroRecede * 0.08).toFixed(3); // stays high: 1.0 -> 0.92
  const headlineTranslateY = (-heroRecede * 36).toFixed(1); // headline: translateY(0 -> -36px)
  const telemetryOpacity = (1 - heroRecede * 0.25).toFixed(3); // telemetry: subtle fade

  return (
    <div
      className="bg-micro-grid"
      style={{
        backgroundColor: t.bg,
        color: t.textPrimary,
        transition: 'background-color 0.25s ease, color 0.25s ease',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        position: 'relative',
      }}
    >
      {/* Background Ambient Telemetry Canvas */}
      <AmbientTelemetryCanvas theme={theme} />
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
          backgroundColor: isScrolled ? t.bgHeader : 'transparent',
          backdropFilter: isScrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(16px)' : 'none',
          borderBottom: isScrolled ? ('1px solid ' + t.border) : '1px solid transparent',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              backgroundColor: 'rgba(255, 115, 0, 0.12)',
              border: '1px solid rgba(255, 115, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: t.accent,
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
                color: t.textPrimary,
              }}
            >
              SIF-GUARD
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 115, 0, 0.08)',
                color: t.accentBright,
                fontWeight: 700,
                letterSpacing: '0.06em',
                border: '1px solid rgba(255, 115, 0, 0.22)',
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
              className="nav-link-btn"
              style={{
                color: t.textSecondary,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = t.textPrimary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = t.textSecondary)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Navbar Actions: Theme Toggle & Enter Platform */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onToggleTheme}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle light or dark theme"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid ' + t.border,
              color: isLight ? '#5C5248' : t.accentSoft,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = t.accent;
              e.currentTarget.style.color = t.accent;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = t.border;
              e.currentTarget.style.color = isLight ? '#5C5248' : t.accentSoft;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isLight ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          <button
            onClick={onEnterPlatform}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 115, 0, 0.12)',
              border: '1px solid rgba(255, 115, 0, 0.35)',
              color: t.accentBright,
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = t.accent;
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 115, 0, 0.12)';
              e.currentTarget.style.color = t.accentBright;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>Enter Platform</span>
            <span style={{ fontSize: '0.9rem' }}>↗</span>
          </button>
        </div>
      </header>

      {/* =============================================================
          2. HERO SECTION — CENTERED INDUSTRIAL COMPOSITION
          ============================================================= */}
      <section
        style={{
          position: 'relative',
          padding: '120px 24px 20px 24px',
          maxWidth: '1440px',
          margin: '0 auto',
          minHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxSizing: 'border-box',
          zIndex: 2,
        }}
      >
        {/* Ghost Watermark Background Phase */}
        <div
          className="ghost-watermark-text"
          style={{
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 'clamp(4.5rem, 11vw, 9rem)',
            whiteSpace: 'nowrap',
          }}
        >
          01 // OBSERVE
        </div>

        {/* 1. Eyebrow badge with restrained status beacon */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '9999px',
            backgroundColor: isLight ? 'rgba(255, 115, 0, 0.08)' : 'rgba(255, 115, 0, 0.08)',
            border: '1px solid rgba(255, 115, 0, 0.25)',
            marginBottom: '20px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: t.accent,
              boxShadow: '0 0 8px rgba(255, 115, 0, 0.6)',
              animation: 'beacon-pulse 2s infinite',
            }}
          />
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: t.accentSoft,
              textTransform: 'uppercase',
            }}
          >
            SIF PRECURSOR INTELLIGENCE · OIL INDIA LIMITED · SIH 2026
          </span>
        </div>

        {/* 2. Dominant Centered Headline with Staggered 3D Reveal */}
        <StaggeredText
          as="h1"
          lines={['Predict the incident.', 'Before it becomes one.']}
          delayMs={140}
          staggerMs={130}
          style={{
            fontSize: 'clamp(3.5rem, 6vw, 6.5rem)',
            fontWeight: 800,
            lineHeight: 1.04,
            letterSpacing: '-0.045em',
            color: t.textPrimary,
            margin: '0 auto 20px auto',
            maxWidth: '820px',
            position: 'relative',
            zIndex: 2,
            transform: `translateY(${headlineTranslateY}px)`,
            transition: 'transform 0.1s linear',
          }}
          lineStyles={(idx) =>
            idx === 1
              ? { color: t.textSecondary, fontWeight: 700 }
              : { color: t.textPrimary, fontWeight: 800 }
          }
        />

        {/* 3. Centered Description (Sequential Reveal) */}
        <p
          style={{
            fontSize: 'clamp(1rem, 1.25vw, 1.15rem)',
            color: t.textSecondary,
            lineHeight: 1.65,
            maxWidth: '720px',
            margin: '0 auto 32px auto',
            fontWeight: 400,
            position: 'relative',
            zIndex: 2,
            opacity: heroMounted ? 1 : 0,
            transform: heroMounted ? 'translateY(0)' : 'translateY(18px)',
            filter: heroMounted ? 'blur(0px)' : 'blur(4px)',
            transition:
              'opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.32s, transform 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.32s, filter 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.32s',
            willChange: heroMounted ? 'auto' : 'transform, opacity, filter',
          }}
        >
          SIF-Guard transforms unstructured safety observations into actionable precursor
          intelligence — identifying SIF potential, Life-Saving Rules, and recurring barrier failures
          before they escalate into serious injuries or fatalities.
        </p>

        {/* 4. Interactive Magnetic CTA Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            flexWrap: 'wrap',
            marginBottom: '32px',
            position: 'relative',
            zIndex: 2,
            opacity: heroMounted ? 1 : 0,
            transform: heroMounted ? 'translateY(0)' : 'translateY(14px)',
            transition:
              'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.44s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.44s',
          }}
        >
          <MagneticButton
            variant="primary"
            theme={theme}
            onClick={() => scrollToSection('signals')}
            icon={<ArrowRight size={17} />}
          >
            Explore Intelligence
          </MagneticButton>

          <MagneticButton
            variant="secondary"
            theme={theme}
            onClick={onEnterPlatform}
            icon={<span style={{ color: t.accent }}>↗</span>}
          >
            Enter Platform
          </MagneticButton>
        </div>

        {/* 5. Live Facility Telemetry Strip with Numeric Reveals — DIRECTLY BELOW CTAs */}
        <div
          className="telemetry-hud-container"
          style={{
            marginBottom: '36px',
            position: 'relative',
            zIndex: 2,
            opacity: heroMounted ? Number(telemetryOpacity) : 0,
            transform: heroMounted ? 'translateY(0)' : 'translateY(12px)',
            transition:
              'opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.52s, transform 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.52s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: t.accent,
                boxShadow: '0 0 8px rgba(255, 115, 0, 0.7)',
                animation: 'beacon-pulse 2s infinite',
              }}
            />
            <span style={{ color: t.accentSoft, fontWeight: 700 }}>
              LIVE FACILITY TELEMETRY STREAM
            </span>
          </div>
          <span style={{ color: t.border }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: t.textMuted }}>QUADRANTS:</span>
            <span style={{ color: t.textPrimary, fontWeight: 700 }}>
              <CountUpNumber value={zones.length > 0 ? zones.length : 7} suffix=" ZONES" /> ACTIVE
            </span>
          </div>
          <span style={{ color: t.border }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: t.textMuted }}>FIDELITY:</span>
            <span style={{ color: '#20D997', fontWeight: 700 }}>
              <CountUpNumber value={98.7} decimals={1} suffix="%" />
            </span>
          </div>
          <span style={{ color: t.border }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: t.textMuted }}>FATALITY ESCALATION:</span>
            <span style={{ color: '#20D997', fontWeight: 700 }}>
              <CountUpNumber value={0} suffix=" INCIDENTS" />
            </span>
          </div>
          <span style={{ color: t.border }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: t.accentSoft, fontWeight: 600 }}>
              <CountUpNumber value={12} suffix=" PRECURSOR SIGNALS" />
            </span>
          </div>
        </div>

        {/* 6. Centered 3D Refinery Digital Twin Centerpiece — DIRECTLY BELOW HUD */}
        <div
          style={{
            position: 'relative',
            width: 'min(1480px, 94vw)',
            height: 'clamp(620px, 72vh, 820px)',
            margin: '0 auto',
            borderRadius: '0',
            overflow: 'visible',
            border: 'none',
            boxShadow: 'none',
            backgroundColor: 'transparent',
            maskImage:
              'linear-gradient(180deg, black 0%, black 48%, rgba(0, 0, 0, 0.9) 64%, rgba(0, 0, 0, 0.5) 80%, rgba(0, 0, 0, 0.15) 92%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(180deg, black 0%, black 48%, rgba(0, 0, 0, 0.9) 64%, rgba(0, 0, 0, 0.5) 80%, rgba(0, 0, 0, 0.15) 92%, transparent 100%)',
            zIndex: 2,
            opacity: heroMounted ? Number(wrapperOpacity) : 0,
            transform: heroMounted
              ? `translateY(${wrapperTranslateY}px) scale(${wrapperScale})`
              : 'translateY(36px) scale(0.94)',
            transition: heroMounted
              ? 'opacity 0.3s ease'
              : 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
            willChange: 'transform, opacity',
          }}
        >
          {/* Subtle soft ambient back-glow behind the 3D facility */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 50% 50%, rgba(255, 115, 0, 0.08) 0%, rgba(255, 115, 0, 0.015) 55%, transparent 75%)',
              filter: 'blur(50px)',
              pointerEvents: 'none',
            }}
          />

          {/* Real 3D Refinery Canvas with OrbitControls, Damping, and minimal overlay */}
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <RefineryCanvas
              zones={zones}
              selectedZoneId={selectedZoneId}
              onSelectZone={(id) => setSelectedZoneId(id)}
              hoveredZoneId={hoveredZoneId}
              onHoverZone={(id) => setHoveredZoneId(id)}
              activeIncidents={[]}
              theme={theme}
              minimalOverlay={true}
              transparentBg={true}
            />
          </div>

          {/* Extremely gradual bottom atmospheric blend overlay — dissolves 3D floor into page background */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '160px',
              background: `linear-gradient(to bottom, transparent 0%, ${isLight ? 'rgba(245, 242, 235, 0.25)' : 'rgba(8, 7, 6, 0.25)'} 30%, ${isLight ? 'rgba(245, 242, 235, 0.70)' : 'rgba(8, 7, 6, 0.70)'} 65%, ${t.bg} 100%)`,
              pointerEvents: 'none',
              zIndex: 5,
            }}
          />
        </div>

        {/* 7. Animated Visual Telemetry Conduit & Scroll Flow */}
        <div style={{ marginTop: '12px', position: 'relative', zIndex: 2 }}>
          <div className="conduit-stream-line" />
          <div
            style={{
              marginTop: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              opacity: 0.85,
              transition: 'opacity 0.25s ease',
              userSelect: 'none',
            }}
            onClick={() => scrollToSection('signals')}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
          >
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: t.textMuted,
                fontFamily: 'monospace',
                textTransform: 'uppercase',
              }}
            >
              Scroll to Explore Precursor Intelligence
            </span>
            <span
              style={{
                color: t.accent,
                fontSize: '1rem',
                lineHeight: 1,
                opacity: 0.9,
              }}
            >
              ↓
            </span>
          </div>
        </div>
      </section>

      {/* =============================================================
          3. SECTION 2: SAFETY REPORTS CONTAIN SIGNALS
          ============================================================= */}
      <section
        id="signals"
        style={{
          position: 'relative',
          padding: '48px 48px 80px 48px',
          maxWidth: '1280px',
          margin: '0 auto',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Ghost Watermark */}
        <div
          className="ghost-watermark-text"
          style={{
            top: '20px',
            right: '2%',
            fontSize: 'clamp(3.8rem, 9vw, 7.5rem)',
          }}
        >
          01 // SIGNALS
        </div>

        <ScrollReveal>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 115, 0, 0.08)',
              border: '1px solid rgba(255, 115, 0, 0.25)',
              color: t.accentSoft,
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '20px',
              position: 'relative',
              zIndex: 2,
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
              color: t.textPrimary,
              margin: '0 0 10px 0',
              position: 'relative',
              zIndex: 2,
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
              color: t.accent,
              margin: '0 0 24px 0',
              position: 'relative',
              zIndex: 2,
            }}
          >
            We surface them.
          </h2>

          <p
            style={{
              fontSize: '1.05rem',
              color: t.textSecondary,
              maxWidth: '680px',
              margin: '0 auto 48px auto',
              lineHeight: 1.6,
              position: 'relative',
              zIndex: 2,
            }}
          >
            Across drilling platforms, compressor skids, and pipeline right-of-ways, front-line teams
            log observations every day. When an event results in zero injury, it is often filed away.
            SIF-Guard recognizes that the precursor was fatal.
          </p>
        </ScrollReveal>

        {/* Streaming Observation Cards with Parallax & Sequential Stagger */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
            textAlign: 'left',
            position: 'relative',
            zIndex: 2,
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
          ].map((card, idx) => (
            <ScrollReveal key={card.id} delayMs={idx * 100}>
              <ParallaxCard
                theme={theme}
                style={{
                  backgroundColor: t.bgCard,
                  border: '1px solid ' + t.border,
                  boxShadow: t.cardShadow,
                  borderRadius: '14px',
                  padding: '24px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: t.textMuted, fontFamily: 'monospace' }}>
                    {card.id} · {card.type}
                  </span>
                  <span
                    style={{
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      color: t.accentSoft,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 115, 0, 0.1)',
                      border: '1px solid rgba(255, 115, 0, 0.25)',
                    }}
                  >
                    {card.flag}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: t.textPrimary, lineHeight: 1.55, margin: '0 0 16px 0' }}>
                  &ldquo;{card.narrative}&rdquo;
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid ' + t.borderSubtle,
                    fontSize: '0.76rem',
                  }}
                >
                  <span style={{ color: t.textSecondary }}>{card.zone}</span>
                  <span style={{ color: t.accent, fontWeight: 600 }}>{card.signal}</span>
                </div>
              </ParallaxCard>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* =============================================================
          4. SECTION 3: THE AI EXTRACTION ENGINE (5-STAGE CONNECTED PIPELINE)
          ============================================================= */}
      <section
        style={{
          position: 'relative',
          padding: '90px 48px',
          maxWidth: '1360px',
          margin: '0 auto',
          overflow: 'hidden',
        }}
      >
        {/* Ghost Watermark */}
        <div
          className="ghost-watermark-text"
          style={{
            top: '20px',
            left: '2%',
            fontSize: 'clamp(3.8rem, 9vw, 7.5rem)',
          }}
        >
          02 // UNDERSTAND
        </div>

        <ScrollReveal>
          <div
            style={{
              backgroundColor: t.bgSection,
              border: '1px solid ' + t.border,
              borderRadius: '24px',
              padding: '48px 36px',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: t.accentSoft,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                The AI Extraction Engine
              </span>
              <h2 style={{ fontSize: '2.1rem', fontWeight: 800, margin: '8px 0 12px 0', color: t.textPrimary }}>
                5-Stage Precursor Intelligence Pipeline
              </h2>
              <p style={{ color: t.textSecondary, maxWidth: '680px', margin: '0 auto', fontSize: '0.98rem' }}>
                How SIF-Guard ingests raw field narratives, expands oilfield acronyms, computes dense embeddings, and calibrates SIF foresight.
              </p>
            </div>

            {/* Top Animated Telemetry Flow Conduit Bar */}
            <div className="pipeline-track-connector" style={{ marginBottom: '24px', borderRadius: '1px' }} />

            {/* Connected 5-Stage Transformation Track */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: '16px',
                position: 'relative',
              }}
            >
              {[
                {
                  step: '01',
                  title: 'Raw Observation',
                  tag: 'INPUT STREAM',
                  code: 'FIELD LOG',
                  desc: 'Captures unstructured unsafe acts, conditions, and near-miss logs across remote rigs and platform operations.',
                },
                {
                  step: '02',
                  title: 'Acronym Resolution',
                  tag: 'NORMALIZATION',
                  code: 'LOTO / PTW / H2S',
                  desc: 'Domain cleaner expands technical acronyms and oilfield terminology to unify semantic representation.',
                },
                {
                  step: '03',
                  title: 'Dense Embeddings',
                  tag: 'VECTORIZATION',
                  code: '768-D BAAI/bge-base',
                  desc: 'Maps text to dense vector space combined with 16 engineered high-energy and barrier degradation flags.',
                },
                {
                  step: '04',
                  title: 'XGBoost + CatBoost Ensemble',
                  tag: 'PREDICTIVE ENSEMBLE',
                  code: 'HYBRID ML v1.1.0',
                  desc: 'Evaluates multi-class SIF potential with dual-model consensus weighting and SHAP explainability.',
                },
                {
                  step: '05',
                  title: 'SIF Foresight',
                  tag: 'OPERATIONAL DECISION',
                  code: 'LSR & BARRIER DEFENSE',
                  desc: 'Surfaces precursor mechanism, identifies failing barrier integrity, and alerts frontline supervisors in real time.',
                },
              ].map((stage, idx) => {
                const isActive = activePipelineStage === idx;
                return (
                  <div
                    key={stage.step}
                    onClick={() => setActivePipelineStage(idx)}
                    onMouseEnter={() => setActivePipelineStage(idx)}
                    style={{
                      backgroundColor: t.bgCard,
                      border: isActive
                        ? '1px solid ' + t.accent
                        : '1px solid ' + t.border,
                      boxShadow: isActive
                        ? '0 8px 30px rgba(255, 115, 0, 0.18)'
                        : t.cardShadow,
                      borderRadius: '14px',
                      padding: '22px',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '14px',
                        }}
                      >
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '7px',
                            backgroundColor: isActive ? t.accent : 'rgba(255, 115, 0, 0.12)',
                            color: isActive ? '#FFFFFF' : t.accent,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            fontFamily: 'monospace',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {stage.step}
                        </div>
                        <span
                          style={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            color: isActive ? (isLight ? '#E65F00' : '#FFFFFF') : t.accentSoft,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: isActive ? 'rgba(255, 115, 0, 0.18)' : 'rgba(255, 115, 0, 0.08)',
                            border: '1px solid rgba(255, 115, 0, 0.2)',
                          }}
                        >
                          {stage.tag}
                        </span>
                      </div>
                      <h3
                        style={{
                          fontSize: '1rem',
                          fontWeight: 700,
                          margin: '0 0 8px 0',
                          color: isActive ? t.accent : t.textPrimary,
                          transition: 'color 0.2s ease',
                        }}
                      >
                        {stage.title}
                      </h3>
                      <p
                        style={{
                          fontSize: '0.82rem',
                          color: t.textSecondary,
                          lineHeight: 1.5,
                          margin: '0 0 14px 0',
                        }}
                      >
                        {stage.desc}
                      </p>
                    </div>
                    <div
                      style={{
                        paddingTop: '10px',
                        borderTop: '1px solid ' + t.borderSubtle,
                        fontSize: '0.68rem',
                        fontFamily: 'monospace',
                        color: t.textMuted,
                      }}
                    >
                      <code style={{ color: isActive ? t.accentBright : t.accentSoft }}>
                        {stage.code}
                      </code>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* =============================================================
          5. SECTION 4: HOW SIF-GUARD WORKS (SCROLL-PINNED STORYTELLING)
          ============================================================= */}
      <section
        id="workflow"
        style={{
          position: 'relative',
          padding: '100px 48px',
          maxWidth: '1360px',
          margin: '0 auto',
        }}
      >
        {/* Ghost Watermark */}
        <div
          className="ghost-watermark-text"
          style={{
            top: '20px',
            right: '2%',
            fontSize: 'clamp(3.8rem, 9vw, 7.5rem)',
          }}
        >
          03 // OPERATE
        </div>

        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: '56px', position: 'relative', zIndex: 2 }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: t.accentSoft,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              End-to-End System Architecture
            </span>
            <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 800, margin: '8px 0 14px 0', color: t.textPrimary }}>
              How SIF-Guard Operates
            </h2>
            <p style={{ color: t.textSecondary, maxWidth: '640px', margin: '0 auto', fontSize: '1.02rem' }}>
              Six coordinated intelligence stages transforming raw field notes into preventive operational decisions.
            </p>
          </div>
        </ScrollReveal>

        {/* Pinned Story Grid: Left Sticky Navigator, Right Technical Stage Cards */}
        <div
          className="pinned-story-layout"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 340px) 1fr',
            gap: '40px',
            alignItems: 'start',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Left Pinned Story Navigation */}
          <div className="pinned-story-nav">
            <div
              style={{
                backgroundColor: t.bgSection,
                border: '1px solid ' + t.border,
                borderRadius: '16px',
                padding: '24px 20px',
                boxShadow: t.cardShadow,
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: t.textMuted,
                  letterSpacing: '0.08em',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: t.accent }} />
                Operational Loop
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { step: '01', title: 'INGEST', subtitle: 'Multi-format Safety Report Ingestion' },
                  { step: '02', title: 'UNDERSTAND', subtitle: 'Domain NLP acronyms' },
                  { step: '03', title: 'CLASSIFY', subtitle: 'Actual != Potential outcome' },
                  { step: '04', title: 'MAP', subtitle: 'IOGP 9 Life-Saving Rules' },
                  { step: '05', title: 'DISCOVER', subtitle: 'HDBSCAN cluster patterns' },
                  { step: '06', title: 'ACT', subtitle: 'Precursor density & alerts' },
                ].map((item, idx) => {
                  const isActive = activeStoryStep === idx;
                  return (
                    <div
                      key={item.step}
                      onClick={() => {
                        setActiveStoryStep(idx);
                        const el = document.getElementById(`story-card-${idx}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: isActive
                          ? (isLight ? 'rgba(255, 115, 0, 0.12)' : 'rgba(255, 115, 0, 0.14)')
                          : 'transparent',
                        border: isActive
                          ? '1px solid ' + (isLight ? 'rgba(255, 115, 0, 0.35)' : 'rgba(255, 115, 0, 0.3)')
                          : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          color: isActive ? t.accent : t.textMuted,
                          minWidth: '24px',
                        }}
                      >
                        {item.step}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: isActive ? 700 : 600,
                            color: isActive ? t.textPrimary : t.textSecondary,
                            letterSpacing: '0.02em',
                          }}
                        >
                          {item.title}
                        </div>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            color: isActive ? t.accentSoft : t.textMuted,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.subtitle}
                        </div>
                      </div>
                      {isActive && (
                        <span
                          style={{
                            width: '3px',
                            height: '18px',
                            borderRadius: '2px',
                            backgroundColor: t.accent,
                            boxShadow: '0 0 8px rgba(255, 115, 0, 0.6)',
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Technical Stage Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {[
              {
                step: '01',
                title: 'INGEST',
                badge: 'MULTISOURCE INGESTION',
                desc: 'Continuous ingestion of Unsafe Act, Unsafe Condition, and Near-Miss records from OIL enterprise field reports and digital documents. Normalizes multi-rig logs into unified event payloads.',
                metrics: 'Ingests 1,400+ reports/sec · Multi-facility stream',
              },
              {
                step: '02',
                title: 'UNDERSTAND',
                badge: 'DOMAIN NLP EXPANSION',
                desc: 'Specialized oilfield NLP engine parses unstructured free-text observations, expands operational acronyms (LOTO, PTW, H2S, BOP), and identifies task context, equipment tags, and energy sources.',
                metrics: '99.2% acronym accuracy · BAAI/bge-base embeddings',
              },
              {
                step: '03',
                title: 'CLASSIFY',
                badge: 'PRECURSOR DELINKING',
                desc: 'Enforces the foundational industrial safety thesis: Actual Outcome != Potential Outcome. Evaluates whether an uninjured near-miss carried fatal energy release pathways or catastrophic escalation mechanisms.',
                metrics: 'Isotonic calibration · Multi-class SIF likelihood',
              },
              {
                step: '04',
                title: 'MAP',
                badge: 'IOGP STANDARDIZATION',
                desc: 'Automatic semantic mapping against the IOGP 9 Life-Saving Rules (Energy Isolation, Line of Fire, Hot Work, Confined Space, Work at Height) to pinpoint specific control lapses.',
                metrics: '9 Core safety barriers · Real-time rule indexing',
              },
              {
                step: '05',
                title: 'DISCOVER',
                badge: 'UNSUPERVISED CLUSTERING',
                desc: 'Correlates activity, quadrant location, and barrier failures using HDBSCAN and high-energy flags to surface recurring systemic risk clusters across disparate platform shifts.',
                metrics: 'Density-based clustering · Cross-shift pattern discovery',
              },
              {
                step: '06',
                title: 'ACT',
                badge: 'SUPERVISORY FORESIGHT',
                desc: 'Delivers actionable foresight via real-time SIF Precursor Density scores, facility hotspot rankings, and prioritized supervisor interventions before energy release occurs.',
                metrics: 'Live dashboard telemetry · Instant notification push',
              },
            ].map((stage, idx) => {
              const isActive = activeStoryStep === idx;
              return (
                <div
                  key={stage.step}
                  id={`story-card-${idx}`}
                  onMouseEnter={() => setActiveStoryStep(idx)}
                  style={{
                    backgroundColor: t.bgCard,
                    border: isActive
                      ? '1px solid ' + (isLight ? 'rgba(255, 115, 0, 0.5)' : t.accent)
                      : '1px solid ' + t.border,
                    boxShadow: isActive
                      ? (isLight ? '0 12px 36px rgba(255, 115, 0, 0.12)' : '0 12px 40px rgba(255, 115, 0, 0.18)')
                      : t.cardShadow,
                    borderRadius: '16px',
                    padding: '30px',
                    position: 'relative',
                    transition: 'border 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease',
                    transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '14px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        color: t.accent,
                        letterSpacing: '0.08em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: isActive ? t.accent : 'rgba(255, 115, 0, 0.12)',
                          color: isActive ? '#FFFFFF' : t.accent,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {stage.step}
                      </span>
                      STAGE {stage.step}
                    </div>
                    <span
                      style={{
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        color: isActive ? (isLight ? '#E65F00' : '#FFFFFF') : t.accentSoft,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: isActive ? 'rgba(255, 115, 0, 0.18)' : 'rgba(255, 115, 0, 0.08)',
                        border: '1px solid rgba(255, 115, 0, 0.25)',
                      }}
                    >
                      {stage.badge}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: isActive ? t.accent : t.textPrimary,
                      margin: '0 0 10px 0',
                      letterSpacing: '-0.02em',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {stage.title}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.92rem',
                      color: t.textSecondary,
                      lineHeight: 1.6,
                      margin: '0 0 18px 0',
                    }}
                  >
                    {stage.desc}
                  </p>

                  <div
                    style={{
                      paddingTop: '14px',
                      borderTop: '1px solid ' + t.borderSubtle,
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      color: t.textMuted,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{stage.metrics}</span>
                    <span style={{ color: isActive ? t.accent : t.textMuted, fontSize: '0.8rem' }}>→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =============================================================
          6. SECTION 5: REAL REPORT ANALYSIS SHOWCASE
          ============================================================= */}
      <section
        id="analysis"
        style={{
          padding: '90px 48px',
          maxWidth: '1240px',
          margin: '0 auto',
        }}
      >
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: t.accentSoft,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Real Field Observation Showcase
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '8px 0 12px 0', color: t.textPrimary }}>
              Live Precursor Extraction
            </h2>
            <p style={{ color: t.textSecondary, maxWidth: '600px', margin: '0 auto', fontSize: '0.95rem' }}>
              Examining how an uninjured maintenance event is instantly analyzed by the SIF-Guard engine.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)',
              gap: '28px',
              backgroundColor: t.bgSection,
              border: '1px solid ' + t.border,
              borderRadius: '18px',
              padding: '36px',
            }}
          >
            {/* Raw Report Box */}
            <div
              style={{
                backgroundColor: t.bgCardSubtle,
                border: '1px solid ' + t.borderSubtle,
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
                  <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: t.textMuted }}>
                    RAW INCIDENT NARRATIVE #OIL-2026-881
                  </span>
                  <span style={{ fontSize: '0.68rem', color: t.accentSoft, fontWeight: 700 }}>
                    UNSAFE CONDITION / NEAR-MISS
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '0.98rem',
                    lineHeight: 1.6,
                    color: t.textPrimary,
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
                  color: t.textMuted,
                  paddingTop: '14px',
                  borderTop: '1px solid ' + t.borderSubtle,
                }}
              >
                Outcome Recorded in Field: <strong style={{ color: t.textPrimary }}>No Injury (Near Miss)</strong>
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
                  backgroundColor: 'rgba(255, 115, 0, 0.1)',
                  border: '1px solid rgba(255, 115, 0, 0.35)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldAlert size={20} color={t.accent} />
                  <div>
                    <div style={{ fontSize: '0.68rem', color: t.accentSoft, fontWeight: 700, letterSpacing: '0.04em' }}>
                      SIF CLASSIFICATION
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: t.textPrimary }}>
                      SIF_POTENTIAL — HIGH PRECURSOR RISK
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: t.accent, fontFamily: 'monospace' }}>
                    <CountUpNumber end={92} suffix="%" />
                  </div>
                  <div style={{ fontSize: '0.65rem', color: t.textSecondary }}>
                    CONFIDENCE: <CountUpNumber end={0.89} decimals={2} />
                  </div>
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
                    backgroundColor: t.bgCard,
                    border: '1px solid ' + t.borderSubtle,
                    boxShadow: t.cardShadow,
                  }}
                >
                  <div style={{ fontSize: '0.66rem', color: t.textMuted, fontFamily: 'monospace', fontWeight: 700 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: t.textPrimary, margin: '2px 0' }}>
                    {item.val}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: t.textSecondary }}>{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
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
        <ScrollReveal>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
              gap: '36px',
              alignItems: 'center',
              backgroundColor: t.bgSection,
              border: '1px solid ' + t.border,
              borderRadius: '20px',
              padding: '44px',
            }}
          >
            {/* Radial Intelligence Ring */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ position: 'relative', width: '220px', height: '220px' }}>
                <svg width="220" height="220" viewBox="0 0 220 220">
                  {/* Background Ring */}
                  <circle cx="110" cy="110" r="88" stroke={isLight ? 'rgba(195, 182, 168, 0.7)' : 'rgba(255, 255, 255, 0.08)'} strokeWidth="12" fill="none" />
                  {/* Active Indicator Ring */}
                  <circle
                    cx="110"
                    cy="110"
                    r="88"
                    stroke={t.accent}
                    strokeWidth="12"
                    strokeDasharray={2 * Math.PI * 88}
                    strokeDashoffset={2 * Math.PI * 88 * (1 - 0.92)}
                    strokeLinecap="round"
                    fill="none"
                    transform="rotate(-90 110 110)"
                    style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
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
                  <span style={{ fontSize: '2.6rem', fontWeight: 900, color: t.textPrimary, lineHeight: 1 }}>
                    <CountUpNumber end={92} suffix="%" />
                  </span>
                  <span style={{ fontSize: '0.72rem', color: t.accentSoft, fontWeight: 700, letterSpacing: '0.05em' }}>
                    SIF POTENTIAL
                  </span>
                  <span style={{ fontSize: '0.68rem', color: t.textMuted, marginTop: '2px' }}>
                    HIGH RISK SCORE
                  </span>
                </div>
              </div>
              <div style={{ marginTop: '16px', fontSize: '0.85rem', color: t.textSecondary }}>
                Calibrated Predictive Precursor Likelihood
              </div>
            </div>

            {/* Metric Cards Cluster */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <ParallaxCard
                theme={theme}
                style={{
                  backgroundColor: t.bgCard,
                  border: '1px solid ' + t.border,
                  boxShadow: t.cardShadow,
                  borderRadius: '12px',
                  padding: '20px',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: t.textMuted, fontFamily: 'monospace', fontWeight: 700 }}>
                  PRECURSOR SIGNALS
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: t.accent, margin: '4px 0' }}>
                  <CountUpNumber end={3} suffix=" Active" />
                </div>
                <div style={{ fontSize: '0.78rem', color: t.textSecondary }}>
                  Uncontrolled energy, line break, unbolted guard.
                </div>
              </ParallaxCard>

              <ParallaxCard
                theme={theme}
                style={{
                  backgroundColor: t.bgCard,
                  border: '1px solid ' + t.border,
                  boxShadow: t.cardShadow,
                  borderRadius: '12px',
                  padding: '20px',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: t.textMuted, fontFamily: 'monospace', fontWeight: 700 }}>
                  BARRIER FAILURES
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: t.accent, margin: '4px 0' }}>
                  <CountUpNumber end={2} suffix=" Breaches" />
                </div>
                <div style={{ fontSize: '0.78rem', color: t.textSecondary }}>
                  Lockout padlock omitted, pressure un-vented.
                </div>
              </ParallaxCard>

              <ParallaxCard
                theme={theme}
                style={{
                  backgroundColor: t.bgCard,
                  border: '1px solid ' + t.border,
                  boxShadow: t.cardShadow,
                  borderRadius: '12px',
                  padding: '20px',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: t.textMuted, fontFamily: 'monospace', fontWeight: 700 }}>
                  PRECURSOR DENSITY
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: t.textPrimary, margin: '4px 0' }}>
                  <CountUpNumber end={24.8} decimals={1} suffix="%" />
                </div>
                <div style={{ fontSize: '0.78rem', color: t.textSecondary }}>
                  SIF Potential vs Total Near-Miss Reports.
                </div>
              </ParallaxCard>

              <ParallaxCard
                theme={theme}
                style={{
                  backgroundColor: t.bgCard,
                  border: '1px solid ' + t.border,
                  boxShadow: t.cardShadow,
                  borderRadius: '12px',
                  padding: '20px',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: t.textMuted, fontFamily: 'monospace', fontWeight: 700 }}>
                  MODEL CONFIDENCE
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: t.textPrimary, margin: '4px 0' }}>
                  <CountUpNumber end={0.89} decimals={2} />
                </div>
                <div style={{ fontSize: '0.78rem', color: t.textSecondary }}>
                  Hybrid Ensemble Probability Calibration Index.
                </div>
              </ParallaxCard>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* =============================================================
          8. SECTION 7: INTERACTIVE LIFE-SAVING RULES MAP
          ============================================================= */}
      <section
        id="rules"
        style={{
          padding: '90px 48px',
          maxWidth: '1240px',
          margin: '0 auto',
        }}
      >
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: t.accentSoft,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              IOGP 9 Life-Saving Rules Integration
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '8px 0 12px 0', color: t.textPrimary }}>
              Life-Saving Rule Mapping
            </h2>
            <p style={{ color: t.textSecondary, maxWidth: '620px', margin: '0 auto', fontSize: '0.95rem' }}>
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
              paddingBottom: '8px',
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
                    backgroundColor: isSelected ? 'rgba(255, 115, 0, 0.15)' : t.bgCard,
                    border: isSelected ? '1px solid ' + t.accent : '1px solid ' + t.border,
                    color: isSelected ? (isLight ? '#E65F00' : '#FFFFFF') : t.textSecondary,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={16} color={isSelected ? t.accent : t.textMuted} />
                  <span>{rule.name}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Rule Detail Card */}
          <ParallaxCard
            theme={theme}
            style={{
              backgroundColor: t.bgCard,
              border: '1px solid ' + t.border,
              boxShadow: t.cardShadow,
              borderRadius: '16px',
              padding: '32px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'monospace',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 115, 0, 0.12)',
                    color: t.accentSoft,
                    fontWeight: 700,
                  }}
                >
                  {selectedRule.code}
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: t.textPrimary, margin: 0 }}>
                  {selectedRule.name}
                </h3>
              </div>
              <div style={{ fontSize: '0.82rem', color: t.textSecondary, fontFamily: 'monospace' }}>
                FLAGGED PRECURSORS: <strong style={{ color: t.accent }}><CountUpNumber end={selectedRule.precursorsFlagged} /> INCIDENTS</strong>
              </div>
            </div>

            <p style={{ fontSize: '1.02rem', color: t.textPrimary, lineHeight: 1.6, margin: '0 0 20px 0' }}>
              {selectedRule.summary}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                paddingTop: '20px',
                borderTop: '1px solid ' + t.borderSubtle,
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: t.textMuted, fontFamily: 'monospace', fontWeight: 700 }}>
                  MANDATED SAFETY BARRIERS
                </div>
                <div style={{ fontSize: '0.86rem', color: t.textSecondary, marginTop: '4px' }}>
                  {selectedRule.criteria}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: t.textMuted, fontFamily: 'monospace', fontWeight: 700 }}>
                  HIGH-RISK REFINERY QUADRANT
                </div>
                <div style={{ fontSize: '0.86rem', color: t.accentSoft, marginTop: '4px' }}>
                  {selectedRule.oilZone}
                </div>
              </div>
            </div>
          </ParallaxCard>
        </ScrollReveal>
      </section>

      {/* =============================================================
          9. SECTION 8: PRECURSOR INTELLIGENCE (CONNECTED NETWORK)
          ============================================================= */}
      <section
        style={{
          padding: '80px 48px',
          maxWidth: '1240px',
          margin: '0 auto',
        }}
      >
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: t.accentSoft,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Causal Correlation Engine
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '8px 0 12px 0', color: t.textPrimary }}>
              Precursor Intelligence Network
            </h2>
            <p style={{ color: t.textSecondary, maxWidth: '640px', margin: '0 auto', fontSize: '0.95rem' }}>
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
              backgroundColor: t.bgSection,
              border: '1px solid ' + t.border,
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
                <ParallaxCard
                  theme={theme}
                  style={{
                    flex: 1,
                    minWidth: '210px',
                    backgroundColor: t.bgCard,
                    boxShadow: t.cardShadow,
                    border: idx === 3 ? '1px solid ' + t.accent : '1px solid ' + t.border,
                    borderRadius: '12px',
                    padding: '18px',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: t.textMuted, fontWeight: 700 }}>
                    {node.step}
                  </div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: idx === 3 ? t.accent : t.textPrimary, margin: '4px 0' }}>
                    {node.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: t.textSecondary, marginBottom: '8px' }}>
                    {node.desc}
                  </div>
                  <span
                    style={{
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: idx === 3 ? 'rgba(255, 115, 0, 0.15)' : (isLight ? 'rgba(195, 182, 168, 0.25)' : 'rgba(255, 255, 255, 0.05)'),
                      color: idx === 3 ? (isLight ? '#E65F00' : t.accentSoft) : t.textSecondary,
                    }}
                  >
                    {node.tag}
                  </span>
                </ParallaxCard>
                {idx < 3 && (
                  <div style={{ color: t.accent, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <ArrowRight size={20} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* =============================================================
          10. SECTION 9: BEFORE VS SIF-GUARD
          ============================================================= */}
      <section
        style={{
          padding: '80px 48px',
          maxWidth: '1240px',
          margin: '0 auto',
        }}
      >
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: t.accentSoft,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Paradigm Shift
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '8px 0 12px 0', color: t.textPrimary }}>
              Traditional HSSE vs. SIF-Guard Foresight
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* Traditional */}
            <ParallaxCard
              theme={theme}
              style={{
                backgroundColor: t.bgCard,
                border: '1px solid ' + t.border,
                boxShadow: t.cardShadow,
                borderRadius: '16px',
                padding: '32px',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: t.textMuted, fontWeight: 700, marginBottom: '12px' }}>
                TRADITIONAL HSSE WORKFLOW
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.textSecondary, margin: '0 0 16px 0' }}>
                Lagging &amp; Retrospective
              </h3>
              <ul style={{ paddingLeft: '18px', color: t.textSecondary, fontSize: '0.88rem', lineHeight: 1.8, margin: 0 }}>
                <li>Focuses primarily on actual lost-time injury statistics.</li>
                <li>Near-miss reports with zero harm are archived without deep precursor analysis.</li>
                <li>Manual review audits take 3–6 weeks; patterns remain undiscovered.</li>
                <li>Corrective actions happen retroactively after serious harm occurs.</li>
              </ul>
            </ParallaxCard>

            {/* SIF-Guard */}
            <ParallaxCard
              theme={theme}
              style={{
                backgroundColor: isLight ? 'rgba(255, 115, 0, 0.08)' : 'rgba(255, 115, 0, 0.04)',
                border: isLight ? '1px solid rgba(255, 115, 0, 0.4)' : '1px solid rgba(255, 115, 0, 0.25)',
                boxShadow: t.cardShadow,
                borderRadius: '16px',
                padding: '32px',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: t.accentSoft, fontWeight: 700, marginBottom: '12px' }}>
                SIF-GUARD PRECURSOR ENGINE
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: t.textPrimary, margin: '0 0 16px 0' }}>
                Proactive Foresight
              </h3>
              <ul style={{ paddingLeft: '18px', color: t.textPrimary, fontSize: '0.88rem', lineHeight: 1.8, margin: 0 }}>
                <li>Enforces: <code style={{ color: t.accentSoft }}>Actual Outcome != Potential Outcome</code>.</li>
                <li>Near-misses with fatal mechanisms are surfaced within seconds.</li>
                <li>Semantic NLP maps incidents automatically to IOGP Life-Saving Rules.</li>
                <li>Enables immediate barrier reinforcement before catastrophic release.</li>
              </ul>
            </ParallaxCard>
          </div>
        </ScrollReveal>
      </section>

      {/* =============================================================
          11. SECTION 10: INTERACTIVE AI OBSERVATION DEMO
          ============================================================= */}
      <section
        id="demo"
        style={{
          position: 'relative',
          padding: '90px 48px',
          maxWidth: '1280px',
          margin: '0 auto',
          overflow: 'hidden',
        }}
      >
        {/* Ghost Watermark */}
        <div
          className="ghost-watermark-text"
          style={{
            top: '20px',
            left: '2%',
            fontSize: 'clamp(3.8rem, 9vw, 7.5rem)',
          }}
        >
          04 // ACT
        </div>

        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative', zIndex: 2 }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: t.accentSoft,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Live Evaluation Sandbox
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '8px 0 12px 0', color: t.textPrimary }}>
              Analyze a Safety Observation
            </h2>
            <p style={{ color: t.textSecondary, maxWidth: '620px', margin: '0 auto', fontSize: '0.95rem' }}>
              Select an operational oilfield observation or enter custom narrative to test the AI model.
            </p>
          </div>

          <div
            style={{
              backgroundColor: t.bgSection,
              border: '1px solid ' + t.border,
              borderRadius: '18px',
              padding: '32px',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {/* Quick Preset Buttons */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '18px', paddingBottom: '4px' }}>
              <span style={{ fontSize: '0.74rem', color: t.textMuted, alignSelf: 'center', fontFamily: 'monospace' }}>
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
                    backgroundColor: demoInput === sample.text ? 'rgba(255, 115, 0, 0.15)' : t.bgCardSubtle,
                    border: demoInput === sample.text ? '1px solid ' + t.accent : '1px solid ' + t.borderSubtle,
                    color: demoInput === sample.text ? (isLight ? '#E65F00' : '#FFFFFF') : t.textSecondary,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
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
                  backgroundColor: isLight ? '#FFFFFF' : t.bgCard,
                  border: '1px solid ' + t.border,
                  borderRadius: '10px',
                  color: t.textPrimary,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                <MagneticButton
                  variant="primary"
                  theme={theme}
                  onClick={handleRunDemoAnalysis}
                  icon={isAnalyzing ? undefined : <ArrowRight size={16} />}
                >
                  {isAnalyzing ? 'Evaluating NLP Precursor Embeddings...' : 'Analyze Observation'}
                </MagneticButton>
              </div>
            </div>

            {/* Results Output */}
            {demoResult && (
              <ParallaxCard
                theme={theme}
                style={{
                  backgroundColor: t.bgCard,
                  border: '1px solid rgba(255, 115, 0, 0.35)',
                  boxShadow: t.cardShadow,
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
                    <div style={{ fontSize: '0.68rem', color: t.textMuted, fontFamily: 'monospace', fontWeight: 700 }}>
                      SIF POTENTIAL SCORE
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: t.accent, margin: '4px 0' }}>
                      {demoResult.sif} ({demoResult.score})
                    </div>
                    <div style={{ fontSize: '0.74rem', color: t.textSecondary }}>Flagged Precursor Mechanism</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.68rem', color: t.textMuted, fontFamily: 'monospace', fontWeight: 700 }}>
                      LIFE-SAVING RULE
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: t.textPrimary, margin: '4px 0' }}>
                      {demoResult.rule}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: t.textSecondary }}>Semantic Match &gt; 0.85</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.68rem', color: t.textMuted, fontFamily: 'monospace', fontWeight: 700 }}>
                      PRIMARY BARRIER BREACH
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: t.accentSoft, margin: '4px 0' }}>
                      {demoResult.barrier}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: t.textSecondary }}>Mandated Control Failure</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.68rem', color: t.textMuted, fontFamily: 'monospace', fontWeight: 700 }}>
                      IDENTIFIED PRECURSOR
                    </div>
                    <div style={{ fontSize: '0.84rem', color: t.textPrimary, margin: '4px 0', lineHeight: 1.4 }}>
                      {demoResult.precursor}
                    </div>
                  </div>
                </div>
              </ParallaxCard>
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* =============================================================
          12. SECTION 11: DASHBOARD PREVIEW
          ============================================================= */}
      <section
        style={{
          padding: '80px 48px',
          maxWidth: '1240px',
          margin: '0 auto',
        }}
      >
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: t.accentSoft,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Live Operational System
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '8px 0 12px 0', color: t.textPrimary }}>
              The SIF-Guard Platform
            </h2>
            <p style={{ color: t.textSecondary, maxWidth: '600px', margin: '0 auto', fontSize: '0.95rem' }}>
              Built for enterprise safety leaders, inspectors, and operations managers.
            </p>
          </div>

          <div
            style={{
              backgroundColor: t.bgSection,
              border: '1px solid ' + t.border,
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: isLight ? '0 20px 48px -12px rgba(35, 28, 22, 0.12)' : '0 24px 64px -16px rgba(0, 0, 0, 0.8)',
            }}
          >
            {/* Simulated App Header */}
            <div
              style={{
                padding: '12px 24px',
                backgroundColor: t.bgElevated,
                borderBottom: '1px solid ' + t.borderSubtle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#E85D5D' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FFB347' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#20D997' }} />
                <span style={{ marginLeft: '12px', fontSize: '0.76rem', fontFamily: 'monospace', color: t.textMuted }}>
                  https://sif-guard.oilindia.in/dashboard
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: t.accentSoft, fontWeight: 700 }}>
                AUTH PROTECTED · SUPABASE LIVE
              </span>
            </div>

            {/* Platform Preview Body */}
            <div style={{ padding: '36px', textAlign: 'center' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px',
                  marginBottom: '28px',
                  textAlign: 'left',
                }}
              >
                {[
                  { label: 'SIF Precursor Density', val: <CountUpNumber end={24.8} decimals={1} suffix="%" />, sub: '+3.2% vs baseline' },
                  { label: 'Unsafe Acts Ingested', val: <CountUpNumber end={1420} />, sub: '98% classified' },
                  { label: 'Critical Site Hotspots', val: <CountUpNumber end={3} suffix=" Sites" />, sub: 'Z-02, Z-04, Z-06' },
                  { label: 'LSR Adherence Index', val: <CountUpNumber end={86.4} decimals={1} suffix="%" />, sub: 'Target: 95%' },
                ].map((kpi, idx) => (
                  <ParallaxCard
                    key={idx}
                    theme={theme}
                    style={{
                      backgroundColor: t.bgCard,
                      border: '1px solid ' + t.border,
                      boxShadow: t.cardShadow,
                      borderRadius: '10px',
                      padding: '16px',
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', color: t.textMuted, fontWeight: 600 }}>{kpi.label}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: t.textPrimary, margin: '4px 0' }}>{kpi.val}</div>
                    <div style={{ fontSize: '0.68rem', color: t.accentSoft }}>{kpi.sub}</div>
                  </ParallaxCard>
                ))}
              </div>

              <div style={{ padding: '20px 0' }}>
                <MagneticButton
                  variant="primary"
                  theme={theme}
                  onClick={onEnterPlatform}
                  icon={<ArrowRight size={18} />}
                >
                  Enter Intelligence Platform
                </MagneticButton>
              </div>
            </div>
          </div>
        </ScrollReveal>
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
        <ScrollReveal>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 115, 0, 0.12)',
              border: '1px solid rgba(255, 115, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: t.accent,
              margin: '0 auto 28px auto',
            }}
          >
            <ShieldAlert size={26} />
          </div>

          <StaggeredText
            as="h2"
            lines={['Turn safety observations', 'into foresight.']}
            delayMs={100}
            staggerMs={120}
            style={{
              fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: t.textPrimary,
              margin: '0 0 16px 0',
            }}
            lineStyles={(idx) =>
              idx === 1
                ? { color: t.accent, fontWeight: 800 }
                : { color: t.textPrimary, fontWeight: 800 }
            }
          />

          <p
            style={{
              fontSize: '1.1rem',
              color: t.textSecondary,
              maxWidth: '560px',
              margin: '0 auto 36px auto',
              lineHeight: 1.6,
            }}
          >
            SIF-Guard — Precursor Intelligence &amp; HSSE Safety Platform for Oil India Limited.
          </p>

          <MagneticButton
            variant="primary"
            theme={theme}
            onClick={onEnterPlatform}
            icon={<span style={{ fontSize: '1.1rem' }}>↗</span>}
          >
            Enter SIF-Guard
          </MagneticButton>
        </ScrollReveal>
      </section>

      {/* =============================================================
          14. FOOTER
          ============================================================= */}
      <footer
        style={{
          borderTop: '1px solid ' + t.border,
          padding: '40px 48px',
          backgroundColor: isLight ? t.bgCard : t.bgSection,
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
            color: t.textMuted,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, color: t.textPrimary, marginBottom: '4px' }}>
              SIF-Guard — Serious Injury &amp; Fatality Precursor Intelligence Platform
            </div>
            <div>Developed for Oil India Limited · Smart India Hackathon 2026 (Problem Statement 165)</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ color: t.textSecondary }}>FastAPI</span>
            <span style={{ color: t.textSecondary }}>Three.js WebGL</span>
            <span style={{ color: t.textSecondary }}>Supabase Auth</span>
            <span style={{ color: t.textSecondary }}>BAAI/bge-base</span>
            <span style={{ color: t.accent }}>© 2026 SIF-Guard Team</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
