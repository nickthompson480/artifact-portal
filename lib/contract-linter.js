/**
 * contract-linter.js
 *
 * Pure function that lints an HTML string against Design Contract v1.
 * No imports, no side effects, no file I/O. Regex-only, no DOM parser.
 */

/**
 * @param {string} html
 * @param {{ title?: string|null, category?: string|null }} [opts]
 * @returns {{ valid: boolean, findings: Array<{severity: 'error'|'warning', rule: string, message: string}> }}
 */
export function lintContract(html, opts = {}) {
  const findings = [];

  function error(rule, message) {
    findings.push({ severity: 'error', rule, message });
  }

  function warning(rule, message) {
    findings.push({ severity: 'warning', rule, message });
  }

  // Extract sections
  const headMatch = html.match(/<head[\s\S]*?<\/head>/i);
  const head = headMatch ? headMatch[0] : html;

  const styleBlocks = [...html.matchAll(/<style[\s\S]*?<\/style>/gi)].map(m => m[0]).join('\n');
  const scriptBlocks = [...html.matchAll(/<script[\s\S]*?<\/script>/gi)].map(m => m[0]).join('\n');

  // --- Hard requirements (error severity) ---

  // r1: html5-doctype
  if (!html.toLowerCase().includes('<!doctype html')) {
    error('html5-doctype', 'Missing <!DOCTYPE html> declaration');
  }

  // r2: html5-lang
  if (!/<html[^>]+lang=/i.test(html)) {
    error('html5-lang', 'Missing lang= attribute on <html> element');
  }

  // r3: html5-charset
  if (!/<meta[^>]+charset=/i.test(head)) {
    error('html5-charset', 'Missing <meta charset=> in <head>');
  }

  // r4: html5-viewport
  if (!/<meta[^>]+name=["']viewport["']/i.test(head)) {
    error('html5-viewport', 'Missing <meta name="viewport"> in <head>');
  }

  // r5: html5-title
  const titleMatch = html.match(/<title>\s*([^<]+?)\s*<\/title>/i);
  if (!titleMatch || !titleMatch[1] || titleMatch[1].trim() === '') {
    error('html5-title', 'Missing or empty <title> element');
  }

  // r6: design-contract-stamp
  if (!html.includes('<!-- design-contract: v1 -->')) {
    error('design-contract-stamp', 'Missing <!-- design-contract: v1 --> comment');
  }

  // r7: color-scheme-meta
  if (!/<meta[^>]+name=["']color-scheme["']/i.test(head)) {
    error('color-scheme-meta', 'Missing <meta name="color-scheme"> in <head>');
  }

  // r8: opaque-background (two-step)
  if (!/background(?:-color)?\s*:/i.test(styleBlocks)) {
    error('opaque-background', 'No background/background-color declaration found in any <style> block');
  } else if (/background(?:-color)?\s*:\s*(?:transparent|rgba?\([^)]*,\s*0[^)]*\))/i.test(styleBlocks)) {
    error('opaque-background-transparent', 'background or background-color is set to transparent or rgba with 0 alpha');
  }

  // r9: body-min-height
  if (!/min-height\s*:\s*100%/i.test(styleBlocks)) {
    error('body-min-height', 'No min-height: 100% found in <style> blocks — body must fill the viewport');
  }

  // r10: overflow-x-hidden
  if (!/overflow-x\s*:\s*hidden/i.test(styleBlocks)) {
    error('overflow-x-hidden', 'No overflow-x: hidden found in <style> blocks');
  }

  // r11: ultra-wide-clamp-layout
  {
    const pxValues = [];
    for (const m of styleBlocks.matchAll(/max-width\s*:\s*(\d+)px/gi)) {
      pxValues.push(parseInt(m[1], 10));
    }
    if (pxValues.length === 0) {
      // Check for dynamic/percentage values that are acceptable
      const hasDynamic = /max-width\s*:\s*100%/i.test(styleBlocks) || /max-width\s*:\s*100vw/i.test(styleBlocks);
      if (!hasDynamic) {
        error('ultra-wide-clamp-layout', 'No max-width ≤ 1600px found for layout clamp');
      }
    } else {
      const minVal = Math.min(...pxValues);
      if (minVal > 1600) {
        error('ultra-wide-clamp-layout', 'No max-width ≤ 1600px found for layout clamp');
      }
    }
  }

  // r12: ultra-wide-clamp-prose
  {
    const chValues = [];
    for (const m of styleBlocks.matchAll(/max-width\s*:\s*(\d+(?:\.\d+)?)ch/gi)) {
      chValues.push(parseFloat(m[1]));
    }
    if (chValues.length === 0 || Math.min(...chValues) > 72) {
      error('ultra-wide-clamp-prose', 'No max-width ≤ 72ch found for prose clamp');
    }
  }

  // r13: min-font-size (warning)
  {
    const fontSizes = [...styleBlocks.matchAll(/font-size\s*:\s*([^;]+)/gi)].map(m => m[1].trim());
    for (const val of fontSizes) {
      const pxMatch = val.match(/^(\d+(?:\.\d+)?)px$/);
      if (pxMatch) {
        const size = parseFloat(pxMatch[1]);
        if (size < 16) {
          warning('min-font-size', `font-size value < 16px found (${val}) — verify body text is ≥ 16px`);
          break;
        }
      }
    }
  }

  // r14: prefers-reduced-motion
  if (!/prefers-reduced-motion\s*:\s*reduce/i.test(styleBlocks)) {
    error('prefers-reduced-motion', 'Missing @media (prefers-reduced-motion: reduce) block in <style>');
  }

  // r15: external-links
  {
    const externalLinks = [...html.matchAll(/<a\s[^>]*href=["']https?:\/\/[^"']+["'][^>]*>/gi)];
    let badCount = 0;
    for (const m of externalLinks) {
      const tag = m[0];
      const hasTargetBlank = /target=["']_blank["']/i.test(tag);
      const relMatch = tag.match(/rel=["']([^"']*)["']/i);
      const hasNoopener = relMatch ? /noopener/.test(relMatch[1]) : false;
      if (!hasTargetBlank || !hasNoopener) {
        badCount++;
      }
    }
    if (badCount > 0) {
      error('external-links', `${badCount} external link(s) missing target="_blank" and/or rel="noopener noreferrer"`);
    }
  }

  // r16: no-storage-access
  const storageChecks = [
    { pattern: /localStorage/, rule: 'no-localstorage', msg: 'localStorage access found — storage APIs are blocked in the sandboxed iframe' },
    { pattern: /sessionStorage/, rule: 'no-sessionstorage', msg: 'sessionStorage access found — storage APIs are blocked in the sandboxed iframe' },
    { pattern: /document\.cookie/, rule: 'no-cookies', msg: 'document.cookie access found — cookie access is blocked in the sandboxed iframe' },
    { pattern: /window\.parent\./, rule: 'no-window-parent', msg: 'window.parent. access found — cross-frame access is blocked in the sandboxed iframe' },
    { pattern: /indexedDB/, rule: 'no-indexeddb', msg: 'indexedDB access found — storage APIs are blocked in the sandboxed iframe' },
    { pattern: /navigator\.clipboard\.read/, rule: 'no-clipboard-read', msg: 'navigator.clipboard.read found — clipboard read is blocked in the sandboxed iframe' },
  ];
  for (const check of storageChecks) {
    if (check.pattern.test(scriptBlocks)) {
      error(check.rule, check.msg);
    }
  }

  // r17: single-file (no relative paths)
  {
    const relativePaths = [...html.matchAll(/(?:\s)(src|href)=["'](?!https?:\/\/|\/\/|\/|data:|#|mailto:|tel:|blob:|javascript:)[^"']*["']/gi)];
    if (relativePaths.length > 0) {
      error('single-file', 'Relative src/href paths found — all assets must be inline or HTTPS/root-relative');
    }
  }

  // r18: https-only
  {
    const httpMatches = [...html.matchAll(/(?:src|href)=["']http:\/\/([^"'/]*)/gi)];
    const nonLocalhost = httpMatches.filter(m => {
      const host = m[1];
      return !host.startsWith('localhost') && !host.startsWith('127.0.0.1');
    });
    if (nonLocalhost.length > 0) {
      error('https-only', 'Non-HTTPS (plain http://) src/href found — all external resources must use HTTPS');
    }
  }

  // r19: adaptive-color-listener
  if (!scriptBlocks.includes('portal:theme')) {
    error('adaptive-color-listener', 'Missing portal:theme message listener for adaptive color scheme');
  }

  // r20: adaptive-color-css
  if (!/\[data-scheme/i.test(styleBlocks)) {
    error('adaptive-color-css', 'Missing [data-scheme] CSS selector for adaptive color scheme');
  }

  // r21: title-match (only if opts.title is a non-empty string)
  if (opts.title && typeof opts.title === 'string' && opts.title.trim() !== '') {
    const tm = html.match(/<title>\s*([^<]+?)\s*<\/title>/i);
    if (tm && tm[1]) {
      const decoded = decodeEntities(tm[1].trim());
      const expected = opts.title.trim();
      if (decoded !== expected) {
        error('title-match', `<title> "${decoded}" does not match expected title "${expected}"`);
      }
    }
    // If no title found, r5 already covers it
  }

  // r22: form-action (warning)
  if (/<form[^>]+action=["']https?:\/\//i.test(html)) {
    warning('form-action-attribute', 'Form with action= pointing to external URL will silently fail in the sandboxed iframe. Use JS onsubmit handler instead.');
  }

  // --- Strong recommendations (warning severity) ---

  // w1: og-tags
  if (!/<meta[^>]+property=["']og:title["']/i.test(head)) {
    if (!html.includes('design-contract: skip og-tags')) {
      warning('og-tags', 'Missing <meta property="og:title"> — add OG tags or suppress with <!-- design-contract: skip og-tags -->');
    }
  }

  // w2: google-fonts-display-swap
  {
    const fontUrls = [...html.matchAll(/fonts\.googleapis\.com[^"']*/gi)].map(m => m[0]);
    const badFonts = fontUrls.filter(u => !u.includes('display=swap'));
    if (badFonts.length > 0) {
      warning('google-fonts-display-swap', `${badFonts.length} Google Fonts URL(s) missing display=swap — add &display=swap to prevent invisible text during load`);
    }
  }

  // w3: one-h1
  {
    const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    if (h1Count === 0) {
      warning('one-h1', 'No <h1> found — every page should have exactly one top-level heading');
    } else if (h1Count > 1) {
      warning('one-h1', `Multiple <h1> elements found (${h1Count}) — use only one <h1> per page`);
    }
  }

  // w4: heading-order
  {
    const h1Idx = html.search(/<h1[\s>]/i);
    const h2Idx = html.search(/<h2[\s>]/i);
    const h3Idx = html.search(/<h3[\s>]/i);
    if (h2Idx !== -1 && h1Idx !== -1 && h2Idx < h1Idx) {
      warning('heading-order', '<h2> appears before <h1> — heading levels should be in order');
    }
    if (h3Idx !== -1 && h2Idx !== -1 && h3Idx < h2Idx) {
      warning('heading-order', '<h3> appears before <h2> — heading levels should be in order');
    }
    if (h3Idx !== -1 && h2Idx === -1) {
      warning('heading-order', '<h3> found but no <h2> — heading levels should not skip');
    }
  }

  // w5: no-sri-hashes
  {
    const sriMatches = [...html.matchAll(/integrity=["']/gi)];
    for (const m of sriMatches) {
      warning('no-sri-hashes', 'integrity= SRI hash found — copy-pasted hashes silently break when CDN content rotates. Remove unless self-computed.');
    }
  }

  const valid = !findings.some(f => f.severity === 'error');
  return { valid, findings };
}

/**
 * Decode common HTML entities.
 * @param {string} str
 * @returns {string}
 */
function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
}
