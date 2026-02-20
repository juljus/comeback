/**
 * Dev-only game state fixture. Loaded automatically in dev mode
 * when navigating to /game with no active game.
 *
 * Edit this file to jump into any scenario you want to test.
 */
import type { GameState } from '~~/game/types'
import {
  createRng,
  generateBoard,
  createPlayer,
  recalcDerivedStats,
  createCompanionFromCreature,
} from '~~/game/engine'

const DEV_SEED = 398

export function createDevState(): { gameState: GameState; rng: () => number; hasMoved: boolean } {
  const rng = createRng(DEV_SEED)
  const board = generateBoard(rng)

  // -- Player 1: mid-game warrior at position 0, ready to roll --
  const p1 = createPlayer(1, 'Dev', 'male')
  p1.baseStrength = 5
  p1.gold = 800
  p1.hp = 45
  p1.equipment.weapon = 'ironLongsword'
  p1.equipment.head = 'ironHelm'
  p1.equipment.body = 'leatherSuit'
  p1.inventory = ['ironDagger', 'fineSteelDagger']
  p1.companions.push(createCompanionFromCreature('swordman'))
  p1.companions.push(createCompanionFromCreature('pikeman'))
  p1.companions.push(createCompanionFromCreature('horseman'))
  p1.basePower = 3
  p1.spellbook = {
    magicArrow: 2,
    fireBolt: 1,
    fireball: 1,
    armor: 1,
    heal: 1,
  }
  p1.mana = { fire: 80, earth: 40, air: 25, water: 15, death: 0, life: 50, arcane: 40 }
  p1.position = 3

  // -- Player 2: fortified defender at position 9 (shop/merc init shifts roll to 6) --
  const p2 = createPlayer(2, 'Bot', 'female')
  p2.baseStrength = 4
  p2.gold = 500
  p2.hp = 35
  p2.equipment.weapon = 'ironLongsword'
  p2.equipment.body = 'leatherSuit'
  p2.companions.push(createCompanionFromCreature('swordman'))
  p2.companions.push(createCompanionFromCreature('swordman'))
  p2.position = 9
  p2.ownedLands.push(9)

  // Set up Bot's fortified square at position 9 (arcaneTower - attackable)
  board[9]!.owner = p2.id
  board[9]!.gateLevel = 1
  board[9]!.archerySlots = 2

  const gameState: GameState = {
    players: [recalcDerivedStats(p1), recalcDerivedStats(p2)],
    board,
    effects: [],
    currentPlayerIndex: 0,
    currentDay: 3,
    timeOfDay: 'morning',
    turn: 5,
  }

  return { gameState, rng, hasMoved: false }
}
