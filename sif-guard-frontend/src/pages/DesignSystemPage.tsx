import React from 'react';
import { PipelineStatusBadge } from '../components/dashboard/PipelineStatusBadge';

export const DesignSystemPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '60px' }}>
      {/* Header */}
      <div>
        <h1
          style={{
            fontFamily: 'var(--font-serif, Fraunces, serif)',
            fontSize: '2rem',
            fontWeight: 600,
            color: 'var(--text-primary, #F4F3EE)',
            margin: '0 0 8px 0',
          }}
        >
          SIF-GUARD Design System & Tokens
        </h1>
        <p style={{ color: 'var(--text-secondary, #9CA8AA)', fontSize: '0.9rem', margin: 0 }}>
          Visual identity, color swatches, typography scales, semantic states, and analytical components for Oil India Limited.
        </p>
      </div>

      {/* Base Colors */}
      <section style={{ backgroundColor: 'var(--bg-card, #0D171A)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border, #203238)' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', color: '#F4F3EE', marginTop: 0 }}>Base Colors</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
          {[
            { name: 'Deep Charcoal', hex: '#080E10' },
            { name: 'Dark Surface', hex: '#0D171A' },
            { name: 'Slate', hex: '#112429' },
            { name: 'Slate Hover', hex: '#162E35' },
            { name: 'Border', hex: '#203238' },
            { name: 'Primary Text', hex: '#F4F3EE' },
            { name: 'Muted Text', hex: '#9CA8AA' },
          ].map((c) => (
            <div key={c.name} style={{ backgroundColor: c.hex, border: '1px solid #203238', borderRadius: '6px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: c.hex === '#080E10' || c.hex === '#0D171A' ? '#9CA8AA' : '#080E10' }}>{c.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: c.hex === '#080E10' || c.hex === '#0D171A' ? '#F4F3EE' : '#080E10' }}>{c.hex}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Semantic Colors */}
      <section style={{ backgroundColor: 'var(--bg-card, #0D171A)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border, #203238)' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', color: '#F4F3EE', marginTop: 0 }}>Semantic Accent Colors</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          {[
            { name: 'Amber Safety Accent', hex: '#F2A933', role: 'Safety signal, attention, pattern' },
            { name: 'Critical Red', hex: '#E54F4F', role: 'Critical, failed barrier, SIF potential' },
            { name: 'Operational Mint', hex: '#4DCEA0', role: 'Healthy, operational, verified' },
            { name: 'Warning Gold', hex: '#E8AA3D', role: 'Uncertain status, review required' },
          ].map((c) => (
            <div key={c.name} style={{ backgroundColor: 'rgba(17, 36, 41, 0.6)', border: `1px solid ${c.hex}`, borderRadius: '6px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: c.hex }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F4F3EE' }}>{c.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: c.hex }}>{c.hex}</span>
              <span style={{ fontSize: '0.72rem', color: '#9CA8AA' }}>{c.role}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section style={{ backgroundColor: 'var(--bg-card, #0D171A)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border, #203238)' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', color: '#F4F3EE', marginTop: 0 }}>Editorial Typography</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#9CA8AA', fontFamily: 'var(--font-mono)' }}>SERIF DISPLAY — FRAUNCES / INSTRUMENT SERIF</span>
            <h2 style={{ fontFamily: 'var(--font-serif, Fraunces, serif)', fontSize: '2rem', color: '#F4F3EE', margin: '4px 0' }}>
              "The incident isn't the first signal."
            </h2>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#9CA8AA', fontFamily: 'var(--font-mono)' }}>SANS-SERIF TECHNICAL UI — INTER / GEIST</span>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: '#9CA8AA', margin: '4px 0', lineHeight: 1.5 }}>
              SIF-GUARD transforms safety reports into normalized ingestion, Transformer NER and domain safety rules, hybrid XGBoost + CatBoost SIF classification, failed barrier identification, and HDBSCAN precursor patterns.
            </p>
          </div>
        </div>
      </section>

      {/* System Status Component */}
      <section style={{ backgroundColor: 'var(--bg-card, #0D171A)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border, #203238)' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', color: '#F4F3EE', marginTop: 0 }}>System Pipeline Status Badge</h3>
        <PipelineStatusBadge />
      </section>
    </div>
  );
};
