export function readUnitFromUrl(roster, units, fallbackId) {
  const params     = new URLSearchParams(window.location.search);
  const linkedId   = params.get('unit');
  const linkedName = params.get('name');

  if (linkedId && units[linkedId]) return linkedId;
  if (linkedName) {
    const target = decodeURIComponent(linkedName).toLowerCase();
    const match  = roster.find(u => u.name.toLowerCase() === target);
    if (match) return match.id;
  }
  return fallbackId;
}

export function writeUnitToUrl(id) {
  const p = new URLSearchParams(window.location.search);
  p.set('unit', id);
  history.replaceState(null, '', '?' + p.toString());
}
