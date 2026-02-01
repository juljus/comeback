import { defineStore } from 'pinia'
import landsData from '~/data/lands.json'
import mobsData from '~/data/mobs.json'
import itemsData from '~/data/items.json'
import buildingsData from '~/data/buildings.json'
import spellsData from '~/data/spells.json'

// Land type from JSON structure
interface LandType {
  id: number
  name: {
    short: { en: string; et: string }
    long: { en: string; et: string }
  }
  price: number
  taxIncome: number
  healing: number
  defenders: string[]
  spawnChance: number
  availableBuildings: string[]
  isUtility: boolean
  isRoyalCourt?: boolean
}

/**
 * Item type from items.json
 */
export interface ItemType {
  id: number
  name: { en: string; et: string }
  type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'unknown'
  value: number
  requiredStrength: number
  bonuses: {
    hp: number
    strength: number
    dexterity: number
    power: number
    armor: number
    strikes: number
    healing: number
    speed: number
  }
  manaBonus: {
    fire: number
    earth: number
    air: number
    water: number
    death: number
    life: number
    arcane: number
  }
  elementalDamage: {
    fire: number
    earth: number
    air: number
    water: number
  }
  grantsSpell: string
  weapon?: {
    diceCount: number
    diceSides: number
    damageType: 'pierce' | 'slash' | 'crush'
  }
}

/**
 * Building type from buildings.json
 */
export interface BuildingType {
  id: number
  name: { en: string; et: string }
  cost: number
  prerequisites: string[] // Estonian building names required
  grantsSpells: string[] // Estonian spell names
  unlocksMercenaries: string[] // Estonian mercenary names
}

/**
 * Mana types (7 total)
 */
export type ManaType = 'fire' | 'earth' | 'air' | 'water' | 'death' | 'life' | 'arcane'

/**
 * Mana pool - one value per mana type
 */
export interface ManaPool {
  fire: number
  earth: number
  air: number
  water: number
  death: number
  life: number
  arcane: number
}

/**
 * Spell type from spells.json
 */
export interface SpellType {
  id: number
  name: { en: string; et: string }
  description: { en: string; et: string }
  type: 'damage' | 'summon' | 'buff'
  manaCost: number
  manaType: ManaType
  basePower: number
  summons: string[]
  effectType: 'singleTarget' | 'aoe' | 'summon' | 'utility' | 'buff'
}

/**
 * Land type to mana type mapping (verified from lands.csv column 25)
 * Key is land type ID, value is mana type generated
 */
const LAND_MANA_MAP: Record<number, ManaType | null> = {
  19: 'arcane', // Arcane Tower
  20: 'life',   // Valley
  21: 'earth',  // Forest
  22: null,     // Highland - no mana
  23: 'fire',   // Hill
  24: 'fire',   // Mountain
  25: null,     // Barren - no mana
  26: null,     // Tundra - no mana
  27: 'air',    // Desert
  28: 'death',  // Swamp
  29: null,     // Volcano - no mana
  30: 'earth',  // Brushland
  31: null,     // Burrows - no mana
  32: 'water',  // Jungle
  33: 'air',    // Rocks
  34: 'water',  // Iceland
  35: null,     // Woodland - no mana
  36: 'death',  // Dark Forest
  37: 'life',   // Plain
}

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
  weapon: number | null // Item ID
  armor: number | null // Item ID
  helm: number | null // Item ID (consumable type = helms)
  accessory: number | null // Item ID (boots, rings, etc.)
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
  knownSpells: string[] // Estonian spell names learned from buildings/scrolls
  unlockedMercenaries: string[] // Estonian mercenary names unlocked from buildings
  mana: ManaPool // Current mana for each type
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

/**
 * Mob/Creature data from mobs.json
 */
interface MobType {
  id: number
  name: { en: string; et: string }
  hp: number
  attacksPerRound: number
  armor: number
  damage: {
    diceCount: number
    diceSides: number
    bonus: number
  }
  stats: {
    strength: number
    dexterity: number
    power: number
  }
  damageType?: 'pierce' | 'slash' | 'crush'
  mercTier: number
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
  damage: { diceCount: number; diceSides: number; bonus: number }
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
  defenderDamage: { diceCount: number; diceSides: number; bonus: number }
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
 * King's Gift value ranges by title
 */
const KINGS_GIFT_VALUE_RANGES: Record<'baron' | 'count' | 'duke', { min: number; max: number }> = {
  baron: { min: 50, max: 120 },
  count: { min: 121, max: 300 },
  duke: { min: 301, max: 1000 },
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
  players: Player[]
  board: BoardSquare[]
  lastDiceRoll: DiceRoll | null
  combat: CombatState | null
  doubles: DoublesState | null // Tracks doubles mechanic state
  kingsGiftPending: KingsGiftState | null // Pending King's Gift selection
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
      return player.knownSpells
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

        // Must know the spell
        if (!player.knownSpells.includes(spell.name.et)) return false

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
        knownSpells: [],
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
     * Handles position update and Royal Court income collection
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
    },

    /**
     * Collect tax income and mana from all owned lands
     * Called when passing Royal Court
     */
    collectIncome(player: Player) {
      let totalIncome = 0
      const manaGained: Partial<ManaPool> = {}

      // Count Arcane Towers for scaling formula
      let arcaneTowerCount = 0

      for (const square of this.board) {
        if (square.owner === player.index) {
          // Include both base income and bonus from improvements
          totalIncome += getLandIncome(square)

          // Collect mana based on land type
          const manaType = LAND_MANA_MAP[square.landTypeId]
          if (manaType) {
            if (manaType === 'arcane') {
              arcaneTowerCount++
            } else {
              // Normal lands give 1 mana each
              manaGained[manaType] = (manaGained[manaType] ?? 0) + 1
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
     */
    endTurn() {
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
            combat.defenderDamage.diceSides,
            combat.defenderDamage.bonus
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
      const playerStats = getPlayerTotalStats(player)
      for (const reinforcement of combat.reinforcements) {
        if (reinforcement.hp <= 0) continue // Skip dead reinforcements

        for (let i = 0; i < reinforcement.attacksPerRound; i++) {
          const rawDamage = rollDamage(
            reinforcement.damage.diceCount,
            reinforcement.damage.diceSides,
            reinforcement.damage.bonus
          )
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
          combat.defenderDamage.diceSides,
          combat.defenderDamage.bonus
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
      let slot: keyof Equipment | null = null
      if (item.type === 'weapon') slot = 'weapon'
      else if (item.type === 'armor') slot = 'armor'
      else if (item.type === 'consumable') slot = 'helm' // Helms are "consumable" type
      else if (item.type === 'accessory' || item.type === 'unknown') slot = 'accessory'

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
      // 1. Grant spells to player
      for (const spellName of building.grantsSpells) {
        if (!player.knownSpells.includes(spellName)) {
          player.knownSpells.push(spellName)
        }
      }

      // 2. Unlock mercenaries for player
      for (const mercName of building.unlocksMercenaries) {
        if (!player.unlockedMercenaries.includes(mercName)) {
          player.unlockedMercenaries.push(mercName)
        }
      }

      // 3. Update fortification level and archer count
      // Fort (Kants) = level 1, Citadel (Linnus) = level 2, Castle (Kindlus) = level 3
      if (building.name.et === 'Kants') {
        // Apply to all squares of this land type owned by player
        for (const sq of this.board) {
          if (sq.landTypeId === landTypeId && sq.owner === player.index) {
            sq.fortificationLevel = 1
            sq.archerCount = 2 // Fort gives 2 archers
          }
        }
      } else if (building.name.et === 'Linnus') {
        for (const sq of this.board) {
          if (sq.landTypeId === landTypeId && sq.owner === player.index) {
            sq.fortificationLevel = 2
            sq.archerCount = 4 // Citadel gives 4 archers
          }
        }
      } else if (building.name.et === 'Kindlus') {
        for (const sq of this.board) {
          if (sq.landTypeId === landTypeId && sq.owner === player.index) {
            sq.fortificationLevel = 3
            sq.archerCount = 6 // Castle gives 6 archers
          }
        }
      }

      this.consumeAction()

      // Check for title promotion after building
      this.checkTitlePromotion()

      return true
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

      // Must know the spell
      if (!player.knownSpells.includes(spell.name.et)) {
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
            // Heal spell - heals based on power
            const healAmount = 5 + player.stats.power * 2
            const actualHeal = Math.min(healAmount, player.maxHp - player.hp)
            player.hp += actualHeal
            result = { success: true, message: `Healed for ${actualHeal} HP`, effect: { healAmount: actualHeal } }
          } else if (spell.name.et === 'Maagiline turvis') {
            // Magic armor - buff effect (would need buff tracking system)
            result = { success: true, message: 'Magic armor surrounds you', effect: { buff: 'armor' } }
          } else if (spell.name.et === 'Kullapott') {
            // Pot of Gold - generates gold based on power
            const goldAmount = 10 + player.stats.power * 5
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
          // Summon spells - create companions
          if (spell.summons && spell.summons[0]) {
            const summonName = spell.summons[0]
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
          // Buff spells
          result = {
            success: true,
            message: `${spell.name.en} applied`,
            effect: { type: 'buff' },
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

      // Must know the spell
      if (!player.knownSpells.includes(spell.name.et)) {
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

      // Calculate damage using VBA formula (ratio-based):
      // damage = floor((spell_knowledge * base_damage + random(0, power/2)) * (caster_power / target_power) - random(0, target_power))
      // spell_knowledge assumed to be 1 for now (could be skill level)
      const casterPower = player.stats.power
      const targetPower = this.combat.defenderStats.power || 1 // Avoid division by zero
      const baseDamage = spell.basePower
      const randomBonus = Math.floor(Math.random() * (casterPower / 2 + 1))
      const randomReduction = Math.floor(Math.random() * (targetPower + 1))

      // Power ratio formula: damage scales with caster/target power ratio
      const rawDamage = (baseDamage + randomBonus) * (casterPower / targetPower) - randomReduction
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
  },
})

/**
 * Generate a random game board
 * First square is always Royal Court, rest are random land types
 */
function generateBoard(): BoardSquare[] {
  const lands = landsData as LandType[]
  const board: BoardSquare[] = []

  if (lands.length === 0) {
    throw new Error('No land types loaded')
  }

  // Find Royal Court / Palace
  const royalCourt = lands.find(l =>
    l.isRoyalCourt === true ||
    l.name.long.en === 'Royal Court' ||
    l.name.long.et === 'Palee'
  ) ?? lands[0]!

  // Separate utility and territory lands
  const utilityLands = lands.filter(l => l.isUtility && l.spawnChance > 0)
  const territoryLands = lands.filter(l => !l.isUtility && l.spawnChance > 0)

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

/**
 * Get mob data by name (Estonian name from lands.json defenders)
 */
function getMobByName(name: string): MobType | null {
  const mobs = mobsData as MobType[]
  // Search by Estonian name (defenders in lands.json use Estonian names)
  return mobs.find(m => m.name.et === name || m.name.en === name) ?? null
}

/**
 * Roll damage dice
 */
function rollDamage(diceCount: number, diceSides: number, bonus: number): number {
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
export function getLandType(id: number): LandType | null {
  const lands = landsData as LandType[]
  return lands.find(l => l.id === id) || null
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
 * Get item by ID
 */
export function getItemById(id: number): ItemType | null {
  const items = itemsData as ItemType[]
  return items.find(i => i.id === id) ?? null
}

/**
 * Get shop inventory based on shop type
 * VBA shop mechanics (lines 3032-3080):
 * - Shop (id 1): Item types 4-9, value 25-10000
 * - Smithy (id 2): Item types 1-6 (weapons/armor focused)
 * - Bazaar (id 3): All types, value 25-400 gold max
 */
function getShopInventory(landTypeId: number): ItemType[] {
  const items = itemsData as ItemType[]

  switch (landTypeId) {
    case SHOP_LAND_ID:
      // Shop: VBA value range 25-10000 (line 3044-3046)
      return items.filter(i => i.value >= 25 && i.value <= 10000)

    case SMITHY_LAND_ID:
      // Smithy: Weapons and armor only (VBA types 1-6)
      return items.filter(i => i.type === 'weapon' || i.type === 'armor')

    case BAZAAR_LAND_ID:
      // Bazaar: Random selection, max 400 gold (VBA line 3054-3057)
      const bazaarItems = items.filter(i => i.value >= 25 && i.value <= 400)
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
  const items = itemsData as ItemType[]
  const range = KINGS_GIFT_VALUE_RANGES[title]

  // Filter items within the value range for this title
  const eligibleItems = items.filter(item =>
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

/**
 * Get building data by Estonian name
 */
export function getBuildingByName(nameEt: string): BuildingType | null {
  const buildings = buildingsData as BuildingType[]
  return buildings.find(b => b.name.et === nameEt) ?? null
}

/**
 * Get building data by ID
 */
export function getBuildingById(id: number): BuildingType | null {
  const buildings = buildingsData as BuildingType[]
  return buildings.find(b => b.id === id) ?? null
}

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

/**
 * Get spell by Estonian name
 */
export function getSpellByName(nameEt: string): SpellType | null {
  const spells = spellsData as SpellType[]
  return spells.find(s => s.name.et === nameEt) ?? null
}

/**
 * Get spell by ID
 */
export function getSpellById(id: number): SpellType | null {
  const spells = spellsData as SpellType[]
  return spells.find(s => s.id === id) ?? null
}

/**
 * Get all valid spells (filters out corrupted entries)
 */
export function getAllSpells(): SpellType[] {
  const spells = spellsData as SpellType[]
  // Filter out corrupted entries (ID 37, 38 have invalid data)
  return spells.filter(s => s.name.et && s.name.et.length > 0 && !s.name.et.match(/^\d+$/))
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
