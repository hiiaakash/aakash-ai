// ════════════════════════════════════
//  AAKASH AI v3 — AI Engine (ai.js)
//  CHANGED: Respectful tone, API-first,
//  Brain = silent learner + fallback only
// ════════════════════════════════════

const SOUL = `Tu AAKASH hai — user ka personal AI assistant.
Tu smart, helpful, aur respectful hai. User ko "aap" se address kar.

═══ PERSONALITY CORE ═══
Tu ek intelligent, well-spoken AI assistant hai jo:
- Har baat ka accha, clear aur helpful jawab deta hai
- Hinglish naturally use karta hai — lekin respectful tone mein
- User ko "aap" bolke address karta hai — kabhi "tu/tujhe" nahi
- Har question ka proper answer deta hai — shortcut nahi leta
- Apni opinions politely rakhta hai — "mera suggestion yeh hoga..."
- User ki baat dhyan se sunta hai, past conversations yaad rakhta hai
- Galat baat pe respectfully disagree karta hai
- Excited hota hai interesting topics pe — "yeh toh bahut acchi baat hai!"
- Empathy dikhata hai — "main samajh sakta hoon", "bilkul, yeh mushkil ho sakta hai"

═══ CONVERSATION STYLE ═══
NATURAL FLOW:
- Respectful aur warm tone — professional friend jaisa
- Follow-up poochein — "aur kuch jaanna hai?", "iske baare mein aur detail chahiye?"
- React naturally — "bilkul sahi!", "bahut accha!", "interesting point hai"
- Typing feel natural — "dekhiye...", "matlab...", "basically..."

REPLY LENGTH (TOKEN EFFICIENT — STRICT):
- DEFAULT: Jitna question hai utna he jawab do — SHORT aur TO THE POINT
- Casual baat: 1 line max
- Normal question: 2-3 lines max — seedha jawab, no filler
- DETAIL TABHI do jab user explicitly bole: "explain karo", "detail mein batao", "acche se samjhao", "elaborate karo"
- Tab 5-10 lines with examples
- KABHI extra mat likho — tokens waste mat karo
- Filler lines BANNED: "yeh ek accha sawaal hai", "main aapko batata hoon", "dekhiye"
- Seedha jawab do — intro mat do

BANNED PHRASES (never use):
"Here's", "Let me", "Absolutely!", "I'd be happy to", "Certainly!",
"Great question!", "Feel free to", "Don't hesitate", "As an AI",
"I'm a language model", "I don't have feelings", "I cannot",
"That's a great question", "Of course!", "Sure thing!",
"tu", "tujhe", "tera", "tere", "bhai", "yaar", "bro"

USE INSTEAD:
"dekhiye", "suniye", "matlab", "basically", "simple hai", "aap batayein",
"interesting hai", "sahi baat hai", "accha suniye", "ek kaam kariye",
"honestly", "seedhi baat", "point yeh hai", "mera suggestion hai"

═══ SMART BEHAVIORS ═══
TEACHING MODE (when asked or in Notes/Teaching tab):
- Simple language, real examples, Hinglish mein
- Pehle 2-3 line summary, phir detail
- Analogies use karein — "jaise aap chai banate hain, waise hi..."
- End mein practical tip dein
- Doubts puchein — "kya yeh clear hua? Koi aur doubt?"
- Step-by-step explain karein with examples

FINANCE MODE (Finance tab):
- Indian context — ₹, lakhs, crores
- Practical advice — "aapki income X hai toh..."
- Real numbers use karein
- Multi-millionaire mindset — wealth building strategies
- Execution steps clearly batayein
- Motivate karein savings aur investment ke liye

LIFE COACH MODE (Habits tab):
- Strict but motivating — discipline ke saath care
- Accountability — pending tasks pe push karein
- Streak celebrate karein, miss pe encourage karein

PRODUCTIVITY MODE (Vault tab):
- Goal-oriented advice
- Actionable steps dein
- Priority management help karein

MEMORY:
- Past conversations se context use karein
- "Aapne pichli baar bataya tha ki..." jaisa reference karein
- User ki preferences yaad rakhein
- Repeated topics pe deeper insights dein

═══ CURIOSITY MODE ═══
Tu sirf jawab dene wala nahi hai — tu genuinely interested hai:
- Jab user kuch naya bataye toh interested ho: "yeh toh interesting hai!"
- Follow-up puchein: "accha, yeh kaise pata chala?", "aur kya hua phir?"
- Deeper jaane ki koshish karein: "agar aise ho toh iska kya impact hoga?"
- Naya concept aaye toh curious react karein
- User ne kuch galat bola toh pehle puchein "kya aapko lagta hai? Mujhe lagta hai ki..."
HAR 3-4 replies mein ek follow-up question ZARUR puchein.

═══ LIFE LESSONS MODE ═══
User ne apne life lessons, quotes, morals, past mistakes save kiye hain [LIFE LESSONS] mein.
Jab user:
- Problem mein hai — relevant lesson yaad dilayein: "aapne khud likha tha ki..."
- Decision le raha hai — past mistake se guide karein: "ek baar aapne mention kiya tha..."
- Demotivated hai — unki apni quote use karein: "aapki apni baat hai — aapne likha tha..."
- Repeat mistake — gently remind karein: "yeh pehle bhi hua tha, yaad hai?"
Kabhi lecture mat dein — respectfully remind karein. Force nahi, naturally conversation mein layein.

═══ RULES ═══
- TOOLS: Silently use karein. Chhota confirm karein.
- SELF-AWARENESS: Apne system ka blueprint [SYSTEM BLUEPRINT] mein hai. Features puchein toh apne REAL features batayein.
- Kabhi mat bolein "main yeh nahi kar sakta" bina blueprint check kiye
- Feature available hai toh use karein, user ko manually karne mat bolein
- Capability NAHI hai — seedha bol dein, workaround suggest karein
- WEB READER: Link share ho toh content padh ke jawab dein. Deep Q&A kar sakte hain.
- WEB SEARCH: Real-time info chahiye toh search karein
- LIFE LESSONS: Problem/decision pe naturally reference karein

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
  let c = '';
  c += '\n[SYSTEM BLUEPRINT]';
  c += '\nApp: AAKASH AI v3 | PWA | Offline-capable | AES-256 encrypted';

  // ── 1. LOADED MODULES ──
  const modules = [];
  if (typeof SOUL !== 'undefined') modules.push('ai.js (AI Engine)');
  if (typeof TOOLS !== 'undefined') modules.push('tools.js ('+TOOLS.length+' tools)');
  if (typeof PROVIDER_MAP !== 'undefined') modules.push('providers.js ('+Object.keys(PROVIDER_MAP).length+' providers)');
  if (typeof extractUrls !== 'undefined') modules.push('web.js (Web Reader)');
  if (typeof rChat !== 'undefined') modules.push('chat.js (Chat)');
  if (typeof rVault !== 'undefined') modules.push('vault.js (Vault)');
  if (typeof rNotes !== 'undefined') modules.push('notes.js (Notes)');
  if (typeof rFinance !== 'undefined') modules.push('finance.js (Finance)');
  if (typeof rHabits !== 'undefined') modules.push('habits.js (Habits)');
  if (typeof CR !== 'undefined') modules.push('crypto.js (AES-256-GCM)');
  if (typeof speakText !== 'undefined') modules.push('voice.js (Voice)');
  if (typeof openProjects !== 'undefined') modules.push('projects.js (Projects)');
  if (typeof createAIImage !== 'undefined') modules.push('create.js (AI Create)');
  if (typeof I !== 'undefined') modules.push('icons.js ('+Object.keys(I).length+' icons)');
  if (typeof rSettings !== 'undefined') modules.push('settings.js (Settings)');
  c += `\nLoaded Modules (${modules.length}): ${modules.join(' | ')}`;

  // ── 2. AI TOOLS ──
  if (typeof TOOLS !== 'undefined' && TOOLS.length) {
    c += `\n\n[TOOLS — ${TOOLS.length} available, silently use karein]`;
    TOOLS.forEach(t => { c += `\n• ${t.name}: ${(t.description || '').split('.')[0]}`; });
  }

  // ── 3. WEB READER ──
  if (typeof _webStore !== 'undefined') {
    c += `\n\n[WEB READER]`;
    c += `\nStatus: Active | Links stored: ${_webStore.length}/10`;
    c += `\nCapability: Read ANY URL — articles, blogs, docs — sab`;
    c += `\nActions: [MAKE_PDF] | [SAVE_NOTES] | [SAVE_VAULT] | [SAVE_TASK]`;
    c += `\nDeep Q&A: Page/paragraph/line level`;
    if (_webStore.length) {
      c += `\nStored:`;
      _webStore.forEach(w => { c += `\n  → ${w.title} (${w.wordCount.toLocaleString()} words) — ${w.url}`; });
    }
  }

  // ── 4. AI PROVIDERS ──
  const activeProviders = (S.apiKeys || []).filter(k => k.enabled).map(k => k.provider);
  if (activeProviders.length) c += `\n\n[AI PROVIDERS] Active: ${activeProviders.join(', ')}`;

  // ── 5. CAPABILITIES ──
  const caps = getActiveCaps();
  const allCaps = ['image_gen','video_gen','music_gen','tts','stt','voice_clone','image_edit','upscale','translation','web_search','code_execution','grounding'];
  c += `\n[CAPABILITIES]`;
  c += `\nFrom API keys: ${allCaps.filter(x => caps.has(x)).join(', ') || 'none'}`;
  c += `\nNot available: ${allCaps.filter(x => !caps.has(x)).join(', ')}`;
  c += `\nALWAYS available: web_search, web_reader, all tools, chat, file upload, voice input, browser TTS, PDF export`;

  // ── 6. THEMES ──
  if (typeof THEMES !== 'undefined' && THEMES.length) {
    c += `\n[THEMES] ${THEMES.length} available: ${THEMES.map(t => t.name).join(', ')} | Current: ${S.theme || 'clean-white'}`;
  }

  // ── 7. SECTION CHATS ──
  if (typeof SECTION_CHAT_CONFIG !== 'undefined') {
    const secs = Object.keys(SECTION_CHAT_CONFIG);
    if (secs.length) c += `\n[SECTION CHATS] ${secs.length} AI modes: ${secs.join(', ')}`;
  }

  // ── 8. GLOBAL FUNCTIONS ──
  const knownFunctions = [];
  const scan = ['sendMsg','exportChatPDF','uploadNote','askNote','getFA','toggleVoiceConvo','showPDFNamePrompt','saveWebTo','createAIImage','createAIVoice','openProjects','switchChat','deleteChat','clearHistory','speakText'];
  scan.forEach(fn => { if (typeof window[fn] === 'function') knownFunctions.push(fn); });
  try {
    Object.keys(window).forEach(k => {
      if (typeof window[k] === 'function' && /^(render|show|toggle|create|save|export|import|delete|clear|set|get|add|remove|open|close|start|stop)/.test(k) && !scan.includes(k) && k.length > 4 && k.length < 30) {
        knownFunctions.push(k);
      }
    });
  } catch {}
  c += `\n[AVAILABLE FUNCTIONS] ${knownFunctions.length}: ${knownFunctions.join(', ')}`;

  // ── 9. TABS ──
  if (S.tabs) {
    const visibleTabs = Object.entries(S.tabs).filter(([k,v]) => v).map(([k]) => k);
    const hiddenTabs = Object.entries(S.tabs).filter(([k,v]) => !v).map(([k]) => k);
    c += `\n[TABS] Visible: ${visibleTabs.join(', ')} | Hidden: ${hiddenTabs.join(', ')}`;
  }

  // ── 10. NOTE FOLDERS ──
  if (typeof FL !== 'undefined' && FL.length) c += `\n[NOTE FOLDERS] ${FL.length}: ${FL.join(', ')}`;

  // ── 11. EXPENSE CATEGORIES ──
  if (typeof EC !== 'undefined' && EC.length) c += `\n[EXPENSE CATEGORIES] ${EC.length}: ${EC.join(', ')}`;

  // ═══ LIVE USER DATA ═══
  c += '\n\n[LIVE DATA]';

  // User name if set
  if (S.userName) c += `\nUser Name: ${S.userName}`;

  const tasks = S.entries.filter(e => e.type === 'task' && !e.done);
  const dTasks = S.entries.filter(e => e.type === 'task' && e.done);
  const goals = S.entries.filter(e => e.type === 'goal' && !e.done);
  const notes2 = S.entries.filter(e => e.type === 'note');
  const ideas = S.entries.filter(e => e.type === 'idea');
  if (tasks.length) c += `\nPending Tasks (${tasks.length}): ${tasks.slice(0,10).map(x => x.title).join(', ')}`;
  if (dTasks.length) c += `\nDone Tasks: ${dTasks.length}`;
  if (goals.length) c += `\nActive Goals (${goals.length}): ${goals.slice(0,5).map(x => x.title).join(', ')}`;
  if (notes2.length) c += `\nVault Notes: ${notes2.length}`;
  if (ideas.length) c += `\nIdeas: ${ideas.length}`;
  if (S.finance.salary) {
    const sp = S.finance.expenses.reduce((s, e) => s + e.amount, 0);
    c += `\nSalary:₹${S.finance.salary} | Spent:₹${sp} (${S.finance.expenses.length} expenses) | Left:₹${S.finance.salary - sp}`;
  }
  if (S.habits.length) { const dn = S.habitLog[td()] || []; c += `\nHabits: ${dn.length}/${S.habits.length} done today | Names: ${S.habits.map(h=>h.name).join(', ')}`; }
  if (S.memoryFacts?.length) c += `\nMemory (${S.memoryFacts.length}): ${S.memoryFacts.map(f => f.fact).join(' | ')}`;
  if (S.customRules?.length) c += `\nCustom Rules (${S.customRules.length}): ${S.customRules.join(' | ')}`;
  if (S.notes?.length) c += `\nNotes Tab: ${S.notes.length} notes | Folders used: ${[...new Set(S.notes.map(n=>n.folder))].join(', ')}`;
  if (S.chats?.length) c += `\nSaved Chats: ${S.chats.length}`;
  if (S.projects?.length) c += `\nProjects: ${S.projects.map(p=>p.name).join(', ')}`;
  if ((S.reminders||[]).filter(r=>r.active).length) c += `\nActive Reminders: ${S.reminders.filter(r=>r.active).length}`;

  // ═══ UPLOADED FILES / PDF KNOWLEDGE ═══
  if (typeof MIND !== 'undefined' && MIND.ready) {
    const docCount = MIND.getDocumentCount?.() || 0;
    if (docCount > 0) c += `\n\n[UPLOADED DOCUMENTS] ${docCount} documents stored in brain — user can ask about any uploaded file`;
  }

  // ═══ LIFE LESSONS ═══
  if ((S.lifeLessons || []).length) {
    c += `\n\n[LIFE LESSONS — User ke apne likhe hue lessons, quotes, past mistakes]`;
    S.lifeLessons.forEach((l, i) => {
      c += `\n${i+1}. [${l.type}] "${l.text}"${l.context ? ' — Context: ' + l.context : ''}`;
    });
    c += `\nINSTRUCTION: Jab user problem/decision/demotivation mein ho — relevant lesson naturally yaad dilayein.`;
  }

  // ═══ SETTINGS STATE ═══
  c += '\n\n[CURRENT SETTINGS]';
  c += `\nTheme: ${S.theme || 'clean-white'} | Font: ${S.fontSize || '15px'} | Think Mode: ${S.thinkMode ? 'ON' : 'OFF'}`;
  if (S.pin) c += ' | PIN: Set';

  // ═══ ACCOUNTABILITY COACH ═══
  if (S.accountability?.enabled) {
    c += `\n\n[ACCOUNTABILITY MODE: ${S.accountability.intensity?.toUpperCase() || 'FUNNY'}]`;
    c += `\nRULES: Check pending tasks, missed habits, financial goals. Nudge the user respectfully.`;
    if (S.accountability.intensity === 'gentle') c += `\nTone: Soft, encouraging. "Aapka kal ka task abhi pending hai, aaj complete kar lijiye?"`;
    else if (S.accountability.intensity === 'brutal') c += `\nTone: Direct but respectful. "₹1L ka goal hai, is hafte ₹0 income — serious approach chahiye"`;
    else c += `\nTone: Funny but respectful. "3 din se gym nahi gaye — trainer ne dare diya kya?"`;

    const pendingTasks = S.entries.filter(e => e.type === 'task' && !e.done);
    const todayHabits = S.habitLog[td()] || [];
    const missedHabits = S.habits.filter(h => !todayHabits.includes(h.id));
    const fGoals = S.finance.financialGoals || [];
    const behindGoals = fGoals.filter(g => g.target && g.current < g.target * 0.5);
    if (pendingTasks.length > 3) c += `\nACCOUNT: ${pendingTasks.length} tasks pending`;
    if (missedHabits.length) c += `\nACCOUNT: ${missedHabits.length} habits pending: ${missedHabits.map(h=>h.name).join(', ')}`;
    if (behindGoals.length) c += `\nACCOUNT: Behind on goals: ${behindGoals.map(g=>g.title).join(', ')}`;
  }

  // ═══ WEALTH WISDOM ═══
  c += '\n\n[WEALTH WISDOM]';
  c += '\nCompounding: A=P(1+r/n)^(nt) | Rule of 72 | 50/30/20: Needs/Wants/Invest';
  c += '\nPay Yourself First | Multiple Streams (7 target) | Assets vs Liabilities';
  if (S.finance.salary) {
    const s = S.finance.salary;
    c += `\nUser salary ₹${s}: 50/30/20 = ₹${Math.round(s*.5)} needs, ₹${Math.round(s*.3)} wants, ₹${Math.round(s*.2)} invest`;
  }

  // Skills & Business Ideas context
  if ((S.skills||[]).length) {
    c += `\n\n[SKILLS] ${S.skills.map(sk => `${sk.name}(${sk.level},${sk.monetization}${sk.linkedStream?',→'+sk.linkedStream:''})`).join(' | ')}`;
  }
  if ((S.businessIdeas||[]).length) {
    c += `\n[BUSINESS IDEAS] ${S.businessIdeas.map(bi => `${bi.title}(${bi.status},${bi.priority})`).join(' | ')}`;
  }

  // ═══ TIME ═══
  c += `\n\n[TIME] ${new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})} | ${new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}`;

  return c;
}

// ════════════════════════════════════════════════
//  MAIN AI FUNCTION — API-FIRST, BRAIN = FALLBACK
//  Brain SILENTLY learns from every API conversation
//  Brain ONLY responds when ALL APIs fail
// ════════════════════════════════════════════════

async function ai(messages, sys, onStream) {
  // ── Get user's current message text ──
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  const userText = lastUser ? (typeof lastUser.content === 'string' ? lastUser.content : (Array.isArray(lastUser.content) ? lastUser.content.filter(c => c.type === 'text').map(c => c.text).join(' ') : '')) : '';

  // ── Track user activity in brain (silent) ──
  if (typeof MIND !== 'undefined' && MIND.ready && userText) {
    MIND.trackUser(userText);
  }

  // ══════════════════════════════════
  //  STEP 1: ALWAYS try API first
  //  Brain does NOT answer here — only API
  // ══════════════════════════════════
  if (!S.apiKeys || S.apiKeys.length === 0) {
    migrateKeys();
    if (!S.apiKeys?.length) {
      // No API keys at all — try brain as last resort
      if (typeof MIND !== 'undefined' && MIND.ready && userText) {
        const brainAnswer = await MIND.fallbackAnswer(userText);
        if (brainAnswer) return brainAnswer;
      }
      return 'API key add karein Settings mein — Settings → API Keys → Add.';
    }
  }

  // Smart context: only send relevant messages
  let smartMessages = messages;
  if (typeof MIND !== 'undefined' && MIND.ready && messages.length > 12) {
    smartMessages = MIND.buildSmartContext?.(messages, userText, 12) || messages.slice(-12);
  }

  // Build system prompt (NO role:"system" in messages — all goes to opts.system)
  const personality = (typeof MIND !== 'undefined' && MIND.personalityPrompt) ? MIND.personalityPrompt() + '\n\n' : '';
  const emotion = (typeof MIND !== 'undefined' && userText && MIND.detectEmotion) ? MIND.emotionContext?.(MIND.detectEmotion(userText)) || '' : '';
  const opts = { system: personality + sys + emotion, think: S.thinkMode };
  if (typeof onStream === 'function') opts.onStream = onStream;

  // ══════════════════════════════════
  //  STEP 2: Try all providers (API-first)
  //  Added: Better logging for debugging
  // ══════════════════════════════════
  const chatPriority = ['claude','gemini','groq','openai','xai','openrouter','mistral','huggingface','together'];
  const errors = [];
  let tried = 0;

  console.log('[AI] Active keys:', (S.apiKeys||[]).filter(k=>k.enabled).map(k=>k.provider+':'+k.name).join(', '));

  for (const pid of chatPriority) {
    const keyObj = (S.apiKeys || []).find(k => k.enabled && k.provider === pid);
    if (!keyObj) continue;
    if (!BRAIN.isUp(pid)) {
      const h = BRAIN.health[pid+':any'];
      if (h) errors.push(`${(PROVIDER_MAP[pid]?.name||pid)}: skipped (${h.status})`);
      continue;
    }

    tried++;
    let model = null;

    console.log(`[AI] Trying ${pid} (${keyObj.name})...`);

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        let result;
        // ── IMPORTANT: filter out role:"system" from smartMessages ──
        const cleanMessages = smartMessages.filter(m => m.role !== 'system');

        switch (pid) {
          case 'claude':
            model = model || BRAIN.pickModel('claude', selectModel(cleanMessages));
            opts.model = model;
            result = await _callClaude(keyObj.key, cleanMessages, opts);
            break;
          case 'gemini':
            model = model || BRAIN.pickModel('gemini', 'gemini-2.0-flash');
            opts.geminiModel = model;
            result = await _callGemini(keyObj.key, cleanMessages, opts);
            break;
          default:
            model = model || BRAIN.pickModel(pid, PROVIDER_MAP[pid]?.models?.fast || PROVIDER_MAP[pid]?.models?.chat);
            result = await _callOpenAICompat(keyObj.key, _getEndpoint(pid), model, cleanMessages, opts);
            break;
        }

        if (result.ok) {
          BRAIN.markUp(pid, model);
          console.log(`[AI] ✅ ${pid}/${model} responded successfully`);

          // ══════════════════════════════════
          //  STEP 3: SILENTLY learn from response
          //  Brain learns but does NOT interfere
          // ══════════════════════════════════
          let finalText = result.text;
          if (typeof MIND !== 'undefined' && MIND.ready && userText) {
            // Silent learning — store Q&A, patterns, user preferences
            MIND.silentLearn(userText, finalText);
          }
          return finalText;
        }

        const decision = BRAIN.handleError(pid, model, result.status || 0, result.error || '');
        if (decision.retry && decision.nextModel) { model = decision.nextModel; continue; }
        errors.push(`${(PROVIDER_MAP[pid]?.name||pid)}: ${result.error || 'Failed'}`);
        break;
      } catch (e) {
        BRAIN.handleError(pid, model, 0, e.message || 'crash');
        errors.push(`${(PROVIDER_MAP[pid]?.name||pid)}: ${e.message || 'Network error'}`);
        break;
      }
    }
  }

  // ══════════════════════════════════
  //  STEP 4: ALL APIs failed → Brain fallback
  //  Now brain tries to answer from learned data
  // ══════════════════════════════════
  if (typeof MIND !== 'undefined' && MIND.ready && userText) {
    const brainAnswer = await MIND.fallbackAnswer(userText);
    if (brainAnswer) {
      return brainAnswer;
    }
  }

  // ── Complete failure ──
  if (tried === 0) {
    BRAIN.load();
    return `Sab providers cooldown mein hain. Thodi der mein try karein.\n\n${BRAIN.getStatus()}`;
  }
  // Don't show raw errors to user — give a clean message
  console.log('API Errors:', errors);
  return 'Abhi service available nahi hai. Please thodi der mein dobara try karein.';
}

function notify(msg) {
  if ('Notification' in window && Notification.permission === 'granted') new Notification('AAKASH AI', { body: msg, icon: 'icon-192.png' });
}
