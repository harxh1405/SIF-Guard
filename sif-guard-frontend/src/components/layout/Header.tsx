<<<<<<< Updated upstream
import React, { useEffect, useState } from 'react';
<<<<<<< Updated upstream
import { ShieldAlert, Server, CheckCircle2, XCircle, Sun, Moon } from 'lucide-react';
import { getHealth } from '../../api/review';
import type { HealthResponse } from '../../types/api';
import { motion } from 'motion/react';
=======
import { ShieldAlert, Server, CheckCircle2, XCircle, Keyboard, Search, ChevronRight, LogOut } from 'lucide-react';
=======
import React, { useEffect, useState, useRef } from 'react';
import { ShieldAlert, Keyboard, User, LogOut, ChevronDown } from 'lucide-react';
>>>>>>> Stashed changes
import { getHealth } from '../../api/review';
import type { HealthResponse } from '../../types/api';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeToggleSwitch } from '../common/ThemeToggleSwitch';
<<<<<<< Updated upstream
import type { TabId } from './Navigation';
=======
import { StatusBadge } from '../common/StatusBadge';
>>>>>>> Stashed changes
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
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

<<<<<<< Updated upstream
  const tabMeta = TAB_LABELS[activeTab] || { category: 'Platform', name: 'Overview' };
=======
  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userName = profile?.full_name || user?.email || 'Safety Officer';
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
=======
      {/* Brand & Logo */}
>>>>>>> Stashed changes
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <motion.div
          whileHover={{ scale: 1.05, rotate: 2 }}
          style={{
<<<<<<< Updated upstream
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent-blue) 0%, #0369a1 100%)',
=======
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
>>>>>>> Stashed changes
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: 'var(--shadow-glow-cyan)',
            border: '1px solid var(--border-hover)',
          }}
        >
<<<<<<< Updated upstream
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
=======
          <ShieldAlert size={20} />
        </motion.div>

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
      </div>

      {/* Controls & Profile Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Condensed Status Indicator */}
        <StatusBadge
          dotOnly
          variant={!error && health ? 'success' : 'danger'}
          tooltip={
            health
              ? `Embedding Model: ${health.embedding_model}`
              : 'Backend Service Disconnected'
          }
        >
          {!error && health ? 'Operational' : 'Disconnected'}
        </StatusBadge>

        {/* Consolidated Profile Dropdown Menu */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
>>>>>>> Stashed changes
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '12px',
              background: isMenuOpen ? 'var(--surface-hover)' : 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
          >
<<<<<<< Updated upstream
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
=======
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'rgba(255, 106, 0, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={13} />
            </div>
            <span
              style={{
                maxWidth: '130px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {userName}
            </span>
            <ChevronDown
              size={14}
              style={{
                transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                color: 'var(--text-secondary)',
              }}
            />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '230px',
                  background: 'var(--surface-elevated, #1a1d24)',
                  border: '1px solid var(--border, #2a2e39)',
                  borderRadius: '14px',
                  padding: '8px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.35)',
                  zIndex: 1000,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                {/* User Info Header in Menu */}
                <div
                  style={{
                    padding: '8px 10px 10px 10px',
                    borderBottom: '1px solid var(--border-subtle)',
                    marginBottom: '4px',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {userName}
                  </p>
                  {user?.email && (
                    <p
                      style={{
                        margin: '2px 0 0 0',
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.email}
                    </p>
                  )}
                </div>

                {/* Keyboard Shortcuts Item */}
                {onOpenShortcuts && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenShortcuts();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Keyboard size={14} color="var(--primary)" />
                      <span>Shortcuts</span>
                    </div>
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
                  </button>
                )}

                {/* Theme Toggle Item */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                  }}
                >
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>Appearance</span>
                  <ThemeToggleSwitch theme={theme} onToggle={onToggleTheme} />
                </div>

                {/* Sign Out Button */}
                {user && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      signOut();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(232, 93, 93, 0.08)',
                      border: 'none',
                      color: 'var(--danger, #E85D5D)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginTop: '4px',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(232, 93, 93, 0.16)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(232, 93, 93, 0.08)')}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
>>>>>>> Stashed changes
      </div>
    </header>
  );
};

