import { describe, expect, it } from 'vitest'
import { createPlayer } from './player'
import type { PlayerState } from '../types/player'
import type { BoardSquare } from '../types/board'
import { checkVictoryCondition, eliminatePlayer } from './victory'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a player with custom overrides for testing. */
function testPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  const base = createPlayer(1, 'Tester', 'male')
  return { ...base, ...overrides }
}

/** Create a minimal BoardSquare for testing. */
function testSquare(overrides: Partial<BoardSquare> = {}): BoardSquare {
  return {
    landTypeId: 0,
    owner: 0,
    price: 6,
    landKey: 'valley',
    defenderId: 0,
    taxIncome: 8,
    healing: 5,
    coordX: 0,
    coordY: 0,
    healingMax: 5,
    castleLevel: 0,
    castleDefender: 0,
    archerySlots: 0,
    gateLevel: 0,
    manaMax: 0,
    hasDefender: true,
    buildings: [],
    recruitableUnit: '',
    recruitableCount: 0,
    mana: { fire: 0, earth: 0, air: 0, water: 0, death: 0, life: 0, arcane: 0 },
    fireCastleDamage: 0,
    entrapment: false,
    ...overrides,
  }
}

/** Build a minimal 34-square board. */
function buildTestBoard(
  overrides: Array<{ index: number; square: Partial<BoardSquare> }> = [],
): BoardSquare[] {
  const board: BoardSquare[] = []
  for (let i = 0; i < 34; i++) {
    board.push(testSquare({ landKey: i === 0 ? 'royalCourt' : 'valley' }))
  }
  for (const { index, square } of overrides) {
    board[index] = testSquare({ ...board[index], ...square })
  }
  return board
}

// ---------------------------------------------------------------------------
// checkVictoryCondition
// ---------------------------------------------------------------------------

describe('checkVictoryCondition', () => {
  it('returns ongoing when 2+ players alive', () => {
    const players = [
      { alive: true, id: 1 },
      { alive: true, id: 2 },
    ]
    const result = checkVictoryCondition(players)
    expect(result.state).toBe('ongoing')
  })

  it('returns ongoing when 3 players alive', () => {
    const players = [
      { alive: true, id: 1 },
      { alive: true, id: 2 },
      { alive: true, id: 3 },
    ]
    const result = checkVictoryCondition(players)
    expect(result.state).toBe('ongoing')
  })

  it('returns victory when exactly 1 player alive', () => {
    const players = [
      { alive: false, id: 1 },
      { alive: true, id: 2 },
      { alive: false, id: 3 },
    ]
    const result = checkVictoryCondition(players)
    expect(result.state).toBe('victory')
    if (result.state === 'victory') {
      expect(result.winnerId).toBe(2)
    }
  })

  it('returns draw when 0 players alive', () => {
    const players = [
      { alive: false, id: 1 },
      { alive: false, id: 2 },
    ]
    const result = checkVictoryCondition(players)
    expect(result.state).toBe('draw')
  })

  it('returns correct winner id when first player is the survivor', () => {
    const players = [
      { alive: true, id: 1 },
      { alive: false, id: 2 },
      { alive: false, id: 3 },
    ]
    const result = checkVictoryCondition(players)
    expect(result.state).toBe('victory')
    if (result.state === 'victory') {
      expect(result.winnerId).toBe(1)
    }
  })

  it('returns correct winner id when last player is the survivor', () => {
    const players = [
      { alive: false, id: 1 },
      { alive: false, id: 2 },
      { alive: true, id: 3 },
    ]
    const result = checkVictoryCondition(players)
    expect(result.state).toBe('victory')
    if (result.state === 'victory') {
      expect(result.winnerId).toBe(3)
    }
  })

  it('handles single player (victory by default)', () => {
    const players = [{ alive: true, id: 1 }]
    const result = checkVictoryCondition(players)
    expect(result.state).toBe('victory')
    if (result.state === 'victory') {
      expect(result.winnerId).toBe(1)
    }
  })

  it('handles 4-player game with 2 alive (ongoing)', () => {
    const players = [
      { alive: true, id: 1 },
      { alive: false, id: 2 },
      { alive: true, id: 3 },
      { alive: false, id: 4 },
    ]
    const result = checkVictoryCondition(players)
    expect(result.state).toBe('ongoing')
  })

  it('all 4 players dead is a draw', () => {
    const players = [
      { alive: false, id: 1 },
      { alive: false, id: 2 },
      { alive: false, id: 3 },
      { alive: false, id: 4 },
    ]
    const result = checkVictoryCondition(players)
    expect(result.state).toBe('draw')
  })
})

// ---------------------------------------------------------------------------
// eliminatePlayer
// ---------------------------------------------------------------------------

describe('eliminatePlayer', () => {
  it('sets player alive to false', () => {
    const player = testPlayer({ alive: true })
    const board = buildTestBoard()

    const { newPlayer } = eliminatePlayer({ player, board })

    expect(newPlayer.alive).toBe(false)
  })

  it('releases all owned lands to neutral (owner=0)', () => {
    const board = buildTestBoard([
      { index: 1, square: { owner: 1, taxIncome: 8 } },
      { index: 5, square: { owner: 1, taxIncome: 6 } },
      { index: 10, square: { owner: 1, taxIncome: 4 } },
    ])
    const player = testPlayer({ id: 1, alive: true, ownedLands: [1, 5, 10] })

    const { newBoard } = eliminatePlayer({ player, board })

    expect(newBoard[1]!.owner).toBe(0)
    expect(newBoard[5]!.owner).toBe(0)
    expect(newBoard[10]!.owner).toBe(0)
  })

  it('clears player ownedLands array', () => {
    const board = buildTestBoard([
      { index: 1, square: { owner: 1 } },
      { index: 2, square: { owner: 1 } },
    ])
    const player = testPlayer({ id: 1, alive: true, ownedLands: [1, 2] })

    const { newPlayer } = eliminatePlayer({ player, board })

    expect(newPlayer.ownedLands).toEqual([])
  })

  it('does not affect squares owned by other players', () => {
    const board = buildTestBoard([
      { index: 1, square: { owner: 1, taxIncome: 8 } },
      { index: 2, square: { owner: 2, taxIncome: 6 } },
      { index: 3, square: { owner: 3, taxIncome: 4 } },
    ])
    const player = testPlayer({ id: 1, alive: true, ownedLands: [1] })

    const { newBoard } = eliminatePlayer({ player, board })

    expect(newBoard[1]!.owner).toBe(0) // released
    expect(newBoard[2]!.owner).toBe(2) // unchanged
    expect(newBoard[3]!.owner).toBe(3) // unchanged
  })

  it('handles player with no owned lands', () => {
    const board = buildTestBoard()
    const player = testPlayer({ id: 1, alive: true, ownedLands: [] })

    const { newPlayer, newBoard } = eliminatePlayer({ player, board })

    expect(newPlayer.alive).toBe(false)
    expect(newPlayer.ownedLands).toEqual([])
    // Board unchanged
    for (let i = 0; i < 34; i++) {
      expect(newBoard[i]!.owner).toBe(0)
    }
  })

  it('does not mutate original player', () => {
    const board = buildTestBoard([{ index: 1, square: { owner: 1 } }])
    const player = testPlayer({ id: 1, alive: true, ownedLands: [1] })

    eliminatePlayer({ player, board })

    expect(player.alive).toBe(true)
    expect(player.ownedLands).toEqual([1])
  })

  it('does not mutate original board', () => {
    const board = buildTestBoard([{ index: 1, square: { owner: 1 } }])
    const player = testPlayer({ id: 1, alive: true, ownedLands: [1] })

    eliminatePlayer({ player, board })

    expect(board[1]!.owner).toBe(1) // unchanged
  })

  it('releases arcane towers to neutral as well', () => {
    const board = buildTestBoard([{ index: 5, square: { owner: 1, landKey: 'arcaneTower' } }])
    const player = testPlayer({ id: 1, alive: true, ownedLands: [5] })

    const { newBoard } = eliminatePlayer({ player, board })

    expect(newBoard[5]!.owner).toBe(0)
  })

  it('preserves other board square properties when releasing', () => {
    const board = buildTestBoard([
      { index: 1, square: { owner: 1, taxIncome: 12, healing: 5, landKey: 'valley' } },
    ])
    const player = testPlayer({ id: 1, alive: true, ownedLands: [1] })

    const { newBoard } = eliminatePlayer({ player, board })

    expect(newBoard[1]!.owner).toBe(0) // released
    expect(newBoard[1]!.taxIncome).toBe(12) // preserved
    expect(newBoard[1]!.healing).toBe(5) // preserved
    expect(newBoard[1]!.landKey).toBe('valley') // preserved
  })

  it('resets gateLevel to 0 on released squares', () => {
    const board = buildTestBoard([{ index: 1, square: { owner: 1, gateLevel: 2 } }])
    const player = testPlayer({ id: 1, alive: true, ownedLands: [1] })

    const { newBoard } = eliminatePlayer({ player, board })

    expect(newBoard[1]!.gateLevel).toBe(0)
  })

  it('resets archerySlots to 0 on released squares', () => {
    const board = buildTestBoard([{ index: 1, square: { owner: 1, archerySlots: 3 } }])
    const player = testPlayer({ id: 1, alive: true, ownedLands: [1] })

    const { newBoard } = eliminatePlayer({ player, board })

    expect(newBoard[1]!.archerySlots).toBe(0)
  })

  it('resets non-mana buildings to false', () => {
    // valley has buildings: lifeAltar, lifeTemple, barracks, fort, citadel, castle, fletchery, archeryGuild, portal
    // fort is at index 3, not a mana building
    const board = buildTestBoard([
      {
        index: 1,
        square: {
          owner: 1,
          landKey: 'valley',
          buildings: [false, false, false, true, false, false, false, false, false],
        },
      },
    ])
    const player = testPlayer({ id: 1, alive: true, ownedLands: [1] })

    const { newBoard } = eliminatePlayer({ player, board })

    // Fort (index 3) should be reset to false
    expect(newBoard[1]!.buildings[3]).toBe(false)
  })

  it('preserves mana buildings on released squares', () => {
    // valley buildings: lifeAltar(0), lifeTemple(1), barracks(2), fort(3), ...
    // lifeAltar is a mana building (grants life mana)
    const board = buildTestBoard([
      {
        index: 1,
        square: {
          owner: 1,
          landKey: 'valley',
          buildings: [true, false, false, true, false, false, false, false, false],
        },
      },
    ])
    const player = testPlayer({ id: 1, alive: true, ownedLands: [1] })

    const { newBoard } = eliminatePlayer({ player, board })

    // lifeAltar (index 0) should be preserved (mana building)
    expect(newBoard[1]!.buildings[0]).toBe(true)
    // fort (index 3) should be reset (not a mana building)
    expect(newBoard[1]!.buildings[3]).toBe(false)
  })

  it('does not reset gateLevel or buildings on squares not owned by the player', () => {
    const board = buildTestBoard([
      { index: 1, square: { owner: 1, gateLevel: 2, buildings: [true, true] } },
      { index: 2, square: { owner: 2, gateLevel: 1, buildings: [true, false] } },
    ])
    const player = testPlayer({ id: 1, alive: true, ownedLands: [1] })

    const { newBoard } = eliminatePlayer({ player, board })

    // Player 2's square unchanged
    expect(newBoard[2]!.owner).toBe(2)
    expect(newBoard[2]!.gateLevel).toBe(1)
    expect(newBoard[2]!.buildings).toEqual([true, false])
  })
})
