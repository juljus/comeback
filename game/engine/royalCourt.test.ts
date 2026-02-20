import { describe, expect, it } from 'vitest'
import { createPlayer } from './player'
import type { PlayerState } from '../types/player'
import type { BoardSquare } from '../types/board'
import { didPassRoyalCourt, countBanks, resolveRoyalCourtPassing } from './royalCourt'
import type { LandRegenEntry } from './royalCourt'

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

/** Fixed RNG returning 0.5 for deterministic tests. */
const fixedRng = () => 0.5

/** Build a minimal 34-square board (Royal Court at 0, rest are valleys). */
function buildTestBoard(
  overrides: Array<{ index: number; square: Partial<BoardSquare> }> = [],
): BoardSquare[] {
  const board: BoardSquare[] = []
  // Square 0: Royal Court
  board.push(testSquare({ landKey: 'royalCourt', taxIncome: 0, price: 0, healing: 0 }))
  // Squares 1-33: default valleys
  for (let i = 1; i < 34; i++) {
    board.push(testSquare({ landKey: 'valley', taxIncome: 8, price: 6, healing: 5 }))
  }
  // Apply overrides
  for (const { index, square } of overrides) {
    board[index] = testSquare({ ...board[index], ...square })
  }
  return board
}

// ---------------------------------------------------------------------------
// didPassRoyalCourt
// ---------------------------------------------------------------------------

describe('didPassRoyalCourt', () => {
  it('returns false when movement does not cross boundary', () => {
    // Position 5, move 3 => land on 8, no wrapping
    expect(didPassRoyalCourt(5, 3)).toBe(false)
  })

  it('returns false at position 0 moving 0', () => {
    expect(didPassRoyalCourt(0, 0)).toBe(false)
  })

  it('returns true when movement crosses from high position past 33', () => {
    // Position 30, move 5 => 35 >= 34
    expect(didPassRoyalCourt(30, 5)).toBe(true)
  })

  it('returns true when movement exactly reaches 34 (wraps to 0)', () => {
    // Position 32, move 2 => 34 >= 34 (lands on square 0)
    expect(didPassRoyalCourt(32, 2)).toBe(true)
  })

  it('returns true when starting at 33 and moving 1', () => {
    // Position 33, move 1 => 34 >= 34
    expect(didPassRoyalCourt(33, 1)).toBe(true)
  })

  it('returns false when starting at 33 and moving 0', () => {
    expect(didPassRoyalCourt(33, 0)).toBe(false)
  })

  it('returns true when starting at 0 and moving 34 (full lap)', () => {
    // Position 0, move 34 => 34 >= 34
    expect(didPassRoyalCourt(0, 34)).toBe(true)
  })

  it('returns false when moving within first half of board', () => {
    expect(didPassRoyalCourt(10, 10)).toBe(false)
  })

  it('returns true when position 20 and move 15', () => {
    // 20 + 15 = 35 >= 34
    expect(didPassRoyalCourt(20, 15)).toBe(true)
  })

  it('returns false when position 20 and move 13', () => {
    // 20 + 13 = 33 < 34
    expect(didPassRoyalCourt(20, 13)).toBe(false)
  })

  it('returns true for minimum crossing: position 33, move 1', () => {
    expect(didPassRoyalCourt(33, 1)).toBe(true)
  })

  it('handles large movement values (e.g. speed bonus)', () => {
    // Position 1, move 40 => 41 >= 34
    expect(didPassRoyalCourt(1, 40)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// countBanks
// ---------------------------------------------------------------------------

describe('countBanks', () => {
  it('returns 0 when player owns no squares', () => {
    const board = buildTestBoard()
    expect(countBanks([], board)).toBe(0)
  })

  it('returns 0 when owned squares have no bank building', () => {
    // Valley has buildings: lifeAltar, lifeTemple, barracks, fort, citadel, castle, fletchery, archeryGuild, portal
    // No bank in that list
    const board = buildTestBoard([
      { index: 1, square: { owner: 1 } },
      { index: 2, square: { owner: 1 } },
    ])
    expect(countBanks([1, 2], board)).toBe(0)
  })

  it('returns 1 when one owned square has a bank building', () => {
    // Burrows land has bank in its buildings list at index 1 (buildings: treasury, bank, fort, ...)
    const board = buildTestBoard([
      {
        index: 5,
        square: {
          landKey: 'burrows',
          owner: 1,
          // burrows buildings: treasury, bank, fort, citadel, castle, fletchery, archeryGuild, portal
          // bank is at index 1
          buildings: [false, true, false, false, false, false, false, false],
        },
      },
    ])
    expect(countBanks([5], board)).toBe(1)
  })

  it('returns count of squares with bank (not total bank buildings)', () => {
    const board = buildTestBoard([
      {
        index: 3,
        square: {
          landKey: 'burrows',
          owner: 1,
          buildings: [false, true, false, false, false, false, false, false],
        },
      },
      {
        index: 7,
        square: {
          landKey: 'burrows',
          owner: 1,
          buildings: [false, true, false, false, false, false, false, false],
        },
      },
    ])
    expect(countBanks([3, 7], board)).toBe(2)
  })

  it('does not count bank that is not built (flag is false)', () => {
    const board = buildTestBoard([
      {
        index: 5,
        square: {
          landKey: 'burrows',
          owner: 1,
          // bank available but not built
          buildings: [false, false, false, false, false, false, false, false],
        },
      },
    ])
    expect(countBanks([5], board)).toBe(0)
  })

  it('ignores squares not in ownedSquareIndices', () => {
    const board = buildTestBoard([
      {
        index: 5,
        square: {
          landKey: 'burrows',
          owner: 2,
          buildings: [false, true, false, false, false, false, false, false],
        },
      },
    ])
    // Player 1 does not own square 5
    expect(countBanks([], board)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// resolveRoyalCourtPassing
// ---------------------------------------------------------------------------

describe('resolveRoyalCourtPassing', () => {
  it('player with no lands receives only title salary (20 gold for none title)', () => {
    const player = testPlayer({ gold: 100, ownedLands: [], title: 'none' })
    const board = buildTestBoard()

    const { newPlayer, result } = resolveRoyalCourtPassing({ player, board, rng: fixedRng })

    expect(result.taxIncome).toBe(0)
    expect(result.bankBonus).toBe(0)
    expect(result.titleSalary).toBe(20)
    expect(result.totalIncome).toBe(20)
    expect(newPlayer.gold).toBe(120) // 100 + 20
  })

  it('collects tax from owned lands', () => {
    const board = buildTestBoard([
      { index: 1, square: { owner: 1, taxIncome: 8 } },
      { index: 2, square: { owner: 1, taxIncome: 6 } },
    ])
    const player = testPlayer({ gold: 50, ownedLands: [1, 2], title: 'none' })

    const { newPlayer, result } = resolveRoyalCourtPassing({ player, board, rng: fixedRng })

    expect(result.taxIncome).toBe(14) // 8 + 6
    expect(result.titleSalary).toBe(20)
    expect(result.totalIncome).toBe(34) // 14 + 0 (no banks) + 20
    expect(newPlayer.gold).toBe(84) // 50 + 34
  })

  it('applies bank bonus when banks are present', () => {
    const board = buildTestBoard([
      { index: 1, square: { owner: 1, taxIncome: 8 } },
      {
        index: 2,
        square: {
          owner: 1,
          taxIncome: 4,
          landKey: 'burrows',
          buildings: [false, true, false, false, false, false, false, false],
        },
      },
    ])
    const player = testPlayer({ gold: 0, ownedLands: [1, 2], title: 'none' })

    const { result } = resolveRoyalCourtPassing({ player, board, rng: fixedRng })

    // 2 lands owned, 1 bank => bankBonus = 2 * 1 * 10 = 20
    expect(result.taxIncome).toBe(12) // 8 + 4
    expect(result.bankBonus).toBe(20)
    expect(result.titleSalary).toBe(20)
    expect(result.totalIncome).toBe(52) // 12 + 20 + 20
  })

  it('baron title receives 30 salary', () => {
    const player = testPlayer({ gold: 0, ownedLands: [], title: 'baron' })
    const board = buildTestBoard()

    const { result } = resolveRoyalCourtPassing({ player, board, rng: fixedRng })

    expect(result.titleSalary).toBe(30)
  })

  it('count title receives 40 salary', () => {
    const player = testPlayer({ gold: 0, ownedLands: [], title: 'count' })
    const board = buildTestBoard()

    const { result } = resolveRoyalCourtPassing({ player, board, rng: fixedRng })

    expect(result.titleSalary).toBe(40)
  })

  it('duke title receives 50 salary', () => {
    const player = testPlayer({ gold: 0, ownedLands: [], title: 'duke' })
    const board = buildTestBoard()

    const { result } = resolveRoyalCourtPassing({ player, board, rng: fixedRng })

    expect(result.titleSalary).toBe(50)
  })

  it('title changes when land count crosses threshold (3 lands -> baron)', () => {
    const board = buildTestBoard([
      { index: 1, square: { owner: 1, taxIncome: 8 } },
      { index: 2, square: { owner: 1, taxIncome: 6 } },
      { index: 3, square: { owner: 1, taxIncome: 4 } },
    ])
    const player = testPlayer({ gold: 0, ownedLands: [1, 2, 3], title: 'none' })

    const { newPlayer, result } = resolveRoyalCourtPassing({ player, board, rng: fixedRng })

    expect(result.newTitle).toBe('baron')
    expect(result.titleChanged).toBe(true)
    expect(newPlayer.title).toBe('baron')
  })

  it('king gift generated when title changes', () => {
    const board = buildTestBoard([
      { index: 1, square: { owner: 1, taxIncome: 8 } },
      { index: 2, square: { owner: 1, taxIncome: 6 } },
      { index: 3, square: { owner: 1, taxIncome: 4 } },
    ])
    const player = testPlayer({ gold: 0, ownedLands: [1, 2, 3], title: 'none' })

    const { result } = resolveRoyalCourtPassing({ player, board, rng: fixedRng })

    expect(result.titleChanged).toBe(true)
    expect(result.kingsGift.length).toBe(3) // 3 item choices
  })

  it('no king gift when title does not change', () => {
    const board = buildTestBoard([
      { index: 1, square: { owner: 1, taxIncome: 8 } },
      { index: 2, square: { owner: 1, taxIncome: 6 } },
      { index: 3, square: { owner: 1, taxIncome: 4 } },
    ])
    // Already baron with 3 lands -- no change
    const player = testPlayer({ gold: 0, ownedLands: [1, 2, 3], title: 'baron' })

    const { result } = resolveRoyalCourtPassing({ player, board, rng: fixedRng })

    expect(result.titleChanged).toBe(false)
    expect(result.kingsGift).toEqual([])
  })

  it('no king gift for duke with many lands (title already max)', () => {
    const board = buildTestBoard()
    // Set 15 squares as owned
    for (let i = 1; i <= 15; i++) {
      board[i] = testSquare({ owner: 1, taxIncome: 4, landKey: 'valley' })
    }
    const ownedLands = Array.from({ length: 15 }, (_, i) => i + 1)
    const player = testPlayer({ gold: 0, ownedLands, title: 'duke' })

    const { result } = resolveRoyalCourtPassing({ player, board, rng: fixedRng })

    expect(result.titleChanged).toBe(false)
    expect(result.kingsGift).toEqual([])
  })

  it('regenerates depleted land income toward base', () => {
    // Valley base income is 8. Set current to 2 (depleted).
    const board = buildTestBoard([
      { index: 1, square: { owner: 1, taxIncome: 2, landKey: 'valley' } },
    ])
    const player = testPlayer({ gold: 0, ownedLands: [1], title: 'none' })

    const { newBoard, result } = resolveRoyalCourtPassing({ player, board, rng: fixedRng })

    // regenLandIncome: floor(8/4) = 2, 2 + 2 = 4 (still below base)
    expect(newBoard[1]!.taxIncome).toBe(4)
    expect(result.regenReport.length).toBe(1)
    expect(result.regenReport[0]!.oldIncome).toBe(2)
    expect(result.regenReport[0]!.newIncome).toBe(4)
  })

  it('does not regen land income that is already at base', () => {
    const board = buildTestBoard([
      { index: 1, square: { owner: 1, taxIncome: 8, landKey: 'valley' } },
    ])
    const player = testPlayer({ gold: 0, ownedLands: [1], title: 'none' })

    const { newBoard, result } = resolveRoyalCourtPassing({ player, board, rng: fixedRng })

    expect(newBoard[1]!.taxIncome).toBe(8)
    // Income unchanged, so report should show no change
    const entry = result.regenReport.find((r: LandRegenEntry) => r.squareIndex === 1)
    if (entry) {
      expect(entry.oldIncome).toBe(entry.newIncome)
    }
  })

  it('does not regen land income above base (improvements preserved)', () => {
    // Current income is 16 (improved), base is 8
    const board = buildTestBoard([
      { index: 1, square: { owner: 1, taxIncome: 16, landKey: 'valley' } },
    ])
    const player = testPlayer({ gold: 0, ownedLands: [1], title: 'none' })

    const { newBoard } = resolveRoyalCourtPassing({ player, board, rng: fixedRng })

    expect(newBoard[1]!.taxIncome).toBe(16) // preserved
  })

  it('does not mutate original player', () => {
    const board = buildTestBoard([{ index: 1, square: { owner: 1, taxIncome: 8 } }])
    const player = testPlayer({ gold: 100, ownedLands: [1], title: 'none' })
    const originalGold = player.gold

    resolveRoyalCourtPassing({ player, board, rng: fixedRng })

    expect(player.gold).toBe(originalGold)
  })

  it('does not mutate original board', () => {
    const board = buildTestBoard([
      { index: 1, square: { owner: 1, taxIncome: 2, landKey: 'valley' } },
    ])
    const player = testPlayer({ gold: 0, ownedLands: [1], title: 'none' })
    const originalIncome = board[1]!.taxIncome

    resolveRoyalCourtPassing({ player, board, rng: fixedRng })

    expect(board[1]!.taxIncome).toBe(originalIncome)
  })

  it('handles player with multiple lands and banks correctly', () => {
    const board = buildTestBoard([
      { index: 1, square: { owner: 1, taxIncome: 8, landKey: 'valley' } },
      { index: 2, square: { owner: 1, taxIncome: 6, landKey: 'forest' } },
      {
        index: 3,
        square: {
          owner: 1,
          taxIncome: 2,
          landKey: 'burrows',
          buildings: [false, true, false, false, false, false, false, false],
        },
      },
    ])
    const player = testPlayer({ gold: 0, ownedLands: [1, 2, 3], title: 'none' })

    const { result } = resolveRoyalCourtPassing({ player, board, rng: fixedRng })

    // 3 lands: none->baron (threshold 3)
    expect(result.newTitle).toBe('baron')
    expect(result.titleChanged).toBe(true)
    // Tax: 8 + 6 + 2 = 16
    expect(result.taxIncome).toBe(16)
    // Bank bonus: 3 lands * 1 bank * 10 = 30
    expect(result.bankBonus).toBe(30)
    // Title salary: none->baron during this pass, salary uses old title: 20
    // (Note: salary is calculated before title upgrade, per VBA pattern)
    // Actually per the plan, the salary uses the current player title at start of pass
    expect(result.titleSalary).toBe(20)
  })

  it('9 lands triggers count title', () => {
    const board = buildTestBoard()
    for (let i = 1; i <= 9; i++) {
      board[i] = testSquare({ owner: 1, taxIncome: 4, landKey: 'valley' })
    }
    const ownedLands = Array.from({ length: 9 }, (_, i) => i + 1)
    const player = testPlayer({ gold: 0, ownedLands, title: 'none' })

    const { result } = resolveRoyalCourtPassing({ player, board, rng: fixedRng })

    expect(result.newTitle).toBe('count')
    expect(result.titleChanged).toBe(true)
  })

  it('15 lands triggers duke title', () => {
    const board = buildTestBoard()
    for (let i = 1; i <= 15; i++) {
      board[i] = testSquare({ owner: 1, taxIncome: 4, landKey: 'valley' })
    }
    const ownedLands = Array.from({ length: 15 }, (_, i) => i + 1)
    const player = testPlayer({ gold: 0, ownedLands, title: 'none' })

    const { result } = resolveRoyalCourtPassing({ player, board, rng: fixedRng })

    expect(result.newTitle).toBe('duke')
    expect(result.titleChanged).toBe(true)
  })

  // -------------------------------------------------------------------------
  // Recruitable unit replenishment
  // -------------------------------------------------------------------------

  it('replenishes recruitable units with 25% chance per owned land', () => {
    // rng always returns 0.1 (< 0.25), so every land with a recruitable unit gets +1
    const alwaysLow = () => 0.1
    const board = buildTestBoard([
      {
        index: 1,
        square: { owner: 1, taxIncome: 8, recruitableUnit: 'swordman', recruitableCount: 2 },
      },
    ])
    const player = testPlayer({ gold: 0, ownedLands: [1], title: 'none' })

    const { newBoard, result } = resolveRoyalCourtPassing({ player, board, rng: alwaysLow })

    expect(newBoard[1]!.recruitableCount).toBe(3)
    expect(result.recruitReplenish).toHaveLength(1)
    expect(result.recruitReplenish[0]!.unitKey).toBe('swordman')
    expect(result.recruitReplenish[0]!.oldCount).toBe(2)
    expect(result.recruitReplenish[0]!.newCount).toBe(3)
  })

  it('does not replenish when rng is above 0.25', () => {
    // rng always returns 0.5 (>= 0.25), so no replenishment
    const board = buildTestBoard([
      {
        index: 1,
        square: { owner: 1, taxIncome: 8, recruitableUnit: 'swordman', recruitableCount: 2 },
      },
    ])
    const player = testPlayer({ gold: 0, ownedLands: [1], title: 'none' })

    const { newBoard, result } = resolveRoyalCourtPassing({ player, board, rng: fixedRng })

    expect(newBoard[1]!.recruitableCount).toBe(2) // unchanged
    expect(result.recruitReplenish).toHaveLength(0)
  })

  it('skips lands without a recruitable unit', () => {
    const alwaysLow = () => 0.1
    const board = buildTestBoard([
      {
        index: 1,
        square: { owner: 1, taxIncome: 8, recruitableUnit: '', recruitableCount: 0 },
      },
    ])
    const player = testPlayer({ gold: 0, ownedLands: [1], title: 'none' })

    const { newBoard, result } = resolveRoyalCourtPassing({ player, board, rng: alwaysLow })

    expect(newBoard[1]!.recruitableCount).toBe(0)
    expect(result.recruitReplenish).toHaveLength(0)
  })

  it('replenishes multiple lands independently', () => {
    // Alternate: first call 0.1 (succeeds), second call 0.5 (fails)
    const alwaysSucceed = () => 0.1
    const board = buildTestBoard([
      {
        index: 1,
        square: { owner: 1, taxIncome: 8, recruitableUnit: 'swordman', recruitableCount: 3 },
      },
      {
        index: 2,
        square: { owner: 1, taxIncome: 6, recruitableUnit: 'cavalier', recruitableCount: 0 },
      },
    ])
    const player = testPlayer({ gold: 0, ownedLands: [1, 2], title: 'none' })

    const { newBoard, result } = resolveRoyalCourtPassing({ player, board, rng: alwaysSucceed })

    expect(newBoard[1]!.recruitableCount).toBe(4)
    expect(newBoard[2]!.recruitableCount).toBe(1)
    expect(result.recruitReplenish).toHaveLength(2)
  })

  it('does not mutate original board recruitableCount', () => {
    const alwaysLow = () => 0.1
    const board = buildTestBoard([
      {
        index: 1,
        square: { owner: 1, taxIncome: 8, recruitableUnit: 'swordman', recruitableCount: 2 },
      },
    ])
    const player = testPlayer({ gold: 0, ownedLands: [1], title: 'none' })

    resolveRoyalCourtPassing({ player, board, rng: alwaysLow })

    expect(board[1]!.recruitableCount).toBe(2) // unchanged
  })

  it('returns empty recruitReplenish when player owns no lands', () => {
    const player = testPlayer({ gold: 0, ownedLands: [], title: 'none' })
    const board = buildTestBoard()

    const { result } = resolveRoyalCourtPassing({ player, board, rng: fixedRng })

    expect(result.recruitReplenish).toEqual([])
  })
})
