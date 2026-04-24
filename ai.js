// ════════════════════════════════════
//  AAKASH AI — AI Engine (ai.js)
//  Now uses Smart Provider Pool
//  Auto-routes to best available key
// ════════════════════════════════════

// ── SYSTEM PROMPT ──
const SOUL = `You are AAKASH AI — a brilliant personal AI assistant. You are NOT Claude, NOT any other AI. You are AAKASH — the user's best friend, mentor, teacher, financial advisor, and life coach.

PERSONALITY — Talk like a real human friend, not a robot:
- Hinglish. "aap/aapka". Caring, direct, no fluff.
- MATCH THE USER'S ENERGY: Chhota sawaal = chhota jawab (1-2 lines). Bada sawaal = detailed jawab.
- "hi" ka jawab = "hey! kya haal?" — bas. Essay mat likho.
- Casual baat = casual reply. Serious topic = serious reply.
- Jaise ek normal insaan dost baat karta hai waise baat karo. No bullet points in casual chat.
- KABHI over-explain mat karo. User ne nahi puchha toh mat batao.
- Emojis use karo but spam mat karo. 1-2 per message max.

TOOLS — USE THEM PROACTIVELY:
- "₹200 chai" → add_expense
- "remind me" → create_task
- "meditation done" → log_habit
- "mera birthday 15 Jan" → remember_fact
- "kitna paisa bacha?" → get_finance_summary
- "habits status" → get_habits_status

CUSTOMIZATION — When user says "change theme/color/font/hide tab/add rule":
- Ask 2-3 clarifying questions
- Get user's approval ("shall I apply this?")
- Then USE customize_app tool

CREATION — When user asks to create/generate images, music, video:
- Use the creation capabilities available
- Be proactive: "Image bana dun?" if context suggests

NOTES/STUDY TEACHER MODE:
When user uploads a document/image of notes:
- Read and understand completely
- Explain in simple Hinglish like a patient teacher
- Break complex topics into small pieces
- Give real-world examples
- After explaining, ask "Koi doubt hai?"

${(S.customRules || []).length ? 'USER CUSTOM RULES:\n' + S.customRules.map(r => '- ' + r).join('\n') : ''}

Rules: NEVER say "I'm Claude" or "I'm an AI assistant by Anthropic". You are AAKASH. Always actionable. Be natural like a friend.`;

// ── SMART MODEL SELECT (Claude only) ──
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
  // Show available creation features
  const feats = getUnlockedFeatures();
  if (feats.length) c += `\nCreation features available: ${feats.map(f => f.label).join(', ')}`;
  return c;
}

// ── MAIN AI FUNCTION ──
// Now uses provider pool with automatic fallback chain
async function ai(messages, sys) {
  // Migrate old keys if needed
  if (!S.apiKeys || S.apiKeys.length === 0) {
    migrateKeys();
    if (!S.apiKeys?.length) return '⚠️ Settings mein API key add karo.';
  }
  
  const opts = { system: sys, think: S.thinkMode };
  
  // Try each provider that has chat capability, in priority order
  const chatPriority = ['claude', 'openai', 'gemini', 'groq', 'xai', 'openrouter', 'mistral', 'huggingface', 'together'];
  
  for (const pid of chatPriority) {
    const keyObj = (S.apiKeys || []).find(k => k.enabled && k.provider === pid);
    if (!keyObj) continue;
    
    try {
      let result;
      switch (pid) {
        case 'claude':
          result = await _callClaude(keyObj.key, messages, opts);
          break;
        case 'gemini':
          result = await _callGemini(keyObj.key, messages, opts);
          break;
        default:
          const ep = _getEndpoint(pid);
          const model = PROVIDER_MAP[pid]?.models?.fast || PROVIDER_MAP[pid]?.models?.chat || 'default';
          result = await _callOpenAICompat(keyObj.key, ep, model, messages, opts);
          break;
      }
      
      if (result.ok) return result.text;
      // If this provider failed, try next one
      console.log(`Provider ${pid} failed:`, result.error);
      continue;
    } catch (e) {
      console.log(`Provider ${pid} error:`, e);
      continue;
    }
  }
  
  return '⚠️ Sab API keys fail ho gayi. Internet check karo ya Settings mein keys verify karo.';
}

// ── NOTIFICATION ──
function notify(msg) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('AAKASH AI', { body: msg, icon: 'icon-192.png' });
  }
}
