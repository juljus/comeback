import type { ManaType } from './enums'

/** Mana pool -- current amounts for all seven schools */
export type ManaPool = Record<ManaType, number>

/** Mana regeneration rates per turn for all seven schools */
export type ManaRegen = Record<ManaType, number>
