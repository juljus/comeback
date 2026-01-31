/**
 * Spell definition
 *
 * Spells are magical abilities that can deal damage, summon creatures,
 * or buff the caster/allies. Each spell requires a specific mana type.
 */

export interface Spell {
  /** Unique identifier (row index from original data) */
  id: number

  /** Display names */
  name: {
    en: string
    et: string
  }

  /** Descriptions */
  description: {
    en: string
    et: string
  }

  /** Spell category */
  type: SpellType

  /** Mana required to cast */
  manaCost: number

  /** Type of mana required */
  manaType: ManaType

  /** Base power/damage value (modified by caster's Power stat) */
  basePower: number

  /** For summon spells: creatures that can be summoned (by tier/power level) */
  summons: [string, string, string, string]

  /** Effect behavior */
  effectType: SpellEffectType
}

/**
 * Spell types
 */
export type SpellType = 'damage' | 'summon' | 'buff'

export const SPELL_TYPE_VALUES: Record<number, SpellType> = {
  1: 'damage',
  2: 'summon',
  3: 'buff',
}

/**
 * The seven mana types
 */
export type ManaType =
  | 'fire'
  | 'earth'
  | 'air'
  | 'water'
  | 'death'
  | 'life'
  | 'arcane'

export const MANA_TYPE_VALUES: Record<number, ManaType> = {
  4: 'fire',
  5: 'earth',
  6: 'air',
  7: 'water',
  8: 'death',
  9: 'life',
  10: 'arcane',
}

/**
 * Mana type colors for UI
 */
export const MANA_COLORS: Record<ManaType, string> = {
  fire: '#dc2626',      // red
  earth: '#16a34a',     // green
  air: '#0ea5e9',       // light blue
  water: '#1d4ed8',     // dark blue
  death: '#64748b',     // gray-blue
  life: '#fafafa',      // white
  arcane: '#eab308',    // gold
}

/**
 * Spell effect types
 */
export type SpellEffectType = 'utility' | 'summon' | 'singleTarget' | 'aoe'

export const SPELL_EFFECT_TYPE_VALUES: Record<number, SpellEffectType> = {
  0: 'utility',
  8: 'summon',
  11: 'singleTarget',
  12: 'aoe',
}
