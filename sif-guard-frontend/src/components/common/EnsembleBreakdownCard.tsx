import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Scale, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { ModelBreakdownSchema } from '../../types/api';

interface Props {
  breakdown?: ModelBreakdownSchema | null;
  score?: number | null;
  classification?: string | null;
  modelVersion?: string | null;
}

export const EnsembleBreakdownCard: React.FC<Props> = ({
  breakdown,
  score,
  classification,
  modelVersion = '1.1.0-hybrid',
}) => {
  const xgbProb = breakdown?.xgboost_probability ?? score ?? 0;
  const catProb = breakdown?.catboost_probability ?? score ?? 0;
  const ensembleProb = breakdown?.ensemble_probability ?? score ?? 0;

  const xgbPct = Math.round(xgbProb * 100);
  const catPct = Math.round(catProb * 100);
  const ensemblePct = Math.round(ensembleProb * 100);

  const isSIF = classification === 'SIF_POTENTIAL' || ensembleProb >= 0.45;
  const isOfficeOrLowRisk = ensembleProb <= 0.15;

  return (
    <div
      style={{
        background: 'var(--surface-elevated, #0D171A)',
        border: '1px solid var(--border-subtle, #203238)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'rgba(242, 169, 51, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F2A933',
            }}
          >
            <Cpu size={16} />
          </div>
          <div>
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted, #9CA8AA)',
                letterSpacing: '0.04em',
              }}
            >
              Hybrid Safety Intelligence Ensemble
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary, #F4F3EE)' }}>
              Dual-Model Probability Consensus
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.7rem',
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(77, 206, 160, 0.15)',
              color: '#4DCEA0',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
            }}
          >
            v{modelVersion}
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              color: '#38BDF8',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Scale size={11} /> 50% XGB + 50% CAT
          </span>
        </div>
      </div>

      {/* Model Probability Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
        }}
      >
        {/* XGBoost Meter */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-dark-surface, #091114)',
            border: '1px solid var(--border-subtle, #203238)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#F4F3EE' }}>
              XGBoost Classifier
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: xgbPct >= 45 ? '#E85D5D' : '#4DCEA0',
              }}
            >
              {xgbPct}%
            </span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(2, xgbPct))}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                height: '100%',
                backgroundColor: xgbPct >= 45 ? '#E85D5D' : '#4DCEA0',
                borderRadius: '3px',
              }}
            />
          </div>
          <div style={{ marginTop: '6px', fontSize: '0.68rem', color: '#647477', fontFamily: 'var(--font-mono)' }}>
            Gradient boosted decision trees
          </div>
        </div>

        {/* CatBoost Meter */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-dark-surface, #091114)',
            border: '1px solid var(--border-subtle, #203238)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#F4F3EE' }}>
              CatBoost Classifier
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: catPct >= 45 ? '#E85D5D' : '#4DCEA0',
              }}
            >
              {catPct}%
            </span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(2, catPct))}%` }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
              style={{
                height: '100%',
                backgroundColor: catPct >= 45 ? '#E85D5D' : '#4DCEA0',
                borderRadius: '3px',
              }}
            />
          </div>
          <div style={{ marginTop: '6px', fontSize: '0.68rem', color: '#647477', fontFamily: 'var(--font-mono)' }}>
            Categorical safety feature boosting
          </div>
        </div>
      </div>

      {/* Combined Ensemble Consensus Banner */}
      <div
        style={{
          padding: '14px 16px',
          borderRadius: '10px',
          backgroundColor: isSIF
            ? 'rgba(232, 93, 93, 0.1)'
            : 'rgba(77, 206, 160, 0.08)',
          border: `1px solid ${
            isSIF ? 'rgba(232, 93, 93, 0.3)' : 'rgba(77, 206, 160, 0.25)'
          }`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isSIF ? (
            <AlertTriangle size={18} color="#E85D5D" />
          ) : (
            <CheckCircle2 size={18} color="#4DCEA0" />
          )}
          <div>
            <div style={{ fontSize: '0.72rem', color: '#9CA8AA', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              Calibrated Ensemble Probability (Threshold: 45%)
            </div>
            <div
              style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: isSIF ? '#E85D5D' : '#4DCEA0',
              }}
            >
              {isSIF
                ? 'SIF POTENTIAL — High precursor severity detected'
                : isOfficeOrLowRisk
                ? 'NON-SIF — Low-risk observation / Office safeguard active'
                : 'NON-SIF — Standard workplace observation'}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', color: '#9CA8AA', fontFamily: 'var(--font-mono)' }}>
            Consensus SIF Score
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: isSIF ? '#E85D5D' : '#4DCEA0',
            }}
          >
            {ensemblePct}%
          </div>
        </div>
      </div>
    </div>
  );
};
