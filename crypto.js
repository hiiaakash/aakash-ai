// ════════════════════════════════════
//  AAKASH AI — Encryption (crypto.js)
//  AES-256-GCM · PIN-based security
// ════════════════════════════════════

const CR = {
  async dk(p) {
    const e = new TextEncoder();
    const k = await crypto.subtle.importKey('raw', e.encode(p.padEnd(16, '0')), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: e.encode('AAKASH_2024'), iterations: 100000, hash: 'SHA-256' },
      k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
  },

  async en(d, k) {
    const e = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, e.encode(JSON.stringify(d)));
    const c = new Uint8Array(iv.length + enc.byteLength);
    c.set(iv);
    c.set(new Uint8Array(enc), iv.length);
    return btoa(String.fromCharCode(...c));
  },

  async de(b, k) {
    try {
      const r = Uint8Array.from(atob(b), c => c.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(
        await crypto.subtle.decrypt({ name: 'AES-GCM', iv: r.slice(0, 12) }, k, r.slice(12))
      ));
    } catch { return null; }
  }
};

let _ck = null;

const EDB = {
  async save(k, v) {
    if (!_ck) return;
    localStorage.setItem('ak_' + k, await CR.en(v, _ck));
  },
  async load(k) {
    if (!_ck) return null;
    const r = localStorage.getItem('ak_' + k);
    return r ? CR.de(r, _ck) : null;
  }
};

async function hashPin(p) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p + 'AAKASH'));
  return btoa(String.fromCharCode(...new Uint8Array(h)));
}
