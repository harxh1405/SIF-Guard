import React, { useState, useEffect } from 'react';
import { getClusters, triggerClustering } from '../api/patterns';
import type { PrecursorCluster } from '../types/api';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { EmptyState } from '../components/common/EmptyState';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { TabId } from '../components/layout/Navigation';

interface Props {
  onNavigate: (tab: TabId) => void;
}

export const PrecursorClustersPage: React.FC<Props> = ({ onNavigate }) => {
  const [clusters, setClusters] = useState<PrecursorCluster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [clustering, setClustering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClusters = () => {
    setLoading(true);
    setError(null);
    getClusters()
      .then((data) => {
        setClusters(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch precursor clusters');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  const handleRunClustering = () => {
    setClustering(true);
    triggerClustering(3)
      .then((res) => {
        setClusters(res.clusters);
        setClustering(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to run clustering');
        setClustering(false);
      });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="section-title">
            Recurring Precursor Pattern Clusters
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Semantic HDBSCAN clustering discovering recurring precursor patterns across safety reports
          </p>
        </div>
        <button onClick={handleRunClustering} disabled={clustering} className="btn btn-primary">
          <RefreshCw size={16} className={clustering ? 'animate-spin' : ''} />
          {clustering ? 'Running HDBSCAN Clustering...' : 'Re-Run HDBSCAN Clustering'}
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchClusters} />}

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : clusters.length === 0 ? (
        <EmptyState
          title="No Precursor Clusters Discovered Yet"
          description="Click 'Re-Run HDBSCAN Clustering' or import dataset reports to analyze recurring precursor patterns."
          actionLabel="Run Clustering Now"
          onAction={handleRunClustering}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {clusters.map((c, idx) => {
            const densityPct = (c.sif_density * 100).toFixed(1);

            return (
              <motion.div
                key={c.id || c.cluster_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                whileHover={{ y: -3 }}
                className="glass-card"
                style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '6px', background: 'var(--accent-primary-bg)', color: 'var(--accent-cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)', border: '1px solid var(--border-hover)' }}>
                      Cluster #{c.cluster_id}
                    </span>
                    <span className="badge badge-sif" style={{ fontSize: '0.75rem' }}>
                      {densityPct}% SIF Density
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
                    {c.name}
                  </h3>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                    {c.description}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem', background: 'var(--bg-badge)', padding: '12px', borderRadius: '10px', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <span className="micro-label">Dominant Activity:</span>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{c.dominant_activity || 'General'}</div>
                    </div>
                    <div>
                      <span className="micro-label">Dominant Hazard:</span>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{c.dominant_hazard || 'Unspecified'}</div>
                    </div>
                    <div>
                      <span className="micro-label">Barrier Failure:</span>
                      <div style={{ fontWeight: 600, color: 'var(--accent-sif-red)', marginTop: '2px' }}>{c.dominant_barrier_failure || 'Unspecified'}</div>
                    </div>
                    <div>
                      <span className="micro-label">Dominant LSR:</span>
                      <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginTop: '2px' }}>{c.dominant_lsr || 'Unspecified'}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    Reports: <strong>{c.report_count}</strong> | SIF: <strong style={{ color: 'var(--accent-sif-red)' }}>{c.sif_precursor_count}</strong>
                  </span>
                  <button onClick={() => onNavigate('explorer')} className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '0.75rem' }}>
                    Explore Reports <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
