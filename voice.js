// ════════════════════════════════════
//  AAKASH AI v3 — Voice (voice.js)
//  TTS, STT, Voice Conversation, Voice Notes
//  NEW: Record voice notes + send to AI (Change 24)
// ════════════════════════════════════

const VOICE_CONFIG = {
  elevenlabs: {
    voices: { rachel:'21m00Tcm4TlvDq8ikWAM', domi:'AZnzlk1XvdvUeBnXmlld', bella:'EXAVITQu4vr4xnSDxMaL', josh:'TxGEqnHWrfWFTfGW9XjX', arnold:'VR6AewLTigWG4xSOukaG', sam:'yoZ06aMxZJJ28mfd3POQ' },
    model: 'eleven_multilingual_v2'
  },
  browser: { defaultLang:'hi-IN', fallbackLang:'en-IN' }
};

// ── SPEAK TEXT ──
async function speakText(text, opts = {}) {
  const clean = text.replace(/[\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}∞₹🔧🔊]/gu, '').replace(/[→›]/g, '').replace(/```[\s\S]*?```/g, '').replace(/[*#`]/g, '').trim();
  if (!clean) return { ok: false, error: 'Nothing to speak' };

  const elKey = getKeyForCap('tts');
  if (elKey && elKey.provider === 'elevenlabs') {
    try {
      const voiceId = VOICE_CONFIG.elevenlabs.voices[S.voiceMood] || VOICE_CONFIG.elevenlabs.voices.rachel;
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method:'POST', headers:{'xi-api-key':elKey.key,'Content-Type':'application/json'},
        body:JSON.stringify({ text:clean.slice(0,5000), model_id:VOICE_CONFIG.elevenlabs.model, voice_settings:{stability:0.5,similarity_boost:0.75} })
      });
      if (r.ok) { const blob=await r.blob(); const url=URL.createObjectURL(blob); const audio=new Audio(url); audio.play(); return {ok:true,provider:'elevenlabs',audio}; }
    } catch(e) { console.log('ElevenLabs TTS error:', e); }
  }

  const oaiKey = (S.apiKeys||[]).find(k => k.enabled && k.provider === 'openai');
  if (oaiKey) {
    try {
      const r = await fetch('https://api.openai.com/v1/audio/speech', {
        method:'POST', headers:{'Authorization':`Bearer ${oaiKey.key}`,'Content-Type':'application/json'},
        body:JSON.stringify({model:'tts-1',input:clean.slice(0,4096),voice:'alloy'})
      });
      if (r.ok) { const blob=await r.blob(); const url=URL.createObjectURL(blob); const audio=new Audio(url); audio.play(); return {ok:true,provider:'openai',audio}; }
    } catch(e) { console.log('OpenAI TTS error:', e); }
  }

  return browserSpeak(clean);
}

function browserSpeak(text) {
  if (!('speechSynthesis' in window)) return { ok:false, error:'No TTS support' };
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voices = speechSynthesis.getVoices();
  const hv = voices.find(v=>v.name.includes('Google')&&v.lang.startsWith('hi')) || voices.find(v=>v.lang.startsWith('hi')) || voices.find(v=>v.lang==='en-IN') || voices[0];
  if (hv) u.voice = hv; u.lang = hv?.lang || 'hi-IN';
  speechSynthesis.speak(u);
  return { ok:true, provider:'browser', utterance:u };
}

// ════════════════════════════════════
//  VOICE NOTES (Change 24)
//  Record audio → transcribe → send as message
//  Long-press mic = voice note mode
// ════════════════════════════════════

let _voiceNoteRecording = false;
let _voiceNoteRecorder = null;
let _voiceNoteChunks = [];
let _voiceNoteStartTime = 0;

window.startVoiceNote = function() {
  if (_voiceNoteRecording) { stopVoiceNote(); return; }

  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    _voiceNoteRecorder = new MediaRecorder(stream);
    _voiceNoteChunks = [];
    _voiceNoteStartTime = Date.now();
    _voiceNoteRecording = true;

    _voiceNoteRecorder.ondataavailable = e => { if (e.data.size > 0) _voiceNoteChunks.push(e.data); };

    _voiceNoteRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      const duration = Math.round((Date.now() - _voiceNoteStartTime) / 1000);
      const blob = new Blob(_voiceNoteChunks, { type: 'audio/webm' });
      _voiceNoteRecording = false;
      _updateMicUI(false);

      if (duration < 1) { showToast('Too short'); return; }

      // Transcribe voice note
      showToast(`🎤 ${duration}s voice note — transcribing...`);
      const text = await _transcribeAudio(blob);
      if (text) {
        sendMsg(text);
      } else {
        showToast('Voice note samajh nahi aayi — dobara try karein');
      }
    };

    _voiceNoteRecorder.start();
    _updateMicUI(true);
    showToast('🎤 Recording... Tap again to stop');
  }).catch(e => {
    showToast('Microphone access denied');
    console.log('Mic error:', e);
  });
};

window.stopVoiceNote = function() {
  if (_voiceNoteRecorder && _voiceNoteRecording) {
    _voiceNoteRecorder.stop();
  }
};

async function _transcribeAudio(blob) {
  // Try OpenAI Whisper first
  const oaiKey = (S.apiKeys||[]).find(k => k.enabled && k.provider === 'openai');
  if (oaiKey) {
    try {
      const form = new FormData();
      form.append('file', blob, 'voice.webm');
      form.append('model', 'whisper-1');
      form.append('language', 'hi');
      const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST', headers: { 'Authorization': `Bearer ${oaiKey.key}` }, body: form
      });
      if (r.ok) { const d = await r.json(); return d.text; }
    } catch (e) { console.log('Whisper error:', e); }
  }

  // Fallback: Browser speech recognition (re-record approach)
  // Voice note already recorded, so use Web Speech API on next attempt
  showToast('Whisper API nahi hai — voice input use karein');
  return null;
}

function _updateMicUI(recording) {
  const btn = document.getElementById('micBtn');
  if (btn) {
    btn.style.background = recording ? 'var(--rBg)' : 'var(--c2)';
    btn.style.borderColor = recording ? 'var(--rBorder)' : 'var(--b1)';
    if (recording) btn.innerHTML = `<div style="width:10px;height:10px;border-radius:50%;background:var(--r);animation:dot 1s infinite"></div>`;
    else btn.innerHTML = I.mic;
  }
}

// ── VOICE CONVERSATION MODE (unchanged) ──
let _voiceConvoActive = false, _voiceConvoRecognition = null;

window.toggleVoiceConvo = function() { _voiceConvoActive ? stopVoiceConvo() : startVoiceConvo(); };

function startVoiceConvo() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { showToast('Voice not supported'); return; }
  _voiceConvoActive = true;
  _voiceConvoRecognition = new SR();
  _voiceConvoRecognition.lang = 'hi-IN'; _voiceConvoRecognition.continuous = false; _voiceConvoRecognition.interimResults = false;

  _voiceConvoRecognition.onresult = async (e) => {
    const text = e.results[0][0].transcript;
    if (text.trim()) {
      await sendMsg(text.trim());
      const lastAssistant = [...S.chat].reverse().find(m => m.role === 'assistant');
      if (lastAssistant && _voiceConvoActive) {
        const result = await speakText(lastAssistant.content);
        if (result.ok && result.audio) result.audio.onended = () => { if (_voiceConvoActive) _voiceConvoRecognition?.start(); };
        else if (result.ok && result.utterance) result.utterance.onend = () => { if (_voiceConvoActive) _voiceConvoRecognition?.start(); };
        else if (_voiceConvoActive) setTimeout(() => _voiceConvoRecognition?.start(), 500);
      }
    }
  };
  _voiceConvoRecognition.onerror = (e) => { if (_voiceConvoActive && e.error === 'no-speech') setTimeout(() => { try { _voiceConvoRecognition?.start(); } catch {} }, 300); };
  _voiceConvoRecognition.onend = () => { if (_voiceConvoActive && !speechSynthesis.speaking) setTimeout(() => { try { _voiceConvoRecognition?.start(); } catch {} }, 300); };
  try { _voiceConvoRecognition.start(); } catch {}
  showToast('🎤 Voice conversation started');
}

function stopVoiceConvo() {
  _voiceConvoActive = false;
  if (_voiceConvoRecognition) { try { _voiceConvoRecognition.stop(); } catch {} _voiceConvoRecognition = null; }
  speechSynthesis.cancel();
  showToast('Voice conversation stopped');
}
