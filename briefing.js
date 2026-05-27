// ════════════════════════════════════
//  AAKASH AI v3 — Briefing (briefing.js)
//  Morning Briefing Widget (Change 21)
//  Weekly AI Report with PDF export (Change 22)
//  Smart Reminders (Change 26)
// ════════════════════════════════════

// ════════════════════════════════════
//  MORNING BRIEFING — Dashboard widget
//  Shows at top of chat on first open
// ════════════════════════════════════

let _briefingShown = false;

function getMorningBriefing() {
  const today = td();
  const hour = new Date().getHours();
  if (hour < 5 || hour > 12 || _briefingShown) return '';
  if (localStorage.getItem('ak_briefing_' + today)) return '';

  const tasks = S.entries.filter(e => e.type === 'task' && !e.done);
  const goals = S.entries.filter(e => e.type === 'goal' && !e.done);
  const done = S.habitLog[today] || [];
  const pendingHabits = S.habits.filter(h => !done.includes(h.id));
  const monthExp = S.finance.expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
  }).reduce((s, e) => s + e.amount, 0);
  const left = (S.finance.salary || 0) - monthExp;

  // Daily challenge
  const challenge = _getDailyChallenge();

  _briefingShown = true;
  localStorage.setItem('ak_briefing_' + today, '1');

  return `<div style="margin:8px 0;padding:14px;background:var(--c1);border:1px solid var(--b1);border-radius:14px;animation:fadeIn .4s">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div style="font-size:15px;font-weight:600">Good Morning${S.userName ? ', ' + S.userName : ''}! ☀️</div>
      <button onclick="this.parentElement.parentElement.remove()" style="color:var(--t4);background:none;border:none">${I.close}</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:10px">
      <div style="padding:10px;background:var(--bg);border-radius:8px;text-align:center">
        <div style="font-size:20px;font-weight:700;color:${tasks.length>5?'var(--r)':'var(--ac)'}">${tasks.length}</div>
        <div style="font-size:10px;color:var(--t4)">Tasks Pending</div>
      </div>
      <div style="padding:10px;background:var(--bg);border-radius:8px;text-align:center">
        <div style="font-size:20px;font-weight:700;color:${pendingHabits.length===0?'var(--g)':'var(--ac)'}">${done.length}/${S.habits.length}</div>
        <div style="font-size:10px;color:var(--t4)">Habits Done</div>
      </div>
      ${S.finance.salary ? `<div style="padding:10px;background:var(--bg);border-radius:8px;text-align:center">
        <div style="font-size:20px;font-weight:700;color:${left<0?'var(--r)':'var(--g)'}">₹${Math.abs(left).toLocaleString()}</div>
        <div style="font-size:10px;color:var(--t4)">${left>=0?'Budget Left':'Over Budget'}</div>
      </div>` : ''}
      ${goals.length ? `<div style="padding:10px;background:var(--bg);border-radius:8px;text-align:center">
        <div style="font-size:20px;font-weight:700;color:var(--p)">${goals.length}</div>
        <div style="font-size:10px;color:var(--t4)">Active Goals</div>
      </div>` : ''}
    </div>
    ${challenge ? `<div style="padding:8px 10px;background:var(--acBg);border:1px solid var(--acBorder);border-radius:8px;margin-bottom:8px">
      <div style="font-size:10px;color:var(--ac);font-weight:600;margin-bottom:2px">🎯 Today's Challenge</div>
      <div style="font-size:12px;color:var(--t1)">${challenge.text}</div>
    </div>` : ''}
    ${tasks.length ? `<div style="font-size:11px;color:var(--t3);margin-top:4px">Top tasks: ${tasks.slice(0,3).map(t=>t.title).join(', ')}</div>` : ''}
  </div>`;
}

// ════════════════════════════════════
//  WEEKLY AI REPORT (Change 22)
//  Auto-generated every Sunday
// ════════════════════════════════════

window.generateWeeklyReport = async function() {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 7);

  // Collect data
  const weekTasks = S.entries.filter(e => e.type === 'task' && e.done && new Date(e.createdAt) >= weekStart);
  const weekExpenses = S.finance.expenses.filter(e => new Date(e.date) >= weekStart);
  const totalSpent = weekExpenses.reduce((s, e) => s + e.amount, 0);
  const categories = {};
  weekExpenses.forEach(e => { categories[e.cat] = (categories[e.cat] || 0) + e.amount; });

  // Habit stats
  let habitDays = 0, totalPossible = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const done = S.habitLog[ds] || [];
    habitDays += done.length;
    totalPossible += S.habits.length;
  }
  const habitRate = totalPossible > 0 ? Math.round((habitDays / totalPossible) * 100) : 0;

  const report = {
    id: Date.now(),
    weekStart: weekStart.toISOString(),
    weekEnd: today.toISOString(),
    data: {
      tasksCompleted: weekTasks.length,
      tasksPending: S.entries.filter(e => e.type === 'task' && !e.done).length,
      totalSpent,
      categories,
      habitRate,
      habitsTracked: S.habits.length,
      notesCreated: S.notes.filter(n => new Date(n.createdAt || 0) >= weekStart).length
    },
    createdAt: new Date().toISOString()
  };

  // Save report
  if (!S.weeklyReports) S.weeklyReports = [];
  S.weeklyReports.unshift(report);
  if (S.weeklyReports.length > 12) S.weeklyReports = S.weeklyReports.slice(0, 12);
  await saveAll();

  // Generate PDF-like summary
  const summary = `📊 WEEKLY REPORT (${weekStart.toLocaleDateString('en-IN',{day:'numeric',month:'short'})} - ${today.toLocaleDateString('en-IN',{day:'numeric',month:'short'})})

✅ Tasks: ${weekTasks.length} completed, ${report.data.tasksPending} pending
💰 Spent: ₹${totalSpent.toLocaleString()} ${Object.entries(categories).map(([c,a])=>`(${c}: ₹${a.toLocaleString()})`).join(' ')}
💪 Habits: ${habitRate}% completion rate (${habitDays}/${totalPossible})
📝 Notes: ${report.data.notesCreated} created

${habitRate >= 80 ? '🎉 Bahut accha! Habit consistency strong hai!' : habitRate >= 50 ? '💪 Accha hai, aur consistency badhayein!' : '⚠️ Habits pe focus chahiye — daily tracking zaruri!'}
${totalSpent > (S.finance.salary || 0) * 0.25 ? '💸 Spending zyada hai — budget review karein' : '✅ Spending control mein hai'}`;

  return { report, summary };
};

// ════════════════════════════════════
//  SMART REMINDERS (Change 26)
//  AI auto-detects reminders from chat
// ════════════════════════════════════

function extractReminder(text) {
  const t = text.toLowerCase();

  // Time patterns
  const timePatterns = [
    { regex: /(?:kal|tomorrow)\s+(\d{1,2})\s*(?:baje|am|pm)/i, offset: 'tomorrow' },
    { regex: /(\d{1,2})\s*(?:baje|am|pm)\s*(?:pe|par|ko)/i, offset: 'today' },
    { regex: /(\d+)\s*(?:min|minute|ghante|hour)/i, offset: 'relative' },
    { regex: /(?:kal|tomorrow)/i, offset: 'tomorrow_default' },
    { regex: /(?:parson|day after)/i, offset: 'dayafter' }
  ];

  // Check if text mentions a future event
  const eventWords = /meeting|call|dentist|doctor|gym|class|interview|exam|appointment|submit|deadline|jaana|milna|phone|reminder|yaad/i;
  if (!eventWords.test(t)) return null;

  let reminderTime = null;
  let matchedPattern = null;

  for (const p of timePatterns) {
    const m = t.match(p.regex);
    if (m) {
      const now = new Date();
      if (p.offset === 'tomorrow') {
        now.setDate(now.getDate() + 1);
        now.setHours(parseInt(m[1]), 0, 0, 0);
        reminderTime = now;
      } else if (p.offset === 'today') {
        now.setHours(parseInt(m[1]), 0, 0, 0);
        if (now < new Date()) now.setDate(now.getDate() + 1);
        reminderTime = now;
      } else if (p.offset === 'relative') {
        const val = parseInt(m[1]);
        if (/hour|ghante/.test(t)) now.setHours(now.getHours() + val);
        else now.setMinutes(now.getMinutes() + val);
        reminderTime = now;
      } else if (p.offset === 'tomorrow_default') {
        now.setDate(now.getDate() + 1);
        now.setHours(9, 0, 0, 0);
        reminderTime = now;
      } else if (p.offset === 'dayafter') {
        now.setDate(now.getDate() + 2);
        now.setHours(9, 0, 0, 0);
        reminderTime = now;
      }
      matchedPattern = p;
      break;
    }
  }

  if (!reminderTime) return null;

  return {
    id: Date.now(),
    text: text.slice(0, 100),
    time: reminderTime.toISOString(),
    active: true,
    createdAt: new Date().toISOString()
  };
}

// Auto-extract reminders from AI conversations
function checkForSmartReminder(userText) {
  const reminder = extractReminder(userText);
  if (reminder) {
    if (!S.reminders) S.reminders = [];
    S.reminders.push(reminder);
    saveAll();

    // Schedule notification
    const delay = new Date(reminder.time).getTime() - Date.now();
    if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
      setTimeout(() => {
        if (S.reminders.find(r => r.id === reminder.id && r.active)) {
          showNotifBanner(`⏰ Reminder: ${reminder.text}`);
          _smartNotify('AAKASH AI ⏰', reminder.text, 'reminder_' + reminder.id);
          // Mark as done
          const r = S.reminders.find(r => r.id === reminder.id);
          if (r) r.active = false;
          saveAll();
        }
      }, delay);
    }

    return `⏰ Reminder set: ${new Date(reminder.time).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}`;
  }
  return null;
}

// Initialize pending reminders on app load
function initReminders() {
  if (!S.reminders) return;
  const now = Date.now();
  S.reminders.filter(r => r.active).forEach(r => {
    const delay = new Date(r.time).getTime() - now;
    if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
      setTimeout(() => {
        if (S.reminders.find(x => x.id === r.id && x.active)) {
          showNotifBanner(`⏰ Reminder: ${r.text}`);
          _smartNotify('AAKASH AI ⏰', r.text, 'reminder_' + r.id);
          const rem = S.reminders.find(x => x.id === r.id);
          if (rem) rem.active = false;
          saveAll();
        }
      }, delay);
    } else if (delay <= 0) {
      r.active = false; // Expired
    }
  });
}

// ════════════════════════════════════
//  DAILY CHALLENGE (Change 25)
// ════════════════════════════════════

const DAILY_CHALLENGES = [
  { text:'Aaj ek naya skill 15 min seekhein', type:'learning', points:10 },
  { text:'Aaj koi junk food nahi — healthy day!', type:'health', points:15 },
  { text:'3 logon ko genuine compliment dein', type:'social', points:10 },
  { text:'Aaj phone 1 ghanta kam use karein', type:'discipline', points:15 },
  { text:'₹0 spend day — kuch mat khareedein', type:'finance', points:20 },
  { text:'30 min walk ya exercise karein', type:'fitness', points:15 },
  { text:'1 chapter ya article complete padhein', type:'learning', points:10 },
  { text:'Kisi purane dost ko message karein', type:'social', points:10 },
  { text:'Apna workspace clean karein', type:'productivity', points:10 },
  { text:'5 min meditation ya deep breathing', type:'health', points:10 },
  { text:'1 business idea likhein with steps', type:'business', points:15 },
  { text:'Social media bilkul nahi — 1 din', type:'discipline', points:20 },
  { text:'Kisi ko kuch sikhayein — teaching mode', type:'learning', points:15 },
  { text:'Early sleep — 10pm se pehle', type:'health', points:15 },
  { text:'Gratitude journal — 5 cheezein likho', type:'mindset', points:10 },
  { text:'Cold shower lo — comfort zone todho', type:'discipline', points:20 },
  { text:'1 hour deep work — koi distraction nahi', type:'productivity', points:15 },
  { text:'Home-cooked meal banao', type:'health', points:10 },
  { text:'Budget review karein — week ka spending check', type:'finance', points:10 },
  { text:'10 min stretching morning mein', type:'fitness', points:10 }
];

function _getDailyChallenge() {
  const today = td();
  if (S.dailyChallenge?.current?.date === today) return S.dailyChallenge.current;

  // Generate new challenge
  const idx = Math.abs(hashCode(today)) % DAILY_CHALLENGES.length;
  const challenge = { ...DAILY_CHALLENGES[idx], id: Date.now(), date: today, completedAt: null };

  if (!S.dailyChallenge) S.dailyChallenge = { current: null, history: [] };
  // Archive previous
  if (S.dailyChallenge.current && S.dailyChallenge.current.date !== today) {
    S.dailyChallenge.history.push(S.dailyChallenge.current);
    if (S.dailyChallenge.history.length > 30) S.dailyChallenge.history = S.dailyChallenge.history.slice(-30);
  }
  S.dailyChallenge.current = challenge;
  saveAll();
  return challenge;
}

window.completeDailyChallenge = function() {
  if (!S.dailyChallenge?.current || S.dailyChallenge.current.completedAt) return;
  S.dailyChallenge.current.completedAt = new Date().toISOString();
  S.achievements.points = (S.achievements.points || 0) + (S.dailyChallenge.current.points || 10);
  saveAll();
  showToast(`🎉 Challenge complete! +${S.dailyChallenge.current.points} points`);
  _checkAchievements();
};

function hashCode(str) { let h=0; for(let i=0;i<str.length;i++){h=((h<<5)-h)+str.charCodeAt(i);h|=0;} return h; }
