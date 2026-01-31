/**
 * Game state types
 *
 * These types define the runtime state of a game in progress.
 */

import type { ManaType } from './spells'
import type { DamageTypeValue } from './items'

/**
 * Complete game state
 * This is what gets stored/synced for multiplayer
 */
export interface GameState {
  /** Unique game identifier */
  id: string

  /** Game phase */
  phase: GamePhase

  /** Current turn number (starts at 1) */
  turn: number

  /** Which player's turn it is (0-3) */
  currentPlayer: number

  /** Current action phase within the turn */
  actionPhase: ActionPhase

  /** Actions remaining this turn (max 3: morning, noon, evening) */
  actionsRemaining: number

  /** All players in the game */
  players: Player[]

  /** The game board */
  board: BoardSquare[]

  /** Combat state (null if not in combat) */
  combat: CombatState | null

  /** Random seed for reproducibility */
  seed: number
}

/**
 * Game phases
 */
export type GamePhase =
  | 'setup'       // Choosing players, options
  | 'playing'     // Main game loop
  | 'combat'      // In battle
  | 'event'       // Random event occurring
  | 'finished'    // Game over

/**
 * Action phases within a turn
 */
export type ActionPhase = 'morning' | 'noon' | 'evening'

/**
 * Player state
 */
export interface Player {
  /** Player index (0-3) */
  index: number

  /** Player name */
  name: string

  /** Is this player still in the game? */
  isAlive: boolean

  /** Current position on the board (square index) */
  position: number

  /** Gold currency */
  gold: number

  /** Hit points */
  hp: number
  maxHp: number

  /** Character stats */
  stats: {
    strength: number
    dexterity: number
    power: number
  }

  /** Current mana reserves */
  mana: Record<ManaType, number>

  /** Equipped weapon item ID (null if none) */
  equippedWeapon: number | null

  /** Equipped armor item ID (null if none) */
  equippedArmor: number | null

  /** Inventory (item IDs) */
  inventory: number[]

  /** Known spells (spell IDs) */
  knownSpells: number[]

  /** Owned land (board square indices) */
  ownedLands: number[]

  /** Companions/summons (runtime mob instances) */
  companions: CompanionInstance[]

  /** Title earned */
  title: PlayerTitle
}

/**
 * Player titles (earned by owning lands)
 */
export type PlayerTitle = 'none' | 'baron' | 'count' | 'duke'

export const TITLE_REQUIREMENTS: Record<PlayerTitle, number> = {
  none: 0,
  baron: 3,   // 3 lands
  count: 9,   // 9 lands
  duke: 15,   // 15 lands
}

/**
 * A companion/summon instance (runtime state)
 */
export interface CompanionInstance {
  /** Reference to mob definition */
  mobId: number

  /** Current HP (can differ from mob's base HP) */
  hp: number

  /** Turns remaining before summon expires (null = permanent) */
  turnsRemaining: number | null

  /** Evolution counter */
  evolutionProgress: number
}

/**
 * Board square state
 */
export interface BoardSquare {
  /** Position index on the board */
  index: number

  /** Reference to land type definition */
  landTypeId: number

  /** Display name (resolved from land type) */
  name: string

  /** Owner player index (null = neutral/unowned) */
  owner: number | null

  /** Current defender mob ID (null if defeated) */
  defenderId: number | null

  /** Defender tier (1-4) */
  defenderTier: number

  /** Buildings constructed on this square */
  buildings: number[]

  /** Fortification level (0 = none, 1-3 = fort/citadel/castle) */
  fortificationLevel: number

  /** Display coordinates */
  coords: { x: number; y: number }
}

/**
 * Combat state
 */
export interface CombatState {
  /** Which player initiated combat */
  attackingPlayer: number

  /** Defending side (player index or null for neutral) */
  defendingPlayer: number | null

  /** Current round number */
  round: number

  /** Combatants on attacker side */
  attackers: Combatant[]

  /** Combatants on defender side */
  defenders: Combatant[]

  /** Whose turn in combat */
  currentCombatant: number

  /** Is attacker's turn? (vs defender's turn) */
  isAttackerTurn: boolean

  /** Combat log messages */
  log: string[]
}

/**
 * A combatant in battle (runtime state)
 */
export interface Combatant {
  /** Is this the player character? */
  isPlayer: boolean

  /** Mob ID (for companions/enemies) or null (for player) */
  mobId: number | null

  /** Player index (for player) or null (for mobs) */
  playerIndex: number | null

  /** Current HP */
  hp: number
  maxHp: number

  /** Combat stats */
  attacksPerRound: number
  damage: {
    diceCount: number
    diceSides: number
    bonus: number
    type: DamageTypeValue
  }
  armor: number

  /** Status effects */
  statusEffects: StatusEffect[]

  /** Has acted this round? */
  hasActed: boolean
}

/**
 * Status effects in combat
 */
export interface StatusEffect {
  type: StatusEffectType
  duration: number  // Rounds remaining
  power: number     // Effect strength
}

export type StatusEffectType =
  | 'bleeding'
  | 'stunned'
  | 'poisoned'
  | 'frozen'
  | 'burning'

/**
 * Available actions a player can take
 */
export type PlayerAction =
  | { type: 'move'; direction: 'forward' | 'backward' }
  | { type: 'rest' }
  | { type: 'buyLand' }
  | { type: 'attackLand' }
  | { type: 'build'; buildingId: number }
  | { type: 'shop'; action: 'buy' | 'sell'; itemId: number }
  | { type: 'hireMercenary'; mobId: number }
  | { type: 'train'; stat: 'strength' | 'dexterity' | 'power' }
  | { type: 'learnSpell'; spellId: number }
  | { type: 'castSpell'; spellId: number; targetId?: number }
  | { type: 'endTurn' }

/**
 * Combat actions
 */
export type CombatAction =
  | { type: 'attack'; targetIndex: number }
  | { type: 'castSpell'; spellId: number; targetIndex?: number }
  | { type: 'flee' }
  | { type: 'pass' }
