import React, { useEffect, useState, useRef } from 'react';
import { ShieldAlert, Keyboard, User, LogOut, ChevronDown } from 'lucide-react';
import { getHealth } from '../../api/review';
import type { HealthResponse } from '../../types/api';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeToggleSwitch } from '../common/ThemeToggleSwitch';
import { StatusBadge } from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenShortcuts?: () => void;
}

export const Header: React.FC<Props> = ({ theme, onToggleTheme, onOpenShortcuts }) => {
  const { user, profile, signOut } = useAuth();
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
      {/* Brand & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <motion.div
          whileHover={{ scale: 1.04 }}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 16px rgba(255, 106, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
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
      </div>
    </header>
  );
};
