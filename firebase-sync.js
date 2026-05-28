// ════════════════════════════════════════════════════════════
//  AAKASH AI v3 — Firebase Cloud Sync (firebase-sync.js)
//  UPDATED: Phone-based userId, State + Brain sync,
//  Permanent cloud backup (Change 7)
//  ─────────────────────────────────────────────────────────
//  User ID = Phone number (permanent, cross-device)
//  Syncs: Brain (IndexedDB) + State (encrypted) + Documents
//  App delete → reinstall → phone + PIN → all data restored
// ════════════════════════════════════════════════════════════

const FIRE = {
  db: null,
  ready: false,
  userId: null,
  syncQueue: [],
  syncing: false,

  config: {
    apiKey: "AIzaSyAttq7-PFbLm_wL40ISKtELjTEKkYPoi6c",
    authDomain: "aakash-secret.firebaseapp.com",
    projectId: "aakash-secret",
    storageBucket: "aakash-secret.firebasestorage.app",
    messagingSenderId: "751180219002",
    appId: "1:751180219002:web:ba41a8ab6aababe582b1c3"
  },

  // ════════════════════════════════════
  //  INIT
  // ════════════════════════════════════

  async init() {
    try {
      if (!window._firebaseLoaded) {
        await this._loadScript('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
        await this._loadScript('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js');
        window._firebaseLoaded = true;
      }
      if (!firebase.apps.length) firebase.initializeApp(this.config);
      this.db = firebase.firestore();
      try { await this.db.enablePersistence({ synchronizeTabs: true }); } catch (e) { console.log('[FIRE] Persistence:', e.code); }

      // User ID = Phone number (Change 8) — permanent, cross-device
      this.userId = localStorage.getItem('ak_user_phone') || localStorage.getItem('ak_pin_hash');
      if (!this.userId) {
        console.log('[FIRE] No user ID yet — will init after login');
        return;
      }
      // Sanitize phone for Firestore doc ID (no special chars)
      this.userId = this.userId.replace(/[^a-zA-Z0-9]/g, '_');

      this.ready = true;
      console.log('[FIRE] Connected — User:', this.userId.slice(0,8) + '...');
      await this._processQueue();
    } catch (e) {
      console.error('[FIRE] Init failed:', e);
      this.ready = false;
    }
  },

  _loadScript(url) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${url}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = url; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  },

  async onLogin() {
    this.userId = (localStorage.getItem('ak_user_phone') || localStorage.getItem('ak_pin_hash') || '').replace(/[^a-zA-Z0-9]/g, '_');
    if (this.userId && this.db) {
      this.ready = true;
      console.log('[FIRE] User logged in — syncing');

      // Register user in admin tracking
      await this._registerUser();

      // Sync everything
      await this._processQueue();
      await this.syncState();
      await this.fullSync();
    }
  },

  // ════════════════════════════════════
  //  USER REGISTRATION (for Admin tracking - Change 19)
  // ════════════════════════════════════

  async _registerUser() {
    if (!this.ready) return;
    try {
      const userDoc = this.db.collection('users').doc(this.userId);
      await userDoc.set({
        phone: localStorage.getItem('ak_user_phone') || '',
        name: S.userName || '',
        lastActive: new Date().toISOString(),
        joinedAt: S.userJoinedAt || new Date().toISOString(),
        deviceInfo: navigator.userAgent.slice(0, 100),
        appVersion: 'v3'
      }, { merge: true });

      // Update location if available
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          userDoc.update({
            location: { lat: pos.coords.latitude, lng: pos.coords.longitude, updatedAt: new Date().toISOString() }
          }).catch(() => {});
        }, () => {}, { timeout: 5000 });
      }
    } catch (e) { console.log('[FIRE] User registration error:', e); }
  },

  // ════════════════════════════════════
  //  COLLECTIONS
  // ════════════════════════════════════

  _col(name) {
    if (!this.db || !this.userId) return null;
    return this.db.collection('users').doc(this.userId).collection(name);
  },

  // ════════════════════════════════════
  //  STATE SYNC — Encrypted state to cloud (Change 7)
  //  App delete → phone + PIN → state restored
  // ════════════════════════════════════

  async syncState() {
    if (!this.ready) return;
    try {
      const stateDoc = this.db.collection('users').doc(this.userId).collection('appData').doc('state');

      // Save current state to cloud
      const stateToSync = {
        chats: S.chats || [],
        entries: S.entries || [],
        notes: S.notes || [],
        finance: S.finance || {},
        habits: S.habits || [],
        habitLog: S.habitLog || {},
        skills: S.skills || [],
        businessIdeas: S.businessIdeas || [],
        lifeLessons: S.lifeLessons || [],
        memoryFacts: S.memoryFacts || [],
        customRules: S.customRules || [],
        apiKeys: (S.apiKeys || []).map(k => ({ ...k, key: '***' })), // Don't sync actual keys
        connect: S.connect || {},
        achievements: S.achievements || {},
        uploadedFiles: S.uploadedFiles || [],
        userName: S.userName || '',
        userPhone: S.userPhone || '',
        userJoinedAt: S.userJoinedAt || '',
        secChats: S.secChats || {},
        accountability: S.accountability || {},
        notifSettings: S.notifSettings || {},
        updatedAt: new Date().toISOString()
      };

      await stateDoc.set(stateToSync);
      console.log('[FIRE] State synced to cloud');
    } catch (e) {
      console.error('[FIRE] State sync failed:', e);
    }
  },

  async restoreState() {
    if (!this.ready) return null;
    try {
      const stateDoc = await this.db.collection('users').doc(this.userId).collection('appData').doc('state').get();
      if (stateDoc.exists) {
        console.log('[FIRE] State restored from cloud');
        return stateDoc.data();
      }
      return null;
    } catch (e) {
      console.error('[FIRE] State restore failed:', e);
      return null;
    }
  },

  // ════════════════════════════════════
  //  PARTNER CHAT — Real-time messaging (Change 9)
  // ════════════════════════════════════

  async sendPartnerMessage(partnerCode, message) {
    if (!this.ready) return false;
    try {
      const chatRef = this.db.collection('partnerChats').doc(this._getChatId(partnerCode));
      await chatRef.collection('messages').add({
        from: this.userId,
        content: message,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (e) {
      console.error('[FIRE] Send partner msg failed:', e);
      return false;
    }
  },

  listenPartnerMessages(partnerCode, callback) {
    if (!this.ready) return null;
    try {
      const chatRef = this.db.collection('partnerChats').doc(this._getChatId(partnerCode));
      return chatRef.collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot(snap => {
          const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          callback(msgs);
        });
    } catch (e) { return null; }
  },

  async deletePartnerChat(partnerCode) {
    if (!this.ready) return;
    try {
      const chatRef = this.db.collection('partnerChats').doc(this._getChatId(partnerCode));
      const msgs = await chatRef.collection('messages').get();
      const batch = this.db.batch();
      msgs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log('[FIRE] Partner chat deleted');
    } catch (e) { console.error('[FIRE] Delete partner chat failed:', e); }
  },

  _getChatId(partnerCode) {
    // Consistent chat ID regardless of who initiated
    const codes = [this.userId, partnerCode.replace(/[^a-zA-Z0-9]/g, '_')].sort();
    return codes.join('_');
  },

  // ════════════════════════════════════
  //  PANIC BUTTON — Both sides wipe (Secret Chat)
  // ════════════════════════════════════

  async sendPanicSignal(partnerCode) {
    if (!this.ready) return;
    try {
      const chatId = this._getChatId(partnerCode);
      await this.db.collection('panicSignals').doc(chatId).set({
        from: this.userId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (e) { console.error('[FIRE] Panic signal failed:', e); }
  },

  listenPanicSignal(partnerCode, callback) {
    if (!this.ready) return null;
    try {
      const chatId = this._getChatId(partnerCode);
      return this.db.collection('panicSignals').doc(chatId)
        .onSnapshot(snap => {
          if (snap.exists) {
            const data = snap.data();
            // Only trigger if signal is from partner (not from self)
            if (data.from !== this.userId) {
              callback();
              // Clean up signal after processing
              snap.ref.delete().catch(() => {});
            }
          }
        });
    } catch (e) { return null; }
  },

  // ════════════════════════════════════
  //  CONNECT CODE — Generate & Verify (Change 9)
  // ════════════════════════════════════

  async generateConnectCode() {
    if (!this.ready) return null;
    const code = 'AK-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    try {
      await this.db.collection('connectCodes').doc(code).set({
        userId: this.userId,
        createdAt: new Date().toISOString()
      });
      return code;
    } catch (e) { return null; }
  },

  async verifyConnectCode(code) {
    if (!this.ready) return null;
    try {
      const doc = await this.db.collection('connectCodes').doc(code).get();
      if (doc.exists) return doc.data();
      return null;
    } catch (e) { return null; }
  },

  // ════════════════════════════════════
  //  ADMIN — Get all users (Change 19)
  // ════════════════════════════════════

  async getAllUsers() {
    if (!this.ready) return [];
    try {
      const snap = await this.db.collection('users').get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) { return []; }
  },

  async broadcastMessage(message) {
    if (!this.ready) return false;
    try {
      await this.db.collection('broadcasts').add({
        message,
        from: this.userId,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (e) { return false; }
  },

  // ════════════════════════════════════
  //  WRITE / READ / DELETE (unchanged)
  // ════════════════════════════════════

  async save(collection, id, data) {
    if (!this.ready) { this.syncQueue.push({ collection, id, data, action:'save' }); return; }
    try {
      const col = this._col(collection);
      if (!col) return;
      await col.doc(String(id)).set(data, { merge: true });
    } catch (e) {
      this.syncQueue.push({ collection, id, data, action:'save' });
    }
  },

  async get(collection, id) {
    if (!this.ready) return null;
    try {
      const col = this._col(collection);
      if (!col) return null;
      const doc = await col.doc(String(id)).get();
      return doc.exists ? doc.data() : null;
    } catch (e) { return null; }
  },

  async getAll(collection) {
    if (!this.ready) return [];
    try {
      const col = this._col(collection);
      if (!col) return [];
      const snap = await col.get();
      return snap.docs.map(d => ({ _fireId: d.id, ...d.data() }));
    } catch (e) { return []; }
  },

  async remove(collection, id) {
    if (!this.ready) return;
    try {
      const col = this._col(collection);
      if (!col) return;
      await col.doc(String(id)).delete();
    } catch (e) {}
  },

  async pushAll(store, items) {
    if (!this.ready || !items.length) return;
    const col = this._col(store);
    if (!col) return;
    const batch = this.db.batch();
    let count = 0;
    for (const item of items) {
      const docId = String(item.id || item.concept || item.key || Date.now() + '_' + count);
      batch.set(col.doc(docId), item, { merge: true });
      count++;
      if (count >= 490) { await batch.commit(); count = 0; }
    }
    if (count > 0) await batch.commit();
  },

  async pullAll(store) { return await this.getAll(store); },

  async _processQueue() {
    if (this.syncing || !this.ready || !this.syncQueue.length) return;
    this.syncing = true;
    const queue = [...this.syncQueue];
    this.syncQueue = [];
    for (const item of queue) {
      try {
        if (item.action === 'save') await this.save(item.collection, item.id, item.data);
        else if (item.action === 'delete') await this.remove(item.collection, item.id);
      } catch (e) {}
    }
    this.syncing = false;
  },

  // ════════════════════════════════════
  //  FULL BRAIN SYNC (unchanged logic + documents)
  // ════════════════════════════════════

  async fullSync() {
    if (!this.ready || typeof MIND === 'undefined' || !MIND.ready) return { ok: false };
    try {
      const localMemory = await MIND._getAll('memory');
      const localKnowledge = await MIND._getAll('knowledge');
      const localDocs = await MIND._getAll('documents');
      const localFeedback = await MIND._getAll('feedback');

      if (localMemory.length) await this.pushAll('memory', localMemory);
      if (localKnowledge.length) await this.pushAll('knowledge', localKnowledge);
      if (localDocs.length) await this.pushAll('documents', localDocs);
      if (localFeedback.length) await this.pushAll('feedback', localFeedback);

      // Pull cloud → local
      const cloudMemory = await this.pullAll('memory');
      const cloudKnowledge = await this.pullAll('knowledge');
      const cloudDocs = await this.pullAll('documents');

      let newFromCloud = 0;
      for (const cm of cloudMemory) {
        const localMatch = localMemory.find(lm => lm.question === cm.question || (lm.id && String(lm.id) === cm._fireId));
        if (!localMatch) { delete cm._fireId; await MIND._add('memory', cm); newFromCloud++; }
        else if (cm.timestamp > (localMatch.timestamp || 0)) { delete cm._fireId; cm.id = localMatch.id; await MIND._put('memory', cm); }
      }
      for (const ck of cloudKnowledge) { delete ck._fireId; await MIND._put('knowledge', ck); }
      for (const cd of cloudDocs) {
        const localMatch = localDocs.find(ld => ld.fileName === cd.fileName && ld.pageNum === cd.pageNum);
        if (!localMatch) { delete cd._fireId; await MIND._add('documents', cd); newFromCloud++; }
      }

      console.log(`[FIRE] Full sync done — ${newFromCloud} new from cloud`);
      return { ok: true, newFromCloud };
    } catch (e) {
      console.error('[FIRE] Full sync failed:', e);
      return { ok: false };
    }
  }
};

// Auto-sync state every 5 minutes
setInterval(() => { if (FIRE.ready && typeof _ck !== 'undefined' && _ck) FIRE.syncState(); }, 5 * 60 * 1000);

FIRE.init();
