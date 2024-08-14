/**
 * UIDAI Verhoeff Checksum Algorithm & Indian Health ID / Aadhaar Validation Module
 * 
 * Verhoeff algorithm is a checksum formula for error detection developed by Jacobus Verhoeff.
 * It is the official mathematical checksum algorithm mandated by UIDAI for 12-digit Aadhaar numbers.
 */

// Multiplication table (d) based on dihedral group D5
const D_TABLE = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

// Permutation table (p)
const P_TABLE = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

// Inverse table (inv)
const INV_TABLE = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Validates a number string using the Verhoeff algorithm.
 * Returns true if valid, false otherwise.
 */
export function validateVerhoeff(numStr) {
  if (!numStr || typeof numStr !== 'string') return false;
  const clean = numStr.replace(/\D/g, '');
  if (clean.length === 0) return false;

  let c = 0;
  const reversedArray = clean.split('').reverse().map(Number);

  for (let i = 0; i < reversedArray.length; i++) {
    c = D_TABLE[c][P_TABLE[i % 8][reversedArray[i]]];
  }

  return c === 0;
}

/**
 * Generates the Verhoeff checksum digit for a given number string.
 */
export function generateVerhoeff(numStr) {
  if (!numStr || typeof numStr !== 'string') return null;
  const clean = numStr.replace(/\D/g, '');
  let c = 0;
  const reversedArray = clean.split('').reverse().map(Number);

  for (let i = 0; i < reversedArray.length; i++) {
    c = D_TABLE[c][P_TABLE[(i + 1) % 8][reversedArray[i]]];
  }

  return INV_TABLE[c].toString();
}

/**
 * Validates an Indian Aadhaar Number based on UIDAI specifications:
 * 1. Must be exactly 12 numeric digits
 * 2. Must not start with 0 or 1 (UIDAI rule: Aadhaar numbers start with 2-9)
 * 3. Must not consist of all repeating digits (e.g. 111111111111, 222222222222)
 * 4. Must satisfy the Verhoeff checksum algorithm
 */
export function validateAadhaarNumber(input) {
  if (!input) {
    return { isValid: false, error: 'Aadhaar number is required.' };
  }

  const clean = input.replace(/\D/g, '');

  if (clean.length === 0) {
    return { isValid: false, error: 'Please enter a 12-digit Aadhaar number.' };
  }

  if (clean.length !== 12) {
    return { 
      isValid: false, 
      error: `Incomplete number (${clean.length}/12 digits entered).`,
      clean,
      formatted: formatAadhaar(clean)
    };
  }

  if (clean[0] === '0' || clean[0] === '1') {
    return { 
      isValid: false, 
      error: 'Invalid Aadhaar: UIDAI numbers cannot start with 0 or 1.',
      clean,
      formatted: formatAadhaar(clean)
    };
  }

  if (/^(\d)\1{11}$/.test(clean)) {
    return { 
      isValid: false, 
      error: 'Invalid Aadhaar: Sequence of identical digits is prohibited by UIDAI.',
      clean,
      formatted: formatAadhaar(clean)
    };
  }

  const isVerhoeffValid = validateVerhoeff(clean);
  if (!isVerhoeffValid) {
    return { 
      isValid: false, 
      error: 'Invalid Aadhaar: Failed UIDAI Verhoeff checksum verification.',
      clean,
      formatted: formatAadhaar(clean)
    };
  }

  return {
    isValid: true,
    error: null,
    clean,
    formatted: formatAadhaar(clean),
    masked: `XXXX XXXX ${clean.slice(-4)}`
  };
}

/**
 * Formats a clean 12-digit Aadhaar into "XXXX XXXX XXXX" layout
 */
export function formatAadhaar(input) {
  const clean = (input || '').replace(/\D/g, '').slice(0, 12);
  const parts = [];
  for (let i = 0; i < clean.length; i += 4) {
    parts.push(clean.slice(i, i + 4));
  }
  return parts.join(' ');
}

/**
 * Validates an Ayushman Bharat Health Account (ABHA) ID / Number
 * Supports both:
 * 1. 14-digit ABHA Number: "XX-XXXX-XXXX-XXXX"
 * 2. ABHA Address (PHR Address): "username@abdm"
 */
export function validateAbha(input) {
  if (!input) return { isValid: false, error: 'ABHA ID is required.' };
  const trimmed = input.trim();

  // Check if ABHA Address (username@domain)
  if (trimmed.includes('@')) {
    const parts = trimmed.split('@');
    if (parts.length !== 2 || parts[0].length < 3 || parts[1].length < 3) {
      return { isValid: false, type: 'ADDRESS', error: 'Invalid ABHA address format (e.g. name@abdm).' };
    }
    return {
      isValid: true,
      type: 'ABHA_ADDRESS',
      clean: trimmed.toLowerCase(),
      formatted: trimmed.toLowerCase()
    };
  }

  // Otherwise validate 14-digit ABHA number
  const clean = trimmed.replace(/\D/g, '');
  if (clean.length !== 14) {
    return {
      isValid: false,
      type: 'ABHA_NUMBER',
      error: `ABHA number must be 14 digits (${clean.length}/14 entered).`,
      clean,
      formatted: formatAbhaNumber(clean)
    };
  }

  return {
    isValid: true,
    type: 'ABHA_NUMBER',
    clean,
    formatted: formatAbhaNumber(clean),
    masked: `${clean.slice(0, 2)}-XXXX-XXXX-${clean.slice(-4)}`
  };
}

/**
 * Formats 14 digits into ABHA standard "XX-XXXX-XXXX-XXXX"
 */
export function formatAbhaNumber(input) {
  const clean = (input || '').replace(/\D/g, '').slice(0, 14);
  const p1 = clean.slice(0, 2);
  const p2 = clean.slice(2, 6);
  const p3 = clean.slice(6, 10);
  const p4 = clean.slice(10, 14);
  return [p1, p2, p3, p4].filter(Boolean).join('-');
}

/**
 * Parses raw Aadhaar Card QR code text (both XML schema and JSON/encoded payloads)
 */
export function parseAadhaarQr(qrText) {
  if (!qrText || typeof qrText !== 'string') return null;

  try {
    // 1. Check for standard UIDAI XML schema:
    // <PrintLetterBarcodeData uid="..." name="..." gender="..." yob="..." dob="..." co="..." house="..." street="..." dist="..." state="..." pc="..." />
    if (qrText.includes('PrintLetterBarcodeData') || qrText.includes('<PrintLetterBarcodeData')) {
      const getAttr = (name) => {
        const regex = new RegExp(`${name}="([^"]*)"`, 'i');
        const match = qrText.match(regex);
        return match ? match[1].trim() : '';
      };

      const uid = getAttr('uid');
      const name = getAttr('name');
      const genderCode = getAttr('gender').toUpperCase();
      const gender = genderCode === 'M' ? 'Male' : (genderCode === 'F' ? 'Female' : 'Other');
      const yob = getAttr('yob');
      const dob = getAttr('dob') || (yob ? `${yob}-01-01` : '');
      const house = getAttr('house');
      const street = getAttr('street');
      const dist = getAttr('dist');
      const state = getAttr('state');
      const pc = getAttr('pc');

      let age = null;
      if (yob) {
        age = new Date().getFullYear() - parseInt(yob, 10);
      } else if (dob && dob.includes('-')) {
        const year = parseInt(dob.split('-')[0] || dob.split('-')[2], 10);
        if (year > 1900) age = new Date().getFullYear() - year;
      }

      return {
        type: 'AADHAAR_XML_QR',
        uid: uid ? formatAadhaar(uid) : '',
        name: name || 'Aadhaar Cardholder',
        gender,
        dob,
        age: age || 45,
        address: [house, street, dist, state, pc].filter(Boolean).join(', '),
        district: dist || 'Central',
        state: state || 'Delhi',
        pincode: pc
      };
    }

    // 2. Check for JSON format
    if (qrText.trim().startsWith('{') && qrText.trim().endsWith('}')) {
      const data = JSON.parse(qrText);
      return {
        type: 'AADHAAR_JSON_QR',
        uid: data.uid ? formatAadhaar(data.uid) : (data.aadhaar ? formatAadhaar(data.aadhaar) : ''),
        name: data.name || data.n || '',
        gender: data.gender || data.g || 'Male',
        dob: data.dob || data.d || '',
        age: data.age || 40,
        address: data.address || data.a || '',
        district: data.dist || data.district || '',
        state: data.state || ''
      };
    }

    // 3. Fallback: match 12-digit number inside QR string
    const match12 = qrText.match(/\b([2-9]\d{3}\s?\d{4}\s?\d{4})\b/);
    if (match12) {
      const cleanUid = match12[1].replace(/\s/g, '');
      if (validateVerhoeff(cleanUid)) {
        return {
          type: 'AADHAAR_NUMERIC_QR',
          uid: formatAadhaar(cleanUid),
          name: 'Verified Aadhaar Holder',
          gender: 'Male',
          age: 42,
          state: 'National Capital Region',
          district: 'New Delhi'
        };
      }
    }
  } catch (e) {
    console.error('Error parsing Aadhaar QR code:', e);
  }

  return null;
}

/**
 * Sample Pre-verified UIDAI Valid Aadhaar numbers that strictly pass the Verhoeff algorithm.
 * Provided for instant one-click testing and demonstration.
 */
export const SAMPLE_VALID_AADHAARS = [
  {
    aadhaar: '3675 9834 6016',
    name: 'Rameshwar Prasad Sharma',
    age: 56,
    gender: 'Male',
    bloodGroup: 'B+',
    phone: '+91 98765-43210',
    state: 'Delhi',
    district: 'South Delhi',
    avatar: '👨‍🦳',
    abhaId: '91-8432-1092-4412',
    abhaAddress: 'rameshwar.sharma@abdm',
    address: 'H.No 42, Green Park Main, South Delhi - 110016'
  },
  {
    aadhaar: '5489 2314 7857',
    name: 'Kanti Devi',
    age: 62,
    gender: 'Female',
    bloodGroup: 'O+',
    phone: '+91 98112-23344',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    avatar: '👵',
    abhaId: '45-1290-7764-8821',
    abhaAddress: 'kanti.devi@abdm',
    address: 'Near Dashashwamedh Ghat, Varanasi - 221001'
  },
  {
    aadhaar: '7192 4850 1634',
    name: 'Sunita Devi',
    age: 42,
    gender: 'Female',
    bloodGroup: 'A+',
    phone: '+91 99551-66778',
    state: 'Rajasthan',
    district: 'Jaipur',
    avatar: '👩',
    abhaId: '77-3341-9982-1109',
    abhaAddress: 'sunita.devi@abdm',
    address: 'Sector 4, Mansarovar, Jaipur - 302020'
  },
  {
    aadhaar: '9283 1475 2048',
    name: 'Dr. Arjun Verma',
    age: 38,
    gender: 'Male',
    bloodGroup: 'AB+',
    phone: '+91 97123-45678',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    avatar: '👨‍⚕️',
    abhaId: '82-9012-3456-7890',
    abhaAddress: 'dr.arjun@abdm',
    address: 'Indiranagar 100ft Road, Bengaluru - 560038'
  }
];
