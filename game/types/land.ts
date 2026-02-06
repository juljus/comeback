import type { LandType, ManaType } from './enums'

/** Static land type definition from lands.csv / Map_defaults */
export type LandDefinition = {
  readonly name: string
  readonly nameShortEn: string
  readonly nameLongEn: string
  readonly nameShortEt: string
  readonly nameLongEt: string

  readonly landType: LandType

  // Economics (cols 2-4)
  readonly price: number
  readonly taxIncome: number
  readonly healing: number

  // Defenders -- 4 tiers of mob names (cols 8-11)
  readonly defenders: readonly [string, string, string, string]

  // Map generation (col 12)
  readonly spawnChance: number

  // Available buildings -- up to 12 slots (cols 13-24)
  readonly buildings: readonly string[]

  // Mana production (col 25)
  readonly manaType: ManaType | ''

  // Mana building flag (col 26)
  readonly manaBuildingFlag: number
}
