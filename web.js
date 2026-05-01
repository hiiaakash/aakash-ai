// ════════════════════════════════════
//  AAKASH AI v2 — Web Reader (web.js)
//  Full URL reader + Store + PDF + Save Anywhere + Deep Q&A Teaching
//  - PDF → Downloads (asks name first)
//  - Save to ANY tab (Notes/Vault/Finance)
//  - Deep reading — page/para/line/word level Q&A
//  - Teaching mode — AI explains any part in detail
//  - ZERO words lost — complete content always
// ════════════════════════════════════

// ── Global content store ──
const _webStore = [];

// ── URL detection ──
function extractUrls(text) {
  if (!text || typeof text !== 'string') return [];
  const m = text.match(/https?:\/\/[^\s<>"'{}|\\^`\[\]()]+/gi) || [];
  return [...new Set(m.map(u => u.replace(/[.,;:!?)]+$/, '')))];
}

// ── Dynamic page check ──
function isDynamicPage(url) {
  const d = ['claude.ai','chat.openai.com','chatgpt.com','gemini.google.com','poe.com','perplexity.ai','twitter.com','x.com','instagram.com','facebook.com','linkedin.com','threads.net','reddit.com','docs.google.com','notion.so','figma.com','vercel.app','netlify.app','github.io'];
  try { return d.some(x => new URL(url).hostname.replace('www.','').includes(x)); }
  catch { return false; }
}

// ── HTML → Text ──
function htmlToText(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,style,nav,footer,header,aside,iframe,noscript,svg,form,button,input,select,textarea,.ad,.ads,.sidebar,.cookie,.popup,.modal,.overlay,.banner,[role="navigation"],[role="banner"],[aria-hidden="true"]').forEach(el => el.remove());
  const main = doc.querySelector('main,article,[role="main"],.content,.post,.article,.entry-content,.post-content,#content,#main') || doc.body;
  if (!main) return '';
  return (main.innerText || main.textContent || '').replace(/\t/g,' ').replace(/[ ]{2,}/g,' ').replace(/\n[ ]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}

// ── Clean junk ──
function cleanContent(text) {
  if (!text) return '';
  return text.replace(/Cookie\s*(policy|consent|settings)[\s\S]{0,200}/gi,'').replace(/(Subscribe|Sign up|Newsletter|Follow us)[\s\S]{0,150}/gi,'').replace(/©.*?\d{4}[\s\S]{0,100}/gi,'').replace(/(Privacy Policy|Terms of Service).*$/gim,'').replace(/All rights reserved\.?/gi,'').replace(/\t/g,' ').replace(/[ ]{2,}/g,' ').replace(/\n{3,}/g,'\n\n').trim();
}

// ════════════════════════════════════
//  FETCHERS
// ════════════════════════════════════

async function fetchViaJina(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 35000);
    const r = await fetch(`https://r.jina.ai/${url}`, { signal:ctrl.signal, headers:{'Accept':'text/plain','X-Return-Format':'text'} });
    clearTimeout(t);
    if (!r.ok) return null;
    let text = (await r.text()).replace(/^Title:.*\n/m,'').replace(/^URL Source:.*\n/m,'').replace(/^Markdown Content:\n/m,'').replace(/\n{3,}/g,'\n\n').trim();
    if (text && text.replace(/\s/g,'').length > 50) return { ok:true, url, content:text, charCount:text.length, method:'jina' };
  } catch (e) { console.log('Jina failed:', e.message); }
  return null;
}

const CORS_PROXIES = [
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
];

async function fetchViaCorsProxy(url) {
  for (const pf of CORS_PROXIES) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 12000);
      const r = await fetch(pf(url), { signal:ctrl.signal, headers:{'Accept':'text/html,application/json,text/plain,*/*'} });
      clearTimeout(t);
      if (!r.ok) continue;
      const ct = r.headers.get('content-type') || '';
      let text = '';
      if (ct.includes('application/json')) { const j=await r.json(); const raw=j.contents||j.data||j.body||JSON.stringify(j); text=(raw.includes('<html')||raw.includes('<body'))?htmlToText(raw):raw; }
      else if (ct.includes('text/html')||ct.includes('text/xml')) text = htmlToText(await r.text());
      else text = await r.text();
      if (text && text.replace(/\s/g,'').length > 30) return { ok:true, url, content:text, charCount:text.length, method:'cors-proxy' };
    } catch { continue; }
  }
  return null;
}

async function fetchUrlContent(url) {
  if (!url.startsWith('http')) return { ok:false, url, error:'Invalid URL' };
  if (isDynamicPage(url)) return (await fetchViaJina(url)) || (await fetchViaCorsProxy(url)) || { ok:false, url, error:'Page read nahi ho payi' };
  return (await fetchViaCorsProxy(url)) || (await fetchViaJina(url)) || { ok:false, url, error:'Page read nahi ho payi' };
}

async function fetchAllUrls(urls) {
  const results = [];
  for (const url of urls.slice(0, 3)) results.push(await fetchUrlContent(url));
  return results;
}

// ════════════════════════════════════
//  STORE — Full content + paragraph index for deep Q&A
// ════════════════════════════════════

function storeWebContent(fetchResult) {
  if (!fetchResult.ok) return null;
  const content = cleanContent(fetchResult.content);
  let title = content.split('\n')[0]?.slice(0, 80) || fetchResult.url;
  if (title.length > 80) title = title.slice(0, 77) + '...';

  // Index paragraphs
  const paragraphs = [];
  let num = 0;
  for (const block of content.split(/\n\n+/)) {
    if (block.trim().length > 5) {
      num++;
      paragraphs.push({ num, text: block.trim() });
    }
  }

  // Index lines
  const lines = content.split('\n').map((l, i) => ({ num: i + 1, text: l }));

  const entry = { url:fetchResult.url, content, title, paragraphs, lines, charCount:content.length, wordCount:content.split(/\s+/).length, timestamp:Date.now() };

  const idx = _webStore.findIndex(w => w.url === fetchResult.url);
  if (idx >= 0) _webStore[idx] = entry;
  else _webStore.push(entry);
  while (_webStore.length > 10) _webStore.shift();
  return entry;
}

function getLatestStored() { return _webStore[_webStore.length - 1]; }

// ════════════════════════════════════
//  SAVE — To any tab (Notes / Vault / Finance)
//  AI triggers via [SAVE_NOTES], [SAVE_VAULT], etc.
// ════════════════════════════════════

window.saveWebTo = function(target, customTitle) {
  const stored = getLatestStored();
  if (!stored) { showToast('Koi content nahi hai'); return false; }
  const title = customTitle || stored.title;

  switch (target) {
    case 'notes':
      if (S.notes.some(n => n.webUrl === stored.url)) { showToast('Already in Notes'); return false; }
      S.notes.unshift({ id:Date.now(), title:'🌐 '+title, content:stored.content, folder:'General', uploaded:true, fileType:'text', webUrl:stored.url, webWordCount:stored.wordCount, createdAt:new Date().toISOString() });
      saveAll();
      showToast('Notes mein save ho gaya!');
      return true;

    case 'vault':
      S.entries.unshift({ id:Date.now(), type:'note', title:'🌐 '+title, content:stored.content, done:false, webUrl:stored.url, createdAt:new Date().toISOString() });
      saveAll();
      showToast('Vault mein save ho gaya!');
      return true;

    case 'task':
      S.entries.unshift({ id:Date.now(), type:'task', title:'📖 Read: '+title, content:'Source: '+stored.url+'\nWords: '+stored.wordCount, done:false, createdAt:new Date().toISOString() });
      saveAll();
      showToast('Task create ho gaya!');
      return true;

    default:
      showToast('Invalid target');
      return false;
  }
};

// ── Delete web content from any tab ──
window.deleteWebFrom = function(target) {
  const stored = getLatestStored();
  if (!stored) { showToast('Koi content nahi hai'); return false; }

  switch (target) {
    case 'notes':
      const ni = S.notes.findIndex(n => n.webUrl === stored.url);
      if (ni >= 0) { S.notes.splice(ni, 1); saveAll(); showToast('Notes se delete ho gaya!'); return true; }
      showToast('Notes mein nahi mila');
      return false;

    case 'vault':
      const vi = S.entries.findIndex(e => e.webUrl === stored.url);
      if (vi >= 0) { S.entries.splice(vi, 1); saveAll(); showToast('Vault se delete ho gaya!'); return true; }
      showToast('Vault mein nahi mila');
      return false;

    default:
      showToast('Invalid target');
      return false;
  }
};

// ════════════════════════════════════
//  PDF — Downloads folder, asks name, COMPLETE content
// ════════════════════════════════════

window._pendingPDF = null;

window.showPDFNamePrompt = function() {
  const stored = window._pendingPDF || getLatestStored();
  if (!stored) { showToast('Koi content nahi hai'); return; }
  const def = stored.title.replace(/[^a-zA-Z0-9\u0900-\u097F _-]/g,'').slice(0,50).trim() || 'web-content';
  const name = prompt('PDF ka naam batao:', def);
  if (name && name.trim()) generateCompletePDF(stored, name.trim());
};

function generateCompletePDF(stored, fileName) {
  const maxW=72, lh=14, margin=50, pageH=792, pageW=612;
  const linesPerPage = Math.floor((pageH - 2*margin) / lh);
  const esc = s => s.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');

  function wrapText(text) {
    const lines = [];
    for (const raw of text.split('\n')) {
      if (!raw.trim()) { lines.push(''); continue; }
      const words = raw.split(/\s+/);
      let line = '';
      for (const w of words) {
        if ((line+' '+w).length > maxW && line) { lines.push(line); line = w; }
        else line = line ? line+' '+w : w;
      }
      if (line) lines.push(line);
    }
    return lines;
  }

  const header = `${stored.title}\n${'='.repeat(60)}\nSource: ${stored.url}\nDate: ${new Date().toLocaleString('en-IN')}\nWords: ${stored.wordCount?.toLocaleString()||'N/A'} | Chars: ${stored.charCount.toLocaleString()}\n${'='.repeat(60)}\n\n`;
  const allLines = wrapText(header + stored.content);

  const pages = [];
  for (let i=0; i<allLines.length; i+=linesPerPage) pages.push(allLines.slice(i, i+linesPerPage));
  if (!pages.length) pages.push(['(empty)']);

  const objs = [];
  objs.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objs.push(`2 0 obj\n<< /Type /Pages /Kids [${pages.map((_,i)=>`${i+4} 0 R`).join(' ')}] /Count ${pages.length} >>\nendobj`);
  objs.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj');

  pages.forEach((pg, pi) => {
    const sl = [`BT /F1 10 Tf ${margin} ${pageH-margin} Td ${lh} TL`];
    pg.forEach(l => sl.push(`(${esc(l)}) Tj T*`));
    sl.push(`(${' '.repeat(maxW-12)}Page ${pi+1}/${pages.length}) Tj T*`);
    sl.push('ET');
    const stream = sl.join('\n');
    objs.push(`${pi+4} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents ${pi+4+pages.length} 0 R /Resources << /Font << /F1 3 0 R >> >> >>\nendobj`);
    objs.push(`${pi+4+pages.length} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`);
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (const obj of objs) { offsets.push(pdf.length); pdf += obj + '\n'; }
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length+1}\n0000000000 65535 f \n`;
  offsets.forEach(o => { pdf += String(o).padStart(10,'0') + ' 00000 n \n'; });
  pdf += `trailer\n<< /Size ${objs.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const blob = new Blob([pdf], { type:'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (fileName.endsWith('.pdf') ? fileName : fileName + '.pdf');
  a.click();
  URL.revokeObjectURL(a.href);
  showToast(`"${fileName}.pdf" downloaded! (${pages.length} pages)`);
}

// ════════════════════════════════════
//  AI CONTEXT — Summary + Options (first msg)
// ════════════════════════════════════

function buildUrlContext(fetchResults) {
  const good = fetchResults.filter(f => f.ok);
  if (!good.length) return '';

  return '\n\n[FETCHED WEB CONTENT]\n' + good.map(f => {
    const stored = _webStore.find(w => w.url === f.url);
    const pCount = stored?.paragraphs?.length || 0;
    const wCount = stored?.wordCount || 0;
    const preview = cleanContent(f.content).slice(0, 2500);
    return `──── ${f.url} ────
Stats: ${wCount.toLocaleString()} words | ${f.charCount.toLocaleString()} chars | ${pCount} paragraphs
Preview:
${preview}
${f.charCount > 2500 ? `\n[...baaki ${(f.charCount-2500).toLocaleString()} chars stored hain. User page/para/line/word level tak kuch bhi puchh sakta hai — full content stored hai.]` : ''}
────────────────────

IMPORTANT — User ko bas short summary de aur puchh:
1. PDF banau? (naam poochhna)
2. Kuch puchhna hai? (koi bhi part — line, para, page, word)

Save/Delete — SIRF jab user KHUD bole chat mein:
- "Notes mein save kar" / "Notes mein daal do" → [SAVE_NOTES]
- "Vault mein save kar" → [SAVE_VAULT]
- "Task bana" → [SAVE_TASK]
- "Notes se delete kar" / "hata do" → [DELETE_NOTES]
- "Vault se delete kar" → [DELETE_VAULT]
Kabhi khud se save mat kar. Kabhi options mein save mat dikha. Sirf jab user bole.`;
  }).join('\n\n');
}

// ════════════════════════════════════
//  DEEP Q&A — Page/Para/Line/Word level precision
// ════════════════════════════════════

function buildQAContext(question) {
  if (!_webStore.length) return '';
  const stored = getLatestStored();
  if (!stored) return '';

  const q = question.toLowerCase();
  const content = stored.content;
  const paras = stored.paragraphs;
  const lines = stored.lines;
  let relevant = [];
  let totalChars = 0;
  const maxChars = 10000;

  // ── Page level: "page 5" ──
  const pageMatch = q.match(/page\s*(\d+)/i);
  if (pageMatch) {
    const pn = parseInt(pageMatch[1]);
    const cpp = 3000;
    const chunk = content.slice((pn-1)*cpp, pn*cpp);
    if (chunk) relevant.push(`[Page ${pn} approx]:\n${chunk}`);
  }

  // ── Paragraph level: "para 3", "3rd paragraph" ──
  const paraMatch = q.match(/(?:para(?:graph)?|para)\s*(?:#|no\.?)?\s*(\d+)|(\d+)(?:st|nd|rd|th)\s*para/i);
  if (paraMatch) {
    const pn = parseInt(paraMatch[1] || paraMatch[2]);
    const nearby = paras.filter(p => Math.abs(p.num - pn) <= 2);
    if (nearby.length) relevant.push(`[Para ${nearby[0].num}-${nearby[nearby.length-1].num}]:\n${nearby.map(p => `[Para ${p.num}] ${p.text}`).join('\n\n')}`);
  }

  // ── Line level: "line 50", "50th line" ──
  const lineMatch = q.match(/line\s*(\d+)|(\d+)(?:st|nd|rd|th)\s*line/i);
  if (lineMatch) {
    const ln = parseInt(lineMatch[1] || lineMatch[2]);
    const start = Math.max(0, ln-3);
    const end = Math.min(lines.length, ln+5);
    relevant.push(`[Lines ${start+1}-${end}]:\n${lines.slice(start, end).map(l => `[Line ${l.num}] ${l.text}`).join('\n')}`);
  }

  // ── Word/phrase search: "yeh word", specific terms ──
  if (!relevant.length) {
    const stopWords = ['kya','hai','mein','yeh','woh','koi','bhi','aur','the','and','for','this','that','what','how','why','about','iske','uske','batao','samjhao','explain','padho','read','bata','bol','de','do','ka','ki','ke','se','ne','ko','pe','ye','wo','toh','na','mat','nhi','nahi','haan','or','ya'];
    const keywords = q.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));

    if (keywords.length) {
      for (const para of paras) {
        const pl = para.text.toLowerCase();
        if (keywords.some(kw => pl.includes(kw))) {
          if (totalChars + para.text.length < maxChars) {
            relevant.push(`[Para ${para.num}] ${para.text}`);
            totalChars += para.text.length;
          }
        }
      }
    }
  }

  // ── Fallback: start + end ──
  if (!relevant.length) {
    relevant.push(`[Start]:\n${content.slice(0, 4000)}\n\n[...]\n\n[End]:\n${content.slice(-2000)}`);
  }

  return `\n\n[STORED CONTENT — Deep Q&A + Teaching Mode]
Source: ${stored.url}
Total: ${stored.wordCount.toLocaleString()} words | ${stored.charCount.toLocaleString()} chars | ${paras.length} paragraphs
User kuch bhi puchh sakta hai — page/para/line/word level. Full content stored hai.

Relevant sections:
${relevant.join('\n\n---\n\n')}

INSTRUCTIONS:
- Answer PRECISELY from content above
- Teaching mode: explain simply, give examples, ask "samajh aaya?"
- Agar user bole PDF → [MAKE_PDF]
- Save/Delete SIRF jab user KHUD bole:
  save notes → [SAVE_NOTES] | save vault → [SAVE_VAULT] | task → [SAVE_TASK]
  delete notes → [DELETE_NOTES] | delete vault → [DELETE_VAULT]
- Kabhi mat bol "content nahi hai" — poora stored hai, specific section dhundh ke bata`;
}

// ── Detect follow-up about fetched content ──
function isFollowUpAboutWeb(text) {
  if (!_webStore.length) return false;
  const t = text.toLowerCase();
  return /iss?(?:ka|ki|ke|me|mein)|link|page|chat|article|content|website|usme|woh\s*jo|upar\s*wala|shared|pehle\s*wala|us(?:ka|ki|ke)|bataya|padha|read|abhi\s*jo|ye\s*jo|para|paragraph|line|word|pdf|save|notes\s*mein|vault\s*mein/i.test(t);
}
