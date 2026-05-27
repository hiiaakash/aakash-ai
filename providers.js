// ════════════════════════════════════
//  AAKASH AI v3 — Providers (providers.js)
//  Smart API Key Pool — Auto-detect & Route
//  Web Search, Streaming, Multi-turn Tools
//  FIXED: Claude system param, dead models removed
// ════════════════════════════════════

// ── PROVIDER CAPABILITY MAP ──
const PROVIDER_MAP = {
  claude: {
    detect: k => k.startsWith('sk-ant-'),
    name: 'Claude', icon: '🟠',
    caps: ['chat','code','vision','reasoning','documents','tools','web_search','extended_thinking'],
    models: { fast:'claude-haiku-4-5-20251001', balanced:'claude-sonnet-4-6', powerful:'claude-opus-4-6' }
  },
  gemini: {
    detect: k => k.startsWith('AIza'),
    name: 'Gemini', icon: '🔵',
    caps: ['chat','code','vision','image_gen','reasoning','documents','tts','video_gen','music_gen','grounding','image_edit','code_execution'],
    models: { chat:'gemini-2.0-flash', image:'gemini-2.0-flash-preview-image-generation' }
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

// ════════════════════════════════════════════════════
//  AAKASH BRAIN — Self-Healing Provider Intelligence
//  - Auto model fallback on 404/deprecated
//  - Auto cooldown on 429/rate limit
//  - Auto skip on 402/no credits
//  - Auto retry after cooldown expires
//  - Never stops — always finds a way
// ════════════════════════════════════════════════════

const BRAIN = {
  // ── Model fallback chains — CLEANED: dead models removed ──
  modelChains: {
    claude:     ['claude-sonnet-4-6','claude-haiku-4-5-20251001','claude-opus-4-6'],
    gemini:     ['gemini-2.0-flash','gemini-2.0-flash-lite','gemini-1.5-flash','gemini-2.5-flash-preview-05-20'],
    groq:       ['llama-3.3-70b-versatile','llama-3.1-8b-instant','mixtral-8x7b-32768','gemma2-9b-it'],
    openai:     ['gpt-4o-mini','gpt-4o','gpt-3.5-turbo'],
    xai:        ['grok-3-mini','grok-3','grok-2'],
    openrouter: ['google/gemini-2.0-flash-exp:free','meta-llama/llama-3.3-70b-instruct:free','anthropic/claude-sonnet-4.6','google/gemini-2.0-flash-001'],
    mistral:    ['mistral-small-latest','mistral-large-latest','open-mistral-nemo'],
    together:   ['meta-llama/Llama-3.3-70B-Instruct-Turbo','meta-llama/Llama-3.1-8B-Instruct-Turbo','mistralai/Mixtral-8x7B-Instruct-v0.1'],
    huggingface:['meta-llama/Llama-3-70b','mistralai/Mistral-7B-Instruct-v0.3']
  },

  health: {},

  classify(status, msg) {
    const m = (msg || '').toLowerCase();
    if (status === 401 || /invalid.*key|authentication|unauthorized|api.key/i.test(m)) return 'invalid_key';
    if (status === 402 || /credit|billing|insufficient|balance.*low|payment|upgrade/i.test(m)) return 'no_credits';
    if (status === 429 || /rate|limit|quota|exhausted|too many|resource.*exhausted/i.test(m)) return 'rate_limited';
    if (status === 404 || /not.found|model.*not|does not exist|no such|deprecated|decommissioned/i.test(m)) return 'model_dead';
    if (status === 400 || /bad.request|invalid.*request|malformed/i.test(m)) return 'bad_request';
    if (status === 403 || /forbidden|permission|access.*denied/i.test(m)) return 'forbidden';
    if (status === 503 || /overloaded|capacity|maintenance|unavailable/i.test(m)) return 'overloaded';
    if (/network|fetch|timeout|abort|failed to fetch|err_/i.test(m)) return 'network';
    return 'unknown';
  },

  cooldownMs: {
    invalid_key:  24 * 3600000,
    no_credits:   6  * 3600000,
    rate_limited:  61 * 1000,
    model_dead:   0,
    bad_request:  5  * 60000,
    forbidden:    24 * 3600000,
    overloaded:   2  * 60000,
    network:      15 * 1000,
    unknown:      30 * 1000
  },

  markDown(pid, model, errorType, errorMsg) {
    const key = pid + ':' + (model || 'any');
    this.health[key] = {
      status: errorType,
      until: Date.now() + (this.cooldownMs[errorType] || 30000),
      msg: (errorMsg || '').slice(0, 100),
      ts: Date.now()
    };
    this._save();
    console.log(`[BRAIN] ${pid}/${model} → ${errorType} (cooldown ${Math.round((this.cooldownMs[errorType]||30000)/1000)}s)`);
  },

  markUp(pid, model) {
    const key = pid + ':' + (model || 'any');
    delete this.health[key];
    delete this.health[pid + ':any'];
    this._save();
  },

  isUp(pid, model) {
    const pKey = pid + ':any';
    const pH = this.health[pKey];
    if (pH && Date.now() < pH.until) return false;
    if (pH && Date.now() >= pH.until) delete this.health[pKey];
    if (model) {
      const mKey = pid + ':' + model;
      const mH = this.health[mKey];
      if (mH && mH.status === 'model_dead') return false;
      if (mH && Date.now() < mH.until) return false;
      if (mH && Date.now() >= mH.until) delete this.health[mKey];
    }
    return true;
  },

  isProviderLevel(errorType) {
    return ['invalid_key','no_credits','forbidden','network'].includes(errorType);
  },

  pickModel(pid, preferredModel) {
    const chain = this.modelChains[pid];
    if (!chain || !chain.length) return preferredModel || null;
    if (preferredModel && this.isUp(pid, preferredModel)) return preferredModel;
    for (const m of chain) { if (this.isUp(pid, m)) return m; }
    for (const m of chain) {
      const mKey = pid + ':' + m;
      const h = this.health[mKey];
      if (h && h.status !== 'model_dead' && Date.now() >= h.until) { delete this.health[mKey]; return m; }
    }
    return chain[0];
  },

  handleError(pid, model, status, errorMsg) {
    const errorType = this.classify(status, errorMsg);
    if (this.isProviderLevel(errorType)) {
      this.markDown(pid, null, errorType, errorMsg);
      return { retry: false, nextModel: null, errorType };
    }
    if (errorType === 'model_dead') {
      this.markDown(pid, model, errorType, errorMsg);
      const next = this.pickModel(pid, null);
      if (next && next !== model) return { retry: true, nextModel: next, errorType };
      return { retry: false, nextModel: null, errorType };
    }
    if (errorType === 'rate_limited' || errorType === 'overloaded') {
      this.markDown(pid, model, errorType, errorMsg);
      return { retry: false, nextModel: null, errorType };
    }
    this.markDown(pid, model, errorType, errorMsg);
    return { retry: false, nextModel: null, errorType };
  },

  getStatus() {
    const entries = Object.entries(this.health).filter(([k,v]) => Date.now() < v.until || v.status === 'model_dead');
    if (!entries.length) return 'All systems healthy';
    return entries.map(([k, v]) => {
      const remaining = Math.max(0, Math.round((v.until - Date.now()) / 1000));
      return `${k}: ${v.status}${remaining > 0 ? ' ('+remaining+'s)' : ''}`;
    }).join(' | ');
  },

  _save() { try { localStorage.setItem('ak_brain_health', JSON.stringify(this.health)); } catch {} },

  load() {
    try {
      const d = localStorage.getItem('ak_brain_health');
      if (d) this.health = JSON.parse(d);
      Object.keys(this.health).forEach(k => {
        const h = this.health[k];
        if (h.status !== 'model_dead' && Date.now() >= h.until) delete this.health[k];
      });
    } catch { this.health = {}; }
  },

  reset() {
    this.health = {};
    try { localStorage.removeItem('ak_brain_health'); } catch {};
    console.log('[BRAIN] Health reset — all providers cleared');
  }
};

BRAIN.load();

function detectProvider(key) {
  if (!key || key.length < 6) return 'unknown';
  for (const pid of DETECT_ORDER) { if (PROVIDER_MAP[pid]?.detect(key)) return pid; }
  return 'unknown';
}

// ── KEY MANAGEMENT ──
function addApiKey(name, key) {
  if (!S.apiKeys) S.apiKeys = [];
  if (S.apiKeys.find(k => k.key === key)) return { ok:false, msg:'Ye key pehle se hai.' };
  const provider = detectProvider(key);
  S.apiKeys.push({ id:Date.now(), name:name.trim(), key:key.trim(), provider, enabled:true, addedAt:new Date().toISOString() });
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
  fast_inference: ['groq'],
  web_search: ['claude','gemini'],
  grounding: ['gemini'],
  extended_thinking: ['claude'],
  code_execution: ['gemini']
};

function getKeyForCap(cap) {
  const pri = CAP_PRIORITY[cap] || [];
  for (const pid of pri) {
    const k = (S.apiKeys||[]).find(x => x.enabled && x.provider === pid);
    if (k && PROVIDER_MAP[pid]?.caps.includes(cap)) return k;
  }
  return (S.apiKeys||[]).find(k => k.enabled && PROVIDER_MAP[k.provider]?.caps?.includes(cap));
}

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
  web_search: { label:'🔍 Web Search', desc:'Real-time internet search' },
  extended_thinking: { label:'🤔 Deep Think', desc:'Complex reasoning' },
  grounding: { label:'🌐 Grounding', desc:'Gemini web search' },
  code_execution: { label:'💻 Code Run', desc:'Code execute karo' }
};

function getUnlockedFeatures() {
  const caps = getActiveCaps();
  const features = [];
  for (const [cap, info] of Object.entries(FEATURE_MAP)) {
    if (caps.has(cap)) features.push({ cap, ...info });
  }
  return features;
}

// ── UNIVERSAL CHAT CALLER ──
async function callProviderChat(messages, opts = {}) {
  const keyObj = getKeyForCap('chat');
  if (!keyObj) return '⚠️ Koi chat API key nahi hai.';
  try {
    switch (keyObj.provider) {
      case 'claude': { const r = await _callClaude(keyObj.key, messages, opts); return r.ok ? r.text : '⚠️ ' + r.error; }
      case 'gemini': { const r = await _callGemini(keyObj.key, messages, opts); return r.ok ? r.text : '⚠️ ' + r.error; }
      default: { const p = PROVIDER_MAP[keyObj.provider]; const ep = _getEndpoint(keyObj.provider); const model = p?.models?.fast || p?.models?.chat || 'default'; const r = await _callOpenAICompat(keyObj.key, ep, model, messages, opts); return r.ok ? r.text : '⚠️ ' + r.error; }
    }
  } catch(e) { return '⚠️ Network error.'; }
}

function _getEndpoint(pid) {
  return { groq:'https://api.groq.com/openai/v1/chat/completions', openai:'https://api.openai.com/v1/chat/completions', xai:'https://api.x.ai/v1/chat/completions', openrouter:'https://openrouter.ai/api/v1/chat/completions', mistral:'https://api.mistral.ai/v1/chat/completions', together:'https://api.together.xyz/v1/chat/completions', huggingface:'https://api-inference.huggingface.co/models' }[pid] || '';
}

// ══════════════════════════════════════════
//  CLAUDE API — FIXED: system as top-level param
//  Messages array NEVER contains role:"system"
//  Web Search + Tools + Extended Thinking
// ══════════════════════════════════════════

async function _callClaude(key, messages, opts) {
  const model = opts.model || selectModel(messages);

  // ── CRITICAL FIX: Filter out any role:"system" from messages ──
  // Claude Messages API does NOT accept "system" role in messages array
  // System prompt goes ONLY in top-level "system" parameter
  const cleanMessages = messages.filter(m => m.role !== 'system');

  // If any system messages were in array, merge their content into opts.system
  const systemFromMessages = messages.filter(m => m.role === 'system').map(m => {
    if (typeof m.content === 'string') return m.content;
    if (Array.isArray(m.content)) return m.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
    return '';
  }).join('\n');

  const fullSystem = [opts.system || '', systemFromMessages].filter(Boolean).join('\n\n');

  // Build tools: app tools (custom) + web_search (built-in)
  const allTools = [];
  if (!opts.noTools) allTools.push(...TOOLS);
  allTools.push({ type:'web_search_20250305', name:'web_search', max_uses:5 });

  const body = {
    model,
    max_tokens: 8192,
    stream: true,
    system: fullSystem,           // ← CORRECT: top-level system param
    messages: cleanMessages,       // ← CORRECT: no role:"system" in messages
    tools: allTools.length ? allTools : undefined
  };
  if (opts.think) body.thinking = { type:'enabled', budget_tokens:10000 };

  const headers = {
    'Content-Type':'application/json',
    'x-api-key':key,
    'anthropic-version':'2023-06-01',
    'anthropic-dangerous-direct-browser-access':'true'
  };

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers, body:JSON.stringify(body) });

    if (!r.ok || !r.headers.get('content-type')?.includes('text/event-stream')) {
      const d = await r.json();
      if (d.error) {
        return { ok:false, status:r.status, error:d.error.message || JSON.stringify(d.error) };
      }
      return await _processClaudeResponse(d, key, cleanMessages, opts, allTools, headers);
    }

    return await _streamClaudeResponse(r, key, cleanMessages, opts, allTools, headers);
  } catch(e) { return { ok:false, status:0, error:e.message||'Network error' }; }
}

// ── STREAM PARSER — word-by-word live update ──
async function _streamClaudeResponse(response, key, messages, opts, allTools, headers) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '', buffer = '', toolUseBlocks = [], currentToolUse = null, contentBlocks = [];
  let hasToolUse = false, stopReason = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]' || !data) continue;

        try {
          const event = JSON.parse(data);

          if (event.type === 'content_block_start') {
            const block = event.content_block;
            if (block.type === 'tool_use') {
              hasToolUse = true;
              currentToolUse = { id: block.id, name: block.name, input: '' };
            }
            contentBlocks[event.index] = block;
          }

          if (event.type === 'content_block_delta') {
            const delta = event.delta;
            if (delta.type === 'text_delta') {
              fullText += delta.text;
              if (typeof opts.onStream === 'function') opts.onStream(fullText);
            } else if (delta.type === 'input_json_delta' && currentToolUse) {
              currentToolUse.input += delta.partial_json;
            }
          }

          if (event.type === 'content_block_stop') {
            if (currentToolUse) {
              try { currentToolUse.input = JSON.parse(currentToolUse.input); } catch { currentToolUse.input = {}; }
              toolUseBlocks.push(currentToolUse);
              currentToolUse = null;
            }
          }

          if (event.type === 'message_delta') {
            stopReason = event.delta?.stop_reason || '';
          }
        } catch (parseErr) { /* skip malformed SSE */ }
      }
    }
  } catch (streamErr) {
    console.log('Stream read error:', streamErr);
  }

  // ── Handle tool use ──
  if (hasToolUse && toolUseBlocks.length > 0 && stopReason === 'tool_use') {
    let toolResults = [];
    for (const tu of toolUseBlocks) {
      const result = executeTool(tu.name, tu.input);
      toolResults.push({ type:'tool_result', tool_use_id:tu.id, content:result });
    }

    const assistantContent = [];
    if (fullText.trim()) assistantContent.push({ type:'text', text:fullText.trim() });
    for (const tu of toolUseBlocks) assistantContent.push({ type:'tool_use', id:tu.id, name:tu.name, input:tu.input });

    // ── FIXED: system goes in top-level param, not in messages ──
    const followUp = [...messages, { role:'assistant', content:assistantContent }, { role:'user', content:toolResults }];
    try {
      const r2 = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers,
        body: JSON.stringify({
          model: opts.model || selectModel(messages),
          max_tokens: 8192,
          system: opts.system || '',    // ← top-level system
          messages: followUp,            // ← clean messages only
          tools: allTools
        })
      });
      const d2 = await r2.json();
      if (!d2.error) {
        const fu = await _processClaudeResponse(d2, key, followUp, opts, allTools, headers, 1);
        if (fu.ok && fu.text) {
          fullText += '\n' + fu.text;
          if (typeof opts.onStream === 'function') opts.onStream(fullText);
        }
      }
    } catch(e) { console.log('Tool follow-up error:', e); }
  }

  return { ok: true, text: fullText || 'No response.' };
}

// ── PROCESS CLAUDE RESPONSE — PROPER AWAIT + TOOL CHAINS ──
async function _processClaudeResponse(d, key, messages, opts, allTools, headers, depth = 0) {
  if (depth > 5) {
    const texts = (d.content||[]).filter(b => b.type === 'text').map(b => b.text);
    return { ok:true, text: texts.join('\n') || 'Max tool depth reached.' };
  }

  let textParts = [], toolResults = [];

  for (const block of (d.content || [])) {
    if (block.type === 'text') textParts.push(block.text);
    if (block.type === 'thinking' && S.showThinking) {
      textParts.push(`\n💭 *Thinking:* ${block.thinking.slice(0,200)}...\n`);
    }
    if (block.type === 'tool_use') {
      const result = executeTool(block.name, block.input);
      toolResults.push({ type:'tool_result', tool_use_id:block.id, content:result });
    }
  }

  if (toolResults.length > 0 && d.stop_reason === 'tool_use') {
    const followUp = [...messages, { role:'assistant', content:d.content }, { role:'user', content:toolResults }];
    try {
      const r2 = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers,
        body: JSON.stringify({
          model: d.model || 'claude-sonnet-4-6',
          max_tokens: 8192,
          system: opts.system || '',    // ← FIXED: top-level system
          messages: followUp,
          tools: allTools
        })
      });
      const d2 = await r2.json();
      if (!d2.error) {
        const fu = await _processClaudeResponse(d2, key, followUp, opts, allTools, headers, depth+1);
        if (fu.ok && fu.text) textParts.push(fu.text);
      }
    } catch(e) { console.log('Tool follow-up error:', e); }
  }

  return { ok:true, text: textParts.join('\n') || 'No response.' };
}

// ══════════════════════════════════════════
//  GEMINI API — FULL CAPABILITIES
// ══════════════════════════════════════════

async function _callGemini(key, messages, opts) {
  const contents = messages.filter(m => m.role !== 'system').map(m => {
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

  const body = { contents:merged, generationConfig:{ maxOutputTokens:8192, temperature:0.7 } };
  if (opts.system) {
    const sysText = opts.system.length > 3000 ? opts.system.slice(0, 3000) + '\n[...truncated for brevity]' : opts.system;
    body.system_instruction = { parts:[{ text:sysText }] };
  }
  if (opts.imageGen) body.generationConfig.responseModalities = ['TEXT','IMAGE'];

  if (!opts.noTools) {
    const toolsDef = [];
    if (opts.useGrounding) toolsDef.push({ google_search:{} });
    if (opts.useCodeExec) toolsDef.push({ code_execution:{} });
    if (toolsDef.length) body.tools = toolsDef;
  }

  const model = opts.geminiModel || 'gemini-2.0-flash';

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body)
    });
    const d = await r.json();
    if (d.error) {
      console.log(`Gemini ${model} error:`, d.error.message);
      return { ok:false, status:d.error.code||r.status, error:`${model}: ${d.error.message}` };
    }
    if (d.candidates?.[0]?.content?.parts) {
      const parts = d.candidates[0].content.parts;
      const texts = parts.filter(p => p.text).map(p => p.text);
      const imgs = parts.filter(p => p.inlineData);
      const codeResults = parts.filter(p => p.executableCode || p.codeExecutionResult);
      if (codeResults.length) {
        for (const cr of codeResults) {
          if (cr.executableCode) texts.push(`\n\`\`\`${cr.executableCode.language||'python'}\n${cr.executableCode.code}\n\`\`\``);
          if (cr.codeExecutionResult) texts.push(`\nResult: ${cr.codeExecutionResult.output}`);
        }
      }
      const grounding = d.candidates[0].groundingMetadata;
      if (grounding?.groundingChunks?.length) {
        const sources = grounding.groundingChunks.filter(c => c.web).map(c => `[${c.web.title}](${c.web.uri})`).slice(0,3);
        if (sources.length) texts.push('\n\n📌 Sources: ' + sources.join(' | '));
      }
      return { ok:true, text:texts.join('\n')||'', images:imgs.map(p => ({ data:p.inlineData.data, mime:p.inlineData.mimeType })) };
    }
    return { ok:false, status:r.status, error:`${model}: Empty response` };
  } catch(e) {
    console.log(`Gemini ${model} network error:`, e.message);
    return { ok:false, status:0, error:`${model}: ${e.message||'Network error'}` };
  }
}

// ── OPENAI-COMPATIBLE ──
async function _callOpenAICompat(key, endpoint, model, messages, opts) {
  const oai = [];
  if (opts.system) oai.push({ role:'system', content:opts.system });
  for (const m of messages) {
    if (m.role === 'system') continue; // skip system role messages — already handled above
    const txt = typeof m.content === 'string' ? m.content : m.content.filter(c => c.type==='text').map(c => c.text).join('\n') || '[content]';
    oai.push({ role:m.role, content:txt });
  }
  const headers = { 'Content-Type':'application/json', 'Authorization':`Bearer ${key}` };
  if (endpoint.includes('openrouter')) headers['HTTP-Referer'] = 'https://aakash-ai.app';
  try {
    const r = await fetch(endpoint, { method:'POST', headers, body:JSON.stringify({ model, messages:oai, max_tokens:4096, temperature:0.7 }) });
    const d = await r.json();
    if (d.error) return { ok:false, status:r.status, error:d.error.message||JSON.stringify(d.error) };
    return { ok:true, text:d.choices?.[0]?.message?.content||'No response.' };
  } catch(e) { return { ok:false, status:0, error:e.message||'Network error' }; }
}

// ── IMAGE GENERATION (unified) ──
async function generateImage(prompt) {
  for (const pid of ['gemini','openai','stability','huggingface','xai']) {
    const keyObj = (S.apiKeys||[]).find(k => k.enabled && k.provider === pid);
    if (!keyObj || !PROVIDER_MAP[pid]?.caps.includes('image_gen')) continue;
    try {
      if (pid === 'gemini') {
        const r = await _callGemini(keyObj.key, [{ role:'user', content:'Generate this image: '+prompt }], { imageGen:true, geminiModel:'gemini-2.0-flash-preview-image-generation' });
        if (r.ok && r.images?.length) return r;
      } else if (pid === 'openai') {
        const r = await fetch('https://api.openai.com/v1/images/generations', { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${keyObj.key}` }, body:JSON.stringify({ model:'gpt-image-1', prompt, n:1, size:'1024x1024', response_format:'b64_json' }) });
        const d = await r.json();
        if (!d.error && d.data?.length) return { ok:true, images:d.data.map(i => ({ data:i.b64_json, mime:'image/png' })) };
      } else if (pid === 'huggingface') {
        const r = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-3', { method:'POST', headers:{ 'Authorization':`Bearer ${keyObj.key}`, 'Content-Type':'application/json' }, body:JSON.stringify({ inputs:prompt }) });
        if (r.ok) { const blob = await r.blob(); return await new Promise(res => { const rd = new FileReader(); rd.onload = () => res({ ok:true, images:[{ data:rd.result.split(',')[1], mime:'image/png' }] }); rd.readAsDataURL(blob); }); }
      }
    } catch(e) { continue; }
  }
  return { ok:false, error:'Koi image generation key nahi hai.' };
}

// ── IMAGE EDITING (Gemini) ──
async function editImage(imageBase64, mime, editPrompt) {
  const gk = (S.apiKeys||[]).find(k => k.enabled && k.provider === 'gemini');
  if (!gk) return { ok:false, error:'Gemini key chahiye image editing ke liye.' };
  return await _callGemini(gk.key, [{ role:'user', content:[{ type:'image', source:{ type:'base64', media_type:mime, data:imageBase64 } }, { type:'text', text:'Edit this image: '+editPrompt }] }], { imageGen:true, geminiModel:'gemini-2.0-flash-preview-image-generation' });
}

// ── TTS (unified) ──
async function generateSpeech(text) {
  for (const pid of ['elevenlabs','openai']) {
    const keyObj = (S.apiKeys||[]).find(k => k.enabled && k.provider === pid);
    if (!keyObj) continue;
    try {
      if (pid === 'elevenlabs') {
        const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', { method:'POST', headers:{ 'xi-api-key':keyObj.key, 'Content-Type':'application/json' }, body:JSON.stringify({ text, model_id:'eleven_multilingual_v2' }) });
        if (r.ok) { const b = await r.blob(); return { ok:true, audioUrl:URL.createObjectURL(b) }; }
      } else if (pid === 'openai') {
        const r = await fetch('https://api.openai.com/v1/audio/speech', { method:'POST', headers:{ 'Authorization':`Bearer ${keyObj.key}`, 'Content-Type':'application/json' }, body:JSON.stringify({ model:'tts-1', input:text, voice:'alloy' }) });
        if (r.ok) { const b = await r.blob(); return { ok:true, audioUrl:URL.createObjectURL(b) }; }
      }
    } catch(e) { continue; }
  }
  return { ok:false, fallback:'browser' };
}

// ── MIGRATE old keys ──
function migrateKeys() {
  if (!S.apiKeys) S.apiKeys = [];
  if (S.apiKey && !S.apiKeys.find(k => k.key === S.apiKey)) S.apiKeys.push({ id:Date.now(), name:'Claude', key:S.apiKey, provider:'claude', enabled:true, addedAt:new Date().toISOString() });
  if (S.geminiKey && !S.apiKeys.find(k => k.key === S.geminiKey)) S.apiKeys.push({ id:Date.now()+1, name:'Gemini', key:S.geminiKey, provider:'gemini', enabled:true, addedAt:new Date().toISOString() });
  if (S.elKey && !S.apiKeys.find(k => k.key === S.elKey)) S.apiKeys.push({ id:Date.now()+2, name:'ElevenLabs', key:S.elKey, provider:'elevenlabs', enabled:true, addedAt:new Date().toISOString() });
}
