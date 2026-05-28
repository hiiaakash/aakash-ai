// ════════════════════════════════════════════════════════════
//  AAKASH AI v3 — Connect System (connect.js) — V2
//  Secret partner chat disguised as bot chat
//  Both sides see same bot, messages come as bot replies
//  Panic button, fake chats, add/delete bots
// ════════════════════════════════════════════════════════════

let _connectView = 'list'; // list | botChat | partnerChat
let _activeBotId = null;
let _partnerListener = null;
let _panicListener = null;
let _presenceInterval = null;

// ════════════════════════════════════
//  BOT SYSTEM PROMPTS
// ════════════════════════════════════

const BOT_PROMPTS = {
  career: `Tu ek experienced career mentor hai. User ko "aap" se address kar. Career guidance, resume tips, interview prep, salary negotiation — sab pe expert advice de.`,
  life: `Tu ek wise life coach hai. User ko "aap" se address kar. Motivation, mindset, life decisions, personal growth — sab pe deep advice de.`,
  study: `Tu ek expert teacher hai. User ko "aap" se address kar. Concepts simple Hinglish mein samjhao. Examples, step-by-step.`,
  business: `Tu ek business strategist hai. User ko "aap" se address kar. Business ideas, market analysis, execution plans — expert advice.`,
  fitness: `Tu ek fitness coach hai. User ko "aap" se address kar. Workout plans, diet (Indian context), personalized plan de.`
};

const BOT_EXPERTISES = {
  career: 'Career Mentor — career guidance, resume, interview prep',
  life: 'Life Coach — motivation, mindset, life decisions',
  study: 'Study Buddy — concepts, doubts, learning',
  business: 'Business Strategist — ideas, market, execution',
  fitness: 'Fitness Coach — workout, diet, health'
};

// ════════════════════════════════════
//  BOT NAME SUGGESTIONS
// ════════════════════════════════════

const BOT_NAME_POOL = [
  'Arjun','Kavya','Rehan','Priya','Dev','Anaya','Rohan','Meera',
  'Aditya','Ishaan','Zara','Vihaan','Kiara','Aarav','Diya',
  'Kabir','Riya','Vivaan','Naina','Shaurya','Tara','Rudra',
  'Saanvi','Yash','Anika','Karan','Myra','Aryan','Ira','Dhruv'
];

function _suggestBotName() {
  const used = (S.connect?.bots || []).map(b => b.name.toLowerCase());
  const avail = BOT_NAME_POOL.filter(n => !used.includes(n.toLowerCase()));
  return avail.length ? avail[Math.floor(Math.random() * avail.length)] : 'Bot-' + Math.random().toString(36).substr(2,3).toUpperCase();
}

// ════════════════════════════════════
//  OPEN CONNECT PAGE
// ════════════════════════════════════

window.openConnect = function() {
  _connectView = 'list';
  const ov = document.createElement('div');
  ov.id = 'connectPage';
  ov.style.cssText = 'position:fixed;inset:0;z-index:100;background:var(--bg);display:flex;flex-direction:column;animation:fadeIn .15s;max-width:480px;margin:0 auto';
  document.body.appendChild(ov);
  _renderConnect();
};

// ════════════════════════════════════
//  MAIN RENDER
// ════════════════════════════════════

function _renderConnect() {
  const pg = document.getElementById('connectPage');
  if (!pg) return;

  if (_connectView === 'list') _renderList(pg);
  else if (_connectView === 'botChat') _renderBotChat(pg);
  else if (_connectView === 'partnerChat') _renderPartnerChat(pg);
}

// ════════════════════════════════════
//  LIST VIEW — All Bots
// ════════════════════════════════════

function _renderList(pg) {
  const bots = S.connect?.bots || [];

  pg.innerHTML = `
  <div style="padding:12px 16px;border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:10px;background:var(--c1);flex-shrink:0">
    <button onclick="document.getElementById('connectPage').remove()" style="color:var(--t3)">${I.back}</button>
    <div style="font-size:16px;font-weight:600;flex:1">Connect</div>
    <button onclick="_showBotConnect()" style="width:32px;height:32px;border-radius:8px;background:var(--c2);border:1px solid var(--b1);display:flex;align-items:center;justify-content:center;color:var(--t3)" title="Bot Connect">${I.link||'🔗'}</button>
    <button onclick="_addNewBot()" style="width:32px;height:32px;border-radius:8px;background:var(--acBg);border:1px solid var(--acBorder);display:flex;align-items:center;justify-content:center;color:var(--ac)" title="Add Bot">+</button>
  </div>

  <div style="flex:1;overflow-y:auto;padding:12px">
    <div style="font-size:10px;font-weight:600;color:var(--t4);text-transform:uppercase;letter-spacing:.7px;margin-bottom:8px">AI Bots</div>
    <div style="display:flex;flex-direction:column;gap:6px">
    ${bots.map(b => {
      const isPartnerBot = S.connect?.partnerActive && S.connect?.partnerBotId === b.id;
      const connTime = isPartnerBot ? _getConnectedTimeText() : '';
      return `
      <div style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;background:var(--c1);border:1px solid var(--b1);cursor:pointer" onclick="_openBotChat(${b.id})">
        <div style="width:40px;height:40px;border-radius:12px;background:var(--grad);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:700">${b.name.charAt(0)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:600">${b.name}</div>
          <div style="font-size:11px;color:var(--t3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.expertise || BOT_EXPERTISES[b.role] || ''}</div>
          <div style="font-size:10px;color:var(--t4);margin-top:2px">${isPartnerBot ? connTime : (b.chatHistory?.length || 0) + ' messages'}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0">
          <button onclick="event.stopPropagation();_editBotName(${b.id})" style="padding:2px 8px;border-radius:4px;font-size:9px;background:var(--c2);border:1px solid var(--b1);color:var(--t3)">${I.edit}</button>
          <button onclick="event.stopPropagation();_deleteBot(${b.id})" style="padding:2px 8px;border-radius:4px;font-size:9px;background:var(--rBg);border:1px solid var(--rBorder);color:var(--r)">✕</button>
        </div>
      </div>`;
    }).join('')}
    ${bots.length === 0 ? '<div style="text-align:center;padding:40px 0;color:var(--t4);font-size:13px">No bots yet — tap + to add one</div>' : ''}
    </div>
  </div>`;
}

// ════════════════════════════════════
//  CONNECTED TIME TEXT
// ════════════════════════════════════

function _getConnectedTimeText() {
  const connAt = S.connect?._connectedAt;
  if (!connAt) return 'Bot connected';
  const diff = Math.floor((Date.now() - connAt) / 60000);
  if (diff < 1) return 'Bot connected just now';
  if (diff < 60) return `Bot connected ${diff} min ago`;
  if (diff < 1440) return `Bot connected ${Math.floor(diff/60)}h ago`;
  return `Bot connected ${Math.floor(diff/1440)}d ago`;
}

// ════════════════════════════════════
//  ADD / DELETE BOTS
// ════════════════════════════════════

window._addNewBot = function() {
  const roles = Object.keys(BOT_PROMPTS);
  const name = prompt('Bot ka naam:');
  if (!name?.trim()) return;

  // Pick a role
  const roleIdx = Math.floor(Math.random() * roles.length);
  const role = roles[roleIdx];

  if (!S.connect) S.connect = { bots:[], partnerCode:'', connectedPartner:'', partnerActive:false, partnerMessages:[], partnerBotId:null };
  S.connect.bots.push({
    id: Date.now(),
    name: name.trim(),
    role: role,
    expertise: BOT_EXPERTISES[role],
    chatHistory: []
  });
  saveAll();
  _renderConnect();
};

window._deleteBot = function(botId) {
  if (!S.connect?.bots) return;
  // Don't delete if it's an active partner bot
  if (S.connect.partnerActive && S.connect.partnerBotId === botId) {
    showToast('Active bot delete nahi ho sakta — pehle OFF karein');
    return;
  }
  if (!confirm('Delete this bot and all its chats?')) return;
  S.connect.bots = S.connect.bots.filter(b => b.id !== botId);
  if (S.connect.partnerBotId === botId) S.connect.partnerBotId = null;
  saveAll();
  _renderConnect();
};

window._editBotName = function(botId) {
  const bot = (S.connect?.bots || []).find(b => b.id === botId);
  if (!bot) return;
  const newName = prompt('Bot ka naam change karein:', bot.name);
  if (newName?.trim()) { bot.name = newName.trim(); saveAll(); _renderConnect(); }
};

// ════════════════════════════════════
//  OPEN BOT CHAT — Route to bot or partner
// ════════════════════════════════════

window._openBotChat = function(botId) {
  _activeBotId = botId;
  // If this is the partner bot AND partner is active → partner chat
  if (S.connect?.partnerActive && S.connect?.connectedPartner && S.connect?.partnerBotId === botId) {
    _connectView = 'partnerChat';
  } else {
    _connectView = 'botChat';
  }
  _renderConnect();
};

// ════════════════════════════════════
//  BOT CHAT (Normal AI Bot)
// ════════════════════════════════════

let _botChatLoading = false;

function _renderBotChat(pg) {
  const bot = (S.connect?.bots || []).find(b => b.id === _activeBotId);
  if (!bot) { _connectView = 'list'; _renderConnect(); return; }
  const msgs = bot.chatHistory || [];

  pg.innerHTML = `
  <div style="padding:10px 16px;border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:10px;background:var(--c1);flex-shrink:0">
    <button onclick="_connectView='list';_renderConnect()" style="color:var(--t3)">${I.back}</button>
    <div style="width:32px;height:32px;border-radius:10px;background:var(--grad);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700">${bot.name.charAt(0)}</div>
    <div style="flex:1"><div style="font-size:14px;font-weight:600">${bot.name}</div><div style="font-size:10px;color:var(--t4)">${bot.expertise || ''}</div></div>
    <button onclick="if(confirm('Clear chat?')){const b=(S.connect.bots||[]).find(x=>x.id===${bot.id});if(b)b.chatHistory=[];saveAll();_renderConnect()}" style="color:var(--t4)">${I.trash}</button>
  </div>

  <div id="botChatMsgs" style="flex:1;overflow-y:auto;padding:12px;background:var(--bg)">
  ${msgs.length === 0 ? `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;animation:fadeIn .3s">
    <div style="width:52px;height:52px;border-radius:16px;background:var(--grad);display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:700;margin-bottom:12px">${bot.name.charAt(0)}</div>
    <div style="font-size:16px;font-weight:600">${bot.name}</div>
    <div style="font-size:12px;color:var(--t3);text-align:center;max-width:240px;margin-top:6px;line-height:1.5">${bot.expertise || ''}</div>
  </div>` :
  msgs.map(m => `<div style="display:flex;justify-content:${m.role==='user'?'flex-end':'flex-start'};margin-bottom:8px">
    ${m.role==='assistant'?`<div style="width:24px;height:24px;border-radius:8px;background:var(--grad);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;margin-right:6px;margin-top:2px;flex-shrink:0">${bot.name.charAt(0)}</div>`:''}
    <div style="max-width:80%;padding:10px 14px;border-radius:${m.role==='user'?'16px 16px 4px 16px':'4px 16px 16px 16px'};background:${m.role==='user'?'var(--grad)':'var(--c1)'};border:${m.role==='user'?'none':'1px solid var(--b1)'};font-size:13px;line-height:1.7;color:${m.role==='user'?'#fff':'var(--t1)'}">${m.role==='user'?m.content.replace(/</g,'&lt;'):fmt(m.content)}</div>
  </div>`).join('') +
  (_botChatLoading ? `<div style="display:flex;align-items:center;gap:6px;padding:4px"><div style="width:24px;height:24px;border-radius:8px;background:var(--grad);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;margin-right:2px">${bot.name.charAt(0)}</div><div style="display:flex;gap:4px">${[0,1,2].map(i=>`<div style="width:5px;height:5px;border-radius:50%;background:var(--ac);animation:dot 1s ${i*.2}s infinite"></div>`).join('')}<span style="font-size:10px;color:var(--t3);margin-left:4px">Bot is thinking...</span></div></div>` : '')}
  </div>

  <div style="flex-shrink:0;padding:8px 12px 12px;border-top:1px solid var(--b1);background:var(--c1)">
    <div style="display:flex;gap:6px;align-items:end">
      <textarea id="botChatInput" class="inp" placeholder="Message ${bot.name}..." rows="1" style="flex:1;resize:none;min-height:36px;max-height:72px;border-radius:10px;padding:8px 12px;font-size:13px" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();_sendBotMsg()}" oninput="this.style.height='36px';this.style.height=Math.min(this.scrollHeight,72)+'px'"></textarea>
      <button onclick="_sendBotMsg()" style="width:36px;height:36px;border-radius:10px;background:var(--grad);border:none;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0">${I.send}</button>
    </div>
  </div>`;

  const cm = document.getElementById('botChatMsgs');
  if (cm) cm.scrollTop = cm.scrollHeight;
}

window._sendBotMsg = async function() {
  const bot = (S.connect?.bots || []).find(b => b.id === _activeBotId);
  if (!bot || _botChatLoading) return;
  const inp = document.getElementById('botChatInput');
  const text = inp?.value?.trim();
  if (!text) return;
  if (inp) inp.value = '';

  if (!bot.chatHistory) bot.chatHistory = [];
  bot.chatHistory.push({ role: 'user', content: text });
  _botChatLoading = true;
  _renderConnect();

  const sysPrompt = BOT_PROMPTS[bot.role] || BOT_PROMPTS.life;
  const apiMsgs = bot.chatHistory.slice(-20).map(m => ({ role: m.role, content: m.content }));
  const reply = await ai(apiMsgs, SOUL + '\n\n' + sysPrompt + `\n\nTu ${bot.name} hai. Apne naam se hi baat kar.`);
  bot.chatHistory.push({ role: 'assistant', content: reply });
  _botChatLoading = false;
  await saveAll();
  _renderConnect();
};

// ════════════════════════════════════
//  PARTNER CHAT (Disguised as Bot Chat)
//  - Messages show as bot replies
//  - Typing indicator, seen ticks, online dot
//  - ON/OFF toggle + Panic button in header
// ════════════════════════════════════

function _renderPartnerChat(pg) {
  const bot = (S.connect?.bots || []).find(b => b.id === _activeBotId);
  if (!bot) { _connectView = 'list'; _renderConnect(); return; }

  const msgs = S.connect?.partnerMessages || [];
  const connTime = _getConnectedTimeText();

  pg.innerHTML = `
  <div style="padding:10px 16px;border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:10px;background:var(--c1);flex-shrink:0">
    <button onclick="_connectView='list';_stopListeners();_renderConnect()" style="color:var(--t3)">${I.back}</button>
    <div style="width:32px;height:32px;border-radius:10px;background:var(--grad);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700">${bot.name.charAt(0)}</div>
    <div style="flex:1">
      <div style="font-size:14px;font-weight:600">${bot.name}</div>
      <div style="font-size:10px;color:var(--t4)">${connTime}</div>
    </div>
    <button onclick="_togglePartnerFromChat()" style="padding:4px 10px;border-radius:6px;font-size:10px;font-weight:600;background:var(--gBg);color:var(--g);border:1px solid var(--gBorder)">ON</button>
    <button onclick="_panicButton()" style="width:32px;height:32px;border-radius:8px;background:var(--rBg);border:1px solid var(--rBorder);display:flex;align-items:center;justify-content:center;color:var(--r);font-size:14px" title="Emergency">⚡</button>
  </div>

  <div id="partnerChatMsgs" style="flex:1;overflow-y:auto;padding:12px;background:var(--bg)">
  ${msgs.length === 0 ? `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;animation:fadeIn .3s">
    <div style="width:52px;height:52px;border-radius:16px;background:var(--grad);display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:700;margin-bottom:12px">${bot.name.charAt(0)}</div>
    <div style="font-size:16px;font-weight:600">${bot.name}</div>
    <div style="font-size:12px;color:var(--t3);text-align:center;max-width:240px;margin-top:6px;line-height:1.5">${connTime}</div>
  </div>` :
  msgs.map(m => {
    const isMe = m.from === 'me';
    return `<div style="display:flex;justify-content:${isMe?'flex-end':'flex-start'};margin-bottom:8px">
    ${!isMe?`<div style="width:24px;height:24px;border-radius:8px;background:var(--grad);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;margin-right:6px;margin-top:2px;flex-shrink:0">${bot.name.charAt(0)}</div>`:''}
    <div style="max-width:80%">
      <div style="padding:10px 14px;border-radius:${isMe?'16px 16px 4px 16px':'4px 16px 16px 16px'};background:${isMe?'var(--grad)':'var(--c1)'};border:${isMe?'none':'1px solid var(--b1)'};font-size:13px;line-height:1.7;color:${isMe?'#fff':'var(--t1)'}">${(m.content||'').replace(/</g,'&lt;')}</div>
      <div style="font-size:9px;color:var(--t4);margin-top:2px;text-align:${isMe?'right':'left'}">${m.time || ''}</div>
    </div>
  </div>`;}).join('')}
  </div>

  <div style="flex-shrink:0;padding:8px 12px 12px;border-top:1px solid var(--b1);background:var(--c1)">
    <div style="display:flex;gap:6px;align-items:end">
      <textarea id="partnerChatInput" class="inp" placeholder="Message..." rows="1" style="flex:1;resize:none;min-height:36px;max-height:72px;border-radius:10px;padding:8px 12px;font-size:13px" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();_sendPartnerMsg()}" oninput="this.style.height='36px';this.style.height=Math.min(this.scrollHeight,72)+'px'"></textarea>
      <button onclick="_sendPartnerMsg()" style="width:36px;height:36px;border-radius:10px;background:var(--grad);border:none;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0">${I.send}</button>
    </div>
  </div>`;

  // Start listening
  _startPartnerListener();
  _startPanicListener();

  const cm = document.getElementById('partnerChatMsgs');
  if (cm) cm.scrollTop = cm.scrollHeight;
}

// ════════════════════════════════════
//  PARTNER MESSAGING — Firebase Real-time
// ════════════════════════════════════

window._sendPartnerMsg = async function() {
  const inp = document.getElementById('partnerChatInput');
  const text = inp?.value?.trim();
  if (!text || !S.connect?.connectedPartner) return;
  if (inp) inp.value = '';

  const msg = {
    from: 'me',
    content: text,
    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  };

  if (!S.connect.partnerMessages) S.connect.partnerMessages = [];
  S.connect.partnerMessages.push(msg);
  _renderConnect();

  // Send via Firebase
  if (typeof FIRE !== 'undefined' && FIRE.ready) {
    await FIRE.sendPartnerMessage(S.connect.connectedPartner, text);
  }
  await saveAll();
};

function _startPartnerListener() {
  if (_partnerListener || !S.connect?.connectedPartner) return;
  if (typeof FIRE === 'undefined' || !FIRE.ready) return;

  _partnerListener = FIRE.listenPartnerMessages(S.connect.connectedPartner, (msgs) => {
    if (!S.connect) return;
    const myId = FIRE.userId;
    S.connect.partnerMessages = msgs.map(m => ({
      from: m.from === myId ? 'me' : 'partner',
      content: m.content,
      time: m.timestamp ? new Date(m.timestamp.toDate()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''
    }));
    saveAll();
    if (_connectView === 'partnerChat') {
      const cm = document.getElementById('partnerChatMsgs');
      const wasAtBottom = cm ? (cm.scrollHeight - cm.scrollTop - cm.clientHeight < 50) : true;
      _renderConnect();
      if (wasAtBottom) {
        const cm2 = document.getElementById('partnerChatMsgs');
        if (cm2) cm2.scrollTop = cm2.scrollHeight;
      }
    }
  });
}

function _startPanicListener() {
  if (_panicListener || !S.connect?.connectedPartner) return;
  if (typeof FIRE === 'undefined' || !FIRE.ready) return;

  _panicListener = FIRE.listenPanicSignal(S.connect.connectedPartner, async () => {
    await _executeWipeAndFake();
    _connectView = 'botChat';
    _renderConnect();
    showToast('Switched to AI mode');
  });
}

function _stopListeners() {
  if (_partnerListener) { if (typeof _partnerListener === 'function') _partnerListener(); _partnerListener = null; }
  if (_panicListener) { if (typeof _panicListener === 'function') _panicListener(); _panicListener = null; }
}

// ════════════════════════════════════
//  BOT CONNECT DIALOG
// ════════════════════════════════════

window._showBotConnect = function() {
  const existing = document.getElementById('partnerModal');
  if (existing) { existing.remove(); return; }

  const modal = document.createElement('div');
  modal.id = 'partnerModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;background:var(--overlay)';
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

  const code = S.connect?.partnerCode || '';
  const suggested = _suggestBotName();

  modal.innerHTML = `<div style="background:var(--c1);border-radius:16px;padding:20px;width:90%;max-width:320px;border:1px solid var(--b1);box-shadow:var(--shadowLg)" onclick="event.stopPropagation()">
    <div style="font-size:16px;font-weight:600;margin-bottom:14px">Bot Connect</div>

    <!-- Row 1: Your Bot Code -->
    <div style="margin-bottom:14px">
      <div style="font-size:11px;color:var(--t4);margin-bottom:4px">Your Bot Code</div>
      <div style="display:flex;gap:6px;align-items:center">
        <div style="flex:1;padding:10px;background:var(--bg);border-radius:8px;font-size:16px;font-weight:700;font-family:monospace;text-align:center;letter-spacing:2px;color:var(--ac)">${code || '---'}</div>
        ${code ? `<button onclick="navigator.clipboard.writeText('${code}');showToast('Code copied!')" style="padding:8px;border-radius:8px;background:var(--c2);border:1px solid var(--b1);color:var(--t3)">${I.copy}</button>` : ''}
      </div>
      ${!code ? `<button onclick="_generateCode()" style="margin-top:6px;width:100%;padding:8px;border-radius:8px;background:var(--grad);color:#fff;border:none;font-size:12px;font-weight:500">Generate Code</button>` : ''}
    </div>

    <!-- Row 2: Enter Bot Code -->
    <div style="margin-bottom:14px">
      <div style="font-size:11px;color:var(--t4);margin-bottom:4px">Enter Bot Code</div>
      <div style="display:flex;gap:6px">
        <input id="partnerCodeInput" class="inp" placeholder="AK-XXXX" style="flex:1;font-size:14px;text-align:center;font-family:monospace;letter-spacing:1px" maxlength="10">
        <button onclick="_connectPartner()" style="padding:8px 16px;border-radius:8px;background:var(--grad);color:#fff;border:none;font-size:12px;font-weight:500">Connect</button>
      </div>
    </div>

    <!-- Row 3: Suggest Bot Name -->
    <div style="margin-bottom:14px">
      <div style="font-size:11px;color:var(--t4);margin-bottom:4px">Suggest a Bot Name</div>
      <div style="display:flex;gap:6px;align-items:center">
        <div id="suggestedBotName" style="flex:1;padding:10px;background:var(--bg);border-radius:8px;font-size:14px;font-weight:600;text-align:center;color:var(--t1)">${suggested}</div>
        <button onclick="document.getElementById('suggestedBotName').textContent=_suggestBotName()" style="padding:8px;border-radius:8px;background:var(--c2);border:1px solid var(--b1);color:var(--t3);font-size:11px">🔄</button>
      </div>
    </div>

    <!-- Row 4: ON/OFF Toggle -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;background:var(--bg);border-radius:8px;margin-bottom:12px">
      <div><div style="font-size:12px;font-weight:500">Bot Active</div><div style="font-size:10px;color:var(--t4)">OFF = chats delete + AI chats</div></div>
      <button onclick="_togglePartnerFromModal()" style="padding:4px 12px;border-radius:6px;font-size:11px;font-weight:600;background:${S.connect?.partnerActive?'var(--gBg)':'var(--rBg)'};color:${S.connect?.partnerActive?'var(--g)':'var(--r)'};border:1px solid ${S.connect?.partnerActive?'var(--gBorder)':'var(--rBorder)'}">${S.connect?.partnerActive?'ON':'OFF'}</button>
    </div>

    <button onclick="document.getElementById('partnerModal').remove()" style="width:100%;padding:8px;border-radius:8px;background:var(--c2);border:1px solid var(--b1);color:var(--t3);font-size:12px">Close</button>
  </div>`;

  document.body.appendChild(modal);
};

// ════════════════════════════════════
//  CONNECT / DISCONNECT / GENERATE
// ════════════════════════════════════

window._generateCode = async function() {
  let code;
  if (typeof FIRE !== 'undefined' && FIRE.ready) {
    code = await FIRE.generateConnectCode();
  }
  if (!code) code = 'AK-' + Math.random().toString(36).substr(2, 4).toUpperCase();

  if (!S.connect) S.connect = { bots:[], partnerCode:'', connectedPartner:'', partnerActive:false, partnerMessages:[], partnerBotId:null };
  S.connect.partnerCode = code;
  await saveAll();
  document.getElementById('partnerModal')?.remove();
  _showBotConnect();
};

window._connectPartner = async function() {
  const code = document.getElementById('partnerCodeInput')?.value?.trim();
  if (!code) { showToast('Code dalein'); return; }

  // Verify code exists in Firebase
  if (typeof FIRE !== 'undefined' && FIRE.ready) {
    const result = await FIRE.verifyConnectCode(code);
    if (!result) { showToast('Invalid code'); return; }
  }

  // Get bot name from suggestion
  const botName = document.getElementById('suggestedBotName')?.textContent || _suggestBotName();

  if (!S.connect) S.connect = { bots:[], partnerCode:'', connectedPartner:'', partnerActive:false, partnerMessages:[], partnerBotId:null };

  // Create a new bot for this partner connection
  const newBotId = Date.now();
  S.connect.bots.push({
    id: newBotId,
    name: botName,
    role: 'life',
    expertise: BOT_EXPERTISES.life,
    chatHistory: []
  });

  S.connect.connectedPartner = code;
  S.connect.partnerBotId = newBotId;
  S.connect.partnerActive = true;
  S.connect.partnerMessages = [];
  S.connect._connectedAt = Date.now();

  await saveAll();
  showToast('Bot connected!');
  document.getElementById('partnerModal')?.remove();
  _renderConnect();

  // Start background listeners
  _startPanicListener();
};

// ════════════════════════════════════
//  TOGGLE ON/OFF
// ════════════════════════════════════

window._togglePartnerFromModal = async function() {
  if (!S.connect) return;
  if (S.connect.partnerActive) {
    await _executeWipeAndFake();
  } else {
    S.connect.partnerActive = true;
    S.connect.partnerMessages = [];
  }
  await saveAll();
  document.getElementById('partnerModal')?.remove();
  _showBotConnect();
  _renderConnect();
};

window._togglePartnerFromChat = async function() {
  if (!S.connect) return;
  if (S.connect.partnerActive) {
    await _executeWipeAndFake();
    _connectView = 'botChat';
  } else {
    S.connect.partnerActive = true;
    S.connect.partnerMessages = [];
    _connectView = 'partnerChat';
  }
  await saveAll();
  _renderConnect();
};

// ════════════════════════════════════
//  PANIC BUTTON — Emergency Exit
//  One tap → both sides wipe → fake chats → no dialog
// ════════════════════════════════════

window._panicButton = async function() {
  // 1. Signal partner
  if (typeof FIRE !== 'undefined' && FIRE.ready && S.connect?.connectedPartner) {
    try { await FIRE.sendPanicSignal(S.connect.connectedPartner); } catch(e) {}
  }
  // 2. Local wipe
  await _executeWipeAndFake();
  // 3. Switch view
  _connectView = 'botChat';
  _renderConnect();
  showToast('Switched to AI mode');
};

// ════════════════════════════════════
//  WIPE + FAKE — Core privacy function
// ════════════════════════════════════

async function _executeWipeAndFake() {
  if (!S.connect) return;
  _stopListeners();

  // Delete from Firebase
  if (typeof FIRE !== 'undefined' && FIRE.ready && S.connect.connectedPartner) {
    await FIRE.deletePartnerChat(S.connect.connectedPartner);
  }

  // Clear local partner messages
  S.connect.partnerMessages = [];
  S.connect.partnerActive = false;

  // Generate fake AI chats for ALL bots
  _generateFakeChats();
  await saveAll();
}

// ════════════════════════════════════
//  FAKE CHAT GENERATION
//  Realistic, topic-specific, bot-style
// ════════════════════════════════════

function _generateFakeChats() {
  const fakeData = {
    career: [
      { role:'user', content:'Resume mein kya improve karun?' },
      { role:'assistant', content:'Aapke resume mein 3 cheezein add karein:\n1. Quantifiable achievements — "sales 30% badhaya" jaisa\n2. Skills section mein relevant keywords\n3. Projects section mein 2-3 best projects with impact\n\nEk page se zyada mat rakhein!' },
      { role:'user', content:'Interview ke liye tips?' },
      { role:'assistant', content:'Interview tips:\n\n1. STAR method use karein (Situation, Task, Action, Result)\n2. Company research zarur karein\n3. "Tell me about yourself" ka 2-min answer ready rakhein\n4. Questions zarur puchein\n5. Body language — eye contact, smile, firm handshake' },
      { role:'user', content:'LinkedIn profile optimize kaise karu?' },
      { role:'assistant', content:'LinkedIn optimization:\n\n1. Headline mein value proposition likhein, sirf designation nahi\n2. About mein story likhein\n3. Top 5 skills pin karein\n4. 3-4 recommendations maangein\n5. Weekly ek post daalein domain se related' }
    ],
    life: [
      { role:'user', content:'Motivation kaise maintain karun?' },
      { role:'assistant', content:'Motivation temporary hai, discipline permanent. Tips:\n\n1. Small wins roz celebrate karein\n2. Vision board banayein\n3. Environment design karein — distractions hatao\n4. Accountability partner rakhein\n5. "2-minute rule" — sirf 2 min start karo' },
      { role:'user', content:'Time management kaise improve karu?' },
      { role:'assistant', content:'Time management methods:\n\n1. Eisenhower Matrix — urgent vs important\n2. Time blocking — har kaam ka specific time\n3. Pomodoro — 25 min focus, 5 min break\n4. "Eat the frog" — mushkil kaam pehle\n5. Phone notifications band karein focus time mein' }
    ],
    study: [
      { role:'user', content:'Focus kaise improve karun padhai mein?' },
      { role:'assistant', content:'Pomodoro technique — 25 min focus, 5 min break. Scientifically proven hai.\n\n1. Phone doosre room mein rakhein\n2. Dedicated study space banayein\n3. Active recall use karein\n4. Spaced repetition — aaj padha, kal revise, 3rd din phir' },
      { role:'user', content:'Notes kaise banau?' },
      { role:'assistant', content:'Cornell Method try karein:\n\n1. Page ko 3 parts mein divide karein\n2. Right side mein class notes\n3. Left side mein key words/questions\n4. Bottom mein 2-3 line summary\n5. Color coding — important=red, examples=blue' }
    ],
    business: [
      { role:'user', content:'Side business kaise start karun?' },
      { role:'assistant', content:'Step-by-step:\n\n1. Skills audit — kya accha karte hain?\n2. Market need dhundhein\n3. MVP banayein\n4. Pehle 10 customers manually acquire karein\n5. Feedback, improve, scale\n\n₹0 se start — freelancing, consulting, content.' },
      { role:'user', content:'Marketing budget kam hai' },
      { role:'assistant', content:'Low budget marketing:\n\n1. Content marketing — organic reach\n2. WhatsApp Business broadcasts\n3. Referral program\n4. Local partnerships\n5. Google My Business — free listing' }
    ],
    fitness: [
      { role:'user', content:'Weight loss ke liye kya karun?' },
      { role:'assistant', content:'Formula: Calorie deficit + Consistency.\n\n1. Calories track karein\n2. Protein badhayein — 1.5g/kg\n3. Roz 30 min walk\n4. Sugar/processed food kam\n5. Sleep 7-8 hours\n\nCrash diet mat karein!' },
      { role:'user', content:'Home workout plan' },
      { role:'assistant', content:'No equipment plan:\n\nDay 1 Upper: Push-ups 3x12, Dips 3x10, Plank 3x30s\nDay 2 Lower: Squats 3x15, Lunges 3x12, Calf raises 3x20\nDay 3 Cardio: Jumping jacks 3x30, Burpees 3x10\nDay 4: Rest. Repeat!' }
    ]
  };

  (S.connect?.bots || []).forEach(bot => {
    const fakes = fakeData[bot.role] || fakeData.life;
    bot.chatHistory = JSON.parse(JSON.stringify(fakes));
  });
}

// ════════════════════════════════════
//  BACKGROUND INIT — Start listeners on app load
// ════════════════════════════════════

setTimeout(() => {
  if (S.connect?.partnerActive && S.connect?.connectedPartner) {
    _startPartnerListener();
    _startPanicListener();
  }
}, 2000);

// ════════════════════════════════════
//  SECTION CHAT RENDERERS (unchanged)
// ════════════════════════════════════

window.renderSecChat_voice = function() { const w = document.getElementById('voiceChatWrap'); if(w) _renderSectionChat('voice', w); };
window.renderSecChat_gym = function() { const w = document.getElementById('gymChatWrap'); if(w) _renderSectionChat('gym', w); };
window.renderSecChat_debate = function() { const w = document.getElementById('debateChatWrap'); if(w) _renderSectionChat('debate', w); };
window.renderSecChat_face = function() { const w = document.getElementById('faceChatWrap'); if(w) _renderSectionChat('face', w); };
window.renderSecChat_medical = function() { const w = document.getElementById('medicalChatWrap'); if(w) _renderSectionChat('medical', w); };
