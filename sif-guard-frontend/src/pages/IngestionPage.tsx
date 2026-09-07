import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { importReports, analyzeBatch, getJobStatus } from '../api/reports';
import type { ImportSummary, JobStatus } from '../types/api';
import { ErrorBanner } from '../components/common/ErrorBanner';
import {
  UploadCloud,
  FileCheck2,
  Play,
  RefreshCw,
  Layers,
  Database,
  CheckCircle2,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';
import type { TabId } from '../components/layout/Navigation';

interface Props {
  onNavigate: (tab: TabId) => void;
}

const SAMPLE_OSHA_CSV = `ID,Final Narrative,Employer,City,State,NatureTitle,Part of Body Title,EventTitle
sample_osha_101,"An employee was performing heavy rigging operation on drilling rig floor when the hoisting sling snapped under high pressure tension. Worker narrowly avoided fall from elevated platform.",Oil Field Services,Duliajan,Assam,Laceration,Arm,Equipment Failure
sample_osha_102,"Worker entered unventilated confined space vessel without gas check or breathing apparatus. Lost consciousness due to toxic hydrogen sulfide gas accumulation.",Assam Drilling Operations,Digboi,Assam,Asphyxiation,Systemic,Gas Exposure
sample_osha_103,"Technician was servicing 440V electrical panel while live without lockout tagout. Sustained severe electric arc flash shock.",OIL Substation 4,Moran,Assam,Burn,Hand,Electrical Arc
`;

const SAMPLE_OIL_CSV = `id,description,site,type,activity,hazard
sample_oil_201,"Unsafe condition observed: Scaffolding at Rig 5 has missing top handrail and toe-board at 12m height above mud pump unit. High risk of worker fall or object drop.",Rig No. 5 - Makum,observation,Working at Height,Missing Guardrail
sample_oil_202,"High pressure gas line flange seal was weeping gas near gas compressor station. Hot work permit had been issued in adjacent area without gas test.",OCS-2 Jorajan,near_miss,Hot Work,Gas Leak
sample_oil_203,"Contract worker bypassed crane load cell safety interlock while lifting heavy blowout preventer (BOP) stack exceeding rated SWL capacity.",Rig No. 12 - Chabua,unsafe_act,Lifting Operations,Overloading
`;

export const IngestionPage: React.FC<Props> = ({ onNavigate }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceDataset, setSourceDataset] = useState<string>('osha_severe');
  const [uploading, setUploading] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Batch Job State
  const [batchJobId, setBatchJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [triggeringBatch, setTriggeringBatch] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setImportResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setError(null);
      setImportResult(null);
    }
  };

  const loadSampleDataset = (type: 'osha' | 'oil') => {
    let fileContent = '';
    let fileName = '';
    let source = '';

    if (type === 'osha') {
      fileContent = SAMPLE_OSHA_CSV;
      fileName = 'osha_severe_injuries_sample.csv';
      source = 'osha_severe';
    } else {
      fileContent = SAMPLE_OIL_CSV;
      fileName = 'oil_hsse_confidential_sample.csv';
      source = 'oil_hsse';
    }

    const blob = new Blob([fileContent], { type: 'text/csv' });
    const file = new File([blob], fileName, { type: 'text/csv' });
    setSelectedFile(file);
    setSourceDataset(source);
    setError(null);
    setImportResult(null);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        setError('Please select a file (CSV, XLSX, JSON, or JSONL) to upload.');
      }
      return;
    }

    setUploading(true);
    setError(null);

    importReports(selectedFile, sourceDataset)
      .then((res) => {
        setImportResult(res);
        setUploading(false);
      })
      .catch((err) => {
        setError(err.message || 'Data import failed');
        setUploading(false);
      });
  };

  const handleTriggerBatch = () => {
    setTriggeringBatch(true);
    analyzeBatch()
      .then((res) => {
        setBatchJobId(res.job_id);
        setTriggeringBatch(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to trigger batch processing');
        setTriggeringBatch(false);
      });
  };

  // Poll Job Status if active job ID exists
  useEffect(() => {
    if (!batchJobId) return;

    const interval = setInterval(() => {
      getJobStatus(batchJobId)
        .then((status) => {
          setJobStatus(status);
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(interval);
          }
        })
        .catch(() => {
          clearInterval(interval);
        });
    }, 2000);

    return () => clearInterval(interval);
  }, [batchJobId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Data Ingestion & Import Center
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Import OSHA Severe Injury, OSHA Construction, or Oil India Limited (OIL) confidential safety datasets
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* Upload Form */}
        <motion.div className="glass-card" style={{ padding: '28px' }} whileHover={{ y: -2 }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UploadCloud size={20} color="var(--accent-cyan)" /> Import Dataset File
          </h3>

          <form onSubmit={handleImportSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label className="micro-label" style={{ display: 'block', marginBottom: '8px' }}>
                Select Source Dataset Type
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="source"
                    value="osha_severe"
                    checked={sourceDataset === 'osha_severe'}
                    onChange={(e) => setSourceDataset(e.target.value)}
                  />
                  <span><strong>OSHA Severe Injury Dataset</strong> (Dataset 1: Final Narrative & Outcomes)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="source"
                    value="osha_construction"
                    checked={sourceDataset === 'osha_construction'}
                    onChange={(e) => setSourceDataset(e.target.value)}
                  />
                  <span><strong>OSHA Construction Dataset</strong> (Dataset 2: Mechanism & Factors)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="source"
                    value="oil_hsse"
                    checked={sourceDataset === 'oil_hsse'}
                    onChange={(e) => setSourceDataset(e.target.value)}
                  />
                  <span><strong>OIL HSSE Confidential Data</strong> (UA / UC / Near Miss / Incidents)</span>
                </label>
              </div>
            </div>

            {/* Drag & Drop Zone */}
            <div style={{ marginBottom: '20px' }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border: isDragging ? '2px dashed var(--accent-cyan)' : '2px dashed var(--border-color)',
                  borderRadius: '12px',
                  padding: '28px 16px',
                  textAlign: 'center',
                  background: isDragging ? 'var(--accent-primary-bg)' : 'var(--bg-badge)',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.json,.jsonl"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  id="file-upload-input"
                />
                <FileCheck2 size={36} color="var(--accent-cyan)" style={{ margin: '0 auto 10px auto' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedFile ? selectedFile.name : 'Click or Drag & Drop CSV, XLSX, JSON file here'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB selected` : 'Supports .csv, .xlsx, .json, .jsonl up to 100 MB'}
                </div>
              </div>
            </div>

            {/* Quick Sample Dataset Selection */}
            <div style={{ marginBottom: '20px', padding: '12px', borderRadius: '8px', background: 'var(--bg-badge)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={13} color="var(--accent-cyan)" /> Quick Demo: Load Sample Datasets
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => loadSampleDataset('osha')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '6px 12px', flex: 1, justifyContent: 'center' }}
                >
                  <FileSpreadsheet size={13} /> Load OSHA Sample
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleDataset('oil')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '6px 12px', flex: 1, justifyContent: 'center' }}
                >
                  <FileSpreadsheet size={13} /> Load OIL HSSE Sample
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {uploading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Ingesting & Normalizing Dataset...
                </>
              ) : (
                <>
                  <UploadCloud size={16} /> {selectedFile ? `Import ${selectedFile.name}` : 'Select & Import File'}
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Import Summary Results */}
        <motion.div className="glass-card" style={{ padding: '28px' }} whileHover={{ y: -2 }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={20} color="var(--accent-nonsif-green)" /> Ingestion Results
          </h3>

          {!importResult ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.9rem' }}>No active import session performed yet.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '6px' }}>Select a file on the left or load a sample dataset to start ingestion.</p>
            </div>
          ) : (
            <div>
              <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'var(--accent-nonsif-bg)', border: '1px solid var(--accent-nonsif-green)', color: 'var(--accent-nonsif-green)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <CheckCircle2 size={18} /> Ingestion Successful!
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <span className="micro-label">Records Received</span>
                  <div className="numeric-display" style={{ fontSize: '1.4rem' }}>{importResult.records_received}</div>
                </div>

                <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--accent-primary-bg)', border: '1px solid var(--border-hover)' }}>
                  <span className="micro-label" style={{ color: 'var(--accent-cyan)' }}>Imported & Stored</span>
                  <div className="numeric-display" style={{ fontSize: '1.4rem', color: 'var(--accent-cyan)' }}>{importResult.records_imported}</div>
                </div>

                <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--accent-uncertain-bg)', border: '1px solid var(--accent-uncertain-amber)' }}>
                  <span className="micro-label" style={{ color: 'var(--accent-uncertain-amber)' }}>Duplicates Skipped</span>
                  <div className="numeric-display" style={{ fontSize: '1.4rem', color: 'var(--accent-uncertain-amber)' }}>{importResult.duplicates}</div>
                </div>

                <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--accent-sif-bg)', border: '1px solid var(--accent-sif-red)' }}>
                  <span className="micro-label" style={{ color: 'var(--accent-sif-red)' }}>Invalid Records</span>
                  <div className="numeric-display" style={{ fontSize: '1.4rem', color: 'var(--accent-sif-red)' }}>{importResult.invalid}</div>
                </div>
              </div>

              <button onClick={() => onNavigate('explorer')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                Explore Imported Reports
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Batch Processing Queue Trigger Card */}
      <motion.div className="glass-card" style={{ padding: '24px' }} whileHover={{ y: -2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} color="var(--accent-cyan)" /> Asynchronous Batch Analysis Queue
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Queue background execution to run NLP extraction, SIF scoring, LSR mapping, and precursor fingerprints over all unanalyzed reports.
            </p>
          </div>
          <button onClick={handleTriggerBatch} disabled={triggeringBatch} className="btn btn-primary">
            {triggeringBatch ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
            Trigger Batch Processing
          </button>
        </div>

        {/* Batch Job Status Monitor */}
        {jobStatus && (
          <div style={{ marginTop: '20px', padding: '16px', borderRadius: '10px', background: 'var(--accent-primary-bg)', border: '1px solid var(--border-hover)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                Job Status: {jobStatus.status.toUpperCase()}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Job ID: {jobStatus.job_id}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem' }}>
              <span>Total Queued: <strong>{jobStatus.total}</strong></span>
              <span>Processed: <strong>{jobStatus.processed}</strong></span>
              <span>Failed: <strong>{jobStatus.failed}</strong></span>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};


