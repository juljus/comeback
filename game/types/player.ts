import type { Gender, ItemSlot, TitleRank } from './enums'
import type { ManaPool, ManaRegen } from './mana'

/** A companion creature travelling with the player */
export type Companion = {
  name: string
  currentHp: number
  maxHp: number
  strength: number
  dexterity: number
  power: number
  armor: number
  attacksPerRound: number
  diceCount: number
  diceSides: number
  isPet: boolean
}

/** Equipment loadout keyed by slot */
export type Equipment = Record<ItemSlot, string>

/** Runtime state for a single player */
export type PlayerState = {
  id: number
  name: string
  gender: Gender
  title: TitleRank
  alive: boolean

  // Core stats (totals = base + equipment bonuses)
  strength: number
  dexterity: number
  power: number

  // Base stats (before equipment bonuses)
  baseStrength: number
  baseDexterity: number
  basePower: number
  hp: number
  maxHp: number
  armor: number
  attacksPerRound: number
  diceCount: number
  diceSides: number
  speed: number

  // Economy
  gold: number

  // Equipment & inventory
  equipment: Equipment
  inventory: string[]

  // Magic
  spellbook: string[]
  mana: ManaPool
  manaRegen: ManaRegen

  // Army
  companions: Companion[]

  // Territory
  ownedLands: number[]

  // Position & turn
  position: number
  actionsUsed: number
}
