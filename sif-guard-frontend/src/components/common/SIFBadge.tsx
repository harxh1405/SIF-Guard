import React from 'react';
import { AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

interface Props {
  status?: string | null;
  score?: number | null;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SIFBadge: React.FC<Props> = ({ status, score, showScore = false, size = 'md' }) => {
  const formattedScore = score !== undefined && score !== null ? `${Math.round(score > 1 ? score : score * 100)}%` : null;

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return '2px 8px';
      case 'lg':
        return '6px 14px';
      default:
        return '4px 10px';
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return '0.68rem';
      case 'lg':
        return '0.8rem';
      default:
        return '0.72rem';
    }
  };

  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 13;

  if (status === 'SIF_POTENTIAL') {
    return (
      <span
        className="badge badge-sif"
        title={`Serious Injury & Fatality Precursor Potential ${formattedScore ? `(${formattedScore})` : ''}`}
        style={{
          padding: getPadding(),
          fontSize: getFontSize(),
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        <AlertTriangle size={iconSize} />
        <span>SIF</span>
        {showScore && formattedScore && (
          <span style={{ opacity: 0.9, fontFamily: 'var(--font-mono)', fontWeight: 600, marginLeft: '1px' }}>
            {formattedScore}
          </span>
        )}
      </span>
    );
  }

  if (status === 'NON_SIF') {
    return (
      <span
        className="badge badge-nonsif"
        title={`Non-SIF Observation / Standard Severity ${formattedScore ? `(${formattedScore})` : ''}`}
        style={{
          padding: getPadding(),
          fontSize: getFontSize(),
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        <ShieldCheck size={iconSize} />
        <span>NON-SIF</span>
        {showScore && formattedScore && (
          <span style={{ opacity: 0.9, fontFamily: 'var(--font-mono)', fontWeight: 600, marginLeft: '1px' }}>
            {formattedScore}
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className="badge badge-uncertain"
      title={`Uncertain Classification / Requires Expert Review ${formattedScore ? `(${formattedScore})` : ''}`}
      style={{
        padding: getPadding(),
        fontSize: getFontSize(),
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      <HelpCircle size={iconSize} />
      <span>UNCERTAIN</span>
      {showScore && formattedScore && (
        <span style={{ opacity: 0.9, fontFamily: 'var(--font-mono)', fontWeight: 600, marginLeft: '1px' }}>
          {formattedScore}
        </span>
      )}
    </span>
  );
};

