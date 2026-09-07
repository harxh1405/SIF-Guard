import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleSwitchProps {
  theme: 'dark' | 'light';
  onToggle: () => void;
}

export const ThemeToggleSwitch: React.FC<ThemeToggleSwitchProps> = ({ theme, onToggle }) => {
  const isDark = theme === 'dark';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <button
        role="switch"
        aria-checked={isDark}
        aria-label={`Current mode: ${isDark ? 'Dark' : 'Light'}. Click to toggle.`}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onToggle();
          }
        }}
        className="glass-toggle-track"
        style={{
          position: 'relative',
          width: '60px',
          height: '30px',
          borderRadius: '16px',
          background: isDark
            ? 'var(--surface-elevated)'
            : 'var(--surface-elevated)',
          border: isDark
            ? '1px solid var(--border)'
            : '1px solid var(--border)',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          outline: 'none',
          transition: 'all 0.2s ease',
        }}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      >
        {/* Background icon markers for visual feedback */}
        <div
          style={{
            position: 'absolute',
            left: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--warning)',
            opacity: isDark ? 0.35 : 0,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
          }}
        >
          <Sun size={12} />
        </div>
        <div
          style={{
            position: 'absolute',
            right: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            opacity: isDark ? 0 : 0.4,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
          }}
        >
          <Moon size={12} />
        </div>

        {/* Sliding thumb */}
        <motion.div
          animate={{
            x: isDark ? 30 : 2,
          }}
          transition={{
            type: 'spring',
            stiffness: 450,
            damping: 30,
          }}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: isDark
              ? 'var(--primary)'
              : 'linear-gradient(135deg, #FFB347 0%, #FF6A00 100%)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
          }}
        >
          {isDark ? (
            <Moon size={12} strokeWidth={2.5} />
          ) : (
            <Sun size={12} strokeWidth={2.5} />
          )}
        </motion.div>
      </button>

      {/* Mode Text Label */}
      <span
        style={{
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          userSelect: 'none',
          minWidth: '38px',
        }}
      >
        {isDark ? 'Dark' : 'Light'}
      </span>
    </div>
  );
};
