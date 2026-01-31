import { defineStore } from 'pinia'
import landsData from '~/data/lands.json'

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
}

/**
 * Game phases
 */
export type GamePhase = 'setup' | 'playing' | 'combat' | 'event' | 'finished'

/**
 * Action phases within a turn
 */
export type ActionPhase = 'morning' | 'noon' | 'evening'

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
}

/**
 * Player colors for display
 */
const PLAYER_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'] // red, blue, green, yellow

/**
 * Default player stats
 */
const DEFAULT_PLAYER_STATS = {
  hp: 20,
  maxHp: 20,
  gold: 200,
  stats: {
    strength: 2,
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
  }),

  getters: {
    /**
     * Get current player object
     */
    activePlayer(): Player | null {
      if (this.players.length === 0) return null
      return this.players[this.currentPlayer]
    },

    /**
     * Get current player's position on board
     */
    activePlayerSquare(): BoardSquare | null {
      const player = this.activePlayer
      if (!player) return null
      return this.board[player.position]
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
  },

  actions: {
    /**
     * Initialize a new game
     */
    initGame(playerNames: string[]) {
      if (playerNames.length < 2 || playerNames.length > 4) {
        throw new Error('Game requires 2-4 players')
      }

      // Create players
      this.players = playerNames.map((name, index) => ({
        index,
        name,
        isAlive: true,
        position: 0, // Start at Royal Court
        gold: DEFAULT_PLAYER_STATS.gold,
        hp: DEFAULT_PLAYER_STATS.hp,
        maxHp: DEFAULT_PLAYER_STATS.maxHp,
        stats: { ...DEFAULT_PLAYER_STATS.stats },
        color: PLAYER_COLORS[index],
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
     * Move current player forward or backward
     */
    movePlayer(direction: 'forward' | 'backward') {
      if (this.phase !== 'playing' || this.actionsRemaining <= 0) return

      const player = this.players[this.currentPlayer]
      const boardSize = this.board.length

      if (direction === 'forward') {
        player.position = (player.position + 1) % boardSize
      } else {
        player.position = (player.position - 1 + boardSize) % boardSize
      }

      this.consumeAction()
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

      while (!this.players[nextPlayer].isAlive && attempts < this.players.length) {
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
  },
})

/**
 * Generate a random game board
 * First square is always Royal Court, rest are random land types
 */
function generateBoard(): BoardSquare[] {
  const lands = landsData as LandType[]
  const board: BoardSquare[] = []

  // Find Royal Court / Palace (first utility land, id 0 or by name)
  const royalCourt = lands.find(l =>
    l.name.long.en === 'Royal Court' ||
    l.name.long.et === 'Palee' ||
    l.id === 0
  ) || lands[0]

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
    landSequence.push(pickFromPool(utilityPool))
  }

  // Add territory lands
  for (let i = 0; i < targetTerritoryCount && territoryPool.length > 0; i++) {
    landSequence.push(pickFromPool(territoryPool))
  }

  // Shuffle the sequence
  shuffleArray(landSequence)

  // Create board squares
  for (let i = 0; i < landSequence.length && board.length < 34; i++) {
    board.push(createSquare(board.length, landSequence[i]))
  }

  // Calculate coordinates for display (circular board)
  const totalSquares = board.length
  for (let i = 0; i < totalSquares; i++) {
    const angle = (i / totalSquares) * 2 * Math.PI - Math.PI / 2
    board[i].coords = {
      x: Math.cos(angle) * 40 + 50, // percentage
      y: Math.sin(angle) * 40 + 50,
    }
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
function pickFromPool(pool: LandType[]): LandType {
  const index = Math.floor(Math.random() * pool.length)
  const [item] = pool.splice(index, 1)
  return item
}

/**
 * Fisher-Yates shuffle
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

/**
 * Get mob ID by name (placeholder - will need proper lookup)
 */
function getMobIdByName(name: string): number | null {
  // For now, return null - we'll implement proper mob lookup later
  // when we need defenders for combat
  return null
}
