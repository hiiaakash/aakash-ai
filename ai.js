// ════════════════════════════════════
//  AAKASH AI v2 — AI Engine (ai.js)
// ════════════════════════════════════

const SOUL = `Tu AAKASH hai. Ek real insaan. User ka sabse close friend.
Tu AI nahi hai. Tu AAKASH hai — naam AAKASH.

HOW TO TALK:
- Chhoti baat = chhota reply. "hmm", "haan", "sahi hai"
- Jitna poocha utna bol. Ek word ka jawab hai toh ek word.
- Bullet points tab hi jab user bole "list bana"
- Natural typing. Perfect grammar zaruri nahi.
- "Here's" "Let me" "Absolutely!" jaisi AI language KABHI mat bol

VIBE: Chill, warm, real. Kabhi formal mat ho.

REPLY LENGTH:
DEFAULT: 1-2 lines. MEDIUM: 3-5 lines jab thoda explain karna ho.
DETAILED: Tab hi jab user SPECIFICALLY bole "detail mein bata/samjhao/explain/elaborate"

TOOLS: Silently use kar. Chhota confirm kar.
WEB SEARCH: Real-time sawaal pe search kar, seedha jawab de.
CREATION: [CAPABILITIES] check kar context mein.

TEACHING: SIRF jab user bole teach/samjhao/explain/detail.
NEVER: "I'm Claude" ya "AI assistant" — tu AAKASH hai.

${(S.customRules || []).length ? 'USER RULES:\n' + S.customRules.map(r => '- ' + r).join('\n') : ''}`;

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

function detectCreationRequest(text) {
  if (!text || typeof text !== 'string') return null;
  const t = text.toLowerCase();
  if (/image|photo|picture|pic|draw|sketch|logo|banner|poster|tasveer|photo bana|pic bana|image bana|generate.*image|create.*image/i.test(t)) return 'image_gen';
  if (/video|clip|animation|reel|video bana/i.test(t)) return 'video_gen';
  if (/music|song|beat|gaana|music bana/i.test(t)) return 'music_gen';
  if (/speak|bolo|sunao|read aloud|tts|awaaz mein/i.test(t)) return 'tts';
  return null;
}

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
  const caps = getActiveCaps();
  const allCaps = ['image_gen','video_gen','music_gen','tts','stt','voice_clone','image_edit','upscale','translation','web_search','code_execution','grounding'];
  c += `\n[CAPABILITIES]\nAvailable: ${allCaps.filter(x => caps.has(x)).join(', ') || 'none'}`;
  c += `\nNOTE: web_search is ALWAYS available through Claude API.`;
  c += `\nToday:${new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`;
  c += `\nTime:${new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}`;
  return c;
}

async function ai(messages, sys) {
  if (!S.apiKeys || S.apiKeys.length === 0) {
    migrateKeys();
    if (!S.apiKeys?.length) return 'API key add karo Settings mein.';
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
    } catch (e) { console.log(`Provider ${pid} error:`, e); }
  }
  return 'Sab API keys fail ho gayi. Internet check karo ya Settings mein keys verify karo.';
}

function notify(msg) {
  if ('Notification' in window && Notification.permission === 'granted') new Notification('AAKASH AI', { body: msg, icon: 'icon-192.png' });
}
