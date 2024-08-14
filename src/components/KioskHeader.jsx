import React from 'react';
import { 
  Building2, 
  Stethoscope, 
  Languages, 
  AlertTriangle, 
  LayoutDashboard, 
  Tablet, 
  ShieldCheck,
  Leaf,
  Mic
} from 'lucide-react';

export function KioskHeader({
  activeView,
  setActiveView,
  isAyushMode,
  setIsAyushMode,
  selectedLanguage,
  setSelectedLanguage,
  onTriggerSos
}) {
  return (
    <header className="kiosk-header">
      {/* ── Brand ───────────────────────────────────────── */}
      <div className="brand-section">
        <div className={`brand-logo-badge ${isAyushMode ? 'ayush-logo' : ''}`}>
          {isAyushMode ? <Leaf size={24} /> : <Stethoscope size={24} />}
        </div>

        <div>
          <div className="brand-title">
            <span>MediKiosk</span>
            <span className="badge-abdm">ABDM M3</span>
            {isAyushMode && (
              <span style={{
                background: 'rgba(245,158,11,0.18)',
                color: '#fbbf24',
                fontSize: '0.62rem',
                padding: '0.2rem 0.55rem',
                borderRadius: '999px',
                border: '1px solid rgba(245,158,11,0.35)',
                fontWeight: 700,
                letterSpacing: '0.04em'
              }}>
                🌿 AYUSH
              </span>
            )}
          </div>
          <div className="brand-subtitle">
            <Building2 size={12} />
            <span>Apex Tertiary Government Hospital &amp; AYUSH Research Center</span>
            <span>·</span>
            <span style={{ color: '#14b8a6', fontWeight: 600 }}>Terminal 04 Active</span>
          </div>
        </div>
      </div>

      {/* ── Actions ─────────────────────────────────────── */}
      <div className="header-actions">

        {/* AYUSH Mode Toggle */}
        <button
          className={`ayush-toggle-btn ${isAyushMode ? 'active' : ''}`}
          onClick={() => setIsAyushMode(!isAyushMode)}
          title="Toggle between Allopathy Medicine and Ayurvedic Pariksha intake mode"
        >
          <Leaf size={15} />
          <span>{isAyushMode ? '🌿 Ayurvedic Mode' : 'AYUSH Mode'}</span>
        </button>

        {/* Language Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Languages size={16} style={{ color: 'var(--txt-3)' }} />
          <select
            className="lang-select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            title="Select Interface Language / भाषा चुनें"
          >
            <option value="en-IN">🇮🇳 English</option>
            <optgroup label="North & Central India">
              <option value="hi-IN">हिन्दी — Hindi</option>
              <option value="ur-IN">اردو — Urdu</option>
              <option value="pa-IN">ਪੰਜਾਬੀ — Punjabi</option>
              <option value="raj-IN">राजस्थानी — Rajasthani</option>
              <option value="bho-IN">भोजपुरी — Bhojpuri</option>
              <option value="mai-IN">मैथिली — Maithili</option>
            </optgroup>
            <optgroup label="East India">
              <option value="bn-IN">বাংলা — Bengali</option>
              <option value="or-IN">ଓଡ଼ିଆ — Odia</option>
              <option value="as-IN">অসমীয়া — Assamese</option>
            </optgroup>
            <optgroup label="West India">
              <option value="mr-IN">मराठी — Marathi</option>
              <option value="gu-IN">ગુજરાતી — Gujarati</option>
            </optgroup>
            <optgroup label="South India">
              <option value="ta-IN">தமிழ் — Tamil</option>
              <option value="te-IN">తెలుగు — Telugu</option>
              <option value="kn-IN">ಕನ್ನಡ — Kannada</option>
              <option value="ml-IN">മലയാളം — Malayalam</option>
            </optgroup>
            <optgroup label="North-East">
              <option value="ne-IN">नेपाली — Nepali</option>
              <option value="mni-IN">মৈতৈলোন্ — Manipuri</option>
            </optgroup>
          </select>
        </div>

        {/* View Switcher */}
        <div className="view-switcher-pill">
          <button
            className={`switcher-btn ${activeView === 'kiosk' ? (isAyushMode ? 'active ayush' : 'active') : ''}`}
            onClick={() => setActiveView('kiosk')}
          >
            <Tablet size={15} />
            <span>Patient Kiosk</span>
          </button>
          <button
            className={`switcher-btn ${activeView === 'doctor' ? 'active' : ''}`}
            onClick={() => setActiveView('doctor')}
          >
            <LayoutDashboard size={15} />
            <span>Doctor Console</span>
          </button>
        </div>

        {/* Emergency SOS */}
        <button
          className="btn-sos"
          onClick={onTriggerSos}
          title="Emergency Staff Alert"
        >
          <AlertTriangle size={15} />
          <span>SOS</span>
        </button>
      </div>
    </header>
  );
}
