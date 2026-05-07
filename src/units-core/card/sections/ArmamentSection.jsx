import React from 'react';
import { SectionHeader } from '../primitives/SectionHeader.jsx';
import { WeaponBlock } from './WeaponBlock.jsx';

export function ArmamentSection({ weapons, vet, s }) {
  return (
    <>
      <SectionHeader title="Armament" s={s} />
      {weapons.map((w, i) => (
        <WeaponBlock key={i} w={w} vet={vet} s={s} />
      ))}
    </>
  );
}
