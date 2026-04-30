import { useState, useMemo, useCallback } from 'react';
import { COALITION_NATIONS } from '../constants/coalitions.js';

const EMPTY_FILTER = { nation: [], spec: [], tab: [], era: [], tag: [], q: '' };

export function useFilterState(roster) {
  const [f, setF] = useState(EMPTY_FILTER);

  const toggle = useCallback((key) => (val) => {
    setF(prev => {
      if (val == null) return { ...prev, [key]: [] };
      const has = prev[key].includes(val);
      return { ...prev, [key]: has ? prev[key].filter(x => x !== val) : [...prev[key], val] };
    });
  }, []);

  const solo = useCallback((key) => (val) => {
    if (val == null) return;
    setF(prev => ({ ...prev, [key]: [val] }));
  }, []);

  const select = useCallback((key) => (val) => {
    setF(prev => {
      if (val == null) return { ...prev, [key]: [] };
      const already = prev[key].length === 1 && prev[key][0] === val;
      return { ...prev, [key]: already ? [] : [val] };
    });
  }, []);

  const toggleCoalition = useCallback((coalitionName) => {
    if (coalitionName == null) { setF(prev => ({ ...prev, nation: [] })); return; }
    const members = COALITION_NATIONS[coalitionName] ?? [];
    setF(prev => {
      const allActive = members.every(n => prev.nation.includes(n));
      return {
        ...prev,
        nation: allActive
          ? prev.nation.filter(n => !members.includes(n))
          : [...new Set([...prev.nation, ...members])],
      };
    });
  }, []);

  const toggleSide = useCallback((sideNations) => {
    setF(prev => {
      const allActive = sideNations.every(n => prev.nation.includes(n));
      return {
        ...prev,
        nation: allActive
          ? prev.nation.filter(n => !sideNations.includes(n))
          : [...new Set([...prev.nation, ...sideNations])],
      };
    });
  }, []);

  const setQ = useCallback((q) => setF(prev => ({ ...prev, q })), []);

  const filtered = useMemo(() => {
    const q = f.q.toLowerCase();
    return roster.filter(u => {
      if (f.nation.length && !f.nation.includes(u.nation)) return false;
      if (f.spec.length   && !u.specs.some(s => f.spec.includes(s))) return false;
      if (f.tab.length    && !f.tab.includes(u.tab)) return false;
      if (f.era.length) {
        const sel = f.era[0];
        if (sel === 'PRE-80' && u.era !== 'PRE-80') return false;
        if (sel === 'PRE-85' && !u.era) return false;
      }
      if (f.tag.length    && !f.tag.some(t => u.unitTags.includes(t))) return false;
      if (q              && !u.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [roster, f]);

  return { f, setF, setQ, toggle, select, solo, toggleCoalition, toggleSide, filtered };
}
