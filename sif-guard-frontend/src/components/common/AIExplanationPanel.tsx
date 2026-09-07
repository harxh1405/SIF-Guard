import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  Activity,
  Flame,
  Wrench,
  AlertOctagon,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { SIFResultSchema, ExtractionSchema, LSRMatchSchema } from '../../types/api';

interface Props {
  sifResult?: SIFResultSchema | null;
  sifStatus?: string | null;
  sifScore?: number | null;
  actualSeverity?: string | null;
  extracted?: ExtractionSchema | null;
  lsrMatches?: LSRMatchSchema[];
}

export const AIExplanationPanel: React.FC<Props> = ({
  sifResult,
  sifStatus,
  sifScore,
  actualSeverity,
  extracted,
  lsrMatches = [],
}) => {
  const status = sifResult?.classification || sifStatus || 'UNCERTAIN';
  const score = sifResult?.score ?? sifScore ?? 0.5;
  const confidence = sifResult?.confidence ?? score;

  const isSIF = status === 'SIF_POTENTIAL';
  const isNonSIF = status === 'NON_SIF';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Top Banner: SIF Classification vs Severity Calibration */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '16px',
        }}
      >
        {/* Classification & Confidence Head */}
        <div
          style={{
            padding: '18px 20px',
            borderRadius: '12px',
            background: isSIF
              ? 'var(--accent-sif-bg)'
              : isNonSIF
              ? 'var(--accent-nonsif-bg)'
              : 'var(--accent-uncertain-bg)',
            border: `1px solid ${
              isSIF
                ? 'var(--accent-sif-red)'
                : isNonSIF
                ? 'var(--accent-nonsif-green)'
                : 'var(--accent-uncertain-amber)'
            }`,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              background: isSIF
                ? 'var(--accent-sif-red)'
                : isNonSIF
                ? 'var(--accent-nonsif-green)'
                : 'var(--accent-uncertain-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            {isSIF ? (
              <ShieldAlert size={26} />
            ) : isNonSIF ? (
              <ShieldCheck size={26} />
            ) : (
              <HelpCircle size={26} />
            )}
          </div>

          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)',
              }}
            >
              NLP Precursor Classification
            </div>
            <div
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: isSIF
                  ? 'var(--accent-sif-red)'
                  : isNonSIF
                  ? 'var(--accent-nonsif-green)'
                  : 'var(--accent-uncertain-amber)',
              }}
            >
              {isSIF
                ? 'SIF Potential (High Risk)'
                : isNonSIF
                ? 'Non-SIF (Standard Event)'
                : 'Uncertain / Triage Required'}
            </div>
            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                marginTop: '4px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Confidence: <strong>{(confidence * 100).toFixed(1)}%</strong> | Score:{' '}
              {(score * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Dual-Head Potential vs Actual Severity Box */}
        <div
          style={{
            padding: '18px 20px',
            borderRadius: '12px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '6px',
            }}
          >
            Actual vs Potential Severity Gap
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Recorded Outcome:
              </div>
              <span
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {actualSeverity || 'Minor / First Aid'}
              </span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>➔</div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Precursor Potential:
              </div>
              <span
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: isSIF ? 'var(--accent-sif-red)' : 'var(--accent-nonsif-green)',
                }}
              >
                {isSIF ? 'Catastrophic / Fatal' : 'Low Potential'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Extracted HSE Ontology Entities Grid */}
      {extracted && (
        <div
          style={{
            background: 'var(--bg-card)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} color="var(--accent-cyan)" /> Extracted HSE Precursor Entities (Named Entity Recognition)
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
            }}
          >
            {/* Activity */}
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'var(--accent-primary-bg)',
                border: '1px solid var(--border-hover)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--accent-cyan)',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}
              >
                <Activity size={14} /> Critical Activity
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {extracted.activity || 'Not detected'}
              </div>
            </div>

            {/* Hazard */}
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'var(--accent-sif-bg)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--accent-sif-red)',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}
              >
                <Flame size={14} /> Immediate Hazard
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {extracted.hazard || 'Not detected'}
              </div>
            </div>

            {/* Energy Source */}
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'var(--accent-uncertain-bg)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--accent-uncertain-amber)',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}
              >
                <Wrench size={14} /> High-Energy Source
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {extracted.energy_source || 'Not detected'}
              </div>
            </div>

            {/* Barrier Failure */}
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'var(--accent-purple-bg)',
                border: '1px solid var(--accent-purple-border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--accent-purple)',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}
              >
                <AlertOctagon size={14} /> Barrier Defect
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {extracted.barrier_failure || 'None identified'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Risk Tokens / SHAP Feature Attribution */}
      {sifResult?.risk_factors && sifResult.risk_factors.length > 0 && (
        <div
          style={{
            background: 'var(--bg-card)',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '10px',
            }}
          >
            SIF Risk Factors (Key Model Predictive Signals)
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {sifResult.risk_factors.map((rf: string, idx: number) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.78rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'var(--accent-sif-bg)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--accent-sif-red)',
                  fontWeight: 600,
                }}
              >
                + {rf}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Matched IOGP Life-Saving Rules */}
      {lsrMatches.length > 0 && (
        <div
          style={{
            background: 'var(--bg-card)',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Layers size={14} color="var(--accent-cyan)" /> Matched IOGP Life-Saving Rules
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lsrMatches.map((m, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'var(--accent-primary-bg)',
                  border: '1px solid var(--border-hover)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {m.rule_name}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--accent-cyan)',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {(m.score * 100).toFixed(0)}% Match
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
