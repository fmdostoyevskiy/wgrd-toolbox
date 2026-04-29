import React from 'react';
import { BROWSER_TOKENS } from '../constants/theme.js';

// h = rendered height in px; width auto preserves the 99×28 native aspect ratio
export const FlagImg = React.memo(function FlagImg({ src, label, h = 14 }) {
  if (!src) return <span style={{ fontSize: 9.5, color: BROWSER_TOKENS.dim }}>{label}</span>;
  return (
    <img src={src} alt={label} title={label}
         style={{ height: h, width: 'auto', display: 'block' }} />
  );
});
