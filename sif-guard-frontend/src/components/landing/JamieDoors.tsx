import React from 'react';

interface JamieDoorsProps {
  theme: 'dark' | 'light';
}

export const JamieDoors: React.FC<JamieDoorsProps> = ({ theme }) => {
  const isLight = theme === 'light';

  const t = {
    border: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(244, 245, 247, 0.10)',
    borderStrong: isLight ? 'rgba(0, 0, 0, 0.16)' : 'rgba(244, 245, 247, 0.18)',
    paper0: isLight ? '#151311' : '#fafbfd',
    paper1: isLight ? '#4A433B' : '#ccd1d8',
    paper2: isLight ? '#8A7E72' : '#8a919b',
    ink0: isLight ? '#F5F2EB' : '#0b0c0e',
    ink1: isLight ? '#ECE7DE' : '#121316',
  };

  const doors = [
    {
      num: '01',
      title: 'The Signal',
      desc: 'Precursor detection in routine contractor logs, PTW deviations, and near-miss narratives — surfacing latent high-energy risk.',
      tag: 'text nlp · observation parsing',
      href: '#the-digital-twin',
    },
    {
      num: '02',
      title: 'The Intelligence',
      desc: 'Dual-stage calibrated XGBoost models and petroleum acronym normalizer mapped against 14 Life-Saving Rules.',
      tag: 'xgboost inference · lsr taxonomy',
      href: '#the-digital-twin',
    },
    {
      num: '03',
      title: 'The Action',
      desc: 'Automated hierarchy-of-controls dispatch, real-time barrier verification, and spatial alerts pinned to the digital twin.',
      tag: 'barrier defense · spatial twin',
      href: '#the-digital-twin',
    },
  ];

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="three-doors"
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

      {/* Chapter Label */}
      <p
        data-wreveal="true"
        className="label-mono"
        style={{ marginBottom: '40px' }}
      >
        three doors
      </p>

      {/* 3-Column Hairline Division with Top Hover Sweeps */}
      <div
        data-wreveal-group="true"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1px',
          backgroundColor: t.border,
        }}
      >
        {doors.map((door) => (
          <a
            key={door.num}
            href={door.href}
            onClick={(e) => handleClick(e, door.href)}
            className="door group"
            data-wreveal="true"
            style={{
              position: 'relative',
              backgroundColor: t.ink0,
              padding: 'clamp(28px, 3.5vw, 40px)',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '280px',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              const arrow = e.currentTarget.querySelector('.door-arrow') as HTMLElement;
              if (arrow) arrow.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              const arrow = e.currentTarget.querySelector('.door-arrow') as HTMLElement;
              if (arrow) arrow.style.transform = 'translateX(0px)';
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                }}
              >
                <p className="label-mono" style={{ margin: 0, fontSize: '11px' }}>
                  {door.num}
                </p>
                <span
                  className="door-arrow"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    color: t.paper2,
                    transition: 'transform 0.3s ease, color 0.3s ease',
                  }}
                >
                  →
                </span>
              </div>

              <h3
                style={{
                  margin: '24px 0 16px 0',
                  fontSize: 'clamp(20px, 1.8vw, 24px)',
                  fontWeight: 600,
                  letterSpacing: '-0.015em',
                  color: t.paper0,
                }}
              >
                {door.title}
              </h3>

              <p
                style={{
                  margin: 0,
                  maxWidth: '36ch',
                  fontSize: '15px',
                  lineHeight: 1.65,
                  color: t.paper1,
                }}
              >
                {door.desc}
              </p>
            </div>

            <p
              className="label-mono"
              style={{
                margin: '40px 0 0 0',
                fontSize: '11px',
                color: t.paper2,
                transition: 'color 0.2s ease',
              }}
            >
              {door.tag}
            </p>

            {/* Top Hover Gradient Sweep Line */}
            <span
              className="door-sweep"
              aria-hidden="true"
              style={{
                pointerEvents: 'none',
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: '1px',
                background: 'linear-gradient(90deg, var(--color-chrome-lo), var(--color-chrome-hi), var(--color-chrome-lo))',
              }}
            />
          </a>
        ))}
      </div>
    </section>
  );
};
