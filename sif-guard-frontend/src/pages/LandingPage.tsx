import React, { useEffect } from 'react';
import { useSmoothScroll } from '../hooks/useSmoothScroll';
import { CinematicBackground } from '../components/landing/CinematicBackground';
import { JamieHeader } from '../components/landing/JamieHeader';
import { JamieHero } from '../components/landing/JamieHero';
import { JamieThesis } from '../components/landing/JamieThesis';
import { JamieDoors } from '../components/landing/JamieDoors';
import { JamieDigitalTwin } from '../components/landing/JamieDigitalTwin';
import { JamieMachine } from '../components/landing/JamieMachine';
import { JamieDirectLine } from '../components/landing/JamieDirectLine';
import { JamieFooter } from '../components/landing/JamieFooter';

interface LandingPageProps {
  onEnterPlatform: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterPlatform,
  onToggleTheme,
}) => {
  // The landing page is strictly dark-only
  const isLight = false;
  const theme = 'dark';

  // Butter-smooth scroll
  useSmoothScroll({ enabled: true });

  // Active section observer for trace spine nodes & progressive reveals
  useEffect(() => {
    const sectionIds = [
      'the-thesis',
      'three-doors',
      'the-digital-twin',
      'the-machine',
      'the-direct-line',
    ];

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const node = entry.target.querySelector('.trace-node');
          if (node) {
            if (entry.isIntersecting) {
              node.classList.add('trace-node-active');
            } else {
              node.classList.remove('trace-node-active');
            }
          }
        });
      },
      {
        rootMargin: '-15% 0px -55% 0px',
        threshold: 0.05,
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });

    // Reveal observer for elements with [data-wreveal]
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.05,
      }
    );

    const revealElements = document.querySelectorAll('[data-wreveal]');
    revealElements.forEach((el) => revealObserver.observe(el));

    return () => {
      sectionObserver.disconnect();
      revealObserver.disconnect();
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#0B0C0E',
        color: '#F4F5F7',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        overflowX: 'hidden',
      }}
    >
      {/* 0. Continuous Cinematic Background Atmosphere (Fixed, Drifting, Noise & Vignette) */}
      <CinematicBackground theme="dark" />

      {/* Content wrapper layered cleanly above background */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* 1. Sticky Minimal Header */}
        <JamieHeader
          theme="dark"
          onToggleTheme={onToggleTheme || (() => {})}
          onEnterPlatform={onEnterPlatform}
        />

        <main id="main">
          {/* 2. Hero Section: Typography-First */}
          <JamieHero theme={theme} onEnterPlatform={onEnterPlatform} />

          {/* 3. Continuous Trace Spine & Editorial Chapters */}
          <div
            style={{
              position: 'relative',
              maxWidth: '1440px',
              margin: '0 auto',
              padding: '0 clamp(20px, 4vw, 40px)',
            }}
          >
            {/* Continuous Left Vertical Trace Spine Line (Visible on desktop md+) */}
            <svg
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '48px',
                height: '100%',
                pointerEvents: 'none',
              }}
              className="hidden md:block"
              fill="none"
            >
              <defs>
                <linearGradient id="trace-chrome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isLight ? '#C5C8D0' : '#6E747D'} />
                  <stop offset="50%" stopColor={isLight ? '#4A433B' : '#E9EBEF'} />
                  <stop offset="100%" stopColor={isLight ? '#C5C8D0' : '#6E747D'} />
                </linearGradient>
              </defs>
              <line
                x1="24"
                y1="0"
                x2="24"
                y2="100%"
                stroke="url(#trace-chrome)"
                strokeWidth="1.5"
              />
            </svg>

            {/* Left Padding Container for Trace Alignment on Desktop */}
            <div className="md:pl-14">
              {/* Chapter 01: The Thesis */}
              <JamieThesis theme={theme} />

              {/* Chapter 02: Three Doors */}
              <JamieDoors theme={theme} />

              {/* Chapter 05: The Digital Twin (Integrated 3D Exhibit) */}
              <JamieDigitalTwin theme={theme} />

              {/* Chapter 06: The Machine (Interactive Machine Lens) */}
              <JamieMachine theme={theme} />

              {/* Closing Direct Line */}
              <JamieDirectLine theme={theme} onEnterPlatform={onEnterPlatform} />
            </div>
          </div>
        </main>

        {/* 4. Minimal Footer */}
        <JamieFooter theme={theme} onEnterPlatform={onEnterPlatform} />
      </div>
    </div>
  );
};
