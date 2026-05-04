// ════════════════════════════════════
//  AAKASH AI v2 — Finance (finance.js)
//  UPGRADED: Income + Net Worth + Streams + Weekly Review + Financial Goals
// ════════════════════════════════════

const EC = ['Food','Transport','Rent','Shopping','Bills','Health','Education','Entertainment','Investment','Savings','Other'];
const IC = ['Freelancing','Job Salary','Business','Side Hustle','Investment Returns','YouTube/Content','Teaching','Affiliate','Other'];
const ASSET_CATS = ['Bank Balance','Investments','Stocks','Mutual Funds','Crypto','FD','Property','Cash','Gold','Other'];
const LIAB_CATS = ['Loans','EMIs','Credit Card','Borrowed','Other'];
const STREAM_STATUS = ['Active','Building','Planned','Paused'];

let ft = 'overview', ec = 'Food', ic = 'Freelancing', fa = '';
let finSubView = 'expense';

function thisMonthExpenses() {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth();
  return S.finance.expenses.filter(e => { const d = new Date(e.date); return d.getFullYear()===y && d.getMonth()===m; });
}
function thisMonthIncome() {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth();
  return (S.finance.income||[]).filter(i => { const d = new Date(i.date); return d.getFullYear()===y && d.getMonth()===m; });
}
function lastMonthIncome() {
  const now = new Date(); now.setMonth(now.getMonth()-1);
  const y = now.getFullYear(), m = now.getMonth();
  return (S.finance.income||[]).filter(i => { const d = new Date(i.date); return d.getFullYear()===y && d.getMonth()===m; });
}

function rFinance(ct) {
  const totExp = thisMonthExpenses().reduce((s,e)=>s+e.amount,0);
  const totInc = thisMonthIncome().reduce((s,i)=>s+i.amount,0);
  const netSav = totInc - totExp;

  ct.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;min-height:0">
  <div style="display:flex;gap:3px;padding:3px;margin:8px 12px 4px;background:var(--bg3);border-radius:10px;flex-shrink:0;overflow-x:auto">
  ${['overview','add','income','streams','networth','goals','advice','chat'].map(t => `<button onclick="ft='${t}';rFinance(document.getElementById('ct'))" style="padding:7px 10px;border-radius:8px;font-size:10px;font-weight:${ft===t?'600':'400'};background:${ft===t?'var(--c1)':'transparent'};color:${ft===t?'var(--t1)':'var(--t4)'};${ft===t?'box-shadow:var(--shadow)':''};white-space:nowrap">${
    t==='add'?'+ Add':t==='networth'?'Net Worth':t==='streams'?'Streams':t==='goals'?'Goals':t==='advice'?'Advice':t==='chat'?'Chat':t==='income'?'Income':t[0].toUpperCase()+t.slice(1)
  }</button>`).join('')}
  </div>
  ${ft==='chat' ? '<div id="finChatWrap" style="flex:1;display:flex;flex-direction:column;min-height:0"></div>' :
  `<div style="flex:1;overflow-y:auto;padding:8px 12px">
  ${ft==='overview' ? rFinOverview(totExp, totInc, netSav)
  : ft==='add' ? rFinAdd()
  : ft==='income' ? rFinIncome(totInc)
  : ft==='streams' ? rFinStreams()
  : ft==='networth' ? rFinNetWorth()
  : ft==='goals' ? rFinGoals()
  : rFinAdvice()}
  </div>`}</div>`;
  if (ft==='chat') { const w=document.getElementById('finChatWrap'); if(w) renderEmbeddedChat('finance',w); }
}

// ════ OVERVIEW ════
function rFinOverview(totExp, totInc, netSav) {
  const bc = {}; thisMonthExpenses().forEach(e => { bc[e.cat]=(bc[e.cat]||0)+e.amount; });
  const incSrc = {}; thisMonthIncome().forEach(i => { incSrc[i.source]=(incSrc[i.source]||0)+i.amount; });
  const lastInc = lastMonthIncome().reduce((s,i)=>s+i.amount,0);
  const incChange = lastInc > 0 ? ((totInc - lastInc) / lastInc * 100).toFixed(0) : 0;
  const streams = (S.finance.incomeStreams||[]).filter(s=>s.status==='Active');

  return `
    <div class="cd" style="margin-bottom:8px;border-left:3px solid var(--g);border-radius:0"><div style="font-size:10px;color:var(--t3);font-weight:600;text-transform:uppercase;letter-spacing:.5px">Monthly salary</div>
    ${S.finance.salary ? `<div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:22px;font-weight:700;color:var(--g);margin-top:4px">${INR(S.finance.salary)}</div><button onclick="S.finance.salary=0;saveAll();rFinance(document.getElementById('ct'))" style="color:var(--t4);font-size:11px">Change</button></div>` : `<div style="display:flex;gap:6px;margin-top:6px"><input id="sI" class="inp" placeholder="Salary" type="number" style="font-size:14px"><button onclick="const v=parseFloat(document.getElementById('sI').value);if(v>0){S.finance.salary=v;saveAll();rFinance(document.getElementById('ct'))}" class="btn bp" style="padding:8px 16px;font-size:13px">Set</button></div>`}</div>

    <div class="cd" style="text-align:center;margin-bottom:8px;border-left:3px solid ${netSav>=0?'var(--g)':'var(--r)'};border-radius:0;padding:16px">
      <div style="font-size:10px;color:var(--t3);font-weight:600;text-transform:uppercase;letter-spacing:.5px">Net Savings This Month</div>
      <div style="font-size:28px;font-weight:700;color:${netSav>=0?'var(--g)':'var(--r)'};margin-top:4px">${netSav>=0?'+':''}${INR(netSav)}</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
      <div class="cd" style="border-left:3px solid var(--g);border-radius:0;cursor:pointer" onclick="ft='income';rFinance(document.getElementById('ct'))">
        <div style="font-size:10px;color:var(--g);font-weight:600;text-transform:uppercase">Income</div>
        <div style="font-size:20px;font-weight:700;margin-top:4px">${INR(totInc)}</div>
        ${incChange!=0?`<div style="font-size:11px;color:${incChange>0?'var(--g)':'var(--r)'}">${incChange>0?'↑':'↓'}${Math.abs(incChange)}% vs last month</div>`:''}
      </div>
      <div class="cd" style="border-left:3px solid var(--r);border-radius:0">
        <div style="font-size:10px;color:var(--r);font-weight:600;text-transform:uppercase">Spent</div>
        <div style="font-size:20px;font-weight:700;margin-top:4px">${INR(totExp)}</div>
        ${S.finance.salary?`<div style="font-size:11px;color:var(--t3)">${((totExp/S.finance.salary)*100).toFixed(0)}% of salary</div>`:''}
      </div>
    </div>

    <div class="cd" style="margin-bottom:8px;cursor:pointer" onclick="ft='streams';rFinance(document.getElementById('ct'))">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:10px;color:var(--t3);font-weight:600;text-transform:uppercase;letter-spacing:.5px">Income Streams</div>
        <div style="font-size:12px;font-weight:600;color:${streams.length>=7?'var(--g)':'var(--ac)'}">${streams.length}/7 target</div>
      </div>
      <div style="height:6px;background:var(--bg);border-radius:3px;margin-top:6px;overflow:hidden"><div style="height:100%;width:${Math.min((streams.length/7)*100,100)}%;background:${streams.length>=7?'var(--g)':'var(--grad)'};border-radius:3px;transition:width .3s"></div></div>
    </div>

    ${Object.keys(bc).length ? `<div class="cd"><div style="font-size:10px;color:var(--t3);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Expense Breakdown</div>
    ${Object.entries(bc).sort((a,b)=>b[1]-a[1]).map(([c,a]) => `<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="font-size:12px;color:var(--t2)">${c}</span><span style="font-size:12px;font-weight:600">${INR(a)}</span></div><div style="height:4px;background:var(--bg);border-radius:2px;overflow:hidden"><div style="height:100%;width:${S.finance.salary?Math.min((a/S.finance.salary)*100,100):50}%;background:var(--grad);border-radius:2px"></div></div></div>`).join('')}</div>` : ''}

    ${Object.keys(incSrc).length ? `<div class="cd" style="margin-top:8px"><div style="font-size:10px;color:var(--t3);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Income Sources</div>
    ${Object.entries(incSrc).sort((a,b)=>b[1]-a[1]).map(([c,a]) => `<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="font-size:12px;color:var(--t2)">${c}</span><span style="font-size:12px;font-weight:600;color:var(--g)">${INR(a)}</span></div><div style="height:4px;background:var(--bg);border-radius:2px;overflow:hidden"><div style="height:100%;width:${totInc?Math.min((a/totInc)*100,100):50}%;background:var(--g);border-radius:2px"></div></div></div>`).join('')}</div>` : ''}`;
}

// ════ ADD ════
function rFinAdd() {
  return `
    <div style="display:flex;gap:3px;padding:3px;background:var(--bg3);border-radius:8px;margin-bottom:12px">
      <button onclick="finSubView='expense';rFinance(document.getElementById('ct'))" style="flex:1;padding:7px;border-radius:6px;font-size:12px;font-weight:${finSubView==='expense'?'600':'400'};background:${finSubView==='expense'?'var(--r)':'transparent'};color:${finSubView==='expense'?'#fff':'var(--t4)'}">Expense</button>
      <button onclick="finSubView='income';rFinance(document.getElementById('ct'))" style="flex:1;padding:7px;border-radius:6px;font-size:12px;font-weight:${finSubView==='income'?'600':'400'};background:${finSubView==='income'?'var(--g)':'transparent'};color:${finSubView==='income'?'#fff':'var(--t4)'}">Income</button>
    </div>
    ${finSubView==='expense' ? `
      <div style="font-size:15px;font-weight:600;margin-bottom:12px;color:var(--r)">Add Expense</div>
      <input id="eA" class="inp" placeholder="Amount" type="number" style="font-size:22px;font-weight:700;text-align:center;padding:18px;margin-bottom:10px;border-radius:12px">
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px">${EC.map(c => `<button onclick="ec='${c}';rFinance(document.getElementById('ct'))" style="padding:6px 12px;border-radius:16px;background:${ec===c?'var(--rBg)':'var(--c2)'};border:1px solid ${ec===c?'var(--rBorder)':'var(--b1)'};color:${ec===c?'var(--r)':'var(--t3)'};font-size:11px;font-weight:500">${c}</button>`).join('')}</div>
      <input id="eD" class="inp" placeholder="Description" style="margin-bottom:10px">
      <button onclick="const a=parseFloat(document.getElementById('eA')?.value);if(a>0){S.finance.expenses.push({id:Date.now(),amount:a,cat:ec,desc:document.getElementById('eD')?.value||'',date:new Date().toISOString()});saveAll();ft='overview';rFinance(document.getElementById('ct'))}" class="btn" style="width:100%;padding:12px;font-size:14px;background:var(--r);color:#fff">Add Expense</button>`
    : `
      <div style="font-size:15px;font-weight:600;margin-bottom:12px;color:var(--g)">Add Income</div>
      <input id="iA" class="inp" placeholder="Amount" type="number" style="font-size:22px;font-weight:700;text-align:center;padding:18px;margin-bottom:10px;border-radius:12px">
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px">${IC.map(c => `<button onclick="ic='${c}';rFinance(document.getElementById('ct'))" style="padding:6px 12px;border-radius:16px;background:${ic===c?'var(--gBg)':'var(--c2)'};border:1px solid ${ic===c?'var(--gBorder)':'var(--b1)'};color:${ic===c?'var(--g)':'var(--t3)'};font-size:11px;font-weight:500">${c}</button>`).join('')}</div>
      <input id="iD" class="inp" placeholder="Description (optional)" style="margin-bottom:10px">
      <button onclick="const a=parseFloat(document.getElementById('iA')?.value);if(a>0){if(!S.finance.income)S.finance.income=[];S.finance.income.push({id:Date.now(),amount:a,source:ic,desc:document.getElementById('iD')?.value||'',date:new Date().toISOString()});saveAll();ft='overview';rFinance(document.getElementById('ct'))}" class="btn" style="width:100%;padding:12px;font-size:14px;background:var(--g);color:#fff">Add Income</button>`}`;
}

// ════ INCOME LIST ════
function rFinIncome(totInc) {
  const incomes = thisMonthIncome().sort((a,b)=>new Date(b.date)-new Date(a.date));
  const lastInc = lastMonthIncome().reduce((s,i)=>s+i.amount,0);
  const incSrc = {}; incomes.forEach(i => { incSrc[i.source]=(incSrc[i.source]||0)+i.amount; });

  return `
    <div class="cd" style="margin-bottom:8px;text-align:center;border-left:3px solid var(--g);border-radius:0;padding:14px">
      <div style="font-size:10px;color:var(--t3);font-weight:600;text-transform:uppercase">Total Income This Month</div>
      <div style="font-size:28px;font-weight:700;color:var(--g);margin-top:4px">${INR(totInc)}</div>
      ${lastInc?`<div style="font-size:11px;color:var(--t3);margin-top:2px">Last month: ${INR(lastInc)}</div>`:''}
    </div>
    ${Object.keys(incSrc).length ? `<div class="cd" style="margin-bottom:8px"><div style="font-size:10px;color:var(--t3);font-weight:600;text-transform:uppercase;margin-bottom:8px">Top Sources</div>
    ${Object.entries(incSrc).sort((a,b)=>b[1]-a[1]).map(([s,a],i) => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <div style="width:18px;height:18px;border-radius:50%;background:var(--gBg);color:var(--g);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700">${i+1}</div>
      <div style="flex:1;font-size:12px">${s}</div>
      <div style="font-size:12px;font-weight:600;color:var(--g)">${INR(a)}</div>
    </div>`).join('')}</div>` : ''}
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-size:13px;font-weight:600">Transactions (${incomes.length})</div>
      <button onclick="ft='add';finSubView='income';rFinance(document.getElementById('ct'))" class="btn bp" style="padding:6px 14px;font-size:11px">${I.plus} Add</button>
    </div>
    ${incomes.length===0 ? '<div style="text-align:center;padding:20px;color:var(--t4);font-size:12px">No income this month</div>' :
    incomes.map(i => `<div class="cd" style="margin-bottom:4px;display:flex;align-items:center;gap:10px">
      <div style="width:6px;height:6px;border-radius:50%;background:var(--g);flex-shrink:0"></div>
      <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:500">${INR(i.amount)}</div>
      <div style="font-size:10px;color:var(--t3)">${i.source}${i.desc?' · '+i.desc:''} · ${new Date(i.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div></div>
      <button onclick="S.finance.income=S.finance.income.filter(x=>x.id!==${i.id});saveAll();rFinance(document.getElementById('ct'))" style="color:var(--t4)">${I.trash}</button>
    </div>`).join('')}`;
}

// ════ STREAMS ════
function rFinStreams() {
  const streams = S.finance.incomeStreams || [];
  const active = streams.filter(s=>s.status==='Active');
  const totalRev = active.reduce((s,st)=>s+(st.revenue||0),0);

  return `
    <div class="cd" style="margin-bottom:8px;text-align:center;border-left:3px solid var(--ac);border-radius:0;padding:14px">
      <div style="font-size:10px;color:var(--t3);font-weight:600;text-transform:uppercase">Income Streams Goal</div>
      <div style="font-size:28px;font-weight:700;color:var(--ac);margin-top:4px">${active.length}<span style="font-size:16px;color:var(--t4)"> / 7</span></div>
      <div style="height:8px;background:var(--bg);border-radius:4px;margin-top:8px;overflow:hidden"><div style="height:100%;width:${Math.min((active.length/7)*100,100)}%;background:var(--grad);border-radius:4px"></div></div>
      ${totalRev?`<div style="font-size:11px;color:var(--g);margin-top:6px">Active revenue: ${INR(totalRev)}/month</div>`:''}
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-size:13px;font-weight:600">All Streams (${streams.length})</div>
      <button onclick="addIncomeStream()" class="btn bp" style="padding:6px 14px;font-size:11px">${I.plus} Add</button>
    </div>
    ${streams.length===0 ? '<div style="text-align:center;padding:20px;color:var(--t4);font-size:12px">No streams yet. Add your first!</div>' :
    streams.sort((a,b)=>(b.revenue||0)-(a.revenue||0)).map(s => {
      const stColor = s.status==='Active'?'var(--g)':s.status==='Building'?'var(--y)':s.status==='Planned'?'var(--ac)':'var(--t4)';
      return `<div class="cd" style="margin-bottom:6px;border-left:3px solid ${stColor};border-radius:0">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <div style="flex:1"><div style="font-size:13px;font-weight:600">${s.name}</div>
          <div style="display:flex;gap:6px;align-items:center;margin-top:4px">
            <span style="padding:2px 8px;border-radius:10px;font-size:9px;font-weight:600;background:${stColor};color:#fff">${s.status}</span>
            ${s.revenue?`<span style="font-size:12px;font-weight:600;color:var(--g)">${INR(s.revenue)}/mo</span>`:''}</div>
          ${s.notes?`<div style="font-size:11px;color:var(--t3);margin-top:4px">${s.notes}</div>`:''}</div>
          <div style="display:flex;gap:4px">
            <button onclick="editStreamStatus(${s.id})" style="padding:4px 8px;font-size:10px;border-radius:6px;background:var(--c2);border:1px solid var(--b1);color:var(--t3)">Status</button>
            <button onclick="S.finance.incomeStreams=S.finance.incomeStreams.filter(x=>x.id!==${s.id});saveAll();rFinance(document.getElementById('ct'))" style="color:var(--t4)">${I.trash}</button>
          </div>
        </div>
      </div>`;
    }).join('')}`;
}

window.addIncomeStream = function() {
  const name = prompt('Stream name (e.g., Freelance Web Dev):');
  if (!name?.trim()) return;
  const rev = parseFloat(prompt('Monthly revenue (₹, 0 if not yet):') || '0');
  if (!S.finance.incomeStreams) S.finance.incomeStreams = [];
  S.finance.incomeStreams.push({ id:Date.now(), name:name.trim(), status:'Active', revenue:rev, startDate:new Date().toISOString(), notes:'' });
  saveAll(); rFinance(document.getElementById('ct'));
};
window.editStreamStatus = function(id) {
  const s = (S.finance.incomeStreams||[]).find(x=>x.id===id);
  if (!s) return;
  s.status = STREAM_STATUS[(STREAM_STATUS.indexOf(s.status)+1)%STREAM_STATUS.length];
  saveAll(); rFinance(document.getElementById('ct'));
};

// ════ NET WORTH ════
function rFinNetWorth() {
  const nw = S.finance.netWorth || { assets:{}, liabilities:{}, history:[] };
  const totalA = Object.values(nw.assets||{}).reduce((s,v)=>s+(v||0),0);
  const totalL = Object.values(nw.liabilities||{}).reduce((s,v)=>s+(v||0),0);
  const netW = totalA - totalL;
  const hist = nw.history || [];
  const lastNW = hist.length >= 2 ? hist[hist.length-2].total : null;
  const nwChange = lastNW !== null ? netW - lastNW : 0;

  return `
    <div class="cd" style="text-align:center;margin-bottom:8px;border-left:3px solid ${netW>=0?'var(--g)':'var(--r)'};border-radius:0;padding:16px">
      <div style="font-size:10px;color:var(--t3);font-weight:600;text-transform:uppercase;letter-spacing:.5px">Net Worth</div>
      <div style="font-size:32px;font-weight:700;color:${netW>=0?'var(--g)':'var(--r)'};margin-top:4px">${INR(netW)}</div>
      ${nwChange!==0?`<div style="font-size:12px;color:${nwChange>0?'var(--g)':'var(--r)'};margin-top:4px">${nwChange>0?'↑':'↓'} ${INR(Math.abs(nwChange))} since last update</div>`:''}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
      <div class="cd" style="border-left:3px solid var(--g);border-radius:0"><div style="font-size:10px;color:var(--g);font-weight:600;text-transform:uppercase">Assets</div><div style="font-size:18px;font-weight:700;margin-top:4px">${INR(totalA)}</div></div>
      <div class="cd" style="border-left:3px solid var(--r);border-radius:0"><div style="font-size:10px;color:var(--r);font-weight:600;text-transform:uppercase">Liabilities</div><div style="font-size:18px;font-weight:700;margin-top:4px">${INR(totalL)}</div></div>
    </div>
    <div class="cd" style="margin-bottom:6px"><div style="font-size:11px;font-weight:600;color:var(--g);margin-bottom:8px;text-transform:uppercase">Assets</div>
    ${ASSET_CATS.map(c => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <div style="flex:1;font-size:12px;color:var(--t2)">${c}</div>
      <input type="number" value="${nw.assets?.[c]||0}" onchange="if(!S.finance.netWorth.assets)S.finance.netWorth.assets={};S.finance.netWorth.assets['${c}']=parseFloat(this.value)||0;saveAll()" style="width:100px;text-align:right;padding:4px 8px;border-radius:6px;border:1px solid var(--b1);background:var(--c2);font-size:12px;font-weight:600;color:var(--t1)" placeholder="0">
    </div>`).join('')}</div>
    <div class="cd" style="margin-bottom:6px"><div style="font-size:11px;font-weight:600;color:var(--r);margin-bottom:8px;text-transform:uppercase">Liabilities</div>
    ${LIAB_CATS.map(c => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <div style="flex:1;font-size:12px;color:var(--t2)">${c}</div>
      <input type="number" value="${nw.liabilities?.[c]||0}" onchange="if(!S.finance.netWorth.liabilities)S.finance.netWorth.liabilities={};S.finance.netWorth.liabilities['${c}']=parseFloat(this.value)||0;saveAll()" style="width:100px;text-align:right;padding:4px 8px;border-radius:6px;border:1px solid var(--b1);background:var(--c2);font-size:12px;font-weight:600;color:var(--t1)" placeholder="0">
    </div>`).join('')}</div>
    <button onclick="saveNetWorthSnapshot()" class="btn bp" style="width:100%;padding:12px;font-size:14px;margin-bottom:8px">Save Monthly Snapshot</button>
    ${hist.length ? `<div class="cd"><div style="font-size:10px;color:var(--t3);font-weight:600;text-transform:uppercase;margin-bottom:8px">History</div>
    ${hist.slice(-12).reverse().map((h,i,arr) => {
      const prev = arr[i+1]; const ch = prev ? h.total - prev.total : 0;
      return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--b1)">
        <div style="font-size:11px;color:var(--t3);width:70px">${new Date(h.date).toLocaleDateString('en-IN',{month:'short',year:'2-digit'})}</div>
        <div style="flex:1;font-size:13px;font-weight:600;color:${h.total>=0?'var(--g)':'var(--r)'}">${INR(h.total)}</div>
        ${ch?`<div style="font-size:10px;color:${ch>0?'var(--g)':'var(--r)'}">${ch>0?'↑':'↓'}${INR(Math.abs(ch))}</div>`:''}
      </div>`;
    }).join('')}</div>` : ''}`;
}
window.saveNetWorthSnapshot = function() {
  const nw = S.finance.netWorth;
  const totalA = Object.values(nw.assets||{}).reduce((s,v)=>s+(v||0),0);
  const totalL = Object.values(nw.liabilities||{}).reduce((s,v)=>s+(v||0),0);
  if (!nw.history) nw.history = [];
  nw.history.push({ date:new Date().toISOString(), assets:{...(nw.assets||{})}, liabilities:{...(nw.liabilities||{})}, total:totalA-totalL });
  saveAll(); showToast('Snapshot saved!'); rFinance(document.getElementById('ct'));
};

// ════ FINANCIAL GOALS ════
function rFinGoals() {
  const goals = S.finance.financialGoals || [];
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-size:15px;font-weight:600">Financial Goals</div>
      <button onclick="addFinancialGoal()" class="btn bp" style="padding:6px 14px;font-size:11px">${I.plus} Add</button>
    </div>
    ${goals.length===0 ? '<div style="text-align:center;padding:20px;color:var(--t4);font-size:12px">No financial goals yet</div>' :
    goals.map(g => {
      const pct = g.target ? Math.min((g.current/g.target)*100, 100) : 0;
      const ms = g.milestones || [];
      return `<div class="cd" style="margin-bottom:8px;border-left:3px solid var(--ac);border-radius:0">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px">
          <div><div style="font-size:14px;font-weight:600">${g.title}</div>
          ${g.deadline?`<div style="font-size:10px;color:var(--t4);margin-top:2px">Deadline: ${new Date(g.deadline).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>`:''}</div>
          <button onclick="S.finance.financialGoals=S.finance.financialGoals.filter(x=>x.id!==${g.id});saveAll();rFinance(document.getElementById('ct'))" style="color:var(--t4)">${I.trash}</button>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <div style="font-size:20px;font-weight:700;color:var(--ac)">${INR(g.current)}</div>
          <div style="font-size:12px;color:var(--t3)">/ ${INR(g.target)}</div>
        </div>
        <div style="height:8px;background:var(--bg);border-radius:4px;overflow:hidden;margin-bottom:8px"><div style="height:100%;width:${pct}%;background:var(--grad);border-radius:4px"></div></div>
        <div style="font-size:10px;color:var(--t4);margin-bottom:6px">${pct.toFixed(0)}% complete</div>
        ${ms.length ? `<div style="margin-bottom:8px">${ms.map((m,mi) => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <button onclick="S.finance.financialGoals.find(x=>x.id===${g.id}).milestones[${mi}].done=!S.finance.financialGoals.find(x=>x.id===${g.id}).milestones[${mi}].done;saveAll();rFinance(document.getElementById('ct'))" style="width:18px;height:18px;border-radius:5px;border:2px solid ${m.done?'var(--g)':'var(--b1)'};background:${m.done?'var(--g)':'var(--c1)'};display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;font-size:10px">${m.done?I.check:''}</button>
          <div style="font-size:12px;${m.done?'color:var(--t4);text-decoration:line-through':'color:var(--t2)'}">${INR(m.amount)}/month</div>
        </div>`).join('')}</div>` : ''}
        <div style="display:flex;gap:4px">
          <button onclick="updateGoalCurrent(${g.id})" class="btn bs" style="padding:5px 10px;font-size:10px">Update</button>
          <button onclick="addGoalMilestone(${g.id})" class="btn bs" style="padding:5px 10px;font-size:10px">${I.plus} Milestone</button>
        </div>
      </div>`;
    }).join('')}`;
}
window.addFinancialGoal = function() {
  const title = prompt('Goal (e.g., "₹1,00,000/month income"):');
  if (!title?.trim()) return;
  const target = parseFloat(prompt('Target amount (₹):') || '0');
  const current = parseFloat(prompt('Current amount (₹):') || '0');
  const deadline = prompt('Deadline (YYYY-MM-DD, optional):') || '';
  if (!S.finance.financialGoals) S.finance.financialGoals = [];
  S.finance.financialGoals.push({ id:Date.now(), title:title.trim(), target, current, deadline:deadline||null, milestones:[], actions:'' });
  saveAll(); rFinance(document.getElementById('ct'));
};
window.updateGoalCurrent = function(id) {
  const g = (S.finance.financialGoals||[]).find(x=>x.id===id);
  if (!g) return;
  const v = parseFloat(prompt('Current amount (₹):', g.current));
  if (!isNaN(v)) { g.current = v; saveAll(); rFinance(document.getElementById('ct')); }
};
window.addGoalMilestone = function(id) {
  const g = (S.finance.financialGoals||[]).find(x=>x.id===id);
  if (!g) return;
  const amt = parseFloat(prompt('Milestone amount (₹):'));
  if (amt > 0) { g.milestones.push({ amount:amt, done:false }); g.milestones.sort((a,b)=>a.amount-b.amount); saveAll(); rFinance(document.getElementById('ct')); }
};

// ════ ADVICE ════
function rFinAdvice() {
  const totInc = thisMonthIncome().reduce((s,i)=>s+i.amount,0);
  return `<div>${!S.finance.salary && !totInc ? '<div style="color:var(--t3);text-align:center;padding:20px;font-size:13px">Set salary or add income first</div>' : `
    <button onclick="getFA()" id="faB" class="btn bp" style="width:100%;padding:12px;margin-bottom:12px;font-size:14px;gap:6px">${I.star} Full Analysis</button>
    <button onclick="getWeeklyReview()" class="btn bs" style="width:100%;padding:10px;margin-bottom:12px;font-size:13px;gap:4px">${I.clock} Weekly Review</button>
    ${fa ? `<div class="cd" style="border-left:3px solid var(--ac);border-radius:0"><div style="font-size:13px;line-height:1.7">${fmt(fa)}</div></div>` : ''}`}</div>`;
}

window.getFA = async function() {
  if (isDemoMode()) { showToast('API key add karo'); return; }
  document.getElementById('faB').textContent = 'Analyzing...';
  const totExp = thisMonthExpenses().reduce((s,e)=>s+e.amount,0);
  const totInc = thisMonthIncome().reduce((s,i)=>s+i.amount,0);
  const bc = {}; thisMonthExpenses().forEach(e => { bc[e.cat]=(bc[e.cat]||0)+e.amount; });
  const incSrc = {}; thisMonthIncome().forEach(i => { incSrc[i.source]=(incSrc[i.source]||0)+i.amount; });
  const nw = S.finance.netWorth || {};
  const totalA = Object.values(nw.assets||{}).reduce((s,v)=>s+(v||0),0);
  const totalL = Object.values(nw.liabilities||{}).reduce((s,v)=>s+(v||0),0);
  const streams = (S.finance.incomeStreams||[]).map(s=>`${s.name}(${s.status},₹${s.revenue||0})`).join(', ');
  const fGoals = (S.finance.financialGoals||[]).map(g=>`${g.title}:₹${g.current}/₹${g.target}`).join(', ');

  fa = await ai([{role:'user',content:`FULL DATA:\nSalary:₹${S.finance.salary}\nExpenses:${JSON.stringify(bc)} Total:₹${totExp}\nIncome:${JSON.stringify(incSrc)} Total:₹${totInc}\nNet Savings:₹${totInc-totExp}\nNet Worth:₹${totalA-totalL} (A:₹${totalA},L:₹${totalL})\nStreams:${streams||'none'}\nGoals:${fGoals||'none'}\n\nFull analysis — 50/30/20, SIP, crore plan, Rule of 72, streams suggest. Real numbers.`}], SOUL+'\nFinancial expert. Specific numbers. Formulas — Compound Interest, Rule of 72, 50/30/20.');
  rFinance(document.getElementById('ct'));
};

window.getWeeklyReview = async function() {
  if (isDemoMode()) { showToast('API key add karo'); return; }
  showToast('Generating review...');
  const totExp = thisMonthExpenses().reduce((s,e)=>s+e.amount,0);
  const totInc = thisMonthIncome().reduce((s,i)=>s+i.amount,0);
  const streams = (S.finance.incomeStreams||[]).filter(s=>s.status==='Active');
  const fGoals = S.finance.financialGoals||[];

  const review = await ai([{role:'user',content:`WEEKLY REVIEW:\nIncome:₹${totInc}|Expenses:₹${totExp}|Net:₹${totInc-totExp}\nStreams:${streams.map(s=>s.name+':₹'+s.revenue).join(', ')||'none'}\nGoals:${fGoals.map(g=>g.title+':₹'+g.current+'/₹'+g.target).join(', ')||'none'}\n\nFormat: Income/Expenses/Net/Goal progress/Actionable suggestion/Trend. Celebrate wins. Formulas.`}], SOUL+'\nWeekly reviewer. Hinglish. Specific actionable.');

  if (!S.finance.weeklyReviews) S.finance.weeklyReviews = [];
  S.finance.weeklyReviews.push({ id:Date.now(), weekStart:td(), data:review, createdAt:new Date().toISOString() });
  saveAll(); fa = review; rFinance(document.getElementById('ct'));
};

window.renderSecChat_finance = function() { if(ft==='chat'){const w=document.getElementById('finChatWrap');if(w)renderEmbeddedChat('finance',w);} };
