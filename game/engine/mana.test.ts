import { describe, expect, it } from 'vitest'
import { calcLandManaRegen, calcTotalManaRegen, applyManaRegen, tickEffectDurations } from './mana'
import type { ActiveEffect, ManaPool, ManaRegen } from '../types'

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
