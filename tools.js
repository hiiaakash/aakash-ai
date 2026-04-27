// ════════════════════════════════════
//  AAKASH AI — Tools (tools.js)
//  Expanded: 15+ AI tools
//  Web search handled by Claude directly
//  Trip, weather, translate, calculate via AI
// ════════════════════════════════════

const TOOLS = [
  // ── EXISTING TOOLS (improved) ──
  { name: 'add_expense', description: 'Add expense when user mentions spending/buying/paying money. Example: "200 chai pe laga", "rent 15000 diya".',
    input_schema: { type:'object', properties: { amount:{ type:'number' }, category:{ type:'string', enum:['Food','Transport','Rent','Shopping','Bills','Health','Education','Entertainment','Investment','Savings','Travel','Other'] }, description:{ type:'string' } }, required:['amount','category'] } },

  { name: 'create_task', description: 'Create task/todo/reminder when user mentions something to do. Example: "yaad dilana meeting 5 baje", "tomorrow dentist jaana hai".',
    input_schema: { type:'object', properties: { title:{ type:'string' }, priority:{ type:'string', enum:['low','medium','high'] }, due_date:{ type:'string', description:'ISO date if mentioned' } }, required:['title'] } },

  { name: 'log_habit', description: 'Mark habit done when user says they completed one. Example: "meditation done", "gym ho gaya".',
    input_schema: { type:'object', properties: { habit_name:{ type:'string' } }, required:['habit_name'] } },

  { name: 'create_note', description: 'Save important information as a note. Example: "save this recipe", "note down this meeting summary".',
    input_schema: { type:'object', properties: { title:{ type:'string' }, content:{ type:'string' }, folder:{ type:'string', enum:['Course Notes','Work Notes','Personal','AI/ML','Python','Business','Finance','Travel','Health','General'] } }, required:['title','content'] } },

  { name: 'set_goal', description: 'Create a goal when user mentions ambition/target. Example: "mujhe 6 months mein 10kg lose karna hai".',
    input_schema: { type:'object', properties: { title:{ type:'string' }, deadline:{ type:'string' }, milestones:{ type:'string', description:'Comma-separated milestones' } }, required:['title'] } },

  { name: 'get_finance_summary', description: 'Get financial overview when user asks about money, budget, expenses, savings.',
    input_schema: { type:'object', properties: {} } },

  { name: 'get_habits_status', description: 'Get today habit completion status.',
    input_schema: { type:'object', properties: {} } },

  { name: 'remember_fact', description: 'Remember important personal fact about user. Example: "mera birthday 15 Jan hai", "main Delhi mein rehta hoon".',
    input_schema: { type:'object', properties: { fact:{ type:'string' } }, required:['fact'] } },

  { name: 'customize_app', description: 'Customize app appearance/behavior. Ask 2-3 questions first, get approval, then apply.',
    input_schema: { type:'object', properties: { action:{ type:'string', enum:['change_theme','change_accent','change_fontsize','hide_tab','show_tab','add_rule','remove_rule'] }, value:{ type:'string' } }, required:['action','value'] } },

  // ── NEW TOOLS ──

  { name: 'create_trip_plan', description: 'Create a trip/travel plan when user wants to plan a trip. Example: "Goa trip plan karo", "Kashmir 5 days ka plan banao". Save as a structured note.',
    input_schema: { type:'object', properties: {
      destination:{ type:'string' },
      days:{ type:'number', description:'Number of days' },
      budget:{ type:'string', description:'Budget range' },
      interests:{ type:'string', description:'Comma-separated interests like beaches, temples, food, adventure' },
      plan:{ type:'string', description:'Day-wise detailed itinerary text' }
    }, required:['destination','plan'] } },

  { name: 'add_to_budget', description: 'Track trip or project specific budget. Adds expense to a named budget.',
    input_schema: { type:'object', properties: {
      budget_name:{ type:'string' },
      item:{ type:'string' },
      amount:{ type:'number' }
    }, required:['budget_name','item','amount'] } },

  { name: 'create_checklist', description: 'Create a checklist (packing list, shopping list, todo list). Example: "Goa trip ke liye packing list banao".',
    input_schema: { type:'object', properties: {
      title:{ type:'string' },
      items:{ type:'string', description:'Comma-separated list items' },
      category:{ type:'string', enum:['Travel','Shopping','Work','Personal','Health','Study'] }
    }, required:['title','items'] } },

  { name: 'set_reminder', description: 'Set a time-based reminder. Example: "3 baje yaad dilana paani peena hai", "kal subah 8 baje meeting reminder".',
    input_schema: { type:'object', properties: {
      message:{ type:'string' },
      time:{ type:'string', description:'Time description or ISO datetime' },
      repeat:{ type:'string', enum:['once','daily','weekly'], description:'Repeat frequency' }
    }, required:['message','time'] } },

  { name: 'get_all_data', description: 'Get complete overview of all user data — tasks, goals, habits, finance, notes count, memories. Use when user asks "mera sab kuch batao" or "overall status".',
    input_schema: { type:'object', properties: {} } },

  { name: 'search_notes', description: 'Search through user notes by keyword. Example: "recipe wali note dhundho", "Python notes dikhao".',
    input_schema: { type:'object', properties: { query:{ type:'string' } }, required:['query'] } },

  { name: 'bulk_action', description: 'Perform bulk actions on entries. Example: "saari done tasks delete karo", "purane goals hatao".',
    input_schema: { type:'object', properties: {
      action:{ type:'string', enum:['delete_done_tasks','delete_done_goals','clear_old_expenses','archive_notes'] },
      confirm:{ type:'boolean' }
    }, required:['action'] } }
];

// ── TOOL EXECUTION ──
function executeTool(name, input) {
  const today = td();
  switch (name) {
    case 'add_expense':
      S.finance.expenses.push({ id:Date.now(), amount:input.amount, cat:input.category, desc:input.description||'', date:new Date().toISOString() });
      saveAll();
      return `✅ ₹${input.amount} ${input.category} added.${input.description ? ' ('+input.description+')' : ''}`;

    case 'create_task':
      S.entries.unshift({ id:Date.now(), type:'task', title:input.title, content:input.priority||'medium', done:false, dueDate:input.due_date||null, createdAt:new Date().toISOString() });
      saveAll();
      return `✅ Task: "${input.title}" created.${input.due_date ? ' Due: '+input.due_date : ''}`;

    case 'log_habit': {
      const h = S.habits.find(x => x.name.toLowerCase().includes(input.habit_name.toLowerCase()));
      if (h) {
        if (!S.habitLog[today]) S.habitLog[today] = [];
        if (!S.habitLog[today].includes(h.id)) { S.habitLog[today].push(h.id); saveAll(); }
        const done = S.habitLog[today].length, total = S.habits.length;
        return `✅ "${h.name}" done! (${done}/${total} today)`;
      }
      return `❌ "${input.habit_name}" habit nahi mila. Available: ${S.habits.map(x=>x.name).join(', ')||'none'}`;
    }

    case 'create_note':
      S.notes.unshift({ id:Date.now(), title:input.title, content:input.content, folder:input.folder||'General', createdAt:new Date().toISOString() });
      saveAll();
      return `✅ Note "${input.title}" saved in ${input.folder||'General'}.`;

    case 'set_goal':
      S.entries.unshift({ id:Date.now(), type:'goal', title:input.title, content:(input.deadline||'')+'\n'+(input.milestones||''), done:false, createdAt:new Date().toISOString() });
      saveAll();
      return `✅ Goal: "${input.title}" set.${input.deadline ? ' Deadline: '+input.deadline : ''}`;

    case 'get_finance_summary': {
      const tot = S.finance.expenses.reduce((s, e) => s + e.amount, 0);
      const bc = {}; S.finance.expenses.forEach(e => { bc[e.cat] = (bc[e.cat]||0) + e.amount; });
      const rem = (S.finance.salary||0) - tot;
      return `Salary:₹${S.finance.salary||'Not set'}|Spent:₹${tot}|Left:₹${rem}\nBreakdown: ${Object.entries(bc).map(([k,v])=>`${k}:₹${v}`).join(', ')||'No expenses'}`;
    }

    case 'get_habits_status': {
      const dn = S.habitLog[today] || [];
      return `${dn.length}/${S.habits.length} done today.\n${S.habits.map(h => `${dn.includes(h.id)?'✅':'⬜'} ${h.name}`).join('\n')||'No habits set.'}`;
    }

    case 'remember_fact':
      if (!S.memoryFacts) S.memoryFacts = [];
      // Check for duplicate/update
      const existing = S.memoryFacts.findIndex(f => f.fact.toLowerCase().includes(input.fact.toLowerCase().split(' ')[0]));
      if (existing >= 0) S.memoryFacts[existing] = { fact:input.fact, date:new Date().toISOString() };
      else S.memoryFacts.push({ fact:input.fact, date:new Date().toISOString() });
      saveAll();
      return `🧠 Remembered: "${input.fact}"`;

    case 'customize_app':
      return applyCustomization(input.action, input.value);

    // ── NEW TOOL HANDLERS ──

    case 'create_trip_plan':
      S.notes.unshift({
        id: Date.now(),
        title: `🗺️ Trip: ${input.destination}${input.days ? ' ('+input.days+' days)' : ''}`,
        content: input.plan,
        folder: 'Travel',
        isTripPlan: true,
        tripData: { destination:input.destination, days:input.days, budget:input.budget, interests:input.interests },
        createdAt: new Date().toISOString()
      });
      saveAll();
      return `✅ Trip plan for ${input.destination} saved! Notes > Travel mein dekho.`;

    case 'add_to_budget': {
      if (!S.budgets) S.budgets = {};
      if (!S.budgets[input.budget_name]) S.budgets[input.budget_name] = { items:[], total:0 };
      S.budgets[input.budget_name].items.push({ item:input.item, amount:input.amount, date:new Date().toISOString() });
      S.budgets[input.budget_name].total += input.amount;
      saveAll();
      return `✅ ₹${input.amount} for "${input.item}" added to ${input.budget_name} budget. Total: ₹${S.budgets[input.budget_name].total}`;
    }

    case 'create_checklist': {
      const items = input.items.split(',').map(i => i.trim()).filter(Boolean);
      S.entries.unshift({
        id: Date.now(),
        type: 'task',
        title: `📋 ${input.title}`,
        content: items.map(i => `⬜ ${i}`).join('\n'),
        done: false,
        isChecklist: true,
        checklistItems: items.map((i, idx) => ({ id:idx, text:i, done:false })),
        category: input.category || 'Personal',
        createdAt: new Date().toISOString()
      });
      saveAll();
      return `✅ Checklist "${input.title}" created with ${items.length} items. Vault mein dekho.`;
    }

    case 'set_reminder': {
      if (!S.reminders) S.reminders = [];
      const reminder = {
        id: Date.now(),
        message: input.message,
        time: input.time,
        repeat: input.repeat || 'once',
        active: true,
        createdAt: new Date().toISOString()
      };
      S.reminders.push(reminder);
      saveAll();
      // Try to schedule browser notification
      scheduleReminder(reminder);
      return `✅ Reminder set: "${input.message}" at ${input.time}${input.repeat !== 'once' ? ' ('+input.repeat+')' : ''}`;
    }

    case 'get_all_data': {
      const tasks = S.entries.filter(e => e.type === 'task');
      const goals = S.entries.filter(e => e.type === 'goal');
      const dn = S.habitLog[today] || [];
      const tot = S.finance.expenses.reduce((s, e) => s + e.amount, 0);
      return [
        `Tasks: ${tasks.filter(t=>!t.done).length} pending, ${tasks.filter(t=>t.done).length} done`,
        `Goals: ${goals.filter(g=>!g.done).length} active, ${goals.filter(g=>g.done).length} achieved`,
        `Habits: ${dn.length}/${S.habits.length} today`,
        `Finance: ₹${tot} spent${S.finance.salary ? ', ₹'+(S.finance.salary-tot)+' left' : ''}`,
        `Notes: ${S.notes.length} | Chats: ${S.chats.length} | Memories: ${(S.memoryFacts||[]).length}`,
        `Reminders: ${(S.reminders||[]).filter(r=>r.active).length} active`
      ].join('\n');
    }

    case 'search_notes': {
      const q = input.query.toLowerCase();
      const found = S.notes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        (n.content||'').toLowerCase().includes(q) ||
        (n.folder||'').toLowerCase().includes(q)
      );
      if (!found.length) return `❌ "${input.query}" se koi note nahi mila.`;
      return `Found ${found.length} notes:\n${found.slice(0,5).map(n => `📝 "${n.title}" (${n.folder})`).join('\n')}`;
    }

    case 'bulk_action': {
      if (!input.confirm) return '⚠️ Confirm karo: sure ho? (yes/no)';
      switch (input.action) {
        case 'delete_done_tasks':
          const before = S.entries.length;
          S.entries = S.entries.filter(e => !(e.type === 'task' && e.done));
          saveAll();
          return `✅ ${before - S.entries.length} completed tasks deleted.`;
        case 'delete_done_goals':
          const bg = S.entries.length;
          S.entries = S.entries.filter(e => !(e.type === 'goal' && e.done));
          saveAll();
          return `✅ ${bg - S.entries.length} completed goals deleted.`;
        case 'clear_old_expenses':
          const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 3);
          const be = S.finance.expenses.length;
          S.finance.expenses = S.finance.expenses.filter(e => new Date(e.date) > cutoff);
          saveAll();
          return `✅ ${be - S.finance.expenses.length} old expenses (3+ months) cleared.`;
        default: return '❌ Unknown action.';
      }
    }

    default:
      return '❌ Unknown tool.';
  }
}

// ── CUSTOMIZATION HANDLER ──
function applyCustomization(action, value) {
  switch (action) {
    case 'change_theme': sT(value === 'dark' ? 'dark' : 'light'); return `✅ Theme: ${value}.`;
    case 'change_accent':
      // Support both color names and hex
      const colorMap = { blue:'#2563eb', red:'#dc2626', green:'#16a34a', purple:'#7c3aed', orange:'#c2410c', yellow:'#ca8a04', cyan:'#0891b2', pink:'#be185d' };
      const hex = colorMap[value.toLowerCase()] || value;
      localStorage.setItem('ak_accent', hex); applyCustom();
      return `✅ Accent color: ${value}.`;
    case 'change_fontsize': localStorage.setItem('ak_fontsize', value); applyCustom(); return `✅ Font size: ${value}px.`;
    case 'hide_tab': if (!S.hiddenTabs.includes(value)) { S.hiddenTabs.push(value); saveAll(); } return `✅ ${value} tab hidden.`;
    case 'show_tab': S.hiddenTabs = S.hiddenTabs.filter(t => t !== value); saveAll(); return `✅ ${value} tab visible.`;
    case 'add_rule': if (!S.customRules) S.customRules = []; S.customRules.push(value); saveAll(); return `✅ Rule added: "${value}"`;
    case 'remove_rule': S.customRules = (S.customRules||[]).filter(r => !r.toLowerCase().includes(value.toLowerCase())); saveAll(); return `✅ Rule removed.`;
    default: return '❌ Unknown customization.';
  }
}

// ── REMINDER SCHEDULER ──
function scheduleReminder(reminder) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  // Parse simple time like "3 baje", "5:30 PM", "8:00"
  const now = new Date();
  let targetTime = null;

  // Try ISO parse first
  const isoDate = new Date(reminder.time);
  if (!isNaN(isoDate.getTime()) && isoDate > now) {
    targetTime = isoDate;
  } else {
    // Parse Hindi/English time patterns
    const match = reminder.time.match(/(\d{1,2})(?::(\d{2}))?\s*(baje|am|pm|AM|PM)?/);
    if (match) {
      let hours = parseInt(match[1]);
      const mins = parseInt(match[2] || '0');
      const period = (match[3] || '').toLowerCase();
      if (period === 'pm' && hours < 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;
      if (period === 'baje' && hours < 6) hours += 12; // Assume PM for "baje" if < 6

      targetTime = new Date();
      targetTime.setHours(hours, mins, 0, 0);
      if (targetTime <= now) targetTime.setDate(targetTime.getDate() + 1);
    }
  }

  if (targetTime) {
    const delay = targetTime.getTime() - now.getTime();
    if (delay > 0 && delay < 86400000) { // Max 24 hours
      setTimeout(() => {
        new Notification('AAKASH AI ⏰', {
          body: reminder.message,
          icon: 'icon-192.png',
          requireInteraction: true
        });
        // Mark as done if once
        if (reminder.repeat === 'once') {
          const r = (S.reminders||[]).find(x => x.id === reminder.id);
          if (r) r.active = false;
          saveAll();
        }
      }, delay);
    }
  }
}

// ── INIT: Schedule active reminders on load ──
function initReminders() {
  if (!S.reminders) return;
  S.reminders.filter(r => r.active).forEach(r => scheduleReminder(r));
}
