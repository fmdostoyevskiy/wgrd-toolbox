import React from 'react';
import { ZoomControls } from './ZoomControls.jsx';
import { ThemeToggle } from '../theme/ThemeToggle.jsx';

// The UI scale button followed by the dark/light toggle. Place it right after
// a tool's logo; `style` applies to the group.
export function UiControls({ style }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'stretch', gap: 4, flexShrink: 0, ...style }}>
      <ZoomControls />
      <ThemeToggle />
    </span>
  );
}
