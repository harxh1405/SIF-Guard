import React, { useEffect, useState } from 'react';
import { ShieldAlert, Server, CheckCircle2, XCircle, Sun, Moon } from 'lucide-react';
import { getHealth } from '../../api/review';
import type { HealthResponse } from '../../types/api';
import { motion } from 'motion/react';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<Props> = ({ theme, onToggleTheme }) => {
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
    <header
      style={{
        padding: '16px 32px',
        background: 'var(--bg-header)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <motion.div
          whileHover={{ scale: 1.05, rotate: 2 }}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent-blue) 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: 'var(--shadow-glow-cyan)',
            border: '1px solid var(--border-hover)',
          }}
        >
          <ShieldAlert size={24} />
        </motion.div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              SIF-GUARD
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'var(--accent-primary-bg)',
                color: 'var(--accent-cyan)',
                fontWeight: 700,
                border: '1px solid var(--border-hover)',
                letterSpacing: '0.05em',
                fontFamily: 'var(--font-mono)',
              }}
            >
              OIL INDIA LIMITED
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Serious Injury & Fatality Precursor Intelligence Platform
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Backend Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '20px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <Server size={14} color="var(--accent-cyan)" />
          <span style={{ color: 'var(--text-secondary)' }}>Backend:</span>
          {!error && health ? (
            <span
              style={{
                color: 'var(--accent-nonsif-green)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={12} /> Live ({health.embedding_model.split('/')[1] || health.embedding_model})
            </span>
          ) : (
            <span
              style={{
                color: 'var(--accent-sif-red)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <XCircle size={12} /> Disconnected
            </span>
          )}
        </div>

        {/* Theme Switcher Toggle */}
        <motion.button
          onClick={onToggleTheme}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          style={{
            padding: '8px 14px',
            borderRadius: '20px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            boxShadow: 'var(--shadow-glass)',
            transition: 'all 0.2s ease',
          }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={15} color="#f2a93b" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={15} color="#00c8ff" />
              <span>Dark Mode</span>
            </>
          )}
        </motion.button>
      </div>
    </header>
  );
};

