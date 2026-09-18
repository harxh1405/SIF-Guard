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
  Radar,
} from 'lucide-react';

export type TabId =
  | 'dashboard'
  | 'facility'
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
      title: 'COMMAND CENTER',
      items: [
        { id: 'dashboard' as TabId, label: 'Command Center', icon: LayoutDashboard },
        { id: 'facility' as TabId, label: 'Refinery 3D View', icon: Radar },
      ],
    },
    {
      title: 'INVESTIGATION',
      items: [
        { id: 'explorer' as TabId, label: 'Reports', icon: FileText },
        { id: 'clusters' as TabId, label: 'Pattern Explorer', icon: Boxes },
        { id: 'knowledge' as TabId, label: 'Life-Saving Rules', icon: BookOpen },
        { id: 'analytics' as TabId, label: 'Exploration Workspace', icon: BarChart3 },
        { id: 'review' as TabId, label: 'Review Queue', icon: UserCheck },
      ],
    },
    {
      title: 'DATA & SYSTEM',
      items: [
        { id: 'ingestion' as TabId, label: 'Capture & OCR', icon: UploadCloud },
      ],
    },
  ];

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 74 : 246 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: '#002244',
        borderRight: '1px solid #00172e',
        padding: isCollapsed ? '16px 6px' : '16px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 50,
        overflowX: 'hidden',
        overflowY: 'auto',
        flexShrink: 0,
        height: '100%',
        color: '#f8fafc',
      }}
    >
      {/* Sidebar Header with Collapse Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          padding: isCollapsed ? '0 0 10px 0' : '0 8px 10px 8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '2px',
        }}
      >
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#ff9933',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                color: '#cbd5e1',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'nowrap',
              }}
            >
              OIL HSE PORTAL
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={onToggleCollapse}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            color: '#cbd5e1',
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease, background 0.15s ease',
          }}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen size={16} color="#ff9933" /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {sections.map((section, sIdx) => (
        <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {!isCollapsed && (
            <div
              style={{
                fontSize: '0.63rem',
                fontWeight: 800,
                color: '#94a3b8',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-mono)',
                padding: '6px 10px 3px 10px',
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
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                title={isCollapsed ? tab.label : undefined}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: isCollapsed ? '0' : '10px',
                  padding: isCollapsed ? '9px 0' : '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  borderLeft: isActive ? '3.5px solid #ff9933' : '3.5px solid transparent',
                  background: isActive ? 'rgba(255, 153, 51, 0.16)' : 'transparent',
                  color: isActive ? '#ffffff' : '#cbd5e1',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease-out, color 0.15s ease-out',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#cbd5e1';
                  }
                }}
              >
                <Icon
                  size={16}
                  color={isActive ? '#ff9933' : '#94a3b8'}
                  style={{
                    transition: 'color 0.15s ease-out',
                    flexShrink: 0,
                  }}
                />
                {!isCollapsed && (
                  <span style={{ letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                    {tab.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </motion.aside>
  );
};
