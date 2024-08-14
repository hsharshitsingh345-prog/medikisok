import React, { useState, useEffect } from 'react';
import { 
  User, 
  QrCode, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Volume2, 
  Upload, 
  FileText, 
  AlertCircle, 
  Check, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  HeartPulse, 
  Wind, 
  Activity, 
  Thermometer, 
  Brain, 
  Bone, 
  Zap, 
  Leaf, 
  Building2, 
  FileCheck2,
  ScanLine,
  Phone,
  Mail,
  Calendar,
  Scale,
  Ruler,
  Edit3,
  RotateCcw,
  Droplet
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { DEMO_PATIENTS, verifyAbhaWithOtp } from '../modules/abdmConsent/abhaAuth';
import { CHIEF_COMPLAINTS, SOCRATES_QUESTIONS, REVIEW_OF_SYSTEMS_QUESTIONS } from '../modules/historyEngine/adaptiveQuestioner';
import { AYUSH_CHIEF_COMPLAINTS, PRAKRITI_QUESTIONS, AGNI_KOSHTHA_QUESTIONS, AHARA_VIHARA_QUESTIONS } from '../modules/historyEngine/ayushPariksha';
import { evaluateRedFlags } from '../modules/historyEngine/redFlagDetector';
import { SAMPLE_DOCUMENTS } from '../modules/documentIntelligence/sampleDocuments';
import { processMedicalDocument } from '../modules/documentIntelligence/ocrProcessor';
import { buildClinicalSummary } from '../modules/summaryGenerator/summaryBuilder';
import { generateFhirR4Bundle } from '../modules/summaryGenerator/fhirGenerator';
import { speechService } from '../modules/historyEngine/speechService';
import { ConsentModal } from './ConsentModal';
import { RedFlagModal } from './RedFlagModal';
import { AadhaarAbhaVerificationPortal } from './AadhaarAbhaVerificationPortal';
import { DocumentScannerStation } from './DocumentScannerStation';

export function PatientKioskView({ 
  isAyushMode, 
  selectedLanguage, 
  onPatientSubmittedToQueue 
}) {
  // Stepper: 1: Identity & Consent, 2: Conversational History, 3: Document Scanner, 4: Token & Summary
  const [currentStep, setCurrentStep] = useState(1);

  // Patient Identity State
  const [abhaInput, setAbhaInput] = useState('');
  const [currentPatient, setCurrentPatient] = useState(null);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [hasGrantedConsent, setHasGrantedConsent] = useState(false);

  // Conversational History State
  const [chiefComplaint, setChiefComplaint] = useState('chest_pain');
  const [historyAnswers, setHistoryAnswers] = useState({});
  const [ayushAnswers, setAyushAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('socrates'); // 'socrates' | 'ayush' | 'ros'

  // Voice & Speech State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Document Digitization State
  const [scannedDocuments, setScannedDocuments] = useState([]);

  // Red Flag Alert State
  const [redFlagData, setRedFlagData] = useState(null);
  const [showRedFlagModal, setShowRedFlagModal] = useState(false);

  // Final Summary & Token
  const [generatedSummary, setGeneratedSummary] = useState(null);

  // Voice Interview Mode
  const [voiceInterviewActive, setVoiceInterviewActive] = useState(false);
  const [voiceInterviewStep, setVoiceInterviewStep] = useState(0); // index into VOICE_INTERVIEW_FIELDS
  const [voiceInterviewStatus, setVoiceInterviewStatus] = useState('idle'); // 'idle' | 'speaking' | 'listening' | 'done'
  const [voiceInterviewTranscript, setVoiceInterviewTranscript] = useState('');

  // ── Voice Interview Field Definitions ──────────────────────────────────────
  const VOICE_INTERVIEW_FIELDS = [
    {
      id: 'name',
      questionEn: 'Please say your full name.',
      questionHi: 'कृपया अपना पूरा नाम बोलें।',
      hintEn: 'E.g. Rameshwar Prasad Sharma',
      type: 'text',
      parse: (t) => t.trim()
    },
    {
      id: 'phone',
      questionEn: 'What is your mobile phone number?',
      questionHi: 'आपका मोबाइल नंबर क्या है?',
      hintEn: 'Say the digits clearly',
      type: 'text',
      parse: (t) => t.replace(/[^\d+\-\s]/g, '').trim()
    },
    {
      id: 'age',
      questionEn: 'How old are you? Please say your age in years.',
      questionHi: 'आप कितने साल के हैं?',
      hintEn: 'E.g. forty-five',
      type: 'number',
      parse: (t) => {
        const words = { zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15, sixteen:16, seventeen:17, eighteen:18, nineteen:19, twenty:20, thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90 };
        const num = parseInt(t, 10);
        if (!isNaN(num)) return String(num);
        let total = 0;
        t.toLowerCase().split(/[\s-]+/).forEach(w => { if (words[w] !== undefined) total += words[w]; });
        return total > 0 ? String(total) : t.trim();
      }
    },
    {
      id: 'gender',
      questionEn: 'What is your gender? Say Male, Female, or Other.',
      questionHi: 'आपका लिंग क्या है? पुरुष, महिला, या अन्य कहें।',
      hintEn: 'Say: Male, Female, or Other',
      type: 'select',
      parse: (t) => {
        const low = t.toLowerCase();
        if (low.includes('female') || low.includes('महिला') || low.includes('स्त्री')) return 'Female';
        if (low.includes('other') || low.includes('अन्य')) return 'Other';
        return 'Male';
      }
    },
    {
      id: 'bloodGroup',
      questionEn: 'What is your blood group? For example: A positive, B negative, O positive.',
      questionHi: 'आपका रक्त समूह क्या है? जैसे: ए पॉजिटिव, बी नेगेटिव, ओ पॉजिटिव।',
      hintEn: 'E.g. B positive, O negative, AB positive',
      type: 'select',
      parse: (t) => {
        const low = t.toLowerCase();
        const pos = low.includes('pos') || low.includes('+') || low.includes('posi');
        const neg = low.includes('neg') || low.includes('-') || low.includes('nega');
        const sign = neg ? '-' : '+';
        if (low.includes('ab')) return `AB${sign}`;
        if (low.includes(' a') || low.startsWith('a ') || low === 'a') return `A${sign}`;
        if (low.includes(' b') || low.startsWith('b ') || low === 'b') return `B${sign}`;
        if (low.includes('o ') || low.startsWith('o') || low.includes(' o')) return `O${sign}`;
        return t.trim().toUpperCase().replace(/POSITIVE/i,'+').replace(/NEGATIVE/i,'-').replace(/\s+/g,'') || 'O+';
      }
    },
    {
      id: 'weight',
      questionEn: 'What is your body weight in kilograms?',
      questionHi: 'आपका वजन कितना है? किलोग्राम में बताएं।',
      hintEn: 'E.g. seventy-two kilograms',
      type: 'number',
      parse: (t) => {
        const m = t.match(/[\d.]+/);
        return m ? m[0] : t.trim();
      }
    },
    {
      id: 'height',
      questionEn: 'What is your height in centimeters?',
      questionHi: 'आपकी लंबाई सेंटीमीटर में कितनी है?',
      hintEn: 'E.g. one hundred seventy centimeters',
      type: 'number',
      parse: (t) => {
        const m = t.match(/[\d.]+/);
        return m ? m[0] : t.trim();
      }
    },
    {
      id: 'previousHospital',
      questionEn: 'Which hospital or clinic did you visit before, or say "none" if this is your first visit?',
      questionHi: 'आप पहले किस अस्पताल में गए थे? अगर पहली बार आ रहे हैं तो "नहीं" कहें।',
      hintEn: 'E.g. AIIMS Delhi, or say None',
      type: 'text',
      parse: (t) => {
        const low = t.toLowerCase().trim();
        if (low === 'none' || low === 'नहीं' || low === 'no' || low === '') return 'None / Direct OPD Walk-in';
        return t.trim();
      }
    }
  ];

  // Icon mapping for chief complaints
  const iconMap = {
    HeartPulse: <HeartPulse size={24} style={{ color: '#ef4444' }} />,
    Wind: <Wind size={24} style={{ color: '#38bdf8' }} />,
    Activity: <Activity size={24} style={{ color: '#f59e0b' }} />,
    Thermometer: <Thermometer size={24} style={{ color: '#ec4899' }} />,
    Brain: <Brain size={24} style={{ color: '#8b5cf6' }} />,
    Bone: <Bone size={24} style={{ color: '#10b981' }} />,
    Lungs: <Wind size={24} style={{ color: '#06b6d4' }} />,
    ZapOff: <Zap size={24} style={{ color: '#eab308' }} />
  };

  // Sync speech service language
  useEffect(() => {
    speechService.setLanguage(selectedLanguage);
  }, [selectedLanguage]);

  // Evaluate red flags whenever history answers change
  useEffect(() => {
    if (chiefComplaint && Object.keys(historyAnswers).length > 0) {
      const evaluation = evaluateRedFlags(chiefComplaint, historyAnswers);
      if (evaluation.hasRedFlag) {
        setRedFlagData(evaluation);
        setShowRedFlagModal(true);
      }
    }
  }, [chiefComplaint, historyAnswers]);

  // Tab within Step 1: 'form' | 'abha'
  const [intakeTab, setIntakeTab] = useState('form');

  // Comprehensive Intake Form with 10 Fields (Starts clear/blank)
  const [intakeForm, setIntakeForm] = useState({
    name: '',
    phone: '',
    email: '',
    previousHospital: '',
    age: '',
    gender: 'Male',
    bloodGroup: 'O+',
    dob: '',
    weight: '',
    height: ''
  });

  // Handler to clear all intake form fields
  const handleClearIntakeForm = () => {
    setIntakeForm({
      name: '',
      phone: '',
      email: '',
      previousHospital: '',
      age: '',
      gender: 'Male',
      bloodGroup: '',
      dob: '',
      weight: '',
      height: ''
    });
    setAbhaInput('');
    setCurrentPatient(null);
  };

  // Real-Time BMI Calculation Engine
  const calculateBmi = (weight, height) => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (!w || !h || h <= 0) return null;
    const val = (w / (h * h)).toFixed(1);
    let category = 'Normal';
    let statusClass = 'normal';
    let color = '#34d399';
    let segmentIndex = 1;

    if (val < 18.5) {
      category = 'Underweight';
      statusClass = 'underweight';
      color = '#fbbf24';
      segmentIndex = 0;
    } else if (val >= 25 && val < 30) {
      category = 'Overweight';
      statusClass = 'overweight';
      color = '#fb923c';
      segmentIndex = 2;
    } else if (val >= 30) {
      category = 'Obese';
      statusClass = 'obese';
      color = '#f87171';
      segmentIndex = 3;
    }

    return { value: val, category, statusClass, color, segmentIndex };
  };

  // Synchronize DOB with Age
  const handleDobChange = (e) => {
    const val = e.target.value;
    setIntakeForm(prev => {
      let calcAge = prev.age;
      if (val) {
        const birthDate = new Date(val);
        const yDiff = new Date().getFullYear() - birthDate.getFullYear();
        if (!isNaN(yDiff) && yDiff >= 0 && yDiff < 125) {
          calcAge = yDiff;
        }
      }
      return { ...prev, dob: val, age: calcAge };
    });
  };

  // Handle Aadhaar / ABHA Verification Complete
  const handleVerificationComplete = (verifiedPatient, method) => {
    setCurrentPatient(verifiedPatient);
    if (verifiedPatient.abhaId) setAbhaInput(verifiedPatient.abhaId);
    if (verifiedPatient.aadhaarNumber && !verifiedPatient.abhaId) setAbhaInput(verifiedPatient.aadhaarNumber);

    setIntakeForm({
      name: verifiedPatient.name || '',
      phone: verifiedPatient.phone || '',
      email: verifiedPatient.email || '',
      previousHospital: verifiedPatient.previousHospital || 'None / Direct OPD Walk-in',
      age: verifiedPatient.age || 40,
      gender: verifiedPatient.gender || 'Male',
      bloodGroup: verifiedPatient.bloodGroup || intakeForm.bloodGroup || 'B+',
      dob: verifiedPatient.dob || '1980-01-01',
      weight: verifiedPatient.weight || intakeForm.weight || '70',
      height: verifiedPatient.height || intakeForm.height || '170'
    });
    setIsConsentModalOpen(true);
  };

  // Import Govt ID detected from Scanned Document
  const handleImportGovtIdFromScan = (idData) => {
    if (!idData) return;
    if (idData.number) {
      setAbhaInput(idData.number);
      setIntakeTab('abha');
      setCurrentStep(1);
    } else if (idData.address) {
      setAbhaInput(idData.address);
      setIntakeTab('abha');
      setCurrentStep(1);
    }
  };

  // Proceed with current intake form
  const handleProceedFromIntake = () => {
    const bmiData = calculateBmi(intakeForm.weight, intakeForm.height);
    const updated = {
      id: currentPatient?.id || 'pat_' + Date.now(),
      name: intakeForm.name?.trim() || currentPatient?.name || 'Walk-in Patient',
      phone: intakeForm.phone || '+91 98000-00000',
      email: intakeForm.email || '',
      previousHospital: intakeForm.previousHospital || 'None / Direct OPD Walk-in',
      age: parseInt(intakeForm.age, 10) || currentPatient?.age || 40,
      gender: intakeForm.gender || currentPatient?.gender || 'Male',
      bloodGroup: intakeForm.bloodGroup || currentPatient?.bloodGroup || 'O+',
      dob: intakeForm.dob || '',
      weight: intakeForm.weight || '',
      height: intakeForm.height || '',
      bmi: bmiData ? `${bmiData.value} kg/m² (${bmiData.category})` : null,
      abhaId: currentPatient?.abhaId || (abhaInput ? abhaInput : '91-0000-1111-2222'),
      state: currentPatient?.state || 'Delhi',
      district: currentPatient?.district || 'Central',
      avatar: currentPatient?.avatar || (intakeForm.gender === 'Female' ? '👩' : '🧑')
    };
    setCurrentPatient(updated);
    setIsConsentModalOpen(true);
  };

  // Handle Consent Agreement
  const handleAcceptConsent = (consents) => {
    setHasGrantedConsent(true);
    setIsConsentModalOpen(false);
    setCurrentStep(2); // Move to history taking

    // Audio greeting
    const pName = currentPatient?.name || intakeForm.name || 'Patient';
    const welcome = selectedLanguage === 'hi-IN'
      ? `स्वागत है ${pName}। कृपया अपनी मुख्य बीमारी या लक्षण चुनें।`
      : `Welcome ${pName}. Please select or speak your primary health symptom.`;
    speechService.speak(welcome, selectedLanguage);
  };

  // ── Voice Interview Mode Handlers ──────────────────────────────────────────
  const startVoiceInterview = () => {
    setVoiceInterviewActive(true);
    setVoiceInterviewStep(0);
    setVoiceInterviewTranscript('');
    setVoiceInterviewStatus('idle');
    // Small delay then speak first question
    setTimeout(() => speakVoiceInterviewQuestion(0), 400);
  };

  const stopVoiceInterview = () => {
    speechService.stopSpeaking();
    speechService.stopListening();
    setVoiceInterviewActive(false);
    setVoiceInterviewStatus('idle');
    setVoiceInterviewTranscript('');
  };

  const speakVoiceInterviewQuestion = (stepIdx) => {
    const field = VOICE_INTERVIEW_FIELDS[stepIdx];
    if (!field) return;
    const q = selectedLanguage === 'hi-IN' ? field.questionHi : field.questionEn;
    setVoiceInterviewStatus('speaking');
    setVoiceInterviewTranscript('');
    speechService.speak(q, selectedLanguage, () => {
      // After speaking, start listening
      setVoiceInterviewStatus('listening');
      listenForVoiceAnswer(stepIdx);
    });
  };

  const listenForVoiceAnswer = (stepIdx) => {
    const field = VOICE_INTERVIEW_FIELDS[stepIdx];
    let finalAnswer = '';
    speechService.startListening({
      onTranscript: ({ final, interim }) => {
        const spoken = final || interim;
        setVoiceInterviewTranscript(spoken);
        if (final) finalAnswer = final;
      },
      onError: () => {
        setVoiceInterviewStatus('listening');
      },
      onEnd: () => {
        const answer = field.parse(finalAnswer || voiceInterviewTranscript || '');
        if (answer) {
          setIntakeForm(prev => ({ ...prev, [field.id]: answer }));
        }
        const nextStep = stepIdx + 1;
        if (nextStep >= VOICE_INTERVIEW_FIELDS.length) {
          // All fields done
          setVoiceInterviewStatus('done');
          const doneMsg = selectedLanguage === 'hi-IN'
            ? 'शुक्रिया! सभी जानकारी भर दी गई है।'
            : 'Thank you! All details have been recorded. Please review the form and proceed.';
          speechService.speak(doneMsg, selectedLanguage, () => {
            setVoiceInterviewActive(false);
            setVoiceInterviewStatus('idle');
          });
        } else {
          setVoiceInterviewStep(nextStep);
          setTimeout(() => speakVoiceInterviewQuestion(nextStep), 700);
        }
      }
    });
  };

  const skipCurrentVoiceField = () => {
    speechService.stopListening();
    speechService.stopSpeaking();
    const nextStep = voiceInterviewStep + 1;
    if (nextStep >= VOICE_INTERVIEW_FIELDS.length) {
      setVoiceInterviewActive(false);
      setVoiceInterviewStatus('idle');
    } else {
      setVoiceInterviewStep(nextStep);
      setTimeout(() => speakVoiceInterviewQuestion(nextStep), 400);
    }
  };

  const repeatCurrentVoiceQuestion = () => {
    speechService.stopListening();
    setTimeout(() => speakVoiceInterviewQuestion(voiceInterviewStep), 200);
  };

  // Voice Recognition Handler
  const toggleVoiceInput = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      setTranscript('');
      speechService.startListening({
        onTranscript: ({ final, interim }) => {
          const spoken = final || interim;
          setTranscript(spoken);

          // Simple keyword detection for chief complaints
          const lower = spoken.toLowerCase();
          if (lower.includes('chest') || lower.includes('छाती') || lower.includes('heart') || lower.includes('दर्द')) {
            setChiefComplaint('chest_pain');
          } else if (lower.includes('breath') || lower.includes('सांस') || lower.includes('दमा')) {
            setChiefComplaint('breathlessness');
          } else if (lower.includes('fever') || lower.includes('बुखार') || lower.includes('ताप')) {
            setChiefComplaint('fever_chills');
          } else if (lower.includes('stomach') || lower.includes('पेट')) {
            setChiefComplaint('abdominal_pain');
          }
        },
        onError: () => setIsListening(false),
        onEnd: () => setIsListening(false)
      });
    }
  };

  // Read current question audio
  const playCurrentQuestionAudio = (promptEn, promptHi) => {
    const text = selectedLanguage === 'hi-IN' ? promptHi : promptEn;
    setIsSpeaking(true);
    speechService.speak(text, selectedLanguage, () => setIsSpeaking(false));
  };

  // Handle Answer Selection
  const handleSelectOption = (questionId, value, isMultiSelect = false) => {
    if (isMultiSelect) {
      setHistoryAnswers(prev => {
        const currentList = Array.isArray(prev[questionId]) ? prev[questionId] : [];
        const nextList = currentList.includes(value)
          ? currentList.filter(v => v !== value)
          : [...currentList, value];
        return { ...prev, [questionId]: nextList };
      });
    } else {
      setHistoryAnswers(prev => ({ ...prev, [questionId]: value }));
    }
  };

  const handleSelectAyushOption = (questionId, value, isMultiSelect = false) => {
    if (isMultiSelect) {
      setAyushAnswers(prev => {
        const currentList = Array.isArray(prev[questionId]) ? prev[questionId] : [];
        const nextList = currentList.includes(value)
          ? currentList.filter(v => v !== value)
          : [...currentList, value];
        return { ...prev, [questionId]: nextList };
      });
    } else {
      setAyushAnswers(prev => ({ ...prev, [questionId]: value }));
    }
  };

  // Final Step: Generate Summary & Token
  const handleCompleteIntake = () => {
    const summary = buildClinicalSummary({
      patient: currentPatient,
      chiefComplaint,
      historyAnswers,
      isAyushMode,
      ayushAnswers,
      scannedDocuments
    });

    const fhirBundle = generateFhirR4Bundle(summary);
    const completePackage = {
      ...summary,
      fhirBundle
    };

    setGeneratedSummary(completePackage);
    setCurrentStep(4);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }

    // Play bilingual confirmation audio
    const confirmAudio = selectedLanguage === 'hi-IN'
      ? summary.bilingualPatientConfirmation.hi
      : summary.bilingualPatientConfirmation.en;
    speechService.speak(confirmAudio, selectedLanguage);

    // Push to OPD queue for the Doctor Console
    if (onPatientSubmittedToQueue) {
      onPatientSubmittedToQueue(completePackage);
    }
  };

  // Reset Kiosk for Next Patient
  const handleResetKiosk = () => {
    speechService.stopSpeaking();
    speechService.stopListening();
    setCurrentStep(1);
    setIntakeTab('form');
    setHasGrantedConsent(false);
    setHistoryAnswers({});
    setAyushAnswers({});
    setScannedDocuments([]);
    setGeneratedSummary(null);
    setTranscript('');
    setRedFlagData(null);
    handleClearIntakeForm();
  };

  // Get active questions based on chief complaint
  const activeQuestions = SOCRATES_QUESTIONS[chiefComplaint] || SOCRATES_QUESTIONS.chest_pain;

  // Current voice interview field
  const currentVoiceField = VOICE_INTERVIEW_FIELDS[voiceInterviewStep];

  return (
    <div className="kiosk-main-content">

      {/* ── VOICE INTERVIEW OVERLAY ─────────────────────────────────── */}
      {voiceInterviewActive && currentVoiceField && (
        <div className="voice-interview-overlay">
          <div className="voice-interview-panel">
            {/* Badge */}
            <div className="voice-interview-step-badge">
              <Mic size={12} />
              AI Voice Interview &nbsp;·&nbsp; Question {voiceInterviewStep + 1} of {VOICE_INTERVIEW_FIELDS.length}
            </div>

            {/* Progress dots */}
            <div className="voice-progress-dots">
              {VOICE_INTERVIEW_FIELDS.map((_, i) => (
                <div
                  key={i}
                  className={`voice-progress-dot ${i < voiceInterviewStep ? 'done' : i === voiceInterviewStep ? 'current' : ''}`}
                />
              ))}
            </div>

            {/* Question text */}
            <div className="voice-interview-question">
              {selectedLanguage === 'hi-IN' ? currentVoiceField.questionHi : currentVoiceField.questionEn}
            </div>
            {selectedLanguage !== 'hi-IN' && (
              <div className="voice-interview-question-hi">{currentVoiceField.questionHi}</div>
            )}

            {/* Speaking indicator */}
            {voiceInterviewStatus === 'speaking' && (
              <div className="voice-speaking-indicator">
                <div className="voice-speaking-dot" />
                <div className="voice-speaking-dot" />
                <div className="voice-speaking-dot" />
                <span style={{ marginLeft: '0.4rem' }}>AI is speaking…</span>
              </div>
            )}

            {/* Mic orb */}
            <div className="voice-mic-orb-wrap">
              {voiceInterviewStatus === 'listening' && (
                <>
                  <div className="voice-mic-ripple" />
                  <div className="voice-mic-ripple" />
                  <div className="voice-mic-ripple" />
                </>
              )}
              <div className={`voice-mic-orb ${voiceInterviewStatus === 'listening' ? 'listening' : ''}`}>
                {voiceInterviewStatus === 'listening'
                  ? <MicOff size={30} color="white" />
                  : <Mic size={30} color="white" />}
              </div>
            </div>

            {/* Waveform (listening) */}
            {voiceInterviewStatus === 'listening' && (
              <div className="voice-waveform">
                {[1,2,3,4,5,6,7].map(i => (
                  <div key={i} className="voice-waveform-bar" />
                ))}
              </div>
            )}

            {/* Live transcript */}
            <div className="voice-transcript-bubble">
              {voiceInterviewTranscript
                ? voiceInterviewTranscript
                : (
                  <span style={{ color: '#475569', fontStyle: 'normal', fontSize: '0.88rem' }}>
                    {voiceInterviewStatus === 'speaking'
                      ? 'Please wait while the question is being read…'
                      : voiceInterviewStatus === 'listening'
                      ? 'Listening… speak your answer now'
                      : currentVoiceField.hintEn}
                  </span>
                )}
            </div>

            {/* Action buttons */}
            <div className="voice-interview-actions">
              <button
                type="button"
                className="voice-btn-secondary"
                onClick={repeatCurrentVoiceQuestion}
                title="Repeat the question"
              >
                <RefreshCw size={15} /> Repeat Question
              </button>
              <button
                type="button"
                className="voice-btn-secondary"
                onClick={skipCurrentVoiceField}
                title="Skip this field and go to next"
              >
                <ArrowRight size={15} /> Skip
              </button>
              <button
                type="button"
                className="voice-btn-primary"
                onClick={stopVoiceInterview}
              >
                <MicOff size={15} /> Exit Voice Mode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kiosk Stepper */}
      <div className="kiosk-stepper" style={{ borderRadius: '16px', marginBottom: '1.75rem' }}>
        <div className={`step-item ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-labels">
            <span className="step-title">Identify & Consent</span>
            <span className="step-sub">ABHA ID & DPDP</span>
          </div>
        </div>

        <div style={{ width: '40px', height: '2px', background: 'var(--border-color)' }} />

        <div className={`step-item ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-labels">
            <span className="step-title">Voice & Touch History</span>
            <span className="step-sub">{isAyushMode ? 'Dashavidha Pariksha' : 'SOCRATES Reasoning'}</span>
          </div>
        </div>

        <div style={{ width: '40px', height: '2px', background: 'var(--border-color)' }} />

        <div className={`step-item ${currentStep === 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-labels">
            <span className="step-title">Scan Records</span>
            <span className="step-sub">OCR & Lab Highlighting</span>
          </div>
        </div>

        <div style={{ width: '40px', height: '2px', background: 'var(--border-color)' }} />

        <div className={`step-item ${currentStep === 4 ? 'active' : ''}`}>
          <div className="step-number">4</div>
          <div className="step-labels">
            <span className="step-title">OPD Token</span>
            <span className="step-sub">Summary & Routing</span>
          </div>
        </div>
      </div>

      {/* STEP 1: IDENTIFY & DPDP CONSENT */}
      {currentStep === 1 && (
        <div className="glass-card glow-emerald">
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 1.5rem' }}>
            <span className="badge-abdm" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
              STEP 1 OF 4 • PATIENT REGISTRATION & INTAKE
            </span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
              {selectedLanguage === 'hi-IN' ? 'मरीज पंजीकरण एवं प्राथमिक बायोमेट्रिक्स' : 'Patient Registration & Demographic Intake'}
            </h2>
            <p style={{ color: 'var(--txt-2)', fontSize: '0.92rem', marginTop: '0.4rem' }}>
              Enter or verify patient demographics, communication channels, prior hospital referral, and physical vitals.
            </p>
          </div>

          {/* Intake Mode Switcher Tabs */}
          <div className="intake-tab-container">
            <button
              type="button"
              className={`intake-tab-btn ${intakeTab === 'form' ? 'active' : ''}`}
              onClick={() => setIntakeTab('form')}
            >
              <Edit3 size={17} />
              <span>1. Manual Intake & Vitals Form (10 Fields)</span>
            </button>
            <button
              type="button"
              className={`intake-tab-btn ${intakeTab === 'abha' ? 'active' : ''}`}
              onClick={() => setIntakeTab('abha')}
            >
              <ShieldCheck size={17} style={{ color: (currentPatient?.isAadhaarVerified || currentPatient?.isAbhaVerified) ? '#10b981' : '#38bdf8' }} />
              <span>2. Aadhaar & ABHA Verification (UIDAI / ABDM)</span>
              {(currentPatient?.isAadhaarVerified || currentPatient?.isAbhaVerified) && (
                <span style={{ background: '#10b981', color: 'white', fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '10px', marginLeft: '0.4rem', fontWeight: 800 }}>
                  VERIFIED
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: FULL PATIENT INTAKE FORM */}
          {intakeTab === 'form' && (
            <div>
              {/* Fast-track verification banner */}
              {currentPatient?.isAadhaarVerified ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', padding: '0.65rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={18} />
                    <span><strong>Aadhaar e-KYC Verified:</strong> {currentPatient.name} (UID: {currentPatient.aadhaarNumber})</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>UIDAI e-KYC Authenticated</span>
                </div>
              ) : (
                <div style={{ background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.12), rgba(16, 185, 129, 0.12))', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '12px', padding: '0.65rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#f8fafc' }}>
                    <ShieldCheck size={18} style={{ color: '#38bdf8' }} />
                    <span>Have an Aadhaar or ABHA Card? Fast-track registration with official UIDAI/ABDM verification.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIntakeTab('abha')}
                    style={{ background: '#0284c7', border: 'none', color: 'white', padding: '0.35rem 0.8rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Verify Aadhaar / ABHA
                  </button>
                </div>
              )}
              <div className="intake-form-grid">
                {/* Left Card: Personal & Contact Information */}
                <div className="form-group-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={18} style={{ color: '#38bdf8' }} />
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        1. Personal Demographics & Contact
                      </span>
                    </div>
                    {/* Voice Interview Trigger */}
                    <button
                      type="button"
                      className="voice-interview-trigger-btn"
                      onClick={startVoiceInterview}
                      title="Fill entire form by speaking — AI will ask each question aloud"
                    >
                      <Mic size={15} className="mic-icon-anim" />
                      <span>🎙️ Voice Fill Form</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearIntakeForm}
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#f87171',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.2s'
                      }}
                      title="Clear all fields"
                    >
                      <RotateCcw size={13} />
                      <span>Clear Form</span>
                    </button>
                  </div>

                  {/* 1. Full Name */}
                  <div className="form-field">
                    <label className="form-field-label">
                      <User size={14} /> Full Name (मरीज का नाम) *
                    </label>
                    <div className="form-input-wrapper">
                      <User size={17} className="form-input-icon" />
                      <input
                        type="text"
                        className="form-input-field"
                        placeholder="e.g. Rameshwar Prasad Sharma"
                        value={intakeForm.name}
                        onChange={(e) => setIntakeForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* 2. Phone Number */}
                  <div className="form-field">
                    <label className="form-field-label">
                      <Phone size={14} /> Phone Number (मोबाइल नंबर) *
                    </label>
                    <div className="form-input-wrapper">
                      <Phone size={17} className="form-input-icon" />
                      <input
                        type="tel"
                        className="form-input-field"
                        placeholder="+91 98765-43210"
                        value={intakeForm.phone}
                        onChange={(e) => setIntakeForm(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* 3. Email Address */}
                  <div className="form-field">
                    <label className="form-field-label">
                      <Mail size={14} /> Email Address (ईमेल पता)
                    </label>
                    <div className="form-input-wrapper">
                      <Mail size={17} className="form-input-icon" />
                      <input
                        type="email"
                        className="form-input-field"
                        placeholder="patient@abdm.gov.in"
                        value={intakeForm.email}
                        onChange={(e) => setIntakeForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* 4. Previous Hospital */}
                  <div className="form-field">
                    <label className="form-field-label">
                      <Building2 size={14} /> Previous Hospital / Referring Clinic (पूर्व अस्पताल)
                    </label>
                    <div className="form-input-wrapper">
                      <Building2 size={17} className="form-input-icon" />
                      <input
                        type="text"
                        list="hospitals-list"
                        className="form-input-field"
                        placeholder="e.g. AIIMS New Delhi / Safdarjung / Walk-in"
                        value={intakeForm.previousHospital}
                        onChange={(e) => setIntakeForm(prev => ({ ...prev, previousHospital: e.target.value }))}
                      />
                      <datalist id="hospitals-list">
                        <option value="AIIMS New Delhi (Cardiology)" />
                        <option value="Safdarjung Hospital" />
                        <option value="National Institute of Ayurveda, Jaipur" />
                        <option value="Max Super Speciality Hospital" />
                        <option value="Apollo Hospitals" />
                        <option value="District Civil Hospital" />
                        <option value="None / Direct OPD Walk-in" />
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* Right Card: Demographics, Physical Vitals & BMI */}
                <div className="form-group-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <Activity size={18} style={{ color: '#10b981' }} />
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      2. Demographics & Physical Vitals
                    </span>
                  </div>

                  {/* 5. Date of Birth & 6. Age */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.75rem' }} className="form-field">
                    <div>
                      <label className="form-field-label">
                        <Calendar size={14} /> Date of Birth (DOB)
                      </label>
                      <div className="form-input-wrapper">
                        <Calendar size={17} className="form-input-icon" />
                        <input
                          type="date"
                          className="form-input-field"
                          value={intakeForm.dob}
                          onChange={handleDobChange}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-field-label">Age (आयु)</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        className="form-input-field"
                        style={{ paddingLeft: '1rem' }}
                        placeholder="Age"
                        value={intakeForm.age}
                        onChange={(e) => setIntakeForm(prev => ({ ...prev, age: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* 7. Gender */}
                  <div className="form-field">
                    <label className="form-field-label">Gender (लिंग)</label>
                    <div className="gender-selector-group">
                      {['Male', 'Female', 'Other'].map(g => (
                        <button
                          key={g}
                          type="button"
                          className={`gender-btn ${intakeForm.gender === g ? 'active' : ''}`}
                          onClick={() => setIntakeForm(prev => ({ ...prev, gender: g }))}
                        >
                          {g === 'Male' ? '👨 Male' : (g === 'Female' ? '👩 Female' : '⚧ Other')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 8. Blood Group */}
                  <div className="form-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label className="form-field-label" style={{ marginBottom: 0 }}>
                        <Droplet size={14} style={{ color: '#ef4444' }} /> Blood Group (रक्त समूह)
                      </label>
                      {intakeForm.bloodGroup && (
                        <span style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 800, background: 'rgba(239, 68, 68, 0.15)', padding: '0.1rem 0.5rem', borderRadius: '6px' }}>
                          Selected: {intakeForm.bloodGroup}
                        </span>
                      )}
                    </div>
                    <div className="blood-group-grid">
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <button
                          key={bg}
                          type="button"
                          className={`blood-btn ${intakeForm.bloodGroup === bg ? 'active' : ''}`}
                          onClick={() => setIntakeForm(prev => ({ ...prev, bloodGroup: bg }))}
                        >
                          {bg}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 9. Weight & 10. Height */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="form-field">
                    <div>
                      <label className="form-field-label">
                        <Scale size={14} /> Weight (वजन)
                      </label>
                      <div className="form-input-wrapper">
                        <Scale size={17} className="form-input-icon" />
                        <input
                          type="number"
                          step="0.5"
                          min="10"
                          max="250"
                          className="form-input-field"
                          placeholder="e.g. 74.5 kg"
                          value={intakeForm.weight}
                          onChange={(e) => setIntakeForm(prev => ({ ...prev, weight: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-field-label">
                        <Ruler size={14} /> Height (लंबाई)
                      </label>
                      <div className="form-input-wrapper">
                        <Ruler size={17} className="form-input-icon" />
                        <input
                          type="number"
                          step="1"
                          min="50"
                          max="250"
                          className="form-input-field"
                          placeholder="e.g. 172 cm"
                          value={intakeForm.height}
                          onChange={(e) => setIntakeForm(prev => ({ ...prev, height: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Smart Real-time BMI Card */}
                  {(() => {
                    const bmi = calculateBmi(intakeForm.weight, intakeForm.height);
                    return (
                      <div className="bmi-smart-card" style={{ marginTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          LIVE BODY MASS INDEX (BMI)
                        </div>
                        <div className="bmi-value-large" style={{ color: bmi ? bmi.color : '#94a3b8' }}>
                          {bmi ? `${bmi.value}` : '--.-'}
                          <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>kg/m²</span>
                        </div>
                        <div className={`bmi-status-pill ${bmi ? bmi.statusClass : 'normal'}`}>
                          <span>{bmi ? `● ${bmi.category} BMI` : 'Enter Weight & Height'}</span>
                        </div>
                        <div className="bmi-meter-bar">
                          <div className={`bmi-meter-segment ${bmi && bmi.segmentIndex === 0 ? 'active' : ''}`} style={{ background: '#fbbf24' }} title="Underweight (<18.5)" />
                          <div className={`bmi-meter-segment ${bmi && bmi.segmentIndex === 1 ? 'active' : ''}`} style={{ background: '#34d399' }} title="Normal (18.5-24.9)" />
                          <div className={`bmi-meter-segment ${bmi && bmi.segmentIndex === 2 ? 'active' : ''}`} style={{ background: '#fb923c' }} title="Overweight (25-29.9)" />
                          <div className={`bmi-meter-segment ${bmi && bmi.segmentIndex === 3 ? 'active' : ''}`} style={{ background: '#f87171' }} title="Obese (≥30)" />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          <span>Underweight</span>
                          <span>Normal</span>
                          <span>Overweight</span>
                          <span>Obese</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Form Navigation Action Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIntakeTab('abha')}
                  style={{
                    background: 'rgba(2, 132, 199, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#38bdf8',
                    padding: '0.8rem 1.4rem',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <QrCode size={18} />
                  <span>Auto-Fill from ABHA ID / QR Card</span>
                </button>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleClearIntakeForm}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: '#f87171',
                      padding: '0.85rem 1.4rem',
                      borderRadius: '14px',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s'
                    }}
                    title="Clear all fields"
                  >
                    <RotateCcw size={16} />
                    <span>Clear All Inputs</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleProceedFromIntake}
                    style={{
                      background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
                      border: 'none',
                      color: 'white',
                      padding: '0.9rem 2.5rem',
                      borderRadius: '14px',
                      fontWeight: 700,
                      fontSize: '1.05rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    <span>Review Privacy & Proceed</span>
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AADHAAR & ABHA VERIFICATION GATEWAY */}
          {intakeTab === 'abha' && (
            <div>
              <AadhaarAbhaVerificationPortal
                currentPatient={currentPatient}
                onVerificationComplete={handleVerificationComplete}
                intakeForm={intakeForm}
                selectedLanguage={selectedLanguage}
              />

              {/* Action Buttons for Verification Tab */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIntakeTab('form')}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: '#f8fafc',
                    padding: '0.8rem 1.4rem',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Edit3 size={18} />
                  <span>Review / Edit in Intake Form</span>
                </button>

                <button
                  onClick={handleProceedFromIntake}
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
                    border: 'none',
                    color: 'white',
                    padding: '0.9rem 2.5rem',
                    borderRadius: '14px',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <span>Review Privacy & Proceed</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: CONVERSATIONAL HISTORY TAKING (MODULE A) */}
      {currentStep === 2 && (
        <div className="glass-card">
          {/* Audio Prompt Banner */}
          <div className="audio-prompt-banner">
            <div className="audio-prompt-text">
              <Volume2 size={24} style={{ color: '#10b981' }} />
              <span>
                {selectedLanguage === 'hi-IN'
                  ? 'अपनी मुख्य शिकायत चुनें या माइक दबाकर बोलें:'
                  : 'Select your presenting complaint or press microphone to speak:'}
              </span>
            </div>
            <button
              className="btn-audio-listen"
              onClick={() => playCurrentQuestionAudio(
                'Please select your chief medical complaint or describe your symptoms naturally.',
                'कृपया अपनी मुख्य बीमारी चुनें या स्वाभाविक रूप से बताएं।'
              )}
            >
              <Volume2 size={16} />
              <span>{selectedLanguage === 'hi-IN' ? 'सवाल सुनें' : 'Listen Question'}</span>
            </button>
          </div>

          {/* Chief Complaints Selection Grid */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                {isAyushMode ? '🌿 Ayurvedic Roga Nidana Complaints:' : '1. Select Chief Presenting Complaint:'}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Dual-mode: Tap any card OR speak aloud into microphone
              </span>
            </div>

            <div className="touch-options-grid">
              {(isAyushMode ? AYUSH_CHIEF_COMPLAINTS : CHIEF_COMPLAINTS).map((item) => {
                const isSelected = chiefComplaint === item.id;
                return (
                  <button
                    key={item.id}
                    className={`touch-card-btn ${isSelected ? 'selected' : ''} ${item.redFlagSuspect ? 'red-flag-indicator' : ''}`}
                    onClick={() => setChiefComplaint(item.id)}
                  >
                    <div className="touch-card-title">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {iconMap[item.icon] || <Leaf size={20} style={{ color: '#f59e0b' }} />}
                        <span>{item.name}</span>
                      </div>
                      {isSelected && <CheckCircle size={20} style={{ color: '#10b981' }} />}
                    </div>
                    <div className="touch-card-desc">
                      {item.description || (item.dosha ? `Dosha: ${item.dosha}` : '')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice Action Dock with Live Waveform */}
          <div className="voice-action-dock">
            <button
              className={`btn-big-mic ${isListening ? 'recording' : ''}`}
              onClick={toggleVoiceInput}
              title={isListening ? 'Stop Recording' : 'Start Voice History Taking'}
            >
              {isListening ? <MicOff size={34} /> : <Mic size={34} />}
            </button>
            <div className="mic-caption">
              {isListening 
                ? (selectedLanguage === 'hi-IN' ? 'सुन रहा हूँ... अपनी भाषा में बोलें' : 'Listening... Speak naturally in your accent') 
                : (selectedLanguage === 'hi-IN' ? 'माइक दबाएं और अपनी बीमारी बताएं' : 'Tap to speak your symptoms')}
            </div>

            {/* Animated Waveform */}
            <div className={`waveform-container ${isListening ? 'listening' : ''}`}>
              {[...Array(7)].map((_, i) => (
                <div key={i} className="waveform-bar" />
              ))}
            </div>

            {transcript && (
              <div className="live-transcript-box">
                <span style={{ color: '#38bdf8', fontWeight: 600, marginRight: '0.5rem' }}>Recognized:</span>
                "{transcript}"
              </div>
            )}
          </div>

          {/* SOCRATES & AYUSH Reasoning Tabs */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.75rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button
                onClick={() => setActiveTab('socrates')}
                style={{
                  background: activeTab === 'socrates' ? 'var(--primary-600)' : 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-color)',
                  color: 'white',
                  padding: '0.5rem 1.2rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                SOCRATES Clinical Branching (HPI)
              </button>

              {isAyushMode && (
                <button
                  onClick={() => setActiveTab('ayush')}
                  style={{
                    background: activeTab === 'ayush' ? 'linear-gradient(135deg, var(--ayush-600), var(--ayush-accent))' : 'var(--bg-surface-elevated)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: activeTab === 'ayush' ? 'white' : '#fbbf24',
                    padding: '0.5rem 1.2rem',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  🌿 Dashavidha Pariksha & Prakriti
                </button>
              )}

              <button
                onClick={() => setActiveTab('ros')}
                style={{
                  background: activeTab === 'ros' ? 'var(--primary-600)' : 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-color)',
                  color: 'white',
                  padding: '0.5rem 1.2rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Comorbidities & Review of Systems (ROS)
              </button>
            </div>

            {/* TAB: SOCRATES Clinical Branching */}
            {activeTab === 'socrates' && (
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', color: '#e2e8f0' }}>
                  Targeted Clinical Questions for {chiefComplaint.replace('_', ' ').toUpperCase()}:
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {activeQuestions.map((q, idx) => (
                    <div 
                      key={q.id}
                      style={{ 
                        background: 'var(--bg-surface-elevated)', 
                        padding: '1.25rem', 
                        borderRadius: '14px', 
                        border: '1px solid var(--border-color)' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ 
                            background: 'rgba(16, 185, 129, 0.2)', 
                            color: '#10b981', 
                            fontSize: '0.75rem', 
                            padding: '0.2rem 0.6rem', 
                            borderRadius: '6px',
                            fontWeight: 700 
                          }}>
                            {q.step}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>
                            {selectedLanguage === 'hi-IN' ? q.promptHi : q.promptEn}
                          </span>
                        </div>

                        <button
                          onClick={() => playCurrentQuestionAudio(q.promptEn, q.promptHi)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#38bdf8',
                            cursor: 'pointer',
                            padding: '0.3rem'
                          }}
                          title="Listen question"
                        >
                          <Volume2 size={18} />
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                        {q.options.map((opt) => {
                          const isSelected = q.multiSelect
                            ? (Array.isArray(historyAnswers[q.id]) && historyAnswers[q.id].includes(opt.value))
                            : historyAnswers[q.id] === opt.value;

                          return (
                            <div
                              key={opt.value}
                              onClick={() => handleSelectOption(q.id, opt.value, q.multiSelect)}
                              style={{
                                background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                                border: `1px solid ${isSelected ? 'var(--primary-500)' : 'rgba(255, 255, 255, 0.08)'}`,
                                borderRadius: '10px',
                                padding: '0.85rem 1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '0.9rem',
                                fontWeight: isSelected ? 700 : 500,
                                color: isSelected ? '#f8fafc' : 'var(--text-secondary)'
                              }}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <Check size={16} style={{ color: '#10b981' }} />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: AYUSH Dashavidha Pariksha */}
            {activeTab === 'ayush' && isAyushMode && (
              <div>
                <div style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <Leaf size={24} style={{ color: '#fbbf24' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#fbbf24' }}>Ayurvedic Clinical Intake: Dashavidha Pariksha</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Evaluating Prakriti (Constitution), Agni (Digestive Fire), Koshtha (Bowel habit), and Ahara-Vihara (Lifestyle).
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {[...PRAKRITI_QUESTIONS, ...AGNI_KOSHTHA_QUESTIONS].map((q) => (
                    <div 
                      key={q.id}
                      style={{ 
                        background: 'var(--bg-surface-elevated)', 
                        padding: '1.25rem', 
                        borderRadius: '14px', 
                        border: '1px solid rgba(245, 158, 11, 0.2)' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                        <div>
                          <span style={{ 
                            background: 'rgba(245, 158, 11, 0.2)', 
                            color: '#fbbf24', 
                            fontSize: '0.75rem', 
                            padding: '0.2rem 0.6rem', 
                            borderRadius: '6px',
                            fontWeight: 700,
                            marginRight: '0.5rem' 
                          }}>
                            {q.param}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>
                            {selectedLanguage === 'hi-IN' ? q.promptHi : q.promptEn}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                        {q.options.map((opt) => {
                          const isSelected = ayushAnswers[q.id] === opt.value;
                          return (
                            <div
                              key={opt.value}
                              onClick={() => handleSelectAyushOption(q.id, opt.value)}
                              style={{
                                background: isSelected ? 'rgba(217, 119, 6, 0.25)' : 'rgba(0, 0, 0, 0.2)',
                                border: `1px solid ${isSelected ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)'}`,
                                borderRadius: '10px',
                                padding: '0.85rem 1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '0.88rem',
                                color: isSelected ? '#fff' : 'var(--text-secondary)'
                              }}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <Check size={16} style={{ color: '#fbbf24' }} />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Review of Systems */}
            {activeTab === 'ros' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {REVIEW_OF_SYSTEMS_QUESTIONS.map((q) => (
                  <div 
                    key={q.id}
                    style={{ 
                      background: 'var(--bg-surface-elevated)', 
                      padding: '1.25rem', 
                      borderRadius: '14px', 
                      border: '1px solid var(--border-color)' 
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.8rem', color: '#f8fafc' }}>
                      {selectedLanguage === 'hi-IN' ? q.promptHi : q.promptEn}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                      {q.options.map((opt) => {
                        const isSelected = q.multiSelect
                          ? (Array.isArray(historyAnswers[q.id]) && historyAnswers[q.id].includes(opt.value))
                          : historyAnswers[q.id] === opt.value;

                        return (
                          <div
                            key={opt.value}
                            onClick={() => handleSelectOption(q.id, opt.value, q.multiSelect)}
                            style={{
                              background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                              border: `1px solid ${isSelected ? 'var(--primary-500)' : 'rgba(255, 255, 255, 0.08)'}`,
                              borderRadius: '10px',
                              padding: '0.85rem 1rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '0.88rem'
                            }}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check size={16} style={{ color: '#10b981' }} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
            <button
              onClick={() => setCurrentStep(1)}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '0.85rem 1.8rem',
                borderRadius: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <ArrowLeft size={18} />
              <span>Back / वापस</span>
            </button>

            <button
              onClick={() => setCurrentStep(3)}
              style={{
                background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
                border: 'none',
                color: 'white',
                padding: '0.85rem 2.5rem',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
              }}
            >
              <span>Scan Documents / पर्चे स्कैन करें</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: MEDICAL DOCUMENT DIGITIZATION & INTELLIGENCE (MODULE B) */}
      {currentStep === 3 && (
        <div className="glass-card">
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 1.5rem' }}>
            <span className="badge-abdm" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
              STEP 3 OF 4 • REAL MULTIMODAL DOCUMENT INTELLIGENCE
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
              {selectedLanguage === 'hi-IN' ? 'पुराने मेडिकल पर्चे, लैब रिपोर्ट व पहचान पत्र स्कैन करें' : 'Real Scan of All Medical Documents & Health IDs'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.3rem' }}>
              Real live webcam scanner, any image/PDF file upload, and multimodal Indic OCR engine for prescriptions, diagnostic test panels, and Indian health cards.
            </p>
          </div>

          <DocumentScannerStation
            scannedDocuments={scannedDocuments}
            setScannedDocuments={setScannedDocuments}
            selectedLanguage={selectedLanguage}
            onImportGovtId={handleImportGovtIdFromScan}
          />

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
            <button
              onClick={() => setCurrentStep(2)}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '0.85rem 1.8rem',
                borderRadius: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <ArrowLeft size={18} />
              <span>Back / वापस</span>
            </button>

            <button
              onClick={handleCompleteIntake}
              style={{
                background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
                border: 'none',
                color: 'white',
                padding: '0.85rem 2.5rem',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
              }}
            >
              <span>Generate OPD Token & Route</span>
              <CheckCircle size={20} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SUMMARY & OPD TOKEN GENERATION (MODULE C & D) */}
      {currentStep === 4 && generatedSummary && (
        <div className="glass-card glow-emerald">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 2rem' }}>
            <span style={{ 
              background: 'rgba(16, 185, 129, 0.2)', 
              color: '#10b981', 
              fontSize: '0.8rem', 
              padding: '0.2rem 0.8rem', 
              borderRadius: '20px', 
              fontWeight: 800,
              display: 'inline-block',
              marginBottom: '0.5rem'
            }}>
              ✓ INTAKE COMPLETED & SENT TO CONSULTATION ROOM
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
              {selectedLanguage === 'hi-IN' ? 'आपका ओपीडी टोकन तैयार है' : 'Your OPD Token Is Issued!'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.3rem' }}>
              Your structured history summary and digitized documents are pushed to the doctor's consultation monitor.
            </p>
          </div>

          {/* Physical Kiosk Printout Simulation Card */}
          <div style={{
            maxWidth: '560px',
            margin: '0 auto 2rem',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '2px dashed var(--primary-500)',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase' }}>
                  GOVERNMENT OF INDIA • OPD TOKEN
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>
                  Apex Civil Hospital & AYUSH Center
                </div>
              </div>
              <QrCode size={38} style={{ color: '#38bdf8' }} />
            </div>

            <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>YOUR APPOINTMENT TOKEN</div>
              <div style={{ fontSize: '3.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#10b981', letterSpacing: '0.05em' }}>
                {generatedSummary.tokenNumber}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#38bdf8', fontWeight: 600 }}>
                {generatedSummary.department}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Patient Name:</span>
                <div style={{ fontWeight: 700 }}>{generatedSummary.patientName}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>ABHA ID:</span>
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{generatedSummary.abhaId}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Blood Group (रक्त समूह):</span>
                <div style={{ fontWeight: 800, color: '#f87171' }}>🩸 {generatedSummary.bloodGroup || 'O+'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Age / Gender:</span>
                <div style={{ fontWeight: 700 }}>{generatedSummary.ageGender}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Estimated Wait:</span>
                <div style={{ fontWeight: 700, color: '#fbbf24' }}>~ 8 Minutes (Queue: 2 ahead)</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Consultation Room:</span>
                <div style={{ fontWeight: 700, color: '#10b981' }}>Room 14 (Dr. Sharma)</div>
              </div>
            </div>

            {/* Red Flag indicator on token if severe */}
            {generatedSummary.redFlagAnalysis?.hasRedFlag && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '10px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: '#fca5a5',
                fontSize: '0.82rem',
                fontWeight: 700
              }}>
                <AlertCircle size={18} />
                <span>RED-FLAG PRIORITY: Please proceed directly to Casualty / Priority Triage.</span>
              </div>
            )}
          </div>

          {/* Bilingual Audio Confirmation Box */}
          <div style={{
            maxWidth: '560px',
            margin: '0 auto 2rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Volume2 size={22} style={{ color: '#10b981' }} />
              <div style={{ fontSize: '0.88rem', color: '#e2e8f0' }}>
                {selectedLanguage === 'hi-IN'
                  ? generatedSummary.bilingualPatientConfirmation.hi
                  : generatedSummary.bilingualPatientConfirmation.en}
              </div>
            </div>
          </div>

          {/* Reset Kiosk Button for Next Patient */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleResetKiosk}
              style={{
                background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
                border: 'none',
                color: 'white',
                padding: '0.9rem 2.5rem',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
              }}
            >
              Finish & Clear Kiosk for Next Patient (अगला मरीज)
            </button>
          </div>
        </div>
      )}

      {/* Consent Modal */}
      <ConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
        onAcceptConsent={handleAcceptConsent}
        language={selectedLanguage}
      />

      {/* Red Flag Emergency Siren Modal */}
      {showRedFlagModal && (
        <RedFlagModal
          redFlagData={redFlagData}
          onClose={() => setShowRedFlagModal(false)}
          language={selectedLanguage}
        />
      )}
    </div>
  );
}
