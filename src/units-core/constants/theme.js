// Values are CSS variables so inline styles follow the active palette. The
// dark and light values live in src/index.css under :root / [data-theme].
export const BROWSER_TOKENS = {
  bg:          'var(--wrd-bg)',
  surface:     'var(--wrd-surface)',
  surface2:    'var(--wrd-surface2)',
  rule:        'var(--wrd-rule)',
  ruleStrong:  'var(--wrd-rule-strong)',
  ink:         'var(--wrd-ink)',
  dim:         'var(--wrd-dim)',
  dimmer:      'var(--wrd-dimmer)',
  accent:      'var(--wrd-accent)',
  accent2:     'var(--wrd-accent-2)',
  ok:          'var(--wrd-ok)',
  natoTag:     'var(--wrd-nato)',
  pactTag:     'var(--wrd-pact)',
  shade:       'var(--wrd-shade)',
  star:        'var(--wrd-star)',
  danger:      'var(--wrd-danger)',
};

export const BMono = { fontFamily: 'var(--wrd-mono)' };

export const V2_THEMES = {
  signal: {
    bg:         'var(--v2s-bg)',
    paper:      'var(--v2s-paper)',
    ink:        'var(--v2s-ink)',
    dim:        'var(--v2s-dim)',
    rule:       'var(--v2s-rule)',
    ruleStrong: 'var(--v2s-rule-strong)',
    accent:     'var(--v2s-accent)',
    blueprint:  'var(--v2s-blueprint)',
    ok:         'var(--v2s-ok)',
  },
  tactical: {
    bg:         'var(--v2t-bg)',
    paper:      'var(--v2t-paper)',
    ink:        'var(--v2t-ink)',
    dim:        'var(--v2t-dim)',
    rule:       'var(--v2t-rule)',
    ruleStrong: 'var(--v2t-rule-strong)',
    accent:     'var(--v2t-accent)',
    blueprint:  'var(--v2t-blueprint)',
    ok:         'var(--v2t-ok)',
  },
};
