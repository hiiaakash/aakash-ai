// ════════════════════════════════════
//  AAKASH AI — Chat (chat.js)
//  Chat UI + Multi-chat + File upload
// ════════════════════════════════════

// ── FILE UPLOAD ──
let pendingFile = null;

window.pickFile = function() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'image/*,.pdf,.txt,.md';
  inp.onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.type.startsWith('image/')) {
      const reader = new FileReader(); reader.onload = () => {
        pendingFile = { type: 'image', data: reader.result, mime: f.type, name: f.name }; showFilePreview();
      }; reader.readAsDataURL(f);
    } else if (f.type === 'application/pdf' || f.name.endsWith('.pdf')) {
      const reader = new FileReader(); reader.onload = () => {
        pendingFile = { type: 'pdf', data: reader.result, mime: 'application/pdf', name: f.name }; showFilePreview();
      }; reader.readAsDataURL(f);
    } else {
      const reader = new FileReader(); reader.onload = () => {
        pendingFile = { type: 'text', data: reader.result, name: f.name }; showFilePreview();
      }; reader.readAsText(f);
    }
  };
  inp.click();
};

function showFilePreview() {
  const prev = document.getElementById('filePreview'); if (!prev) return;
  prev.style.display = 'block';
  prev.innerHTML = `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--c2);border-radius:10px;border:1px solid var(--b1)">
    <span style="font-size:22px">${pendingFile.type === 'image' ? '🖼️' : pendingFile.type === 'pdf' ? '📄' : '📝'}</span>
    <span style="font-size:13px;color:var(--t2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${pendingFile.name}</span>
    <button onclick="pendingFile=null;document.getElementById('filePreview').style.display='none'" style="color:var(--r);font-size:16px;padding:4px">✕</button>
  </div>`;
}

// ── CHAT RENDER ──
function rChat(ct) {
  ct.innerHTML = `
  <div id="cm" style="flex:1;overflow-y:auto;padding:12px 16px;background:var(--bg)">
  ${S.chat.length === 0 ? `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;animation:fadeIn .5s">
    <div style="width:72px;height:72px;border-radius:20px;background:var(--grad);display:flex;align-items:center;justify-content:center;color:#fff;font-size:32px;font-weight:800;margin-bottom:20px;box-shadow:var(--shadowLg)">A</div>
    <div style="font-size:20px;font-weight:700;margin-bottom:6px">Namaste! 👋</div>
    <p style="color:var(--t3);font-size:14px;text-align:center;max-width:280px;line-height:1.7;margin-bottom:20px">Main AAKASH hun — aapka personal AI. Kuch bhi bolo, main action lunga!</p>
    <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:320px">
    ${['🌅 Daily Brief', '💰 Finance Check', '📅 Habit Status', '💡 Motivate Me', '🎨 Customize App'].map(q =>
      `<button onclick="sendMsg('${q}')" style="padding:10px 16px;border-radius:24px;background:var(--c1);border:1.5px solid var(--b1);color:var(--t2);font-size:14px;font-weight:500;box-shadow:var(--shadow)">${q}</button>`).join('')}
    </div>
  </div>` :
  S.chat.map(m => `<div style="display:flex;justify-content:${m.role === 'user' ? 'flex-end' : 'flex-start'};margin-bottom:10px;animation:slideUp .3s">
    ${m.role === 'assistant' ? '<div style="width:28px;height:28px;border-radius:9px;background:var(--grad);display:flex;align-items:center;justify-content:center;margin-right:8px;flex-shrink:0;margin-top:2px;color:#fff;font-size:13px;font-weight:800">A</div>' : ''}
    <div style="max-width:82%;padding:12px 16px;border-radius:${m.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px'};background:${m.role === 'user' ? 'var(--grad)' : 'var(--c1)'};border:${m.role === 'user' ? 'none' : '1px solid var(--b1)'};font-size:15px;line-height:1.7;color:${m.role === 'user' ? '#fff' : 'var(--t1)'};box-shadow:var(--shadow)">
      ${m.role === 'user' ? m.content.replace(/</g, '&lt;') : fmt(m.content)}
      ${m.hasFile ? '<div style="margin-top:6px;font-size:12px;color:var(--t3)">📎 File attached</div>' : ''}
      ${m.role === 'assistant' ? `<button onclick="speakMsg(this)" style="margin-top:6px;font-size:11px;color:var(--t4);background:none;border:none;cursor:pointer" title="Read aloud">🔊</button>` : ''}
    </div>
  </div>`).join('') + (loading ? `<div style="display:flex;align-items:center;gap:8px;padding:6px"><div style="width:28px;height:28px;border-radius:9px;background:var(--grad);display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:800">A</div><div style="display:flex;gap:5px;align-items:center">${[0, 1, 2].map(i => `<div style="width:7px;height:7px;border-radius:50%;background:var(--ac);animation:dot 1s ${i * .2}s infinite"></div>`).join('')}<span style="font-size:13px;color:var(--t3);margin-left:6px">${S.thinkMode ? 'Deep thinking...' : 'Typing...'}</span></div></div>` : '')}
  </div>
  <div style="flex-shrink:0;padding:10px 16px 14px;border-top:1px solid var(--b1);background:var(--c1)">
    <div style="display:flex;gap:8px;align-items:end">
      <button onclick="pickFile()" style="width:42px;height:42px;border-radius:12px;background:var(--c2);border:1.5px solid var(--b1);color:var(--t3);font-size:18px;flex-shrink:0;display:flex;align-items:center;justify-content:center" title="Upload File">📎</button>
      <textarea id="ci" class="inp" placeholder="Message AAKASH..." rows="1" style="flex:1;resize:none;min-height:42px;max-height:84px;border-radius:12px;padding:10px 14px" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMsg()}" oninput="this.style.height='42px';this.style.height=Math.min(this.scrollHeight,84)+'px'"></textarea>
      <button onclick="sendMsg()" class="btn bp" style="width:42px;height:42px;padding:0;flex-shrink:0;border-radius:12px;font-size:18px">▸</button>
    </div>
    <div id="filePreview" style="display:none;margin-top:8px"></div>
  </div>`;
  const cm = document.getElementById('cm'); if (cm) cm.scrollTop = cm.scrollHeight;
}

// ── SEND MESSAGE ──
window.sendMsg = async function(text) {
  const inp = document.getElementById('ci');
  const content = text || (inp ? inp.value.trim() : '');
  if (!content && !pendingFile || loading) return;
  if (inp) inp.value = '';
  const userMsg = { role: 'user', content: content || '[File uploaded]' };
  if (pendingFile) userMsg.hasFile = true;
  S.chat.push(userMsg); mc++; loading = true; rChat(document.getElementById('ct'));

  let apiMessages = S.chat.slice(-20).map(m => {
    if (m === userMsg && pendingFile) {
      if (pendingFile.type === 'image') {
        return { role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: pendingFile.mime, data: pendingFile.data.split(',')[1] } }, { type: 'text', text: content || 'Ye notes/image analyze karo. Teacher ki tarah samjhao. Phir doubt poocho.' }] };
      } else if (pendingFile.type === 'pdf') {
        return { role: 'user', content: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pendingFile.data.split(',')[1] } }, { type: 'text', text: content || 'Ye document padho aur teacher ki tarah samjhao. Simple Hinglish mein. Phir doubt poocho.' }] };
      } else {
        return { role: 'user', content: content + '\n\n[Uploaded file content]:\n' + pendingFile.data };
      }
    }
    return { role: m.role, content: m.content };
  });

  const reply = await ai(apiMessages, SOUL + getContext());
  pendingFile = null;
  const fp = document.getElementById('filePreview'); if (fp) fp.style.display = 'none';
  S.chat.push({ role: 'assistant', content: reply });

  // Auto-save to chat history
  saveChatToHistory();
  await saveAll();
  loading = false;
  rChat(document.getElementById('ct'));
};

// ── READ MESSAGE ALOUD (NEW) ──
window.speakMsg = function(btn) {
  const text = btn.closest('div[style*="max-width"]').innerText;
  const clean = text.replace(/[\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}∞₹🔧🔊]/gu, '').replace(/[→›]/g, '').trim();
  if (!clean) return;
  if (speechSynthesis.speaking) { speechSynthesis.cancel(); btn.textContent = '🔊'; return; }
  btn.textContent = '⏹️';
  const u = new SpeechSynthesisUtterance(clean);
  const voices = speechSynthesis.getVoices();
  let hv = voices.find(v => v.name.includes('Google') && v.lang.startsWith('hi')) || voices.find(v => v.lang.startsWith('hi')) || voices.find(v => v.lang === 'en-IN') || voices[0];
  if (hv) u.voice = hv;
  u.lang = hv?.lang || 'hi-IN';
  u.onend = () => { btn.textContent = '🔊'; };
  u.onerror = () => { btn.textContent = '🔊'; };
  speechSynthesis.speak(u);
};

// ── CHAT HISTORY SIDEBAR (NEW) ──
window.openChatHistory = function() {
  // Save current chat first
  if (S.chat.length > 0) saveChatToHistory();

  const projectChats = S.activeProject ? getChatsByProject(S.activeProject) : S.chats;
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:100;display:flex;animation:fadeIn .2s';
  ov.innerHTML = `
  <div style="width:300px;height:100%;background:var(--c1);border-right:1px solid var(--b1);display:flex;flex-direction:column;box-shadow:var(--shadowLg)">
    <div style="padding:16px;border-bottom:1px solid var(--b1);display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:16px;font-weight:700">${S.activeProject ? S.projects.find(p => p.id === S.activeProject)?.name || 'Chats' : '💬 All Chats'}</div>
      <button onclick="this.closest('div[style*=fixed]').remove()" style="font-size:18px;color:var(--t3);padding:4px">✕</button>
    </div>
    <div style="padding:10px 16px">
      <button onclick="this.closest('div[style*=fixed]').remove();createNewChat(${S.activeProject || 'null'});render()" class="btn bp" style="width:100%;padding:10px;font-size:14px">+ New Chat</button>
    </div>
    <div style="flex:1;overflow-y:auto;padding:0 12px 12px">
      ${projectChats.length === 0 ? '<div style="text-align:center;padding:30px;color:var(--t4);font-size:14px">No chats yet</div>' :
      projectChats.map(c => `
        <div style="padding:12px 14px;border-radius:10px;margin-bottom:6px;cursor:pointer;background:${S.activeChat === c.id ? 'var(--acBg2)' : 'var(--c2)'};border:1px solid ${S.activeChat === c.id ? 'var(--acBorder)' : 'var(--b1)'}" onclick="loadChat(${c.id});this.closest('div[style*=fixed]').remove();render()">
          <div style="font-size:14px;font-weight:600;color:${S.activeChat === c.id ? 'var(--ac)' : 'var(--t1)'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.title}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
            <div style="font-size:11px;color:var(--t4)">${new Date(c.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${c.messages.length} msgs</div>
            <button onclick="event.stopPropagation();if(confirm('Delete this chat?')){deleteChat(${c.id});this.closest('div[style*=fixed]').remove();openChatHistory()}" style="font-size:12px;color:var(--r);padding:2px 6px;background:var(--rBg);border-radius:4px;border:none">✕</button>
          </div>
        </div>`).join('')}
    </div>
  </div>
  <div onclick="this.closest('div[style*=fixed]').remove()" style="flex:1;background:var(--overlay)"></div>`;
  document.body.appendChild(ov);
};
