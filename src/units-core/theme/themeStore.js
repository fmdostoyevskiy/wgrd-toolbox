const STORAGE_KEY = 'wrd-theme';

export const THEMES = ['dark', 'light'];

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(raw) ? raw : null;
  } catch { return null; }
}

let current = readStored() ?? 'dark';
document.documentElement.dataset.theme = current;

export function getTheme() { return current; }

export function setTheme(value) {
  current = value;
  document.documentElement.dataset.theme = value;
  try { localStorage.setItem(STORAGE_KEY, value); } catch {}
}
