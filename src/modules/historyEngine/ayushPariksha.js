/**
 * MediKiosk - AYUSH History Mode: Ayurvedic Intake & Dashavidha Pariksha
 * Implements:
 * 1. Prakriti Assessment (Vata, Pitta, Kapha constitutional traits)
 * 2. Agni Pariksha (Mandagni, Tikshnagni, Vishamagni, Samagni)
 * 3. Koshtha Pariksha (Krura, Mridu, Madhyama)
 * 4. Ahara-Vihara Assessment (Dietary intake, seasonal habits, sleep, stress)
 * 5. Dashavidha Pariksha summary parameters
 */

export const AYUSH_CHIEF_COMPLAINTS = [
  { id: 'amavata', name: 'Amavata (Rheumatoid / Joint Pain / आमवात)', dosha: 'Vata-Kapha' },
  { id: 'amlapitta', name: 'Amlapitta (Hyperacidity / GERD / अम्लपित्त)', dosha: 'Pitta' },
  { id: 'prameha', name: 'Prameha / Madhumeha (Diabetes / प्रमेह)', dosha: 'Kapha' },
  { id: 'shwasa_kasa', name: 'Shwasa & Kasa (Asthma / Chronic Cough / श्वास-कास)', dosha: 'Vata-Kapha' },
  { id: 'sandhivata', name: 'Sandhivata (Osteoarthritis / संधिवात)', dosha: 'Vata' },
  { id: 'twak_roga', name: 'Twak Roga (Skin disorders / त्वक रोग)', dosha: 'Pitta-Rakta' },
  { id: 'anidra_manas', name: 'Anidra & Manas Roga (Insomnia / Anxiety / अनिद्रा)', dosha: 'Vata-Raja' }
];

export const PRAKRITI_QUESTIONS = [
  {
    id: 'body_frame',
    param: 'Deha Prakriti (Physical Frame)',
    promptEn: 'What best describes your body build and weight tendency?',
    promptHi: 'आपका शारीरिक ढांचा और वजन की प्रवृत्ति कैसी है?',
    options: [
      { label: 'Thin, slender frame; difficult to gain weight (Vata dominant)', value: 'vata', dosha: 'Vata' },
      { label: 'Medium, muscular athletic build; stable weight (Pitta dominant)', value: 'pitta', dosha: 'Pitta' },
      { label: 'Broad, heavy, stocky frame; easily gains weight (Kapha dominant)', value: 'kapha', dosha: 'Kapha' }
    ]
  },
  {
    id: 'skin_hair',
    param: 'Twak & Kesha (Skin & Hair Nature)',
    promptEn: 'What is the natural texture of your skin and hair?',
    promptHi: 'आपकी त्वचा और बालों की प्रकृति कैसी रहती है?',
    options: [
      { label: 'Dry, rough skin; brittle or frizzy hair; cracked heels (Vata)', value: 'vata', dosha: 'Vata' },
      { label: 'Warm, oily T-zone; prone to redness, acne, early greying (Pitta)', value: 'pitta', dosha: 'Pitta' },
      { label: 'Thick, smooth, oily, radiant skin; lustrous thick dark hair (Kapha)', value: 'kapha', dosha: 'Kapha' }
    ]
  },
  {
    id: 'temperature_weather',
    param: 'Satmya / Weather Sensitivity',
    promptEn: 'Which weather or environmental condition causes you the most discomfort?',
    promptHi: 'किस तरह के मौसम में आपको सबसे ज्यादा परेशानी होती है?',
    options: [
      { label: 'Cold winds and dry winters cause joint stiffness and dryness (Vata)', value: 'vata', dosha: 'Vata' },
      { label: 'Hot summer sun causes excessive sweating, anger, acidity, rashes (Pitta)', value: 'pitta', dosha: 'Pitta' },
      { label: 'Damp, cold, humid monsoon creates heaviness, lethargy, congestion (Kapha)', value: 'kapha', dosha: 'Kapha' }
    ]
  }
];

export const AGNI_KOSHTHA_QUESTIONS = [
  {
    id: 'agni',
    param: 'Agni Pariksha (Digestive Fire Capacity)',
    promptEn: 'How would you describe your appetite and digestion?',
    promptHi: 'आपकी भूख और पाचन की स्थिति कैसी रहती है?',
    options: [
      { 
        label: 'Vishamagni: Irregular, unpredictable appetite; gas & bloating after meals (Vata)', 
        value: 'vishamagni', 
        desc: 'Irregular metabolism, variable digestive power' 
      },
      { 
        label: 'Tikshnagni: Very strong, fierce appetite; burning hunger, irritability if delayed (Pitta)', 
        value: 'tikshnagni', 
        desc: 'Hyper-metabolism, high acid turnover' 
      },
      { 
        label: 'Mandagni: Weak, sluggish digestion; lack of appetite, fullness for hours (Kapha)', 
        value: 'mandagni', 
        desc: 'Hypo-metabolism, Ama (toxin) accumulation tendency' 
      },
      { 
        label: 'Samagni: Balanced, regular healthy digestion without distress', 
        value: 'samagni', 
        desc: 'Balanced digestive metabolism' 
      }
    ]
  },
  {
    id: 'koshtha',
    param: 'Koshtha Pariksha (Bowel Nature)',
    promptEn: 'How do your bowels behave regarding regularity and firmness?',
    promptHi: 'पेट साफ होने (शौच) की सामान्य स्थिति कैसी है?',
    options: [
      { 
        label: 'Krura Koshtha: Hard, dry stools, prone to constipation; requires strong laxatives (Vata)', 
        value: 'krura', 
        desc: 'Hard bowel habit' 
      },
      { 
        label: 'Mridu Koshtha: Soft or loose stools, easily provoked by warm milk or mild herbs (Pitta)', 
        value: 'mridu', 
        desc: 'Soft / loose bowel habit' 
      },
      { 
        label: 'Madhyama Koshtha: Regular once-daily well-formed stools without straining (Kapha/Sama)', 
        value: 'madhyama', 
        desc: 'Moderate balanced bowel' 
      }
    ]
  },
  {
    id: 'nidra_manas',
    param: 'Nidra (Sleep) & Manas (Mind State)',
    promptEn: 'How is the quality of your sleep and mental disposition?',
    promptHi: 'आपकी नींद और मानसिक शांति कैसी रहती है?',
    options: [
      { label: 'Light, disturbed sleep; active racing thoughts; anxiety prone (Vata)', value: 'vata_mind' },
      { label: 'Moderate sleep (6-7 hrs); intense vivid dreams; easily irritable (Pitta)', value: 'pitta_mind' },
      { label: 'Deep, heavy, prolonged sleep (>8 hrs); slow to wake up; calm (Kapha)', value: 'kapha_mind' }
    ]
  }
];

export const AHARA_VIHARA_QUESTIONS = [
  {
    id: 'ahara_rasa',
    param: 'Ahara Rasa Predominance (Dominant Tastes in Diet)',
    promptEn: 'Which tastes do you naturally crave or consume most daily?',
    promptHi: 'आप अपने दैनिक भोजन में किस स्वाद को सबसे अधिक प्राथमिकता देते हैं?',
    multiSelect: true,
    options: [
      { label: 'Katu & Lavana (Spicy, salty, deep-fried snacks) - Aggravates Pitta', value: 'spicy_salty' },
      { label: 'Madhura (Sweets, refined carbs, dairy) - Aggravates Kapha', value: 'sweets_dairy' },
      { label: 'Ruksha (Dry, stale, packaged snacks, irregular timing) - Aggravates Vata', value: 'dry_irregular' },
      { label: 'Shad-rasa balanced home cooked satvik food', value: 'balanced_satvik' }
    ]
  },
  {
    id: 'vyayama',
    param: 'Vyayama Shakti (Physical Exercise & Activity)',
    promptEn: 'What is your current level of daily physical exertion?',
    promptHi: 'आप रोजाना कितना शारीरिक व्यायाम या श्रम करते हैं?',
    options: [
      { label: 'Alpa (Sedentary desk work, almost zero physical exercise)', value: 'sedentary' },
      { label: 'Madhyama (30–45 mins brisk walk / yoga / moderate chores)', value: 'moderate' },
      { label: 'Uttama (Vigorous daily workouts or heavy manual labor)', value: 'intense' }
    ]
  }
];

/**
 * Calculates Prakriti and Dosha imbalance score based on selections
 */
export function calculateAyushProfile(answers) {
  let vataScore = 0;
  let pittaScore = 0;
  let kaphaScore = 0;

  Object.values(answers).forEach(val => {
    if (typeof val === 'string') {
      if (val.includes('vata')) vataScore += 2;
      if (val.includes('pitta')) pittaScore += 2;
      if (val.includes('kapha')) kaphaScore += 2;
      if (val === 'vishamagni' || val === 'krura') vataScore += 2;
      if (val === 'tikshnagni' || val === 'mridu') pittaScore += 2;
      if (val === 'mandagni') kaphaScore += 2;
    }
  });

  const total = Math.max(1, vataScore + pittaScore + kaphaScore);
  const vataPct = Math.round((vataScore / total) * 100);
  const pittaPct = Math.round((pittaScore / total) * 100);
  const kaphaPct = 100 - (vataPct + pittaPct);

  let dominantPrakriti = 'Vata-Pitta';
  if (vataPct >= pittaPct && vataPct >= kaphaPct) dominantPrakriti = 'Vata Dominant (वातज)';
  else if (pittaPct >= vataPct && pittaPct >= kaphaPct) dominantPrakriti = 'Pitta Dominant (पित्तज)';
  else dominantPrakriti = 'Kapha Dominant (कफज)';

  return {
    dominantPrakriti,
    breakdown: { Vata: vataPct, Pitta: pittaPct, Kapha: kaphaPct },
    agni: answers.agni || 'Vishamagni',
    koshtha: answers.koshtha || 'Madhyama',
    dashavidha: {
      Prakriti: dominantPrakriti,
      Vikriti: 'Dosha Dushya Sammurchana evident',
      Sara: 'Madhyama Sara (Medium tissue quality)',
      Samhanana: 'Madhyama (Compactness)',
      Pramana: 'Normal anthropometric proportion',
      Satmya: 'Sarva Rasa Satmya',
      Sattva: answers.nidra_manas?.includes('vata') ? 'Avara Sattva (High anxiety)' : 'Madhyama Sattva',
      AharaShakti: answers.agni || 'Madhyama',
      VyayamaShakti: answers.vyayama || 'Madhyama',
      Vaya: 'Madhyama Vaya (Adult)'
    }
  };
}
