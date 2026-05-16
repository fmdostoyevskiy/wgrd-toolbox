import React, { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { BROWSER_TOKENS, BMono, sideOf, SPEC_VET_BONUS, V2Card } from '@units-core';

function shiftAvail(avail, shift) {
  if (!shift || !avail) return avail;
  const result = [0, 0, 0, 0, 0];
  for (let i = 0; i < 5; i++) {
    const target = Math.min(i + shift, 4);
    result[target] = Math.max(result[target], avail[i] ?? 0);
  }
  return result;
}

function effectiveAvail(unit, selectedSpec) {
  if (!unit?.avail || !selectedSpec) return unit?.avail;
  const shift = (SPEC_VET_BONUS[selectedSpec] ?? {})[unit.tab] ?? 0;
  return shift > 0 ? shiftAvail(unit.avail, shift) : unit.avail;
}

function lowestAvailVet(avail) {
  const idx = avail?.findIndex(a => a > 0) ?? -1;
  return idx >= 0 ? idx : 0;
}

export function CardSlot({ unitId, units, isPinned, onTogglePin, selectedSpec }) {
  const t = BROWSER_TOKENS;
  const unit  = units?.[unitId];
  const avail = effectiveAvail(unit, selectedSpec);
  const [vet, setVet] = useState(() => lowestAvailVet(avail));
  const cardRef = useRef(null);

  async function captureInPlace(toHide) {
    const el = cardRef.current;
    if (!el) return;
    const v2root = el.firstElementChild;
    if (!v2root) return;
    const kids = Array.from(v2root.children);
    const scrollContainer = kids[kids.length - 1];

    const hideList = [
      ...toHide,
      ...Array.from(el.querySelectorAll(':scope > button')),
      ...Array.from(el.querySelectorAll('[data-capture-btn]')),
    ].filter(Boolean);
    const savedDisplays = hideList.map(e => e.style.display);
    hideList.forEach(e => { e.style.display = 'none'; });

    // Only expand when content is taller than the card — never shrink.
    const titleH  = kids.length > 1 ? kids[0].offsetHeight : 0;
    const fullH   = titleH + (scrollContainer?.scrollHeight ?? 0);
    const needsExpansion = fullH > el.offsetHeight;

    const orig = needsExpansion ? {
      elHeight:       el.style.height,
      elAspectRatio:  el.style.aspectRatio,
      rootHeight:     v2root.style.height,
      rootOverflow:   v2root.style.overflow,
      scrollOverflow: scrollContainer?.style.overflowY ?? '',
    } : null;

    if (needsExpansion) {
      el.style.height       = fullH + 'px';
      el.style.aspectRatio  = 'auto';
      v2root.style.height   = fullH + 'px';
      v2root.style.overflow = 'visible';
      if (scrollContainer) scrollContainer.style.overflowY = 'visible';
    }

    try {
      const dataUrl = await toPng(el, { pixelRatio: 2 });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    } finally {
      if (orig) {
        el.style.height       = orig.elHeight;
        el.style.aspectRatio  = orig.elAspectRatio;
        v2root.style.height   = orig.rootHeight;
        v2root.style.overflow = orig.rootOverflow;
        if (scrollContainer) scrollContainer.style.overflowY = orig.scrollOverflow;
      }
      hideList.forEach((e, i) => { e.style.display = savedDisplays[i]; });
    }
  }

  async function captureGeneral() {
    const armamentDiv = cardRef.current?.querySelector('[data-section="armament"]');
    await captureInPlace([armamentDiv].filter(Boolean));
  }

  async function captureWeapon(weaponIdx) {
    const el = cardRef.current;
    if (!el) return;
    const v2root = el.firstElementChild;
    const scrollContainer = Array.from(v2root?.children ?? []).pop();
    const armamentDiv = el.querySelector('[data-section="armament"]');
    const vetDiv      = el.querySelector('[data-section="vet"]');
    const expertDiv   = el.querySelector('[data-section="expert"]');

    const toHide = [
      // Everything in the scroll container except vet, armament, and the expert button
      ...Array.from(scrollContainer?.children ?? []).filter(c => c !== armamentDiv && c !== vetDiv && c !== expertDiv),
      // "Armament" section header (first child of the armament wrapper)
      armamentDiv?.firstElementChild,
      // All weapon blocks except the target
      ...Array.from(el.querySelectorAll(`[data-weapon-idx]:not([data-weapon-idx="${weaponIdx}"])`)),
    ].filter(Boolean);

    await captureInPlace(toHide);
  }

  useEffect(() => {
    setVet(lowestAvailVet(effectiveAvail(units?.[unitId], selectedSpec)));
  }, [unitId, selectedSpec, units]);

  if (!unitId) {
    return (
      <div className="armory-card-frame" style={{
        ...BMono,
        border: `1px dashed ${t.rule}`,
        background: `color-mix(in srgb, ${t.surface} 50%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 6,
        color: t.dimmer, fontSize: 11, letterSpacing: '0.2em',
      }}>
        <span>◦ EMPTY SLOT</span>
        <span style={{ fontSize: 9, color: t.dimmer }}>pin a unit to fill</span>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="armory-card-frame" style={{ ...BMono, border: `1px dashed ${t.rule}`, padding: 18, color: t.dimmer }}>
        Unit data not found
      </div>
    );
  }

  return (
    <div ref={cardRef} className="armory-card-frame" style={{ position: 'relative' }}>
      <V2Card
        unit={unit} avail={avail} vetIdx={vet} setVetIdx={setVet}
        theme={sideOf(unit.nation)}
        onCaptureGeneral={captureGeneral}
        onCaptureWeapon={captureWeapon}
      />
      {onTogglePin && (
        <button onClick={onTogglePin} style={{
          ...BMono,
          position: 'absolute', top: 8, right: 8, zIndex: 2,
          background: 'rgba(0,0,0,0.4)', color: t.dim,
          border: `1px solid ${t.rule}`,
          padding: '2px 6px', fontSize: 10, letterSpacing: '0.1em',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>{isPinned ? 'UNPIN ✕' : 'PIN'}</button>
      )}
    </div>
  );
}
