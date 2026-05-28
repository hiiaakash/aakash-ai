// ════════════════════════════════════════════════════════════
//  AAKASH AI v3 — Connect System (connect.js)
//  MODIFIED: Bot Connect (not Partner Connect)
//  Secret chat disguised as bot chat
//  Panic button (both sides), fake chats, dual experience
// ════════════════════════════════════════════════════════════

let _connectView = 'list'; // list | botChat | partnerChat
let _activeBotId = null;
let _partnerListener = null;
let _partnerTyping = false;

// ════════════════════════════════════
//  BOT SYSTEM PROMPTS
// ════════════════════════════════════

const BOT_PROMPTS = {
  career: `Tu ek experienced career mentor hai. User ko "aap" se address kar.
Career guidance, resume tips, interview prep, job search strategy, salary negotiation — sab pe expert advice de.
Real examples aur actionable steps de. User ki current skills aur goals ke hisaab se personalized advice de.`,
  life: `Tu ek wise life coach hai. User ko "aap" se address kar.
Motivation, mindset, life decisions, relationships, personal growth — sab pe deep, thoughtful advice de.
Philosophical jab zarurat ho, practical hamesha. User ko think karne pe majboor kar.`,
  study: `Tu ek expert teacher/study buddy hai. User ko "aap" se address kar.
Koi bhi concept simple Hinglish mein samjhao. Examples, analogies, step-by-step explanations.
Doubts puchho, quiz do, weak areas identify karo.`,
  business: `Tu ek successful business strategist hai. User ko "aap" se address kar.
Business ideas, market analysis, execution plans, revenue models, competitor analysis — sab pe expert advice.
Numbers aur data ke saath baat kar. Realistic timelines aur milestones de.`,
  fitness: `Tu ek certified fitness coach hai. User ko "aap" se address kar.
Workout plans, exercise form, diet (Indian context), supplements, injury prevention.
User ke goals (weight loss/gain/stamina) ke hisaab se personalized plan de.`
};

// ════════════════════════════════════
//  BOT NAME SUGGESTIONS
// ════════════════════════════════════

const BOT_NAME_SUGGESTIONS = [
  'Arjun', 'Kavya', 'Rehan', 'Priya', 'Dev', 'Anaya', 'Rohan', 'Meera',
  'Aditya', 'Ishaan', 'Zara', 'Vihaan', 'Kiara', 'Aarav', 'Diya',
  'Kabir', 'Riya', 'Vivaan', 'Naina', 'Shaurya', 'Tara', 'Rudra'
];

function _suggestBotName() {
  const usedNames = (S.connect?.bots || []).map(b => b.name.toLowerCase());
  const available = BOT_NAME_SUGGESTIONS.filter(n => !usedNames.includes(n.toLowerCase()));
  if (available.length === 0) return 'Bot-' + Math.random().toString(36).substr(2, 4);
  return available[Math.floor(Math.random() * available.length)];
}

// ════════════════════════════════════
//  RENDER CONNECT SECTION
// ════════════════════════════════════

window.openConnect = function() {
  _connectView = 'list';
  const ov = document.createElement('div');
  ov.id = 'connectPage';
  ov.style.cssText = 'position:fixed;inset:0;z-index:100;background:var(--bg);display:flex;flex-direction:column;animation:fadeIn .15s;max-width:480px;margin:0 auto';
  document.body.appendChild(ov);
  _renderConnect();
};

function _renderConnect() {
  const pg = document.getElementById('connectPage');
  if (!pg) return;

  if (_connectView === 'list') {
    const bots = S.connect?.bots || [];
    const partnerActive = S.connect?.partnerActive || false;

    pg.innerHTML = `
    <div style="padding:12px 16px;border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:10px;background:var(--c1);flex-shrink:0">
      <button onclick="document.getElementById('connectPage').remove()" style="color:var(--t3)">${I.back}</button>
      <div style="font-size:16px;font-weight:600;flex:1">Connect</div>
      <!-- Bot Connect Button (was Partner Connect) -->
      <button onclick="_showBotConnect()" style="width:32px;height:32px;border-radius:8px;background:${partnerActive?'var(--gBg)':'var(--c2)'};border:1px solid ${partnerActive?'var(--gBorder)':'var(--b1)'};display:flex;align-items:center;justify-content:center;color:${partnerActive?'var(--g)':'var(--t3)'}" title="Bot Connect">${I.link||'🔗'}</button>
    </div>

    <div style="flex:1;overflow-y:auto;padding:12px">
      <!-- Bot List -->
      <div style="font-size:10px;font-weight:600;color:var(--t4);text-transform:uppercase;letter-spacing:.7px;margin-bottom:8px">AI Bots</div>
      <div style="display:flex;flex-direction:column;gap:6px">
      ${bots.map(b => `
        <div style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;background:var(--c1);border:1px solid var(--b1);cursor:pointer" onclick="_openBotChat(${b.id})">
          <div style="width:40px;height:40px;border-radius:12px;background:var(--grad);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:700">${b.name.charAt(0)}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:14px;font-weight:600">${b.name}</div>
            <div style="font-size:11px;color:var(--t3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.expertise}</div>
            <div style="font-size:10px;color:var(--t4);margin-top:2px">${b.chatHistory?.length || 0} messages</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0">
            <button onclick="event.stopPropagation();_editBotName(${b.id})" style="padding:2px 8px;border-radius:4px;font-size:9px;background:var(--c2);border:1px solid var(--b1);color:var(--t3)">${I.edit}</button>
          </div>
        </div>`).join('')}
      </div>
    </div>`;

  } else if (_connectView === 'botChat') {
    _renderBotChat(pg);
  } else if (_connectView === 'partnerChat') {
    _renderPartnerChat(pg);
  }
}

// ════════════════════════════════════
//  BOT CHAT (AI Chat — normal bots)
// ════════════════════════════════════

let _botChatLoading = false;

window._openBotChat = function(botId) {
  _activeBotId = botId;
  const bot = (S.connect?.bots || []).find(b => b.id === botId);
  // If this bot has a connected partner AND partner is active, open partner chat view
  if (bot && S.connect?.partnerActive && S.connect?.connectedPartner && bot.id === S.connect?.partnerBotId) {
    _connectView = 'partnerChat';
  } else {
    _connectView = 'botChat';
  }
  _renderConnect();
};

function _renderBotChat(pg) {
  const bot = (S.connect?.bots || []).find(b => b.id === _activeBotId);
  if (!bot) { _connectView = 'list'; _renderConnect(); return; }

  const msgs = bot.chatHistory || [];

  pg.innerHTML = `
  <div style="padding:10px 16px;border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:10px;background:var(--c1);flex-shrink:0">
    <button onclick="_connectView='list';_renderConnect()" style="color:var(--t3)">${I.back}</button>
    <div style="width:32px;height:32px;border-radius:10px;background:var(--grad);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700">${bot.name.charAt(0)}</div>
    <div style="flex:1"><div style="font-size:14px;font-weight:600">${bot.name}</div><div style="font-size:10px;color:var(--t4)">${bot.expertise}</div></div>
    <button onclick="if(confirm('Clear chat?')){const b=(S.connect.bots||[]).find(x=>x.id===${bot.id});if(b)b.chatHistory=[];saveAll();_renderConnect()}" style="color:var(--t4)">${I.trash}</button>
  </div>

  <div id="botChatMsgs" style="flex:1;overflow-y:auto;padding:12px;background:var(--bg)">
  ${msgs.length === 0 ? `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;animation:fadeIn .3s">
    <div style="width:52px;height:52px;border-radius:16px;background:var(--grad);display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:700;margin-bottom:12px">${bot.name.charAt(0)}</div>
    <div style="font-size:16px;font-weight:600">${bot.name}</div>
    <div style="font-size:12px;color:var(--t3);text-align:center;max-width:240px;margin-top:6px;line-height:1.5">${bot.expertise}</div>
  </div>` :
  msgs.map((m, i) => `<div style="display:flex;justify-content:${m.role==='user'?'flex-end':'flex-start'};margin-bottom:8px">
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
//  PARTNER CHAT VIEW (Looks like bot chat from outside)
//  Partner gets full human experience:
//  emoji, voice, typing, online/offline, seen
//  Outside viewer sees: bot name, bot style
// ════════════════════════════════════

function _renderPartnerChat(pg) {
  const bot = (S.connect?.bots || []).find(b => b.id === _activeBotId);
  if (!bot) { _connectView = 'list'; _renderConnect(); return; }

  const msgs = S.connect?.partnerMessages || [];
  const partnerOnline = S.connect?._partnerOnline || false;

  pg.innerHTML = `
  <div style="padding:10px 16px;border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:10px;background:var(--c1);flex-shrink:0">
    <button onclick="_connectView='list';_stopPartnerListener();_renderConnect()" style="color:var(--t3)">${I.back}</button>
    <div style="position:relative">
      <div style="width:32px;height:32px;border-radius:10px;background:var(--grad);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700">${bot.name.charAt(0)}</div>
      <!-- Online/Offline dot — only visible to partner (inside chat) -->
      <div style="position:absolute;bottom:-1px;right:-1px;width:10px;height:10px;border-radius:50%;background:${partnerOnline?'#22c55e':'#3b82f6'};border:2px solid var(--c1)"></div>
    </div>
    <div style="flex:1">
      <div style="font-size:14px;font-weight:600">${bot.name}</div>
      <div style="font-size:10px;color:${partnerOnline?'var(--g)':'var(--t4)'}">${partnerOnline?'Online':'Last seen recently'}</div>
    </div>
    <!-- ON/OFF Toggle -->
    <button onclick="_togglePartnerFromChat()" style="padding:4px 10px;border-radius:6px;font-size:10px;font-weight:600;background:${S.connect?.partnerActive?'var(--gBg)':'var(--rBg)'};color:${S.connect?.partnerActive?'var(--g)':'var(--r)'};border:1px solid ${S.connect?.partnerActive?'var(--gBorder)':'var(--rBorder)'}">${S.connect?.partnerActive?'ON':'OFF'}</button>
    <!-- PANIC BUTTON — instant wipe both sides -->
    <button onclick="_panicButton()" style="width:32px;height:32px;border-radius:8px;background:var(--rBg);border:1px solid var(--rBorder);display:flex;align-items:center;justify-content:center;color:var(--r);font-size:14px" title="Emergency Exit">⚡</button>
  </div>

  <div id="partnerChatMsgs" style="flex:1;overflow-y:auto;padding:12px;background:var(--bg)">
  ${msgs.length === 0 ? `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;animation:fadeIn .3s">
    <div style="width:52px;height:52px;border-radius:16px;background:var(--grad);display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:700;margin-bottom:12px">${bot.name.charAt(0)}</div>
    <div style="font-size:16px;font-weight:600">${bot.name}</div>
    <div style="font-size:12px;color:var(--t3);text-align:center;max-width:240px;margin-top:6px;line-height:1.5">Connected — start chatting</div>
  </div>` :
  msgs.map((m, i) => {
    const isMe = m.from === 'me';
    return `<div style="display:flex;justify-content:${isMe?'flex-end':'flex-start'};margin-bottom:8px">
    ${!isMe?`<div style="width:24px;height:24px;border-radius:8px;background:var(--grad);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;margin-right:6px;margin-top:2px;flex-shrink:0">${bot.name.charAt(0)}</div>`:''}
    <div style="max-width:80%">
      <div style="padding:10px 14px;border-radius:${isMe?'16px 16px 4px 16px':'4px 16px 16px 16px'};background:${isMe?'var(--grad)':'var(--c1)'};border:${isMe?'none':'1px solid var(--b1)'};font-size:13px;line-height:1.7;color:${isMe?'#fff':'var(--t1)'}">${m.content.replace(/</g,'&lt;')}</div>
      <div style="font-size:9px;color:var(--t4);margin-top:2px;text-align:${isMe?'right':'left'}">${m.time || ''}${isMe && m.seen ? ' ✓✓' : isMe ? ' ✓' : ''}</div>
    </div>
  </div>`;}).join('') +
  (_partnerTyping ? `<div style="display:flex;align-items:center;gap:6px;padding:4px"><div style="width:24px;height:24px;border-radius:8px;background:var(--grad);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;margin-right:2px">${bot.name.charAt(0)}</div><div style="display:flex;gap:4px">${[0,1,2].map(i=>`<div style="width:5px;height:5px;border-radius:50%;background:var(--ac);animation:dot 1s ${i*.2}s infinite"></div>`).join('')}<span style="font-size:10px;color:var(--t3);margin-left:4px">typing...</span></div></div>` : '')}
  </div>

  <div style="flex-shrink:0;padding:8px 12px 12px;border-top:1px solid var(--b1);background:var(--c1)">
    <div style="display:flex;gap:6px;align-items:end">
      <textarea id="partnerChatInput" class="inp" placeholder="Message..." rows="1" style="flex:1;resize:none;min-height:36px;max-height:72px;border-radius:10px;padding:8px 12px;font-size:13px" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();_sendPartnerMsg()}" oninput="this.style.height='36px';this.style.height=Math.min(this.scrollHeight,72)+'px'"></textarea>
      <button onclick="_sendPartnerMsg()" style="width:36px;height:36px;border-radius:10px;background:var(--grad);border:none;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0">${I.send}</button>
    </div>
  </div>`;

  // Start listening for partner messages
  _startPartnerListener();

  const cm = document.getElementById('partnerChatMsgs');
  if (cm) cm.scrollTop = cm.scrollHeight;
}

// ════════════════════════════════════
//  PARTNER MESSAGING
// ════════════════════════════════════

window._sendPartnerMsg = async function() {
  const inp = document.getElementById('partnerChatInput');
  const text = inp?.value?.trim();
  if (!text || !S.connect?.connectedPartner) return;
  if (inp) inp.value = '';

  const msg = {
    from: 'me',
    content: text,
    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    seen: false
  };

  if (!S.connect.partnerMessages) S.connect.partnerMessages = [];
  S.connect.partnerMessages.push(msg);
  await saveAll();
  _renderConnect();

  // Send via Firebase
  if (typeof FIRE !== 'undefined' && FIRE.ready) {
    await FIRE.sendPartnerMessage(S.connect.connectedPartner, text);
  }
};

function _startPartnerListener() {
  if (_partnerListener || !S.connect?.connectedPartner) return;
  if (typeof FIRE !== 'undefined' && FIRE.ready) {
    _partnerListener = FIRE.listenPartnerMessages(S.connect.connectedPartner, (msgs) => {
      if (!S.connect) return;
      // Merge Firebase messages with local
      const myId = FIRE.userId;
      S.connect.partnerMessages = msgs.map(m => ({
        from: m.from === myId ? 'me' : 'partner',
        content: m.content,
        time: m.timestamp ? new Date(m.timestamp.toDate()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
        seen: true
      }));
      if (_connectView === 'partnerChat') _renderConnect();
    });
  }
}

function _stopPartnerListener() {
  if (_partnerListener) {
    if (typeof _partnerListener === 'function') _partnerListener();
    _partnerListener = null;
  }
}

// ════════════════════════════════════
//  BOT NAME EDIT
// ════════════════════════════════════

window._editBotName = function(botId) {
  const bot = (S.connect?.bots || []).find(b => b.id === botId);
  if (!bot) return;
  const newName = prompt('Bot ka naam change karein:', bot.name);
  if (newName?.trim()) {
    bot.name = newName.trim();
    saveAll();
    _renderConnect();
  }
};

// ════════════════════════════════════
//  BOT CONNECT (was Partner Connect)
//  Looks like "Bot Connect" from outside
//  Functionality: secret partner chat
// ════════════════════════════════════

window._showBotConnect = function() {
  const existing = document.getElementById('partnerModal');
  if (existing) { existing.remove(); return; }

  const modal = document.createElement('div');
  modal.id = 'partnerModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;background:var(--overlay)';
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

  const code = S.connect?.partnerCode || '';
  const suggestedName = _suggestBotName();

  modal.innerHTML = `<div style="background:var(--c1);border-radius:16px;padding:20px;width:90%;max-width:320px;border:1px solid var(--b1);box-shadow:var(--shadowLg)" onclick="event.stopPropagation()">
    <div style="font-size:16px;font-weight:600;margin-bottom:12px">Bot Connect</div>

    <div style="margin-bottom:16px">
      <div style="font-size:11px;color:var(--t4);margin-bottom:4px">Your Bot Code</div>
      <div style="display:flex;gap:6px;align-items:center">
        <div style="flex:1;padding:10px;background:var(--bg);border-radius:8px;font-size:16px;font-weight:700;font-family:monospace;text-align:center;letter-spacing:2px;color:var(--ac)">${code || '---'}</div>
        ${code ? `<button onclick="navigator.clipboard.writeText('${code}');showToast('Code copied!')" style="padding:8px;border-radius:8px;background:var(--c2);border:1px solid var(--b1);color:var(--t3)">${I.copy}</button>` : ''}
      </div>
      ${!code ? `<button onclick="_generateCode()" style="margin-top:6px;width:100%;padding:8px;border-radius:8px;background:var(--grad);color:#fff;border:none;font-size:12px;font-weight:500">Generate Code</button>` : ''}
    </div>

    <div style="margin-bottom:16px">
      <div style="font-size:11px;color:var(--t4);margin-bottom:4px">Enter Bot Code</div>
      <div style="display:flex;gap:6px">
        <input id="partnerCodeInput" class="inp" placeholder="AK-XXXX" style="flex:1;font-size:14px;text-align:center;font-family:monospace;letter-spacing:1px" maxlength="10">
        <button onclick="_connectPartner()" style="padding:8px 16px;border-radius:8px;background:var(--grad);color:#fff;border:none;font-size:12px;font-weight:500">Connect</button>
      </div>
    </div>

    <div style="margin-bottom:16px">
      <div style="font-size:11px;color:var(--t4);margin-bottom:4px">Suggest a Bot Name</div>
      <div style="display:flex;gap:6px;align-items:center">
        <div style="flex:1;padding:10px;background:var(--bg);border-radius:8px;font-size:14px;font-weight:600;text-align:center;color:var(--t1)" id="suggestedBotName">${suggestedName}</div>
        <button onclick="document.getElementById('suggestedBotName').textContent=_suggestBotName()" style="padding:8px;border-radius:8px;background:var(--c2);border:1px solid var(--b1);color:var(--t3);font-size:11px">🔄</button>
      </div>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;background:var(--bg);border-radius:8px">
      <div><div style="font-size:12px;font-weight:500">Bot Active</div><div style="font-size:10px;color:var(--t4)">OFF = chats delete + AI chats generate</div></div>
      <button onclick="_togglePartner()" style="padding:4px 12px;border-radius:6px;font-size:11px;font-weight:600;background:${S.connect?.partnerActive?'var(--gBg)':'var(--rBg)'};color:${S.connect?.partnerActive?'var(--g)':'var(--r)'};border:1px solid ${S.connect?.partnerActive?'var(--gBorder)':'var(--rBorder)'}">${S.connect?.partnerActive?'ON':'OFF'}</button>
    </div>

    <button onclick="document.getElementById('partnerModal').remove()" style="margin-top:12px;width:100%;padding:8px;border-radius:8px;background:var(--c2);border:1px solid var(--b1);color:var(--t3);font-size:12px">Close</button>
  </div>`;

  document.body.appendChild(modal);
};

window._generateCode = async function() {
  let code;
  if (typeof FIRE !== 'undefined' && FIRE.ready) {
    code = await FIRE.generateConnectCode();
  }
  if (!code) {
    code = 'AK-' + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  if (!S.connect) S.connect = { bots:[], partnerCode:'', connectedPartner:'', partnerActive:false, partnerMessages:[], partnerBotId:null };
  S.connect.partnerCode = code;
  await saveAll();
  document.getElementById('partnerModal')?.remove();
  _showBotConnect();
};

window._connectPartner = async function() {
  const code = document.getElementById('partnerCodeInput')?.value?.trim();
  if (!code) { showToast('Code dalein'); return; }

  if (typeof FIRE !== 'undefined' && FIRE.ready) {
    const result = await FIRE.verifyConnectCode(code);
    if (!result) { showToast('Invalid code'); return; }
  }

  // Get suggested bot name for this partner chat
  const botName = document.getElementById('suggestedBotName')?.textContent || _suggestBotName();

  // Find or create a bot entry for this partner
  if (!S.connect.partnerBotId) {
    const newBotId = Date.now();
    const newBot = {
      id: newBotId,
      name: botName,
      role: 'life',
      expertise: 'Life Coach — motivation, mindset, life decisions',
      chatHistory: []
    };
    S.connect.bots.push(newBot);
    S.connect.partnerBotId = newBotId;
  }

  S.connect.connectedPartner = code;
  S.connect.partnerActive = true;
  S.connect.partnerMessages = [];
  await saveAll();
  showToast('Connected!');
  document.getElementById('partnerModal')?.remove();
  _renderConnect();
};

window._togglePartner = async function() {
  if (!S.connect) return;
  const wasActive = S.connect.partnerActive;
  S.connect.partnerActive = !wasActive;

  if (wasActive) {
    // Turning OFF — delete partner chats + generate fake chats
    await _disconnectAndFake();
  }

  await saveAll();
  document.getElementById('partnerModal')?.remove();
  _showBotConnect();
};

window._togglePartnerFromChat = async function() {
  if (!S.connect) return;
  const wasActive = S.connect.partnerActive;
  S.connect.partnerActive = !wasActive;

  if (wasActive) {
    await _disconnectAndFake();
    _connectView = 'botChat'; // Switch to normal bot view
  }

  await saveAll();
  _renderConnect();
};

// ════════════════════════════════════
//  PANIC BUTTON — Emergency Exit
//  One tap = both sides wipe + fake generate
//  No confirmation dialog
// ════════════════════════════════════

window._panicButton = async function() {
  if (!S.connect) return;

  // 1. Signal partner to panic too (via Firebase)
  if (typeof FIRE !== 'undefined' && FIRE.ready && S.connect.connectedPartner) {
    try {
      await FIRE.sendPanicSignal(S.connect.connectedPartner);
    } catch(e) { console.log('[PANIC] Signal send failed:', e); }
  }

  // 2. Local wipe + fake
  await _disconnectAndFake();

  // 3. Switch to bot chat view instantly
  _connectView = 'botChat';
  _renderConnect();
  showToast('Switched to AI mode');
};

// Listen for panic signal from partner
function _listenPanicSignal() {
  if (typeof FIRE === 'undefined' || !FIRE.ready || !S.connect?.connectedPartner) return;
  try {
    FIRE.listenPanicSignal(S.connect.connectedPartner, async () => {
      // Partner pressed panic — wipe our side too
      await _disconnectAndFake();
      if (_connectView === 'partnerChat') {
        _connectView = 'botChat';
        _renderConnect();
      }
      showToast('Switched to AI mode');
    });
  } catch(e) { console.log('[PANIC] Listen failed:', e); }
}

// ════════════════════════════════════
//  DISCONNECT + FAKE CHAT GENERATION
// ════════════════════════════════════

async function _disconnectAndFake() {
  if (!S.connect) return;

  // Stop listener
  _stopPartnerListener();

  // Delete real partner messages from Firebase
  if (typeof FIRE !== 'undefined' && FIRE.ready && S.connect.connectedPartner) {
    await FIRE.deletePartnerChat(S.connect.connectedPartner);
  }

  // Delete partner messages locally
  S.connect.partnerMessages = [];
  S.connect.partnerActive = false;

  // Generate fake AI chats for ALL bots (including partner bot)
  _generateFakeChats();

  await saveAll();
}

window._disconnectPartner = async function() {
  await _disconnectAndFake();
  S.connect.connectedPartner = '';
  await saveAll();
  showToast('Disconnected — AI chats generated');
  _renderConnect();
};

// ════════════════════════════════════
//  FAKE CHAT GENERATION (Privacy)
//  Generates realistic bot-style conversations
//  Topic-specific to each bot's expertise
// ════════════════════════════════════

function _generateFakeChats() {
  const fakeConversations = {
    career: [
      { role:'user', content:'Resume mein kya improve karun?' },
      { role:'assistant', content:'Aapke resume mein 3 cheezein add karein:\n1. Quantifiable achievements — "sales 30% badhaya" jaisa\n2. Skills section mein relevant keywords\n3. Projects section mein 2-3 best projects with impact\n\nAur haan, ek page se zyada mat rakhein!' },
      { role:'user', content:'Interview ke liye tips?' },
      { role:'assistant', content:'Interview mein confidence sabse important hai. Kuch tips:\n\n1. STAR method use karein answers ke liye (Situation, Task, Action, Result)\n2. Company research zarur karein — unke recent news, products, values\n3. "Tell me about yourself" ka 2-min answer ready rakhein\n4. Questions zarur puchein — yeh interest dikhata hai\n5. Body language — eye contact, smile, firm handshake' },
      { role:'user', content:'LinkedIn profile optimize kaise karu?' },
      { role:'assistant', content:'LinkedIn optimization ke liye yeh steps follow karein:\n\n1. Headline mein sirf designation mat daalein — value proposition likhein\n2. About section mein story likhein, resume copy mat karein\n3. Skills section mein top 5 relevant skills pin karein\n4. Recommendations maangein — at least 3-4\n5. Weekly ek post daalein apne domain se related' }
    ],
    life: [
      { role:'user', content:'Motivation kaise maintain karun?' },
      { role:'assistant', content:'Motivation temporary hoti hai, discipline permanent. Kuch strategies:\n\n1. Small wins celebrate karein — roz ek chhota goal complete karo\n2. Vision board banayein — goals visual form mein\n3. Environment design karein — distractions hatao\n4. Accountability partner rakhein\n5. "2-minute rule" — sirf 2 min start karo, momentum automatically aayega' },
      { role:'user', content:'Time management kaise improve karu?' },
      { role:'assistant', content:'Time management ke liye tested methods:\n\n1. Eisenhower Matrix — urgent vs important sort karein\n2. Time blocking — har kaam ka specific time fix karein\n3. Pomodoro — 25 min focus, 5 min break\n4. "Eat the frog" — sabse mushkil kaam pehle karein\n5. Phone notifications band karein focus time mein' }
    ],
    study: [
      { role:'user', content:'Focus kaise improve karun padhai mein?' },
      { role:'assistant', content:'Pomodoro technique try karein — 25 min focus, 5 min break. Yeh scientifically proven hai. Aur:\n\n1. Phone silence pe rakhein ya doosre room mein\n2. Dedicated study space banayein\n3. Active recall use karein — sirf padhna nahi, khud se puchein\n4. Spaced repetition — aaj padha, kal revise, 3rd din phir revise' },
      { role:'user', content:'Notes kaise banau effectively?' },
      { role:'assistant', content:'Effective notes ke liye Cornell Method try karein:\n\n1. Page ko 3 parts mein divide karein — Notes, Cues, Summary\n2. Class/reading ke dauraan right side mein notes\n3. Baad mein left side mein key words/questions\n4. Bottom mein 2-3 line summary\n5. Color coding use karein — important = red, examples = blue' }
    ],
    business: [
      { role:'user', content:'Side business kaise start karun?' },
      { role:'assistant', content:'Side business ke liye step-by-step approach:\n\n1. Apni skills audit karein — kya accha karte hain?\n2. Market need dhundhein — problem solve karein\n3. MVP banayein — minimum viable product/service\n4. Pehle 10 customers manually acquire karein\n5. Feedback lo, improve karo, scale karo\n\nBudget: ₹0 se start ho sakta hai — freelancing, consulting, content creation.' },
      { role:'user', content:'Marketing budget kam hai, kya karun?' },
      { role:'assistant', content:'Low budget marketing strategies:\n\n1. Content marketing — blog/reels/posts se organic reach\n2. WhatsApp Business — broadcast lists banaein\n3. Referral program — existing customers ko incentive dein\n4. Local partnerships — complementary businesses ke saath\n5. Google My Business — free listing, reviews collect karein' }
    ],
    fitness: [
      { role:'user', content:'Weight loss ke liye kya karun?' },
      { role:'assistant', content:'Weight loss ka formula simple hai: Calorie deficit + Consistency.\n\n1. Daily calorie intake track karein (MyFitnessPal app se)\n2. Protein badhayein — 1.5g per kg body weight\n3. Roz 30 min walk minimum\n4. Sugar aur processed food kam karein\n5. Sleep 7-8 hours zaruri hai — sleep affects weight\n\nCrash diet mat karein — sustainable changes karein!' },
      { role:'user', content:'Home workout plan chahiye' },
      { role:'assistant', content:'Beginner home workout (no equipment):\n\nDay 1: Upper Body\n- Push-ups 3x12\n- Dips (chair) 3x10\n- Plank 3x30sec\n\nDay 2: Lower Body\n- Squats 3x15\n- Lunges 3x12 each\n- Calf raises 3x20\n\nDay 3: Cardio\n- Jumping jacks 3x30\n- Burpees 3x10\n- Mountain climbers 3x20\n\nDay 4: Rest\nRepeat cycle!' }
    ]
  };

  const bots = S.connect?.bots || [];
  bots.forEach(bot => {
    const fakes = fakeConversations[bot.role] || fakeConversations.life;
    // Always replace with fresh fake chats
    bot.chatHistory = [...fakes];
  });
}

// ════════════════════════════════════
//  INIT — Start panic listener on load
// ════════════════════════════════════

setTimeout(() => {
  if (S.connect?.partnerActive && S.connect?.connectedPartner) {
    _listenPanicSignal();
  }
}, 2000);

// ════════════════════════════════════
//  SIDEBAR INTEGRATION
// ════════════════════════════════════

window.renderSecChat_voice = function() { const w = document.getElementById('voiceChatWrap'); if(w) _renderSectionChat('voice', w); };
window.renderSecChat_gym = function() { const w = document.getElementById('gymChatWrap'); if(w) _renderSectionChat('gym', w); };
window.renderSecChat_debate = function() { const w = document.getElementById('debateChatWrap'); if(w) _renderSectionChat('debate', w); };
window.renderSecChat_face = function() { const w = document.getElementById('faceChatWrap'); if(w) _renderSectionChat('face', w); };
window.renderSecChat_medical = function() { const w = document.getElementById('medicalChatWrap'); if(w) _renderSectionChat('medical', w); };
