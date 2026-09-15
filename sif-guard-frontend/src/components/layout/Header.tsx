import React, { useEffect, useState } from 'react';
<<<<<<< Updated upstream
import { ShieldAlert, Server, CheckCircle2, XCircle, Sun, Moon } from 'lucide-react';
import { getHealth } from '../../api/review';
import type { HealthResponse } from '../../types/api';
import { motion } from 'motion/react';
=======
import { ShieldAlert, Server, CheckCircle2, XCircle, Keyboard, Search, ChevronRight, LogOut } from 'lucide-react';
import { getHealth } from '../../api/review';
import type { HealthResponse } from '../../types/api';
import { motion } from 'motion/react';
import { ThemeToggleSwitch } from '../common/ThemeToggleSwitch';
import type { TabId } from './Navigation';
import { useAuth } from '../../context/AuthContext';
>>>>>>> Stashed changes

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
<<<<<<< Updated upstream
}

export const Header: React.FC<Props> = ({ theme, onToggleTheme }) => {
=======
  onOpenShortcuts?: () => void;
  onOpenCommandPalette?: () => void;
  activeTab?: TabId;
}

const TAB_LABELS: Record<TabId, { category: string; name: string }> = {
  dashboard: { category: 'Intelligence', name: 'Executive Dashboard' },
  facility: { category: 'Intelligence', name: 'Facility Digital Twin' },
  analytics: { category: 'Intelligence', name: 'Analytics & Trends' },
  clusters: { category: 'Intelligence', name: 'Precursor Clusters' },
  explorer: { category: 'Operations', name: 'Incident Explorer' },
  review: { category: 'Operations', name: 'Review Queue' },
  knowledge: { category: 'Knowledge', name: 'LSR & Knowledge' },
  ingestion: { category: 'Knowledge', name: 'Data Ingestion' },
};

export const Header: React.FC<Props> = ({
  theme,
  onToggleTheme,
  onOpenShortcuts,
  onOpenCommandPalette,
  activeTab = 'dashboard',
}) => {
  const { profile, logout } = useAuth();
>>>>>>> Stashed changes
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

  const tabMeta = TAB_LABELS[activeTab] || { category: 'Platform', name: 'Overview' };

  return (
    <header
      style={{
<<<<<<< Updated upstream
        padding: '16px 32px',
=======
        padding: '12px 28px',
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              Serious Injury & Fatality Precursor Intelligence
            </p>
          </div>
        </div>

        {/* Location Breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '8px',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
          }}
        >
          <span>{tabMeta.category}</span>
          <ChevronRight size={12} color="var(--primary)" />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{tabMeta.name}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Spotlight Command Search Button */}
        {onOpenCommandPalette && (
          <motion.button
            onClick={onOpenCommandPalette}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 14px',
              borderRadius: '12px',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 500,
              boxShadow: 'var(--shadow-card)',
              transition: 'all 0.15s ease-out',
            }}
          >
            <Search size={14} color="var(--primary)" />
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Search platform...</span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                background: 'var(--surface-hover)',
                padding: '2px 6px',
                borderRadius: '6px',
                fontSize: '0.68rem',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Ctrl + K
            </span>
          </motion.button>
        )}

>>>>>>> Stashed changes
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
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: 'var(--success)',
                  boxShadow: '0 0 10px var(--success)',
                }}
              />
              Live ({health.embedding_model.split('/')[1] || health.embedding_model})
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
              <XCircle size={12} /> Offline
            </span>
          )}
        </div>

<<<<<<< Updated upstream
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
=======
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

        {/* Logged-In User Profile Pill & Logout */}
        {profile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 6px 4px 10px',
              borderRadius: '12px',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: '1rem' }}>{profile.avatar_badge.split(' ')[0]}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                {profile.full_name}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--primary-bright)', fontFamily: 'var(--font-mono)' }}>
                {profile.title}
              </span>
            </div>
            <button
              onClick={logout}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              title="Sign Out of SIF-Guard"
            >
              <LogOut size={16} color="var(--danger)" />
            </button>
          </div>
        )}
>>>>>>> Stashed changes
      </div>
    </header>
  );
};

