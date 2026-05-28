// ════════════════════════════════════
//  AAKASH AI v3 — App (app.js)
//  Login: Phone + Name + PIN
//  Onboarding + 5 tabs + sidebar
// ════════════════════════════════════

let _sidebarOpen = false, _createOpen = false;

function render() {
  const app = document.getElementById('app');
  // Step 1: Check if user has phone number (first time vs returning)
  if (!localStorage.getItem('ak_user_phone') && !localStorage.getItem('ak_pin_hash')) {
    rOnboarding(app);
    return;
  }
  // Step 2: Check if PIN exists
  if (!localStorage.getItem('ak_pin_hash')) { rSetup(app); return; }
  // Step 3: Check if unlocked
  if (!_ck) { rPin(app, 'check'); return; }
  rMain(app);
}

// ════════════════════════════════════
//  ONBOARDING — First time welcome + Phone + Name
// ════════════════════════════════════

let _onboardStep = 0;
function rOnboarding(app) {
  if (_onboardStep === 0) {
    // Welcome screen
    app.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:28px;background:var(--bg);animation:fadeIn .5s">
      <div style="width:72px;height:72px;border-radius:20px;background:var(--grad);display:flex;align-items:center;justify-content:center;margin-bottom:24px;color:#fff;box-shadow:var(--shadowLg)">${icon('star',32)}</div>
      <div style="font-size:26px;font-weight:700;letter-spacing:-.5px">AAKASH AI</div>
      <div style="font-size:11px;color:var(--t4);letter-spacing:3px;font-weight:500;margin-top:4px;margin-bottom:20px">PERSONAL ASSISTANT</div>
      <div style="max-width:280px;text-align:center;margin-bottom:32px">
        <p style="color:var(--t2);font-size:13px;line-height:1.7;margin-bottom:12px">Aapka apna personal AI assistant jo aapki productivity, finance, habits, aur learning mein help karega.</p>
        <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">
          ${['💬 AI Chat','💰 Finance','✅ Habits','📝 Notes','🎯 Goals'].map(f => `<span style="padding:4px 10px;border-radius:12px;background:var(--acBg);color:var(--ac);font-size:11px;font-weight:500">${f}</span>`).join('')}
        </div>
      </div>
      <button onclick="_onboardStep=1;render()" style="padding:14px 48px;border-radius:12px;background:var(--grad);color:#fff;font-size:15px;font-weight:600;border:none;box-shadow:var(--shadowMd)">Get Started</button>
      <button onclick="_onboardStep=3;render()" style="margin-top:12px;padding:8px 24px;border-radius:8px;background:transparent;color:var(--ac);font-size:13px;font-weight:500;border:1px solid var(--acBorder)">Already have account</button>
      <div style="margin-top:24px;font-size:10px;color:var(--t4);display:flex;align-items:center;gap:4px">${I.lock} AES-256 Encrypted</div>
    </div>`;
  } else if (_onboardStep === 1) {
    // Phone number input
    app.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:28px;background:var(--bg);animation:fadeIn .3s">
      <div style="width:48px;height:48px;border-radius:14px;background:var(--acBg);display:flex;align-items:center;justify-content:center;margin-bottom:16px;color:var(--ac)">${icon('phone',24)}</div>
      <div style="font-size:18px;font-weight:600;margin-bottom:6px">Phone Number</div>
      <div style="font-size:12px;color:var(--t3);margin-bottom:24px;text-align:center;max-width:260px">Yeh aapki permanent User ID hai. App delete hone pe bhi data wapas aa jayega.</div>
      <input id="obPhone" type="tel" class="inp" placeholder="Enter phone number" maxlength="15" style="width:260px;text-align:center;font-size:16px;padding:12px;border-radius:10px;margin-bottom:16px;letter-spacing:1px">
      <div id="obPhoneErr" style="color:var(--r);font-size:12px;min-height:18px;margin-bottom:8px"></div>
      <button onclick="obPhoneNext()" style="padding:12px 48px;border-radius:10px;background:var(--grad);color:#fff;font-size:14px;font-weight:600;border:none">Next</button>
      <button onclick="_onboardStep=0;render()" style="margin-top:12px;font-size:12px;color:var(--t4);background:none;border:none">${I.back} Back</button>
    </div>`;
    setTimeout(() => document.getElementById('obPhone')?.focus(), 100);
  } else if (_onboardStep === 2) {
    // Name input
    app.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:28px;background:var(--bg);animation:fadeIn .3s">
      <div style="width:48px;height:48px;border-radius:14px;background:var(--acBg);display:flex;align-items:center;justify-content:center;margin-bottom:16px;color:var(--ac)">${icon('star',24)}</div>
      <div style="font-size:18px;font-weight:600;margin-bottom:6px">Aapka Naam</div>
      <div style="font-size:12px;color:var(--t3);margin-bottom:24px;text-align:center;max-width:260px">AI aapko naam se address karega.</div>
      <input id="obName" type="text" class="inp" placeholder="Enter your name" maxlength="30" style="width:260px;text-align:center;font-size:16px;padding:12px;border-radius:10px;margin-bottom:16px">
      <div id="obNameErr" style="color:var(--r);font-size:12px;min-height:18px;margin-bottom:8px"></div>
      <button onclick="obNameNext()" style="padding:12px 48px;border-radius:10px;background:var(--grad);color:#fff;font-size:14px;font-weight:600;border:none">Next</button>
      <button onclick="_onboardStep=1;render()" style="margin-top:12px;font-size:12px;color:var(--t4);background:none;border:none">${I.back} Back</button>
    </div>`;
    setTimeout(() => document.getElementById('obName')?.focus(), 100);
  } else if (_onboardStep === 3) {
    // Returning user — enter phone to restore
    app.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:28px;background:var(--bg);animation:fadeIn .3s">
      <div style="width:48px;height:48px;border-radius:14px;background:var(--gBg);display:flex;align-items:center;justify-content:center;margin-bottom:16px;color:var(--g)">${icon('check',24)}</div>
      <div style="font-size:18px;font-weight:600;margin-bottom:6px">Welcome Back!</div>
      <div style="font-size:12px;color:var(--t3);margin-bottom:24px;text-align:center;max-width:260px">Apna phone number dalein — saara purana data wapas aa jayega.</div>
      <input id="obRestorePhone" type="tel" class="inp" placeholder="Enter phone number" maxlength="15" style="width:260px;text-align:center;font-size:16px;padding:12px;border-radius:10px;margin-bottom:16px;letter-spacing:1px">
      <div id="obRestoreErr" style="color:var(--r);font-size:12px;min-height:18px;margin-bottom:8px"></div>
      <button onclick="obRestoreNext()" style="padding:12px 48px;border-radius:10px;background:var(--grad);color:#fff;font-size:14px;font-weight:600;border:none">Restore</button>
      <button onclick="_onboardStep=0;render()" style="margin-top:12px;font-size:12px;color:var(--t4);background:none;border:none">${I.back} Back</button>
    </div>`;
  }
}

window.obPhoneNext = function() {
  const phone = document.getElementById('obPhone')?.value?.trim();
  if (!phone || phone.length < 10) {
    document.getElementById('obPhoneErr').textContent = 'Valid phone number dalein';
    return;
  }
  localStorage.setItem('ak_user_phone', phone);
  _onboardStep = 2;
  render();
};

window.obNameNext = function() {
  const name = document.getElementById('obName')?.value?.trim();
  if (!name || name.length < 2) {
    document.getElementById('obNameErr').textContent = 'Naam dalein (min 2 characters)';
    return;
  }
  localStorage.setItem('ak_user_name', name);
  // Now go to PIN setup
  rSetup(document.getElementById('app'));
};

window.obRestoreNext = async function() {
  const phone = document.getElementById('obRestorePhone')?.value?.trim();
  if (!phone || phone.length < 10) {
    document.getElementById('obRestoreErr').textContent = 'Valid phone number dalein';
    return;
  }
  localStorage.setItem('ak_user_phone', phone);
  // Try to restore from Firebase
  document.getElementById('obRestoreErr').textContent = '';
  document.getElementById('obRestoreErr').style.color = 'var(--ac)';
  document.getElementById('obRestoreErr').textContent = 'Cloud se data restore ho raha hai...';
  // Firebase restore will happen after PIN setup
  rSetup(document.getElementById('app'));
};

// ════════════════════════════════════
//  SETUP — Create PIN (after phone + name)
// ════════════════════════════════════

function rSetup(app) {
  rPin(app, 'setup');
}

// ── PIN SCREEN ──
let _pv = '', _pm = '', _ps = '';
function rPin(app, mode) {
  _pm = mode; _pv = '';
  const userName = localStorage.getItem('ak_user_name') || '';
  app.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:28px;background:var(--bg)">
  <div style="width:56px;height:56px;border-radius:16px;background:var(--grad);display:flex;align-items:center;justify-content:center;margin-bottom:20px;color:#fff">${icon('star',24)}</div>
  <div style="font-size:22px;font-weight:700;letter-spacing:-.5px">AAKASH AI</div>
  ${userName ? `<div style="font-size:13px;color:var(--ac);font-weight:500;margin-top:4px">Welcome${mode==='check'?'back':''}, ${userName}!</div>` : ''}
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
    if (pin === _ps) {
      localStorage.setItem('ak_pin_hash', await hashPin(pin));
      _ck = await CR.dk(pin);
      // Save phone + name into encrypted state
      S.userPhone = localStorage.getItem('ak_user_phone') || '';
      S.userName = localStorage.getItem('ak_user_name') || '';
      S.userJoinedAt = S.userJoinedAt || new Date().toISOString();
      await saveAll();
      render();
    }
    else { document.getElementById('pE').textContent = "Didn't match"; _pm = 'setup'; document.getElementById('pL').textContent = 'Create 4-digit PIN'; document.querySelectorAll('.dt').forEach(d => d.classList.remove('on')); }
  } else {
    if (await hashPin(pin) === localStorage.getItem('ak_pin_hash')) {
      _ck = await CR.dk(pin);
      await loadAll();
      render();
      setTimeout(()=>{window.runNotificationEngine?.();if(typeof FIRE!=='undefined')FIRE.onLogin();},1500);
    }
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
        <div style="flex:1"><div style="font-size:14px;font-weight:600">AAKASH AI</div>${S.userName?`<div style="font-size:10px;color:var(--t4)">${S.userName}</div>`:''}</div>
        <button onclick="toggleSidebar()" style="color:var(--t3)">${I.close}</button>
      </div>
      <div style="padding:8px 10px"><button onclick="createNewChat(${S.activeProject||'null'});toggleSidebar();render()" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;width:100%;border-radius:10px;background:var(--grad);color:#fff;font-size:13px;font-weight:500;border:none">${I.plus} New chat</button></div>

      <!-- Chat Search (Change 10) -->
      <div style="padding:4px 10px">
        <div style="position:relative">
          <input id="chatSearch" class="inp" placeholder="Search chats..." style="font-size:12px;padding:8px 10px 8px 30px;border-radius:8px;width:100%" oninput="filterSidebarChats(this.value)">
          <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--t4)">${I.search}</span>
        </div>
      </div>

      <div style="padding:4px 10px">
        <div style="font-size:9px;font-weight:600;color:var(--t4);text-transform:uppercase;letter-spacing:.8px;padding:4px 6px">Projects</div>
        <div onclick="switchProject(null);toggleSidebar();render()" style="padding:7px 10px;border-radius:6px;font-size:12px;font-weight:${!S.activeProject?'600':'400'};color:${!S.activeProject?'var(--ac)':'var(--t2)'};background:${!S.activeProject?'var(--acBg)':'transparent'};cursor:pointer">${I.chat} All chats <span style="color:var(--t4);font-size:10px">(${S.chats.filter(c=>!c.projectId).length})</span></div>
        ${S.projects.map(p => `<div onclick="switchProject(${p.id});toggleSidebar();render()" style="padding:7px 10px;border-radius:6px;font-size:12px;cursor:pointer;font-weight:${S.activeProject===p.id?'600':'400'};color:${S.activeProject===p.id?'var(--ac)':'var(--t2)'};background:${S.activeProject===p.id?'var(--acBg)':'transparent'}">${I.folder} ${p.name} <span style="color:var(--t4);font-size:10px">(${getChatsByProject(p.id).length})</span></div>`).join('')}
        <button onclick="toggleSidebar();openProjects()" style="padding:7px 10px;font-size:11px;color:var(--t4);width:100%;text-align:left;border-radius:6px">${I.plus} Manage</button>
      </div>
      <div style="height:1px;background:var(--b1);margin:4px 12px"></div>
      <div id="sidebarChatList" style="flex:1;overflow-y:auto;padding:4px 10px">
        <div style="font-size:9px;font-weight:600;color:var(--t4);text-transform:uppercase;letter-spacing:.8px;padding:4px 6px">Recent</div>
        ${_renderChatList(projectChats)}
      </div>
      <div style="padding:4px 10px;display:flex;gap:4px">
        <button onclick="toggleSidebar();openConnect()" style="flex:1;padding:6px;border-radius:8px;background:var(--acBg);border:1px solid var(--acBorder);font-size:10px;color:var(--ac);display:flex;align-items:center;justify-content:center;gap:3px;font-weight:500">🔗 Connect</button>
        <button onclick="toggleSidebar();openFilesManager()" style="flex:1;padding:6px;border-radius:8px;background:var(--c2);border:1px solid var(--b1);font-size:10px;color:var(--t3);display:flex;align-items:center;justify-content:center;gap:3px">📁 Files</button>
        <button onclick="toggleSidebar();showAchievements()" style="flex:1;padding:6px;border-radius:8px;background:var(--c2);border:1px solid var(--b1);font-size:10px;color:var(--t3);display:flex;align-items:center;justify-content:center;gap:3px">⭐ Badges</button>
      </div>
      <div style="padding:4px 10px 8px;border-top:1px solid var(--b1);display:flex;gap:6px">
        <button onclick="toggleSidebar();openSettings()" style="flex:1;padding:7px;border-radius:8px;background:var(--c2);border:1px solid var(--b1);font-size:11px;color:var(--t3);display:flex;align-items:center;justify-content:center;gap:4px">${I.settings} Settings</button>
        <button onclick="const ct=gT();const themes=['clean-white','midnight-dark','ocean-blue','violet-dream','mint-fresh','neon-night'];const ni=(themes.indexOf(ct)+1)%themes.length;sT(themes[ni]);toggleSidebar();render()" style="flex:1;padding:7px;border-radius:8px;background:var(--c2);border:1px solid var(--b1);font-size:11px;color:var(--t3);display:flex;align-items:center;justify-content:center;gap:4px">${I.palette} Theme</button>
      </div>
    </div>
    <div onclick="toggleSidebar()" style="flex:1;background:var(--overlay)"></div>
  </div>`;
}

function _renderChatList(chats) {
  if (!chats.length) return '<div style="text-align:center;padding:20px;color:var(--t4);font-size:11px">No chats</div>';
  return chats.slice(0,30).map(c => `<div style="padding:7px 10px;border-radius:6px;margin-bottom:1px;cursor:pointer;background:${S.activeChat===c.id?'var(--acBg2)':'transparent'};display:flex;align-items:center;gap:6px" onclick="loadChat(${c.id});toggleSidebar();render()">
    <span style="color:${S.activeChat===c.id?'var(--ac)':'var(--t4)'}">${I.chat}</span>
    <div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:${S.activeChat===c.id?'600':'400'};color:${S.activeChat===c.id?'var(--ac)':'var(--t1)'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.title}</div>
    <div style="font-size:9px;color:var(--t4)">${_timeAgo(c.updatedAt)}</div></div>
    <button onclick="event.stopPropagation();renameChat(${c.id});toggleSidebar();render()" style="color:var(--t4);font-size:10px;padding:2px">${I.edit}</button>
    <button onclick="event.stopPropagation();if(confirm('Delete?')){deleteChat(${c.id});toggleSidebar();render()}" style="color:var(--t4);font-size:10px;padding:2px">${I.trash}</button>
  </div>`).join('');
}

// ── Chat Search Filter (Change 10) ──
window.filterSidebarChats = function(query) {
  const list = document.getElementById('sidebarChatList');
  if (!list) return;
  const q = query.toLowerCase().trim();
  if (!q) {
    const projectChats = S.activeProject ? getChatsByProject(S.activeProject) : S.chats;
    list.innerHTML = `<div style="font-size:9px;font-weight:600;color:var(--t4);text-transform:uppercase;letter-spacing:.8px;padding:4px 6px">Recent</div>` + _renderChatList(projectChats);
    return;
  }
  // Search in chat titles and messages
  const results = S.chats.filter(c => {
    if (c.title.toLowerCase().includes(q)) return true;
    return c.messages?.some(m => {
      const txt = typeof m.content === 'string' ? m.content : '';
      return txt.toLowerCase().includes(q);
    });
  });
  list.innerHTML = `<div style="font-size:9px;font-weight:600;color:var(--t4);text-transform:uppercase;letter-spacing:.8px;padding:4px 6px">Search Results (${results.length})</div>` + _renderChatList(results);
};

window.toggleSidebar = function() { _sidebarOpen = !_sidebarOpen; if(_sidebarOpen) history.pushState({tab,overlay:'sidebar'},'',''); const sb = document.getElementById('sidebar'); if (sb) sb.style.display = _sidebarOpen ? 'flex' : 'none'; else if (_sidebarOpen) render(); };

// ── DEMO BANNER ──
function demoBanner() {
  if (!isDemoMode()) return '';
  return `<div style="padding:8px 14px;background:var(--yBg);border-bottom:1px solid rgba(245,158,11,.15);display:flex;align-items:center;gap:8px;flex-shrink:0">
    <span style="color:var(--y)">${I.zap}</span>
    <span style="font-size:11px;color:var(--y);flex:1;font-weight:500">Demo Mode — API key add karein for AI features</span>
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
      <div style="flex:1"><div style="font-size:15px;font-weight:600;letter-spacing:-.3px">AAKASH AI</div>${S.userName?`<div style="font-size:10px;color:var(--t4)">Hi, ${S.userName}</div>`:''}</div>
      <div id="onlineStatus" style="padding:2px 8px;border-radius:10px;font-size:9px;font-weight:600;background:${_getNetStatus().bg};color:${_getNetStatus().color};border:1px solid ${_getNetStatus().border}">${_getNetStatus().text}</div>
      ${tab==='chat'&&S.chat.length>0?`<button onclick="exportChatPDF()" style="width:32px;height:32px;border-radius:8px;background:var(--c2);border:1px solid var(--b1);display:flex;align-items:center;justify-content:center;color:var(--t3)" title="Export PDF">${I.download}</button>`:''}
      ${S.thinkMode ? `<span class="tag" style="background:var(--pBg);color:var(--p)">${I.brain} Deep</span>` : ''}
      <button onclick="S.thinkMode=!S.thinkMode;saveAll();render()" style="width:32px;height:32px;border-radius:8px;background:${S.thinkMode?'var(--pBg)':'var(--c2)'};border:1px solid ${S.thinkMode?'rgba(139,92,246,.2)':'var(--b1)'};display:flex;align-items:center;justify-content:center;color:${S.thinkMode?'var(--p)':'var(--t4)'}">${I.brain}</button>
      <button onclick="_createOpen=true;render()" style="width:32px;height:32px;border-radius:8px;background:var(--grad);border:none;display:flex;align-items:center;justify-content:center;color:#fff">${I.plus}</button>
      <button onclick="openSettings()" style="width:32px;height:32px;border-radius:8px;background:var(--c2);border:1px solid var(--b1);display:flex;align-items:center;justify-content:center;color:var(--t3)">${I.settings}</button>
    </div>
    <div style="display:flex;background:var(--bg3);padding:3px;border-radius:10px">
    ${tabs5.map(t => `<button onclick="tab='${t.k}';pushNavState('${t.k}');rc()" style="flex:1;padding:6px 0;border-radius:8px;display:flex;flex-direction:column;align-items:center;gap:2px;background:${tab===t.k?'var(--c1)':'transparent'};color:${tab===t.k?'var(--t1)':'var(--t4)'};font-size:10px;font-weight:${tab===t.k?'600':'400'};${tab===t.k?'box-shadow:var(--shadow)':''}"><span style="color:${tab===t.k?'var(--ac)':'var(--t4)'}">${I[t.ic]}</span>${t.l}</button>`).join('')}
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
  if (!name || !key) { alert('Naam aur key dono dalein!'); return; }
  const result = addApiKey(name, key);
  if (!result.ok) { alert(result.msg); return; }
  saveAll(); render();
};

// ── INIT ──
sT(gT());
applyCustom();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();

// ── Back Button Navigation ──
let _lastPushedTab = 'chat';
function pushNavState(tabName, extra) {
  const state = { tab: tabName, ...(extra || {}) };
  if (tabName !== _lastPushedTab || extra) {
    history.pushState(state, '', '');
    _lastPushedTab = tabName;
  }
}

window.addEventListener('popstate', function(e) {
  const settingsPage = document.getElementById('settingsPage');
  if (settingsPage) { settingsPage.remove(); return; }
  if (_sidebarOpen) { toggleSidebar(); return; }
  if (_createOpen) { _createOpen = false; render(); return; }
  if (e.state && e.state.tab) { tab = e.state.tab; _lastPushedTab = tab; rc(); }
  else { if (tab !== 'chat') { tab = 'chat'; _lastPushedTab = 'chat'; rc(); } }
});

history.replaceState({ tab: 'chat' }, '', '');

// ════════════════════════════════════
//  NOTIFICATION ENGINE (unchanged)
// ════════════════════════════════════

const WEALTH_FORMULAS = [
  { name:'Rule of 72', formula:'72 ÷ interest rate = years to double', apply: s => s ? `₹${Math.round(s*.2).toLocaleString()}/mo invest at 12% → double in 6 years` : '' },
  { name:'50/30/20 Rule', formula:'50% Needs, 30% Wants, 20% Invest', apply: s => s ? `₹${s.toLocaleString()} → ₹${Math.round(s*.5).toLocaleString()} needs, ₹${Math.round(s*.3).toLocaleString()} wants, ₹${Math.round(s*.2).toLocaleString()} invest` : '' },
  { name:'Pay Yourself First', formula:'Income aaye → pehle invest → baaki se kharcha', apply: s => s ? `Salary aayi? Pehle ₹${Math.round(s*.2).toLocaleString()} invest, phir soch` : '' },
  { name:'Compounding', formula:'A = P(1+r/n)^(nt)', apply: s => s ? `₹${Math.round(s*.2).toLocaleString()}/mo at 15% → 10yr mein ₹${Math.round(s*.2*12*((Math.pow(1.0125,120)-1)/0.0125)).toLocaleString()}+` : '' },
  { name:'Emergency Fund', formula:'6 months kharcha liquid mein', apply: s => s ? `Min ₹${(s*6).toLocaleString()} emergency fund chahiye` : '' },
  { name:'Parkinson\'s Law', formula:'Kharcha utna badhta jitna income', apply: () => 'Income badhe toh savings % same rakhein' },
  { name:'1% Rule', formula:'Daily 1% better = yearly 37x', apply: () => 'Roz ek chhoti improvement — compounding skills mein bhi lagta hai' },
  { name:'Multiple Streams', formula:'Avg millionaire = 7 streams', apply: () => { const a=(S.finance?.incomeStreams||[]).filter(s=>s.status==='Active').length; return `Aapke paas ${a}/7 active streams`; } },
  { name:'Wealth Formula', formula:'Wealth = (Income-Expenses) × Investments', apply: () => 'Income badhao + expenses ghatao + invest karo = wealth pakka' },
  { name:'10X Rule', formula:'Target ka 10 guna socho', apply: () => '₹1L chahiye? ₹10L ke liye plan karo' },
  { name:'Diversification', formula:'Saara paisa ek jagah mat daalo', apply: () => 'Stocks, MF, FD, Gold — spread karo risk' },
  { name:'Asset vs Liability', formula:'Asset = pocket mein daale, Liability = nikale', apply: () => 'Phone = liability. Phone se freelancing = asset.' },
];

function _isQuietHours() {
  const ns = S.notifSettings || {};
  const h = new Date().getHours();
  const qs = ns.quietStart ?? 23, qe = ns.quietEnd ?? 7;
  if (qs > qe) return h >= qs || h < qe;
  return h >= qs && h < qe;
}

function _smartNotify(title, body, tag) {
  if (!S.notifSettings?.enabled) return;
  if (_isQuietHours()) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try { new Notification(title, { body, icon:'icon-192.png', tag:tag||'aakash-'+Date.now() }); } catch {}
}

function _nKey() { return new Date().toISOString().slice(0,10); }
function _nShown(k) { return localStorage.getItem('ak_n_'+k) === _nKey(); }
function _nMark(k) { localStorage.setItem('ak_n_'+k, _nKey()); }

function showNotifBanner(msg) {
  const old = document.getElementById('notifBanner'); if (old) old.remove();
  const el = document.createElement('div'); el.id='notifBanner';
  el.style.cssText='position:fixed;top:0;left:0;right:0;max-width:480px;margin:0 auto;padding:14px 16px;background:var(--c1);border-bottom:2px solid var(--ac);z-index:200;animation:slideDown .3s;font-size:13px;line-height:1.6;color:var(--t1);box-shadow:var(--shadowLg)';
  el.innerHTML=`<div style="display:flex;align-items:start;gap:10px"><div style="flex:1">${msg}</div><button onclick="this.parentElement.parentElement.remove()" style="color:var(--t4);flex-shrink:0;font-size:16px;background:none;border:none;cursor:pointer">✕</button></div>`;
  document.body.appendChild(el);
  if (!document.getElementById('nbStyle')) { const s=document.createElement('style');s.id='nbStyle';s.textContent='@keyframes slideDown{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}';document.head.appendChild(s); }
  setTimeout(()=>{ if(el.parentElement){el.style.opacity='0';el.style.transition='opacity .3s';setTimeout(()=>el.remove(),300);} },12000);
}

window.runNotificationEngine = function() {
  if (!_ck) return;
  const ns = S.notifSettings || {};
  if (!ns.enabled) return;
  if (_isQuietHours()) return;

  const today = _nKey(), hour = new Date().getHours();
  const tone = S.accountability?.intensity || 'funny';

  // Morning Briefing (Change 21)
  if (ns.morningBriefing?.enabled && !_nShown('morning')) {
    const bh = parseInt((ns.morningBriefing.time||'08:00').split(':')[0]);
    if (hour >= bh && hour < bh+3) {
      _nMark('morning');
      const pt = S.entries.filter(e=>e.type==='task'&&!e.done).length;
      const ph = S.habits.length - (S.habitLog[today]||[]).length;
      const me = S.finance.expenses.filter(e=>{const d=new Date(e.date);return d.getMonth()===new Date().getMonth()&&d.getFullYear()===new Date().getFullYear();}).reduce((s,e)=>s+e.amount,0);
      const left = (S.finance.salary||0)-me;
      const f = WEALTH_FORMULAS[Math.floor(Math.random()*WEALTH_FORMULAS.length)];
      let b=`<div style="font-size:14px;font-weight:600;margin-bottom:6px">Good morning${S.userName?', '+S.userName:''}! ☀️</div>`;
      if(pt) b+=`<div>📋 ${pt} tasks pending</div>`;
      if(ph>0) b+=`<div>💪 ${ph} habits baaki</div>`;
      if(S.finance.salary) b+=`<div>💰 Budget: ${INR(left)} left</div>`;
      b+=`<div style="margin-top:4px;color:var(--ac);font-weight:500">🧠 ${f.name}: ${f.formula}</div>`;
      const p=f.apply(S.finance.salary); if(p) b+=`<div style="font-size:11px;color:var(--t3)">${p}</div>`;
      showNotifBanner(b);
      _smartNotify('AAKASH AI ☀️',`${pt} tasks, ${ph} habits. ${f.name}!`,'morning');
    }
  }

  // Daily Wisdom
  if (ns.dailyWisdom?.enabled && !_nShown('wisdom') && hour>=10) {
    _nMark('wisdom');
    const f=WEALTH_FORMULAS[Math.floor(Math.random()*WEALTH_FORMULAS.length)];
    _smartNotify('AAKASH AI 🧠',`${f.name}: ${f.formula}`,'wisdom');
  }

  // Habit Notifications
  if (ns.habitReminder?.enabled && S.habits.length) {
    const done=S.habitLog[today]||[], pending=S.habits.filter(h=>!done.includes(h.id));
    if (hour>=8 && hour<10 && pending.length && !_nShown('hab_am')) {
      _nMark('hab_am');
      _smartNotify('AAKASH AI 💪',`${pending.length} habits pending — ${pending[0].name} se start karein?`,'hab_am');
    }
    if (hour>=21 && hour<22 && pending.length && !_nShown('hab_pm')) {
      _nMark('hab_pm');
      showNotifBanner(`${pending.length} habits abhi bhi pending — sone se pehle complete karein!`);
      _smartNotify('AAKASH AI 🌙',`${pending.length} habits pending`,'hab_pm');
    }
    // Streak milestones
    if (ns.milestoneAlert?.enabled) {
      S.habits.forEach(h=>{
        if(!done.includes(h.id))return;
        let st=0;const d=new Date();for(let i=0;i<365;i++){const ds=d.toISOString().slice(0,10);if((S.habitLog[ds]||[]).includes(h.id))st++;else if(i>0)break;d.setDate(d.getDate()-1);}
        [7,14,21,30,50,100,200,365].forEach(ms=>{
          if(st===ms&&!_nShown('stk_'+h.id+'_'+ms)){_nMark('stk_'+h.id+'_'+ms);showNotifBanner(`🔥 <strong>${h.name}</strong> — ${ms} din streak!`);_smartNotify('AAKASH AI 🔥',`${h.name} — ${ms} din streak!`,'stk_'+h.id);}
        });
      });
    }
  }

  // Finance Notifications
  if (ns.financeNudge?.enabled) {
    const dom=new Date().getDate();
    if(dom<=2&&!_nShown('mo_start')){_nMark('mo_start');_smartNotify('AAKASH AI 💰','Naya month! Budget set kar lijiye.','mo_start');}
    if(S.finance.salary&&!_nShown('overspend')){
      const me=S.finance.expenses.filter(e=>{const d=new Date(e.date);return d.getMonth()===new Date().getMonth()&&d.getFullYear()===new Date().getFullYear();}).reduce((s,e)=>s+e.amount,0);
      const pct=(me/S.finance.salary)*100, dl=new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate()-dom;
      if(pct>80&&dl>5){_nMark('overspend');showNotifBanner(`💸 Budget ${pct.toFixed(0)}% use ho chuka, ${dl} din baaki.`);_smartNotify('AAKASH AI 💸',`Budget ${pct.toFixed(0)}% used`,'overspend');}
    }
  }

  // Goal Deadlines
  if (ns.goalDeadline?.enabled) {
    [...(S.finance.financialGoals||[]),...S.entries.filter(e=>e.type==='goal'&&!e.done)].forEach(g=>{
      const dl=g.deadline||g.dueDate; if(!dl)return;
      const days=Math.ceil((new Date(dl).getTime()-Date.now())/86400000);
      [30,7,1].forEach(d=>{if(days===d&&!_nShown('gl_'+d+'_'+g.id)){_nMark('gl_'+d+'_'+g.id);_smartNotify('AAKASH AI 🎯',`${g.title} — ${d===1?'KAL DEADLINE':d+' din baaki'}!`,'gl_'+g.id);}});
    });
  }

  // Accountability Roast
  if(S.accountability?.enabled&&ns.accountabilityRoast?.enabled&&!_nShown('roast')&&hour>=11&&hour<20){
    const old=S.entries.filter(e=>e.type==='task'&&!e.done&&e.createdAt).filter(t=>Math.floor((Date.now()-new Date(t.createdAt).getTime())/86400000)>=2);
    if(old.length){_nMark('roast');const t=old[0],age=Math.floor((Date.now()-new Date(t.createdAt).getTime())/86400000);
    showNotifBanner(`😤 "${t.title}" — ${age} din se pending hai!`);_smartNotify('AAKASH AI 😤',`${old.length} tasks ${age}+ din pending`,'roast');}
  }

  setTimeout(()=>{window.runNotificationEngine?.();},30*60*1000);
};

render();

// Auto-save
window.addEventListener('beforeunload', () => {
  if (S.chat.length > 0) { saveChatToHistory(); }
  if (_ck) { try { localStorage.setItem('ak_emergency', JSON.stringify({ chat: S.chat, activeChat: S.activeChat, chats: S.chats })); } catch {} }
});

setInterval(() => { if (_ck && S.chat.length > 0) { saveChatToHistory(); saveAll(); } }, 30000);

setTimeout(() => {
  try {
    const em = localStorage.getItem('ak_emergency');
    if (em && _ck) {
      const d = JSON.parse(em);
      if (d.chat && d.chat.length > 0 && S.chat.length === 0) {
        S.chat = d.chat; S.activeChat = d.activeChat;
        if (d.chats && d.chats.length > S.chats.length) S.chats = d.chats;
        saveAll(); render();
      }
      localStorage.removeItem('ak_emergency');
    }
  } catch {}
}, 1000);

setTimeout(()=>{ if(_ck) window.runNotificationEngine?.(); }, 2000);

// ── Online/Offline + API Key Status (Change 11 + Fix) ──
function _getNetStatus() {
  const hasKeys = (S.apiKeys || []).some(k => k.enabled);
  const isOnline = navigator.onLine;
  if (isOnline && hasKeys) return { text:'Online', bg:'var(--gBg)', color:'var(--g)', border:'var(--gBorder)' };
  if (isOnline && !hasKeys) return { text:'Brain Mode', bg:'var(--wBg,var(--rBg))', color:'var(--w,var(--r))', border:'var(--wBorder,var(--rBorder))' };
  return { text:'Offline', bg:'var(--rBg)', color:'var(--r)', border:'var(--rBorder)' };
}
function _updateOnlineStatus() {
  const el = document.getElementById('onlineStatus'); if (!el) return;
  const s = _getNetStatus();
  el.textContent = s.text; el.style.background = s.bg; el.style.color = s.color; el.style.borderColor = s.border;
}
window.addEventListener('online', () => { _updateOnlineStatus(); showToast('Online — API active'); });
window.addEventListener('offline', () => { _updateOnlineStatus(); showToast('Offline — Brain mode'); });
