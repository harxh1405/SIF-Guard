import React, { useState, useEffect } from 'react';
import { getClusters, triggerClustering } from '../api/patterns';
import type { PrecursorCluster } from '../types/api';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { EmptyState } from '../components/common/EmptyState';
import { RefreshCw } from 'lucide-react';
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)' }}>
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
          {clusters.map((c) => {
            const densityPct = (c.sif_density * 100).toFixed(1);

            return (
              <div key={c.id || c.cluster_id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(0,141,218,0.15)', color: 'var(--accent-cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      Cluster #{c.cluster_id}
                    </span>
                    <span className="badge badge-sif" style={{ fontSize: '0.75rem' }}>
                      {densityPct}% SIF Density
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {c.name}
                  </h3>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                    {c.description}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Dominant Activity:</span>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.dominant_activity || 'General'}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Dominant Hazard:</span>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.dominant_hazard || 'Unspecified'}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Barrier Failure:</span>
                      <div style={{ fontWeight: 600, color: 'var(--accent-sif-red)' }}>{c.dominant_barrier_failure || 'Unspecified'}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Dominant LSR:</span>
                      <div style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{c.dominant_lsr || 'Unspecified'}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Reports: <strong>{c.report_count}</strong> | SIF Precursors: <strong style={{ color: 'var(--accent-sif-red)' }}>{c.sif_precursor_count}</strong>
                  </span>
                  <button onClick={() => onNavigate('explorer')} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                    Explore Reports
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
