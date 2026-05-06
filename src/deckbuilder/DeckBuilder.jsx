import React from 'react';
import { DeckSetup } from './DeckSetup.jsx';
import { DeckBrowser } from './DeckBrowser.jsx';
import { useDeckState } from './useDeckState.js';

export function DeckBuilder({ roster, units }) {
  const deckState = useDeckState(units);

  if (!deckState.config) {
    return <DeckSetup onStart={deckState.startDeck} />;
  }

  return <DeckBrowser roster={roster} units={units} deckState={deckState} />;
}
