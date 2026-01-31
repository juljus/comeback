/**
 * Item definition
 *
 * Items include weapons, armor, and consumables.
 * They can provide stat bonuses, grant spells, or produce mana.
 */

export interface Item {
  /** Unique identifier (row index from original data) */
  id: number

  /** Display names */
  name: {
    en: string
    et: string
  }

  /** Item category */
  type: ItemType

  /** Purchase price in gold */
  value: number

  /** Minimum strength required to equip (0 = no requirement) */
  requiredStrength: number

  /** Weapon properties (only for weapons) */
  weapon?: {
    /** Damage dice: roll diceCount × d(diceSides) */
    diceCount: number
    diceSides: number
    /** Damage type affects special effects */
    damageType: DamageTypeValue
  }

  /** Stat bonuses when equipped */
  bonuses: {
    hp: number
    strength: number
    dexterity: number
    power: number
    armor: number
    strikes: number      // Extra attacks per round
    healing: number      // HP recovery bonus
    speed: number        // Movement/initiative bonus
  }

  /** Mana production per turn */
  manaBonus: {
    fire: number
    earth: number
    air: number
    water: number
    death: number
    life: number
    arcane: number
  }

  /** Elemental damage added to attacks */
  elementalDamage: {
    fire: number
    earth: number
    air: number
    water: number
  }

  /** Spell granted when equipped (spell name, empty if none) */
  grantsSpell: string
}

/**
 * Item types
 */
export type ItemType =
  | 'weapon'
  | 'armor'
  | 'accessory'
  | 'consumable'
  | 'unknown'

export const ITEM_TYPE_VALUES: Record<number, ItemType> = {
  1: 'consumable',
  2: 'armor',
  3: 'accessory',
  4: 'unknown',
  5: 'unknown',
  6: 'weapon',
}

/**
 * Damage types for weapons
 */
export type DamageTypeValue = 'pierce' | 'slash' | 'crush'

export const DAMAGE_TYPE_VALUES: Record<number, DamageTypeValue> = {
  1: 'pierce',
  2: 'slash',
  3: 'crush',
}

/**
 * Damage type descriptions
 */
export const DAMAGE_TYPE_DESCRIPTIONS: Record<DamageTypeValue, string> = {
  pierce: 'Piercing weapons can bypass some armor',
  slash: 'Slashing weapons cause bleeding (damage over time)',
  crush: 'Crushing weapons can stun enemies',
}
