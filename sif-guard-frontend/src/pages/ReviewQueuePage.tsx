import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getReviewQueue, submitReview } from '../api/review';
import type { SafetyReportRead } from '../types/api';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { EmptyState } from '../components/common/EmptyState';
import { SIFBadge } from '../components/common/SIFBadge';
import { EvidenceHighlighter } from '../components/common/EvidenceHighlighter';
import { AIExplanationPanel } from '../components/common/AIExplanationPanel';
import {
  CheckCircle2,
  AlertTriangle,
  Send,
  X,
  Check,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import type { TabId } from '../components/layout/Navigation';

interface Props {
  onNavigate: (tab: TabId) => void;
}

export const ReviewQueuePage: React.FC<Props> = ({ onNavigate }) => {
  const [queue, setQueue] = useState<SafetyReportRead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active / Focused Report in queue
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Selected Report for Detailed Review Modal
  const [selectedReport, setSelectedReport] = useState<SafetyReportRead | null>(null);
  const [reviewLabel, setReviewLabel] = useState<string>('SIF_POTENTIAL');
  const [confidence, setConfidence] = useState<number>(0.95);
  const [reviewerName, setReviewerName] = useState<string>('Senior HSE Engineer');
  const [comments, setComments] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick Action Feedback
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchQueue = () => {
    setLoading(true);
    setError(null);
    getReviewQueue(50)
      .then((data) => {
        setQueue(data);
        if (data.length > 0 && selectedIndex >= data.length) {
          setSelectedIndex(0);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch review queue');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const activeReport = queue[selectedIndex] || null;

  const handleOpenReview = (report: SafetyReportRead) => {
    setSelectedReport(report);
    setReviewLabel(report.sif_potential || 'SIF_POTENTIAL');
    setConfidence(report.sif_confidence || 0.95);
    setComments('');
    setSuccessMsg(null);
  };

  const handleQuickDecision = (report: SafetyReportRead, label: 'SIF_POTENTIAL' | 'NON_SIF') => {
    submitReview(report.id, {
      label,
      confidence: 0.98,
      reviewer: reviewerName,
      comments: `Quick triage action: Classified as ${label}`,
    })
      .then(() => {
        setActionNotice(`Report #${report.source_record_id} recorded as ${label}`);
        setTimeout(() => setActionNotice(null), 2500);
        // Remove from local queue
        setQueue((prev) => prev.filter((item) => item.id !== report.id));
      })
      .catch((err) => {
        setError(err.message || 'Failed to submit quick review');
      });
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    setSubmitting(true);
    submitReview(selectedReport.id, {
      label: reviewLabel,
      confidence,
      reviewer: reviewerName,
      comments,
    })
      .then(() => {
        setSubmitting(false);
        setSuccessMsg(`Review feedback submitted for Report #${selectedReport.source_record_id}`);
        setTimeout(() => {
          setSelectedReport(null);
          setQueue((prev) => prev.filter((item) => item.id !== selectedReport.id));
        }, 1000);
      })
      .catch((err) => {
        setError(err.message || 'Failed to submit review feedback');
        setSubmitting(false);
      });
  };

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't intercept if an input or textarea is active
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || selectedReport) return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < queue.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'c' || e.key === 'C') {
        if (activeReport) {
          e.preventDefault();
          handleQuickDecision(activeReport, 'SIF_POTENTIAL');
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (activeReport) {
          e.preventDefault();
          handleQuickDecision(activeReport, 'NON_SIF');
        }
      } else if (e.key === 'm' || e.key === 'M' || e.key === 'Enter') {
        if (activeReport) {
          e.preventDefault();
          handleOpenReview(activeReport);
        }
      }
    },
    [queue, activeReport, selectedReport, reviewerName]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 className="section-title">
            Human-in-the-Loop Triage & Review Queue
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Review ambiguous and border-line incident reports to train and refine the SIF Precursor Intelligence Engine
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-card)',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Pending: <strong>{queue.length}</strong> items
          </div>
        </div>
      </div>

      {actionNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid var(--accent-cyan)',
            color: 'var(--accent-cyan)',
            fontWeight: 600,
            fontSize: '0.85rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} /> {actionNotice}
        </motion.div>
      )}

      {error && <ErrorBanner message={error} onRetry={fetchQueue} />}

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : queue.length === 0 ? (
        <EmptyState
          title="Review Queue is Clear!"
          description="All safety reports meet the high-confidence classification threshold. No validation actions pending."
          actionLabel="Explore All Reports"
          onAction={() => onNavigate('explorer')}
        />
      ) : (
        /* Split-Pane Triage Workspace */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '420px 1fr',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Queue List */}
          <div
            className="glass-card"
            style={{
              padding: '12px',
              maxHeight: 'calc(100vh - 210px)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div
              style={{
                padding: '8px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Queue Items ({queue.length})</span>
              <span>Shortcuts: J/K</span>
            </div>

            {queue.map((report, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={report.id}
                  onClick={() => setSelectedIndex(idx)}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: isSelected ? 'var(--accent-primary-bg)' : 'var(--bg-card)',
                    border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        color: 'var(--accent-cyan)',
                        fontWeight: 700,
                      }}
                    >
                      #{report.source_record_id}
                    </span>
                    <SIFBadge status={report.sif_potential} score={report.sif_confidence} showScore />
                  </div>

                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {report.site || report.employer || 'Facility Report'}
                  </div>

                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      margin: 0,
                    }}
                  >
                    {report.report_text}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Column: Deep Inspection & One-Click Triage Panel */}
          {activeReport && (
            <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Report Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.9rem' }}>
                      Report #{activeReport.source_record_id}
                    </span>
                    <span style={{ fontSize: '0.75rem', background: 'var(--bg-badge)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                      {activeReport.source_dataset}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>
                    {activeReport.site || activeReport.employer || 'Incident Observation Inspection'}
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleQuickDecision(activeReport, 'SIF_POTENTIAL')}
                    className="btn btn-danger"
                    style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                    title="Press 'C' key"
                  >
                    <AlertTriangle size={15} /> Confirm SIF (C)
                  </button>
                  <button
                    onClick={() => handleQuickDecision(activeReport, 'NON_SIF')}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '6px 14px', background: 'var(--accent-nonsif-green)' }}
                    title="Press 'R' key"
                  >
                    <Check size={15} /> Non-SIF (R)
                  </button>
                  <button
                    onClick={() => handleOpenReview(activeReport)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                    title="Press 'M' key"
                  >
                    <SlidersHorizontal size={15} /> Modify (M)
                  </button>
                </div>
              </div>

              {/* Free-Text Narrative with Evidence Highlighting */}
              <div style={{ background: 'var(--bg-card)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="var(--accent-cyan)" /> Incident Narrative & AI Evidence Highlight:
                </div>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  <EvidenceHighlighter
                    text={activeReport.report_text}
                    energySource={activeReport.energy_source}
                    barrierFailure={activeReport.barrier_failure}
                    hazard={activeReport.hazard}
                  />
                </div>
              </div>

              {/* Multi-layered Explanation Panel */}
              <AIExplanationPanel
                sifStatus={activeReport.sif_potential}
                sifScore={activeReport.sif_confidence}
                actualSeverity={activeReport.actual_severity}
                extracted={{
                  activity: activeReport.activity || null,
                  hazard: activeReport.hazard || null,
                  barrier_failure: activeReport.barrier_failure || null,
                  energy_source: activeReport.energy_source || null,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Full HSE Modification Form Modal */}
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
              style={{ padding: '32px', maxWidth: '720px' }}
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                    Report #{selectedReport.source_record_id}
                  </span>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>
                    Expert HSE Review & Override
                  </h3>
                </div>
                <button onClick={() => setSelectedReport(null)} className="btn btn-secondary" style={{ padding: '6px' }}>
                  <X size={20} />
                </button>
              </div>

              {successMsg && (
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(16,185,129,0.15)', border: '1px solid var(--accent-nonsif-green)', color: 'var(--accent-nonsif-green)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} /> {successMsg}
                </div>
              )}

              <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>Incident Narrative:</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                  "{selectedReport.report_text}"
                </p>
              </div>

              <form onSubmit={handleSubmitFeedback}>
                <div style={{ marginBottom: '18px' }}>
                  <label className="micro-label" style={{ display: 'block', marginBottom: '8px' }}>
                    Select Validated SIF Status
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setReviewLabel('SIF_POTENTIAL')}
                      className={`btn ${reviewLabel === 'SIF_POTENTIAL' ? 'btn-danger' : 'btn-secondary'}`}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      <AlertTriangle size={16} /> SIF Potential
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewLabel('NON_SIF')}
                      className={`btn ${reviewLabel === 'NON_SIF' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, justifyContent: 'center', background: reviewLabel === 'NON_SIF' ? 'var(--accent-nonsif-green)' : undefined }}
                    >
                      <Check size={16} /> Non SIF
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewLabel('UNCERTAIN')}
                      className={`btn ${reviewLabel === 'UNCERTAIN' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        flex: 1,
                        justifyContent: 'center',
                        background: reviewLabel === 'UNCERTAIN' ? 'var(--accent-uncertain-amber)' : undefined,
                        color: reviewLabel === 'UNCERTAIN' ? '#0f172a' : undefined,
                        fontWeight: reviewLabel === 'UNCERTAIN' ? 700 : 500,
                      }}
                    >
                      UNCERTAIN
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Confidence Assessment: ({(confidence * 100).toFixed(0)}%)
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.05"
                    value={confidence}
                    onChange={(e) => setConfidence(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Reviewer Identity / HSE Role:
                  </label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    HSE Rationale & Control Recommendations:
                  </label>
                  <textarea
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Document justification, barrier deficiency, or recommended corrective action..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'var(--font-main)' }}
                  />
                </div>

                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  <Send size={16} /> {submitting ? 'Recording Review Decision...' : 'Save & Submit Review'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
