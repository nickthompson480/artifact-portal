import { dayKey } from './format.js';

export function groupByDay(artifacts) {
  const map = new Map();
  for (const a of artifacts) {
    const k = dayKey(a.created_at);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(a);
  }
  return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
}
