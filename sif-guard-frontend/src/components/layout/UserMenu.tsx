import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  LogOut,
  ChevronDown,
  Shield,
  UserCheck,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserMenuProps {
  user: { email?: string | null } | null;
  profile: { full_name?: string | null } | null;
  onSignOut: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, profile, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.full_name || user?.email || 'Safety Auditor';
  const displayEmail = user?.email || 'auditor@oilindia.in';

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* User Profile Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="User Account & Actions"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          background: 'var(--surface-elevated)',
          color: 'var(--text-primary)',
          padding: '5px 12px 5px 8px',
          minHeight: '36px',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          boxShadow: isOpen ? '0 0 0 2px var(--primary)' : 'var(--shadow-card)',
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'var(--gov-navy-light, #e6f0fa)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            flexShrink: 0,
            border: '1px solid var(--border-subtle)',
          }}
        >
          <User size={13} />
        </div>

        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          {displayName}
        </span>

        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-muted)',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            marginLeft: '2px',
          }}
        />
      </button>

      {/* Dropdown Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 6px)',
              width: '270px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              boxShadow: 'var(--shadow-dropdown)',
              zIndex: 200,
              padding: '8px',
              overflow: 'hidden',
            }}
          >
            {/* Header Section inside Dropdown */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'var(--surface-hover)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    lineHeight: 1.2,
                  }}
                >
                  {displayName}
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.73rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  marginBottom: '8px',
                  wordBreak: 'break-all',
                }}
              >
                {displayEmail}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'var(--gov-green-light, #f0fdf4)',
                    color: 'var(--success)',
                    border: '1px solid rgba(22, 163, 74, 0.25)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <CheckCircle2 size={10} />
                  Active Auditor Session
                </span>
              </div>
            </div>

            {/* Navigation Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <UserCheck size={14} style={{ color: 'var(--primary)' }} />
                <span>Profile &amp; Credentials</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Shield size={14} style={{ color: 'var(--primary)' }} />
                <span>Security &amp; Compliance</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Sliders size={14} style={{ color: 'var(--primary)' }} />
                <span>System Preferences</span>
              </button>
            </div>

            {/* Divider */}
            <div
              style={{
                height: '1px',
                background: 'var(--border)',
                margin: '6px 0',
              }}
            />

            {/* Sign Out Item */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid transparent',
                background: 'transparent',
                color: 'var(--danger, #dc2626)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--gov-red-light, #fef2f2)';
                e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <LogOut size={14} style={{ color: 'var(--danger, #dc2626)' }} />
              <span>Sign Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
