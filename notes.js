// ════════════════════════════════════
//  AAKASH AI — Notes (notes.js)
//  Notes + File upload + AI Teacher
// ════════════════════════════════════

const FL = ['Course Notes', 'Work Notes', 'Personal', 'AI/ML', 'Python', 'Business', 'Finance', 'General'];
let nm = 'list', en = null, vn = null, na = '';

function rNotes(ct) {
  if (nm === 'edit') { rNE(ct); return; }
  if (nm === 'view') { rNV(ct); return; }
  ct.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;padding:10px 16px;min-height:0">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-shrink:0">
    <div style="font-size:17px;font-weight:700">📝 Notes</div>
    <div style="display:flex;gap:6px">
      <button onclick="uploadNote()" class="btn bs" style="padding:8px 14px;font-size:13px">📎 Upload</button>
      <button onclick="en={title:'',content:'',folder:'General'};nm='edit';rNotes(document.getElementById('ct'))" class="btn bp" style="padding:8px 14px;font-size:13px">+ New</button>
    </div>
  </div>
  <div style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px">
  ${!S.notes.length ? `<div style="text-align:center;padding:40px;color:var(--t4)">
    <div style="font-size:40px;margin-bottom:12px">📚</div>
    <div style="font-size:15px;margin-bottom:8px">No notes yet</div>
    <div style="font-size:13px;line-height:1.7">Upload notes (image/PDF/text) ya manually banao.<br>AAKASH AI teacher ki tarah samjhayega!</div>
  </div>` :
  S.notes.map(n => `<div class="cd" style="cursor:pointer" onclick="vn=S.notes.find(x=>x.id===${n.id});na='';nm='view';rNotes(document.getElementById('ct'))">
    <div style="display:flex;justify-content:space-between;align-items:start">
      <div style="flex:1"><div style="font-size:15px;font-weight:600">${n.title}</div>
      <div style="font-size:12px;color:var(--ac);margin-top:2px;font-weight:500">${n.folder}${n.uploaded ? ' · 📎 Uploaded' : ''}</div>
      <div style="font-size:14px;color:var(--t3);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${(n.content || '').slice(0, 80)}</div></div>
      <button onclick="event.stopPropagation();if(confirm('Delete this note?')){S.notes=S.notes.filter(x=>x.id!==${n.id});saveAll();rNotes(document.getElementById('ct'))}" style="color:var(--t4);font-size:16px;padding:4px;flex-shrink:0">✕</button>
    </div>
  </div>`).join('')}
  </div></div>`;
}

window.uploadNote = function() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*,.pdf,.txt,.md,.doc,.docx';
  inp.onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    const title = f.name.replace(/\.[^.]+$/, '');
    if (f.type.startsWith('image/')) {
      const reader = new FileReader(); reader.onload = () => {
        S.notes.unshift({ id: Date.now(), title, content: '[Image note — use "Ask AI" to analyze]', folder: 'Course Notes', uploaded: true, fileData: reader.result, fileType: 'image', fileMime: f.type, createdAt: new Date().toISOString() });
        saveAll(); rNotes(document.getElementById('ct'));
      }; reader.readAsDataURL(f);
    } else if (f.type === 'application/pdf') {
      const reader = new FileReader(); reader.onload = () => {
        S.notes.unshift({ id: Date.now(), title, content: '[PDF note — use "Ask AI" to analyze]', folder: 'Course Notes', uploaded: true, fileData: reader.result, fileType: 'pdf', fileMime: 'application/pdf', createdAt: new Date().toISOString() });
        saveAll(); rNotes(document.getElementById('ct'));
      }; reader.readAsDataURL(f);
    } else {
      const reader = new FileReader(); reader.onload = () => {
        S.notes.unshift({ id: Date.now(), title, content: reader.result, folder: 'Course Notes', uploaded: true, fileType: 'text', createdAt: new Date().toISOString() });
        saveAll(); rNotes(document.getElementById('ct'));
      }; reader.readAsText(f);
    }
  }; inp.click();
};

function rNE(ct) {
  const n = en;
  ct.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;padding:10px 16px;gap:10px;overflow-y:auto">
  <div style="font-size:17px;font-weight:700">${n.id ? 'Edit' : 'New'} Note</div>
  <input id="nT" class="inp" placeholder="Title" value="${n.title || ''}" style="font-weight:600;font-size:16px">
  <div style="display:flex;gap:6px;flex-wrap:wrap">${FL.map(f => `<button onclick="en.folder='${f}';rNE(document.getElementById('ct'))" style="padding:6px 14px;border-radius:24px;background:${n.folder === f ? 'var(--acBg2)' : 'var(--c1)'};border:1.5px solid ${n.folder === f ? 'var(--acBorder)' : 'var(--b1)'};color:${n.folder === f ? 'var(--ac)' : 'var(--t3)'};font-size:13px;font-weight:600">${f}</button>`).join('')}</div>
  <textarea id="nB" class="inp" placeholder="Write notes..." style="min-height:220px;resize:vertical;font-family:IBM Plex Mono,monospace;font-size:14px;line-height:1.8">${n.content || ''}</textarea>
  <div style="display:flex;gap:10px"><button onclick="en.title=document.getElementById('nT').value.trim()||'Untitled';en.content=document.getElementById('nB').value;en.updatedAt=new Date().toISOString();if(!en.id){en.id=Date.now();en.createdAt=en.updatedAt;S.notes.unshift(en)}else{const i=S.notes.findIndex(x=>x.id===en.id);if(i>=0)S.notes[i]=en}saveAll();nm='list';en=null;rNotes(document.getElementById('ct'))" class="btn bp" style="flex:1;padding:14px;font-size:15px">Save</button>
  <button onclick="nm='list';en=null;rNotes(document.getElementById('ct'))" class="btn bs" style="padding:14px 20px">Cancel</button></div></div>`;
}

function rNV(ct) {
  const n = vn;
  ct.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;min-height:0">
  <div style="padding:14px 16px;border-bottom:1px solid var(--b1);display:flex;justify-content:space-between;align-items:center;flex-shrink:0;background:var(--c1)">
    <div><div style="font-size:17px;font-weight:700">${n.title}</div><div style="font-size:12px;color:var(--ac);font-weight:500">${n.folder}${n.uploaded ? ' · 📎' : ''}</div></div>
    <div style="display:flex;gap:6px">
      ${!n.uploaded ? `<button onclick="en={...vn};nm='edit';rNotes(document.getElementById('ct'))" class="btn bs" style="padding:6px 12px;font-size:13px">Edit</button>` : ''}
      <button onclick="nm='list';vn=null;na='';rNotes(document.getElementById('ct'))" class="btn bs" style="padding:6px 12px;font-size:13px">Close</button>
    </div>
  </div>
  <div style="flex:1;overflow-y:auto;padding:16px;background:var(--bg)">
    ${n.fileType === 'image' && n.fileData ? `<img src="${n.fileData}" style="max-width:100%;border-radius:8px;border:1px solid var(--b1);margin-bottom:12px">` :
    n.fileType === 'pdf' ? `<div style="padding:20px;background:var(--c1);border-radius:8px;border:1px solid var(--b1);text-align:center;margin-bottom:12px"><div style="font-size:40px;margin-bottom:8px">📄</div><div style="font-size:14px;color:var(--t2)">PDF Document</div><div style="font-size:12px;color:var(--t3)">Use "Ask AI" below to analyze</div></div>` : ''}
    ${n.content && !n.content.startsWith('[') ? `<pre style="color:var(--t2);font-size:14px;font-family:IBM Plex Mono,monospace;white-space:pre-wrap;line-height:1.8;margin-bottom:14px">${n.content}</pre>` : ''}
    ${na ? `<div class="cd" style="border-left:3px solid var(--ac);margin-bottom:10px"><div style="font-size:12px;color:var(--ac);font-weight:700;margin-bottom:6px">🎓 AAKASH Teacher</div><div style="font-size:14px;color:var(--t2);line-height:1.7">${fmt(na)}</div></div>` : ''}
  </div>
  <div style="padding:10px 16px;border-top:1px solid var(--b1);background:var(--c1);flex-shrink:0">
    <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">
      ${['📖 Samjhao', '❓ Quiz me', '📝 Summary', '🤔 Doubt hai'].map(q => `<button onclick="askNote('${q}')" style="padding:6px 12px;border-radius:20px;background:var(--c2);border:1px solid var(--b1);color:var(--t2);font-size:12px;font-weight:500">${q}</button>`).join('')}
    </div>
    <div style="display:flex;gap:8px">
      <input id="nQ" class="inp" placeholder="Ask about this note..." onkeydown="if(event.key==='Enter')askNote()" style="border-radius:12px">
      <button onclick="askNote()" id="nAB" class="btn bp" style="flex-shrink:0;border-radius:12px;padding:10px 16px">Ask</button>
    </div>
  </div></div>`;
}

window.askNote = async function(preset) {
  const q = preset || document.getElementById('nQ')?.value?.trim();
  if (!q || !vn) return;
  const btn = document.getElementById('nAB'); if (btn) btn.textContent = '...';

  let msgContent;
  if (vn.fileType === 'image' && vn.fileData) {
    msgContent = [{ type: 'image', source: { type: 'base64', media_type: vn.fileMime, data: vn.fileData.split(',')[1] } }, { type: 'text', text: `Note: "${vn.title}"\n\nUser question: ${q}\n\nTeacher mode: Explain in simple Hinglish. Give examples. Ask "koi doubt?" at end.` }];
  } else if (vn.fileType === 'pdf' && vn.fileData) {
    msgContent = [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: vn.fileData.split(',')[1] } }, { type: 'text', text: `Note: "${vn.title}"\n\nUser question: ${q}\n\nTeacher mode: Explain in simple Hinglish. Give examples. Ask "koi doubt?" at end.` }];
  } else {
    msgContent = `Note "${vn.title}":\n${vn.content}\n\nQ: ${q}\n\nTeacher mode: Explain simply in Hinglish. Real examples. Ask "koi doubt?" at end.`;
  }

  na = await ai([{ role: 'user', content: msgContent }], SOUL + '\nYou are a patient teacher/tutor. Explain topics from the uploaded note simply. Use Hinglish. Break complex things into steps. Give examples. After explaining, always ask "Koi doubt hai?" to check understanding.');
  rNV(document.getElementById('ct'));
};
