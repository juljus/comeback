/**
 * Mob/Creature definition
 *
 * Mobs are creatures in the game - enemies, defenders, summons, and mercenaries.
 * They have combat stats, can know spells, and may evolve into stronger forms.
 */

export interface Mob {
  /** Unique identifier (row index from original data) */
  id: number

  /** Display names */
  name: {
    en: string
    et: string
  }

  /** Combat stats */
  hp: number
  attacksPerRound: number
  armor: number

  /** Damage dealt per attack: roll dice_count × d(dice_sides) + bonus */
  damage: {
    diceCount: number
    diceSides: number
    bonus: number
  }

  /** Character stats */
  stats: {
    strength: number
    dexterity: number
    power: number
  }

  /** Spells this mob knows (spell names, empty string if none) */
  spells: [string, string, string, string]

  /** Elemental damage bonuses */
  elementalDamage: {
    fire: number
    earth: number
    air: number
    water: number
  }

  /** Mercenary tier for hiring cost calculation (0 if not hireable) */
  mercTier: number

  /** Evolution target - mob name this can evolve into (empty if none) */
  evolvesInto: string
}

/**
 * Damage types for weapons
 * Each type has a special effect in combat
 */
export type DamageType = 'pierce' | 'slash' | 'crush'

/**
 * Damage type effects:
 * - pierce: Can bypass some armor
 * - slash: Causes bleeding (damage over time)
 * - crush: Can stun target
 */
export const DAMAGE_TYPE_EFFECTS: Record<DamageType, string> = {
  pierce: 'Bypasses armor',
  slash: 'Causes bleeding',
  crush: 'Can stun',
}
