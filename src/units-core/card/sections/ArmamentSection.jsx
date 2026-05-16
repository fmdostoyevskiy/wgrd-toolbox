import React from 'react';
import { SectionHeader } from '../primitives/SectionHeader.jsx';
import { WeaponBlock } from './WeaponBlock.jsx';

export function ArmamentSection({ weapons, vet, s, onCaptureWeapon }) {
  const sharedTurrets = React.useMemo(() => {
    const counts = {};
    for (const w of weapons) {
      if (w.turret_index != null) counts[w.turret_index] = (counts[w.turret_index] ?? 0) + 1;
    }
    return new Set(Object.keys(counts).filter(k => counts[k] > 1).map(Number));
  }, [weapons]);

  return (
    <>
      <SectionHeader title="Armament" s={s} />
      {weapons.map((w, i) => (
        <WeaponBlock key={i} weaponIdx={i} w={w} vet={vet} s={s} sharedTurrets={sharedTurrets}
          onCapture={onCaptureWeapon ? () => onCaptureWeapon(i) : undefined} />
      ))}
    </>
  );
}
