import React, { useState, useRef, type MouseEvent } from 'react';
import { Activity, Cpu, Sliders, ArrowUpRight, Layers } from 'lucide-react';

interface HeroReaderPrismProps {
  onExploreTwin?: () => void;
  onExploreEngine?: () => void;
  onExploreScada?: () => void;
}

export const HeroReaderPrism: React.FC<HeroReaderPrismProps> = ({
  onExploreTwin,
  onExploreEngine,
  onExploreScada,
}) => {
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((y - centerY) / centerY) * -6;
    const tiltY = ((x - centerX) / centerX) * 6;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const surfaces = [
    {
      label: 'Spatial Twin Surface',
      title: 'A facility to experience in real time.',
      description:
        'Volumetric heatmaps, acoustic vibration sensors, and gas dispersion plumes synthesized into a single operational digital twin.',
      action: onExploreTwin,
      actionText: 'Explore 3D Digital Twin',
    },
    {
      label: 'Neural Inference Matrix',
      title: 'Risk calculated, not estimated.',
      description:
        'Calibrated XGBoost gradient boosted trees score non-linear precursor combinations across permit logs in 14.2 milliseconds.',
      action: onExploreEngine,
      actionText: 'Inspect XGBoost Payload',
    },
    {
      label: 'Industrial SCADA Interlock',
      title: 'Direct connection to the safety PLC.',
      description:
        'Deterministic Modbus TCP and OPC-UA registers arming fail-safe emergency shutdown (ESD) relays before human triage.',
      action: onExploreScada,
      actionText: 'Inspect SCADA Registers',
    },
  ];

  return (
    <div className="hero-prism-container">
      {/* Topline Bar */}
      <div className="hero-prism-topline">
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="lp-dot-pulse" style={{ backgroundColor: '#8fe3b0', boxShadow: '0 0 8px #8fe3b0' }} />
          One facility. Every precursor.
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.65 }}>
          <Layers size={13} />
          <span>LENS // 0{activeTab + 1}</span>
        </div>
      </div>

      {/* 3D Perspective Stage */}
      <div
        ref={stageRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="hero-prism-stage"
      >
        {/* Subtle Ambient Radial Glow */}
        <div
          className="hero-prism-glow"
          style={{
            background:
              activeTab === 0
                ? 'radial-gradient(circle, rgba(255,255,255,0.8), transparent 70%)'
                : activeTab === 1
                ? 'radial-gradient(circle, rgba(143,227,176,0.8), transparent 70%)'
                : 'radial-gradient(circle, rgba(255,160,67,0.8), transparent 70%)',
          }}
        />

        {/* The 3D Layer Stack */}
        <div
          className="hero-prism-stack"
          style={{
            transform: `rotateX(${11 + tilt.x}deg) rotateY(${-16 + tilt.y}deg) rotateZ(-4deg)`,
          }}
        >
          {/* SHEET 2: SCADA Industrial Layer (Rear) */}
          <div
            className="hero-prism-card card-scada"
            style={{
              transform:
                activeTab === 2
                  ? 'translate3d(0, 0, 40px)'
                  : 'translate3d(24px, -18px, -40px)',
              opacity: activeTab === 2 ? 1 : 0.35,
              zIndex: activeTab === 2 ? 30 : 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', fontSize: '10px', color: '#ccd1d8' }}>
              <span>opc-ua://refinery.cracking:4840</span>
              <span style={{ color: '#8fe3b0' }}>● LIVE</span>
            </div>
            <pre style={{ marginTop: '12px', lineHeight: 1.5, opacity: 0.9, fontSize: '9.5px', fontFamily: 'monospace', margin: '12px 0 0 0' }}>
{`> REG 40012 [PT-402]: 184.6 PSI (ALERT_HI)
> REG 40018 [TT-409]: 482.1 °C (CRITICAL)
> GAS SENSOR [GS-102]: 24.5 PPM H2S
> ESD_SAFETY_RELAY_04: ARMED
> TRIP_INTERLOCK_COUNTER: 60 SEC`}
            </pre>
            <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#e3cf8f' }}>
              <span>SAFETY PLC: MODBUS_TCP</span>
              <span>LSR-04 COMPLIANT</span>
            </div>
          </div>

          {/* SHEET 1: XGBoost Neural Matrix (Middle) */}
          <div
            className="hero-prism-card card-neural"
            style={{
              transform:
                activeTab === 1
                  ? 'translate3d(0, 0, 40px)'
                  : 'translate3d(12px, -9px, -20px)',
              opacity: activeTab === 1 ? 1 : 0.55,
              zIndex: activeTab === 1 ? 30 : 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', fontSize: '10px', color: '#aeb4bd' }}>
              <span>application/json</span>
              <span>{`{ }`}</span>
            </div>
            <pre style={{ marginTop: '10px', lineHeight: 1.5, fontSize: '9.5px', color: '#d4d8df', fontFamily: 'monospace', margin: '10px 0 0 0' }}>
{`{
  "engine": "xgboost_v2.4_calibrated",
  "hazard_class": "boundary_rupture",
  "sif_probability": 0.942,
  "top_shap_features": [
    "furnace_pressure_delta: +0.48",
    "h2s_sensor_ppm: +0.31",
    "active_hot_work_permit: +0.15"
  ]
}`}
            </pre>
            <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#aeb4bd' }}>
              <span>SHAP TIME: 14.2ms</span>
              <span style={{ color: '#8fe3b0' }}>HIGH CONFIDENCE</span>
            </div>
          </div>

          {/* SHEET 0: Titanium Physical Inspection Card (Front) */}
          <div
            className="hero-prism-card card-titanium"
            style={{
              transform:
                activeTab === 0
                  ? 'translate3d(0, 0, 40px)'
                  : 'translate3d(-8px, 6px, -15px)',
              opacity: activeTab === 0 ? 1 : 0.6,
              zIndex: activeTab === 0 ? 30 : 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(11,12,14,0.15)', paddingBottom: '8px', fontSize: '10px', fontFamily: 'monospace', fontWeight: 600, color: '#1a1c20' }}>
              <span style={{ letterSpacing: '0.05em' }}>oil-india.sifguard.ai</span>
              <span>↗</span>
            </div>

            <div style={{ marginTop: '12px', position: 'relative', zIndex: 10 }}>
              <div style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em', color: '#0b0c0e' }}>
                Thermal Runaway<br />Detected.<br />
                <span style={{ color: '#6e747d', fontSize: '17px', fontWeight: 500 }}>Unit #4 Cracking</span>
              </div>
            </div>

            {/* Architectural Vector Contour Wave */}
            <div style={{ position: 'absolute', bottom: '38px', right: '-10px', width: '100%', opacity: 0.35, pointerEvents: 'none' }}>
              <svg viewBox="0 0 360 110" fill="none" style={{ width: '100%', stroke: '#414853', strokeWidth: '0.8px' }}>
                <path d="M-20 20 C80 130, 200 -60, 380 40" />
                <path d="M-20 32 C80 120, 200 -50, 380 50" />
                <path d="M-20 44 C80 110, 200 -40, 380 60" />
                <path d="M-20 56 C80 100, 200 -30, 380 70" />
                <path d="M-20 68 C80 90, 200 -20, 380 80" />
                <path d="M-20 80 C80 80, 200 -10, 380 90" />
              </svg>
            </div>

            <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px', borderTop: '1px solid rgba(11,12,14,0.15)', paddingTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '9.5px', fontFamily: 'monospace' }}>
              <span style={{ color: '#414853', fontWeight: 600 }}>SIF PRECURSOR: CRITICAL</span>
              <span style={{ fontWeight: 700, color: '#b91c1c', backgroundColor: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>94.2% RISK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Minimalist Reader Tab Selector */}
      <div className="hero-prism-tabs">
        <button
          type="button"
          onClick={() => setActiveTab(0)}
          className={`hero-prism-tab ${activeTab === 0 ? 'active' : ''}`}
        >
          <Activity size={14} />
          <span>Spatial Twin</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(1)}
          className={`hero-prism-tab ${activeTab === 1 ? 'active' : ''}`}
        >
          <Cpu size={14} />
          <span>XGBoost</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(2)}
          className={`hero-prism-tab ${activeTab === 2 ? 'active' : ''}`}
        >
          <Sliders size={14} />
          <span>SCADA</span>
        </button>
      </div>

      {/* Dynamic Descriptor Box */}
      <div className="hero-prism-desc">
        <p className="hero-prism-desc-label">
          {surfaces[activeTab].label}
        </p>
        <h3 className="hero-prism-desc-title">
          {surfaces[activeTab].title}
        </h3>
        <p className="hero-prism-desc-text">
          {surfaces[activeTab].description}
        </p>
        <button
          type="button"
          onClick={surfaces[activeTab].action}
          className="hero-prism-desc-action"
        >
          <span>{surfaces[activeTab].actionText}</span>
          <ArrowUpRight size={14} />
        </button>
      </div>
    </div>
  );
};
