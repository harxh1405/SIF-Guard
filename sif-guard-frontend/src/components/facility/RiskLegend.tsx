import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface RiskLegendProps {
  variant?: 'bar' | 'compact-dock';
  theme?: 'dark' | 'light';
}

export const RiskLegend: React.FC<RiskLegendProps> = ({
  variant = 'bar',
  theme = 'dark',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isLight = theme === 'light';

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (variant === 'compact-dock') {
    return (
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: '8px',
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.88)' : 'rgba(10, 18, 30, 0.82)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid ${isLight ? 'rgba(203, 213, 225, 0.8)' : 'rgba(255, 255, 255, 0.12)'}`,
            color: 'var(--text-secondary)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
            transition: 'all 0.15s ease',
          }}
          title="Toggle SIF Risk Spectrum Legend"
        >
          <div style={{ display: 'flex', gap: '3px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#20D997' }} />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FFCC00' }} />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FF9500' }} />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FF3B30' }} />
          </div>
          <span>Legend</span>
          <ChevronDown
            size={12}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s ease',
            }}
          />
        </button>

        {/* Expandable Popover - Opens Downwards with Right Alignment */}
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(10, 18, 30, 0.98)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${isLight ? 'rgba(203, 213, 225, 0.9)' : 'rgba(255, 255, 255, 0.16)'}`,
              boxShadow: isLight
                ? '0 12px 32px rgba(0, 51, 102, 0.15), 0 2px 8px rgba(0, 0, 0, 0.06)'
                : '0 16px 40px rgba(0, 0, 0, 0.75), 0 0 1px rgba(255, 255, 255, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '7px',
              minWidth: '220px',
              zIndex: 100,
              fontSize: '11px',
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: 'var(--text-primary)',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '5px',
                marginBottom: '2px',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              SIF Risk Spectrum
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#20D997', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)' }}>Low (0–30)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#FFCC00', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)' }}>Moderate (31–60)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#FF9500', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)' }}>High (61–80)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#FF3B30', flexShrink: 0 }} />
              <span style={{ color: '#FF3B30', fontWeight: 700 }}>Critical SIF (81–100)</span>
            </div>

            <div
              style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '6px',
                marginTop: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-muted)',
                fontSize: '10px',
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', border: '1.5px solid #FF3B30', flexShrink: 0 }} />
              <span>Pulsing Ring = Active Flare</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="glass-card"
      style={{
        padding: '10px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        fontSize: '11px',
      }}
    >
      <span style={{ fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        Risk Spectrum Key:
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#20D997', display: 'inline-block' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Low (0–30)</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FFCC00', display: 'inline-block' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Moderate (31–60)</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FF9500', display: 'inline-block' }} />
        <span style={{ color: 'var(--text-secondary)' }}>High (61–80)</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FF3B30', display: 'inline-block' }} />
        <span style={{ color: '#FF3B30', fontWeight: 700 }}>Critical SIF (81–100)</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1px solid #FF3B30', display: 'inline-block' }} />
        <span>Pulsing Ring = Active Precursor Flare</span>
      </div>
    </div>
  );
};
