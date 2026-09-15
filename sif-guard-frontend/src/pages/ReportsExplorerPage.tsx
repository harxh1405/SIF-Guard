import React, { useState, useEffect } from 'react';
import { listReports, analyzeReport } from '../api/reports';
import { getSimilarReports } from '../api/patterns';
import type { SafetyReportRead, AnalysisResponse, SimilarReport } from '../types/api';
import { SIFBadge } from '../components/common/SIFBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { EmptyState } from '../components/common/EmptyState';
import { motion } from 'motion/react';
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
      (r.site && r.site.toLowerCase().includes(q))
    );
  });

  const exportFilteredJSON = () => {
    if (sortedReports.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(sortedReports, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `sif_guard_intelligence_export_${new Date().toISOString().slice(0, 10)}.json`);
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
<<<<<<< Updated upstream
          <h2 className="section-title">
            Incident & Observation Intelligence Explorer
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Browse, filter, and inspect Serious Injury & Fatality (SIF) precursor intelligence across safety reports
          </p>
        </div>
        <button onClick={() => onNavigate('ingestion')} className="btn btn-secondary">
          + Import New Dataset
        </button>
=======
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              Incident Intelligence Explorer
            </h2>
            <span
              style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(255, 106, 0, 0.12)',
                color: 'var(--primary-bright)',
                border: '1px solid rgba(255, 106, 0, 0.25)',
              }}
            >
              {sortedReports.length} {sortedReports.length === 1 ? 'RECORD' : 'RECORDS'}
            </span>
          </div>
          <p className="section-subtitle" style={{ marginTop: '4px' }}>
            Multi-dimensional NLP attribute filtering, vector evidence analysis, and IOGP Life-Saving Rules mapping.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            title="Refresh record set"
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button onClick={exportFilteredCSV} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem' }} title="Export to CSV format">
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button onClick={exportFilteredJSON} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem' }} title="Export to JSON format">
            <Download size={14} />
            <span>Export JSON</span>
          </button>

          <button onClick={() => onNavigate('ingestion')} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
            + Import New Dataset
          </button>
        </div>
>>>>>>> Stashed changes
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
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                    {r.source_record_id}
                  </td>
                  <td><span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', fontFamily: 'var(--font-mono)' }}>{r.source_dataset}</span></td>
                  <td style={{ fontWeight: 600 }}>{r.site || r.employer || 'Unspecified'}</td>
                  <td>{r.activity || 'Unspecified'}</td>
                  <td>{r.hazard || 'Unspecified'}</td>
                  <td style={{ color: r.barrier_failure ? 'var(--accent-sif-red)' : 'var(--text-muted)', fontWeight: r.barrier_failure ? 600 : 400 }}>
                    {r.barrier_failure || 'None Detected'}
                  </td>
                  <td>
                    <SIFBadge status={r.sif_potential} score={r.sif_score} />
                  </td>
                  <td>
                    <button onClick={(e) => { e.stopPropagation(); handleOpenReport(r); }} className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '0.75rem' }}>
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
                  <span style={{ fontSize: '0.72rem', background: 'var(--accent-primary-bg)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                    {selectedReport.source_dataset}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  {selectedReport.site || selectedReport.employer || 'Safety Incident Intelligence Analysis'}
                </h3>
              </div>
              <button onClick={() => setSelectedReport(null)} className="btn btn-secondary" style={{ padding: '6px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Incident Narrative */}
            <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                Incident Free-Text Narrative:
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                "{selectedReport.report_text}"
              </p>
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
                <div style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: (() => {
                    const status = analysisData?.sif.classification || selectedReport.sif_potential;
                    if (status === 'SIF_POTENTIAL') return 'var(--accent-sif-bg)';
                    if (status === 'UNCERTAIN') return 'var(--accent-uncertain-bg)';
                    return 'var(--accent-nonsif-bg)';
                  })(),
                  border: `1px solid ${(() => {
                    const status = analysisData?.sif.classification || selectedReport.sif_potential;
                    if (status === 'SIF_POTENTIAL') return 'var(--accent-sif-red)';
                    if (status === 'UNCERTAIN') return 'var(--accent-uncertain-amber)';
                    return 'var(--accent-nonsif-green)';
                  })()}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <SIFBadge status={analysisData?.sif.classification || selectedReport.sif_potential} score={analysisData?.sif.score || selectedReport.sif_score} showScore />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
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
              <h4 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)' }}>
                <Layers size={18} color="var(--accent-cyan)" /> Safety Precursor Fingerprint
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <span className="micro-label">Activity / Task:</span>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {analysisData?.extraction.activity || selectedReport.activity || 'Unspecified'}
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <span className="micro-label">Hazard Present:</span>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {analysisData?.extraction.hazard || selectedReport.hazard || 'Unspecified'}
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <span className="micro-label">Exposure Mode:</span>
                  <div style={{ fontSize: '0.875rem', color: 'var(--accent-cyan)', fontWeight: 600, marginTop: '2px' }}>
                    {analysisData?.extraction.exposure || selectedReport.exposure || 'None Detected'}
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <span className="micro-label">Barrier Failure:</span>
                  <div style={{ fontSize: '0.875rem', color: 'var(--accent-sif-red)', fontWeight: 700, marginTop: '2px' }}>
                    {analysisData?.extraction.barrier_failure || selectedReport.barrier_failure || 'None Detected'}
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <span className="micro-label">Energy Source:</span>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {analysisData?.extraction.energy_source || selectedReport.energy_source || 'Unspecified'}
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <span className="micro-label">Potential Consequence:</span>
                  <div style={{ fontSize: '0.875rem', color: 'var(--accent-sif-red)', fontWeight: 600, marginTop: '2px' }}>
                    {analysisData?.extraction.potential_consequence || selectedReport.potential_consequence || 'Unspecified'}
                  </div>
                </div>
              </div>
            </div>

<<<<<<< Updated upstream
            {/* Matched Life-Saving Rules */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '10px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                Matched IOGP Life-Saving Rules
              </h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {(analysisData?.life_saving_rules || selectedReport.life_saving_rules || []).map((lsr: any, idx: number) => (
                  <span key={idx} style={{ padding: '6px 14px', borderRadius: '20px', background: 'var(--accent-primary-bg)', border: '1px solid var(--border-hover)', color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                    {lsr.rule_name || lsr} ({(lsr.score ? lsr.score * 100 : 80).toFixed(0)}% Match)
                  </span>
                ))}
=======
              {/* Drawer Body - Scrollable Content */}
              <div
                style={{
                  padding: '24px',
                  overflowY: 'auto',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '22px',
                }}
              >
                {/* 1. SIF Classification & Confidence Badge Row */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background:
                      selectedReport.sif_potential === 'SIF_POTENTIAL'
                        ? 'rgba(232, 93, 93, 0.10)'
                        : selectedReport.sif_potential === 'NON_SIF'
                        ? 'rgba(32, 217, 151, 0.10)'
                        : 'rgba(255, 179, 71, 0.10)',
                    border: `1px solid ${
                      selectedReport.sif_potential === 'SIF_POTENTIAL'
                        ? 'rgba(232, 93, 93, 0.3)'
                        : selectedReport.sif_potential === 'NON_SIF'
                        ? 'rgba(32, 217, 151, 0.3)'
                        : 'rgba(255, 179, 71, 0.3)'
                    }`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <SIFBadge
                      status={selectedReport.sif_potential}
                      score={selectedReport.sif_score || selectedReport.sif_confidence}
                      showScore
                      size="lg"
                    />
                    {selectedReport.barrier_failure && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          background: 'rgba(232, 93, 93, 0.2)',
                          color: 'var(--danger)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        BARRIER DEFECT DETECTED
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Confidence:{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {Math.round(((selectedReport.sif_confidence || selectedReport.sif_score || 0) > 1 ? (selectedReport.sif_confidence || selectedReport.sif_score || 0) : (selectedReport.sif_confidence || selectedReport.sif_score || 0) * 100))}%
                    </strong>
                  </div>
                </div>

                {/* 2. Free-Text Incident Narrative with Evidence Highlighter */}
                <div
                  style={{
                    background: 'var(--surface-elevated)',
                    padding: '18px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: '10px',
                      fontFamily: 'var(--font-mono)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Sparkles size={14} color="var(--primary)" /> Incident Free-Text Narrative (NLP Grounding):
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.65 }}>
                    <EvidenceHighlighter
                      text={selectedReport.report_text}
                      energySource={selectedReport.energy_source}
                      barrierFailure={selectedReport.barrier_failure}
                      hazard={selectedReport.hazard}
                      searchQuery={searchQuery}
                    />
                  </div>
                </div>

                {/* 3. Structured Extracted Parameters Grid */}
                <div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: '10px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    Extracted Precursor Attributes
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                    }}
                  >
                    {/* Site */}
                    <div
                      style={{
                        padding: '12px',
                        background: 'var(--surface-elevated)',
                        borderRadius: '9px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span className="micro-label" style={{ display: 'block', marginBottom: '4px' }}>
                        Facility / Employer
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {selectedReport.site || selectedReport.employer || 'Unspecified'}
                      </span>
                    </div>

                    {/* Activity */}
                    <div
                      style={{
                        padding: '12px',
                        background: 'var(--surface-elevated)',
                        borderRadius: '9px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span className="micro-label" style={{ display: 'block', marginBottom: '4px' }}>
                        Activity / Task
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {selectedReport.activity || 'Unspecified'}
                      </span>
                    </div>

                    {/* Hazard */}
                    <div
                      style={{
                        padding: '12px',
                        background: 'var(--surface-elevated)',
                        borderRadius: '9px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span className="micro-label" style={{ display: 'block', marginBottom: '4px' }}>
                        Identified Hazard
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {selectedReport.hazard || 'Unspecified'}
                      </span>
                    </div>

                    {/* Barrier Failure */}
                    <div
                      style={{
                        padding: '12px',
                        background: 'var(--surface-elevated)',
                        borderRadius: '9px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span className="micro-label" style={{ display: 'block', marginBottom: '4px' }}>
                        Barrier Defect
                      </span>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: selectedReport.barrier_failure ? 700 : 500,
                          color: selectedReport.barrier_failure ? 'var(--danger)' : 'var(--text-muted)',
                        }}
                      >
                        {selectedReport.barrier_failure || 'None Detected'}
                      </span>
                    </div>

                    {/* Energy Source */}
                    <div
                      style={{
                        padding: '12px',
                        background: 'var(--surface-elevated)',
                        borderRadius: '9px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span className="micro-label" style={{ display: 'block', marginBottom: '4px' }}>
                        Energy Source
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {selectedReport.energy_source || 'Unspecified'}
                      </span>
                    </div>

                    {/* Severity / Consequence */}
                    <div
                      style={{
                        padding: '12px',
                        background: 'var(--surface-elevated)',
                        borderRadius: '9px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span className="micro-label" style={{ display: 'block', marginBottom: '4px' }}>
                        Actual Severity / Body Part
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {selectedReport.actual_severity || selectedReport.affected_body_part || 'Observation / Near Miss'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. AI Explanation & NLP Model Assessment */}
                <div>
                  {!selectedReport.sif_potential && !analysisData ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '20px',
                        background: 'var(--surface-elevated)',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        This report has not been evaluated by the NLP SIF classifier.
                      </p>
                      <button
                        onClick={() => handleRunAnalysis(selectedReport.id)}
                        disabled={analyzing}
                        className="btn btn-primary"
                        style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                      >
                        <Play size={15} /> {analyzing ? 'Running Extraction...' : 'Analyze Report Now'}
                      </button>
                    </div>
                  ) : (
                    <AIExplanationPanel
                      sifResult={analysisData?.sif}
                      sifStatus={selectedReport.sif_potential}
                      sifScore={selectedReport.sif_score || selectedReport.sif_confidence}
                      actualSeverity={selectedReport.actual_severity}
                      extracted={
                        analysisData?.extraction || {
                          activity: selectedReport.activity || null,
                          hazard: selectedReport.hazard || null,
                          barrier_failure: selectedReport.barrier_failure || null,
                          energy_source: selectedReport.energy_source || null,
                        }
                      }
                      lsrMatches={analysisData?.life_saving_rules || selectedReport.life_saving_rules || []}
                    />
                  )}
                </div>

                {/* 5. Historically Similar Incidents (HNSW Semantic Retrieval) */}
                {similarReports.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <h4
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-primary)',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase',
                      }}
                    >
                      <Layers size={15} color="var(--primary)" /> Similar Historical Precursors (Vector Cosine):
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {similarReports.map((sim, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            background: 'var(--surface-elevated)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.78rem',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '4px',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                color: 'var(--primary-bright)',
                                fontSize: '0.75rem',
                              }}
                            >
                              #{sim.source_record_id}
                            </span>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                color: 'var(--success)',
                                fontWeight: 600,
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {Math.round(sim.similarity * 100)}% Match
                            </span>
                          </div>
                          <p
                            style={{
                              margin: 0,
                              color: 'var(--text-secondary)',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.4,
                            }}
                          >
                            {sim.report_text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
>>>>>>> Stashed changes
              </div>
            </div>

            {/* Similar Reports Recommendations */}
            {similarReports.length > 0 && (
              <div>
                <h4 style={{ fontSize: '1rem', marginBottom: '10px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  Vector-Similar Safety Reports
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {similarReports.map((sim) => (
                    <div key={sim.id} style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
    </motion.div>
  );
};
