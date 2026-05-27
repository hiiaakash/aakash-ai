// ════════════════════════════════════
//  AAKASH AI v3 — Files Manager (files-manager.js)
//  View all uploaded files, delete, brain status
//  Change 29: Full implementation
// ════════════════════════════════════

window.openFilesManager = function() {
  const ov = document.createElement('div');
  ov.id = 'filesPage';
  ov.style.cssText = 'position:fixed;inset:0;z-index:100;background:var(--bg);display:flex;flex-direction:column;animation:fadeIn .15s;max-width:480px;margin:0 auto';
  document.body.appendChild(ov);
  _renderFilesManager();
};

async function _renderFilesManager() {
  const pg = document.getElementById('filesPage');
  if (!pg) return;

  const files = S.uploadedFiles || [];

  // Also get brain-stored documents
  let brainFiles = [];
  if (typeof MIND !== 'undefined' && MIND.ready) {
    brainFiles = await MIND.getUploadedFiles();
  }

  // Merge — brain files that aren't in uploadedFiles
  const allFiles = [...files];
  brainFiles.forEach(bf => {
    if (!allFiles.find(f => f.name === bf.name)) {
      allFiles.push({ id: Date.now() + Math.random(), name: bf.name, type: 'pdf', pages: bf.pages, uploadedAt: new Date(bf.storedAt).toISOString(), brainStored: true });
    }
  });

  const totalSize = allFiles.length;

  pg.innerHTML = `
  <div style="padding:12px 16px;border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:10px;background:var(--c1);flex-shrink:0">
    <button onclick="document.getElementById('filesPage').remove()" style="color:var(--t3)">${I.back}</button>
    <div style="font-size:16px;font-weight:600;flex:1">Files</div>
    <span class="tag" style="background:var(--acBg);color:var(--ac)">${totalSize} files</span>
  </div>
  <div style="flex:1;overflow-y:auto;padding:12px">
    ${allFiles.length === 0 ? `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--t4)">
      <div style="font-size:40px;margin-bottom:12px">📁</div>
      <div style="font-size:14px;font-weight:500">No files yet</div>
      <div style="font-size:12px;color:var(--t4);margin-top:4px">Chat mein PDF ya images upload karein</div>
    </div>` :
    `<div style="display:flex;flex-direction:column;gap:6px">
    ${allFiles.sort((a,b) => new Date(b.uploadedAt||0) - new Date(a.uploadedAt||0)).map(f => {
      const ext = (f.name||'').split('.').pop().toLowerCase();
      const icon = ext === 'pdf' ? '📄' : ext === 'jpg' || ext === 'jpeg' || ext === 'png' ? '🖼️' : ext === 'xlsx' || ext === 'csv' ? '📊' : '📁';
      return `<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--c1);border:1px solid var(--b1);border-radius:10px">
        <div style="font-size:28px;flex-shrink:0">${icon}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.name}</div>
          <div style="display:flex;gap:6px;margin-top:3px;flex-wrap:wrap">
            <span style="font-size:10px;color:var(--t4)">${f.uploadedAt ? new Date(f.uploadedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : '?'}</span>
            ${f.pages ? `<span style="font-size:10px;color:var(--t4)">${f.pages} pages</span>` : ''}
            ${f.brainStored ? `<span style="padding:1px 6px;border-radius:4px;font-size:9px;background:var(--gBg);color:var(--g)">🧠 Brain</span>` : `<span style="padding:1px 6px;border-radius:4px;font-size:9px;background:var(--bg);color:var(--t4)">Local</span>`}
          </div>
        </div>
        <button onclick="_deleteFile('${f.name.replace(/'/g,"\\'")}')" style="padding:6px;border-radius:6px;background:var(--rBg);border:1px solid var(--rBorder);color:var(--r);flex-shrink:0">${I.trash}</button>
      </div>`;
    }).join('')}
    </div>`}
  </div>`;
}

window._deleteFile = async function(fileName) {
  if (!confirm(`"${fileName}" delete karein? Brain se bhi hata dega.`)) return;

  // Remove from uploadedFiles
  S.uploadedFiles = (S.uploadedFiles || []).filter(f => f.name !== fileName);
  await saveAll();

  // Remove from brain
  if (typeof MIND !== 'undefined' && MIND.ready) {
    await MIND.deleteDocument(fileName);
  }

  showToast('File deleted');
  _renderFilesManager();
};
