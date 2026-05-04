// ════════════════════════════════════
//  AAKASH AI v2 — Vault (vault.js)
//  Items + Coach + Timer (merged)
// ════════════════════════════════════

let vf = 'all', ve = null, vaultView = 'items';
let pm = { on:false, time:1500, mode:'work', sess:0 }, pi = null;

function rVault(ct) {
  ct.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;min-height:0">
  <div style="display:flex;gap:3px;padding:3px;margin:8px 12px 4px;background:var(--bg3);border-radius:10px;flex-shrink:0;overflow-x:auto">
    ${['items','skills','ideas','coach','timer'].map(v => `<button onclick="vaultView='${v}';rVault(document.getElementById('ct'))" style="padding:7px 10px;border-radius:8px;font-size:11px;font-weight:${vaultView===v?'600':'400'};background:${vaultView===v?'var(--c1)':'transparent'};color:${vaultView===v?'var(--t1)':'var(--t4)'};${vaultView===v?'box-shadow:var(--shadow)':''};display:flex;align-items:center;justify-content:center;gap:4px;white-space:nowrap">${v==='items'?I.vault:v==='coach'?I.target:v==='timer'?I.clock:v==='skills'?I.zap:I.idea} ${v[0].toUpperCase()+v.slice(1)}</button>`).join('')}
  </div>
  ${vaultView==='coach' ? '<div id="vltChatWrap" style="flex:1;display:flex;flex-direction:column;min-height:0"></div>' :
    vaultView==='timer' ? rVaultTimer() :
    vaultView==='skills' ? rVaultSkills() :
    vaultView==='ideas' ? rVaultIdeas() :
    rVaultItems()}
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

// ════ SKILL-TO-MONEY PIPELINE ════
function rVaultSkills() {
  const skills = S.skills || [];
  const LEVELS = ['Beginner','Intermediate','Advanced','Expert'];
  const MONET = ['Not yet','Exploring','Earning'];
  const levelPct = { 'Beginner':25, 'Intermediate':50, 'Advanced':75, 'Expert':100 };

  return `<div style="flex:1;overflow-y:auto;padding:8px 12px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-size:15px;font-weight:600">Skill → Money Pipeline</div>
      <button onclick="addSkillUI()" class="btn bp" style="padding:6px 14px;font-size:11px">${I.plus} Add</button>
    </div>

    ${skills.length===0 ? '<div style="text-align:center;padding:24px;color:var(--t4);font-size:12px">Add skills you are learning/monetizing</div>' :
    skills.map(sk => {
      const pct = levelPct[sk.level] || 25;
      const monColor = sk.monetization==='Earning'?'var(--g)':sk.monetization==='Exploring'?'var(--y)':'var(--t4)';
      return `<div class="cd" style="margin-bottom:6px;border-left:3px solid ${monColor};border-radius:0">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <div style="flex:1"><div style="font-size:14px;font-weight:600">${sk.name}</div>
          <div style="display:flex;gap:6px;align-items:center;margin-top:4px">
            <button onclick="cycleSkillLevel(${sk.id})" style="padding:2px 8px;border-radius:10px;font-size:9px;font-weight:600;background:var(--acBg);color:var(--ac);border:1px solid var(--acBorder)">${sk.level}</button>
            <button onclick="cycleSkillMonet(${sk.id})" style="padding:2px 8px;border-radius:10px;font-size:9px;font-weight:600;background:${sk.monetization==='Earning'?'var(--gBg)':sk.monetization==='Exploring'?'var(--yBg)':'var(--c2)'};color:${monColor};border:1px solid ${sk.monetization==='Earning'?'var(--gBorder)':sk.monetization==='Exploring'?'rgba(245,158,11,.2)':'var(--b1)'}">${sk.monetization}</button>
          </div>
          ${sk.linkedStream?`<div style="font-size:10px;color:var(--t3);margin-top:4px">→ ${sk.linkedStream}</div>`:''}
          ${sk.nextMilestone?`<div style="font-size:10px;color:var(--ac);margin-top:2px">Next: ${sk.nextMilestone}</div>`:''}
          </div>
          <button onclick="S.skills=S.skills.filter(x=>x.id!==${sk.id});saveAll();rVault(document.getElementById('ct'))" style="color:var(--t4)">${I.trash}</button>
        </div>
        <div style="height:4px;background:var(--bg);border-radius:2px;margin-top:8px;overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--grad);border-radius:2px"></div></div>
        <div style="font-size:9px;color:var(--t4);margin-top:3px;text-align:right">${pct}% mastery</div>
        ${sk.revenue?`<div style="font-size:11px;color:var(--g);margin-top:2px">Revenue: ${INR(sk.revenue)}</div>`:''}
      </div>`;
    }).join('')}
  </div>`;
}

window.addSkillUI = function() {
  const name = prompt('Skill name (e.g., Python, Web Dev):');
  if (!name?.trim()) return;
  if (!S.skills) S.skills = [];
  S.skills.push({ id:Date.now(), name:name.trim(), level:'Beginner', monetization:'Not yet', revenue:0, linkedStream:'', nextMilestone:'' });
  saveAll(); rVault(document.getElementById('ct'));
};

window.cycleSkillLevel = function(id) {
  const sk = (S.skills||[]).find(x=>x.id===id);
  if (!sk) return;
  const LEVELS = ['Beginner','Intermediate','Advanced','Expert'];
  sk.level = LEVELS[(LEVELS.indexOf(sk.level)+1)%LEVELS.length];
  saveAll(); rVault(document.getElementById('ct'));
};

window.cycleSkillMonet = function(id) {
  const sk = (S.skills||[]).find(x=>x.id===id);
  if (!sk) return;
  const MONET = ['Not yet','Exploring','Earning'];
  sk.monetization = MONET[(MONET.indexOf(sk.monetization)+1)%MONET.length];
  saveAll(); rVault(document.getElementById('ct'));
};

// ════ BUSINESS IDEAS VAULT ════
function rVaultIdeas() {
  const ideas = S.businessIdeas || [];
  const STATUS = ['Just an idea','Researching','Validating','Building','Launched'];
  const PRIO = ['Low','Medium','High'];

  return `<div style="flex:1;overflow-y:auto;padding:8px 12px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-size:15px;font-weight:600">Business Ideas</div>
      <button onclick="addIdeaUI()" class="btn bp" style="padding:6px 14px;font-size:11px">${I.plus} Add</button>
    </div>

    ${ideas.length===0 ? '<div style="text-align:center;padding:24px;color:var(--t4);font-size:12px">Save your business ideas here</div>' :
    ideas.sort((a,b)=>(PRIO.indexOf(b.priority||'Medium'))-(PRIO.indexOf(a.priority||'Medium'))).map(idea => {
      const stIdx = STATUS.indexOf(idea.status);
      const pctProgress = Math.max(5, ((stIdx+1)/STATUS.length)*100);
      const prioColor = idea.priority==='High'?'var(--r)':idea.priority==='Medium'?'var(--y)':'var(--t4)';
      return `<div class="cd" style="margin-bottom:6px;border-left:3px solid ${prioColor};border-radius:0">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <div style="flex:1">
            <div style="font-size:14px;font-weight:600">${idea.title}</div>
            ${idea.oneLiner?`<div style="font-size:11px;color:var(--t3);margin-top:2px">${idea.oneLiner}</div>`:''}
            <div style="display:flex;gap:6px;align-items:center;margin-top:4px">
              <button onclick="cycleIdeaStatus(${idea.id})" style="padding:2px 8px;border-radius:10px;font-size:9px;font-weight:600;background:var(--acBg);color:var(--ac);border:1px solid var(--acBorder)">${idea.status}</button>
              <button onclick="cycleIdeaPriority(${idea.id})" style="padding:2px 8px;border-radius:10px;font-size:9px;font-weight:600;background:${idea.priority==='High'?'var(--rBg)':'var(--c2)'};color:${prioColor};border:1px solid ${idea.priority==='High'?'var(--rBorder)':'var(--b1)'}">${idea.priority||'Medium'}</button>
            </div>
            ${idea.potentialRevenue?`<div style="font-size:10px;color:var(--g);margin-top:4px">Potential: ${idea.potentialRevenue}</div>`:''}
            ${idea.problem?`<div style="font-size:10px;color:var(--t3);margin-top:2px">Problem: ${idea.problem}</div>`:''}
          </div>
          <button onclick="S.businessIdeas=S.businessIdeas.filter(x=>x.id!==${idea.id});saveAll();rVault(document.getElementById('ct'))" style="color:var(--t4)">${I.trash}</button>
        </div>
        <div style="height:3px;background:var(--bg);border-radius:2px;margin-top:6px;overflow:hidden"><div style="height:100%;width:${pctProgress}%;background:var(--grad);border-radius:2px"></div></div>
      </div>`;
    }).join('')}
  </div>`;
}

window.addIdeaUI = function() {
  const title = prompt('Idea title:');
  if (!title?.trim()) return;
  const oneLiner = prompt('One-line description (optional):') || '';
  if (!S.businessIdeas) S.businessIdeas = [];
  S.businessIdeas.push({ id:Date.now(), title:title.trim(), oneLiner, problem:'', potentialRevenue:'', investment:'', skillsNeeded:'', status:'Just an idea', priority:'Medium', createdAt:new Date().toISOString() });
  saveAll(); rVault(document.getElementById('ct'));
};

window.cycleIdeaStatus = function(id) {
  const idea = (S.businessIdeas||[]).find(x=>x.id===id);
  if (!idea) return;
  const STATUS = ['Just an idea','Researching','Validating','Building','Launched'];
  idea.status = STATUS[(STATUS.indexOf(idea.status)+1)%STATUS.length];
  saveAll(); rVault(document.getElementById('ct'));
};

window.cycleIdeaPriority = function(id) {
  const idea = (S.businessIdeas||[]).find(x=>x.id===id);
  if (!idea) return;
  const PRIO = ['Low','Medium','High'];
  idea.priority = PRIO[(PRIO.indexOf(idea.priority||'Medium')+1)%PRIO.length];
  saveAll(); rVault(document.getElementById('ct'));
};

window.renderSecChat_vault = function() { if (vaultView==='coach') { const w=document.getElementById('vltChatWrap'); if(w) renderEmbeddedChat('vault',w); } };
