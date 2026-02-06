import { describe, expect, it } from 'vitest'
import { createRng, randomInt, rollDice, rollMovement } from './dice'

describe('createRng', () => {
  it('returns a function', () => {
    const rng = createRng(42)
    expect(typeof rng).toBe('function')
  })

  it('produces deterministic results with the same seed', () => {
    const rng1 = createRng(12345)
    const rng2 = createRng(12345)
    const results1 = Array.from({ length: 20 }, () => rng1())
    const results2 = Array.from({ length: 20 }, () => rng2())
    expect(results1).toEqual(results2)
  })

  it('produces values in [0, 1)', () => {
    const rng = createRng(99)
    for (let i = 0; i < 1000; i++) {
      const val = rng()
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThan(1)
    }
  })

  it('different seeds produce different sequences', () => {
    const rng1 = createRng(1)
    const rng2 = createRng(2)
    const results1 = Array.from({ length: 10 }, () => rng1())
    const results2 = Array.from({ length: 10 }, () => rng2())
    expect(results1).not.toEqual(results2)
  })
})

describe('rollDice', () => {
  it('returns a value in [count, count*sides] for standard rolls', () => {
    const rng = createRng(42)
    for (let i = 0; i < 100; i++) {
      const result = rollDice(2, 6, rng)
      expect(result).toBeGreaterThanOrEqual(2)
      expect(result).toBeLessThanOrEqual(12)
    }
  })

  it('returns 0 when count is 0', () => {
    const rng = createRng(42)
    expect(rollDice(0, 6, rng)).toBe(0)
  })

  it('always returns count when sides is 1', () => {
    const rng = createRng(42)
    expect(rollDice(3, 1, rng)).toBe(3)
    expect(rollDice(5, 1, rng)).toBe(5)
  })

  it('single die returns values in [1, sides]', () => {
    const rng = createRng(7)
    for (let i = 0; i < 200; i++) {
      const result = rollDice(1, 20, rng)
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(20)
    }
  })

  it('produces deterministic results with same seed', () => {
    const rng1 = createRng(55)
    const rng2 = createRng(55)
    const results1 = Array.from({ length: 50 }, () => rollDice(2, 6, rng1))
    const results2 = Array.from({ length: 50 }, () => rollDice(2, 6, rng2))
    expect(results1).toEqual(results2)
  })
})

describe('rollMovement', () => {
  it('returns die1, die2, total, and isDoubles fields', () => {
    const rng = createRng(42)
    const result = rollMovement(0, rng)
    expect(result).toHaveProperty('die1')
    expect(result).toHaveProperty('die2')
    expect(result).toHaveProperty('total')
    expect(result).toHaveProperty('isDoubles')
  })

  it('total equals die1 + die2', () => {
    const rng = createRng(42)
    for (let i = 0; i < 100; i++) {
      const result = rollMovement(0, rng)
      expect(result.total).toBe(result.die1 + result.die2)
    }
  })

  it('with speedBonus=0, each die is in [1, 6]', () => {
    const rng = createRng(42)
    for (let i = 0; i < 200; i++) {
      const result = rollMovement(0, rng)
      expect(result.die1).toBeGreaterThanOrEqual(1)
      expect(result.die1).toBeLessThanOrEqual(6)
      expect(result.die2).toBeGreaterThanOrEqual(1)
      expect(result.die2).toBeLessThanOrEqual(6)
    }
  })

  it('with speedBonus=2, each die is in [1, 8]', () => {
    const rng = createRng(42)
    for (let i = 0; i < 200; i++) {
      const result = rollMovement(2, rng)
      expect(result.die1).toBeGreaterThanOrEqual(1)
      expect(result.die1).toBeLessThanOrEqual(8)
      expect(result.die2).toBeGreaterThanOrEqual(1)
      expect(result.die2).toBeLessThanOrEqual(8)
    }
  })

  it('correctly detects doubles when both dice are equal', () => {
    const rng = createRng(42)
    for (let i = 0; i < 200; i++) {
      const result = rollMovement(0, rng)
      expect(result.isDoubles).toBe(result.die1 === result.die2)
    }
  })

  it('produces deterministic results with same seed', () => {
    const rng1 = createRng(77)
    const rng2 = createRng(77)
    const results1 = Array.from({ length: 30 }, () => rollMovement(0, rng1))
    const results2 = Array.from({ length: 30 }, () => rollMovement(0, rng2))
    expect(results1).toEqual(results2)
  })

  it('speed bonus expands die range beyond 6', () => {
    const rng = createRng(42)
    const results = Array.from({ length: 500 }, () => rollMovement(4, rng))
    const maxDie = Math.max(...results.map((r) => Math.max(r.die1, r.die2)))
    // With speedBonus=4, max die value is 10. Over 500 rolls we should see > 6
    expect(maxDie).toBeGreaterThan(6)
  })
})

describe('randomInt', () => {
  it('returns values within [min, max] inclusive', () => {
    const rng = createRng(42)
    for (let i = 0; i < 500; i++) {
      const val = randomInt(3, 7, rng)
      expect(val).toBeGreaterThanOrEqual(3)
      expect(val).toBeLessThanOrEqual(7)
    }
  })

  it('returns min when min equals max', () => {
    const rng = createRng(42)
    expect(randomInt(5, 5, rng)).toBe(5)
  })

  it('returns only integers', () => {
    const rng = createRng(42)
    for (let i = 0; i < 100; i++) {
      const val = randomInt(1, 100, rng)
      expect(Number.isInteger(val)).toBe(true)
    }
  })

  it('produces deterministic results with same seed', () => {
    const rng1 = createRng(88)
    const rng2 = createRng(88)
    const results1 = Array.from({ length: 50 }, () => randomInt(1, 10, rng1))
    const results2 = Array.from({ length: 50 }, () => randomInt(1, 10, rng2))
    expect(results1).toEqual(results2)
  })

  it('covers the full range over many rolls', () => {
    const rng = createRng(42)
    const seen = new Set<number>()
    for (let i = 0; i < 500; i++) {
      seen.add(randomInt(1, 6, rng))
    }
    // Over 500 rolls of 1-6, we should see all values
    expect(seen.size).toBe(6)
  })
})
