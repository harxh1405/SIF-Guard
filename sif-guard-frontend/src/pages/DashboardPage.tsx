import React, { useEffect, useState } from 'react';
import { getDashboardSummary } from '../api/analytics';
import type { DashboardSummary } from '../types/api';
import { MetricCard } from '../components/common/MetricCard';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  FileText,
  Building2,
  Activity,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Zap,
  ArrowUpRight,
  Layers,
  Flame,
} from 'lucide-react';
import type { TabId } from '../components/layout/Navigation';

interface Props {
  onNavigate: (tab: TabId) => void;
}

export const DashboardPage: React.FC<Props> = ({ onNavigate }) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      <div>
        <h2 className="section-title" style={{ marginBottom: '20px' }}>Executive Safety Intelligence Dashboard</h2>
        <LoadingSkeleton rows={5} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <h2 className="section-title" style={{ marginBottom: '20px' }}>Executive Safety Intelligence Dashboard</h2>
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
      {/* Top Header & Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              Executive Safety Intelligence
            </h2>
            <span
              style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--primary-bright)',
                background: 'rgba(255, 106, 0, 0.10)',
                border: '1px solid rgba(255, 106, 0, 0.20)',
                padding: '3px 10px',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 8px var(--primary)' }} />
              LIVE TELEMETRY
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            Real-time Serious Injury & Fatality (SIF) Precursor Analysis across upstream oil & gas operations
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => onNavigate('explorer')}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            Explore Incidents <ArrowUpRight size={16} />
          </button>
        </div>
      </div>

      {/* Hero Intelligence & Core Principle Card */}
      <div
        className="card"
        style={{
          padding: '24px 28px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderLeft: '4px solid var(--primary)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: '-40px',
            top: '-40px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(255, 106, 0, 0.10) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', maxWidth: '750px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Core Safety Principle: Actual Outcome ≠ Potential Outcome
                <Sparkles size={16} color="var(--primary-bright)" />
              </span>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                Heinrich's traditional pyramid fails in high-energy operations. SIF-Guard isolates precursors—hazardous exposures where a barrier defect created fatality potential—regardless of whether workers suffered zero injury, first aid, or severe harm.
              </p>
            </div>
          </div>

          {/* Quick Risk Ratio Pill */}
          <div
            style={{
              padding: '14px 20px',
              borderRadius: '14px',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              minWidth: '240px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>SIF Precursors ({densityPercent}%)</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>Non-SIF ({nonSifPercent}%)</span>
            </div>
            {/* Visual Multi-Segment Bar */}
            <div style={{ height: '8px', width: '100%', borderRadius: '4px', background: 'var(--background-secondary)', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${densityPercent}%`, background: 'var(--danger)', transition: 'width 0.4s ease' }} />
              <div style={{ width: `${nonSifPercent}%`, background: 'var(--success)', transition: 'width 0.4s ease' }} />
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
              {data.sif_precursor_count} of {data.total_reports} reports classified as high-potential
            </span>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <MetricCard
          title="Total Reports Analyzed"
          value={data.total_reports.toLocaleString()}
          subtitle="Processed narratives"
          icon={FileText}
        />
        <MetricCard
          title="SIF Precursors Identified"
          value={data.sif_precursor_count.toLocaleString()}
          subtitle="High potential events"
          icon={AlertTriangle}
          trend={`${densityPercent}% Precursor Density`}
          trendColor="red"
        />
        <MetricCard
          title="SIF Precursor Density"
          value={`${densityPercent}%`}
          subtitle="SIF / Total Ratio"
          icon={TrendingUp}
          trend={data.sif_precursor_density > 0.3 ? 'High Risk Exposure' : 'Normal Baseline'}
          trendColor={data.sif_precursor_density > 0.3 ? 'red' : 'green'}
        />
        <MetricCard
          title="Monitored Facilities"
          value={data.sites}
          subtitle="Sites / Employers"
          icon={Building2}
        />
        <MetricCard
          title="Activities Evaluated"
          value={data.activities}
          subtitle="Operational Tasks"
          icon={Activity}
        />
      </div>

      {/* Two Column Section: Emerging Precursor Patterns & Top Life-Saving Rules */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Emerging Precursor Patterns */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
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
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
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
              <ShieldAlert size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
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

                  {/* Progress fill bar */}
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
            <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>
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
    </motion.div>
  );
};
