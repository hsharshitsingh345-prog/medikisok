/**
 * MediKiosk - DPDP Act 2023 & ABDM Consent Manager (Module D)
 * Provides granular, informed, revocable consent with voice guidance
 * for patients of diverse literacy levels.
 */

export const DPDP_CONSENT_TERMS = {
  titleEn: 'Digital Personal Data Protection (DPDP) Act 2023 Consent Agreement',
  titleHi: 'डिजिटल व्यक्तिगत डेटा संरक्षण (DPDP) अधिनियम 2023 सहमति पत्र',
  audioPromptEn: 'Before we begin, do you give consent for MediKiosk to record your spoken medical history and scan your physical documents for today’s OPD consultation? Your data is encrypted and transferred solely to your consulting doctor and ABHA record.',
  audioPromptHi: 'शुरू करने से पहले, क्या आप आज के डॉक्टर परामर्श के लिए अपनी आवाज में बीमारी का विवरण दर्ज करने और मेडिकल पर्चे स्कैन करने की सहमति देते हैं? आपकी जानकारी पूरी तरह सुरक्षित रहेगी।',

  purposes: [
    {
      id: 'clinical_intake',
      titleEn: 'Conversational Medical History Elicitation',
      titleHi: 'बातचीत द्वारा बीमारी का विवरण दर्ज करना',
      descriptionEn: 'Allow AI voice & touch interview to structure chief complaints, symptoms, and medical background.',
      descriptionHi: 'डॉक्टर के लिए आपके लक्षणों और पुरानी बीमारियों का संक्षिप्त विवरण तैयार करने की अनुमति।',
      mandatory: true,
      default: true
    },
    {
      id: 'document_ocr',
      titleEn: 'Paper Document Digitization & OCR Analysis',
      titleHi: 'पुराने पर्चे और लैब रिपोर्ट स्कैन करना',
      descriptionEn: 'Scan and extract medications, abnormal lab values, and diagnoses from physical paper records.',
      descriptionHi: 'आपके पुराने पर्चों से दवाइयों और टेस्ट रिपोर्ट को डिजिटल रूप में बदलने की अनुमति।',
      mandatory: false,
      default: true
    },
    {
      id: 'abdm_link',
      titleEn: 'Sync with ABHA Personal Health Record (PHR)',
      titleHi: 'आयुष्मान भारत (ABHA) रिकॉर्ड से जोड़ना',
      descriptionEn: 'Push structured clinical summary to ABDM Health Information Exchange for lifetime access.',
      descriptionHi: 'इस पर्चे को आपके सरकारी आभा खाते में सुरक्षित रूप से लिंक करना।',
      mandatory: false,
      default: true
    }
  ],

  securityGuarantees: [
    'Zero local persistence: Kiosk RAM is securely sanitized immediately after token generation.',
    'End-to-end 256-bit encryption compliant with ABDM M2/M3 FHIR standards.',
    'Granular revocability: You can withdraw consent anytime before entering the doctor consultation room.'
  ]
};
