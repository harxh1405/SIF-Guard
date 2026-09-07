import React, { useEffect, useState } from 'react';
import { ShieldAlert, Server, CheckCircle2, XCircle, Keyboard } from 'lucide-react';
import { getHealth } from '../../api/review';
import type { HealthResponse } from '../../types/api';
import { motion } from 'motion/react';
import { ThemeToggleSwitch } from '../common/ThemeToggleSwitch';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenShortcuts?: () => void;
}

export const Header: React.FC<Props> = ({ theme, onToggleTheme, onOpenShortcuts }) => {
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
        padding: '14px 28px',
        background: 'var(--bg-header)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
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
          whileHover={{ scale: 1.04 }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 16px rgba(255, 106, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <ShieldAlert size={22} />
        </motion.div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
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
                background: 'rgba(255, 106, 0, 0.10)',
                color: 'var(--primary-bright)',
                fontWeight: 700,
                border: '1px solid rgba(255, 106, 0, 0.20)',
                letterSpacing: '0.06em',
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Backend Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '12px',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <Server size={14} color="var(--primary)" />
          <span style={{ color: 'var(--text-secondary)' }}>Backend:</span>
          {!error && health ? (
            <span
              style={{
                color: 'var(--success)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <CheckCircle2 size={12} /> Live ({health.embedding_model.split('/')[1] || health.embedding_model})
            </span>
          ) : (
            <span
              style={{
                color: 'var(--danger)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <XCircle size={12} /> Disconnected
            </span>
          )}
        </div>

        {/* Keyboard Shortcuts Helper Button */}
        {onOpenShortcuts && (
          <motion.button
            onClick={onOpenShortcuts}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: '7px 12px',
              borderRadius: '12px',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 600,
              boxShadow: 'var(--shadow-card)',
              transition: 'all 0.15s ease-out',
            }}
            title="Keyboard Shortcuts (Press '?')"
          >
            <Keyboard size={14} color="var(--primary)" />
            <span>Shortcuts</span>
            <kbd
              style={{
                background: 'var(--surface-hover)',
                padding: '1px 5px',
                borderRadius: '4px',
                fontSize: '0.68rem',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              ?
            </kbd>
          </motion.button>
        )}

        {/* Theme Toggle Switch */}
        <ThemeToggleSwitch theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>
  );
};
