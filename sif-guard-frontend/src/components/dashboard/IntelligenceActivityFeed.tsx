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
        backgroundColor: 'var(--bg-card, #0D171A)',
        border: '1px solid var(--border, #203238)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="#F2A933" />
          <h3
            style={{
              fontFamily: 'var(--font-serif, Fraunces, serif)',
              fontSize: '1.05rem',
              fontWeight: 600,
              color: 'var(--text-primary, #F4F3EE)',
              margin: 0,
            }}
          >
            SAFETY INTELLIGENCE FEED
          </h3>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.68rem',
            color: 'var(--text-muted, #647477)',
            backgroundColor: 'rgba(32, 50, 56, 0.4)',
            padding: '2px 8px',
            borderRadius: '4px',
          }}
        >
          LIVE PIPELINE
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '340px' }}>
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => item.reportId && onSelectReport && onSelectReport(item.reportId)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(17, 36, 41, 0.4)',
              border: '1px solid rgba(32, 50, 56, 0.5)',
              cursor: item.reportId && onSelectReport ? 'pointer' : 'default',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (item.reportId && onSelectReport) {
                e.currentTarget.style.backgroundColor = 'rgba(17, 36, 41, 0.8)';
                e.currentTarget.style.borderColor = 'var(--amber, #F2A933)';
              }
            }}
            onMouseLeave={(e) => {
              if (item.reportId && onSelectReport) {
                e.currentTarget.style.backgroundColor = 'rgba(17, 36, 41, 0.4)';
                e.currentTarget.style.borderColor = 'rgba(32, 50, 56, 0.5)';
              }
            }}
          >
            <div style={{ marginTop: '2px' }}>{getIcon(item.type)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary, #F4F3EE)' }}>
                  {item.title}
                </span>
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.7rem', color: 'var(--text-muted, #647477)' }}>
                  {item.timestamp}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #9CA8AA)', margin: '4px 0 0 0', lineHeight: 1.35 }}>
                {item.description}
              </p>
            </div>
            {item.reportId && onSelectReport && (
              <ChevronRight size={14} color="#647477" style={{ alignSelf: 'center' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
