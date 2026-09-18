import React from 'react';
import type { ActivityFeedItem } from '../../utils/activityFormatter';
import { Activity, ShieldAlert, GitCommit, Search, ChevronRight } from 'lucide-react';

interface IntelligenceActivityFeedProps {
  items: ActivityFeedItem[];
  onSelectReport?: (reportId: string) => void;
}

export const IntelligenceActivityFeed: React.FC<IntelligenceActivityFeedProps> = ({
  items = [],
  onSelectReport,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'REPORT_ANALYZED':
        return <ShieldAlert size={15} color="#E54F4F" />;
      case 'BARRIER_DETECTED':
        return <Activity size={15} color="#F2A933" />;
      case 'PATTERN_UPDATED':
        return <GitCommit size={15} color="#4DCEA0" />;
      case 'SEMANTIC_MATCH':
        return <Search size={15} color="#F2A933" />;
      default:
        return <Activity size={15} color="#9CA8AA" />;
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderTop: '3.5px solid #003366',
        borderRadius: 'var(--radius-md)',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={17} color="#ff9933" />
          <h3
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1rem',
              fontWeight: 800,
              color: 'var(--primary)',
              margin: 0,
              letterSpacing: '0.02em',
            }}
          >
            SAFETY INTELLIGENCE FEED
          </h3>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.67rem',
            fontWeight: 800,
            color: '#b45309',
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a',
            padding: '2px 8px',
            borderRadius: '4px',
          }}
        >
          LIVE AUDIT STREAM
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '340px' }}>
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => item.reportId && onSelectReport && onSelectReport(item.reportId)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '6px',
              backgroundColor: 'var(--surface-hover)',
              border: '1px solid var(--border-subtle)',
              cursor: item.reportId && onSelectReport ? 'pointer' : 'default',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (item.reportId && onSelectReport) {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#003366';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 51, 102, 0.08)';
              }
            }}
            onMouseLeave={(e) => {
              if (item.reportId && onSelectReport) {
                e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            <div style={{ marginTop: '2px' }}>{getIcon(item.type)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {item.title}
                </span>
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {item.timestamp}
                </span>
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '3px 0 0 0', lineHeight: 1.35 }}>
                {item.description}
              </p>
            </div>
            {item.reportId && onSelectReport && (
              <ChevronRight size={13} color="#94a3b8" style={{ alignSelf: 'center' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
