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
  attackerHpAtStart: number
  round: number
  log: CombatLogEntry[]
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
    strength: 2, // Unverified - needs VBA check
    dexterity: 2, // Unverified - needs VBA check
    power: 2, // Unverified - needs VBA check
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
      const upgradeCost = getDefenderUpgradeCost(square.defenderTier)
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
     */
    rollAndMove() {
      if (this.phase !== 'playing' || this.actionsRemaining <= 0) return null

      const player = this.players[this.currentPlayer]
      if (!player) return null

      const oldPosition = player.position

      // Roll 2d6
      const die1 = Math.floor(Math.random() * 6) + 1
      const die2 = Math.floor(Math.random() * 6) + 1
      const total = die1 + die2

      this.lastDiceRoll = {
        dice: [die1, die2],
        total,
      }

      // Move forward by dice total
      const boardSize = this.board.length
      player.position = (player.position + total) % boardSize

      // Check if player passed Royal Court (position 0)
      // Player passes if they wrapped around (new position < old position + total means they crossed 0)
      const passedRoyalCourt = player.position < oldPosition ||
        (oldPosition + total >= boardSize)

      if (passedRoyalCourt) {
        this.collectIncome(player)
      }

      this.consumeAction()
      return this.lastDiceRoll
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

      // Arcane Towers have special scaling: 1→1, 2→3, 3→6, 4→10
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
        attackerHpAtStart: player.hp,
        round: 1,
        log: [],
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
     */
    attackInCombat() {
      if (this.phase !== 'combat' || !this.combat?.active) return null
      if (this.actionsRemaining <= 0) return null

      const player = this.players[this.currentPlayer]
      if (!player) return null

      const combat = this.combat
      const results: CombatLogEntry[] = []

      // Player attacks (using total stats including equipment)
      const playerStats = getPlayerTotalStats(player)
      const weaponDamage = getPlayerWeaponDamage(player)
      const playerAttacks = playerStats.strikes
      let totalPlayerDamage = 0

      for (let i = 0; i < playerAttacks; i++) {
        const rawDamage = rollDamage(weaponDamage.diceCount, weaponDamage.diceSides, weaponDamage.bonus)
        const damage = Math.max(0, rawDamage - combat.defenderArmor)
        totalPlayerDamage += damage
        combat.defenderHp -= damage

        results.push({
          round: combat.round,
          actor: player.name,
          action: 'attack',
          damage,
          message: `${player.name} hits for ${damage} damage (${rawDamage} - ${combat.defenderArmor} armor)`,
        })
      }

      // Check if defender defeated
      if (combat.defenderHp <= 0) {
        combat.defenderHp = 0
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

      // Defender attacks back
      let totalDefenderDamage = 0
      for (let i = 0; i < combat.defenderAttacksPerRound; i++) {
        const rawDamage = rollDamage(
          combat.defenderDamage.diceCount,
          combat.defenderDamage.diceSides,
          combat.defenderDamage.bonus
        )
        // Use player's total armor (base from strength + equipment)
        const damage = Math.max(0, rawDamage - playerStats.armor)
        totalDefenderDamage += damage
        player.hp -= damage

        results.push({
          round: combat.round,
          actor: combat.defenderName,
          action: 'attack',
          damage,
          message: `${combat.defenderName} hits for ${damage} damage`,
        })
      }

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

      combat.log.push(...results)
      combat.round++

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
     * Flee from combat
     */
    fleeCombat() {
      if (this.phase !== 'combat' || !this.combat?.active) return false

      const player = this.players[this.currentPlayer]
      if (!player) return false

      // Flee chance based on dexterity (base 50% + 5% per dex)
      const fleeChance = 50 + player.stats.dexterity * 5
      const roll = Math.floor(Math.random() * 100) + 1

      if (roll <= fleeChance) {
        this.combat.log.push({
          round: this.combat.round,
          actor: player.name,
          action: 'flee',
          message: `${player.name} successfully flees from combat!`,
        })
        this.endCombat(false)
        return true
      } else {
        this.combat.log.push({
          round: this.combat.round,
          actor: player.name,
          action: 'flee_fail',
          message: `${player.name} tries to flee but fails!`,
        })
        // Failed flee still consumes action
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
      const upgradeCost = getDefenderUpgradeCost(square.defenderTier)

      // Pay the cost
      player.gold -= upgradeCost
      // Upgrade tier
      square.defenderTier++

      this.consumeAction()
      return true
    },

    /**
     * Improve income on current square
     * Uses ALL remaining action points (like rest)
     * Income increase depends on action points used
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

      // Increase income based on action points remaining
      // More action points = bigger increase
      const incomeIncrease = this.actionsRemaining
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
     */
    buyItem(itemId: number) {
      if (!this.canBuyItems) return false

      const player = this.players[this.currentPlayer]
      if (!player) return false

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
     */
    trainStat(stat: 'strength' | 'dexterity') {
      if (!this.isAtTrainingGrounds) return false
      if (this.actionsRemaining !== 3 || this.actionPhase !== 'morning') return false

      const player = this.players[this.currentPlayer]
      if (!player) return false

      // Training costs gold (estimate: 50 gold per point)
      const trainingCost = 50
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
     */
    trainPower() {
      if (!this.isAtMageGuild) return false
      if (this.actionsRemaining !== 3 || this.actionPhase !== 'morning') return false

      const player = this.players[this.currentPlayer]
      if (!player) return false

      // Training costs gold (estimate: 50 gold per point)
      const trainingCost = 50
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
        player.pendingKingsGift = true // Player needs to choose gift
      }
    },

    /**
     * Accept King's Gift (called after choosing from options)
     * For now, just clears the pending flag
     * TODO: Implement actual gift choices
     */
    acceptKingsGift(choice: number) {
      const player = this.players[this.currentPlayer]
      if (!player || !player.pendingKingsGift) return false

      // For now, just give gold based on choice (placeholder)
      const giftAmounts = [100, 150, 200]
      player.gold += giftAmounts[choice] ?? 100

      player.pendingKingsGift = false
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

      // Calculate damage: basePower + power stat bonus
      const damage = spell.basePower + Math.floor(player.stats.power / 2)

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
 * Tier 1→2: 20 gold, 2→3: 40 gold, 3→4: 80 gold
 * Note: These values are unverified estimates
 */
function getDefenderUpgradeCost(currentTier: number): number {
  const costs: Record<number, number> = {
    1: 20,
    2: 40,
    3: 80,
  }
  return costs[currentTier] || 0
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
 * - Shop (id 1): Basic cheap items (value < 200)
 * - Smithy (id 2): Weapons and armor
 * - Bazaar (id 3): Random selection of any items
 */
function getShopInventory(landTypeId: number): ItemType[] {
  const items = itemsData as ItemType[]

  switch (landTypeId) {
    case SHOP_LAND_ID:
      // Shop: Basic cheap items (value < 200)
      return items.filter(i => i.value > 0 && i.value < 200)

    case SMITHY_LAND_ID:
      // Smithy: Weapons and armor only
      return items.filter(i => i.type === 'weapon' || i.type === 'armor')

    case BAZAAR_LAND_ID:
      // Bazaar: Random selection of 10 items from any type
      const shuffled = [...items].filter(i => i.value > 0)
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
 */
export function getPlayerWeaponDamage(player: Player): { diceCount: number; diceSides: number; bonus: number; damageType: string } {
  const weaponId = player.equipment.weapon
  if (weaponId !== null) {
    const weapon = getItemById(weaponId)
    if (weapon?.weapon) {
      return {
        diceCount: weapon.weapon.diceCount,
        diceSides: weapon.weapon.diceSides,
        bonus: 0,
        damageType: weapon.weapon.damageType,
      }
    }
  }
  // Default unarmed
  return { diceCount: 1, diceSides: 2, bonus: 0, damageType: 'crush' }
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
 * Verified from help.csv:
 * "üks maagi torn toodab ühes päevas 1 arkaane mana,
 * kaks maagi torni toodavad 1-s päevas 3 arkaane mana,
 * 3 maagi torni toodavad 6 ja 4 maagi torni ühe mängija omanduses
 * toodavad 10 arkaane mana päevas"
 *
 * 1 tower = 1 mana, 2 = 3, 3 = 6, 4 = 10
 */
function getArcaneTowerMana(towerCount: number): number {
  const manaByCount = [0, 1, 3, 6, 10]
  return manaByCount[Math.min(towerCount, 4)] ?? 10
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
