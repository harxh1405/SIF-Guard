import React, { useEffect, useState } from 'react';
import { ShieldAlert, Server, CheckCircle2, XCircle } from 'lucide-react';
import { getHealth } from '../../api/review';
import type { HealthResponse } from '../../types/api';

export const Header: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    getHealth()
      .then((data) => {
        setHealth(data);
        setError(false);
      })
      .catch(() => {
        setError(true);
      });
  }, []);

  return (
    <header style={{
      padding: '16px 32px',
      background: 'rgba(7, 15, 30, 0.95)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #008DDA 0%, #004B87 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(0, 141, 218, 0.4)'
        }}>
          <ShieldAlert size={24} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
              SIF-GUARD
            </span>
            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0, 141, 218, 0.2)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
              OIL INDIA LIMITED
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Serious Injury & Fatality Precursor Intelligence Platform
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-color)',
          fontSize: '0.8rem'
        }}>
          <Server size={14} color="var(--accent-cyan)" />
          <span>Backend:</span>
          {!error && health ? (
            <span style={{ color: 'var(--accent-nonsif-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} /> Live ({health.embedding_model.split('/')[1] || health.embedding_model})
            </span>
          ) : (
            <span style={{ color: 'var(--accent-sif-red)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <XCircle size={12} /> Disconnected
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
