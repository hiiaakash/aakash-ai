// ════════════════════════════════════
//  AAKASH AI v2 — Habits (habits.js)
// ════════════════════════════════════

let habitView = 'tracker';

function rHabits(ct) {
  const t = td(), done = S.habitLog[t] || [];
  const streak = h => { let s=0,d=new Date(); const td2=(S.habitLog[td()]||[]).includes(h.id); if(td2)s=1; d.setDate(d.getDate()-(td2?1:1)); for(let i=0;i<365;i++){const ds=d.toISOString().slice(0,10);if((S.habitLog[ds]||[]).includes(h.id))s++;else break;d.setDate(d.getDate()-1);}return s;};

  ct.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;min-height:0">
  <div style="display:flex;gap:3px;padding:3px;margin:8px 12px 4px;background:var(--bg3);border-radius:10px;flex-shrink:0">
    <button onclick="habitView='tracker';rHabits(document.getElementById('ct'))" style="flex:1;padding:7px;border-radius:8px;font-size:12px;font-weight:${habitView==='tracker'?'600':'400'};background:${habitView==='tracker'?'var(--c1)':'transparent'};color:${habitView==='tracker'?'var(--t1)':'var(--t4)'};${habitView==='tracker'?'box-shadow:var(--shadow)':''};display:flex;align-items:center;justify-content:center;gap:4px">${I.habits} Tracker</button>
    <button onclick="habitView='coach';rHabits(document.getElementById('ct'))" style="flex:1;padding:7px;border-radius:8px;font-size:12px;font-weight:${habitView==='coach'?'600':'400'};background:${habitView==='coach'?'var(--c1)':'transparent'};color:${habitView==='coach'?'var(--t1)':'var(--t4)'};${habitView==='coach'?'box-shadow:var(--shadow)':''};display:flex;align-items:center;justify-content:center;gap:4px">${I.star} Coach</button>
  </div>
  ${habitView==='coach' ? '<div id="habChatWrap" style="flex:1;display:flex;flex-direction:column;min-height:0"></div>' : `
  <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 12px;flex-shrink:0">
    <div style="font-size:14px;font-weight:600">${new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</div>
    <button onclick="const n=prompt('Habit name:');if(n?.trim()){S.habits.push({id:Date.now(),name:n.trim()});saveAll();rHabits(document.getElementById('ct'))}" class="btn bp" style="padding:6px 14px;font-size:12px;gap:4px">${I.plus} Add</button>
  </div>
  <div class="cd" style="text-align:center;margin:4px 12px 8px;padding:16px;border-left:3px solid ${done.length===S.habits.length&&S.habits.length?'var(--g)':'var(--ac)'};border-radius:0">
    <div style="font-size:34px;font-weight:700;color:${done.length===S.habits.length&&S.habits.length?'var(--g)':'var(--t1)'}">${done.length}<span style="font-size:16px;color:var(--t4)"> / ${S.habits.length}</span></div>
    ${done.length===S.habits.length&&S.habits.length?`<div style="font-size:12px;color:var(--g);margin-top:4px;font-weight:500;display:flex;align-items:center;justify-content:center;gap:4px">${I.success} All done!</div>` : ''}
  </div>
  <div style="flex:1;overflow-y:auto;padding:0 12px;display:flex;flex-direction:column;gap:6px">
  ${!S.habits.length ? '<div style="text-align:center;padding:24px;color:var(--t4);font-size:12px">Add your first habit</div>' :
  S.habits.map(h => { const ok=done.includes(h.id), st=streak(h); return `
    <div class="cd" style="display:flex;align-items:center;gap:12px;${ok?'border-color:var(--gBorder)':''}">
      <button onclick="const t=td();if(!S.habitLog[t])S.habitLog[t]=[];const i=S.habitLog[t].indexOf(${h.id});if(i>=0)S.habitLog[t].splice(i,1);else S.habitLog[t].push(${h.id});saveAll();rHabits(document.getElementById('ct'))" style="width:26px;height:26px;border-radius:8px;border:2px solid ${ok?'var(--g)':'var(--b2)'};background:${ok?'var(--g)':'var(--c1)'};color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0">${ok?I.check:''}</button>
      <div style="flex:1"><div style="font-size:13px;font-weight:500;${ok?'color:var(--t3)':''}">${h.name}</div>
      ${st>1?`<div style="font-size:11px;color:var(--y);font-weight:500;display:flex;align-items:center;gap:3px">${I.fire} ${st} days</div>`:''}</div>
      <button onclick="if(confirm('Delete?')){S.habits=S.habits.filter(x=>x.id!==${h.id});saveAll();rHabits(document.getElementById('ct'))}" style="color:var(--t4)">${I.trash}</button>
    </div>`; }).join('')}
  </div>`}
  </div>`;
  if (habitView==='coach') { const w=document.getElementById('habChatWrap'); if(w) renderEmbeddedChat('habits',w); }
}

window.renderSecChat_habits = function() { if(habitView==='coach'){const w=document.getElementById('habChatWrap');if(w)renderEmbeddedChat('habits',w);} };
