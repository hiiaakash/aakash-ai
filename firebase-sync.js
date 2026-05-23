// ════════════════════════════════════════════════════════════
//  AAKASH AI — Firebase Cloud Sync (firebase-sync.js)
//  Syncs brain data to Firestore — works on ANY device
//  ─────────────────────────────────────────────────────────
//  WHY: IndexedDB = local only. Firebase = everywhere.
//  HOW: Every brain write → IndexedDB + Firestore both.
//       On new device → pulls all data from Firestore.
// ════════════════════════════════════════════════════════════

const FIRE = {
  db: null,        // Firestore instance
  ready: false,
  userId: null,    // PIN hash = unique user ID (same across devices)
  syncQueue: [],   // Queue for offline writes
  syncing: false,

  // ── Firebase Config ──
  config: {
    apiKey: "AIzaSyAttq7-PFbLm_wL40ISKtELjTEKkYPoi6c",
    authDomain: "aakash-secret.firebaseapp.com",
    projectId: "aakash-secret",
    storageBucket: "aakash-secret.firebasestorage.app",
    messagingSenderId: "751180219002",
    appId: "1:751180219002:web:ba41a8ab6aababe582b1c3"
  },

  // ════════════════════════════════════
  //  INIT — Load Firebase SDK + Connect
  // ════════════════════════════════════
  async init() {
    try {
      // Load Firebase SDK from CDN (compact ESM compat bundle)
      if (!window._firebaseLoaded) {
        await this._loadScript('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
        await this._loadScript('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js');
        window._firebaseLoaded = true;
      }

      // Initialize Firebase app (only once)
      if (!firebase.apps.length) {
        firebase.initializeApp(this.config);
      }

      this.db = firebase.firestore();

      // Enable offline persistence — works without internet too
      try {
        await this.db.enablePersistence({ synchronizeTabs: true });
      } catch (e) {
        // Multi-tab or already enabled — fine
        console.log('[FIRE] Persistence note:', e.code);
      }

      // User ID = PIN hash (same PIN = same data on any device)
      this.userId = localStorage.getItem('ak_pin_hash');
      if (!this.userId) {
        console.log('[FIRE] No PIN hash yet — will init after login');
        return;
      }

      this.ready = true;
      console.log('[FIRE] Firebase connected — cloud brain active');

      // Process any queued writes
      await this._processQueue();

    } catch (e) {
      console.error('[FIRE] Init failed:', e);
      this.ready = false;
    }
  },

  // ── Load external script ──
  _loadScript(url) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${url}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = url;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  },

  // ── Re-init after PIN login (userId becomes available) ──
  async onLogin() {
    this.userId = localStorage.getItem('ak_pin_hash');
    if (this.userId && this.db) {
      this.ready = true;
      console.log('[FIRE] User logged in — syncing brain');
      await this._processQueue();
    }
  },

  // ════════════════════════════════════
  //  COLLECTIONS — Firestore structure
  //  users/{userId}/memory/{id}
  //  users/{userId}/knowledge/{concept}
  //  users/{userId}/profile/{key}
  //  users/{userId}/feedback/{id}
  // ════════════════════════════════════

  _col(name) {
    if (!this.db || !this.userId) return null;
    return this.db.collection('users').doc(this.userId).collection(name);
  },

  // ════════════════════════════════════
  //  WRITE — Save to Firestore
  // ════════════════════════════════════

  async save(collection, id, data) {
    if (!this.ready) {
      // Queue for later
      this.syncQueue.push({ collection, id, data, action: 'save' });
      return;
    }
    try {
      const col = this._col(collection);
      if (!col) return;
      const docId = String(id);
      await col.doc(docId).set(data, { merge: true });
    } catch (e) {
      console.error(`[FIRE] Save ${collection}/${id} failed:`, e);
      this.syncQueue.push({ collection, id, data, action: 'save' });
    }
  },

  // ════════════════════════════════════
  //  READ — Get from Firestore
  // ════════════════════════════════════

  async get(collection, id) {
    if (!this.ready) return null;
    try {
      const col = this._col(collection);
      if (!col) return null;
      const doc = await col.doc(String(id)).get();
      return doc.exists ? doc.data() : null;
    } catch (e) {
      console.error(`[FIRE] Get ${collection}/${id} failed:`, e);
      return null;
    }
  },

  async getAll(collection) {
    if (!this.ready) return [];
    try {
      const col = this._col(collection);
      if (!col) return [];
      const snap = await col.get();
      return snap.docs.map(d => ({ _fireId: d.id, ...d.data() }));
    } catch (e) {
      console.error(`[FIRE] GetAll ${collection} failed:`, e);
      return [];
    }
  },

  // ════════════════════════════════════
  //  DELETE — Remove from Firestore
  // ════════════════════════════════════

  async remove(collection, id) {
    if (!this.ready) return;
    try {
      const col = this._col(collection);
      if (!col) return;
      await col.doc(String(id)).delete();
    } catch (e) {
      console.error(`[FIRE] Delete ${collection}/${id} failed:`, e);
    }
  },

  // ════════════════════════════════════
  //  BULK SYNC — Push all local → cloud
  //  Called on first connect or manual sync
  // ════════════════════════════════════

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
      // Firestore batch limit = 500
      if (count >= 490) {
        await batch.commit();
        count = 0;
      }
    }

    if (count > 0) await batch.commit();
    console.log(`[FIRE] Pushed ${items.length} items to ${store}`);
  },

  // ════════════════════════════════════
  //  PULL — Cloud → Local (new device)
  // ════════════════════════════════════

  async pullAll(store) {
    return await this.getAll(store);
  },

  // ── Process offline queue ──
  async _processQueue() {
    if (this.syncing || !this.ready || !this.syncQueue.length) return;
    this.syncing = true;
    const queue = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of queue) {
      try {
        if (item.action === 'save') {
          await this.save(item.collection, item.id, item.data);
        } else if (item.action === 'delete') {
          await this.remove(item.collection, item.id);
        }
      } catch (e) {
        console.error('[FIRE] Queue item failed:', e);
      }
    }
    this.syncing = false;
  },

  // ════════════════════════════════════
  //  FULL BRAIN SYNC
  //  Merges local IndexedDB ↔ Firestore
  // ════════════════════════════════════

  async fullSync() {
    if (!this.ready || typeof MIND === 'undefined' || !MIND.ready) return { ok: false };

    try {
      // 1. Push local brain data to cloud
      const localMemory = await MIND._getAll('memory');
      const localKnowledge = await MIND._getAll('knowledge');
      const localProfile = await MIND._get('profile', 'user');
      const localFeedback = await MIND._getAll('feedback');

      if (localMemory.length) await this.pushAll('memory', localMemory);
      if (localKnowledge.length) await this.pushAll('knowledge', localKnowledge);
      if (localProfile) await this.save('profile', 'user', localProfile);
      if (localFeedback.length) await this.pushAll('feedback', localFeedback);

      // 2. Pull cloud data that local doesn't have
      const cloudMemory = await this.pullAll('memory');
      const cloudKnowledge = await this.pullAll('knowledge');
      const cloudProfile = await this.get('profile', 'user');

      // Merge cloud → local (cloud wins for newer data)
      let newFromCloud = 0;
      for (const cm of cloudMemory) {
        const localMatch = localMemory.find(lm =>
          lm.question === cm.question || (lm.id && String(lm.id) === cm._fireId)
        );
        if (!localMatch) {
          // New from cloud — add to local
          delete cm._fireId;
          await MIND._put('memory', cm);
          newFromCloud++;
        } else if (cm.timestamp > (localMatch.timestamp || 0)) {
          // Cloud is newer — update local
          delete cm._fireId;
          cm.id = localMatch.id;
          await MIND._put('memory', cm);
        }
      }

      for (const ck of cloudKnowledge) {
        delete ck._fireId;
        await MIND._put('knowledge', ck);
      }

      if (cloudProfile) {
        const lp = localProfile || {};
        // Merge: keep higher counts
        if ((cloudProfile.totalMessages || 0) > (lp.totalMessages || 0)) {
          await MIND._put('profile', cloudProfile);
        }
      }

      console.log(`[FIRE] Full sync done — ${newFromCloud} new memories from cloud`);
      return { ok: true, newFromCloud, totalCloud: cloudMemory.length, totalLocal: localMemory.length };

    } catch (e) {
      console.error('[FIRE] Full sync failed:', e);
      return { ok: false, error: e.message };
    }
  }
};

// ── Auto-init Firebase when script loads ──
FIRE.init();
