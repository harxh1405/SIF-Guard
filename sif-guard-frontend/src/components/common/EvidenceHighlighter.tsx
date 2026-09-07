import React from 'react';

interface EvidenceHighlighterProps {
  text: string;
  riskFactors?: string[];
  energySource?: string | null;
  barrierFailure?: string | null;
  hazard?: string | null;
  className?: string;
  style?: React.CSSProperties;
}

// Canonical high-risk keywords for Serious Injury & Fatality (SIF) precursors
const DEFAULT_RISK_KEYWORDS = [
  'without proper',
  'no barricade',
  'no toe-boards',
  'toe-boards',
  'dropped',
  'fell',
  'fall',
  'height',
  'residual pressure',
  'unbolted',
  'pressurized',
  'h2s',
  'gas leak',
  'confined space',
  'suspended load',
  'crushed',
  'pinch point',
  'lockout',
  'tagout',
  'loto',
  'atmospheric testing',
  'toxic gas',
  'spark',
  'ignition',
  'line of fire',
  'electrical panel',
  'energized',
  'high voltage',
  'bypass',
  'unsecured',
  'scaffold',
  'excavation',
  'collapsed',
  'struck by',
  'explosion',
  'hydrocarbon',
  'flange',
  'valve',
  'breathing apparatus',
];

export const EvidenceHighlighter: React.FC<EvidenceHighlighterProps> = ({
  text,
  riskFactors = [],
  energySource,
  barrierFailure,
  hazard,
  className = '',
  style = {},
}) => {
  if (!text) return <span>-</span>;

  // Compile keywords list
  const targetPhrases = new Set<string>();

  // Add risk factors passed from AI / extraction
  riskFactors.forEach((rf) => {
    if (rf && rf.trim().length > 2) targetPhrases.add(rf.trim().toLowerCase());
  });

  if (energySource && energySource.trim().length > 2) {
    targetPhrases.add(energySource.trim().toLowerCase());
  }
  if (barrierFailure && barrierFailure.trim().length > 2) {
    targetPhrases.add(barrierFailure.trim().toLowerCase());
  }
  if (hazard && hazard.trim().length > 2) {
    targetPhrases.add(hazard.trim().toLowerCase());
  }

  // Add defaults
  DEFAULT_RISK_KEYWORDS.forEach((kw) => {
    if (text.toLowerCase().includes(kw)) {
      targetPhrases.add(kw);
    }
  });

  if (targetPhrases.size === 0) {
    return <span className={className} style={style}>{text}</span>;
  }

  // Sort phrases by length descending to match longest phrases first
  const sortedPhrases = Array.from(targetPhrases).sort((a, b) => b.length - a.length);

  // Build regex pattern safely
  const escapedPhrases = sortedPhrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedPhrases.join('|')})`, 'gi');

  const parts = text.split(regex);

  return (
    <span className={className} style={{ lineHeight: 1.6, ...style }}>
      {parts.map((part, index) => {
        const lowerPart = part.toLowerCase();
        const isMatch = sortedPhrases.some((phrase) => phrase === lowerPart || lowerPart.includes(phrase));

        if (isMatch) {
          const isCritical =
            lowerPart.includes('without') ||
            lowerPart.includes('no ') ||
            lowerPart.includes('dropped') ||
            lowerPart.includes('fell') ||
            lowerPart.includes('pressure') ||
            lowerPart.includes('h2s') ||
            lowerPart.includes('energized') ||
            lowerPart.includes('bypass');

          return (
            <mark
              key={index}
              style={{
                backgroundColor: isCritical
                  ? 'var(--accent-sif-bg)'
                  : 'var(--accent-uncertain-bg)',
                color: isCritical ? 'var(--accent-sif-red)' : 'var(--accent-uncertain-amber)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600,
                borderBottom: `2px solid ${isCritical ? 'var(--accent-sif-red)' : 'var(--accent-uncertain-amber)'}`,
                margin: '0 1px',
                fontFamily: 'inherit',
              }}
              title={`Evidence token: ${part}`}
            >
              {part}
            </mark>
          );
        }

        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
};
