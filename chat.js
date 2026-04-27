// ════════════════════════════════════
//  AAKASH AI v2 — Chat (chat.js)
//  Pro icons + Multi-chat + File upload
// ════════════════════════════════════

let pendingFile = null;

function _escHtml(str) { return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

window.pickFile = function() {
  const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*,.pdf,.txt,.md,.json,.csv,.docx,.xlsx';
  inp.onchange = e => {
    const f = e.target.files[0]; if(!f) return;
    if (f.type.startsWith('image/')) { const r=new FileReader(); r.onload=()=>{pendingFile={type:'image',data:r.result,mime:f.type,name:f.name};showFilePreview();}; r.readAsDataURL(f); }
    else if (f.type==='application/pdf') { const r=new FileReader(); r.onload=()=>{pendingFile={type:'pdf',data:r.result,mime:'application/pdf',name:f.name};showFilePreview();}; r.readAsDataURL(f); }
    else { const r=new FileReader(); r.onload=()=>{pendingFile={type:'text',data:r.result,name:f.name};showFilePreview();}; r.readAsText(f); }
  }; inp.click();
};

function showFilePreview() {
  const prev = document.getElementById('filePreview'); if (!prev) return;
  prev.style.display = 'block';
  prev.innerHTML = `<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--c2);border-radius:8px;border:1px solid var(--b1)">
    <span style="color:var(--t3)">${I.attach}</span>
    <span style="font-size:12px;color:var(--t2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${pendingFile.name}</span>
    <button onclick="pendingFile=null;document.getElementById('filePreview').style.display='none'" style="color:var(--r)">${I.close}</button>
  </div>`;
}

function rChat(ct) {
  ct.innerHTML = `
  <div id="cm" style="flex:1;overflow-y:auto;padding:12px 14px;background:var(--bg)">
  ${S.chat.length===0 ? `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;animation:fadeIn .4s">
    ${aiAvatar(56)}
    <div style="font-size:18px;font-weight:600;margin:12px 0 4px">Namaste!</div>
    <p style="color:var(--t3);font-size:12px;text-align:center;max-width:260px;line-height:1.6;margin-bottom:16px">Main AAKASH hoon — tera personal AI. Kuch bhi bol!</p>
    <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:300px">
    ${['Daily Brief','Finance Check','Habit Status','Motivate Me'].map(q =>
      `<button onclick="sendMsg('${q}')" style="padding:8px 14px;border-radius:16px;background:var(--c1);border:1.5px solid var(--b1);color:var(--t2);font-size:12px;font-weight:500">${q}</button>`).join('')}
    </div>
  </div>` :
  S.chat.map((m, idx) => `<div style="display:flex;justify-content:${m.role==='user'?'flex-end':'flex-start'};margin-bottom:8px;animation:slideUp .2s">
    ${m.role==='assistant' ? `<div style="margin-right:8px;margin-top:2px">${aiAvatar(24)}</div>` : ''}
    <div style="max-width:80%">
      <div style="padding:10px 14px;border-radius:${m.role==='user'?'16px 16px 4px 16px':'4px 16px 16px 16px'};background:${m.role==='user'?'var(--grad)':'var(--c1)'};border:${m.role==='user'?'none':'1px solid var(--b1)'};font-size:13px;line-height:1.7;color:${m.role==='user'?'#fff':'var(--t1)'}">
        ${m.role==='user' ? _escHtml(typeof m.content==='string'?m.content:'[File]') : fmt(m.content)}
        ${m.hasFile ? `<div style="margin-top:4px;font-size:10px;color:var(--t3);display:flex;align-items:center;gap:3px">${I.attach} File attached</div>` : ''}
        ${m.hasGenImage ? `<div style="margin-top:6px"><img src="${m.genImageData}" style="max-width:100%;border-radius:8px;border:1px solid var(--b1)"></div>` : ''}
      </div>
      <div style="display:flex;gap:1px;margin-top:3px;justify-content:${m.role==='user'?'flex-end':'flex-start'}">
        <button onclick="copyMessage(${idx})" style="padding:2px 6px;border-radius:4px;font-size:9px;color:var(--t4);background:none;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:3px">${I.copy} Copy</button>
        ${m.role==='assistant' ? `<button onclick="speakMsg(this,${idx})" style="padding:2px 6px;border-radius:4px;font-size:9px;color:var(--t4);background:none;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:3px">${I.speaker} Read</button>
        <button onclick="regenerateMsg(${idx})" style="padding:2px 6px;border-radius:4px;font-size:9px;color:var(--t4);background:none;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:3px">${I.retry} Retry</button>` : `
        <button onclick="editMessage(${idx})" style="padding:2px 6px;border-radius:4px;font-size:9px;color:var(--t4);background:none;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:3px">${I.edit} Edit</button>`}
        <button onclick="deleteMessage(${idx})" style="padding:2px 6px;border-radius:4px;font-size:9px;color:var(--t4);background:none;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:3px">${I.trash}</button>
      </div>
    </div>
  </div>`).join('') + (loading ? `<div style="display:flex;align-items:center;gap:6px;padding:4px"><div style="margin-right:2px">${aiAvatar(24)}</div><div style="display:flex;gap:4px;align-items:center">${[0,1,2].map(i => `<div style="width:5px;height:5px;border-radius:50%;background:var(--ac);animation:dot 1s ${i*.2}s infinite"></div>`).join('')}<span style="font-size:11px;color:var(--t3);margin-left:4px">${S.thinkMode?'Deep thinking...':'Typing...'}</span></div></div>` : '')}
  </div>
  <div style="flex-shrink:0;padding:8px 12px 12px;border-top:1px solid var(--b1);background:var(--c1)">
    <div style="display:flex;gap:6px;align-items:end">
      <button onclick="pickFile()" style="width:36px;height:36px;border-radius:10px;background:var(--c2);border:1px solid var(--b1);color:var(--t3);display:flex;align-items:center;justify-content:center;flex-shrink:0">${I.attach}</button>
      <textarea id="ci" class="inp" placeholder="Message AAKASH..." rows="1" style="flex:1;resize:none;min-height:36px;max-height:72px;border-radius:10px;padding:8px 12px;font-size:13px" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMsg()}" oninput="this.style.height='36px';this.style.height=Math.min(this.scrollHeight,72)+'px'"></textarea>
      <button onclick="startVoiceInput()" id="micBtn" style="width:36px;height:36px;border-radius:10px;background:var(--c2);border:1px solid var(--b1);color:var(--t3);display:flex;align-items:center;justify-content:center;flex-shrink:0">${I.mic}</button>
      <button onclick="sendMsg()" style="width:36px;height:36px;border-radius:10px;background:var(--grad);border:none;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0">${I.send}</button>
    </div>
    <div id="filePreview" style="display:none;margin-top:6px"></div>
  </div>`;
  const cm = document.getElementById('cm'); if(cm) cm.scrollTop = cm.scrollHeight;
}

window.sendMsg = async function(text) {
  if (isDemoMode() && !text) { showToast('API key add karo for AI chat'); return; }
  const inp = document.getElementById('ci');
  const content = text || (inp ? inp.value.trim() : '');
  if ((!content && !pendingFile) || loading) return;
  if (inp) inp.value = '';
  const userMsg = { role:'user', content: content||'[File uploaded]' };
  if (pendingFile) userMsg.hasFile = true;
  S.chat.push(userMsg); mc++; loading = true; rChat(document.getElementById('ct'));

  let apiMessages = S.chat.slice(-20).map(m => {
    if (m===userMsg && pendingFile) {
      if (pendingFile.type==='image') return {role:'user',content:[{type:'image',source:{type:'base64',media_type:pendingFile.mime,data:pendingFile.data.split(',')[1]}},{type:'text',text:content||'Analyze this.'}]};
      if (pendingFile.type==='pdf') return {role:'user',content:[{type:'document',source:{type:'base64',media_type:'application/pdf',data:pendingFile.data.split(',')[1]}},{type:'text',text:content||'Analyze this document.'}]};
      return {role:'user',content:content+'\n\n[File: '+pendingFile.name+']\n'+pendingFile.data};
    }
    return {role:m.role,content:m.content};
  });

  const reply = await ai(apiMessages, SOUL + getContext());
  pendingFile = null;
  const fp = document.getElementById('filePreview'); if(fp) fp.style.display='none';

  const imgMatch = reply.match(/\[GENERATE_IMAGE:\s*(.+?)\]/i);
  if (imgMatch && hasCap('image_gen')) {
    const imgPrompt = imgMatch[1].trim();
    const textPart = reply.replace(/\[GENERATE_IMAGE:\s*.+?\]/i,'').trim();
    if (textPart) S.chat.push({role:'assistant',content:textPart});
    const imgResult = await generateImage(imgPrompt);
    if (imgResult.ok && imgResult.images?.length) {
      S.chat.push({role:'assistant',content:'Image ready!',hasGenImage:true,genImageData:`data:${imgResult.images[0].mime};base64,${imgResult.images[0].data}`,genPrompt:imgPrompt});
    } else { S.chat.push({role:'assistant',content:'Image generate nahi ho payi. Dobara try karo.'}); }
  } else { S.chat.push({role:'assistant',content:reply}); }

  saveChatToHistory(); await saveAll(); loading = false; rChat(document.getElementById('ct'));
};

// ── Voice Input ──
let _micRec = null;
window.startVoiceInput = function() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { showToast('Voice not supported'); return; }
  const btn = document.getElementById('micBtn');
  if (_micRec) { _micRec.stop(); _micRec=null; if(btn){btn.style.background='var(--c2)';btn.style.borderColor='var(--b1)';} return; }
  _micRec = new SR(); _micRec.lang='hi-IN'; _micRec.continuous=false; _micRec.interimResults=true;
  if(btn){btn.style.background='var(--rBg)';btn.style.borderColor='var(--rBorder)';}
  let finalText='';
  _micRec.onresult = e => { let interim=''; for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)finalText+=e.results[i][0].transcript+' ';else interim+=e.results[i][0].transcript;} const inp=document.getElementById('ci'); if(inp)inp.value=(finalText+interim).trim(); };
  _micRec.onend = () => { _micRec=null; if(btn){btn.style.background='var(--c2)';btn.style.borderColor='var(--b1)';} };
  _micRec.onerror = () => { _micRec=null; if(btn){btn.style.background='var(--c2)';btn.style.borderColor='var(--b1)';} };
  try{_micRec.start();}catch{_micRec=null;}
};

// ── Message Actions ──
window.copyMessage = function(idx) { const m=S.chat[idx]; if(!m)return; navigator.clipboard.writeText(typeof m.content==='string'?m.content:'[Content]').then(()=>showToast('Copied!')).catch(()=>showToast('Copied!')); };
window.editMessage = function(idx) { const m=S.chat[idx]; if(!m||m.role!=='user')return; const t=prompt('Edit:',typeof m.content==='string'?m.content:''); if(t?.trim()){S.chat=S.chat.slice(0,idx);mc=S.chat.filter(m=>m.role==='user').length;saveChatToHistory();saveAll();rChat(document.getElementById('ct'));sendMsg(t.trim());} };
window.deleteMessage = function(idx) { if(!confirm('Delete?'))return; S.chat.splice(idx,1); mc=S.chat.filter(m=>m.role==='user').length; saveChatToHistory();saveAll(); rChat(document.getElementById('ct')); };
window.regenerateMsg = async function(idx) { const m=S.chat[idx]; if(!m||m.role!=='assistant'||loading)return; let ui=idx-1; while(ui>=0&&S.chat[ui].role!=='user')ui--; if(ui<0)return; S.chat.splice(idx,1); loading=true; rChat(document.getElementById('ct')); const apiMsgs=S.chat.slice(-20).map(m=>({role:m.role,content:m.content})); const reply=await ai(apiMsgs,SOUL+getContext()); S.chat.push({role:'assistant',content:reply}); saveChatToHistory();await saveAll(); loading=false; rChat(document.getElementById('ct')); };
window.speakMsg = function(btn,idx) { const m=S.chat[idx]; if(!m)return; const clean=(typeof m.content==='string'?m.content:'').replace(/[*#`]/g,'').trim(); if(!clean)return; if(speechSynthesis.speaking){speechSynthesis.cancel();return;} const u=new SpeechSynthesisUtterance(clean); const voices=speechSynthesis.getVoices(); const hv=voices.find(v=>v.lang.startsWith('hi'))||voices.find(v=>v.lang==='en-IN')||voices[0]; if(hv)u.voice=hv; u.lang=hv?.lang||'hi-IN'; speechSynthesis.speak(u); };

function showToast(msg) {
  const t=document.createElement('div'); t.textContent=msg;
  t.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--t1);color:var(--bg);padding:8px 20px;border-radius:20px;font-size:12px;font-weight:500;z-index:999;animation:fadeIn .2s';
  document.body.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transition='opacity .3s';setTimeout(()=>t.remove(),300);},1500);
}

window.renameChat = function(chatId) { const c=S.chats.find(x=>x.id===chatId); if(!c)return; const n=prompt('Rename:',c.title); if(n?.trim()){c.title=n.trim();saveAll();} };
