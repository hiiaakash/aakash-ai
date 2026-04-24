// ════════════════════════════════════
//  AAKASH AI — Providers (providers.js)
//  Smart API Key Pool — Auto-detect & Route
//  User adds key + name → features auto-unlock
// ════════════════════════════════════

// ── PROVIDER CAPABILITY MAP ──
const PROVIDER_MAP = {
  claude: {
    detect: k => k.startsWith('sk-ant-'),
    name: 'Claude', icon: '🟠',
    caps: ['chat','code','vision','reasoning','documents','tools'],
    models: { fast:'claude-haiku-4-5-20251001', balanced:'claude-sonnet-4-6', powerful:'claude-opus-4-6', fallback:'claude-sonnet-4-5' }
  },
  gemini: {
    detect: k => k.startsWith('AIza'),
    name: 'Gemini', icon: '🔵',
    caps: ['chat','code','vision','image_gen','reasoning','documents','tts','video_gen','music_gen'],
    models: { chat:'gemini-2.0-flash', image:'gemini-2.0-flash' }
  },
  groq: {
    detect: k => k.startsWith('gsk_'),
    name: 'Groq', icon: '🟢',
    caps: ['chat','code','reasoning','fast_inference'],
    models: { fast:'llama-3.3-70b-versatile' }
  },
  openai: {
    detect: k => k.startsWith('sk-') && !k.startsWith('sk-ant-') && !k.startsWith('sk-or-'),
    name: 'OpenAI', icon: '⚪',
    caps: ['chat','code','vision','image_gen','reasoning','tts','stt','documents'],
    models: { chat:'gpt-4o', image:'gpt-image-1', tts:'tts-1', stt:'whisper-1' }
  },
  elevenlabs: {
    detect: k => k.startsWith('xi-'),
    name: 'ElevenLabs', icon: '🎙️',
    caps: ['tts','voice_clone','stt'],
    models: { tts:'eleven_multilingual_v2' }
  },
  stability: {
    detect: k => k.startsWith('sk-stab'),
    name: 'Stability AI', icon: '🎨',
    caps: ['image_gen','image_edit','upscale'],
    models: { image:'stable-diffusion-3' }
  },
  huggingface: {
    detect: k => k.startsWith('hf_'),
    name: 'Hugging Face', icon: '🤗',
    caps: ['chat','image_gen','stt','translation'],
    models: { chat:'meta-llama/Llama-3-70b' }
  },
  openrouter: {
    detect: k => k.startsWith('sk-or-'),
    name: 'OpenRouter', icon: '🔀',
    caps: ['chat','code','vision','reasoning'],
    models: { chat:'anthropic/claude-sonnet-4.6' }
  },
  xai: {
    detect: k => k.startsWith('xai-'),
    name: 'xAI Grok', icon: '✖️',
    caps: ['chat','code','vision','reasoning','image_gen'],
    models: { chat:'grok-3', image:'grok-2-image' }
  },
  mistral: {
    detect: k => k.startsWith('mis-') || k.startsWith('api-mis'),
    name: 'Mistral', icon: '🟡',
    caps: ['chat','code','reasoning'],
    models: { chat:'mistral-large-latest' }
  },
  together: {
    detect: k => k.startsWith('tog-'),
    name: 'Together AI', icon: '🤝',
    caps: ['chat','code','image_gen'],
    models: { chat:'meta-llama/Llama-3-70b' }
  }
};

const DETECT_ORDER = ['claude','elevenlabs','huggingface','groq','openrouter','xai','stability','mistral','together','openai','gemini'];

// ── AUTO-DETECT PROVIDER ──
function detectProvider(key) {
  if (!key || key.length < 6) return 'unknown';
  for (const pid of DETECT_ORDER) {
    if (PROVIDER_MAP[pid]?.detect(key)) return pid;
  }
  return 'unknown';
}

// ── KEY MANAGEMENT ──
function addApiKey(name, key) {
  if (!S.apiKeys) S.apiKeys = [];
  if (S.apiKeys.find(k => k.key === key)) return { ok:false, msg:'Ye key pehle se hai.' };
  const provider = detectProvider(key);
  S.apiKeys.push({ id:Date.now(), name:name.trim(), key:key.trim(), provider, enabled:true, addedAt:new Date().toISOString() });
  // Backward compat
  if (provider === 'claude' && !S.apiKey) S.apiKey = key.trim();
  if (provider === 'gemini' && !S.geminiKey) S.geminiKey = key.trim();
  if (provider === 'elevenlabs' && !S.elKey) S.elKey = key.trim();
  saveAll();
  return { ok:true, provider, caps: PROVIDER_MAP[provider]?.caps || [] };
}

function removeApiKey(id) {
  if (!S.apiKeys) return;
  const k = S.apiKeys.find(x => x.id === id);
  if (k) {
    if (k.provider === 'claude' && S.apiKey === k.key) S.apiKey = '';
    if (k.provider === 'gemini' && S.geminiKey === k.key) S.geminiKey = '';
    if (k.provider === 'elevenlabs' && S.elKey === k.key) S.elKey = '';
  }
  S.apiKeys = S.apiKeys.filter(x => x.id !== id);
  saveAll();
}

function toggleApiKey(id) {
  const k = (S.apiKeys||[]).find(x => x.id === id);
  if (k) { k.enabled = !k.enabled; saveAll(); }
}

// ── CAPABILITY QUERIES ──
function getActiveCaps() {
  const caps = new Set();
  for (const k of (S.apiKeys || [])) {
    if (!k.enabled) continue;
    const p = PROVIDER_MAP[k.provider];
    if (p) p.caps.forEach(c => caps.add(c));
  }
  return caps;
}

function hasCap(cap) { return getActiveCaps().has(cap); }

const CAP_PRIORITY = {
  chat: ['claude','openai','gemini','groq','xai','openrouter','mistral','huggingface','together'],
  code: ['claude','openai','gemini','groq','xai','openrouter','mistral'],
  vision: ['claude','openai','gemini','xai'],
  image_gen: ['gemini','openai','stability','xai','huggingface','together'],
  tts: ['elevenlabs','openai','gemini'],
  stt: ['openai','elevenlabs','huggingface'],
  voice_clone: ['elevenlabs'],
  video_gen: ['gemini'],
  music_gen: ['gemini'],
  reasoning: ['claude','openai','gemini','groq','xai','mistral'],
  documents: ['claude','openai','gemini'],
  tools: ['claude','openai'],
  translation: ['huggingface','gemini'],
  upscale: ['stability'],
  image_edit: ['gemini','openai','stability'],
  fast_inference: ['groq']
};

function getKeyForCap(cap) {
  const pri = CAP_PRIORITY[cap] || [];
  for (const pid of pri) {
    const k = (S.apiKeys||[]).find(x => x.enabled && x.provider === pid);
    if (k && PROVIDER_MAP[pid]?.caps.includes(cap)) return k;
  }
  return (S.apiKeys||[]).find(k => k.enabled && PROVIDER_MAP[k.provider]?.caps?.includes(cap));
}

// ── FEATURE MAP (UI auto-unlock) ──
const FEATURE_MAP = {
  image_gen: { label:'🎨 Image Create', desc:'Text se image banao' },
  image_edit: { label:'✏️ Image Edit', desc:'Image modify karo' },
  video_gen: { label:'🎬 Video Create', desc:'Text se video banao' },
  music_gen: { label:'🎵 Music Create', desc:'AI se music banao' },
  tts: { label:'🔊 Voice/TTS', desc:'Text to speech' },
  stt: { label:'🎤 Speech-to-Text', desc:'Voice se text' },
  voice_clone: { label:'🎙️ Voice Clone', desc:'Voice clone karo' },
  upscale: { label:'🔍 Upscale', desc:'Image quality badhao' },
  translation: { label:'🌐 Translate', desc:'Language translate' },
};

function getUnlockedFeatures() {
  const caps = getActiveCaps();
  const features = [];
  for (const [cap, info] of Object.entries(FEATURE_MAP)) {
    if (caps.has(cap)) features.push({ cap, ...info });
  }
  return features;
}

// ── UNIVERSAL API CALLERS ──

async function callProviderChat(messages, opts = {}) {
  const keyObj = getKeyForCap('chat');
  if (!keyObj) return '⚠️ Koi chat API key nahi hai.';
  try {
    switch (keyObj.provider) {
      case 'claude': {
        const r = await _callClaude(keyObj.key, messages, opts);
        return r.ok ? r.text : '⚠️ ' + r.error;
      }
      case 'gemini': {
        const r = await _callGemini(keyObj.key, messages, opts);
        return r.ok ? r.text : '⚠️ ' + r.error;
      }
      default: {
        const p = PROVIDER_MAP[keyObj.provider];
        const ep = _getEndpoint(keyObj.provider);
        const model = p?.models?.fast || p?.models?.chat || 'default';
        const r = await _callOpenAICompat(keyObj.key, ep, model, messages, opts);
        return r.ok ? r.text : '⚠️ ' + r.error;
      }
    }
  } catch(e) { return '⚠️ Network error.'; }
}

function _getEndpoint(pid) {
  const eps = {
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    openai: 'https://api.openai.com/v1/chat/completions',
    xai: 'https://api.x.ai/v1/chat/completions',
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    mistral: 'https://api.mistral.ai/v1/chat/completions',
    together: 'https://api.together.xyz/v1/chat/completions',
    huggingface: 'https://api-inference.huggingface.co/models'
  };
  return eps[pid] || '';
}

// ── CLAUDE CALL ──
async function _callClaude(key, messages, opts) {
  const model = opts.model || selectModel(messages);
  const body = { model, max_tokens: 4096, system: [{ type:'text', text: opts.system||'', cache_control:{ type:'ephemeral' } }], messages, tools: opts.noTools ? undefined : TOOLS };
  if (opts.think) body.thinking = { type:'enabled', budget_tokens:10000 };
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST',
    headers: { 'Content-Type':'application/json', 'x-api-key':key, 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true' },
    body: JSON.stringify(body)
  });
  const d = await r.json();
  if (d.error) {
    // Fallback to sonnet 4.5 if model not found
    if (d.error.message?.includes('model') || d.error.message?.includes('not_found')) {
      const body2 = { ...body, model:'claude-sonnet-4-5' };
      const r2 = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers: { 'Content-Type':'application/json', 'x-api-key':key, 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true' },
        body: JSON.stringify(body2)
      });
      const d2 = await r2.json();
      if (d2.error) return { ok:false, error:d2.error.message };
      return _processClaudeResponse(d2, key, messages, opts);
    }
    return { ok:false, error:d.error.message };
  }
  return _processClaudeResponse(d, key, messages, opts);
}

function _processClaudeResponse(d, key, messages, opts) {
  let tp = [], tr = [];
  for (const b of (d.content||[])) {
    if (b.type === 'text') tp.push(b.text);
    if (b.type === 'tool_use') { const res = executeTool(b.name, b.input); tr.push({ tool_use_id:b.id, result:res }); tp.push(`\n🔧 ${res}`); }
  }
  if (tr.length && d.stop_reason === 'tool_use') {
    // Follow-up call with tool results
    const fu = [...messages, { role:'assistant', content:d.content }, { role:'user', content:tr.map(t => ({ type:'tool_result', tool_use_id:t.tool_use_id, content:t.result })) }];
    fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers: { 'Content-Type':'application/json', 'x-api-key':key, 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true' },
      body: JSON.stringify({ model: d.model || 'claude-sonnet-4-6', max_tokens:4096, system:[{ type:'text', text:opts.system||'' }], messages:fu })
    }).then(r => r.json()).then(d2 => {
      if (!d2.error) { const ft = (d2.content||[]).filter(b => b.type==='text').map(b => b.text).join('\n'); if (ft) tp.push(ft); }
      setTimeout(() => render(), 500);
    }).catch(() => {});
  }
  return { ok:true, text: tp.join('\n') || 'No response.' };
}

// ── GEMINI CALL ──
async function _callGemini(key, messages, opts) {
  const model = opts.geminiModel || 'gemini-2.0-flash';
  const contents = messages.map(m => {
    if (Array.isArray(m.content)) {
      const parts = m.content.map(c => {
        if (c.type === 'text') return { text:c.text };
        if (c.type === 'image') return { inline_data:{ mime_type:c.source.media_type, data:c.source.data } };
        if (c.type === 'document') return { inline_data:{ mime_type:c.source.media_type, data:c.source.data } };
        return { text:JSON.stringify(c) };
      });
      return { role: m.role==='assistant'?'model':'user', parts };
    }
    return { role: m.role==='assistant'?'model':'user', parts:[{ text:m.content }] };
  });
  const merged = [];
  for (const c of contents) {
    if (merged.length && merged[merged.length-1].role === c.role) merged[merged.length-1].parts.push(...c.parts);
    else merged.push(c);
  }
  if (merged.length && merged[0].role === 'model') merged.shift();

  const body = { contents:merged, generationConfig:{ maxOutputTokens:4096, temperature:0.7 } };
  if (opts.system) body.system_instruction = { parts:[{ text:opts.system }] };
  if (opts.imageGen) body.generationConfig.responseModalities = ['TEXT','IMAGE'];

  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method:'POST', headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify(body)
  });
  const d = await r.json();
  if (d.error) return { ok:false, error:d.error.message };
  if (d.candidates?.[0]?.content?.parts) {
    const parts = d.candidates[0].content.parts;
    const texts = parts.filter(p => p.text).map(p => p.text);
    const imgs = parts.filter(p => p.inlineData);
    return { ok:true, text:texts.join('\n')||'', images:imgs.map(p => ({ data:p.inlineData.data, mime:p.inlineData.mimeType })) };
  }
  return { ok:false, error:'No response from Gemini.' };
}

// ── OPENAI-COMPATIBLE CALL ──
async function _callOpenAICompat(key, endpoint, model, messages, opts) {
  const oai = [];
  if (opts.system) oai.push({ role:'system', content:opts.system });
  for (const m of messages) {
    const txt = typeof m.content === 'string' ? m.content : m.content.filter(c => c.type==='text').map(c => c.text).join('\n') || '[content]';
    oai.push({ role:m.role, content:txt });
  }
  const headers = { 'Content-Type':'application/json', 'Authorization':`Bearer ${key}` };
  if (endpoint.includes('openrouter')) headers['HTTP-Referer'] = 'https://aakash-ai.app';
  const r = await fetch(endpoint, {
    method:'POST', headers,
    body: JSON.stringify({ model, messages:oai, max_tokens:4096, temperature:0.7 })
  });
  const d = await r.json();
  if (d.error) return { ok:false, error: d.error.message || JSON.stringify(d.error) };
  return { ok:true, text: d.choices?.[0]?.message?.content || 'No response.' };
}

// ── IMAGE GENERATION (unified) ──
async function generateImage(prompt) {
  for (const pid of ['gemini','openai','stability','huggingface','xai']) {
    const keyObj = (S.apiKeys||[]).find(k => k.enabled && k.provider === pid);
    if (!keyObj || !PROVIDER_MAP[pid]?.caps.includes('image_gen')) continue;
    try {
      if (pid === 'gemini') {
        const r = await _callGemini(keyObj.key, [{ role:'user', content:'Generate this image: ' + prompt }], { imageGen:true });
        if (r.ok && r.images?.length) return r;
      } else if (pid === 'openai') {
        const r = await fetch('https://api.openai.com/v1/images/generations', {
          method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${keyObj.key}` },
          body: JSON.stringify({ model:'gpt-image-1', prompt, n:1, size:'1024x1024', response_format:'b64_json' })
        });
        const d = await r.json();
        if (!d.error && d.data?.length) return { ok:true, images:d.data.map(i => ({ data:i.b64_json, mime:'image/png' })) };
      } else if (pid === 'huggingface') {
        const r = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-3', {
          method:'POST', headers:{ 'Authorization':`Bearer ${keyObj.key}`, 'Content-Type':'application/json' },
          body: JSON.stringify({ inputs:prompt })
        });
        if (r.ok) {
          const blob = await r.blob();
          return await new Promise(res => {
            const rd = new FileReader();
            rd.onload = () => res({ ok:true, images:[{ data:rd.result.split(',')[1], mime:'image/png' }] });
            rd.readAsDataURL(blob);
          });
        }
      }
    } catch(e) { continue; }
  }
  return { ok:false, error:'Koi image generation key nahi hai. Settings mein add karo.' };
}

// ── TTS (unified) ──
async function generateSpeech(text) {
  for (const pid of ['elevenlabs','openai']) {
    const keyObj = (S.apiKeys||[]).find(k => k.enabled && k.provider === pid);
    if (!keyObj) continue;
    try {
      if (pid === 'elevenlabs') {
        const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
          method:'POST', headers:{ 'xi-api-key':keyObj.key, 'Content-Type':'application/json' },
          body: JSON.stringify({ text, model_id:'eleven_multilingual_v2' })
        });
        if (r.ok) { const b = await r.blob(); return { ok:true, audioUrl:URL.createObjectURL(b) }; }
      } else if (pid === 'openai') {
        const r = await fetch('https://api.openai.com/v1/audio/speech', {
          method:'POST', headers:{ 'Authorization':`Bearer ${keyObj.key}`, 'Content-Type':'application/json' },
          body: JSON.stringify({ model:'tts-1', input:text, voice:'alloy' })
        });
        if (r.ok) { const b = await r.blob(); return { ok:true, audioUrl:URL.createObjectURL(b) }; }
      }
    } catch(e) { continue; }
  }
  return { ok:false, fallback:'browser' };
}

// ── MIGRATE old keys to new system ──
function migrateKeys() {
  if (!S.apiKeys) S.apiKeys = [];
  if (S.apiKey && !S.apiKeys.find(k => k.key === S.apiKey)) {
    S.apiKeys.push({ id:Date.now(), name:'Claude', key:S.apiKey, provider:'claude', enabled:true, addedAt:new Date().toISOString() });
  }
  if (S.geminiKey && !S.apiKeys.find(k => k.key === S.geminiKey)) {
    S.apiKeys.push({ id:Date.now()+1, name:'Gemini', key:S.geminiKey, provider:'gemini', enabled:true, addedAt:new Date().toISOString() });
  }
  if (S.elKey && !S.apiKeys.find(k => k.key === S.elKey)) {
    S.apiKeys.push({ id:Date.now()+2, name:'ElevenLabs', key:S.elKey, provider:'elevenlabs', enabled:true, addedAt:new Date().toISOString() });
  }
}
