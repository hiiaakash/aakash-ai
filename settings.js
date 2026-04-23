// ════════════════════════════════════
//  AAKASH AI — Settings (settings.js)
//  API keys, theme, backup, etc.
// ════════════════════════════════════

window.openSettings = function() {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:100;background:var(--overlay);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn .2s';
  ov.innerHTML = `<div style="background:var(--c1);border-radius:20px;padding:24px;max-width:360px;width:100%;border:1px solid var(--b1);max-height:90vh;overflow-y:auto;box-shadow:var(--shadowLg)">
  <div style="font-size:18px;font-weight:700;margin-bottom:16px">⚙️ Settings</div>

  <div style="padding:14px;background:var(--bg);border-radius:12px;border:1px solid var(--b1);margin-bottom:14px;font-size:14px;color:var(--t2);line-height:2">
    📦 ${S.entries.length} entries · 📝 ${S.notes.length} notes · 📅 ${S.habits.length} habits<br>
    💬 ${S.chat.length} msgs · 📂 ${S.chats.length} saved chats · 🗂️ ${S.projects.length} projects<br>
    💰 ${S.finance.expenses.length} expenses · 🧠 ${S.memoryFacts?.length || 0} memories<br>
    💾 ${formatBytes(getStorageSize())}
  </div>

  <!-- THEME -->
  <div style="font-size:13px;color:var(--t2);margin-bottom:6px;font-weight:600">Theme</div>
  <div style="display:flex;gap:6px;margin-bottom:12px">
    <button onclick="sT('light');this.closest('div[style*=fixed]').remove();render();openSettings()" style="flex:1;padding:10px;border-radius:8px;background:${gT() === 'light' ? 'var(--acBg2)' : 'var(--c2)'};border:1.5px solid ${gT() === 'light' ? 'var(--acBorder)' : 'var(--b1)'};color:${gT() === 'light' ? 'var(--ac)' : 'var(--t3)'};font-weight:600;font-size:14px">☀️ Light</button>
    <button onclick="sT('dark');this.closest('div[style*=fixed]').remove();render();openSettings()" style="flex:1;padding:10px;border-radius:8px;background:${gT() === 'dark' ? 'var(--acBg2)' : 'var(--c2)'};border:1.5px solid ${gT() === 'dark' ? 'var(--acBorder)' : 'var(--b1)'};color:${gT() === 'dark' ? 'var(--ac)' : 'var(--t3)'};font-weight:600;font-size:14px">🌙 Dark</button>
  </div>

  <!-- ACCENT COLOR -->
  <div style="font-size:13px;color:var(--t2);margin-bottom:6px;font-weight:600">Accent Color</div>
  <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
  ${['#c2410c', '#2563eb', '#7c3aed', '#16a34a', '#dc2626', '#ca8a04', '#0891b2', '#be185d'].map(c => `<button onclick="localStorage.setItem('ak_accent','${c}');applyCustom();this.closest('div[style*=fixed]').remove();render();openSettings()" style="width:36px;height:36px;border-radius:10px;background:${c};border:3px solid ${localStorage.getItem('ak_accent') === c || (!localStorage.getItem('ak_accent') && c === '#c2410c') ? 'var(--t1)' : 'transparent'}"></button>`).join('')}
  </div>

  <!-- FONT SIZE -->
  <div style="font-size:13px;color:var(--t2);margin-bottom:6px;font-weight:600">Font Size</div>
  <div style="display:flex;gap:6px;margin-bottom:12px">
  ${[{ v: '13', l: 'Small' }, { v: '15', l: 'Medium' }, { v: '17', l: 'Large' }].map(f => `<button onclick="localStorage.setItem('ak_fontsize','${f.v}');applyCustom();this.closest('div[style*=fixed]').remove();render();openSettings()" style="flex:1;padding:8px;border-radius:8px;background:${(localStorage.getItem('ak_fontsize') || '15') === f.v ? 'var(--acBg2)' : 'var(--c2)'};border:1.5px solid ${(localStorage.getItem('ak_fontsize') || '15') === f.v ? 'var(--acBorder)' : 'var(--b1)'};color:${(localStorage.getItem('ak_fontsize') || '15') === f.v ? 'var(--ac)' : 'var(--t3)'};font-size:13px;font-weight:600">${f.l}</button>`).join('')}
  </div>

  <!-- VISIBLE TABS -->
  <div style="font-size:13px;color:var(--t2);margin-bottom:6px;font-weight:600">Visible Tabs</div>
  <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">
  ${['vault', 'notes', 'finance', 'habits', 'timer', 'create'].map(t => { const hidden = (S.hiddenTabs || []).includes(t); return `<button onclick="if(${hidden}){S.hiddenTabs=S.hiddenTabs.filter(x=>x!=='${t}')}else{S.hiddenTabs.push('${t}')}saveAll();this.closest('div[style*=fixed]').remove();render();openSettings()" style="padding:6px 14px;border-radius:24px;background:${hidden ? 'var(--rBg)' : 'var(--gBg)'};border:1px solid ${hidden ? 'var(--rBorder)' : 'var(--gBorder)'};color:${hidden ? 'var(--r)' : 'var(--g)'};font-size:12px;font-weight:600">${hidden ? '✕' : '✓'} ${t}</button>`; }).join('')}
  </div>

  <!-- CUSTOM RULES -->
  <div style="font-size:13px;color:var(--t2);margin-bottom:6px;font-weight:600">Custom AI Rules (${(S.customRules || []).length})</div>
  <div style="margin-bottom:6px">
  ${(S.customRules || []).map((r, i) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:var(--bg);border-radius:6px;margin-bottom:4px;font-size:13px;color:var(--t2)"><span>→ ${r}</span><button onclick="S.customRules.splice(${i},1);saveAll();this.closest('div[style*=fixed]').remove();openSettings()" style="color:var(--r);font-size:12px;font-weight:600">✕</button></div>`).join('') || '<div style="font-size:12px;color:var(--t4);padding:4px">No custom rules</div>'}
  </div>
  <div style="display:flex;gap:6px;margin-bottom:14px">
    <input id="newRule" class="inp" placeholder="Add custom rule..." style="font-size:13px">
    <button onclick="const r=document.getElementById('newRule').value.trim();if(r){if(!S.customRules)S.customRules=[];S.customRules.push(r);saveAll();this.closest('div[style*=fixed]').remove();openSettings()}" class="btn bp" style="padding:8px 14px;font-size:13px;flex-shrink:0">Add</button>
  </div>

  <!-- MEMORIES -->
  ${S.memoryFacts?.length ? `<div style="font-size:13px;color:var(--t2);margin-bottom:6px;font-weight:600">🧠 Memories (${S.memoryFacts.length})</div>
  <div style="padding:8px;background:var(--bg);border-radius:8px;margin-bottom:14px;max-height:100px;overflow-y:auto;border:1px solid var(--b1)">
  ${S.memoryFacts.map((f, i) => `<div style="font-size:13px;color:var(--t2);margin-bottom:4px;display:flex;justify-content:space-between;gap:8px"><span>→ ${f.fact}</span><button onclick="S.memoryFacts.splice(${i},1);saveAll();this.closest('div[style*=fixed]').remove();openSettings()" style="color:var(--r);font-size:12px;flex-shrink:0">✕</button></div>`).join('')}
  </div>` : ''}

  <!-- API KEYS -->
  <div style="font-size:13px;color:var(--t2);margin-bottom:4px;font-weight:600">Claude API Key</div>
  <div style="display:flex;gap:6px;margin-bottom:8px"><input id="sK" class="inp" value="${S.apiKey}" style="font-size:12px;font-family:IBM Plex Mono,monospace"><button onclick="S.apiKey=document.getElementById('sK').value.trim();saveAll();alert('✅')" class="btn bp" style="padding:8px 12px;font-size:12px;flex-shrink:0">Save</button></div>
  <div style="font-size:13px;color:var(--t2);margin-bottom:4px;font-weight:600">Gemini API Key <span style="font-weight:400;color:var(--t4)">(free backup)</span></div>
  <div style="display:flex;gap:6px;margin-bottom:8px"><input id="sGK" class="inp" value="${S.geminiKey || ''}" placeholder="AIza..." style="font-size:12px;font-family:IBM Plex Mono,monospace"><button onclick="S.geminiKey=document.getElementById('sGK').value.trim();saveAll();alert('✅')" class="btn bp" style="padding:8px 12px;font-size:12px;flex-shrink:0">Save</button></div>
  <div style="font-size:13px;color:var(--t2);margin-bottom:4px;font-weight:600">ElevenLabs Key</div>
  <div style="display:flex;gap:6px;margin-bottom:14px"><input id="sEL" class="inp" value="${S.elKey || ''}" placeholder="xi-..." style="font-size:12px;font-family:IBM Plex Mono,monospace"><button onclick="S.elKey=document.getElementById('sEL').value.trim();saveAll();alert('✅')" class="btn bp" style="padding:8px 12px;font-size:12px;flex-shrink:0">Save</button></div>

  <!-- DATA INFO -->
  <div style="padding:12px;background:var(--yBg);border-radius:8px;border:1px solid rgba(202,138,4,.2);margin-bottom:14px;font-size:12px;color:var(--t2);line-height:1.7">
    <strong>📍 Data Location:</strong> Browser localStorage on this device. AES-256 encrypted. Export backups regularly!
  </div>

  <!-- ACTIONS -->
  <div style="display:flex;flex-direction:column;gap:8px">
    <button onclick="const d=JSON.stringify(S);const b=new Blob([d],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='aakash-backup-'+td()+'.json';a.click();URL.revokeObjectURL(u)" style="width:100%;padding:12px;border-radius:10px;border:1.5px solid var(--gBorder);background:var(--gBg);color:var(--g);font-size:14px;font-weight:600">📥 Export Backup</button>
    <button onclick="const i=document.createElement('input');i.type='file';i.accept='.json';i.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=async()=>{try{const d=JSON.parse(r.result);if(confirm('Replace data?')){S={...S,...d};await saveAll();alert('✅');render()}}catch{alert('❌ Invalid')}};r.readAsText(f)};i.click()" style="width:100%;padding:12px;border-radius:10px;border:1.5px solid var(--acBorder);background:var(--acBg);color:var(--ac);font-size:14px;font-weight:600">📤 Import Backup</button>
    <button onclick="S.chat=[];mc=0;saveAll();alert('✅')" style="width:100%;padding:12px;border-radius:10px;border:1.5px solid var(--b1);background:var(--c2);color:var(--t2);font-size:14px;font-weight:600">🗑️ Clear Chat</button>
    <button onclick="_ck=null;this.closest('div[style*=fixed]').remove();render()" style="width:100%;padding:12px;border-radius:10px;border:1.5px solid var(--b1);background:var(--c2);color:var(--t2);font-size:14px;font-weight:600">🔒 Lock App</button>
    <button onclick="if(confirm('⚠️ DELETE ALL DATA?')){localStorage.clear();location.reload()}" style="width:100%;padding:12px;border-radius:10px;border:1.5px solid var(--rBorder);background:var(--rBg);color:var(--r);font-size:14px;font-weight:600">⚠️ Wipe All</button>
  </div>
  <button onclick="this.closest('div[style*=fixed]').remove()" style="width:100%;margin-top:12px;padding:12px;border-radius:10px;background:var(--bg);color:var(--t3);font-size:14px;font-weight:600;border:1px solid var(--b1)">Close</button>
  </div>`;
  document.body.appendChild(ov);
};
