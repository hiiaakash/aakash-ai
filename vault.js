// ════════════════════════════════════
//  AAKASH AI v2 — Vault (vault.js)
//  Items + Coach + Timer (merged)
// ════════════════════════════════════

let vf = 'all', ve = null, vaultView = 'items';
let pm = { on:false, time:1500, mode:'work', sess:0 }, pi = null;

function rVault(ct) {
  ct.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;min-height:0">
  <div style="display:flex;gap:3px;padding:3px;margin:8px 12px 4px;background:var(--bg3);border-radius:10px;flex-shrink:0">
    ${['items','coach','timer'].map(v => `<button onclick="vaultView='${v}';rVault(document.getElementById('ct'))" style="flex:1;padding:7px;border-radius:8px;font-size:12px;font-weight:${vaultView===v?'600':'400'};background:${vaultView===v?'var(--c1)':'transparent'};color:${vaultView===v?'var(--t1)':'var(--t4)'};${vaultView===v?'box-shadow:var(--shadow)':''};display:flex;align-items:center;justify-content:center;gap:4px">${v==='items'?I.vault:v==='coach'?I.target:I.clock} ${v[0].toUpperCase()+v.slice(1)}</button>`).join('')}
  </div>
  ${vaultView==='coach' ? '<div id="vltChatWrap" style="flex:1;display:flex;flex-direction:column;min-height:0"></div>' :
    vaultView==='timer' ? rVaultTimer() : rVaultItems()}
  </div>`;
  if (vaultView==='coach') { const w=document.getElementById('vltChatWrap'); if(w) renderEmbeddedChat('vault',w); }
}

function rVaultItems() {
  const ic = {task:I.check, goal:I.target, note:I.notes, idea:I.idea};
  const items = S.entries.filter(e => vf==='all' || e.type===vf);
  return `<div style="display:flex;gap:4px;padding:4px 12px;overflow-x:auto;flex-shrink:0">
  ${['all','task','goal','note','idea'].map(t => `<button onclick="vf='${t}';rVault(document.getElementById('ct'))" style="padding:5px 14px;border-radius:16px;background:${vf===t?'var(--acBg2)':'var(--c2)'};border:1px solid ${vf===t?'var(--acBorder)':'var(--b1)'};color:${vf===t?'var(--ac)':'var(--t3)'};font-size:11px;font-weight:500;white-space:nowrap">${t[0].toUpperCase()+t.slice(1)}</button>`).join('')}
  </div>
  <div style="flex:1;overflow-y:auto;padding:8px 12px;display:flex;flex-direction:column;gap:6px">
  ${!items.length ? '<div style="display:flex;align-items:center;justify-content:center;flex:1;color:var(--t4);font-size:13px">No entries yet</div>' :
  items.map(e => `<div class="cd" style="cursor:pointer;${ve===e.id?'border-color:var(--ac)':''}" onclick="ve=ve===${e.id}?null:${e.id};rVault(document.getElementById('ct'))">
    <div style="display:flex;align-items:center;gap:10px">
      <span style="color:var(--t3)">${ic[e.type]||I.notes}</span>
      <span style="flex:1;font-size:13px;font-weight:500;${e.done?'color:var(--t4);text-decoration:line-through':''};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.title}</span>
      ${e.type==='task'||e.type==='goal' ? `<button onclick="event.stopPropagation();S.entries.find(x=>x.id===${e.id}).done=!S.entries.find(x=>x.id===${e.id}).done;saveAll();rVault(document.getElementById('ct'))" style="width:22px;height:22px;border-radius:6px;border:2px solid ${e.done?'var(--g)':'var(--b1)'};background:${e.done?'var(--gBg)':'var(--c1)'};display:flex;align-items:center;justify-content:center;color:var(--g)">${e.done?I.check:''}</button>` : ''}
    </div>
    ${ve===e.id && e.content ? `<div style="margin-top:8px"><div style="color:var(--t2);font-size:12px;line-height:1.6;padding:10px;background:var(--bg);border-radius:8px;margin-bottom:6px;white-space:pre-wrap">${fmt(e.content)}</div>
    <button onclick="event.stopPropagation();S.entries=S.entries.filter(x=>x.id!==${e.id});saveAll();rVault(document.getElementById('ct'))" style="padding:5px 12px;font-size:11px;border-radius:6px;border:1px solid var(--rBorder);color:var(--r);background:var(--rBg);font-weight:500;display:flex;align-items:center;gap:4px">${I.trash} Delete</button></div>` : ''}
  </div>`).join('')}
  </div>`;
}

function rVaultTimer() {
  const min = Math.floor(pm.time/60), sec = pm.time%60;
  return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px">
  <div style="font-size:13px;color:${pm.mode==='work'?'var(--ac)':'var(--g)'};letter-spacing:3px;font-weight:600;text-transform:uppercase;margin-bottom:24px">${pm.mode==='work'?'Focus':'Break'}</div>
  <div style="width:180px;height:180px;border-radius:50%;border:3px solid ${pm.mode==='work'?'var(--ac)':'var(--g)'};display:flex;align-items:center;justify-content:center;margin-bottom:24px;${pm.on?'animation:pulse 2s infinite':''}">
    <div style="font-size:48px;font-weight:300;font-family:JetBrains Mono,monospace">${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}</div>
  </div>
  <div style="display:flex;gap:10px;margin-bottom:20px">
    <button onclick="if(pm.on){clearInterval(pi);pm.on=false}else{pm.on=true;pi=setInterval(()=>{pm.time--;if(pm.time<=0){clearInterval(pi);pm.on=false;if(pm.mode==='work'){pm.sess++;pm.mode='break';pm.time=300}else{pm.mode='work';pm.time=1500}notify(pm.mode==='break'?'Break time!':'Focus!')}rVault(document.getElementById('ct'))},1000)}rVault(document.getElementById('ct'))" class="btn ${pm.on?'bs':'bp'}" style="padding:12px 32px;font-size:14px;gap:6px">${pm.on?I.pause:I.play} ${pm.on?'Pause':'Start'}</button>
    <button onclick="clearInterval(pi);pm={on:false,time:1500,mode:'work',sess:pm.sess};rVault(document.getElementById('ct'))" class="btn bs" style="padding:12px 20px;gap:4px">${I.refresh} Reset</button>
  </div>
  <div style="font-size:13px;color:var(--t3)">Sessions: <span style="color:var(--ac);font-weight:600;font-size:16px">${pm.sess}</span></div></div>`;
}

window.renderSecChat_vault = function() { if (vaultView==='coach') { const w=document.getElementById('vltChatWrap'); if(w) renderEmbeddedChat('vault',w); } };
