// ════════════════════════════════════
//  AAKASH AI v2 — Settings (settings.js)
//  Full list page with working sub-pages
// ════════════════════════════════════

let _settingsView = 'main';

function _sHeader(title, backTo) {
  return `<div style="padding:12px 16px;border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:10px;background:var(--c1);flex-shrink:0">
    <button onclick="_settingsView='${backTo||'main'}';_rSettings()" style="color:var(--t3)">${I.back}</button>
    <div style="font-size:16px;font-weight:600;flex:1">${title}</div>
  </div>`;
}

function _rSettings() {
  const pg = document.getElementById('settingsPage'); if(!pg) return;
  const keys = S.apiKeys || [];

  // ── SUB: Profile ──
  if (_settingsView === 'profile') {
    pg.innerHTML = `${_sHeader('Profile')}<div style="flex:1;overflow-y:auto;background:var(--bg)">
      <div style="padding:6px 16px;margin-top:6px;font-size:10px;font-weight:600;color:var(--t4);text-transform:uppercase;letter-spacing:.7px">Memories (${(S.memoryFacts||[]).length})</div>
      <div style="background:var(--c1)">${(S.memoryFacts||[]).length===0?'<div style="padding:16px;font-size:12px;color:var(--t4);text-align:center">No memories</div>':
      (S.memoryFacts||[]).map((f,i)=>`<div style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--b1)"><span style="color:var(--t3)">${I.star}</span><div style="flex:1;font-size:12px;color:var(--t2)">${f.fact}</div><button onclick="S.memoryFacts.splice(${i},1);saveAll();_rSettings()" style="color:var(--r)">${I.close}</button></div>`).join('')}</div>
      <div style="padding:6px 16px;margin-top:10px;font-size:10px;font-weight:600;color:var(--t4);text-transform:uppercase;letter-spacing:.7px">Custom AI Rules (${(S.customRules||[]).length})</div>
      <div style="background:var(--c1)">${(S.customRules||[]).length===0?'<div style="padding:16px;font-size:12px;color:var(--t4);text-align:center">No rules</div>':
      (S.customRules||[]).map((r,i)=>`<div style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--b1)"><span style="color:var(--t3)">${I.info}</span><div style="flex:1;font-size:12px;color:var(--t2)">${r}</div><button onclick="S.customRules.splice(${i},1);saveAll();_rSettings()" style="color:var(--r)">${I.close}</button></div>`).join('')}
      <div style="display:flex;gap:6px;padding:12px 16px"><input id="newRule" class="inp" placeholder="Add rule..." style="font-size:12px"><button onclick="const r=document.getElementById('newRule').value.trim();if(r){if(!S.customRules)S.customRules=[];S.customRules.push(r);saveAll();_rSettings()}" class="btn bp" style="padding:8px 16px;font-size:12px;flex-shrink:0">Add</button></div></div></div>`;
    return;
  }

  // ── SUB: Security ──
  if (_settingsView === 'security') {
    pg.innerHTML = `${_sHeader('Security')}<div style="flex:1;overflow-y:auto;background:var(--bg)">
      <div style="padding:20px 16px;background:var(--c1);margin-top:2px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><span style="color:var(--g)">${I.shield}</span><div><div style="font-size:14px;font-weight:600">AES-256 Encryption</div><div style="font-size:11px;color:var(--t3);margin-top:2px">All data encrypted with your PIN</div></div></div>
      <div style="padding:10px;background:var(--gBg);border-radius:8px;border:1px solid var(--gBorder);font-size:11px;color:var(--g);line-height:1.6">Data stored in localStorage, encrypted AES-256-GCM. PIN hashed PBKDF2 100K iterations.</div></div>
      <div onclick="_ck=null;document.getElementById('settingsPage').remove();render()" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid var(--b1);cursor:pointer;background:var(--c1);margin-top:8px"><span style="color:var(--r)">${I.lock}</span><div style="font-size:13px;font-weight:500;color:var(--r)">Lock app now</div></div></div>`;
    return;
  }

  // ── SUB: Keys ──
  if (_settingsView === 'keys') {
    pg.innerHTML = `${_sHeader('API Keys')}<div style="flex:1;overflow-y:auto;background:var(--bg)">
      <div style="padding:14px 16px;background:var(--c1);margin-top:2px;border-bottom:1px solid var(--b1)">
        <div style="font-size:13px;font-weight:600;margin-bottom:8px">Add new key</div>
        <input id="addKeyName" class="inp" placeholder="Name (e.g., Claude)" style="font-size:13px;margin-bottom:6px">
        <input id="addKeyVal" class="inp" placeholder="Paste API key..." style="font-size:11px;font-family:JetBrains Mono,monospace;margin-bottom:4px">
        <div id="addKeyInfo" style="font-size:10px;color:var(--t4);min-height:14px;margin-bottom:6px"></div>
        <button onclick="_doAddKey()" class="btn bp" style="width:100%;padding:10px;font-size:13px">Add key</button>
      </div>
      <div style="padding:6px 16px;margin-top:6px;font-size:10px;font-weight:600;color:var(--t4);text-transform:uppercase;letter-spacing:.7px">Keys (${keys.length})</div>
      <div style="background:var(--c1)">${keys.length===0?'<div style="padding:20px;text-align:center;font-size:12px;color:var(--t4)">No keys yet</div>':
      keys.map(k=>{const p=PROVIDER_MAP[k.provider]||{name:'Unknown',caps:[]};return `<div style="padding:12px 16px;border-bottom:1px solid var(--b1);${!k.enabled?'opacity:.5':''}"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="color:var(--t3)">${I.key}</span><div style="flex:1"><div style="font-size:13px;font-weight:500">${k.name}</div><div style="font-size:10px;color:var(--t4)">${p.name} · ${k.key.slice(0,8)}...${k.key.slice(-4)}</div></div>
      <button onclick="toggleApiKey(${k.id});_rSettings()" style="padding:4px 10px;border-radius:6px;font-size:10px;font-weight:600;background:${k.enabled?'var(--gBg)':'var(--rBg)'};color:${k.enabled?'var(--g)':'var(--r)'};border:1px solid ${k.enabled?'var(--gBorder)':'var(--rBorder)'}">${k.enabled?'ON':'OFF'}</button>
      <button onclick="if(confirm('Remove?')){removeApiKey(${k.id});_rSettings()}" style="color:var(--r)">${I.trash}</button></div>
      <div style="display:flex;gap:3px;flex-wrap:wrap;padding-left:26px">${p.caps.slice(0,5).map(c=>`<span style="padding:2px 7px;border-radius:8px;font-size:9px;background:var(--acBg);color:var(--ac)">${c.replace('_',' ')}</span>`).join('')}</div></div>`;}).join('')}</div></div>`;
    setTimeout(()=>{document.getElementById('addKeyVal')?.addEventListener('input',function(){const info=document.getElementById('addKeyInfo');if(!info)return;const k=this.value.trim();if(k.length<6){info.textContent='';return;}const pid=detectProvider(k);if(pid==='unknown'){info.innerHTML='Not detected';info.style.color='var(--t4)';return;}const p=PROVIDER_MAP[pid];info.innerHTML=p.name+' — '+p.caps.slice(0,3).join(', ');info.style.color='var(--g)';});},50);
    return;
  }

  // ── SUB: Notifications ──
  if (_settingsView === 'notifications') {
    const ns = S.notifSettings || {};
    const _ntog = (path, label, desc) => {
      const parts = path.split('.');
      const val = parts.length === 2 ? ns[parts[0]]?.[parts[1]] : ns[parts[0]];
      return `<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--b1)"><div style="flex:1"><div style="font-size:13px;font-weight:500">${label}</div>${desc?`<div style="font-size:10px;color:var(--t4)">${desc}</div>`:''}</div>
      <button onclick="const ns=S.notifSettings;${parts.length===2?`if(!ns.${parts[0]})ns.${parts[0]}={};ns.${parts[0]}.${parts[1]}=!ns.${parts[0]}.${parts[1]}`:`ns.${parts[0]}=!ns.${parts[0]}`};saveAll();_rSettings()" style="padding:4px 10px;border-radius:6px;font-size:10px;font-weight:600;background:${val?'var(--gBg)':'var(--rBg)'};color:${val?'var(--g)':'var(--r)'};border:1px solid ${val?'var(--gBorder)':'var(--rBorder)'}">${val?'ON':'OFF'}</button></div>`;
    };
    pg.innerHTML = `${_sHeader('Notifications')}<div style="flex:1;overflow-y:auto;background:var(--bg)">
      <div style="padding:6px 16px;margin-top:6px;font-size:10px;font-weight:600;color:var(--t4);text-transform:uppercase;letter-spacing:.7px">Master</div>
      <div style="background:var(--c1)">
        ${_ntog('enabled','All Notifications','Master on/off switch')}
      </div>
      <div style="padding:6px 16px;margin-top:6px;font-size:10px;font-weight:600;color:var(--t4);text-transform:uppercase;letter-spacing:.7px">Notification Types</div>
      <div style="background:var(--c1)">
        ${_ntog('morningBriefing.enabled','🌅 Morning Briefing','Daily summary — tasks, habits, budget, formula')}
        ${_ntog('habitReminder.enabled','💪 Habit Reminders','Morning + night habit alerts')}
        ${_ntog('financeNudge.enabled','💰 Finance Nudges','Overspend, no income, month-end alerts')}
        ${_ntog('goalDeadline.enabled','🎯 Goal Deadlines','30/7/1 day deadline warnings')}
        ${_ntog('dailyWisdom.enabled','🧠 Daily Wealth Wisdom','Morning formula/principle push')}
        ${_ntog('accountabilityRoast.enabled','😤 Accountability Roasts','Task pending 2+ days nudges')}
        ${_ntog('milestoneAlert.enabled','🎉 Milestone Celebrations','Streak + goal milestone alerts')}
      </div>
      <div style="padding:6px 16px;margin-top:6px;font-size:10px;font-weight:600;color:var(--t4);text-transform:uppercase;letter-spacing:.7px">Schedule</div>
      <div style="background:var(--c1)">
        <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--b1)"><div style="flex:1"><div style="font-size:13px;font-weight:500">Morning Briefing Time</div></div>
        <input type="time" value="${ns.morningBriefing?.time||'08:00'}" onchange="if(!S.notifSettings.morningBriefing)S.notifSettings.morningBriefing={enabled:true};S.notifSettings.morningBriefing.time=this.value;saveAll()" style="padding:4px 8px;border-radius:6px;border:1px solid var(--b1);background:var(--c2);color:var(--t1);font-size:12px"></div>
        <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--b1)"><div style="flex:1"><div style="font-size:13px;font-weight:500">Quiet Hours</div><div style="font-size:10px;color:var(--t4)">No notifications during these hours</div></div>
        <div style="display:flex;align-items:center;gap:4px"><input type="number" min="0" max="23" value="${ns.quietStart??23}" onchange="S.notifSettings.quietStart=parseInt(this.value);saveAll()" style="width:40px;padding:4px;border-radius:6px;border:1px solid var(--b1);background:var(--c2);color:var(--t1);font-size:12px;text-align:center"><span style="font-size:11px;color:var(--t4)">to</span><input type="number" min="0" max="23" value="${ns.quietEnd??7}" onchange="S.notifSettings.quietEnd=parseInt(this.value);saveAll()" style="width:40px;padding:4px;border-radius:6px;border:1px solid var(--b1);background:var(--c2);color:var(--t1);font-size:12px;text-align:center"></div></div>
      </div>
      <div style="padding:12px 16px;margin-top:8px"><button onclick="if('Notification' in window)Notification.requestPermission().then(p=>{showToast(p==='granted'?'Notifications enabled!':'Permission denied');_rSettings()})" class="btn bp" style="width:100%;padding:10px;font-size:13px">Enable Browser Notifications</button></div>
      <div style="padding:8px 16px"><button onclick="showNotifBanner('<div style=\\'font-size:14px;font-weight:600;margin-bottom:4px\\'>Test Notification ☀️</div><div>Yeh aise dikhega — tasks, habits, formulas sab!</div>');showToast('Test sent!')" class="btn bs" style="width:100%;padding:10px;font-size:13px">Test In-App Banner</button></div>
    </div>`;
    return;
  }

  // ── SUB: Tabs ──
  if (_settingsView === 'lifelessons') {
    const lessons = S.lifeLessons || [];
    const typeEmoji = {quote:'💬',moral:'🧭',mistake:'⚠️',lesson:'📝'};
    const typeColor = {quote:'var(--ac)',moral:'var(--g)',mistake:'var(--r)',lesson:'var(--p)'};
    pg.innerHTML = `${_sHeader('Life Lessons')}<div style="flex:1;overflow-y:auto;background:var(--bg)">
      <div style="padding:14px 16px;background:var(--c1);margin-top:2px;border-bottom:1px solid var(--b1)">
        <div style="font-size:12px;color:var(--t3);margin-bottom:8px">Apne quotes, morals, mistakes, lessons likho — AAKASH zarurat pe yaad dilayega.</div>
        <select id="llType" style="padding:8px 12px;border-radius:8px;border:1px solid var(--b1);background:var(--c2);color:var(--t1);font-size:12px;width:100%;margin-bottom:6px">
          <option value="lesson">📝 Lesson</option><option value="quote">💬 Quote</option><option value="moral">🧭 Moral</option><option value="mistake">⚠️ Mistake</option>
        </select>
        <textarea id="llText" class="inp" placeholder="Lesson/quote likho..." style="font-size:13px;min-height:60px;resize:vertical;margin-bottom:6px"></textarea>
        <input id="llCtx" class="inp" placeholder="Context (optional) — kab/kahan seekha" style="font-size:12px;margin-bottom:6px">
        <button onclick="const t=document.getElementById('llText').value.trim();if(t){if(!S.lifeLessons)S.lifeLessons=[];S.lifeLessons.push({id:Date.now(),type:document.getElementById('llType').value,text:t,context:document.getElementById('llCtx').value.trim(),createdAt:new Date().toISOString()});saveAll();if(typeof FIRE!=='undefined'&&FIRE.ready)FIRE.save('lifeLessons',Date.now().toString(),S.lifeLessons[S.lifeLessons.length-1]);_rSettings()}" class="btn bp" style="width:100%;padding:10px;font-size:13px">Save Lesson</button>
      </div>
      <div style="padding:6px 16px;margin-top:6px;font-size:10px;font-weight:600;color:var(--t4);text-transform:uppercase;letter-spacing:.7px">Saved (${lessons.length})</div>
      <div style="background:var(--c1)">${lessons.length===0?'<div style="padding:20px;text-align:center;font-size:12px;color:var(--t4)">Koi lesson nahi abhi. Chat mein bhi bol sakte ho — AI save kar lega.</div>':
      lessons.slice().reverse().map((l,i)=>{const idx=lessons.length-1-i;return `<div style="padding:12px 16px;border-bottom:1px solid var(--b1);border-left:3px solid ${typeColor[l.type]||'var(--ac)'}">
        <div style="display:flex;align-items:start;gap:8px">
          <span style="font-size:14px">${typeEmoji[l.type]||'📝'}</span>
          <div style="flex:1"><div style="font-size:13px;color:var(--t1);line-height:1.5">${l.text}</div>
          ${l.context?`<div style="font-size:10px;color:var(--t3);margin-top:3px">Context: ${l.context}</div>`:''}
          <div style="font-size:9px;color:var(--t4);margin-top:2px">${new Date(l.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div></div>
          <button onclick="S.lifeLessons.splice(${idx},1);saveAll();_rSettings()" style="color:var(--r);flex-shrink:0">${I.trash}</button>
        </div></div>`;}).join('')}</div></div>`;
    return;
  }

  // ── SUB: Tabs ──
  if (_settingsView === 'tabs') {
    pg.innerHTML = `${_sHeader('Visible Tabs')}<div style="flex:1;overflow-y:auto;background:var(--bg)">
      <div style="padding:10px 16px;font-size:12px;color:var(--t3);line-height:1.5">Toggle tabs. Chat always visible.</div>
      <div style="background:var(--c1)">${[{k:'chat',l:'Chat'},{k:'vault',l:'Vault'},{k:'notes',l:'Notes'},{k:'finance',l:'Money'},{k:'habits',l:'Habits'}].map(t=>{const h=(S.hiddenTabs||[]).includes(t.k);return `<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid var(--b1)"><span style="color:var(--t3)">${I[t.k]||I.star}</span><div style="flex:1;font-size:14px;font-weight:500">${t.l}</div>${t.k==='chat'?'<span style="font-size:11px;color:var(--t4)">Always on</span>':`<button onclick="if(${h}){S.hiddenTabs=S.hiddenTabs.filter(x=>x!=='${t.k}')}else{if(!S.hiddenTabs)S.hiddenTabs=[];S.hiddenTabs.push('${t.k}')}saveAll();_rSettings()" style="padding:6px 14px;border-radius:8px;background:${h?'var(--rBg)':'var(--gBg)'};color:${h?'var(--r)':'var(--g)'};border:1px solid ${h?'var(--rBorder)':'var(--gBorder)'};font-size:12px;font-weight:500">${h?'Hidden':'Visible'}</button>`}</div>`;}).join('')}</div></div>`;
    return;
  }

  // ══ MAIN SETTINGS ══
  pg.innerHTML = `<div style="padding:12px 16px;border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:10px;background:var(--c1);flex-shrink:0">
    <button onclick="document.getElementById('settingsPage').remove()" style="color:var(--t3)">${I.back}</button>
    <div style="font-size:16px;font-weight:600;flex:1">Settings</div></div>
  <div style="flex:1;overflow-y:auto;background:var(--bg)">
  <div style="padding:12px 16px;background:var(--c1);margin-bottom:2px"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;font-size:10px;color:var(--t3);text-align:center">
    <div style="padding:8px;background:var(--bg);border-radius:8px"><div style="font-size:16px;font-weight:600;color:var(--t1)">${S.entries.length}</div>entries</div>
    <div style="padding:8px;background:var(--bg);border-radius:8px"><div style="font-size:16px;font-weight:600;color:var(--t1)">${S.notes.length}</div>notes</div>
    <div style="padding:8px;background:var(--bg);border-radius:8px"><div style="font-size:16px;font-weight:600;color:var(--t1)">${S.chats.length}</div>chats</div></div></div>

  <div style="padding:6px 16px;margin-top:6px;font-size:10px;font-weight:600;color:var(--t4);text-transform:uppercase;letter-spacing:.7px">Account</div>
  <div style="background:var(--c1)">
    <div onclick="_settingsView='profile';_rSettings()" style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid var(--b1);cursor:pointer"><span style="color:var(--t3)">${I.user}</span><div style="flex:1"><div style="font-size:13px;font-weight:500">Profile</div><div style="font-size:10px;color:var(--t4)">Memories, rules</div></div><span style="color:var(--t4)">${I.chevron}</span></div>
    <div onclick="_settingsView='security';_rSettings()" style="display:flex;align-items:center;gap:12px;padding:13px 16px;cursor:pointer"><span style="color:var(--t3)">${I.lock}</span><div style="flex:1"><div style="font-size:13px;font-weight:500">Security</div><div style="font-size:10px;color:var(--t4)">PIN, encryption</div></div><span style="color:var(--t4)">${I.chevron}</span></div></div>

  <div style="padding:6px 16px;margin-top:6px;font-size:10px;font-weight:600;color:var(--t4);text-transform:uppercase;letter-spacing:.7px">API Keys</div>
  <div style="background:var(--c1)"><div onclick="_settingsView='keys';_rSettings()" style="display:flex;align-items:center;gap:12px;padding:13px 16px;cursor:pointer"><span style="color:var(--t3)">${I.key}</span><div style="flex:1"><div style="font-size:13px;font-weight:500">Manage keys</div><div style="font-size:10px;color:var(--t4)">${keys.filter(k=>k.enabled).length} active</div></div><span class="tag" style="background:var(--gBg);color:var(--g)">${keys.filter(k=>k.enabled).length}</span><span style="color:var(--t4)">${I.chevron}</span></div></div>

  <div style="padding:6px 16px;margin-top:6px;font-size:10px;font-weight:600;color:var(--t4);text-transform:uppercase;letter-spacing:.7px">Appearance</div>
  <div style="background:var(--c1)">
    <div style="padding:13px 16px;border-bottom:1px solid var(--b1)"><div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span style="color:var(--t3)">${I.sun}</span><div style="font-size:13px;font-weight:500">Theme</div></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px">${THEMES.map(t=>`<button onclick="sT('${t.id}');document.getElementById('settingsPage').remove();render();setTimeout(openSettings,100)" style="padding:7px;border-radius:8px;background:${gT()===t.id?'var(--acBg2)':'var(--c2)'};border:1.5px solid ${gT()===t.id?'var(--acBorder)':'var(--b1)'};font-size:10px;font-weight:${gT()===t.id?'600':'400'};color:${gT()===t.id?'var(--ac)':'var(--t3)'}">${t.name}</button>`).join('')}</div></div>
    <div style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid var(--b1)"><span style="color:var(--t3)">${I.font}</span><div style="flex:1;font-size:13px;font-weight:500">Font size</div><div style="display:flex;gap:4px">${[{v:'13',l:'S'},{v:'15',l:'M'},{v:'17',l:'L'}].map(f=>`<button onclick="localStorage.setItem('ak_fontsize','${f.v}');applyCustom()" style="width:28px;height:28px;border-radius:6px;background:${(localStorage.getItem('ak_fontsize')||'15')===f.v?'var(--acBg2)':'var(--c2)'};border:1px solid ${(localStorage.getItem('ak_fontsize')||'15')===f.v?'var(--acBorder)':'var(--b1)'};color:${(localStorage.getItem('ak_fontsize')||'15')===f.v?'var(--ac)':'var(--t3)'};font-size:11px;font-weight:500">${f.l}</button>`).join('')}</div></div>
    <div onclick="_settingsView='tabs';_rSettings()" style="display:flex;align-items:center;gap:12px;padding:13px 16px;cursor:pointer"><span style="color:var(--t3)">${I.layout}</span><div style="flex:1;font-size:13px;font-weight:500">Visible tabs</div><div style="font-size:11px;color:var(--t4)">${5-(S.hiddenTabs||[]).length}/5</div><span style="color:var(--t4)">${I.chevron}</span></div></div>

  <div style="padding:6px 16px;margin-top:6px;font-size:10px;font-weight:600;color:var(--t4);text-transform:uppercase;letter-spacing:.7px">AI Coach</div>
  <div style="background:var(--c1)">
    <div style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid var(--b1)"><span style="color:var(--t3)">${I.target}</span><div style="flex:1"><div style="font-size:13px;font-weight:500">Accountability Mode</div><div style="font-size:10px;color:var(--t4)">AI will push you on tasks, habits, goals</div></div>
    <button onclick="S.accountability.enabled=!S.accountability.enabled;saveAll();_rSettings()" style="padding:4px 10px;border-radius:6px;font-size:10px;font-weight:600;background:${S.accountability?.enabled?'var(--gBg)':'var(--rBg)'};color:${S.accountability?.enabled?'var(--g)':'var(--r)'};border:1px solid ${S.accountability?.enabled?'var(--gBorder)':'var(--rBorder)'}">${S.accountability?.enabled?'ON':'OFF'}</button></div>
    ${S.accountability?.enabled ? `<div style="padding:10px 16px;border-bottom:1px solid var(--b1)"><div style="font-size:11px;color:var(--t3);margin-bottom:6px;font-weight:500">Intensity</div>
    <div style="display:flex;gap:4px">${['gentle','funny','brutal'].map(i => `<button onclick="S.accountability.intensity='${i}';saveAll();_rSettings()" style="flex:1;padding:6px;border-radius:6px;font-size:11px;font-weight:500;background:${S.accountability?.intensity===i?'var(--acBg2)':'var(--c2)'};border:1px solid ${S.accountability?.intensity===i?'var(--acBorder)':'var(--b1)'};color:${S.accountability?.intensity===i?'var(--ac)':'var(--t3)'}">${i==='gentle'?'😊 Gentle':i==='funny'?'😂 Funny':'🔥 Brutal'}</button>`).join('')}</div></div>` : ''}
    <div onclick="_settingsView='notifications';_rSettings()" style="display:flex;align-items:center;gap:12px;padding:13px 16px;cursor:pointer"><span style="color:var(--t3)">${I.clock}</span><div style="flex:1"><div style="font-size:13px;font-weight:500">Notifications</div><div style="font-size:10px;color:var(--t4)">Morning briefing, habit alerts, finance nudges</div></div><span style="color:var(--t4)">${I.chevron}</span></div>
  </div>

  <div style="padding:6px 16px;margin-top:6px;font-size:10px;font-weight:600;color:var(--t4);text-transform:uppercase;letter-spacing:.7px">Life Lessons</div>
  <div style="background:var(--c1)">
    <div onclick="_settingsView='lifelessons';_rSettings()" style="display:flex;align-items:center;gap:12px;padding:13px 16px;cursor:pointer"><span style="color:var(--t3)">${I.book}</span><div style="flex:1"><div style="font-size:13px;font-weight:500">My Lessons & Quotes</div><div style="font-size:10px;color:var(--t4)">AI will remind you when relevant</div></div><span class="tag" style="background:var(--pBg);color:var(--p)">${(S.lifeLessons||[]).length}</span><span style="color:var(--t4)">${I.chevron}</span></div>
  </div>

  <div style="padding:6px 16px;margin-top:6px;font-size:10px;font-weight:600;color:var(--t4);text-transform:uppercase;letter-spacing:.7px">Data</div>
  <div style="background:var(--c1)">
    <div onclick="exportBackup()" style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid var(--b1);cursor:pointer"><span style="color:var(--t3)">${I.download}</span><div style="flex:1;font-size:13px;font-weight:500">Export backup</div></div>
    <div onclick="importBackup()" style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid var(--b1);cursor:pointer"><span style="color:var(--t3)">${I.upload}</span><div style="flex:1;font-size:13px;font-weight:500">Import backup</div></div>
    <div onclick="if(confirm('Clear all chats?')){S.chat=[];S.chats=[];mc=0;saveAll();showToast('Cleared')}" style="display:flex;align-items:center;gap:12px;padding:13px 16px;cursor:pointer"><span style="color:var(--t3)">${I.trash}</span><div style="flex:1;font-size:13px;font-weight:500">Clear chat history</div></div></div>

  <div style="padding:6px 16px;margin-top:6px;font-size:10px;font-weight:600;color:var(--r);text-transform:uppercase;letter-spacing:.7px">Danger</div>
  <div style="background:var(--c1)">
    <div onclick="_ck=null;document.getElementById('settingsPage').remove();render()" style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid var(--b1);cursor:pointer"><span style="color:var(--r)">${I.lock}</span><div style="font-size:13px;font-weight:500;color:var(--r)">Lock app</div></div>
    <div onclick="if(confirm('DELETE ALL DATA?')){localStorage.clear();location.reload()}" style="display:flex;align-items:center;gap:12px;padding:13px 16px;cursor:pointer"><span style="color:var(--r)">${I.warn}</span><div style="font-size:13px;font-weight:500;color:var(--r)">Wipe all data</div></div></div>

  <div style="padding:20px;text-align:center;font-size:10px;color:var(--t4)">AAKASH AI v2.0 · AES-256 · ${formatBytes(getStorageSize())}</div></div>`;
}

window.openSettings = function() { _settingsView='main'; history.pushState({tab,overlay:'settings'},'',''); const ov=document.createElement('div'); ov.id='settingsPage'; ov.style.cssText='position:fixed;inset:0;z-index:100;background:var(--bg);display:flex;flex-direction:column;animation:fadeIn .15s;max-width:480px;margin:0 auto'; document.body.appendChild(ov); _rSettings(); };

window._doAddKey = function() { const name=document.getElementById('addKeyName')?.value?.trim(); const key=document.getElementById('addKeyVal')?.value?.trim(); if(!name){showToast('Name dalo');return;} if(!key||key.length<6){showToast('Valid key paste karo');return;} const r=addApiKey(name,key); if(!r.ok){showToast(r.msg);return;} showToast((PROVIDER_MAP[r.provider]||{name:'Key'}).name+' added!'); _rSettings(); };

window.exportBackup = function() { const d=JSON.stringify(S); const b=new Blob([d],{type:'application/json'}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download='aakash-backup-'+td()+'.json'; a.click(); URL.revokeObjectURL(u); showToast('Exported!'); };

window.importBackup = function() { const i=document.createElement('input'); i.type='file'; i.accept='.json'; i.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=async()=>{try{const d=JSON.parse(r.result);if(confirm('Replace data?')){S={...S,...d};migrateKeys();await saveAll();showToast('Imported!');render();document.getElementById('settingsPage')?.remove();}}catch{showToast('Invalid file')}};r.readAsText(f)};i.click();};
