// ════════════════════════════════════
//  AAKASH AI — Create (create.js)
//  Quick create tasks/goals/notes/ideas
// ════════════════════════════════════

let ctp = 'task';

function rCreate(ct) {
  ct.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;padding:10px 16px;gap:12px;overflow-y:auto">
  <div style="font-size:17px;font-weight:700">Quick Create</div>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
  ${[{ k: 'task', i: '✅', l: 'Task' }, { k: 'goal', i: '🎯', l: 'Goal' }, { k: 'note', i: '📝', l: 'Note' }, { k: 'idea', i: '💡', l: 'Idea' }].map(t => `<button onclick="ctp='${t.k}';rCreate(document.getElementById('ct'))" style="padding:10px 18px;border-radius:24px;background:${ctp === t.k ? 'var(--acBg2)' : 'var(--c1)'};border:1.5px solid ${ctp === t.k ? 'var(--acBorder)' : 'var(--b1)'};color:${ctp === t.k ? 'var(--ac)' : 'var(--t3)'};font-size:14px;font-weight:600">${t.i} ${t.l}</button>`).join('')}
  </div>
  <input id="cT" class="inp" placeholder="Title" style="font-weight:600;font-size:16px">
  <textarea id="cB" class="inp" placeholder="Details..." style="min-height:140px;resize:vertical;font-family:IBM Plex Mono,monospace;font-size:14px;line-height:1.8"></textarea>
  <button onclick="const t=document.getElementById('cT')?.value?.trim(),b=document.getElementById('cB')?.value;if(t||b){S.entries.unshift({id:Date.now(),type:ctp,title:t||'Untitled',content:b,done:false,createdAt:new Date().toISOString()});saveAll();tab='vault';render()}" class="btn bp" style="padding:14px;font-size:16px">Save</button></div>`;
}
