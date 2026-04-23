// ════════════════════════════════════
//  AAKASH AI — Finance (finance.js)
//  Salary, Expenses, AI Advisor
// ════════════════════════════════════

const EC = ['Food', 'Transport', 'Rent', 'Shopping', 'Bills', 'Health', 'Education', 'Entertainment', 'Investment', 'Savings', 'Other'];
let ft = 'overview', ec = 'Food', fa = '';

function rFinance(ct) {
  const tot = S.finance.expenses.reduce((s, e) => s + e.amount, 0), rem = S.finance.salary - tot;
  const bc = {}; S.finance.expenses.forEach(e => { bc[e.cat] = (bc[e.cat] || 0) + e.amount; });
  ct.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;padding:10px 16px;min-height:0">
  <div style="display:flex;gap:3px;background:var(--bg);border-radius:10px;padding:3px;margin-bottom:10px;flex-shrink:0">
  ${['overview', 'add', 'advice'].map(t => `<button onclick="ft='${t}';rFinance(document.getElementById('ct'))" style="flex:1;padding:8px;border-radius:8px;background:${ft === t ? 'var(--c1)' : 'transparent'};color:${ft === t ? 'var(--t1)' : 'var(--t4)'};font-size:14px;font-weight:${ft === t ? 600 : 400};${ft === t ? 'box-shadow:var(--shadow)' : ''}">${t === 'add' ? '+ Add' : t === 'advice' ? '🧠 AI' : t[0].toUpperCase() + t.slice(1)}</button>`).join('')}
  </div>
  <div style="flex:1;overflow-y:auto">
  ${ft === 'overview' ? `
    <div class="cd" style="margin-bottom:10px;${S.finance.salary ? 'border-left:3px solid var(--g)' : ''}"><div style="font-size:12px;color:var(--t3);font-weight:600;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px">Monthly Salary</div>
    ${S.finance.salary ? `<div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:26px;font-weight:700;color:var(--g)">${INR(S.finance.salary)}</div><button onclick="S.finance.salary=0;saveAll();rFinance(document.getElementById('ct'))" style="color:var(--t4);font-size:13px">Change</button></div>` : `<div style="display:flex;gap:8px"><input id="sI" class="inp" placeholder="₹ Salary" type="number"><button onclick="const v=parseFloat(document.getElementById('sI').value);if(v>0){S.finance.salary=v;saveAll();rFinance(document.getElementById('ct'))}" class="btn bp">Set</button></div>`}</div>
    ${S.finance.salary ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
      <div class="cd" style="border-left:3px solid var(--r)"><div style="font-size:11px;color:var(--r);font-weight:600;text-transform:uppercase">Spent</div><div style="font-size:22px;font-weight:700;margin-top:4px">${INR(tot)}</div><div style="font-size:12px;color:var(--t3)">${((tot / S.finance.salary) * 100).toFixed(0)}%</div></div>
      <div class="cd" style="border-left:3px solid ${rem >= 0 ? 'var(--g)' : 'var(--r)'}"><div style="font-size:11px;color:${rem >= 0 ? 'var(--g)' : 'var(--r)'};font-weight:600;text-transform:uppercase">${rem >= 0 ? 'Left' : 'Over'}</div><div style="font-size:22px;font-weight:700;color:${rem >= 0 ? 'var(--g)' : 'var(--r)'};margin-top:4px">${INR(Math.abs(rem))}</div></div></div>` : ''}
    ${Object.keys(bc).length ? `<div class="cd"><div style="font-size:12px;color:var(--t3);font-weight:600;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px">Breakdown</div>
    ${Object.entries(bc).sort((a, b) => b[1] - a[1]).map(([c, a]) => `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:14px;color:var(--t2)">${c}</span><span style="font-size:14px;font-weight:600">${INR(a)}</span></div><div style="height:6px;background:var(--bg);border-radius:3px;overflow:hidden"><div style="height:100%;width:${S.finance.salary ? Math.min((a / S.finance.salary) * 100, 100) : 50}%;background:var(--grad);border-radius:3px"></div></div></div>`).join('')}</div>` : ''}`
  : ft === 'add' ? `<div><div style="font-size:17px;font-weight:700;margin-bottom:14px">Add Expense</div>
    <input id="eA" class="inp" placeholder="₹ Amount" type="number" style="font-size:24px;font-weight:700;text-align:center;padding:20px;margin-bottom:12px;border-radius:14px">
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">${EC.map(c => `<button onclick="ec='${c}';rFinance(document.getElementById('ct'))" style="padding:7px 14px;border-radius:24px;background:${ec === c ? 'var(--acBg2)' : 'var(--c1)'};border:1.5px solid ${ec === c ? 'var(--acBorder)' : 'var(--b1)'};color:${ec === c ? 'var(--ac)' : 'var(--t3)'};font-size:13px;font-weight:600">${c}</button>`).join('')}</div>
    <input id="eD" class="inp" placeholder="Description" style="margin-bottom:12px">
    <button onclick="const a=parseFloat(document.getElementById('eA')?.value);if(a>0){S.finance.expenses.push({id:Date.now(),amount:a,cat:ec,desc:document.getElementById('eD')?.value||'',date:new Date().toISOString()});saveAll();ft='overview';rFinance(document.getElementById('ct'))}" class="btn bp" style="width:100%;padding:14px;font-size:16px">Add Expense</button></div>`
  : `<div>${!S.finance.salary ? '<div style="color:var(--t3);text-align:center;padding:20px">Set salary first.</div>' : `
    <button onclick="getFA()" id="faB" class="btn bp" style="width:100%;padding:14px;margin-bottom:14px">Analyze & Wealth Roadmap</button>
    ${fa ? `<div class="cd" style="border-left:3px solid var(--ac)"><div style="font-size:14px;line-height:1.7">${fmt(fa)}</div></div>` : ''}`}</div>`}
  </div></div>`;
}

window.getFA = async function() {
  document.getElementById('faB').textContent = 'Analyzing...';
  const tot = S.finance.expenses.reduce((s, e) => s + e.amount, 0);
  const bc = {}; S.finance.expenses.forEach(e => { bc[e.cat] = (bc[e.cat] || 0) + e.amount; });
  fa = await ai([{ role: 'user', content: `Salary:₹${S.finance.salary}.Expenses:${JSON.stringify(bc)}.Spent:₹${tot}.Left:₹${S.finance.salary - tot}. Full analysis+SIP+crore plan.` }], SOUL + '\nFinancial expert. Specific numbers.');
  rFinance(document.getElementById('ct'));
};
