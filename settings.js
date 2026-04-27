// ════════════════════════════════════
//  AAKASH AI v2 — Settings (settings.js)
//  Full list page — not popup
// ════════════════════════════════════

window.openSettings = function() {
  const ov = document.createElement('div');
  ov.id = 'settingsPage';
  ov.style.cssText = 'position:fixed;inset:0;z-index:100;background:var(--bg);display:flex;flex-direction:column;animation:fadeIn .15s;max-width:480px;margin:0 auto';

  const keys = S.apiKeys || [];
  const srow = (ic, title, sub, right, onclick) => `<div onclick="${onclick||''}" style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid var(--b1);cursor:pointer;background:var(--c1)">
    <span style="color:var(--t3)">${I[ic]||I.star}</span>
    <div style="flex:1"><div style="font-size:13px;font-weight:500">${title}</div>${sub?`<div style="font-size:10px;color:var(--t4);margin-top:1px">${sub}</div>`:''}</div>
    ${right||''}<span style="color:var(--t4)">${I.chevron}</span>
  </div>`;

  const slbl = (t, color) => `<div style="padding:6px 16px;margin-top:6px;font-size:10px;font-weight:600;color:${color||'var(--t4)'};text-transform:uppercase;letter-spacing:.7px">${t}</div>`;

  ov.innerHTML = `
  <div style="padding:12px 16px;border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:10px;background:var(--c1);flex-shrink:0">
    <button onclick="document.getElementById('settingsPage').remove()" style="color:var(--t3)">${I.back}</button>
    <div style="font-size:16px;font-weight:600;flex:1">Settings</div>
  </div>
  <div style="flex:1;overflow-y:auto;background:var(--bg)">

  <!-- Stats -->
  <div style="padding:14px 16px;background:var(--c1);margin-bottom:2px">
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:11px;color:var(--t2);text-align:center">
      <div style="padding:8px;background:var(--bg);border-radius:8px"><div style="font-size:18px;font-weight:600;color:var(--t1)">${S.entries.length}</div>entries</div>
      <div style="padding:8px;background:var(--bg);border-radius:8px"><div style="font-size:18px;font-weight:600;color:var(--t1)">${S.notes.length}</div>notes</div>
      <div style="padding:8px;background:var(--bg);border-radius:8px"><div style="font-size:18px;font-weight:600;color:var(--t1)">${S.chats.length}</div>chats</div>
    </div>
  </div>

  ${slbl('Account')}
  ${srow('user','Profile','Memories, custom rules')}
  ${srow('lock','Security','PIN, encryption')}

  ${slbl('API keys')}
  ${srow('key','Manage keys',keys.filter(k=>k.enabled).length+' active',`<span class="tag" style="background:var(--gBg);color:var(--g)">${keys.filter(k=>k.enabled).length}</span>`,'openKeyManager()')}

  <div style="padding:12px 16px;background:var(--c1);border-bottom:1px solid var(--b1)">
    <div style="font-size:11px;font-weight:500;color:var(--t3);margin-bottom:6px">Quick add key</div>
    <div style="display:flex;gap:6px">
      <input id="qKeyName" class="inp" placeholder="Name" style="font-size:12px;flex:1">
      <input id="qKeyVal" class="inp" placeholder="API key" style="font-size:11px;font-family:JetBrains Mono,monospace;flex:2">
      <button onclick="_qAddKey()" class="btn bp" style="padding:8px 14px;font-size:12px;flex-shrink:0">Add</button>
    </div>
    <div id="qKeyInfo" style="font-size:10px;color:var(--t4);margin-top:4px"></div>
  </div>

  ${slbl('Appearance')}
  <div style="background:var(--c1);border-bottom:1px solid var(--b1)">
    <div style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid var(--b1)">
      <span style="color:var(--t3)">${I.sun}</span>
      <div style="flex:1"><div style="font-size:13px;font-weight:500">Theme</div></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:10px 16px">
    ${THEMES.map(t => `<button onclick="sT('${t.id}');document.getElementById('settingsPage').remove();render();openSettings()" style="padding:8px;border-radius:8px;background:${gT()===t.id?'var(--acBg2)':'var(--c2)'};border:1.5px solid ${gT()===t.id?'var(--acBorder)':'var(--b1)'};font-size:11px;font-weight:${gT()===t.id?'600':'400'};color:${gT()===t.id?'var(--ac)':'var(--t3)'}">${t.name}</button>`).join('')}
    </div>
  </div>

  <div style="background:var(--c1);border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:12px;padding:13px 16px">
    <span style="color:var(--t3)">${I.font}</span>
    <div style="flex:1;font-size:13px;font-weight:500">Font size</div>
    <div style="display:flex;gap:4px">
    ${[{v:'13',l:'S'},{v:'15',l:'M'},{v:'17',l:'L'}].map(f => `<button onclick="localStorage.setItem('ak_fontsize','${f.v}');applyCustom()" style="width:30px;height:30px;border-radius:6px;background:${(localStorage.getItem('ak_fontsize')||'15')===f.v?'var(--acBg2)':'var(--c2)'};border:1px solid ${(localStorage.getItem('ak_fontsize')||'15')===f.v?'var(--acBorder)':'var(--b1)'};color:${(localStorage.getItem('ak_fontsize')||'15')===f.v?'var(--ac)':'var(--t3)'};font-size:11px;font-weight:500">${f.l}</button>`).join('')}
    </div>
  </div>

  <div style="background:var(--c1);border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:12px;padding:13px 16px">
    <span style="color:var(--t3)">${I.layout}</span>
    <div style="flex:1;font-size:13px;font-weight:500">Visible tabs</div>
    <div style="font-size:11px;color:var(--t4)">${5-(S.hiddenTabs||[]).length}/5</div>
  </div>

  ${slbl('AI rules')}
  <div style="background:var(--c1);border-bottom:1px solid var(--b1);padding:10px 16px">
    ${(S.customRules||[]).map((r,i) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:12px;color:var(--t2)"><span>${r}</span><button onclick="S.customRules.splice(${i},1);saveAll();document.getElementById('settingsPage').remove();openSettings()" style="color:var(--r)">${I.close}</button></div>`).join('') || '<div style="font-size:11px;color:var(--t4)">No rules</div>'}
    <div style="display:flex;gap:6px;margin-top:6px">
      <input id="newRule" class="inp" placeholder="Add rule..." style="font-size:12px">
      <button onclick="const r=document.getElementById('newRule').value.trim();if(r){if(!S.customRules)S.customRules=[];S.customRules.push(r);saveAll();document.getElementById('settingsPage').remove();openSettings()}" class="btn bp" style="padding:6px 14px;font-size:12px">Add</button>
    </div>
  </div>

  ${S.memoryFacts?.length ? `${slbl('Memories')}
  <div style="background:var(--c1);border-bottom:1px solid var(--b1);padding:10px 16px;max-height:100px;overflow-y:auto">
  ${S.memoryFacts.map((f,i) => `<div style="font-size:11px;color:var(--t2);margin-bottom:3px;display:flex;justify-content:space-between;gap:8px"><span>${f.fact}</span><button onclick="S.memoryFacts.splice(${i},1);saveAll();document.getElementById('settingsPage').remove();openSettings()" style="color:var(--r);flex-shrink:0">${I.close}</button></div>`).join('')}
  </div>` : ''}

  ${slbl('Data')}
  ${srow('download','Export backup','','',`const d=JSON.stringify(S);const b=new Blob([d],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='aakash-backup-'+td()+'.json';a.click()`)}
  ${srow('upload','Import backup','','',`const i=document.createElement('input');i.type='file';i.accept='.json';i.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=async()=>{try{const d=JSON.parse(r.result);if(confirm('Replace data?')){S={...S,...d};migrateKeys();await saveAll();alert('Done');render()}}catch{alert('Invalid')}};r.readAsText(f)};i.click()`)}
  ${srow('trash','Clear chat history','','','if(confirm("Clear all chats?")){S.chat=[];S.chats=[];mc=0;saveAll();showToast("Cleared")}')}

  ${slbl('Danger','var(--r)')}
  <div onclick="_ck=null;document.getElementById('settingsPage').remove();render()" style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid var(--b1);cursor:pointer;background:var(--c1)">
    <span style="color:var(--r)">${I.lock}</span><div style="font-size:13px;font-weight:500;color:var(--r)">Lock app</div>
  </div>
  <div onclick="if(confirm('DELETE ALL DATA?')){localStorage.clear();location.reload()}" style="display:flex;align-items:center;gap:12px;padding:13px 16px;cursor:pointer;background:var(--c1)">
    <span style="color:var(--r)">${I.warn}</span><div style="font-size:13px;font-weight:500;color:var(--r)">Wipe all data</div>
  </div>

  <div style="padding:20px;text-align:center;font-size:10px;color:var(--t4)">AAKASH AI v2.0 · AES-256 · ${formatBytes(getStorageSize())}</div>
  </div>`;
  document.body.appendChild(ov);

  document.getElementById('qKeyVal')?.addEventListener('input', function() {
    const info = document.getElementById('qKeyInfo');
    if(!info) return;
    const key = this.value.trim();
    if(key.length<6){info.textContent='';return;}
    const pid = detectProvider(key);
    if(pid==='unknown'){info.innerHTML='Provider not detected';info.style.color='var(--t4)';return;}
    const prov = PROVIDER_MAP[pid];
    info.innerHTML=`${prov.name} detected — ${prov.caps.slice(0,4).join(', ')}`;
    info.style.color='var(--g)';
  });
};

window._qAddKey = function() {
  const name = document.getElementById('qKeyName')?.value?.trim();
  const key = document.getElementById('qKeyVal')?.value?.trim();
  if(!name){showToast('Name dalo');return;}
  if(!key||key.length<6){showToast('Valid key paste karo');return;}
  const result = addApiKey(name, key);
  if(!result.ok){showToast(result.msg);return;}
  const prov = PROVIDER_MAP[result.provider]||{name:'Unknown'};
  showToast(`${prov.name} added!`);
  document.getElementById('settingsPage').remove();
  openSettings();
};

window.openKeyManager = function() {
  // Reopen settings focused on keys - for now just scroll to keys section
  showToast('Keys section above');
};
