import React from 'react';
import { AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

interface Props {
  status?: string | null;
  score?: number | null;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SIFBadge: React.FC<Props> = ({ status, score, showScore = false, size = 'md' }) => {
  const formatScore = (val: number): string => {
    const pct = val > 1 ? val : val * 100;
    if (pct > 99.0 && pct < 100.0) {
      return `${pct.toFixed(1)}%`;
    }
    return `${Math.round(pct)}%`;
  };
  const formattedScore = score !== undefined && score !== null ? formatScore(score) : null;

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return '2px 6px';
      case 'lg':
        return '5px 12px';
      default:
        return '3px 8px';
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return '0.68rem';
      case 'lg':
        return '0.78rem';
      default:
        return '0.72rem';
    }
  };

  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 15 : 13;

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
          gap: '5px',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          borderRadius: '2px',
          border: '1px solid #FCA5A5',
          backgroundColor: '#FEF2F2',
          color: '#DC2626',
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
          gap: '5px',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          borderRadius: '2px',
          border: '1px solid #6EE7B7',
          backgroundColor: '#ECFDF5',
          color: '#065F46',
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
        gap: '5px',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        borderRadius: '2px',
        border: '1px solid #FCD34D',
        backgroundColor: '#FFFBEB',
        color: '#92400E',
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
