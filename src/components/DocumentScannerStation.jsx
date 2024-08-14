import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  ScanLine, 
  RefreshCw, 
  FileText, 
  FileCheck2, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  ExternalLink, 
  Eye, 
  Layers, 
  IdCard, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  FlipHorizontal,
  FileImage,
  ArrowRight
} from 'lucide-react';
import { SAMPLE_DOCUMENTS } from '../modules/documentIntelligence/sampleDocuments';
import { processMedicalDocument } from '../modules/documentIntelligence/ocrProcessor';

export function DocumentScannerStation({ 
  scannedDocuments, 
  setScannedDocuments, 
  selectedLanguage,
  onImportGovtId 
}) {
  const [scanMode, setScanMode] = useState('camera'); // 'camera' | 'upload' | 'preset'
  const [selectedSampleDocId, setSelectedSampleDocId] = useState('doc_cardio_discharge');
  
  // Real Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);

  // Uploaded File State
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState(null);

  // OCR Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressState, setProgressState] = useState({ pct: 0, label: '' });
  const [activeTabDocId, setActiveTabDocId] = useState(null);
  const [expandedRawTextId, setExpandedRawTextId] = useState(null);

  // Start Camera
  const startCamera = async () => {
    setCameraError('');
    setIsCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera startup error:', err);
      setCameraError('Unable to open camera stream. Please allow webcam permissions or upload document photo directly.');
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Switch Camera Front / Back
  const toggleCameraFacing = async () => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  useEffect(() => {
    if (scanMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [scanMode, facingMode]);

  // Capture Live Still from Camera and Run Real OCR
  const captureAndScanCamera = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    setIsProcessing(true);
    setProgressState({ pct: 10, label: 'Capturing high-resolution camera still...' });

    try {
      const result = await processMedicalDocument(
        { dataUrl, name: 'Live Camera Capture ' + new Date().toLocaleTimeString() },
        (p) => setProgressState(p)
      );

      if (result.success) {
        setScannedDocuments(prev => [result.document, ...prev.filter(d => d.id !== result.document.id)]);
        setActiveTabDocId(result.document.id);
      }
    } catch (e) {
      console.error('Capture OCR failed:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Real File Upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    const preview = URL.createObjectURL(file);
    setUploadedPreview(preview);
  };

  // Scan Uploaded File with Real OCR
  const scanUploadedFile = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setProgressState({ pct: 10, label: 'Reading document file buffer...' });

    try {
      const result = await processMedicalDocument(uploadedFile, (p) => setProgressState(p));
      if (result.success) {
        setScannedDocuments(prev => [result.document, ...prev.filter(d => d.id !== result.document.id)]);
        setActiveTabDocId(result.document.id);
      }
    } catch (e) {
      console.error('Uploaded file OCR failed:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Scan Preset Sample Document
  const scanPresetDocument = async () => {
    setIsProcessing(true);
    setProgressState({ pct: 10, label: 'Loading sample clinical dossier...' });

    try {
      const result = await processMedicalDocument(selectedSampleDocId, (p) => setProgressState(p));
      if (result.success) {
        setScannedDocuments(prev => [result.document, ...prev.filter(d => d.id !== result.document.id)]);
        setActiveTabDocId(result.document.id);
      }
    } catch (e) {
      console.error('Preset document OCR failed:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove a scanned document
  const handleRemoveDocument = (docId) => {
    setScannedDocuments(prev => prev.filter(d => d.id !== docId));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '2rem', alignItems: 'start' }}>
      {/* LEFT COLUMN: DOCUMENT CAPTURE & SCANNER STATION */}
      <div>
        {/* Scanner Source Selector Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => setScanMode('camera')}
            style={{
              background: scanMode === 'camera' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(0, 0, 0, 0.3)',
              border: `1px solid ${scanMode === 'camera' ? '#38bdf8' : 'var(--border-color)'}`,
              color: 'white',
              padding: '0.75rem',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s'
            }}
          >
            <Camera size={17} />
            <span>1. Live Camera Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => setScanMode('upload')}
            style={{
              background: scanMode === 'upload' ? 'linear-gradient(135deg, #059669, #047857)' : 'rgba(0, 0, 0, 0.3)',
              border: `1px solid ${scanMode === 'upload' ? '#34d399' : 'var(--border-color)'}`,
              color: 'white',
              padding: '0.75rem',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s'
            }}
          >
            <Upload size={17} />
            <span>2. Upload Any Document</span>
          </button>

          <button
            type="button"
            onClick={() => setScanMode('preset')}
            style={{
              background: scanMode === 'preset' ? 'linear-gradient(135deg, #d97706, #b45309)' : 'rgba(0, 0, 0, 0.3)',
              border: `1px solid ${scanMode === 'preset' ? '#fbbf24' : 'var(--border-color)'}`,
              color: 'white',
              padding: '0.75rem',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s'
            }}
          >
            <Sparkles size={17} />
            <span>3. Clinical Presets</span>
          </button>
        </div>

        {/* SCANNER VIEWPORT */}
        <div className="scanner-viewport" style={{ margin: '0 0 1.25rem 0', minHeight: '360px', position: 'relative' }}>
          {isProcessing && <div className="scanner-laser" />}

          {/* Mode 1: Live Webcam Stream */}
          {scanMode === 'camera' && (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  height: '360px',
                  objectFit: 'cover',
                  display: isCameraActive ? 'block' : 'none'
                }}
              />

              {isCameraActive && (
                <>
                  {/* Document Alignment Frame */}
                  <div style={{
                    position: 'absolute',
                    top: '10%',
                    left: '8%',
                    right: '8%',
                    bottom: '10%',
                    border: '2px solid rgba(56, 189, 248, 0.7)',
                    borderRadius: '16px',
                    boxShadow: '0 0 25px rgba(56, 189, 248, 0.3)',
                    pointerEvents: 'none'
                  }}>
                    <div style={{ position: 'absolute', top: '-6px', left: '-6px', width: '24px', height: '24px', borderTop: '4px solid #38bdf8', borderLeft: '4px solid #38bdf8' }} />
                    <div style={{ position: 'absolute', top: '-6px', right: '-6px', width: '24px', height: '24px', borderTop: '4px solid #38bdf8', borderRight: '4px solid #38bdf8' }} />
                    <div style={{ position: 'absolute', bottom: '-6px', left: '-6px', width: '24px', height: '24px', borderBottom: '4px solid #38bdf8', borderLeft: '4px solid #38bdf8' }} />
                    <div style={{ position: 'absolute', bottom: '-6px', right: '-6px', width: '24px', height: '24px', borderBottom: '4px solid #38bdf8', borderRight: '4px solid #38bdf8' }} />
                    <div style={{ position: 'absolute', top: '10px', left: '14px', fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ALIGN PHYSICAL PAPER / LAB REPORT IN FRAME
                    </div>
                  </div>

                  {/* Camera Control overlay */}
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(0, 0, 0, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      zIndex: 12
                    }}
                  >
                    <FlipHorizontal size={14} />
                    <span>Flip Camera</span>
                  </button>
                </>
              )}

              {!isCameraActive && (
                <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
                  <Camera size={52} style={{ color: '#38bdf8', opacity: 0.6, margin: '0 auto 1rem' }} />
                  <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '1.05rem' }}>
                    Webcam Scanner Standby
                  </div>
                  {cameraError ? (
                    <div style={{ color: '#fca5a5', fontSize: '0.82rem', marginTop: '0.5rem', maxWidth: '380px' }}>
                      {cameraError}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.82rem', marginTop: '0.4rem' }}>
                      Click below to activate live camera feed
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={startCamera}
                    style={{
                      marginTop: '1rem',
                      background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                      border: 'none',
                      color: 'white',
                      padding: '0.65rem 1.25rem',
                      borderRadius: '10px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Activate Camera
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Real File Upload Dropzone */}
          {scanMode === 'upload' && (
            <div style={{ width: '100%', height: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {uploadedPreview ? (
                <div style={{ textAlign: 'center', width: '100%' }}>
                  <img
                    src={uploadedPreview}
                    alt="Uploaded preview"
                    style={{ maxHeight: '220px', maxWidth: '90%', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.2)', objectFit: 'contain', margin: '0 auto 0.75rem' }}
                  />
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                    {uploadedFile?.name} ({(uploadedFile?.size / 1024).toFixed(1)} KB)
                  </div>
                  <label
                    style={{
                      display: 'inline-block',
                      marginTop: '0.5rem',
                      color: '#38bdf8',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Choose another file
                    <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                  </label>
                </div>
              ) : (
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', textAlign: 'center', padding: '2rem' }}>
                  <FileImage size={56} style={{ color: '#34d399', opacity: 0.7, marginBottom: '1rem' }} />
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f8fafc' }}>
                    Click to Upload Any Medical Document
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.4rem', maxWidth: '360px' }}>
                    Accepts Prescriptions, Hospital Discharge Summaries, Lab Test Panels, Aadhaar/ABHA ID Cards (JPG, PNG, WEBP, PDF)
                  </div>
                  <div style={{ marginTop: '1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', padding: '0.45rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                    Select File from Device
                  </div>
                  <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          )}

          {/* Mode 3: Preset Documents */}
          {scanMode === 'preset' && (
            <div style={{ width: '100%', height: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <ScanLine size={52} style={{ color: '#fbbf24', opacity: 0.8, marginBottom: '1rem' }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f8fafc' }}>
                Pre-loaded High-Fidelity Indian Medical Records
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.4rem', textAlign: 'center', maxWidth: '380px' }}>
                Select a preset below and execute the multimodal Indic OCR pipeline.
              </div>
            </div>
          )}

          {/* Real-time OCR Loading Overlay */}
          {isProcessing && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(2, 6, 23, 0.88)',
              backdropFilter: 'blur(6px)',
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <RefreshCw size={44} className="spin" style={{ color: '#38bdf8', marginBottom: '1.25rem' }} />
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#f8fafc', marginBottom: '0.5rem' }}>
                Multimodal Indic Clinical OCR Running
              </div>
              <div style={{ fontSize: '0.88rem', color: '#38bdf8', marginBottom: '1.25rem', maxWidth: '420px' }}>
                {progressState.label || 'Recognizing clinical entities...'}
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', maxWidth: '340px', background: 'rgba(255, 255, 255, 0.1)', height: '8px', borderRadius: '6px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progressState.pct || 15}%`,
                    background: 'linear-gradient(90deg, #38bdf8, #10b981)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                {progressState.pct || 15}% Complete
              </div>
            </div>
          )}
        </div>

        {/* Preset Selector Grid (if preset mode active) */}
        {scanMode === 'preset' && (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
              CHOOSE CLINICAL RECORD PRESET:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              {SAMPLE_DOCUMENTS.map(doc => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedSampleDocId(doc.id)}
                  style={{
                    background: selectedSampleDocId === doc.id ? 'rgba(56, 189, 248, 0.2)' : 'var(--bg-surface-elevated)',
                    border: `1px solid ${selectedSampleDocId === doc.id ? '#38bdf8' : 'var(--border-color)'}`,
                    borderRadius: '10px',
                    padding: '0.75rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 800 }}>{doc.type}</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {doc.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Primary Action Button */}
        <div>
          {scanMode === 'camera' && (
            <button
              type="button"
              onClick={captureAndScanCamera}
              disabled={isProcessing}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: 'none',
                color: 'white',
                padding: '0.95rem',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '1.05rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)'
              }}
            >
              <ScanLine size={22} />
              <span>Capture Photo & Run Real OCR</span>
            </button>
          )}

          {scanMode === 'upload' && (
            <button
              type="button"
              onClick={scanUploadedFile}
              disabled={!uploadedFile || isProcessing}
              style={{
                width: '100%',
                background: uploadedFile ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: 'white',
                padding: '0.95rem',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '1.05rem',
                cursor: uploadedFile ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                boxShadow: uploadedFile ? '0 4px 15px rgba(16, 185, 129, 0.4)' : 'none'
              }}
            >
              <ScanLine size={22} />
              <span>{uploadedFile ? 'Execute OCR on Uploaded Document' : 'Please Select a File First'}</span>
            </button>
          )}

          {scanMode === 'preset' && (
            <button
              type="button"
              onClick={scanPresetDocument}
              disabled={isProcessing}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #d97706, #b45309)',
                border: 'none',
                color: 'white',
                padding: '0.95rem',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '1.05rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                boxShadow: '0 4px 15px rgba(217, 119, 6, 0.4)'
              }}
            >
              <ScanLine size={22} />
              <span>Execute AI Scanner on Selected Preset</span>
            </button>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: EXTRACTED CLINICAL INTELLIGENCE DOSSIER */}
      <div style={{
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        padding: '1.5rem',
        minHeight: '480px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCheck2 size={22} style={{ color: '#10b981' }} />
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#f8fafc' }}>
              Extracted Clinical Intelligence ({scannedDocuments.length} Digitized)
            </span>
          </div>
        </div>

        {scannedDocuments.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>
              No Documents Digitized Yet
            </div>
            <div style={{ fontSize: '0.82rem', marginTop: '0.4rem', maxWidth: '320px' }}>
              Use the live webcam scanner, upload any lab report/prescription, or trigger a preset on the left.
            </div>
          </div>
        ) : (
          <div style={{ overflowY: 'auto', maxHeight: '540px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {scannedDocuments.map((doc, idx) => {
              const isRawTextOpen = expandedRawTextId === doc.id;
              return (
                <div
                  key={doc.id || idx}
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: '1.25rem',
                    borderRadius: '14px',
                    border: '1px solid var(--border-color)',
                    position: 'relative'
                  }}
                >
                  {/* Top Bar: Title, Date & Delete */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', background: 'rgba(56, 189, 248, 0.15)', padding: '0.15rem 0.5rem', borderRadius: '6px', marginRight: '0.5rem' }}>
                        {doc.type}
                      </span>
                      <h4 style={{ margin: '0.35rem 0 0.15rem', fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                        {doc.title}
                      </h4>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {doc.facility} • {doc.date}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(doc.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: 'none',
                        color: '#f87171',
                        padding: '0.4rem',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                      title="Remove document"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Highlight: Detected Aadhaar or ABHA on scanned paper */}
                  {(doc.detectedAadhaar || doc.detectedAbha) && (
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.2), rgba(16, 185, 129, 0.2))',
                      border: '1px solid #38bdf8',
                      borderRadius: '10px',
                      padding: '0.75rem 1rem',
                      marginBottom: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.6rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <IdCard size={20} style={{ color: '#38bdf8' }} />
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc' }}>
                            {doc.detectedAadhaar ? 'Aadhaar ID Detected via OCR' : 'ABHA Health Account Detected'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6ee7b7', fontFamily: 'var(--font-mono)' }}>
                            {doc.detectedAadhaar ? doc.detectedAadhaar.number : (doc.detectedAbha?.number || doc.detectedAbha?.address)}
                          </div>
                        </div>
                      </div>

                      {onImportGovtId && (
                        <button
                          type="button"
                          onClick={() => onImportGovtId(doc.detectedAadhaar || doc.detectedAbha)}
                          style={{
                            background: '#0284c7',
                            border: 'none',
                            color: 'white',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <span>Import to Identity</span>
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Section 1: Diagnoses */}
                  {doc.extracted?.diagnoses?.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        CLINICAL DIAGNOSES:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.3rem' }}>
                        {doc.extracted.diagnoses.map((d, i) => (
                          <span
                            key={i}
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              color: '#6ee7b7',
                              fontSize: '0.78rem',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontWeight: 600
                            }}
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 2: Medications */}
                  {doc.extracted?.medications?.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        PRESCRIBED MEDICATIONS ({doc.extracted.medications.length}):
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
                        {doc.extracted.medications.map((m, i) => (
                          <div
                            key={i}
                            style={{
                              background: 'rgba(255, 255, 255, 0.04)',
                              padding: '0.45rem 0.75rem',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '0.8rem'
                            }}
                          >
                            <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                              {m.name} <span style={{ color: '#38bdf8' }}>{m.dosage}</span>
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                              {m.frequency} {m.purpose ? `• ${m.purpose}` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 3: Diagnostic Labs & Abnormal Highlights */}
                  {doc.extracted?.labs?.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        LABORATORY BIOMARKERS ({doc.extracted.labs.length}):
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.45rem', marginTop: '0.35rem' }}>
                        {doc.extracted.labs.map((lab, i) => {
                          const isHigh = lab.status === 'HIGH' || lab.status === 'CRITICAL' || lab.status === 'ELEVATED';
                          const isCritical = lab.status === 'CRITICAL';
                          return (
                            <div
                              key={i}
                              style={{
                                background: isCritical ? 'rgba(239, 68, 68, 0.18)' : (isHigh ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.04)'),
                                border: `1px solid ${isCritical ? '#ef4444' : (isHigh ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)')}`,
                                padding: '0.5rem 0.7rem',
                                borderRadius: '8px'
                              }}
                            >
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {lab.test}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', margin: '0.15rem 0' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: isCritical ? '#fca5a5' : (isHigh ? '#fcd34d' : '#f8fafc') }}>
                                  {lab.value}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{lab.unit}</span>
                              </div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                Normal: {lab.refRange}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Section 4: Drug-Drug Interaction Safety Alert */}
                  {doc.extracted?.drugInteractions?.length > 0 && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '0.6rem 0.8rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f87171', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        <AlertTriangle size={15} />
                        <span>Adverse Drug Interaction Warning Detected</span>
                      </div>
                      {doc.extracted.drugInteractions.map((warn, wIdx) => (
                        <div key={wIdx} style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: '0.2rem' }}>
                          <strong>{warn.title}:</strong> {warn.description}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Toggle: Inspect Raw Scanned OCR Text */}
                  <div style={{ marginTop: '0.6rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setExpandedRawTextId(isRawTextOpen ? null : doc.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#38bdf8',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: 0
                      }}
                    >
                      <Eye size={14} />
                      <span>{isRawTextOpen ? 'Hide Raw OCR Text' : 'View Full Extracted OCR Text'}</span>
                      {isRawTextOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isRawTextOpen && (
                      <pre style={{
                        marginTop: '0.5rem',
                        background: '#020617',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        color: '#cbd5e1',
                        fontSize: '0.72rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {doc.rawText}
                      </pre>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
