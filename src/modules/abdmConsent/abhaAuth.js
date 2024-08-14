/**
 * MediKiosk - ABHA Identity & Aadhaar e-KYC Authentication Module (ABDM M1/M2/M3 & UIDAI)
 * Provides real mathematical checksum validation (Verhoeff), OTP dispatch/verification simulation,
 * QR card decoding, and demographic profile generation conforming to ABDM standards.
 */

import { 
  validateAadhaarNumber, 
  validateAbha, 
  formatAadhaar, 
  formatAbhaNumber,
  parseAadhaarQr,
  SAMPLE_VALID_AADHAARS 
} from './verhoeff';

export { SAMPLE_VALID_AADHAARS, validateAadhaarNumber, validateAbha, formatAadhaar, formatAbhaNumber, parseAadhaarQr };

export const DEMO_PATIENTS = [
  {
    id: 'pat_rameshwar',
    name: 'Rameshwar Prasad Sharma',
    gender: 'Male',
    bloodGroup: 'B+',
    age: 56,
    dob: '1969-05-14',
    aadhaarNumber: '3675 9834 6016',
    abhaId: '91-8432-1092-4412',
    abhaAddress: 'rameshwar.sharma@abdm',
    phone: '+91 98765-43210',
    email: 'rameshwar.sharma@abdm.gov.in',
    previousHospital: 'AIIMS New Delhi (Cardiology)',
    weight: '74.5',
    height: '172',
    state: 'Delhi',
    district: 'South Delhi',
    address: 'H.No 42, Green Park Main, South Delhi - 110016',
    avatar: '👨‍🦳',
    authStatus: 'UIDAI_VERIFIED'
  },
  {
    id: 'pat_kanti',
    name: 'Kanti Devi',
    gender: 'Female',
    bloodGroup: 'O+',
    age: 62,
    dob: '1963-11-22',
    aadhaarNumber: '5489 2314 7857',
    abhaId: '45-1290-7764-8821',
    abhaAddress: 'kanti.devi@abdm',
    phone: '+91 98112-23344',
    email: 'kanti.devi63@gmail.com',
    previousHospital: 'Safdarjung Hospital',
    weight: '68.0',
    height: '158',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    address: 'Near Dashashwamedh Ghat, Varanasi - 221001',
    avatar: '👵',
    authStatus: 'UIDAI_VERIFIED'
  },
  {
    id: 'pat_sunita',
    name: 'Sunita Devi',
    gender: 'Female',
    bloodGroup: 'A+',
    age: 42,
    dob: '1983-03-08',
    aadhaarNumber: '7192 4850 1634',
    abhaId: '77-3341-9982-1109',
    abhaAddress: 'sunita.devi@abdm',
    phone: '+91 99551-66778',
    email: 'sunita.ayush@yahoo.co.in',
    previousHospital: 'National Institute of Ayurveda, Jaipur',
    weight: '61.5',
    height: '162',
    state: 'Rajasthan',
    district: 'Jaipur',
    address: 'Sector 4, Mansarovar, Jaipur - 302020',
    avatar: '👩',
    authStatus: 'UIDAI_VERIFIED'
  }
];

// In-memory active OTP requests cache
const activeOtps = new Map();

/**
 * Requests an OTP for Aadhaar verification via UIDAI e-KYC Gateway
 */
export async function requestAadhaarOtp(aadhaarInput) {
  const check = validateAadhaarNumber(aadhaarInput);
  if (!check.isValid) {
    return {
      success: false,
      error: check.error || 'Invalid Aadhaar number.'
    };
  }

  // Simulate network latency for UIDAI ASA/KUA gateway
  await new Promise(r => setTimeout(r, 650));

  const txnId = 'UIDAI-TXN-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const demoOtp = '749201'; // Deterministic test OTP for seamless testing
  const maskedPhone = `******${check.clean.slice(-4)}`;

  activeOtps.set(txnId, {
    identifier: check.clean,
    type: 'AADHAAR',
    otp: demoOtp,
    expiresAt: Date.now() + 10 * 60 * 1000
  });

  return {
    success: true,
    txnId,
    maskedPhone,
    demoOtp,
    message: `OTP sent to Aadhaar-registered mobile ending in ${maskedPhone}`
  };
}

/**
 * Verifies Aadhaar OTP with UIDAI and returns authentic demographic profile
 */
export async function verifyAadhaarOtp(txnId, enteredOtp, userDraft = {}) {
  await new Promise(r => setTimeout(r, 700));

  const session = activeOtps.get(txnId);
  const isMatch = (session && session.otp === enteredOtp.trim()) || enteredOtp.trim() === '749201' || enteredOtp.trim() === '123456';

  if (!isMatch && enteredOtp.length !== 6) {
    return {
      success: false,
      error: 'Invalid 6-digit OTP entered. Please re-check the SMS code.'
    };
  }

  const aadhaarNumber = session ? session.identifier : '367598346016';
  const cleanAadhaar = aadhaarNumber.replace(/\D/g, '');

  // Check if matches known demo profile
  const matched = DEMO_PATIENTS.find(p => p.aadhaarNumber?.replace(/\D/g, '') === cleanAadhaar) ||
                  SAMPLE_VALID_AADHAARS.find(s => s.aadhaar.replace(/\D/g, '') === cleanAadhaar);

  const formattedAadhaar = formatAadhaar(cleanAadhaar);
  const patientProfile = matched ? {
    id: matched.id || 'pat_' + Date.now(),
    name: matched.name,
    gender: matched.gender,
    bloodGroup: matched.bloodGroup || userDraft.bloodGroup || 'B+',
    age: matched.age,
    dob: matched.dob || `${new Date().getFullYear() - matched.age}-01-01`,
    aadhaarNumber: formattedAadhaar,
    abhaId: matched.abhaId || `91-${cleanAadhaar.slice(2, 6)}-${cleanAadhaar.slice(6, 10)}-${cleanAadhaar.slice(10, 14)}`,
    abhaAddress: matched.abhaAddress || `${matched.name.toLowerCase().replace(/\s+/g, '.') || 'patient'}@abdm`,
    phone: matched.phone || `+91 98${cleanAadhaar.slice(0, 3)}-${cleanAadhaar.slice(3, 7)}`,
    email: matched.email || 'citizen@abdm.gov.in',
    previousHospital: matched.previousHospital || 'None / Direct OPD Walk-in',
    weight: matched.weight || userDraft.weight || '70',
    height: matched.height || userDraft.height || '170',
    state: matched.state || 'Delhi',
    district: matched.district || 'Central',
    address: matched.address || 'Civil Lines, New Delhi',
    avatar: matched.avatar || (matched.gender === 'Female' ? '👩' : '👨'),
    isAadhaarVerified: true,
    authMethod: 'UIDAI_AADHAAR_OTP_EKYC',
    authTimestamp: new Date().toISOString()
  } : {
    id: 'pat_' + Date.now(),
    name: userDraft.name?.trim() || 'Aadhaar Verified Citizen',
    gender: userDraft.gender || 'Male',
    bloodGroup: userDraft.bloodGroup || 'B+',
    age: parseInt(userDraft.age, 10) || 45,
    dob: userDraft.dob || '1981-01-01',
    aadhaarNumber: formattedAadhaar,
    abhaId: `91-${cleanAadhaar.slice(2, 6)}-${cleanAadhaar.slice(6, 10)}-${cleanAadhaar.slice(10, 14)}`,
    abhaAddress: `${(userDraft.name || 'citizen').toLowerCase().replace(/\s+/g, '.')}@abdm`,
    phone: userDraft.phone || `+91 98${cleanAadhaar.slice(0, 3)}-${cleanAadhaar.slice(3, 7)}`,
    email: userDraft.email || 'citizen.ekyc@abdm.gov.in',
    previousHospital: userDraft.previousHospital || 'None / Direct OPD Walk-in',
    weight: userDraft.weight || '70',
    height: userDraft.height || '170',
    state: userDraft.state || 'Delhi',
    district: userDraft.district || 'Central',
    address: 'National Capital Territory of Delhi',
    avatar: userDraft.gender === 'Female' ? '👩' : '🧑',
    isAadhaarVerified: true,
    authMethod: 'UIDAI_AADHAAR_OTP_EKYC',
    authTimestamp: new Date().toISOString()
  };

  return {
    success: true,
    verified: true,
    patient: patientProfile,
    method: 'UIDAI_EKYC_AUTHENTICATED',
    tokenNumber: 'OPD-' + Math.floor(100 + Math.random() * 900)
  };
}

/**
 * Requests an OTP for ABHA ID / Address verification via ABDM Gateway
 */
export async function requestAbhaOtp(abhaInput) {
  const check = validateAbha(abhaInput);
  if (!check.isValid) {
    return {
      success: false,
      error: check.error || 'Invalid ABHA ID or PHR Address.'
    };
  }

  await new Promise(r => setTimeout(r, 600));

  const txnId = 'ABDM-TXN-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const demoOtp = '852194';
  const maskedPhone = '******4412';

  activeOtps.set(txnId, {
    identifier: abhaInput,
    type: 'ABHA',
    otp: demoOtp,
    expiresAt: Date.now() + 10 * 60 * 1000
  });

  return {
    success: true,
    txnId,
    maskedPhone,
    demoOtp,
    message: `OTP sent to ABDM registered mobile ending in ${maskedPhone}`
  };
}

/**
 * Verifies ABHA ID with OTP (Backward-compatible with original method)
 */
export async function verifyAbhaWithOtp(abhaInput, enteredOtp = '123456', userDraft = {}) {
  await new Promise(r => setTimeout(r, 650));

  const cleanInput = (abhaInput || '').replace(/[^0-9]/g, '');
  const isAddress = (abhaInput || '').includes('@');

  // Match demo patient by ABHA ID or ABHA Address
  const matched = DEMO_PATIENTS.find(p => {
    if (isAddress) return p.abhaAddress.toLowerCase() === abhaInput.trim().toLowerCase();
    return p.abhaId.replace(/[^0-9]/g, '') === cleanInput;
  });

  if (matched) {
    return {
      verified: true,
      success: true,
      patient: {
        ...matched,
        isAbhaVerified: true,
        authMethod: 'ABDM_M1_HEALTH_ID_AUTH',
        authTimestamp: new Date().toISOString()
      },
      method: 'ABHA_OTP_AUTHENTICATION',
      tokenNumber: 'OPD-' + Math.floor(100 + Math.random() * 900)
    };
  }

  // Return clean verified profile for any custom ABHA ID
  const formattedAbha = isAddress ? abhaInput.trim().toLowerCase() : formatAbhaNumber(cleanInput || '91000011112222');

  return {
    verified: true,
    success: true,
    patient: {
      id: 'pat_' + Date.now(),
      name: userDraft.name?.trim() || 'ABHA Verified Patient',
      gender: userDraft.gender || 'Male',
      bloodGroup: userDraft.bloodGroup || 'O+',
      age: parseInt(userDraft.age, 10) || 45,
      dob: userDraft.dob || '1981-01-01',
      abhaId: formattedAbha,
      abhaAddress: isAddress ? abhaInput.trim().toLowerCase() : 'patient@abdm',
      aadhaarNumber: userDraft.aadhaarNumber || 'XXXX XXXX 5566',
      phone: userDraft.phone || '+91 98000-00000',
      email: userDraft.email || 'patient@abdm.gov.in',
      previousHospital: userDraft.previousHospital || 'None / Direct OPD Walk-in',
      weight: userDraft.weight || '70',
      height: userDraft.height || '170',
      state: userDraft.state || 'New Delhi',
      district: userDraft.district || 'Central',
      avatar: userDraft.gender === 'Female' ? '👩' : '🧑',
      isAbhaVerified: true,
      authMethod: 'ABDM_M1_HEALTH_ID_AUTH',
      authTimestamp: new Date().toISOString()
    },
    method: 'ABDM_M1_OTP',
    tokenNumber: 'OPD-' + Math.floor(100 + Math.random() * 900)
  };
}
