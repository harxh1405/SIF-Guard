import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  message: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<Props> = ({ message, onRetry }) => {
  return (
    <div style={{
      padding: '16px 20px',
      borderRadius: '10px',
      background: 'var(--accent-sif-bg)',
      border: '1px solid var(--accent-sif-red)',
      color: 'var(--accent-sif-red)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      margin: '16px 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <AlertCircle size={20} />
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{message}</span>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
};
