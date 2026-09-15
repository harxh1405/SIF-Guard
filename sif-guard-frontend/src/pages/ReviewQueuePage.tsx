import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getReviewQueue, submitReview } from '../api/review';
import type { SafetyReportRead } from '../types/api';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { EmptyState } from '../components/common/EmptyState';
import { SIFBadge } from '../components/common/SIFBadge';
<<<<<<< Updated upstream
import { UserCheck, CheckCircle2, AlertTriangle, Send, X } from 'lucide-react';
=======
import { EvidenceHighlighter } from '../components/common/EvidenceHighlighter';
import { AIExplanationPanel } from '../components/common/AIExplanationPanel';
import { ToastNotification, type ToastMessage } from '../components/common/ToastNotification';
import {
  CheckCircle2,
  AlertTriangle,
  Send,
  X,
  Check,
  Sparkles,
  SlidersHorizontal,
  Award,
} from 'lucide-react';
>>>>>>> Stashed changes
import type { TabId } from '../components/layout/Navigation';

interface Props {
  onNavigate: (tab: TabId) => void;
}

export const ReviewQueuePage: React.FC<Props> = ({ onNavigate }) => {
  const [queue, setQueue] = useState<SafetyReportRead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Report for Review
  const [selectedReport, setSelectedReport] = useState<SafetyReportRead | null>(null);
  const [reviewLabel, setReviewLabel] = useState<string>('SIF_POTENTIAL');
  const [confidence, setConfidence] = useState<number>(0.95);
  const [reviewerName, setReviewerName] = useState<string>('Senior HSE Engineer');
  const [comments, setComments] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

<<<<<<< Updated upstream
=======
  // Toast System state & Daily Progress Counter
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [completedToday, setCompletedToday] = useState<number>(0);

  const addToast = (type: 'success' | 'warning' | 'danger' | 'info', title: string, description?: string) => {
    const newToast: ToastMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      title,
      description,
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

>>>>>>> Stashed changes
  const fetchQueue = () => {
    setLoading(true);
    setError(null);
    getReviewQueue(30)
      .then((data) => {
        setQueue(data);
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

  const handleOpenReview = (report: SafetyReportRead) => {
    setSelectedReport(report);
    setReviewLabel(report.sif_potential || 'SIF_POTENTIAL');
    setConfidence(report.sif_confidence || 0.95);
    setComments('');
    setSuccessMsg(null);
  };

<<<<<<< Updated upstream
=======
  const handleQuickDecision = (report: SafetyReportRead, label: 'SIF_POTENTIAL' | 'NON_SIF') => {
    submitReview(report.id, {
      label,
      confidence: 0.98,
      reviewer: reviewerName,
      comments: `Quick triage action: Classified as ${label}`,
    })
      .then(() => {
        setCompletedToday((prev) => prev + 1);
        addToast(
          label === 'SIF_POTENTIAL' ? 'danger' : 'success',
          `Report #${report.source_record_id} Triaged`,
          `Recorded decision as ${label === 'SIF_POTENTIAL' ? 'SIF Potential Hazard' : 'Non-SIF Hazard'}`
        );
        // Remove from local queue
        setQueue((prev) => prev.filter((item) => item.id !== report.id));
      })
      .catch((err) => {
        setError(err.message || 'Failed to submit quick review');
      });
  };

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        setSuccessMsg(`Review feedback submitted for Report #${selectedReport.source_record_id}`);
        setTimeout(() => {
          setSelectedReport(null);
          fetchQueue();
        }, 1200);
=======
        setCompletedToday((prev) => prev + 1);
        addToast(
          'success',
          `Expert Override Submitted`,
          `Report #${selectedReport.source_record_id} updated with ${reviewLabel} classification.`
        );
        setSelectedReport(null);
        setQueue((prev) => prev.filter((item) => item.id !== selectedReport.id));
>>>>>>> Stashed changes
      })
      .catch((err) => {
        setError(err.message || 'Failed to submit review feedback');
        setSubmitting(false);
      });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
<<<<<<< Updated upstream
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Human-in-the-Loop Review Queue
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Review ambiguous or low-confidence safety reports to refine SIF precursor classifier accuracy
        </p>
=======
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="section-title">
            Human-in-the-Loop Triage & Review Queue
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Review ambiguous and borderline incident reports to train and refine the SIF Precursor Intelligence Engine
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--success)',
              background: 'rgba(32, 217, 151, 0.12)',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(32, 217, 151, 0.25)',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Award size={14} /> Triaged Today: <strong style={{ color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>{completedToday}</strong>
          </div>

          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              background: 'var(--surface-elevated)',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Pending: <strong style={{ color: 'var(--primary-bright)', fontVariantNumeric: 'tabular-nums' }}>{queue.length}</strong> items
          </div>
        </div>
>>>>>>> Stashed changes
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchQueue} />}

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : queue.length === 0 ? (
        <EmptyState
          title="Review Queue is Clear!"
          description="All reports have high confidence classifications. Check back when new dataset reports are imported."
          actionLabel="Explore All Reports"
          onAction={() => onNavigate('explorer')}
        />
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Source</th>
                <th>Site / Facility</th>
                <th>Narrative Preview</th>
                <th>Current Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((r) => (
                <tr key={r.id} onClick={() => handleOpenReview(r)}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                    #{r.source_record_id}
                  </td>
                  <td><span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }}>{r.source_dataset}</span></td>
                  <td style={{ fontWeight: 600 }}>{r.site || r.employer || 'Unspecified'}</td>
                  <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)' }}>
                    {r.report_text}
                  </td>
                  <td>
                    <SIFBadge status={r.sif_potential} score={r.sif_confidence} showScore />
                  </td>
                  <td>
                    <button onClick={(e) => { e.stopPropagation(); handleOpenReview(r); }} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      <UserCheck size={14} /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Feedback Form Modal */}
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
              onClick={(e) => e.stopPropagation()}
              style={{ padding: '32px', maxWidth: '700px' }}
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                    Report #{selectedReport.source_record_id}
                  </span>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                    Submit Expert HSE Review
                  </h3>
                </div>
                <button onClick={() => setSelectedReport(null)} className="btn btn-secondary" style={{ padding: '6px' }}>
                  <X size={20} />
                </button>
              </div>

              {successMsg && (
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)', color: 'var(--accent-nonsif-green)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} /> {successMsg}
                </div>
              )}

              <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>Incident Narrative:</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>"{selectedReport.report_text}"</p>
              </div>

              <form onSubmit={handleSubmitFeedback}>
                <div style={{ marginBottom: '16px' }}>
                  <label className="micro-label" style={{ display: 'block', marginBottom: '8px' }}>
                    Select Validated SIF Label
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setReviewLabel('SIF_POTENTIAL')}
                      className={`btn ${reviewLabel === 'SIF_POTENTIAL' ? 'btn-danger' : 'btn-secondary'}`}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      <AlertTriangle size={16} /> SIF
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewLabel('NON_SIF')}
                      className={`btn ${reviewLabel === 'NON_SIF' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, justifyContent: 'center', background: reviewLabel === 'NON_SIF' ? 'var(--accent-nonsif-green)' : undefined }}
                    >
                      NON SIF
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
                    Review Confidence Level: ({(confidence * 100).toFixed(0)}%)
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
                    Reviewer Name / Title:
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
                    Expert HSE Rationale / Comments:
                  </label>
                  <textarea
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Explain why this incident presents SIF precursor risk..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'var(--font-main)' }}
                  />
                </div>

                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  <Send size={16} /> {submitting ? 'Saving Review Feedback...' : 'Submit Expert Review Feedback'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastNotification toasts={toasts} onDismiss={handleDismissToast} />
    </motion.div>
  );
};

