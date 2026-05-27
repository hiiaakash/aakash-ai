// ════════════════════════════════════
//  AAKASH AI v3 — Admin Dashboard (admin.js)
//  User tracking, location, stats, broadcast
//  Change 19: Full implementation
// ════════════════════════════════════

let _adminView = 'main';
let _adminUsers = [];

window.openAdminDashboard = async function() {
  if (!S.isAdmin) { showToast('Admin access required'); return; }

  const ov = document.createElement('div');
  ov.id = 'adminPage';
  ov.style.cssText = 'position:fixed;inset:0;z-index:100;background:var(--bg);display:flex;flex-direction:column;animation:fadeIn .15s;max-width:480px;margin:0 auto';
  document.body.appendChild(ov);

  _adminView = 'main';
  await _loadAdminData();
  _renderAdmin();
};

async function _loadAdminData() {
  if (typeof FIRE !== 'undefined' && FIRE.ready) {
    _adminUsers = await FIRE.getAllUsers();
  }
}

function _renderAdmin() {
  const pg = document.getElementById('adminPage');
  if (!pg) return;

  if (_adminView === 'main') {
    const totalUsers = _adminUsers.length;
    const activeToday = _adminUsers.filter(u => {
      if (!u.lastActive) return false;
      return new Date(u.lastActive).toDateString() === new Date().toDateString();
    }).length;

    pg.innerHTML = `
    <div style="padding:12px 16px;border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:10px;background:var(--c1);flex-shrink:0">
      <button onclick="document.getElementById('adminPage').remove()" style="color:var(--t3)">${I.back}</button>
      <div style="font-size:16px;font-weight:600;flex:1">Admin Dashboard</div>
      <button onclick="_loadAdminData().then(()=>_renderAdmin())" style="padding:4px 10px;border-radius:6px;font-size:10px;background:var(--c2);border:1px solid var(--b1);color:var(--t3)">${I.retry||'↻'} Refresh</button>
    </div>
    <div style="flex:1;overflow-y:auto;background:var(--bg)">

      <!-- Stats Cards -->
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:12px">
        <div style="padding:16px;background:var(--c1);border-radius:12px;border:1px solid var(--b1);text-align:center">
          <div style="font-size:28px;font-weight:700;color:var(--ac)">${totalUsers}</div>
          <div style="font-size:11px;color:var(--t4);margin-top:2px">Total Users</div>
        </div>
        <div style="padding:16px;background:var(--c1);border-radius:12px;border:1px solid var(--b1);text-align:center">
          <div style="font-size:28px;font-weight:700;color:var(--g)">${activeToday}</div>
          <div style="font-size:11px;color:var(--t4);margin-top:2px">Active Today</div>
        </div>
      </div>

      <!-- Broadcast -->
      <div style="padding:0 12px 12px">
        <div style="padding:12px;background:var(--c1);border-radius:12px;border:1px solid var(--b1)">
          <div style="font-size:12px;font-weight:600;margin-bottom:8px">Broadcast Message</div>
          <div style="display:flex;gap:6px">
            <input id="broadcastMsg" class="inp" placeholder="Message to all users..." style="font-size:12px;flex:1">
            <button onclick="_sendBroadcast()" class="btn bp" style="padding:8px 14px;font-size:12px;flex-shrink:0">Send</button>
          </div>
        </div>
      </div>

      <!-- Users List -->
      <div style="padding:0 12px 4px"><div style="font-size:10px;font-weight:600;color:var(--t4);text-transform:uppercase;letter-spacing:.7px">All Users (${totalUsers})</div></div>
      <div style="padding:0 12px 20px;display:flex;flex-direction:column;gap:6px">
      ${_adminUsers.length === 0 ? '<div style="text-align:center;padding:20px;color:var(--t4);font-size:12px">No users found (Firebase connect karein)</div>' :
      _adminUsers.map(u => `
        <div style="padding:12px;background:var(--c1);border-radius:10px;border:1px solid var(--b1)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
            <div style="width:32px;height:32px;border-radius:8px;background:var(--acBg);display:flex;align-items:center;justify-content:center;color:var(--ac);font-size:14px;font-weight:700">${(u.name||'?').charAt(0).toUpperCase()}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:600">${u.name || 'No name'}</div>
              <div style="font-size:10px;color:var(--t4)">${u.phone || u.id}</div>
            </div>
            <div style="width:8px;height:8px;border-radius:50%;background:${_isActiveRecently(u.lastActive) ? 'var(--g)' : 'var(--t4)'}"></div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;font-size:10px;color:var(--t3)">
            <span style="padding:2px 6px;background:var(--bg);border-radius:4px">Joined: ${u.joinedAt ? new Date(u.joinedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : '?'}</span>
            <span style="padding:2px 6px;background:var(--bg);border-radius:4px">Last: ${u.lastActive ? _timeAgo(u.lastActive) : '?'}</span>
            <span style="padding:2px 6px;background:var(--bg);border-radius:4px">${u.appVersion || 'v?'}</span>
            ${u.location ? `<span style="padding:2px 6px;background:var(--gBg);color:var(--g);border-radius:4px">📍 Location</span>` : ''}
          </div>
          ${u.deviceInfo ? `<div style="font-size:9px;color:var(--t4);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${u.deviceInfo}</div>` : ''}
          ${u.location ? `<div style="font-size:9px;color:var(--t3);margin-top:2px">📍 ${u.location.lat?.toFixed(4)}, ${u.location.lng?.toFixed(4)} (${u.location.updatedAt ? _timeAgo(u.location.updatedAt) : '?'})</div>` : ''}
        </div>`).join('')}
      </div>
    </div>`;
  }
}

function _isActiveRecently(lastActive) {
  if (!lastActive) return false;
  return (Date.now() - new Date(lastActive).getTime()) < 30 * 60 * 1000; // 30 min
}

window._sendBroadcast = async function() {
  const msg = document.getElementById('broadcastMsg')?.value?.trim();
  if (!msg) { showToast('Message likhein'); return; }
  if (typeof FIRE !== 'undefined' && FIRE.ready) {
    const ok = await FIRE.broadcastMessage(msg);
    if (ok) { showToast('Broadcast sent!'); document.getElementById('broadcastMsg').value = ''; }
    else showToast('Send failed');
  } else {
    showToast('Firebase connect nahi hai');
  }
};

// ── Secret admin access: 5x tap on logo ──
let _adminTapCount = 0, _adminTapTimer = null;
window.adminTap = function() {
  _adminTapCount++;
  clearTimeout(_adminTapTimer);
  _adminTapTimer = setTimeout(() => { _adminTapCount = 0; }, 2000);
  if (_adminTapCount >= 5) {
    _adminTapCount = 0;
    if (S.isAdmin) {
      openAdminDashboard();
    } else {
      const code = prompt('Admin Code:');
      if (code === S.adminCode) {
        S.isAdmin = true; saveAll();
        showToast('Admin access granted!');
        openAdminDashboard();
      } else {
        showToast('Wrong code');
      }
    }
  }
};
