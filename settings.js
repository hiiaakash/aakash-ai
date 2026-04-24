// ════════════════════════════════════
//  AAKASH AI — Settings (settings.js)
//  Now with Smart API Key Pool
//  Add key + name → auto-detect → auto-unlock
// ════════════════════════════════════

window.openSettings = function() {
  const caps = getActiveCaps();
  const features = getUnlockedFeatures();
  const keys = S.apiKeys || [];

  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:100;background:var(--overlay);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn .2s';
  ov.innerHTML = `<div style="background:var(--c1);border-radius:20px;padding:24px;max-width:380px;width:100%;border:1px solid var(--b1);max-height:90vh;overflow-y:auto;box-shadow:var(--shadowLg)">
  <div style="font-size:18px;font-weight:700;margin-bottom:16px">⚙️ Settings</div>

  <!-- STATS -->
  <div style="padding:14px;background:var(--bg);border-radius:12px;border:1px solid var(--b1);margin-bottom:14px;font-size:14px;color:var(--t2);line-height:2">
    📦 ${S.entries.length} entries · 📝 ${S.notes.length} notes · 📅 ${S.habits.length} habits<br>
    💬 ${S.chat.length} msgs · 📂 ${S.chats.length} chats · 🗂️ ${S.projects.length} projects<br>
    💰 ${S.finance.expenses.length} expenses · 🧠 ${S.memoryFacts?.length || 0} memories<br>
    🔑 ${keys.filter(k => k.enabled).length} active keys · 💾 ${formatBytes(getStorageSize())}
  </div>

  <!-- ═══ API KEYS POOL ═══ -->
  <div style="font-size:15px;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:6px">🔑 API Keys</div>
  <div style="font-size:12px;color:var(--t4);margin-bottom:10px;line-height:1.6">Key add karo, naam do — features automatic unlock honge. System khud detect karega ki key kaunsi hai.</div>

  <!-- Existing Keys -->
  <div id="keysList" style="margin-bottom:10px">
  ${keys.length === 0 ? '<div style="text-align:center;padding:14px;color:var(--t4);font-size:13px;background:var(--bg);border-radius:8px">Koi key nahi hai. Add karo!</div>' :
  keys.map(k => {
    const prov = PROVIDER_MAP[k.provider] || { name:'Unknown', icon:'❓', caps:[] };
    return `<div style="padding:10px 12px;background:var(--bg);border-radius:10px;border:1px solid var(--b1);margin-bottom:6px;${!k.enabled ? 'opacity:0.5' : ''}">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:18px">${prov.icon}</span>
          <div>
            <div style="font-size:14px;font-weight:600;color:var(--t1)">${k.name}</div>
            <div style="font-size:11px;color:var(--t4)">${prov.name} · ${k.key.slice(0,8)}...${k.key.slice(-4)}</div>
          </div>
        </div>
        <div style="display:flex;gap:4px;align-items:center">
          <button onclick="toggleApiKey(${k.id});this.closest('div[style*=fixed]').remove();openSettings()" style="padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;background:${k.enabled ? 'var(--gBg)' : 'var(--rBg)'};color:${k.enabled ? 'var(--g)' : 'var(--r)'};border:1px solid ${k.enabled ? 'var(--gBorder)' : 'var(--rBorder)'}">${k.enabled ? 'ON' : 'OFF'}</button>
          <button onclick="if(confirm('Remove this key?')){removeApiKey(${k.id});this.closest('div[style*=fixed]').remove();openSettings()}" style="color:var(--r);font-size:14px;padding:4px">✕</button>
        </div>
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">
        ${prov.caps.slice(0,6).map(c => `<span style="padding:2px 8px;border-radius:10px;font-size:10px;background:var(--acBg);color:var(--ac);font-weight:500">${c.replace('_',' ')}</span>`).join('')}
        ${prov.caps.length > 6 ? `<span style="font-size:10px;color:var(--t4)">+${prov.caps.length-6}</span>` : ''}
      </div>
    </div>`;
  }).join('')}
  </div>

  <!-- Add New Key -->
  <div style="padding:14px;background:var(--bg);border-radius:12px;border:1px solid var(--b1);margin-bottom:14px">
    <div style="font-size:13px;font-weight:600;color:var(--t2);margin-bottom:8px">+ Add New Key</div>
    <input id="newKeyName" class="inp" placeholder="Name (e.g., Gemini, Voice, Image wali)" style="font-size:13px;margin-bottom:6px">
    <input id="newKeyValue" class="inp" placeholder="API key paste karo..." style="font-size:12px;font-family:IBM Plex Mono,monospace;margin-bottom:8px">
    <div id="keyDetectInfo" style="font-size:12px;color:var(--t4);margin-bottom:8px;min-height:18px"></div>
    <button onclick="_addKeyFromSettings()" class="btn bp" style="width:100%;padding:12px;font-size:14px">Add Key</button>
  </div>

  <!-- Auto-detect preview on input -->
  <script>
    document.getElementById('newKeyValue')?.addEventListener('input', function() {
      const info = document.getElementById('keyDetectInfo');
      if (!info) return;
      const key = this.value.trim();
      if (key.length < 6) { info.textContent = ''; return; }
      const pid = detectProvider(key);
      if (pid === 'unknown') { info.innerHTML = '❓ Provider detect nahi hua — but add kar sakte ho'; return; }
      const prov = PROVIDER_MAP[pid];
      info.innerHTML = prov.icon + ' <strong>' + prov.name + '</strong> detected → ' + prov.caps.slice(0,4).join(', ') + (prov.caps.length > 4 ? '...' : '');
      info.style.color = 'var(--g)';
    });
  </script>

  <!-- Unlocked Features -->
  ${features.length ? `<div style="font-size:13px;font-weight:600;color:var(--t2);margin-bottom:6px">✨ Unlocked Features (${features.length})</div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
    ${features.map(f => `<span style="padding:5px 12px;border-radius:20px;background:var(--gBg);color:var(--g);font-size:12px;font-weight:600;border:1px solid var(--gBorder)">${f.label}</span>`).join('')}
  </div>` : ''}

  <!-- THEME -->
  <div style="font-size:13px;color:var(--t2);margin-bottom:6px;font-weight:600">Theme</div>
  <div style="display:flex;gap:6px;margin-bottom:12px">
    <button onclick="sT('light');this.closest('div[style*=fixed]').remove();render();openSettings()" style="flex:1;padding:10px;border-radius:8px;background:${gT()==='light'?'var(--acBg2)':'var(--c2)'};border:1.5px solid ${gT()==='light'?'var(--acBorder)':'var(--b1)'};color:${gT()==='light'?'var(--ac)':'var(--t3)'};font-weight:600;font-size:14px">☀️ Light</button>
    <button onclick="sT('dark');this.closest('div[style*=fixed]').remove();render();openSettings()" style="flex:1;padding:10px;border-radius:8px;background:${gT()==='dark'?'var(--acBg2)':'var(--c2)'};border:1.5px solid ${gT()==='dark'?'var(--acBorder)':'var(--b1)'};color:${gT()==='dark'?'var(--ac)':'var(--t3)'};font-weight:600;font-size:14px">🌙 Dark</button>
  </div>

  <!-- ACCENT COLOR -->
  <div style="font-size:13px;color:var(--t2);margin-bottom:6px;font-weight:600">Accent Color</div>
  <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
  ${['#c2410c','#2563eb','#7c3aed','#16a34a','#dc2626','#ca8a04','#0891b2','#be185d'].map(c => `<button onclick="localStorage.setItem('ak_accent','${c}');applyCustom();this.closest('div[style*=fixed]').remove();render();openSettings()" style="width:36px;height:36px;border-radius:10px;background:${c};border:3px solid ${localStorage.getItem('ak_accent')===c || (!localStorage.getItem('ak_accent') && c==='#c2410c') ? 'var(--t1)' : 'transparent'}"></button>`).join('')}
  </div>

  <!-- FONT SIZE -->
  <div style="font-size:13px;color:var(--t2);margin-bottom:6px;font-weight:600">Font Size</div>
  <div style="display:flex;gap:6px;margin-bottom:12px">
  ${[{v:'13',l:'Small'},{v:'15',l:'Medium'},{v:'17',l:'Large'}].map(f => `<button onclick="localStorage.setItem('ak_fontsize','${f.v}');applyCustom();this.closest('div[style*=fixed]').remove();render();openSettings()" style="flex:1;padding:8px;border-radius:8px;background:${(localStorage.getItem('ak_fontsize')||'15')===f.v?'var(--acBg2)':'var(--c2)'};border:1.5px solid ${(localStorage.getItem('ak_fontsize')||'15')===f.v?'var(--acBorder)':'var(--b1)'};color:${(localStorage.getItem('ak_fontsize')||'15')===f.v?'var(--ac)':'var(--t3)'};font-size:13px;font-weight:600">${f.l}</button>`).join('')}
  </div>

  <!-- VISIBLE TABS -->
  <div style="font-size:13px;color:var(--t2);margin-bottom:6px;font-weight:600">Visible Tabs</div>
  <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">
  ${['vault','notes','finance','habits','timer','create'].map(t => { const hidden = (S.hiddenTabs||[]).includes(t); return `<button onclick="if(${hidden}){S.hiddenTabs=S.hiddenTabs.filter(x=>x!=='${t}')}else{S.hiddenTabs.push('${t}')}saveAll();this.closest('div[style*=fixed]').remove();render();openSettings()" style="padding:6px 14px;border-radius:24px;background:${hidden?'var(--rBg)':'var(--gBg)'};border:1px solid ${hidden?'var(--rBorder)':'var(--gBorder)'};color:${hidden?'var(--r)':'var(--g)'};font-size:12px;font-weight:600">${hidden?'✕':'✓'} ${t}</button>`; }).join('')}
  </div>

  <!-- CUSTOM RULES -->
  <div style="font-size:13px;color:var(--t2);margin-bottom:6px;font-weight:600">Custom AI Rules (${(S.customRules||[]).length})</div>
  <div style="margin-bottom:6px">
  ${(S.customRules||[]).map((r,i) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:var(--bg);border-radius:6px;margin-bottom:4px;font-size:13px;color:var(--t2)"><span>→ ${r}</span><button onclick="S.customRules.splice(${i},1);saveAll();this.closest('div[style*=fixed]').remove();openSettings()" style="color:var(--r);font-size:12px;font-weight:600">✕</button></div>`).join('') || '<div style="font-size:12px;color:var(--t4);padding:4px">No custom rules</div>'}
  </div>
  <div style="display:flex;gap:6px;margin-bottom:14px">
    <input id="newRule" class="inp" placeholder="Add custom rule..." style="font-size:13px">
    <button onclick="const r=document.getElementById('newRule').value.trim();if(r){if(!S.customRules)S.customRules=[];S.customRules.push(r);saveAll();this.closest('div[style*=fixed]').remove();openSettings()}" class="btn bp" style="padding:8px 14px;font-size:13px;flex-shrink:0">Add</button>
  </div>

  <!-- MEMORIES -->
  ${S.memoryFacts?.length ? `<div style="font-size:13px;color:var(--t2);margin-bottom:6px;font-weight:600">🧠 Memories (${S.memoryFacts.length})</div>
  <div style="padding:8px;background:var(--bg);border-radius:8px;margin-bottom:14px;max-height:100px;overflow-y:auto;border:1px solid var(--b1)">
  ${S.memoryFacts.map((f,i) => `<div style="font-size:13px;color:var(--t2);margin-bottom:4px;display:flex;justify-content:space-between;gap:8px"><span>→ ${f.fact}</span><button onclick="S.memoryFacts.splice(${i},1);saveAll();this.closest('div[style*=fixed]').remove();openSettings()" style="color:var(--r);font-size:12px;flex-shrink:0">✕</button></div>`).join('')}
  </div>` : ''}

  <!-- DATA INFO -->
  <div style="padding:12px;background:var(--yBg);border-radius:8px;border:1px solid rgba(202,138,4,.2);margin-bottom:14px;font-size:12px;color:var(--t2);line-height:1.7">
    <strong>📍 Data:</strong> Browser localStorage, AES-256 encrypted. Export backups regularly!
  </div>

  <!-- ACTIONS -->
  <div style="display:flex;flex-direction:column;gap:8px">
    <button onclick="const d=JSON.stringify(S);const b=new Blob([d],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='aakash-backup-'+td()+'.json';a.click();URL.revokeObjectURL(u)" style="width:100%;padding:12px;border-radius:10px;border:1.5px solid var(--gBorder);background:var(--gBg);color:var(--g);font-size:14px;font-weight:600">📥 Export Backup</button>
    <button onclick="const i=document.createElement('input');i.type='file';i.accept='.json';i.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=async()=>{try{const d=JSON.parse(r.result);if(confirm('Replace data?')){S={...S,...d};migrateKeys();await saveAll();alert('✅');render()}}catch{alert('❌ Invalid')}};r.readAsText(f)};i.click()" style="width:100%;padding:12px;border-radius:10px;border:1.5px solid var(--acBorder);background:var(--acBg);color:var(--ac);font-size:14px;font-weight:600">📤 Import Backup</button>
    <button onclick="S.chat=[];mc=0;saveAll();alert('✅')" style="width:100%;padding:12px;border-radius:10px;border:1.5px solid var(--b1);background:var(--c2);color:var(--t2);font-size:14px;font-weight:600">🗑️ Clear Chat</button>
    <button onclick="_ck=null;this.closest('div[style*=fixed]').remove();render()" style="width:100%;padding:12px;border-radius:10px;border:1.5px solid var(--b1);background:var(--c2);color:var(--t2);font-size:14px;font-weight:600">🔒 Lock App</button>
    <button onclick="if(confirm('⚠️ DELETE ALL DATA?')){localStorage.clear();location.reload()}" style="width:100%;padding:12px;border-radius:10px;border:1.5px solid var(--rBorder);background:var(--rBg);color:var(--r);font-size:14px;font-weight:600">⚠️ Wipe All</button>
  </div>
  <button onclick="this.closest('div[style*=fixed]').remove()" style="width:100%;margin-top:12px;padding:12px;border-radius:10px;background:var(--bg);color:var(--t3);font-size:14px;font-weight:600;border:1px solid var(--b1)">Close</button>
  </div>`;
  document.body.appendChild(ov);
};

// ── ADD KEY HANDLER ──
window._addKeyFromSettings = function() {
  const nameEl = document.getElementById('newKeyName');
  const keyEl = document.getElementById('newKeyValue');
  const name = nameEl?.value?.trim();
  const key = keyEl?.value?.trim();

  if (!name) { alert('Name dalo!'); return; }
  if (!key || key.length < 6) { alert('Valid API key paste karo!'); return; }

  const result = addApiKey(name, key);
  if (!result.ok) { alert(result.msg); return; }

  // Show success with detected provider info
  const prov = PROVIDER_MAP[result.provider] || { name:'Unknown', icon:'❓' };
  const capsStr = (result.caps || []).slice(0, 5).join(', ');
  alert(`✅ ${prov.icon} ${prov.name} detected!\n\nFeatures unlocked: ${capsStr || 'basic chat'}`);

  // Refresh settings
  document.querySelector('div[style*="position:fixed"]')?.remove();
  openSettings();
};
