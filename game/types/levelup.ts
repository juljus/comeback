import type { ImmunityType, PhysicalDamageType } from './enums'
import type { ManaRegen } from './mana'

/** Pet/summon evolution definition from levelup.csv */
export type LevelUpDefinition = {
  readonly name: string
  readonly nameEn: string
  readonly nameEt: string

  // Stat changes on evolution (cols 1-9)
  readonly hpBonus: number
  readonly attacksBonus: number
  readonly damageBonusMin: number
  readonly damageBonusMax: number
  readonly damageType: PhysicalDamageType | null
  readonly baseStrengthBonus: number
  readonly baseDexterityBonus: number
  readonly basePowerBonus: number
  readonly armorBonus: number

  // Modified stat bonuses (cols 10-12)
  readonly modifiedStrengthBonus: number
  readonly modifiedDexterityBonus: number
  readonly modifiedPowerBonus: number

  // Mana regen gained (cols 14-20)
  readonly manaRegen: ManaRegen

  // Spells learned (cols 21-24)
  readonly learnsSpells: readonly string[]

  // Spell power bonuses (cols 25-28)
  readonly spellPowerBonuses: readonly number[]

  // Elemental damage bonuses (cols 29-33)
  readonly elementalDamageBonuses: readonly number[]

  // Resistance gains (cols 34-39)
  readonly resistances: Record<ImmunityType, number>

  // Evolution tracking (cols 46-47)
  readonly evolutionCounter: number
  readonly evolvesInto: string
}
