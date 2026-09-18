import React, { useEffect, useState } from 'react';
import {
  Server,
  CheckCircle2,
  XCircle,
  LogOut,
} from 'lucide-react';
import { getHealth } from '../../api/review';
import type { HealthResponse } from '../../types/api';
import { useAuth } from '../../context/AuthContext';

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
      fontFamily="var(--font-sans), sans-serif"
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
  const { user, signOut } = useAuth();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<boolean>(false);

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

  return (
    <header
      style={{
        position: 'relative',
        zIndex: 10,
        background: '#FFFFFF',
        borderBottom: '1px solid #D1D5DB',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '12px 24px',
          background: '#FFFFFF',
          minHeight: '70px',
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
                    fontFamily: 'var(--font-display)',
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

          {/* Right: Crisp Bordered Utility Controls & Single Sign Out Button */}
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

            {/* Single Sign Out Button */}
            {user && (
              <button
                type="button"
                onClick={signOut}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#DC2626',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'var(--font-sans)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FEE2E2';
                  e.currentTarget.style.borderColor = '#FCA5A5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FEF2F2';
                  e.currentTarget.style.borderColor = '#FECACA';
                }}
                title={user.email ? `Sign out (${user.email})` : 'Sign out'}
              >
                <LogOut size={13} color="#DC2626" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
