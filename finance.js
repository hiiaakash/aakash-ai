// ════════════════════════════════════
//  AAKASH AI v2 — Finance (finance.js)
// ════════════════════════════════════

const EC = ['Food','Transport','Rent','Shopping','Bills','Health','Education','Entertainment','Investment','Savings','Other'];
let ft = 'overview', ec = 'Food', fa = '';

function rFinance(ct) {
  const tot = S.finance.expenses.reduce((s,e)=>s+e.amount,0), rem = S.finance.salary-tot;
  const bc = {}; S.finance.expenses.forEach(e => { bc[e.cat]=(bc[e.cat]||0)+e.amount; });
  ct.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;min-height:0">
  <div style="display:flex;gap:3px;padding:3px;margin:8px 12px 4px;background:var(--bg3);border-radius:10px;flex-shrink:0">
  ${['overview','add','advice','chat'].map(t => `<button onclick="ft='${t}';rFinance(document.getElementById('ct'))" style="flex:1;padding:7px;border-radius:8px;font-size:11px;font-weight:${ft===t?'600':'400'};background:${ft===t?'var(--c1)':'transparent'};color:${ft===t?'var(--t1)':'var(--t4)'};${ft===t?'box-shadow:var(--shadow)':''}">${t==='add'?'+ Add':t==='advice'?'Advice':t==='chat'?'Chat':t[0].toUpperCase()+t.slice(1)}</button>`).join('')}
  </div>
  ${ft==='chat' ? '<div id="finChatWrap" style="flex:1;display:flex;flex-direction:column;min-height:0"></div>' :
  `<div style="flex:1;overflow-y:auto;padding:8px 12px">
  ${ft==='overview' ? `
    <div class="cd" style="margin-bottom:8px;border-left:3px solid var(--g);border-radius:0"><div style="font-size:10px;color:var(--t3);font-weight:600;text-transform:uppercase;letter-spacing:.5px">Monthly salary</div>
    ${S.finance.salary ? `<div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:22px;font-weight:700;color:var(--g);margin-top:4px">${INR(S.finance.salary)}</div><button onclick="S.finance.salary=0;saveAll();rFinance(document.getElementById('ct'))" style="color:var(--t4);font-size:11px">Change</button></div>` : `<div style="display:flex;gap:6px;margin-top:6px"><input id="sI" class="inp" placeholder="Salary" type="number" style="font-size:14px"><button onclick="const v=parseFloat(document.getElementById('sI').value);if(v>0){S.finance.salary=v;saveAll();rFinance(document.getElementById('ct'))}" class="btn bp" style="padding:8px 16px;font-size:13px">Set</button></div>`}</div>
    ${S.finance.salary ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
      <div class="cd" style="border-left:3px solid var(--r);border-radius:0"><div style="font-size:10px;color:var(--r);font-weight:600;text-transform:uppercase">Spent</div><div style="font-size:20px;font-weight:700;margin-top:4px">${INR(tot)}</div><div style="font-size:11px;color:var(--t3)">${((tot/S.finance.salary)*100).toFixed(0)}%</div></div>
      <div class="cd" style="border-left:3px solid ${rem>=0?'var(--g)':'var(--r)'};border-radius:0"><div style="font-size:10px;color:${rem>=0?'var(--g)':'var(--r)'};font-weight:600;text-transform:uppercase">${rem>=0?'Left':'Over'}</div><div style="font-size:20px;font-weight:700;color:${rem>=0?'var(--g)':'var(--r)'};margin-top:4px">${INR(Math.abs(rem))}</div></div></div>` : ''}
    ${Object.keys(bc).length ? `<div class="cd"><div style="font-size:10px;color:var(--t3);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Breakdown</div>
    ${Object.entries(bc).sort((a,b)=>b[1]-a[1]).map(([c,a]) => `<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="font-size:12px;color:var(--t2)">${c}</span><span style="font-size:12px;font-weight:600">${INR(a)}</span></div><div style="height:4px;background:var(--bg);border-radius:2px;overflow:hidden"><div style="height:100%;width:${S.finance.salary?Math.min((a/S.finance.salary)*100,100):50}%;background:var(--grad);border-radius:2px"></div></div></div>`).join('')}</div>` : ''}`
  : ft==='add' ? `<div style="font-size:15px;font-weight:600;margin-bottom:12px">Add expense</div>
    <input id="eA" class="inp" placeholder="Amount" type="number" style="font-size:22px;font-weight:700;text-align:center;padding:18px;margin-bottom:10px;border-radius:12px">
    <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px">${EC.map(c => `<button onclick="ec='${c}';rFinance(document.getElementById('ct'))" style="padding:6px 12px;border-radius:16px;background:${ec===c?'var(--acBg2)':'var(--c2)'};border:1px solid ${ec===c?'var(--acBorder)':'var(--b1)'};color:${ec===c?'var(--ac)':'var(--t3)'};font-size:11px;font-weight:500">${c}</button>`).join('')}</div>
    <input id="eD" class="inp" placeholder="Description" style="margin-bottom:10px">
    <button onclick="const a=parseFloat(document.getElementById('eA')?.value);if(a>0){S.finance.expenses.push({id:Date.now(),amount:a,cat:ec,desc:document.getElementById('eD')?.value||'',date:new Date().toISOString()});saveAll();ft='overview';rFinance(document.getElementById('ct'))}" class="btn bp" style="width:100%;padding:12px;font-size:14px">Add expense</button>`
  : `<div>${!S.finance.salary ? '<div style="color:var(--t3);text-align:center;padding:20px;font-size:13px">Set salary first</div>' : `
    <button onclick="getFA()" id="faB" class="btn bp" style="width:100%;padding:12px;margin-bottom:12px;font-size:14px;gap:6px">${I.star} Analyze</button>
    ${fa ? `<div class="cd" style="border-left:3px solid var(--ac);border-radius:0"><div style="font-size:13px;line-height:1.7">${fmt(fa)}</div></div>` : ''}`}</div>`}
  </div>`}</div>`;
  if (ft==='chat') { const w=document.getElementById('finChatWrap'); if(w) renderEmbeddedChat('finance',w); }
}

window.getFA = async function() {
  if (isDemoMode()) { showToast('API key add karo'); return; }
  document.getElementById('faB').textContent = 'Analyzing...';
  const tot = S.finance.expenses.reduce((s,e)=>s+e.amount,0);
  const bc = {}; S.finance.expenses.forEach(e => { bc[e.cat]=(bc[e.cat]||0)+e.amount; });
  fa = await ai([{role:'user',content:`Salary:₹${S.finance.salary}.Expenses:${JSON.stringify(bc)}.Spent:₹${tot}.Left:₹${S.finance.salary-tot}. Full analysis+SIP+crore plan.`}], SOUL+'\nFinancial expert. Specific numbers.');
  rFinance(document.getElementById('ct'));
};

window.renderSecChat_finance = function() { if(ft==='chat'){const w=document.getElementById('finChatWrap');if(w)renderEmbeddedChat('finance',w);} };
