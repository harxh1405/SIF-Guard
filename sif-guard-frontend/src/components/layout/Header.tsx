import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Server,
  CheckCircle2,
  XCircle,
  Keyboard,
  User,
  LogOut,
} from 'lucide-react';
import { getHealth } from '../../api/review';
import type { HealthResponse } from '../../types/api';
import { motion } from 'motion/react';
import { ThemeToggleSwitch } from '../common/ThemeToggleSwitch';
import { useAuth } from '../../context/AuthContext';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenShortcuts?: () => void;
  isPlaying?: boolean;
  onToggleAudio?: () => void;
}

export const Header: React.FC<Props> = ({
  theme,
  onToggleTheme,
  onOpenShortcuts,
}) => {
  const { user, profile, signOut } = useAuth();
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
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0, 51, 102, 0.06)',
      }}
    >
      {/* 1. National Tricolor Strip */}
      <div className="gov-tricolor-strip" style={{ height: '3.5px' }} />

      {/* 2. National Portal Attribution Top Bar */}
      <div
        style={{
          backgroundColor: theme === 'dark' ? '#071526' : '#f1f5f9',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '4px 28px',
          fontSize: '0.72rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
            NATIONAL SAFETY INITIATIVE
          </span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span>Ministry of Petroleum &amp; Natural Gas</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span style={{ fontWeight: 600 }}>Oil India Limited</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            LATENCY: 18ms
          </span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            STANDARD: OISD-156
          </span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
            English
          </span>
        </div>
      </div>

      {/* 3. Primary Command Center Header Bar */}
      <div
        style={{
          padding: '10px 28px',
          background: 'var(--bg-header)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <motion.div
            whileHover={{ scale: 1.04 }}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #003366 0%, #002244 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(0, 51, 102, 0.25)',
              border: '1px solid rgba(255, 153, 51, 0.3)',
            }}
          >
            <ShieldAlert size={24} color="#ff9933" />
          </motion.div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontSize: '1.28rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--primary)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                SIF-GUARD
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: '#fef3c7',
                  color: '#b45309',
                  fontWeight: 800,
                  border: '1px solid #fde68a',
                  letterSpacing: '0.06em',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                OIL INDIA LIMITED
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: '#e6f0fa',
                  color: '#003366',
                  fontWeight: 700,
                  border: '1px solid #bfdbfe',
                }}
              >
                DGMS &amp; OISD-156
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '1px 0 0 0' }}>
              National Industrial Safety Precursor Surveillance Platform // Command Center
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Backend Health Status Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'var(--surface-hover)',
              border: '1px solid var(--border)',
              fontSize: '0.76rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <Server size={13} color="var(--primary)" />
            <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
            {!error && health ? (
              <span
                style={{
                  color: 'var(--success)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCircle2 size={12} />
                Live {health.embedding_model ? `(${health.embedding_model.split('/')[1] || health.embedding_model})` : ''}
              </span>
            ) : (
              <span
                style={{
                  color: 'var(--danger)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <XCircle size={12} /> Disconnected
              </span>
            )}
          </div>

          {/* Keyboard Shortcuts Helper Button */}
          {onOpenShortcuts && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontSize: '0.76rem',
                fontWeight: 600,
                transition: 'all 0.15s ease-out',
              }}
              title="Keyboard Shortcuts (Press '?')"
            >
              <Keyboard size={13} color="var(--primary)" />
              <span>Shortcuts</span>
              <kbd
                style={{
                  background: 'var(--surface-hover)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  fontSize: '0.65rem',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                ?
              </kbd>
            </button>
          )}

          {/* Theme Toggle Switch */}
          <ThemeToggleSwitch theme={theme} onToggle={onToggleTheme} />

          {/* Authenticated Officer & Sign Out */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  background: '#e6f0fa',
                  border: '1px solid #bfdbfe',
                  fontSize: '0.76rem',
                  color: '#003366',
                  fontWeight: 600,
                }}
              >
                <User size={13} color="#003366" />
                <span
                  style={{
                    maxWidth: '130px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {profile?.full_name || user.email}
                </span>
              </div>

              <button
                type="button"
                onClick={signOut}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
                title="Sign Out"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
