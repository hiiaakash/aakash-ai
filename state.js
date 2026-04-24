// ════════════════════════════════════
//  AAKASH AI — State (state.js)
//  Data management + Multi-chat + Projects
// ════════════════════════════════════

// ── MAIN STATE ──
let S = {
  // Current active chat
  chat: [],
  // Multi-chat system (NEW)
  chats: [],           // [{id, title, messages:[], createdAt, updatedAt}]
  activeChat: null,    // Current chat ID
  // Projects system (NEW)
  projects: [],        // [{id, name, description, chatIds:[], createdAt}]
  activeProject: null, // Current project ID
  // Existing features
  entries: [],
  notes: [],
  finance: { salary: 0, expenses: [] },
  habits: [],
  habitLog: {},
  apiKey: '',
  elKey: '',
  geminiKey: '',
  voiceMood: 'rachel',
  thinkMode: false,
  memoryFacts: [],
  customRules: [],
  hiddenTabs: [],
  apiKeys: []           // [{id, name, key, provider, enabled, addedAt}]
};

let tab = 'chat', loading = false, mc = 0;

// ── THEME & CUSTOMIZATION ──
function gT() { return localStorage.getItem('ak_theme') || 'light'; }
function sT(t) {
  localStorage.setItem('ak_theme', t);
  document.documentElement.setAttribute('data-theme', t);
  document.querySelector('meta[name=theme-color]').content = t === 'dark' ? '#0c0c12' : '#ffffff';
}

function applyCustom() {
  const a = localStorage.getItem('ak_accent');
  if (a) {
    document.documentElement.style.setProperty('--accent', a);
    document.documentElement.style.setProperty('--accent2', a);
  }
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
  // Compress current chat: keep last 50 messages
  if (S.chat.length > 50) S.chat = S.chat.slice(-50);
  // Compress saved chats: keep last 100 chats, trim messages in old chats
  if (S.chats.length > 100) S.chats = S.chats.slice(-100);
  S.chats.forEach(c => { if (c.messages.length > 50) c.messages = c.messages.slice(-50); });
  // Compress habit log: keep last 90 days
  const cut = new Date(); cut.setDate(cut.getDate() - 90);
  const cs = cut.toISOString().slice(0, 10);
  Object.keys(S.habitLog).forEach(d => { if (d < cs) delete S.habitLog[d]; });
  // Compress memories
  if (S.memoryFacts?.length > 50) S.memoryFacts = S.memoryFacts.slice(-50);
}

async function saveAll() { autoCompress(); await EDB.save('data', S); }

async function loadAll() {
  const d = await EDB.load('data');
  if (d) {
    S = { ...S, ...d };
    // Migrate: ensure new fields exist for old users
    if (!S.chats) S.chats = [];
    if (!S.projects) S.projects = [];
    if (!S.activeChat) S.activeChat = null;
    if (!S.activeProject) S.activeProject = null;
    if (!S.geminiKey) S.geminiKey = '';
    if (!S.apiKeys) S.apiKeys = [];
    // Migrate old keys to new pool system
    migrateKeys();
    mc = S.chat.filter(m => m.role === 'user').length;
  }
}

// ── MULTI-CHAT FUNCTIONS (NEW) ──
function createNewChat(projectId) {
  // Save current chat if it has messages
  if (S.chat.length > 0) {
    saveChatToHistory();
  }
  // Create new chat
  const chat = {
    id: Date.now(),
    title: 'New Chat',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    projectId: projectId || null
  };
  S.chats.unshift(chat);
  S.activeChat = chat.id;
  S.chat = [];
  mc = 0;
  saveAll();
  return chat;
}

function saveChatToHistory() {
  if (S.chat.length === 0) return;
  // Generate title from first user message
  const firstMsg = S.chat.find(m => m.role === 'user');
  const title = firstMsg ? firstMsg.content.slice(0, 40) + (firstMsg.content.length > 40 ? '...' : '') : 'Chat';

  if (S.activeChat) {
    // Update existing chat
    const existing = S.chats.find(c => c.id === S.activeChat);
    if (existing) {
      existing.messages = [...S.chat];
      existing.title = title;
      existing.updatedAt = new Date().toISOString();
    }
  } else {
    // Save as new chat
    const chat = {
      id: Date.now(),
      title,
      messages: [...S.chat],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectId: S.activeProject || null
    };
    S.chats.unshift(chat);
    S.activeChat = chat.id;
  }
}

function loadChat(chatId) {
  // Save current chat first
  if (S.chat.length > 0) saveChatToHistory();
  // Load selected chat
  const chat = S.chats.find(c => c.id === chatId);
  if (chat) {
    S.chat = [...chat.messages];
    S.activeChat = chat.id;
    mc = S.chat.filter(m => m.role === 'user').length;
  }
}

function deleteChat(chatId) {
  S.chats = S.chats.filter(c => c.id !== chatId);
  if (S.activeChat === chatId) {
    S.chat = [];
    S.activeChat = null;
    mc = 0;
  }
  // Remove from projects
  S.projects.forEach(p => { p.chatIds = p.chatIds.filter(id => id !== chatId); });
  saveAll();
}

function getChatsByProject(projectId) {
  if (!projectId) return S.chats.filter(c => !c.projectId);
  return S.chats.filter(c => c.projectId === projectId);
}

// ── PROJECT FUNCTIONS (NEW) ──
function createProject(name, description) {
  const project = {
    id: Date.now(),
    name,
    description: description || '',
    chatIds: [],
    createdAt: new Date().toISOString()
  };
  S.projects.unshift(project);
  S.activeProject = project.id;
  saveAll();
  return project;
}

function deleteProject(projectId) {
  // Remove project but keep chats (move to general)
  S.chats.forEach(c => { if (c.projectId === projectId) c.projectId = null; });
  S.projects = S.projects.filter(p => p.id !== projectId);
  if (S.activeProject === projectId) S.activeProject = null;
  saveAll();
}

function switchProject(projectId) {
  if (S.chat.length > 0) saveChatToHistory();
  S.activeProject = projectId;
  S.chat = [];
  S.activeChat = null;
  mc = 0;
  saveAll();
}

// ── HELPERS ──
function INR(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }
function td() { return new Date().toISOString().slice(0, 10); }

function fmt(t) {
  if (!t) return '';
  return t.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre style="background:var(--bg);padding:14px;border-radius:8px;font-size:13px;margin:8px 0;border:1px solid var(--b1);font-family:IBM Plex Mono,monospace;overflow-x:auto;white-space:pre-wrap;line-height:1.6">$2</pre>')
    .replace(/`([^`]+)`/g, '<code style="background:var(--acBg);padding:2px 7px;border-radius:4px;font-size:13px;font-family:IBM Plex Mono,monospace;color:var(--ac)">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em style="color:var(--t2)">$1</em>')
    .replace(/^### (.+)$/gm, '<div style="font-size:14px;font-weight:700;color:var(--ac);margin:12px 0 4px">$1</div>')
    .replace(/^## (.+)$/gm, '<div style="font-size:16px;font-weight:700;margin:14px 0 6px">$1</div>')
    .replace(/^- (.+)$/gm, '<div style="padding-left:10px;margin:4px 0;color:var(--t2)">› $1</div>')
    .replace(/🔧 ✅/g, '<span style="background:var(--gBg);color:var(--g);padding:5px 12px;border-radius:6px;font-size:13px;font-weight:600;display:inline-block;margin:4px 0;border:1px solid var(--gBorder)">✅')
    .replace(/\n/g, '<br>');
}
