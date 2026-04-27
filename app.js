// ════════════════════════════════════
//  AAKASH AI v2 — App (app.js)
//  5 tabs + header create + sidebar
// ════════════════════════════════════

let _sidebarOpen = false, _createOpen = false;

function render() {
  const app = document.getElementById('app');
  if (!localStorage.getItem('ak_pin_hash')) { rPin(app, 'setup'); return; }
  if (!_ck) { rPin(app, 'check'); return; }
  rMain(app);
}

// ── PIN ──
let _pv = '', _pm = '', _ps = '';
function rPin(app, mode) {
  _pm = mode; _pv = '';
  app.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:28px;background:var(--bg)">
  <div style="width:56px;height:56px;border-radius:16px;background:var(--grad);display:flex;align-items:center;justify-content:center;margin-bottom:20px;color:#fff">${icon('star',24)}</div>
  <div style="font-size:22px;font-weight:700;letter-spacing:-.5px">AAKASH AI</div>
  <div style="font-size:10px;color:var(--t4);letter-spacing:3px;font-weight:500;margin-top:2px;margin-bottom:24px">PERSONAL ASSISTANT</div>
  <div id="pL" style="font-size:13px;color:var(--t3);margin-bottom:16px">${mode === 'setup' ? 'Create 4-digit PIN' : 'Enter PIN'}</div>
  <div id="dots" style="display:flex;gap:14px;margin-bottom:16px"><div class="dt"></div><div class="dt"></div><div class="dt"></div><div class="dt"></div></div>
  <style>.dt{width:14px;height:14px;border-radius:50%;border:2px solid var(--b1);background:var(--c1);transition:all .25s}.dt.on{background:var(--ac);border-color:var(--ac)}</style>
  <div id="pE" style="color:var(--r);font-size:12px;min-height:18px;margin-bottom:12px"></div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:240px">
  ${[1,2,3,4,5,6,7,8,9,'',0,'del'].map(d => d === '' ? '<div></div>' : `<button onclick="pTap('${d}')" style="width:64px;height:64px;border-radius:14px;border:1.5px solid var(--b1);background:var(--c1);color:var(--t1);font-size:${d==='del'?14:22}px;font-weight:500;display:flex;align-items:center;justify-content:center">${d==='del'?I.back:d}</button>`).join('')}
  </div>
  <div style="margin-top:24px;font-size:10px;color:var(--t4);display:flex;align-items:center;gap:4px">${I.lock} AES-256 Encrypted</div></div>`;
}

window.pTap = async function(d) {
  if (d === 'del') { _pv = _pv.slice(0,-1); } else if (_pv.length < 4) { _pv += d; }
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

// ── CREATE POPUP ──
function renderCreatePopup() {
  if (!_createOpen) return '';
  const items = [
    { k:'task', icon:'check', l:'New Task' },
    { k:'goal', icon:'target', l:'New Goal' },
    { k:'note', icon:'notes', l:'New Note' },
    { k:'idea', icon:'idea', l:'New Idea' },
  ];
  if (hasCap('image_gen')) items.push({ k:'ai_image', icon:'image', l:'AI Image' });
  if (hasCap('tts')) items.push({ k:'ai_voice', icon:'voice', l:'AI Voice' });
  return `<div style="position:fixed;inset:0;z-index:60;display:flex;align-items:end;justify-content:center;animation:fadeIn .15s" onclick="_createOpen=false;render()">
    <div style="background:var(--c1);border-radius:16px 16px 0 0;padding:16px;width:100%;max-width:480px;border:1px solid var(--b1);border-bottom:none;box-shadow:var(--shadowLg)" onclick="event.stopPropagation()">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:15px;font-weight:600">Create</div>
        <button onclick="_createOpen=false;render()" style="color:var(--t3)">${I.close}</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px">
      ${items.map(t => `<button onclick="_createOpen=false;quickCreate('${t.k}')" style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:10px;background:var(--c2);border:1px solid var(--b1);width:100%;text-align:left;font-size:14px;font-weight:500;color:var(--t1)">
        <span style="color:var(--t3)">${I[t.icon]}</span> ${t.l}
      </button>`).join('')}
      </div>
    </div>
  </div>`;
}

window.quickCreate = function(type) {
  if (type === 'ai_image') { tab = 'chat'; render(); setTimeout(() => sendMsg('generate an image'), 100); return; }
  if (type === 'ai_voice') { tab = 'chat'; render(); return; }
  const title = prompt(type === 'task' ? 'Task:' : type === 'goal' ? 'Goal:' : type === 'note' ? 'Note title:' : 'Idea:');
  if (!title?.trim()) return;
  S.entries.unshift({ id:Date.now(), type, title:title.trim(), content:'', done:false, createdAt:new Date().toISOString() });
  saveAll(); tab = 'vault'; render();
};

// ── SIDEBAR ──
function renderSidebar() {
  const projectChats = S.activeProject ? getChatsByProject(S.activeProject) : S.chats;
  const activeProj = S.activeProject ? S.projects.find(p => p.id === S.activeProject) : null;
  return `<div id="sidebar" style="position:fixed;inset:0;z-index:50;display:${_sidebarOpen?'flex':'none'};animation:fadeIn .15s">
    <div style="width:280px;height:100%;background:var(--c1);border-right:1px solid var(--b1);display:flex;flex-direction:column;box-shadow:var(--shadowLg);z-index:51">
      <div style="padding:14px;border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:8px">
        ${aiAvatar(28)}
        <div style="flex:1;font-size:14px;font-weight:600">AAKASH AI</div>
        <button onclick="toggleSidebar()" style="color:var(--t3)">${I.close}</button>
      </div>
      <div style="padding:8px 10px"><button onclick="createNewChat(${S.activeProject||'null'});toggleSidebar();render()" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;width:100%;border-radius:10px;background:var(--grad);color:#fff;font-size:13px;font-weight:500;border:none">${I.plus} New chat</button></div>
      <div style="padding:4px 10px">
        <div style="font-size:9px;font-weight:600;color:var(--t4);text-transform:uppercase;letter-spacing:.8px;padding:4px 6px">Projects</div>
        <div onclick="switchProject(null);toggleSidebar();render()" style="padding:7px 10px;border-radius:6px;font-size:12px;font-weight:${!S.activeProject?'600':'400'};color:${!S.activeProject?'var(--ac)':'var(--t2)'};background:${!S.activeProject?'var(--acBg)':'transparent'};cursor:pointer">${I.chat} All chats <span style="color:var(--t4);font-size:10px">(${S.chats.filter(c=>!c.projectId).length})</span></div>
        ${S.projects.map(p => `<div onclick="switchProject(${p.id});toggleSidebar();render()" style="padding:7px 10px;border-radius:6px;font-size:12px;cursor:pointer;font-weight:${S.activeProject===p.id?'600':'400'};color:${S.activeProject===p.id?'var(--ac)':'var(--t2)'};background:${S.activeProject===p.id?'var(--acBg)':'transparent'}">${I.folder} ${p.name} <span style="color:var(--t4);font-size:10px">(${getChatsByProject(p.id).length})</span></div>`).join('')}
        <button onclick="toggleSidebar();openProjects()" style="padding:7px 10px;font-size:11px;color:var(--t4);width:100%;text-align:left;border-radius:6px">${I.plus} Manage</button>
      </div>
      <div style="height:1px;background:var(--b1);margin:4px 12px"></div>
      <div style="flex:1;overflow-y:auto;padding:4px 10px">
        <div style="font-size:9px;font-weight:600;color:var(--t4);text-transform:uppercase;letter-spacing:.8px;padding:4px 6px">Recent</div>
        ${projectChats.length===0?'<div style="text-align:center;padding:20px;color:var(--t4);font-size:11px">No chats</div>':
        projectChats.slice(0,30).map(c => `<div style="padding:7px 10px;border-radius:6px;margin-bottom:1px;cursor:pointer;background:${S.activeChat===c.id?'var(--acBg2)':'transparent'};display:flex;align-items:center;gap:6px" onclick="loadChat(${c.id});toggleSidebar();render()">
          <span style="color:${S.activeChat===c.id?'var(--ac)':'var(--t4)'}">${I.chat}</span>
          <div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:${S.activeChat===c.id?'600':'400'};color:${S.activeChat===c.id?'var(--ac)':'var(--t1)'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.title}</div>
          <div style="font-size:9px;color:var(--t4)">${_timeAgo(c.updatedAt)}</div></div>
          <button onclick="event.stopPropagation();if(confirm('Delete?')){deleteChat(${c.id});toggleSidebar();render()}" style="color:var(--t4);font-size:10px;padding:2px">${I.trash}</button>
        </div>`).join('')}
      </div>
      <div style="padding:8px 10px;border-top:1px solid var(--b1);display:flex;gap:6px">
        <button onclick="toggleSidebar();openSettings()" style="flex:1;padding:7px;border-radius:8px;background:var(--c2);border:1px solid var(--b1);font-size:11px;color:var(--t3);display:flex;align-items:center;justify-content:center;gap:4px">${I.settings} Settings</button>
        <button onclick="const ct=gT();const themes=['clean-white','midnight-dark','ocean-blue','violet-dream','mint-fresh','neon-night'];const ni=(themes.indexOf(ct)+1)%themes.length;sT(themes[ni]);toggleSidebar();render()" style="flex:1;padding:7px;border-radius:8px;background:var(--c2);border:1px solid var(--b1);font-size:11px;color:var(--t3);display:flex;align-items:center;justify-content:center;gap:4px">${I.palette} Theme</button>
      </div>
    </div>
    <div onclick="toggleSidebar()" style="flex:1;background:var(--overlay)"></div>
  </div>`;
}
window.toggleSidebar = function() { _sidebarOpen = !_sidebarOpen; const sb = document.getElementById('sidebar'); if (sb) sb.style.display = _sidebarOpen ? 'flex' : 'none'; else if (_sidebarOpen) render(); };

// ── DEMO BANNER ──
function demoBanner() {
  if (!isDemoMode()) return '';
  return `<div style="padding:8px 14px;background:var(--yBg);border-bottom:1px solid rgba(245,158,11,.15);display:flex;align-items:center;gap:8px;flex-shrink:0">
    <span style="color:var(--y)">${I.zap}</span>
    <span style="font-size:11px;color:var(--y);flex:1;font-weight:500">Demo Mode — Add API key for AI features</span>
    <button onclick="openSettings()" style="padding:4px 12px;border-radius:6px;background:var(--y);color:#fff;font-size:10px;font-weight:600;border:none">Add Key</button>
  </div>`;
}

// ── MAIN APP ──
function rMain(app) {
  const tabs5 = [
    { k:'chat', l:'Chat', ic:'chat' },
    { k:'vault', l:'Vault', ic:'vault' },
    { k:'notes', l:'Notes', ic:'notes' },
    { k:'finance', l:'Money', ic:'money' },
    { k:'habits', l:'Habits', ic:'habits' }
  ];
  if (!tabs5.find(t => t.k === tab)) tab = 'chat';

  app.innerHTML = `
  ${renderSidebar()}
  ${renderCreatePopup()}
  <div style="padding:10px 14px 6px;flex-shrink:0;background:var(--c1);border-bottom:1px solid var(--b1);z-index:10">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <button onclick="toggleSidebar()" style="width:32px;height:32px;border-radius:8px;background:var(--c2);border:1px solid var(--b1);display:flex;align-items:center;justify-content:center;color:var(--t3)">${I.menu}</button>
      <div style="flex:1"><div style="font-size:15px;font-weight:600;letter-spacing:-.3px">AAKASH AI</div></div>
      ${S.thinkMode ? `<span class="tag" style="background:var(--pBg);color:var(--p)">${I.brain} Deep</span>` : ''}
      <button onclick="S.thinkMode=!S.thinkMode;saveAll();render()" style="width:32px;height:32px;border-radius:8px;background:${S.thinkMode?'var(--pBg)':'var(--c2)'};border:1px solid ${S.thinkMode?'rgba(139,92,246,.2)':'var(--b1)'};display:flex;align-items:center;justify-content:center;color:${S.thinkMode?'var(--p)':'var(--t4)'}">${I.brain}</button>
      <button onclick="_createOpen=true;render()" style="width:32px;height:32px;border-radius:8px;background:var(--grad);border:none;display:flex;align-items:center;justify-content:center;color:#fff">${I.plus}</button>
      <button onclick="openSettings()" style="width:32px;height:32px;border-radius:8px;background:var(--c2);border:1px solid var(--b1);display:flex;align-items:center;justify-content:center;color:var(--t3)">${I.settings}</button>
    </div>
    <div style="display:flex;background:var(--bg3);padding:3px;border-radius:10px">
    ${tabs5.map(t => `<button onclick="tab='${t.k}';rc()" style="flex:1;padding:6px 0;border-radius:8px;display:flex;flex-direction:column;align-items:center;gap:2px;background:${tab===t.k?'var(--c1)':'transparent'};color:${tab===t.k?'var(--t1)':'var(--t4)'};font-size:10px;font-weight:${tab===t.k?'600':'400'};${tab===t.k?'box-shadow:var(--shadow)':''}"><span style="color:${tab===t.k?'var(--ac)':'var(--t4)'}">${I[t.ic]}</span>${t.l}</button>`).join('')}
    </div>
  </div>
  ${demoBanner()}
  <div id="ct" style="flex:1;display:flex;flex-direction:column;min-height:0;overflow:hidden"></div>`;
  rc();
}

function rc() {
  const ct = document.getElementById('ct'); if (!ct) return;
  ({ chat:rChat, vault:rVault, notes:rNotes, finance:rFinance, habits:rHabits })[tab]?.(ct);
}

window._setupAddKey = function() {
  const name = document.getElementById('setupName')?.value?.trim();
  const key = document.getElementById('setupKey')?.value?.trim();
  if (!name || !key) { alert('Naam aur key dono dalo!'); return; }
  const result = addApiKey(name, key);
  if (!result.ok) { alert(result.msg); return; }
  saveAll(); render();
};

// ── INIT ──
sT(gT());
applyCustom();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
render();
