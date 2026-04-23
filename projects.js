// ════════════════════════════════════
//  AAKASH AI — Projects (projects.js)
//  Project-based chat organization
// ════════════════════════════════════

window.openProjects = function() {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:100;display:flex;animation:fadeIn .2s';
  ov.innerHTML = `
  <div style="width:300px;height:100%;background:var(--c1);border-right:1px solid var(--b1);display:flex;flex-direction:column;box-shadow:var(--shadowLg)">
    <div style="padding:16px;border-bottom:1px solid var(--b1);display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:16px;font-weight:700">📂 Projects</div>
      <button onclick="this.closest('div[style*=fixed]').remove()" style="font-size:18px;color:var(--t3);padding:4px">✕</button>
    </div>

    <!-- All Chats (no project) -->
    <div style="padding:10px 12px">
      <div onclick="switchProject(null);this.closest('div[style*=fixed]').remove();render()" style="padding:12px 14px;border-radius:10px;cursor:pointer;background:${!S.activeProject ? 'var(--acBg2)' : 'var(--c2)'};border:1px solid ${!S.activeProject ? 'var(--acBorder)' : 'var(--b1)'};margin-bottom:6px">
        <div style="font-size:14px;font-weight:600;color:${!S.activeProject ? 'var(--ac)' : 'var(--t1)'}">💬 All Chats</div>
        <div style="font-size:12px;color:var(--t4);margin-top:2px">${S.chats.filter(c => !c.projectId).length} chats</div>
      </div>
    </div>

    <!-- Projects List -->
    <div style="flex:1;overflow-y:auto;padding:0 12px">
      ${S.projects.length === 0 ? '<div style="text-align:center;padding:20px;color:var(--t4);font-size:13px">No projects yet. Create one!</div>' :
      S.projects.map(p => `
        <div style="padding:12px 14px;border-radius:10px;margin-bottom:6px;cursor:pointer;background:${S.activeProject === p.id ? 'var(--acBg2)' : 'var(--c2)'};border:1px solid ${S.activeProject === p.id ? 'var(--acBorder)' : 'var(--b1)'}" onclick="switchProject(${p.id});this.closest('div[style*=fixed]').remove();render()">
          <div style="display:flex;justify-content:space-between;align-items:start">
            <div style="flex:1">
              <div style="font-size:14px;font-weight:600;color:${S.activeProject === p.id ? 'var(--ac)' : 'var(--t1)'}">📁 ${p.name}</div>
              ${p.description ? `<div style="font-size:12px;color:var(--t3);margin-top:2px">${p.description.slice(0, 50)}</div>` : ''}
              <div style="font-size:11px;color:var(--t4);margin-top:4px">${getChatsByProject(p.id).length} chats · ${new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
            </div>
            <button onclick="event.stopPropagation();if(confirm('Delete project? Chats will move to All Chats.')){deleteProject(${p.id});this.closest('div[style*=fixed]').remove();openProjects()}" style="font-size:12px;color:var(--r);padding:2px 6px;background:var(--rBg);border-radius:4px;border:none;flex-shrink:0">✕</button>
          </div>
        </div>`).join('')}
    </div>

    <!-- Create New Project -->
    <div style="padding:12px;border-top:1px solid var(--b1)">
      <div style="font-size:12px;color:var(--t3);font-weight:600;margin-bottom:6px">New Project</div>
      <input id="projName" class="inp" placeholder="Project name..." style="font-size:14px;margin-bottom:6px">
      <input id="projDesc" class="inp" placeholder="Description (optional)" style="font-size:13px;margin-bottom:8px">
      <button onclick="const n=document.getElementById('projName').value.trim();if(n){createProject(n,document.getElementById('projDesc').value.trim());this.closest('div[style*=fixed]').remove();render()}" class="btn bp" style="width:100%;padding:10px;font-size:14px">Create Project</button>
    </div>
  </div>
  <div onclick="this.closest('div[style*=fixed]').remove()" style="flex:1;background:var(--overlay)"></div>`;
  document.body.appendChild(ov);
};
