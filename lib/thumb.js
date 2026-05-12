import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { THUMBS_DIR } from './config.js';

const CAT_COLORS = {
  spec:      { bg: '#1a1510', accent: '#E8A042', text: '#E8A042' },
  report:    { bg: '#0d1a18', accent: '#2BB5A0', text: '#2BB5A0' },
  prototype: { bg: '#130e1f', accent: '#8B7CF8', text: '#8B7CF8' },
  review:    { bg: '#1a0e0d', accent: '#E06055', text: '#E06055' },
  other:     { bg: '#0d1320', accent: '#4A9FE0', text: '#4A9FE0' },
};

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function generateThumbSvg(artifact) {
  const c = CAT_COLORS[artifact.category] || CAT_COLORS.other;
  const title = escapeXml(artifact.title || 'Untitled');
  const cat = escapeXml((artifact.category || 'other').toUpperCase());
  const by = escapeXml(artifact.published_by || 'manual');

  // Wrap title at ~40 chars per line, max 3 lines
  const words = (artifact.title || 'Untitled').split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if (lines.length === 2) {
      // Filling line 3 — accumulate until overflow, then truncate and stop
      const candidate = (line ? line + ' ' : '') + w;
      if (candidate.length > 40) {
        if (line) line = line.slice(0, 37) + '…';
        break;
      }
      line = candidate;
    } else if ((line + ' ' + w).trim().length > 40 && line) {
      lines.push(line);
      line = w;
    } else {
      line = (line ? line + ' ' : '') + w;
    }
  }
  if (line) lines.push(line);

  const titleY = 220 - (lines.length - 1) * 22;
  const titleSvg = lines
    .map(
      (l, i) =>
        `<text x="60" y="${titleY + i * 44}" font-family="Georgia, serif" font-style="italic" font-size="36" fill="#EDE9E3">${escapeXml(l)}</text>`,
    )
    .join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <rect width="800" height="500" fill="#0C0E14"/>
  <rect width="800" height="500" fill="${c.bg}" opacity="0.6"/>
  <rect x="0" y="0" width="6" height="500" fill="${c.accent}"/>
  <rect x="0" y="0" width="800" height="1" fill="${c.accent}" opacity="0.2"/>
  <rect x="0" y="499" width="800" height="1" fill="${c.accent}" opacity="0.2"/>
  ${titleSvg}
  <text x="60" y="${titleY - 28}" font-family="monospace" font-size="11" fill="${c.text}" letter-spacing="2">${cat}</text>
  <text x="60" y="460" font-family="monospace" font-size="11" fill="#5C5A55">${by}</text>
  <text x="740" y="460" font-family="monospace" font-size="11" fill="#5C5A55" text-anchor="end">Artifact Portal</text>
</svg>`;
}

export function scheduleThumb(artifact) {
  setImmediate(() => {
    try {
      mkdirSync(THUMBS_DIR, { recursive: true });
      writeFileSync(join(THUMBS_DIR, `${artifact.id}.svg`), generateThumbSvg(artifact), 'utf8');
    } catch (e) {
      console.error('[thumb] failed for', artifact.id, e.message);
    }
  });
}
