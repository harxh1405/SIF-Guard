import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  key: string;
  description: string;
  category: 'Navigation' | 'Triage' | 'Search';
}

const SHORTCUTS: ShortcutItem[] = [
  { key: '1 - 7', description: 'Jump to specific navigation tabs', category: 'Navigation' },
  { key: 'J / ↓', description: 'Select next item in review queue or list', category: 'Triage' },
  { key: 'K / ↑', description: 'Select previous item in review queue or list', category: 'Triage' },
  { key: 'C', description: 'Quick-confirm report as SIF Potential', category: 'Triage' },
  { key: 'R', description: 'Quick-classify report as Non-SIF', category: 'Triage' },
  { key: 'M / Enter', description: 'Open detailed review & modification modal', category: 'Triage' },
  { key: '/', description: 'Focus search input', category: 'Search' },
  { key: 'Esc', description: 'Close open dialogs or modals', category: 'Navigation' },
  { key: '?', description: 'Toggle this keyboard shortcuts menu', category: 'Navigation' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ zIndex: 1100 }}
        >
          <motion.div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', padding: '28px' }}
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'var(--accent-primary-bg)',
                    color: 'var(--accent-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Keyboard size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>
                    Keyboard Shortcuts
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Accelerate your triage workflow
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {SHORTCUTS.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {s.description}
                  </span>
                  <kbd
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      background: 'var(--bg-badge)',
                      border: '1px solid var(--border-color)',
                      boxShadow: '0 2px 0 var(--border-color)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      color: 'var(--accent-cyan)',
                    }}
                  >
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                justifyContent: 'center',
              }}
            >
              <Command size={14} /> Tip: Press <kbd style={{ fontFamily: 'var(--font-mono)', padding: '1px 5px', borderRadius: '4px', background: 'var(--bg-badge)', border: '1px solid var(--border-color)' }}>?</kbd> anytime to open this helper.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
