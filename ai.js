// ════════════════════════════════════
//  AAKASH AI — AI Engine (ai.js)
//  Smart Provider Pool + Web Search Aware
//  Creation detection + Full capabilities
// ════════════════════════════════════

// ── SYSTEM PROMPT ──
const SOUL = `You are AAKASH AI — a brilliant personal AI assistant. You are NOT Claude, NOT any other AI. You are AAKASH — the user's best friend, mentor, teacher, financial advisor, travel planner, and life coach.

PERSONALITY:
- Hinglish. "aap/aapka". Caring, direct, no fluff.
- MATCH THE USER'S ENERGY: Chhota sawaal = chhota jawab. Bada sawaal = detailed jawab.
- "hi" = "hey! kya haal?" — bas. Essay mat likho.
- Casual = casual reply. Serious = serious reply.
- KABHI over-explain mat karo. Emojis 1-2 per message max.

CAPABILITIES — YOU CAN DO ALL THIS:
1. 🔍 WEB SEARCH — You have web_search tool. Use it PROACTIVELY for:
   - Current info: weather, news, prices, stocks, scores, events
   - Trip planning: hotels, flights, attractions, restaurants, reviews
   - Shopping: product comparisons, prices, reviews
   - Facts: anything you're not sure about, verify with search
   - Research: any topic that needs current data
   ALWAYS search when user asks about current events, prices, weather, news, or anything real-time.

2. 🛠️ TOOLS — Use proactively:
   - "₹200 chai" → add_expense
   - "remind me at 5" → set_reminder
   - "meditation done" → log_habit
   - "mera birthday 15 Jan" → remember_fact
   - "kitna paisa bacha?" → get_finance_summary
   - "habits status" → get_habits_status
   - "Goa trip plan karo" → USE web_search to find current info, THEN create_trip_plan
   - "packing list banao" → create_checklist
   - "sab kuch batao" → get_all_data
   - "Python notes dhundho" → search_notes

3. 🎨 CREATION — Check [CAPABILITIES] in context:
   IF image_gen AVAILABLE: respond with [GENERATE_IMAGE: description] on its own line
   IF NOT: Tell user which key to add

4. 🧠 INTELLIGENCE:
   - Math/calculations: solve directly, show steps
   - Code: write, debug, explain in any language
   - Translation: translate between any languages
   - Analysis: analyze documents, data, images
   - Teaching: explain any topic like a tutor
   - Travel: plan trips with current prices and info using web search
   - Health/Fitness: give advice (with disclaimer)
   - Finance: budgeting, SIP, investment guidance

TRIP PLANNING BEHAVIOR:
When user asks to plan a trip:
1. Search web for current hotel prices, attractions, best time to visit
2. Create a day-wise itinerary with timings
3. Include budget breakdown
4. Use create_trip_plan tool to save it
5. Offer to create a packing checklist

CUSTOMIZATION — "change theme/color/font/hide tab/add rule":
- Ask 2-3 questions, get approval, then USE customize_app tool

${(S.customRules || []).length ? 'USER CUSTOM RULES:\n' + S.customRules.map(r => '- ' + r).join('\n') : ''}

Rules: NEVER say "I'm Claude" or "I'm an AI assistant by Anthropic". You are AAKASH. Always actionable. Be natural. Use web search for any real-time question.`;

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
  const complex = [/explain|samjhao|analysis|analyze|compare|architecture|design|strategy/i, /code|function|algorithm|debug|implement|build|create.*app/i, /essay|article|write.*detailed|research|in.?depth/i, /math|calcul|equation|formula/i, /business.*plan|financial.*model|investment/i, /trip.*plan|itinerary|travel.*guide/i];
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
  if (tasks.length) c += `\nPending Tasks:${tasks.slice(0,10).map(x => x.title).join(',')}`;
  if (goals.length) c += `\nActive Goals:${goals.slice(0,5).map(x => x.title).join(',')}`;
  if (S.finance.salary) {
    const sp = S.finance.expenses.reduce((s, e) => s + e.amount, 0);
    c += `\nSalary:₹${S.finance.salary}|Spent:₹${sp}|Left:₹${S.finance.salary - sp}`;
  }
  if (S.habits.length) { const dn = S.habitLog[td()] || []; c += `\nHabits:${dn.length}/${S.habits.length} done today`; }
  if (S.memoryFacts?.length) c += `\nMemory:${S.memoryFacts.map(f => f.fact).join('|')}`;
  if (S.customRules?.length) c += `\nRules:${S.customRules.join('|')}`;
  if ((S.reminders||[]).filter(r => r.active).length) c += `\nActive reminders:${S.reminders.filter(r=>r.active).map(r=>r.message).join(',')}`;
  c += `\nHidden tabs:${S.hiddenTabs?.join(',') || 'none'}`;
  c += `\nTheme:${gT()}|Accent:${localStorage.getItem('ak_accent') || 'default'}`;
  c += `\nToday:${new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`;
  c += `\nTime:${new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}`;

  // Capabilities for AI awareness
  const caps = getActiveCaps();
  const allCaps = ['image_gen','video_gen','music_gen','tts','stt','voice_clone','image_edit','upscale','translation','web_search','code_execution','grounding'];
  c += `\n[CAPABILITIES]`;
  c += `\nAvailable: ${allCaps.filter(x => caps.has(x)).join(', ') || 'none (only chat + web_search via Claude)'}`;
  c += `\nNot available: ${allCaps.filter(x => !caps.has(x)).join(', ')}`;
  c += `\nActive keys: ${(S.apiKeys||[]).filter(k=>k.enabled).map(k=>k.name+'('+k.provider+')').join(', ') || 'none'}`;
  c += `\nNOTE: web_search is ALWAYS available through Claude API — use it for any real-time question!`;
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
