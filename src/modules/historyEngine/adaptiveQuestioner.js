/**
 * MediKiosk - Adaptive Clinical History Engine
 * Implements the SOCRATES framework (Site, Onset, Character, Radiation, Associations, Time, Exacerbating/Relieving, Severity)
 * for common chief complaints in Indian OPDs, with dual voice prompts (English & Hindi) and touch options.
 */

export const CHIEF_COMPLAINTS = [
  {
    id: 'chest_pain',
    name: 'Chest Pain / छाती में दर्द',
    icon: 'HeartPulse',
    category: 'Cardiovascular / Thoracic',
    redFlagSuspect: true,
    description: 'Discomfort, pressure, tightness, or pain in chest region'
  },
  {
    id: 'breathlessness',
    name: 'Shortness of Breath / सांस लेने में तकलीफ',
    icon: 'Wind',
    category: 'Respiratory / Cardiovascular',
    redFlagSuspect: true,
    description: 'Difficulty breathing, wheezing, or suffocating sensation'
  },
  {
    id: 'abdominal_pain',
    name: 'Abdominal Pain / पेट में दर्द',
    icon: 'Activity',
    category: 'Gastrointestinal',
    redFlagSuspect: false,
    description: 'Stomach ache, cramps, burning sensation, or bloating'
  },
  {
    id: 'fever_chills',
    name: 'Fever & Chills / तेज बुखार व कंपकंपी',
    icon: 'Thermometer',
    category: 'Infectious / General',
    redFlagSuspect: false,
    description: 'Elevated body temperature, rigors, body aches'
  },
  {
    id: 'headache_neuro',
    name: 'Headache & Dizziness / सिरदर्द व चक्कर',
    icon: 'Brain',
    category: 'Neurological',
    redFlagSuspect: true,
    description: 'Throbbing headache, vertigo, vision blur, or fainting'
  },
  {
    id: 'joint_back_pain',
    name: 'Joint & Back Pain / जोड़ों व कमर का दर्द',
    icon: 'Bone',
    category: 'Musculoskeletal / Rheumatology',
    redFlagSuspect: false,
    description: 'Stiffness, swelling, chronic backache, or arthritis pain'
  },
  {
    id: 'cough_cold',
    name: 'Chronic Cough / पुरानी खांसी',
    icon: 'Lungs',
    category: 'Respiratory',
    redFlagSuspect: false,
    description: 'Productive or dry cough lasting several days or weeks'
  },
  {
    id: 'fatigue_weakness',
    name: 'Fatigue & Weight Loss / कमजोरी व वजन घटना',
    icon: 'ZapOff',
    category: 'Metabolic / Endocrine',
    redFlagSuspect: false,
    description: 'Extreme tiredness, excessive thirst, or unexplained weight drop'
  }
];

export const SOCRATES_QUESTIONS = {
  chest_pain: [
    {
      id: 'onset',
      step: 'Onset (कब शुरू हुआ)',
      promptEn: 'When did this chest pain start and how did it begin?',
      promptHi: 'यह छाती का दर्द कब शुरू हुआ और कैसे शुरू हुआ?',
      options: [
        { label: 'Suddenly within the last 1–2 hours / अचानक 1-2 घंटे में', value: 'sudden_acute', redFlag: true },
        { label: 'Gradually over several days / धीरे-धीरे कई दिनों में', value: 'gradual_days' },
        { label: 'Intermittently for weeks or months / कई हफ्तों या महीनों से कभी-कभी', value: 'intermittent_chronic' },
        { label: 'After intense physical exertion / भारी काम या दौड़ने के बाद', value: 'post_exertion', redFlag: true }
      ]
    },
    {
      id: 'character',
      step: 'Character (दर्द का प्रकार)',
      promptEn: 'What does the pain feel like?',
      promptHi: 'दर्द किस तरह का महसूस हो रहा है?',
      options: [
        { label: 'Crushing, heavy pressure like a stone / भारी दबाव या पत्थर जैसा खिंचाव', value: 'crushing_pressure', redFlag: true },
        { label: 'Sharp, stabbing or pricking / सुई जैसा चुभने वाला तेज दर्द', value: 'sharp_stabbing' },
        { label: 'Burning sensation behind breastbone / छाती में जलन (हार्टबर्न जैसा)', value: 'burning_retrosternal' },
        { label: 'Aching or muscular soreness / मांसपेशियों में खिंचाव या हल्का दर्द', value: 'dull_ache' }
      ]
    },
    {
      id: 'radiation',
      step: 'Radiation (दर्द कहाँ फैलता है)',
      promptEn: 'Does the pain spread or radiate to any other part of your body?',
      promptHi: 'क्या यह दर्द शरीर के किसी अन्य हिस्से की तरफ फैलता है?',
      options: [
        { label: 'Yes, radiates to left arm, shoulder, or jaw / हाँ, बाएं हाथ, कंधे या जबड़े में', value: 'left_arm_jaw', redFlag: true },
        { label: 'Yes, spreads directly to the upper back / हाँ, सीधे पीठ की तरफ', value: 'upper_back' },
        { label: 'Yes, moves downwards to upper abdomen / हाँ, पेट के ऊपरी हिस्से में', value: 'epigastric' },
        { label: 'No, stays localized in one spot / नहीं, केवल एक ही जगह रहता है', value: 'localized_none' }
      ]
    },
    {
      id: 'associated',
      step: 'Associated Symptoms (साथ में अन्य लक्षण)',
      promptEn: 'Are you experiencing any of these associated symptoms right now?',
      promptHi: 'क्या आपको साथ में इनमें से कोई अन्य लक्षण महसूस हो रहे हैं?',
      multiSelect: true,
      options: [
        { label: 'Cold sweating / ठंडा पसीना आना', value: 'cold_sweats', redFlag: true },
        { label: 'Shortness of breath / सांस फूलना', value: 'breathlessness', redFlag: true },
        { label: 'Nausea or dizziness / उल्टी का मन या चक्कर आना', value: 'nausea_dizziness', redFlag: true },
        { label: 'Palpitations / दिल की धड़कन तेज होना', value: 'palpitations' },
        { label: 'Acid taste in mouth / खट्टा पानी या डकार आना', value: 'acid_reflux' },
        { label: 'None of the above / इनमें से कोई नहीं', value: 'none' }
      ]
    },
    {
      id: 'severity',
      step: 'Severity (दर्द की तीव्रता 1–10)',
      promptEn: 'On a scale of 1 to 10, how severe is the pain?',
      promptHi: '1 से 10 के पैमाने पर दर्द कितना तेज है?',
      options: [
        { label: 'Mild (1 - 3) / हल्का', value: 'mild_1_3' },
        { label: 'Moderate (4 - 6) / मध्यम', value: 'moderate_4_6' },
        { label: 'Severe (7 - 8) / तेज असहनीय', value: 'severe_7_8' },
        { label: 'Extremely Severe (9 - 10) / अत्यधिक असहनीय', value: 'extreme_9_10', redFlag: true }
      ]
    }
  ],

  breathlessness: [
    {
      id: 'onset',
      step: 'Onset & Timing',
      promptEn: 'How quickly did your breathing difficulty develop?',
      promptHi: 'सांस की तकलीफ कितनी जल्दी शुरू हुई?',
      options: [
        { label: 'Sudden onset within minutes / अचानक कुछ ही मिनटों में', value: 'sudden_minutes', redFlag: true },
        { label: 'Worsened over 24–48 hours / पिछले 1-2 दिनों में बढ़ी', value: 'subacute_days' },
        { label: 'Chronic, present for months / कई महीनों से पुरानी समस्या', value: 'chronic_months' }
      ]
    },
    {
      id: 'position',
      step: 'Positional Effects (लेटने पर असर)',
      promptEn: 'Does breathlessness worsen when you lie flat on your back?',
      promptHi: 'क्या सीधा पीठ के बल लेटने पर सांस ज्यादा फूलती है?',
      options: [
        { label: 'Yes, must sit up or use 2–3 pillows to breathe (Orthopnea)', value: 'orthopnea', redFlag: true },
        { label: 'Wake up choking at night (PND)', value: 'pnd', redFlag: true },
        { label: 'No difference with position', value: 'no_orthopnea' }
      ]
    },
    {
      id: 'associated',
      step: 'Associated Symptoms',
      promptEn: 'Do you have swelling in your feet, cough, or blue discoloration?',
      promptHi: 'क्या पैरों में सूजन, खांसी या होंठ नीले पड़ने जैसी समस्या है?',
      multiSelect: true,
      options: [
        { label: 'Bilateral ankle/feet swelling (पैरों में सूजन)', value: 'pedal_edema' },
        { label: 'Wheezing or whistling sound in chest (सीटी जैसी आवाज)', value: 'wheeze' },
        { label: 'Bluish lips or fingertips (Cyanosis)', value: 'cyanosis', redFlag: true },
        { label: 'Cough with pink frothy sputum', value: 'pink_sputum', redFlag: true },
        { label: 'High fever with productive cough', value: 'fever_cough' }
      ]
    }
  ],

  abdominal_pain: [
    {
      id: 'site',
      step: 'Site (दर्द का स्थान)',
      promptEn: 'Where in your abdomen is the pain primarily located?',
      promptHi: 'पेट के किस हिस्से में सबसे ज्यादा दर्द है?',
      options: [
        { label: 'Upper center / Epigastric (पेट के ऊपरी बीच में)', value: 'epigastric' },
        { label: 'Right upper side under ribs (दाहिनी पसली के नीचे - Gallbladder/Liver)', value: 'ruq' },
        { label: 'Right lower abdomen (दाहिनी तरफ नीचे - Appendix)', value: 'rlq', redFlag: true },
        { label: 'Lower abdomen / Pelvic (नाभि के नीचे पेडू में)', value: 'suprapubic' },
        { label: 'All over entire abdomen (पूरे पेट में फैला हुआ)', value: 'generalized' }
      ]
    },
    {
      id: 'relation_food',
      step: 'Relation to Meals (भोजन से संबंध)',
      promptEn: 'Does eating food make the pain better, worse, or no change?',
      promptHi: 'खाना खाने से दर्द बढ़ता है, घटता है या कोई फर्क नहीं पड़ता?',
      options: [
        { label: 'Pain increases within 30 mins after fatty/heavy food', value: 'worse_postprandial' },
        { label: 'Pain relieved temporarily by food or milk (Duodenal pattern)', value: 'relieved_by_food' },
        { label: 'Severe vomiting, cannot keep any liquids down', value: 'intractable_vomiting', redFlag: true },
        { label: 'No relation to food intake', value: 'no_relation' }
      ]
    },
    {
      id: 'bowel_habits',
      step: 'Bowel Changes (शौच में बदलाव)',
      promptEn: 'Have you noticed any changes in stool or bowel habits?',
      promptHi: 'क्या शौच (मल) में कोई बदलाव या खून देखा है?',
      options: [
        { label: 'Black tarry stool or blood in stool (काला या खूनी मल)', value: 'melena_blood', redFlag: true },
        { label: 'Severe watery diarrhea (>5 times a day)', value: 'watery_diarrhea' },
        { label: 'No bowel movement or gas passing for 2+ days', value: 'obstipation', redFlag: true },
        { label: 'Normal regular stools', value: 'normal' }
      ]
    }
  ],

  fever_chills: [
    {
      id: 'duration',
      step: 'Duration & Pattern (बुखार के दिन व पैटर्न)',
      promptEn: 'How many days have you had fever, and does it come with chills?',
      promptHi: 'कितने दिनों से बुखार है, और क्या कंपकंपी के साथ चढ़ता है?',
      options: [
        { label: '1–3 days, acute with high shivering/chills (Malaria/Dengue suspect)', value: 'acute_chills' },
        { label: '4–7 days, continuous step-ladder high fever (Typhoid suspect)', value: 'stepladder_typhoid' },
        { label: 'More than 2–3 weeks with evening rise and night sweats (TB suspect)', value: 'chronic_evening_rise' },
        { label: 'Intermittent low-grade fever with joint aches', value: 'low_grade_viral' }
      ]
    },
    {
      id: 'warning_signs',
      step: 'Warning Signs (गंभीर लक्षण)',
      promptEn: 'Do you have red spots on skin, bleeding, or extreme confusion?',
      promptHi: 'क्या त्वचा पर लाल चकत्ते, मसूड़ों/नाक से खून, या भारी सुस्ती है?',
      multiSelect: true,
      options: [
        { label: 'Bleeding from gums/nose or red petechial skin rashes (Dengue warning)', value: 'bleeding_rash', redFlag: true },
        { label: 'Stiff neck, photophobia, or altered mental state (Meningitis warning)', value: 'stiff_neck_confusion', redFlag: true },
        { label: 'Severe burning during urination with flank pain', value: 'dysuria_pyelonephritis' },
        { label: 'None of these warning signs', value: 'none' }
      ]
    }
  ]
};

export const REVIEW_OF_SYSTEMS_QUESTIONS = [
  {
    id: 'general',
    system: 'General Health & Comorbidities',
    promptEn: 'Do you have any existing diagnosed conditions?',
    promptHi: 'क्या आपको पहले से इनमें से कोई बीमारी है?',
    multiSelect: true,
    options: [
      { label: 'Diabetes Mellitus / शुगर / मधुमेह', value: 'diabetes' },
      { label: 'Hypertension / हाई ब्लड प्रेशर', value: 'hypertension' },
      { label: 'Coronary Artery Disease / हार्ट की बीमारी', value: 'cad' },
      { label: 'Asthma / COPD / दमा या श्वास रोग', value: 'asthma' },
      { label: 'Chronic Kidney Disease / गुर्दे की बीमारी', value: 'ckd' },
      { label: 'Thyroid disorder / थायरॉइड', value: 'thyroid' },
      { label: 'None / कोई नहीं', value: 'none' }
    ]
  },
  {
    id: 'allergies',
    system: 'Drug & Food Allergies',
    promptEn: 'Are you allergic to any medicines (e.g. Penicillin, Sulfa, Painkillers)?',
    promptHi: 'क्या आपको किसी दवा या खाने से कोई एलर्जी है?',
    options: [
      { label: 'No known drug allergies (NKDA) / कोई एलर्जी नहीं', value: 'nkda' },
      { label: 'Penicillin / Amoxicillin allergy (पेनिसिलिन)', value: 'penicillin_allergy' },
      { label: 'NSAID / Painkiller allergy (जैसे ब्रूफेन, डिक्लोफेनाक)', value: 'nsaid_allergy' },
      { label: 'Sulfa drugs / सल्फा दवाएं', value: 'sulfa_allergy' },
      { label: 'Other drug allergies / अन्य एलर्जी', value: 'other_allergy' }
    ]
  },
  {
    id: 'habits',
    system: 'Personal History & Habits',
    promptEn: 'Do you consume tobacco, bidi/cigarettes, or alcohol?',
    promptHi: 'क्या आप बीड़ी, सिगरेट, गुटखा/तंबाकू या शराब का सेवन करते हैं?',
    multiSelect: true,
    options: [
      { label: 'Chewing Tobacco / Gutkha / खैनी या गुटखा', value: 'chew_tobacco' },
      { label: 'Smoking (Bidi / Cigarette) / बीड़ी या सिगरेट', value: 'smoking' },
      { label: 'Alcohol consumption / शराब का सेवन', value: 'alcohol' },
      { label: 'Strict Vegetarian diet / शाकाहारी भोजन', value: 'vegetarian' },
      { label: 'No tobacco or alcohol / कोई नशा नहीं', value: 'teetotaler' }
    ]
  }
];
