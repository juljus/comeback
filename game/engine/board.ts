import type { BoardSquare, ManaPool } from '../types'
import { LANDS } from '../data'

const EMPTY_MANA: ManaPool = {
  fire: 0,
  earth: 0,
  air: 0,
  water: 0,
  death: 0,
  life: 0,
  arcane: 0,
}

function createEmptySquare(): BoardSquare {
  return {
    landTypeId: 0,
    owner: 0,
    price: 0,
    name: '',
    defenderId: 0,
    taxIncome: 0,
    healing: 0,
    coordX: 0,
    coordY: 0,
    healingMax: 0,
    castleLevel: 0,
    castleDefender: 0,
    archerySlots: 0,
    gateLevel: 0,
    manaMax: 0,
    hasDefender: false,
    buildings: [],
    recruitableUnit: '',
    recruitableCount: 0,
    mana: { ...EMPTY_MANA },
  }
}

/** Build the weighted pool of land keys from LANDS based on spawnChance. */
function buildLandPool(): string[] {
  const pool: string[] = []
  for (const [key, land] of Object.entries(LANDS)) {
    for (let i = 0; i < land.spawnChance; i++) {
      pool.push(key)
    }
  }
  return pool
}

/** Pick a random land key from the weighted pool using the given rng. */
function pickLand(pool: string[], rng: () => number): string {
  const index = Math.floor(rng() * pool.length)
  return pool[index]!
}

/** Create a BoardSquare from a land definition key. */
function createSquareFromLand(key: string, landTypeIndex: number): BoardSquare {
  const land = LANDS[key as keyof typeof LANDS]
  const square = createEmptySquare()
  square.landTypeId = landTypeIndex
  square.name = land.name
  square.price = land.price
  square.taxIncome = land.taxIncome
  square.healing = land.healing
  square.buildings = land.buildings.map(() => false)
  return square
}

/**
 * Generate a 34-square game board.
 * Square 0 is always Royal Court; remaining 33 are randomly placed based on spawnChance weights.
 */
export function generateBoard(rng: () => number): BoardSquare[] {
  const board: BoardSquare[] = []
  const landKeys = Object.keys(LANDS)
  const pool = buildLandPool()

  // Square 0: Royal Court
  const royalCourt = createEmptySquare()
  royalCourt.name = 'Royal Court'
  board.push(royalCourt)

  // Squares 1-33: randomly placed lands
  for (let i = 1; i < 34; i++) {
    const key = pickLand(pool, rng)
    const landTypeIndex = landKeys.indexOf(key)
    board.push(createSquareFromLand(key, landTypeIndex))
  }

  return board
}
