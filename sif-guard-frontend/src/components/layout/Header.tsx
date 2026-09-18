import React, { useEffect, useState } from 'react';
import {
  Server,
  CheckCircle2,
  XCircle,
  Globe,
  Eye,
  ArrowDown,
} from 'lucide-react';
import { getHealth } from '../../api/review';
import type { HealthResponse } from '../../types/api';
import { useAuth } from '../../context/AuthContext';
import { UserMenu } from './UserMenu';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenShortcuts?: () => void;
  isPlaying?: boolean;
  onToggleAudio?: () => void;
}

/** National Emblem of India (Lion Capital of Ashoka with Satyameva Jayate) */
const NationalEmblemSvg: React.FC<{ size?: number }> = ({ size = 42 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <title>National Emblem of India (Government of India)</title>
    {/* Ashoka Pillar Top Base */}
    <path d="M20 90 L80 90 L75 96 L25 96 Z" fill="#B45309" opacity="0.9" />
    <rect x="30" y="84" width="40" height="6" rx="1" fill="#D97706" />
    
    {/* Ashoka Chakra Center */}
    <circle cx="50" cy="74" r="9" fill="none" stroke="#0D233A" strokeWidth="2" />
    <circle cx="50" cy="74" r="2" fill="#0D233A" />
    {[0, 30, 60, 90, 120, 150].map((deg) => (
      <line
        key={deg}
        x1="50"
        y1="65"
        x2="50"
        y2="83"
        stroke="#0D233A"
        strokeWidth="1"
        transform={`rotate(${deg} 50 74)`}
      />
    ))}
    
    {/* Lion Heads (3 Lions Representation) */}
    {/* Center Lion */}
    <path
      d="M38 32 C38 20 62 20 62 32 C65 42 62 58 50 64 C38 58 35 42 38 32 Z"
      fill="#D97706"
      stroke="#78350F"
      strokeWidth="1.5"
    />
    {/* Crown Mane details */}
    <path d="M42 26 Q50 18 58 26 Q50 24 42 26 Z" fill="#F59E0B" />
    <circle cx="45" cy="34" r="1.8" fill="#78350F" />
    <circle cx="55" cy="34" r="1.8" fill="#78350F" />
    <path d="M47 42 Q50 45 53 42" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
    
    {/* Left Lion Profile */}
    <path
      d="M26 38 C22 30 38 24 40 34 C38 46 32 54 26 50 Z"
      fill="#B45309"
      stroke="#78350F"
      strokeWidth="1"
    />
    
    {/* Right Lion Profile */}
    <path
      d="M74 38 C78 30 62 24 60 34 C62 46 68 54 74 50 Z"
      fill="#B45309"
      stroke="#78350F"
      strokeWidth="1"
    />

    {/* Satyameva Jayate Banner Text */}
    <rect x="15" y="100" width="70" height="14" rx="2" fill="#0D233A" />
    <text
      x="50"
      y="110"
      textAnchor="middle"
      fill="#FFFFFF"
      fontSize="7.5"
      fontWeight="700"
      fontFamily="Georgia, serif"
      letterSpacing="0.8"
    >
      सत्यमेव जयते
    </text>
  </svg>
);

/** Oil India Limited Brand Emblem SVG */
const OilIndiaBadgeSvg: React.FC<{ size?: number }> = ({ size = 38 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <title>Oil India Limited (OIL) PSU Brand Mark</title>
    <rect width="100" height="100" rx="6" fill="#003366" />
    <path d="M50 15 L80 35 L80 75 L50 90 L20 75 L20 35 Z" fill="none" stroke="#FF9933" strokeWidth="4" />
    {/* Petroleum Rig / Flame Motif */}
    <path d="M50 25 L62 70 L38 70 Z" fill="none" stroke="#FFFFFF" strokeWidth="3" />
    <line x1="42" y1="50" x2="58" y2="50" stroke="#FFFFFF" strokeWidth="2" />
    <line x1="45" y1="60" x2="55" y2="60" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="50" cy="38" r="4" fill="#FF9933" />
    <text x="50" y="84" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="800" fontFamily="sans-serif">
      OIL
    </text>
  </svg>
);

export const Header: React.FC<Props> = () => {
  const { user, profile, signOut } = useAuth();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'small'>('normal');

  useEffect(() => {
    getHealth()
      .then((data) => {
        setHealth(data);
        setError(false);
      })
      .catch(() => {
        setError(true);
      });
  }, []);

  const handleFontSizeChange = (size: 'small' | 'normal' | 'large') => {
    setFontSize(size);
    const root = document.documentElement;
    if (size === 'small') root.style.fontSize = '92%';
    else if (size === 'large') root.style.fontSize = '108%';
    else root.style.fontSize = '100%';
  };

  const handleSkipToMain = () => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.focus();
      mainEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#FFFFFF',
        borderBottom: '1px solid #D1D5DB',
      }}
    >
      {/* =========================================================================
         TIER 1: TOP UTILITY STRIP (Dark Navy #0D233A)
         ========================================================================= */}
      <div
        style={{
          backgroundColor: '#0D233A',
          color: '#E2E8F0',
          fontSize: '0.72rem',
          fontFamily: 'var(--font-sans)',
          minHeight: '34px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          style={{
            maxWidth: '1600px',
            width: '100%',
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          {/* Left: Official Ministry Line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: '#FF9933', letterSpacing: '0.04em' }}>
              GOVERNMENT OF INDIA
            </span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span style={{ fontWeight: 500, color: '#F1F5F9' }}>
              Ministry of Petroleum &amp; Natural Gas
            </span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span style={{ fontWeight: 600, color: '#CBD5E1' }}>Oil India Limited (A Maharatna PSU)</span>
          </div>

          {/* Right: Accessibility & Language Suite */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleSkipToMain}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#CBD5E1',
                fontSize: '0.7rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <ArrowDown size={10} /> Skip to Main Content
            </button>

            <span style={{ opacity: 0.3 }}>|</span>

            <button
              type="button"
              onClick={() => alert('Screen Reader Access Enabled (ARIA Live Region Active)')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#CBD5E1',
                fontSize: '0.7rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <Eye size={10} /> Screen Reader Access
            </button>

            <span style={{ opacity: 0.3 }}>|</span>

            {/* Font Size Controls: A- | A | A+ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
              <span style={{ fontSize: '0.66rem', color: '#94A3B8', marginRight: '2px' }}>Font:</span>
              <button
                type="button"
                onClick={() => handleFontSizeChange('small')}
                style={{
                  padding: '1px 5px',
                  borderRadius: '2px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: fontSize === 'small' ? '#FF9933' : 'transparent',
                  color: fontSize === 'small' ? '#000000' : '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.66rem',
                  cursor: 'pointer',
                }}
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => handleFontSizeChange('normal')}
                style={{
                  padding: '1px 5px',
                  borderRadius: '2px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: fontSize === 'normal' ? '#FF9933' : 'transparent',
                  color: fontSize === 'normal' ? '#000000' : '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.66rem',
                  cursor: 'pointer',
                }}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => handleFontSizeChange('large')}
                style={{
                  padding: '1px 5px',
                  borderRadius: '2px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: fontSize === 'large' ? '#FF9933' : 'transparent',
                  color: fontSize === 'large' ? '#000000' : '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.66rem',
                  cursor: 'pointer',
                }}
              >
                A+
              </button>
            </div>

            <span style={{ opacity: 0.3 }}>|</span>

            {/* Bhasha / Language Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Globe size={11} color="#FF9933" />
              <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.7rem' }}>English</span>
              <span style={{ opacity: 0.4 }}>/</span>
              <span style={{ fontWeight: 600, color: '#CBD5E1', fontSize: '0.7rem', cursor: 'pointer' }}>हिन्दी</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
         TIER 2: MAIN MASTHEAD (Pure White #FFFFFF)
         ========================================================================= */}
      <div
        style={{
          padding: '12px 24px',
          background: '#FFFFFF',
          borderBottom: '1px solid #D1D5DB',
          minHeight: '72px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '1600px',
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
          }}
        >
          {/* Left: National Emblem + Oil India Emblem + Formal Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
            {/* Emblems Container */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <NationalEmblemSvg size={44} />
              <div style={{ width: '1px', height: '36px', background: '#D1D5DB' }} />
              <OilIndiaBadgeSvg size={38} />
            </div>

            {/* Formal PSU Title Block */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#0D233A',
                    fontFamily: 'Georgia, serif',
                    letterSpacing: '-0.01em',
                    margin: 0,
                    lineHeight: 1.1,
                  }}
                >
                  SIF-GUARD
                </h1>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#205493',
                    fontFamily: 'var(--font-sans)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    borderLeft: '2px solid #FF9933',
                    paddingLeft: '6px',
                  }}
                >
                  Industrial Safety Operations Center
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#4B5563',
                  margin: 0,
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                }}
              >
                Oil India Limited — HSE Intelligence &amp; Precursor Surveillance Platform (OISD-156 &amp; DGMS Standards)
              </p>
            </div>
          </div>

          {/* Right: Crisp Bordered Utility Controls & User Dropdown */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexShrink: 0,
            }}
          >
            {/* Live Server Status Tile */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '3px',
                background: '#F8FAFC',
                border: '1px solid #D1D5DB',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: '#374151',
              }}
            >
              <Server size={13} color="#205493" />
              <span style={{ fontWeight: 600 }}>Status:</span>
              {!error && health ? (
                <span
                  style={{
                    color: '#059669',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle2 size={12} />
                  LIVE
                </span>
              ) : (
                <span
                  style={{
                    color: '#DC2626',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <XCircle size={12} /> DISCONNECTED
                </span>
              )}
            </div>

            {/* Integrated User Profile Dropdown Menu */}
            <UserMenu user={user} profile={profile} onSignOut={signOut} />
          </div>
        </div>
      </div>
    </header>
  );
};
