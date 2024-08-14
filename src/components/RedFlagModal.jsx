import React, { useEffect } from 'react';
import { AlertOctagon, Siren, ArrowRightCircle, PhoneCall, ShieldAlert, X } from 'lucide-react';
import { speechService } from '../modules/historyEngine/speechService';

export function RedFlagModal({ redFlagData, onClose, language = 'en-IN' }) {
  const primaryFlag = redFlagData?.flags?.[0] || {
    condition: 'Life-Threatening Emergency Detected',
    protocol: 'STAT EMERGENCY ROOM CASUALTY DIVERSION',
    actionRequired: 'Proceed immediately to Casualty Desk 1.'
  };

  useEffect(() => {
    if (!redFlagData || !redFlagData.hasRedFlag) return;

    // Announce red flag warning
    const prompt = language === 'hi-IN' 
      ? primaryFlag.voiceAlertHi || 'आपातकालीन चेतावनी! कृपया तुरंत इमरजेंसी वार्ड में संपर्क करें।'
      : primaryFlag.voiceAlertEn || 'Emergency warning! Please proceed directly to the hospital casualty room.';
    
    speechService.speak(prompt, language);

    return () => {
      speechService.stopSpeaking();
    };
  }, [redFlagData, language, primaryFlag.voiceAlertHi, primaryFlag.voiceAlertEn]);

  if (!redFlagData || !redFlagData.hasRedFlag) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ border: '2px solid var(--danger-500)', boxShadow: 'var(--shadow-glow-danger)' }}>
        {/* Header Alert Ribbon */}
        <div style={{
          background: 'linear-gradient(135deg, var(--danger-600), #7f1d1d)',
          padding: '1.5rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '0.6rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Siren size={36} className="pulse-danger" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fee2e2' }}>
                TRIAGE PROTOCOL OVERRIDE • ESI LEVEL 1
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.2rem 0 0' }}>
                PRIORITY RED-FLAG EMERGENCY ALERT
              </h2>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              padding: '0.4rem',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '2rem' }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '14px',
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#f87171', fontWeight: 700, fontSize: '1.1rem' }}>
              <AlertOctagon size={22} />
              <span>{primaryFlag.condition}</span>
            </div>
            <p style={{ marginTop: '0.5rem', color: '#e2e8f0', fontSize: '0.95rem' }}>
              The symptoms recorded on this kiosk match acute high-risk medical emergencies. You do not need to wait in the standard OPD queue.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.75rem' }}>
            <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>RECOMMENDED PROTOCOL</div>
              <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.95rem', marginTop: '0.3rem' }}>
                {primaryFlag.protocol}
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>STAT CLINICAL ACTION</div>
              <div style={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.9rem', marginTop: '0.3rem' }}>
                {primaryFlag.actionRequired}
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(2, 132, 199, 0.15))',
            padding: '1.25rem',
            borderRadius: '14px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <PhoneCall size={28} style={{ color: '#10b981', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                Hospital Triage Staff Automatically Notified
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Casualty Nursing Station has been alerted. Please approach <strong>Room 01 (Emergency Casualty)</strong> directly.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button
              onClick={onClose}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Continue Regular Intake (Acknowledge)
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'linear-gradient(135deg, var(--danger-600), var(--danger-700))',
                border: 'none',
                color: 'white',
                padding: '0.75rem 1.75rem',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(220, 38, 38, 0.4)'
              }}
            >
              <span>Emergency Staff Escort Requested</span>
              <ArrowRightCircle size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
