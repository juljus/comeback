import type { ImmunityType, MobType, PhysicalDamageType } from './enums'
import type { ManaPool, ManaRegen } from './mana'

/** Static creature definition from mobs.csv */
export type CreatureDefinition = {
  readonly name: string
  readonly nameEn: string
  readonly nameEt: string

  // Core stats (cols 1-9)
  readonly hp: number
  readonly attacksPerRound: number
  readonly diceCount: number
  readonly diceSides: number
  readonly bonusDamage: number
  readonly damageType: PhysicalDamageType
  readonly strength: number
  readonly dexterity: number
  readonly power: number
  readonly armor: number

  // AI behavior (cols 11-13)
  readonly aiBehavior1: number
  readonly aiBehavior2: number
  readonly aiBehavior3: number

  // Mana (cols 16-29)
  readonly mana: ManaPool
  readonly manaRegen: ManaRegen

  // Classification (cols 30-31)
  readonly mobType: MobType
  readonly mercTier: number

  // Spellcasting (cols 32-36)
  readonly spells: readonly string[]
  readonly hasSpells: boolean
  readonly behindWall: boolean

  // Elemental damage (cols 40-44)
  readonly elementalDamage: {
    readonly fire: number
    readonly earth: number
    readonly air: number
    readonly water: number
  }
  readonly extraDamage: number

  // Immunities (cols 45-50)
  readonly immunities: Record<ImmunityType, number>

  // Evolution (cols 51-53)
  readonly evolvesInto: string
  readonly evolutionType: number
  readonly spellLevelBonus: number
}
