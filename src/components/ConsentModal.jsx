import React, { useState } from 'react';
import { ShieldCheck, Volume2, CheckCircle2, Lock, FileText, Info, X } from 'lucide-react';
import { DPDP_CONSENT_TERMS } from '../modules/abdmConsent/dpdpConsent';
import { speechService } from '../modules/historyEngine/speechService';

export function ConsentModal({ isOpen, onClose, onAcceptConsent, language = 'en-IN' }) {
  const [consents, setConsents] = useState({
    clinical_intake: true,
    document_ocr: true,
    abdm_link: true
  });

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!isOpen) return null;

  const toggleConsent = (id) => {
    if (id === 'clinical_intake') return; // Mandatory for kiosk intake
    setConsents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const playConsentAudio = () => {
    if (isPlayingAudio) {
      speechService.stopSpeaking();
      setIsPlayingAudio(false);
      return;
    }

    const textToSpeak = language === 'hi-IN' 
      ? DPDP_CONSENT_TERMS.audioPromptHi 
      : DPDP_CONSENT_TERMS.audioPromptEn;

    setIsPlayingAudio(true);
    speechService.speak(textToSpeak, language, () => {
      setIsPlayingAudio(false);
    });
  };

  const handleConfirm = () => {
    speechService.stopSpeaking();
    onAcceptConsent(consents);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Header */}
        <div style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.95)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.2)',
              padding: '0.6rem',
              borderRadius: '12px',
              color: '#10b981'
            }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>
                DPDP ACT 2023 & ABDM COMPLIANCE
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.1rem 0 0' }}>
                {language === 'hi-IN' ? 'डिजिटल स्वास्थ्य डेटा सहमति' : 'Digital Health Data Consent'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.4rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '2rem' }}>
          {/* Audio Assist Banner for Low-literacy / Elderly */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(16, 185, 129, 0.15))',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '14px',
            padding: '1.1rem 1.4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Volume2 size={24} style={{ color: '#38bdf8' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {language === 'hi-IN' ? 'ऑडियो सहायता सुनें (Audio Guidance)' : 'Listen to Consent in Spoken Audio'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {language === 'hi-IN' ? 'आवाज में सहमति की शर्तें सुनने के लिए क्लिक करें' : 'Tap to hear the privacy terms read aloud in your language'}
                </div>
              </div>
            </div>

            <button
              onClick={playConsentAudio}
              style={{
                background: isPlayingAudio ? 'var(--danger-600)' : 'var(--abdm-blue)',
                border: 'none',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Volume2 size={16} />
              <span>{isPlayingAudio ? 'Stop Audio' : 'Play Audio'}</span>
            </button>
          </div>

          {/* Granular Purpose Checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
            {DPDP_CONSENT_TERMS.purposes.map(purpose => {
              const isChecked = consents[purpose.id];
              return (
                <div
                  key={purpose.id}
                  onClick={() => toggleConsent(purpose.id)}
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: `1px solid ${isChecked ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-color)'}`,
                    borderRadius: '14px',
                    padding: '1rem 1.25rem',
                    cursor: purpose.mandatory ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    background: isChecked ? 'var(--primary-600)' : 'transparent',
                    border: `2px solid ${isChecked ? 'var(--primary-500)' : 'var(--text-muted)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    marginTop: '2px',
                    flexShrink: 0
                  }}>
                    {isChecked && <CheckCircle2 size={16} />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>
                        {language === 'hi-IN' ? purpose.titleHi : purpose.titleEn}
                      </span>
                      {purpose.mandatory && (
                        <span style={{ fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          Mandatory
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {language === 'hi-IN' ? purpose.descriptionHi : purpose.descriptionEn}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Security Features */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1rem',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: 700 }}>
              <Lock size={14} />
              <span>DPDP 2023 & ABDM Privacy Guarantees:</span>
            </div>
            {DPDP_CONSENT_TERMS.securityGuarantees.map((g, idx) => (
              <div key={idx}>• {g}</div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.75rem' }}>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '0.75rem 1.4rem',
                borderRadius: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel / रद्द करें
            </button>
            <button
              onClick={handleConfirm}
              style={{
                background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
                border: 'none',
                color: 'white',
                padding: '0.75rem 2rem',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)'
              }}
            >
              <ShieldCheck size={18} />
              <span>{language === 'hi-IN' ? 'सहमति दें और आगे बढ़ें' : 'Grant Consent & Proceed'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
