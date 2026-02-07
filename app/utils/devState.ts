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

const DEV_SEED = 42

export function createDevState(): { gameState: GameState; rng: () => number; hasMoved: boolean } {
  const rng = createRng(DEV_SEED)
  const board = generateBoard(rng)

  // -- Player 1: mid-game warrior with companion --
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
  p1.position = 4

  // -- Player 2: basic starting player --
  const p2 = createPlayer(2, 'Bot', 'female')
  p2.position = 0
  p2.ownedLands.push(4)

  // Give Bot ownership of Dev's starting square
  board[4]!.owner = p2.id

  const gameState: GameState = {
    players: [recalcDerivedStats(p1), p2],
    board,
    effects: [],
    currentPlayerIndex: 0,
    currentDay: 3,
    timeOfDay: 'morning',
    turn: 5,
  }

  return { gameState, rng, hasMoved: true }
}
