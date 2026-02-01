import { defineStore } from 'pinia'
import {
  // Validated data exports
  lands as landsData,
  mobs as mobsData,
  items as itemsData,
  buildings as buildingsData,
  spells as spellsData,
  events as eventsData,
  // Helper functions (re-exported below)
  getMobByName,
  getSpellByName,
  getSpellById,
  getBuildingByName,
  getBuildingById,
  // Types from schemas for external use
  type LandType,
  type MobType,
  type ItemType,
  type BuildingType,
  type SpellType,
  type EventType,
  type ManaType,
  type ManaPool,
} from '~/data/schemas'

// Re-export types for external consumers
export type { LandType, MobType, ItemType, BuildingType, SpellType, EventType, ManaType, ManaPool }

/**
 * Player titles (from verified help.csv)
 * Baron: 3 lands, Count: 9 lands, Duke: 15 lands
 */
export type PlayerTitle = 'commoner' | 'baron' | 'count' | 'duke'

/**
 * Shop land type IDs (from lands.json)
 */
const SHOP_LAND_ID = 1 // Shop - basic cheap items
const SMITHY_LAND_ID = 2 // Smithy - weapons and armor
const BAZAAR_LAND_ID = 3 // Bazaar - anything
const LIBRARY_ID = 4 // Library - train spells
const MAGE_GUILD_ID = 5 // Mage Guild - train spells and power
const TRAINING_GROUNDS_ID = 10 // Training Grounds - train stats

/**
 * Title thresholds (verified from help.csv)
 */
const TITLE_THRESHOLDS = {
  baron: 3,
  count: 9,
  duke: 15,
}

/**
 * Title salaries - gold received when passing Royal Court
 * Verified from Game_data1 cells 74-76 (VBA lines 3974-3977)
 */
const TITLE_SALARIES: Record<string, number> = {
  commoner: 20,  // Hardcoded in VBA line 3975
  baron: 30,     // Game_data1.Cells(74, 2)
  count: 40,     // Game_data1.Cells(75, 2)
  duke: 50,      // Game_data1.Cells(76, 2)
}

/**
 * Sell price multiplier (items sell for 50% of value)
 */
const SELL_PRICE_MULTIPLIER = 0.5

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
  evolutionProgress: number // For pets (VBA col 65)
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
  coords: { x: number; y: number }
  isUtility: boolean
  incomeBonus: number // Added via "Improve income" action
  healingBonus: number // Added when improving in morning
  buildings: string[] // Estonian building names built on this square
  fortificationLevel: 0 | 1 | 2 | 3 // 0=none, 1=Fort, 2=Citadel, 3=Castle
  archerCount: number // Additional defenders from fortifications (archers)
  reinforcedThisTurn: boolean // True if this land's defender has already reinforced this turn
}

/**
 * Dice roll result
 */
export interface DiceRoll {
  dice: [number, number]
  total: number
}

// MobType is imported from schemas.ts

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
  attackerHpAtStart: number
  round: number
  log: CombatLogEntry[]
  // Status effects
  defenderBleeding: number // DoT damage per round from slash crits
  defenderStunnedTurns: number // Remaining turns defender is stunned from crush crits
  attackerBleeding: number // DoT damage per round on player
  attackerStunnedTurns: number // Remaining turns player is stunned
  attackerFrozenTurns: number // Remaining turns player is frozen
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
  options: ItemType[] // 3 items to choose from
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
 * King's Gift value ranges by title
 */
const KINGS_GIFT_VALUE_RANGES: Record<'baron' | 'count' | 'duke', { min: number; max: number }> = {
  baron: { min: 50, max: 120 },
  count: { min: 121, max: 300 },
  duke: { min: 301, max: 1000 },
}

/**
 * Event location land type IDs (from lands.json)
 * These trigger random events when player lands on them
 */
const CAVE_LAND_ID = 12
const TREASURE_ISLAND_LAND_ID = 13
const DUNGEON_LAND_ID = 14

/**
 * Complete game state
 */
export interface GameState {
  phase: GamePhase
  turn: number
  currentPlayer: number
  actionPhase: ActionPhase
  actionsRemaining: number
  players: Player[]
  board: BoardSquare[]
  lastDiceRoll: DiceRoll | null
  combat: CombatState | null
  doubles: DoublesState | null // Tracks doubles mechanic state
  kingsGiftPending: KingsGiftState | null // Pending King's Gift selection
  event: EventState | null // Active event
}

/**
 * Player colors for display
 */
const PLAYER_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'] // red, blue, green, yellow

/**
 * Starting item IDs
 */
const STARTING_WEAPON_ID = 0 // Knife (1d4 pierce)

/**
 * Land price multiplier
 * Base prices in lands.json are multiplied by this for actual purchase cost
 * Verified: game_map.csv shows ~10x base prices (Desert 4→40, Volcano 25→250)
 */
const LAND_PRICE_MULTIPLIER = 10

/**
 * Default player stats
 * Note: strength/dexterity/power values of 2 are unverified estimates
 */
const DEFAULT_PLAYER_STATS = {
  hp: 20, // Verified: help.csv line 8
  maxHp: 20,
  gold: 200, // Verified: help.csv line 8
  stats: {
    strength: 2, // VBA lines 137-139: all stats = 2
    dexterity: 2,
    power: 2,
  },
}

/**
 * Main game store
 */
export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    phase: 'setup',
    turn: 0,
    currentPlayer: 0,
    actionPhase: 'morning',
    actionsRemaining: 3,
    players: [],
    board: [],
    lastDiceRoll: null,
    combat: null,
    doubles: null,
    kingsGiftPending: null,
    event: null,
  }),

  getters: {
    /**
     * Get current player object
     */
    activePlayer(): Player | null {
      if (this.players.length === 0) return null
      return this.players[this.currentPlayer] ?? null
    },

    /**
     * Get current player's position on board
     */
    activePlayerSquare(): BoardSquare | null {
      const player = this.activePlayer
      if (!player) return null
      return this.board[player.position] ?? null
    },

    /**
     * Check if game is in progress
     */
    isPlaying(): boolean {
      return this.phase === 'playing'
    },

    /**
     * Get living players
     */
    alivePlayers(): Player[] {
      return this.players.filter(p => p.isAlive)
    },

    /**
     * Check if current player can buy current square
     * Buying land requires the ENTIRE day (all 3 action points, must be morning)
     */
    canBuyCurrentSquare(): boolean {
      const player = this.activePlayer
      const square = this.activePlayerSquare
      if (!player || !square) return false
      // Must have full day available (morning, 3 actions)
      if (this.actionsRemaining !== 3 || this.actionPhase !== 'morning') return false
      if (square.isUtility) return false // Can't buy utility lands
      if (square.owner !== null) return false // Already owned
      const landType = getLandType(square.landTypeId)
      if (!landType) return false
      return player.gold >= getLandPrice(landType)
    },

    /**
     * Check if current player can conquer current square (fight defender)
     */
    canConquerCurrentSquare(): boolean {
      const player = this.activePlayer
      const square = this.activePlayerSquare
      if (!player || !square) return false
      if (this.actionsRemaining <= 0) return false
      if (square.isUtility) return false // Can't conquer utility lands
      if (square.owner === player.index) return false // Already own it
      // Can conquer if neutral or owned by another player
      return true
    },

    /**
     * Check if current player can upgrade defender on current square
     */
    canUpgradeDefender(): boolean {
      const player = this.activePlayer
      const square = this.activePlayerSquare
      if (!player || !square) return false
      if (this.actionsRemaining <= 0) return false
      if (square.owner !== player.index) return false // Must own the land
      if (square.defenderTier >= 4) return false // Max tier
      const upgradeCost = getDefenderUpgradeCost(square)
      return player.gold >= upgradeCost
    },

    /**
     * Check if current player can improve income on current square
     */
    canImproveIncome(): boolean {
      const player = this.activePlayer
      const square = this.activePlayerSquare
      if (!player || !square) return false
      if (this.actionsRemaining <= 0) return false
      if (square.owner !== player.index) return false // Must own the land
      if (square.isUtility) return false // Can't improve utility lands
      // Cost is based on current tax income (need gold to improve)
      const improveCost = getIncomeImproveCost(square)
      return player.gold >= improveCost
    },

    /**
     * Check if current square is a shop where items can be bought
     */
    isAtShop(): boolean {
      const square = this.activePlayerSquare
      if (!square) return false
      const landType = getLandType(square.landTypeId)
      if (!landType) return false
      return [SHOP_LAND_ID, SMITHY_LAND_ID, BAZAAR_LAND_ID].includes(landType.id)
    },

    /**
     * Get items available for purchase at current shop
     */
    shopItems(): ItemType[] {
      const square = this.activePlayerSquare
      if (!square) return []
      const landType = getLandType(square.landTypeId)
      if (!landType) return []
      return getShopInventory(landType.id)
    },

    /**
     * Check if player can buy items (at shop, has actions)
     */
    canBuyItems(): boolean {
      const player = this.activePlayer
      if (!player) return false
      if (this.actionsRemaining <= 0) return false
      return this.isAtShop
    },

    /**
     * Check if player can sell items (at shop, has actions, has items)
     */
    canSellItems(): boolean {
      const player = this.activePlayer
      if (!player) return false
      if (this.actionsRemaining <= 0) return false
      if (!this.isAtShop) return false
      return player.inventory.length > 0
    },

    /**
     * Check if current player is at Training Grounds
     */
    isAtTrainingGrounds(): boolean {
      const square = this.activePlayerSquare
      if (!square) return false
      const landType = getLandType(square.landTypeId)
      if (!landType) return false
      return landType.id === TRAINING_GROUNDS_ID
    },

    /**
     * Check if current player is at Library (can train spells)
     */
    isAtLibrary(): boolean {
      const square = this.activePlayerSquare
      if (!square) return false
      const landType = getLandType(square.landTypeId)
      if (!landType) return false
      return landType.id === LIBRARY_ID
    },

    /**
     * Check if current player is at Mage Guild (can train power and spells)
     */
    isAtMageGuild(): boolean {
      const square = this.activePlayerSquare
      if (!square) return false
      const landType = getLandType(square.landTypeId)
      if (!landType) return false
      return landType.id === MAGE_GUILD_ID
    },

    /**
     * Get count of lands owned by current player
     */
    playerLandCount(): number {
      const player = this.activePlayer
      if (!player) return 0
      return this.board.filter(sq => sq.owner === player.index).length
    },

    /**
     * Get land types where player owns ALL squares (can build)
     * Returns array of land type IDs
     */
    completedLandTypes(): number[] {
      const player = this.activePlayer
      if (!player) return []

      // Group board squares by land type
      const landTypeSquares = new Map<number, { owned: number; total: number }>()

      for (const square of this.board) {
        if (square.isUtility) continue

        const existing = landTypeSquares.get(square.landTypeId) ?? { owned: 0, total: 0 }
        existing.total++
        if (square.owner === player.index) {
          existing.owned++
        }
        landTypeSquares.set(square.landTypeId, existing)
      }

      // Return land type IDs where player owns all squares
      const completed: number[] = []
      for (const [landTypeId, counts] of landTypeSquares) {
        if (counts.owned === counts.total && counts.total > 0) {
          completed.push(landTypeId)
        }
      }
      return completed
    },

    /**
     * Check if player can build (owns all of at least one land type)
     */
    canBuild(): boolean {
      const player = this.activePlayer
      if (!player) return false
      if (this.actionsRemaining <= 0) return false
      return this.completedLandTypes.length > 0
    },

    /**
     * Get available buildings for a specific land type that player can build
     * Filters out already built and checks prerequisites
     */
    getAvailableBuildingsForLand(): (landTypeId: number) => BuildingType[] {
      return (landTypeId: number) => {
        const player = this.activePlayer
        if (!player) return []

        const landType = getLandType(landTypeId)
        if (!landType) return []

        // Get all buildings on this land type across all squares
        const builtOnThisType = new Set<string>()
        for (const square of this.board) {
          if (square.landTypeId === landTypeId && square.owner === player.index) {
            square.buildings.forEach(b => builtOnThisType.add(b))
          }
        }

        // Filter available buildings
        return landType.availableBuildings
          .map(name => getBuildingByName(name))
          .filter((b): b is BuildingType => b !== null)
          .filter(b => {
            // Not already built
            if (builtOnThisType.has(b.name.et)) return false
            // Can afford
            if (player.gold < b.cost) return false
            // Prerequisites met
            return b.prerequisites.every(prereq => builtOnThisType.has(prereq))
          })
      }
    },

    /**
     * Get current player's known spells as SpellType objects
     */
    playerKnownSpells(): SpellType[] {
      const player = this.activePlayer
      if (!player) return []
      return Object.keys(player.spellKnowledge)
        .map(name => getSpellByName(name))
        .filter((s): s is SpellType => s !== null)
    },

    /**
     * Check if current player can cast a specific spell
     * Player must know the spell and have enough mana
     */
    canCastSpell(): (spellId: number) => boolean {
      return (spellId: number) => {
        const player = this.activePlayer
        if (!player) return false
        if (this.actionsRemaining <= 0) return false

        const spell = getSpellById(spellId)
        if (!spell) return false

        // Must know the spell (have knowledge level >= 1)
        if (!player.spellKnowledge[spell.name.et]) return false

        // Must have enough mana
        if (player.mana[spell.manaType] < spell.manaCost) return false

        return true
      }
    },

    /**
     * Get total mana count for current player
     */
    playerTotalMana(): number {
      const player = this.activePlayer
      if (!player) return 0
      return Object.values(player.mana).reduce((sum, val) => sum + val, 0)
    },
  },

  actions: {
    /**
     * Initialize a new game
     */
    initGame(playerNames: string[]) {
      if (playerNames.length < 2 || playerNames.length > 4) {
        throw new Error('Game requires 2-4 players')
      }

      // Create players with starting equipment (knife)
      this.players = playerNames.map((name, index) => ({
        index,
        name,
        isAlive: true,
        position: 0, // Start at Royal Court
        gold: DEFAULT_PLAYER_STATS.gold,
        hp: DEFAULT_PLAYER_STATS.hp,
        maxHp: DEFAULT_PLAYER_STATS.maxHp,
        stats: { ...DEFAULT_PLAYER_STATS.stats },
        color: PLAYER_COLORS[index] ?? '#888888',
        equipment: {
          weapon: STARTING_WEAPON_ID, // Knife (1d4 pierce)
          armor: null,
          helm: null,
          accessory: null,
        },
        inventory: [],
        title: 'commoner' as PlayerTitle,
        pendingKingsGift: false,
        // Starting spells at level 1 (VBA lines 218-220)
        spellKnowledge: {
          'Maagia nool': 1,      // Magic Arrow
          'Maagiline turvis': 1, // Magic Shield
          'Kutsu metsloomi': 1,  // Summon Forest Animals
          'Jumalate viha': 1,    // Wrath of Gods
        },
        unlockedMercenaries: [],
        mana: {
          fire: 0,
          earth: 0,
          air: 0,
          water: 0,
          death: 0,
          life: 0,
          arcane: 0,
        },
        buffs: [],
        companions: [],
        mercenaries: [],
      }))

      // Generate board
      this.board = generateBoard()

      // Start game
      this.phase = 'playing'
      this.turn = 1
      this.currentPlayer = 0
      this.actionPhase = 'morning'
      this.actionsRemaining = 3
    },

    /**
     * Roll dice and move current player forward
     * Original game: rolls 2d6, moves forward by total
     *
     * DOUBLES MECHANIC (from VBA lines 4303-4370):
     * When rolling doubles (both dice same value):
     * 1. Player can choose to KEEP the roll or ROLL AGAIN
     * 2. Consecutive doubles award gold bonus: 50 * consecutive_count²
     *    - 1st double: 50 gold
     *    - 2nd consecutive: 200 gold (50 * 2²)
     *    - 3rd consecutive: 450 gold (50 * 3²)
     */
    rollAndMove() {
      if (this.phase !== 'playing' || this.actionsRemaining <= 0) return null
      // Don't allow rolling if awaiting doubles decision
      if (this.doubles?.awaitingDecision) return null

      const player = this.players[this.currentPlayer]
      if (!player) return null

      // Roll 2d6
      const die1 = Math.floor(Math.random() * 6) + 1
      const die2 = Math.floor(Math.random() * 6) + 1
      const total = die1 + die2

      this.lastDiceRoll = {
        dice: [die1, die2],
        total,
      }

      // Check for doubles
      const isDoubles = die1 === die2

      if (isDoubles) {
        // Increment consecutive doubles count
        const previousCount = this.doubles?.consecutiveCount ?? 0
        const newCount = previousCount + 1

        // Award gold bonus for consecutive doubles: 50 * count²
        const goldBonus = 50 * (newCount * newCount)
        player.gold += goldBonus

        // Set up doubles state - player must decide to keep or reroll
        this.doubles = {
          consecutiveCount: newCount,
          awaitingDecision: true,
          pendingMove: total,
        }

        // Don't consume action yet - wait for player decision
        return this.lastDiceRoll
      }

      // Not doubles - execute the move normally
      this.executeMove(player, total)

      // Reset doubles state since non-doubles was rolled
      this.doubles = null

      this.consumeAction()
      return this.lastDiceRoll
    },

    /**
     * Keep the current doubles roll and move
     * Called when player decides not to reroll after rolling doubles
     */
    keepDoublesRoll() {
      if (!this.doubles?.awaitingDecision) return false

      const player = this.players[this.currentPlayer]
      if (!player) return false

      // Execute the pending move
      this.executeMove(player, this.doubles.pendingMove)

      // Reset doubles state (consecutive count resets when keeping)
      this.doubles = null

      this.consumeAction()
      return true
    },

    /**
     * Reroll after rolling doubles
     * Player forfeits current roll to try for another doubles
     */
    rerollDoubles() {
      if (!this.doubles?.awaitingDecision) return false

      // Clear the awaiting decision flag but keep the consecutive count
      const currentCount = this.doubles.consecutiveCount
      this.doubles = {
        consecutiveCount: currentCount,
        awaitingDecision: false,
        pendingMove: 0,
      }

      // Roll again (this will handle the new roll)
      return this.rollAndMove()
    },

    /**
     * Execute a move by the given amount
     * Handles position update, Royal Court income collection, and event triggering
     */
    executeMove(player: Player, moveAmount: number) {
      const oldPosition = player.position

      // Move forward by dice total
      const boardSize = this.board.length
      player.position = (player.position + moveAmount) % boardSize

      // Check if player passed Royal Court (position 0)
      // Player passes if they wrapped around (new position < old position + total means they crossed 0)
      const passedRoyalCourt = player.position < oldPosition ||
        (oldPosition + moveAmount >= boardSize)

      if (passedRoyalCourt) {
        this.collectIncome(player)
      }

      // Check for event location and trigger event
      const landedSquare = this.board[player.position]
      if (landedSquare) {
        this.checkForEvent(landedSquare.landTypeId)
      }
    },

    /**
     * Collect tax income and mana from all owned lands
     * Called when passing Royal Court
     */
    collectIncome(player: Player) {
      let totalIncome = 0
      const manaGained: Partial<ManaPool> = {}

      // Add title salary (VBA lines 3974-3980)
      const salary = TITLE_SALARIES[player.title] ?? 20  // Default to commoner salary
      totalIncome += salary

      // Count Arcane Towers for scaling formula
      let arcaneTowerCount = 0

      for (const square of this.board) {
        if (square.owner === player.index) {
          // Include both base income and bonus from improvements
          totalIncome += getLandIncome(square)

          // Collect mana based on land type (from lands.json)
          const landType = getLandType(square.landTypeId)
          if (landType?.manaType) {
            if (landType.manaType === 'arcane') {
              arcaneTowerCount++
            } else {
              // Normal lands give 1 mana each
              manaGained[landType.manaType] = (manaGained[landType.manaType] ?? 0) + 1
            }
          }
        }
      }

      // Arcane Towers have special scaling: 1→1, 2→3, 3→6, 4→12
      // Verified from help.csv: "üks maagi torn toodab ühes päevas 1 arkaane mana,
      // kaks maagi torni toodavad 1-s päevas 3 arkaane mana, 3 maagi torni toodavad 6
      // ja 4 maagi torni ühe mängija omanduses toodavad 10 arkaane mana päevas"
      const arcaneFromTowers = getArcaneTowerMana(arcaneTowerCount)
      if (arcaneFromTowers > 0) {
        manaGained.arcane = (manaGained.arcane ?? 0) + arcaneFromTowers
      }

      // Apply income and mana
      player.gold += totalIncome

      for (const [type, amount] of Object.entries(manaGained)) {
        if (amount && amount > 0) {
          player.mana[type as ManaType] += amount
        }
      }

      return { gold: totalIncome, mana: manaGained }
    },

    /**
     * Consume one action point
     */
    consumeAction() {
      this.actionsRemaining--

      // Update action phase
      if (this.actionsRemaining === 2) {
        this.actionPhase = 'noon'
      } else if (this.actionsRemaining === 1) {
        this.actionPhase = 'evening'
      }

      // Auto end turn if no actions left
      if (this.actionsRemaining <= 0) {
        this.endTurn()
      }
    },

    /**
     * End current player's turn
     * Handles buff expiration, companion/mercenary contract tracking
     */
    endTurn() {
      const currentPlayer = this.players[this.currentPlayer]

      // Process buffs expiration for current player
      if (currentPlayer) {
        // Decrement buff durations and remove expired buffs
        currentPlayer.buffs = currentPlayer.buffs.filter(buff => {
          buff.duration--
          return buff.duration > 0
        })

        // Decrement companion turns and remove expired summons
        currentPlayer.companions = currentPlayer.companions.filter(companion => {
          if (companion.turnsRemaining === null) return true // Permanent pets never expire
          companion.turnsRemaining--
          return companion.turnsRemaining > 0
        })

        // Decrement mercenary contracts and remove expired mercenaries
        currentPlayer.mercenaries = currentPlayer.mercenaries.filter(merc => {
          merc.contractTurns--
          return merc.contractTurns > 0
        })
      }

      // Find next alive player
      let nextPlayer = (this.currentPlayer + 1) % this.players.length
      let attempts = 0

      while (this.players[nextPlayer]?.isAlive === false && attempts < this.players.length) {
        nextPlayer = (nextPlayer + 1) % this.players.length
        attempts++
      }

      // Check for game over (only one player left)
      if (this.alivePlayers.length <= 1) {
        this.phase = 'finished'
        return
      }

      // If we're back to first player, increment turn
      if (nextPlayer <= this.currentPlayer) {
        this.turn++
      }

      this.currentPlayer = nextPlayer
      this.actionPhase = 'morning'
      this.actionsRemaining = 3
    },

    /**
     * Reset game state
     */
    resetGame() {
      this.$reset()
    },

    /**
     * Buy the current square (if neutral and affordable)
     * Buying consumes the ENTIRE day (all 3 action points)
     */
    buyLand() {
      if (!this.canBuyCurrentSquare) return false

      const player = this.players[this.currentPlayer]
      if (!player) return false
      const square = this.board[player.position]
      if (!square) return false
      const landType = getLandType(square.landTypeId)
      if (!landType) return false

      // Pay the price (base price × 10)
      player.gold -= getLandPrice(landType)
      // Take ownership
      square.owner = player.index

      // Check for title promotion after acquiring land
      this.checkTitlePromotion()

      // Buying takes the whole day - end turn immediately
      this.endTurn()
      return true
    },

    /**
     * Start combat with the defender on current square
     */
    startCombat() {
      if (!this.canConquerCurrentSquare) return false

      const player = this.players[this.currentPlayer]
      if (!player) return false
      const square = this.board[player.position]
      if (!square) return false

      // Get defender based on land type and tier
      const landType = getLandType(square.landTypeId)
      if (!landType) return false

      const defenderName = landType.defenders[square.defenderTier - 1] ?? landType.defenders[0] ?? ''
      if (!defenderName) return false
      const defender = getMobByName(defenderName)

      if (!defender) {
        // No valid defender, auto-win
        square.owner = player.index
        this.consumeAction()
        return true
      }

      // Initialize combat state
      this.combat = {
        active: true,
        squareIndex: square.index,
        defenderName: defender.name.en,
        defenderMaxHp: defender.hp,
        defenderHp: defender.hp,
        defenderArmor: defender.armor,
        defenderDamage: defender.damage,
        defenderAttacksPerRound: defender.attacksPerRound,
        defenderDamageType: defender.damageType ?? 'crush',
        defenderStats: defender.stats,
        attackerHpAtStart: player.hp,
        round: 1,
        log: [],
        // Status effects initialized to zero
        defenderBleeding: 0,
        defenderStunnedTurns: 0,
        attackerBleeding: 0,
        attackerStunnedTurns: 0,
        attackerFrozenTurns: 0,
        fleeAttemptedThisRound: false,
        // Reinforcements initialized empty
        reinforcements: [],
        pendingReinforcements: [],
      }

      // Switch to combat phase
      this.phase = 'combat'

      // Log combat start
      this.combat.log.push({
        round: 0,
        actor: 'System',
        action: 'start',
        message: `Combat begins! ${player.name} vs ${defender.name.en}`,
      })

      return true
    },

    /**
     * Execute one round of combat (attack action)
     * Each attack = 1 action point
     *
     * Damage type effects (from VBA research):
     * - Pierce: Critical = DEX vs DEX+5, Effect = 100% armor bypass
     * - Slash: Critical = (STR + DEX/2) vs DEX+3, Effect = bleeding (50% of damage dealt)
     * - Crush: Critical = STR*2 vs DEX^3+2, Effect = stun for 2 turns
     */
    attackInCombat() {
      if (this.phase !== 'combat' || !this.combat?.active) return null
      if (this.actionsRemaining <= 0) return null

      const player = this.players[this.currentPlayer]
      if (!player) return null

      const combat = this.combat
      const results: CombatLogEntry[] = []

      // Process bleeding damage on defender at start of round
      if (combat.defenderBleeding > 0) {
        combat.defenderHp -= combat.defenderBleeding
        results.push({
          round: combat.round,
          actor: 'System',
          action: 'bleeding',
          damage: combat.defenderBleeding,
          message: `${combat.defenderName} takes ${combat.defenderBleeding} bleeding damage!`,
        })

        // Check if defender defeated by bleeding
        if (combat.defenderHp <= 0) {
          combat.defenderHp = 0
          results.push({
            round: combat.round,
            actor: 'System',
            action: 'victory',
            message: `${combat.defenderName} bleeds out! ${player.name} claims the land!`,
          })
          combat.log.push(...results)
          this.endCombat(true)
          return results
        }
      }

      // Process bleeding damage on player at start of round
      if (combat.attackerBleeding > 0) {
        player.hp -= combat.attackerBleeding
        results.push({
          round: combat.round,
          actor: 'System',
          action: 'bleeding',
          damage: combat.attackerBleeding,
          message: `${player.name} takes ${combat.attackerBleeding} bleeding damage!`,
        })

        // Check if player defeated by bleeding
        if (player.hp <= 0) {
          player.hp = 0
          player.isAlive = false
          results.push({
            round: combat.round,
            actor: 'System',
            action: 'defeat',
            message: `${player.name} bleeds out!`,
          })
          combat.log.push(...results)
          this.endCombat(false)
          return results
        }
      }

      // Move pending reinforcements to active at the start of each round
      // (they arrived at end of previous round, now they can act)
      if (combat.pendingReinforcements.length > 0) {
        combat.reinforcements.push(...combat.pendingReinforcements)
        combat.pendingReinforcements = []
      }

      // Check if player is stunned (skip their attack)
      if (combat.attackerStunnedTurns > 0) {
        combat.attackerStunnedTurns--
        results.push({
          round: combat.round,
          actor: player.name,
          action: 'stunned',
          message: `${player.name} is stunned and cannot attack!`,
        })
      } else {
        // Player attacks (using total stats including equipment)
        const playerStats = getPlayerTotalStats(player)
        const weaponDamage = getPlayerWeaponDamage(player)
        const playerAttacks = playerStats.strikes

        for (let i = 0; i < playerAttacks; i++) {
          const rawDamage = rollDamage(weaponDamage.diceCount, weaponDamage.diceSides, weaponDamage.bonus)

          // Check for critical hit based on damage type
          const damageType = weaponDamage.damageType as 'pierce' | 'slash' | 'crush'
          const isCritical = checkCriticalHit(
            damageType,
            playerStats.strength,
            playerStats.dexterity,
            combat.defenderStats.dexterity
          )

          let damage: number
          let critMessage = ''

          if (isCritical) {
            switch (damageType) {
              case 'pierce':
                // Pierce crit: 100% armor bypass
                damage = rawDamage
                critMessage = ' (CRITICAL: armor pierced!)'
                break
              case 'slash':
                // Slash crit: normal damage + apply bleeding if damage > 3
                damage = Math.max(0, rawDamage - combat.defenderArmor)
                if (damage > 3) {
                  const bleedAmount = Math.floor(damage * 0.5)
                  combat.defenderBleeding += bleedAmount
                  critMessage = ` (CRITICAL: bleeding for ${bleedAmount}/round!)`
                } else {
                  critMessage = ' (CRITICAL: but damage too low for bleeding)'
                }
                break
              case 'crush':
                // Crush crit: normal damage + stun if damage > 5
                damage = Math.max(0, rawDamage - combat.defenderArmor)
                if (damage > 5) {
                  combat.defenderStunnedTurns = 2
                  critMessage = ' (CRITICAL: stunned for 2 turns!)'
                } else {
                  critMessage = ' (CRITICAL: but damage too low for stun)'
                }
                break
              default:
                damage = Math.max(0, rawDamage - combat.defenderArmor)
            }
          } else {
            damage = Math.max(0, rawDamage - combat.defenderArmor)
          }

          combat.defenderHp -= damage

          const armorUsed = isCritical && damageType === 'pierce' ? 0 : combat.defenderArmor
          results.push({
            round: combat.round,
            actor: player.name,
            action: isCritical ? 'critical' : 'attack',
            damage,
            message: `${player.name} hits for ${damage} damage (${rawDamage} - ${armorUsed} armor)${critMessage}`,
          })
        }

        // Companion attacks
        for (const companion of player.companions) {
          if (companion.hp <= 0) continue // Skip dead companions
          if (combat.defenderHp <= 0) break // Stop if defender already dead

          for (let i = 0; i < companion.attacksPerRound; i++) {
            const rawDamage = rollDamage(companion.damage.diceCount, companion.damage.diceSides)
            const damage = Math.max(0, rawDamage - combat.defenderArmor)
            combat.defenderHp -= damage

            results.push({
              round: combat.round,
              actor: companion.name,
              action: 'attack',
              damage,
              message: `${companion.name} hits for ${damage} damage`,
            })
          }
        }

        // Mercenary attacks
        for (const merc of player.mercenaries) {
          if (merc.hp <= 0) continue // Skip dead mercenaries
          if (combat.defenderHp <= 0) break // Stop if defender already dead

          for (let i = 0; i < merc.attacksPerRound; i++) {
            const rawDamage = rollDamage(merc.damage.diceCount, merc.damage.diceSides)
            const damage = Math.max(0, rawDamage - combat.defenderArmor)
            combat.defenderHp -= damage

            results.push({
              round: combat.round,
              actor: merc.name,
              action: 'attack',
              damage,
              message: `${merc.name} (mercenary) hits for ${damage} damage`,
            })
          }
        }

        // Check if main defender defeated
        if (combat.defenderHp <= 0) {
          combat.defenderHp = 0
          // Check if there are reinforcements to take over
          if (combat.reinforcements.length > 0) {
            const nextDefender = combat.reinforcements.shift()!
            results.push({
              round: combat.round,
              actor: 'System',
              action: 'defender_defeated',
              message: `${combat.defenderName} defeated! ${nextDefender.name} steps forward to defend!`,
            })
            // Promote reinforcement to main defender
            combat.defenderName = nextDefender.name
            combat.defenderHp = nextDefender.hp
            combat.defenderMaxHp = nextDefender.maxHp
            combat.defenderArmor = nextDefender.armor
            combat.defenderDamage = nextDefender.damage
            combat.defenderAttacksPerRound = nextDefender.attacksPerRound
            combat.defenderDamageType = nextDefender.damageType
            // Reset status effects for new defender
            combat.defenderBleeding = 0
            combat.defenderStunnedTurns = 0
          } else {
            // No more defenders - victory!
            results.push({
              round: combat.round,
              actor: 'System',
              action: 'victory',
              message: `${combat.defenderName} defeated! ${player.name} claims the land!`,
            })
            combat.log.push(...results)
            this.endCombat(true)
            return results
          }
        }
      }

      // Check if defender is stunned (skip their attack)
      if (combat.defenderStunnedTurns > 0) {
        combat.defenderStunnedTurns--
        results.push({
          round: combat.round,
          actor: combat.defenderName,
          action: 'stunned',
          message: `${combat.defenderName} is stunned and cannot attack!`,
        })
      } else {
        // Defender attacks back
        const playerStats = getPlayerTotalStats(player)

        for (let i = 0; i < combat.defenderAttacksPerRound; i++) {
          const rawDamage = rollDamage(
            combat.defenderDamage.diceCount,
            combat.defenderDamage.diceSides
          )

          // Check for critical hit based on defender's damage type
          const defenderDamageType = combat.defenderDamageType
          const isCritical = checkCriticalHit(
            defenderDamageType,
            combat.defenderStats.strength,
            combat.defenderStats.dexterity,
            playerStats.dexterity
          )

          let damage: number
          let critMessage = ''

          if (isCritical) {
            switch (defenderDamageType) {
              case 'pierce':
                // Pierce crit: 100% armor bypass
                damage = rawDamage
                critMessage = ' (CRITICAL: armor pierced!)'
                break
              case 'slash':
                // Slash crit: normal damage + apply bleeding if damage > 3
                damage = Math.max(0, rawDamage - playerStats.armor)
                if (damage > 3) {
                  const bleedAmount = Math.floor(damage * 0.5)
                  combat.attackerBleeding += bleedAmount
                  critMessage = ` (CRITICAL: bleeding for ${bleedAmount}/round!)`
                } else {
                  critMessage = ' (CRITICAL: but damage too low for bleeding)'
                }
                break
              case 'crush':
                // Crush crit: normal damage + stun if damage > 5
                damage = Math.max(0, rawDamage - playerStats.armor)
                if (damage > 5) {
                  combat.attackerStunnedTurns = 2
                  critMessage = ' (CRITICAL: stunned for 2 turns!)'
                } else {
                  critMessage = ' (CRITICAL: but damage too low for stun)'
                }
                break
              default:
                damage = Math.max(0, rawDamage - playerStats.armor)
            }
          } else {
            // Use player's total armor (base from strength + equipment)
            damage = Math.max(0, rawDamage - playerStats.armor)
          }

          player.hp -= damage

          results.push({
            round: combat.round,
            actor: combat.defenderName,
            action: isCritical ? 'critical' : 'attack',
            damage,
            message: `${combat.defenderName} hits for ${damage} damage${critMessage}`,
          })
        }

        // Check if player defeated after main defender attack
        if (player.hp <= 0) {
          player.hp = 0
          player.isAlive = false
          results.push({
            round: combat.round,
            actor: 'System',
            action: 'defeat',
            message: `${player.name} has been slain!`,
          })
          combat.log.push(...results)
          this.endCombat(false)
          return results
        }
      }

      // Reinforcement mobs attack (simpler attack, no crits)
      // Reinforcements target companions/mercenaries first if available
      const playerStats = getPlayerTotalStats(player)
      const aliveCompanions = player.companions.filter(c => c.hp > 0)
      const aliveMercenaries = player.mercenaries.filter(m => m.hp > 0)

      for (const reinforcement of combat.reinforcements) {
        if (reinforcement.hp <= 0) continue // Skip dead reinforcements

        for (let i = 0; i < reinforcement.attacksPerRound; i++) {
          const rawDamage = rollDamage(
            reinforcement.damage.diceCount,
            reinforcement.damage.diceSides
          )

          // Target alive companions/mercenaries first, then player
          const companionTarget = aliveCompanions.find(c => c.hp > 0)
          const mercTarget = aliveMercenaries.find(m => m.hp > 0)

          if (companionTarget) {
            const damage = Math.max(0, rawDamage - companionTarget.armor)
            companionTarget.hp -= damage

            results.push({
              round: combat.round,
              actor: reinforcement.name,
              action: 'attack',
              damage,
              message: `${reinforcement.name} attacks ${companionTarget.name} for ${damage} damage`,
            })

            // Remove dead companions
            if (companionTarget.hp <= 0) {
              results.push({
                round: combat.round,
                actor: 'System',
                action: 'companion_defeated',
                message: `${companionTarget.name} has been slain!`,
              })
            }
          } else if (mercTarget) {
            const damage = Math.max(0, rawDamage - mercTarget.armor)
            mercTarget.hp -= damage

            results.push({
              round: combat.round,
              actor: reinforcement.name,
              action: 'attack',
              damage,
              message: `${reinforcement.name} attacks ${mercTarget.name} for ${damage} damage`,
            })

            // Remove dead mercenaries
            if (mercTarget.hp <= 0) {
              results.push({
                round: combat.round,
                actor: 'System',
                action: 'mercenary_defeated',
                message: `${mercTarget.name} has been slain!`,
              })
            }
          } else {
            // No companions/mercenaries, attack player
            const damage = Math.max(0, rawDamage - playerStats.armor)
            player.hp -= damage

            results.push({
              round: combat.round,
              actor: reinforcement.name,
              action: 'attack',
              damage,
              message: `${reinforcement.name} (reinforcement) hits for ${damage} damage`,
            })

            // Check if player defeated
            if (player.hp <= 0) {
              player.hp = 0
              player.isAlive = false
              results.push({
                round: combat.round,
                actor: 'System',
                action: 'defeat',
                message: `${player.name} has been slain!`,
              })
              combat.log.push(...results)
              this.endCombat(false)
              return results
            }
          }
        }
      }

      // Clean up dead companions and mercenaries
      player.companions = player.companions.filter(c => c.hp > 0)
      player.mercenaries = player.mercenaries.filter(m => m.hp > 0)

      // Check for adjacent land reinforcements at end of round
      const reinforcementResults = this.checkReinforcements()
      results.push(...reinforcementResults)

      combat.log.push(...results)
      combat.round++
      combat.fleeAttemptedThisRound = false // Reset flee attempt for new round

      // Consume action and check for evening
      this.consumeAction()

      // If no actions left, combat ends without victory
      if (this.actionsRemaining <= 0 && combat.active) {
        combat.log.push({
          round: combat.round,
          actor: 'System',
          action: 'timeout',
          message: 'Night falls. Combat ends - land not captured.',
        })
        this.endCombat(false)
      }

      return results
    },

    /**
     * Check for reinforcements from adjacent lands
     * Called at the end of each combat round
     *
     * Reinforcement conditions (ALL must be true):
     * 1. Adjacent land has same landTypeId as combat location
     * 2. Adjacent land has same owner (not neutral, owner !== null)
     * 3. Adjacent land's defender hasn't already reinforced this turn
     *
     * Reinforcement arrives next round (added to pendingReinforcements)
     */
    checkReinforcements(): CombatLogEntry[] {
      if (!this.combat?.active) return []

      const results: CombatLogEntry[] = []
      const combatSquare = this.board[this.combat.squareIndex]
      if (!combatSquare) return []

      const boardSize = this.board.length
      const combatPosition = this.combat.squareIndex

      // Check position-1 and position+1 (wrap around board)
      const adjacentPositions = [
        (combatPosition - 1 + boardSize) % boardSize,
        (combatPosition + 1) % boardSize,
      ]

      for (const adjPos of adjacentPositions) {
        const adjSquare = this.board[adjPos]
        if (!adjSquare) continue

        // Check all reinforcement conditions
        // 1. Same land type as combat location
        if (adjSquare.landTypeId !== combatSquare.landTypeId) continue

        // 2. Same owner (not neutral) - must match the combat square's owner
        if (adjSquare.owner === null) continue
        if (adjSquare.owner !== combatSquare.owner) continue

        // 3. Hasn't already reinforced this turn
        if (adjSquare.reinforcedThisTurn) continue

        // Get the defender mob from this adjacent land
        const landType = getLandType(adjSquare.landTypeId)
        if (!landType) continue

        const defenderName = landType.defenders[adjSquare.defenderTier - 1] ?? landType.defenders[0]
        if (!defenderName) continue

        const defender = getMobByName(defenderName)
        if (!defender) continue

        // Mark this land as having reinforced
        adjSquare.reinforcedThisTurn = true

        // Create reinforcement mob
        const reinforcement: ReinforcementMob = {
          name: defender.name.en,
          hp: defender.hp,
          maxHp: defender.hp,
          armor: defender.armor,
          damage: defender.damage,
          attacksPerRound: defender.attacksPerRound,
          damageType: defender.damageType ?? 'crush',
          fromSquareIndex: adjSquare.index,
          fromSquareName: adjSquare.name,
        }

        // Add to pending (will act next round)
        this.combat.pendingReinforcements.push(reinforcement)

        // Log the reinforcement arrival
        results.push({
          round: this.combat.round,
          actor: 'System',
          action: 'reinforcement',
          message: `${defender.name.en} from ${adjSquare.name} joins the battle!`,
        })
      }

      return results
    },

    /**
     * Flee from combat
     *
     * VBA formula (line 12556-12626):
     * - fleeja_Bonus = 2 (base for runner)
     * - chasija_Bonus = 1 (base for chaser)
     * - flee_vahe = player_dex - defender_dex
     * - If flee_vahe > 0 (player faster): fleeja_Bonus += (1 + flee_vahe)²
     * - If flee_vahe < 0 (defender faster): chasija_Bonus += (1 + |flee_vahe|)²
     * - Roll 1 to (fleeja_Bonus + chasija_Bonus)
     * - Success if roll > chasija_Bonus
     * - On failed flee, defender gets a free hit!
     */
    fleeCombat() {
      if (this.phase !== 'combat' || !this.combat?.active) return false

      const player = this.players[this.currentPlayer]
      if (!player) return false

      const combat = this.combat

      // Cannot flee again after failed attempt in same round
      if (combat.fleeAttemptedThisRound) {
        combat.log.push({
          round: combat.round,
          actor: 'System',
          action: 'flee_blocked',
          message: 'Cannot flee again this round!',
        })
        return false
      }

      combat.fleeAttemptedThisRound = true

      // VBA formula for flee chance
      const playerStats = getPlayerTotalStats(player)
      const playerDex = playerStats.dexterity
      const defenderDex = combat.defenderStats.dexterity

      let fleejaBonus = 2 // Base for runner (fleeja = "one who flees" in Estonian)
      let chaserBonus = 1 // Base for chaser (chasija)

      const dexDiff = playerDex - defenderDex
      if (dexDiff > 0) {
        // Player is faster - higher flee chance
        fleejaBonus += (1 + dexDiff) * (1 + dexDiff)
      } else if (dexDiff < 0) {
        // Defender is faster - lower flee chance
        const absDiff = Math.abs(dexDiff)
        chaserBonus += (1 + absDiff) * (1 + absDiff)
      }

      // Roll 1 to (fleejaBonus + chaserBonus)
      const total = fleejaBonus + chaserBonus
      const roll = Math.floor(Math.random() * total) + 1
      const fleeChancePercent = Math.round((fleejaBonus / total) * 100)

      combat.log.push({
        round: combat.round,
        actor: 'System',
        action: 'flee_odds',
        message: `Flee odds: ${fleeChancePercent}% (Runner ${fleejaBonus} vs Chaser ${chaserBonus})`,
      })

      if (roll > chaserBonus) {
        // Successful flee
        combat.log.push({
          round: combat.round,
          actor: player.name,
          action: 'flee',
          message: `${player.name} successfully flees from combat!`,
        })
        this.endCombat(false)
        return true
      } else {
        // Failed flee - defender gets a free hit!
        combat.log.push({
          round: combat.round,
          actor: player.name,
          action: 'flee_fail',
          message: `${player.name} tries to flee but fails!`,
        })

        // Defender gets free attack on failed flee (VBA line 12616)
        const rawDamage = rollDamage(
          combat.defenderDamage.diceCount,
          combat.defenderDamage.diceSides
        )
        const damage = Math.max(0, rawDamage - playerStats.armor)
        player.hp -= damage

        combat.log.push({
          round: combat.round,
          actor: combat.defenderName,
          action: 'opportunity_attack',
          damage,
          message: `${combat.defenderName} strikes the fleeing ${player.name} for ${damage} damage!`,
        })

        // Check if player died from the opportunity attack
        if (player.hp <= 0) {
          player.hp = 0
          player.isAlive = false
          combat.log.push({
            round: combat.round,
            actor: 'System',
            action: 'defeat',
            message: `${player.name} was slain while fleeing!`,
          })
          this.endCombat(false)
        }

        // Failed flee consumes action
        this.consumeAction()
        return false
      }
    },

    /**
     * End combat and return to playing phase
     */
    endCombat(victory: boolean) {
      if (!this.combat) return

      const player = this.players[this.currentPlayer]
      const square = this.board[this.combat.squareIndex]

      if (victory && player && square) {
        // Player wins - take ownership
        square.owner = player.index
        // Check for title promotion after conquering land
        this.checkTitlePromotion()
      }

      // Clear combat state
      this.combat.active = false
      this.phase = 'playing'

      // If player died, check for game over
      if (this.alivePlayers.length <= 1) {
        this.phase = 'finished'
      }
    },

    /**
     * Upgrade the defender tier on current square (1→2→3→4)
     */
    upgradeDefender() {
      if (!this.canUpgradeDefender) return false

      const player = this.players[this.currentPlayer]
      if (!player) return false
      const square = this.board[player.position]
      if (!square) return false
      const upgradeCost = getDefenderUpgradeCost(square)

      // Pay the cost
      player.gold -= upgradeCost
      // Upgrade tier
      square.defenderTier++

      this.consumeAction()
      return true
    },

    /**
     * Improve income on current square
     * Uses VBA formula from line 2039:
     * income_bonus = Int((base_tax / 2 + 10) / 3 * (4 - current_phase))
     * Max income is capped at base_tax * 3
     * If done in morning, also increases healing value
     */
    improveIncome() {
      if (!this.canImproveIncome) return false

      const player = this.players[this.currentPlayer]
      if (!player) return false
      const square = this.board[player.position]
      if (!square) return false
      const cost = getIncomeImproveCost(square)

      // Pay the cost
      player.gold -= cost

      // Calculate income increase using VBA formula
      const incomeIncrease = calculateIncomeImprovement(
        square.landTypeId,
        square.incomeBonus,
        this.actionPhase
      )
      square.incomeBonus += incomeIncrease

      // If morning, also increase healing
      if (this.actionPhase === 'morning') {
        square.healingBonus += 1
      }

      // Uses all remaining actions (like rest)
      this.endTurn()
      return true
    },

    /**
     * Buy an item from the current shop
     * Costs 1 action point
     * VBA: Max inventory = 20 items (line 14428)
     */
    buyItem(itemId: number) {
      if (!this.canBuyItems) return false

      const player = this.players[this.currentPlayer]
      if (!player) return false

      // VBA inventory limit: 20 items max (line 14428)
      if (player.inventory.length >= 20) return false

      const item = getItemById(itemId)
      if (!item) return false

      // Check if item is available at this shop
      const shopItems = this.shopItems
      if (!shopItems.find(i => i.id === itemId)) return false

      // Check affordability
      if (player.gold < item.value) return false

      // Check strength requirement
      if (player.stats.strength < item.requiredStrength) return false

      // Buy the item
      player.gold -= item.value
      player.inventory.push(itemId)

      this.consumeAction()
      return true
    },

    /**
     * Sell an item from inventory
     * Costs 1 action point
     */
    sellItem(itemId: number) {
      if (!this.canSellItems) return false

      const player = this.players[this.currentPlayer]
      if (!player) return false

      // Check if player has the item
      const itemIndex = player.inventory.indexOf(itemId)
      if (itemIndex === -1) return false

      const item = getItemById(itemId)
      if (!item) return false

      // Sell the item (50% value)
      const sellPrice = Math.floor(item.value * SELL_PRICE_MULTIPLIER)
      player.gold += sellPrice
      player.inventory.splice(itemIndex, 1)

      this.consumeAction()
      return true
    },

    /**
     * Equip an item from inventory
     * Costs 1 action point
     */
    equipItem(itemId: number) {
      if (this.actionsRemaining <= 0) return false

      const player = this.players[this.currentPlayer]
      if (!player) return false

      // Check if player has the item in inventory
      const itemIndex = player.inventory.indexOf(itemId)
      if (itemIndex === -1) return false

      const item = getItemById(itemId)
      if (!item) return false

      // Check strength requirement
      if (player.stats.strength < item.requiredStrength) return false

      // Determine equipment slot based on item type
      // CSV types: 1=helm, 2=armor, 3=boots, 4=ring, 6=weapon, 7=consumable
      let slot: keyof Equipment | null = null
      if (item.type === 'weapon') slot = 'weapon'
      else if (item.type === 'helm') slot = 'helm'
      else if (item.type === 'armor') slot = 'armor'
      else if (item.type === 'boots' || item.type === 'ring') slot = 'accessory'
      // Consumables can't be equipped (they're used, not worn)

      if (!slot) return false

      // Unequip current item in that slot (if any) and add to inventory
      const currentEquippedId = player.equipment[slot]
      if (currentEquippedId !== null) {
        player.inventory.push(currentEquippedId)
      }

      // Equip the new item
      player.equipment[slot] = itemId

      // Remove from inventory
      player.inventory.splice(itemIndex, 1)

      this.consumeAction()
      return true
    },

    /**
     * Unequip an item and return to inventory
     * Costs 1 action point
     */
    unequipItem(slot: keyof Equipment) {
      if (this.actionsRemaining <= 0) return false

      const player = this.players[this.currentPlayer]
      if (!player) return false

      const equippedId = player.equipment[slot]
      if (equippedId === null) return false

      // Move to inventory
      player.inventory.push(equippedId)
      player.equipment[slot] = null

      this.consumeAction()
      return true
    },

    /**
     * Build a building on a land type
     * Costs 1 action point + building cost
     * Can build from any square if player owns all squares of that land type
     */
    buildOnLand(landTypeId: number, buildingName: string) {
      if (!this.canBuild) return false
      if (!this.completedLandTypes.includes(landTypeId)) return false

      const player = this.players[this.currentPlayer]
      if (!player) return false

      const building = getBuildingByName(buildingName)
      if (!building) return false

      // Verify player can afford
      if (player.gold < building.cost) return false

      // Find a square of this land type owned by player to add building to
      const targetSquare = this.board.find(
        sq => sq.landTypeId === landTypeId && sq.owner === player.index
      )
      if (!targetSquare) return false

      // Pay cost
      player.gold -= building.cost

      // Add building to square
      targetSquare.buildings.push(building.name.et)

      // Apply building effects
      // 1. Grant spells to player (VBA: adds at level 1 or increases level)
      for (const spellName of building.grantsSpells) {
        if (!player.spellKnowledge[spellName]) {
          player.spellKnowledge[spellName] = 1
        }
        // Buildings grant knowledge, training increases it separately
      }

      // 2. Unlock mercenaries for player
      for (const mercName of building.unlocksMercenaries) {
        if (!player.unlockedMercenaries.includes(mercName)) {
          player.unlockedMercenaries.push(mercName)
        }
      }

      // 3. Update fortification level and archer count
      // VBA: Buildings column 19 = archery slots (cumulative)
      // Fort (Kants) = 2, Citadel (Linnus) = +1, Castle (Kindlus) = +1
      if (building.name.et === 'Kants') {
        // Apply to all squares of this land type owned by player
        for (const sq of this.board) {
          if (sq.landTypeId === landTypeId && sq.owner === player.index) {
            sq.fortificationLevel = 1
            sq.archerCount = 2 // Fort: 2 archers (VBA col_18)
          }
        }
      } else if (building.name.et === 'Linnus') {
        for (const sq of this.board) {
          if (sq.landTypeId === landTypeId && sq.owner === player.index) {
            sq.fortificationLevel = 2
            sq.archerCount = 3 // Fort + Citadel: 2+1 = 3 archers
          }
        }
      } else if (building.name.et === 'Kindlus') {
        for (const sq of this.board) {
          if (sq.landTypeId === landTypeId && sq.owner === player.index) {
            sq.fortificationLevel = 3
            sq.archerCount = 4 // Fort + Citadel + Castle: 2+1+1 = 4 archers
          }
        }
      }

      this.consumeAction()

      // Check for title promotion after building
      this.checkTitlePromotion()

      return true
    },

    /**
     * Hire a mercenary
     * VBA: mercenary_camp() line 17310, hire_mercenary() line 17372
     * Cost formula: mercTier × contractLength × 2
     * Requires mercenary to be unlocked via buildings
     */
    hireMercenary(mercName: string, contractLength: number = 5): { success: boolean; message: string } {
      const player = this.players[this.currentPlayer]
      if (!player) return { success: false, message: 'No active player' }
      if (this.actionsRemaining <= 0) return { success: false, message: 'No actions remaining' }

      // Check if mercenary is unlocked
      if (!player.unlockedMercenaries.includes(mercName)) {
        return { success: false, message: 'Mercenary not unlocked (build required building first)' }
      }

      // Get mob data for the mercenary
      const mercMob = getMobByName(mercName)
      if (!mercMob) return { success: false, message: 'Mercenary not found' }

      // Calculate cost: mercTier × contractLength × 2
      const cost = mercMob.mercTier * contractLength * 2
      if (player.gold < cost) {
        return { success: false, message: `Not enough gold (need ${cost})` }
      }

      // Deduct gold
      player.gold -= cost

      // Create mercenary instance
      const mercenary: MercenaryInstance = {
        id: `merc-${Date.now()}`,
        mobId: mercMob.id,
        name: mercMob.name.en,
        hp: mercMob.hp,
        maxHp: mercMob.hp,
        armor: mercMob.armor,
        damage: mercMob.damage,
        attacksPerRound: mercMob.attacksPerRound,
        damageType: mercMob.damageType ?? 'crush',
        stats: mercMob.stats,
        contractTurns: contractLength,
        mercTier: mercMob.mercTier,
      }

      player.mercenaries.push(mercenary)

      this.consumeAction()
      return {
        success: true,
        message: `Hired ${mercMob.name.en} for ${contractLength} turns (${cost}g)`,
      }
    },

    /**
     * Train a stat at Training Grounds
     * Costs full day (all 3 action points, morning only)
     * Verified: "Millegi treenimiseks läheb reeglina terve päev"
     * Formula: current_stat² * 5 (from VBA)
     * Max cap: 6 for STR/DEX (from VBA lines 17608, 17614)
     */
    trainStat(stat: 'strength' | 'dexterity') {
      if (!this.isAtTrainingGrounds) return false
      if (this.actionsRemaining !== 3 || this.actionPhase !== 'morning') return false

      const player = this.players[this.currentPlayer]
      if (!player) return false

      // Max stat cap of 6 for STR/DEX (from VBA)
      const MAX_STAT_CAP = 6
      if (player.stats[stat] >= MAX_STAT_CAP) return false

      // Training cost = current_stat² * 5 (from VBA)
      const trainingCost = getTrainingCost(player.stats[stat])
      if (player.gold < trainingCost) return false

      // Pay and increase stat
      player.gold -= trainingCost
      player.stats[stat]++

      // Takes entire day
      this.endTurn()
      return true
    },

    /**
     * Train Power stat at Mage Guild
     * Costs full day (all 3 action points, morning only)
     * Verified: "treenida suuremaks oma võluvõimet (power)"
     * Formula: current_stat² * 5 (from VBA)
     * Note: Power has no explicit cap in VBA (unlike STR/DEX which cap at 6)
     */
    trainPower() {
      if (!this.isAtMageGuild) return false
      if (this.actionsRemaining !== 3 || this.actionPhase !== 'morning') return false

      const player = this.players[this.currentPlayer]
      if (!player) return false

      // Training cost = current_stat² * 5 (from VBA)
      const trainingCost = getTrainingCost(player.stats.power)
      if (player.gold < trainingCost) return false

      // Pay and increase power
      player.gold -= trainingCost
      player.stats.power++

      // Takes entire day
      this.endTurn()
      return true
    },

    /**
     * Train a spell to increase its knowledge level
     * VBA line 1345: cost = current_knowledge × 200 gold
     * VBA line 1365/1381: takes full day (phase = 4)
     * Must be at Mage Guild (same as power training)
     */
    trainSpell(spellName: string): { success: boolean; message: string } {
      if (!this.isAtMageGuild) {
        return { success: false, message: 'Must be at Mage Guild to train spells' }
      }
      if (this.actionsRemaining !== 3 || this.actionPhase !== 'morning') {
        return { success: false, message: 'Spell training requires a full day (start in morning)' }
      }

      const player = this.players[this.currentPlayer]
      if (!player) return { success: false, message: 'No active player' }

      // Must know the spell
      const currentKnowledge = player.spellKnowledge[spellName]
      if (!currentKnowledge) {
        return { success: false, message: 'You do not know this spell' }
      }

      // VBA line 1345: cost = current_knowledge × 200
      const trainingCost = currentKnowledge * 200
      if (player.gold < trainingCost) {
        return { success: false, message: `Not enough gold (need ${trainingCost})` }
      }

      // Pay and increase knowledge
      player.gold -= trainingCost
      player.spellKnowledge[spellName] = currentKnowledge + 1

      // Takes entire day
      this.endTurn()
      return {
        success: true,
        message: `Trained ${spellName} to level ${currentKnowledge + 1} for ${trainingCost} gold`,
      }
    },

    /**
     * Check if player should be promoted to a new title
     * If promoted, generates King's Gift options for the player to choose from
     */
    checkTitlePromotion() {
      const player = this.players[this.currentPlayer]
      if (!player) return

      const landCount = this.board.filter(sq => sq.owner === player.index).length
      let newTitle: PlayerTitle = 'commoner'

      if (landCount >= TITLE_THRESHOLDS.duke) {
        newTitle = 'duke'
      } else if (landCount >= TITLE_THRESHOLDS.count) {
        newTitle = 'count'
      } else if (landCount >= TITLE_THRESHOLDS.baron) {
        newTitle = 'baron'
      }

      // Check for promotion
      const titleRanks: PlayerTitle[] = ['commoner', 'baron', 'count', 'duke']
      const currentRank = titleRanks.indexOf(player.title)
      const newRank = titleRanks.indexOf(newTitle)

      if (newRank > currentRank) {
        player.title = newTitle
        player.pendingKingsGift = true

        // Generate King's Gift options based on new title
        if (newTitle !== 'commoner') {
          const giftOptions = generateKingsGiftOptions(newTitle as 'baron' | 'count' | 'duke')
          this.kingsGiftPending = {
            playerIndex: player.index,
            title: newTitle as 'baron' | 'count' | 'duke',
            options: giftOptions,
          }
        }
      }
    },

    /**
     * Select an item from the King's Gift options
     * Adds the selected item to player's inventory and clears the pending gift
     */
    selectKingsGift(itemId: number): boolean {
      const player = this.players[this.currentPlayer]
      if (!player || !player.pendingKingsGift) return false
      if (!this.kingsGiftPending) return false

      // Verify the player is the one with the pending gift
      if (this.kingsGiftPending.playerIndex !== player.index) return false

      // Verify the selected item is one of the options
      const selectedItem = this.kingsGiftPending.options.find(item => item.id === itemId)
      if (!selectedItem) return false

      // Add the item to player's inventory
      player.inventory.push(itemId)

      // Clear the pending gift state
      player.pendingKingsGift = false
      this.kingsGiftPending = null

      return true
    },

    /**
     * Accept a King's Gift by option index (0, 1, or 2)
     * Wrapper for selectKingsGift used by UI
     */
    acceptKingsGift(optionIndex: number): boolean {
      if (!this.kingsGiftPending) return false
      if (optionIndex < 0 || optionIndex >= this.kingsGiftPending.options.length) return false

      const selectedItem = this.kingsGiftPending.options[optionIndex]
      if (!selectedItem) return false

      return this.selectKingsGift(selectedItem.id)
    },

    /**
     * Cast a spell (outside of combat)
     * Costs 1 action point + mana cost
     * Returns result of the spell effect
     */
    castSpell(spellId: number, targetIndex?: number): { success: boolean; message: string; effect?: unknown } {
      const player = this.players[this.currentPlayer]
      if (!player) return { success: false, message: 'No active player' }
      if (this.actionsRemaining <= 0) return { success: false, message: 'No actions remaining' }

      const spell = getSpellById(spellId)
      if (!spell) return { success: false, message: 'Spell not found' }

      // Must know the spell (have knowledge level >= 1)
      if (!player.spellKnowledge[spell.name.et]) {
        return { success: false, message: 'You do not know this spell' }
      }

      // Must have enough mana
      if (player.mana[spell.manaType] < spell.manaCost) {
        return { success: false, message: `Not enough ${spell.manaType} mana (need ${spell.manaCost})` }
      }

      // Deduct mana cost
      player.mana[spell.manaType] -= spell.manaCost

      // Apply spell effect based on type
      let result: { success: boolean; message: string; effect?: unknown }

      switch (spell.effectType) {
        case 'utility':
          // Utility spells like Heal, Armor, etc.
          if (spell.name.et === 'Paranda haavu') {
            // VBA line 6227: healvalue = knowledge * (power * 3)
            const knowledge = player.spellKnowledge[spell.name.et] || 1
            const healAmount = knowledge * (player.stats.power * 3)
            const actualHeal = Math.min(healAmount, player.maxHp - player.hp)
            player.hp += actualHeal
            result = { success: true, message: `Healed for ${actualHeal} HP`, effect: { healAmount: actualHeal } }
          } else if (spell.name.et === 'Maagiline turvis') {
            // Magic armor - buff effect
            // VBA line 6264: duration = 2 + power * power
            const knowledge = player.spellKnowledge[spell.name.et] || 1
            const duration = 2 + player.stats.power * player.stats.power
            // Armor buff power = knowledge level (each level adds +1 armor)
            const armorBuff: BuffEffect = {
              type: 'armor',
              duration,
              power: knowledge,
              sourceSpell: spell.name.et,
            }
            player.buffs.push(armorBuff)
            result = { success: true, message: `Magic armor +${knowledge} for ${duration} turns`, effect: { buff: 'armor', duration, power: knowledge } }
          } else if (spell.name.et === 'Kullapott') {
            // VBA line 6066: gold = ((random 10-30) + power × 20) × knowledge²
            const knowledge = player.spellKnowledge[spell.name.et] || 1
            const randomBase = (Math.floor(Math.random() * 3) + 1) * 10 // 10, 20, or 30
            const goldAmount = (randomBase + player.stats.power * 20) * (knowledge * knowledge)
            player.gold += goldAmount
            result = { success: true, message: `Generated ${goldAmount} gold`, effect: { gold: goldAmount } }
          } else {
            result = { success: true, message: `Cast ${spell.name.en}`, effect: { type: 'utility' } }
          }
          break

        case 'singleTarget':
        case 'aoe':
          // Damage spells - these are primarily for combat
          // Outside combat, they could be used on land defenders
          result = {
            success: true,
            message: `${spell.name.en} ready (use in combat)`,
            effect: { type: 'damage', basePower: spell.basePower },
          }
          break

        case 'summon':
          // Summon spells - create companions using VBA mechanics (lines 6099-6192)
          if (spell.summonTiers && spell.summonTiers.length > 0) {
            const knowledge = player.spellKnowledge[spell.name.et] || 1
            const tiers = spell.summonTiers

            // VBA lines 6103-6124: Determine summon tier based on knowledge
            // Loop through knowledge levels to find final summon and calculate summons_Level
            let summonsLevel = 1
            let summonCreature = tiers[0]!.creature
            let summonCount = tiers[0]!.count

            for (let x = 1; x <= knowledge; x++) {
              const tierIndex = Math.min(x - 1, tiers.length - 1)
              const prevIndex = Math.max(0, tierIndex - 1)

              const currentTier = tiers[tierIndex]!
              const prevTier = tiers[prevIndex]!

              if (x > 1 && currentTier.creature === prevTier.creature && currentTier.count === prevTier.count) {
                // Same creature and count as previous tier = increase summons level
                summonsLevel++
              } else if (x > 1) {
                // Different creature or count = reset summons level
                summonsLevel = 1
              }

              summonCreature = currentTier.creature
              summonCount = currentTier.count
            }

            // VBA line 6170: Summons get HP bonus = power × 2
            const hpBonus = player.stats.power * 2

            // VBA lines 6174-6178: If summonsLevel > 1, stats get multiplied
            // Multiplier = (20 + (summonsLevel - 1) * 2) / 10
            const statMultiplier = summonsLevel > 1 ? (20 + (summonsLevel - 1) * 2) / 10 : 1

            // Get mob data for the summoned creature
            const summonMob = getMobByName(summonCreature)
            if (summonMob) {
              // Summon duration = 3 + knowledge turns
              const summonDuration = 3 + knowledge

              // Create companion instances for each summon
              for (let i = 0; i < summonCount; i++) {
                const companion: CompanionInstance = {
                  id: `summon-${Date.now()}-${i}`,
                  mobId: summonMob.id,
                  name: summonMob.name.en,
                  hp: Math.floor((summonMob.hp + hpBonus) * statMultiplier),
                  maxHp: Math.floor((summonMob.hp + hpBonus) * statMultiplier),
                  armor: Math.floor(summonMob.armor * statMultiplier),
                  damage: summonMob.damage,
                  attacksPerRound: summonMob.attacksPerRound,
                  damageType: summonMob.damageType ?? 'crush',
                  stats: {
                    strength: Math.floor(summonMob.stats.strength * statMultiplier),
                    dexterity: Math.floor(summonMob.stats.dexterity * statMultiplier),
                    power: Math.floor(summonMob.stats.power * statMultiplier),
                  },
                  turnsRemaining: summonDuration,
                  isPet: false,
                  evolutionProgress: 0,
                  summonsLevel,
                }
                player.companions.push(companion)
              }
            }

            result = {
              success: true,
              message: `Summoned ${summonCount}x ${summonCreature}${summonsLevel > 1 ? ` (Lv${summonsLevel})` : ''}`,
              effect: {
                type: 'summon',
                creature: summonCreature,
                count: summonCount,
                summonsLevel,
                hpBonus,
                statMultiplier,
              },
            }
          } else if (spell.summons && spell.summons[0]) {
            // Legacy fallback - try to create companion from first summon name
            const summonName = spell.summons[0]
            const summonMob = getMobByName(summonName)
            if (summonMob) {
              const knowledge = player.spellKnowledge[spell.name.et] || 1
              const companion: CompanionInstance = {
                id: `summon-${Date.now()}-0`,
                mobId: summonMob.id,
                name: summonMob.name.en,
                hp: summonMob.hp + player.stats.power * 2,
                maxHp: summonMob.hp + player.stats.power * 2,
                armor: summonMob.armor,
                damage: summonMob.damage,
                attacksPerRound: summonMob.attacksPerRound,
                damageType: summonMob.damageType ?? 'crush',
                stats: summonMob.stats,
                turnsRemaining: 3 + knowledge,
                isPet: false,
                evolutionProgress: 0,
                summonsLevel: 1,
              }
              player.companions.push(companion)
            }
            result = {
              success: true,
              message: `Summoned ${summonName}`,
              effect: { type: 'summon', creature: summonName },
            }
          } else {
            result = { success: true, message: `Cast ${spell.name.en}`, effect: { type: 'summon' } }
          }
          break

        case 'buff':
          // Buff spells - generic buff application
          // This handles spells with effectType: 'buff' (different from utility buffs)
          {
            const knowledge = player.spellKnowledge[spell.name.et] || 1
            const duration = 2 + player.stats.power * player.stats.power

            // Determine buff type based on spell (can be extended)
            let buffType: 'armor' | 'strength' | 'haste' = 'armor'

            // Create and apply the buff
            const buff: BuffEffect = {
              type: buffType,
              duration,
              power: knowledge,
              sourceSpell: spell.name.et,
            }
            player.buffs.push(buff)

            result = {
              success: true,
              message: `${spell.name.en} applied for ${duration} turns`,
              effect: { type: 'buff', buffType, duration, power: knowledge },
            }
          }
          break

        default:
          result = { success: true, message: `Cast ${spell.name.en}` }
      }

      this.consumeAction()
      return result
    },

    /**
     * Cast a damage spell during combat
     * Uses mana but NOT an action point (done alongside attack)
     */
    castCombatSpell(spellId: number): { success: boolean; damage: number; message: string } {
      if (this.phase !== 'combat' || !this.combat?.active) {
        return { success: false, damage: 0, message: 'Not in combat' }
      }

      const player = this.players[this.currentPlayer]
      if (!player) return { success: false, damage: 0, message: 'No active player' }

      const spell = getSpellById(spellId)
      if (!spell) return { success: false, damage: 0, message: 'Spell not found' }

      // Must know the spell (have knowledge level >= 1)
      const spellKnowledge = player.spellKnowledge[spell.name.et] || 0
      if (!spellKnowledge) {
        return { success: false, damage: 0, message: 'You do not know this spell' }
      }

      // Must have enough mana
      if (player.mana[spell.manaType] < spell.manaCost) {
        return { success: false, damage: 0, message: `Not enough ${spell.manaType} mana` }
      }

      // Must be a damage spell
      if (spell.effectType !== 'singleTarget' && spell.effectType !== 'aoe') {
        return { success: false, damage: 0, message: 'Cannot use this spell in combat' }
      }

      // Deduct mana
      player.mana[spell.manaType] -= spell.manaCost

      // Calculate damage using VBA formula (line 12127):
      // damage = floor((spell_knowledge * base_damage + random(0, power/2)) * (caster_power / target_power) - random(0, target_power))
      const casterPower = player.stats.power
      const targetPower = this.combat.defenderStats.power || 1 // Avoid division by zero
      const baseDamage = spell.basePower
      const randomBonus = Math.floor(Math.random() * (casterPower / 2 + 1))
      const randomReduction = Math.floor(Math.random() * (targetPower + 1))

      // VBA formula: knowledge multiplies base damage, then power ratio applied
      const rawDamage = (spellKnowledge * baseDamage + randomBonus) * (casterPower / targetPower) - randomReduction
      const damage = Math.max(0, Math.floor(rawDamage))

      // Apply damage to defender
      this.combat.defenderHp -= damage

      // Log it
      this.combat.log.push({
        round: this.combat.round,
        actor: player.name,
        action: 'spell',
        damage,
        message: `${player.name} casts ${spell.name.en} for ${damage} damage!`,
      })

      // Check if defender defeated
      if (this.combat.defenderHp <= 0) {
        this.combat.defenderHp = 0
        this.combat.log.push({
          round: this.combat.round,
          actor: 'System',
          action: 'victory',
          message: `${this.combat.defenderName} defeated by magic!`,
        })
        this.endCombat(true)
      }

      return { success: true, damage, message: `Dealt ${damage} damage with ${spell.name.en}` }
    },

    /**
     * Check if current location triggers an event
     * VBA: vali_event() line 17920
     */
    checkForEvent(landTypeId: number) {
      let location: 'cave' | 'dungeon' | 'treasureIsland' | null = null

      if (landTypeId === CAVE_LAND_ID) {
        location = 'cave'
      } else if (landTypeId === DUNGEON_LAND_ID) {
        location = 'dungeon'
      } else if (landTypeId === TREASURE_ISLAND_LAND_ID) {
        location = 'treasureIsland'
      }

      if (!location) return // Not an event location

      // Select event based on weighted odds
      const selectedEvent = selectRandomEvent(location)
      if (!selectedEvent) return

      // Trigger the event
      this.event = {
        active: true,
        eventId: selectedEvent.id,
        eventName: selectedEvent.name.en,
        eventDescription: selectedEvent.description.en,
        location,
        choices: selectedEvent.choices,
        resolved: false,
      }

      // Set phase to event
      this.phase = 'event'
    },

    /**
     * Resolve an event and apply its effects
     * VBA: event_in_main_turn() line 17963
     */
    resolveEvent(choiceIndex?: number): { success: boolean; message: string } {
      if (!this.event?.active) {
        return { success: false, message: 'No active event' }
      }

      const player = this.players[this.currentPlayer]
      if (!player) return { success: false, message: 'No active player' }

      const event = eventsData.find(e => e.id === this.event!.eventId)
      if (!event) {
        this.event = null
        this.phase = 'playing'
        return { success: false, message: 'Event not found' }
      }

      let resultMessage = ''

      // Handle choice events
      if (event.choices && choiceIndex !== undefined) {
        const choice = event.choices[choiceIndex]
        if (choice) {
          switch (choice.effect) {
            case 'treasure':
              const goldAmount = 50 + Math.floor(Math.random() * 100)
              player.gold += goldAmount
              resultMessage = `You found treasure: ${goldAmount} gold!`
              break
            case 'combat':
              // Start combat with a random enemy
              resultMessage = 'You encounter an enemy!'
              // TODO: Could trigger combat here
              break
            case 'heal':
              const healAmount = Math.floor(Math.random() * 15) + 5
              const actualHeal = Math.min(healAmount, player.maxHp - player.hp)
              player.hp += actualHeal
              resultMessage = `The spring heals you for ${actualHeal} HP!`
              break
            case 'nothing':
              resultMessage = 'Nothing happens...'
              break
            default:
              resultMessage = 'You continue on your way.'
          }
        }
      } else if (event.effect) {
        // Apply event effect
        if (event.effect.gold) {
          const goldAmount = event.effect.gold.min +
            Math.floor(Math.random() * (event.effect.gold.max - event.effect.gold.min + 1))
          player.gold += goldAmount
          resultMessage = `You found ${goldAmount} gold!`
        }

        if (event.effect.stat && event.effect.amount) {
          player.stats[event.effect.stat] += event.effect.amount
          resultMessage = `Your ${event.effect.stat} increased by ${event.effect.amount}!`
        }

        if (event.effect.heal) {
          const healAmount = event.effect.heal.min +
            Math.floor(Math.random() * (event.effect.heal.max - event.effect.heal.min + 1))
          const actualHeal = Math.min(healAmount, player.maxHp - player.hp)
          player.hp += actualHeal
          resultMessage = `You were healed for ${actualHeal} HP!`
        }

        if (event.effect.mana) {
          const manaAmount = event.effect.mana.amount.min +
            Math.floor(Math.random() * (event.effect.mana.amount.max - event.effect.mana.amount.min + 1))
          // Random mana type if specified as 'random'
          const manaType = event.effect.mana.type === 'random'
            ? (['fire', 'earth', 'air', 'water', 'death', 'life', 'arcane'] as ManaType[])[Math.floor(Math.random() * 7)]!
            : event.effect.mana.type as ManaType
          player.mana[manaType] += manaAmount
          resultMessage = `You gained ${manaAmount} ${manaType} mana!`
        }

        if (event.effect.learnSpell) {
          // Learn a random spell the player doesn't know
          const allSpells = getAllSpells()
          const unknownSpells = allSpells.filter(s => !player.spellKnowledge[s.name.et])
          if (unknownSpells.length > 0) {
            const randomSpell = unknownSpells[Math.floor(Math.random() * unknownSpells.length)]!
            player.spellKnowledge[randomSpell.name.et] = 1
            resultMessage = `You learned ${randomSpell.name.en}!`
          } else {
            resultMessage = 'You have already learned all available spells.'
          }
        }

        if (event.effect.companion) {
          // Add a random companion (simple implementation)
          const companionMobs = mobsData.filter(m => m.mercTier <= 2) // Low-tier mobs
          if (companionMobs.length > 0) {
            const randomMob = companionMobs[Math.floor(Math.random() * companionMobs.length)]!
            const companion: CompanionInstance = {
              id: `event-companion-${Date.now()}`,
              mobId: randomMob.id,
              name: randomMob.name.en,
              hp: randomMob.hp,
              maxHp: randomMob.hp,
              armor: randomMob.armor,
              damage: randomMob.damage,
              attacksPerRound: randomMob.attacksPerRound,
              damageType: randomMob.damageType ?? 'crush',
              stats: randomMob.stats,
              turnsRemaining: null, // Permanent companion from event
              isPet: true,
              evolutionProgress: 0,
              summonsLevel: 1,
            }
            player.companions.push(companion)
            resultMessage = `${randomMob.name.en} joins you!`
          }
        }

        if (event.effect.buff) {
          // Apply a buff
          const buff: BuffEffect = {
            type: 'strength',
            duration: 5,
            power: 2,
            sourceSpell: 'event',
          }
          player.buffs.push(buff)
          resultMessage = 'You feel empowered!'
        }

        if (event.effect.combat) {
          // Combat events would start combat
          resultMessage = 'You must fight for the treasure!'
          // TODO: Could trigger special combat here
        }

        if (event.effect.itemReward) {
          // Give a random item
          const affordableItems = itemsData.filter(i => i.value >= 20 && i.value <= 200)
          if (affordableItems.length > 0) {
            const randomItem = affordableItems[Math.floor(Math.random() * affordableItems.length)]!
            player.inventory.push(randomItem.id)
            resultMessage = `You found ${randomItem.name.en}!`
          }
        }
      }

      // Clear event and return to playing
      this.event.resolved = true
      this.event = null
      this.phase = 'playing'

      return { success: true, message: resultMessage || 'Event resolved.' }
    },

    /**
     * Dismiss/skip an event without resolving it
     */
    dismissEvent() {
      if (!this.event?.active) return false
      this.event = null
      this.phase = 'playing'
      return true
    },
  },
})

/**
 * Generate a random game board
 * First square is always Royal Court, rest are random land types
 */
function generateBoard(): BoardSquare[] {
  const board: BoardSquare[] = []

  if (landsData.length === 0) {
    throw new Error('No land types loaded')
  }

  // Find Royal Court / Palace
  const royalCourt = landsData.find(l =>
    l.isRoyalCourt === true ||
    l.name.long.en === 'Royal Court' ||
    l.name.long.et === 'Palee'
  ) ?? landsData[0]!

  // Separate utility and territory lands
  const utilityLands = landsData.filter(l => l.isUtility && l.spawnChance > 0)
  const territoryLands = landsData.filter(l => !l.isUtility && l.spawnChance > 0)

  // First square is always Royal Court
  board.push(createSquare(0, royalCourt))

  // Generate remaining 33 squares
  // Mix of utility (shops, etc.) and territory lands
  const targetUtilityCount = 8 // Roughly how many utility lands we want
  const targetTerritoryCount = 25

  // Create weighted pools
  const utilityPool = createWeightedPool(utilityLands)
  const territoryPool = createWeightedPool(territoryLands)

  // Distribute lands
  const landSequence: LandType[] = []

  // Add utility lands
  for (let i = 0; i < targetUtilityCount && utilityPool.length > 0; i++) {
    const land = pickFromPool(utilityPool)
    if (land) landSequence.push(land)
  }

  // Add territory lands
  for (let i = 0; i < targetTerritoryCount && territoryPool.length > 0; i++) {
    const land = pickFromPool(territoryPool)
    if (land) landSequence.push(land)
  }

  // Shuffle the sequence
  shuffleArray(landSequence)

  // Create board squares
  for (let i = 0; i < landSequence.length && board.length < 34; i++) {
    const land = landSequence[i]
    if (land) board.push(createSquare(board.length, land))
  }

  // Calculate coordinates for display (rectangular track like Monopoly)
  // Layout: 11 squares on top, 6 on right, 11 on bottom, 6 on left = 34 total
  const TOP_COUNT = 11
  const RIGHT_COUNT = 6
  const BOTTOM_COUNT = 11
  const LEFT_COUNT = 6

  for (let i = 0; i < board.length; i++) {
    const square = board[i]
    if (!square) continue

    let x: number, y: number

    if (i < TOP_COUNT) {
      // Top row: left to right
      x = (i / (TOP_COUNT - 1)) * 100
      y = 0
    } else if (i < TOP_COUNT + RIGHT_COUNT) {
      // Right column: top to bottom
      const idx = i - TOP_COUNT
      x = 100
      y = ((idx + 1) / (RIGHT_COUNT + 1)) * 100
    } else if (i < TOP_COUNT + RIGHT_COUNT + BOTTOM_COUNT) {
      // Bottom row: right to left
      const idx = i - TOP_COUNT - RIGHT_COUNT
      x = 100 - (idx / (BOTTOM_COUNT - 1)) * 100
      y = 100
    } else {
      // Left column: bottom to top
      const idx = i - TOP_COUNT - RIGHT_COUNT - BOTTOM_COUNT
      x = 0
      y = 100 - ((idx + 1) / (LEFT_COUNT + 1)) * 100
    }

    square.coords = { x, y }
  }

  return board
}

/**
 * Create a board square from a land type
 */
function createSquare(index: number, land: LandType): BoardSquare {
  // Get first defender (tier 1)
  const defender = land.defenders[0]

  return {
    index,
    landTypeId: land.id,
    name: land.name.long.en || land.name.short.en,
    owner: null,
    defenderId: defender ? getMobIdByName(defender) : null,
    defenderTier: 1,
    coords: { x: 0, y: 0 },
    isUtility: land.isUtility,
    incomeBonus: 0,
    healingBonus: 0,
    buildings: [],
    fortificationLevel: 0,
    archerCount: 0,
    reinforcedThisTurn: false,
  }
}

/**
 * Create a weighted pool based on spawn chances
 */
function createWeightedPool(lands: LandType[]): LandType[] {
  const pool: LandType[] = []
  for (const land of lands) {
    // Add land multiple times based on spawn chance
    const count = Math.ceil(land.spawnChance / 10)
    for (let i = 0; i < count; i++) {
      pool.push(land)
    }
  }
  return pool
}

/**
 * Pick and remove a random item from pool
 */
function pickFromPool(pool: LandType[]): LandType | undefined {
  if (pool.length === 0) return undefined
  const index = Math.floor(Math.random() * pool.length)
  return pool.splice(index, 1)[0]
}

/**
 * Fisher-Yates shuffle
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]
    const swapItem = array[j]
    if (temp !== undefined && swapItem !== undefined) {
      array[i] = swapItem
      array[j] = temp
    }
  }
}

/**
 * Get mob ID by name (placeholder - will need proper lookup)
 */
function getMobIdByName(name: string): number | null {
  const mob = getMobByName(name)
  return mob?.id ?? null
}

// getMobByName is imported from schemas.ts

/**
 * Roll damage dice
 */
function rollDamage(diceCount: number, diceSides: number, bonus: number = 0): number {
  let total = bonus
  for (let i = 0; i < diceCount; i++) {
    total += Math.floor(Math.random() * diceSides) + 1
  }
  return total
}

/**
 * Check for critical hit based on damage type (from VBA research)
 *
 * Critical roll function: weighted random where roll = random(0 to attacker_value + defender_value)
 * If roll < attacker_value then critical succeeds.
 *
 * Pierce: attacker DEX vs defender DEX+5
 * Slash: (attacker STR + DEX/2) vs defender DEX+3
 * Crush: attacker STR*2 vs defender DEX^3+2
 */
function checkCriticalHit(
  damageType: 'pierce' | 'slash' | 'crush',
  attackerStrength: number,
  attackerDexterity: number,
  defenderDexterity: number
): boolean {
  let attackerValue: number
  let defenderValue: number

  switch (damageType) {
    case 'pierce':
      // Pierce: attacker DEX vs defender DEX+5
      attackerValue = attackerDexterity
      defenderValue = defenderDexterity + 5
      break
    case 'slash':
      // Slash: (attacker STR + DEX/2) vs defender DEX+3
      attackerValue = attackerStrength + Math.floor(attackerDexterity / 2)
      defenderValue = defenderDexterity + 3
      break
    case 'crush':
      // Crush: attacker STR*2 vs defender DEX^3+2
      // Note: DEX^3 would be extremely high (e.g., DEX 3 = 27), so crush crits are rare
      attackerValue = attackerStrength * 2
      defenderValue = Math.pow(defenderDexterity, 3) + 2
      break
    default:
      return false
  }

  // Weighted random roll: if roll < attacker_value, critical succeeds
  const totalRange = attackerValue + defenderValue
  const roll = Math.floor(Math.random() * totalRange)

  return roll < attackerValue
}

/**
 * Get land type data by ID
 */
export function getLandType(id: number): LandType | undefined {
  return landsData.find(l => l.id === id)
}

/**
 * Get actual land purchase price (base price × multiplier)
 */
export function getLandPrice(landType: LandType): number {
  return landType.price * LAND_PRICE_MULTIPLIER
}

/**
 * Get cost to upgrade defender to next tier
 * Formula from VBA:
 * - Tier 1->2: merc_tier * 4 * 1
 * - Tier 2->3: merc_tier * 4 * 2
 * - Tier 3->4: merc_tier * 5 * 3
 * Where merc_tier comes from the NEXT defender mob's data
 */
export function getDefenderUpgradeCost(square: BoardSquare): number {
  const currentTier = square.defenderTier
  if (currentTier >= 4) return 0 // Already at max tier

  const landType = getLandType(square.landTypeId)
  if (!landType) return 0

  // Get the next defender name (next tier = currentTier, since array is 0-indexed)
  const nextDefenderName = landType.defenders[currentTier]
  if (!nextDefenderName) return 0

  // Look up the mob's merc_tier
  const nextDefender = getMobByName(nextDefenderName)
  if (!nextDefender) return 0

  const mercTier = nextDefender.mercTier

  // Apply formula based on which tier upgrade this is
  switch (currentTier) {
    case 1: return mercTier * 4 * 1 // Tier 1->2
    case 2: return mercTier * 4 * 2 // Tier 2->3
    case 3: return mercTier * 5 * 3 // Tier 3->4
    default: return 0
  }
}

/**
 * Get cost to improve land income
 * Cost increases with current income level
 * Note: Formula is unverified - using estimate
 */
function getIncomeImproveCost(square: BoardSquare): number {
  const landType = getLandType(square.landTypeId)
  if (!landType) return 999999

  // Base cost + bonus cost
  // Estimate: 10 gold per existing income point
  const currentIncome = landType.taxIncome + square.incomeBonus
  return 10 + currentIncome * 5
}

/**
 * Calculate income improvement bonus based on VBA formula (line 2039):
 * income_bonus = Int((base_tax / 2 + 10) / 3 * (4 - current_phase))
 *
 * Where:
 * - base_tax is the land's base taxIncome (Game_map column 7)
 * - current_phase: 1=morning, 2=noon, 3=evening
 * - Max income is capped at base_tax * 3
 *
 * The income bonus decreases as the day progresses (more bonus if done in morning).
 */
export function calculateIncomeImprovement(
  landTypeId: number,
  currentIncomeBonus: number,
  actionPhase: ActionPhase
): number {
  const landType = getLandType(landTypeId)
  if (!landType) return 0

  const baseTax = landType.taxIncome

  // Convert action phase to numeric: morning=1, noon=2, evening=3
  const phaseNumber = actionPhase === 'morning' ? 1 : actionPhase === 'noon' ? 2 : 3

  // VBA formula: Int((base_tax / 2 + 10) / 3 * (4 - current_phase))
  const incomeBonus = Math.floor((baseTax / 2 + 10) / 3 * (4 - phaseNumber))

  // Calculate what the new total would be
  const newTotal = currentIncomeBonus + incomeBonus

  // Max income bonus is capped at base_tax * 3
  const maxBonus = baseTax * 3
  const cappedBonus = Math.min(newTotal, maxBonus) - currentIncomeBonus

  // Return the actual increase (may be less than calculated if at cap)
  return Math.max(0, cappedBonus)
}

/**
 * Get total income from a land (base + bonus)
 */
export function getLandIncome(square: BoardSquare): number {
  const landType = getLandType(square.landTypeId)
  if (!landType) return 0
  return landType.taxIncome + square.incomeBonus
}

/**
 * Select a random event based on location and weighted odds
 * VBA: vali_event() line 17920
 */
function selectRandomEvent(location: 'cave' | 'dungeon' | 'treasureIsland'): EventType | null {
  // Filter events that are enabled for this location and build weighted pool
  const eligibleEvents: { event: EventType; chance: number }[] = []

  for (const event of eventsData) {
    const locationConfig = event.locations[location]
    if (locationConfig?.enabled && locationConfig.chance > 0) {
      eligibleEvents.push({ event, chance: locationConfig.chance })
    }
  }

  if (eligibleEvents.length === 0) return null

  // Calculate total weight
  const totalWeight = eligibleEvents.reduce((sum, e) => sum + e.chance, 0)

  // Random selection based on weight
  let random = Math.random() * totalWeight
  for (const { event, chance } of eligibleEvents) {
    random -= chance
    if (random <= 0) {
      return event
    }
  }

  // Fallback to first eligible event
  return eligibleEvents[0]?.event ?? null
}

/**
 * Get item by ID
 */
export function getItemById(id: number): ItemType | undefined {
  return itemsData.find(i => i.id === id)
}

/**
 * Get shop inventory based on shop type
 * VBA shop mechanics (lines 3032-3080):
 * - Shop (id 1): Item types 4-9, value 25-10000
 * - Smithy (id 2): Item types 1-6 (weapons/armor focused)
 * - Bazaar (id 3): All types, value 25-400 gold max
 */
function getShopInventory(landTypeId: number): ItemType[] {
  switch (landTypeId) {
    case SHOP_LAND_ID:
      // Shop: VBA value range 25-10000 (line 3044-3046)
      return itemsData.filter(i => i.value >= 25 && i.value <= 10000)

    case SMITHY_LAND_ID:
      // Smithy: Weapons and armor only (VBA types 1-6)
      return itemsData.filter(i => i.type === 'weapon' || i.type === 'armor')

    case BAZAAR_LAND_ID:
      // Bazaar: Random selection, max 400 gold (VBA line 3054-3057)
      const bazaarItems = itemsData.filter(i => i.value >= 25 && i.value <= 400)
      // Shuffle and return up to 10 items
      const shuffled = [...bazaarItems]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = shuffled[i]
        const other = shuffled[j]
        if (temp && other) {
          shuffled[i] = other
          shuffled[j] = temp
        }
      }
      return shuffled.slice(0, 10)

    default:
      return []
  }
}

/**
 * Generate 3 random items for King's Gift based on title
 * - Baron (3 lands): Items worth 50-120 gold
 * - Count (9 lands): Items worth 121-300 gold
 * - Duke (15 lands): Items worth 301-1000 gold
 */
export function generateKingsGiftOptions(title: 'baron' | 'count' | 'duke'): ItemType[] {
  const range = KINGS_GIFT_VALUE_RANGES[title]

  // Filter items within the value range for this title
  const eligibleItems = itemsData.filter(item =>
    item.value >= range.min && item.value <= range.max
  )

  // If we don't have enough eligible items, return what we have
  if (eligibleItems.length <= 3) {
    return eligibleItems
  }

  // Shuffle the eligible items using Fisher-Yates
  const shuffled = [...eligibleItems]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]
    const other = shuffled[j]
    if (temp && other) {
      shuffled[i] = other
      shuffled[j] = temp
    }
  }

  // Return the first 3 items
  return shuffled.slice(0, 3)
}

/**
 * Calculate total player stats including equipment bonuses
 */
export function getPlayerTotalStats(player: Player): {
  hp: number
  maxHp: number
  strength: number
  dexterity: number
  power: number
  armor: number
  strikes: number
} {
  let bonusHp = 0
  let bonusStrength = 0
  let bonusDexterity = 0
  let bonusPower = 0
  let bonusArmor = 0
  let bonusStrikes = 0

  // Add equipment bonuses
  const slots: (keyof Equipment)[] = ['weapon', 'armor', 'helm', 'accessory']
  for (const slot of slots) {
    const itemId = player.equipment[slot]
    if (itemId !== null) {
      const item = getItemById(itemId)
      if (item) {
        bonusHp += item.bonuses.hp
        bonusStrength += item.bonuses.strength
        bonusDexterity += item.bonuses.dexterity
        bonusPower += item.bonuses.power
        bonusArmor += item.bonuses.armor
        bonusStrikes += item.bonuses.strikes
      }
    }
  }

  // Add buff bonuses
  for (const buff of player.buffs) {
    switch (buff.type) {
      case 'armor':
        bonusArmor += buff.power
        break
      case 'strength':
        bonusStrength += buff.power
        break
      case 'haste':
        // Haste adds to strikes (attacks per round)
        bonusStrikes += buff.power
        break
    }
  }

  // Base armor from strength (every 4th point)
  const baseArmor = Math.floor((player.stats.strength + bonusStrength) / 4)

  return {
    hp: player.hp,
    maxHp: player.maxHp + bonusHp,
    strength: player.stats.strength + bonusStrength,
    dexterity: player.stats.dexterity + bonusDexterity,
    power: player.stats.power + bonusPower,
    armor: baseArmor + bonusArmor,
    strikes: 1 + Math.floor((player.stats.dexterity + bonusDexterity) / 5) + bonusStrikes,
  }
}

/**
 * Get weapon damage dice for a player
 * Includes STR-based damage bonus from VBA formula:
 * - If STR >= required: bonus = strength - weapon_required_strength
 * - If STR < required: bonus = 2 * (strength - required) (double penalty!)
 */
export function getPlayerWeaponDamage(player: Player): { diceCount: number; diceSides: number; bonus: number; damageType: string } {
  const weaponId = player.equipment.weapon

  // Calculate total strength including equipment bonuses
  let totalStrength = player.stats.strength
  const slots: (keyof Equipment)[] = ['weapon', 'armor', 'helm', 'accessory']
  for (const slot of slots) {
    const itemId = player.equipment[slot]
    if (itemId !== null) {
      const item = getItemById(itemId)
      if (item) {
        totalStrength += item.bonuses.strength
      }
    }
  }

  // Add strength buff bonuses
  for (const buff of player.buffs) {
    if (buff.type === 'strength') {
      totalStrength += buff.power
    }
  }

  if (weaponId !== null) {
    const weapon = getItemById(weaponId)
    if (weapon?.weapon) {
      // Calculate STR bonus/penalty
      const requiredStr = weapon.requiredStrength
      let strBonus: number

      if (totalStrength >= requiredStr) {
        // Bonus = STR - required (1 damage per point above requirement)
        strBonus = totalStrength - requiredStr
      } else {
        // Penalty = 2 * (STR - required) = double penalty for being under requirement!
        strBonus = 2 * (totalStrength - requiredStr)
      }

      return {
        diceCount: weapon.weapon.diceCount,
        diceSides: weapon.weapon.diceSides,
        bonus: strBonus,
        damageType: weapon.weapon.damageType,
      }
    }
  }
  // Unarmed: 1d[STR] damage (VBA lines 15449-15452)
  return { diceCount: 1, diceSides: totalStrength, bonus: 0, damageType: 'crush' }
}

// getBuildingByName and getBuildingById are imported from schemas.ts and re-exported
export { getBuildingByName, getBuildingById }

/**
 * Get title display name
 */
export function getTitleDisplayName(title: PlayerTitle): string {
  const names: Record<PlayerTitle, string> = {
    commoner: 'Commoner',
    baron: 'Baron',
    count: 'Count',
    duke: 'Duke',
  }
  return names[title]
}

/**
 * Get arcane mana from Arcane Towers based on count
 * Verified from VBA tower_check() at line 3844:
 * - 1 tower: +1 (total 1)
 * - 2 towers: +2 (total 3)
 * - 3 towers: +3 (total 6)
 * - 4 towers: +6 (total 12)
 *
 * Note: help.csv says 4 towers = 10, but VBA code calculates 12.
 * Following VBA implementation for faithful port.
 */
function getArcaneTowerMana(towerCount: number): number {
  const manaByCount = [0, 1, 3, 6, 12]
  return manaByCount[Math.min(towerCount, 4)] ?? 12
}

// getSpellByName and getSpellById are imported from schemas.ts and re-exported
export { getSpellByName, getSpellById }

/**
 * Get all valid spells (filters out corrupted entries)
 */
export function getAllSpells(): SpellType[] {
  // Filter out corrupted entries (ID 37, 38 have invalid data)
  return spellsData.filter(s => s.name.et && s.name.et.length > 0 && !s.name.et.match(/^\d+$/))
}

/**
 * Get mana type display name
 */
export function getManaTypeName(manaType: ManaType): string {
  const names: Record<ManaType, string> = {
    fire: 'Fire',
    earth: 'Earth',
    air: 'Air',
    water: 'Water',
    death: 'Death',
    life: 'Life',
    arcane: 'Arcane',
  }
  return names[manaType]
}

/**
 * Get mana type color for UI display
 * Verified from help.csv lines 46-73
 */
export function getManaTypeColor(manaType: ManaType): string {
  const colors: Record<ManaType, string> = {
    fire: '#ef4444',    // punane (red)
    earth: '#a3e635',   // roheline (green/lime)
    air: '#38bdf8',     // helesinine (light blue) - fixed from yellow
    water: '#3b82f6',   // tumesinine (dark blue)
    death: '#6b7280',   // sinakashall (grayish-blue)
    life: '#f9fafb',    // valge (white)
    arcane: '#fbbf24',  // kuldne (golden) - fixed from purple
  }
  return colors[manaType]
}

/**
 * Calculate training cost for a stat
 * Formula: current_stat² * 5 (verified from VBA)
 * Examples: 2→3 costs 20g, 3→4 costs 45g, 4→5 costs 80g, 5→6 costs 125g
 */
export function getTrainingCost(currentStatValue: number): number {
  return currentStatValue * currentStatValue * 5
}

/**
 * Max stat cap for STR and DEX training
 * Verified from VBA lines 17608, 17614
 */
export const MAX_TRAINING_STAT_CAP = 6
