import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { extractDocumentOCR } from '../api/ocr';
import type { OCRExtractResponse } from '../api/ocr';
import { importReports, listReports, analyzeReport, getReport } from '../api/reports';
import type { SafetyReportRead, AnalysisResponse } from '../types/api';
import { SIFBadge } from '../components/common/SIFBadge';
import { EvidenceHighlighter } from '../components/common/EvidenceHighlighter';
import { SafetyFingerprint } from '../components/fingerprint/SafetyFingerprint';
import { AIExplanationPanel } from '../components/common/AIExplanationPanel';
import { ErrorBanner } from '../components/common/ErrorBanner';
import {
  UploadCloud,
  Play,
  RefreshCw,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Edit3,
  Camera,
  Database,
  Layers,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import { CameraCaptureModal } from '../components/common/CameraCaptureModal';
import type { TabId } from '../components/layout/Navigation';

interface Props {
  onNavigate: (tab: TabId) => void;
}

export type ReportInputSource = 'manual_narrative' | 'pdf' | 'image' | 'camera' | 'structured';

export const IngestionPage: React.FC<Props> = ({ onNavigate }) => {
  const [source, setSource] = useState<ReportInputSource>('pdf');
  const [pastedText, setPastedText] = useState<string>('');
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);

  // OCR Workflow Steps: 1: Capture, 2: Processing, 3: Verify, 4: Analyzed
  const [step, setStep] = useState<number>(1);
  const [ocrResult, setOcrResult] = useState<OCRExtractResponse | null>(null);
  const [_selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editableText, setEditableText] = useState<string>('');
  const [rawOcrText, setRawOcrText] = useState<string>('');
  const [showRawOcrToggle, setShowRawOcrToggle] = useState<boolean>(false);

  // Analysis state
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisStage, setAnalysisStage] = useState<string>('Analyzing safety report...');
  const [analyzedReport, setAnalyzedReport] = useState<SafetyReportRead | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);

  const isOcrSource = source === 'pdf' || source === 'image' || source === 'camera';

  useEffect(() => {
    const video = cameraVideoRef.current;
    if (!cameraStream || !video) return;

    video.srcObject = cameraStream;
    void video.play().catch(() => undefined);

    return () => {
      cameraStream.getTracks().forEach((track) => track.stop());
    };
  }, [cameraStream]);

  // Handle document/image file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setError(null);
      
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.pdf')) {
        setSource('pdf');
        processOCR(file);
      } else if (fileType.includes('image') || fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
        setSource('image');
        processOCR(file);
      } else if (fileName.endsWith('.csv') || fileName.endsWith('.json')) {
        setSource('structured');
        processStructuredFile(file);
      } else {
        setSource('pdf');
        processOCR(file);
      }
    }
  };

  const processOCR = async (file: File) => {
    setStep(2);
    setError(null);

    try {
      const res = await extractDocumentOCR(file);
      setOcrResult(res);
      const textToUse = res.text || res.extracted_text || '';
      setEditableText(textToUse);
      setRawOcrText(textToUse);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'OCR document processing failed');
      setStep(1);
    }
  };

  const processStructuredFile = async (file: File) => {
    setStep(2);
    setError(null);
    try {
      const text = await file.text();
      setEditableText(text);
      setRawOcrText(text);
      setOcrResult(null); // No OCR ran for structured text
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to read structured file');
      setStep(1);
    }
  };

  // Handle Manual Human Narrative Paste (OCR MUST BE SKIPPED)
  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    setSource('manual_narrative');
    setEditableText(pastedText.trim());
    setRawOcrText(pastedText.trim());
    setOcrResult(null); // Explicitly NO OCR result, NO fake confidence
    setAnalyzedReport(null);
    setAnalysisData(null);
    setStep(3); // Directly advance to 03 Verify & Review (skipping 02 OCR)
  };

  // Request the device camera only in response to the user's button click.
  const requestCameraAccess = async () => {
    setError(null);
    setSource('camera');

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser does not support direct camera access. Please choose an image file instead.');
      cameraInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      setCameraStream(stream);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      setError(
        name === 'NotAllowedError'
          ? 'Camera access was denied. Allow camera access in your browser settings, then try again.'
          : 'Unable to access a camera on this device. Please check that it is connected and not being used by another app.',
      );
      setSource('pdf');
    }
  };

  const cancelCameraCapture = () => {
    setCameraStream(null);
    setSource('pdf');
  };

  const captureCameraFrame = () => {
    const video = cameraVideoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError('The camera is still starting. Please wait a moment and try again.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setError('Unable to capture an image from the camera.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Unable to create a camera image. Please try again.');
        return;
      }
      const file = new File([blob], `safety-report-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setCameraStream(null);
      setSelectedFile(file);
      setAnalyzedReport(null);
      setAnalysisData(null);
      void processOCR(file);
    }, 'image/jpeg', 0.92);
  };

  // Fallback for browsers that provide their own native camera picker.
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setSource('camera');
      setAnalyzedReport(null);
      setAnalysisData(null);
      processOCR(file);
    }
  };

  // Run Automated Pipeline Analysis
  const handleRunAnalysis = async () => {
    if (!editableText.trim()) return;
    setAnalyzing(true);
    setAnalysisStage('Analyzing safety report...');
    setError(null);
    setAnalyzedReport(null);
    setAnalysisData(null);

    try {
      // 1. Text Processing
      setAnalysisStage('01 Processing text & domain terminology...');
      await new Promise((r) => setTimeout(r, 200));

      // 2. Submit report to backend
      setAnalysisStage('02 Extracting 10-dimension safety signals...');
      const blob = new Blob([editableText], { type: 'text/plain' });
      const file = new File([blob], source === 'manual_narrative' ? 'manual_narrative.txt' : 'ingested_report.txt', { type: 'text/plain' });
      
      const importRes = await importReports(file, 'oil_hsse');

      setAnalysisStage('03 Executing XGBoost SIF classifier (v1.0.0)...');
      await new Promise((r) => setTimeout(r, 200));

      setAnalysisStage('04 Mapping IOGP 9 Life-Saving Rules & Fingerprint...');
      
      // Fetch the exact newly created report record using returned first_imported_id
      let targetReportId = importRes.first_imported_id || null;
      if (!targetReportId) {
        const recentReports = await listReports(0, 1);
        targetReportId = recentReports.length > 0 ? recentReports[0].id : null;
      }

      if (targetReportId) {
        const targetReport = await getReport(targetReportId);
        setAnalyzedReport(targetReport);
        try {
          const fullAnalysis = await analyzeReport(targetReportId);
          setAnalysisData(fullAnalysis);
        } catch {
          // Fallback if analysis object already saved
        }
      }

      setAnalysisStage('05 Analysis complete.');
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report for analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setCameraStream(null);
    setStep(1);
    setOcrResult(null);
    setSelectedFile(null);
    setPastedText('');
    setEditableText('');
    setRawOcrText('');
    setAnalyzedReport(null);
    setAnalysisData(null);
    setError(null);
  };

  // Helper for source badge label
  const getSourceBadge = () => {
    switch (source) {
      case 'manual_narrative':
        return { label: 'MANUAL NARRATIVE', bg: 'rgba(242, 169, 51, 0.15)', color: '#F2A933' };
      case 'pdf':
        return { label: 'OCR · PDF DOCUMENT', bg: 'rgba(77, 206, 160, 0.15)', color: '#4DCEA0' };
      case 'image':
        return { label: 'OCR · FIELD IMAGE', bg: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8' };
      case 'camera':
        return { label: 'CAMERA CAPTURE', bg: 'rgba(168, 85, 247, 0.15)', color: '#A855F7' };
      case 'structured':
        return { label: 'STRUCTURED REPORT', bg: 'rgba(232, 170, 61, 0.15)', color: '#E8AA3D' };
    }
  };

  const badge = getSourceBadge();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-serif, Fraunces, serif)',
              fontSize: '1.75rem',
              fontWeight: 600,
              color: 'var(--text-primary, #F4F3EE)',
              margin: '0 0 4px 0',
            }}
          >
            Capture Safety Report & Intelligence Pipeline
          </h1>
          <p style={{ color: 'var(--text-secondary, #9CA8AA)', fontSize: '0.85rem', margin: 0 }}>
            Ingest manual narratives, PDF documents, field images, camera captures, or structured records for automated SIF potential analysis.
          </p>
        </div>

        {step === 4 && (
          <button
            onClick={handleReset}
            className="btn btn-secondary"
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RotateCcw size={15} /> Capture Another Report
          </button>
        )}
      </div>

      {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

      {/* 4-Step Pipeline Indicator */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          backgroundColor: 'var(--surface, #FFFFFF)',
          border: '1px solid var(--border, #CBD5E1)',
          borderRadius: '8px',
          padding: '16px',
        }}
      >
        {/* Step 01 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '6px',
            backgroundColor: step === 1
              ? 'rgba(217, 119, 6, 0.12)'
              : step > 1
              ? 'rgba(15, 138, 106, 0.10)'
              : '#F8FAFC',
            border: `1px solid ${step === 1 ? '#D97706' : step > 1 ? '#0F8A6A' : '#CBD5E1'}`,
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: step === 1 ? '#D97706' : step > 1 ? '#0F8A6A' : '#64748B' }}>
            01
          </span>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 650, color: '#0F2742' }}>01 Capture</div>
            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
              {step > 1 ? '✓ Complete' : 'PDF / Narrative / Camera'}
            </div>
          </div>
        </div>

        {/* Step 02: OCR Dynamic State */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '6px',
            backgroundColor: !isOcrSource
              ? 'rgba(100, 116, 119, 0.08)' // Muted skipped state for manual narrative
              : step === 2
              ? 'rgba(217, 119, 6, 0.12)'
              : step > 2
              ? 'rgba(15, 138, 106, 0.10)'
              : '#F8FAFC',
            border: `1px solid ${
              !isOcrSource
                ? 'rgba(100, 116, 119, 0.25)'
                : step === 2
                ? '#D97706'
                : step > 2
                ? '#0F8A6A'
                : '#CBD5E1'
            }`,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: !isOcrSource ? '#64748B' : step === 2 ? '#D97706' : step > 2 ? '#0F8A6A' : '#64748B',
            }}
          >
            02
          </span>
          <div>
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: !isOcrSource ? '#475569' : '#0F2742',
              }}
            >
              02 OCR
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: !isOcrSource ? '#64748B' : step > 2 ? '#0F8A6A' : '#64748B',
                fontStyle: !isOcrSource ? 'italic' : 'normal',
              }}
            >
              {!isOcrSource
                ? '— Skipped (Direct text)'
                : step === 2
                ? '→ Processing...'
                : step > 2
                ? '✓ OCR Complete'
                : 'Pending'}
            </div>
          </div>
        </div>

        {/* Step 03 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '6px',
            backgroundColor: step === 3
              ? 'rgba(217, 119, 6, 0.12)'
              : step > 3
              ? 'rgba(15, 138, 106, 0.10)'
              : '#F8FAFC',
            border: `1px solid ${step === 3 ? '#D97706' : step > 3 ? '#0F8A6A' : '#CBD5E1'}`,
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: step === 3 ? '#D97706' : step > 3 ? '#0F8A6A' : '#64748B' }}>
            03
          </span>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 650, color: '#0F2742' }}>03 Verify & Review</div>
            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
              {step === 3 ? '→ Current' : step > 3 ? '✓ Complete' : 'Pending'}
            </div>
          </div>
        </div>

        {/* Step 04 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '6px',
            backgroundColor: step === 4
              ? 'rgba(15, 138, 106, 0.12)'
              : '#F8FAFC',
            border: `1px solid ${step === 4 ? '#0F8A6A' : '#CBD5E1'}`,
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: step === 4 ? '#0F8A6A' : '#64748B' }}>
            04
          </span>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 650, color: '#0F2742' }}>04 Safety Intelligence</div>
            <div style={{ fontSize: '0.72rem', color: step === 4 ? '#0F8A6A' : '#64748B' }}>
              {step === 4 ? '✓ Complete' : 'Pending'}
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Ingestion Source Selector & Input Form */}
      {step === 1 && (
        <div
          style={{
            backgroundColor: 'var(--surface, #FFFFFF)',
            border: '1px solid var(--border, #CBD5E1)',
            borderRadius: '8px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Source Selection Toolbar */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
            <button
              onClick={() => setSource('pdf')}
              style={{
                padding: '10px 18px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: source === 'pdf' || source === 'image' ? '#D97706' : '#CBD5E1',
                backgroundColor: source === 'pdf' || source === 'image' ? '#FFF7ED' : '#FFFFFF',
                color: source === 'pdf' || source === 'image' ? '#B45309' : '#475569',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <UploadCloud size={16} /> Upload Document (PDF / Image)
            </button>

            <button
              onClick={() => setSource('manual_narrative')}
              style={{
                padding: '10px 18px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: source === 'manual_narrative' ? '#D97706' : '#CBD5E1',
                backgroundColor: source === 'manual_narrative' ? '#FFF7ED' : '#FFFFFF',
                color: source === 'manual_narrative' ? '#B45309' : '#475569',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <FileText size={16} /> Paste Narrative
            </button>

            <button
              onClick={requestCameraAccess}
              style={{
                padding: '10px 18px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: source === 'camera' ? '#D97706' : '#CBD5E1',
                backgroundColor: source === 'camera' ? '#FFF7ED' : '#FFFFFF',
                color: source === 'camera' ? '#B45309' : '#475569',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Camera size={16} /> Live Camera Capture
            </button>

            <button
              onClick={() => setSource('structured')}
              style={{
                padding: '10px 18px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: source === 'structured' ? '#D97706' : '#CBD5E1',
                backgroundColor: source === 'structured' ? '#FFF7ED' : '#FFFFFF',
                color: source === 'structured' ? '#B45309' : '#475569',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Database size={16} /> Structured Report (CSV / JSON)
            </button>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            style={{ display: 'none' }}
          />

          {source === 'camera' && cameraStream && (
            <div
              style={{
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                overflow: 'hidden',
                backgroundColor: '#0F2742',
              }}
            >
              <video
                ref={cameraVideoRef}
                autoPlay
                muted
                playsInline
                style={{ display: 'block', width: '100%', maxHeight: '440px', objectFit: 'contain' }}
              />
              <div
                style={{
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                }}
              >
                <span style={{ color: '#475569', fontSize: '0.82rem' }}>Camera is on. Frame the report, then capture it for OCR.</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={cancelCameraCapture} className="btn btn-secondary">Cancel</button>
                  <button type="button" onClick={captureCameraFrame} className="btn btn-primary">
                    <Camera size={16} /> Capture photo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mode 1: Document / Image File Dropzone */}
          {(source === 'pdf' || source === 'image' || source === 'structured') && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) {
                  const file = e.dataTransfer.files[0];
                  if (file.name.endsWith('.csv') || file.name.endsWith('.json')) {
                    setSource('structured');
                    processStructuredFile(file);
                  } else {
                    processOCR(file);
                  }
                }
              }}
              style={{
                border: `2px dashed ${isDragging ? '#D97706' : '#94A3B8'}`,
                borderRadius: '8px',
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragging ? '#FFF7ED' : '#F8FAFC',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.csv,.json,.txt"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <UploadCloud size={48} color="#D97706" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontFamily: 'var(--font-serif)', color: '#0F2742', margin: '0 0 6px 0' }}>
                Drag and drop report document or click to browse
              </h3>
              <p style={{ color: '#64748B', fontSize: '0.82rem', margin: 0 }}>
                Supports PDF reports, scanned forms, site photo logs (PNG/JPG), and structured CSV/JSON logs.
              </p>
            </div>
          )}

          {/* Mode 2: Manual Narrative Text Area */}
          {source === 'manual_narrative' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F2742' }}>
                  Enter Human Safety Observation Narrative:
                </label>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontStyle: 'italic' }}>
                  OCR will be skipped automatically for direct text entry
                </span>
              </div>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste or type original HSE field observation narrative..."
                rows={8}
                style={{
                  width: '100%',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  padding: '14px',
                  color: '#0F2742',
                  fontSize: '0.9rem',
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: 1.5,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handlePasteSubmit}
                  disabled={!pastedText.trim()}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '6px',
                    backgroundColor: '#D97706',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    cursor: pastedText.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>Proceed to Verification</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: OCR Processing Spinner (Only for OCR sources) */}
      {step === 2 && (
        <div
          style={{
            backgroundColor: 'var(--bg-card, #0D171A)',
            border: '1px solid var(--border, #203238)',
            borderRadius: '8px',
            padding: '60px 28px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <RefreshCw size={36} color="#F2A933" style={{ animation: 'spin 1.2s linear infinite' }} />
          <h3 style={{ fontFamily: 'var(--font-serif)', color: '#F4F3EE', margin: 0 }}>
            {source === 'structured' ? 'Parsing Structured Data...' : 'OCR Processing & Text Extraction...'}
          </h3>
          <p style={{ color: '#9CA8AA', fontSize: '0.85rem', margin: 0, maxWidth: '420px' }}>
            {source === 'structured'
              ? 'Reading columns and normalizing field attributes.'
              : 'Executing Tesseract OCR engine / PDF text stream parser and evaluating confidence score.'}
          </p>
        </div>
      )}

      {/* Step 3: Verification & Editing */}
      {step === 3 && (
        <div
          style={{
            backgroundColor: 'var(--bg-card, #0D171A)',
            border: '1px solid var(--border, #203238)',
            borderRadius: '8px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Edit3 size={18} color="#F2A933" />
              <h3 style={{ fontFamily: 'var(--font-serif)', color: '#F4F3EE', margin: 0 }}>
                Verify Extracted Text Narrative
              </h3>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  background: badge.bg,
                  color: badge.color,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {badge.label}
              </span>
            </div>

            {/* OCR Confidence Badge (ONLY displayed if OCR actually ran) */}
            {isOcrSource && ocrResult && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    color: ocrResult.confidence >= 0.85 ? '#4DCEA0' : '#E8AA3D',
                    backgroundColor: ocrResult.confidence >= 0.85 ? 'rgba(77, 206, 160, 0.12)' : 'rgba(232, 170, 61, 0.12)',
                    border: `1px solid ${ocrResult.confidence >= 0.85 ? '#4DCEA0' : '#E8AA3D'}`,
                    padding: '4px 10px',
                    borderRadius: '4px',
                  }}
                >
                  OCR Confidence: {Math.round(ocrResult.confidence * 100)}% ({ocrResult.ocr_provider || ocrResult.engine_used || 'tesseract'})
                </span>
              </div>
            )}

            {/* Manual Narrative Badge (NO fake OCR confidence) */}
            {!isOcrSource && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: '#9CA8AA',
                  backgroundColor: 'rgba(100, 116, 119, 0.12)',
                  border: '1px solid #203238',
                  padding: '4px 10px',
                  borderRadius: '4px',
                }}
              >
                OCR Skipped — Direct Human Text
              </span>
            )}
          </div>

          {/* OCR Warning Banner */}
          {isOcrSource && (ocrResult?.requires_verification ?? ocrResult?.verification_required) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                backgroundColor: 'rgba(232, 170, 61, 0.12)',
                border: '1px solid rgba(232, 170, 61, 0.3)',
                borderRadius: '6px',
                color: '#E8AA3D',
                fontSize: '0.82rem',
              }}
            >
              <AlertTriangle size={18} />
              <span>
                Verification Required: OCR confidence is below threshold ({Math.round(ocrResult.confidence * 100)}%). Please review and correct text before analysis.
              </span>
            </div>
          )}

          <textarea
            value={editableText}
            onChange={(e) => setEditableText(e.target.value)}
            rows={10}
            style={{
              width: '100%',
              backgroundColor: '#091114',
              border: '1px solid #203238',
              borderRadius: '6px',
              padding: '14px',
              color: '#F4F3EE',
              fontSize: '0.9rem',
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1.5,
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setStep(1)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #203238',
                backgroundColor: 'transparent',
                color: '#9CA8AA',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Back to Capture
            </button>

            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              style={{
                padding: '10px 24px',
                borderRadius: '6px',
                backgroundColor: '#F2A933',
                color: '#080E10',
                border: 'none',
                fontWeight: 700,
                cursor: analyzing ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {analyzing ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
              <span>{analyzing ? analysisStage : 'Analyze Report Now'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Same-Page Intelligence Results Workspace */}
      {step === 4 && analyzedReport && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top Status Header */}
          <div
            style={{
              backgroundColor: 'var(--bg-card, #0D171A)',
              border: '1px solid var(--border, #203238)',
              borderRadius: '8px',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2 size={24} color="#4DCEA0" />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#F2A933', fontWeight: 700, fontSize: '0.95rem' }}>
                    #{analyzedReport.source_record_id}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: badge.bg,
                      color: badge.color,
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {badge.label}
                  </span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#F4F3EE', margin: '2px 0 0 0' }}>
                  Safety Intelligence Analysis
                </h2>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setStep(3)}
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Edit3 size={14} /> Edit Narrative
              </button>
              <button
                onClick={handleRunAnalysis}
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} /> Re-analyze
              </button>
              <button
                onClick={() => onNavigate('explorer')}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Explore Patterns <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Main 2-Column Responsive Workspace */}
          <div className="responsive-grid-sidebar workspace-grid">
            {/* Left Column: ORIGINAL REPORT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  backgroundColor: 'var(--bg-card, #0D171A)',
                  border: '1px solid var(--border, #203238)',
                  borderRadius: '8px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1rem',
                      color: '#F4F3EE',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <FileText size={16} color="#F2A933" /> ORIGINAL REPORT
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#9CA8AA', fontFamily: 'var(--font-mono)' }}>
                    Site: {analyzedReport.site || analyzedReport.employer || 'Not specified'}
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: '#091114',
                    border: '1px solid #203238',
                    borderRadius: '6px',
                    padding: '16px',
                    color: '#F4F3EE',
                    fontSize: '0.88rem',
                    lineHeight: 1.6,
                  }}
                >
                  <EvidenceHighlighter
                    text={editableText || analyzedReport.report_text}
                    energySource={analyzedReport.energy_source}
                    barrierFailure={analyzedReport.barrier_failure}
                    hazard={analyzedReport.hazard}
                  />
                </div>

                {isOcrSource && rawOcrText && (
                  <div>
                    <button
                      onClick={() => setShowRawOcrToggle(!showRawOcrToggle)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#F2A933',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        padding: 0,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {showRawOcrToggle ? 'Hide Raw OCR Output' : 'Compare Original Raw OCR Output'}
                    </button>
                    {showRawOcrToggle && (
                      <pre
                        style={{
                          marginTop: '8px',
                          padding: '10px',
                          backgroundColor: '#050B0D',
                          border: '1px solid #203238',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          color: '#829195',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {rawOcrText}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              {/* Provenance Metadata Card */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card, #0D171A)',
                  border: '1px solid var(--border, #203238)',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9CA8AA', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Ingestion Provenance Metadata
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: '#647477', display: 'block', fontSize: '0.72rem' }}>Data Origin</span>
                    <strong style={{ color: '#F4F3EE' }}>{source.toUpperCase()}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#647477', display: 'block', fontSize: '0.72rem' }}>OCR Status</span>
                    <strong style={{ color: isOcrSource ? '#4DCEA0' : '#829195' }}>
                      {isOcrSource ? 'Executed' : 'Skipped'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#647477', display: 'block', fontSize: '0.72rem' }}>Facility / Site</span>
                    <strong style={{ color: '#F4F3EE' }}>{analyzedReport.site || 'Not specified'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#647477', display: 'block', fontSize: '0.72rem' }}>Ingestion ID</span>
                    <strong style={{ color: '#F2A933', fontFamily: 'var(--font-mono)' }}>{analyzedReport.id}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: SAFETY INTELLIGENCE WORKSPACE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 1. Authoritative SIF Classification Banner */}
              {(() => {
                const sifStatus = analysisData?.sif?.classification || analyzedReport.sif_potential || 'UNCERTAIN';
                const rawScore = analysisData?.sif?.score ?? analyzedReport.sif_score ?? 0;
                const rawConf = analysisData?.sif?.confidence ?? analyzedReport.sif_confidence ?? rawScore;
                
                const confPct = rawConf > 1 ? rawConf : rawConf * 100;

                const isSif = sifStatus === 'SIF_POTENTIAL';
                const isNonSif = sifStatus === 'NON_SIF';

                return (
                  <div
                    style={{
                      padding: '20px',
                      borderRadius: '12px',
                      backgroundColor: isSif
                        ? 'rgba(232, 93, 93, 0.12)'
                        : isNonSif
                        ? 'rgba(32, 217, 151, 0.12)'
                        : 'rgba(255, 179, 71, 0.12)',
                      border: `1px solid ${
                        isSif
                          ? 'rgba(232, 93, 93, 0.35)'
                          : isNonSif
                          ? 'rgba(32, 217, 151, 0.35)'
                          : 'rgba(255, 179, 71, 0.35)'
                      }`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#9CA8AA', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        SIF Potential Classifier (XGBoost v1.0.0)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <SIFBadge
                          status={sifStatus}
                          score={rawScore}
                          showScore
                          size="lg"
                        />
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#9CA8AA', fontFamily: 'var(--font-mono)' }}>
                        Model Confidence Score
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F4F3EE', fontFamily: 'var(--font-mono)' }}>
                        {Math.round(confPct)}%
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 2. Failed Barrier Alert (If present) */}
              {analyzedReport.barrier_failure && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px',
                    backgroundColor: 'rgba(232, 93, 93, 0.12)',
                    border: '1px solid rgba(232, 93, 93, 0.3)',
                    borderRadius: '8px',
                    color: '#E85D5D',
                  }}
                >
                  <ShieldAlert size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px' }}>
                      FAILED BARRIER: {analyzedReport.barrier_failure}
                    </div>
                    <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>
                      Critical safety control defect identified in narrative. Immediate verifications required.
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Safety Fingerprint DAG */}
              <SafetyFingerprint
                fingerprint={{
                  activity: analyzedReport.activity,
                  hazard: analyzedReport.hazard,
                  exposure: analyzedReport.exposure,
                  barrier_failure: analyzedReport.barrier_failure || analyzedReport.barrier,
                  potential_consequence: analyzedReport.potential_consequence,
                  life_saving_rules: (analysisData?.life_saving_rules || analyzedReport.life_saving_rules || []).map(r => r.rule_name),
                }}
                height={320}
              />

              {/* 4. AI Explanation & Extracted Signals Panel */}
              <AIExplanationPanel
                sifResult={analysisData?.sif}
                sifStatus={analyzedReport.sif_potential}
                sifScore={analyzedReport.sif_score || analyzedReport.sif_confidence}
                actualSeverity={analyzedReport.actual_severity}
                extracted={
                  analysisData?.extraction || {
                    activity: analyzedReport.activity || null,
                    hazard: analyzedReport.hazard || null,
                    barrier_failure: analyzedReport.barrier_failure || null,
                    energy_source: analyzedReport.energy_source || null,
                  }
                }
                lsrMatches={analysisData?.life_saving_rules || analyzedReport.life_saving_rules || []}
              />

              {/* 5. Similar Reports (BGE Cosine Similarity) */}
              {analysisData?.similar_reports && analysisData.similar_reports.length > 0 && (
                <div style={{ backgroundColor: 'var(--bg-card, #0D171A)', border: '1px solid var(--border, #203238)', borderRadius: '8px', padding: '18px' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#F4F3EE', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                    <Layers size={15} color="#F2A933" /> BGE Semantic Match Signals
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {analysisData.similar_reports.map((sim, idx) => (
                      <div key={idx} style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#091114', border: '1px solid #203238', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#F2A933' }}>
                            #{sim.source_record_id}
                          </span>
                          <span style={{ color: '#4DCEA0', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                            {Math.round(sim.similarity * 100)}% Similarity
                          </span>
                        </div>
                        <p style={{ margin: 0, color: '#9CA8AA', lineHeight: 1.4 }}>{sim.report_text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(file) => {
          setSelectedFile(file);
          setSource('camera');
          processOCR(file);
        }}
        onFallbackFileUpload={() => {
          cameraInputRef.current?.click();
        }}
      />
    </motion.div>
  );
};
