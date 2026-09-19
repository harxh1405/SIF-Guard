import React from 'react';

interface JamieThesisProps {
  theme: 'dark' | 'light';
}

export const JamieThesis: React.FC<JamieThesisProps> = ({ theme }) => {
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

  const pillars = [
    {
      num: '01 / UNSTRUCTURED TEXT',
      body: 'Safety narratives, PTW anomalies, and contractor near-miss logs contain high-energy latent risk that manual reviews overlook.',
    },
    {
      num: '02 / ZERO HUMAN BIAS',
      body: 'Automated extraction surfaces precursor patterns objectively without relying on subjective risk matrices or delayed reviews.',
    },
    {
      num: '03 / MEASURED DEFENSE',
      body: 'Deterministic classification directly mapped to Oil India Limited Life-Saving Rules and physical barrier verifications.',
    },
  ];

  return (
    <section
      id="the-thesis"
      style={{
        position: 'relative',
        borderBottom: `1px solid ${t.border}`,
        paddingTop: 'clamp(64px, 10vh, 110px)',
        paddingBottom: 'clamp(64px, 10vh, 110px)',
        scrollMarginTop: '80px',
      }}
    >
      {/* Chapter Marker Node (aligned with left vertical trace line on desktop) */}
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

      {/* Chapter Label */}
      <p
        className="label-mono"
        data-wreveal="true"
        style={{
          fontSize: '11px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: t.paper2,
          margin: '0 0 28px 0',
        }}
      >
        the thesis
      </p>

      {/* Large Statement */}
      <h2
        data-wreveal="true"
        style={{
          fontSize: 'clamp(2.0rem, 3.8vw, 3.0rem)',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1.12,
          color: t.paper0,
          maxWidth: '26ch',
          margin: '0 0 24px 0',
        }}
      >
        Safety reports contain signals before incidents become events. Legibility stopped being compliance and became an{' '}
        <span className="chrome-text">engineering discipline</span>.
      </h2>

      {/* Supporting Statement */}
      <p
        data-wreveal="true"
        style={{
          fontSize: 'clamp(16px, 1.25vw, 18px)',
          lineHeight: 1.6,
          color: t.paper1,
          maxWidth: '56ch',
          margin: '0 0 48px 0',
        }}
      >
        The operational challenge is surfacing those weak precursor signals before critical physical
        barriers fail.
      </p>

      {/* 3-Column Hairline Division */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1px',
          backgroundColor: t.border,
          marginTop: '40px',
        }}
      >
        {pillars.map((pillar) => (
          <div
            key={pillar.num}
            data-wreveal="true"
            style={{
              backgroundColor: t.ink0,
              padding: '32px clamp(20px, 2.5vw, 36px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
            }}
          >
            <p
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: t.paper2,
                margin: '0 0 14px 0',
              }}
            >
              {pillar.num}
            </p>
            <p
              style={{
                fontSize: '15px',
                lineHeight: 1.65,
                color: t.paper1,
                margin: 0,
                maxWidth: '34ch',
              }}
            >
              {pillar.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
