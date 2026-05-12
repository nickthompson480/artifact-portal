export function stripHtml(html, maxBytes = 200 * 1024) {
  if (!html) return '';
  let text = html;
  // Remove script and style blocks with their content
  text = text.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  // Strip all remaining tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode HTML entities — &amp; last to prevent double-decoding of &amp;lt; etc.
  text = text
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#([0-9]+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/gi, '&');
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();
  // Truncate at maxBytes (UTF-8 approximation: slice chars, not bytes — close enough)
  if (text.length > maxBytes) text = text.slice(0, maxBytes);
  return text;
}
