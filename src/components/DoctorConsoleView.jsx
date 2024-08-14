import React, { useState } from 'react';
import { 
  Users, 
  Stethoscope, 
  AlertTriangle, 
  Clock, 
  FileCheck, 
  FileCode, 
  Printer, 
  CheckCircle2, 
  Flame, 
  Activity, 
  Heart, 
  Pill, 
  AlertOctagon, 
  Edit3, 
  Save, 
  ShieldCheck, 
  Leaf, 
  Search,
  Sparkles,
  ChevronRight,
  Droplet
} from 'lucide-react';
import { FhirViewerModal } from './FhirViewerModal';

export function DoctorConsoleView({ patientQueue = [], onUpdatePatientStatus }) {
  const [selectedPatientIndex, setSelectedPatientIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isFhirModalOpen, setIsFhirModalOpen] = useState(false);
  const [isSavedToHis, setIsSavedToHis] = useState(false);

  const activePatient = patientQueue[selectedPatientIndex] || null;

  const filteredQueue = patientQueue.filter(p => 
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.tokenNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.abhaId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePushToHis = () => {
    setIsSavedToHis(true);
    setTimeout(() => setIsSavedToHis(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="doctor-dashboard-layout">
      {/* SIDEBAR: Real-time Patient Queue */}
      <aside className="queue-sidebar">
        <div className="queue-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={20} style={{ color: '#10b981' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Live OPD Queue</h3>
          </div>
          <span style={{ 
            background: 'var(--bg-surface-elevated)', 
            fontSize: '0.75rem', 
            padding: '0.2rem 0.6rem', 
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            fontWeight: 700 
          }}>
            {patientQueue.length} Waiting
          </span>
        </div>

        {/* Search / Filter Input */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search token, name, ABHA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.45rem 0.6rem 0.45rem 2rem',
                color: 'white',
                fontSize: '0.82rem'
              }}
            />
          </div>
        </div>

        {/* Queue Items List */}
        <div className="queue-list">
          {filteredQueue.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No patients matching search.
            </div>
          ) : (
            filteredQueue.map((patient, idx) => {
              const isSelected = selectedPatientIndex === idx;
              const isCritical = patient.redFlagAnalysis?.hasRedFlag;

              return (
                <div
                  key={idx}
                  className={`patient-queue-card ${isSelected ? 'active' : ''} ${isCritical ? 'critical' : ''}`}
                  onClick={() => {
                    setSelectedPatientIndex(idx);
                    setDoctorNotes('');
                    setIsSavedToHis(false);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                      {patient.tokenNumber}
                    </span>
                    {isCritical ? (
                      <span className="badge-triage-critical">RED-FLAG STAT</span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{patient.timestamp}</span>
                    )}
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f8fafc' }}>
                    {patient.patientName}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{patient.ageGender} • <span style={{ color: '#f87171', fontWeight: 700 }}>🩸 {patient.bloodGroup || 'O+'}</span></span>
                    <span style={{ color: patient.isAyushMode ? '#fbbf24' : '#38bdf8' }}>
                      {patient.isAyushMode ? 'AYUSH OPD' : 'General Med'}
                    </span>
                  </div>

                  {patient.weight && (
                    <div style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                      <span>⚖️ {patient.weight}</span>
                      <span>•</span>
                      <span>BMI: {patient.bmi ? patient.bmi.split(' ')[0] : 'N/A'}</span>
                    </div>
                  )}

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    CC: {patient.clinicalSections?.chiefComplaint || 'Evaluation'}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* MAIN VIEW: Physician 15-Second Structured Clinical Summary */}
      <main className="doctor-detail-pane">
        {!activePatient ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <Stethoscope size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h3>No Patient Selected</h3>
            <p style={{ fontSize: '0.88rem', marginTop: '0.3rem' }}>Select an incoming patient from the left queue to inspect their clinical summary.</p>
          </div>
        ) : (
          <div>
            {/* Top Patient Profile Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '1.25rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                    {activePatient.patientName}
                  </h2>
                  <span style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    color: '#38bdf8'
                  }}>
                    {activePatient.abhaId}
                  </span>
                  <span style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    Token: {activePatient.tokenNumber}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.8rem', marginTop: '0.4rem' }}>
                  <span><strong>{activePatient.ageGender}</strong> {activePatient.dob ? `(DOB: ${activePatient.dob})` : ''}</span>
                  <span>•</span>
                  <span style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#f87171',
                    padding: '0.15rem 0.6rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <Droplet size={13} style={{ color: '#ef4444' }} />
                    <span>Blood Group: {activePatient.bloodGroup || 'O+'}</span>
                  </span>
                  <span>•</span>
                  <span>Dept: {activePatient.department}</span>
                  <span>•</span>
                  <span>📞 {activePatient.phone || 'N/A'}</span>
                  <span>•</span>
                  <span>✉️ {activePatient.email || 'N/A'}</span>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginTop: '0.35rem' }}>
                  <span>🏥 <strong>Referred From / Prev Hospital:</strong> {activePatient.previousHospital || 'Direct Walk-in'}</span>
                  {activePatient.weight && (
                    <>
                      <span>•</span>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>
                        ⚖️ Vitals: {activePatient.weight} / {activePatient.height} | BMI: {activePatient.bmi || 'N/A'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Top Quick Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => setIsFhirModalOpen(true)}
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    color: '#38bdf8',
                    padding: '0.55rem 1rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer'
                  }}
                >
                  <FileCode size={16} />
                  <span>Inspect FHIR R4</span>
                </button>

                <button
                  onClick={handlePrint}
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    color: 'white',
                    padding: '0.55rem 1rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={16} />
                  <span>Print OPD Slip</span>
                </button>

                <button
                  onClick={handlePushToHis}
                  style={{
                    background: isSavedToHis ? '#059669' : 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
                    border: 'none',
                    color: 'white',
                    padding: '0.55rem 1.25rem',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {isSavedToHis ? <CheckCircle2 size={17} /> : <Save size={17} />}
                  <span>{isSavedToHis ? 'Synced to ABDM HIS!' : 'Confirm & Save to HIS'}</span>
                </button>
              </div>
            </div>

            {/* Red Flag Alert Ribbon (If Active) */}
            {activePatient.redFlagAnalysis?.hasRedFlag && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(185, 28, 28, 0.25))',
                border: '1px solid var(--danger-500)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <AlertOctagon size={26} style={{ color: '#f87171' }} />
                  <div>
                    <div style={{ fontWeight: 800, color: '#fca5a5', fontSize: '0.95rem' }}>
                      TRIAGE RED FLAG: {activePatient.redFlagAnalysis.flags[0]?.condition}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#e2e8f0' }}>
                      Recommended STAT Action: {activePatient.redFlagAnalysis.flags[0]?.actionRequired}
                    </div>
                  </div>
                </div>
                <span className="badge-triage-critical">ESI LEVEL 1</span>
              </div>
            )}

            {/* Drug Interaction Warnings */}
            {activePatient.clinicalSections?.drugInteractions?.length > 0 && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '12px',
                padding: '0.9rem 1.2rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <AlertTriangle size={20} style={{ color: '#fbbf24' }} />
                <div>
                  <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.88rem' }}>
                    Potential Medication Interaction Alert:
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#e2e8f0' }}>
                    {activePatient.clinicalSections.drugInteractions[0]?.description}
                  </div>
                </div>
              </div>
            )}

            {/* Clinical Sections Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
              {/* Left Column: Chief Complaint, HPI, Past History */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* 1. Chief Complaint & HPI */}
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    1. CHIEF COMPLAINT (CC) & HPI
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem' }}>
                    {activePatient.clinicalSections?.chiefComplaint}
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                    {activePatient.clinicalSections?.historyOfPresentIllness}
                  </p>
                </div>

                {/* 2. Past Medical & Surgical History */}
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    2. PAST MEDICAL & SURGICAL HISTORY
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.3rem' }}>
                    {activePatient.clinicalSections?.pastMedicalHistory?.map((item, i) => (
                      <span key={i} style={{ background: 'rgba(255,255,255,0.06)', padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.82rem', color: '#e2e8f0' }}>
                        • {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 3. Review of Systems & Habits */}
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    3. HABITS & REVIEW OF SYSTEMS (ROS)
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                    <div><strong>Habits / Diet:</strong> {Array.isArray(activePatient.clinicalSections?.personalHabits) ? activePatient.clinicalSections.personalHabits.join(', ') : activePatient.clinicalSections?.personalHabits}</div>
                    <div style={{ marginTop: '0.3rem' }}><strong>Allergies:</strong> <span style={{ color: '#f87171', fontWeight: 600 }}>{activePatient.clinicalSections?.allergies}</span></div>
                  </div>
                </div>
              </div>

              {/* Right Column: Active Medications & Lab Highlights */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Active Medications */}
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      ACTIVE MEDICATIONS ({activePatient.clinicalSections?.medicationHistory?.length || 0})
                    </span>
                    <Pill size={16} style={{ color: '#38bdf8' }} />
                  </div>

                  {activePatient.clinicalSections?.medicationHistory?.length === 0 ? (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No prior medications recorded.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto' }}>
                      {activePatient.clinicalSections.medicationHistory.map((med, i) => (
                        <div key={i} style={{ background: 'rgba(0,0,0,0.25)', padding: '0.4rem 0.6rem', borderRadius: '8px', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{med.name} ({med.dosage})</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{med.frequency}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lab Findings & Abnormal Highlights */}
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      DIGITIZED LABS & ANOMALIES
                    </span>
                    <Activity size={16} style={{ color: '#10b981' }} />
                  </div>

                  {activePatient.clinicalSections?.investigationsSummary?.length === 0 ? (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No lab documents scanned.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {activePatient.clinicalSections.investigationsSummary.map((lab, i) => (
                        <div key={i} style={{ background: 'rgba(0,0,0,0.25)', padding: '0.5rem 0.7rem', borderRadius: '8px', fontSize: '0.82rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600 }}>{lab.test}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontWeight: 700 }}>{lab.value} {lab.unit}</span>
                              {lab.alertLevel?.includes('HIGH') && (
                                <span className="badge-lab-critical">CRITICAL HIGH</span>
                              )}
                              {lab.alertLevel === 'ELEVATED' && (
                                <span className="badge-lab-elevated">ELEVATED</span>
                              )}
                            </div>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Ref: {lab.refRange} • {lab.interpretation}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AYUSH Dashavidha Pariksha Summary (If AYUSH patient) */}
                {activePatient.isAyushMode && activePatient.ayushProfile && (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    padding: '1.25rem',
                    borderRadius: '14px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                      <Leaf size={18} style={{ color: '#fbbf24' }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase' }}>
                        AYURVEDIC PRAKRITI & AGNI ASSESSMENT
                      </span>
                    </div>

                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
                      Constitutional Prakriti: {activePatient.ayushProfile.dominantPrakriti}
                    </div>

                    {/* Dosha Progress Bar */}
                    <div style={{ display: 'flex', height: '10px', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                      <div style={{ width: `${activePatient.ayushProfile.breakdown.Vata}%`, background: '#38bdf8' }} title="Vata" />
                      <div style={{ width: `${activePatient.ayushProfile.breakdown.Pitta}%`, background: '#f59e0b' }} title="Pitta" />
                      <div style={{ width: `${activePatient.ayushProfile.breakdown.Kapha}%`, background: '#10b981' }} title="Kapha" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.78rem', color: '#e2e8f0' }}>
                      <div><strong>Agni:</strong> {activePatient.ayushProfile.agni}</div>
                      <div><strong>Koshtha:</strong> {activePatient.ayushProfile.koshtha}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Editable Physician Notes & Examination Findings */}
            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
                  <Edit3 size={16} style={{ color: '#10b981' }} />
                  <span>Physician Examination Notes & Prescription (Editable Draft):</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Doctor retains 100% confirmation control before saving
                </span>
              </div>

              <textarea
                rows={3}
                placeholder="Type additional clinical observations, physical exam (BP, Chest, CVS), or custom prescription advice here..."
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  color: 'white',
                  fontSize: '0.88rem',
                  lineHeight: 1.5,
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* FHIR Inspector Modal */}
      {isFhirModalOpen && activePatient && (
        <FhirViewerModal
          fhirBundle={activePatient.fhirBundle}
          onClose={() => setIsFhirModalOpen(false)}
        />
      )}
    </div>
  );
}
