// ════════════════════════════════════════════════════════════
//  AAKASH AI — MIND (brain.js)
//  Self-Learning Intelligence System
//  ─────────────────────────────────
//  1. Learning Memory      — Store Q&A, find similar, auto-answer
//  2. Offline Intelligence  — Handle simple tasks without API
//  3. Smart Context         — Send only relevant context to API
//  4. User Modeling         — Track user patterns & preferences
//  5. Personality Engine    — Consistent AAKASH voice across providers
//  6. Knowledge Graph       — Connect concepts together
//  7. Self Improvement      — Learn from feedback (thumbs up/down)
//  8. Decision Engine       — Route: brain / local / API
//  9. Conversation Import   — Bulk learn from exported chats
// ════════════════════════════════════════════════════════════

const MIND = {
  ready: false,
  db: null,
  stats: { answered: 0, learned: 0, apiSaved: 0 },

  // ═══════════════════════════════════
  //  DATABASE — IndexedDB for big storage
  //  localStorage = 5MB limit
  //  IndexedDB = 100MB+ limit
  // ═══════════════════════════════════

  async init() {
    try {
      this.db = await new Promise((resolve, reject) => {
        const req = indexedDB.open('AakashMind', 3);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          // Q&A memory store
          if (!db.objectStoreNames.contains('memory')) {
            const ms = db.createObjectStore('memory', { keyPath: 'id', autoIncrement: true });
            ms.createIndex('keywords', 'keywords', { multiEntry: true });
            ms.createIndex('category', 'category');
            ms.createIndex('timestamp', 'timestamp');
          }
          // Knowledge graph store
          if (!db.objectStoreNames.contains('knowledge')) {
            const ks = db.createObjectStore('knowledge', { keyPath: 'concept' });
            ks.createIndex('connections', 'connections', { multiEntry: true });
          }
          // User profile store
          if (!db.objectStoreNames.contains('profile')) {
            db.createObjectStore('profile', { keyPath: 'key' });
          }
          // Feedback store
          if (!db.objectStoreNames.contains('feedback')) {
            const fs = db.createObjectStore('feedback', { keyPath: 'id', autoIncrement: true });
            fs.createIndex('rating', 'rating');
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      this.ready = true;
      await this._loadStats();
      console.log('[MIND] Brain initialized — ready to learn');

      // ── Pull cloud data on init (new device support) ──
      setTimeout(async () => {
        if (typeof FIRE !== 'undefined') {
          await FIRE.init();
          if (FIRE.ready) {
            const result = await FIRE.fullSync();
            if (result.ok) console.log(`[MIND] Cloud sync done — ${result.newFromCloud} new memories from cloud`);
          }
        }
      }, 2000);
    } catch (e) {
      console.log('[MIND] IndexedDB failed, using fallback:', e);
      this.ready = false;
    }
  },

  // ── DB helpers ──
  _tx(store, mode) {
    if (!this.db) return null;
    return this.db.transaction(store, mode).objectStore(store);
  },

  _put(store, data) {
    return new Promise((resolve, reject) => {
      const s = this._tx(store, 'readwrite');
      if (!s) { resolve(null); return; }
      const r = s.put(data);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  },

  _get(store, key) {
    return new Promise((resolve, reject) => {
      const s = this._tx(store, 'readonly');
      if (!s) { resolve(null); return; }
      const r = s.get(key);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  },

  _getAll(store) {
    return new Promise((resolve, reject) => {
      const s = this._tx(store, 'readonly');
      if (!s) { resolve([]); return; }
      const r = s.getAll();
      r.onsuccess = () => resolve(r.result || []);
      r.onerror = () => reject(r.error);
    });
  },

  _count(store) {
    return new Promise((resolve) => {
      const s = this._tx(store, 'readonly');
      if (!s) { resolve(0); return; }
      const r = s.count();
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => resolve(0);
    });
  },

  // ═══════════════════════════════════
  //  1. LEARNING MEMORY
  //  Store every Q&A pair
  //  Find similar past questions
  //  Answer from memory when possible
  // ═══════════════════════════════════

  // ── Extract keywords from text ──
  extractKeywords(text) {
    if (!text) return [];
    const stop = new Set(['kya','hai','hain','mein','ye','yeh','wo','woh','ko','ka','ki','ke','se','ne','pe','par','bhi','aur','ya','toh','na','mat','nhi','nahi','haan','ji','ok','the','a','an','is','are','was','were','be','been','am','do','does','did','will','would','can','could','should','shall','may','might','have','has','had','in','on','at','to','for','of','with','by','from','up','about','into','out','and','or','but','not','no','if','then','so','as','it','its','this','that','what','how','why','when','where','who','which','there','here','all','my','your','his','her','our','their','me','you','him','us','them','i','we','he','she','they','mera','tera','apna','apni','apne','karo','karna','kar','krna','kr','krr','kro','bata','batao','bol','bolo','de','do','le','lo','ho','hota','hoti','hote','rha','rhi','rhe','tha','thi','the','wala','wali','wale','kuch','sab','bahut','bohot','boht','bht','zyada','kam','thoda','abhi','pehle','baad','upar','neeche','andar','bahar','bina','sirf','bas','just','like','very','also','too','only','main','mujhe','humko','isko','usko','kaise','kitna','kidhar','kaun','konsa','please','pls','hey','hi','hello','bhai','yaar','yrr','bro','dude']);
    return text.toLowerCase()
      .replace(/[^\w\s\u0900-\u097F]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stop.has(w))
      .filter((w, i, a) => a.indexOf(w) === i)
      .slice(0, 15);
  },

  // ── Calculate similarity between two keyword arrays ──
  similarity(kw1, kw2) {
    if (!kw1.length || !kw2.length) return 0;
    const set1 = new Set(kw1);
    const set2 = new Set(kw2);
    let match = 0;
    set1.forEach(w => { if (set2.has(w)) match++; });
    // Jaccard similarity
    const union = new Set([...kw1, ...kw2]).size;
    return union > 0 ? match / union : 0;
  },

  // ── Store a Q&A pair (LEARNING) ──
  async learn(question, answer, category) {
    if (!this.ready || !question || !answer) return;
    if (answer.startsWith('API Error') || answer.includes('fail ho gayi') || answer.includes('API Error')) return;
    const keywords = this.extractKeywords(question);
    if (keywords.length < 1) return;

    // Skip if very similar question already exists with same answer
    const existing = await this._getAll('memory');
    const isDuplicate = existing.some(m => {
      const sim = this.similarity(keywords, m.keywords);
      return sim > 0.8; // 80%+ similar = duplicate
    });
    if (isDuplicate) return;

    const data = {
      question: question.slice(0, 500),
      answer: answer.slice(0, 3000),
      keywords,
      category: category || this._categorize(question),
      timestamp: Date.now(),
      useCount: 0,
      rating: 0
    };

    await this._put('memory', data);

    this.stats.learned++;
    await this._saveStats();

    // ── Firebase sync ──
    if (typeof FIRE !== 'undefined' && FIRE.ready) {
      const docId = Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      FIRE.save('memory', docId, data);
    }

    console.log(`[MIND] Learned: "${question.slice(0, 50)}..." (${keywords.length} keywords)`);
  },

  // ── Find similar past Q&A ──
  async recall(question, threshold) {
    if (!this.ready) return null;
    const th = threshold || 0.25;
    const keywords = this.extractKeywords(question);
    if (keywords.length < 1) return null;

    const all = await this._getAll('memory');
    let best = null, bestScore = 0;

    for (const mem of all) {
      const score = this.similarity(keywords, mem.keywords);
      if (score > bestScore && score >= th) {
        bestScore = score;
        best = mem;
      }
    }

    if (best) {
      // Update use count
      best.useCount = (best.useCount || 0) + 1;
      best.lastUsed = Date.now();
      await this._put('memory', best);
      // ── Firebase sync ──
      if (typeof FIRE !== 'undefined' && FIRE.ready && best.id) {
        FIRE.save('memory', best.id, best);
      }
      this.stats.answered++;
      this.stats.apiSaved++;
      await this._saveStats();
      console.log(`[MIND] Recalled (${(bestScore * 100).toFixed(0)}% match): "${best.question.slice(0, 50)}..."`);
    }

    return best ? { answer: best.answer, score: bestScore, source: 'memory', original: best.question } : null;
  },

  // ── Auto-categorize question ──
  _categorize(text) {
    const t = text.toLowerCase();
    if (/expense|kharcha|spent|rupee|₹|paisa|salary|budget|income|invest|sip|emi|loan|tax/i.test(t)) return 'finance';
    if (/habit|gym|exercise|meditation|streak|routine|sleep|water/i.test(t)) return 'habits';
    if (/task|todo|kaam|deadline|goal|target|plan|project/i.test(t)) return 'productivity';
    if (/code|python|javascript|function|bug|error|api|database|html|css/i.test(t)) return 'coding';
    if (/samjhao|explain|kya hai|what is|how does|kaise|teach|concept/i.test(t)) return 'learning';
    if (/motivat|inspire|feeling|sad|happy|stress|anxiety|life/i.test(t)) return 'motivation';
    if (/recipe|cook|food|khana|breakfast|lunch|dinner/i.test(t)) return 'food';
    if (/trip|travel|hotel|flight|place|visit|ghumna/i.test(t)) return 'travel';
    return 'general';
  },

  // ═══════════════════════════════════
  //  2. OFFLINE INTELLIGENCE
  //  Handle simple tasks without API
  //  Pattern matching + templates
  // ═══════════════════════════════════

  offlinePatterns: [
    // ── Greetings ──
    { match: /^(hi|hello|hey|namaste|namaskar|yo|sup|kya hal|kaise ho|good morning|good afternoon|good evening|good night|gm|gn)\b/i,
      respond: () => {
        const h = new Date().getHours();
        const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night';
        const tasks = S.entries ? S.entries.filter(e => e.type === 'task' && !e.done).length : 0;
        const habits = S.habits ? S.habits.length : 0;
        const done = S.habitLog && S.habitLog[td()] ? S.habitLog[td()].length : 0;
        const spent = S.finance ? S.finance.expenses.reduce((s, e) => s + e.amount, 0) : 0;
        const left = S.finance && S.finance.salary ? S.finance.salary - spent : 0;
        let r = `${greet}! `;
        if (tasks) r += `${tasks} tasks pending. `;
        if (habits) r += `Habits: ${done}/${habits} done. `;
        if (S.finance && S.finance.salary) r += `Budget: ${INR(left)} baaki.`;
        if (!tasks && !habits) r += `Kya kar rahe ho aaj?`;
        return r;
      }
    },

    // ── Time ──
    { match: /^(time|kya time|kitne baje|what time|samay|waqt)\b/i,
      respond: () => {
        const now = new Date();
        return `${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}, ${now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`;
      }
    },

    // ── Expense tracking ──
    { match: /^(\d+)\s*(rupee|rs|₹)?\s*(food|chai|tea|coffee|transport|auto|uber|ola|petrol|diesel|rent|shopping|bill|health|medicine|education|entertainment|movie|recharge|phone|internet|wifi|grocery|sabji|vegetables|milk|doodh|fruit|snack|cigarette|beer|drink|gym|salon|haircut|laundry|parking|toll|bus|train|metro|flight|hotel|amazon|flipkart|online|swiggy|zomato|rapido)/i,
      respond: (m) => {
        const amount = parseInt(m[1]);
        const desc = m[3];
        const catMap = { chai:'Food',tea:'Food',coffee:'Food',food:'Food',grocery:'Food',sabji:'Food',vegetables:'Food',milk:'Food',doodh:'Food',fruit:'Food',snack:'Food',swiggy:'Food',zomato:'Food', transport:'Transport',auto:'Transport',uber:'Transport',ola:'Transport',petrol:'Transport',diesel:'Transport',bus:'Transport',train:'Transport',metro:'Transport',rapido:'Transport',toll:'Transport',parking:'Transport',flight:'Travel', rent:'Rent', shopping:'Shopping',amazon:'Shopping',flipkart:'Shopping',online:'Shopping', bill:'Bills',recharge:'Bills',phone:'Bills',internet:'Bills',wifi:'Bills', health:'Health',medicine:'Health',gym:'Health', education:'Education', entertainment:'Entertainment',movie:'Entertainment',beer:'Entertainment',drink:'Entertainment', salon:'Shopping',haircut:'Shopping',laundry:'Shopping', hotel:'Travel' };
        const cat = catMap[desc.toLowerCase()] || 'Other';
        S.finance.expenses.push({ id: Date.now(), amount, cat, desc, date: new Date().toISOString() });
        saveAll();
        const total = S.finance.expenses.reduce((s, e) => s + e.amount, 0);
        const left = (S.finance.salary || 0) - total;
        return `₹${amount} ${cat} mein add kiya (${desc}). Total spent: ${INR(total)}${S.finance.salary ? ', baaki: ' + INR(left) : ''}.`;
      }
    },

    // ── Reverse expense: "chai pe 200" / "auto mein 50" ──
    { match: /^(food|chai|tea|coffee|transport|auto|uber|rent|shopping|bill|health|medicine|education|entertainment|movie|recharge|grocery|sabji|petrol|swiggy|zomato)\s*(pe|par|mein|me|ka|ki|ke)?\s*(\d+)/i,
      respond: (m) => {
        const desc = m[1], amount = parseInt(m[3]);
        const catMap = { chai:'Food',tea:'Food',coffee:'Food',food:'Food',grocery:'Food',sabji:'Food',swiggy:'Food',zomato:'Food', transport:'Transport',auto:'Transport',uber:'Transport',petrol:'Transport', rent:'Rent', shopping:'Shopping', bill:'Bills',recharge:'Bills', health:'Health',medicine:'Health', education:'Education', entertainment:'Entertainment',movie:'Entertainment' };
        const cat = catMap[desc.toLowerCase()] || 'Other';
        S.finance.expenses.push({ id: Date.now(), amount, cat, desc, date: new Date().toISOString() });
        saveAll();
        return `₹${amount} ${cat} add kiya (${desc}).`;
      }
    },

    // ── Habit done ──
    { match: /^(gym|exercise|workout|meditation|meditate|yoga|running|walk|reading|study|coding|journal|water|sleep|wake|prayer|namaz|pooja)\s*(done|ho gaya|ho gya|kar liya|kr liya|complete|kiya|kia|hogya|hogaya|krliya)/i,
      respond: (m) => {
        const name = m[1].toLowerCase();
        const h = (S.habits || []).find(x => x.name.toLowerCase().includes(name));
        if (h) {
          const today = td();
          if (!S.habitLog[today]) S.habitLog[today] = [];
          if (!S.habitLog[today].includes(h.id)) { S.habitLog[today].push(h.id); saveAll(); }
          const done = S.habitLog[today].length, total = S.habits.length;
          return `${h.name} done! (${done}/${total} today)${done === total ? ' Sab complete!' : ''}`;
        }
        return null; // not found, let API handle
      }
    },

    // ── Status check ──
    { match: /^(status|mera status|kya hua|overall|summary|sab batao|report)\b/i,
      respond: () => {
        const tasks = S.entries.filter(e => e.type === 'task' && !e.done).length;
        const goals = S.entries.filter(e => e.type === 'goal' && !e.done).length;
        const habits = S.habits.length;
        const done = (S.habitLog[td()] || []).length;
        const spent = S.finance.expenses.reduce((s, e) => s + e.amount, 0);
        const left = (S.finance.salary || 0) - spent;
        let r = '';
        if (tasks) r += `Tasks: ${tasks} pending\n`;
        if (goals) r += `Goals: ${goals} active\n`;
        if (habits) r += `Habits: ${done}/${habits} today\n`;
        if (S.finance.salary) r += `Budget: ${INR(spent)} spent, ${INR(left)} baaki\n`;
        r += `Notes: ${S.notes.length} | Chats: ${S.chats.length}`;
        return r || 'Koi data nahi hai abhi.';
      }
    },

    // ── Finance check ──
    { match: /^(kitna kharcha|kitna spent|kitna bacha|budget|expense|kharcha|salary|income|paisa|paise)\b/i,
      respond: () => {
        const spent = S.finance.expenses.reduce((s, e) => s + e.amount, 0);
        const left = (S.finance.salary || 0) - spent;
        const bc = {};
        S.finance.expenses.forEach(e => { bc[e.cat] = (bc[e.cat] || 0) + e.amount; });
        let r = `Salary: ${INR(S.finance.salary || 0)}\nSpent: ${INR(spent)}\nBaaki: ${INR(left)}\n`;
        const cats = Object.entries(bc).sort((a, b) => b[1] - a[1]);
        if (cats.length) r += '\nBreakdown:\n' + cats.map(([c, a]) => `${c}: ${INR(a)}`).join('\n');
        return r;
      }
    },

    // ── Habit status ──
    { match: /^(habits?|habit status|streak|aaj kya kiya|habits check)\b/i,
      respond: () => {
        const today = td(), done = S.habitLog[today] || [];
        if (!S.habits.length) return 'Koi habit set nahi hai. Vault mein add karo.';
        return `Habits today (${done.length}/${S.habits.length}):\n` +
          S.habits.map(h => `${done.includes(h.id) ? '✅' : '⬜'} ${h.name}`).join('\n');
      }
    },

    // ── Thanks / ok / simple acknowledgment ──
    { match: /^(thanks|thank you|shukriya|dhanyavaad|ok|okay|theek|thik|acha|accha|great|nice|cool|got it|samajh gaya|samjh gya|hmm|haan|ha)\s*$/i,
      respond: () => {
        const replies = ['👍','Haan!','Theek hai!','Chal, aur kya?','Bol aur kya chahiye.','Ok boss!','Ready hun, bol.'];
        return replies[Math.floor(Math.random() * replies.length)];
      }
    },

    // ── Calculator ──
    { match: /^(?:calculate|calc|kitna hoga|kitne)\s+(.+)/i,
      respond: (m) => {
        try {
          const expr = m[1].replace(/x/gi, '*').replace(/÷/g, '/').replace(/[^\d+\-*/().%\s]/g, '');
          const result = Function('"use strict"; return (' + expr + ')')();
          return `${m[1]} = ${result}`;
        } catch { return null; }
      }
    },

    // ── Math expressions ──
    { match: /^[\d\s+\-*/().%]+$/,
      respond: (m) => {
        try {
          const expr = m[0].trim();
          if (expr.length < 2 || !/[+\-*/]/.test(expr)) return null;
          const result = Function('"use strict"; return (' + expr + ')')();
          return `= ${result}`;
        } catch { return null; }
      }
    }
  ],

  // ── Try offline response ──
  tryOffline(text) {
    if (!text || typeof text !== 'string') return null;
    const clean = text.trim();
    for (const p of this.offlinePatterns) {
      const m = clean.match(p.match);
      if (m) {
        const result = p.respond(m);
        if (result) {
          console.log(`[MIND] Offline response for: "${clean.slice(0, 40)}..."`);
          return result;
        }
      }
    }
    return null;
  },

  // ═══════════════════════════════════
  //  3. SMART CONTEXT MANAGER
  //  Instead of sending last 20 messages blindly,
  //  select the most relevant context
  // ═══════════════════════════════════

  buildSmartContext(messages, currentMsg, maxMessages) {
    const max = maxMessages || 12;
    if (messages.length <= max) return messages;

    // Always include first message (sets the conversation topic)
    const first = messages[0];
    // Always include last N messages for continuity
    const recent = messages.slice(-(max - 2));
    // Find any message that shares keywords with current message
    const currentKw = this.extractKeywords(currentMsg);
    const middle = messages.slice(1, -(max - 2)).filter(m => {
      if (typeof m.content !== 'string') return false;
      const mkw = this.extractKeywords(m.content);
      return this.similarity(currentKw, mkw) > 0.2;
    }).slice(-3); // max 3 relevant old messages

    const result = [first, ...middle, ...recent];
    const saved = messages.length - result.length;
    if (saved > 0) console.log(`[MIND] Context optimized: ${messages.length} → ${result.length} messages (${saved} skipped)`);
    return result;
  },

  // ═══════════════════════════════════
  //  4. USER MODELING
  //  Track user patterns & preferences
  // ═══════════════════════════════════

  async trackUser(question) {
    if (!this.ready) return;
    const now = new Date();
    const hour = now.getHours();
    const category = this._categorize(question);

    const profile = (await this._get('profile', 'user')) || {
      key: 'user',
      totalMessages: 0,
      categories: {},
      activeHours: {},
      languages: { hinglish: 0, english: 0, hindi: 0 },
      avgMsgLength: 0,
      firstSeen: Date.now(),
      lastSeen: Date.now()
    };

    profile.totalMessages++;
    profile.categories[category] = (profile.categories[category] || 0) + 1;
    profile.activeHours[hour] = (profile.activeHours[hour] || 0) + 1;
    profile.lastSeen = Date.now();
    profile.avgMsgLength = Math.round(((profile.avgMsgLength * (profile.totalMessages - 1)) + question.length) / profile.totalMessages);

    // Detect language
    const hasHindi = /[\u0900-\u097F]/.test(question);
    const hasEnglish = /[a-zA-Z]{3,}/.test(question);
    if (hasHindi && hasEnglish) profile.languages.hinglish++;
    else if (hasHindi) profile.languages.hindi++;
    else profile.languages.english++;

    await this._put('profile', profile);
    // ── Firebase sync ──
    if (typeof FIRE !== 'undefined' && FIRE.ready) FIRE.save('profile', 'user', profile);
  },

  async getUserProfile() {
    if (!this.ready) return null;
    return await this._get('profile', 'user');
  },

  // ═══════════════════════════════════
  //  5. PERSONALITY ENGINE
  //  Make AAKASH sound consistent
  //  regardless of which AI provider replies
  // ═══════════════════════════════════

  personalityPrompt() {
    const base = `CRITICAL PERSONALITY RULES — har reply mein follow karo:
- Tu AAKASH hai, AI nahi. Kabhi "I'm an AI" ya "as an AI" mat bol.
- Hinglish bol (Hindi + English mix). Natural, chill, friend jaisa.
- Chhoti baat = chhota reply (1-2 lines). Detail tab jab user bole.
- "Here's", "Let me", "Absolutely!", "I'd be happy to" — YE SAB BANNED.
- Numbers mein ₹ symbol use kar, Indian format mein.
- Kabhi formal/robotic mat ho. Real friend jaisa bol.`;

    return base;
  },

  // ── REPHRASE — rewrite memory answer in fresh words, not copy-paste ──
  rephrase(answer, question) {
    if (!answer) return answer;
    let r = answer;
    
    // 1. Shuffle sentences if multiple
    const sentences = r.split(/(?<=[.!?\n])\s+/).filter(s => s.trim());
    if (sentences.length > 2) {
      // Keep first sentence, shuffle middle, keep last
      const first = sentences[0];
      const last = sentences[sentences.length - 1];
      const middle = sentences.slice(1, -1);
      // Slight reorder of middle
      for (let i = middle.length - 1; i > 0; i--) {
        if (Math.random() > 0.5) {
          const j = Math.floor(Math.random() * (i + 1));
          [middle[i], middle[j]] = [middle[j], middle[i]];
        }
      }
      r = [first, ...middle, last].join(' ');
    }

    // 2. Add natural variations
    const starters = ['Dekh, ', 'Sun, ', 'Basically, ', 'Simple hai — ', 'Matlab, ', 'Seedha bolu toh, ', 'Acha sun, ', 'Real baat — ', ''];
    const enders = [' Samjha?', ' Clear hai?', '', ' Aur kuch puchna hai?', '', ' Bol agar aur detail chahiye.', '', ''];
    
    // 3. Replace some phrases with synonyms
    const synonyms = [
      [/\bhota hai\b/g, () => ['hota hai','hai','rehta hai'][Math.floor(Math.random()*3)]],
      [/\bkarte hain\b/g, () => ['karte hain','kar sakte ho','karna hota hai'][Math.floor(Math.random()*3)]],
      [/\bExample\b/gi, () => ['Example','Jaise','For instance','Maan lo'][Math.floor(Math.random()*4)]],
      [/\bimportant\b/gi, () => ['important','zaruri','key point','critical'][Math.floor(Math.random()*4)]],
      [/\bbahut\b/gi, () => ['bahut','kaafi','bohot','bht'][Math.floor(Math.random()*4)]],
    ];
    for (const [pattern, replacer] of synonyms) {
      if (Math.random() > 0.4) { // 60% chance to apply each synonym
        r = r.replace(pattern, replacer());
      }
    }

    // 4. Add starter/ender randomly
    const starter = starters[Math.floor(Math.random() * starters.length)];
    const ender = enders[Math.floor(Math.random() * enders.length)];
    
    r = starter + r.charAt(0).toLowerCase() + r.slice(1) + ender;
    
    // 5. Clean up
    r = r.replace(/\n{3,}/g, '\n\n').replace(/  +/g, ' ').trim();
    
    console.log('[MIND] Rephrased memory answer — not copy-paste');
    return r;
  },

  // ── Post-process AI response to enforce personality ──
  enforcePersonality(text) {
    if (!text) return text;
    let r = text;
    // Remove common AI-isms
    const aiPhrases = [
      /\bI(?:'m| am) (?:an |)(?:AI|artificial intelligence|language model|assistant|chatbot|bot)\b/gi,
      /\bAs an AI\b/gi,
      /\bI don'?t have (?:personal |)(?:feelings|emotions|experiences|opinions)\b/gi,
      /\bI'?d be happy to\b/gi,
      /\bAbsolutely!\s*/gi,
      /\bCertainly!\s*/gi,
      /\bOf course!\s*/gi,
      /\bGreat question!\s*/gi,
      /\bThat'?s a great question\b/gi,
      /\bHere'?s (?:a |an |the |what )/gi,
      /\bLet me /gi,
      /\bI hope (?:this|that) helps\b/gi,
      /\bFeel free to ask\b/gi,
      /\bDon'?t hesitate to\b/gi,
      /\bIs there anything else\b/gi
    ];
    for (const p of aiPhrases) {
      r = r.replace(p, '');
    }
    // Clean up double spaces/newlines
    r = r.replace(/\n{3,}/g, '\n\n').replace(/  +/g, ' ').trim();
    return r;
  },

  // ═══════════════════════════════════
  //  6. KNOWLEDGE GRAPH
  //  Connect concepts together
  //  "SIP" → "mutual fund" → "compounding"
  // ═══════════════════════════════════

  async addKnowledge(concept, connections, info) {
    if (!this.ready) return;
    const existing = await this._get('knowledge', concept.toLowerCase());
    if (existing) {
      existing.connections = [...new Set([...(existing.connections || []), ...(connections || [])])];
      if (info) existing.info = info;
      existing.updated = Date.now();
      await this._put('knowledge', existing);
      // ── Firebase sync ──
      if (typeof FIRE !== 'undefined' && FIRE.ready) FIRE.save('knowledge', concept.toLowerCase(), existing);
    } else {
      await this._put('knowledge', {
        concept: concept.toLowerCase(),
        connections: (connections || []).map(c => c.toLowerCase()),
        info: info || '',
        created: Date.now(),
        updated: Date.now()
      });
      // ── Firebase sync ──
      if (typeof FIRE !== 'undefined' && FIRE.ready) FIRE.save('knowledge', concept.toLowerCase(), { concept: concept.toLowerCase(), connections: (connections || []).map(c => c.toLowerCase()), info: info || '', created: Date.now(), updated: Date.now() });
    }
  },

  async getRelated(concept) {
    if (!this.ready) return [];
    const node = await this._get('knowledge', concept.toLowerCase());
    if (!node) return [];
    const related = [];
    for (const conn of (node.connections || [])) {
      const n = await this._get('knowledge', conn);
      if (n) related.push(n);
    }
    return related;
  },

  // ── Auto-extract concepts from Q&A and build graph ──
  async autoGraph(question, answer) {
    if (!this.ready) return;
    const allText = question + ' ' + answer;
    const keywords = this.extractKeywords(allText);
    if (keywords.length < 2) return;

    // Connect keywords that appear together
    for (let i = 0; i < Math.min(keywords.length, 5); i++) {
      const connections = keywords.filter((_, j) => j !== i).slice(0, 4);
      await this.addKnowledge(keywords[i], connections);
    }
  },

  // ═══════════════════════════════════
  //  7. SELF IMPROVEMENT
  //  Track feedback, learn what works
  // ═══════════════════════════════════

  async recordFeedback(question, answer, rating, source) {
    if (!this.ready) return;
    await this._put('feedback', {
      question: question.slice(0, 300),
      answer: answer.slice(0, 500),
      rating, // 1 = thumbs up, -1 = thumbs down
      source: source || 'api', // 'memory', 'offline', 'api'
      timestamp: Date.now()
    });
    // ── Firebase sync ──
    if (typeof FIRE !== 'undefined' && FIRE.ready) {
      FIRE.save('feedback', Date.now().toString(), { question: question.slice(0, 300), answer: answer.slice(0, 500), rating, source: source || 'api', timestamp: Date.now() });
    }

    // If thumbs down on a memory answer, lower its rating
    if (source === 'memory' && rating < 0) {
      const all = await this._getAll('memory');
      const match = all.find(m => m.answer === answer);
      if (match) {
        match.rating = (match.rating || 0) - 1;
        if (match.rating <= -3) {
          // Too many downvotes, delete this memory
          const s = this._tx('memory', 'readwrite');
          if (s) s.delete(match.id);
          console.log(`[MIND] Bad memory removed: "${match.question.slice(0, 40)}..."`);
        } else {
          await this._put('memory', match);
        }
      }
    }
  },

  // ═══════════════════════════════════
  //  8. DECISION ENGINE
  //  Route: intent → emotion → offline → memory → API
  //  Returns: { answer, source, confidence }
  // ═══════════════════════════════════

  // ── INTENT DETECTION — same meaning, different words ──
  intents: {
    greeting: {
      patterns: [/^(hi|hello|hey|hlo|hola|namaste|namaskar|yo|sup|kya hal|kaise ho|kya haal|kaisa hai|how are you|how r u|how're you|sab theek|sab thik|kidhar hai|kahan hai|wassup|whatsup|aur bata|bol na|kya scene|kya chal|haal chaal|howdy|bhai kya|yaar kya|hey bro|bro|dude|yaar|yrr|bhai sahab|kya bolti|arre|oye)\b/i,
        /^(good morning|good afternoon|good evening|good night|gm|gn|morning|evening|shubh|suprabhat)\b/i,
        /^(kese ho|kaise h|kasa hai|kaisi ho|kaiso ho|kb ho|kaise hai bhai|theek ho|fit ho|alive ho|zinda ho)\b/i],
      respond: () => {
        const h = new Date().getHours();
        const greets = h < 12 ? 
          ['Arre good morning! Kya plan hai aaj ka?', 'Morning bhai! Uth gaya? Chal kuch karte hain.', 'GM! Aaj productive day banate hain.'] :
          h < 17 ? 
          ['Hey! Kya chal raha hai?', 'Bol bhai! Sab sahi?', 'Kya scene hai? Kuch interesting?'] :
          h < 21 ? 
          ['Hey! Evening kaisi rahi?', 'Bol yaar, aaj kya kiya?', 'Sahi hai, bol kya help chahiye?'] :
          ['Arre abhi tak jaag raha hai? Sab theek?', 'Late night owl! Bol kya chal raha.', 'Bhai so ja, kal baat karte hain 😄'];
        const r = greets[Math.floor(Math.random() * greets.length)];
        const tasks = S.entries ? S.entries.filter(e => e.type === 'task' && !e.done).length : 0;
        const habits = S.habits ? S.habits.length : 0;
        const done = S.habitLog && S.habitLog[td()] ? S.habitLog[td()].length : 0;
        let extra = '';
        if (tasks > 3) extra = ` BTW ${tasks} tasks pending hain.`;
        else if (habits && done < habits) extra = ` Habits: ${done}/${habits} done aaj.`;
        return r + extra;
      }
    },
    farewell: {
      patterns: [/^(bye|byee|tata|alvida|chal bye|ok bye|gn|good night|soja|chalta hun|jata hun|baad mein|later|see you|see ya|take care|tc)\b/i],
      respond: () => {
        const byes = ['Chal bye! Take care yaar ✌️', 'Ok bhai, jab chahiye bol dena.', 'Bye! Kuch chahiye toh message kar dena.', 'Theek hai, rest kar. Kal milte hain!'];
        return byes[Math.floor(Math.random() * byes.length)];
      }
    },
    thanks: {
      patterns: [/^(thanks|thank you|thanku|thnx|shukriya|dhanyavaad|dhanyawad|thx|ty|bohot accha|bahut accha|mast hai|great job|nice one|well done|kamaal|badiya|zabardast)\b/i],
      respond: () => {
        const r = ['Arre kya yaar, thanks mat bol! 😄', 'Apno ko thanks nahi bolte!', 'Haha thanks ki zarurat nahi, bol aur kya?', 'Bas tera kaam ho jaye yahi kaafi hai. Bol aur?'];
        return r[Math.floor(Math.random() * r.length)];
      }
    },
    identity: {
      patterns: [/^(tu kaun|kaun hai tu|tera naam|your name|who are you|kon hai|what are you|tu kya hai|tujhe kisne banaya|tera intro)\b/i],
      respond: () => 'Main AAKASH hun — tera personal AI friend. Finance, coding, planning, motivation, kuch bhi bol. 24/7 available hun tere liye.'
    },
    feeling_good: {
      patterns: [/\b(happy|khush|mast|amazing|awesome|great|fantastic|maza aa gaya|badhiya|zabardast|excited|pumped|aaj accha|feeling good|feeling great|best din|wonderful)\b/i],
      respond: () => {
        const r = ['Sahi hai yaar! Kya hua accha? Bata toh!', 'Arre wah! Yeh energy maintain rakh bhai!', 'Mast! Aise hi reh — positive vibes!', 'Bhai party toh banti hai phir! 😄'];
        return r[Math.floor(Math.random() * r.length)];
      }
    },
    feeling_bad: {
      patterns: [/\b(sad|dukhi|udaas|depressed|down|low feel|bura lag|mood off|mood kharab|kuch accha nahi|hopeless|worthless|alone|akela|cry|ro raha|ro rahi|lonely|lost feel|nahi ho raha|thak gaya|give up|haar gaya)\b/i],
      respond: () => {
        const r = [
          'Yaar, samajh sakta hun. Bura waqt hai, but yeh permanent nahi hai. Ek kaam kar — 10 min walk pe ja, fresh air le. Wapas aake baat karte hain.',
          'Bhai sun, tera feel valid hai. Suppress mat kar. But yaad rakh — tu pehle bhi mushkil se nikla hai, ab bhi niklega. Main hun yahan.',
          'Hota hai yaar, sab ke saath hota hai. Kisi se baat kar — family, friend, koi bhi. Akele mat reh. Aur main toh hun hi.',
          'Dekh, aaj bura din hai — kal better hoga. Abhi kuch mat soch, bas rest le. Kal naye energy se start karenge.'
        ];
        return r[Math.floor(Math.random() * r.length)];
      }
    },
    feeling_angry: {
      patterns: [/\b(angry|gussa|irritat|frustrated|pagal|bakwas|bekar|hate karta|nafrat|chidh|annoyed|pissed|fed up|tang aa gaya|bore ho gaya life se)\b/i],
      respond: () => {
        const r = [
          'Chill bhai, deep breath le. Kya hua? Bata — sometimes bolne se better lagta hai.',
          'Gussa valid hai, but react mat kar abhi. 10 second ruk, phir decide kar kya karna hai. Bata kya scene hai.',
          'Yaar samajh raha hun, frustrating hai. Par gusse mein decision mat le. Pehle calm ho, phir solve karte hain saath mein.'
        ];
        return r[Math.floor(Math.random() * r.length)];
      }
    },
    feeling_bored: {
      patterns: [/\b(bored|bore|boring|kuch nahi|nothing to do|timepass|faltu|vella|free hun|kya karun|suggest karo|idea de|kuch batao interesting)\b/i],
      respond: () => {
        const suggestions = [
          'Bore? Chal ek challenge — 30 min mein kuch naya seekh. YouTube pe ek tech concept dekh jo kabhi nahi dekha.',
          'Ek kaam kar — apne goals check kar Vault mein. Koi pending toh nahi? Bore hona = free time hai, use kar!',
          'Bhai bore hona luxury hai — matlab time hai tere paas. Kuch productive kar: read, code, exercise, ya ek business idea brainstorm kar.',
          'Hmm bore hai? Chal quiz khelte hain — main tujhse kuch puchta hun. Ya koi naya skill start kar aaj se.'
        ];
        return suggestions[Math.floor(Math.random() * suggestions.length)];
      }
    },
    feeling_tired: {
      patterns: [/\b(tired|thak|thaka|exhaust|neend|sleepy|lazy|aalas|rest chahiye|energy nahi|drain|burnout|so ja|sona hai)\b/i],
      respond: () => {
        const r = [
          'Rest le bhai, body sun. Kal fresh mind se kaam karenge. Aaj phone rakh aur so ja.',
          'Thak gaya? Normal hai. 20 min power nap le ya chhota walk kar — energy wapas aayegi.',
          'Bhai burnout mat ho. Rest = productivity investment hai. So ja aaram se, kal double energy se karenge.'
        ];
        return r[Math.floor(Math.random() * r.length)];
      }
    },
    acknowledgment: {
      patterns: [/^(ok|okay|theek|thik|acha|accha|hmm|haan|ha|ji|got it|samajh gaya|samjh gya|cool|nice|sahi|right|hm+|k|kk|alright|fine|chal|done)\s*[.!]?$/i],
      respond: () => {
        const r = ['👍', 'Haan, bol aur kya?', 'Chal, aur bata.', 'Ok boss!', 'Sahi hai. Next?', 'Hmm, aur?'];
        return r[Math.floor(Math.random() * r.length)];
      }
    }
  },

  // ── FUZZY TEXT NORMALIZER — handle typos, slang, variations ──
  normalize(text) {
    if (!text) return '';
    let t = text.toLowerCase().trim();
    // Common Hindi/Hinglish normalizations
    const replacements = {
      'kese':'kaise', 'kse':'kaise', 'kasa':'kaisa', 'kb':'kab', 'kha':'kahan',
      'krr':'kar', 'krna':'karna', 'kro':'karo', 'kr':'kar', 'kru':'karun',
      'nhi':'nahi', 'ni':'nahi', 'nai':'nahi', 'mt':'mat', 'mtt':'mat',
      'bt':'baat', 'bta':'bata', 'btao':'batao', 'btaa':'bata',
      'smjh':'samajh', 'smjha':'samjha', 'smjhao':'samjhao',
      'thk':'theek', 'thnx':'thanks', 'thnk':'thanks', 'ty':'thank you',
      'plz':'please', 'pls':'please',
      'hw':'how', 'wht':'what', 'abt':'about', 'u':'you', 'r':'are', 'ur':'your',
      'msg':'message', 'info':'information', 'pic':'picture', 'ppl':'people',
      'bcz':'because', 'coz':'because', 'bcoz':'because',
      'yr':'yaar', 'yrr':'yaar', 'bro':'bhai',
      'hii':'hi', 'hlo':'hello', 'hlw':'hello',
      'gm':'good morning', 'gn':'good night',
      'haal':'haal', 'hal':'haal',
      'shi':'sahi', 'shi hai':'sahi hai',
      'acha':'accha', 'axa':'accha',
      'mko':'mujhko', 'mje':'mujhe', 'mjhe':'mujhe',
      'tujhe':'tujhe', 'tko':'tujhko',
      'kuch':'kuch', 'kch':'kuch',
      'bhut':'bahut', 'bht':'bahut', 'boht':'bahut',
      'zada':'zyada', 'jyada':'zyada',
      'srr':'sir', 'sry':'sorry'
    };
    // Apply word-level replacements
    t = t.split(/\s+/).map(w => replacements[w] || w).join(' ');
    return t;
  },

  async decide(text) {
    if (!text || typeof text !== 'string') return { answer: null, source: 'api', confidence: 0 };
    const clean = text.trim();
    const normalized = this.normalize(clean);

    // Step 0: INTENT DETECTION — understand what user MEANS, not just words
    for (const [intentName, intent] of Object.entries(this.intents)) {
      for (const pattern of intent.patterns) {
        if (pattern.test(clean) || pattern.test(normalized)) {
          const answer = intent.respond();
          if (answer) {
            console.log(`[MIND] Intent matched: ${intentName}`);
            return { answer, source: 'intent', confidence: 0.95 };
          }
        }
      }
    }

    // Step 1: Try offline patterns (instant, free)
    const offline = this.tryOffline(clean) || this.tryOffline(normalized);
    if (offline) {
      return { answer: offline, source: 'offline', confidence: 1.0 };
    }

    // Step 2: Try memory recall with normalized text too
    const memory = await this.recall(clean) || await this.recall(normalized);
    if (memory && memory.score >= 0.25) {
      return { answer: memory.answer, source: 'memory', confidence: memory.score };
    }

    // Step 3: Try enhanced recall (TF-IDF based)
    const enhanced = await this.enhancedRecall(clean) || await this.enhancedRecall(normalized);
    if (enhanced && enhanced.score >= 0.20) {
      return { answer: enhanced.answer, source: 'memory_enhanced', confidence: enhanced.score };
    }

    // Step 4: Need API — but we can optimize context
    return { answer: null, source: 'api', confidence: 0 };
  },

  // ═══════════════════════════════════
  //  9. CONVERSATION IMPORT
  //  Bulk learn from exported chats
  //  Supports Claude & ChatGPT export formats
  // ═══════════════════════════════════

  async importConversations(jsonData) {
    if (!this.ready) return { ok: false, error: 'Brain not ready' };
    let imported = 0;

    try {
      let pairs = [];

      // Claude export format
      if (Array.isArray(jsonData) && jsonData[0]?.chat_messages) {
        for (const conv of jsonData) {
          const msgs = conv.chat_messages || [];
          for (let i = 0; i < msgs.length - 1; i++) {
            if (msgs[i].sender === 'human' && msgs[i + 1].sender === 'assistant') {
              pairs.push({ q: msgs[i].text, a: msgs[i + 1].text });
            }
          }
        }
      }
      // ChatGPT export format
      else if (Array.isArray(jsonData) && jsonData[0]?.mapping) {
        for (const conv of jsonData) {
          const nodes = Object.values(conv.mapping || {});
          const sorted = nodes.filter(n => n.message).sort((a, b) =>
            (a.message.create_time || 0) - (b.message.create_time || 0));
          for (let i = 0; i < sorted.length - 1; i++) {
            const curr = sorted[i].message;
            const next = sorted[i + 1].message;
            if (curr?.author?.role === 'user' && next?.author?.role === 'assistant') {
              const q = curr.content?.parts?.join('') || '';
              const a = next.content?.parts?.join('') || '';
              if (q && a) pairs.push({ q, a });
            }
          }
        }
      }
      // Simple Q&A array format: [{question, answer}]
      else if (Array.isArray(jsonData) && jsonData[0]?.question) {
        pairs = jsonData.map(x => ({ q: x.question, a: x.answer }));
      }
      // AAKASH internal chat format
      else if (typeof jsonData === 'object' && jsonData.chats) {
        for (const chat of (jsonData.chats || [])) {
          const msgs = chat.messages || [];
          for (let i = 0; i < msgs.length - 1; i++) {
            if (msgs[i].role === 'user' && msgs[i + 1].role === 'assistant') {
              const q = typeof msgs[i].content === 'string' ? msgs[i].content : '';
              const a = typeof msgs[i + 1].content === 'string' ? msgs[i + 1].content : '';
              if (q && a) pairs.push({ q, a });
            }
          }
        }
      }

      // Learn from all pairs
      for (const pair of pairs) {
        if (pair.q.length > 5 && pair.a.length > 10) {
          await this.learn(pair.q, pair.a);
          imported++;
        }
      }

      return { ok: true, imported, total: pairs.length };
    } catch (e) {
      return { ok: false, error: e.message, imported };
    }
  },

  // ═══════════════════════════════════
  //  STATS & UTILITIES
  // ═══════════════════════════════════

  async _loadStats() {
    try {
      const s = localStorage.getItem('ak_mind_stats');
      if (s) this.stats = JSON.parse(s);
    } catch {}
  },

  async _saveStats() {
    try {
      localStorage.setItem('ak_mind_stats', JSON.stringify(this.stats));
    } catch {}
  },

  async getStats() {
    const memCount = await this._count('memory');
    const kgCount = await this._count('knowledge');
    const fbCount = await this._count('feedback');
    const profile = await this.getUserProfile();
    return {
      memories: memCount,
      knowledgeNodes: kgCount,
      feedbacks: fbCount,
      answered: this.stats.answered,
      learned: this.stats.learned,
      apiSaved: this.stats.apiSaved,
      totalUserMessages: profile?.totalMessages || 0,
      topCategories: profile?.categories || {},
      brainAge: profile ? Math.floor((Date.now() - profile.firstSeen) / 86400000) : 0
    };
  },

  // ── Reset brain (danger!) ──
  async reset() {
    if (!this.db) return;
    const stores = ['memory', 'knowledge', 'profile', 'feedback'];
    for (const store of stores) {
      try {
        const s = this._tx(store, 'readwrite');
        if (s) s.clear();
      } catch {}
    }
    this.stats = { answered: 0, learned: 0, apiSaved: 0 };
    await this._saveStats();
    console.log('[MIND] Brain reset complete');
  },

  // ═══════════════════════════════════
  //  10. EMOTION DETECTION
  //  Detect user mood from text
  //  Adjust response accordingly
  // ═══════════════════════════════════

  detectEmotion(text) {
    const t = (text || '').toLowerCase();
    const emotions = {
      happy: /\b(happy|khush|mast|amazing|awesome|great|fantastic|love|yay|haha|lol|😂|😊|🎉|nice|wonderful|best|excited)\b/i,
      sad: /\b(sad|dukhi|udaas|depressed|alone|akela|miss|cry|ro raha|bura|worst|terrible|horrible|hate)\b/i,
      angry: /\b(angry|gussa|irritat|frustrated|pagal|stupid|idiot|bakwas|bekar|chutiya|bc|mc|hate|annoyed)\b/i,
      stressed: /\b(stress|tension|anxiety|worried|pareshan|dar|nervous|overwhelm|pressure|panic|help)\b/i,
      motivated: /\b(motivat|inspire|pumped|ready|let'?s go|chal|shuru|start|goal|dream|hustle|grind)\b/i,
      confused: /\b(confus|samajh nahi|nahi samjha|kaise|how|kya matlab|what does|unclear|doubt|lost)\b/i,
      bored: /\b(bored|bore|boring|kuch nahi|nothing|timepass|bakchodi|faltu|vella|bekar)\b/i,
      tired: /\b(tired|thak|thaka|exhaust|neend|sleepy|lazy|aalas|rest|break chahiye)\b/i
    };
    for (const [emotion, pattern] of Object.entries(emotions)) {
      if (pattern.test(t)) return emotion;
    }
    return 'neutral';
  },

  // ── Emotion-aware response modifier ──
  emotionContext(emotion) {
    const ctx = {
      happy: '\n[USER MOOD: Happy. Match their energy. Be enthusiastic.]',
      sad: '\n[USER MOOD: Sad. Be empathetic, warm, supportive. Listen.]',
      angry: '\n[USER MOOD: Frustrated. Stay calm, acknowledge, help solve.]',
      stressed: '\n[USER MOOD: Stressed. Be calming, break things into small steps.]',
      motivated: '\n[USER MOOD: Motivated! Match energy, push forward, encourage.]',
      confused: '\n[USER MOOD: Confused. Explain simply, step by step, examples.]',
      bored: '\n[USER MOOD: Bored. Be engaging, suggest fun or productive things.]',
      tired: '\n[USER MOOD: Tired. Be gentle, keep replies short, suggest rest.]',
      neutral: ''
    };
    return ctx[emotion] || '';
  },

  // ═══════════════════════════════════
  //  11. SMART SUGGESTIONS
  //  Suggest next actions based on context
  // ═══════════════════════════════════

  getSuggestions() {
    const suggestions = [];
    const now = new Date();
    const hour = now.getHours();
    const today = td();

    // Morning suggestions
    if (hour >= 6 && hour < 10) {
      const pendingHabits = S.habits.filter(h => !(S.habitLog[today] || []).includes(h.id));
      if (pendingHabits.length) suggestions.push(`${pendingHabits[0].name} karo`);
      suggestions.push('Daily Brief');
    }

    // Pending tasks reminder
    const urgentTasks = S.entries.filter(e => e.type === 'task' && !e.done);
    if (urgentTasks.length > 3) suggestions.push('Tasks review');

    // Finance check
    const spent = S.finance.expenses.reduce((s, e) => s + e.amount, 0);
    if (S.finance.salary && spent > S.finance.salary * 0.8) suggestions.push('Budget check');

    // Evening suggestions
    if (hour >= 19 && hour < 23) {
      suggestions.push('Aaj ka summary');
      const missedHabits = S.habits.filter(h => !(S.habitLog[today] || []).includes(h.id));
      if (missedHabits.length) suggestions.push(`${missedHabits.length} habits baaki`);
    }

    return suggestions.slice(0, 4);
  },

  // ═══════════════════════════════════
  //  12. TRENDING TOPICS
  //  Track what user asks most
  // ═══════════════════════════════════

  async getTrending() {
    if (!this.ready) return [];
    const all = await this._getAll('memory');
    const catCount = {};
    const recent = all.filter(m => Date.now() - m.timestamp < 7 * 86400000); // last 7 days
    recent.forEach(m => { catCount[m.category] = (catCount[m.category] || 0) + 1; });
    return Object.entries(catCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, count]) => ({ category: cat, count }));
  },

  // ═══════════════════════════════════
  //  13. AUTO-CLEANUP
  //  Remove old, unused, bad memories
  //  Keep brain efficient
  // ═══════════════════════════════════

  async autoCleanup() {
    if (!this.ready) return { removed: 0 };
    const all = await this._getAll('memory');
    let removed = 0;
    const cutoff = Date.now() - (90 * 86400000); // 90 days

    for (const mem of all) {
      const shouldRemove =
        (mem.rating <= -2) || // badly rated
        (mem.timestamp < cutoff && mem.useCount === 0) || // old & never used
        (mem.answer && mem.answer.length < 15); // too short to be useful

      if (shouldRemove) {
        const s = this._tx('memory', 'readwrite');
        if (s) { s.delete(mem.id); removed++; }
      }
    }

    if (removed) console.log(`[MIND] Cleanup: ${removed} bad/old memories removed`);
    return { removed, total: all.length - removed };
  },

  // ═══════════════════════════════════
  //  14. PROACTIVE LEARNING
  //  Extract extra knowledge from conversations
  //  Learn patterns, not just Q&A
  // ═══════════════════════════════════

  async deepLearn(question, answer) {
    if (!this.ready || !answer) return;

    // Learn the Q&A pair
    await this.learn(question, answer);

    // Auto-build knowledge graph from conversation
    await this.autoGraph(question, answer);

    // Track user preferences
    await this.trackUser(question);

    // ── AGGRESSIVE LEARNING: Extract multiple knowledge pieces ──

    // 1. Extract facts (Hindi + English patterns)
    const factPatterns = [
      /(?:[\w\s]+) (?:hai|hota hai|hota|hain|means|is called|matlab|ka matlab)/gi,
      /(?:[\w\s]+) (?:= |equals |barabar |yaani )/gi,
      /(?:formula|rule|law|principle|concept)[\s:]+(.{10,100})/gi,
      /(?:tip|advice|suggestion|tarika)[\s:]+(.{10,80})/gi
    ];
    for (const pattern of factPatterns) {
      const facts = answer.match(pattern);
      if (facts) {
        for (const fact of facts.slice(0, 5)) {
          const keywords = this.extractKeywords(fact);
          if (keywords.length >= 2) {
            await this.addKnowledge(keywords[0], keywords.slice(1), fact.trim());
          }
        }
      }
    }

    // 2. Extract numbers/stats (₹, %, years, etc)
    const numbers = answer.match(/₹[\d,.]+[KkLlCcMm]?|[\d.]+\s*%|\d+\s*(saal|years?|months?|mahine|din|days?|hours?|ghante)/gi);
    if (numbers && numbers.length) {
      const qkw = this.extractKeywords(question);
      if (qkw.length) {
        await this.addKnowledge(qkw[0], qkw.slice(1), `Stats: ${numbers.slice(0, 5).join(', ')}`);
      }
    }

    // 3. Learn user preferences from questions
    const prefPatterns = {
      'favorite': /(?:mera|meri|my) (?:fav|favorite|pasand|best) (\w+)/i,
      'location': /(?:main|mein|i live|rehta|rehti) (?:in |mein )?(\w+)/i,
      'work': /(?:kaam|job|work|company|office) (?:pe|mein|at) (\w+)/i,
      'name': /(?:mera naam|my name|i am|main) (\w+)/i
    };
    for (const [type, pattern] of Object.entries(prefPatterns)) {
      const m = question.match(pattern);
      if (m && m[1]) {
        await this._put('profile', { key: `pref_${type}`, value: m[1], timestamp: Date.now() });
        if (typeof FIRE !== 'undefined' && FIRE.ready) FIRE.save('profile', `pref_${type}`, { key: `pref_${type}`, value: m[1], timestamp: Date.now() });
      }
    }

    // 4. Learn conversation topic for context
    const category = this._categorize(question);
    const topicKey = `topic_${category}_${new Date().toISOString().slice(0,10)}`;
    const existing = await this._get('profile', topicKey);
    const count = existing ? (existing.count || 0) + 1 : 1;
    await this._put('profile', { key: topicKey, count, lastQuestion: question.slice(0, 200), timestamp: Date.now() });
  },

  // ═══════════════════════════════════
  //  15. BRAIN HEALTH MONITOR
  //  Track brain performance over time
  // ═══════════════════════════════════

  async getHealth() {
    const stats = await this.getStats();
    const memCount = stats.memories;
    const hitRate = stats.answered > 0 ? ((stats.answered / (stats.answered + stats.learned)) * 100).toFixed(0) : 0;
    const trending = await this.getTrending();

    let level = 'Newborn';
    if (memCount >= 10) level = 'Infant';
    if (memCount >= 50) level = 'Child';
    if (memCount >= 200) level = 'Teen';
    if (memCount >= 500) level = 'Adult';
    if (memCount >= 1000) level = 'Smart';
    if (memCount >= 5000) level = 'Genius';
    if (memCount >= 10000) level = 'Superintelligent';

    return {
      level,
      memories: memCount,
      knowledgeNodes: stats.knowledgeNodes,
      hitRate: hitRate + '%',
      apiSaved: stats.apiSaved,
      totalInteractions: stats.learned + stats.answered,
      trending,
      age: stats.brainAge + ' days',
      health: memCount > 100 ? 'Excellent' : memCount > 30 ? 'Good' : memCount > 5 ? 'Growing' : 'Just started'
    };
  },

  // ═══════════════════════════════════
  //  16. ENHANCED SIMILARITY (TF-IDF-like)
  //  Better than basic Jaccard for matching
  // ═══════════════════════════════════

  async enhancedRecall(question, threshold) {
    if (!this.ready) return null;
    const th = threshold || 0.20;
    const qKeywords = this.extractKeywords(question);
    if (qKeywords.length < 1) return null;

    const all = await this._getAll('memory');
    if (!all.length) return null;

    // Calculate IDF (how rare each keyword is across all memories)
    const docFreq = {};
    for (const mem of all) {
      const unique = new Set(mem.keywords);
      unique.forEach(w => { docFreq[w] = (docFreq[w] || 0) + 1; });
    }
    const totalDocs = all.length;

    let best = null, bestScore = 0;

    for (const mem of all) {
      let score = 0;
      const memSet = new Set(mem.keywords);

      for (const kw of qKeywords) {
        if (memSet.has(kw)) {
          // TF-IDF: rare keywords matter more
          const idf = Math.log((totalDocs + 1) / (1 + (docFreq[kw] || 0)));
          score += idf;
        }
      }

      // Normalize by query length
      const maxPossible = qKeywords.reduce((s, kw) => s + Math.log((totalDocs + 1) / (1 + (docFreq[kw] || 0))), 0);
      const normalized = maxPossible > 0 ? score / maxPossible : 0;

      // Boost recently used and highly rated memories
      const recencyBoost = mem.lastUsed ? Math.max(0, 0.05 - (Date.now() - mem.lastUsed) / (30 * 86400000) * 0.05) : 0;
      const ratingBoost = (mem.rating || 0) * 0.02;
      const finalScore = normalized + recencyBoost + ratingBoost;

      if (finalScore > bestScore && finalScore >= th) {
        bestScore = finalScore;
        best = mem;
      }
    }

    if (best) {
      best.useCount = (best.useCount || 0) + 1;
      best.lastUsed = Date.now();
      await this._put('memory', best);
      // ── Firebase sync ──
      if (typeof FIRE !== 'undefined' && FIRE.ready && best.id) {
        FIRE.save('memory', best.id, best);
      }
      this.stats.answered++;
      this.stats.apiSaved++;
      await this._saveStats();
      console.log(`[MIND] Enhanced recall (${(bestScore * 100).toFixed(0)}% TF-IDF): "${best.question.slice(0, 50)}..."`);
    }

    return best ? { answer: best.answer, score: bestScore, source: 'memory', original: best.question } : null;
  }
};

// ── Initialize brain on load ──
MIND.init();
