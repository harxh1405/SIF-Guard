import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  FileText,
  Boxes,
  BarChart3,
  BookOpen,
  UserCheck,
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
}

export const Navigation: React.FC<Props> = ({ activeTab, onTabChange }) => {
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
    <aside style={{
      width: '240px',
      background: 'rgba(13, 27, 46, 0.7)',
      borderRight: '1px solid var(--border-color)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div style={{ padding: '0 12px 12px 12px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Intelligence Suite
      </div>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              background: isActive ? 'linear-gradient(135deg, rgba(0, 141, 218, 0.25) 0%, rgba(0, 75, 135, 0.35) 100%)' : 'transparent',
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              borderLeft: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent'
            }}
          >
            <Icon size={18} color={isActive ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </aside>
  );
};
