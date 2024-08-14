/**
 * MediKiosk - Speech Service
 * Multilingual Indic Speech Recognition (STT) and Speech Synthesis (TTS)
 * Compatible with Bhashini/AI4Bharat pipeline architectures and standard Web Speech API.
 */

class SpeechService {
  constructor() {
    this.recognition = null;
    this.synthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.isListening = false;
    this.currentLanguage = 'en-IN';

    this.initSpeechRecognition();
  }

  initSpeechRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = this.currentLanguage;
    }
  }

  setLanguage(langCode) {
    this.currentLanguage = langCode;
    if (this.recognition) {
      this.recognition.lang = langCode;
    }
  }

  speak(text, lang = this.currentLanguage, onEnd = null) {
    if (!this.synthesis) {
      if (onEnd) onEnd();
      return;
    }

    try {
      this.synthesis.cancel(); // stop any ongoing utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.95; // slightly slower for clear clinical comprehension
      utterance.pitch = 1.0;

      if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
      }

      // Pick an Indian accent voice if available
      const voices = this.synthesis.getVoices();
      const indicVoice = voices.find(v => v.lang.includes(lang.split('-')[0]) || v.name.toLowerCase().includes('india'));
      if (indicVoice) {
        utterance.voice = indicVoice;
      }

      this.synthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      if (onEnd) onEnd();
    }
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  startListening({ onTranscript, onError, onStart, onEnd }) {
    if (!this.recognition) {
      if (onError) onError('Speech recognition is not supported in this browser. Please use touch selection.');
      return;
    }

    this.recognition.onstart = () => {
      this.isListening = true;
      if (onStart) onStart();
    };

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (onTranscript) {
        onTranscript({ final, interim });
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      this.isListening = false;
      if (onError) onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (onEnd) onEnd();
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.warn('Recognition start exception:', e);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

export const speechService = new SpeechService();
