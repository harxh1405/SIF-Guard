import React, { useState, useEffect, useRef } from 'react';
import { listReports, analyzeReport } from '../api/reports';
import { getSimilarReports } from '../api/patterns';
import type { SafetyReportRead, AnalysisResponse, SimilarReport } from '../types/api';
import { SIFBadge } from '../components/common/SIFBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { EmptyState } from '../components/common/EmptyState';
import { EvidenceHighlighter } from '../components/common/EvidenceHighlighter';
import { AIExplanationPanel } from '../components/common/AIExplanationPanel';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Play,
  Eye,
  Layers,
  X,
  Sparkles,
  Download,
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

  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Global search shortcut '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenReport = (report: SafetyReportRead) => {
    setSelectedReport(report);
    setAnalysisData(null);
    setSimilarReports([]);

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
      (r.site && r.site.toLowerCase().includes(q)) ||
      (r.source_record_id && r.source_record_id.toLowerCase().includes(q))
    );
  });

  const exportFilteredCSV = () => {
    if (filteredReports.length === 0) return;
    const headers = ['Record ID', 'Source', 'Site', 'Activity', 'Hazard', 'Barrier Failure', 'SIF Classification', 'Confidence', 'Narrative'];
    const rows = filteredReports.map((r) => [
      `"${r.source_record_id}"`,
      `"${r.source_dataset}"`,
      `"${(r.site || r.employer || '').replace(/"/g, '""')}"`,
      `"${(r.activity || '').replace(/"/g, '""')}"`,
      `"${(r.hazard || '').replace(/"/g, '""')}"`,
      `"${(r.barrier_failure || '').replace(/"/g, '""')}"`,
      `"${r.sif_potential || 'UNANALYZED'}"`,
      `"${r.sif_confidence || 0}"`,
      `"${r.report_text.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sif_guard_reports_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            Incident & Observation Intelligence Explorer
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Browse, filter, and inspect Serious Injury & Fatality (SIF) precursor intelligence across safety reports
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={exportFilteredCSV} className="btn btn-secondary">
            <Download size={15} /> Export CSV
          </button>
          <button onClick={() => onNavigate('ingestion')} className="btn btn-primary">
            + Import New Dataset
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search narrative text, activity, hazard, or site (Press '/' to focus)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
              fontFamily: 'var(--font-main)',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Filter size={16} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>SIF Classification:</span>
          <select
            value={sifFilter}
            onChange={(e) => setSifFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'var(--font-main)' }}
          >
            <option value="ALL">All Classifications</option>
            <option value="SIF_POTENTIAL">SIF Only</option>
            <option value="NON_SIF">Non SIF Only</option>
            <option value="UNCERTAIN">Uncertain Only</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Dataset:</span>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'var(--font-main)' }}
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
        <div className="glass-card" style={{ overflow: 'hidden', width: '100%' }}>
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', minWidth: '950px' }}>
              <thead>
                <tr>
                  <th style={{ width: '130px', whiteSpace: 'nowrap' }}>Record ID</th>
                  <th style={{ width: '140px', whiteSpace: 'nowrap' }}>Source</th>
                  <th style={{ minWidth: '150px', maxWidth: '200px' }}>Site / Employer</th>
                  <th style={{ minWidth: '160px', maxWidth: '220px' }}>Activity / Task</th>
                  <th style={{ minWidth: '140px', maxWidth: '180px' }}>Hazard</th>
                  <th style={{ minWidth: '150px', maxWidth: '180px' }}>Barrier Defect</th>
                  <th style={{ width: '160px', whiteSpace: 'nowrap' }}>SIF Classification</th>
                  <th style={{ width: '100px', whiteSpace: 'nowrap', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((r) => (
                  <tr key={r.id} onClick={() => handleOpenReport(r)}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {r.source_record_id}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '6px', background: 'var(--bg-badge)', border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                        {r.source_dataset}
                      </span>
                    </td>
                    <td
                      style={{
                        fontWeight: 600,
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={r.site || r.employer || 'Unspecified'}
                    >
                      {r.site || r.employer || 'Unspecified'}
                    </td>
                    <td
                      style={{
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={r.activity || 'Unspecified'}
                    >
                      {r.activity || 'Unspecified'}
                    </td>
                    <td
                      style={{
                        maxWidth: '180px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={r.hazard || 'Unspecified'}
                    >
                      {r.hazard || 'Unspecified'}
                    </td>
                    <td
                      style={{
                        maxWidth: '180px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: r.barrier_failure ? 'var(--accent-sif-red)' : 'var(--text-muted)',
                        fontWeight: r.barrier_failure ? 600 : 400,
                      }}
                      title={r.barrier_failure || 'None Detected'}
                    >
                      {r.barrier_failure || 'None Detected'}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <SIFBadge status={r.sif_potential} score={r.sif_score || r.sif_confidence} showScore />
                    </td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleOpenReport(r); }} className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '0.75rem' }}>
                        <Eye size={14} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report Intelligence Detail Modal */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            className="modal-backdrop"
            onClick={() => setSelectedReport(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              style={{ padding: '32px', maxWidth: '850px' }}
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                      #{selectedReport.source_record_id}
                    </span>
                    <span style={{ fontSize: '0.72rem', background: 'var(--accent-primary-bg)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                      {selectedReport.source_dataset}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', margin: 0 }}>
                    {selectedReport.site || selectedReport.employer || 'Safety Incident Intelligence Analysis'}
                  </h3>
                </div>
                <button onClick={() => setSelectedReport(null)} className="btn btn-secondary" style={{ padding: '6px' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Incident Narrative with Evidence Highlighting */}
              <div style={{ background: 'var(--bg-card)', padding: '18px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="var(--accent-cyan)" /> Incident Free-Text Narrative:
                </div>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  <EvidenceHighlighter
                    text={selectedReport.report_text}
                    energySource={selectedReport.energy_source}
                    barrierFailure={selectedReport.barrier_failure}
                    hazard={selectedReport.hazard}
                  />
                </div>
              </div>

              {/* Analysis Action / SIF Summary Banner */}
              <div style={{ marginBottom: '24px' }}>
                {!selectedReport.sif_potential && !analysisData ? (
                  <div style={{ textAlign: 'center', padding: '24px', background: 'var(--accent-primary-bg)', borderRadius: '10px', border: '1px solid var(--border-hover)' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>This report has not been analyzed by the NLP engine yet.</p>
                    <button onClick={() => handleRunAnalysis(selectedReport.id)} disabled={analyzing} className="btn btn-primary">
                      <Play size={16} /> {analyzing ? 'Running NLP Extraction & SIF Model...' : 'Analyze Report Now'}
                    </button>
                  </div>
                ) : (
                  <AIExplanationPanel
                    sifResult={analysisData?.sif}
                    sifStatus={selectedReport.sif_potential}
                    sifScore={selectedReport.sif_score || selectedReport.sif_confidence}
                    actualSeverity={selectedReport.actual_severity}
                    extracted={analysisData?.extraction || {
                      activity: selectedReport.activity || null,
                      hazard: selectedReport.hazard || null,
                      barrier_failure: selectedReport.barrier_failure || null,
                      energy_source: selectedReport.energy_source || null,
                    }}
                    lsrMatches={analysisData?.life_saving_rules || selectedReport.life_saving_rules || []}
                  />
                )}
              </div>

              {/* Similar Precursor Incidents (Vector Cosine Search) */}
              {similarReports.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={16} color="var(--accent-cyan)" /> Historically Similar Precursor Incidents (HNSW Semantic Retrieval)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {similarReports.map((sim, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.8rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.75rem' }}>
                            #{sim.source_record_id}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                            {(sim.similarity * 100).toFixed(0)}% Similarity
                          </span>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {sim.report_text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
