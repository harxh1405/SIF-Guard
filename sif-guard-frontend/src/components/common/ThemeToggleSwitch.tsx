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
          width: '64px',
          height: '32px',
          borderRadius: '20px',
          background: isDark
            ? 'rgba(15, 23, 42, 0.75)'
            : 'rgba(255, 255, 255, 0.85)',
          border: isDark
            ? '1px solid rgba(56, 189, 248, 0.35)'
            : '1px solid rgba(245, 158, 11, 0.45)',
          boxShadow: isDark
            ? 'inset 0 2px 4px rgba(0, 0, 0, 0.4), 0 0 16px rgba(56, 189, 248, 0.15)'
            : 'inset 0 2px 4px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(245, 158, 11, 0.18)',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          outline: 'none',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      >
        {/* Background icon markers for visual feedback */}
        <div
          style={{
            position: 'absolute',
            left: '7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ca8a04',
            opacity: isDark ? 0.35 : 0,
            transition: 'opacity 0.25s ease',
            pointerEvents: 'none',
          }}
        >
          <Sun size={14} />
        </div>
        <div
          style={{
            position: 'absolute',
            right: '7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
            opacity: isDark ? 0 : 0.45,
            transition: 'opacity 0.25s ease',
            pointerEvents: 'none',
          }}
        >
          <Moon size={14} />
        </div>

        {/* Sliding thumb */}
        <motion.div
          animate={{
            x: isDark ? 32 : 2,
          }}
          transition={{
            type: 'spring',
            stiffness: 450,
            damping: 30,
          }}
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: isDark
              ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
              : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            boxShadow: isDark
              ? '0 2px 8px rgba(2, 132, 199, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
              : '0 2px 8px rgba(245, 158, 11, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            border: isDark
              ? '1px solid rgba(255, 255, 255, 0.3)'
              : '1px solid rgba(255, 255, 255, 0.8)',
          }}
        >
          {isDark ? (
            <Moon size={13} strokeWidth={2.5} />
          ) : (
            <Sun size={13} strokeWidth={2.5} />
          )}
        </motion.div>
      </button>

      {/* Mode Text Label */}
      <span
        style={{
          fontSize: '0.78rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '-0.01em',
          userSelect: 'none',
        }}
      >
        {isDark ? 'DARK' : 'LIGHT'}
      </span>
    </div>
  );
};
