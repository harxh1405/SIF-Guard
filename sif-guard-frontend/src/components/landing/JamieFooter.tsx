import React from 'react';

interface JamieFooterProps {
  theme: 'dark' | 'light';
  onEnterPlatform: () => void;
}

export const JamieFooter: React.FC<JamieFooterProps> = ({ theme, onEnterPlatform }) => {
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

  const auditMetrics = [
    {
      label: 'monitored zones',
      value: '07',
      sub: 'duliajan complex',
    },
    {
      label: 'life-saving rules',
      value: '09',
      sub: 'oil india standard',
    },
    {
      label: 'precursor intelligence',
      value: 'sif',
      sub: 'ministry of petroleum',
    },
    {
      label: 'inference pipeline',
      value: 'live',
      sub: 'calibrated xgboost',
    },
  ];

  return (
    <footer
      style={{
        marginTop: 'clamp(64px, 10vh, 100px)',
        borderTop: `1px solid ${t.border}`,
        width: '100%',
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '40px clamp(20px, 4vw, 40px)',
        }}
      >
        <p
          className="label-mono"
          style={{
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: t.paper2,
            margin: '0 0 16px 0',
          }}
        >
          self-audit
        </p>

        {/* 4-Cell Metric Grid Matching Jamie McKaye */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1px',
            backgroundColor: t.border,
            marginBottom: '24px',
          }}
        >
          {auditMetrics.map((m) => (
            <div
              key={m.label}
              className="panel ticks"
              style={{
                backgroundColor: t.ink1,
                padding: '20px 24px',
              }}
            >
              <p
                className="label-mono"
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: t.paper2,
                  margin: '0 0 6px 0',
                }}
              >
                {m.label}
              </p>
              <p
                style={{
                  fontSize: '28px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: t.paper0,
                  margin: '0 0 4px 0',
                  lineHeight: 1,
                }}
              >
                {m.value}
              </p>
              <p
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: t.paper2,
                  margin: 0,
                }}
              >
                {m.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Telemetry Line Matching Jamie McKaye */}
        <div
          className="panel ticks"
          style={{
            border: `1px solid ${t.border}`,
            backgroundColor: t.ink1,
            padding: '16px 20px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '11px',
            fontFamily: 'monospace',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: t.paper2,
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span>INFERENCE LATENCY <span style={{ color: t.paper0 }}>42MS</span></span>
            <span>MEM FOOTPRINT <span style={{ color: t.paper0 }}>18MB</span></span>
            <span>MODEL WEIGHTS <span style={{ color: t.paper0 }}>CALIBRATED</span></span>
          </div>
          <div>
            OIL INDIA LIMITED · PRODUCTION BUILD
          </div>
        </div>

        {/* Chrome Rule Separator */}
        <hr className="chrome-rule" style={{ margin: '32px 0' }} />

        {/* Bottom Attribution and Links */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '18px',
            fontSize: '13px',
            color: t.paper1,
          }}
        >
          <p style={{ margin: 0 }}>
            SIF-Guard — Serious Injury &amp; Fatality Precursor Intelligence. Built for Oil India Limited.
          </p>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <button
              onClick={onEnterPlatform}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '11px',
                fontFamily: 'monospace',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: t.paper2,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = t.paper0)}
              onMouseLeave={(e) => (e.currentTarget.style.color = t.paper2)}
            >
              Enter Platform ↗
            </button>
            <a
              href="#main"
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: t.paper2,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = t.paper0)}
              onMouseLeave={(e) => (e.currentTarget.style.color = t.paper2)}
            >
              Back to Top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
