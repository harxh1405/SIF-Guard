import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { JamieReaderPrism } from './JamieReaderPrism';

interface JamieHeroProps {
  theme: 'dark' | 'light';
  onEnterPlatform: () => void;
}

export const JamieHero: React.FC<JamieHeroProps> = ({ theme, onEnterPlatform }) => {
  const isLight = theme === 'light';

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 520], [1, 0.15]);
  const heroY = useTransform(scrollY, [0, 520], [0, -32]);

  const t = {
    border: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(244, 245, 247, 0.10)',
    borderStrong: isLight ? 'rgba(0, 0, 0, 0.16)' : 'rgba(244, 245, 247, 0.18)',
    paper0: isLight ? '#151311' : '#fafbfd',
    paper1: isLight ? '#4A433B' : '#ccd1d8',
    paper2: isLight ? '#8A7E72' : '#8a919b',
    ink0: isLight ? '#F5F2EB' : '#0b0c0e',
    chromeLo: '#6e747d',
  };

  const handleScrollToThesis = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.querySelector('#the-thesis');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderBottom: `1px solid ${t.border}`,
        minHeight: 'calc(100svh - 56px)',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          width: '100%',
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.24fr) minmax(0, 1fr)',
          gridTemplateRows: '1fr auto',
          alignItems: 'start',
          gap: 'clamp(24px, 3.5vw, 48px)',
          padding: 'clamp(20px, 3vh, 36px) clamp(20px, 3.6vw, 44px) 0',
          position: 'relative',
        }}
        className="hero-grid-responsive"
      >
        {/* LEFT COLUMN: Editorial Copy */}
        <motion.div
          style={{ width: '100%', paddingBottom: '8px', opacity: heroOpacity, y: heroY }}
        >
          {/* Kicker */}
          <p
            style={{
              color: t.paper1,
              letterSpacing: '0.015em',
              marginBottom: '16px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          >
            SIF Precursor Intelligence / Oil India Limited
          </p>

          {/* Main Hero Headline */}
          <h1
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
              color: t.paper0,
              letterSpacing: '-0.045em',
              fontSize: 'clamp(44px, 5.2vw, 80px)',
              fontWeight: 750,
              lineHeight: 0.96,
              margin: '0 0 32px 0',
              maxWidth: 'clamp(320px, 46vw, 680px)',
            }}
          >
            AI-Powered Precursor Intelligence for Oil &amp;{' '}
            <span
              style={{
                position: 'relative',
                display: 'inline-block',
                whiteSpace: 'nowrap',
              }}
            >
              <em className="chrome-text" style={{ fontStyle: 'normal' }}>
                Gas Installations
              </em>
            </span>
          </h1>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginTop: '8px',
            }}
          >
            <button
              onClick={onEnterPlatform}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '44px',
                padding: '10px 22px',
                backgroundColor: t.paper0,
                color: t.ink0,
                border: `1px solid ${t.paper0}`,
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                borderRadius: '0px',
                whiteSpace: 'nowrap',
                transition: 'background-color 0.18s ease, border-color 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#dfe3e9';
                e.currentTarget.style.borderColor = '#dfe3e9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = t.paper0;
                e.currentTarget.style.borderColor = t.paper0;
              }}
            >
              Enter Platform ↗
            </button>

            <a
              href="#the-thesis"
              onClick={handleScrollToThesis}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '44px',
                padding: '10px 22px',
                backgroundColor: 'transparent',
                color: t.paper0,
                border: `1px solid ${t.chromeLo}`,
                fontSize: '13px',
                fontWeight: 500,
                textDecoration: 'none',
                cursor: 'pointer',
                borderRadius: '0px',
                whiteSpace: 'nowrap',
                transition: 'background-color 0.18s ease, border-color 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = t.paper0;
                e.currentTarget.style.backgroundColor = 'rgba(250, 251, 253, 0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = t.chromeLo;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Explore the thesis ↓
            </a>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Interactive 3D ReaderPrism Instrument */}
        <div
          style={{
            padding: '0 10px',
            position: 'relative',
            alignSelf: 'start',
            marginTop: 'clamp(40px, 9.5vh, 85px)',
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          className="hero-instrument-wrap"
        >
          <div style={{ width: '100%', maxWidth: '490px', marginRight: 'clamp(0px, 1.8vw, 24px)' }}>
            <JamieReaderPrism theme={theme} />
          </div>
        </div>

        {/* FULL WIDTH HERO FOOT */}
        <div
          style={{
            gridColumn: '1 / -1',
            borderTop: `1px solid ${t.borderStrong}`,
            color: t.paper2,
            padding: '16px 0',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            alignSelf: 'end',
            gap: '24px',
            flexWrap: 'wrap',
          }}
        >
          <a
            href="#the-thesis"
            onClick={handleScrollToThesis}
            style={{
              color: t.paper1,
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = t.paper0)}
            onMouseLeave={(e) => (e.currentTarget.style.color = t.paper1)}
          >
            Follow the signal <span style={{ fontSize: '15px' }}>↓</span>
          </a>
        </div>
      </div>
    </section>
  );
};
