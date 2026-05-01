// ════════════════════════════════════
//  AAKASH AI v2 — Web Reader (web.js)
//  Fetch, read & analyze any URL/link
//  Jina Reader (JS-rendered) + CORS proxy fallback
//  Handles: Claude chats, ChatGPT chats, any website
// ════════════════════════════════════

// ── Detect URLs in text ──
function extractUrls(text) {
  if (!text || typeof text !== 'string') return [];
  const urlRegex = /https?:\/\/[^\s<>"'{}|\\^`\[\]()]+/gi;
  const matches = text.match(urlRegex) || [];
  const cleaned = matches.map(u => u.replace(/[.,;:!?)]+$/, ''));
  return [...new Set(cleaned)];
}

// ── Check if URL is a JS-heavy/dynamic page ──
function isDynamicPage(url) {
  const dynamic = [
    'claude.ai', 'chat.openai.com', 'chatgpt.com',
    'gemini.google.com', 'poe.com', 'perplexity.ai',
    'twitter.com', 'x.com', 'instagram.com', 'facebook.com',
    'linkedin.com', 'threads.net', 'reddit.com',
    'docs.google.com', 'notion.so', 'figma.com',
    'vercel.app', 'netlify.app', 'github.io'
  ];
  try {
    const host = new URL(url).hostname.replace('www.', '');
    return dynamic.some(d => host.includes(d));
  } catch { return false; }
}

// ── Strip HTML → clean readable text ──
function htmlToText(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const junk = 'script,style,nav,footer,header,aside,iframe,noscript,svg,form,button,input,select,textarea,.ad,.ads,.sidebar,.cookie,.popup,.modal,.overlay,.banner,[role="navigation"],[role="banner"],[aria-hidden="true"]';
  doc.querySelectorAll(junk).forEach(el => el.remove());
  const main = doc.querySelector('main, article, [role="main"], .content, .post, .article, .entry-content, .post-content, #content, #main') || doc.body;
  if (!main) return '';
  let text = main.innerText || main.textContent || '';
  text = text.replace(/\t/g, ' ').replace(/[ ]{2,}/g, ' ').replace(/\n[ ]+/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return text;
}

// ════════════════════════════════════
//  TIER 1: Jina Reader — renders JavaScript
//  Works with Claude/ChatGPT shared chats, SPAs, dynamic pages
//  Free, no API key needed
//  Format: https://r.jina.ai/{full_url}
// ════════════════════════════════════
async function fetchViaJina(url, maxChars = 15000) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s — JS rendering takes time

    const r = await fetch(`https://r.jina.ai/${url}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/plain',
        'X-Return-Format': 'text'
      }
    });
    clearTimeout(timeout);

    if (!r.ok) return null;

    let text = await r.text();

    // Clean up Jina output
    text = text
      .replace(/^Title:.*\n/m, '')
      .replace(/^URL Source:.*\n/m, '')
      .replace(/^Markdown Content:\n/m, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (text && text.replace(/\s/g, '').length > 50) {
      return {
        ok: true,
        url,
        content: text.slice(0, maxChars),
        truncated: text.length > maxChars,
        charCount: text.length,
        method: 'jina'
      };
    }
  } catch (e) {
    console.log('Jina Reader failed:', e.message);
  }
  return null;
}

// ════════════════════════════════════
//  TIER 2: CORS Proxies — for simpler static pages
//  Faster but can't render JavaScript
// ════════════════════════════════════
const CORS_PROXIES = [
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
];

async function fetchViaCorsProxy(url, maxChars = 12000) {
  for (const proxyFn of CORS_PROXIES) {
    try {
      const proxyUrl = proxyFn(url);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const r = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'text/html,application/json,text/plain,*/*' }
      });
      clearTimeout(timeout);

      if (!r.ok) continue;

      const contentType = r.headers.get('content-type') || '';
      let text = '';

      if (contentType.includes('application/json')) {
        const json = await r.json();
        const raw = json.contents || json.data || json.body || JSON.stringify(json);
        text = (raw.includes('<html') || raw.includes('<body') || raw.includes('<div')) ? htmlToText(raw) : raw;
      } else if (contentType.includes('text/html') || contentType.includes('text/xml')) {
        text = htmlToText(await r.text());
      } else {
        text = await r.text();
      }

      if (text && text.replace(/\s/g, '').length > 30) {
        return {
          ok: true, url,
          content: text.slice(0, maxChars),
          truncated: text.length > maxChars,
          charCount: text.length,
          method: 'cors-proxy'
        };
      }
    } catch (e) { continue; }
  }
  return null;
}

// ════════════════════════════════════
//  MAIN: Smart fetch — picks best method
//  Dynamic pages → Jina first (renders JS)
//  Static pages → CORS proxy first (faster), Jina fallback
// ════════════════════════════════════
async function fetchUrlContent(url, maxChars = 15000) {
  if (!url.startsWith('http')) return { ok: false, url, error: 'Invalid URL' };

  if (isDynamicPage(url)) {
    // Dynamic/JS page → Jina first (only option that renders JS)
    const jina = await fetchViaJina(url, maxChars);
    if (jina) return jina;
    const cors = await fetchViaCorsProxy(url, maxChars);
    if (cors) return cors;
  } else {
    // Static page → CORS proxy first (faster), Jina fallback
    const cors = await fetchViaCorsProxy(url, maxChars);
    if (cors) return cors;
    const jina = await fetchViaJina(url, maxChars);
    if (jina) return jina;
  }

  return { ok: false, url, error: 'Page read nahi ho payi — blocked ya empty hai' };
}

// ── Fetch multiple URLs (max 3) ──
async function fetchAllUrls(urls) {
  const results = [];
  for (const url of urls.slice(0, 3)) {
    results.push(await fetchUrlContent(url));
  }
  return results;
}

// ── Build context string from fetched URLs ──
function buildUrlContext(fetchResults) {
  const good = fetchResults.filter(f => f.ok);
  if (!good.length) return '';

  return '\n\n[FETCHED WEB CONTENT — User ne ye links share kiye hain. Inhe padh ke jawab de.]\n' +
    good.map(f =>
      `──── ${f.url} ────\n${f.content}${f.truncated ? '\n[...content truncated, total ' + f.charCount + ' chars]' : ''}\n────────────────────`
    ).join('\n\n');
}
