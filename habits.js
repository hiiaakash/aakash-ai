// ════════════════════════════════════
//  AAKASH AI — Habits (habits.js)
//  Daily habits + Streak tracking
// ════════════════════════════════════

function rHabits(ct) {
  const t = td(), done = S.habitLog[t] || [];
  const streak = h => { let s = 0, d = new Date(); const todayDone = (S.habitLog[td()]||[]).includes(h.id); if (todayDone) { s = 1; } d.setDate(d.getDate() - (todayDone ? 1 : 1)); for (let i = 0; i < 365; i++) { const ds = d.toISOString().slice(0, 10); if ((S.habitLog[ds] || []).includes(h.id)) s++; else break; d.setDate(d.getDate() - 1); } return s; };

  ct.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;padding:10px 16px;min-height:0">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-shrink:0">
    <div style="font-size:17px;font-weight:700">📅 Habits</div>
    <button onclick="const n=prompt('Habit name:');if(n?.trim()){S.habits.push({id:Date.now(),name:n.trim()});saveAll();rHabits(document.getElementById('ct'))}" class="btn bp" style="padding:8px 16px;font-size:14px">+ Add</button>
  </div>
  <div class="cd" style="text-align:center;margin-bottom:12px;padding:20px;border-left:3px solid ${done.length === S.habits.length && S.habits.length ? 'var(--g)' : 'var(--ac)'}">
    <div style="font-size:14px;color:var(--t3)">${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
    <div style="font-size:40px;font-weight:700;color:${done.length === S.habits.length && S.habits.length ? 'var(--g)' : 'var(--t1)'};margin-top:4px">${done.length}<span style="font-size:18px;color:var(--t4)"> / ${S.habits.length}</span></div>
    ${done.length === S.habits.length && S.habits.length ? '<div style="font-size:14px;color:var(--g);margin-top:6px;font-weight:600">🎉 All done!</div>' : ''}
  </div>
  <div style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px">
  ${!S.habits.length ? '<div style="text-align:center;padding:30px;color:var(--t4)">Add your first habit!</div>' :
  S.habits.map(h => { const ok = done.includes(h.id), st = streak(h); return `
    <div class="cd" style="display:flex;align-items:center;gap:14px;${ok ? 'border-color:var(--gBorder)' : ''}">
      <button onclick="const t=td();if(!S.habitLog[t])S.habitLog[t]=[];const i=S.habitLog[t].indexOf(${h.id});if(i>=0)S.habitLog[t].splice(i,1);else S.habitLog[t].push(${h.id});saveAll();rHabits(document.getElementById('ct'))" style="width:30px;height:30px;border-radius:10px;border:2px solid ${ok ? 'var(--g)' : 'var(--b2)'};background:${ok ? 'var(--g)' : 'var(--c1)'};color:#fff;font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0">${ok ? '✓' : ''}</button>
      <div style="flex:1"><div style="font-size:15px;font-weight:600;${ok ? 'color:var(--t3)' : ''}">${h.name}</div>
      ${st > 1 ? `<div style="font-size:13px;color:var(--y);font-weight:600">🔥 ${st} days</div>` : ''}</div>
      <button onclick="if(confirm('Delete?')){S.habits=S.habits.filter(x=>x.id!==${h.id});saveAll();rHabits(document.getElementById('ct'))}" style="color:var(--t4);font-size:16px">✕</button>
    </div>`; }).join('')}
  </div></div>`;
}
