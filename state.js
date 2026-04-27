// ════════════════════════════════════
//  AAKASH AI v2 — State (state.js)
//  Data + Multi-chat + Themes + Embedded AI Chat
// ════════════════════════════════════

// ── MAIN STATE ──
let S = {
  chat: [], chats: [], activeChat: null,
  projects: [], activeProject: null,
  entries: [], notes: [],
  finance: { salary: 0, expenses: [] },
  habits: [], habitLog: {},
  apiKey: '', elKey: '', geminiKey: '',
  voiceMood: 'rachel', thinkMode: false,
  memoryFacts: [], customRules: [], hiddenTabs: [],
  apiKeys: [], reminders: [], budgets: {},
  showThinking: false,
  secChats: {
    finance: { chats: [], activeId: null },
    notes:   { chats: [], activeId: null },
    habits:  { chats: [], activeId: null },
    vault:   { chats: [], activeId: null }
  }
};

let tab = 'chat', loading = false, mc = 0;

// ── THEMES ──
const THEMES = [
  { id:'clean-white', name:'Clean white', dark:false },
  { id:'midnight-dark', name:'Midnight dark', dark:true },
  { id:'ocean-blue', name:'Ocean blue', dark:false },
  { id:'violet-dream', name:'Violet dream', dark:false },
  { id:'mint-fresh', name:'Mint fresh', dark:false },
  { id:'neon-night', name:'Neon night', dark:true }
];

function gT() { return localStorage.getItem('ak_theme') || 'clean-white'; }
function sT(t) {
  localStorage.setItem('ak_theme', t);
  document.documentElement.setAttribute('data-theme', t);
  const th = THEMES.find(x => x.id === t);
  document.querySelector('meta[name=theme-color]').content = th?.dark ? '#0a0a0a' : '#ffffff';
}
function applyCustom() {
  const fs = localStorage.getItem('ak_fontsize');
  if (fs) document.documentElement.style.setProperty('--fontSize', fs + 'px');
}

// ── STORAGE ──
function getStorageSize() {
  let t = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('ak_')) t += localStorage.getItem(k).length * 2;
  }
  return t;
}
function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

function autoCompress() {
  if (S.chat.length > 50) S.chat = S.chat.slice(-50);
  if (S.chats.length > 100) S.chats = S.chats.slice(-100);
  S.chats.forEach(c => { if (c.messages.length > 50) c.messages = c.messages.slice(-50); });
  const cut = new Date(); cut.setDate(cut.getDate() - 90);
  const cs = cut.toISOString().slice(0, 10);
  Object.keys(S.habitLog).forEach(d => { if (d < cs) delete S.habitLog[d]; });
  if (S.memoryFacts?.length > 50) S.memoryFacts = S.memoryFacts.slice(-50);
  if (S.secChats) {
    ['finance','notes','habits','vault'].forEach(s => {
      if (!S.secChats[s]) return;
      if (S.secChats[s].chats.length > 20) S.secChats[s].chats = S.secChats[s].chats.slice(-20);
      S.secChats[s].chats.forEach(c => { if (c.messages.length > 40) c.messages = c.messages.slice(-40); });
    });
  }
}

async function saveAll() { autoCompress(); await EDB.save('data', S); }

async function loadAll() {
  const d = await EDB.load('data');
  if (d) {
    S = { ...S, ...d };
    if (!S.chats) S.chats = [];
    if (!S.projects) S.projects = [];
    if (!S.activeChat) S.activeChat = null;
    if (!S.activeProject) S.activeProject = null;
    if (!S.apiKeys) S.apiKeys = [];
    if (!S.reminders) S.reminders = [];
    if (!S.budgets) S.budgets = {};
    if (S.showThinking === undefined) S.showThinking = false;
    if (!S.secChats) S.secChats = {};
    ['finance','notes','habits','vault'].forEach(s => {
      if (!S.secChats[s]) S.secChats[s] = { chats:[], activeId:null };
    });
    migrateKeys();
    if (typeof initReminders === 'function') initReminders();
    mc = S.chat.filter(m => m.role === 'user').length;
  }
}

// ── MULTI-CHAT ──
function createNewChat(projectId) {
  if (S.chat.length > 0) saveChatToHistory();
  const chat = { id: Date.now(), title: 'New Chat', messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), projectId: projectId || null };
  S.chats.unshift(chat);
  S.activeChat = chat.id;
  S.chat = []; mc = 0;
  saveAll(); return chat;
}

function saveChatToHistory() {
  if (S.chat.length === 0) return;
  const firstMsg = S.chat.find(m => m.role === 'user');
  const title = firstMsg ? (typeof firstMsg.content === 'string' ? firstMsg.content : '[File]').slice(0, 40) : 'Chat';
  if (S.activeChat) {
    const existing = S.chats.find(c => c.id === S.activeChat);
    if (existing) { existing.messages = [...S.chat]; existing.title = title; existing.updatedAt = new Date().toISOString(); }
  } else {
    const chat = { id: Date.now(), title, messages: [...S.chat], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), projectId: S.activeProject || null };
    S.chats.unshift(chat); S.activeChat = chat.id;
  }
}

function loadChat(chatId) {
  if (S.chat.length > 0) saveChatToHistory();
  const chat = S.chats.find(c => c.id === chatId);
  if (chat) { S.chat = [...chat.messages]; S.activeChat = chat.id; mc = S.chat.filter(m => m.role === 'user').length; }
}

function deleteChat(chatId) {
  S.chats = S.chats.filter(c => c.id !== chatId);
  if (S.activeChat === chatId) { S.chat = []; S.activeChat = null; mc = 0; }
  S.projects.forEach(p => { if (p.chatIds) p.chatIds = p.chatIds.filter(id => id !== chatId); });
  saveAll();
}

function getChatsByProject(projectId) {
  if (!projectId) return S.chats.filter(c => !c.projectId);
  return S.chats.filter(c => c.projectId === projectId);
}

// ── PROJECTS ──
function createProject(name, description) {
  const project = { id: Date.now(), name, description: description || '', chatIds: [], createdAt: new Date().toISOString() };
  S.projects.unshift(project); S.activeProject = project.id; saveAll(); return project;
}
function deleteProject(projectId) {
  S.chats.forEach(c => { if (c.projectId === projectId) c.projectId = null; });
  S.projects = S.projects.filter(p => p.id !== projectId);
  if (S.activeProject === projectId) S.activeProject = null;
  saveAll();
}
function switchProject(projectId) {
  if (S.chat.length > 0) saveChatToHistory();
  S.activeProject = projectId; S.chat = []; S.activeChat = null; mc = 0; saveAll();
}

// ── HELPERS ──
function INR(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }
function td() { return new Date().toISOString().slice(0, 10); }
function isDemoMode() { return !(S.apiKeys || []).some(k => k.enabled); }

function fmt(t) {
  if (!t) return '';
  return t.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre style="background:var(--bg);padding:12px;border-radius:8px;font-size:12px;margin:6px 0;border:1px solid var(--b1);font-family:JetBrains Mono,monospace;overflow-x:auto;white-space:pre-wrap;line-height:1.6">$2</pre>')
    .replace(/`([^`]+)`/g, '<code style="background:var(--acBg);padding:2px 6px;border-radius:4px;font-size:12px;font-family:JetBrains Mono,monospace;color:var(--ac)">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em style="color:var(--t2)">$1</em>')
    .replace(/^### (.+)$/gm, '<div style="font-size:13px;font-weight:600;color:var(--ac);margin:10px 0 4px">$1</div>')
    .replace(/^## (.+)$/gm, '<div style="font-size:15px;font-weight:600;margin:12px 0 4px">$1</div>')
    .replace(/^- (.+)$/gm, '<div style="padding-left:10px;margin:3px 0;color:var(--t2)">› $1</div>')
    .replace(/\n/g, '<br>');
}

function _timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff/60000), hrs = Math.floor(diff/3600000), days = Math.floor(diff/86400000);
  if (mins < 1) return 'now';
  if (mins < 60) return mins + 'm';
  if (hrs < 24) return hrs + 'h';
  if (days < 7) return days + 'd';
  return new Date(dateStr).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
}

// ════════════════════════════════════
//  EMBEDDED AI CHAT — Multi-chat + Pro UI
// ════════════════════════════════════

const SECTION_CHAT_CONFIG = {
  finance: {
    name: 'Finance Advisor', icon: 'money',
    greeting: 'Main tera financial advisor hoon. Salary, SIP, tax, budget — kuch bhi pooch.',
    quickBtns: ['SIP advice', 'Expense analysis', 'Tax saving', '1 Crore plan'],
    getContext: () => {
      const tot = S.finance.expenses.reduce((s, e) => s + e.amount, 0);
      const bc = {}; S.finance.expenses.forEach(e => { bc[e.cat] = (bc[e.cat] || 0) + e.amount; });
      return `\n[FINANCE DATA]\nSalary:₹${S.finance.salary||'Not set'}|Spent:₹${tot}|Left:₹${(S.finance.salary||0)-tot}\nBreakdown:${JSON.stringify(bc)}`;
    },
    sysPrompt: 'Tu AAKASH hai — FINANCIAL ADVISOR. Data dekh ke specific numbers de. Hinglish mein. Chhoti baat = chhota reply.'
  },
  notes: {
    name: 'AI Teacher', icon: 'book',
    greeting: 'Main tera teacher hoon. Koi bhi topic pooch — simple Hinglish mein samjhaunga.',
    quickBtns: ['Kuch samjhao', 'Quiz de', 'Summary', 'Concept clear'],
    getContext: () => {
      return `\n[NOTES]\nTotal:${S.notes.length}\nRecent:${S.notes.slice(0,10).map(n => n.title).join(', ')||'none'}`;
    },
    sysPrompt: 'Tu AAKASH hai — TEACHER. Simple Hinglish mein samjha. Real examples. End mein "samjha? koi doubt?" pooch.'
  },
  habits: {
    name: 'Life Coach', icon: 'habits',
    greeting: 'Main tera life coach hoon. Habits, motivation — tere data ke basis pe advice dunga.',
    quickBtns: ['Motivate me', 'Habit analysis', 'Streak tips', 'New habit'],
    getContext: () => {
      const t = td(), done = S.habitLog[t] || [];
      return `\n[HABITS]\nToday:${done.length}/${S.habits.length}\nHabits:${S.habits.map(h => `${h.name}(${done.includes(h.id)?'done':'pending'})`).join(', ')||'none'}`;
    },
    sysPrompt: 'Tu AAKASH hai — LIFE COACH. Habit data dekh ke specific advice. Streak praise kar, miss pe gently push.'
  },
  vault: {
    name: 'Productivity Coach', icon: 'target',
    greeting: 'Main tera productivity coach hoon. Tasks, goals — tere data dekh ke advice dunga.',
    quickBtns: ['Prioritize', 'Goal review', 'Productivity tips', 'Weekly plan'],
    getContext: () => {
      const tasks = S.entries.filter(e => e.type === 'task' && !e.done);
      const goals = S.entries.filter(e => e.type === 'goal' && !e.done);
      return `\n[VAULT]\nPending tasks:${tasks.map(t=>t.title).slice(0,8).join(', ')||'none'}\nActive goals:${goals.map(g=>g.title).join(', ')||'none'}`;
    },
    sysPrompt: 'Tu AAKASH hai — PRODUCTIVITY COACH. Tasks/goals dekh ke specific advice. Actionable steps de.'
  }
};

const _secChatLoading = { finance:false, notes:false, habits:false, vault:false };
const _secMenuOpen = { finance:null, notes:null, habits:null, vault:null };
let _secListOpen = { finance:false, notes:false, habits:false, vault:false };
window._secListOpen = _secListOpen;

function _getSecData(s) { if (!S.secChats) S.secChats = {}; if (!S.secChats[s]) S.secChats[s] = {chats:[],activeId:null}; return S.secChats[s]; }
function _getActiveChat(s) { const d = _getSecData(s); return d.chats.find(c => c.id === d.activeId) || null; }

window.secNewChat = function(s) {
  const d = _getSecData(s);
  const c = { id:Date.now(), title:'New chat', messages:[], createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
  d.chats.unshift(c); d.activeId = c.id; _secListOpen[s] = false; saveAll();
  window['renderSecChat_'+s]?.();
};
window.secLoadChat = function(s, id) { _getSecData(s).activeId = id; _secListOpen[s] = false; saveAll(); window['renderSecChat_'+s]?.(); };
window.secDeleteChat = function(s, id) {
  const d = _getSecData(s); d.chats = d.chats.filter(c => c.id !== id);
  if (d.activeId === id) d.activeId = d.chats[0]?.id || null;
  _secMenuOpen[s] = null; saveAll(); window['renderSecChat_'+s]?.();
};
window.secRenameChat = function(s, id) {
  const c = _getSecData(s).chats.find(x => x.id === id);
  if (!c) return;
  const n = prompt('Rename:', c.title);
  if (n?.trim()) { c.title = n.trim(); _secMenuOpen[s] = null; saveAll(); window['renderSecChat_'+s]?.(); }
};
window.secToggleMenu = function(s, id) { _secMenuOpen[s] = _secMenuOpen[s] === id ? null : id; window['renderSecChat_'+s]?.(); };

function renderEmbeddedChat(section, container) {
  const cfg = SECTION_CHAT_CONFIG[section];
  const data = _getSecData(section);
  const ac = _getActiveChat(section);
  const msgs = ac ? ac.messages : [];
  const isLoad = _secChatLoading[section];
  const showList = _secListOpen[section];

  container.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;min-height:0">
  <div style="padding:8px 12px;border-bottom:1px solid var(--b1);background:var(--c1);display:flex;align-items:center;gap:8px;flex-shrink:0">
    ${aiAvatar(26)}
    <div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ac ? ac.title : cfg.name}</div>
    <div style="font-size:10px;color:var(--t4)">${cfg.name}${data.chats.length ? ' · '+data.chats.length+' chats':''}</div></div>
    <button onclick="_secListOpen.${section}=!_secListOpen.${section};renderSecChat_${section}()" style="width:30px;height:30px;border-radius:8px;background:${showList?'var(--acBg2)':'var(--c2)'};border:1px solid ${showList?'var(--acBorder)':'var(--b1)'};display:flex;align-items:center;justify-content:center;color:${showList?'var(--ac)':'var(--t3)'}">${I.clock}</button>
    <button onclick="secNewChat('${section}')" style="width:30px;height:30px;border-radius:8px;background:var(--grad);border:none;display:flex;align-items:center;justify-content:center;color:#fff">${I.plus}</button>
  </div>
  ${showList ? `<div style="background:var(--c1);border-bottom:1px solid var(--b1);max-height:200px;overflow-y:auto;flex-shrink:0">
    ${data.chats.length === 0 ? '<div style="padding:20px;text-align:center;color:var(--t4);font-size:12px">No chats yet</div>' :
    data.chats.map(c => `<div style="display:flex;align-items:center;padding:8px 12px;gap:8px;cursor:pointer;background:${data.activeId===c.id?'var(--acBg)':'transparent'};border-left:2px solid ${data.activeId===c.id?'var(--ac)':'transparent'}" onclick="secLoadChat('${section}',${c.id})">
      <div style="color:${data.activeId===c.id?'var(--ac)':'var(--t4)'}">${I.chat}</div>
      <div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:${data.activeId===c.id?'600':'400'};color:${data.activeId===c.id?'var(--ac)':'var(--t1)'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.title}</div>
      <div style="font-size:10px;color:var(--t4)">${c.messages.length} msgs · ${_timeAgo(c.updatedAt)}</div></div>
      <div style="position:relative;flex-shrink:0">
        <button onclick="event.stopPropagation();secToggleMenu('${section}',${c.id})" style="width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--t4);background:none;border:none">${I.dots}</button>
        ${_secMenuOpen[section]===c.id ? `<div style="position:absolute;right:0;top:26px;background:var(--c1);border:1px solid var(--b1);border-radius:10px;box-shadow:var(--shadowLg);z-index:20;min-width:120px;overflow:hidden">
          <button onclick="event.stopPropagation();secRenameChat('${section}',${c.id})" style="display:flex;align-items:center;gap:6px;width:100%;padding:8px 12px;font-size:12px;color:var(--t2);background:none;border:none;cursor:pointer">${I.edit} Rename</button>
          <button onclick="event.stopPropagation();if(confirm('Delete?'))secDeleteChat('${section}',${c.id})" style="display:flex;align-items:center;gap:6px;width:100%;padding:8px 12px;font-size:12px;color:var(--r);background:none;border:none;cursor:pointer">${I.trash} Delete</button>
        </div>` : ''}
      </div>
    </div>`).join('')}
  </div>` : ''}
  <div id="sec_cm_${section}" style="flex:1;overflow-y:auto;padding:12px;background:var(--bg)">
  ${msgs.length === 0 ? `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;animation:fadeIn .4s">
    ${aiAvatar(44)}
    <div style="font-size:14px;font-weight:600;margin:10px 0 4px">${cfg.name}</div>
    <p style="color:var(--t3);font-size:11px;text-align:center;max-width:240px;line-height:1.6;margin-bottom:14px">${cfg.greeting}</p>
    <div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;max-width:280px">
    ${cfg.quickBtns.map(q => `<button onclick="sendSecChat('${section}','${q}')" style="padding:6px 12px;border-radius:16px;background:var(--c1);border:1px solid var(--b1);color:var(--t2);font-size:11px;font-weight:500;cursor:pointer">${q}</button>`).join('')}
    </div></div>` :
  msgs.map((m,i) => `<div style="display:flex;justify-content:${m.role==='user'?'flex-end':'flex-start'};margin-bottom:8px;animation:slideUp .2s">
    ${m.role==='assistant' ? `<div style="margin-right:6px;margin-top:2px">${aiAvatar(22)}</div>` : ''}
    <div style="max-width:80%">
      <div style="padding:8px 12px;border-radius:${m.role==='user'?'14px 14px 4px 14px':'4px 14px 14px 14px'};background:${m.role==='user'?'var(--grad)':'var(--c1)'};border:${m.role==='user'?'none':'1px solid var(--b1)'};font-size:13px;line-height:1.6;color:${m.role==='user'?'#fff':'var(--t1)'}">${m.role==='user' ? m.content.replace(/</g,'&lt;') : fmt(m.content)}</div>
      ${m.role==='assistant' ? `<div style="display:flex;gap:2px;margin-top:2px"><button onclick="navigator.clipboard.writeText(S.secChats['${section}'].chats.find(c=>c.id===S.secChats['${section}'].activeId)?.messages[${i}]?.content||'');showToast('Copied!')" style="padding:2px 6px;border-radius:4px;font-size:9px;color:var(--t4);background:none;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:3px">${I.copy} Copy</button></div>` : ''}
    </div></div>`).join('') +
  (isLoad ? `<div style="display:flex;align-items:center;gap:6px;padding:4px"><div style="margin-right:2px">${aiAvatar(22)}</div><div style="display:flex;gap:4px;align-items:center">${[0,1,2].map(i => `<div style="width:5px;height:5px;border-radius:50%;background:var(--ac);animation:dot 1s ${i*.2}s infinite"></div>`).join('')}<span style="font-size:10px;color:var(--t3);margin-left:4px">Thinking...</span></div></div>` : '')}
  </div>
  <div style="flex-shrink:0;padding:8px 12px;border-top:1px solid var(--b1);background:var(--c1)">
    ${msgs.length > 0 ? `<div style="display:flex;gap:4px;margin-bottom:6px;overflow-x:auto">${cfg.quickBtns.slice(0,3).map(q => `<button onclick="sendSecChat('${section}','${q}')" style="padding:4px 10px;border-radius:12px;background:var(--c2);border:1px solid var(--b1);color:var(--t3);font-size:10px;white-space:nowrap;cursor:pointer">${q}</button>`).join('')}</div>` : ''}
    <div style="display:flex;gap:6px;align-items:end">
      <textarea id="sec_ci_${section}" class="inp" placeholder="Message..." rows="1" style="flex:1;resize:none;min-height:36px;max-height:72px;border-radius:10px;padding:8px 12px;font-size:13px" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendSecChat('${section}')}" oninput="this.style.height='36px';this.style.height=Math.min(this.scrollHeight,72)+'px'"></textarea>
      <button onclick="sendSecChat('${section}')" style="width:36px;height:36px;border-radius:10px;background:var(--grad);border:none;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;cursor:pointer">${I.send}</button>
    </div>
  </div></div>`;
  const cm = document.getElementById('sec_cm_' + section);
  if (cm) cm.scrollTop = cm.scrollHeight;
}

window.sendSecChat = async function(section, text) {
  if (isDemoMode()) { showToast('API key add karo for AI features'); return; }
  const cfg = SECTION_CHAT_CONFIG[section];
  const data = _getSecData(section);
  const inp = document.getElementById('sec_ci_' + section);
  const content = text || (inp ? inp.value.trim() : '');
  if (!content || _secChatLoading[section]) return;
  if (inp) inp.value = '';
  if (!data.activeId) {
    const c = { id:Date.now(), title:content.slice(0,35), messages:[], createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
    data.chats.unshift(c); data.activeId = c.id;
  }
  const ac = data.chats.find(c => c.id === data.activeId);
  if (!ac) return;
  if (ac.messages.length === 0) ac.title = content.slice(0, 35);
  ac.messages.push({ role:'user', content });
  ac.updatedAt = new Date().toISOString();
  _secChatLoading[section] = true;
  window['renderSecChat_'+section]?.();
  const sysPrompt = SOUL + cfg.getContext() + '\n' + cfg.sysPrompt;
  const apiMsgs = ac.messages.slice(-20).map(m => ({ role:m.role, content:m.content }));
  const reply = await ai(apiMsgs, sysPrompt);
  ac.messages.push({ role:'assistant', content:reply });
  ac.updatedAt = new Date().toISOString();
  _secChatLoading[section] = false;
  await saveAll();
  window['renderSecChat_'+section]?.();
};
