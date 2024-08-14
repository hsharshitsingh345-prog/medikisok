/**
 * Realistic Indian Medical Document Samples for Digitization & OCR Intelligence
 * Covers tertiary government hospitals, private specialty centers, diagnostic chains, and AYUSH OPDs.
 */

export const SAMPLE_DOCUMENTS = [
  {
    id: 'doc_cardio_discharge',
    type: 'Discharge Summary',
    facility: 'Apex Tertiary Government Hospital & Heart Institute, New Delhi',
    date: '12-Aug-2025',
    title: 'Discharge Summary: Acute Coronary Syndrome (Anterior STEMI)',
    patientName: 'Rameshwar Prasad Sharma',
    ageGender: '56 Yrs / Male',
    bloodGroup: 'B+',
    consultant: 'Dr. V. K. Trehan, DM Cardiology',
    rawText: `
INSTITUTE OF CARDIOVASCULAR SCIENCES & RESEARCH
DEPARTMENT OF CARDIOLOGY - DISCHARGE SUMMARY
CR NO: 2025-08-98432 | ABHA ID: 91-8432-1092-4412
Patient: Rameshwar Prasad Sharma | 56Y / M | Blood Group: B+ | Date of Adm: 08/08/2025 | Date of Dis: 12/08/2025

FINAL DIAGNOSIS:
1. ACUTE ANTERIOR WALL ST-ELEVATION MYOCARDIAL INFARCTION (AWMI)
2. POST PRIMARY PCI WITH DRUG ELUTING STENT (DES) TO MID-LAD (3.0 x 28 mm)
3. TYPE 2 DIABETES MELLITUS
4. PRIMARY SYSTEMIC HYPERTENSION

PROCEDURE PERFORMED:
Coronary Angiography via right radial route: 95% thrombotic cut-off at mid LAD. Successful primary PTCA with DES. TIMI III flow achieved. Left Ventricular Ejection Fraction (LVEF): 42%.

KEY LAB FINDINGS AT DISCHARGE:
- Serum Troponin-I: 14.8 ng/mL (Normal < 0.04) [CRITICAL HIGH]
- Serum Creatinine: 1.4 mg/dL (Normal 0.7 - 1.2) [ELEVATED]
- HbA1c: 8.9 % (Normal < 5.7) [UNCONTROLLED HIGH]
- Fasting Blood Sugar: 168 mg/dL [HIGH]
- Total Cholesterol: 232 mg/dL, LDL: 154 mg/dL [HIGH]
- Hemoglobin: 13.6 g/dL, Platelets: 210,000 /uL

DISCHARGE MEDICATIONS:
1. Tab. Ecosprin (Aspirin) 75 mg - 1 tab once daily after lunch (Antiplatelet)
2. Tab. Brilinta (Ticagrelor) 90 mg - 1 tab twice daily (Antiplatelet)
3. Tab. Atorva (Atorvastatin) 40 mg - 1 tab at bedtime (Statin)
4. Tab. Metoprolol Succinate XL 25 mg - 1 tab once daily in morning (Beta-blocker)
5. Tab. Ramipril 2.5 mg - 1 tab once daily (ACE Inhibitor)
6. Tab. Metformin 500 mg - 1 tab twice daily with meals
7. S/L Sorbitrate 5 mg - SOS for chest pain

ADVICE:
Strict low-salt, low-fat diabetic diet. Avoid heavy lifting. Review in Cardiology OPD after 2 weeks.
    `,
    extracted: {
      diagnoses: [
        'Acute Anterior ST-Elevation Myocardial Infarction (STEMI)',
        'Post Primary PCI with Drug-Eluting Stent (DES) to mid-LAD',
        'Type 2 Diabetes Mellitus',
        'Primary Systemic Hypertension'
      ],
      medications: [
        { name: 'Aspirin (Ecosprin)', dosage: '75 mg', frequency: 'Once daily (OD)', purpose: 'Antiplatelet' },
        { name: 'Ticagrelor (Brilinta)', dosage: '90 mg', frequency: 'Twice daily (BD)', purpose: 'Antiplatelet' },
        { name: 'Atorvastatin', dosage: '40 mg', frequency: 'At bedtime (HS)', purpose: 'Lipid lowering' },
        { name: 'Metoprolol Succinate XL', dosage: '25 mg', frequency: 'Once daily (OD)', purpose: 'Beta Blocker' },
        { name: 'Ramipril', dosage: '2.5 mg', frequency: 'Once daily (OD)', purpose: 'ACE-Inhibitor' },
        { name: 'Metformin', dosage: '500 mg', frequency: 'Twice daily (BD)', purpose: 'Oral Hypoglycemic' }
      ],
      labs: [
        { test: 'Serum Troponin-I', value: '14.8', unit: 'ng/mL', refRange: '< 0.04', status: 'CRITICAL_HIGH' },
        { test: 'HbA1c', value: '8.9', unit: '%', refRange: '< 5.7', status: 'HIGH' },
        { test: 'Fasting Blood Sugar', value: '168', unit: 'mg/dL', refRange: '70 - 100', status: 'HIGH' },
        { test: 'Serum Creatinine', value: '1.4', unit: 'mg/dL', refRange: '0.7 - 1.2', status: 'ELEVATED' },
        { test: 'LDL Cholesterol', value: '154', unit: 'mg/dL', refRange: '< 100', status: 'HIGH' }
      ],
      procedures: ['Primary PTCA with DES to Mid-LAD via Right Radial artery (TIMI III flow)']
    }
  },

  {
    id: 'doc_handwritten_opd',
    type: 'Handwritten OPD Prescription',
    facility: 'District Government Civil Hospital, OPD Unit 3',
    date: '18-Jan-2026',
    title: 'Government OPD Slip: Chronic Hypertension & Chronic Kidney Disease Screening',
    patientName: 'Kanti Devi',
    ageGender: '62 Yrs / Female',
    bloodGroup: 'O+',
    consultant: 'Dr. S. K. Gupta, MD Medicine',
    rawText: `
GOVT CIVIL HOSPITAL - OPD REGISTRATION SLIP
OPD Token: M-412 | Date: 18/01/2026 | Blood Group: O+
Pt: Kanti Devi, 62F | C/o Bilateral feet swelling x 3 wks, Nocturia, General weakness
O/E: BP: 170/100 mmHg | PR: 82/min regular | Bilateral pitting pedal edema ++
Chest: Bilateral basal creps | S1 S2 heard
 
Rx:
1. Tab. Telmisartan 40mg + Amlodipine 5mg (Telma-AM) 1 tab PO OD (morning)
2. Tab. Torsemide 10mg 1 tab PO OD (morning after food)
3. Tab. Calcium Carbonate 500mg + Vit D3 1 tab OD
4. Tab. Pantoprazole 40mg 1 tab PO empty stomach (OD AC)
 
Advise Investigations:
- RFT (Serum Creatinine, Blood Urea, Electrolytes)
- Urine Routine & Microscopy (Albumin/Sugar)
- Ultrasonography KUB (Kidney, Ureter, Bladder)
- Salt restricted diet (< 2g/day)
    `,
    extracted: {
      diagnoses: [
        'Uncontrolled Stage 2 Hypertension',
        'Bilateral Pitting Pedal Edema (Rule out CKD / Heart Failure)',
        'Nocturia'
      ],
      medications: [
        { name: 'Telmisartan + Amlodipine', dosage: '40mg + 5mg', frequency: 'Once daily (OD)', purpose: 'Antihypertensive' },
        { name: 'Torsemide', dosage: '10mg', frequency: 'Once daily (OD)', purpose: 'Loop Diuretic' },
        { name: 'Pantoprazole', dosage: '40mg', frequency: 'Once daily (OD AC)', purpose: 'Proton Pump Inhibitor' },
        { name: 'Calcium + Vitamin D3', dosage: '500mg', frequency: 'Once daily', purpose: 'Supplement' }
      ],
      labs: [
        { test: 'Blood Pressure', value: '170/100', unit: 'mmHg', refRange: '< 120/80', status: 'CRITICAL_HIGH' },
        { test: 'Pulse Rate', value: '82', unit: 'bpm', refRange: '60 - 100', status: 'NORMAL' }
      ],
      procedures: ['Recommended USG KUB and renal function tests']
    }
  },

  {
    id: 'doc_lab_panel',
    type: 'Comprehensive Diagnostic Lab Report',
    facility: 'Dr. Lal PathLabs / National Accreditation Board (NABL) Lab',
    date: '02-Feb-2026',
    title: 'Biochemistry & Renal Function Test Panel',
    patientName: 'Rajinder Kumar',
    ageGender: '48 Yrs / Male',
    bloodGroup: 'AB+',
    consultant: 'Ref: Dr. Anita Verma',
    rawText: `
NABL ACCREDITED CLINICAL BIOCHEMISTRY LABORATORY
PATIENT: Rajinder Kumar | AGE/GENDER: 48Y / MALE | BLOOD GROUP: AB+ | SAMPLE DATE: 02/02/2026
 
INVESTIGATION                          RESULT         UNIT         BIOLOGICAL REF RANGE
---------------------------------------------------------------------------------------
Serum Creatinine                       2.8            mg/dL        0.7 - 1.2    [HIGH - ABNORMAL]
Blood Urea                             68             mg/dL        15 - 40      [HIGH - ABNORMAL]
Estimated GFR (eGFR CKD-EPI)           24             mL/min/1.73m2 >= 60       [SEVERELY DECREASED]
Serum Potassium                        5.8            mEq/L        3.5 - 5.1    [HIGH - HYPERKALEMIA]
Serum Sodium                           138            mEq/L        136 - 145    [NORMAL]
Uric Acid                              8.4            mg/dL        3.5 - 7.2    [HIGH - ABNORMAL]
Glycosylated Hemoglobin (HbA1c)        10.4           %            < 5.7        [POOR CONTROL - HIGH]
Average Blood Glucose (eAG)            252            mg/dL        70 - 126     [HIGH]
Serum Bilirubin (Total)                0.9            mg/dL        0.2 - 1.2    [NORMAL]
SGPT (ALT)                             42             U/L          < 50         [NORMAL]
    `,
    extracted: {
      diagnoses: [
        'Stage 4 Chronic Kidney Disease (eGFR 24 mL/min)',
        'Hyperkalemia (K+ 5.8 mEq/L) - Cardiotoxic Risk',
        'Uncontrolled Type 2 Diabetes (HbA1c 10.4%)',
        'Hyperuricemia'
      ],
      medications: [],
      labs: [
        { test: 'Serum Creatinine', value: '2.8', unit: 'mg/dL', refRange: '0.7 - 1.2', status: 'CRITICAL_HIGH' },
        { test: 'Serum Potassium (K+)', value: '5.8', unit: 'mEq/L', refRange: '3.5 - 5.1', status: 'CRITICAL_HIGH' },
        { test: 'eGFR', value: '24', unit: 'mL/min/1.73m2', refRange: '>= 60', status: 'CRITICAL_LOW' },
        { test: 'HbA1c', value: '10.4', unit: '%', refRange: '< 5.7', status: 'CRITICAL_HIGH' },
        { test: 'Blood Urea', value: '68', unit: 'mg/dL', refRange: '15 - 40', status: 'HIGH' },
        { test: 'Uric Acid', value: '8.4', unit: 'mg/dL', refRange: '3.5 - 7.2', status: 'HIGH' }
      ],
      procedures: []
    }
  },

  {
    id: 'doc_ayush_prescription',
    type: 'Ayurvedic OPD Clinical Slip',
    facility: 'All India Institute of Ayurveda (AIIA), New Delhi - Kayachikitsa OPD',
    date: '28-Feb-2026',
    title: 'Ayurvedic Clinical Record: Amavata (Rheumatoid Arthritis)',
    patientName: 'Sunita Devi',
    ageGender: '42 Yrs / Female',
    bloodGroup: 'A+',
    consultant: 'Vaidya R. S. Bhattacharya, MD (Ayu)',
    rawText: `
ALL INDIA INSTITUTE OF AYURVEDA (AIIA)
DEPARTMENT OF KAYACHIKITSA - OPD CLINICAL RECORD
Reg No: AYU-2026-04192 | Blood Group: A+ | Prakriti: Vata-Kapha | Agni: Mandagni | Koshtha: Krura

ROGA NIDANA (CLINICAL DIAGNOSIS):
Amavata (Rheumatoid Polyarthritis) with Ama-Lakshanas (heaviness, early morning stiffness > 1 hr, swelling in wrist & PIP joints).

ASHTAVIDHA PARIKSHA:
Nadi: Vata-Kapha Gati (Manduka-Gati) | Mutra: Avila | Mala: Vibandha (Constipated) | Jihva: Sama (Heavy White Coating) | Shabda: Prakrita | Sparsha: Ushna (Warm joints) | Druk: Prakrita | Akriti: Madhyama

SHAMANA CHIKITSA (MEDICATIONS):
1. Yogaraj Guggulu - 2 tablets twice daily with warm water (Guggulu Kalpa)
2. Dashamularishta - 20 ml with equal warm water after meals twice daily
3. Shunthi Churna (Ginger root powder) + Castor Oil (Eranda Taila) - 1 tsp at bedtime for Virechana & Vata-Anulomana
4. Rasna Saptaka Kwatha - 40 ml twice daily before meals
5. Brihat Saindhavadya Taila - External application (Abhyanga) followed by Valuka Sweda (Sand fomentation)

PATHYA-APATHYA (DIETARY ADVICE):
Pathya: Light warm porridge, barley (Yava), drumstick, ginger, garlic, lukewarm water.
Apathya: Avoid curd (Dahi), black gram (Urad), cold water, daytime sleeping (Diva Swapna).
    `,
    extracted: {
      diagnoses: [
        'Amavata (Rheumatoid Polyarthritis with Ama accumulation)',
        'Mandagni with Sama Jihva (Coated tongue)',
        'Krura Koshtha (Vibandha / Constipation)'
      ],
      medications: [
        { name: 'Yogaraj Guggulu', dosage: '2 tablets', frequency: 'Twice daily with warm water', purpose: 'Vata-Shamana & Anti-inflammatory' },
        { name: 'Dashamularishta', dosage: '20 ml', frequency: 'Twice daily after food', purpose: 'Deepana-Pachana & Analgesic' },
        { name: 'Eranda Taila + Shunthi', dosage: '1 tsp', frequency: 'Bedtime with warm water', purpose: 'Virechana & Ama clearance' },
        { name: 'Rasna Saptaka Kwatha', dosage: '40 ml', frequency: 'Twice daily before food', purpose: 'Joint inflammation' },
        { name: 'Brihat Saindhavadya Taila', dosage: 'Local application', frequency: 'OD followed by Valuka Sweda', purpose: 'External Swedana' }
      ],
      labs: [
        { test: 'Nadi Pariksha', value: 'Vata-Kapha Gati', unit: 'Pulse rhythm', refRange: 'Sama', status: 'ABNORMAL' },
        { test: 'Jihva (Tongue)', value: 'Sama (Heavy white coat)', unit: 'Ama index', refRange: 'Nirama', status: 'ABNORMAL' }
      ],
      procedures: ['Valuka Sweda (Dry sand hot fomentation) for knee & wrist swelling']
    }
  }
];
