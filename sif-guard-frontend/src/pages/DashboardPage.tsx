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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="section-title">
            Executive Safety Intelligence Overview
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Real-time Serious Injury & Fatality (SIF) Precursor Analysis across Oil India Limited Datasets
          </p>
        </div>
        <button onClick={() => onNavigate('explorer')} className="btn btn-primary">
          Explore All Incidents <ChevronRight size={16} />
        </button>
      </div>

      {/* Concept Alert Card */}
      <div
        className="glass-card"
        style={{
          padding: '20px 24px',
          marginBottom: '24px',
          borderLeft: '4px solid var(--accent-cyan)',
          background: 'var(--accent-primary-bg)',
          border: '1px solid var(--border-hover)',
          boxShadow: 'var(--shadow-glass)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <ShieldCheck size={26} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)' }}>
              Core Safety Principle: Actual Outcome ≠ Potential Outcome
            </span>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.45 }}>
              SIF-Guard identifies hazardous precursors (un-tested confined space entry, suspended load exposures, bypassed LOTO) regardless of whether an actual injury occurred.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <MetricCard
          title="Total Reports Analyzed"
          value={data.total_reports}
          subtitle="Processed narratives"
          icon={FileText}
        />
        <MetricCard
          title="SIF Precursors Identified"
          value={data.sif_precursor_count}
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
          trend={data.sif_precursor_density > 0.3 ? 'High Organizational Risk' : 'Normal Baseline'}
          trendColor={data.sif_precursor_density > 0.3 ? 'red' : 'green'}
        />
        <MetricCard
          title="Active Facilities"
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

      {/* Two Column Layout: Emerging Patterns & Top Rankings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* Emerging Precursor Patterns */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)' }}>
              <ShieldAlert size={18} color="var(--accent-sif-red)" /> Emerging Precursor Patterns
            </h3>
            <button onClick={() => onNavigate('clusters')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '5px 12px' }}>
              View All Clusters
            </button>
          </div>

          {data.emerging_patterns.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No precursor pattern clusters generated yet. Run import & analysis first.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.emerging_patterns.slice(0, 4).map((pattern, idx) => (
                <motion.div
                  key={pattern.id || idx}
                  whileHover={{ x: 3 }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{pattern.name}</span>
                    <span className="badge badge-sif">{(pattern.sif_density * 100).toFixed(0)}% SIF</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '16px' }}>
                    <span>Reports: <strong>{pattern.report_count}</strong></span>
                    <span>Activity: <strong>{pattern.dominant_activity}</strong></span>
                    <span>Hazard: <strong>{pattern.dominant_hazard}</strong></span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Top Life-Saving Rule Violations */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              Top Life-Saving Rule Implication
            </h3>
            <button onClick={() => onNavigate('analytics')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '5px 12px' }}>
              Full Rankings
            </button>
          </div>

          {data.top_lsr.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No Life-Saving Rule mappings generated yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.top_lsr.slice(0, 5).map((lsr, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-primary-bg)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{lsr.rule_name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{lsr.count}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>({lsr.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Hazard & Barrier Rankings Preview Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          Recurring Safety Barrier Failures
        </h3>
        {data.top_barrier_failures.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No barrier failure data yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Barrier Failure Defect</th>
                <th>Total Reports</th>
                <th>SIF Precursor Count</th>
                <th>SIF Precursor Density</th>
              </tr>
            </thead>
            <tbody>
              {data.top_barrier_failures.slice(0, 5).map((b, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{b.barrier_failure}</td>
                  <td>{b.total_reports}</td>
                  <td><span style={{ color: 'var(--accent-sif-red)', fontWeight: 700 }}>{b.sif_count}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(b.sif_density * 100).toFixed(0)}%`, background: b.sif_density > 0.5 ? 'var(--accent-sif-red)' : 'var(--accent-cyan)' }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{(b.sif_density * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
};
