import { createContext, useContext } from 'react';

// Default permits everything. Apps wrap their card content in a provider
// constructed from the `hide` prop on V2Card.
const DefaultHide = {
  section: () => true,
  field:   () => true,
};

export const HideContext = createContext(DefaultHide);

export function useHide() {
  return useContext(HideContext);
}

export function makeHide(hide) {
  if (!hide) return DefaultHide;
  const sections = new Set(hide.sections ?? []);
  const fields   = new Set(hide.fields   ?? []);
  return {
    section: (id) => !sections.has(id),
    field:   (id) => !fields.has(id),
  };
}

// Stable identifiers exported for autocomplete/validation in consumer apps.
export const SECTION_IDS = [
  'title', 'vet', 'general', 'mobility', 'optics', 'armor', 'armament',
];

export const FIELD_IDS = [
  // General
  'health', 'size', 'training', 'ecm', 'ciws', 'supply',
  'transport', 'prototype', 'command', 'era',
  // Mobility
  'speed', 'forestSpeed', 'swimSpeed', 'roadSpeed',
  'autonomy', 'fuel', 'refuelTime', 'altitude', 'turnRadius',
  'accelDecel', 'sailing',
  // Optics
  'stealth', 'optics', 'seaOptics', 'airStealth', 'airOptics',
  // Armor
  'armorFront', 'armorSide', 'armorRear', 'armorTop',
  // Armament (per weapon)
  'weaponRange', 'weaponAccuracy', 'weaponStabilizer',
  'weaponAp', 'weaponHe', 'weaponSuppress', 'weaponDispersion',
  'weaponDmgRadius', 'weaponSuppRadius', 'weaponMissileSpeed',
  'weaponAimTime', 'weaponRof', 'weaponSalvoSize', 'weaponNoise',
  'weaponRearm', 'weaponSupply', 'weaponTurreted',
];
