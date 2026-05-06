import { useState, useMemo, useCallback } from 'react';
import { PACT_NATIONS } from '@units-core';
import {
  SLOT_COSTS, BASE_AP, DECK_TYPE_AP, ERA_AP, CHOICE_AVAIL,
  classifyDeckChoice, nationsForChoice,
} from './deckConstants.js';
import { encodeDeck } from './deckCodec.js';

let nextKey = 1;

export function useDeckState(units) {
  const [config, setConfig] = useState(null);
  const [cards, setCards]   = useState([]);

  const allNato = useMemo(() =>
    Object.keys(units ?? {}).reduce((s, id) => {
      const n = units[id]?.nation;
      if (n && !PACT_NATIONS.has(n) && !s.includes(n)) s.push(n);
      return s;
    }, []),
  [units]);

  const allPact = useMemo(() =>
    Object.keys(units ?? {}).reduce((s, id) => {
      const n = units[id]?.nation;
      if (n && PACT_NATIONS.has(n) && !s.includes(n)) s.push(n);
      return s;
    }, []),
  [units]);

  const deckType = config ? classifyDeckChoice(config.choice) : null;
  const specKey  = config?.spec ?? 'General';
  const costMatrix = SLOT_COSTS[specKey] ?? SLOT_COSTS.General;
  const availBonus = config ? (CHOICE_AVAIL[config.choice] ?? 0) : 0;

  const nations = useMemo(() => {
    if (!config) return [];
    return nationsForChoice(config.choice, allNato, allPact);
  }, [config, allNato, allPact]);

  const totalAP = useMemo(() => {
    if (!config) return 0;
    return BASE_AP + (DECK_TYPE_AP[deckType] ?? 0) + (ERA_AP[config.era] ?? 0);
  }, [config, deckType]);

  const tabSlots = useMemo(() => {
    const result = {};
    for (const tab of Object.keys(costMatrix)) {
      const costs = costMatrix[tab];
      const tabCards = cards.filter(c => {
        const u = units?.[c.unitId];
        return u?.tab === tab;
      });
      result[tab] = {
        total: costs.length,
        used: tabCards.length,
        cards: tabCards,
        costs,
      };
    }
    return result;
  }, [costMatrix, cards, units]);

  const usedAP = useMemo(() => {
    let ap = 0;
    const counters = {};
    for (const card of cards) {
      const u = units?.[card.unitId];
      const tab = u?.tab;
      if (!tab) continue;
      const idx = counters[tab] ?? 0;
      const costs = costMatrix[tab];
      if (idx < costs.length) ap += costs[idx];
      counters[tab] = idx + 1;
    }
    return ap;
  }, [cards, units, costMatrix]);

  const addCard = useCallback((unitId, vet, transportId) => {
    const u = units?.[unitId];
    if (!u) return false;
    const tab = u.tab;
    const costs = costMatrix[tab];
    const tabCount = cards.filter(c => units?.[c.unitId]?.tab === tab).length;
    if (tabCount >= costs.length) return false;
    setCards(prev => [...prev, { key: nextKey++, unitId, vet, transportId: transportId ?? null }]);
    return true;
  }, [units, costMatrix, cards]);

  const removeCard = useCallback((key) => {
    setCards(prev => prev.filter(c => c.key !== key));
  }, []);

  const clearDeck = useCallback(() => setCards([]), []);

  const deckCode = useMemo(() => {
    if (!config) return '';
    return encodeDeck(config, cards);
  }, [config, cards]);

  const startDeck = useCallback((choice, spec, era) => {
    setConfig({ choice, spec, era });
    setCards([]);
  }, []);

  const resetDeck = useCallback(() => {
    setConfig(null);
    setCards([]);
  }, []);

  return {
    config,
    cards,
    nations,
    deckType,
    availBonus,
    totalAP,
    usedAP,
    tabSlots,
    deckCode,
    addCard,
    removeCard,
    clearDeck,
    startDeck,
    resetDeck,
    costMatrix,
  };
}
