// ════════════════════════════════════════════════════════════
//  AAKASH AI v3 — MIND (brain.js)
//  Shadow Learning Intelligence System
//  ─────────────────────────────────────
//  CORE PRINCIPLE: Brain NEVER answers when API is available
//  Brain SILENTLY learns from every API conversation
//  Brain ONLY responds when ALL APIs fail (fallback mode)
//  ─────────────────────────────────────
//  Layer 1: Silent Conversation Store
//  Layer 2: Tool Pattern Learning
//  Layer 3: Keyword-Based Similarity Search
//  Layer 4: Domain-Specific Templates (local data)
//  Layer 5: User Profile Tracking
//  Layer 6: Feedback Loop (thumbs up/down)
//  Layer 7: PDF/Document Knowledge Store
// ════════════════════════════════════════════════════════════

const MIND = {
  ready: false,
  db: null,
  stats: { answered: 0, learned: 0, apiSaved: 0, documentsStored: 0 },

  // ═══════════════════════════════════
  //  DATABASE — IndexedDB (100MB+ storage)
  // ═══════════════════════════════════

  async init() {
    try {
      this.db = await new Promise((resolve, reject) => {
        const req = indexedDB.open('AakashMind', 4);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;

          // Q&A memory store — learned conversations
          if (!db.objectStoreNames.contains('memory')) {
            const ms = db.createObjectStore('memory', { keyPath: 'id', autoIncrement: true });
            ms.createIndex('keywords', 'keywords', { multiEntry: true });
            ms.createIndex('category', 'category');
            ms.createIndex('timestamp', 'timestamp');
            ms.createIndex('score', 'score');
          }

          // Knowledge graph — connected concepts
          if (!db.objectStoreNames.contains('knowledge')) {
            const ks = db.createObjectStore('knowledge', { keyPath: 'concept' });
            ks.createIndex('connections', 'connections', { multiEntry: true });
          }

          // User profile — preferences & patterns
          if (!db.objectStoreNames.contains('profile')) {
            db.createObjectStore('profile', { keyPath: 'key' });
          }

          // Feedback — thumbs up/down
          if (!db.objectStoreNames.contains('feedback')) {
            const fs = db.createObjectStore('feedback', { keyPath: 'id', autoIncrement: true });
            fs.createIndex('rating', 'rating');
          }

          // Tool patterns — learned tool usage
          if (!db.objectStoreNames.contains('toolPatterns')) {
            const tp = db.createObjectStore('toolPatterns', { keyPath: 'id', autoIncrement: true });
            tp.createIndex('toolName', 'toolName');
            tp.createIndex('pattern', 'pattern');
          }

          // Documents — uploaded PDFs/files stored page-wise
          if (!db.objectStoreNames.contains('documents')) {
            const ds = db.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
            ds.createIndex('fileName', 'fileName');
            ds.createIndex('pageNum', 'pageNum');
            ds.createIndex('keywords', 'keywords', { multiEntry: true });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      this.ready = true;
      await this._loadStats();
      console.log('[MIND] Shadow Learning Brain initialized');

      // Auto-migrate old memories (add keywords if missing)
      await this._migrateOldMemories();

      // Cloud sync on init
      setTimeout(async () => {
        if (typeof FIRE !== 'undefined') {
          await FIRE.init();
          if (FIRE.ready) {
            const result = await FIRE.fullSync();
            if (result.ok) console.log(`[MIND] Cloud sync done — ${result.newFromCloud} new items`);
          }
        }
      }, 2000);
    } catch (e) {
      console.log('[MIND] IndexedDB failed:', e);
      this.ready = false;
    }
  },

  // ── DB helpers ──
  _tx(store, mode) {
    if (!this.db) return null;
    try { return this.db.transaction(store, mode).objectStore(store); }
    catch { return null; }
  },

  async _getAll(store) {
    const s = this._tx(store, 'readonly');
    if (!s) return [];
    return new Promise(r => { const req = s.getAll(); req.onsuccess = () => r(req.result || []); req.onerror = () => r([]); });
  },

  async _put(store, data) {
    const s = this._tx(store, 'readwrite');
    if (!s) return;
    return new Promise(r => { const req = s.put(data); req.onsuccess = () => r(true); req.onerror = () => r(false); });
  },

  async _add(store, data) {
    const s = this._tx(store, 'readwrite');
    if (!s) return null;
    return new Promise(r => { const req = s.add(data); req.onsuccess = () => r(req.result); req.onerror = () => r(null); });
  },

  async _delete(store, id) {
    const s = this._tx(store, 'readwrite');
    if (!s) return;
    return new Promise(r => { const req = s.delete(id); req.onsuccess = () => r(true); req.onerror = () => r(false); });
  },

  async _loadStats() {
    try {
      const s = this._tx('profile', 'readonly');
      if (!s) return;
      const req = s.get('stats');
      req.onsuccess = () => { if (req.result) this.stats = req.result.value; };
    } catch {}
  },

  // ── Auto-migrate old memories (add keywords if missing) ──
  async _migrateOldMemories() {
    try {
      const all = await this._getAll('memory');
      let fixed = 0;
      for (const m of all) {
        if (!m.keywords || !m.keywords.length) {
          m.keywords = this._extractKeywords((m.question || '') + ' ' + (m.answer || ''));
          m.category = this._detectCategory(m.question || '');
          if (!m.score) m.score = 5;
          if (!m.timestamp) m.timestamp = Date.now();
          if (!m.source) m.source = 'migrated';
          await this._put('memory', m);
          fixed++;
        }
      }
      if (fixed > 0) console.log(`[MIND] Migrated ${fixed}/${all.length} old memories — keywords added`);
    } catch (e) { console.log('[MIND] Migration error:', e); }
  },

  async _saveStats() {
    await this._put('profile', { key: 'stats', value: this.stats });
  },

  // ═══════════════════════════════════
  //  LAYER 1: SILENT CONVERSATION STORE
  //  Learns from every API response
  //  NEVER interferes with API responses
  // ═══════════════════════════════════

  async silentLearn(question, answer) {
    if (!this.ready || !question || !answer) return;
    if (answer.length < 10) return; // Skip very short answers

    try {
      const keywords = this._extractKeywords(question + ' ' + answer);
      const category = this._detectCategory(question);

      await this._add('memory', {
        question: question.slice(0, 500),
        answer: answer.slice(0, 3000),
        keywords,
        category,
        score: 5,                    // Default neutral score
        timestamp: Date.now(),
        source: 'api'                // Learned from API
      });

      this.stats.learned++;
      await this._saveStats();

      // Also learn tool patterns if tools were used
      this._learnToolPattern(question, answer);

      // Update knowledge graph
      this._updateKnowledgeGraph(keywords, category);

      console.log(`[MIND] Silent learn: "${question.slice(0,40)}..." → ${category} (${keywords.length} keywords)`);
    } catch (e) {
      console.log('[MIND] Silent learn error:', e);
    }
  },

  // ═══════════════════════════════════
  //  LAYER 2: TOOL PATTERN LEARNING
  //  Learns which tools to call for which queries
  // ═══════════════════════════════════

  async _learnToolPattern(question, answer) {
    // Detect tool usage from answer
    const toolPatterns = [
      { pattern: /expense|kharch|spent|laga|diya|₹\d+/i, tool: 'add_expense' },
      { pattern: /task|kaam|karna|reminder|yaad/i, tool: 'create_task' },
      { pattern: /habit|gym|meditation|done|ho gaya|complete/i, tool: 'log_habit' },
      { pattern: /note|save|likho|store|yaad rakh/i, tool: 'create_note' },
      { pattern: /goal|target|achieve|milestone/i, tool: 'set_goal' },
      { pattern: /finance|budget|salary|income|expense/i, tool: 'get_finance_summary' },
      { pattern: /habit.*status|aaj.*habit|habit.*done/i, tool: 'get_habits_status' }
    ];

    for (const tp of toolPatterns) {
      if (tp.pattern.test(question)) {
        await this._add('toolPatterns', {
          toolName: tp.tool,
          pattern: question.slice(0, 200),
          keywords: this._extractKeywords(question),
          timestamp: Date.now()
        });
      }
    }
  },

  // ── Execute tool locally (when API is down) ──
  executeToolLocally(question) {
    const q = question.toLowerCase();

    // Finance summary — can generate from local state
    if (/finance|budget|salary|kitna kharch|kitna bacha|paise/i.test(q)) {
      return this._generateFinanceSummary();
    }

    // Habit status — can generate from local state
    if (/habit|aaj.*done|streak|habit.*status/i.test(q)) {
      return this._generateHabitStatus();
    }

    // Task list — can generate from local state
    if (/task|pending|kaam|karna hai/i.test(q)) {
      return this._generateTaskList();
    }

    // Add expense via regex
    const expMatch = q.match(/(\d+)\s*(rs|rupee|₹)?\s*(food|khana|chai|transport|rent|shopping|bills|health|education|entertainment|investment|savings|travel|other)?/i);
    if (expMatch && /kharch|laga|spent|diya|expense|pay/i.test(q)) {
      const amount = parseInt(expMatch[1]);
      const cat = expMatch[3] ? expMatch[3].charAt(0).toUpperCase() + expMatch[3].slice(1) : 'Other';
      S.finance.expenses.push({ id: Date.now(), amount, cat, desc: question, date: new Date().toISOString() });
      saveAll();
      return `₹${amount} ${cat} mein add kar diya hai. Aaj ka total: ₹${S.finance.expenses.reduce((s,e) => s + e.amount, 0)}`;
    }

    return null;
  },

  _generateFinanceSummary() {
    const totExp = S.finance.expenses.reduce((s,e) => s + e.amount, 0);
    const totInc = (S.finance.income||[]).reduce((s,i) => s + i.amount, 0);
    const salary = S.finance.salary || 0;
    const left = salary - totExp;
    const bc = {};
    S.finance.expenses.forEach(e => { bc[e.cat] = (bc[e.cat]||0) + e.amount; });
    const topCats = Object.entries(bc).sort((a,b) => b[1]-a[1]).slice(0,3);

    let reply = `Aapka finance summary:\n`;
    if (salary) reply += `• Salary: ₹${salary.toLocaleString()}\n`;
    reply += `• Total Expenses: ₹${totExp.toLocaleString()} (${S.finance.expenses.length} transactions)\n`;
    if (totInc) reply += `• Total Income: ₹${totInc.toLocaleString()}\n`;
    if (salary) reply += `• Remaining: ₹${left.toLocaleString()}\n`;
    if (topCats.length) reply += `• Top Categories: ${topCats.map(([c,a]) => `${c}: ₹${a.toLocaleString()}`).join(', ')}\n`;
    reply += `\n_(Offline mode — brain se generated)_`;
    return reply;
  },

  _generateHabitStatus() {
    const t = td();
    const done = S.habitLog[t] || [];
    const total = S.habits.length;
    if (!total) return 'Aapne abhi koi habit add nahi ki hai. Settings se add karein.';

    let reply = `Aaj ki habits (${done.length}/${total}):\n`;
    S.habits.forEach(h => {
      const isDone = done.includes(h.id);
      reply += `${isDone ? '✅' : '⬜'} ${h.name}\n`;
    });
    if (done.length === total) reply += `\nBahut accha! Saari habits complete ho gayi hain! 🎉`;
    else reply += `\n${total - done.length} habits pending hain. Abhi complete kar lijiye!`;
    reply += `\n\n_(Offline mode — brain se generated)_`;
    return reply;
  },

  _generateTaskList() {
    const tasks = S.entries.filter(e => e.type === 'task' && !e.done);
    const doneTasks = S.entries.filter(e => e.type === 'task' && e.done);
    if (!tasks.length && !doneTasks.length) return 'Koi task nahi hai abhi. Naya task add karein!';

    let reply = '';
    if (tasks.length) {
      reply += `Pending Tasks (${tasks.length}):\n`;
      tasks.forEach((t,i) => { reply += `${i+1}. ${t.title}\n`; });
    }
    if (doneTasks.length) {
      reply += `\nCompleted: ${doneTasks.length} tasks ✅`;
    }
    reply += `\n\n_(Offline mode — brain se generated)_`;
    return reply;
  },

  // ═══════════════════════════════════
  //  LAYER 3: KEYWORD SIMILARITY SEARCH
  //  Used for fallback answers
  // ═══════════════════════════════════

  _extractKeywords(text) {
    if (!text) return [];
    const stopWords = new Set(['ka','ki','ke','hai','hain','ho','ko','se','mein','pe','ye','yeh','woh','kya','kaise','kab','kahan','kaun','aur','ya','toh','par','lekin','agar','jab','tab','abhi','ek','do','is','us','in','un','the','a','an','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','shall','should','may','might','must','can','could','i','me','my','you','your','he','she','it','we','they','this','that','these','those','what','how','when','where','who','which','and','or','but','if','then','so','not','no','for','to','of','in','on','at','by','from','with']);
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))
      .slice(0, 20);
  },

  _detectCategory(text) {
    const t = (text || '').toLowerCase();
    if (/finance|money|paise|salary|expense|income|invest|budget|saving|sip|mutual fund|stock|₹/i.test(t)) return 'finance';
    if (/habit|gym|exercise|meditation|streak|routine|daily/i.test(t)) return 'habits';
    if (/task|goal|plan|target|project|deadline|todo/i.test(t)) return 'productivity';
    if (/code|programming|python|javascript|api|debug|function|algorithm/i.test(t)) return 'tech';
    if (/health|diet|skin|hair|medical|doctor|medicine|vitamin/i.test(t)) return 'health';
    if (/business|startup|idea|revenue|market|customer|product/i.test(t)) return 'business';
    if (/study|learn|course|exam|concept|chapter|book/i.test(t)) return 'education';
    return 'general';
  },

  _calculateSimilarity(keywords1, keywords2) {
    if (!keywords1.length || !keywords2.length) return 0;
    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);
    let intersection = 0;
    set1.forEach(k => { if (set2.has(k)) intersection++; });
    return intersection / Math.max(set1.size, set2.size);
  },

  async _findSimilar(question, minScore = 0.3, limit = 5) {
    const memories = await this._getAll('memory');
    const qKeywords = this._extractKeywords(question);
    const qCategory = this._detectCategory(question);

    const results = memories.map(m => {
      let sim = this._calculateSimilarity(qKeywords, m.keywords);
      // Boost score for same category
      if (m.category === qCategory) sim += 0.15;
      // Boost for high feedback score
      if (m.score > 7) sim += 0.1;
      // Slight recency boost
      const daysSince = (Date.now() - m.timestamp) / 86400000;
      if (daysSince < 7) sim += 0.05;
      return { ...m, similarity: sim };
    })
    .filter(m => m.similarity >= minScore)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

    return results;
  },

  // ═══════════════════════════════════
  //  LAYER 4: DOMAIN TEMPLATES
  //  (Already in executeToolLocally above)
  // ═══════════════════════════════════

  // ═══════════════════════════════════
  //  LAYER 5: USER PROFILE TRACKING
  // ═══════════════════════════════════

  async trackUser(message) {
    if (!this.ready) return;
    try {
      const profile = await this._getProfile();
      profile.totalMessages = (profile.totalMessages || 0) + 1;
      profile.lastActive = Date.now();

      // Track active hours
      const hour = new Date().getHours();
      if (!profile.activeHours) profile.activeHours = {};
      profile.activeHours[hour] = (profile.activeHours[hour] || 0) + 1;

      // Track topics
      const cat = this._detectCategory(message);
      if (!profile.topicFrequency) profile.topicFrequency = {};
      profile.topicFrequency[cat] = (profile.topicFrequency[cat] || 0) + 1;

      // Track message length preference
      const len = message.split(/\s+/).length;
      if (!profile.avgMessageLength) profile.avgMessageLength = len;
      else profile.avgMessageLength = Math.round((profile.avgMessageLength * 0.9) + (len * 0.1));

      await this._put('profile', { key: 'userProfile', value: profile });
    } catch {}
  },

  async _getProfile() {
    try {
      const s = this._tx('profile', 'readonly');
      if (!s) return {};
      return new Promise(r => {
        const req = s.get('userProfile');
        req.onsuccess = () => r(req.result?.value || {});
        req.onerror = () => r({});
      });
    } catch { return {}; }
  },

  // ═══════════════════════════════════
  //  LAYER 6: FEEDBACK LOOP
  // ═══════════════════════════════════

  async rateFeedback(memoryId, rating) {
    if (!this.ready) return;
    try {
      // Update memory score
      const memories = await this._getAll('memory');
      const mem = memories.find(m => m.id === memoryId);
      if (mem) {
        mem.score = rating === 'up' ? Math.min(10, mem.score + 1) : Math.max(0, mem.score - 2);
        await this._put('memory', mem);
      }
      // Store feedback
      await this._add('feedback', { memoryId, rating, timestamp: Date.now() });
    } catch {}
  },

  // ═══════════════════════════════════
  //  LAYER 7: PDF/DOCUMENT KNOWLEDGE
  //  Stores uploaded files page-wise
  //  User can query any page/topic later
  // ═══════════════════════════════════

  async storeDocument(fileName, pages) {
    if (!this.ready || !pages || !pages.length) return false;
    try {
      for (let i = 0; i < pages.length; i++) {
        const pageText = pages[i];
        if (!pageText || pageText.trim().length < 10) continue;

        const keywords = this._extractKeywords(pageText);
        // Extract potential headings/topics
        const headings = pageText.match(/^[A-Z][A-Za-z\s]{3,50}$/gm) || [];

        await this._add('documents', {
          fileName,
          pageNum: i + 1,
          content: pageText.slice(0, 5000),
          keywords,
          headings: headings.slice(0, 10),
          storedAt: Date.now()
        });
      }

      this.stats.documentsStored++;
      await this._saveStats();

      // Track in uploaded files
      if (S.uploadedFiles) {
        S.uploadedFiles.push({
          id: Date.now(),
          name: fileName,
          type: 'pdf',
          pages: pages.length,
          uploadedAt: new Date().toISOString(),
          brainStored: true
        });
        saveAll();
      }

      console.log(`[MIND] Document stored: ${fileName} (${pages.length} pages)`);
      return true;
    } catch (e) {
      console.log('[MIND] Document store error:', e);
      return false;
    }
  },

  async searchDocuments(query) {
    if (!this.ready) return [];
    try {
      const docs = await this._getAll('documents');
      const qKeywords = this._extractKeywords(query);

      // Check if asking about specific page
      const pageMatch = query.match(/page\s*(\d+)/i);
      if (pageMatch) {
        const pageNum = parseInt(pageMatch[1]);
        const pageResults = docs.filter(d => d.pageNum === pageNum);
        if (pageResults.length) return pageResults;
      }

      // Check if asking about specific file
      const fileResults = docs.filter(d => {
        const nameWords = d.fileName.toLowerCase().split(/[\s._-]+/);
        return nameWords.some(w => query.toLowerCase().includes(w));
      });

      // Keyword similarity search
      const scored = (fileResults.length ? fileResults : docs).map(d => {
        const sim = this._calculateSimilarity(qKeywords, d.keywords);
        return { ...d, similarity: sim };
      })
      .filter(d => d.similarity > 0.15)
      .sort((a,b) => b.similarity - a.similarity)
      .slice(0, 5);

      return scored;
    } catch { return []; }
  },

  getDocumentCount() {
    if (!this.ready) return 0;
    return this.stats.documentsStored || 0;
  },

  async getUploadedFiles() {
    if (!this.ready) return [];
    try {
      const docs = await this._getAll('documents');
      const files = {};
      docs.forEach(d => {
        if (!files[d.fileName]) files[d.fileName] = { name: d.fileName, pages: 0, storedAt: d.storedAt };
        files[d.fileName].pages++;
      });
      return Object.values(files);
    } catch { return []; }
  },

  async deleteDocument(fileName) {
    if (!this.ready) return;
    try {
      const docs = await this._getAll('documents');
      const toDelete = docs.filter(d => d.fileName === fileName);
      for (const d of toDelete) {
        await this._delete('documents', d.id);
      }
      // Remove from uploaded files
      if (S.uploadedFiles) {
        S.uploadedFiles = S.uploadedFiles.filter(f => f.name !== fileName);
        saveAll();
      }
      console.log(`[MIND] Document deleted: ${fileName}`);
    } catch {}
  },

  // ═══════════════════════════════════
  //  FALLBACK ANSWER — Only when API fails
  //  Tries multiple strategies in order
  // ═══════════════════════════════════

  async fallbackAnswer(question) {
    if (!this.ready || !question) return null;

    console.log('[MIND] Fallback mode — API unavailable, brain answering');

    // Strategy 1: Tool execution (local state operations)
    const toolResult = this.executeToolLocally(question);
    if (toolResult) {
      this.stats.answered++;
      await this._saveStats();
      return toolResult;
    }

    // Strategy 2: Document search (if asking about uploaded content)
    const docResults = await this.searchDocuments(question);
    if (docResults.length > 0) {
      let reply = `📄 Aapke uploaded document se:\n\n`;
      docResults.forEach(d => {
        reply += `**${d.fileName} — Page ${d.pageNum}:**\n${d.content.slice(0, 500)}\n\n`;
      });
      reply += `_(Offline mode — stored documents se)_`;
      this.stats.answered++;
      await this._saveStats();
      return reply;
    }

    // Strategy 3: Similar Q&A from memory
    const similar = await this._findSimilar(question, 0.25, 3);
    if (similar.length > 0 && similar[0].similarity >= 0.3) {
      const best = similar[0];
      this.stats.answered++;
      this.stats.apiSaved++;
      await this._saveStats();
      return best.answer + `\n\n_(Offline mode — similar conversation se, ${Math.round(best.similarity*100)}% match)_`;
    }

    // Strategy 3.5: Direct text search in questions (for old memories)
    const allMemories = await this._getAll('memory');
    const qLower = question.toLowerCase();
    const directMatch = allMemories.find(m => {
      const mq = (m.question || '').toLowerCase();
      return mq.includes(qLower) || qLower.includes(mq) || 
             qLower.split(/\s+/).filter(w => w.length > 3).some(w => mq.includes(w));
    });
    if (directMatch && directMatch.answer) {
      this.stats.answered++;
      this.stats.apiSaved++;
      await this._saveStats();
      return directMatch.answer + `\n\n_(Offline mode — stored answer se)_`;
    }

    // Strategy 4: Knowledge-based Q&A (from aakash-final-knowledge.json)
    if (typeof _knowledgeBase !== 'undefined' && _knowledgeBase.length) {
      const qLower = question.toLowerCase().trim();
      const exact = _knowledgeBase.find(k => qLower.includes(k.question.toLowerCase()));
      if (exact) return exact.answer;
    }

    // Strategy 5: Generic offline response
    return `Abhi main offline mode mein hoon (API available nahi hai).\n\nMain aapki yeh cheezein abhi bhi kar sakta hoon:\n• Finance summary dekh sakte hain\n• Habit status check kar sakte hain\n• Task list dekh sakte hain\n• Uploaded documents search kar sakte hain\n\nAPI wapas aate hi full AI responses milenge.`;
  },

  // ═══════════════════════════════════
  //  KNOWLEDGE GRAPH
  // ═══════════════════════════════════

  async _updateKnowledgeGraph(keywords, category) {
    if (!keywords.length) return;
    try {
      for (const kw of keywords.slice(0, 5)) {
        const existing = await new Promise(r => {
          const s = this._tx('knowledge', 'readonly');
          if (!s) { r(null); return; }
          const req = s.get(kw);
          req.onsuccess = () => r(req.result);
          req.onerror = () => r(null);
        });

        if (existing) {
          existing.frequency = (existing.frequency || 0) + 1;
          existing.categories = [...new Set([...(existing.categories||[]), category])];
          const newConnections = keywords.filter(k => k !== kw).slice(0, 10);
          existing.connections = [...new Set([...(existing.connections||[]), ...newConnections])].slice(0, 20);
          await this._put('knowledge', existing);
        } else {
          await this._put('knowledge', {
            concept: kw,
            frequency: 1,
            categories: [category],
            connections: keywords.filter(k => k !== kw).slice(0, 10),
            createdAt: Date.now()
          });
        }
      }
    } catch {}
  },

  // ═══════════════════════════════════
  //  PERSONALITY & EMOTION (for system prompt)
  // ═══════════════════════════════════

  personalityPrompt() {
    // Build a concise personality instruction based on user profile
    return `[AAKASH PERSONALITY]\nRespectful, warm, helpful. User ko "aap" se address karo. Proper Hinglish mein baat karo. Har question ka complete answer do.`;
  },

  detectEmotion(text) {
    const t = (text || '').toLowerCase();
    if (/sad|dukhi|upset|cry|ro|depressed|alone|akela|tired|thak|frustrated|pareshan/i.test(t)) return 'sad';
    if (/happy|khush|great|amazing|awesome|mast|maza|celebrate/i.test(t)) return 'happy';
    if (/angry|gussa|irritated|annoyed|fed up|pagal/i.test(t)) return 'angry';
    if (/confused|samajh nahi|clear nahi|doubt|pata nahi/i.test(t)) return 'confused';
    if (/excited|wow|bhai|damn|amazing|cant wait/i.test(t)) return 'excited';
    if (/anxious|nervous|tension|stress|worried|chinta/i.test(t)) return 'anxious';
    return 'neutral';
  },

  emotionContext(emotion) {
    const map = {
      sad: '\n[EMOTION: User seems low — be extra empathetic and supportive. "Main samajh sakta hoon..."]',
      happy: '\n[EMOTION: User is happy — celebrate with them. "Bahut acchi baat hai!"]',
      angry: '\n[EMOTION: User seems frustrated — be calm and understanding. Let them vent, then help.]',
      confused: '\n[EMOTION: User is confused — explain with extra clarity and simple examples.]',
      excited: '\n[EMOTION: User is excited — match their energy positively!]',
      anxious: '\n[EMOTION: User seems stressed — be reassuring and practical. Break down problems into manageable steps.]',
      neutral: ''
    };
    return map[emotion] || '';
  },

  // ═══════════════════════════════════
  //  SMART CONTEXT BUILDER
  //  Keeps only relevant messages for API
  // ═══════════════════════════════════

  buildSmartContext(messages, currentQuestion, maxMessages) {
    if (messages.length <= maxMessages) return messages;

    // Always keep first 2 and last (maxMessages-2)
    const first = messages.slice(0, 2);
    const recent = messages.slice(-(maxMessages - 2));

    return [...first, ...recent];
  },

  // ═══════════════════════════════════
  //  CONVERSATION IMPORT (bulk learning)
  // ═══════════════════════════════════

  async importConversations(chatData) {
    if (!this.ready || !chatData) return { ok: false, count: 0 };
    let count = 0;
    try {
      const pairs = [];
      // Parse chat format: alternating user/assistant messages
      for (let i = 0; i < chatData.length - 1; i++) {
        if (chatData[i].role === 'user' && chatData[i+1].role === 'assistant') {
          pairs.push({ q: chatData[i].content, a: chatData[i+1].content });
        }
      }
      for (const pair of pairs) {
        await this.silentLearn(pair.q, pair.a);
        count++;
      }
      return { ok: true, count };
    } catch { return { ok: false, count }; }
  },

  // ═══════════════════════════════════
  //  STATS & STATUS
  // ═══════════════════════════════════

  async getStats() {
    const memCount = (await this._getAll('memory')).length;
    const docCount = (await this._getAll('documents')).length;
    const knCount = (await this._getAll('knowledge')).length;
    const profile = await this._getProfile();

    return {
      memories: memCount,
      documents: docCount,
      knowledgeNodes: knCount,
      totalMessages: profile.totalMessages || 0,
      topTopics: profile.topicFrequency || {},
      ...this.stats
    };
  },

  // ═══════════════════════════════════
  //  BACKWARD COMPATIBILITY
  //  Old functions that other files may call
  // ═══════════════════════════════════

  // Old brain.js had these — keep them so nothing breaks
  async learn(q, a, source) { return this.silentLearn(q, a); },
  async recall(q, threshold) { const r = await this._findSimilar(q, threshold || 0.3, 1); return r[0] || null; },
  async decide(text) { return { source: 'api', answer: null, confidence: 0 }; }, // Always defer to API
  rephrase(text) { return text; },
  enforcePersonality(text) { return text; },
  async deepLearn(q, a) { return this.silentLearn(q, a); },

  // ═══════════════════════════════════
  //  EXPORT & IMPORT (Data backup)
  // ═══════════════════════════════════

  async exportAll() {
    return {
      memories: await this._getAll('memory'),
      documents: await this._getAll('documents'),
      knowledge: await this._getAll('knowledge'),
      feedback: await this._getAll('feedback'),
      toolPatterns: await this._getAll('toolPatterns'),
      stats: this.stats,
      exportedAt: new Date().toISOString()
    };
  },

  async importAll(data) {
    if (!data || !this.ready) return false;
    try {
      if (data.memories) for (const m of data.memories) { delete m.id; await this._add('memory', m); }
      if (data.documents) for (const d of data.documents) { delete d.id; await this._add('documents', d); }
      if (data.knowledge) for (const k of data.knowledge) await this._put('knowledge', k);
      if (data.feedback) for (const f of data.feedback) { delete f.id; await this._add('feedback', f); }
      if (data.toolPatterns) for (const t of data.toolPatterns) { delete t.id; await this._add('toolPatterns', t); }
      if (data.stats) { this.stats = data.stats; await this._saveStats(); }
      return true;
    } catch { return false; }
  },

  // Clear all brain data
  async clearAll() {
    if (!this.db) return;
    const stores = ['memory', 'documents', 'knowledge', 'feedback', 'toolPatterns', 'profile'];
    for (const store of stores) {
      try {
        const s = this._tx(store, 'readwrite');
        if (s) s.clear();
      } catch {}
    }
    this.stats = { answered: 0, learned: 0, apiSaved: 0, documentsStored: 0 };
    console.log('[MIND] Brain cleared');
  }
};

// Initialize brain on load
MIND.init();
