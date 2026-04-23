// ════════════════════════════════════
//  AAKASH AI — Voice (voice.js)
//  Voice call + ElevenLabs + Speech
// ════════════════════════════════════

const VOICES = {
  rachel: { label: '👩 Rachel', desc: 'Warm', elId: '21m00Tcm4TlvDq8ikWAM', pitch: 1, rate: 1 },
  josh: { label: '👨 Josh', desc: 'Deep', elId: 'TxGEqnHWrfWFTfGW9XjX', pitch: .9, rate: .95 },
  bella: { label: '👧 Bella', desc: 'Friendly', elId: 'EXAVITQu4vr4xnSDxMaL', pitch: 1.2, rate: 1.1 },
  adam: { label: '🧔 Adam', desc: 'Professional', elId: 'pNInz6obpgDQGcFmaJgB', pitch: .8, rate: 1 },
  coach: { label: '💪 Antoni', desc: 'Motivational', elId: 'ErXwobaYiN019PkySvjV', pitch: .8, rate: 1.05 }
};

// ── VOICE CALL MENU ──
window.openCall = function() {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:100;background:var(--overlay);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn .2s';
  ov.innerHTML = `<div style="background:var(--c1);border-radius:20px;padding:24px;max-width:340px;width:100%;border:1px solid var(--b1);box-shadow:var(--shadowLg)">
  <div style="font-size:17px;font-weight:700;margin-bottom:14px">📞 Voice Call</div>
  <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;max-height:300px;overflow-y:auto">
  ${Object.entries(VOICES).map(([k, v]) => `<button onclick="S.voiceMood='${k}';saveAll();this.closest('div[style*=fixed]').remove();startCall()" style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:12px;border:1.5px solid ${S.voiceMood === k ? 'var(--acBorder)' : 'var(--b1)'};background:${S.voiceMood === k ? 'var(--acBg)' : 'var(--c1)'};text-align:left;width:100%">
    <span style="font-size:22px">${v.label.split(' ')[0]}</span><div><div style="font-size:15px;font-weight:600;color:${S.voiceMood === k ? 'var(--ac)' : 'var(--t1)'}">${v.label.split(' ').slice(1).join(' ')}</div><div style="font-size:13px;color:var(--t3)">${v.desc}</div></div></button>`).join('')}
  </div>
  <button onclick="this.closest('div[style*=fixed]').remove()" class="btn bs" style="width:100%;padding:12px">Cancel</button></div>`;
  document.body.appendChild(ov);
};

// ── VOICE CALL ──
window.startCall = function() {
  const mood = VOICES[S.voiceMood] || VOICES.rachel;
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:200;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center';
  ov.innerHTML = `<div style="width:88px;height:88px;border-radius:24px;background:var(--grad);display:flex;align-items:center;justify-content:center;margin-bottom:20px;animation:glow 2s infinite;color:#fff;font-size:32px;font-weight:800;box-shadow:var(--shadowLg)">A</div>
  <div style="font-size:20px;font-weight:700;margin-bottom:4px">AAKASH AI</div>
  <div style="font-size:14px;color:var(--ac);margin-bottom:6px">${mood.label}</div>
  <div id="cTm" style="font-size:32px;font-weight:300;margin-bottom:10px;font-family:IBM Plex Mono,monospace">0:00</div>
  <div id="cSt" style="font-size:15px;color:var(--g);margin-bottom:28px">Connecting...</div>
  <button id="cEd" style="width:64px;height:64px;border-radius:20px;background:var(--r);border:none;color:#fff;font-size:22px;box-shadow:0 4px 24px rgba(220,38,38,.3);display:flex;align-items:center;justify-content:center">📞</button>
  <div style="font-size:13px;color:var(--t4);margin-top:16px">🔒 Encrypted</div>`;
  document.body.appendChild(ov);

  let dur = 0, alive = true, rec;
  const tmr = setInterval(() => { dur++; const t = ov.querySelector('#cTm'); if (t) t.textContent = `${Math.floor(dur / 60)}:${(dur % 60).toString().padStart(2, '0')}`; }, 1000);
  const end = () => { alive = false; clearInterval(tmr); speechSynthesis?.cancel(); try { rec?.stop(); } catch {} ov.remove(); };
  ov.querySelector('#cEd').onclick = end;

  // ── SPEAK ──
  const speak = (text, cb) => {
    ov.querySelector('#cSt').textContent = 'Speaking...'; ov.querySelector('#cSt').style.color = 'var(--ac)';
    const clean = text.replace(/[\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}∞₹🔧]/gu, '').replace(/<[^>]*>/g, '').replace(/\*+/g, '').replace(/#+/g, '').replace(/→|›/g, '').replace(/```[\s\S]*?```/g, '').trim();
    if (!clean) { cb?.(); return; }
    // Try ElevenLabs first
    if (S.elKey && mood.elId) {
      fetch(`https://api.elevenlabs.io/v1/text-to-speech/${mood.elId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'xi-api-key': S.elKey },
        body: JSON.stringify({ text: clean.slice(0, 500), model_id: 'eleven_multilingual_v2', voice_settings: { stability: .5, similarity_boost: .75 } })
      }).then(r => { if (!r.ok) throw 0; return r.blob(); })
        .then(b => { const u = URL.createObjectURL(b), a = new Audio(u); a.onended = () => { URL.revokeObjectURL(u); if (alive) cb?.(); }; a.onerror = () => { URL.revokeObjectURL(u); fbS(clean, cb); }; a.play().catch(() => fbS(clean, cb)); })
        .catch(() => fbS(clean, cb));
      return;
    }
    fbS(clean, cb);
  };

  // ── FALLBACK SPEECH ──
  const fbS = (c, cb) => {
    if (!speechSynthesis) { cb?.(); return; } speechSynthesis.cancel();
    const sn = c.match(/[^.!?।]+[.!?।]*/g) || [c]; let i = 0;
    const nx = () => {
      if (i >= sn.length || !alive) { cb?.(); return; }
      const s = sn[i].trim(); i++;
      if (!s) { nx(); return; }
      const u = new SpeechSynthesisUtterance(s);
      const v = speechSynthesis.getVoices();
      let hv = v.find(x => x.name.includes('Google') && x.lang.startsWith('hi')) || v.find(x => x.lang.startsWith('hi')) || v.find(x => x.lang === 'en-IN') || v[0];
      if (hv) u.voice = hv;
      u.lang = hv?.lang || 'hi-IN'; u.pitch = mood.pitch; u.rate = mood.rate;
      u.onend = () => { if (alive) nx(); }; u.onerror = () => { if (alive) nx(); };
      speechSynthesis.speak(u);
    };
    nx();
  };

  // ── LISTEN ──
  const listen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    rec = new SR(); rec.lang = 'hi-IN'; rec.continuous = true; rec.interimResults = true;
    let final = '', st = null;
    ov.querySelector('#cSt').textContent = 'Listening...'; ov.querySelector('#cSt').style.color = 'var(--g)';

    rec.onresult = e => {
      let im = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
        else im += e.results[i][0].transcript;
      }
      if (final || im) { ov.querySelector('#cSt').textContent = '"' + (final + im).slice(-50) + '"'; ov.querySelector('#cSt').style.color = 'var(--t1)'; }
      clearTimeout(st);
      if (final.trim()) st = setTimeout(() => { try { rec.stop(); } catch {} }, 2000);
    };

    rec.onend = async () => {
      clearTimeout(st);
      if (final.trim() && alive) {
        ov.querySelector('#cSt').textContent = 'Thinking...'; ov.querySelector('#cSt').style.color = 'var(--y)';
        const reply = await ai([...S.chat.slice(-10), { role: 'user', content: final.trim() }], SOUL + getContext() + '\nVoice. SHORT (2-3 sentences). No formatting.');
        S.chat.push({ role: 'user', content: final.trim() }, { role: 'assistant', content: reply });
        saveChatToHistory(); await saveAll();
        final = '';
        if (reply && alive && !reply.startsWith('⚠️')) speak(reply, () => { if (alive) listen(); });
        else if (alive) setTimeout(() => { if (alive) listen(); }, 2000);
      } else if (alive) setTimeout(() => { if (alive) listen(); }, 500);
    };

    rec.onerror = e => {
      if (e.error === 'no-speech' && alive) setTimeout(() => { if (alive) listen(); }, 500);
      else if (alive) setTimeout(listen, 1000);
    };
    try { rec.start(); } catch { setTimeout(() => { if (alive) listen(); }, 2000); }
  };

  if (speechSynthesis.getVoices().length === 0) speechSynthesis.onvoiceschanged = () => { if (alive) speak('Haan boliye, kya help chahiye?', () => { if (alive) listen(); }); };
  else setTimeout(() => { if (alive) speak('Haan boliye, kya help chahiye?', () => { if (alive) listen(); }); }, 500);
};
