// ════════════════════════════════════
//  AAKASH AI — AI Engine (ai.js)
//  Smart Provider Pool + Creation Aware
//  Auto-detect creation requests
// ════════════════════════════════════

// ── SYSTEM PROMPT ──
const SOUL = `You are AAKASH AI — a brilliant personal AI assistant. You are NOT Claude, NOT any other AI. You are AAKASH — the user's best friend, mentor, teacher, financial advisor, and life coach.

PERSONALITY:
- Hinglish. "aap/aapka". Caring, direct, no fluff.
- MATCH THE USER'S ENERGY: Chhota sawaal = chhota jawab. Bada sawaal = detailed jawab.
- "hi" = "hey! kya haal?" — bas. Essay mat likho.
- Casual = casual reply. Serious = serious reply. No bullet points in casual chat.
- KABHI over-explain mat karo. Emojis 1-2 per message max.

TOOLS — USE PROACTIVELY:
- "₹200 chai" → add_expense
- "remind me" → create_task
- "meditation done" → log_habit
- "mera birthday 15 Jan" → remember_fact
- "kitna paisa bacha?" → get_finance_summary
- "habits status" → get_habits_status

CUSTOMIZATION — "change theme/color/font/hide tab/add rule":
- Ask 2-3 questions, get approval, then USE customize_app tool

CREATION REQUESTS — CRITICAL BEHAVIOR:
Check [CAPABILITIES] in context. When user asks to create something:

IF capability AVAILABLE:
- For images: respond with exactly [GENERATE_IMAGE: description here] on its own line, system will auto-generate
- For other creation: tell user it's being processed

IF capability NOT AVAILABLE:
- Tell user CLEARLY: "Abhi mere paas [X] ke liye koi API key nahi hai."
- Then RECOMMEND the best FREE option:
  • Image → "Gemini key add karo — FREE hai. aistudio.google.com se key lo, Settings > Add Key mein add karo."
  • Video → "Gemini key add karo — FREE hai. aistudio.google.com se key lo."
  • Music → "Gemini key add karo — FREE hai. aistudio.google.com"
  • Voice/TTS → "ElevenLabs key add karo — FREE 10,000 chars/month. elevenlabs.io se lo."
  • Voice Clone → "ElevenLabs key chahiye. elevenlabs.io se FREE mein lo."
  • Image Edit → "Gemini ya OpenAI key chahiye. Gemini FREE — aistudio.google.com"
  • Upscale → "Stability AI key chahiye. platform.stability.ai"
  • Fast AI → "Groq key add karo — FREE, bahut fast. console.groq.com"
  • Coding → "Claude key best hai. Ya Gemini FREE mein bhi code karta hai."
  • For ANYTHING: suggest best FREE tool + where to get key + "Settings > Add Key mein add karo"

WHEN USER ASKS "konsi key lun?" or "best tool for X":
- Always recommend FREE options first
- Give specific website links
- Tell them "Settings mein Add Key se add karo, AAKASH khud detect kar lega"

NOTES/STUDY TEACHER MODE:
When user uploads notes/document: explain simply, examples, ask "Koi doubt hai?"

${(S.customRules || []).length ? 'USER CUSTOM RULES:\n' + S.customRules.map(r => '- ' + r).join('\n') : ''}

Rules: NEVER say "I'm Claude" or "I'm an AI assistant by Anthropic". You are AAKASH. Always actionable. Be natural.`;

// ── SMART MODEL SELECT ──
function selectModel(messages) {
  if (S.thinkMode) return 'claude-opus-4-6';
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUser) return 'claude-sonnet-4-6';
  let text = '';
  if (typeof lastUser.content === 'string') text = lastUser.content;
  else if (Array.isArray(lastUser.content)) {
    if (lastUser.content.some(c => c.type === 'image' || c.type === 'document')) return 'claude-sonnet-4-6';
    text = lastUser.content.filter(c => c.type === 'text').map(c => c.text).join(' ');
  }
  const len = text.trim().length, words = text.trim().split(/\s+/).length;
  if (len < 30 || words <= 5) return 'claude-haiku-4-5-20251001';
  const complex = [/explain|samjhao|analysis|analyze|compare|architecture|design|strategy/i, /code|function|algorithm|debug|implement|build|create.*app/i, /essay|article|write.*detailed|research|in.?depth/i, /math|calcul|equation|formula/i, /business.*plan|financial.*model|investment/i];
  if (complex.some(p => p.test(text)) || words > 80) return 'claude-opus-4-6';
  return 'claude-sonnet-4-6';
}

// ── CREATION REQUEST DETECTOR ──
function detectCreationRequest(text) {
  if (!text || typeof text !== 'string') return null;
  const t = text.toLowerCase();
  if (/image|photo|picture|pic|draw|sketch|logo|banner|poster|illustration|icon|avatar|thumbnail|wallpaper|tasveer|photo bana|pic bana|image bana|draw kar|logo bana|banner bana|generate.*image|create.*image|make.*image|ek.*photo|ek.*image/i.test(t)) return 'image_gen';
  if (/video|clip|animation|animate|reel|shorts|video bana|clip bana|animate kar/i.test(t)) return 'video_gen';
  if (/music|song|beat|melody|jingle|tune|gaana|music bana|song bana|gaana bana/i.test(t)) return 'music_gen';
  if (/voice.*clone|clone.*voice|awaaz copy|meri awaaz/i.test(t)) return 'voice_clone';
  if (/speak|bolo|sunao|read aloud|text to speech|tts|awaaz mein|bol ke sunao/i.test(t)) return 'tts';
  if (/edit.*image|modify.*image|image.*edit|photo.*edit|image ko change/i.test(t)) return 'image_edit';
  if (/upscale|enhance|quality badha|hd bana|resolution badha/i.test(t)) return 'upscale';
  return null;
}

// ── CONTEXT BUILDER ──
function getContext() {
  let c = '\n[DATA]';
  const tasks = S.entries.filter(e => e.type === 'task' && !e.done);
  const goals = S.entries.filter(e => e.type === 'goal' && !e.done);
  if (tasks.length) c += `\nTasks:${tasks.map(x => x.title).join(',')}`;
  if (goals.length) c += `\nGoals:${goals.map(x => x.title).join(',')}`;
  if (S.finance.salary) {
    const sp = S.finance.expenses.reduce((s, e) => s + e.amount, 0);
    c += `\nSalary:₹${S.finance.salary}|Spent:₹${sp}|Left:₹${S.finance.salary - sp}`;
  }
  if (S.habits.length) { const dn = S.habitLog[td()] || []; c += `\nHabits:${dn.length}/${S.habits.length}`; }
  if (S.memoryFacts?.length) c += `\nMemory:${S.memoryFacts.map(f => f.fact).join('|')}`;
  if (S.customRules?.length) c += `\nRules:${S.customRules.join('|')}`;
  c += `\nHidden tabs:${S.hiddenTabs?.join(',') || 'none'}`;
  c += `\nTheme:${gT()}|Accent:${localStorage.getItem('ak_accent') || 'default'}`;
  // Capabilities for AI awareness
  const caps = getActiveCaps();
  const allCaps = ['image_gen','video_gen','music_gen','tts','stt','voice_clone','image_edit','upscale','translation'];
  c += `\n[CAPABILITIES]`;
  c += `\nAvailable: ${allCaps.filter(x => caps.has(x)).join(', ') || 'none (only chat)'}`;
  c += `\nNot available: ${allCaps.filter(x => !caps.has(x)).join(', ')}`;
  c += `\nActive keys: ${(S.apiKeys||[]).filter(k=>k.enabled).map(k=>k.name+'('+k.provider+')').join(', ') || 'none'}`;
  return c;
}

// ── MAIN AI FUNCTION ──
async function ai(messages, sys) {
  if (!S.apiKeys || S.apiKeys.length === 0) {
    migrateKeys();
    if (!S.apiKeys?.length) return '⚠️ Settings mein API key add karo.';
  }
  const opts = { system: sys, think: S.thinkMode };
  const chatPriority = ['claude', 'openai', 'gemini', 'groq', 'xai', 'openrouter', 'mistral', 'huggingface', 'together'];
  for (const pid of chatPriority) {
    const keyObj = (S.apiKeys || []).find(k => k.enabled && k.provider === pid);
    if (!keyObj) continue;
    try {
      let result;
      switch (pid) {
        case 'claude': result = await _callClaude(keyObj.key, messages, opts); break;
        case 'gemini': result = await _callGemini(keyObj.key, messages, opts); break;
        default:
          const ep = _getEndpoint(pid);
          const model = PROVIDER_MAP[pid]?.models?.fast || PROVIDER_MAP[pid]?.models?.chat || 'default';
          result = await _callOpenAICompat(keyObj.key, ep, model, messages, opts); break;
      }
      if (result.ok) return result.text;
      console.log(`Provider ${pid} failed:`, result.error);
    } catch (e) { console.log(`Provider ${pid} error:`, e); }
  }
  return '⚠️ Sab API keys fail ho gayi. Internet check karo ya Settings mein keys verify karo.';
}

function notify(msg) {
  if ('Notification' in window && Notification.permission === 'granted') new Notification('AAKASH AI', { body: msg, icon: 'icon-192.png' });
}
