// ════════════════════════════════════
//  AAKASH AI v3 — Chat (chat.js)
//  NEW: Reply/Quote, Edit box, Typing indicator,
//  Image compression, PDF brain storage
// ════════════════════════════════════

let pendingFile = null, _replyTo = null, _editIdx = null;

function _escHtml(str) { return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── Image Compression (Change 17) ──
function compressImage(dataUrl, maxWidth = 1200, quality = 0.7) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

window.pickFile = function() {
  const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*,.pdf,.txt,.md,.json,.csv,.docx,.xlsx';
  inp.onchange = async e => {
    const f = e.target.files[0]; if(!f) return;
    if (f.type.startsWith('image/')) {
      const r=new FileReader(); r.onload=async()=>{
        const compressed = await compressImage(r.result);
        pendingFile={type:'image',data:compressed,mime:'image/jpeg',name:f.name};
        showFilePreview();
      }; r.readAsDataURL(f);
    }
    else if (f.type==='application/pdf') {
      const r=new FileReader(); r.onload=()=>{
        pendingFile={type:'pdf',data:r.result,mime:'application/pdf',name:f.name};
        showFilePreview();
        // Store PDF in brain (Change 5)
        _storePDFInBrain(f);
      }; r.readAsDataURL(f);
    }
    else { const r=new FileReader(); r.onload=()=>{pendingFile={type:'text',data:r.result,name:f.name};showFilePreview();}; r.readAsText(f); }
  }; inp.click();
};

// ── Store PDF in brain for permanent knowledge (Change 5) ──
async function _storePDFInBrain(file) {
  if (typeof MIND === 'undefined' || !MIND.ready) return;
  try {
    const text = await _extractPDFText(file);
    if (text && text.length > 50) {
      // Split into pages (approximate by splitting on form feeds or by chunks)
      const pages = text.split(/\f/).filter(p => p.trim().length > 10);
      if (pages.length === 0) {
        // No form feeds — split by ~2000 chars as "pages"
        const chunks = [];
        for (let i = 0; i < text.length; i += 2000) {
          chunks.push(text.slice(i, i + 2000));
        }
        await MIND.storeDocument(file.name, chunks);
      } else {
        await MIND.storeDocument(file.name, pages);
      }
      showToast(`📄 ${file.name} brain mein store ho gaya!`);
    }
  } catch (e) {
    console.log('PDF brain store error:', e);
  }
}

async function _extractPDFText(file) {
  // Simple text extraction from PDF — works for text-based PDFs
  return new Promise(resolve => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const bytes = new Uint8Array(r.result);
        let text = '';
        // Extract text between BT and ET operators (simple approach)
        const str = new TextDecoder('latin1').decode(bytes);
        const matches = str.match(/\(([^)]*)\)/g);
        if (matches) {
          text = matches.map(m => m.slice(1, -1)).join(' ');
        }
        // Clean up
        text = text.replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/[^\x20-\x7E\n\u0900-\u097F]/g, ' ').replace(/\s+/g, ' ').trim();
        resolve(text);
      } catch { resolve(''); }
    };
    r.onerror = () => resolve('');
    r.readAsArrayBuffer(file);
  });
}

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
    <div style="font-size:18px;font-weight:600;margin:12px 0 4px">Namaste${S.userName?', '+S.userName:''}!</div>
    <p style="color:var(--t3);font-size:12px;text-align:center;max-width:260px;line-height:1.6;margin-bottom:16px">Main AAKASH hoon — aapka personal AI assistant. Kuch bhi puchiye!</p>
    <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:300px">
    ${['Daily Brief','Finance Check','Habit Status','Motivate Me'].map(q =>
      `<button onclick="sendMsg('${q}')" style="padding:8px 14px;border-radius:16px;background:var(--c1);border:1.5px solid var(--b1);color:var(--t2);font-size:12px;font-weight:500">${q}</button>`).join('')}
    </div>
  </div>` :
  S.chat.map((m, idx) => {
    const isStreaming = m._streaming;
    return `<div style="display:flex;justify-content:${m.role==='user'?'flex-end':'flex-start'};margin-bottom:8px;animation:slideUp .2s">
    ${m.role==='assistant' ? `<div style="margin-right:8px;margin-top:2px">${aiAvatar(24)}</div>` : ''}
    <div style="max-width:80%">
      ${m.replyTo ? `<div style="padding:4px 8px;margin-bottom:2px;border-left:2px solid var(--ac);background:var(--acBg);border-radius:0 6px 6px 0;font-size:10px;color:var(--t3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px">${_escHtml(m.replyTo)}</div>` : ''}
      <div style="padding:10px 14px;border-radius:${m.role==='user'?'16px 16px 4px 16px':'4px 16px 16px 16px'};background:${m.role==='user'?'var(--grad)':'var(--c1)'};border:${m.role==='user'?'none':'1px solid var(--b1)'};font-size:13px;line-height:1.7;color:${m.role==='user'?'#fff':'var(--t1)'}">
        ${isStreaming ? `<div id="stream-bubble">${m.content ? fmt(m.content) : '<span style="color:var(--t3)">...</span>'}</div>` :
        m.role==='user' ? _escHtml(typeof m.content==='string'?m.content:'[File]') : fmt(m.content)}
        ${m.hasFile ? `<div style="margin-top:4px;font-size:10px;color:var(--t3);display:flex;align-items:center;gap:3px">${I.attach} File attached</div>` : ''}
        ${m.hasLinks ? `<div style="margin-top:4px;font-size:10px;color:rgba(255,255,255,.7);display:flex;align-items:center;gap:3px">${I.search} Link read</div>` : ''}
        ${m.hasGenImage ? `<div style="margin-top:6px"><img src="${m.genImageData}" style="max-width:100%;border-radius:8px;border:1px solid var(--b1)"></div>
        <button onclick="downloadFile('${m.genImageData}','aakash-image-${idx}.png')" style="margin-top:4px;padding:4px 10px;border-radius:6px;font-size:10px;font-weight:500;background:var(--acBg);color:var(--ac);border:1px solid var(--acBorder);display:inline-flex;align-items:center;gap:4px;cursor:pointer">${I.download} Download</button>` : ''}
      </div>
      ${!isStreaming ? `<div style="display:flex;gap:1px;margin-top:3px;justify-content:${m.role==='user'?'flex-end':'flex-start'}">
        <button onclick="copyMessage(${idx})" style="padding:2px 6px;border-radius:4px;font-size:9px;color:var(--t4);background:none;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:3px">${I.copy} Copy</button>
        <button onclick="setReply(${idx})" style="padding:2px 6px;border-radius:4px;font-size:9px;color:var(--t4);background:none;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:3px">${I.chat} Reply</button>
        ${m.role==='assistant' ? `<button onclick="speakMsg(this,${idx})" style="padding:2px 6px;border-radius:4px;font-size:9px;color:var(--t4);background:none;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:3px">${I.speaker} Read</button>
        <button onclick="regenerateMsg(${idx})" style="padding:2px 6px;border-radius:4px;font-size:9px;color:var(--t4);background:none;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:3px">${I.retry} Retry</button>` : `
        <button onclick="openEditBox(${idx})" style="padding:2px 6px;border-radius:4px;font-size:9px;color:var(--t4);background:none;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:3px">${I.edit} Edit</button>`}
        <button onclick="deleteMessage(${idx})" style="padding:2px 6px;border-radius:4px;font-size:9px;color:var(--t4);background:none;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:3px">${I.trash}</button>
      </div>` : ''}
    </div>
  </div>`;}).join('') + (loading && !S.chat.some(m=>m._streaming) ? `<div style="display:flex;align-items:center;gap:6px;padding:4px"><div style="margin-right:2px">${aiAvatar(24)}</div><div style="display:flex;gap:4px;align-items:center">${[0,1,2].map(i => `<div style="width:5px;height:5px;border-radius:50%;background:var(--ac);animation:dot 1s ${i*.2}s infinite"></div>`).join('')}<span style="font-size:11px;color:var(--t3);margin-left:4px">${S.thinkMode?'Deep thinking...':'Typing...'}</span></div></div>` : '')}
  </div>

  <!-- Edit Box (Change 18) -->
  <div id="editBox" style="display:none;padding:8px 12px;border-top:1px solid var(--acBorder);background:var(--acBg)">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <span style="font-size:11px;color:var(--ac);font-weight:600">${I.edit} Editing message</span>
      <div style="flex:1"></div>
      <button onclick="closeEditBox()" style="font-size:10px;color:var(--r);background:none;border:none">${I.close} Cancel</button>
    </div>
    <div style="display:flex;gap:6px;align-items:end">
      <textarea id="editInput" class="inp" rows="2" style="flex:1;resize:none;min-height:40px;max-height:80px;border-radius:10px;padding:8px 12px;font-size:13px;border:1px solid var(--acBorder)"></textarea>
      <button onclick="submitEdit()" style="width:36px;height:36px;border-radius:10px;background:var(--ac);border:none;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0">${I.check}</button>
    </div>
  </div>

  <!-- Reply Preview (Change 13) -->
  <div id="replyPreview" style="display:none;padding:6px 12px;border-top:1px solid var(--acBorder);background:var(--acBg)">
    <div style="display:flex;align-items:center;gap:8px">
      <div style="width:3px;height:24px;background:var(--ac);border-radius:2px"></div>
      <span id="replyText" style="font-size:11px;color:var(--t2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>
      <button onclick="clearReply()" style="color:var(--t4);background:none;border:none">${I.close}</button>
    </div>
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

// ── Reply/Quote (Change 13) ──
window.setReply = function(idx) {
  const m = S.chat[idx]; if (!m) return;
  const text = typeof m.content === 'string' ? m.content.slice(0, 80) : '[Content]';
  _replyTo = { idx, text };
  const preview = document.getElementById('replyPreview');
  const replyText = document.getElementById('replyText');
  if (preview) preview.style.display = 'block';
  if (replyText) replyText.textContent = (m.role === 'user' ? 'You: ' : 'AAKASH: ') + text;
  document.getElementById('ci')?.focus();
};

window.clearReply = function() {
  _replyTo = null;
  const preview = document.getElementById('replyPreview');
  if (preview) preview.style.display = 'none';
};

// ── Edit Box (Change 18) ──
window.openEditBox = function(idx) {
  const m = S.chat[idx]; if (!m || m.role !== 'user') return;
  _editIdx = idx;
  const editBox = document.getElementById('editBox');
  const editInput = document.getElementById('editInput');
  if (editBox) editBox.style.display = 'block';
  if (editInput) { editInput.value = typeof m.content === 'string' ? m.content : ''; editInput.focus(); }
};

window.closeEditBox = function() {
  _editIdx = null;
  const editBox = document.getElementById('editBox');
  if (editBox) editBox.style.display = 'none';
};

window.submitEdit = function() {
  if (_editIdx === null) return;
  const editInput = document.getElementById('editInput');
  const newText = editInput?.value?.trim();
  if (!newText) return;
  // Remove everything from edit point onwards, resend
  S.chat = S.chat.slice(0, _editIdx);
  mc = S.chat.filter(m => m.role === 'user').length;
  _editIdx = null;
  const editBox = document.getElementById('editBox');
  if (editBox) editBox.style.display = 'none';
  saveChatToHistory(); saveAll();
  rChat(document.getElementById('ct'));
  sendMsg(newText);
};

window.sendMsg = async function(text) {
  if (isDemoMode() && !text) { showToast('API key add karein for AI chat'); return; }
  const inp = document.getElementById('ci');
  const content = text || (inp ? inp.value.trim() : '');
  if ((!content && !pendingFile) || loading) return;
  if (inp) inp.value = '';

  const userMsg = { role:'user', content: content||'[File uploaded]' };
  if (pendingFile) userMsg.hasFile = true;
  if (extractUrls(content).length > 0) userMsg.hasLinks = true;
  if (_replyTo) { userMsg.replyTo = _replyTo.text; clearReply(); }

  S.chat.push(userMsg); mc++; loading = true; rChat(document.getElementById('ct'));

  // ── URL/Link Reader ──
  let urlContext = '';
  const detectedUrls = extractUrls(content);
  if (detectedUrls.length > 0) {
    const cm = document.getElementById('cm');
    if (cm) {
      const rd = document.createElement('div'); rd.id = 'urlReadingStatus';
      rd.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 14px;margin:4px 0;background:var(--acBg);border:1px solid var(--acBorder);border-radius:10px;font-size:12px;color:var(--ac);animation:fadeIn .2s';
      rd.innerHTML = `${I.search} <span style="font-weight:500">Reading ${detectedUrls.length} link${detectedUrls.length > 1 ? 's' : ''}...</span>`;
      cm.appendChild(rd); cm.scrollTop = cm.scrollHeight;
    }
    const fetchResults = await fetchAllUrls(detectedUrls);
    document.getElementById('urlReadingStatus')?.remove();
    const good = fetchResults.filter(f => f.ok);
    good.forEach(f => storeWebContent(f));
    if (good.length) showToast(`${good.length} link read — ${good.reduce((s,f)=>s+f.charCount,0).toLocaleString()} chars`);
    urlContext = buildUrlContext(fetchResults);
  }
  else if (isFollowUpAboutWeb(content)) { urlContext = buildQAContext(content); }

  let apiMessages = S.chat.slice(-20).map(m => {
    if (m===userMsg && pendingFile) {
      if (pendingFile.type==='image') return {role:'user',content:[{type:'image',source:{type:'base64',media_type:pendingFile.mime,data:pendingFile.data.split(',')[1]}},{type:'text',text:(content||'Analyze this.')+urlContext}]};
      if (pendingFile.type==='pdf') return {role:'user',content:[{type:'document',source:{type:'base64',media_type:'application/pdf',data:pendingFile.data.split(',')[1]}},{type:'text',text:(content||'Analyze this document.')+urlContext}]};
      return {role:'user',content:content+urlContext+'\n\n[File: '+pendingFile.name+']\n'+pendingFile.data};
    }
    if (m === userMsg && urlContext) return {role:m.role, content:m.content + urlContext};
    return {role:m.role,content:m.content};
  });

  // Streaming placeholder
  S.chat.push({role:'assistant', content:'', _streaming:true});
  const streamIdx = S.chat.length - 1;

  const onStream = (partialText) => {
    S.chat[streamIdx].content = partialText;
    const bubble = document.getElementById('stream-bubble');
    if (bubble) {
      bubble.innerHTML = fmt(partialText);
      const cm = document.getElementById('cm');
      if (cm) cm.scrollTop = cm.scrollHeight;
    }
  };

  const reply = await ai(apiMessages, SOUL + getContext(), onStream);
  pendingFile = null;
  const fp = document.getElementById('filePreview'); if(fp) fp.style.display='none';
  S.chat.splice(streamIdx, 1);

  // Web Reader commands
  let cleanReply = reply;
  if (reply.includes('[MAKE_PDF]')) { cleanReply = reply.replace(/\[MAKE_PDF\]/g, '').trim(); setTimeout(() => showPDFNamePrompt(), 500); }
  if (reply.includes('[SAVE_NOTES]')) { cleanReply = cleanReply.replace(/\[SAVE_NOTES\]/g, '').trim(); saveWebTo('notes'); }
  if (reply.includes('[SAVE_VAULT]')) { cleanReply = cleanReply.replace(/\[SAVE_VAULT\]/g, '').trim(); saveWebTo('vault'); }
  if (reply.includes('[SAVE_TASK]')) { cleanReply = cleanReply.replace(/\[SAVE_TASK\]/g, '').trim(); saveWebTo('task'); }
  if (reply.includes('[DELETE_NOTES]')) { cleanReply = cleanReply.replace(/\[DELETE_NOTES\]/g, '').trim(); deleteWebFrom('notes'); }
  if (reply.includes('[DELETE_VAULT]')) { cleanReply = cleanReply.replace(/\[DELETE_VAULT\]/g, '').trim(); deleteWebFrom('vault'); }

  const imgMatch = cleanReply.match(/\[GENERATE_IMAGE:\s*(.+?)\]/i);
  if (imgMatch && hasCap('image_gen')) {
    const imgPrompt = imgMatch[1].trim();
    const textPart = cleanReply.replace(/\[GENERATE_IMAGE:\s*.+?\]/i,'').trim();
    if (textPart) S.chat.push({role:'assistant',content:textPart});
    const imgResult = await generateImage(imgPrompt);
    if (imgResult.ok && imgResult.images?.length) {
      S.chat.push({role:'assistant',content:'Image ready!',hasGenImage:true,genImageData:`data:${imgResult.images[0].mime};base64,${imgResult.images[0].data}`,genPrompt:imgPrompt});
    } else { S.chat.push({role:'assistant',content:'Image generate nahi ho payi. Dobara try karein.'}); }
  } else { S.chat.push({role:'assistant',content:cleanReply}); }

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
window.editMessage = function(idx) { openEditBox(idx); };
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

window.downloadFile = function(dataUrl, filename) {
  const defaultName = filename || 'aakash-download';
  const newName = prompt('File name set karein:', defaultName);
  if (!newName) { showToast('Cancelled'); return; }
  const a = document.createElement('a'); a.href = dataUrl; a.download = newName;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  showToast('Downloading...');
};

// ── Export Chat as PDF ──
window.exportChatPDF = function() {
  if (S.chat.length === 0) { showToast('No chat to export'); return; }
  const chatTitle = S.chats.find(c => c.id === S.activeChat)?.title || 'Chat';
  const dateStr = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });

  let objs = [], xrefs = [];
  const addObj = (content) => { objs.push(content); return objs.length; };
  addObj('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  addObj('');
  addObj('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
  addObj('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj');

  const pageW = 595, pageH = 842, mx = 50, lineH = 14, fontSize = 10, smallFont = 8;
  let pages = [], currentStream = '', cy = pageH - 50;

  function newPage() { if (currentStream) pages.push(currentStream); currentStream = ''; cy = pageH - 50; }
  function checkSpace(need) { if (cy - need < 60) newPage(); }
  function escPdf(str) { return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
  function wrapText(text, maxChars) { const words = text.split(/\s+/); const lines = []; let line = ''; words.forEach(w => { if ((line + ' ' + w).length > maxChars) { if (line) lines.push(line); line = w; } else line = line ? line + ' ' + w : w; }); if (line) lines.push(line); return lines; }
  function addText(text, x, size, bold, r, g, b) { currentStream += `BT ${bold ? '/F2' : '/F1'} ${size} Tf ${r||0} ${g||0} ${b||0} rg ${x} ${cy} Td (${escPdf(text)}) Tj ET\n`; }

  currentStream += `0.067 0.067 0.067 rg ${0} ${pageH - 40} ${pageW} ${40} re f\n`;
  currentStream += `BT /F2 16 Tf 1 1 1 rg ${pageW/2 - 40} ${pageH - 22} Td (AAKASH AI) Tj ET\n`;
  currentStream += `BT /F1 7 Tf 0.8 0.8 0.8 rg ${pageW/2 - 38} ${pageH - 32} Td (CHAT EXPORT  |  ${escPdf(dateStr)}) Tj ET\n`;
  cy = pageH - 65;
  addText(chatTitle, mx, 9, false, 0.4, 0.4, 0.4); cy -= 20;

  S.chat.filter(m => !m._streaming).forEach(m => {
    const isUser = m.role === 'user';
    const content = typeof m.content === 'string' ? m.content : '[File content]';
    const clean = content.replace(/[*#`]/g, '').replace(/```[\s\S]*?```/g, '[code block]').trim();
    const label = isUser ? 'You' : 'AAKASH';
    const lines = wrapText(clean, 85);
    checkSpace((lines.length + 1) * lineH + 10);
    addText(label, mx, smallFont, true, isUser ? 0.4 : 0.07, isUser ? 0.4 : 0.07, isUser ? 0.4 : 0.07); cy -= lineH;
    lines.forEach(line => { checkSpace(lineH); addText(line, mx + 5, fontSize, false, 0.2, 0.2, 0.2); cy -= lineH; });
    cy -= 8;
  });
  if (currentStream) pages.push(currentStream);

  const pageObjIds = [];
  pages.forEach((stream, i) => {
    stream += `BT /F1 7 Tf 0.65 0.65 0.65 rg ${pageW/2 - 60} 30 Td (AAKASH AI  |  ${escPdf(dateStr)}  |  Page ${i+1}/${pages.length}) Tj ET\n`;
    const streamId = addObj(`${objs.length + 1} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj`);
    const pageId = addObj(`${objs.length + 1} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents ${streamId} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>\nendobj`);
    pageObjIds.push(pageId);
  });
  objs[1] = `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>\nendobj`;

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach(obj => { offsets.push(pdf.length); pdf += obj + '\n'; });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach(off => { pdf += String(off).padStart(10, '0') + ' 00000 n \n'; });
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const defaultName = `AAKASH-Chat-${td()}`;
  const fileName = prompt('File name set karein:', defaultName);
  if (!fileName) { showToast('Cancelled'); return; }
  const finalName = fileName.endsWith('.pdf') ? fileName : fileName + '.pdf';
  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = finalName;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('PDF downloaded!');
};
