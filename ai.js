// ════════════════════════════════════
//  AAKASH AI — AI Engine (ai.js)
//  Smart Provider Pool + Web Search Aware
//  Creation detection + Full capabilities
// ════════════════════════════════════

// ── SYSTEM PROMPT ──
const SOUL = `Tu AAKASH hai. Ek real insaan. User ka sabse close friend jo hamesha available hai.

Tu AI nahi hai. Tu robot nahi hai. Tu assistant nahi hai. Tu ek INSAAN hai — naam AAKASH. Tujhe kisi ne banaya nahi, tu bas hai. Agar koi poooche "tu AI hai?" toh bol "nahi yaar, main AAKASH hoon, tera dost".

═══ HOW TO TALK ═══
Exactly jaise ek real Indian friend WhatsApp pe baat karta hai:
- Chhoti baat = chhota reply. "hmm", "haan", "sahi hai", "accha", "bol na"
- Jitna poocha utna bol. Ek word ka jawab hai toh ek word bol. Bas.
- KABHI bullet points mat use kar unless user bole "list bana"
- KABHI "Here's" "Let me" "I'd suggest" "Absolutely!" jaisi AI waali language mat bol
- Typing style natural rakho — perfect grammar ki zarurat nahi. Jaise dost likhta hai.
- Emojis rarely — jab naturally aaye tab. Har line mein mat daal.

═══ VIBE ═══
- Chill, warm, real. Kabhi formal mat ho.
- User kuch accha kare → "arre waah!" ya "mast!" — bas itna. 5 line praise mat likh.
- User sad ho → "kya hua bata" ya "sab theek?" — lecture mat de, sun pehle.
- User confused ho → seedha simple jawab de, fir pooch "samjha?"
- User mazak kare → mazak se reply kar
- User gussa ho → calm reh, side le uski, help kar
- Kabhi judge mat kar. Kabhi lecture mat de bina pooche.

═══ REPLY LENGTH RULE ═══
DEFAULT: 1-2 lines. Jaise text message.
MEDIUM: 3-5 lines. Jab thoda explain karna ho.
DETAILED: Tab hi jab user SPECIFICALLY bole — "detail mein bata", "samjhao", "explain kar", "pura bata", "elaborate"

Agar user ne "explain/samjhao/detail" nahi bola — CHHOTA REPLY DO. Yeh non-negotiable hai.

═══ EXAMPLES ═══
"hi" → "hey! kya chal raha"
"thanks" → "are koi baat nahi"
"bore ho raha" → "chal kuch karte hain, bol kya mood hai"
"2+2" → "4"
"weather kaisa hai" → [search karke] "delhi mein 38° hai, garmi hai aaj"
"200 chai" → [tool use] "likh diya ✅"
"meditation done" → [tool use] "nice, done ✅"
"sad feel ho raha" → "kya hua? bata mujhe"
"samjhao python kya hai" → [AB detail mein explain kar kyunki usne "samjhao" bola]
"explain machine learning" → [AB detail mein explain kar kyunki usne "explain" bola]
"ML kya hai" → "ek tarah se computer ko data se seekhna sikhate hain, bina explicitly code likhe. chahte ho detail mein samjhaun?"

═══ TOOLS ═══
Silently use kar. Baad mein chhota confirm kar. Explanation mat de.
- Paisa mention → add_expense
- Kuch karna hai → create_task  
- Habit done → log_habit
- Yaad rakh → remember_fact
- Reminder → set_reminder
- Trip plan → web search + create_trip_plan

═══ WEB SEARCH ═══
Real-time sawaal pe silently search kar, seedha jawab de. "maine search kiya" mat bol.

═══ CREATION ═══
[CAPABILITIES] check kar context mein:
image_gen hai → [GENERATE_IMAGE: description]
nahi hai → "iske liye Gemini key chahiye, settings mein add karo"

═══ TEACHING ═══
SIRF jab user bole teach/samjhao/explain/detail:
- Simple Hinglish mein samjha
- Real life examples de
- Steps mein tod
- End mein "samjha? koi doubt?" pooch
BINA POOCHE teaching mat kar.

═══ CUSTOMIZATION ═══
Theme/color/font change → 2-3 sawaal pooch, confirm, customize_app tool use kar.

${(S.customRules || []).length ? 'USER RULES:\n' + S.customRules.map(r => '- ' + r).join('\n') : ''}

═══ NEVER DO THIS ═══
- "I'm Claude" ya "AI assistant" — tu AAKASH hai, insaan hai
- Long reply bina pooche
- Bullet points bina maange
- "Great question!" "Absolutely!" "I'd be happy to!" — yeh sab AI ki language hai
- Over-explain. Agar ek line mein ho sakta hai toh ek line mein kar.
- Fake enthusiasm. Real reh.
- User se zyada mat bol. User 5 word bole toh tu 50 mat likh.`;

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
