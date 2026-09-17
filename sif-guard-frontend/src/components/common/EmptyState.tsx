import React from 'react';
import { FileQuestion } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<Props> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="card" style={{ padding: '48px 24px', textAlign: 'center', margin: '24px 0' }}>
      <div style={{
        width: '64px',
        height: '64px',
        margin: '0 auto 16px auto',
        borderRadius: '50%',
        background: 'var(--surface-elevated)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)'
      }}>
        <FileQuestion size={32} />
      </div>
      <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto 20px auto' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
};
