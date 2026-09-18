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
  X,
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

interface SearchItem {
  id: string;
  title: string;
  category: 'critical' | 'oisd' | 'dgms' | 'permits' | 'facilities';
  categoryLabel: string;
  subtitle: string;
  targetId: string;
  recordId?: string;
  badge: string;
  badgeColor?: string;
}

const SEARCHABLE_ITEMS: SearchItem[] = [
  // Critical SIF Precursors
  {
    id: 'sif-041',
    title: 'Bypassed Energy Isolation (LOTO Omission)',
    category: 'critical',
    categoryLabel: 'Critical SIF',
    subtitle: 'Duliajan CPF // Booster Pump BP-04 (LSR-01)',
    targetId: 'precursor-feed',
    recordId: 'OIL/HSE/2026/041',
    badge: '96.8% Confidence',
    badgeColor: '#dc2626',
  },
  {
    id: 'sif-058',
    title: 'Confined Space Entry without Gas Clearance',
    category: 'critical',
    categoryLabel: 'Critical SIF',
    subtitle: 'Digboi Gathering Station // Storage Tank T-104 (LSR-03)',
    targetId: 'precursor-feed',
    recordId: 'OIL/HSE/2026/058',
    badge: '98.4% Confidence',
    badgeColor: '#ea580c',
  },
  {
    id: 'sif-072',
    title: 'Hot Work in Flammable Vapor Boundary',
    category: 'critical',
    categoryLabel: 'Critical SIF',
    subtitle: 'Sivasagar Gas Station // Flange F-12 (LSR-02)',
    targetId: 'precursor-feed',
    recordId: 'OIL/HSE/2026/072',
    badge: '99.1% Confidence',
    badgeColor: '#dc2626',
  },
  {
    id: 'sif-089',
    title: 'Work at Height Rigging without Fall Arrest',
    category: 'critical',
    categoryLabel: 'High SIF',
    subtitle: 'Jaisalmer Basin Gas Complex // Flare Riser R-08 (LSR-04)',
    targetId: 'precursor-feed',
    recordId: 'OIL/HSE/2026/089',
    badge: '93.5% Confidence',
    badgeColor: '#d97706',
  },
  // OISD Standards
  {
    id: 'oisd-156',
    title: 'OISD Standard 156',
    category: 'oisd',
    categoryLabel: 'OISD Standard',
    subtitle: 'Fire Protection and Safety Management in Refineries & Processing Units',
    targetId: 'statutory',
    badge: 'Statutory Code',
    badgeColor: '#003366',
  },
  {
    id: 'oisd-105',
    title: 'OISD Standard 105 (PTW System)',
    category: 'oisd',
    categoryLabel: 'OISD Standard',
    subtitle: 'Work Permit System for Hydrocarbon Processing Units',
    targetId: 'statutory',
    badge: 'Standard',
    badgeColor: '#003366',
  },
  {
    id: 'oisd-166',
    title: 'OISD-GDN-166 (Elevated Work)',
    category: 'oisd',
    categoryLabel: 'OISD Standard',
    subtitle: 'Guidelines for Safety in Working at Heights and Scaffolding Inspection',
    targetId: 'statutory',
    badge: 'Guideline',
    badgeColor: '#003366',
  },
  // DGMS Directives
  {
    id: 'dgms-01',
    title: 'DGMS Safety Circulars (Oil Mines)',
    category: 'dgms',
    categoryLabel: 'DGMS Directive',
    subtitle: 'Statutory Directives for Hydrocarbon Extraction & Mechanical Ventilation',
    targetId: 'statutory',
    badge: 'Statutory',
    badgeColor: '#b45309',
  },
  {
    id: 'dgms-02',
    title: 'DGMS Sniffing & Combustible Gas Protocol',
    category: 'dgms',
    categoryLabel: 'DGMS Directive',
    subtitle: 'Mandatory continuous gas testing within 15m radius before hot work',
    targetId: 'safety-topics',
    badge: 'Circular',
    badgeColor: '#b45309',
  },
  // Work Permits (PTW) & LSRs
  {
    id: 'ptw-loto',
    title: 'LSR 01: Energy Isolation (LOTO)',
    category: 'permits',
    categoryLabel: 'Work Permit / LSR',
    subtitle: 'Physical zero-energy lockout and padlock verification before maintenance',
    targetId: 'safety-topics',
    badge: 'Life-Saving Rule',
    badgeColor: '#b45309',
  },
  {
    id: 'ptw-sniff',
    title: 'LSR 02: Hot Work & Atmospheric Sniffing',
    category: 'permits',
    categoryLabel: 'Work Permit / LSR',
    subtitle: 'Continuous atmospheric LEL sniffing within 15 meters of cutting & welding',
    targetId: 'safety-topics',
    badge: 'Life-Saving Rule',
    badgeColor: '#dc2626',
  },
  {
    id: 'ptw-confined',
    title: 'LSR 03: Confined Space Vessel Entry',
    category: 'permits',
    categoryLabel: 'Work Permit / LSR',
    subtitle: 'Certified 4-gas atmospheric tests, standby rescue officer, and ventilation',
    targetId: 'safety-topics',
    badge: 'Life-Saving Rule',
    badgeColor: '#003366',
  },
  {
    id: 'ptw-heights',
    title: 'LSR 04: Working at Elevated Heights',
    category: 'permits',
    categoryLabel: 'Work Permit / LSR',
    subtitle: 'Dual-lanyard 100% tie-off, certified anchor points, and scaffolding tags',
    targetId: 'safety-topics',
    badge: 'Life-Saving Rule',
    badgeColor: '#15803d',
  },
  {
    id: 'ptw-swiss',
    title: 'Swiss Cheese Barrier Engine',
    category: 'permits',
    categoryLabel: 'Safety Modeling',
    subtitle: 'Real-time telemetry tracking of passive, active, and administrative barriers',
    targetId: 'safety-topics',
    badge: 'Predictive Model',
    badgeColor: '#6b21a8',
  },
  {
    id: 'ptw-ocr',
    title: 'Multimodal PTW Ingestion & OCR',
    category: 'permits',
    categoryLabel: 'AI Digitization',
    subtitle: 'OCR extraction of scanned handwritten permits to work with hazard categorization',
    targetId: 'safety-topics',
    badge: 'AI Core',
    badgeColor: '#0369a1',
  },
  // Monitored Facilities
  {
    id: 'fac-duliajan',
    title: 'Duliajan Central Processing Facility (CPF)',
    category: 'facilities',
    categoryLabel: 'Facility',
    subtitle: 'Dibrugarh District, Assam — Crude Oil & Gas Dehydration Hub',
    targetId: 'facilities',
    badge: 'OIL-CPF-01',
    badgeColor: '#15803d',
  },
  {
    id: 'fac-digboi',
    title: 'Digboi Field Gathering & Pumping Station',
    category: 'facilities',
    categoryLabel: 'Facility',
    subtitle: 'Tinsukia District, Assam — Historic Production Wells & Distribution',
    targetId: 'facilities',
    badge: 'OIL-DGB-02',
    badgeColor: '#15803d',
  },
  {
    id: 'fac-sivasagar',
    title: 'Sivasagar High-Pressure Wellheads & Manifolds',
    category: 'facilities',
    categoryLabel: 'Facility',
    subtitle: 'Sivasagar District, Assam — Deep Extraction Manifolds & Flaring Unit',
    targetId: 'facilities',
    badge: 'OIL-SVS-03',
    badgeColor: '#d97706',
  },
  {
    id: 'fac-jaisalmer',
    title: 'Jaisalmer Natural Gas Extraction Complex',
    category: 'facilities',
    categoryLabel: 'Facility',
    subtitle: 'Jaisalmer Basin, Rajasthan — High-Sulfur Gas Compression & Processing',
    targetId: 'facilities',
    badge: 'OIL-RAJ-04',
    badgeColor: '#15803d',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterPlatform,
}) => {
  const [selectedRecord, setSelectedRecord] = useState(AUDIT_RECORDS[0]);
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'circulars'>('all');
  const [searchCategory, setSearchCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeSearchFilter, setActiveSearchFilter] = useState<{ query: string; category: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<'small' | 'normal' | 'large'>(() => {
    try {
      const saved = localStorage.getItem('sif_portal_font_size');
      if (saved === 'small' || saved === 'normal' || saved === 'large') return saved;
    } catch {
      // ignore
    }
    return 'normal';
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preload refinery.webp on landing page mount only
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = '/images/refinery.webp';
    link.type = 'image/webp';
    document.head.appendChild(link);
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  const handleFontSizeChange = (size: 'small' | 'normal' | 'large') => {
    setFontSize(size);
    try {
      localStorage.setItem('sif_portal_font_size', size);
    } catch {
      // ignore
    }
    const label = size === 'small' ? 'Decreased (90%)' : size === 'large' ? 'Increased (112%)' : 'Standard (100%)';
    setToastMessage(`Text Size: ${label}`);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const searchMatches = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return SEARCHABLE_ITEMS.filter((item) => {
      const matchesCategory = searchCategory === 'all' || item.category === searchCategory;
      if (!matchesCategory) return false;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q) ||
        (item.recordId && item.recordId.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, searchCategory]);

  const handleSelectSearchResult = (item: SearchItem) => {
    setIsSearchOpen(false);
    setActiveSearchFilter({ query: searchQuery, category: searchCategory });

    if (item.recordId) {
      const rec = AUDIT_RECORDS.find((r) => r.id === item.recordId);
      if (rec) setSelectedRecord(rec);
    }

    const targetEl = document.getElementById(item.targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      targetEl.classList.add('india-section-highlight');
      setTimeout(() => targetEl.classList.remove('india-section-highlight'), 2200);
    }
  };

  const handleExecuteSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setIsSearchOpen(false);
      setActiveSearchFilter(null);
      return;
    }

    setIsSearchOpen(false);
    setActiveSearchFilter({ query: searchQuery, category: searchCategory });

    if (searchMatches.length > 0) {
      handleSelectSearchResult(searchMatches[0]);
    } else {
      const feed = document.getElementById('precursor-feed');
      if (feed) feed.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearchFilter(null);
    setIsSearchOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    const matchesTab = activeTab === 'all' || rec.category === activeTab;
    if (!matchesTab) return false;

    if (activeSearchFilter?.query) {
      const q = activeSearchFilter.query.toLowerCase().trim();
      return (
        rec.id.toLowerCase().includes(q) ||
        rec.title.toLowerCase().includes(q) ||
        rec.asset.toLowerCase().includes(q) ||
        rec.rule.toLowerCase().includes(q) ||
        rec.rawText.toLowerCase().includes(q)
      );
    }

    return true;
  });

  return (
    <div className="india-gov-page">
      {/* =========================================================================
          FIXED ANIMATED BACKGROUND LAYER (REFINERY.WEBP + SLOW KEN BURNS + SCRIM)
          Stationary behind content, position: fixed, inset: 0, outside any transform/filter
          ========================================================================= */}
      <div className="landing-bg-fixed" aria-hidden="true">
        <div className="landing-bg-image" />
        <div className="landing-bg-scrim" />
      </div>

      {/* Landing Page Content Wrapper with Transparent Base */}
      <div className={`landing-content-wrapper font-size-${fontSize}`}>
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
            <div className="india-font-ctrls" role="group" aria-label="Text Size Controls">
              <button
                type="button"
                className={`india-font-btn ${fontSize === 'small' ? 'active' : ''}`}
                onClick={() => handleFontSizeChange('small')}
                title="Decrease text size (90%)"
                aria-label="Decrease text size (A-)"
              >
                A-
              </button>
              <button
                type="button"
                className={`india-font-btn ${fontSize === 'normal' ? 'active' : ''}`}
                onClick={() => handleFontSizeChange('normal')}
                title="Standard text size (100%)"
                aria-label="Standard text size (A)"
              >
                A
              </button>
              <button
                type="button"
                className={`india-font-btn ${fontSize === 'large' ? 'active' : ''}`}
                onClick={() => handleFontSizeChange('large')}
                title="Increase text size (112%)"
                aria-label="Increase text size (A+)"
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

          {/* Official Search Bar with Interactive Autocomplete Dropdown */}
          <div className="india-header-search" ref={searchContainerRef}>
            <form onSubmit={handleExecuteSearch} className="india-search-box">
              <Search className="india-search-icon" size={18} />
              <input
                type="text"
                className="india-search-input"
                placeholder="Search directives, OISD standards, facilities, precursor records..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="india-search-clear"
                  onClick={handleClearSearch}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
              <select
                className="india-search-category"
                value={searchCategory}
                onChange={(e) => {
                  setSearchCategory(e.target.value);
                  setIsSearchOpen(true);
                }}
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
                type="submit"
                className="india-search-btn"
                title="Execute search"
              >
                Search
              </button>
            </form>

            {/* Interactive Search Results Dropdown */}
            {isSearchOpen && searchQuery.trim().length > 0 && (
              <div className="india-search-dropdown" role="listbox">
                <div className="india-search-dropdown-header">
                  <span>
                    {searchMatches.length} matching result{searchMatches.length === 1 ? '' : 's'} in{' '}
                    <strong>
                      {searchCategory === 'all'
                        ? 'All Categories'
                        : searchCategory === 'critical'
                        ? 'Critical SIF Precursors'
                        : searchCategory === 'oisd'
                        ? 'OISD Standards'
                        : searchCategory === 'dgms'
                        ? 'DGMS Directives'
                        : searchCategory === 'permits'
                        ? 'Work Permits / LSR'
                        : 'Facilities'}
                    </strong>
                  </span>
                  <span className="india-search-dropdown-hint">Click or press Enter</span>
                </div>

                {searchMatches.length > 0 ? (
                  <div className="india-search-results-list">
                    {searchMatches.map((item) => (
                      <div
                        key={item.id}
                        className="india-search-result-item"
                        onClick={() => handleSelectSearchResult(item)}
                        role="option"
                        aria-selected={false}
                      >
                        <div className="india-search-result-left">
                          <span
                            className="india-search-badge"
                            style={{
                              borderColor: item.badgeColor ? `${item.badgeColor}40` : '#cbd5e1',
                              color: item.badgeColor || '#003366',
                              backgroundColor: item.badgeColor ? `${item.badgeColor}12` : '#f1f5f9',
                            }}
                          >
                            {item.categoryLabel}
                          </span>
                          <div>
                            <h5 className="india-search-result-title">{item.title}</h5>
                            <p className="india-search-result-sub">{item.subtitle}</p>
                          </div>
                        </div>
                        <span className="india-search-jump-icon">
                          <ArrowRight size={14} />
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="india-search-no-results">
                    <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0 }} />
                    <div>
                      <strong>No matching directives or records found.</strong>
                      <p>Try searching for "LOTO", "OISD", "sniffing", "Digboi", or "Assam".</p>
                    </div>
                  </div>
                )}
              </div>
            )}
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

          {/* Active Search Filter Status Banner */}
          {activeSearchFilter?.query && (
            <div className="india-search-active-bar">
              <span>
                Filtering records matching: <strong>"{activeSearchFilter.query}"</strong> ({filteredRecords.length} record{filteredRecords.length === 1 ? '' : 's'} found)
              </span>
              <button
                type="button"
                className="india-clear-filter-btn"
                onClick={handleClearSearch}
                title="Reset search and show all records"
              >
                <X size={13} />
                <span>Clear Filter</span>
              </button>
            </div>
          )}

          <div className="india-audit-layout">
            {/* Left list of records */}
            <div className="india-audit-list">
              {filteredRecords.length === 0 ? (
                <div style={{ padding: '24px', background: '#ffffff', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#64748b' }}>
                  <AlertTriangle size={20} color="#d97706" style={{ marginBottom: '8px' }} />
                  <h4 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '0.9rem' }}>No records matched "{activeSearchFilter?.query}"</h4>
                  <p style={{ margin: '0 0 12px', fontSize: '0.78rem' }}>Try searching for "LOTO", "sniffing", "Digboi", or clear the filter.</p>
                  <button type="button" className="india-clear-filter-btn" onClick={handleClearSearch}>
                    Show All Records
                  </button>
                </div>
              ) : (
                filteredRecords.map((record) => (
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
                ))
              )}
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
      <footer id="about-oil" className="india-gov-footer">
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

      {/* Accessibility Toast Feedback */}
      {toastMessage && (
        <div className="india-a11y-toast" role="status" aria-live="polite">
          <Activity size={16} color="#ff9933" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
