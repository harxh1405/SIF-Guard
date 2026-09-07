import React, { useState, useEffect } from 'react';
import { listReports, analyzeReport } from '../api/reports';
import { getSimilarReports } from '../api/patterns';
import type { SafetyReportRead, AnalysisResponse, SimilarReport } from '../types/api';
import { SIFBadge } from '../components/common/SIFBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { EmptyState } from '../components/common/EmptyState';
import {
  Search,
  Filter,
  Play,
  Eye,
  Layers,
  X,
} from 'lucide-react';
import type { TabId } from '../components/layout/Navigation';

interface Props {
  onNavigate: (tab: TabId) => void;
}

export const ReportsExplorerPage: React.FC<Props> = ({ onNavigate }) => {
  const [reports, setReports] = useState<SafetyReportRead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sifFilter, setSifFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');

  // Selected Report Modal / Intelligence Drawer
  const [selectedReport, setSelectedReport] = useState<SafetyReportRead | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
  const [similarReports, setSimilarReports] = useState<SimilarReport[]>([]);
  const [analyzing, setAnalyzing] = useState<boolean>(false);

  const fetchReports = () => {
    setLoading(true);
    setError(null);
    listReports(0, 100, sourceFilter === 'ALL' ? undefined : sourceFilter, sifFilter === 'ALL' ? undefined : sifFilter)
      .then((data) => {
        setReports(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch reports');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReports();
  }, [sifFilter, sourceFilter]);

  const handleOpenReport = (report: SafetyReportRead) => {
    setSelectedReport(report);
    setAnalysisData(null);
    setSimilarReports([]);
    
    // Automatically trigger analyze API if not analyzed yet, or retrieve similarity
    if (!report.sif_potential) {
      handleRunAnalysis(report.id);
    } else {
      getSimilarReports(report.id, 4)
        .then((res) => setSimilarReports(res.similar_reports))
        .catch(() => {});
    }
  };

  const handleRunAnalysis = (reportId: string) => {
    setAnalyzing(true);
    analyzeReport(reportId)
      .then((res) => {
        setAnalysisData(res);
        setAnalyzing(false);
        // Refresh list to update badge
        fetchReports();
        getSimilarReports(reportId, 4)
          .then((sim) => setSimilarReports(sim.similar_reports))
          .catch(() => {});
      })
      .catch(() => {
        setAnalyzing(false);
      });
  };

  const filteredReports = reports.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.report_text.toLowerCase().includes(q) ||
      (r.activity && r.activity.toLowerCase().includes(q)) ||
      (r.hazard && r.hazard.toLowerCase().includes(q)) ||
      (r.site && r.site.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)' }}>
            Incident & Observation Intelligence Explorer
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Browse, filter, and inspect Serious Injury & Fatality (SIF) precursor intelligence across safety reports
          </p>
        </div>
        <button onClick={() => onNavigate('ingestion')} className="btn btn-secondary">
          + Import New Dataset
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search narrative text, activity, hazard, or site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'rgba(7, 15, 30, 0.8)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Filter size={16} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>SIF Potential:</span>
          <select
            value={sifFilter}
            onChange={(e) => setSifFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(7, 15, 30, 0.8)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
          >
            <option value="ALL">All Classifications</option>
            <option value="SIF_POTENTIAL">SIF Potential Only</option>
            <option value="NON_SIF">Non SIF Only</option>
            <option value="UNCERTAIN">Uncertain Only</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Dataset:</span>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(7, 15, 30, 0.8)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
          >
            <option value="ALL">All Sources</option>
            <option value="osha_severe">OSHA Severe Injury</option>
            <option value="osha_construction">OSHA Construction</option>
            <option value="oil_hsse">OIL HSSE Data</option>
          </select>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchReports} />}

      {/* Reports Table */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : filteredReports.length === 0 ? (
        <EmptyState
          title="No Safety Reports Found"
          description="No reports match your current filter criteria or no dataset has been imported yet."
          actionLabel="Go to Ingestion Center"
          onAction={() => onNavigate('ingestion')}
        />
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Source</th>
                <th>Site / Employer</th>
                <th>Activity / Task</th>
                <th>Hazard</th>
                <th>Barrier Defect</th>
                <th>SIF Classification</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((r) => (
                <tr key={r.id} onClick={() => handleOpenReport(r)}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                    {r.source_record_id}
                  </td>
                  <td><span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }}>{r.source_dataset}</span></td>
                  <td style={{ fontWeight: 600 }}>{r.site || r.employer || 'Unspecified'}</td>
                  <td>{r.activity || 'Unspecified'}</td>
                  <td>{r.hazard || 'Unspecified'}</td>
                  <td style={{ color: r.barrier_failure ? 'var(--accent-sif-red)' : 'var(--text-muted)' }}>
                    {r.barrier_failure || 'None Detected'}
                  </td>
                  <td>
                    <SIFBadge status={r.sif_potential} score={r.sif_score} />
                  </td>
                  <td>
                    <button onClick={(e) => { e.stopPropagation(); handleOpenReport(r); }} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      <Eye size={14} /> Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report Intelligence Detail Modal */}
      {selectedReport && (
        <div className="modal-backdrop" onClick={() => setSelectedReport(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                    #{selectedReport.source_record_id}
                  </span>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                    {selectedReport.source_dataset}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                  {selectedReport.site || selectedReport.employer || 'Safety Incident Intelligence Analysis'}
                </h3>
              </div>
              <button onClick={() => setSelectedReport(null)} className="btn btn-secondary" style={{ padding: '6px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Incident Narrative */}
            <div style={{ background: 'rgba(7, 15, 30, 0.9)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                Incident Free-Text Narrative:
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                "{selectedReport.report_text}"
              </p>
            </div>

            {/* Analysis Action / SIF Summary Banner */}
            <div style={{ marginBottom: '24px' }}>
              {!selectedReport.sif_potential && !analysisData ? (
                <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(0,141,218,0.08)', borderRadius: '10px' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>This report has not been analyzed by the NLP engine yet.</p>
                  <button onClick={() => handleRunAnalysis(selectedReport.id)} disabled={analyzing} className="btn btn-primary">
                    <Play size={16} /> {analyzing ? 'Running NLP Extraction & SIF Model...' : 'Analyze Report Now'}
                  </button>
                </div>
              ) : (
                <div style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: (analysisData?.sif.classification || selectedReport.sif_potential) === 'SIF_POTENTIAL'
                    ? 'linear-gradient(135deg, rgba(231,76,60,0.15) 0%, rgba(13,27,46,0.9) 100%)'
                    : 'linear-gradient(135deg, rgba(0,230,118,0.15) 0%, rgba(13,27,46,0.9) 100%)',
                  border: `1px solid ${(analysisData?.sif.classification || selectedReport.sif_potential) === 'SIF_POTENTIAL' ? 'rgba(231,76,60,0.4)' : 'rgba(0,230,118,0.4)'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <SIFBadge status={analysisData?.sif.classification || selectedReport.sif_potential} score={analysisData?.sif.score || selectedReport.sif_score} showScore />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Model Confidence: <strong>{((analysisData?.sif.confidence || selectedReport.sif_confidence || 0) * 100).toFixed(0)}%</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Explainable Risk Factors & Precursor Signals:
                  </div>
                  <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {(analysisData?.sif.risk_factors || []).map((rf, idx) => (
                      <li key={idx}>{rf}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 10-Dimension Precursor Fingerprint Grid */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="var(--accent-cyan)" /> Safety Precursor Fingerprint
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Activity / Task:</span>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {analysisData?.extraction.activity || selectedReport.activity || 'Unspecified'}
                  </div>
                </div>

                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Hazard Present:</span>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {analysisData?.extraction.hazard || selectedReport.hazard || 'Unspecified'}
                  </div>
                </div>

                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Exposure Mode:</span>
                  <div style={{ fontSize: '0.875rem', color: 'var(--accent-cyan)' }}>
                    {analysisData?.extraction.exposure || selectedReport.exposure || 'None Detected'}
                  </div>
                </div>

                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Barrier Failure:</span>
                  <div style={{ fontSize: '0.875rem', color: 'var(--accent-sif-red)', fontWeight: 600 }}>
                    {analysisData?.extraction.barrier_failure || selectedReport.barrier_failure || 'None Detected'}
                  </div>
                </div>

                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Energy Source:</span>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {analysisData?.extraction.energy_source || selectedReport.energy_source || 'Unspecified'}
                  </div>
                </div>

                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Potential Consequence:</span>
                  <div style={{ fontSize: '0.875rem', color: 'var(--accent-sif-red)' }}>
                    {analysisData?.extraction.potential_consequence || selectedReport.potential_consequence || 'Unspecified'}
                  </div>
                </div>
              </div>
            </div>

            {/* Matched Life-Saving Rules */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '10px', color: 'var(--text-primary)' }}>
                Matched IOGP Life-Saving Rules
              </h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {(analysisData?.life_saving_rules || selectedReport.life_saving_rules || []).map((lsr: any, idx: number) => (
                  <span key={idx} style={{ padding: '6px 14px', borderRadius: '20px', background: 'rgba(0,141,218,0.15)', border: '1px solid rgba(0,141,218,0.3)', color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 600 }}>
                    {lsr.rule_name || lsr} ({(lsr.score ? lsr.score * 100 : 80).toFixed(0)}% Match)
                  </span>
                ))}
              </div>
            </div>

            {/* Similar Reports Recommendations */}
            {similarReports.length > 0 && (
              <div>
                <h4 style={{ fontSize: '1rem', marginBottom: '10px', color: 'var(--text-primary)' }}>
                  Vector-Similar Safety Reports
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {similarReports.map((sim) => (
                    <div key={sim.id} style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>#{sim.source_record_id}</span>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{sim.report_text}</p>
                      </div>
                      <span className="badge badge-uncertain" style={{ fontSize: '0.7rem' }}>
                        {(sim.similarity * 100).toFixed(0)}% Similarity
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
