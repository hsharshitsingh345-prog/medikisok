/**
 * MediKiosk - Abnormal Lab Value Highlighting & Drug Interaction Safety Checker
 * Flags out-of-range clinical biomarkers and potential adverse medication interactions.
 */

export function analyzeLabAbnormalities(labs = []) {
  return labs.map(lab => {
    let alertLevel = 'NORMAL';
    let interpretation = 'Within normal physiological limits';

    const testLower = lab.test.toLowerCase();
    const numVal = parseFloat(lab.value);

    if (testLower.includes('troponin')) {
      if (numVal > 0.04) {
        alertLevel = 'CRITICAL_HIGH';
        interpretation = 'High likelihood of acute myocardial injury / necrosis. STAT Cardiology review.';
      }
    } else if (testLower.includes('creatinine')) {
      if (numVal >= 2.0) {
        alertLevel = 'CRITICAL_HIGH';
        interpretation = 'Severe renal impairment. Nephrotoxic drugs must be adjusted.';
      } else if (numVal > 1.2) {
        alertLevel = 'ELEVATED';
        interpretation = 'Mild-moderate renal insufficiency.';
      }
    } else if (testLower.includes('hba1c')) {
      if (numVal >= 9.0) {
        alertLevel = 'CRITICAL_HIGH';
        interpretation = 'Severe glycemic dysregulation. High risk of micro/macrovascular complications.';
      } else if (numVal >= 6.5) {
        alertLevel = 'HIGH';
        interpretation = 'Diabetic range.';
      }
    } else if (testLower.includes('potassium')) {
      if (numVal >= 5.5) {
        alertLevel = 'CRITICAL_HIGH';
        interpretation = 'Hyperkalemia risk. Danger of lethal cardiac arrhythmias / peaked T waves.';
      } else if (numVal < 3.5) {
        alertLevel = 'LOW';
        interpretation = 'Hypokalemia.';
      }
    } else if (testLower.includes('blood pressure')) {
      if (lab.value.includes('170') || lab.value.includes('180')) {
        alertLevel = 'CRITICAL_HIGH';
        interpretation = 'Stage 2 / Hypertensive urgency risk. Immediate BP titration needed.';
      }
    }

    return {
      ...lab,
      alertLevel: lab.status || alertLevel,
      interpretation
    };
  });
}

/**
 * Checks for drug-drug interaction warnings in extracted medications
 */
export function checkMedicationInteractions(medications = []) {
  const warnings = [];
  const medNames = medications.map(m => (m.name || '').toLowerCase());

  // 1. Dual antiplatelet + NSAIDs
  const hasAntiplatelet = medNames.some(m => m.includes('aspirin') || m.includes('ticagrelor') || m.includes('clopidogrel'));
  const hasNsaid = medNames.some(m => m.includes('brufen') || m.includes('ibuprofen') || m.includes('diclofenac') || m.includes('naproxen'));
  if (hasAntiplatelet && hasNsaid) {
    warnings.push({
      severity: 'HIGH_RISK',
      title: 'Antiplatelet + NSAID Interaction',
      description: 'Concomitant use substantially multiplies gastrointestinal bleeding and ulceration risk.'
    });
  }

  // 2. ACE-Inhibitor + Potassium Sparing / Elevated Potassium
  const hasAceOrArb = medNames.some(m => m.includes('ramipril') || m.includes('telmisartan') || m.includes('losartan'));
  const hasTorsemideOrSpirono = medNames.some(m => m.includes('spironolactone') || m.includes('torsemide'));
  if (hasAceOrArb && hasTorsemideOrSpirono) {
    warnings.push({
      severity: 'MODERATE_RISK',
      title: 'RAAS Blocker + Diuretic Surveillance',
      description: 'Monitor serum creatinine and electrolytes closely for hyperkalemia and acute prerenal azotemia.'
    });
  }

  return warnings;
}
