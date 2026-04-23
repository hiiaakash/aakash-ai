// ════════════════════════════════════
//  AAKASH AI — Vault (vault.js)
//  Tasks + Goals management
// ════════════════════════════════════

let vf = 'all', ve = null;

function rVault(ct) {
  const ic = { note: '📝', task: '✅', goal: '🎯', idea: '💡', summary: '📋' };
  const items = S.entries.filter(e => vf === 'all' || e.type === vf);
  ct.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;padding:10px 16px;min-height:0">
  <div style="display:flex;gap:6px;overflow-x:auto;flex-shrink:0;margin-bottom:10px">
  ${['all', 'task', 'goal', 'note', 'idea'].map(t => `<button onclick="vf='${t}';rVault(document.getElementById('ct'))" style="padding:7px 16px;border-radius:24px;background:${vf === t ? 'var(--acBg2)' : 'var(--c1)'};border:1.5px solid ${vf === t ? 'var(--acBorder)' : 'var(--b1)'};color:${vf === t ? 'var(--ac)' : 'var(--t3)'};font-size:13px;font-weight:600;white-space:nowrap">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}
  </div>
  <div style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px">
  ${!items.length ? '<div style="display:flex;align-items:center;justify-content:center;flex:1;color:var(--t4)">No entries</div>' :
  items.map(e => `<div class="cd" style="cursor:pointer;${ve === e.id ? 'border-color:var(--ac)' : ''}" onclick="ve=ve===${e.id}?null:${e.id};rVault(document.getElementById('ct'))">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0"><span style="font-size:18px">${ic[e.type] || '📝'}</span><span style="font-size:15px;font-weight:600;${e.done ? 'color:var(--t4);text-decoration:line-through' : ''};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.title}</span></div>
      ${e.type === 'task' || e.type === 'goal' ? `<button onclick="event.stopPropagation();S.entries.find(x=>x.id===${e.id}).done=!S.entries.find(x=>x.id===${e.id}).done;saveAll();rVault(document.getElementById('ct'))" style="width:26px;height:26px;border-radius:8px;border:2px solid ${e.done ? 'var(--g)' : 'var(--b1)'};background:${e.done ? 'var(--gBg)' : 'var(--c1)'};color:var(--g);font-size:14px;display:flex;align-items:center;justify-content:center">${e.done ? '✓' : ''}</button>` : ''}
    </div>
    ${ve === e.id && e.content ? `<div style="margin-top:10px"><div style="color:var(--t2);font-size:14px;line-height:1.7;padding:12px;background:var(--bg);border-radius:8px;margin-bottom:8px;white-space:pre-wrap">${fmt(e.content)}</div>
    <button onclick="event.stopPropagation();S.entries=S.entries.filter(x=>x.id!==${e.id});saveAll();rVault(document.getElementById('ct'))" style="padding:6px 14px;font-size:13px;border-radius:6px;border:1px solid var(--rBorder);color:var(--r);background:var(--rBg);font-weight:600">Delete</button></div>` : ''}</div>`).join('')}
  </div></div>`;
}
