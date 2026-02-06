import type { ManaPool } from './mana'

/** Runtime state for a single board square from game_map.csv */
export type BoardSquare = {
  // Core info (cols 0-8)
  landTypeId: number
  owner: number
  price: number
  name: string
  defenderId: number
  taxIncome: number
  healing: number
  coordX: number
  coordY: number

  // Fortification (cols 10-16)
  healingMax: number
  castleLevel: number
  castleDefender: number
  archerySlots: number
  gateLevel: number
  manaMax: number
  hasDefender: boolean

  // Building slots (cols 17-43) -- presence flags per slot
  buildings: boolean[]

  // Recruitment (cols 45-46)
  recruitableUnit: string
  recruitableCount: number

  // Mana storage (cols 47-53)
  mana: ManaPool
}
