/**
 * Game Store Type Definitions
 * Central location for all types, interfaces, and constants used in the game store
 * This file consolidates type definitions to keep game.ts focused on business logic
 */

// Re-export types from schemas for external consumers
export type {
  LandType,
  MobType,
  ItemType,
  BuildingType,
  SpellType,
  EventType,
  ManaType,
  ManaPool,
  ElementalDamage,
  Immunities,
  AIBehavior,
  LevelupType,
} from '~/data/schemas'

/**
 * Player titles (from verified help.csv)
 * Baron: 3 lands, Count: 9 lands, Duke: 15 lands
 */
export type PlayerTitle = 'commoner' | 'baron' | 'count' | 'duke'

/**
 * Game phases
 */
export type GamePhase = 'setup' | 'playing' | 'combat' | 'event' | 'finished'

/**
 * Action phases within a turn
 */
export type ActionPhase = 'morning' | 'noon' | 'evening'

/**
 * Equipped items
 */
export interface Equipment {
  weapon: number | null // Item ID (type=weapon)
  armor: number | null // Item ID (type=armor, body armor)
  helm: number | null // Item ID (type=helm)
  accessory: number | null // Item ID (type=boots or ring)
}

/**
 * Buff effect applied to a player
 * VBA: Effects sheet col 3 = duration, col 4 = armor, col 5 = haste, col 6 = strength
 * Duration decrements each turn in Main_turn loop (lines 2509-2580)
 */
export interface BuffEffect {
  type: 'armor' | 'strength' | 'haste'
  duration: number // Remaining turns
  power: number // Bonus amount
  sourceSpell: string // Spell that cast this buff
}

/**
 * Companion instance (summons or pets)
 * VBA: check_for_pet() line 13769, train_pet_menu() line 13724
 */
export interface CompanionInstance {
  id: string // Unique identifier
  mobId: number // Reference to mobs.json
  name: string // Display name
  hp: number
  maxHp: number
  armor: number
  damage: { diceCount: number; diceSides: number }
  attacksPerRound: number
  damageType: 'pierce' | 'slash' | 'crush'
  stats: { strength: number; dexterity: number; power: number }
  turnsRemaining: number | null // null = permanent (pet), number = summon duration
  isPet: boolean // true = permanent, trainable
  evolutionProgress: number // For pets (VBA col 65), 0-9, triggers at 10
  evolvesInto: string // Estonian name of evolution target, empty = can't evolve
  summonsLevel: number // Stat multiplier from spell knowledge
}

/**
 * Mercenary instance (hired combatants)
 * VBA: mercenary_camp() line 17310, hire_mercenary() line 17372
 * Cost formula: mercTier × contractLength × 2
 */
export interface MercenaryInstance {
  id: string // Unique identifier
  mobId: number // Reference to mobs.json
  name: string // Display name
  hp: number
  maxHp: number
  armor: number
  damage: { diceCount: number; diceSides: number }
  attacksPerRound: number
  damageType: 'pierce' | 'slash' | 'crush'
  stats: { strength: number; dexterity: number; power: number }
  contractTurns: number // Decrements each turn
  mercTier: number // Used for hiring cost calculation
}

/**
 * Player state
 */
export interface Player {
  index: number
  name: string
  isAlive: boolean
  position: number // Board square index
  gold: number
  hp: number
  maxHp: number
  stats: {
    strength: number
    dexterity: number
    power: number
  }
  color: string // For UI display
  equipment: Equipment
  inventory: number[] // Item IDs
  title: PlayerTitle
  pendingKingsGift: boolean // True if player just earned a title and needs to choose gift
  spellKnowledge: Record<string, number> // Estonian spell name -> knowledge level (1+)
  unlockedMercenaries: string[] // Estonian mercenary names unlocked from buildings
  mana: ManaPool // Current mana for each type
  buffs: BuffEffect[] // Active buff effects
  companions: CompanionInstance[] // Summons and pets
  mercenaries: MercenaryInstance[] // Hired mercenaries
}

/**
 * Board square state
 */
export interface BoardSquare {
  index: number
  landTypeId: number
  name: string
  owner: number | null // Player index or null for neutral
  defenderId: number | null // Mob ID
  defenderTier: number // 1-4
  defenderCurrentHp: number | null // Current HP of defender (persists across combat timeouts)
  coords: { x: number; y: number }
  isUtility: boolean
  incomeBonus: number // Added via "Improve income" action
  healingBonus: number // Added when improving in morning
  buildings: string[] // Estonian building names built on this square
  fortificationLevel: 0 | 1 | 2 | 3 // 0=none, 1=Fort, 2=Citadel, 3=Castle
  archerCount: number // Additional defenders from fortifications (archers)
  reinforcedThisTurn: boolean // True if this land's defender has already reinforced this turn
  attackedThisTurn: boolean // True if this land was attacked this turn (prevents re-attack after timeout)
}

/**
 * Dice roll result
 */
export interface DiceRoll {
  dice: [number, number]
  total: number
}

/**
 * Combat log entry
 */
export interface CombatLogEntry {
  round: number
  actor: string
  action: string
  damage?: number
  message: string
}

/**
 * Reinforcement mob in combat
 * Represents an adjacent land's defender that joined the battle
 */
export interface ReinforcementMob {
  name: string
  hp: number
  maxHp: number
  armor: number
  damage: { diceCount: number; diceSides: number }
  attacksPerRound: number
  damageType: 'pierce' | 'slash' | 'crush'
  fromSquareIndex: number // Which square this reinforcement came from
  fromSquareName: string // Name of the land for log messages
}

/**
 * Active combat state
 */
export interface CombatState {
  active: boolean
  squareIndex: number
  defenderName: string
  defenderMaxHp: number
  defenderHp: number
  defenderArmor: number
  defenderDamage: { diceCount: number; diceSides: number }
  defenderAttacksPerRound: number
  defenderDamageType: 'pierce' | 'slash' | 'crush'
  defenderStats: { strength: number; dexterity: number; power: number }
  defenderElementalDamage: any // ElementalDamage - Elemental damage from defender
  defenderImmunities: any // Immunities - Status effect immunities
  // AI and spellcasting fields
  defenderAI: any // AIBehavior - gallantry, obedience, bravery
  defenderMana: ManaPool // Current mana for spellcasting
  defenderManaRegen: ManaPool // Mana regeneration per round
  defenderSpells: string[] // Estonian spell names the defender knows
  defenderSpellLevelBonus: number // Bonus to spell knowledge
  defenderHasFled: boolean // True if defender successfully fled
  attackerHpAtStart: number
  round: number
  log: CombatLogEntry[]
  // Status effects
  defenderBleeding: number // DoT damage per round from slash crits
  defenderStunnedTurns: number // Remaining turns defender is stunned from crush crits
  defenderPoisoned: number // Poison damage per round
  defenderBurningTurns: number // Remaining burning turns
  defenderFrozenTurns: number // Remaining frozen turns
  attackerBleeding: number // DoT damage per round on player
  attackerStunnedTurns: number // Remaining turns player is stunned
  attackerFrozenTurns: number // Remaining turns player is frozen
  attackerPoisoned: number // Poison damage per round
  attackerBurningTurns: number // Remaining burning turns
  fleeAttemptedThisRound: boolean // Cannot flee again after failed attempt in same round
  // Reinforcements from adjacent lands
  reinforcements: ReinforcementMob[] // Mobs that are currently fighting
  pendingReinforcements: ReinforcementMob[] // Reinforcements arriving next round
}

/**
 * Doubles roll state - tracks consecutive doubles for bonus gold
 * From VBA (line 4303-4370): Rolling doubles lets player keep or reroll
 * Consecutive doubles award gold: 50 * consecutive_count²
 */
export interface DoublesState {
  consecutiveCount: number // How many doubles rolled in a row
  awaitingDecision: boolean // True when player must choose keep/reroll
  pendingMove: number // The dice total to move if player keeps
}

/**
 * King's Gift state - tracks pending gift selection
 * When player earns a new title (baron, count, duke), they choose from 3 items
 *
 * Gift tiers by title:
 * - Baron (3 lands): Items worth 50-120 gold
 * - Count (9 lands): Items worth 121-300 gold
 * - Duke (15 lands): Items worth 301-1000 gold
 */
export interface KingsGiftState {
  playerIndex: number // Which player has pending gift
  title: 'baron' | 'count' | 'duke' // Title that was earned
  options: any[] // 3 items to choose from (ItemType[])
}

/**
 * Event choice for events with multiple options
 */
export interface EventChoice {
  text: { en: string; et: string }
  effect: string // Effect type identifier
}

/**
 * Active event state
 * Events occur at Cave, Dungeon, Treasure Island locations
 * VBA: vali_event() line 17920, event_in_main_turn() line 17963
 */
export interface EventState {
  active: boolean
  eventId: number
  eventName: string
  eventDescription: string
  location: 'cave' | 'dungeon' | 'treasureIsland'
  choices?: EventChoice[] // For choice-based events
  resolved: boolean
}

/**
 * Complete game state
 */
export interface GameState {
  phase: GamePhase
  turn: number
  currentPlayer: number
  actionPhase: ActionPhase
  actionsRemaining: number
  mustMoveFirst: boolean // VBA round 0: player must move before taking actions
  players: Player[]
  board: BoardSquare[]
  lastDiceRoll: DiceRoll | null
  combat: CombatState | null
  doubles: DoublesState | null // Tracks doubles mechanic state
  kingsGiftPending: KingsGiftState | null // Pending King's Gift selection
  event: EventState | null // Active event
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Shop land type IDs (from lands.json)
 */
export const SHOP_LAND_ID = 1 // Shop - basic cheap items
export const SMITHY_LAND_ID = 2 // Smithy - weapons and armor
export const BAZAAR_LAND_ID = 3 // Bazaar - anything
export const LIBRARY_ID = 4 // Library - train spells
export const MAGE_GUILD_ID = 5 // Mage Guild - train spells and power
export const TRAINING_GROUNDS_ID = 10 // Training Grounds - train stats

/**
 * Event location land type IDs (from lands.json)
 * These trigger random events when player lands on them
 */
export const CAVE_LAND_ID = 12
export const TREASURE_ISLAND_LAND_ID = 13
export const DUNGEON_LAND_ID = 14

/**
 * Title thresholds (verified from help.csv)
 */
export const TITLE_THRESHOLDS = {
  baron: 3,
  count: 9,
  duke: 15,
} as const

/**
 * Title salaries - gold received when passing Royal Court
 * Verified from Game_data1 cells 74-76 (VBA lines 3974-3977)
 */
export const TITLE_SALARIES: Record<string, number> = {
  commoner: 20, // Hardcoded in VBA line 3975
  baron: 30, // Game_data1.Cells(74, 2)
  count: 40, // Game_data1.Cells(75, 2)
  duke: 50, // Game_data1.Cells(76, 2)
} as const

/**
 * Sell price multiplier (items sell for 50% of value)
 */
export const SELL_PRICE_MULTIPLIER = 0.5

/**
 * King's Gift value ranges by title
 */
export const KINGS_GIFT_VALUE_RANGES: Record<'baron' | 'count' | 'duke', { min: number; max: number }> = {
  baron: { min: 50, max: 120 },
  count: { min: 121, max: 300 },
  duke: { min: 301, max: 1000 },
} as const

/**
 * Player colors for display
 */
export const PLAYER_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'] as const // red, blue, green, yellow

/**
 * Starting item IDs
 */
export const STARTING_WEAPON_ID = 0 // Knife (1d4 pierce)

/**
 * Land price multiplier
 * Base prices in lands.json are multiplied by this for actual purchase cost
 * Verified: game_map.csv shows ~10x base prices (Desert 4→40, Volcano 25→250)
 */
export const LAND_PRICE_MULTIPLIER = 10

/**
 * Default player stats
 * Note: strength/dexterity/power values of 2 are unverified estimates
 */
export const DEFAULT_PLAYER_STATS = {
  hp: 20, // Verified: help.csv line 8
  maxHp: 20,
  gold: 200, // Verified: help.csv line 8
  stats: {
    strength: 2, // VBA lines 137-139: all stats = 2
    dexterity: 2,
    power: 2,
  },
} as const
