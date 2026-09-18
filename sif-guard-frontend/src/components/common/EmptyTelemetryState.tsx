import React from 'react';
import { Database, ArrowRight } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  onNavigate?: (tab: any) => void;
}

export const EmptyTelemetryState: React.FC<Props> = ({
  title,
  description,
  ctaLabel,
  ctaHref,
  onNavigate,
}) => {
  const handleClick = () => {
    if (onNavigate) {
      // Map ctaHref like "/ingestion" to tabId "ingestion"
      const tabId = ctaHref.replace(/^\//, '');
      onNavigate(tabId);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '56px 24px',
        borderRadius: '16px',
        background: 'var(--surface)',
        border: '1px border var(--border)',
        boxShadow: 'var(--shadow-card)',
        margin: '12px 0',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'rgba(255, 106, 0, 0.10)',
          border: '1px solid rgba(255, 106, 0, 0.20)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)',
          marginBottom: '20px',
        }}
      >
        <Database size={28} />
      </div>

      <h3
        style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-display)',
          margin: '0 0 8px 0',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          maxWidth: '520px',
          lineHeight: 1.6,
          margin: '0 0 24px 0',
        }}
      >
        {description}
      </p>

      <button
        onClick={handleClick}
        className="btn btn-primary"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          fontSize: '0.875rem',
          fontWeight: 600,
        }}
      >
        <span>{ctaLabel}</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
};
