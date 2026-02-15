import { describe, expect, it } from 'vitest'
import {
  calcLandManaRegen,
  calcTotalManaRegen,
  applyManaRegen,
  tickEffectDurations,
  expireSummonedCompanions,
} from './mana'
import type { ActiveEffect, Companion, ManaPool, ManaRegen } from '../types'

const EMPTY_MANA: ManaPool = { fire: 0, earth: 0, air: 0, water: 0, death: 0, life: 0, arcane: 0 }

function makeEffect(overrides: Partial<ActiveEffect> = {}): ActiveEffect {
  return {
    spellKey: '',
    casterId: 0,
    targetId: 0,
    duration: 1,
    armorBonus: 0,
    hasteBonus: 0,
    strengthBonus: 0,
    windsPower: 0,
    checkedFlag: false,
    moneyReward: 0,
    itemReward: 0,
    landReward: 0,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// calcLandManaRegen
// ---------------------------------------------------------------------------

describe('calcLandManaRegen', () => {
  it('returns all zeros when no lands are owned', () => {
    const result = calcLandManaRegen([], [])
    expect(result).toEqual(EMPTY_MANA)
  })

  it('returns earth:1 for a single forest land', () => {
    // forest has manaType='earth'
    const board = [{ landKey: 'forest' }]
    const result = calcLandManaRegen([0], board)
    expect(result).toEqual({ ...EMPTY_MANA, earth: 1 })
  })

  it('stacks mana from multiple lands of the same type', () => {
    // forest (earth) + brushland (earth) = earth:2
    const board = [{ landKey: 'forest' }, { landKey: 'brushland' }]
    const result = calcLandManaRegen([0, 1], board)
    expect(result).toEqual({ ...EMPTY_MANA, earth: 2 })
  })

  it('accumulates different mana types from mixed lands', () => {
    // hill (fire) + forest (earth) + desert (air) + coast (water) + swamp (death) + valley (life)
    const board = [
      { landKey: 'hill' },
      { landKey: 'forest' },
      { landKey: 'desert' },
      { landKey: 'coast' },
      { landKey: 'swamp' },
      { landKey: 'valley' },
    ]
    const result = calcLandManaRegen([0, 1, 2, 3, 4, 5], board)
    expect(result).toEqual({ fire: 1, earth: 1, air: 1, water: 1, death: 1, life: 1, arcane: 0 })
  })

  it('ignores lands with empty manaType', () => {
    // shop (manaType='') should not contribute
    const board = [{ landKey: 'shop' }, { landKey: 'forest' }]
    const result = calcLandManaRegen([0, 1], board)
    expect(result).toEqual({ ...EMPTY_MANA, earth: 1 })
  })

  it('only counts lands at the given indices', () => {
    // board has 3 lands but we only own index 2
    const board = [{ landKey: 'forest' }, { landKey: 'hill' }, { landKey: 'desert' }]
    const result = calcLandManaRegen([2], board)
    expect(result).toEqual({ ...EMPTY_MANA, air: 1 })
  })
})

// ---------------------------------------------------------------------------
// calcTotalManaRegen
// ---------------------------------------------------------------------------

describe('calcTotalManaRegen', () => {
  it('sums item and land regen per mana type', () => {
    const itemManaRegen: ManaRegen = { ...EMPTY_MANA, fire: 2 }
    const landManaRegen: ManaRegen = { ...EMPTY_MANA, fire: 1, earth: 3 }
    const result = calcTotalManaRegen({ itemManaRegen, landManaRegen, arcaneTowerCount: 0 })
    expect(result).toEqual({ ...EMPTY_MANA, fire: 3, earth: 3 })
  })

  it('adds arcane mana from 1 tower (triangular: 1)', () => {
    const result = calcTotalManaRegen({
      itemManaRegen: EMPTY_MANA,
      landManaRegen: EMPTY_MANA,
      arcaneTowerCount: 1,
    })
    expect(result).toEqual({ ...EMPTY_MANA, arcane: 1 })
  })

  it('adds arcane mana from 2 towers (triangular: 3)', () => {
    const result = calcTotalManaRegen({
      itemManaRegen: EMPTY_MANA,
      landManaRegen: EMPTY_MANA,
      arcaneTowerCount: 2,
    })
    expect(result).toEqual({ ...EMPTY_MANA, arcane: 3 })
  })

  it('adds arcane mana from 3 towers (triangular: 6)', () => {
    const result = calcTotalManaRegen({
      itemManaRegen: { ...EMPTY_MANA, arcane: 1 },
      landManaRegen: EMPTY_MANA,
      arcaneTowerCount: 3,
    })
    // item arcane 1 + tower arcane 6 = 7
    expect(result).toEqual({ ...EMPTY_MANA, arcane: 7 })
  })

  it('returns all zeros when all inputs are zero', () => {
    const result = calcTotalManaRegen({
      itemManaRegen: EMPTY_MANA,
      landManaRegen: EMPTY_MANA,
      arcaneTowerCount: 0,
    })
    expect(result).toEqual(EMPTY_MANA)
  })
})

// ---------------------------------------------------------------------------
// applyManaRegen
// ---------------------------------------------------------------------------

describe('applyManaRegen', () => {
  it('adds regen to current mana pool', () => {
    const mana: ManaPool = { fire: 5, earth: 0, air: 3, water: 0, death: 0, life: 0, arcane: 2 }
    const regen: ManaRegen = { fire: 1, earth: 2, air: 0, water: 0, death: 0, life: 0, arcane: 3 }
    const result = applyManaRegen(mana, regen)
    expect(result).toEqual({ fire: 6, earth: 2, air: 3, water: 0, death: 0, life: 0, arcane: 5 })
  })

  it('does not mutate the original mana pool', () => {
    const mana: ManaPool = { ...EMPTY_MANA, fire: 5 }
    const regen: ManaRegen = { ...EMPTY_MANA, fire: 3 }
    const result = applyManaRegen(mana, regen)
    expect(result.fire).toBe(8)
    expect(mana.fire).toBe(5)
  })

  it('returns an identical pool when regen is all zeros', () => {
    const mana: ManaPool = { fire: 3, earth: 1, air: 0, water: 5, death: 2, life: 0, arcane: 4 }
    const result = applyManaRegen(mana, EMPTY_MANA)
    expect(result).toEqual(mana)
  })
})

// ---------------------------------------------------------------------------
// tickEffectDurations
// ---------------------------------------------------------------------------

describe('tickEffectDurations', () => {
  it('decrements duration and keeps effects with duration > 0', () => {
    const effects = [makeEffect({ spellKey: 'shield', duration: 3 })]
    const { remaining, expired } = tickEffectDurations(effects)
    expect(remaining).toHaveLength(1)
    expect(remaining[0]!.duration).toBe(2)
    expect(expired).toHaveLength(0)
  })

  it('moves effects to expired when duration reaches 0', () => {
    const effects = [makeEffect({ spellKey: 'haste', duration: 1 })]
    const { remaining, expired } = tickEffectDurations(effects)
    expect(remaining).toHaveLength(0)
    expect(expired).toHaveLength(1)
    expect(expired[0]!.spellKey).toBe('haste')
  })

  it('expires effects that already have duration 0 (instant effects)', () => {
    const effects = [makeEffect({ spellKey: 'heal', duration: 0 })]
    const { remaining, expired } = tickEffectDurations(effects)
    expect(remaining).toHaveLength(0)
    expect(expired).toHaveLength(1)
    expect(expired[0]!.spellKey).toBe('heal')
  })

  it('partitions a mixed list correctly', () => {
    const effects = [
      makeEffect({ spellKey: 'a', duration: 5 }),
      makeEffect({ spellKey: 'b', duration: 1 }),
      makeEffect({ spellKey: 'c', duration: 2 }),
      makeEffect({ spellKey: 'd', duration: 0 }),
    ]
    const { remaining, expired } = tickEffectDurations(effects)
    expect(remaining.map((e) => e.spellKey)).toEqual(['a', 'c'])
    expect(remaining.find((e) => e.spellKey === 'a')!.duration).toBe(4)
    expect(remaining.find((e) => e.spellKey === 'c')!.duration).toBe(1)
    expect(expired.map((e) => e.spellKey)).toEqual(['b', 'd'])
  })

  it('returns empty arrays for empty input', () => {
    const { remaining, expired } = tickEffectDurations([])
    expect(remaining).toEqual([])
    expect(expired).toEqual([])
  })

  it('does not mutate the original effects array or its elements', () => {
    const original = makeEffect({ spellKey: 'shield', duration: 3 })
    const effects = [original]
    tickEffectDurations(effects)
    expect(effects).toHaveLength(1)
    expect(original.duration).toBe(3)
  })

  it('expires effects with negative duration', () => {
    const effects = [makeEffect({ spellKey: 'glitch', duration: -1 })]
    const { remaining, expired } = tickEffectDurations(effects)
    expect(remaining).toHaveLength(0)
    expect(expired).toHaveLength(1)
    expect(expired[0]!.duration).toBe(-2)
  })
})

// ---------------------------------------------------------------------------
// expireSummonedCompanions (TDD -- new function)
// ---------------------------------------------------------------------------
// Decrements duration on companions that have one, removes those that reach 0.
// Permanent companions (duration undefined or -1) are kept unchanged.
// Signature: expireSummonedCompanions(companions: Companion[]) =>
//   { remaining: Companion[], expired: Companion[] }

function makeCompanion(overrides: Partial<Companion> = {}): Companion {
  return {
    name: 'testCreature',
    currentHp: 50,
    maxHp: 50,
    strength: 5,
    dexterity: 5,
    power: 3,
    armor: 2,
    attacksPerRound: 1,
    diceCount: 1,
    diceSides: 6,
    isPet: false,
    damageType: 'slash',
    immunities: { fire: 0, poison: 0, lightning: 0, cold: 0, bleeding: 0, stun: 0 },
    elementalDamage: { fire: 0, earth: 0, air: 0, water: 0 },
    ...overrides,
  }
}

describe('expireSummonedCompanions', () => {
  it('decrements duration and keeps companions with duration > 0 after decrement', () => {
    const companions = [makeCompanion({ name: 'golem', duration: 5 })]
    const { remaining, expired } = expireSummonedCompanions(companions)
    expect(remaining).toHaveLength(1)
    expect(remaining[0]!.name).toBe('golem')
    expect(remaining[0]!.duration).toBe(4)
    expect(expired).toHaveLength(0)
  })

  it('expires companions whose duration reaches 0', () => {
    const companions = [makeCompanion({ name: 'skeleton', duration: 1 })]
    const { remaining, expired } = expireSummonedCompanions(companions)
    expect(remaining).toHaveLength(0)
    expect(expired).toHaveLength(1)
    expect(expired[0]!.name).toBe('skeleton')
  })

  it('keeps permanent companions (no duration field / undefined)', () => {
    const companions = [makeCompanion({ name: 'pet' })]
    // No duration field -- should be treated as permanent
    const { remaining, expired } = expireSummonedCompanions(companions)
    expect(remaining).toHaveLength(1)
    expect(remaining[0]!.name).toBe('pet')
    expect(expired).toHaveLength(0)
  })

  it('keeps permanent companions with duration -1', () => {
    const companions = [makeCompanion({ name: 'familiar', duration: -1 })]
    const { remaining, expired } = expireSummonedCompanions(companions)
    expect(remaining).toHaveLength(1)
    expect(remaining[0]!.name).toBe('familiar')
    // Duration should remain -1 (not decremented)
    expect(remaining[0]!.duration).toBe(-1)
    expect(expired).toHaveLength(0)
  })

  it('partitions a mixed list of summoned and permanent companions', () => {
    const companions = [
      makeCompanion({ name: 'pet', isPet: true }), // permanent (no duration)
      makeCompanion({ name: 'golem', duration: 3 }), // stays
      makeCompanion({ name: 'skeleton', duration: 1 }), // expires
      makeCompanion({ name: 'angel', duration: 10 }), // stays
    ]
    const { remaining, expired } = expireSummonedCompanions(companions)
    expect(remaining.map((c) => c.name)).toEqual(['pet', 'golem', 'angel'])
    expect(expired.map((c) => c.name)).toEqual(['skeleton'])
    expect(remaining.find((c) => c.name === 'golem')!.duration).toBe(2)
    expect(remaining.find((c) => c.name === 'angel')!.duration).toBe(9)
  })

  it('returns empty arrays for empty input', () => {
    const { remaining, expired } = expireSummonedCompanions([])
    expect(remaining).toEqual([])
    expect(expired).toEqual([])
  })

  it('does not mutate the original companions array or its elements', () => {
    const original = makeCompanion({ name: 'golem', duration: 3 })
    const companions = [original]
    expireSummonedCompanions(companions)
    expect(companions).toHaveLength(1)
    expect(original.duration).toBe(3)
  })

  it('handles all companions expiring at once', () => {
    const companions = [
      makeCompanion({ name: 'a', duration: 1 }),
      makeCompanion({ name: 'b', duration: 1 }),
    ]
    const { remaining, expired } = expireSummonedCompanions(companions)
    expect(remaining).toHaveLength(0)
    expect(expired).toHaveLength(2)
  })

  it('handles all permanent companions', () => {
    const companions = [
      makeCompanion({ name: 'pet1', isPet: true }),
      makeCompanion({ name: 'pet2', duration: -1 }),
    ]
    const { remaining, expired } = expireSummonedCompanions(companions)
    expect(remaining).toHaveLength(2)
    expect(expired).toHaveLength(0)
  })
})
