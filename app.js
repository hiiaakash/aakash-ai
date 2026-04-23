// ════════════════════════════════════
//  AAKASH AI — App (app.js)
//  Main render + Navigation + Auth
// ════════════════════════════════════

// ── RENDER ──
function render() {
  const app = document.getElementById('app');
  if (!localStorage.getItem('ak_pin_hash')) { rPin(app, 'setup'); return; }
  if (!_ck) { rPin(app, 'check'); return; }
  if (!S.apiKey && !S.geminiKey) { rApi(app); return; }
  rMain(app);
}

// ── PIN SCREEN ──
let _pv = '', _pm = '', _ps = '';

function rPin(app, mode) {
  _pm = mode; _pv = ''; _ps = '';
  app.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:28px">
  <div style="width:68px;height:68px;border-radius:20px;background:var(--grad);display:flex;align-items:center;justify-content:center;margin-bottom:24px;animation:glow 3s infinite;font-size:30px;font-weight:800;color:#fff;box-shadow:var(--shadowLg)">A</div>
  <div style="font-size:26px;font-weight:700">AAKASH AI</div>
  <div style="font-size:12px;color:var(--t4);margin-bottom:4px;letter-spacing:4px;font-weight:600">PERSONAL ASSISTANT</div>
  <div id="pL" style="font-size:14px;color:var(--t3);margin:20px 0">${mode === 'setup' ? 'Create 4-digit PIN' : 'Enter PIN'}</div>
  <div id="dots" style="display:flex;gap:16px;margin-bottom:16px"><div class="dt"></div><div class="dt"></div><div class="dt"></div><div class="dt"></div></div>
  <style>.dt{width:16px;height:16px;border-radius:50%;border:2px solid var(--b1);background:var(--c1);transition:all .25s}.dt.on{background:var(--ac);border-color:var(--ac)}</style>
  <div id="pE" style="color:var(--r);font-size:13px;min-height:20px;margin-bottom:12px"></div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:260px">
  ${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(d => d === '' ? '<div></div>' : `<button onclick="pTap('${d}')" style="width:72px;height:72px;border-radius:16px;border:1.5px solid var(--b1);background:var(--c1);color:var(--t1);font-size:${d === '⌫' ? 18 : 24}px;font-weight:600;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow)">${d}</button>`).join('')}
  </div>
  <div style="margin-top:28px;font-size:13px;color:var(--t4)">🔒 AES-256 Encrypted</div></div>`;
}

window.pTap = async function(d) {
  if (d === '⌫') { _pv = _pv.slice(0, -1); } else if (_pv.length < 4) { _pv += d; }
  document.querySelectorAll('.dt').forEach((dot, i) => dot.classList.toggle('on', i < _pv.length));
  if (_pv.length < 4) return;
  const pin = _pv; _pv = ''; await new Promise(r => setTimeout(r, 200));
  if (_pm === 'setup') { _ps = pin; _pm = 'confirm'; document.getElementById('pL').textContent = 'Confirm PIN'; document.querySelectorAll('.dt').forEach(d => d.classList.remove('on')); }
  else if (_pm === 'confirm') {
    if (pin === _ps) { localStorage.setItem('ak_pin_hash', await hashPin(pin)); _ck = await CR.dk(pin); await saveAll(); render(); }
    else { document.getElementById('pE').textContent = "Didn't match"; _pm = 'setup'; document.getElementById('pL').textContent = 'Create 4-digit PIN'; document.querySelectorAll('.dt').forEach(d => d.classList.remove('on')); }
  } else {
    if (await hashPin(pin) === localStorage.getItem('ak_pin_hash')) { _ck = await CR.dk(pin); await loadAll(); render(); }
    else { document.getElementById('pE').textContent = 'Wrong PIN'; document.querySelectorAll('.dt').forEach(d => d.classList.remove('on')); }
  }
};

// ── API KEY SETUP ──
function rApi(app) {
  app.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:28px">
  <div style="font-size:48px;margin-bottom:20px">🔑</div>
  <div style="font-size:22px;font-weight:700;margin-bottom:4px">One-Time Setup</div>
  <p style="font-size:14px;color:var(--t3);margin-bottom:24px;text-align:center;max-width:300px;line-height:1.7">Keys encrypted save hongi. Kam se kam ek key zaroori hai.</p>
  <div style="width:100%;margin-bottom:12px"><label style="font-size:13px;color:var(--t2);font-weight:600;display:block;margin-bottom:6px">Claude API Key <span style="color:var(--t4);font-weight:400">(recommended)</span></label>
  <input id="kI" class="inp" placeholder="sk-ant-api03-..." style="font-family:IBM Plex Mono,monospace;font-size:14px"></div>
  <div style="width:100%;margin-bottom:12px"><label style="font-size:13px;color:var(--t2);font-weight:600;display:block;margin-bottom:6px">Gemini API Key <span style="color:var(--t4);font-weight:400">(free backup)</span></label>
  <input id="gI" class="inp" placeholder="AIza..." style="font-family:IBM Plex Mono,monospace;font-size:14px">
  <div style="font-size:11px;color:var(--t4);margin-top:4px">aistudio.google.com se free key lo</div></div>
  <div style="width:100%;margin-bottom:20px"><label style="font-size:13px;color:var(--t2);font-weight:600;display:block;margin-bottom:6px">ElevenLabs Key <span style="color:var(--t4);font-weight:400">(voice, optional)</span></label>
  <input id="elI" class="inp" placeholder="xi-..." style="font-family:IBM Plex Mono,monospace;font-size:14px"></div>
  <button onclick="const k=document.getElementById('kI').value.trim();const g=document.getElementById('gI').value.trim();if(k||g){S.apiKey=k;S.geminiKey=g;S.elKey=document.getElementById('elI').value.trim()||'';saveAll();render()}else{alert('Kam se kam ek API key daalo!')}" class="btn bp" style="width:100%;padding:14px;font-size:16px">Start AAKASH AI →</button>
  <div style="margin-top:16px;padding:12px;background:var(--c2);border-radius:8px;border:1px solid var(--b1);width:100%;font-size:12px;color:var(--t3);line-height:1.7">📍 Data stored in your browser (localStorage), encrypted. Nothing sent anywhere except AI calls.</div></div>`;
}

// ── MAIN APP ──
function rMain(app) {
  const allTabs = [{ k: 'chat', l: '💬 Chat' }, { k: 'vault', l: '📦 Vault' }, { k: 'notes', l: '📝 Notes' }, { k: 'finance', l: '💰' }, { k: 'habits', l: '📅' }, { k: 'timer', l: '⏰' }, { k: 'create', l: '＋' }];
  const visibleTabs = allTabs.filter(t => !(S.hiddenTabs || []).includes(t.k));
  if (S.hiddenTabs?.includes(tab)) tab = 'chat';

  const activeProj = S.activeProject ? S.projects.find(p => p.id === S.activeProject) : null;

  app.innerHTML = `
  <div style="padding:12px 16px 8px;flex-shrink:0;background:var(--c1);border-bottom:1px solid var(--b1);z-index:10">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:36px;height:36px;border-radius:12px;background:var(--grad);display:flex;align-items:center;justify-content:center;color:#fff;font-size:17px;font-weight:800;box-shadow:var(--shadow)">A</div>
        <div>
          <div style="font-size:16px;font-weight:700">AAKASH AI</div>
          <div style="display:flex;gap:5px;margin-top:2px">
            <span class="tag" style="background:var(--gBg);color:var(--g);border:1px solid var(--gBorder)">🔒 Encrypted</span>
            ${S.thinkMode ? '<span class="tag" style="background:var(--pBg);color:var(--p)">🤔 Deep</span>' : ''}
            ${activeProj ? `<span class="tag" style="background:var(--acBg);color:var(--ac);border:1px solid var(--acBorder)">📁 ${activeProj.name}</span>` : ''}
          </div>
        </div>
      </div>
      <div style="display:flex;gap:6px">
        <button onclick="openChatHistory()" style="width:36px;height:36px;border-radius:10px;background:var(--c2);border:1.5px solid var(--b1);font-size:16px;display:flex;align-items:center;justify-content:center" title="Chat History">💬</button>
        <button onclick="openProjects()" style="width:36px;height:36px;border-radius:10px;background:var(--c2);border:1.5px solid var(--b1);font-size:16px;display:flex;align-items:center;justify-content:center" title="Projects">📂</button>
        <button onclick="sT(gT()==='dark'?'light':'dark');render()" style="width:36px;height:36px;border-radius:10px;background:var(--c2);border:1.5px solid var(--b1);font-size:16px;display:flex;align-items:center;justify-content:center" title="Theme">${gT() === 'dark' ? '☀️' : '🌙'}</button>
        <button onclick="S.thinkMode=!S.thinkMode;saveAll();render()" style="width:36px;height:36px;border-radius:10px;background:${S.thinkMode ? 'var(--pBg)' : 'var(--c2)'};border:1.5px solid ${S.thinkMode ? 'rgba(124,58,237,.3)' : 'var(--b1)'};color:${S.thinkMode ? 'var(--p)' : 'var(--t4)'};font-size:16px;display:flex;align-items:center;justify-content:center" title="Deep Think">🤔</button>
        <button onclick="openCall()" style="width:36px;height:36px;border-radius:10px;background:var(--gBg);border:1.5px solid var(--gBorder);color:var(--g);font-size:16px;display:flex;align-items:center;justify-content:center">📞</button>
        <button onclick="openSettings()" style="width:36px;height:36px;border-radius:10px;background:var(--c2);border:1.5px solid var(--b1);color:var(--t3);font-size:16px;display:flex;align-items:center;justify-content:center">⚙️</button>
      </div>
    </div>
    <div style="display:flex;gap:3px;background:var(--bg);border-radius:10px;padding:3px">
    ${visibleTabs.map(t => `<button onclick="tab='${t.k}';rc()" style="flex:1;padding:8px 0;border-radius:8px;background:${tab === t.k ? 'var(--c1)' : 'transparent'};color:${tab === t.k ? 'var(--t1)' : 'var(--t4)'};font-size:13px;font-weight:${tab === t.k ? '600' : '400'};${tab === t.k ? 'box-shadow:var(--shadow)' : ''}">${t.l}</button>`).join('')}
    </div>
  </div>
  <div id="ct" style="flex:1;display:flex;flex-direction:column;min-height:0;overflow:hidden"></div>`;
  rc();
}

function rc() {
  const ct = document.getElementById('ct'); if (!ct) return;
  ({ chat: rChat, vault: rVault, notes: rNotes, finance: rFinance, habits: rHabits, timer: rTimer, create: rCreate })[tab]?.(ct);
}

// ── INIT ──
sT(gT());
applyCustom();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
render();
