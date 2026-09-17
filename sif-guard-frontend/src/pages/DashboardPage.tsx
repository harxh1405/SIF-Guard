import React, { useEffect, useState } from 'react';
import { getDashboardSummary } from '../api/analytics';
import type { DashboardSummary } from '../types/api';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { EmptyTelemetryState } from '../components/common/EmptyTelemetryState';
import { RefineryHeroSection } from '../components/facility/RefineryHeroSection';
import { DataFlowPipeline } from '../components/common/DataFlowPipeline';
import { CountUpNumber } from '../components/common/CountUpNumber';
import { motion, AnimatePresence } from 'motion/react';
import {
  Info,
  X,
  Radar,
  ArrowUpRight,
  FileText,
  AlertTriangle,
  TrendingUp,
  Building2,
  Activity,
  ChevronRight,
  Layers,
  Flame,
  Sparkles,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import type { TabId } from '../components/layout/Navigation';

interface Props {
  onNavigate: (tab: TabId) => void;
  theme?: 'dark' | 'light';
}

export const DashboardPage: React.FC<Props> = ({ onNavigate, theme = 'dark' }) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  const fetchDashboard = () => {
    setLoading(true);
    setError(null);
    getDashboardSummary()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load dashboard summary');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 className="section-title" style={{ marginBottom: '10px' }}>Executive Safety Intelligence</h2>
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 className="section-title" style={{ marginBottom: '10px' }}>Executive Safety Intelligence</h2>
        <ErrorBanner message={error || 'No data available'} onRetry={fetchDashboard} />
      </div>
    );
  }

  const densityPercent = (data.sif_precursor_density * 100).toFixed(1);
  const nonSifCount = Math.max(0, data.total_reports - data.sif_precursor_count);
  const nonSifPercent = data.total_reports > 0 ? ((nonSifCount / data.total_reports) * 100).toFixed(1) : '0';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      {/* 1. Large Visual Moment: Refinery Digital-Twin Hero Experience */}
      <RefineryHeroSection
        onNavigate={onNavigate}
        theme={theme}
        totalReports={data.total_reports}
        sifCount={data.sif_precursor_count}
        monitoredSites={data.sites}
      />

      {/* 2. Top Header Controls & Ratio Indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            Operational Baseline & Metrics
          </h2>
          {/* Info Icon for Heinrich's Principle Educational Copy */}
          <button
            onClick={() => setShowInfoModal(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '50%',
              transition: 'color 0.15s ease, background-color 0.15s ease',
            }}
            title="Core Safety Principle Info"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--primary)';
              e.currentTarget.style.background = 'rgba(255, 106, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Info size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Lightweight Risk Ratio Status Chip */}
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
              SIF Precursors ({densityPercent}%)
            </span>
            <span style={{ color: 'var(--border-subtle)', fontWeight: 300 }}>|</span>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>
              Non-SIF ({nonSifPercent}%)
            </span>
          </div>

          <button
            onClick={() => onNavigate('facility')}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 14px', fontSize: '0.8rem' }}
          >
            <Radar size={15} color="var(--primary)" /> Facility Digital Twin
          </button>
          <button
            onClick={() => onNavigate('explorer')}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 14px', fontSize: '0.8rem' }}
          >
            Explore Incidents <ArrowUpRight size={15} />
          </button>
        </div>
      </div>

      {/* 3. Unified 5-Column Metric Bar with CountUpNumber Animation */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
        }}
      >
        {/* Metric 1: Total Reports */}
        <div
          style={{
            padding: '18px 20px',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={14} color="var(--primary)" />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              Total Reports Analyzed
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)' }}>
            <CountUpNumber value={data.total_reports} />
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Processed narratives</span>
        </div>

        {/* Metric 2: SIF Precursors */}
        <div
          style={{
            padding: '18px 20px',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} color="var(--danger)" />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              SIF Precursors Identified
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)' }}>
            <CountUpNumber value={data.sif_precursor_count} />
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 600 }}>
            High potential events
          </span>
        </div>

        {/* Metric 3: Precursor Density */}
        <div
          style={{
            padding: '18px 20px',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={14} color={data.sif_precursor_density > 0.3 ? 'var(--danger)' : 'var(--success)'} />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              SIF Precursor Density
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)' }}>
            <CountUpNumber value={parseFloat(densityPercent)} decimals={1} suffix="%" />
          </div>
          <span style={{ fontSize: '0.72rem', color: data.sif_precursor_density > 0.3 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
            {data.sif_precursor_density > 0.3 ? 'High Risk Exposure' : 'Normal Baseline'}
          </span>
        </div>

        {/* Metric 4: Monitored Facilities */}
        <div
          style={{
            padding: '18px 20px',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={14} color="var(--primary)" />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              Monitored Facilities
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)' }}>
            <CountUpNumber value={data.sites} />
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sites / Rigs</span>
        </div>

        {/* Metric 5: Activities Evaluated */}
        <div
          style={{
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={14} color="var(--primary)" />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              Activities Evaluated
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)' }}>
            <CountUpNumber value={data.activities} />
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Operational Tasks</span>
        </div>
      </div>

      {/* 4. Safety Intelligence Transformation Pipeline */}
      <DataFlowPipeline
        onNavigate={onNavigate}
        theme={theme}
        totalReports={data.total_reports}
        sifCount={data.sif_precursor_count}
        activeBarriers={data.top_barrier_failures?.length || 7}
        lsrMatches={data.top_lsr?.length || 5}
      />

      {/* 5. Main Workspace: Emerging Precursor Patterns & Top Life-Saving Rules */}
      {data.total_reports === 0 ? (
        <EmptyTelemetryState
          title="No Telemetry Data Ingested"
          description="Ingest incident logs or operational reports to generate cluster patterns, barrier analysis, and LSR correlations."
          ctaLabel="Ingest Incident Data"
          ctaHref="/ingestion"
          onNavigate={onNavigate}
        />
      ) : (
        <>
          {/* Two Column Section: Emerging Precursor Patterns & Top Life-Saving Rules */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
            {/* Emerging Precursor Patterns */}
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Layers size={18} color="var(--primary)" /> Emerging Precursor Clusters
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
                    Unsupervised semantic vector clustering of precursor narratives
                  </p>
                </div>
                <button onClick={() => onNavigate('clusters')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                  View Clusters <ChevronRight size={14} />
                </button>
              </div>

              {data.emerging_patterns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                  <Zap size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.875rem' }}>No precursor pattern clusters generated yet.</p>
                  <button onClick={() => onNavigate('ingestion')} className="btn btn-secondary" style={{ marginTop: '10px', fontSize: '0.75rem' }}>
                    Import Data & Generate Clusters
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  {data.emerging_patterns.slice(0, 4).map((pattern, idx) => (
                    <motion.div
                      key={pattern.id || idx}
                      whileHover={{ x: 3 }}
                      onClick={() => onNavigate('clusters')}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '12px',
                        background: 'var(--surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s ease, background-color 0.15s ease',
                      }}
                      className="interactive-row"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {pattern.name}
                        </span>
                        <span className="badge badge-sif" style={{ fontSize: '0.72rem' }}>
                          {(pattern.sif_density * 100).toFixed(0)}% SIF Risk
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>
                          Reports: <strong style={{ color: 'var(--text-primary)' }}>{pattern.report_count}</strong>
                        </span>
                        {pattern.dominant_activity && (
                          <span>
                            Activity: <strong style={{ color: 'var(--primary-bright)' }}>{pattern.dominant_activity}</strong>
                          </span>
                        )}
                        {pattern.dominant_hazard && (
                          <span>
                            Hazard: <strong style={{ color: 'var(--danger)' }}>{pattern.dominant_hazard}</strong>
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Life-Saving Rule Implication */}
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Flame size={18} color="var(--primary)" /> Life-Saving Rule (LSR) Violations
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
                    High-energy precursor correlation to IOGP Life-Saving Rules
                  </p>
                </div>
                <button onClick={() => onNavigate('analytics')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                  Full Rankings <ChevronRight size={14} />
                </button>
              </div>

              {data.top_lsr.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                  <Zap size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.875rem' }}>No Life-Saving Rule mappings generated yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  {data.top_lsr.slice(0, 5).map((lsr, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: 'var(--surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '6px',
                              background: 'rgba(255, 106, 0, 0.12)',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            {idx + 1}
                          </span>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {lsr.rule_name}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-bright)', fontFamily: 'var(--font-mono)' }}>
                            {lsr.count}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            ({lsr.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>

                      <div style={{ width: '100%', height: '4px', background: 'var(--background-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(100, lsr.percentage * 2.5)}%`,
                            background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-bright) 100%)',
                            borderRadius: '2px',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Recurring Safety Barrier Failures Table Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                  Recurring Safety Barrier Failures
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
                  Systemic barrier defects and engineering/administrative control breakdowns
                </p>
              </div>
              <button onClick={() => onNavigate('analytics')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                Full Barrier Analytics <ChevronRight size={14} />
              </button>
            </div>

            {data.top_barrier_failures.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No barrier failure data yet.</p>
            ) : (
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', minWidth: '700px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '35%' }}>Barrier Failure Defect</th>
                      <th style={{ width: '20%' }}>Total Reports</th>
                      <th style={{ width: '20%' }}>SIF Precursor Count</th>
                      <th style={{ width: '25%' }}>SIF Precursor Density</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_barrier_failures.slice(0, 5).map((b, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {b.barrier_failure}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{b.total_reports}</td>
                        <td>
                          <span style={{ color: 'var(--danger)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                            {b.sif_count}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ flex: 1, height: '6px', background: 'var(--background-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${(b.sif_density * 100).toFixed(0)}%`,
                                  background: b.sif_density > 0.5 ? 'var(--danger)' : 'var(--primary)',
                                }}
                              />
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                              {(b.sif_density * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Heinrich's Principle Educational Modal */}
      <AnimatePresence>
        {showInfoModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={() => setShowInfoModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '600px',
                background: 'var(--surface-elevated, #1a1d24)',
                border: '1px solid var(--border, #2a2e39)',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setShowInfoModal(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '50%',
                }}
              >
                <X size={20} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(255, 106, 0, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}
                >
                  <Sparkles size={22} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                  Core Safety Principle
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: 'rgba(255, 106, 0, 0.08)',
                    border: '1px solid rgba(255, 106, 0, 0.2)',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: 'var(--primary-bright)',
                    lineHeight: 1.4,
                  }}
                >
                  "Minor incident frequency does not predict SIF frequency. Only SIF precursor potential predicts SIF frequency."
                </div>

                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Traditional safety metrics treat all near-misses equally under Heinrich's Triangle. SIF-GUARD isolates high-energy precursor events with broken life-critical barriers—the true statistical signals of fatal and catastrophic risk.
                </p>

                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <ShieldAlert size={16} color="var(--primary)" />
                  <span>Aligned with IOGP 9 Life-Saving Rules and Campbell Institute SIF Prevention methodology.</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
