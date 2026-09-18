import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Command,
  LayoutDashboard,
  Radar,
  BarChart3,
  Boxes,
  FileText,
  UserCheck,
  BookOpen,
  UploadCloud,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import type { TabId } from '../layout/Navigation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: TabId) => void;
}

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Quick Action' | 'Knowledge';
  title: string;
  description: string;
  icon: React.ElementType;
  tabId: TabId;
}

const COMMAND_ITEMS: CommandItem[] = [
  {
    id: 'nav-dashboard',
    category: 'Navigation',
    title: 'Executive Dashboard',
    description: 'Overview of platform KPI summary and live SIF precursor density',
    icon: LayoutDashboard,
    tabId: 'dashboard',
  },
  {
    id: 'nav-facility',
    category: 'Navigation',
    title: 'Facility Digital Twin',
    description: '3D WebGL refinery spatial model & live risk zone telemetry',
    icon: Radar,
    tabId: 'facility',
  },
  {
    id: 'nav-analytics',
    category: 'Navigation',
    title: 'Analytics & Trends',
    description: 'Hotspot ranking density charts & temporal risk velocity',
    icon: BarChart3,
    tabId: 'analytics',
  },
  {
    id: 'nav-clusters',
    category: 'Navigation',
    title: 'Precursor Clusters',
    description: 'HDBSCAN pattern discovery across rigs and refineries',
    icon: Boxes,
    tabId: 'clusters',
  },
  {
    id: 'nav-explorer',
    category: 'Navigation',
    title: 'Incident Explorer',
    description: 'Full-text search & detail inspection across safety observations',
    icon: FileText,
    tabId: 'explorer',
  },
  {
    id: 'nav-review',
    category: 'Navigation',
    title: 'Review Queue',
    description: 'Human-in-the-loop expert validation queue for ML models',
    icon: UserCheck,
    tabId: 'review',
  },
  {
    id: 'nav-knowledge',
    category: 'Knowledge',
    title: 'IOGP LSR Knowledge Hub',
    description: 'Canonical 9 Life-Saving Rules reference & similarity sandbox',
    icon: BookOpen,
    tabId: 'knowledge',
  },
  {
    id: 'nav-ingestion',
    category: 'Quick Action',
    title: 'Batch Data Ingestion',
    description: 'Upload Excel/CSV safety logs or run sample OIL datasets',
    icon: UploadCloud,
    tabId: 'ingestion',
  },
  {
    id: 'action-high-sif',
    category: 'Quick Action',
    title: 'High-Potential SIF Hazards',
    description: 'Jump to high-priority precursor reports in Incident Explorer',
    icon: ShieldAlert,
    tabId: 'explorer',
  },
  {
    id: 'action-unreviewed',
    category: 'Quick Action',
    title: 'Triage Pending Reviews',
    description: 'Open borderline predictions waiting for safety expert sign-off',
    icon: Sparkles,
    tabId: 'review',
  },
];

export const CommandPaletteModal: React.FC<Props> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredItems = COMMAND_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (item: CommandItem) => {
    onNavigate(item.tabId);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '12vh',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '640px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-modal)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Top Search Input Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              gap: '12px',
              background: 'var(--surface-elevated)',
            }}
          >
            <Search size={20} color="var(--primary)" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type to search pages, features, or LSR rules..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontFamily: 'var(--font-main)',
              }}
            />
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Results List */}
          <div
            style={{
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {filteredItems.length === 0 ? (
              <div
                style={{
                  padding: '32px 20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                }}
              >
                No matching results found for "<span style={{ color: 'var(--text-primary)' }}>{query}</span>"
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const Icon = item.icon;
                const isSelected = index === selectedIndex;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(255, 106, 0, 0.12)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                      transition: 'background 0.12s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: isSelected ? 'var(--primary)' : 'var(--surface-elevated)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {item.title}
                          </span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'var(--surface-hover)',
                              color: 'var(--text-muted)',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            {item.category}
                          </span>
                        </div>
                        <p
                          style={{
                            margin: '2px 0 0 0',
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <ArrowRight
                      size={16}
                      color={isSelected ? 'var(--primary)' : 'transparent'}
                      style={{ transition: 'color 0.15s ease', flexShrink: 0, marginLeft: '12px' }}
                    />
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts Hint */}
          <div
            style={{
              padding: '10px 20px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--background-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <div style={{ display: 'flex', gap: '14px' }}>
              <span>
                <kbd style={{ background: 'var(--surface)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--border)' }}>↓↑</kbd> Navigate
              </span>
              <span>
                <kbd style={{ background: 'var(--surface)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--border)' }}>↵</kbd> Select
              </span>
              <span>
                <kbd style={{ background: 'var(--surface)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--border)' }}>esc</kbd> Close
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Command size={12} color="var(--primary)" />
              <span>SIF-GUARD SPOTLIGHT</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
