import { describe, expect, it } from 'vitest'
import { CREATURES } from '../data'
import { createRng } from './dice'
import { initNeutralCombat, resolveAttackRound, resolveFleeAttempt } from './combat'
import type { NeutralCombatState } from './combat'

describe('initNeutralCombat', () => {
  it('creates state from a valid creature key', () => {
    const state = initNeutralCombat('pikeman', 20)
    const pikeman = CREATURES.pikeman
    expect(state.defenderKey).toBe('pikeman')
    expect(state.defenderHp).toBe(pikeman.hp)
    expect(state.defenderMaxHp).toBe(pikeman.hp)
    expect(state.defenderArmor).toBe(pikeman.armor)
    expect(state.defenderDiceCount).toBe(pikeman.diceCount)
    expect(state.defenderDiceSides).toBe(pikeman.diceSides)
    expect(state.defenderBonusDamage).toBe(pikeman.bonusDamage)
    expect(state.defenderDexterity).toBe(pikeman.dexterity)
  })

  it('stores player HP snapshot', () => {
    const state = initNeutralCombat('pikeman', 45)
    expect(state.playerHpSnapshot).toBe(45)
  })

  it('starts with empty actions and unresolved', () => {
    const state = initNeutralCombat('pikeman', 20)
    expect(state.actions).toEqual([])
    expect(state.resolved).toBe(false)
    expect(state.victory).toBe(false)
  })

  it('throws for unknown creature key', () => {
    expect(() => initNeutralCombat('nonexistent', 20)).toThrow('Unknown creature key: nonexistent')
  })

  it('works with different creatures', () => {
    const state = initNeutralCombat('knight', 30)
    const knight = CREATURES.knight
    expect(state.defenderHp).toBe(knight.hp)
    expect(state.defenderArmor).toBe(knight.armor)
  })
})

describe('resolveAttackRound', () => {
  function makeState(overrides: Partial<NeutralCombatState> = {}): NeutralCombatState {
    return {
      defenderKey: 'pikeman',
      defenderHp: 12,
      defenderMaxHp: 12,
      defenderArmor: 1,
      defenderDiceCount: 1,
      defenderDiceSides: 5,
      defenderBonusDamage: 1,
      defenderDexterity: 2,
      playerHpSnapshot: 20,
      actions: [],
      resolved: false,
      victory: false,
      ...overrides,
    }
  }

  it('deals damage to defender (raw roll minus defender armor)', () => {
    const rng = createRng(42)
    const state = makeState({ defenderArmor: 0 })
    const result = resolveAttackRound(state, 1, 6, 0, 0, 20, rng)
    expect(result.playerDamageDealt).toBe(result.playerDamageRoll)
    expect(result.defenderHp).toBe(12 - result.playerDamageDealt)
  })

  it('armor reduces damage (never below 0)', () => {
    const minRng = () => 0
    const state = makeState({ defenderArmor: 100 })
    const result = resolveAttackRound(state, 1, 6, 0, 0, 20, minRng)
    expect(result.playerDamageDealt).toBe(0)
    expect(result.defenderHp).toBe(12)
  })

  it('defender attacks back when alive', () => {
    const rng = createRng(99)
    const state = makeState()
    const result = resolveAttackRound(state, 1, 6, 0, 0, 20, rng)
    expect(result.defenderDamageRoll).toBeGreaterThan(0)
  })

  it('defender does NOT attack back when defeated', () => {
    const rng = createRng(42)
    const state = makeState({ defenderHp: 1, defenderArmor: 0 })
    const result = resolveAttackRound(state, 3, 10, 10, 0, 20, rng)
    expect(result.defenderDefeated).toBe(true)
    expect(result.defenderDamageRoll).toBe(0)
    expect(result.defenderDamageDealt).toBe(0)
    expect(result.playerHp).toBe(20)
  })

  it('marks defenderDefeated when HP reaches 0', () => {
    const rng = createRng(42)
    const state = makeState({ defenderHp: 1, defenderArmor: 0 })
    const result = resolveAttackRound(state, 1, 6, 0, 0, 20, rng)
    expect(result.defenderHp).toBe(0)
    expect(result.defenderDefeated).toBe(true)
  })

  it('marks playerDefeated when HP reaches 0', () => {
    const rng = createRng(42)
    const state = makeState({
      defenderHp: 100,
      defenderArmor: 100,
      defenderDiceCount: 5,
      defenderDiceSides: 10,
      defenderBonusDamage: 20,
    })
    const result = resolveAttackRound(state, 1, 1, 0, 0, 1, rng)
    expect(result.playerDefeated).toBe(true)
    expect(result.playerHp).toBe(0)
  })

  it('player armor reduces defender damage', () => {
    const state = makeState({ defenderHp: 100 })
    const resultNoArmor = resolveAttackRound(state, 1, 6, 0, 0, 100, createRng(42))
    const resultWithArmor = resolveAttackRound(state, 1, 6, 0, 10, 100, createRng(42))
    expect(resultWithArmor.defenderDamageDealt).toBeLessThanOrEqual(
      resultNoArmor.defenderDamageDealt,
    )
  })

  it('bonusDamage adds to player raw damage', () => {
    const state = makeState({ defenderArmor: 0, defenderHp: 100 })
    const resultNoBonus = resolveAttackRound(state, 1, 6, 0, 100, 100, createRng(42))
    const resultWithBonus = resolveAttackRound(state, 1, 6, 5, 100, 100, createRng(42))
    expect(resultWithBonus.playerDamageRoll).toBe(resultNoBonus.playerDamageRoll + 5)
  })

  it('tracks cumulative HP across multiple rounds', () => {
    const rng = createRng(42)
    const state = makeState({ defenderHp: 50, defenderArmor: 0 })
    let currentPlayerHp = 100

    const round1 = resolveAttackRound(state, 1, 6, 2, 0, currentPlayerHp, rng)
    currentPlayerHp = round1.playerHp

    const state2 = { ...state, defenderHp: round1.defenderHp }
    const round2 = resolveAttackRound(state2, 1, 6, 2, 0, currentPlayerHp, rng)

    expect(round2.defenderHp).toBeLessThan(round1.defenderHp)
  })

  it('handles 0 armor correctly (full damage passes through)', () => {
    const rng = createRng(42)
    const state = makeState({ defenderArmor: 0, defenderHp: 100 })
    const result = resolveAttackRound(state, 1, 6, 0, 0, 100, rng)
    expect(result.playerDamageDealt).toBe(result.playerDamageRoll)
  })

  it('handles very high armor (damage reduced to 0)', () => {
    const minRng = () => 0
    const state = makeState({ defenderArmor: 999, defenderHp: 100 })
    const result = resolveAttackRound(state, 1, 1, 0, 999, 100, minRng)
    expect(result.playerDamageDealt).toBe(0)
    expect(result.defenderDamageDealt).toBe(0)
  })

  it('defender HP never goes below 0', () => {
    const rng = createRng(42)
    const state = makeState({ defenderHp: 1, defenderArmor: 0 })
    const result = resolveAttackRound(state, 5, 10, 50, 0, 100, rng)
    expect(result.defenderHp).toBe(0)
  })

  it('player HP never goes below 0', () => {
    const rng = createRng(42)
    const state = makeState({
      defenderHp: 100,
      defenderArmor: 100,
      defenderDiceCount: 5,
      defenderDiceSides: 10,
      defenderBonusDamage: 50,
    })
    const result = resolveAttackRound(state, 1, 1, 0, 0, 1, rng)
    expect(result.playerHp).toBeGreaterThanOrEqual(0)
  })
})

describe('resolveFleeAttempt', () => {
  function makeState(overrides: Partial<NeutralCombatState> = {}): NeutralCombatState {
    return {
      defenderKey: 'pikeman',
      defenderHp: 12,
      defenderMaxHp: 12,
      defenderArmor: 1,
      defenderDiceCount: 1,
      defenderDiceSides: 5,
      defenderBonusDamage: 1,
      defenderDexterity: 2,
      playerHpSnapshot: 20,
      actions: [],
      resolved: false,
      victory: false,
      ...overrides,
    }
  }

  it('returns escaped=true on successful flee', () => {
    // High player dex vs low defender dex -> very likely to escape
    // Run many attempts to find at least one success
    const state = makeState({ defenderDexterity: 1 })
    let escaped = false
    for (let seed = 0; seed < 100; seed++) {
      const result = resolveFleeAttempt(state, 20, 0, 100, createRng(seed))
      if (result.escaped) {
        escaped = true
        expect(result.defenderDamageRoll).toBe(0)
        expect(result.defenderDamageDealt).toBe(0)
        expect(result.playerHp).toBe(100)
        expect(result.playerDefeated).toBe(false)
        break
      }
    }
    expect(escaped).toBe(true)
  })

  it('defender gets a free hit on failed flee', () => {
    // Low player dex vs high defender dex -> very likely to be caught
    const state = makeState({ defenderDexterity: 20 })
    let caught = false
    for (let seed = 0; seed < 100; seed++) {
      const result = resolveFleeAttempt(state, 1, 0, 100, createRng(seed))
      if (!result.escaped) {
        caught = true
        expect(result.defenderDamageRoll).toBeGreaterThan(0)
        break
      }
    }
    expect(caught).toBe(true)
  })

  it('player armor reduces free hit damage', () => {
    const state = makeState({ defenderDexterity: 20, defenderBonusDamage: 10 })
    let caught = false
    for (let seed = 0; seed < 100; seed++) {
      const rng = createRng(seed)
      const noArmor = resolveFleeAttempt(state, 1, 0, 100, rng)
      const withArmor = resolveFleeAttempt(state, 1, 5, 100, createRng(seed))
      if (!noArmor.escaped && !withArmor.escaped) {
        caught = true
        expect(withArmor.defenderDamageDealt).toBeLessThanOrEqual(noArmor.defenderDamageDealt)
        break
      }
    }
    expect(caught).toBe(true)
  })

  it('player can die from free hit on failed flee', () => {
    const state = makeState({
      defenderDexterity: 50,
      defenderDiceCount: 5,
      defenderDiceSides: 10,
      defenderBonusDamage: 50,
    })
    let died = false
    for (let seed = 0; seed < 100; seed++) {
      const result = resolveFleeAttempt(state, 1, 0, 1, createRng(seed))
      if (!result.escaped && result.playerDefeated) {
        died = true
        expect(result.playerHp).toBe(0)
        break
      }
    }
    expect(died).toBe(true)
  })

  it('equal dexterity gives ~67% escape chance (runner=2, chaser=1)', () => {
    const state = makeState({ defenderDexterity: 5 })
    let escapes = 0
    const trials = 1000
    for (let seed = 0; seed < trials; seed++) {
      const result = resolveFleeAttempt(state, 5, 0, 100, createRng(seed))
      if (result.escaped) escapes++
    }
    // Expected ~67%, allow 55-79% range for randomness
    const rate = escapes / trials
    expect(rate).toBeGreaterThan(0.55)
    expect(rate).toBeLessThan(0.79)
  })

  it('higher player dex increases escape chance', () => {
    const state = makeState({ defenderDexterity: 5 })
    const trials = 500
    let escapesLow = 0
    let escapesHigh = 0
    for (let seed = 0; seed < trials; seed++) {
      if (resolveFleeAttempt(state, 5, 0, 100, createRng(seed)).escaped) escapesLow++
      if (resolveFleeAttempt(state, 10, 0, 100, createRng(seed)).escaped) escapesHigh++
    }
    expect(escapesHigh).toBeGreaterThan(escapesLow)
  })

  it('higher defender dex decreases escape chance', () => {
    const trials = 500
    let escapesWeak = 0
    let escapesStrong = 0
    for (let seed = 0; seed < trials; seed++) {
      const weak = makeState({ defenderDexterity: 2 })
      const strong = makeState({ defenderDexterity: 10 })
      if (resolveFleeAttempt(weak, 5, 0, 100, createRng(seed)).escaped) escapesWeak++
      if (resolveFleeAttempt(strong, 5, 0, 100, createRng(seed)).escaped) escapesStrong++
    }
    expect(escapesWeak).toBeGreaterThan(escapesStrong)
  })

  it('player HP never goes below 0 on failed flee', () => {
    const state = makeState({
      defenderDexterity: 50,
      defenderDiceCount: 10,
      defenderDiceSides: 10,
      defenderBonusDamage: 100,
    })
    for (let seed = 0; seed < 50; seed++) {
      const result = resolveFleeAttempt(state, 1, 0, 1, createRng(seed))
      expect(result.playerHp).toBeGreaterThanOrEqual(0)
    }
  })
})
