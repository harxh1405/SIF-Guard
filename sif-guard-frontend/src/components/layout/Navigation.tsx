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
  | 'review'
  | 'design-system';

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Navigation: React.FC<Props> = ({ activeTab, onTabChange }) => {
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
        { id: 'design-system' as TabId, label: 'Design System', icon: Boxes },
      ],
    },
  ];

  const allItems = sections
    .flatMap((section) => section.items)
    .filter((tab) => tab.id !== 'design-system');

  return (
    <motion.nav
      animate={{ width: '100%' }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        background: '#205493',
        borderBottom: '1px solid #1B365D',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        zIndex: 20,
        width: '100%',
        borderRadius: '0px',
      }}
    >
      <div
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
          width: '100%',
          padding: '0 24px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'nowrap',
            whiteSpace: 'nowrap',
            overflowX: 'auto',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            gap: '2px',
            width: '100%',
            height: '100%',
          }}
        >
          {allItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                title={tab.label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  padding: '0 16px',
                  height: '100%',
                  borderRadius: '0px',
                  border: 'none',
                  borderBottom: isActive ? '3px solid #FF9933' : '3px solid transparent',
                  background: isActive ? '#1B365D' : 'transparent',
                  color: '#FFFFFF',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(27, 54, 93, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Icon
                  size={14}
                  color={isActive ? '#FF9933' : '#E2E8F0'}
                  style={{ flexShrink: 0 }}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};
