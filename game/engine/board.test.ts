import { describe, expect, it } from 'vitest'
import { createRng } from './dice'
import { generateBoard } from './board'

describe('generateBoard', () => {
  it('returns an array of exactly 34 squares', () => {
    const rng = createRng(42)
    const board = generateBoard(rng)
    expect(board).toHaveLength(34)
  })

  it('first square is Royal Court', () => {
    const rng = createRng(42)
    const board = generateBoard(rng)
    expect(board[0]!.name).toContain('Royal')
  })

  it('every square has required BoardSquare fields', () => {
    const rng = createRng(42)
    const board = generateBoard(rng)
    for (const square of board) {
      expect(square).toHaveProperty('landTypeId')
      expect(square).toHaveProperty('owner')
      expect(square).toHaveProperty('price')
      expect(square).toHaveProperty('name')
      expect(square).toHaveProperty('defenderId')
      expect(square).toHaveProperty('taxIncome')
      expect(square).toHaveProperty('healing')
    }
  })

  it('same seed produces the same board', () => {
    const rng1 = createRng(12345)
    const rng2 = createRng(12345)
    const board1 = generateBoard(rng1)
    const board2 = generateBoard(rng2)
    expect(board1).toEqual(board2)
  })

  it('different seeds produce different boards', () => {
    const rng1 = createRng(1)
    const rng2 = createRng(2)
    const board1 = generateBoard(rng1)
    const board2 = generateBoard(rng2)
    // At least some squares should differ
    const names1 = board1.map((s) => s.name)
    const names2 = board2.map((s) => s.name)
    expect(names1).not.toEqual(names2)
  })

  it('all squares have non-negative price', () => {
    const rng = createRng(42)
    const board = generateBoard(rng)
    for (const square of board) {
      expect(square.price).toBeGreaterThanOrEqual(0)
    }
  })

  it('all squares have non-negative healing', () => {
    const rng = createRng(42)
    const board = generateBoard(rng)
    for (const square of board) {
      expect(square.healing).toBeGreaterThanOrEqual(0)
    }
  })

  it('all squares have non-negative taxIncome', () => {
    const rng = createRng(42)
    const board = generateBoard(rng)
    for (const square of board) {
      expect(square.taxIncome).toBeGreaterThanOrEqual(0)
    }
  })

  it('non-Royal-Court squares are unowned initially', () => {
    const rng = createRng(42)
    const board = generateBoard(rng)
    for (const square of board) {
      expect(square.owner).toBe(0)
    }
  })

  it('special service squares can appear on the board', () => {
    // Over many seeds, we should see shops, smithies, libraries, etc.
    const landNames = new Set<string>()
    for (let seed = 0; seed < 50; seed++) {
      const rng = createRng(seed)
      const board = generateBoard(rng)
      for (const square of board) {
        landNames.add(square.name)
      }
    }
    // Shops have high spawn chance (20), so should appear over 50 boards
    const hasShopType = [...landNames].some(
      (n) => n.toLowerCase().includes('shop') || n.toLowerCase().includes('pood'),
    )
    expect(hasShopType).toBe(true)
  })

  it('territory lands appear on the board', () => {
    const landNames = new Set<string>()
    for (let seed = 0; seed < 50; seed++) {
      const rng = createRng(seed)
      const board = generateBoard(rng)
      for (const square of board) {
        landNames.add(square.name)
      }
    }
    // Valley has spawnChance 10, should appear over 50 boards
    const hasValley = [...landNames].some(
      (n) => n.toLowerCase().includes('valley') || n.toLowerCase().includes('org'),
    )
    expect(hasValley).toBe(true)
  })

  it('board generation is deterministic across multiple calls', () => {
    // Generate the same board 3 times to ensure consistency
    const boards = Array.from({ length: 3 }, () => {
      const rng = createRng(999)
      return generateBoard(rng)
    })
    expect(boards[0]).toEqual(boards[1])
    expect(boards[1]).toEqual(boards[2])
  })

  it('buildings array is initialized on each square', () => {
    const rng = createRng(42)
    const board = generateBoard(rng)
    for (const square of board) {
      expect(Array.isArray(square.buildings)).toBe(true)
    }
  })
})
