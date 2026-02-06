import type { ManaRegen } from './mana'

/** Static building definition from buildings.csv */
export type BuildingDefinition = {
  readonly name: string
  readonly nameEn: string
  readonly nameEt: string

  // Prerequisites (cols 1-4) -- building names required before this can be built
  readonly prereqs: readonly string[]

  // Cost & time (cols 5-6)
  readonly cost: number
  readonly buildTime: number

  // Fortification (col 7)
  readonly fortificationLevel: number

  // Spells granted (cols 8-11)
  readonly grantsSpells: readonly {
    readonly spell: string
    readonly landTypeRestriction: string
  }[]

  // Mana regen bonuses (cols 12-18)
  readonly manaRegen: ManaRegen

  // Military (cols 19-21)
  readonly archerySlots: number
  readonly castleDefender: string
  readonly gateDefense: number

  // Bonuses (cols 22-24)
  readonly healingBonus: number
  readonly incomeBonus: number
  readonly combatRounds: number

  // Recruitment (cols 25-26)
  readonly recruitableUnit: string
  readonly recruitableCount: number

  // Special flags (cols 27-28)
  readonly portalFlag: boolean
  readonly bankFlag: boolean

  // Stat bonuses (cols 29-32)
  readonly bonusStrength: number
  readonly bonusDexterity: number
  readonly bonusPower: number
  readonly spellLevelBonus: number
}
