export function encodeDeck(config, cards) {
  const payload = {
    v: 1,
    c: config.choice,
    s: config.spec ?? '',
    e: config.era,
    d: cards.map(c => {
      const entry = { u: c.unitId, v: c.vet };
      if (c.transportId) entry.t = c.transportId;
      return entry;
    }),
  };
  try {
    return btoa(JSON.stringify(payload));
  } catch {
    return '';
  }
}

export function decodeDeck(code) {
  try {
    const payload = JSON.parse(atob(code));
    if (payload.v !== 1) return null;
    return {
      choice: payload.c,
      spec: payload.s || null,
      era: payload.e,
      cards: (payload.d ?? []).map((entry, i) => ({
        key: i,
        unitId: entry.u,
        vet: entry.v,
        transportId: entry.t ?? null,
      })),
    };
  } catch {
    return null;
  }
}
