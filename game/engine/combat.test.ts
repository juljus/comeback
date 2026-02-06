import { describe, expect, it } from 'vitest'
import { CREATURES } from '../data'
import { createRng } from './dice'
import { initNeutralCombat, resolveAttackRound } from './combat'
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
  })

  it('stores player HP snapshot', () => {
    const state = initNeutralCombat('pikeman', 45)
    expect(state.playerHpSnapshot).toBe(45)
  })

  it('starts with empty rounds and unresolved', () => {
    const state = initNeutralCombat('pikeman', 20)
    expect(state.rounds).toEqual([])
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
  // Helper to create a minimal combat state for testing
  function makeState(overrides: Partial<NeutralCombatState> = {}): NeutralCombatState {
    return {
      defenderKey: 'pikeman',
      defenderHp: 12,
      defenderMaxHp: 12,
      defenderArmor: 1,
      defenderDiceCount: 1,
      defenderDiceSides: 5,
      defenderBonusDamage: 1,
      playerHpSnapshot: 20,
      rounds: [],
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
    // Use fixed rng that always returns minimum roll
    const minRng = () => 0 // randomInt(1, sides, rng) => 1
    const state = makeState({ defenderArmor: 100 })
    // Player rolls 1d6+0, raw = 1, armor = 100 -> dealt = 0
    const result = resolveAttackRound(state, 1, 6, 0, 0, 20, minRng)
    expect(result.playerDamageDealt).toBe(0)
    expect(result.defenderHp).toBe(12)
  })

  it('defender attacks back when alive', () => {
    const rng = createRng(99)
    const state = makeState()
    const result = resolveAttackRound(state, 1, 6, 0, 0, 20, rng)
    // Defender should have dealt some damage
    expect(result.defenderDamageRoll).toBeGreaterThan(0)
  })

  it('defender does NOT attack back when defeated', () => {
    const rng = createRng(42)
    // Defender has 1 HP, player does massive damage
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
    // Player has 1 HP, defender is very strong and player is weak
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
    const state = makeState({ defenderHp: 100 }) // defender won't die
    const resultNoArmor = resolveAttackRound(state, 1, 6, 0, 0, 100, createRng(42))
    const resultWithArmor = resolveAttackRound(state, 1, 6, 0, 10, 100, createRng(42))
    // Same rng seed means same rolls, but armor reduces damage
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
    let currentDefenderHp = 50
    let currentPlayerHp = 100

    const round1 = resolveAttackRound(state, 1, 6, 2, 0, currentPlayerHp, rng)
    currentDefenderHp = round1.defenderHp
    currentPlayerHp = round1.playerHp

    // Update state for next round
    const state2 = { ...state, defenderHp: currentDefenderHp }
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
    // Force minimum roll
    const minRng = () => 0
    const state = makeState({ defenderArmor: 999, defenderHp: 100 })
    // Player rolls 1d1+0 = 1, armor 999 -> dealt = 0
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
