import React from 'react';
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
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { SIFResultSchema, ExtractionSchema, LSRMatchSchema } from '../../types/api';
import { EnsembleBreakdownCard } from './EnsembleBreakdownCard';

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
        gap: '16px',
      }}
    >
      {/* Top Banner: SIF Classification vs Severity Calibration */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Classification & Confidence Head */}
        <div
          style={{
            padding: '18px 20px',
            borderRadius: '12px',
            background: isSIF
              ? 'rgba(232, 93, 93, 0.12)'
              : isNonSIF
              ? 'rgba(32, 217, 151, 0.12)'
              : 'rgba(235, 160, 54, 0.12)',
            border: `1px solid ${
              isSIF
                ? 'rgba(232, 93, 93, 0.35)'
                : isNonSIF
                ? 'rgba(32, 217, 151, 0.35)'
                : 'rgba(235, 160, 54, 0.35)'
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
                ? 'var(--danger)'
                : isNonSIF
                ? 'var(--success)'
                : 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0B0806',
              flexShrink: 0,
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
              Hybrid SIF Ensemble (XGBoost + CatBoost v1.1.0-hybrid)
            </div>
            <div
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: isSIF
                  ? 'var(--danger)'
                  : isNonSIF
                  ? 'var(--success)'
                  : 'var(--warning)',
              }}
            >
              {isSIF
                ? 'SIF POTENTIAL (High Precursor Risk)'
                : isNonSIF
                ? 'NON-SIF (Standard Safety Event)'
                : 'UNCERTAIN (Expert Review Required)'}
            </div>
            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                marginTop: '4px',
                fontFamily: 'var(--font-mono)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              SIF Probability: <strong>{(score * 100).toFixed(1)}%</strong> | Model Confidence:{' '}
              {(confidence * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Dual-Head Potential vs Actual Severity Box */}
        <div
          style={{
            padding: '18px 20px',
            borderRadius: '12px',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border-subtle)',
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
                  color: isSIF ? 'var(--danger)' : isNonSIF ? 'var(--success)' : 'var(--warning)',
                }}
              >
                {isSIF ? 'Catastrophic / Fatal' : isNonSIF ? 'Low Potential' : 'Not determined'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Model Probability Ensemble Breakdown */}
      <EnsembleBreakdownCard
        breakdown={sifResult?.model_breakdown}
        score={score}
        classification={status}
        modelVersion={sifResult?.model_version || '1.1.0-hybrid'}
      />

      {/* Extracted HSE Ontology Entities Grid */}
      {extracted && (
        <div
          style={{
            background: 'var(--surface-elevated)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
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
            <Sparkles size={14} color="var(--primary-bright)" /> Extracted HSE Precursor Entities (Named Entity Recognition)
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
            {/* Activity */}
            <div
              style={{
                padding: '12px',
                borderRadius: '10px',
                background: 'var(--background-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--primary-bright)',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}
              >
                <Activity size={14} /> Operational Task
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {extracted.activity || 'Unspecified'}
              </div>
            </div>

            {/* Hazard */}
            <div
              style={{
                padding: '12px',
                borderRadius: '10px',
                background: 'var(--background-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--danger)',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}
              >
                <Flame size={14} /> Hazard Identified
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {extracted.hazard || 'Unspecified'}
              </div>
            </div>

            {/* Energy Source */}
            <div
              style={{
                padding: '12px',
                borderRadius: '10px',
                background: 'var(--background-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--warning)',
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
                borderRadius: '10px',
                background: 'var(--background-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--danger)',
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
            background: 'var(--surface-elevated)',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
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
                  background: 'rgba(232, 93, 93, 0.12)',
                  border: '1px solid rgba(232, 93, 93, 0.3)',
                  color: 'var(--danger)',
                  fontWeight: 600,
                }}
              >
                + {rf}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* SHAP Feature Attribution Explorer */}
      {sifResult?.top_factors && sifResult.top_factors.length > 0 && (
        <div
          style={{
            background: 'var(--surface-elevated)',
            padding: '18px 20px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} color="#F2A933" />
              <span>SHAP Feature Attribution & Impact Weights</span>
            </div>
            <span style={{ fontSize: '0.68rem', color: '#829195', fontFamily: 'var(--font-mono)' }}>
              Explainable Safety ML (Log-Odds Impact)
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sifResult.top_factors.map((factor, idx) => {
              const isPositive = factor.impact > 0;
              const absImpact = Math.abs(factor.impact);
              const barWidth = Math.min(100, Math.max(12, Math.round((absImpact / 6.0) * 100)));

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-dark-surface, #091114)',
                    border: '1px solid var(--border-subtle, #203238)',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
                    {isPositive ? (
                      <TrendingUp size={14} color="var(--danger, #E85D5D)" />
                    ) : (
                      <TrendingDown size={14} color="var(--success, #4DCEA0)" />
                    )}
                    <span style={{ fontWeight: 600, color: '#F4F3EE', textTransform: 'capitalize' }}>
                      {factor.feature}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#9CA8AA', fontFamily: 'var(--font-mono)' }}>
                      ({String(factor.value)})
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '280px', margin: '0 16px' }}>
                    <div
                      style={{
                        flex: 1,
                        height: '6px',
                        borderRadius: '3px',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${barWidth}%`,
                          height: '100%',
                          backgroundColor: isPositive ? 'var(--danger, #E85D5D)' : 'var(--success, #4DCEA0)',
                          borderRadius: '3px',
                          marginLeft: isPositive ? '0' : 'auto',
                        }}
                      />
                    </div>
                  </div>

                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      color: isPositive ? 'var(--danger, #E85D5D)' : 'var(--success, #4DCEA0)',
                    }}
                  >
                    {isPositive ? `+${factor.impact.toFixed(3)}` : factor.impact.toFixed(3)} SIF impact
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Matched IOGP Life-Saving Rules */}
      {lsrMatches.length > 0 && (() => {
        const primaryMatch = lsrMatches[0];
        const secondaryMatches = lsrMatches.slice(1);

        return (
          <div
            style={{
              background: 'var(--surface-elevated)',
              padding: '18px 20px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Layers size={14} color="#F2A933" /> Matched IOGP Life-Saving Rules
            </div>

            {/* Primary Match */}
            {primaryMatch && (
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: 'rgba(242, 169, 51, 0.1)',
                  border: '1px solid rgba(242, 169, 51, 0.4)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      color: '#F2A933',
                      textTransform: 'uppercase',
                      fontFamily: 'var(--font-mono)',
                      display: 'block',
                      marginBottom: '2px',
                    }}
                  >
                    Primary Rule Match
                  </span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F4F3EE' }}>
                    {primaryMatch.rule_name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.9rem',
                    color: '#F2A933',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {(primaryMatch.score * 100).toFixed(0)}% Match
                </span>
              </div>
            )}

            {/* Secondary Related Matches */}
            {secondaryMatches.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#9CA8AA', fontWeight: 600, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                  Related Safety Signals
                </div>
                {secondaryMatches.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(17, 36, 41, 0.4)',
                      border: '1px solid #203238',
                      opacity: 0.85,
                    }}
                  >
                    <span style={{ fontSize: '0.82rem', color: '#9CA8AA', fontWeight: 500 }}>
                      {m.rule_name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#647477', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {(m.score * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};
