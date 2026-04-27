// ════════════════════════════════════
//  AAKASH AI v2 — Notes (notes.js)
// ════════════════════════════════════

const FL = ['Course Notes','Work Notes','Personal','AI/ML','Python','Business','Finance','Travel','Health','General'];
let nm = 'list', en = null, vn = null, na = '';

function rNotes(ct) {
  if (nm==='edit') { rNE(ct); return; }
  if (nm==='view') { rNV(ct); return; }
  if (nm==='chat') { rNotesChat(ct); return; }
  ct.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;padding:8px 12px;min-height:0">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-shrink:0">
    <div style="font-size:15px;font-weight:600">Notes</div>
    <div style="display:flex;gap:4px">
      <button onclick="nm='chat';rNotes(document.getElementById('ct'))" class="btn bs" style="padding:6px 12px;font-size:11px;gap:4px">${I.star} Teacher</button>
      <button onclick="uploadNote()" class="btn bs" style="padding:6px 12px;font-size:11px;gap:4px">${I.upload} Upload</button>
      <button onclick="en={title:'',content:'',folder:'General'};nm='edit';rNotes(document.getElementById('ct'))" class="btn bp" style="padding:6px 12px;font-size:11px;gap:4px">${I.plus} New</button>
    </div>
  </div>
  <div style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:6px">
  ${!S.notes.length ? `<div style="text-align:center;padding:30px;color:var(--t4)">
    <div style="margin-bottom:8px">${icon('notes',36)}</div>
    <div style="font-size:13px;margin-bottom:4px">No notes yet</div>
    <div style="font-size:11px;line-height:1.6">Upload or create notes. AI will teach you!</div>
  </div>` :
  S.notes.map(n => `<div class="cd" style="cursor:pointer" onclick="vn=S.notes.find(x=>x.id===${n.id});na='';nm='view';rNotes(document.getElementById('ct'))">
    <div style="display:flex;justify-content:space-between;align-items:start">
      <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:500">${n.title}</div>
      <div style="font-size:10px;color:var(--ac);margin-top:2px;font-weight:500">${n.folder}${n.uploaded?' · Uploaded':''}</div>
      <div style="font-size:12px;color:var(--t3);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${(n.content||'').slice(0,70)}</div></div>
      <button onclick="event.stopPropagation();if(confirm('Delete?')){S.notes=S.notes.filter(x=>x.id!==${n.id});saveAll();rNotes(document.getElementById('ct'))}" style="color:var(--t4);flex-shrink:0">${I.trash}</button>
    </div>
  </div>`).join('')}
  </div></div>`;
}

window.uploadNote = function() {
  const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*,.pdf,.txt,.md,.doc,.docx';
  inp.onchange = async e => {
    const f = e.target.files[0]; if(!f) return;
    const title = f.name.replace(/\.[^.]+$/,'');
    if (f.type.startsWith('image/')) {
      const r=new FileReader(); r.onload=()=>{S.notes.unshift({id:Date.now(),title,content:'[Image note]',folder:'Course Notes',uploaded:true,fileData:r.result,fileType:'image',fileMime:f.type,createdAt:new Date().toISOString()});saveAll();rNotes(document.getElementById('ct'));}; r.readAsDataURL(f);
    } else if (f.type==='application/pdf') {
      const r=new FileReader(); r.onload=()=>{S.notes.unshift({id:Date.now(),title,content:'[PDF note]',folder:'Course Notes',uploaded:true,fileData:r.result,fileType:'pdf',fileMime:'application/pdf',createdAt:new Date().toISOString()});saveAll();rNotes(document.getElementById('ct'));}; r.readAsDataURL(f);
    } else {
      const r=new FileReader(); r.onload=()=>{S.notes.unshift({id:Date.now(),title,content:r.result,folder:'Course Notes',uploaded:true,fileType:'text',createdAt:new Date().toISOString()});saveAll();rNotes(document.getElementById('ct'));}; r.readAsText(f);
    }
  }; inp.click();
};

function rNE(ct) {
  const n=en;
  ct.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;padding:8px 12px;gap:8px;overflow-y:auto">
  <div style="font-size:15px;font-weight:600">${n.id?'Edit':'New'} note</div>
  <input id="nT" class="inp" placeholder="Title" value="${n.title||''}" style="font-weight:500;font-size:15px">
  <div style="display:flex;gap:4px;flex-wrap:wrap">${FL.map(f => `<button onclick="en.folder='${f}';rNE(document.getElementById('ct'))" style="padding:5px 12px;border-radius:16px;background:${n.folder===f?'var(--acBg2)':'var(--c2)'};border:1px solid ${n.folder===f?'var(--acBorder)':'var(--b1)'};color:${n.folder===f?'var(--ac)':'var(--t3)'};font-size:10px;font-weight:500">${f}</button>`).join('')}</div>
  <textarea id="nB" class="inp" placeholder="Write..." style="min-height:200px;resize:vertical;font-family:JetBrains Mono,monospace;font-size:13px;line-height:1.7">${n.content||''}</textarea>
  <div style="display:flex;gap:8px"><button onclick="en.title=document.getElementById('nT').value.trim()||'Untitled';en.content=document.getElementById('nB').value;en.updatedAt=new Date().toISOString();if(!en.id){en.id=Date.now();en.createdAt=en.updatedAt;S.notes.unshift(en)}else{const i=S.notes.findIndex(x=>x.id===en.id);if(i>=0)S.notes[i]=en}saveAll();nm='list';en=null;rNotes(document.getElementById('ct'))" class="btn bp" style="flex:1;padding:12px;font-size:14px">Save</button>
  <button onclick="nm='list';en=null;rNotes(document.getElementById('ct'))" class="btn bs" style="padding:12px 18px">Cancel</button></div></div>`;
}

function rNV(ct) {
  const n=vn;
  ct.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;min-height:0">
  <div style="padding:10px 12px;border-bottom:1px solid var(--b1);display:flex;justify-content:space-between;align-items:center;flex-shrink:0;background:var(--c1)">
    <div><div style="font-size:14px;font-weight:600">${n.title}</div><div style="font-size:10px;color:var(--ac);font-weight:500">${n.folder}</div></div>
    <div style="display:flex;gap:4px">
      ${!n.uploaded?`<button onclick="en={...vn};nm='edit';rNotes(document.getElementById('ct'))" class="btn bs" style="padding:5px 10px;font-size:11px;gap:4px">${I.edit} Edit</button>`:''}
      <button onclick="nm='list';vn=null;na='';rNotes(document.getElementById('ct'))" class="btn bs" style="padding:5px 10px;font-size:11px">${I.close}</button>
    </div>
  </div>
  <div style="flex:1;overflow-y:auto;padding:12px;background:var(--bg)">
    ${n.fileType==='image'&&n.fileData?`<img src="${n.fileData}" style="max-width:100%;border-radius:8px;border:1px solid var(--b1);margin-bottom:10px">`:''}
    ${n.content&&!n.content.startsWith('[')?`<pre style="color:var(--t2);font-size:13px;font-family:JetBrains Mono,monospace;white-space:pre-wrap;line-height:1.7;margin-bottom:10px">${n.content}</pre>`:''}
    ${na?`<div class="cd" style="border-left:3px solid var(--ac);border-radius:0"><div style="font-size:10px;color:var(--ac);font-weight:600;margin-bottom:4px;display:flex;align-items:center;gap:4px">${I.star} AI Teacher</div><div style="font-size:13px;color:var(--t2);line-height:1.6">${fmt(na)}</div></div>`:''}
  </div>
  <div style="padding:8px 12px;border-top:1px solid var(--b1);background:var(--c1);flex-shrink:0">
    <div style="display:flex;gap:4px;margin-bottom:6px;flex-wrap:wrap">
      ${['Samjhao','Quiz me','Summary','Doubt hai'].map(q => `<button onclick="askNote('${q}')" style="padding:5px 10px;border-radius:14px;background:var(--c2);border:1px solid var(--b1);color:var(--t2);font-size:10px;font-weight:500">${q}</button>`).join('')}
    </div>
    <div style="display:flex;gap:6px"><input id="nQ" class="inp" placeholder="Ask about this note..." onkeydown="if(event.key==='Enter')askNote()" style="border-radius:10px;font-size:13px">
    <button onclick="askNote()" id="nAB" class="btn bp" style="flex-shrink:0;border-radius:10px;padding:8px 14px;gap:4px">${I.send}</button></div>
  </div></div>`;
}

window.askNote = async function(preset) {
  if (isDemoMode()) { showToast('API key add karo'); return; }
  const q = preset || document.getElementById('nQ')?.value?.trim();
  if (!q || !vn) return;
  const btn = document.getElementById('nAB'); if(btn) btn.textContent='...';
  let msgContent;
  if (vn.fileType==='image'&&vn.fileData) { msgContent=[{type:'image',source:{type:'base64',media_type:vn.fileMime,data:vn.fileData.split(',')[1]}},{type:'text',text:`Note:"${vn.title}"\nQ:${q}\nTeacher mode: Hinglish. Examples. "koi doubt?" at end.`}]; }
  else if (vn.fileType==='pdf'&&vn.fileData) { msgContent=[{type:'document',source:{type:'base64',media_type:'application/pdf',data:vn.fileData.split(',')[1]}},{type:'text',text:`Note:"${vn.title}"\nQ:${q}\nTeacher mode.`}]; }
  else { msgContent=`Note "${vn.title}":\n${vn.content}\n\nQ:${q}\n\nTeacher mode.`; }
  na = await ai([{role:'user',content:msgContent}], SOUL+'\nPatient teacher. Hinglish. Break into steps. Examples. Ask "koi doubt?"');
  rNV(document.getElementById('ct'));
};

function rNotesChat(ct) {
  ct.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;min-height:0">
    <div style="padding:8px 12px;border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:8px;flex-shrink:0;background:var(--c1)">
      <button onclick="nm='list';rNotes(document.getElementById('ct'))" style="color:var(--t3)">${I.back}</button>
      <div style="font-size:14px;font-weight:600">AI Teacher</div>
    </div>
    <div id="notesChatWrap" style="flex:1;display:flex;flex-direction:column;min-height:0"></div>
  </div>`;
  const w=document.getElementById('notesChatWrap'); if(w) renderEmbeddedChat('notes',w);
}

window.renderSecChat_notes = function() { if(nm==='chat'){const w=document.getElementById('notesChatWrap');if(w)renderEmbeddedChat('notes',w);} };
