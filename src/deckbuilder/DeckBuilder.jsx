import React, { useEffect } from 'react';
import { DeckSetup } from './DeckSetup.jsx';
import { DeckBrowser } from './DeckBrowser.jsx';
import { useDeckState } from './useDeckState.js';

export function DeckBuilder({ roster, units, initialCode }) {
  const deckState = useDeckState(units);

  useEffect(() => {
    if (initialCode) deckState.loadDeck(initialCode);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!deckState.config) {
    return <DeckSetup onStart={deckState.startDeck} onImport={deckState.loadDeck} />;
  }

  return <DeckBrowser roster={roster} units={units} deckState={deckState} />;
}
