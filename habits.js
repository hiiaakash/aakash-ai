// ════════════════════════════════════
//  AAKASH AI v3 — Habits (habits.js)
//  NEW: Voice Teacher, Gym Coach, Debate,
//  Face & Hair Care, Medical Advisor
// ════════════════════════════════════

let habitView = 'tracker';

function rHabits(ct) {
  const t = td(), done = S.habitLog[t] || [];
  const streak = h => { let s=0,d=new Date(); const td2=(S.habitLog[td()]||[]).includes(h.id); if(td2)s=1; d.setDate(d.getDate()-(td2?1:1)); for(let i=0;i<365;i++){const ds=d.toISOString().slice(0,10);if((S.habitLog[ds]||[]).includes(h.id))s++;else break;d.setDate(d.getDate()-1);}return s;};

  // Sub-tabs: Tracker, Coach, Voice, Gym, Debate, Face, Medical
  const tabs = [
    { k:'tracker', l:'Tracker', ic:I.habits },
    { k:'coach', l:'Coach', ic:I.star },
    { k:'voice', l:'Voice', ic:I.mic },
    { k:'gym', l:'Gym', ic:I.target },
    { k:'debate', l:'Debate', ic:I.chat },
    { k:'face', l:'Face', ic:I.user },
    { k:'medical', l:'Medical', ic:I.shield }
  ];

  ct.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;min-height:0">
  <div style="display:flex;gap:2px;padding:3px;margin:8px 12px 4px;background:var(--bg3);border-radius:10px;flex-shrink:0;overflow-x:auto">
    ${tabs.map(v => `<button onclick="habitView='${v.k}';rHabits(document.getElementById('ct'))" style="padding:6px 8px;border-radius:8px;font-size:10px;font-weight:${habitView===v.k?'600':'400'};background:${habitView===v.k?'var(--c1)':'transparent'};color:${habitView===v.k?'var(--t1)':'var(--t4)'};${habitView===v.k?'box-shadow:var(--shadow)':''};display:flex;align-items:center;justify-content:center;gap:3px;white-space:nowrap">${v.ic} ${v.l}</button>`).join('')}
  </div>
  ${habitView==='coach' ? '<div id="habChatWrap" style="flex:1;display:flex;flex-direction:column;min-height:0"></div>' :
    habitView==='voice' ? '<div id="voiceChatWrap" style="flex:1;display:flex;flex-direction:column;min-height:0"></div>' :
    habitView==='gym' ? '<div id="gymChatWrap" style="flex:1;display:flex;flex-direction:column;min-height:0"></div>' :
    habitView==='debate' ? '<div id="debateChatWrap" style="flex:1;display:flex;flex-direction:column;min-height:0"></div>' :
    habitView==='face' ? '<div id="faceChatWrap" style="flex:1;display:flex;flex-direction:column;min-height:0"></div>' :
    habitView==='medical' ? '<div id="medicalChatWrap" style="flex:1;display:flex;flex-direction:column;min-height:0"></div>' :
    _renderHabitTracker(done, streak)}
  </div>`;

  // Initialize embedded chats for new sections
  if (habitView==='coach') { const w=document.getElementById('habChatWrap'); if(w) renderEmbeddedChat('habits',w); }
  if (habitView==='voice') { const w=document.getElementById('voiceChatWrap'); if(w) _renderSectionChat('voice',w); }
  if (habitView==='gym') { const w=document.getElementById('gymChatWrap'); if(w) _renderSectionChat('gym',w); }
  if (habitView==='debate') { const w=document.getElementById('debateChatWrap'); if(w) _renderSectionChat('debate',w); }
  if (habitView==='face') { const w=document.getElementById('faceChatWrap'); if(w) _renderSectionChat('face',w); }
  if (habitView==='medical') { const w=document.getElementById('medicalChatWrap'); if(w) _renderSectionChat('medical',w); }
}

function _renderHabitTracker(done, streak) {
  return `
  <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 12px;flex-shrink:0">
    <div style="font-size:14px;font-weight:600">${new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</div>
    <button onclick="const n=prompt('Habit name:');if(n?.trim()){S.habits.push({id:Date.now(),name:n.trim()});saveAll();rHabits(document.getElementById('ct'))}" class="btn bp" style="padding:6px 14px;font-size:12px;gap:4px">${I.plus} Add</button>
  </div>
  <div class="cd" style="text-align:center;margin:4px 12px 8px;padding:16px;border-left:3px solid ${done.length===S.habits.length&&S.habits.length?'var(--g)':'var(--ac)'};border-radius:0">
    <div style="font-size:34px;font-weight:700;color:${done.length===S.habits.length&&S.habits.length?'var(--g)':'var(--t1)'}">${done.length}<span style="font-size:16px;color:var(--t4)"> / ${S.habits.length}</span></div>
    ${done.length===S.habits.length&&S.habits.length?`<div style="font-size:12px;color:var(--g);margin-top:4px;font-weight:500;display:flex;align-items:center;justify-content:center;gap:4px">${I.success} All done!</div>` : ''}
  </div>
  <div style="flex:1;overflow-y:auto;padding:0 12px;display:flex;flex-direction:column;gap:6px">
  ${!S.habits.length ? '<div style="text-align:center;padding:24px;color:var(--t4);font-size:12px">Pehli habit add karein</div>' :
  S.habits.map(h => { const ok=done.includes(h.id), st=streak(h); return `
    <div class="cd" style="display:flex;align-items:center;gap:12px;${ok?'border-color:var(--gBorder)':''}">
      <button onclick="const t=td();if(!S.habitLog[t])S.habitLog[t]=[];const i=S.habitLog[t].indexOf(${h.id});if(i>=0)S.habitLog[t].splice(i,1);else S.habitLog[t].push(${h.id});saveAll();rHabits(document.getElementById('ct'))" style="width:26px;height:26px;border-radius:8px;border:2px solid ${ok?'var(--g)':'var(--b2)'};background:${ok?'var(--g)':'var(--c1)'};color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0">${ok?I.check:''}</button>
      <div style="flex:1"><div style="font-size:13px;font-weight:500;${ok?'color:var(--t3)':''}">  ${h.name}</div>
      ${st?`<div style="font-size:10px;color:${st>=7?'var(--g)':'var(--t4)'}">${st} day streak 🔥</div>`:''}</div>
      <button onclick="if(confirm('Delete habit?')){S.habits=S.habits.filter(x=>x.id!==${h.id});saveAll();rHabits(document.getElementById('ct'))}" style="color:var(--t4)">${I.trash}</button>
    </div>`;}).join('')}
  </div>`;
}

// ════════════════════════════════════
//  NEW SECTION CHATS (Change 27, 28)
//  Voice Teacher, Gym Coach, Debate,
//  Face & Hair Care, Medical Advisor
// ════════════════════════════════════

const HABIT_SECTIONS = {
  voice: {
    name: 'Voice Teacher', icon: I.mic,
    greeting: 'Namaste! Main aapka voice teacher hoon. Stammering fix karna ho, voice clear/sharp banana ho, ya attractive speaking seekhni ho — sab help karunga.',
    quickBtns: ['Stammering exercises', 'Voice clarity tips', 'Speaking practice', 'Breathing exercises'],
    sysPrompt: `Tu AAKASH hai — EXPERT VOICE TEACHER & SPEECH THERAPIST.
User ko "aap" se address kar. Encouraging aur patient tone.
Specializations:
- Stammering/stuttering fix karna — practical exercises, breathing techniques
- Voice clarity aur projection improve karna
- Attractive speaking style develop karna — tone, pace, modulation
- Public speaking confidence build karna
- Pronunciation aur diction improve karna

Exercises clearly batao — step-by-step:
1. Exercise ka naam
2. Kaise karna hai (detail mein)
3. Kitni baar karna hai
4. Kya result expect karein
5. Common mistakes avoid karein

Daily practice routine suggest karo. Progress track karo. Motivate karo.
Real examples do. Video/audio exercises describe karo so user samajh sake.`
  },
  gym: {
    name: 'Gym Coach', icon: I.target,
    greeting: 'Namaste! Main aapka fitness coach hoon. Workout plans, exercises, diet — sab guide karunga aapke goals ke hisaab se.',
    quickBtns: ['Workout plan', 'Weight loss tips', 'Muscle building', 'Home exercises'],
    sysPrompt: `Tu AAKASH hai — EXPERT FITNESS & GYM COACH.
User ko "aap" se address kar. Motivating aur practical tone.
Specializations:
- Custom workout plans (gym + home)
- Weight loss / muscle gain / stamina building
- Exercise form aur technique explain karna (detail mein)
- Diet plans (Indian food context — dal, roti, chawal, paneer, chicken)
- Warm-up, cool-down, stretching routines
- Injury prevention aur recovery

Exercises batao toh:
1. Exercise name + target muscle
2. Sets × Reps
3. Rest time
4. Form tips (correct posture kaise)
5. Common mistakes

Weekly plan banao. Progress track karo. Diet ke saath exercise combine karo.
Indian food aur lifestyle ke context mein advice do.`
  },
  debate: {
    name: 'Debate Partner', icon: I.chat,
    greeting: 'Namaste! Main aapka debate partner hoon. Kisi bhi topic pe debate kar sakte hain — aapke uploaded PDFs, finance data, notes, ya koi bhi topic.',
    quickBtns: ['Random topic', 'Finance debate', 'Tech debate', 'From my notes'],
    sysPrompt: `Tu AAKASH hai — INTELLIGENT DEBATE PARTNER.
User ko "aap" se address kar. Sharp but respectful tone.
Rules:
- User jo position le, tu OPPOSITE position le — strong counter-arguments de
- Data aur logic use kar — emotional arguments nahi
- User ke uploaded documents, finance data, notes — sab reference kar jab relevant ho
- Har argument ke saath evidence/example de
- User ki argument mein weakness dhundh ke point out kar
- Debate structured ho — claim → evidence → rebuttal
- End mein summarize kar ki kya seekha — dono sides
- Critical thinking sharpen karna goal hai
- Kabhi personal attack nahi — ideas pe debate kar
- User ko compliment kar jab accha point banaye

Available data se debate kar: [FINANCE DATA], [NOTES], [VAULT], [LIFE LESSONS] — sab context use kar.`
  },
  face: {
    name: 'Face & Hair Care', icon: I.user,
    greeting: 'Namaste! Main aapka skincare aur haircare advisor hoon. Skin whitening, anti-aging, hair regrowth — sab guide karunga.',
    quickBtns: ['Skin whitening', 'Hair regrowth', 'Anti-aging routine', 'Home remedies'],
    sysPrompt: `Tu AAKASH hai — SKINCARE & HAIRCARE EXPERT.
User ko "aap" se address kar. Caring aur knowledgeable tone.
Specializations:
- Skin whitening / brightening — safe methods, home remedies, products
- Anti-aging routines — morning & night skincare
- Hair regrowth — treatments, oils, diet, supplements
- Acne/pimple treatment — causes aur solutions
- Dark circles, pigmentation, tan removal
- Beard growth tips
- Daily skincare routine (Indian climate ke liye)
- Diet for skin & hair health
- Product recommendations (Indian brands — Himalaya, Mamaearth, etc.)

Routines clearly batao:
1. Step-by-step morning routine
2. Night routine
3. Weekly treatments (masks, oils)
4. Diet recommendations
5. What to avoid

Indian home remedies include karo — haldi, neem, aloe vera, etc.
Always mention ki severe cases mein dermatologist se milein.`
  },
  medical: {
    name: 'Medical Advisor', icon: I.shield,
    greeting: 'Namaste! Main aapka health advisor hoon. Diet, symptoms, health queries — kuch bhi puchiye. (Note: Professional doctor ki jagah nahi hoon)',
    quickBtns: ['Diet plan', 'Vitamin guide', 'Sleep tips', 'Immunity boost'],
    sysPrompt: `Tu AAKASH hai — HEALTH & MEDICAL ADVISOR.
User ko "aap" se address kar. Caring, informative, responsible tone.
Specializations:
- Diet plans (Indian food context — vegetarian & non-veg)
- Vitamin & supplement guidance
- Common symptoms explain karna
- Immunity boosting tips
- Sleep improvement
- Stress management
- Digestive health
- Seasonal health tips (Indian weather)
- Exercise recommendations for health conditions
- First aid basics

IMPORTANT RULES:
- Hamesha disclaimer do: "Main AI hoon, professional doctor ki jagah nahi. Serious symptoms mein doctor se zarur milein."
- Dangerous medical advice mat do — safe, general guidance do
- Medicines recommend mat karo — sirf general categories mention karo
- Emergency symptoms pehchano aur immediately doctor jaane bolo
- Diet aur lifestyle changes pe focus karo — medicines se zyada`
  }
};

// ── Initialize section chat data for new sections ──
function _ensureHabitSections() {
  if (!S.secChats) S.secChats = {};
  ['voice','gym','debate','face','medical'].forEach(s => {
    if (!S.secChats[s]) S.secChats[s] = { chats:[], activeId:null };
  });
  // Register in SECTION_CHAT_CONFIG if not exists
  Object.keys(HABIT_SECTIONS).forEach(key => {
    if (!SECTION_CHAT_CONFIG[key]) {
      const sec = HABIT_SECTIONS[key];
      SECTION_CHAT_CONFIG[key] = {
        name: sec.name,
        icon: key,
        greeting: sec.greeting,
        quickBtns: sec.quickBtns,
        getContext: () => {
          let ctx = '';
          // Add habit data for all habit sections
          const t = td(), done = S.habitLog[t] || [];
          ctx += `\n[HABITS] Today:${done.length}/${S.habits.length}`;
          ctx += `\nHabits:${S.habits.map(h => `${h.name}(${done.includes(h.id)?'done':'pending'})`).join(', ')||'none'}`;
          // Add finance data for debate
          if (key === 'debate' && S.finance) {
            const tot = S.finance.expenses.reduce((s,e) => s + e.amount, 0);
            ctx += `\n[FINANCE] Salary:₹${S.finance.salary||0}|Spent:₹${tot}`;
          }
          // Add notes for debate
          if (key === 'debate' && S.notes?.length) {
            ctx += `\n[NOTES] ${S.notes.slice(0,5).map(n=>n.title).join(', ')}`;
          }
          return ctx;
        },
        sysPrompt: sec.sysPrompt
      };
    }
  });
}

function _renderSectionChat(section, container) {
  _ensureHabitSections();
  renderEmbeddedChat(section, container);
}

// Auto-initialize on load
_ensureHabitSections();
