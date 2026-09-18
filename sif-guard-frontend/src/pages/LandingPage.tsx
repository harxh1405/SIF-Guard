import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  ChevronRight,
  Lock,
  Search,
  Flame,
  Activity,
  Sliders,
  FileText,
  Radio,
  Volume2,
  VolumeX,
  ExternalLink,
  Bell,
  AlertTriangle,
  FileCheck,
  Shield,
  Layers,
  MapPin,
} from 'lucide-react';
import './LandingPage.css';

interface LandingPageProps {
  onEnterPlatform: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

// Audited field precursor records for compliance verification
const AUDIT_RECORDS = [
  {
    id: 'OIL/HSE/2026/041',
    title: 'Bypassed Energy Isolation (LOTO Omission)',
    asset: 'Duliajan Central Processing Facility // Booster Pump BP-04',
    rawText:
      'Contractor technician engaged in pump seal overhaul while circuit breaker was tagged out, but physical padlock was omitted from the lockout hasp without secondary verification.',
    sifLevel: 'HIGH SIF PRECURSOR',
    score: '96.8%',
    rule: 'LSR-01 // ENERGY ISOLATION',
    barrier: 'Physical Lockout / Tagout (LOTO) Verification',
    hardwareAction: 'TRIP COMMAND DISPATCHED TO MOTOR CONTROL CENTER (MCC-04)',
    color: '#dc2626',
    category: 'critical',
  },
  {
    id: 'OIL/HSE/2026/058',
    title: 'Confined Space Entry without Gas Clearance',
    asset: 'Digboi Field Gathering Station // Storage Tank T-104',
    rawText:
      'Inspection crew entered crude storage vessel manway without continuous 4-gas atmospheric monitor or calibrated photoionization detector (PID).',
    sifLevel: 'CRITICAL SIF PRECURSOR',
    score: '98.4%',
    rule: 'LSR-03 // CONFINED SPACE ENTRY',
    barrier: 'Continuous Multi-Gas Atmospheric Monitoring & Ventilation',
    hardwareAction: 'ACCESS GATE INTERLOCK ARMED // AUDIBLE HORN TRIGGERED',
    color: '#ea580c',
    category: 'critical',
  },
  {
    id: 'OIL/HSE/2026/072',
    title: 'Hot Work in Flammable Vapor Boundary',
    asset: 'Sivasagar Gas Gathering Station // Condensate Flange F-12',
    rawText:
      'Welder struck arc 3.2m from gas dehydration condensate flange while combustible gas sniff test had not been logged in the past 60 minutes.',
    sifLevel: 'CRITICAL SIF PRECURSOR',
    score: '99.1%',
    rule: 'LSR-02 // HOT WORK PERMIT',
    barrier: 'LEL Gas Sniffing & 15m Combustible Clearance Protocol',
    hardwareAction: 'EMERGENCY ISOLATION VALVE ESV-102 DE-ENERGIZED',
    color: '#dc2626',
    category: 'critical',
  },
  {
    id: 'OIL/HSE/2026/089',
    title: 'Work at Height Rigging without Fall Arrest',
    asset: 'Jaisalmer Basin Gas Complex // Flare Header Riser R-08',
    rawText:
      'Scaffold rigger climbed elevated riser ladder at 18.5 meters without attaching dual-lanyard shock absorber harness to certified lifeline anchor.',
    sifLevel: 'HIGH SIF PRECURSOR',
    score: '93.5%',
    rule: 'LSR-04 // WORKING AT HEIGHT',
    barrier: '100% Fall Arrest Tie-Off & Certified Anchor Point',
    hardwareAction: 'FLAGGED IN SAFETY CONTROLLER // RIG SUPERVISOR NOTIFIED',
    color: '#d97706',
    category: 'circulars',
  },
];

// Monitored facilities across Assam and Rajasthan
const MONITORED_ASSETS = [
  {
    id: 'OIL-CPF-01',
    name: 'Duliajan Central Processing Facility (CPF)',
    location: 'Dibrugarh District, Assam',
    type: 'Crude Oil & Gas Dehydration Hub',
    permits: '4 Active PTW',
    sensors: '184 Telemetry Nodes',
    status: 'NORMAL',
    interlocks: 'Armed (Modbus TCP)',
  },
  {
    id: 'OIL-DGB-02',
    name: 'Digboi Field Gathering & Pumping Station',
    location: 'Tinsukia District, Assam',
    type: 'Historic Production Wells & Distribution',
    permits: '2 Active PTW',
    sensors: '96 Telemetry Nodes',
    status: 'NORMAL',
    interlocks: 'Armed (OPC-UA)',
  },
  {
    id: 'OIL-SVS-03',
    name: 'Sivasagar High-Pressure Wellheads & Manifolds',
    location: 'Sivasagar District, Assam',
    type: 'Deep Extraction Manifolds & Flaring Unit',
    permits: '5 Active PTW',
    sensors: '142 Telemetry Nodes',
    status: 'ELEVATED WATCH',
    interlocks: 'Armed (Modbus TCP)',
  },
  {
    id: 'OIL-RAJ-04',
    name: 'Jaisalmer Natural Gas Extraction Complex',
    location: 'Jaisalmer Basin, Rajasthan',
    type: 'High-Sulfur Gas Compression & Processing',
    permits: '3 Active PTW',
    sensors: '110 Telemetry Nodes',
    status: 'NORMAL',
    interlocks: 'Armed (OPC-UA)',
  },
];

// Key Safety Pillars (india.gov.in topics/services cards style)
const SAFETY_TOPICS = [
  {
    id: 'loto',
    icon: Lock,
    title: 'Energy Isolation (LOTO)',
    code: 'LSR-01 / OISD-156',
    desc: 'Physical zero-energy lockout and padlock verification before maintenance on high-pressure circuits.',
    badge: 'Statutory Mandate',
    badgeColor: '#b45309',
  },
  {
    id: 'hotwork',
    icon: Flame,
    title: 'Hot Work & Gas Clearance',
    code: 'LSR-02 / DGMS Circular',
    desc: 'Continuous atmospheric LEL sniffing within 15 meters of cutting, welding, and torch operations.',
    badge: 'Critical Defense',
    badgeColor: '#b91c1c',
  },
  {
    id: 'confined',
    icon: Activity,
    title: 'Confined Space Vessel Entry',
    code: 'LSR-03 / OSHA 1910',
    desc: 'Certified 4-gas atmospheric tests, standby rescue officer, and positive pressure ventilation.',
    badge: 'Mandatory Watch',
    badgeColor: '#003366',
  },
  {
    id: 'heights',
    icon: Sliders,
    title: 'Working at Elevated Heights',
    code: 'LSR-04 / OISD-GDN-166',
    desc: 'Dual-lanyard 100% tie-off, certified anchor points, and scaffolding tag integrity inspections.',
    badge: 'Fall Protection',
    badgeColor: '#15803d',
  },
  {
    id: 'barriers',
    icon: Layers,
    title: 'Swiss Cheese Barrier Engine',
    code: 'James Reason Methodology',
    desc: 'Real-time telemetry tracking of passive, active, and administrative safety barrier holes.',
    badge: 'Predictive Model',
    badgeColor: '#6b21a8',
  },
  {
    id: 'ocr',
    icon: FileText,
    title: 'Multimodal Permit Ingestion',
    code: 'AI Digitization Core',
    desc: 'OCR extraction of scanned handwritten permits to work (PTW) with sub-second hazard categorization.',
    badge: 'Automated Ingestion',
    badgeColor: '#0369a1',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterPlatform,
}) => {
  const [selectedRecord, setSelectedRecord] = useState(AUDIT_RECORDS[0]);
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'circulars'>('all');
  const [searchCategory, setSearchCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'larger'>('normal');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Background Audio Controller for the audio track
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.35;

    // Play on first explicit user interaction to comply with browser autoplay policy
    const handleFirstInteraction = () => {
      if (audio.paused) {
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  const toggleAudioPlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log('Audio playback error:', err));
    }
  };

  const filteredRecords = AUDIT_RECORDS.filter((rec) => {
    if (activeTab === 'all') return true;
    return rec.category === activeTab;
  });

  return (
    <div className={`india-gov-page font-size-${fontSize}`}>
      {/* Background Audio Player */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
      >
        <source src="/audio/bg_audio.webm" type="audio/webm" />
        <source src="/audio/bg_audio.m4a" type="audio/mp4" />
      </audio>

      {/* =========================================================================
          1. NATIONAL TRICOLOR TOP STRIPE (india.gov.in standard)
          ========================================================================= */}
      <div className="india-top-stripe" />

      {/* =========================================================================
          2. ACCESSIBILITY & STATUTORY ATTRIBUTION BAR (ENGLISH ONLY)
          ========================================================================= */}
      <section className="india-accessibility-bar" aria-label="Accessibility Bar">
        <div className="india-gov-wrap india-access-inner">
          <div className="india-access-left">
            <span className="india-access-item">
              <strong>NATIONAL SAFETY INITIATIVE</strong>
            </span>
            <span className="india-access-pipe">|</span>
            <span className="india-access-item">
              Ministry of Petroleum &amp; Natural Gas
            </span>
            <span className="india-access-pipe">|</span>
            <span className="india-access-item">
              Oil India Limited
            </span>
          </div>

          <div className="india-access-right">
            {/* Audio Toggle Equalizer */}
            <div className="india-audio-ctrl">
              <button
                type="button"
                className={`india-audio-btn ${isPlaying ? 'playing' : ''}`}
                onClick={toggleAudioPlayback}
                title={isPlaying ? 'Pause Background Audio' : 'Play Background Audio'}
              >
                {isPlaying ? <Volume2 size={13} /> : <VolumeX size={13} />}
                <span>{isPlaying ? 'Audio: On' : 'Audio: Off'}</span>
                {isPlaying && (
                  <span className="india-equalizer-bars">
                    <span className="bar bar1" />
                    <span className="bar bar2" />
                    <span className="bar bar3" />
                  </span>
                )}
              </button>
            </div>

            <span className="india-access-pipe">|</span>

            {/* Skip to Main Content */}
            <a href="#main-content" className="india-skip-link">
              Skip to Main Content
            </a>

            <span className="india-access-pipe">|</span>

            {/* Font Size Scaling */}
            <div className="india-font-ctrls">
              <button
                type="button"
                className={`india-font-btn ${fontSize === 'normal' ? 'active' : ''}`}
                onClick={() => setFontSize('normal')}
                title="Normal text size"
              >
                A-
              </button>
              <button
                type="button"
                className={`india-font-btn ${fontSize === 'large' ? 'active' : ''}`}
                onClick={() => setFontSize('large')}
                title="Large text size"
              >
                A
              </button>
              <button
                type="button"
                className={`india-font-btn ${fontSize === 'larger' ? 'active' : ''}`}
                onClick={() => setFontSize('larger')}
                title="Largest text size"
              >
                A+
              </button>
            </div>

            <span className="india-access-pipe">|</span>

            <span className="india-access-lang">
              <strong>English</strong>
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. MAIN LOGO & SEARCH HEADER (ENGLISH ONLY)
          ========================================================================= */}
      <header className="india-main-header">
        <div className="india-gov-wrap india-header-inner">
          {/* Emblem & Portal Title */}
          <div className="india-emblem-group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="india-emblem-box" title="National Safety Core">
              <div className="india-emblem-circle">
                <span className="india-lion-icon">🏛️</span>
                <span className="india-satyameva">SAFETY FIRST</span>
              </div>
            </div>

            <div className="india-portal-titles">
              <span className="india-portal-hindi">NATIONAL PRECURSOR INTELLIGENCE PORTAL</span>
              <h1 className="india-portal-english">
                SIF-GUARD <span className="india-portal-sub">NATIONAL PRECURSOR PORTAL</span>
              </h1>
              <span className="india-portal-psu">
                OIL INDIA LIMITED // A Maharatna Public Sector Undertaking
              </span>
            </div>
          </div>

          {/* Official Search Bar with Dropdown */}
          <div className="india-header-search">
            <div className="india-search-box">
              <Search className="india-search-icon" size={18} />
              <input
                type="text"
                className="india-search-input"
                placeholder="Search directives, OISD standards, facilities, precursor records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="india-search-category"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                aria-label="Filter Search by Category"
              >
                <option value="all">All Categories</option>
                <option value="critical">Critical SIF Precursors</option>
                <option value="oisd">OISD Standards</option>
                <option value="dgms">DGMS Directives</option>
                <option value="permits">Work Permits (PTW)</option>
                <option value="facilities">Monitored Facilities</option>
              </select>
              <button
                type="button"
                className="india-search-btn"
                onClick={onEnterPlatform}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          4. OFFICIAL PRIMARY NAVIGATION BAR (ENGLISH ONLY)
          ========================================================================= */}
      <nav className="india-nav-bar" aria-label="Primary Navigation">
        <div className="india-gov-wrap india-nav-inner">
          <ul className="india-nav-list">
            <li><a href="#main-content" className="india-nav-link active">Home</a></li>
            <li><a href="#safety-topics" className="india-nav-link">Topics &amp; LSRs</a></li>
            <li><a href="#precursor-feed" className="india-nav-link">Precursor Audits</a></li>
            <li><a href="#facilities" className="india-nav-link">Monitored Facilities</a></li>
            <li><a href="#statutory" className="india-nav-link">Statutory Standards</a></li>
            <li><a href="#about-oil" className="india-nav-link">About Oil India Ltd</a></li>
          </ul>

          <div className="india-nav-right">
            <button
              type="button"
              className="india-officer-btn"
              onClick={onEnterPlatform}
            >
              <span>Officer Portal Login</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* =========================================================================
          5. STATUTORY NOTICE TICKER
          ========================================================================= */}
      <div className="india-notice-ticker">
        <div className="india-gov-wrap india-ticker-inner">
          <div className="india-ticker-badge">
            <Bell size={13} />
            <span>STATUTORY NOTICE</span>
          </div>
          <div className="india-ticker-content">
            <p>
              Under OISD Standard 156 &amp; DGMS safety regulations, all high-pressure hydrocarbon installations must enforce secondary LOTO padlock verification and continuous 4-gas monitoring prior to permit re-validation.
            </p>
          </div>
          <div className="india-ticker-date">
            <span>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          6. HERO / SPOTLIGHT BANNER (REVERTED: NO NARENDRA MODI IMAGE, ENGLISH ONLY)
          ========================================================================= */}
      <main id="main-content" className="india-spotlight-section">
        <div className="india-gov-wrap">
          <div className="india-spotlight-card">
            {/* Left Column: National Safety Mandate */}
            <div className="india-spotlight-left">
              <div className="india-mandate-badge">
                <ShieldAlert size={14} />
                <span>NATIONAL MISSION FOR ZERO FATALITY IN ENERGY SECTOR</span>
              </div>

              <h2 className="india-spotlight-title">
                AI-Powered Precursor Intelligence for Oil &amp; Gas Installations
              </h2>

              <p className="india-spotlight-text">
                The <strong>SIF-Guard National Portal</strong> provides real-time leading indicator telemetry across India&apos;s critical energy infrastructure. By applying fine-tuned transformer NLP and gradient-boosted decision trees to daily permits to work (PTW) and contractor shift logs, SIF-Guard isolates Serious Injury &amp; Fatality (SIF) precursors before barrier defenses fail.
              </p>

              <div className="india-spotlight-actions">
                <button
                  type="button"
                  className="india-btn-primary"
                  onClick={onEnterPlatform}
                >
                  <span>Access Command Center</span>
                  <ArrowRight size={16} />
                </button>

                <a href="#precursor-feed" className="india-btn-secondary">
                  <span>View Live Audit Stream</span>
                </a>
              </div>

              {/* Statistics Strip */}
              <div className="india-stats-grid">
                <div className="india-stat-item">
                  <span className="india-stat-num">94.2%</span>
                  <span className="india-stat-label">Precursor Precision</span>
                </div>
                <div className="india-stat-item">
                  <span className="india-stat-num">4 / 4</span>
                  <span className="india-stat-label">Hubs Monitored</span>
                </div>
                <div className="india-stat-item">
                  <span className="india-stat-num">Sub-100ms</span>
                  <span className="india-stat-label">Interlock Latency</span>
                </div>
                <div className="india-stat-item">
                  <span className="india-stat-num">OISD-156</span>
                  <span className="india-stat-label">Statutory Compliance</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Real-Time Asset Telemetry & Precursor Card (Clean National Portal Dossier) */}
            <div className="india-spotlight-right">
              <div className="india-telemetry-panel">
                <div className="india-panel-head">
                  <div className="india-panel-status">
                    <span className="india-panel-pulse" />
                    <span>CENTRAL DCS TELEMETRY // ACTIVE</span>
                  </div>
                  <span className="india-panel-latency">LATENCY: 18ms</span>
                </div>

                <div className="india-panel-alert">
                  <div className="india-panel-alert-icon">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h4 className="india-panel-alert-title">Energy Isolation (LOTO) Omission</h4>
                    <p className="india-panel-alert-desc">Duliajan Central Facility // Booster Pump BP-04</p>
                  </div>
                  <span className="india-panel-sev">CRITICAL</span>
                </div>

                {/* Swiss Cheese Barrier Status */}
                <div className="india-panel-barriers">
                  <span className="india-barriers-label">DEFENSIVE BARRIER INTEGRITY VERIFICATION</span>

                  <div className="india-barrier-bar-item">
                    <div className="india-barrier-bar-head">
                      <span>Physical Padlock LOTO Verification</span>
                      <strong className="text-danger">28% (BREACHED)</strong>
                    </div>
                    <div className="india-barrier-bar-track">
                      <div className="india-barrier-bar-fill bg-danger" style={{ width: '28%' }} />
                    </div>
                  </div>

                  <div className="india-barrier-bar-item">
                    <div className="india-barrier-bar-head">
                      <span>Atmospheric LEL Sniff Clearance</span>
                      <strong className="text-success">92% (INTACT)</strong>
                    </div>
                    <div className="india-barrier-bar-track">
                      <div className="india-barrier-bar-fill bg-success" style={{ width: '92%' }} />
                    </div>
                  </div>

                  <div className="india-barrier-bar-item">
                    <div className="india-barrier-bar-head">
                      <span>PTW Energy Work Authorization</span>
                      <strong className="text-warning">54% (DEGRADED)</strong>
                    </div>
                    <div className="india-barrier-bar-track">
                      <div className="india-barrier-bar-fill bg-warning" style={{ width: '54%' }} />
                    </div>
                  </div>
                </div>

                {/* Hardware Action Box */}
                <div className="india-panel-action">
                  <span className="india-action-tag">AUTOMATED INTERLOCK DISPATCH</span>
                  <code>TRIP COMMAND DISPATCHED TO MOTOR CONTROL CENTER (MCC-04)</code>
                </div>

                <button
                  type="button"
                  className="india-panel-btn"
                  onClick={onEnterPlatform}
                >
                  <span>Authorize Override in Command Center</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================================
          7. KEY LIFE-SAVING RULES & SAFETY TOPICS (india.gov.in Services Grid)
          ========================================================================= */}
      <section id="safety-topics" className="india-section">
        <div className="india-gov-wrap">
          <div className="india-section-header">
            <div>
              <span className="india-section-category">LIFE-SAVING RULES &amp; STATUTORY FOCUS AREAS</span>
              <h2 className="india-section-title">Critical Safety Defenses under Active Surveillance</h2>
            </div>
            <a href="#precursor-feed" className="india-view-all-link">
              View Audit Ledger <ChevronRight size={14} />
            </a>
          </div>

          <div className="india-topics-grid">
            {SAFETY_TOPICS.map((topic) => {
              const Icon = topic.icon;
              return (
                <div key={topic.id} className="india-topic-card">
                  <div className="india-topic-card-top">
                    <div className="india-topic-icon-wrap">
                      <Icon size={22} />
                    </div>
                    <span
                      className="india-topic-badge"
                      style={{ backgroundColor: `${topic.badgeColor}15`, color: topic.badgeColor, borderColor: `${topic.badgeColor}35` }}
                    >
                      {topic.badge}
                    </span>
                  </div>

                  <h3 className="india-topic-title">{topic.title}</h3>
                  <span className="india-topic-code">{topic.code}</span>
                  <p className="india-topic-desc">{topic.desc}</p>

                  <div className="india-topic-footer">
                    <button
                      type="button"
                      className="india-topic-action-btn"
                      onClick={onEnterPlatform}
                    >
                      <span>Inspect Telemetry</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. PRECURSOR AUDIT STREAM & REGULATORY VERIFICATION
          ========================================================================= */}
      <section id="precursor-feed" className="india-section bg-alt">
        <div className="india-gov-wrap">
          <div className="india-section-header">
            <div>
              <span className="india-section-category">LIVE INCIDENT &amp; PRECURSOR INTELLIGENCE</span>
              <h2 className="india-section-title">Audited Field Precursor Records</h2>
            </div>
            <div className="india-tabs-group">
              <button
                type="button"
                className={`india-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Records
              </button>
              <button
                type="button"
                className={`india-tab-btn ${activeTab === 'critical' ? 'active' : ''}`}
                onClick={() => setActiveTab('critical')}
              >
                Critical SIFs
              </button>
              <button
                type="button"
                className={`india-tab-btn ${activeTab === 'circulars' ? 'active' : ''}`}
                onClick={() => setActiveTab('circulars')}
              >
                Safety Circulars
              </button>
            </div>
          </div>

          <div className="india-audit-layout">
            {/* Left list of records */}
            <div className="india-audit-list">
              {filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className={`india-audit-card ${selectedRecord.id === record.id ? 'selected' : ''}`}
                  onClick={() => setSelectedRecord(record)}
                >
                  <div className="india-audit-card-head">
                    <span className="india-audit-id">{record.id}</span>
                    <span
                      className="india-sif-pill"
                      style={{ color: record.color, borderColor: `${record.color}40`, backgroundColor: `${record.color}10` }}
                    >
                      {record.sifLevel}
                    </span>
                  </div>
                  <h4 className="india-audit-card-title">{record.title}</h4>
                  <p className="india-audit-card-asset">{record.asset}</p>
                  <div className="india-audit-card-meta">
                    <span>XGBoost Confidence: <strong>{record.score}</strong></span>
                    <span>•</span>
                    <span>{record.rule}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Right preview dossier of selected record */}
            <div className="india-audit-dossier">
              <div className="india-dossier-card">
                <div className="india-dossier-header">
                  <div className="india-dossier-header-top">
                    <span className="india-dossier-badge">OFFICIAL COMPLIANCE DOSSIER</span>
                    <span className="india-dossier-id">{selectedRecord.id}</span>
                  </div>
                  <h3 className="india-dossier-title">{selectedRecord.title}</h3>
                  <div className="india-dossier-asset-bar">
                    <MapPin size={14} />
                    <span>{selectedRecord.asset}</span>
                  </div>
                </div>

                <div className="india-dossier-body">
                  <div className="india-dossier-row">
                    <span className="india-dossier-label">RAW FIELD OBSERVATION / PERMIT NARRATIVE:</span>
                    <p className="india-dossier-text">&ldquo;{selectedRecord.rawText}&rdquo;</p>
                  </div>

                  <div className="india-dossier-grid">
                    <div className="india-dossier-cell">
                      <span className="india-cell-label">APPLICABLE RULE</span>
                      <strong className="india-cell-val">{selectedRecord.rule}</strong>
                    </div>
                    <div className="india-dossier-cell">
                      <span className="india-cell-label">PRECURSOR SEVERITY</span>
                      <strong className="india-cell-val" style={{ color: selectedRecord.color }}>
                        {selectedRecord.sifLevel} ({selectedRecord.score})
                      </strong>
                    </div>
                  </div>

                  <div className="india-dossier-barrier">
                    <span className="india-cell-label">COMPROMISED DEFENSIVE BARRIER</span>
                    <div className="india-barrier-alert">
                      <AlertTriangle size={16} />
                      <span>{selectedRecord.barrier}</span>
                    </div>
                  </div>

                  <div className="india-dossier-action">
                    <span className="india-cell-label">AUTOMATED SAFETY INTERLOCK DISPATCH</span>
                    <div className="india-action-box">
                      <code>{selectedRecord.hardwareAction}</code>
                    </div>
                  </div>
                </div>

                <div className="india-dossier-footer">
                  <button
                    type="button"
                    className="india-btn-primary full-width"
                    onClick={onEnterPlatform}
                  >
                    <span>Authorize Corrective Action in Command Center</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. MONITORED OIL INDIA INSTALLATIONS (Facilities Grid)
          ========================================================================= */}
      <section id="facilities" className="india-section">
        <div className="india-gov-wrap">
          <div className="india-section-header">
            <div>
              <span className="india-section-category">STATE-OF-THE-ART OPERATIONAL ASSETS</span>
              <h2 className="india-section-title">Monitored Facilities in Assam &amp; Rajasthan</h2>
            </div>
            <span className="india-status-pill">
              <span className="india-dot pulse" /> All Telemetry Streams Online
            </span>
          </div>

          <div className="india-facilities-grid">
            {MONITORED_ASSETS.map((asset) => (
              <div key={asset.id} className="india-facility-card">
                <div className="india-facility-head">
                  <div>
                    <span className="india-facility-id">{asset.id}</span>
                    <h3 className="india-facility-name">{asset.name}</h3>
                  </div>
                  <span className={`india-asset-status ${asset.status === 'NORMAL' ? 'normal' : 'watch'}`}>
                    {asset.status}
                  </span>
                </div>

                <div className="india-facility-loc">
                  <MapPin size={13} />
                  <span>{asset.location}</span>
                </div>

                <p className="india-facility-type">{asset.type}</p>

                <div className="india-facility-specs">
                  <div className="india-spec-chip">
                    <FileCheck size={12} />
                    <span>{asset.permits}</span>
                  </div>
                  <div className="india-spec-chip">
                    <Radio size={12} />
                    <span>{asset.sensors}</span>
                  </div>
                  <div className="india-spec-chip">
                    <Shield size={12} />
                    <span>{asset.interlocks}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="india-facility-btn"
                  onClick={onEnterPlatform}
                >
                  <span>Inspect Plant Digital Twin</span>
                  <ExternalLink size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          10. STATUTORY STANDARDS & LEGAL ACCREDITATIONS
          ========================================================================= */}
      <section id="statutory" className="india-section bg-alt">
        <div className="india-gov-wrap">
          <div className="india-standards-box">
            <div className="india-standards-left">
              <span className="india-section-category">STATUTORY &amp; REGULATORY FRAMEWORK</span>
              <h2 className="india-section-title">Enforcing Statutory Safety Directives</h2>
              <p className="india-standards-p">
                SIF-Guard operates under strict compliance with the Oil Industry Safety Directorate (OISD), Directorate General of Mines Safety (DGMS), and Ministry of Petroleum &amp; Natural Gas guidelines for hydrocarbon installations.
              </p>
            </div>

            <div className="india-standards-list">
              <div className="india-std-item">
                <div className="india-std-icon">📜</div>
                <div>
                  <strong>OISD Standard 156</strong>
                  <span>Fire Protection and Safety Management in Petroleum Refineries &amp; Processing Units</span>
                </div>
              </div>
              <div className="india-std-item">
                <div className="india-std-icon">🏛️</div>
                <div>
                  <strong>DGMS Safety Circulars</strong>
                  <span>Directorate General of Mines Safety Statutory Directives for Hydrocarbon Extraction</span>
                </div>
              </div>
              <div className="india-std-item">
                <div className="india-std-icon">⚖️</div>
                <div>
                  <strong>Petroleum &amp; Natural Gas Regulatory Board (PNGRB)</strong>
                  <span>Technical Standards &amp; Specifications including Safety Standards (TSSR)</span>
                </div>
              </div>
              <div className="india-std-item">
                <div className="india-std-icon">🛡️</div>
                <div>
                  <strong>API RP 754 &amp; OSHA 1910.119</strong>
                  <span>Process Safety Leading Indicators and Process Safety Management (PSM) Compliance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          11. NATIONAL PORTAL OFFICIAL FOOTER (ENGLISH ONLY)
          ========================================================================= */}
      <footer className="india-gov-footer">
        <div className="india-top-stripe" />
        <div className="india-gov-wrap india-footer-content">
          <div className="india-footer-grid">
            <div className="india-footer-col">
              <div className="india-footer-brand">
                <span className="india-footer-emblem">🏛️</span>
                <div>
                  <h4 className="india-footer-title">National Safety Portal</h4>
                  <p className="india-footer-sub">SIF-Guard Industrial Safety Intelligence Core</p>
                </div>
              </div>
              <p className="india-footer-desc">
                An official platform under the Ministry of Petroleum &amp; Natural Gas, operated by Oil India Limited for real-time SIF precursor isolation and disaster prevention.
              </p>
            </div>

            <div className="india-footer-col">
              <h5 className="india-footer-heading">Portals &amp; Links</h5>
              <ul className="india-footer-links">
                <li><a href="https://www.india.gov.in/" target="_blank" rel="noreferrer">National Safety Portal</a></li>
                <li><a href="https://mopng.gov.in/" target="_blank" rel="noreferrer">Ministry of Petroleum &amp; Natural Gas</a></li>
                <li><a href="https://www.oil-india.com/" target="_blank" rel="noreferrer">Oil India Limited Corporate Portal</a></li>
                <li><a href="https://www.oisd.gov.in/" target="_blank" rel="noreferrer">Oil Industry Safety Directorate (OISD)</a></li>
                <li><a href="https://www.dgms.gov.in/" target="_blank" rel="noreferrer">Directorate General of Mines Safety (DGMS)</a></li>
              </ul>
            </div>

            <div className="india-footer-col">
              <h5 className="india-footer-heading">Statutory Directives</h5>
              <ul className="india-footer-links">
                <li><a href="#safety-topics">Life-Saving Rules (LSR 01-08)</a></li>
                <li><a href="#safety-topics">Energy Isolation (LOTO) Protocol</a></li>
                <li><a href="#safety-topics">Hot Work Atmospheric Sniffing</a></li>
                <li><a href="#safety-topics">Confined Space Vessel Clearance</a></li>
                <li><a href="#safety-topics">Swiss Cheese Barrier Modeling</a></li>
              </ul>
            </div>

            <div className="india-footer-col">
              <h5 className="india-footer-heading">Officer Portal</h5>
              <p className="india-footer-desc">
                Authorized HSE auditors and safety engineers can log in using their credentials or local demo auditor keys.
              </p>
              <button
                type="button"
                className="india-btn-primary small"
                onClick={onEnterPlatform}
              >
                <span>Launch Command Center</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="india-footer-bottom">
            <div className="india-footer-copy">
              <p>© {new Date().getFullYear()} Ministry of Petroleum &amp; Natural Gas / Oil India Limited.</p>
              <p>Site Designed and Hosted by SIF-Guard Engineering Team. Content provided by Oil India Limited.</p>
            </div>

            <div className="india-footer-credits">
              <span className="india-credit-badge">Digital India Initiative</span>
              <span className="india-credit-badge">OISD-156 Certified</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
