// ════════════════════════════════════
//  AAKASH AI — Tools (tools.js)
//  AI tool definitions + execution
// ════════════════════════════════════

const TOOLS = [
  { name: 'add_expense', description: 'Add expense when user mentions spending/buying/paying money.',
    input_schema: { type: 'object', properties: { amount: { type: 'number' }, category: { type: 'string', enum: ['Food', 'Transport', 'Rent', 'Shopping', 'Bills', 'Health', 'Education', 'Entertainment', 'Investment', 'Savings', 'Other'] }, description: { type: 'string' } }, required: ['amount', 'category'] } },

  { name: 'create_task', description: 'Create task when user mentions a todo/reminder.',
    input_schema: { type: 'object', properties: { title: { type: 'string' }, priority: { type: 'string', enum: ['low', 'medium', 'high'] } }, required: ['title'] } },

  { name: 'log_habit', description: 'Mark habit done when user says they completed one.',
    input_schema: { type: 'object', properties: { habit_name: { type: 'string' } }, required: ['habit_name'] } },

  { name: 'create_note', description: 'Save a note when user wants to remember something.',
    input_schema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' }, folder: { type: 'string', enum: ['Course Notes', 'Work Notes', 'Personal', 'AI/ML', 'Python', 'Business', 'Finance', 'General'] } }, required: ['title', 'content'] } },

  { name: 'set_goal', description: 'Create goal when user mentions ambition/target.',
    input_schema: { type: 'object', properties: { title: { type: 'string' }, deadline: { type: 'string' } }, required: ['title'] } },

  { name: 'get_finance_summary', description: 'Get financial summary when user asks about money.',
    input_schema: { type: 'object', properties: {} } },

  { name: 'get_habits_status', description: 'Get habit status when user asks.',
    input_schema: { type: 'object', properties: {} } },

  { name: 'remember_fact', description: 'Remember important personal fact about user.',
    input_schema: { type: 'object', properties: { fact: { type: 'string' } }, required: ['fact'] } },

  { name: 'customize_app', description: 'When user asks to change/customize the app. Ask 2-3 questions first, get approval, then apply.',
    input_schema: { type: 'object', properties: { action: { type: 'string', enum: ['change_theme', 'change_accent', 'change_fontsize', 'hide_tab', 'show_tab', 'add_rule', 'remove_rule'] }, value: { type: 'string', description: 'The value to set' } }, required: ['action', 'value'] } }
];

function executeTool(name, input) {
  const today = td();
  switch (name) {
    case 'add_expense':
      S.finance.expenses.push({ id: Date.now(), amount: input.amount, cat: input.category, desc: input.description || '', date: new Date().toISOString() });
      saveAll();
      return `✅ ₹${input.amount} ${input.category} added.`;

    case 'create_task':
      S.entries.unshift({ id: Date.now(), type: 'task', title: input.title, content: input.priority || 'medium', done: false, createdAt: new Date().toISOString() });
      saveAll();
      return `✅ Task "${input.title}" created.`;

    case 'log_habit':
      const h = S.habits.find(x => x.name.toLowerCase().includes(input.habit_name.toLowerCase()));
      if (h) {
        if (!S.habitLog[today]) S.habitLog[today] = [];
        if (!S.habitLog[today].includes(h.id)) { S.habitLog[today].push(h.id); saveAll(); }
        return `✅ "${h.name}" done!`;
      }
      return `❌ "${input.habit_name}" not found.`;

    case 'create_note':
      S.notes.unshift({ id: Date.now(), title: input.title, content: input.content, folder: input.folder || 'General', createdAt: new Date().toISOString() });
      saveAll();
      return `✅ Note saved.`;

    case 'set_goal':
      S.entries.unshift({ id: Date.now(), type: 'goal', title: input.title, content: input.deadline || '', done: false, createdAt: new Date().toISOString() });
      saveAll();
      return `✅ Goal set: "${input.title}"`;

    case 'get_finance_summary':
      const tot = S.finance.expenses.reduce((s, e) => s + e.amount, 0);
      const bc = {};
      S.finance.expenses.forEach(e => { bc[e.cat] = (bc[e.cat] || 0) + e.amount; });
      return `Salary:₹${S.finance.salary || 'Not set'}|Spent:₹${tot}|Left:₹${(S.finance.salary || 0) - tot}\n${Object.entries(bc).map(([k, v]) => `${k}:₹${v}`).join(', ')}`;

    case 'get_habits_status':
      const dn = S.habitLog[today] || [];
      return `${dn.length}/${S.habits.length} done.\n${S.habits.map(h => `${dn.includes(h.id) ? '✅' : '⬜'} ${h.name}`).join('\n')}`;

    case 'remember_fact':
      if (!S.memoryFacts) S.memoryFacts = [];
      S.memoryFacts.push({ fact: input.fact, date: new Date().toISOString() });
      saveAll();
      return `🧠 Remembered.`;

    case 'customize_app':
      return applyCustomization(input.action, input.value);

    default:
      return '❌ Unknown.';
  }
}

function applyCustomization(action, value) {
  switch (action) {
    case 'change_theme': sT(value === 'dark' ? 'dark' : 'light'); return `✅ Theme changed to ${value}.`;
    case 'change_accent': localStorage.setItem('ak_accent', value); applyCustom(); return `✅ Accent color changed to ${value}.`;
    case 'change_fontsize': localStorage.setItem('ak_fontsize', value); applyCustom(); return `✅ Font size changed to ${value}px.`;
    case 'hide_tab': if (!S.hiddenTabs.includes(value)) { S.hiddenTabs.push(value); saveAll(); } return `✅ ${value} tab hidden.`;
    case 'show_tab': S.hiddenTabs = S.hiddenTabs.filter(t => t !== value); saveAll(); return `✅ ${value} tab visible again.`;
    case 'add_rule': if (!S.customRules) S.customRules = []; S.customRules.push(value); saveAll(); return `✅ Custom rule added: "${value}"`;
    case 'remove_rule': S.customRules = (S.customRules || []).filter(r => !r.toLowerCase().includes(value.toLowerCase())); saveAll(); return `✅ Rule removed.`;
    default: return '❌ Unknown customization.';
  }
}
