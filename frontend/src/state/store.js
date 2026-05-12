import { create } from 'zustand';

const KEY = 'artifact-portal:ui';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const save = (patch) => localStorage.setItem(KEY, JSON.stringify({ ...load(), ...patch }));

export const useStore = create((set, get) => {
  const p = load();
  return {
    authed: null,
    tagFilter: null,
    searchOpen: false,
    shareOpen: false,
    shareTarget: null,
    density: p.density || 'comfortable',
    theme: p.theme || 'dark',
    rightPane: p.rightPane ?? false,
    collapsedDays: p.collapsedDays || {},

    setAuthed: (v) => set({ authed: v }),
    setTagFilter: (v) => set({ tagFilter: v }),
    openSearch: () => set({ searchOpen: true }),
    closeSearch: () => set({ searchOpen: false }),
    openShare: (artifact) => set({ shareOpen: true, shareTarget: artifact }),
    closeShare: () => set({ shareOpen: false, shareTarget: null }),
    setDensity: (v) => { set({ density: v }); save({ density: v }); },
    setTheme: (v) => {
      set({ theme: v });
      document.documentElement.setAttribute('data-theme', v);
      save({ theme: v });
    },
    setRightPane: (v) => { set({ rightPane: v }); save({ rightPane: v }); },
    toggleDay: (key) => {
      const next = { ...get().collapsedDays, [key]: !get().collapsedDays[key] };
      set({ collapsedDays: next });
      save({ collapsedDays: next });
    },
  };
});
