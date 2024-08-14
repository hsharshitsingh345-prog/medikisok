# medikiosk

a patient self checkin kiosk i built for SIH (Smart India Hackathon). basically lets patients register themselves at hospital OPDs without needing staff help.

works in hindi and english, verifies aadhaar/ABHA, asks symptom questions, scans documents and sends a proper summary to the doctor's screen.

---

## what it does

**patient side:**
- verify identity using ABHA number or aadhaar OTP
- answer symptom questions (it adapts based on what you say)
- voice guidance in hindi/english using browser speech API
- scan physical documents like prescriptions and lab reports (uses tesseract OCR)
- AYUSH mode for ayurvedic patients - does prakriti assessment
- auto detects red flags like chest pain or stroke symptoms and triggers SOS

**doctor side:**
- see the patient queue sorted by priority
- full clinical summary per patient
- FHIR R4 bundle for each patient (for hospital EMR integration)
- consent management as per DPDP act

---

## tech used

- React 19 + Vite
- Tesseract.js for OCR
- jsQR for ABHA QR scanning
- lucide-react icons
- Web Speech API (no external TTS service needed)
- FHIR R4 for clinical data format

---

## setup

```bash
npm install
npm run dev
```

runs on http://localhost:5173

---

## project structure

```
src/
  components/       <- all UI screens
  modules/
    abdmConsent/        <- ABHA auth, verhoeff checksum, DPDP consent
    documentIntelligence/ <- OCR + lab abnormality detection
    historyEngine/       <- adaptive symptom questionnaire + red flag detection
    summaryGenerator/    <- builds clinical summary + FHIR bundle
```

---

## demo patients (pre-loaded)

| name | complaint | priority |
|------|-----------|----------|
| Rameshwar Sharma | chest pain (suspected STEMI) | critical |
| Kanti Devi | breathlessness + pedal edema | high |
| Sunita Devi | amavata (AYUSH pathway) | moderate |

---

## compliance

built keeping ABDM guidelines in mind - ABHA verification with verhoeff checksum, FHIR R4 bundle output, DPDP act consent flows. no PHI stored in localstorage.

---

made for SIH 2024 | Harshit Singh
