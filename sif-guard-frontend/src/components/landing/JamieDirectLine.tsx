import React from 'react';

interface JamieDirectLineProps {
  theme: 'dark' | 'light';
  onEnterPlatform: () => void;
}

export const JamieDirectLine: React.FC<JamieDirectLineProps> = ({ theme, onEnterPlatform }) => {
  const isLight = theme === 'light';

  const t = {
    border: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(244, 245, 247, 0.08)',
    borderStrong: isLight ? 'rgba(0, 0, 0, 0.16)' : 'rgba(244, 245, 247, 0.16)',
    paper0: isLight ? '#151311' : '#F4F5F7',
    paper1: isLight ? '#4A433B' : '#C5C8D0',
    paper2: isLight ? '#8A7E72' : '#6E747D',
    ink0: isLight ? '#F5F2EB' : '#0B0C0E',
    ink1: isLight ? '#ECE7DE' : '#121316',
  };

  return (
    <section
      id="the-direct-line"
      style={{
        position: 'relative',
        borderBottom: `1px solid ${t.border}`,
        paddingTop: 'clamp(64px, 10vh, 100px)',
        paddingBottom: 'clamp(64px, 10vh, 100px)',
      }}
    >
      {/* Chapter Marker Node */}
      <span
        aria-hidden="true"
        className="trace-node"
        style={{
          position: 'absolute',
          left: '-36px',
          top: '40px',
          width: '9px',
          height: '9px',
          border: `1px solid ${t.borderStrong}`,
          backgroundColor: t.ink1,
        }}
      />

      {/* Direct Line Panel Matching Jamie McKaye */}
      <div
        className="panel ticks"
        data-wreveal="true"
        style={{
          border: `1px solid ${t.border}`,
          backgroundColor: t.ink1,
          padding: 'clamp(32px, 5vw, 56px)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '32px',
        }}
      >
        <div style={{ maxWidth: '64ch' }}>
          <p
            style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: t.paper2,
              margin: '0 0 16px 0',
            }}
          >
            THE DIRECT LINE
          </p>
          <h3
            style={{
              fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.08,
              color: t.paper0,
              margin: '0 0 16px 0',
            }}
          >
            Turn safety observations into precursor intelligence.
          </h3>
          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: t.paper1,
              margin: 0,
            }}
          >
            Deploy SIF-Guard across operational safety reporting workflows. One platform for
            upstream extraction, downstream processing, and field barrier enforcement.
          </p>
        </div>

        <div>
          <button
            onClick={onEnterPlatform}
            style={{
              backgroundColor: t.paper0,
              color: t.ink0,
              padding: '14px 28px',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'monospace',
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '0px',
              transition: 'transform 0.15s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1.5px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            ENTER PLATFORM ↗
          </button>
        </div>
      </div>
    </section>
  );
};
