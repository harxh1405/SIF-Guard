import React from 'react';
import { AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

interface Props {
  status?: string | null;
  score?: number | null;
  showScore?: boolean;
}

export const SIFBadge: React.FC<Props> = ({ status, score, showScore = false }) => {
  if (status === 'SIF_POTENTIAL') {
    return (
      <span className="badge badge-sif" title="High Serious Injury or Fatality Precursor Potential">
        <AlertTriangle size={14} />
        SIF POTENTIAL {showScore && score !== undefined && score !== null ? `(${(score * 100).toFixed(0)}%)` : ''}
      </span>
    );
  }

  if (status === 'NON_SIF') {
    return (
      <span className="badge badge-nonsif" title="Low SIF Risk / Minor Administrative Observation">
        <ShieldCheck size={14} />
        NON SIF {showScore && score !== undefined && score !== null ? `(${(score * 100).toFixed(0)}%)` : ''}
      </span>
    );
  }

  return (
    <span className="badge badge-uncertain" title="Ambiguous Signal Needing Expert Review">
      <HelpCircle size={14} />
      UNCERTAIN {showScore && score !== undefined && score !== null ? `(${(score * 100).toFixed(0)}%)` : ''}
    </span>
  );
};
