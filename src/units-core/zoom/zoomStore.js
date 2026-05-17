const STORAGE_KEY = 'wrd-zoom';

export const ZOOM_PRESETS = [1.0, 1.2, 2.0, 3.0];

function detectDefault() {
  const w = window.innerWidth;
  if (w >= 3840) return 3.0;
  if (w >= 2560) return 2.0;
  if (w >= 1920) return 1.2;
  return 1.0;
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const v = parseFloat(raw);
    return ZOOM_PRESETS.includes(v) ? v : null;
  } catch { return null; }
}

let current = readStored() ?? detectDefault();
document.documentElement.style.setProperty('--wrd-zoom', current);

export function getZoom() { return current; }

export function setZoom(value) {
  current = value;
  document.documentElement.style.setProperty('--wrd-zoom', value);
  try { localStorage.setItem(STORAGE_KEY, String(value)); } catch {}
}
