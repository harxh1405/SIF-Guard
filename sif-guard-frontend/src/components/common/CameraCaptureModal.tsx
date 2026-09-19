import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RefreshCw, X, Check, SwitchCamera, AlertCircle, Upload } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  onFallbackFileUpload?: () => void;
}

export const CameraCaptureModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCapture,
  onFallbackFileUpload,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);

  // Enumerate video devices
  useEffect(() => {
    if (isOpen && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((deviceInfos) => {
        const videoInputs = deviceInfos.filter((d) => d.kind === 'videoinput');
        setDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  // Start webcam stream
  const startCamera = async () => {
    setError(null);
    setQualityWarning(null);
    setCapturedDataUrl(null);
    setCapturedFile(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Webcam access is not supported by your browser.');
      return;
    }

    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera stream failed:', err);
      setError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission was denied. Please grant camera access in browser settings or use file upload.'
          : 'Could not connect to camera device. Please ensure camera is not in use by another application.'
      );
    }
  };

  // Stop camera stream on unmount/close
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, selectedDeviceId]);

  const handleTakeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);

      // Client-side quick lighting & contrast screening
      try {
        const sampleW = Math.min(width, 320);
        const sampleH = Math.min(height, 240);
        const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
        const data = imgData.data;
        let totalBrightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          totalBrightness += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        }
        const avgBrightness = totalBrightness / (data.length / 4);

        if (avgBrightness < 30) {
          setQualityWarning('Low Lighting Warning: Image appears dark. Better illumination recommended.');
        } else if (avgBrightness > 245) {
          setQualityWarning('Glare Warning: Direct glare detected. Adjust camera angle for clearer OCR.');
        } else {
          setQualityWarning(null);
        }
      } catch {
        setQualityWarning(null);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedDataUrl(dataUrl);

      // Convert Data URL to File object
      canvas.toBlob((blob) => {
        if (blob) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const file = new File([blob], `camera_capture_${timestamp}.jpg`, { type: 'image/jpeg' });
          setCapturedFile(file);
        }
      }, 'image/jpeg', 0.92);
    }
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
    setCapturedFile(null);
    setQualityWarning(null);
    if (videoRef.current && stream) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleConfirmCapture = () => {
    if (capturedFile) {
      stopCamera();
      onCapture(capturedFile);
      onClose();
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    setSelectedDeviceId('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          backgroundColor: 'rgba(5, 10, 12, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          style={{
            width: '100%',
            maxWidth: '680px',
            backgroundColor: '#0D171A',
            border: '1px solid #203238',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #203238',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#091114',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid #A855F7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Camera size={18} color="#A855F7" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#F4F3EE' }}>
                  Field Camera Capture
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#9CA8AA' }}>
                  Capture live incident scene or document photo for OCR extraction
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#9CA8AA',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Viewfinder Body */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '380px',
              backgroundColor: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {error ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#F4F3EE', maxWidth: '440px' }}>
                <AlertCircle size={42} color="#F87171" style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '0.9rem', color: '#FCA5A5', marginBottom: '16px' }}>{error}</p>
                {onFallbackFileUpload && (
                  <button
                    onClick={() => {
                      stopCamera();
                      onClose();
                      onFallbackFileUpload();
                    }}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '6px',
                      backgroundColor: '#F2A933',
                      color: '#080E10',
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Upload size={16} /> Select Photo From File
                  </button>
                )}
              </div>
            ) : capturedDataUrl ? (
              /* Captured Image Preview */
              <img
                src={capturedDataUrl}
                alt="Captured Snapshot"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              /* Live Video Stream */
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                  }}
                />

                {/* Industrial Framing Target Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: '24px',
                    border: '2px dashed rgba(77, 206, 160, 0.4)',
                    borderRadius: '8px',
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px' }}>
                    <div style={{ borderLeft: '3px solid #4DCEA0', borderTop: '3px solid #4DCEA0', width: '22px', height: '22px' }} />
                    <div style={{ borderRight: '3px solid #4DCEA0', borderTop: '3px solid #4DCEA0', width: '22px', height: '22px' }} />
                  </div>

                  {/* Visual framing instructions */}
                  <div style={{ textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: '6px 14px', borderRadius: '20px', alignSelf: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#4DCEA0', fontWeight: 600 }}>
                      Align report within frame • Ensure bright lighting & clear text
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px' }}>
                    <div style={{ borderLeft: '3px solid #4DCEA0', borderBottom: '3px solid #4DCEA0', width: '22px', height: '22px' }} />
                    <div style={{ borderRight: '3px solid #4DCEA0', borderBottom: '3px solid #4DCEA0', width: '22px', height: '22px' }} />
                  </div>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    top: '14px',
                    left: '16px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    color: '#4DCEA0',
                    fontSize: '0.72rem',
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em',
                  }}
                >
                  REC • LIVE CAMERA STREAM
                </div>

                {qualityWarning && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '16px',
                      left: '16px',
                      right: '16px',
                      backgroundColor: 'rgba(232, 170, 61, 0.95)',
                      color: '#080E10',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      zIndex: 10,
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{qualityWarning}</span>
                  </div>
                )}
              </>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          {/* Footer Controls */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#091114',
              borderTop: '1px solid #203238',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {!error && !capturedDataUrl && (
              <>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {devices.length > 1 && (
                    <button
                      onClick={toggleFacingMode}
                      title="Switch Front/Back Camera"
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#112429',
                        border: '1px solid #203238',
                        color: '#9CA8AA',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8rem',
                      }}
                    >
                      <SwitchCamera size={16} /> Switch Camera
                    </button>
                  )}
                </div>

                <button
                  onClick={handleTakeSnapshot}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '30px',
                    backgroundColor: '#A855F7',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    boxShadow: '0 0 16px rgba(168, 85, 247, 0.4)',
                  }}
                >
                  <Camera size={18} /> Take Photo
                </button>
              </>
            )}

            {!error && capturedDataUrl && (
              <>
                <button
                  onClick={handleRetake}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: '#112429',
                    border: '1px solid #203238',
                    color: '#9CA8AA',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.82rem',
                  }}
                >
                  <RefreshCw size={15} /> Retake Photo
                </button>

                <button
                  onClick={handleConfirmCapture}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '6px',
                    backgroundColor: '#4DCEA0',
                    color: '#080E10',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.88rem',
                  }}
                >
                  <Check size={18} /> Confirm & Process OCR
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
