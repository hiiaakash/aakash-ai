// ════════════════════════════════════
//  AAKASH AI v3 — Achievements (achievements.js)
//  Badge system + Points + Streak tracking
//  Change 23: Full implementation
// ════════════════════════════════════

const BADGES = [
  { id:'first_chat', name:'First Chat', icon:'💬', desc:'Pehli chat ki', condition: () => S.chats?.length >= 1 },
  { id:'chat_10', name:'Chatty', icon:'🗣️', desc:'10 chats complete', condition: () => S.chats?.length >= 10 },
  { id:'chat_50', name:'Conversation Master', icon:'👑', desc:'50 chats complete', condition: () => S.chats?.length >= 50 },
  { id:'chat_100', name:'Chat Legend', icon:'🏆', desc:'100 chats complete', condition: () => S.chats?.length >= 100 },
  { id:'habit_7', name:'7 Day Streak', icon:'🔥', desc:'7 din habit streak', condition: () => _anyHabitStreak(7) },
  { id:'habit_30', name:'Monthly Warrior', icon:'💪', desc:'30 din habit streak', condition: () => _anyHabitStreak(30) },
  { id:'habit_100', name:'Habit Machine', icon:'⚡', desc:'100 din habit streak', condition: () => _anyHabitStreak(100) },
  { id:'task_10', name:'Task Slayer', icon:'✅', desc:'10 tasks complete', condition: () => S.entries?.filter(e=>e.type==='task'&&e.done).length >= 10 },
  { id:'task_50', name:'Productivity King', icon:'👨‍💼', desc:'50 tasks complete', condition: () => S.entries?.filter(e=>e.type==='task'&&e.done).length >= 50 },
  { id:'finance_start', name:'Money Tracker', icon:'💰', desc:'Pehla expense track kiya', condition: () => S.finance?.expenses?.length >= 1 },
  { id:'finance_50', name:'Budget Pro', icon:'📊', desc:'50 expenses tracked', condition: () => S.finance?.expenses?.length >= 50 },
  { id:'goal_1', name:'Goal Setter', icon:'🎯', desc:'Pehla goal set kiya', condition: () => S.entries?.filter(e=>e.type==='goal').length >= 1 },
  { id:'goal_complete', name:'Goal Achiever', icon:'🏅', desc:'Ek goal complete kiya', condition: () => S.entries?.filter(e=>e.type==='goal'&&e.done).length >= 1 },
  { id:'note_10', name:'Note Taker', icon:'📝', desc:'10 notes banaye', condition: () => S.notes?.length >= 10 },
  { id:'pdf_upload', name:'Scholar', icon:'📚', desc:'Pehla PDF brain mein store kiya', condition: () => (S.uploadedFiles||[]).some(f=>f.brainStored) },
  { id:'lesson_5', name:'Wise One', icon:'🧠', desc:'5 life lessons save kiye', condition: () => (S.lifeLessons||[]).length >= 5 },
  { id:'challenge_7', name:'Challenge Accepted', icon:'🎯', desc:'7 daily challenges complete', condition: () => (S.dailyChallenge?.history||[]).filter(c=>c.completedAt).length >= 7 },
  { id:'points_100', name:'Point Collector', icon:'⭐', desc:'100 points earn kiye', condition: () => (S.achievements?.points||0) >= 100 },
  { id:'points_500', name:'High Scorer', icon:'🌟', desc:'500 points earn kiye', condition: () => (S.achievements?.points||0) >= 500 },
  { id:'early_bird', name:'Early Bird', icon:'🌅', desc:'Subah 6 baje se pehle app open kiya', condition: () => new Date().getHours() < 6 }
];

function _anyHabitStreak(days) {
  for (const h of (S.habits||[])) {
    let s=0; const d=new Date();
    for(let i=0;i<days+1;i++){
      const ds=d.toISOString().slice(0,10);
      if((S.habitLog[ds]||[]).includes(h.id))s++;
      else if(i>0)break;
      d.setDate(d.getDate()-1);
    }
    if(s>=days) return true;
  }
  return false;
}

// ── Check & Award Badges ──
function _checkAchievements() {
  if (!S.achievements) S.achievements = { badges:[], points:0, streaks:{chat:0,habits:0,finance:0} };
  const existing = new Set((S.achievements.badges||[]).map(b=>b.id));
  let newBadges = [];

  for (const badge of BADGES) {
    if (existing.has(badge.id)) continue;
    try {
      if (badge.condition()) {
        S.achievements.badges.push({ id:badge.id, name:badge.name, icon:badge.icon, unlockedAt:new Date().toISOString() });
        S.achievements.points = (S.achievements.points || 0) + 25;
        newBadges.push(badge);
      }
    } catch {}
  }

  if (newBadges.length) {
    saveAll();
    newBadges.forEach(b => {
      showNotifBanner(`${b.icon} Badge Unlocked: <strong>${b.name}</strong> — ${b.desc}! (+25 points)`);
    });
  }
}

// ── Render Achievements Page ──
window.showAchievements = function() {
  _checkAchievements();
  const unlocked = S.achievements?.badges || [];
  const unlockedIds = new Set(unlocked.map(b=>b.id));
  const points = S.achievements?.points || 0;

  const ov = document.createElement('div');
  ov.id = 'achievePage';
  ov.style.cssText = 'position:fixed;inset:0;z-index:100;background:var(--bg);display:flex;flex-direction:column;animation:fadeIn .15s;max-width:480px;margin:0 auto';

  ov.innerHTML = `
  <div style="padding:12px 16px;border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:10px;background:var(--c1);flex-shrink:0">
    <button onclick="document.getElementById('achievePage').remove()" style="color:var(--t3)">${I.back}</button>
    <div style="font-size:16px;font-weight:600;flex:1">Achievements</div>
    <div style="padding:4px 12px;background:var(--acBg);border-radius:8px;font-size:12px;font-weight:600;color:var(--ac)">⭐ ${points} pts</div>
  </div>
  <div style="flex:1;overflow-y:auto;padding:12px">
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:36px;font-weight:700;color:var(--ac)">${unlocked.length}<span style="font-size:16px;color:var(--t4)">/${BADGES.length}</span></div>
      <div style="font-size:12px;color:var(--t4)">Badges Unlocked</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
    ${BADGES.map(b => {
      const isUnlocked = unlockedIds.has(b.id);
      return `<div style="padding:12px 8px;background:${isUnlocked?'var(--c1)':'var(--bg)'};border:1px solid ${isUnlocked?'var(--acBorder)':'var(--b1)'};border-radius:12px;text-align:center;${isUnlocked?'':'opacity:0.4'}">
        <div style="font-size:24px;margin-bottom:4px">${b.icon}</div>
        <div style="font-size:10px;font-weight:600;color:${isUnlocked?'var(--t1)':'var(--t4)'}">${b.name}</div>
        <div style="font-size:8px;color:var(--t4);margin-top:2px">${b.desc}</div>
      </div>`;
    }).join('')}
    </div>
  </div>`;

  document.body.appendChild(ov);
};

// Run achievement check periodically
setInterval(() => { if (typeof _ck !== 'undefined' && _ck) _checkAchievements(); }, 5 * 60 * 1000);
// Also check on first load
setTimeout(() => { if (typeof _ck !== 'undefined' && _ck) _checkAchievements(); }, 5000);
