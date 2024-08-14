/**
 * MediKiosk - Real-time Emergency Red-Flag Triage Engine
 * Immediately triggers priority alerts and diverts critical patients to Emergency / Triage room
 * rather than regular OPD queueing.
 */

export function evaluateRedFlags(chiefComplaint, historyAnswers) {
  const flags = [];

  // 1. Acute Coronary Syndrome (ACS / STEMI) Check
  if (chiefComplaint === 'chest_pain') {
    const isSudden = historyAnswers.onset === 'sudden_acute' || historyAnswers.onset === 'post_exertion';
    const isCrushing = historyAnswers.character === 'crushing_pressure';
    const radiatesArm = historyAnswers.radiation === 'left_arm_jaw';
    const associated = Array.isArray(historyAnswers.associated) ? historyAnswers.associated : [];
    const hasSweatOrDyspnea = associated.includes('cold_sweats') || associated.includes('breathlessness');
    const isSevere = historyAnswers.severity === 'severe_7_8' || historyAnswers.severity === 'extreme_9_10';

    if (isCrushing || (radiatesArm && hasSweatOrDyspnea) || (isSudden && isSevere)) {
      flags.push({
        id: 'redflag_acs',
        severity: 'CRITICAL_EMERGENCY',
        condition: 'Suspected Acute Coronary Syndrome / Myocardial Infarction',
        protocol: 'IMMEDIATE EMERGENCY ROOM (ER) / CASUALTY DIVERSION',
        actionRequired: 'STAT 12-lead ECG within 10 minutes + Sublingual Sorbitrate/Aspirin triage protocol',
        voiceAlertEn: 'Emergency Alert: Critical chest pain symptoms detected. Please alert triage staff immediately.',
        voiceAlertHi: 'आपातकालीन चेतावनी: गंभीर छाती के दर्द के लक्षण मिले हैं। तुरंत इमरजेंसी वार्ड में जाएं।'
      });
    }
  }

  // 2. Acute Respiratory Distress / Pulmonary Embolism / Acute Heart Failure
  if (chiefComplaint === 'breathlessness') {
    const associated = Array.isArray(historyAnswers.associated) ? historyAnswers.associated : [];
    const isCyanotic = associated.includes('cyanosis') || associated.includes('pink_sputum');
    const isAcuteOrthopnea = historyAnswers.position === 'orthopnea' || historyAnswers.position === 'pnd';

    if (isCyanotic || (historyAnswers.onset === 'sudden_minutes' && isAcuteOrthopnea)) {
      flags.push({
        id: 'redflag_respiratory',
        severity: 'CRITICAL_EMERGENCY',
        condition: 'Severe Acute Hypoxemic Respiratory Failure / Acute Pulmonary Edema',
        protocol: 'STAT OXYGEN THERAPY + ER TRIAGE LEVEL 1',
        actionRequired: 'High flow O2 via NRBM + SpO2 & vital monitoring + urgent chest radiograph',
        voiceAlertEn: 'Critical breathing distress detected. Immediate oxygen support required.',
        voiceAlertHi: 'गंभीर सांस की तकलीफ। तुरंत ऑक्सीजन और आपातकालीन कक्ष की आवश्यकता है।'
      });
    }
  }

  // 3. Acute Surgical Abdomen / GI Bleed
  if (chiefComplaint === 'abdominal_pain') {
    const isMelena = historyAnswers.bowel_habits === 'melena_blood';
    const isObstipation = historyAnswers.bowel_habits === 'obstipation';
    const isRightLowerSevere = historyAnswers.site === 'rlq' && historyAnswers.relation_food === 'intractable_vomiting';

    if (isMelena || isObstipation || isRightLowerSevere) {
      flags.push({
        id: 'redflag_gi',
        severity: 'HIGH_URGENCY',
        condition: isMelena ? 'Acute Gastrointestinal Hemorrhage' : 'Acute Appendicitis / Bowel Obstruction',
        protocol: 'SURGICAL OPD / EMERGENCY TRIAGE',
        actionRequired: 'NPO (Nil per os) + IV Access + Urgent Surgical Consultation & Abdominal USG',
        voiceAlertEn: 'High-risk abdominal emergency signs detected.',
        voiceAlertHi: 'पेट की गंभीर समस्या। आपातकालीन डॉक्टर को तुरंत सूचित करें।'
      });
    }
  }

  // 4. Sepsis / Meningitis / Severe Dengue Warning Signs
  if (chiefComplaint === 'fever_chills') {
    const warnings = Array.isArray(historyAnswers.warning_signs) ? historyAnswers.warning_signs : [];
    if (warnings.includes('stiff_neck_confusion') || warnings.includes('bleeding_rash')) {
      flags.push({
        id: 'redflag_sepsis_meningitis',
        severity: 'CRITICAL_EMERGENCY',
        condition: warnings.includes('stiff_neck_confusion') ? 'Suspected Acute Meningitis / Encephalitis' : 'Suspected Severe Dengue Hemorrhagic Fever',
        protocol: 'ISOLATION / CRITICAL CARE TRIAGE',
        actionRequired: 'Urgent Lumbar Puncture / Dengue Serology + Platelet count + IV Resuscitation',
        voiceAlertEn: 'Critical neurological or hemorrhagic warning signs detected.',
        voiceAlertHi: 'तेज बुखार के साथ गंभीर खतरे के संकेत। तुरंत इमरजेंसी रूम जाएं।'
      });
    }
  }

  return {
    hasRedFlag: flags.length > 0,
    highestSeverity: flags.find(f => f.severity === 'CRITICAL_EMERGENCY') ? 'CRITICAL' : (flags.length > 0 ? 'URGENT' : 'ROUTINE'),
    flags
  };
}
