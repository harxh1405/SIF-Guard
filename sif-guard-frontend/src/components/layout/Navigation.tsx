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
  const tabs = [
    { id: 'dashboard' as TabId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ingestion' as TabId, label: 'Data Ingestion', icon: UploadCloud },
    { id: 'explorer' as TabId, label: 'Incident Explorer', icon: FileText },
    { id: 'clusters' as TabId, label: 'Precursor Clusters', icon: Boxes },
    { id: 'analytics' as TabId, label: 'Analytics & Trends', icon: BarChart3 },
    { id: 'knowledge' as TabId, label: 'LSR & Knowledge', icon: BookOpen },
    { id: 'review' as TabId, label: 'Review Queue', icon: UserCheck },
  ];

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 72 : 250 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'var(--bg-sidebar)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border-color)',
        padding: isCollapsed ? '20px 8px' : '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
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
          padding: isCollapsed ? '0 0 14px 0' : '0 12px 14px 12px',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '8px',
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
            INTELLIGENCE SUITE
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
          {isCollapsed ? <PanelLeftOpen size={18} color="var(--accent-cyan)" /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            title={isCollapsed ? tab.label : undefined}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: isCollapsed ? '0' : '12px',
              padding: isCollapsed ? '12px 0' : '12px 16px',
              borderRadius: '10px',
              border: 'none',
              background: isActive
                ? 'var(--accent-primary-bg)'
                : 'transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: isActive ? 'var(--shadow-glow-cyan)' : 'none',
              width: '100%',
            }}
          >
            {/* Sliding Left Border Indicator */}
            {isActive && (
              <motion.div
                layoutId="navActiveBorder"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '15%',
                  bottom: '15%',
                  width: '3px',
                  borderRadius: '0 4px 4px 0',
                  background: 'var(--accent-cyan)',
                  boxShadow: '0 0 10px var(--accent-cyan)',
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}

            <Icon
              size={18}
              color={isActive ? 'var(--accent-cyan)' : 'var(--text-muted)'}
              style={{
                filter: isActive ? 'drop-shadow(0 0 6px var(--accent-cyan))' : 'none',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            />
            {!isCollapsed && (
              <span style={{ fontFamily: 'var(--font-main)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                {tab.label}
              </span>
            )}
          </button>
        );
      })}
    </motion.aside>
  );
};

