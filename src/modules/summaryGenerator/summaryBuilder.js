/**
 * MediKiosk - Structured Clinical History Summary Generator (Module C)
 * Synthesizes conversational history, digitized document intelligence,
 * and AYUSH Pariksha into a standard, physician-ready clinical summary.
 */

import { evaluateRedFlags } from '../historyEngine/redFlagDetector';
import { calculateAyushProfile } from '../historyEngine/ayushPariksha';
import { analyzeLabAbnormalities, checkMedicationInteractions } from '../documentIntelligence/abnormalLabDetector';

export function buildClinicalSummary({
  patient,
  chiefComplaint,
  historyAnswers = {},
  isAyushMode = false,
  ayushAnswers = {},
  scannedDocuments = []
}) {
  // Red flag status
  const redFlagAnalysis = evaluateRedFlags(chiefComplaint, historyAnswers);

  // AYUSH profile if applicable
  const ayushProfile = isAyushMode ? calculateAyushProfile(ayushAnswers) : null;

  // Aggregate extracted items from scanned documents
  const allDiagnoses = [];
  const allMedications = [];
  const allLabs = [];
  const allProcedures = [];

  scannedDocuments.forEach(doc => {
    if (doc.extracted) {
      if (doc.extracted.diagnoses) allDiagnoses.push(...doc.extracted.diagnoses);
      if (doc.extracted.medications) allMedications.push(...doc.extracted.medications);
      if (doc.extracted.labs) allLabs.push(...doc.extracted.labs);
      if (doc.extracted.procedures) allProcedures.push(...doc.extracted.procedures);
    }
  });

  const analyzedLabs = analyzeLabAbnormalities(allLabs);
  const drugInteractions = checkMedicationInteractions(allMedications);

  // Formulate Chief Complaint display
  const complaintNames = {
    chest_pain: 'Chest Pain / Retrosternal Discomfort',
    breathlessness: 'Shortness of Breath (Dyspnea)',
    abdominal_pain: 'Acute / Subacute Abdominal Pain',
    fever_chills: 'High-grade Fever with Rigors & Chills',
    headache_neuro: 'Severe Headache with Giddiness',
    joint_back_pain: 'Polyarticular Joint & Spinal Pain',
    amavata: 'Amavata (Polyarticular Joint Stiffness & Pain)',
    amlapitta: 'Amlapitta (Severe Hyperacidity & Burning Reflux)',
    prameha: 'Prameha (Polyuria & Glycemic Dysregulation)'
  };

  const chiefComplaintLabel = complaintNames[chiefComplaint] || chiefComplaint;

  // Build HPI narrative
  let hpiNarrative = '';
  if (chiefComplaint === 'chest_pain') {
    hpiNarrative = `Patient presented with ${historyAnswers.character || 'discomfort'} onset (${historyAnswers.onset || 'recent'}), radiating to ${historyAnswers.radiation || 'none'}. Associated with ${Array.isArray(historyAnswers.associated) ? historyAnswers.associated.join(', ') : 'none'}. Reported pain severity: ${historyAnswers.severity || 'Moderate'}.`;
  } else if (chiefComplaint === 'breathlessness') {
    hpiNarrative = `Patient reports difficulty breathing of ${historyAnswers.onset || 'recent'} onset. Positional symptoms: ${historyAnswers.position || 'none noted'}. Associated with ${Array.isArray(historyAnswers.associated) ? historyAnswers.associated.join(', ') : 'minimal features'}.`;
  } else if (chiefComplaint === 'abdominal_pain') {
    hpiNarrative = `Abdominal pain localized primarily in the ${historyAnswers.site || 'abdomen'}. Relation to food: ${historyAnswers.relation_food || 'variable'}. Bowel habits: ${historyAnswers.bowel_habits || 'regular'}.`;
  } else if (chiefComplaint === 'fever_chills') {
    hpiNarrative = `Fever duration pattern: ${historyAnswers.duration || 'recent days'}. Associated warning signs: ${Array.isArray(historyAnswers.warning_signs) ? historyAnswers.warning_signs.join(', ') : 'none'}.`;
  } else {
    hpiNarrative = `Patient reports chief complaint of ${chiefComplaintLabel}. Evaluated through guided conversational kiosk interview.`;
  }

  // Doctor-ready structured summary object
  return {
    patientId: patient?.id || 'ABHA-PAT-9081',
    patientName: patient?.name || 'Walk-in Patient',
    ageGender: `${patient?.age || '45'}Y / ${patient?.gender || 'Male'}`,
    gender: patient?.gender || 'Male',
    bloodGroup: patient?.bloodGroup || 'O+',
    dob: patient?.dob || '',
    phone: patient?.phone || '+91 98000-00000',
    email: patient?.email || '',
    previousHospital: patient?.previousHospital || 'None / Direct OPD Walk-in',
    weight: patient?.weight ? `${patient.weight} kg` : null,
    height: patient?.height ? `${patient.height} cm` : null,
    bmi: patient?.bmi || null,
    abhaId: patient?.abhaId || '91-4829-1920-3341',
    tokenNumber: patient?.tokenNumber || 'OPD-108',
    department: isAyushMode ? 'AYUSH (Ayurveda) OPD' : 'General Medicine / Triage OPD',
    timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString('en-GB'),

    redFlagAnalysis,
    isAyushMode,
    ayushProfile,

    clinicalSections: {
      chiefComplaint: chiefComplaintLabel,
      historyOfPresentIllness: hpiNarrative,
      vitalsAnthropometry: {
        bloodGroup: patient?.bloodGroup || 'Not specified',
        weight: patient?.weight ? `${patient.weight} kg` : 'Not recorded',
        height: patient?.height ? `${patient.height} cm` : 'Not recorded',
        bmi: patient?.bmi || 'Not computed',
        previousHospital: patient?.previousHospital || 'None (Direct Walk-in)',
        phone: patient?.phone || 'Not provided',
        email: patient?.email || 'Not provided'
      },
      pastMedicalHistory: allDiagnoses.length > 0 ? allDiagnoses : ['No major past medical illnesses recorded in kiosk.'],
      medicationHistory: allMedications,
      allergies: historyAnswers.allergies || 'No known drug allergies (NKDA)',
      personalHabits: historyAnswers.habits || ['Non-smoker', 'Vegetarian diet'],
      reviewOfSystems: historyAnswers.general || ['No active complaints in other systems'],
      investigationsSummary: analyzedLabs,
      proceduresHistory: allProcedures,
      drugInteractions
    },

    // Bilingual confirmation for patient
    bilingualPatientConfirmation: {
      hi: `नमस्ते ${patient?.name || 'मरीज'}, आपका विवरण सफलतापूर्वक दर्ज कर लिया गया है। आपका टोकन नंबर ${patient?.tokenNumber || 'OPD-108'} है। डॉक्टर के कक्ष के बाहर प्रतीक्षा करें।`,
      en: `Hello ${patient?.name || 'Patient'}, your medical history and documents are securely recorded. Your token number is ${patient?.tokenNumber || 'OPD-108'}. Please proceed to Consultation Room.`
    }
  };
}
