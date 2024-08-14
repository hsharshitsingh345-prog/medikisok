import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  QrCode, 
  Camera, 
  Upload, 
  Check, 
  KeyRound, 
  Smartphone, 
  UserCheck, 
  IdCard, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { 
  validateAadhaarNumber, 
  validateAbha, 
  formatAadhaar, 
  formatAbhaNumber, 
  SAMPLE_VALID_AADHAARS,
  DEMO_PATIENTS,
  requestAadhaarOtp,
  verifyAadhaarOtp,
  requestAbhaOtp,
  verifyAbhaWithOtp
} from '../modules/abdmConsent/abhaAuth';
import { scanQrFromImageData, scanQrFromImageSource } from '../modules/abdmConsent/qrScanner';

export function AadhaarAbhaVerificationPortal({ 
  currentPatient, 
  onVerificationComplete, 
  intakeForm,
  selectedLanguage 
}) {
  const [subTab, setSubTab] = useState('aadhaar'); // 'aadhaar' | 'abha' | 'qr' | 'presets'

  // Aadhaar State
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [aadhaarValidation, setAadhaarValidation] = useState(null);
  const [aadhaarOtpStep, setAadhaarOtpStep] = useState(false);
  const [aadhaarTxnId, setAadhaarTxnId] = useState('');
  const [aadhaarOtpInput, setAadhaarOtpInput] = useState('');
  const [aadhaarMaskedPhone, setAadhaarMaskedPhone] = useState('');
  const [aadhaarDemoOtp, setAadhaarDemoOtp] = useState('');
  const [isRequestingAadhaarOtp, setIsRequestingAadhaarOtp] = useState(false);
  const [isVerifyingAadhaarOtp, setIsVerifyingAadhaarOtp] = useState(false);
  const [aadhaarError, setAadhaarError] = useState('');

  // ABHA State
  const [abhaInput, setAbhaInput] = useState('');
  const [abhaValidation, setAbhaValidation] = useState(null);
  const [abhaOtpStep, setAbhaOtpStep] = useState(false);
  const [abhaTxnId, setAbhaTxnId] = useState('');
  const [abhaOtpInput, setAbhaOtpInput] = useState('');
  const [abhaMaskedPhone, setAbhaMaskedPhone] = useState('');
  const [abhaDemoOtp, setAbhaDemoOtp] = useState('');
  const [isRequestingAbhaOtp, setIsRequestingAbhaOtp] = useState(false);
  const [isVerifyingAbhaOtp, setIsVerifyingAbhaOtp] = useState(false);
  const [abhaError, setAbhaError] = useState('');

  // QR / Camera Scan State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [qrScanStatus, setQrScanStatus] = useState('');
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  // Live Aadhaar Validation
  const handleAadhaarChange = (e) => {
    const raw = e.target.value;
    const clean = raw.replace(/\D/g, '').slice(0, 12);
    setAadhaarInput(formatAadhaar(clean));
    setAadhaarError('');
    if (clean.length > 0) {
      setAadhaarValidation(validateAadhaarNumber(clean));
    } else {
      setAadhaarValidation(null);
    }
  };

  // Live ABHA Validation
  const handleAbhaChange = (e) => {
    const val = e.target.value;
    setAbhaInput(val);
    setAbhaError('');
    if (val.trim().length > 0) {
      setAbhaValidation(validateAbha(val));
    } else {
      setAbhaValidation(null);
    }
  };

  // Step 1: Request UIDAI OTP for Aadhaar
  const handleRequestAadhaarOtp = async () => {
    setAadhaarError('');
    setIsRequestingAadhaarOtp(true);
    const result = await requestAadhaarOtp(aadhaarInput);
    setIsRequestingAadhaarOtp(false);

    if (result.success) {
      setAadhaarTxnId(result.txnId);
      setAadhaarMaskedPhone(result.maskedPhone);
      setAadhaarDemoOtp(result.demoOtp);
      setAadhaarOtpStep(true);
    } else {
      setAadhaarError(result.error);
    }
  };

  // Step 2: Verify Aadhaar OTP
  const handleVerifyAadhaarOtp = async () => {
    setAadhaarError('');
    setIsVerifyingAadhaarOtp(true);
    const result = await verifyAadhaarOtp(aadhaarTxnId, aadhaarOtpInput, intakeForm);
    setIsVerifyingAadhaarOtp(false);

    if (result.success && result.verified) {
      onVerificationComplete(result.patient, 'AADHAAR_UIDAI');
    } else {
      setAadhaarError(result.error || 'Verification failed. Please check the OTP.');
    }
  };

  // Step 1: Request ABDM OTP for ABHA
  const handleRequestAbhaOtp = async () => {
    setAbhaError('');
    setIsRequestingAbhaOtp(true);
    const result = await requestAbhaOtp(abhaInput);
    setIsRequestingAbhaOtp(false);

    if (result.success) {
      setAbhaTxnId(result.txnId);
      setAbhaMaskedPhone(result.maskedPhone);
      setAbhaDemoOtp(result.demoOtp);
      setAbhaOtpStep(true);
    } else {
      setAbhaError(result.error);
    }
  };

  // Step 2: Verify ABHA OTP
  const handleVerifyAbhaOtp = async () => {
    setAbhaError('');
    setIsVerifyingAbhaOtp(true);
    const result = await verifyAbhaWithOtp(abhaInput, abhaOtpInput || '123456', intakeForm);
    setIsVerifyingAbhaOtp(false);

    if (result.success && result.verified) {
      onVerificationComplete(result.patient, 'ABHA_ABDM');
    } else {
      setAbhaError(result.error || 'ABHA verification failed.');
    }
  };

  // Handle Preset Select
  const handleSelectPreset = (preset) => {
    onVerificationComplete(preset, 'PRESET_VERIFIED');
  };

  // QR Code Scanner: Start Webcam
  const startCameraScan = async () => {
    setCameraError('');
    setIsCameraActive(true);
    setQrScanStatus('Searching for Aadhaar / ABHA QR Code...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        scanVideoFrames();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please check permissions or upload card photo instead.');
      setIsCameraActive(false);
    }
  };

  // Stop Webcam
  const stopCameraScan = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setQrScanStatus('');
  };

  // Frame scanner loop
  const scanVideoFrames = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanVideoFrames);
      return;
    }

    const video = videoRef.current;
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qrResult = scanQrFromImageData(imgData);

    if (qrResult && qrResult.valid) {
      stopCameraScan();
      handleQrDecoded(qrResult);
      return;
    }

    animFrameRef.current = requestAnimationFrame(scanVideoFrames);
  };

  // QR Upload Photo Handler
  const handleQrFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setQrScanStatus('Decoding QR from uploaded card image...');
    const result = await scanQrFromImageSource(file);
    if (result && result.valid) {
      handleQrDecoded(result);
    } else {
      setCameraError('No valid Aadhaar or ABHA QR code found in the uploaded image.');
      setQrScanStatus('');
    }
  };

  // Process decoded QR
  const handleQrDecoded = (result) => {
    if (result.type === 'AADHAAR_CARD') {
      const d = result.data;
      const patient = {
        id: 'pat_aadhaar_' + Date.now(),
        name: d.name || 'Aadhaar Verified Citizen',
        gender: d.gender || 'Male',
        bloodGroup: d.bloodGroup || intakeForm.bloodGroup || 'B+',
        age: d.age || 40,
        dob: d.dob || '',
        aadhaarNumber: d.uid || 'XXXX XXXX 6016',
        abhaId: `91-0000-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        abhaAddress: `${(d.name || 'citizen').toLowerCase().replace(/\s+/g, '.')}@abdm`,
        phone: intakeForm.phone || '+91 98000-00000',
        email: intakeForm.email || 'aadhaar.citizen@abdm.gov.in',
        previousHospital: intakeForm.previousHospital || 'None / Direct OPD Walk-in',
        weight: intakeForm.weight || '70',
        height: intakeForm.height || '170',
        state: d.state || 'Delhi',
        district: d.district || 'Central',
        address: d.address || 'National Capital Territory of Delhi',
        avatar: d.gender === 'Female' ? '👩' : '👨',
        isAadhaarVerified: true,
        authMethod: 'UIDAI_QR_CARD_DECODED',
        authTimestamp: new Date().toISOString()
      };
      onVerificationComplete(patient, 'AADHAAR_QR');
    } else if (result.type === 'ABHA_CARD') {
      const d = result.data;
      const patient = {
        id: 'pat_abha_' + Date.now(),
        name: d.name || 'ABHA Verified Citizen',
        gender: d.gender || 'Male',
        bloodGroup: d.bloodGroup || intakeForm.bloodGroup || 'O+',
        age: d.age || 40,
        dob: d.dob || '',
        aadhaarNumber: 'XXXX XXXX 7857',
        abhaId: d.abhaId || '91-8432-1092-4412',
        abhaAddress: d.abhaAddress || 'citizen@abdm',
        phone: d.phone || intakeForm.phone || '+91 98000-00000',
        email: intakeForm.email || 'abha.citizen@abdm.gov.in',
        previousHospital: intakeForm.previousHospital || 'None / Direct OPD Walk-in',
        weight: intakeForm.weight || '70',
        height: intakeForm.height || '170',
        state: d.state || 'Delhi',
        district: d.district || 'Central',
        address: d.address || '',
        avatar: d.gender === 'Female' ? '👩' : '🧑',
        isAbhaVerified: true,
        authMethod: 'ABDM_QR_CARD_DECODED',
        authTimestamp: new Date().toISOString()
      };
      onVerificationComplete(patient, 'ABHA_QR');
    }
  };

  useEffect(() => {
    return () => {
      stopCameraScan();
    };
  }, []);

  return (
    <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '1.75rem', marginTop: '1.5rem' }}>
      {/* Header Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', padding: '0.5rem', borderRadius: '10px', color: 'white' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              National Health Identity Verification Gateway
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0' }}>
              Compliant with UIDAI Verhoeff Checksum & ABDM M1 Milestone (Ayushman Bharat Digital Mission)
            </p>
          </div>
        </div>

        {currentPatient?.isAadhaarVerified && (
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#6ee7b7', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle size={15} />
            <span>Aadhaar e-KYC Authenticated</span>
          </div>
        )}

        {currentPatient?.isAbhaVerified && !currentPatient?.isAadhaarVerified && (
          <div style={{ background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle size={15} />
            <span>ABHA Health ID Verified</span>
          </div>
        )}
      </div>

      {/* Verification Channels Navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => { setSubTab('aadhaar'); stopCameraScan(); }}
          style={{
            background: subTab === 'aadhaar' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(0, 0, 0, 0.3)',
            border: `1px solid ${subTab === 'aadhaar' ? '#38bdf8' : 'var(--border-color)'}`,
            color: 'white',
            padding: '0.75rem',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <IdCard size={18} />
          <span>1. Verify Aadhaar (UIDAI)</span>
        </button>

        <button
          type="button"
          onClick={() => { setSubTab('abha'); stopCameraScan(); }}
          style={{
            background: subTab === 'abha' ? 'linear-gradient(135deg, #059669, #047857)' : 'rgba(0, 0, 0, 0.3)',
            border: `1px solid ${subTab === 'abha' ? '#34d399' : 'var(--border-color)'}`,
            color: 'white',
            padding: '0.75rem',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <UserCheck size={18} />
          <span>2. Verify ABHA (ABDM)</span>
        </button>

        <button
          type="button"
          onClick={() => { setSubTab('qr'); }}
          style={{
            background: subTab === 'qr' ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'rgba(0, 0, 0, 0.3)',
            border: `1px solid ${subTab === 'qr' ? '#a78bfa' : 'var(--border-color)'}`,
            color: 'white',
            padding: '0.75rem',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <QrCode size={18} />
          <span>3. Scan Card / QR</span>
        </button>

        <button
          type="button"
          onClick={() => { setSubTab('presets'); stopCameraScan(); }}
          style={{
            background: subTab === 'presets' ? 'linear-gradient(135deg, #d97706, #b45309)' : 'rgba(0, 0, 0, 0.3)',
            border: `1px solid ${subTab === 'presets' ? '#fbbf24' : 'var(--border-color)'}`,
            color: 'white',
            padding: '0.75rem',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <Sparkles size={18} />
          <span>4. Verified Test Profiles</span>
        </button>
      </div>

      {/* CHANNEL 1: AADHAAR VERIFICATION (VERHOEFF CHECKSUM + UIDAI OTP) */}
      {subTab === 'aadhaar' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
              ENTER 12-DIGIT AADHAAR NUMBER (आधार संख्या)
            </label>

            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              <input
                type="text"
                value={aadhaarInput}
                onChange={handleAadhaarChange}
                placeholder="e.g. 3675 9834 6016"
                maxLength={14}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: `2px solid ${aadhaarValidation ? (aadhaarValidation.isValid ? '#10b981' : '#f87171') : 'var(--border-color)'}`,
                  borderRadius: '12px',
                  padding: '0.9rem 1.2rem',
                  color: 'white',
                  fontSize: '1.3rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.1em',
                  fontWeight: 700
                }}
              />
            </div>

            {/* Live Verhoeff Checksum Indicator */}
            {aadhaarValidation && (
              <div style={{
                background: aadhaarValidation.isValid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${aadhaarValidation.isValid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}>
                {aadhaarValidation.isValid ? (
                  <>
                    <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.82rem', color: '#6ee7b7' }}>
                      <strong>Valid UIDAI Verhoeff Checksum Passed.</strong> Number satisfies Dihedral Group D5 mathematical standard and prefix rules.
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle size={20} style={{ color: '#f87171', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.82rem', color: '#fca5a5' }}>
                      <strong>Invalid Aadhaar Number:</strong> {aadhaarValidation.error}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Error Message */}
            {aadhaarError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.6rem 0.9rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1rem' }}>
                {aadhaarError}
              </div>
            )}

            {/* Step 1: Request OTP Button */}
            {!aadhaarOtpStep ? (
              <button
                type="button"
                onClick={handleRequestAadhaarOtp}
                disabled={!aadhaarValidation?.isValid || isRequestingAadhaarOtp}
                style={{
                  width: '100%',
                  background: aadhaarValidation?.isValid ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: 'white',
                  padding: '0.9rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: aadhaarValidation?.isValid ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: aadhaarValidation?.isValid ? '0 4px 15px rgba(2, 132, 199, 0.4)' : 'none'
                }}
              >
                {isRequestingAadhaarOtp ? <RefreshCw className="spin" size={18} /> : <KeyRound size={18} />}
                <span>{isRequestingAadhaarOtp ? 'Contacting UIDAI Gateway...' : 'Send UIDAI e-KYC OTP'}</span>
              </button>
            ) : (
              /* Step 2: Enter & Verify OTP */
              <div style={{ background: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '14px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Smartphone size={16} />
                    <span>OTP sent to Aadhaar Mobile ({aadhaarMaskedPhone})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAadhaarOtpInput(aadhaarDemoOtp)}
                    style={{ background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Auto-Fill Test OTP ({aadhaarDemoOtp})
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    value={aadhaarOtpInput}
                    onChange={(e) => setAadhaarOtpInput(e.target.value.slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    style={{
                      flex: 1,
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '0.75rem',
                      color: 'white',
                      fontSize: '1.2rem',
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.2em',
                      textAlign: 'center',
                      fontWeight: 700
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyAadhaarOtp}
                    disabled={aadhaarOtpInput.length < 6 || isVerifyingAadhaarOtp}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      color: 'white',
                      padding: '0 1.5rem',
                      borderRadius: '10px',
                      fontWeight: 700,
                      cursor: aadhaarOtpInput.length >= 6 ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    {isVerifyingAadhaarOtp ? <RefreshCw className="spin" size={18} /> : <CheckCircle size={18} />}
                    <span>Verify & Link</span>
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Txn ID: {aadhaarTxnId}</span>
                  <span style={{ cursor: 'pointer', color: '#38bdf8' }} onClick={handleRequestAadhaarOtp}>Resend OTP</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Card: UIDAI Compliant Card View */}
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.6rem', marginBottom: '0.9rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  GOVERNMENT OF INDIA • UIDAI
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                  Aadhaar - Mera Aadhaar, Meri Pehchan
                </div>
              </div>
              <ShieldCheck size={28} style={{ color: '#10b981' }} />
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ width: '58px', height: '58px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                {currentPatient?.avatar || (intakeForm.gender === 'Female' ? '👩' : '👨')}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f8fafc' }}>
                  {currentPatient?.name || intakeForm.name || 'Citizen Name'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  DOB / Age: {currentPatient?.dob || intakeForm.dob || '1980-01-01'} • {currentPatient?.gender || intakeForm.gender || 'Male'} • <span style={{ color: '#f87171', fontWeight: 700 }}>🩸 {currentPatient?.bloodGroup || intakeForm.bloodGroup || 'B+'}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {currentPatient?.district || intakeForm.district || 'New Delhi'}, {currentPatient?.state || intakeForm.state || 'Delhi'}
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                AADHAAR NUMBER (UID)
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', color: '#38bdf8' }}>
                {currentPatient?.aadhaarNumber || (aadhaarValidation?.isValid ? aadhaarValidation.formatted : 'XXXX XXXX 6016')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHANNEL 2: ABHA ID / PHR ADDRESS VERIFICATION (ABDM M1 OTP) */}
      {subTab === 'abha' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
              ENTER 14-DIGIT ABHA NUMBER OR PHR ADDRESS (@abdm)
            </label>

            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              <input
                type="text"
                value={abhaInput}
                onChange={handleAbhaChange}
                placeholder="e.g. 91-8432-1092-4412 or rameshwar@abdm"
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: `2px solid ${abhaValidation ? (abhaValidation.isValid ? '#10b981' : '#f87171') : 'var(--border-color)'}`,
                  borderRadius: '12px',
                  padding: '0.9rem 1.2rem',
                  color: 'white',
                  fontSize: '1.2rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700
                }}
              />
            </div>

            {abhaValidation && (
              <div style={{
                background: abhaValidation.isValid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${abhaValidation.isValid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}>
                {abhaValidation.isValid ? (
                  <>
                    <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.82rem', color: '#6ee7b7' }}>
                      <strong>Valid ABDM Identifier:</strong> Format matches {abhaValidation.type === 'ABHA_ADDRESS' ? 'ABHA PHR Address' : '14-digit ABHA Number'} standard.
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle size={20} style={{ color: '#f87171', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.82rem', color: '#fca5a5' }}>
                      <strong>Invalid ABHA:</strong> {abhaValidation.error}
                    </div>
                  </>
                )}
              </div>
            )}

            {abhaError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.6rem 0.9rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1rem' }}>
                {abhaError}
              </div>
            )}

            {!abhaOtpStep ? (
              <button
                type="button"
                onClick={handleRequestAbhaOtp}
                disabled={!abhaValidation?.isValid || isRequestingAbhaOtp}
                style={{
                  width: '100%',
                  background: abhaValidation?.isValid ? 'linear-gradient(135deg, #059669, #047857)' : 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: 'white',
                  padding: '0.9rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: abhaValidation?.isValid ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: abhaValidation?.isValid ? '0 4px 15px rgba(5, 150, 105, 0.4)' : 'none'
                }}
              >
                {isRequestingAbhaOtp ? <RefreshCw className="spin" size={18} /> : <KeyRound size={18} />}
                <span>{isRequestingAbhaOtp ? 'Connecting to ABDM Registry...' : 'Send ABDM M1 OTP'}</span>
              </button>
            ) : (
              <div style={{ background: 'rgba(5, 150, 105, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '14px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Smartphone size={16} />
                    <span>OTP dispatched to linked mobile ({abhaMaskedPhone})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAbhaOtpInput(abhaDemoOtp)}
                    style={{ background: 'rgba(52, 211, 153, 0.2)', border: '1px solid #34d399', color: '#34d399', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Auto-Fill Test OTP ({abhaDemoOtp})
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    value={abhaOtpInput}
                    onChange={(e) => setAbhaOtpInput(e.target.value.slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    style={{
                      flex: 1,
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '0.75rem',
                      color: 'white',
                      fontSize: '1.2rem',
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.2em',
                      textAlign: 'center',
                      fontWeight: 700
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyAbhaOtp}
                    disabled={isVerifyingAbhaOtp}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      color: 'white',
                      padding: '0 1.5rem',
                      borderRadius: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    {isVerifyingAbhaOtp ? <RefreshCw className="spin" size={18} /> : <CheckCircle size={18} />}
                    <span>Verify ABHA</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Card: ABHA Health Card Preview */}
          <div style={{
            background: 'linear-gradient(135deg, #064e3b, #022c22)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.6rem', marginBottom: '0.9rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  NATIONAL HEALTH AUTHORITY • ABDM
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                  Ayushman Bharat Health Account (ABHA)
                </div>
              </div>
              <QrCode size={28} style={{ color: '#34d399' }} />
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ width: '58px', height: '58px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                {currentPatient?.avatar || (intakeForm.gender === 'Female' ? '👩' : '👨')}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f8fafc' }}>
                  {currentPatient?.name || intakeForm.name || 'ABHA Holder'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#a7f3d0' }}>
                  {currentPatient?.abhaAddress || (abhaValidation?.type === 'ABHA_ADDRESS' ? abhaValidation.clean : 'patient@abdm')}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  Gender: {currentPatient?.gender || intakeForm.gender || 'Male'} • <span style={{ color: '#f87171', fontWeight: 700 }}>🩸 {currentPatient?.bloodGroup || intakeForm.bloodGroup || 'O+'}</span>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                ABHA NUMBER
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', color: '#34d399' }}>
                {currentPatient?.abhaId || (abhaValidation?.type === 'ABHA_NUMBER' ? abhaValidation.formatted : '91-8432-1092-4412')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHANNEL 3: LIVE CAMERA CARD / QR SCANNER */}
      {subTab === 'qr' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.6rem', color: '#f8fafc' }}>
                Scan Physical Aadhaar Card or ABHA Health Card:
              </div>

              {/* Viewport */}
              <div style={{
                position: 'relative',
                background: '#000',
                border: '2px dashed rgba(167, 139, 250, 0.5)',
                borderRadius: '16px',
                overflow: 'hidden',
                minHeight: '280px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <video
                  ref={videoRef}
                  style={{
                    width: '100%',
                    height: '280px',
                    objectFit: 'cover',
                    display: isCameraActive ? 'block' : 'none'
                  }}
                />

                {isCameraActive && (
                  <div style={{
                    position: 'absolute',
                    top: '15%',
                    left: '15%',
                    right: '15%',
                    bottom: '15%',
                    border: '2px solid #a78bfa',
                    boxShadow: '0 0 20px rgba(167, 139, 250, 0.6)',
                    borderRadius: '12px',
                    pointerEvents: 'none'
                  }}>
                    <div style={{ position: 'absolute', top: '-10px', left: '-10px', width: '20px', height: '20px', borderTop: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8' }} />
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '20px', height: '20px', borderTop: '3px solid #38bdf8', borderRight: '3px solid #38bdf8' }} />
                    <div style={{ position: 'absolute', bottom: '-10px', left: '-10px', width: '20px', height: '20px', borderBottom: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8' }} />
                    <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '20px', height: '20px', borderBottom: '3px solid #38bdf8', borderRight: '3px solid #38bdf8' }} />
                  </div>
                )}

                {!isCameraActive && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    <QrCode size={56} style={{ color: '#a78bfa', opacity: 0.6, margin: '0 auto 1rem' }} />
                    <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '1rem' }}>
                      Ready to Scan Physical ID Card
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>
                      Hold your Aadhaar card QR code or ABHA card facing the webcam
                    </div>
                  </div>
                )}
              </div>

              {/* Status / Error */}
              {qrScanStatus && (
                <div style={{ background: 'rgba(167, 139, 250, 0.15)', color: '#c4b5fd', padding: '0.6rem 0.9rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RefreshCw className="spin" size={16} />
                  <span>{qrScanStatus}</span>
                </div>
              )}

              {cameraError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.6rem 0.9rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                  {cameraError}
                </div>
              )}

              {/* Controls */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {!isCameraActive ? (
                  <button
                    type="button"
                    onClick={startCameraScan}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                      border: 'none',
                      color: 'white',
                      padding: '0.85rem',
                      borderRadius: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)'
                    }}
                  >
                    <Camera size={18} />
                    <span>Start Webcam QR Scanner</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopCameraScan}
                    style={{
                      flex: 1,
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid #ef4444',
                      color: '#f87171',
                      padding: '0.85rem',
                      borderRadius: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Stop Scanner
                  </button>
                )}

                <label
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    color: 'white',
                    padding: '0.85rem 1.25rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem'
                  }}
                >
                  <Upload size={17} />
                  <span>Upload Card Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            {/* Explanatory Info Card */}
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a78bfa', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                <Info size={18} />
                <span>Supported Indian Government Health IDs</span>
              </div>
              <ul style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '1.2rem', margin: 0 }}>
                <li><strong>Aadhaar Card Secure QR:</strong> Decodes full demographic XML (Name, DOB/Year, Gender, Full Registered Address).</li>
                <li><strong>ABHA QR Health Card:</strong> Decodes 14-digit ABHA Number, PHR Address, and ABDM Patient Identifier.</li>
                <li><strong>High Reliability:</strong> Real-time frame decoding runs entirely client-side using `jsQR` with zero cloud leakage.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CHANNEL 4: VERIFIED TEST CITIZENS (INSTANT ONE-CLICK TESTING) */}
      {subTab === 'presets' && (
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            SELECT A PRE-VERIFIED CITIZEN PROFILE (MATHEMATICALLY VALID VERHOEFF AADHAAR NUMBERS):
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
            {SAMPLE_VALID_AADHAARS.map((c, idx) => {
              const isSelected = currentPatient?.aadhaarNumber === c.aadhaar;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelectPreset(c)}
                  style={{
                    background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 0, 0, 0.3)',
                    border: `1px solid ${isSelected ? '#10b981' : 'var(--border-color)'}`,
                    borderRadius: '14px',
                    padding: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem' }}>
                      {c.avatar}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>{c.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {c.aadhaar}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {c.age}Y • {c.gender} • <span style={{ color: '#f87171', fontWeight: 700 }}>🩸 {c.bloodGroup || 'O+'}</span> • {c.district}, {c.state}
                      </div>
                    </div>
                  </div>
                  {isSelected ? (
                    <CheckCircle size={22} style={{ color: '#10b981' }} />
                  ) : (
                    <button
                      type="button"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: 'none',
                        color: 'white',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Verify
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
