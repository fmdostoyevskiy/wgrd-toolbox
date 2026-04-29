import React from 'react';
import { SectionHeader } from '../primitives/SectionHeader.jsx';
import { WeaponBlock } from './WeaponBlock.jsx';

export function ArmamentSection({ weapons, vetMul, s }) {
  return (
    <>
      <SectionHeader title="Armament" s={s} />
      {weapons.slice(0, 3).map((w, i) => (
        <WeaponBlock key={i} w={w} vetMul={vetMul} s={s} />
      ))}
    </>
  );
}
