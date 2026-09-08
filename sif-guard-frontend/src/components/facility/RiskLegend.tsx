import React from 'react';

export const RiskLegend: React.FC = () => {
  return (
    <div
      className="glass-card"
      style={{
        padding: '12px 18px',
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
