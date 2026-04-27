// ════════════════════════════════════
//  AAKASH AI — Voice (voice.js)
//  TTS, STT, Voice Conversation Mode
//  Uses ElevenLabs > OpenAI > Gemini > Browser
// ════════════════════════════════════

// ── VOICE SETTINGS ──
const VOICE_CONFIG = {
  elevenlabs: {
    voices: {
      rachel: '21m00Tcm4TlvDq8ikWAM',
      domi: 'AZnzlk1XvdvUeBnXmlld',
      bella: 'EXAVITQu4vr4xnSDxMaL',
      josh: 'TxGEqnHWrfWFTfGW9XjX',
      arnold: 'VR6AewLTigWG4xSOukaG',
      sam: 'yoZ06aMxZJJ28mfd3POQ'
    },
    model: 'eleven_multilingual_v2'
  },
  browser: {
    defaultLang: 'hi-IN',
    fallbackLang: 'en-IN'
  }
};

// ── SPEAK TEXT (Smart TTS — tries best available) ──
async function speakText(text, opts = {}) {
  const clean = text
    .replace(/[\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}∞₹🔧🔊]/gu, '')
    .replace(/[→›]/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[*#`]/g, '')
    .trim();
  if (!clean) return { ok: false, error: 'Nothing to speak' };

  // Try ElevenLabs first
  const elKey = getKeyForCap('tts');
  if (elKey && elKey.provider === 'elevenlabs') {
    try {
      const voiceId = VOICE_CONFIG.elevenlabs.voices[S.voiceMood] || VOICE_CONFIG.elevenlabs.voices.rachel;
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: { 'xi-api-key': elKey.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: clean.slice(0, 5000),
          model_id: VOICE_CONFIG.elevenlabs.model,
          voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        })
      });
      if (r.ok) {
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();
        return { ok: true, provider: 'elevenlabs', audio };
      }
    } catch (e) { console.log('ElevenLabs TTS error:', e); }
  }

  // Try OpenAI TTS
  const oaiKey = (S.apiKeys || []).find(k => k.enabled && k.provider === 'openai');
  if (oaiKey) {
    try {
      const r = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${oaiKey.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'tts-1', input: clean.slice(0, 4096), voice: 'alloy' })
      });
      if (r.ok) {
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();
        return { ok: true, provider: 'openai', audio };
      }
    } catch (e) { console.log('OpenAI TTS error:', e); }
  }

  // Fallback: Browser TTS
  return browserSpeak(clean);
}

function browserSpeak(text) {
  if (!('speechSynthesis' in window)) return { ok: false, error: 'No TTS support' };
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voices = speechSynthesis.getVoices();
  const hv = voices.find(v => v.name.includes('Google') && v.lang.startsWith('hi'))
    || voices.find(v => v.lang.startsWith('hi'))
    || voices.find(v => v.lang === 'en-IN')
    || voices[0];
  if (hv) u.voice = hv;
  u.lang = hv?.lang || 'hi-IN';
  speechSynthesis.speak(u);
  return { ok: true, provider: 'browser', utterance: u };
}

// ── VOICE CONVERSATION MODE ──
let _voiceConvoActive = false;
let _voiceConvoRecognition = null;

window.toggleVoiceConvo = function() {
  if (_voiceConvoActive) {
    stopVoiceConvo();
  } else {
    startVoiceConvo();
  }
};

function startVoiceConvo() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { showToast('Voice not supported in this browser'); return; }

  _voiceConvoActive = true;
  _voiceConvoRecognition = new SR();
  _voiceConvoRecognition.lang = 'hi-IN';
  _voiceConvoRecognition.continuous = false;
  _voiceConvoRecognition.interimResults = false;

  _voiceConvoRecognition.onresult = async (e) => {
    const text = e.results[0][0].transcript;
    if (text.trim()) {
      // Send as message
      await sendMsg(text.trim());
      // Wait for response, then speak it
      const lastAssistant = [...S.chat].reverse().find(m => m.role === 'assistant');
      if (lastAssistant && _voiceConvoActive) {
        const result = await speakText(lastAssistant.content);
        // After speaking, listen again
        if (result.ok && result.audio) {
          result.audio.onended = () => {
            if (_voiceConvoActive) _voiceConvoRecognition?.start();
          };
        } else if (result.ok && result.utterance) {
          result.utterance.onend = () => {
            if (_voiceConvoActive) _voiceConvoRecognition?.start();
          };
        } else {
          if (_voiceConvoActive) setTimeout(() => _voiceConvoRecognition?.start(), 500);
        }
      }
    }
  };

  _voiceConvoRecognition.onerror = (e) => {
    if (e.error !== 'no-speech' && e.error !== 'aborted') {
      console.log('Voice convo error:', e.error);
    }
    if (_voiceConvoActive && e.error === 'no-speech') {
      setTimeout(() => { try { _voiceConvoRecognition?.start(); } catch {} }, 300);
    }
  };

  _voiceConvoRecognition.onend = () => {
    // Restart if still in convo mode and not speaking
    if (_voiceConvoActive && !speechSynthesis.speaking) {
      setTimeout(() => { try { _voiceConvoRecognition?.start(); } catch {} }, 300);
    }
  };

  try { _voiceConvoRecognition.start(); } catch {}
  showToast('🎤 Voice conversation started');
}

function stopVoiceConvo() {
  _voiceConvoActive = false;
  if (_voiceConvoRecognition) {
    try { _voiceConvoRecognition.stop(); } catch {}
    _voiceConvoRecognition = null;
  }
  speechSynthesis.cancel();
  showToast('Voice conversation stopped');
}
