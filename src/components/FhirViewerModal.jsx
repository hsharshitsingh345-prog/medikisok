import React, { useState } from 'react';
import { FileCode, Copy, Check, X, ShieldCheck, Download } from 'lucide-react';

export function FhirViewerModal({ fhirBundle, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!fhirBundle) return null;

  const jsonString = JSON.stringify(fhirBundle, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FHIR-ABDM-Bundle-${fhirBundle.identifier?.value || 'doc'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '850px' }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 2rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'rgba(56, 189, 248, 0.2)',
              color: '#38bdf8',
              padding: '0.5rem',
              borderRadius: '10px'
            }}>
              <FileCode size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                  HL7® FHIR® R4 Document Bundle
                </h3>
                <span className="badge-abdm">ABDM Verified Schema</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                NRCES India (National Resource Centre for EHR Standards) Compliant
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleCopy}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                color: copied ? '#10b981' : 'var(--text-primary)',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer'
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>

            <button
              onClick={handleDownload}
              style={{
                background: 'var(--primary-600)',
                border: 'none',
                color: 'white',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer'
              }}
            >
              <Download size={16} />
              <span>Download</span>
            </button>

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
        </div>

        {/* Code Content */}
        <div style={{ padding: '1.5rem', background: '#090e17' }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.25rem',
            maxHeight: '480px',
            overflow: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.84rem',
            lineHeight: 1.6,
            color: '#38bdf8'
          }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {jsonString}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 2rem',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={16} style={{ color: '#10b981' }} />
            <span>Ready for ABDM Health Information Provider (HIP) Bridge Push</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '0.45rem 1.2rem',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
