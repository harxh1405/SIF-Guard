import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  UploadCloud,
  FileText,
  Boxes,
  BarChart3,
  BookOpen,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export type TabId =
  | 'dashboard'
  | 'ingestion'
  | 'explorer'
  | 'clusters'
  | 'analytics'
  | 'knowledge'
  | 'review';

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Navigation: React.FC<Props> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
}) => {
  const sections = [
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'dashboard' as TabId, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'analytics' as TabId, label: 'Analytics & Trends', icon: BarChart3 },
        { id: 'clusters' as TabId, label: 'Precursor Clusters', icon: Boxes },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'explorer' as TabId, label: 'Incident Explorer', icon: FileText },
        { id: 'review' as TabId, label: 'Review Queue', icon: UserCheck },
      ],
    },
    {
      title: 'KNOWLEDGE',
      items: [
        { id: 'knowledge' as TabId, label: 'LSR & Knowledge', icon: BookOpen },
        { id: 'ingestion' as TabId, label: 'Data Ingestion', icon: UploadCloud },
      ],
    },
  ];

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 76 : 250 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'var(--background-secondary)',
        borderRight: '1px solid var(--border)',
        padding: isCollapsed ? '20px 8px' : '20px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 50,
        overflowX: 'hidden',
        overflowY: 'auto',
        flexShrink: 0,
        height: '100%',
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      {/* Sidebar Header with Collapse Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          padding: isCollapsed ? '0 0 12px 0' : '0 8px 12px 8px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '4px',
        }}
      >
        {!isCollapsed && (
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'nowrap',
            }}
          >
            SIF-GUARD PLATFORM
          </span>
        )}

        <button
          onClick={onToggleCollapse}
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
            transition: 'color 0.2s ease, background 0.2s ease',
          }}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen size={18} color="var(--primary)" /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {sections.map((section, sIdx) => (
        <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {!isCollapsed && (
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-mono)',
                padding: '4px 10px 2px 10px',
                textTransform: 'uppercase',
              }}
            >
              {section.title}
            </div>
          )}

          {section.items.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                whileHover={{ x: isActive ? 0 : 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onTabChange(tab.id)}
                title={isCollapsed ? tab.label : undefined}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: isCollapsed ? '0' : '12px',
                  padding: isCollapsed ? '10px 0' : '9px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                  background: isActive ? 'rgba(255, 106, 0, 0.14)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease-out, color 0.15s ease-out, border-color 0.15s ease-out',
                  width: '100%',
                }}
              >
                <Icon
                  size={17}
                  color={isActive ? 'var(--primary)' : 'var(--text-muted)'}
                  style={{
                    transition: 'color 0.15s ease-out',
                    flexShrink: 0,
                  }}
                />
                {!isCollapsed && (
                  <span style={{ fontFamily: 'var(--font-main)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                    {tab.label}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      ))}
    </motion.aside>
  );
};
