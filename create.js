// ════════════════════════════════════
//  AAKASH AI — Create (create.js)
//  Quick create + Dynamic AI creation
//  Auto-shows features based on keys
// ════════════════════════════════════

let ctp = 'task';

function rCreate(ct) {
  // Basic creation types (always available)
  const basicTypes = [
    { k: 'task', i: '✅', l: 'Task' },
    { k: 'goal', i: '🎯', l: 'Goal' },
    { k: 'note', i: '📝', l: 'Note' },
    { k: 'idea', i: '💡', l: 'Idea' }
  ];

  // AI creation types (based on available keys)
  const aiTypes = [
    { k: 'ai_image', i: '🎨', l: 'AI Image', cap: 'image_gen', desc: 'Text se image banao' },
    { k: 'ai_video', i: '🎬', l: 'AI Video', cap: 'video_gen', desc: 'Text se video banao' },
    { k: 'ai_music', i: '🎵', l: 'AI Music', cap: 'music_gen', desc: 'AI se music banao' },
    { k: 'ai_voice', i: '🎙️', l: 'AI Voice', cap: 'tts', desc: 'Text ko voice mein badlo' },
  ];

  const availableAI = aiTypes.filter(t => hasCap(t.cap));
  const missingAI = aiTypes.filter(t => !hasCap(t.cap));

  ct.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;padding:10px 16px;gap:12px;overflow-y:auto">
  <div style="font-size:17px;font-weight:700">Quick Create</div>
  
  <!-- Basic Types -->
  <div style="display:flex;gap:8px;flex-wrap:wrap">
  ${basicTypes.map(t => `<button onclick="ctp='${t.k}';rCreate(document.getElementById('ct'))" style="padding:10px 18px;border-radius:24px;background:${ctp === t.k ? 'var(--acBg2)' : 'var(--c1)'};border:1.5px solid ${ctp === t.k ? 'var(--acBorder)' : 'var(--b1)'};color:${ctp === t.k ? 'var(--ac)' : 'var(--t3)'};font-size:14px;font-weight:600">${t.i} ${t.l}</button>`).join('')}
  </div>

  ${ctp === 'ai_image' ? renderAIImageCreate() :
    ctp === 'ai_voice' ? renderAIVoiceCreate() :
    renderBasicCreate()}

  <!-- AI Creation Section -->
  ${availableAI.length ? `
  <div style="margin-top:8px;padding-top:12px;border-top:1px solid var(--b1)">
    <div style="font-size:14px;font-weight:700;margin-bottom:8px">✨ AI Creation</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
    ${availableAI.map(t => `<button onclick="ctp='${t.k}';rCreate(document.getElementById('ct'))" style="padding:10px 18px;border-radius:24px;background:${ctp === t.k ? 'var(--gBg)' : 'var(--c1)'};border:1.5px solid ${ctp === t.k ? 'var(--gBorder)' : 'var(--b1)'};color:${ctp === t.k ? 'var(--g)' : 'var(--t3)'};font-size:14px;font-weight:600">${t.i} ${t.l}</button>`).join('')}
    </div>
  </div>` : ''}

  <!-- Missing AI Features -->
  ${missingAI.length ? `
  <div style="margin-top:8px;padding:12px;background:var(--bg);border-radius:10px;border:1px solid var(--b1)">
    <div style="font-size:13px;font-weight:600;color:var(--t3);margin-bottom:8px">🔒 Unlock More Features</div>
    <div style="font-size:12px;color:var(--t4);line-height:1.8">
    ${missingAI.map(t => {
      const recs = { 
        image_gen: '🎨 Image → Gemini key (FREE — aistudio.google.com)', 
        video_gen: '🎬 Video → Gemini key (FREE — aistudio.google.com)', 
        music_gen: '🎵 Music → Gemini key (FREE — aistudio.google.com)', 
        tts: '🎙️ Voice → ElevenLabs key (FREE — elevenlabs.io)' 
      };
      return recs[t.cap] || '';
    }).filter(Boolean).join('<br>')}
    <br><span style="color:var(--ac);font-weight:500">Settings > Add Key se add karo!</span>
    </div>
  </div>` : ''}
  </div>`;
}

function renderBasicCreate() {
  return `<input id="cT" class="inp" placeholder="Title" style="font-weight:600;font-size:16px">
  <textarea id="cB" class="inp" placeholder="Details..." style="min-height:140px;resize:vertical;font-family:IBM Plex Mono,monospace;font-size:14px;line-height:1.8"></textarea>
  <button onclick="const t=document.getElementById('cT')?.value?.trim(),b=document.getElementById('cB')?.value;if(t||b){S.entries.unshift({id:Date.now(),type:ctp,title:t||'Untitled',content:b,done:false,createdAt:new Date().toISOString()});saveAll();tab='vault';render()}" class="btn bp" style="padding:14px;font-size:16px">Save</button>`;
}

function renderAIImageCreate() {
  return `<div>
  <div style="font-size:14px;font-weight:600;color:var(--g);margin-bottom:8px">🎨 AI Image Generator</div>
  <textarea id="imgPrompt" class="inp" placeholder="Describe the image... e.g., 'A modern cable factory with machines running'" style="min-height:100px;resize:vertical;font-size:14px;line-height:1.7"></textarea>
  <button onclick="createAIImage()" id="imgGenBtn" class="btn bp" style="padding:14px;font-size:16px;width:100%;margin-top:8px">🎨 Generate Image</button>
  <div id="imgResult" style="margin-top:10px"></div>
  </div>`;
}

function renderAIVoiceCreate() {
  return `<div>
  <div style="font-size:14px;font-weight:600;color:var(--g);margin-bottom:8px">🎙️ AI Voice Generator</div>
  <textarea id="voiceText" class="inp" placeholder="Text likhho jo bolna hai..." style="min-height:100px;resize:vertical;font-size:14px;line-height:1.7"></textarea>
  <button onclick="createAIVoice()" id="voiceGenBtn" class="btn bp" style="padding:14px;font-size:16px;width:100%;margin-top:8px">🎙️ Generate Voice</button>
  <div id="voiceResult" style="margin-top:10px"></div>
  </div>`;
}

// ── AI IMAGE GENERATION ──
window.createAIImage = async function() {
  const prompt = document.getElementById('imgPrompt')?.value?.trim();
  if (!prompt) { alert('Image ka description likho!'); return; }
  const btn = document.getElementById('imgGenBtn');
  const result = document.getElementById('imgResult');
  if (btn) btn.textContent = '⏳ Generating...';
  if (btn) btn.disabled = true;
  
  const imgResult = await generateImage(prompt);
  
  if (imgResult.ok && imgResult.images?.length) {
    const img = imgResult.images[0];
    const dataUrl = `data:${img.mime};base64,${img.data}`;
    if (result) result.innerHTML = `
      <img src="${dataUrl}" style="max-width:100%;border-radius:10px;border:1px solid var(--b1);margin-bottom:8px">
      <div style="display:flex;gap:8px">
        <a href="${dataUrl}" download="aakash-image-${Date.now()}.png" class="btn bp" style="flex:1;padding:10px;font-size:14px">💾 Download</a>
        <button onclick="const d='${dataUrl}';S.notes.unshift({id:Date.now(),title:'AI Image: ${prompt.slice(0,30).replace(/'/g,"\\'")}',content:'[AI Generated Image]',folder:'General',uploaded:true,fileData:d,fileType:'image',fileMime:'image/png',createdAt:new Date().toISOString()});saveAll();showToast('Notes mein save ho gaya!')" class="btn bs" style="flex:1;padding:10px;font-size:14px">📝 Save to Notes</button>
      </div>`;
  } else {
    if (result) result.innerHTML = `<div style="padding:12px;background:var(--rBg);border-radius:8px;color:var(--r);font-size:14px">⚠️ ${imgResult.error || 'Image generate nahi ho payi.'}</div>`;
  }
  if (btn) { btn.textContent = '🎨 Generate Image'; btn.disabled = false; }
};

// ── AI VOICE GENERATION ──
window.createAIVoice = async function() {
  const text = document.getElementById('voiceText')?.value?.trim();
  if (!text) { alert('Text likho jo bolna hai!'); return; }
  const btn = document.getElementById('voiceGenBtn');
  const result = document.getElementById('voiceResult');
  if (btn) btn.textContent = '⏳ Generating...';
  
  const voiceResult = await generateSpeech(text);
  
  if (voiceResult.ok && voiceResult.audioUrl) {
    if (result) result.innerHTML = `
      <audio controls src="${voiceResult.audioUrl}" style="width:100%;margin-bottom:8px"></audio>
      <a href="${voiceResult.audioUrl}" download="aakash-voice-${Date.now()}.mp3" class="btn bp" style="width:100%;padding:10px;font-size:14px;text-decoration:none;text-align:center">💾 Download Audio</a>`;
  } else if (voiceResult.fallback === 'browser') {
    // Use browser TTS
    const u = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    const hv = voices.find(v => v.lang.startsWith('hi')) || voices.find(v => v.lang === 'en-IN') || voices[0];
    if (hv) u.voice = hv;
    u.lang = hv?.lang || 'hi-IN';
    speechSynthesis.speak(u);
    if (result) result.innerHTML = `<div style="padding:12px;background:var(--gBg);border-radius:8px;color:var(--g);font-size:14px">🔊 Browser voice se bol raha hai... (Better quality ke liye ElevenLabs key add karo — FREE — elevenlabs.io)</div>`;
  } else {
    if (result) result.innerHTML = `<div style="padding:12px;background:var(--rBg);border-radius:8px;color:var(--r);font-size:14px">⚠️ Voice generate nahi ho payi.</div>`;
  }
  if (btn) btn.textContent = '🎙️ Generate Voice';
};
