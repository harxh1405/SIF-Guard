import React from 'react';

interface JamieHeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onEnterPlatform: () => void;
}

export const JamieHeader: React.FC<JamieHeaderProps> = ({
  theme,
  onToggleTheme: _onToggleTheme,
  onEnterPlatform,
}) => {
  const isLight = theme === 'light';

  const t = {
    bg: isLight ? 'rgba(245, 242, 235, 0.88)' : 'rgba(11, 12, 14, 0.88)',
    border: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(244, 245, 247, 0.08)',
    paper0: isLight ? '#151311' : '#F4F5F7',
    paper1: isLight ? '#4A433B' : '#C5C8D0',
    paper2: isLight ? '#8A7E72' : '#6E747D',
    btnBorder: isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(244, 245, 247, 0.15)',
    btnHoverBorder: isLight ? 'rgba(0, 0, 0, 0.35)' : 'rgba(244, 245, 247, 0.45)',
  };

  const navLinks = [
    { label: 'thesis', href: '#the-thesis' },
    { label: 'doors', href: '#three-doors' },
    { label: 'twin', href: '#the-digital-twin' },
    { label: 'machine', href: '#the-machine' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        backgroundColor: t.bg,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${t.border}`,
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '24px',
          padding: '14px clamp(20px, 4vw, 40px)',
          flexWrap: 'wrap',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <a
            href="/"
            style={{
              fontSize: '16px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: t.paper0,
              textDecoration: 'none',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            SIF-GUARD
            <span style={{ color: t.paper2, fontWeight: 400 }}>.ai</span>
          </a>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: t.paper2,
              display: 'none',
            }}
            className="md-show-brand-sub"
          >
            OIL INDIA LIMITED
          </span>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', alignItems: 'baseline', gap: '24px', flexWrap: 'wrap' }}>
          <ul
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '22px',
              listStyle: 'none',
              margin: 0,
              padding: 0,
              flexWrap: 'wrap',
            }}
          >
            {navLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  style={{
                    position: 'relative',
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                    color: t.paper1,
                    textDecoration: 'none',
                    paddingBottom: '2px',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = t.paper0;
                    const bar = e.currentTarget.querySelector('.nav-sweep') as HTMLElement;
                    if (bar) bar.style.width = '100%';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = t.paper1;
                    const bar = e.currentTarget.querySelector('.nav-sweep') as HTMLElement;
                    if (bar) bar.style.width = '0%';
                  }}
                >
                  {link.label}
                  <span
                    className="nav-sweep"
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      left: 0,
                      width: '0%',
                      height: '1px',
                      backgroundColor: t.paper0,
                      transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onEnterPlatform}
            style={{
              border: `1px solid ${t.btnBorder}`,
              backgroundColor: 'transparent',
              padding: '6px 12px',
              fontSize: '11px',
              fontFamily: 'monospace',
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: t.paper1,
              cursor: 'pointer',
              borderRadius: '0px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = t.btnHoverBorder;
              e.currentTarget.style.color = t.paper0;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = t.btnBorder;
              e.currentTarget.style.color = t.paper1;
            }}
          >
            ENTER PLATFORM ↗
          </button>
        </div>
      </div>
    </header>
  );
};
