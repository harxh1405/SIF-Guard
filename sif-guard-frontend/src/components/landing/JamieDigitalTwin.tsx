import React from 'react';
import { RefineryCanvas } from '../facility/3d/RefineryCanvas';
import { DEFAULT_HERO_ZONES } from './heroZones';
import type { FacilityZone } from '../../types/facility';

interface JamieDigitalTwinProps {
  theme: 'dark' | 'light';
  zones?: FacilityZone[];
}

export const JamieDigitalTwin: React.FC<JamieDigitalTwinProps> = ({
  theme,
  zones = DEFAULT_HERO_ZONES,
}) => {
  const isLight = theme === 'light';

  const t = {
    border: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(244, 245, 247, 0.08)',
    borderStrong: isLight ? 'rgba(0, 0, 0, 0.16)' : 'rgba(244, 245, 247, 0.16)',
    paper0: isLight ? '#151311' : '#F4F5F7',
    paper1: isLight ? '#4A433B' : '#C5C8D0',
    paper2: isLight ? '#8A7E72' : '#6E747D',
    ink1: isLight ? '#ECE7DE' : '#121316',
  };

  return (
    <section
      id="the-digital-twin"
      style={{
        position: 'relative',
        borderBottom: `1px solid ${t.border}`,
        paddingTop: 'clamp(64px, 10vh, 110px)',
        paddingBottom: 'clamp(64px, 10vh, 110px)',
        scrollMarginTop: '80px',
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
        the digital twin
      </p>

      {/* Statement */}
      <h2
        data-wreveal="true"
        style={{
          fontSize: 'clamp(1.9rem, 3.6vw, 3.0rem)',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1.14,
          color: t.paper0,
          maxWidth: '30ch',
          margin: '0 0 20px 0',
        }}
      >
        7 monitored facility risk zones. Spatial precursor mapping.
      </h2>

      <p
        data-wreveal="true"
        style={{
          fontSize: 'clamp(15px, 1.2vw, 17px)',
          lineHeight: 1.6,
          color: t.paper1,
          maxWidth: '60ch',
          margin: '0 0 40px 0',
        }}
      >
        The digital twin projects NLP precursor risk directly onto physical refinery structures —
        correlating process units, piping corridors, storage tanks, and high-pressure wellheads.
      </p>

      {/* Integrated 3D Refinery (NO card box, NO heavy borders, merged with page atmosphere) */}
      <div
        style={{
          width: '100%',
          height: 'clamp(440px, 58vh, 640px)',
          position: 'relative',
          margin: '0 auto',
          border: `1px solid ${t.border}`,
          borderRadius: '0px',
        }}
      >
        <RefineryCanvas
          zones={zones}
          mode="hero"
          theme={theme}
          transparentBg={true}
          height="100%"
          containerStyle={{
            border: 'none',
            borderRadius: '0px',
            backgroundColor: 'transparent',
            boxShadow: 'none',
          }}
        />
      </div>

      {/* Bottom Micro-Caption */}
      <div
        style={{
          marginTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          fontSize: '11px',
          fontFamily: 'monospace',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: t.paper2,
        }}
      >
        <span>OIL INDIA DULIAJAN COMPLEX · 3D FACILITY GEOMETRY</span>
        <span>DRAG TO ROTATE · WHEEL SCROLLS PAGE</span>
      </div>
    </section>
  );
};
