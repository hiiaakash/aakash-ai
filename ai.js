// ════════════════════════════════════
//  AAKASH AI — AI Engine (ai.js)
//  Claude (Sonnet 4.6 / Opus 4.6) + Gemini 2.0 Flash
//  Auto-fallback chain
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
- Examples: change_theme dark, change_accent #2563eb, change_fontsize 16, hide_tab timer, add_rule "always reply in Hindi"

NOTES/STUDY TEACHER MODE:
When user uploads a document/image of notes or asks about uploaded content:
- Read and understand completely
- Explain in simple Hinglish like a patient teacher
- Break complex topics into small pieces
- Give real-world examples
- After explaining, ask "Koi doubt hai?"
- If user has doubts, solve patiently with examples
- Quiz the user to check understanding
- Always encourage and motivate

${(S.customRules || []).length ? 'USER CUSTOM RULES:\n' + S.customRules.map(r => '- ' + r).join('\n') : ''}

Rules: NEVER say "I'm Claude" or "I'm an AI assistant by Anthropic". You are AAKASH. Always actionable. Be natural like a friend — short when needed, detailed when asked.`;

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
  c += `\nTheme:${gT()}|Accent:${localStorage.getItem('ak_accent') || 'default'}|FontSize:${localStorage.getItem('ak_fontsize') || '15'}`;
  return c;
}

// ── MAIN AI FUNCTION (with fallback chain) ──
async function ai(messages, sys) {
  if (!S.apiKey && !S.geminiKey) return '⚠️ Settings mein API key set karo.';
  // Try Claude first
  if (S.apiKey) {
    const result = await callClaude(messages, sys);
    if (!result.startsWith('⚠️')) return result;
    // Claude failed — try Gemini if available
    if (S.geminiKey) {
      const gResult = await callGemini(messages, sys);
      if (!gResult.startsWith('⚠️')) return gResult;
    }
    return result;
  }
  // No Claude key — try Gemini directly
  if (S.geminiKey) return await callGemini(messages, sys);
  return '⚠️ Koi API key set nahi hai.';
}

// ── CLAUDE API ──
async function callClaude(messages, sys) {
  try {
    // Deep Think ON = Opus 4.6 (most powerful), Normal = Sonnet 4.6 (fast+smart)
    const model = S.thinkMode ? 'claude-opus-4-6' : 'claude-sonnet-4-6';
    const body = { model, max_tokens: 4096, system: [{ type: 'text', text: sys, cache_control: { type: 'ephemeral' } }], messages, tools: TOOLS };
    if (S.thinkMode) body.thinking = { type: 'enabled', budget_tokens: 10000 };
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': S.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify(body)
    });
    const d = await r.json();
    if (d.error) {
      if (d.error.message?.includes('model') || d.error.message?.includes('not_found')) return await callClaudeFallback(messages, sys);
      return '⚠️ ' + d.error.message;
    }
    let tp = [], tr = [];
    for (const b of (d.content || [])) {
      if (b.type === 'text') tp.push(b.text);
      if (b.type === 'tool_use') { const res = executeTool(b.name, b.input); tr.push({ tool_use_id: b.id, result: res }); tp.push(`\n🔧 ${res}`); }
    }
    if (tr.length && d.stop_reason === 'tool_use') {
      const fu = [...messages, { role: 'assistant', content: d.content }, { role: 'user', content: tr.map(t => ({ type: 'tool_result', tool_use_id: t.tool_use_id, content: t.result })) }];
      const r2 = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': S.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model, max_tokens: 4096, system: [{ type: 'text', text: sys }], messages: fu })
      });
      const d2 = await r2.json();
      if (!d2.error) { const ft = (d2.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n'); if (ft) tp.push(ft); }
      setTimeout(() => render(), 500);
    }
    return tp.join('\n') || 'No response.';
  } catch (e) { return '⚠️ Network error. Internet check karo.'; }
}

// ── CLAUDE FALLBACK ──
async function callClaudeFallback(messages, sys) {
  try {
    const body = { model: 'claude-sonnet-4-5', max_tokens: 4096, system: [{ type: 'text', text: sys, cache_control: { type: 'ephemeral' } }], messages, tools: TOOLS };
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': S.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify(body)
    });
    const d = await r.json();
    if (d.error) return '⚠️ ' + d.error.message;
    let tp = [], tr = [];
    for (const b of (d.content || [])) {
      if (b.type === 'text') tp.push(b.text);
      if (b.type === 'tool_use') { const res = executeTool(b.name, b.input); tr.push({ tool_use_id: b.id, result: res }); tp.push(`\n🔧 ${res}`); }
    }
    if (tr.length && d.stop_reason === 'tool_use') {
      const fu = [...messages, { role: 'assistant', content: d.content }, { role: 'user', content: tr.map(t => ({ type: 'tool_result', tool_use_id: t.tool_use_id, content: t.result })) }];
      const r2 = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': S.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 4096, system: [{ type: 'text', text: sys }], messages: fu })
      });
      const d2 = await r2.json();
      if (!d2.error) { const ft = (d2.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n'); if (ft) tp.push(ft); }
      setTimeout(() => render(), 500);
    }
    return tp.join('\n') || 'No response.';
  } catch (e) { return '⚠️ Network error.'; }
}

// ── GEMINI API (Fallback) ──
async function callGemini(messages, sys) {
  try {
    const contents = messages.map(m => {
      if (Array.isArray(m.content)) {
        const parts = m.content.map(c => {
          if (c.type === 'text') return { text: c.text };
          if (c.type === 'image') return { inline_data: { mime_type: c.source.media_type, data: c.source.data } };
          if (c.type === 'document') return { inline_data: { mime_type: c.source.media_type, data: c.source.data } };
          return { text: JSON.stringify(c) };
        });
        return { role: m.role === 'assistant' ? 'model' : 'user', parts };
      }
      return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] };
    });
    // Merge consecutive same-role messages
    const merged = [];
    for (const c of contents) {
      if (merged.length && merged[merged.length - 1].role === c.role) {
        merged[merged.length - 1].parts.push(...c.parts);
      } else { merged.push(c); }
    }
    if (merged.length && merged[0].role === 'model') merged.shift();

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${S.geminiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system_instruction: { parts: [{ text: sys }] }, contents: merged, generationConfig: { maxOutputTokens: 4096, temperature: 0.7 } })
    });
    const d = await r.json();
    if (d.error) return '⚠️ ' + d.error.message;
    if (d.candidates && d.candidates[0]?.content?.parts) {
      return d.candidates[0].content.parts.map(p => p.text || '').join('\n') || 'No response.';
    }
    return '⚠️ Kuch problem hui. Dobara try karo.';
  } catch (e) { return '⚠️ Network error. Internet check karo.'; }
}

// ── NOTIFICATION ──
function notify(msg) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('AAKASH AI', { body: msg, icon: 'icon-192.png' });
  }
}
