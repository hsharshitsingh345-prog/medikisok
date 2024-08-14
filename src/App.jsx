import React, { useState } from 'react';
import { KioskHeader } from './components/KioskHeader';
import { PatientKioskView } from './components/PatientKioskView';
import { DoctorConsoleView } from './components/DoctorConsoleView';
import { RedFlagModal } from './components/RedFlagModal';
import { DEMO_PATIENTS } from './modules/abdmConsent/abhaAuth';
import { SAMPLE_DOCUMENTS } from './modules/documentIntelligence/sampleDocuments';
import { buildClinicalSummary } from './modules/summaryGenerator/summaryBuilder';
import { generateFhirR4Bundle } from './modules/summaryGenerator/fhirGenerator';

export function App() {
  const [activeView, setActiveView] = useState('kiosk'); // 'kiosk' | 'doctor'
  const [isAyushMode, setIsAyushMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [globalSosTriggered, setGlobalSosTriggered] = useState(false);

  // Pre-seed realistic doctor queue with both emergency and routine patients
  const [patientQueue, setPatientQueue] = useState(() => {
    // 1. Critical Cardiac Patient
    const p1Summary = buildClinicalSummary({
      patient: DEMO_PATIENTS[0], // Rameshwar Sharma
      chiefComplaint: 'chest_pain',
      historyAnswers: {
        onset: 'sudden_acute',
        character: 'crushing_pressure',
        radiation: 'left_arm_jaw',
        associated: ['cold_sweats', 'breathlessness'],
        severity: 'extreme_9_10'
      },
      isAyushMode: false,
      scannedDocuments: [SAMPLE_DOCUMENTS[0]] // Cardio discharge
    });
    p1Summary.fhirBundle = generateFhirR4Bundle(p1Summary);

    // 2. Renal / HTN Patient
    const p2Summary = buildClinicalSummary({
      patient: DEMO_PATIENTS[1], // Kanti Devi
      chiefComplaint: 'breathlessness',
      historyAnswers: {
        onset: 'subacute_days',
        position: 'orthopnea',
        associated: ['pedal_edema']
      },
      isAyushMode: false,
      scannedDocuments: [SAMPLE_DOCUMENTS[1], SAMPLE_DOCUMENTS[2]] // OPD slip + lab panel
    });
    p2Summary.fhirBundle = generateFhirR4Bundle(p2Summary);

    // 3. AYUSH Amavata Patient
    const p3Summary = buildClinicalSummary({
      patient: DEMO_PATIENTS[2], // Sunita Devi
      chiefComplaint: 'amavata',
      historyAnswers: {
        duration: 'chronic_months',
        site: 'joint_poly'
      },
      isAyushMode: true,
      ayushAnswers: {
        body_frame: 'vata',
        skin_hair: 'vata',
        temperature_weather: 'vata',
        agni: 'mandagni',
        koshtha: 'krura',
        nidra_manas: 'vata_mind'
      },
      scannedDocuments: [SAMPLE_DOCUMENTS[3]] // Ayurvedic clinical slip
    });
    p3Summary.fhirBundle = generateFhirR4Bundle(p3Summary);

    return [p1Summary, p2Summary, p3Summary];
  });

  const handlePatientSubmittedToQueue = (newSummary) => {
    setPatientQueue(prev => [newSummary, ...prev]);
  };

  const handleTriggerSos = () => {
    setGlobalSosTriggered(true);
  };

  return (
    <div className="app-container">
      <div className="ambient-bg" />

      {/* Persistent Kiosk & OPD Header */}
      <KioskHeader
        activeView={activeView}
        setActiveView={setActiveView}
        isAyushMode={isAyushMode}
        setIsAyushMode={setIsAyushMode}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        onTriggerSos={handleTriggerSos}
      />

      {/* Main View Portals */}
      {activeView === 'kiosk' ? (
        <PatientKioskView
          isAyushMode={isAyushMode}
          selectedLanguage={selectedLanguage}
          onPatientSubmittedToQueue={handlePatientSubmittedToQueue}
        />
      ) : (
        <DoctorConsoleView
          patientQueue={patientQueue}
        />
      )}

      {/* Global Manual SOS Trigger Modal */}
      {globalSosTriggered && (
        <RedFlagModal
          redFlagData={{
            hasRedFlag: true,
            flags: [
              {
                condition: 'Manual Staff SOS Assistance Override',
                protocol: 'STAT SECURITY & NURSING ESCORT DISPATCHED',
                actionRequired: 'Hospital Triage Desk 01 notified. Please stay at the kiosk.',
                voiceAlertEn: 'Manual emergency triggered. Nursing staff is approaching your terminal.',
                voiceAlertHi: 'आपातकालीन सहायता मांगी गई है। नर्सिंग स्टाफ आपके पास पहुंच रहा है।'
              }
            ]
          }}
          onClose={() => setGlobalSosTriggered(false)}
          language={selectedLanguage}
        />
      )}
    </div>
  );
}

export default App;
