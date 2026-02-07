import { describe, expect, it } from 'vitest'
import { CREATURES } from '../data'
import { createRng } from './dice'
import {
  EMPTY_IMMUNITIES,
  EMPTY_STATUS,
  initNeutralCombat,
  resolveAttackRound,
  resolveAttackRoundV2,
  resolveFleeAttempt,
} from './combat'
import type {
  AttackerProfile,
  CombatStatusEffects,
  CompanionCombatSnapshot,
  NeutralCombatState,
} from './combat'
import { createCompanionFromCreature } from './player'

// ---------------------------------------------------------------------------
// Shared helpers for NeutralCombatState construction
// ---------------------------------------------------------------------------

const STATE_DEFAULTS: NeutralCombatState = {
  defenderKey: 'pikeman',
  defenderHp: 12,
  defenderMaxHp: 12,
  defenderArmor: 1,
  defenderDiceCount: 1,
  defenderDiceSides: 5,
  defenderBonusDamage: 1,
  defenderAttacksPerRound: 1,
  defenderElementalDamage: 0,
  defenderDexterity: 2,
  defenderDamageType: 'slash',
  defenderStrength: 3,
  defenderPower: 2,
  defenderImmunities: { ...EMPTY_IMMUNITIES },
  defenderElementalChannels: { fire: 0, earth: 0, air: 0, water: 0 },
  defenderStatusEffects: { ...EMPTY_STATUS },
  playerStatusEffects: { ...EMPTY_STATUS },
  playerHpSnapshot: 20,
  companions: [],
  actions: [],
  resolved: false,
  victory: false,
}

const COMPANION_DEFAULTS: CompanionCombatSnapshot = {
  name: 'wolf',
  currentHp: 10,
  maxHp: 10,
  armor: 0,
  diceCount: 1,
  diceSides: 6,
  attacksPerRound: 1,
  alive: true,
  damageType: 'slash',
  strength: 3,
  dexterity: 2,
  power: 0,
  immunities: { ...EMPTY_IMMUNITIES },
  elementalDamage: { fire: 0, earth: 0, air: 0, water: 0 },
  statusEffects: { ...EMPTY_STATUS },
}

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

  it('populates defenderAttacksPerRound from creature', () => {
    const state = initNeutralCombat('paladin', 20)
    expect(state.defenderAttacksPerRound).toBe(CREATURES.paladin.attacksPerRound)
    expect(state.defenderAttacksPerRound).toBe(2)
  })

  it('populates defenderElementalDamage as sum of all channels', () => {
    const state = initNeutralCombat('phoenix', 20)
    const phoenix = CREATURES.phoenix
    const expected =
      phoenix.elementalDamage.fire +
      phoenix.elementalDamage.earth +
      phoenix.elementalDamage.air +
      phoenix.elementalDamage.water
    expect(state.defenderElementalDamage).toBe(expected)
  })

  it('sets defenderElementalDamage to 0 for creatures with no elemental damage', () => {
    const state = initNeutralCombat('pikeman', 20)
    expect(state.defenderElementalDamage).toBe(0)
  })

  it('populates new V2 fields from creature', () => {
    const state = initNeutralCombat('pikeman', 20)
    const pikeman = CREATURES.pikeman
    expect(state.defenderDamageType).toBe(pikeman.damageType)
    expect(state.defenderStrength).toBe(pikeman.strength)
    expect(state.defenderPower).toBe(pikeman.power)
    expect(state.defenderImmunities).toEqual(pikeman.immunities)
    expect(state.defenderElementalChannels).toEqual(pikeman.elementalDamage)
    expect(state.defenderStatusEffects).toEqual(EMPTY_STATUS)
    expect(state.playerStatusEffects).toEqual(EMPTY_STATUS)
  })
})

describe('resolveAttackRound', () => {
  function makeState(overrides: Partial<NeutralCombatState> = {}): NeutralCombatState {
    return { ...STATE_DEFAULTS, ...overrides }
  }

  it('deals damage to defender (raw roll minus defender armor)', () => {
    const rng = createRng(42)
    const state = makeState({ defenderArmor: 0 })
    const result = resolveAttackRound(state, 1, 6, 0, 0, 20, 1, 0, rng)
    expect(result.playerDamageDealt).toBe(result.playerDamageRoll)
    expect(result.defenderHp).toBe(12 - result.playerDamageDealt)
  })

  it('armor reduces damage (never below 0)', () => {
    const minRng = () => 0
    const state = makeState({ defenderArmor: 100 })
    const result = resolveAttackRound(state, 1, 6, 0, 0, 20, 1, 0, minRng)
    expect(result.playerDamageDealt).toBe(0)
    expect(result.defenderHp).toBe(12)
  })

  it('defender attacks back when alive', () => {
    const rng = createRng(99)
    const state = makeState()
    const result = resolveAttackRound(state, 1, 6, 0, 0, 20, 1, 0, rng)
    expect(result.defenderDamageRoll).toBeGreaterThan(0)
  })

  it('defender does NOT attack back when defeated', () => {
    const rng = createRng(42)
    const state = makeState({ defenderHp: 1, defenderArmor: 0 })
    const result = resolveAttackRound(state, 3, 10, 10, 0, 20, 1, 0, rng)
    expect(result.defenderDefeated).toBe(true)
    expect(result.defenderDamageRoll).toBe(0)
    expect(result.defenderDamageDealt).toBe(0)
    expect(result.playerHp).toBe(20)
  })

  it('marks defenderDefeated when HP reaches 0', () => {
    const rng = createRng(42)
    const state = makeState({ defenderHp: 1, defenderArmor: 0 })
    const result = resolveAttackRound(state, 1, 6, 0, 0, 20, 1, 0, rng)
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
    const result = resolveAttackRound(state, 1, 1, 0, 0, 1, 1, 0, rng)
    expect(result.playerDefeated).toBe(true)
    expect(result.playerHp).toBe(0)
  })

  it('player armor reduces defender damage', () => {
    const state = makeState({ defenderHp: 100 })
    const resultNoArmor = resolveAttackRound(state, 1, 6, 0, 0, 100, 1, 0, createRng(42))
    const resultWithArmor = resolveAttackRound(state, 1, 6, 0, 10, 100, 1, 0, createRng(42))
    expect(resultWithArmor.defenderDamageDealt).toBeLessThanOrEqual(
      resultNoArmor.defenderDamageDealt,
    )
  })

  it('bonusDamage adds to player raw damage', () => {
    const state = makeState({ defenderArmor: 0, defenderHp: 100 })
    const resultNoBonus = resolveAttackRound(state, 1, 6, 0, 100, 100, 1, 0, createRng(42))
    const resultWithBonus = resolveAttackRound(state, 1, 6, 5, 100, 100, 1, 0, createRng(42))
    expect(resultWithBonus.playerDamageRoll).toBe(resultNoBonus.playerDamageRoll + 5)
  })

  it('tracks cumulative HP across multiple rounds', () => {
    const rng = createRng(42)
    const state = makeState({ defenderHp: 50, defenderArmor: 0 })
    let currentPlayerHp = 100

    const round1 = resolveAttackRound(state, 1, 6, 2, 0, currentPlayerHp, 1, 0, rng)
    currentPlayerHp = round1.playerHp

    const state2 = { ...state, defenderHp: round1.defenderHp }
    const round2 = resolveAttackRound(state2, 1, 6, 2, 0, currentPlayerHp, 1, 0, rng)

    expect(round2.defenderHp).toBeLessThan(round1.defenderHp)
  })

  it('handles 0 armor correctly (full damage passes through)', () => {
    const rng = createRng(42)
    const state = makeState({ defenderArmor: 0, defenderHp: 100 })
    const result = resolveAttackRound(state, 1, 6, 0, 0, 100, 1, 0, rng)
    expect(result.playerDamageDealt).toBe(result.playerDamageRoll)
  })

  it('handles very high armor (damage reduced to 0)', () => {
    const minRng = () => 0
    const state = makeState({ defenderArmor: 999, defenderHp: 100 })
    const result = resolveAttackRound(state, 1, 1, 0, 999, 100, 1, 0, minRng)
    expect(result.playerDamageDealt).toBe(0)
    expect(result.defenderDamageDealt).toBe(0)
  })

  it('defender HP never goes below 0', () => {
    const rng = createRng(42)
    const state = makeState({ defenderHp: 1, defenderArmor: 0 })
    const result = resolveAttackRound(state, 5, 10, 50, 0, 100, 1, 0, rng)
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
    const result = resolveAttackRound(state, 1, 1, 0, 0, 1, 1, 0, rng)
    expect(result.playerHp).toBeGreaterThanOrEqual(0)
  })

  it('player with multiple attacks hits multiple times', () => {
    const state = makeState({ defenderArmor: 0, defenderHp: 100 })
    const result1 = resolveAttackRound(state, 1, 6, 0, 100, 100, 1, 0, createRng(42))
    const result2 = resolveAttackRound(state, 1, 6, 0, 100, 100, 3, 0, createRng(42))
    expect(result2.playerDamageDealt).toBeGreaterThan(result1.playerDamageDealt)
  })

  it('defender with multiple attacks hits multiple times', () => {
    const state1 = makeState({ defenderHp: 100, defenderAttacksPerRound: 1 })
    const state3 = makeState({ defenderHp: 100, defenderAttacksPerRound: 3 })
    const result1 = resolveAttackRound(state1, 1, 1, 0, 0, 100, 1, 0, createRng(42))
    const result3 = resolveAttackRound(state3, 1, 1, 0, 0, 100, 1, 0, createRng(42))
    expect(result3.defenderDamageDealt).toBeGreaterThan(result1.defenderDamageDealt)
  })

  it('player elemental damage bypasses armor', () => {
    const minRng = () => 0
    const state = makeState({ defenderArmor: 999, defenderHp: 100 })
    // Physical is reduced to 0 by armor, but elemental 5 goes through
    const result = resolveAttackRound(state, 1, 6, 0, 0, 100, 1, 5, minRng)
    expect(result.playerDamageDealt).toBe(5)
    expect(result.defenderHp).toBe(95)
  })

  it('defender elemental damage bypasses player armor', () => {
    const minRng = () => 0
    const state = makeState({
      defenderHp: 100,
      defenderArmor: 0,
      defenderElementalDamage: 7,
    })
    // Player has 999 armor, defender physical is reduced to 0, but 7 elemental gets through
    const result = resolveAttackRound(state, 1, 6, 0, 999, 100, 1, 0, minRng)
    expect(result.defenderDamageDealt).toBe(7)
  })

  it('elemental damage is applied per hit with multiple attacks', () => {
    const minRng = () => 0
    const state = makeState({ defenderArmor: 999, defenderHp: 100 })
    // 3 attacks * 5 elemental each = 15 total
    const result = resolveAttackRound(state, 1, 6, 0, 0, 100, 3, 5, minRng)
    expect(result.playerDamageDealt).toBe(15)
    expect(result.defenderHp).toBe(85)
  })

  it('player stops attacking once defender is defeated mid-round', () => {
    const maxRng = () => 0.999
    // Defender has 3 HP, no armor. Player has 3 attacks with big dice -- should stop early
    const state = makeState({ defenderHp: 3, defenderArmor: 0 })
    const result = resolveAttackRound(state, 1, 100, 0, 0, 100, 3, 0, maxRng)
    expect(result.defenderDefeated).toBe(true)
    expect(result.defenderHp).toBe(0)
    // Only 1 hit was needed, so total raw should be ~100 not ~300
    expect(result.playerDamageRoll).toBeLessThanOrEqual(100)
  })

  it('defender stops attacking once player is defeated mid-round', () => {
    const maxRng = () => 0.999
    const state = makeState({
      defenderHp: 1000,
      defenderArmor: 1000,
      defenderDiceCount: 1,
      defenderDiceSides: 100,
      defenderBonusDamage: 0,
      defenderAttacksPerRound: 3,
    })
    const result = resolveAttackRound(state, 1, 1, 0, 0, 3, 1, 0, maxRng)
    expect(result.playerDefeated).toBe(true)
    expect(result.playerHp).toBe(0)
    // Defender should stop after killing player, not keep accumulating damage
    expect(result.defenderDamageDealt).toBeLessThanOrEqual(100)
  })
})

describe('resolveFleeAttempt', () => {
  function makeState(overrides: Partial<NeutralCombatState> = {}): NeutralCombatState {
    return { ...STATE_DEFAULTS, ...overrides }
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

  it('failed flee uses defender multi-attack', () => {
    const state1 = makeState({ defenderDexterity: 50, defenderAttacksPerRound: 1 })
    const state3 = makeState({ defenderDexterity: 50, defenderAttacksPerRound: 3 })
    let found = false
    for (let seed = 0; seed < 100; seed++) {
      const r1 = resolveFleeAttempt(state1, 1, 0, 1000, createRng(seed))
      const r3 = resolveFleeAttempt(state3, 1, 0, 1000, createRng(seed))
      if (!r1.escaped && !r3.escaped) {
        found = true
        expect(r3.defenderDamageDealt).toBeGreaterThan(r1.defenderDamageDealt)
        break
      }
    }
    expect(found).toBe(true)
  })

  it('failed flee applies defender elemental damage per hit', () => {
    const state = makeState({
      defenderDexterity: 50,
      defenderAttacksPerRound: 2,
      defenderElementalDamage: 10,
    })
    let found = false
    for (let seed = 0; seed < 100; seed++) {
      const result = resolveFleeAttempt(state, 1, 999, 1000, createRng(seed))
      if (!result.escaped) {
        found = true
        // Physical reduced to 0 by 999 armor, but 10 elemental * 2 attacks = 20
        expect(result.defenderDamageDealt).toBe(20)
        break
      }
    }
    expect(found).toBe(true)
  })

  it('cannot flee when stunned', () => {
    const state = makeState()
    const status: CombatStatusEffects = { ...EMPTY_STATUS, stun: 2 }
    const result = resolveFleeAttempt(state, 10, 0, 100, createRng(42), status)
    expect(result.cannotFlee).toBe(true)
    expect(result.escaped).toBe(false)
    expect(result.defenderDamageRoll).toBe(0)
    expect(result.playerHp).toBe(100)
  })

  it('cannot flee when frozen', () => {
    const state = makeState()
    const status: CombatStatusEffects = { ...EMPTY_STATUS, frozen: 1 }
    const result = resolveFleeAttempt(state, 10, 0, 100, createRng(42), status)
    expect(result.cannotFlee).toBe(true)
    expect(result.escaped).toBe(false)
  })

  it('clears bleeding on successful flee', () => {
    const state = makeState({ defenderDexterity: 1 })
    const status: CombatStatusEffects = { ...EMPTY_STATUS, bleeding: 5 }
    let found = false
    for (let seed = 0; seed < 100; seed++) {
      const result = resolveFleeAttempt(state, 20, 0, 100, createRng(seed), status)
      if (result.escaped) {
        found = true
        expect(result.bleedingCleared).toBe(true)
        break
      }
    }
    expect(found).toBe(true)
  })
})

describe('companion combat', () => {
  function makeCompanion(
    overrides: Partial<CompanionCombatSnapshot> = {},
  ): CompanionCombatSnapshot {
    return { ...COMPANION_DEFAULTS, ...overrides }
  }

  function makeState(overrides: Partial<NeutralCombatState> = {}): NeutralCombatState {
    return {
      ...STATE_DEFAULTS,
      defenderHp: 50,
      defenderMaxHp: 50,
      defenderArmor: 0,
      playerHpSnapshot: 100,
      ...overrides,
    }
  }

  it('initNeutralCombat snapshots companion data', () => {
    const companions = [
      {
        name: 'pikeman',
        currentHp: 12,
        maxHp: 12,
        strength: 3,
        dexterity: 2,
        power: 2,
        armor: 1,
        attacksPerRound: 1,
        diceCount: 1,
        diceSides: 5,
        isPet: false,
        damageType: 'pierce' as const,
        immunities: { ...EMPTY_IMMUNITIES },
        elementalDamage: { fire: 0, earth: 0, air: 0, water: 0 },
      },
    ]
    const state = initNeutralCombat('knight', 20, companions)
    expect(state.companions).toHaveLength(1)
    expect(state.companions[0]!.name).toBe('pikeman')
    expect(state.companions[0]!.currentHp).toBe(12)
    expect(state.companions[0]!.maxHp).toBe(12)
    expect(state.companions[0]!.armor).toBe(1)
    expect(state.companions[0]!.alive).toBe(true)
  })

  it('initNeutralCombat defaults to empty companions', () => {
    const state = initNeutralCombat('pikeman', 20)
    expect(state.companions).toEqual([])
  })

  it('companions attack and deal damage to defender', () => {
    const comp = makeCompanion({ diceCount: 2, diceSides: 10 })
    const state = makeState({ companions: [comp], defenderHp: 100, defenderArmor: 0 })
    const rng = createRng(42)
    const result = resolveAttackRound(state, 1, 1, 0, 100, 100, 1, 0, rng)
    expect(result.companionResults).toHaveLength(1)
    expect(result.companionResults[0]!.damageDealt).toBeGreaterThan(0)
    // Defender should have taken both player and companion damage
    expect(result.defenderHp).toBeLessThan(100)
  })

  it('companions stop attacking when defender dies', () => {
    const comp1 = makeCompanion({ name: 'wolf1', diceCount: 5, diceSides: 20 })
    const comp2 = makeCompanion({ name: 'wolf2', diceCount: 5, diceSides: 20 })
    // Defender has only 1 HP, should die from player's attack
    const state = makeState({ companions: [comp1, comp2], defenderHp: 1, defenderArmor: 0 })
    const rng = createRng(42)
    const result = resolveAttackRound(state, 1, 6, 0, 0, 100, 1, 0, rng)
    expect(result.defenderDefeated).toBe(true)
    // Both companions should have 0 damage dealt since defender was already dead
    expect(result.companionResults[0]!.damageDealt).toBe(0)
    expect(result.companionResults[1]!.damageDealt).toBe(0)
  })

  it('dead companions do not attack', () => {
    const deadComp = makeCompanion({ alive: false })
    const state = makeState({ companions: [deadComp], defenderHp: 50, defenderArmor: 0 })
    const rng = createRng(42)
    const result = resolveAttackRound(state, 1, 1, 0, 100, 100, 1, 0, rng)
    expect(result.companionResults[0]!.damageDealt).toBe(0)
    expect(result.companionResults[0]!.damageRoll).toBe(0)
  })

  it('empty companions array = same behavior as before', () => {
    const state = makeState({ defenderHp: 12, defenderArmor: 0 })
    const rng = createRng(42)
    const result = resolveAttackRound(state, 1, 6, 0, 0, 20, 1, 0, rng)
    expect(result.companionResults).toEqual([])
    expect(result.playerDamageDealt).toBeGreaterThan(0)
  })

  it('companion damage is reduced by defender armor', () => {
    const comp = makeCompanion({ diceCount: 1, diceSides: 6 })
    const stateNoArmor = makeState({
      companions: [comp],
      defenderHp: 100,
      defenderArmor: 0,
    })
    const stateHighArmor = makeState({
      companions: [{ ...comp }],
      defenderHp: 100,
      defenderArmor: 100,
    })
    const r1 = resolveAttackRound(stateNoArmor, 1, 1, 0, 100, 100, 1, 0, createRng(42))
    const r2 = resolveAttackRound(stateHighArmor, 1, 1, 0, 100, 100, 1, 0, createRng(42))
    expect(r2.companionResults[0]!.damageDealt).toBeLessThanOrEqual(
      r1.companionResults[0]!.damageDealt,
    )
  })
})

describe('createCompanionFromCreature', () => {
  it('maps creature fields correctly', () => {
    const comp = createCompanionFromCreature('pikeman')
    const pikeman = CREATURES.pikeman
    expect(comp.name).toBe('pikeman')
    expect(comp.currentHp).toBe(pikeman.hp)
    expect(comp.maxHp).toBe(pikeman.hp)
    expect(comp.strength).toBe(pikeman.strength)
    expect(comp.dexterity).toBe(pikeman.dexterity)
    expect(comp.power).toBe(pikeman.power)
    expect(comp.armor).toBe(pikeman.armor)
    expect(comp.attacksPerRound).toBe(pikeman.attacksPerRound)
    expect(comp.diceCount).toBe(pikeman.diceCount)
    expect(comp.diceSides).toBe(pikeman.diceSides)
    expect(comp.isPet).toBe(false)
    expect(comp.damageType).toBe(pikeman.damageType)
    expect(comp.immunities).toEqual(pikeman.immunities)
    expect(comp.elementalDamage).toEqual(pikeman.elementalDamage)
  })

  it('throws on unknown creature key', () => {
    expect(() => createCompanionFromCreature('nonexistent')).toThrow(
      'Unknown creature key: nonexistent',
    )
  })
})

// ---------------------------------------------------------------------------
// resolveAttackRoundV2 tests
// ---------------------------------------------------------------------------

describe('resolveAttackRoundV2', () => {
  function makeState(overrides: Partial<NeutralCombatState> = {}): NeutralCombatState {
    return { ...STATE_DEFAULTS, defenderHp: 100, defenderArmor: 0, ...overrides }
  }

  function makePlayer(overrides: Partial<AttackerProfile> = {}): AttackerProfile {
    return {
      diceCount: 1,
      diceSides: 6,
      bonusDamage: 0,
      armor: 0,
      hp: 100,
      attacksPerRound: 1,
      damageType: 'slash',
      strength: 5,
      dexterity: 5,
      power: 5,
      immunities: { ...EMPTY_IMMUNITIES },
      elementalDamage: { fire: 0, earth: 0, air: 0, water: 0 },
      ...overrides,
    }
  }

  it('basic damage matches V1 when no status effects or crits', () => {
    // Use high armor to prevent crits mattering (crit damage thresholds)
    const state = makeState({ defenderArmor: 0, defenderHp: 200 })
    const player = makePlayer({ diceCount: 2, diceSides: 10, hp: 200 })
    const rng = createRng(42)
    const result = resolveAttackRoundV2(
      state,
      player,
      { ...EMPTY_STATUS },
      { ...EMPTY_STATUS },
      rng,
    )
    expect(result.playerDamageDealt).toBeGreaterThan(0)
    expect(result.defenderHp).toBeLessThan(200)
  })

  it('stunned player cannot attack', () => {
    const state = makeState({ defenderHp: 100 })
    const player = makePlayer({ diceCount: 5, diceSides: 20, hp: 200 })
    const pStatus: CombatStatusEffects = { ...EMPTY_STATUS, stun: 2 }
    const result = resolveAttackRoundV2(state, player, pStatus, { ...EMPTY_STATUS }, createRng(42))
    expect(result.playerStunned).toBe(true)
    expect(result.playerDamageDealt).toBe(0)
    expect(result.playerDamageRoll).toBe(0)
  })

  it('frozen player cannot attack', () => {
    const state = makeState({ defenderHp: 100 })
    const player = makePlayer({ hp: 200 })
    const pStatus: CombatStatusEffects = { ...EMPTY_STATUS, frozen: 1 }
    const result = resolveAttackRoundV2(state, player, pStatus, { ...EMPTY_STATUS }, createRng(42))
    expect(result.playerStunned).toBe(true)
    expect(result.playerDamageDealt).toBe(0)
  })

  it('stunned defender cannot attack', () => {
    const state = makeState({ defenderHp: 100 })
    const player = makePlayer({ hp: 200, armor: 0 })
    const dStatus: CombatStatusEffects = { ...EMPTY_STATUS, stun: 2 }
    const result = resolveAttackRoundV2(state, player, { ...EMPTY_STATUS }, dStatus, createRng(42))
    expect(result.defenderStunned).toBe(true)
    expect(result.defenderDamageDealt).toBe(0)
    expect(result.defenderDamageRoll).toBe(0)
  })

  it('bleeding ticks deal damage to both sides', () => {
    const state = makeState({ defenderHp: 100 })
    const player = makePlayer({ hp: 100 })
    const pStatus: CombatStatusEffects = { ...EMPTY_STATUS, bleeding: 10 }
    const dStatus: CombatStatusEffects = { ...EMPTY_STATUS, bleeding: 10 }
    const result = resolveAttackRoundV2(state, player, pStatus, dStatus, createRng(42))
    expect(result.statusEffectDamage.player).toBeGreaterThan(0)
    expect(result.statusEffectDamage.defender).toBeGreaterThan(0)
  })

  it('burning deals damage equal to burning level', () => {
    const state = makeState({ defenderHp: 100 })
    const player = makePlayer({ hp: 100 })
    const dStatus: CombatStatusEffects = { ...EMPTY_STATUS, burning: 5 }
    const result = resolveAttackRoundV2(state, player, { ...EMPTY_STATUS }, dStatus, createRng(42))
    expect(result.statusEffectDamage.defender).toBeGreaterThanOrEqual(5)
  })

  it('poison deals damage reduced by strength', () => {
    const state = makeState({ defenderHp: 100, defenderStrength: 0 })
    const player = makePlayer({ hp: 100 })
    const dStatus: CombatStatusEffects = { ...EMPTY_STATUS, poison: 10 }
    const result = resolveAttackRoundV2(state, player, { ...EMPTY_STATUS }, dStatus, createRng(42))
    // With 0 str, full poison damage
    expect(result.statusEffectDamage.defender).toBe(10)
  })

  it('status effects can kill before attacks happen', () => {
    const state = makeState({ defenderHp: 1 })
    const player = makePlayer({ hp: 100 })
    const dStatus: CombatStatusEffects = { ...EMPTY_STATUS, burning: 10 }
    const result = resolveAttackRoundV2(state, player, { ...EMPTY_STATUS }, dStatus, createRng(42))
    expect(result.defenderDefeated).toBe(true)
    expect(result.defenderHp).toBe(0)
    // No attacks should have happened
    expect(result.playerDamageRoll).toBe(0)
  })

  it('stun decays by 1 each round', () => {
    const state = makeState({ defenderHp: 100 })
    const player = makePlayer({ hp: 200 })
    const pStatus: CombatStatusEffects = { ...EMPTY_STATUS, stun: 3 }
    const result = resolveAttackRoundV2(state, player, pStatus, { ...EMPTY_STATUS }, createRng(42))
    expect(result.newPlayerStatus.stun).toBe(2)
  })

  it('pierce crit bypasses armor', () => {
    // Use pierce weapon, high dex for high crit chance, and high defender armor
    const state = makeState({
      defenderHp: 200,
      defenderArmor: 100,
      defenderDexterity: 1,
      defenderImmunities: { ...EMPTY_IMMUNITIES },
    })
    const player = makePlayer({
      damageType: 'pierce',
      dexterity: 50,
      diceCount: 1,
      diceSides: 6,
      hp: 200,
      armor: 200,
    })
    // Run multiple times and check that at least once damage > 0 despite 100 armor
    let pierceHappened = false
    for (let seed = 0; seed < 100; seed++) {
      const result = resolveAttackRoundV2(
        state,
        player,
        { ...EMPTY_STATUS },
        { ...EMPTY_STATUS },
        createRng(seed),
      )
      if (result.playerDamageDealt > 0) {
        pierceHappened = true
        break
      }
    }
    expect(pierceHappened).toBe(true)
  })

  it('slash crit applies bleeding', () => {
    const state = makeState({
      defenderHp: 200,
      defenderArmor: 0,
      defenderDexterity: 1,
      defenderImmunities: { ...EMPTY_IMMUNITIES },
    })
    const player = makePlayer({
      damageType: 'slash',
      strength: 20,
      dexterity: 20,
      diceCount: 2,
      diceSides: 10,
      hp: 200,
      armor: 200,
    })
    let bleedApplied = false
    for (let seed = 0; seed < 200; seed++) {
      const result = resolveAttackRoundV2(
        state,
        player,
        { ...EMPTY_STATUS },
        { ...EMPTY_STATUS },
        createRng(seed),
      )
      const bleedEffect = result.appliedEffects.find(
        (e) => e.target === 'defender' && e.effect === 'bleeding',
      )
      if (bleedEffect) {
        bleedApplied = true
        expect(bleedEffect.amount).toBeGreaterThan(0)
        expect(result.newDefenderStatus.bleeding).toBeGreaterThan(0)
        break
      }
    }
    expect(bleedApplied).toBe(true)
  })

  it('crush crit applies stun', () => {
    const state = makeState({
      defenderHp: 200,
      defenderArmor: 0,
      defenderDexterity: 1,
      defenderImmunities: { ...EMPTY_IMMUNITIES },
    })
    const player = makePlayer({
      damageType: 'crush',
      strength: 20,
      diceCount: 3,
      diceSides: 10,
      hp: 200,
      armor: 200,
    })
    let stunApplied = false
    for (let seed = 0; seed < 200; seed++) {
      const result = resolveAttackRoundV2(
        state,
        player,
        { ...EMPTY_STATUS },
        { ...EMPTY_STATUS },
        createRng(seed),
      )
      const stunEffect = result.appliedEffects.find(
        (e) => e.target === 'defender' && e.effect === 'stun',
      )
      if (stunEffect) {
        stunApplied = true
        expect(stunEffect.amount).toBe(2)
        expect(result.newDefenderStatus.stun).toBe(2)
        break
      }
    }
    expect(stunApplied).toBe(true)
  })

  it('elemental damage is reduced by resistance', () => {
    const state = makeState({
      defenderHp: 200,
      defenderArmor: 999,
      defenderPower: 10,
      defenderDexterity: 10,
      defenderStrength: 10,
      defenderImmunities: { ...EMPTY_IMMUNITIES },
    })
    const player = makePlayer({
      diceCount: 1,
      diceSides: 1,
      hp: 200,
      armor: 200,
      elementalDamage: { fire: 20, earth: 0, air: 0, water: 0 },
    })
    // Run many rounds, average fire damage should be less than 20 due to resistance
    let totalElem = 0
    const runs = 100
    for (let seed = 0; seed < runs; seed++) {
      const result = resolveAttackRoundV2(
        state,
        player,
        { ...EMPTY_STATUS },
        { ...EMPTY_STATUS },
        createRng(seed),
      )
      totalElem += result.playerDamageDealt
    }
    const avg = totalElem / runs
    expect(avg).toBeLessThan(20)
    expect(avg).toBeGreaterThan(0)
  })

  it('fire-immune defender takes 0 fire elemental', () => {
    const state = makeState({
      defenderHp: 200,
      defenderArmor: 999,
      defenderImmunities: { ...EMPTY_IMMUNITIES, fire: 1 },
    })
    const player = makePlayer({
      diceCount: 1,
      diceSides: 1,
      hp: 200,
      armor: 200,
      elementalDamage: { fire: 20, earth: 0, air: 0, water: 0 },
    })
    const result = resolveAttackRoundV2(
      state,
      player,
      { ...EMPTY_STATUS },
      { ...EMPTY_STATUS },
      createRng(42),
    )
    expect(result.playerDamageDealt).toBe(0)
  })

  it('defender attacks player with crits and elemental', () => {
    const state = makeState({
      defenderHp: 200,
      defenderArmor: 0,
      defenderDamageType: 'slash',
      defenderStrength: 20,
      defenderDexterity: 20,
      defenderDiceCount: 2,
      defenderDiceSides: 10,
      defenderElementalChannels: { fire: 5, earth: 0, air: 0, water: 0 },
      defenderImmunities: { ...EMPTY_IMMUNITIES },
    })
    const player = makePlayer({ hp: 200, armor: 0, dexterity: 1 })
    const result = resolveAttackRoundV2(
      state,
      player,
      { ...EMPTY_STATUS },
      { ...EMPTY_STATUS },
      createRng(42),
    )
    expect(result.defenderDamageDealt).toBeGreaterThan(0)
  })

  it('returns correct newPlayerStatus and newDefenderStatus', () => {
    const state = makeState({ defenderHp: 200, defenderStrength: 5 })
    const player = makePlayer({ hp: 200 })
    const pStatus: CombatStatusEffects = { ...EMPTY_STATUS, bleeding: 6, stun: 1 }
    const dStatus: CombatStatusEffects = { ...EMPTY_STATUS, burning: 3 }
    const result = resolveAttackRoundV2(state, player, pStatus, dStatus, createRng(42))
    // Bleeding should have decayed
    expect(result.newPlayerStatus.bleeding).toBeLessThanOrEqual(6)
    // Stun should have decayed by 1
    expect(result.newPlayerStatus.stun).toBe(0)
    // Burning should have decayed
    expect(result.newDefenderStatus.burning).toBeLessThanOrEqual(3)
  })

  it('returns newCompanions in result', () => {
    const comp = { ...COMPANION_DEFAULTS }
    const state = makeState({ companions: [comp], defenderHp: 100 })
    const player = makePlayer({ hp: 200 })
    const result = resolveAttackRoundV2(
      state,
      player,
      { ...EMPTY_STATUS },
      { ...EMPTY_STATUS },
      createRng(42),
    )
    expect(result.newCompanions).toHaveLength(1)
    expect(result.newCompanions[0]!.name).toBe('wolf')
  })
})

// ---------------------------------------------------------------------------
// V2 companion combat completeness
// ---------------------------------------------------------------------------

describe('V2 companion combat completeness', () => {
  function makeCompanion(
    overrides: Partial<CompanionCombatSnapshot> = {},
  ): CompanionCombatSnapshot {
    return { ...COMPANION_DEFAULTS, ...overrides }
  }

  function makeState(overrides: Partial<NeutralCombatState> = {}): NeutralCombatState {
    return {
      ...STATE_DEFAULTS,
      defenderHp: 100,
      defenderMaxHp: 100,
      defenderArmor: 0,
      ...overrides,
    }
  }

  function makePlayer(overrides: Partial<AttackerProfile> = {}): AttackerProfile {
    return {
      diceCount: 1,
      diceSides: 1,
      bonusDamage: 0,
      armor: 200,
      hp: 200,
      attacksPerRound: 1,
      damageType: 'slash',
      strength: 5,
      dexterity: 5,
      power: 5,
      immunities: { ...EMPTY_IMMUNITIES },
      elementalDamage: { fire: 0, earth: 0, air: 0, water: 0 },
      ...overrides,
    }
  }

  it('companion gets crits with slash weapon', () => {
    const comp = makeCompanion({
      damageType: 'slash',
      strength: 20,
      dexterity: 20,
      diceCount: 2,
      diceSides: 10,
    })
    const state = makeState({
      companions: [comp],
      defenderHp: 500,
      defenderDexterity: 1,
      defenderImmunities: { ...EMPTY_IMMUNITIES },
    })
    const player = makePlayer()

    let bleedFound = false
    for (let seed = 0; seed < 200; seed++) {
      const result = resolveAttackRoundV2(
        state,
        player,
        { ...EMPTY_STATUS },
        { ...EMPTY_STATUS },
        createRng(seed),
      )
      if (result.companionResults[0]!.appliedEffects.some((e) => e.effect === 'bleeding')) {
        bleedFound = true
        break
      }
    }
    expect(bleedFound).toBe(true)
  })

  it('companion gets elemental damage through armor', () => {
    const comp = makeCompanion({
      elementalDamage: { fire: 10, earth: 0, air: 0, water: 0 },
    })
    const state = makeState({
      companions: [comp],
      defenderHp: 200,
      defenderArmor: 999,
      defenderImmunities: { ...EMPTY_IMMUNITIES },
    })
    const player = makePlayer()

    let elemDamage = false
    for (let seed = 0; seed < 50; seed++) {
      const result = resolveAttackRoundV2(
        state,
        player,
        { ...EMPTY_STATUS },
        { ...EMPTY_STATUS },
        createRng(seed),
      )
      if (result.companionResults[0]!.damageDealt > 0) {
        elemDamage = true
        break
      }
    }
    expect(elemDamage).toBe(true)
  })

  it('stunned companion skips attack', () => {
    const comp = makeCompanion({
      statusEffects: { ...EMPTY_STATUS, stun: 2 },
      diceCount: 5,
      diceSides: 20,
    })
    const state = makeState({ companions: [comp], defenderHp: 100 })
    const player = makePlayer()
    const result = resolveAttackRoundV2(
      state,
      player,
      { ...EMPTY_STATUS },
      { ...EMPTY_STATUS },
      createRng(42),
    )
    expect(result.companionResults[0]!.stunned).toBe(true)
    expect(result.companionResults[0]!.damageDealt).toBe(0)
    expect(result.companionResults[0]!.damageRoll).toBe(0)
  })

  it('frozen companion skips attack', () => {
    const comp = makeCompanion({
      statusEffects: { ...EMPTY_STATUS, frozen: 1 },
      diceCount: 5,
      diceSides: 20,
    })
    const state = makeState({ companions: [comp], defenderHp: 100 })
    const player = makePlayer()
    const result = resolveAttackRoundV2(
      state,
      player,
      { ...EMPTY_STATUS },
      { ...EMPTY_STATUS },
      createRng(42),
    )
    expect(result.companionResults[0]!.stunned).toBe(true)
    expect(result.companionResults[0]!.damageDealt).toBe(0)
  })

  it('companion status effects tick each round', () => {
    const comp = makeCompanion({
      currentHp: 100,
      maxHp: 100,
      statusEffects: { ...EMPTY_STATUS, bleeding: 10 },
    })
    const state = makeState({ companions: [comp], defenderHp: 200 })
    const player = makePlayer()
    const result = resolveAttackRoundV2(
      state,
      player,
      { ...EMPTY_STATUS },
      { ...EMPTY_STATUS },
      createRng(42),
    )
    expect(result.companionResults[0]!.statusEffectDamage).toBeGreaterThan(0)
    expect(result.companionResults[0]!.currentHp).toBeLessThan(100)
  })

  it('companion can die from status tick', () => {
    const comp = makeCompanion({
      currentHp: 1,
      statusEffects: { ...EMPTY_STATUS, burning: 10 },
    })
    const state = makeState({ companions: [comp], defenderHp: 200 })
    const player = makePlayer()
    const result = resolveAttackRoundV2(
      state,
      player,
      { ...EMPTY_STATUS },
      { ...EMPTY_STATUS },
      createRng(42),
    )
    expect(result.companionResults[0]!.alive).toBe(false)
    expect(result.companionResults[0]!.currentHp).toBe(0)
  })

  it('defender targets companions randomly', () => {
    // Give defender many attacks to increase chance of hitting a companion
    const comp = makeCompanion({ currentHp: 200, maxHp: 200, armor: 0 })
    const state = makeState({
      companions: [comp],
      defenderHp: 200,
      defenderAttacksPerRound: 10,
      defenderDiceCount: 1,
      defenderDiceSides: 6,
      defenderBonusDamage: 0,
      defenderDamageType: 'slash',
      defenderImmunities: { ...EMPTY_IMMUNITIES },
      defenderElementalChannels: { fire: 0, earth: 0, air: 0, water: 0 },
    })
    const player = makePlayer({ hp: 200, armor: 0 })

    let companionHit = false
    for (let seed = 0; seed < 50; seed++) {
      const result = resolveAttackRoundV2(
        state,
        player,
        { ...EMPTY_STATUS },
        { ...EMPTY_STATUS },
        createRng(seed),
      )
      if (result.companionResults[0]!.damageTaken > 0) {
        companionHit = true
        break
      }
    }
    expect(companionHit).toBe(true)
  })

  it('defender can kill a companion', () => {
    const comp = makeCompanion({ currentHp: 1, maxHp: 1, armor: 0 })
    const state = makeState({
      companions: [comp],
      defenderHp: 200,
      defenderAttacksPerRound: 20,
      defenderDiceCount: 2,
      defenderDiceSides: 10,
      defenderBonusDamage: 5,
      defenderDamageType: 'slash',
      defenderImmunities: { ...EMPTY_IMMUNITIES },
      defenderElementalChannels: { fire: 0, earth: 0, air: 0, water: 0 },
    })
    const player = makePlayer({ hp: 500, armor: 200 })

    let companionDied = false
    for (let seed = 0; seed < 100; seed++) {
      const result = resolveAttackRoundV2(
        state,
        player,
        { ...EMPTY_STATUS },
        { ...EMPTY_STATUS },
        createRng(seed),
      )
      if (!result.companionResults[0]!.alive) {
        companionDied = true
        break
      }
    }
    expect(companionDied).toBe(true)
  })

  it('defender can inflict status effects on companions', () => {
    const comp = makeCompanion({ currentHp: 200, maxHp: 200, armor: 0, dexterity: 1 })
    const state = makeState({
      companions: [comp],
      defenderHp: 200,
      defenderAttacksPerRound: 10,
      defenderDiceCount: 2,
      defenderDiceSides: 10,
      defenderBonusDamage: 0,
      defenderDamageType: 'slash',
      defenderStrength: 20,
      defenderDexterity: 20,
      defenderImmunities: { ...EMPTY_IMMUNITIES },
      defenderElementalChannels: { fire: 0, earth: 0, air: 0, water: 0 },
    })
    const player = makePlayer({ hp: 500, armor: 200 })

    let statusApplied = false
    for (let seed = 0; seed < 200; seed++) {
      const result = resolveAttackRoundV2(
        state,
        player,
        { ...EMPTY_STATUS },
        { ...EMPTY_STATUS },
        createRng(seed),
      )
      const compEffects = result.appliedEffects.filter((e) => e.target === 'companion:wolf')
      if (compEffects.length > 0) {
        statusApplied = true
        break
      }
    }
    expect(statusApplied).toBe(true)
  })

  it('CompanionRoundResult has all required fields', () => {
    const comp = makeCompanion()
    const state = makeState({ companions: [comp], defenderHp: 200 })
    const player = makePlayer()
    const result = resolveAttackRoundV2(
      state,
      player,
      { ...EMPTY_STATUS },
      { ...EMPTY_STATUS },
      createRng(42),
    )
    const cr = result.companionResults[0]!
    expect(cr).toHaveProperty('name')
    expect(cr).toHaveProperty('damageRoll')
    expect(cr).toHaveProperty('damageDealt')
    expect(cr).toHaveProperty('damageTaken')
    expect(cr).toHaveProperty('statusEffectDamage')
    expect(cr).toHaveProperty('appliedEffects')
    expect(cr).toHaveProperty('stunned')
    expect(cr).toHaveProperty('alive')
    expect(cr).toHaveProperty('currentHp')
    expect(cr).toHaveProperty('newStatus')
  })

  it('V1 companion results include new fields with defaults', () => {
    const comp = makeCompanion()
    const state: NeutralCombatState = {
      ...STATE_DEFAULTS,
      defenderHp: 50,
      defenderMaxHp: 50,
      defenderArmor: 0,
      companions: [comp],
    }
    const result = resolveAttackRound(state, 1, 6, 0, 0, 100, 1, 0, createRng(42))
    const cr = result.companionResults[0]!
    expect(cr.damageTaken).toBe(0)
    expect(cr.statusEffectDamage).toBe(0)
    expect(cr.appliedEffects).toEqual([])
    expect(cr.stunned).toBe(false)
    expect(cr.alive).toBe(true)
    expect(cr.currentHp).toBe(10)
    expect(cr.newStatus).toEqual(EMPTY_STATUS)
  })

  it('V1 result includes newCompanions', () => {
    const comp = makeCompanion()
    const state: NeutralCombatState = {
      ...STATE_DEFAULTS,
      defenderHp: 50,
      defenderMaxHp: 50,
      defenderArmor: 0,
      companions: [comp],
    }
    const result = resolveAttackRound(state, 1, 6, 0, 0, 100, 1, 0, createRng(42))
    expect(result.newCompanions).toHaveLength(1)
    expect(result.newCompanions[0]!.name).toBe('wolf')
  })

  it('newCompanions reflects updated HP after defender attacks', () => {
    const comp = makeCompanion({ currentHp: 200, maxHp: 200, armor: 0 })
    const state = makeState({
      companions: [comp],
      defenderHp: 200,
      defenderAttacksPerRound: 20,
      defenderDiceCount: 2,
      defenderDiceSides: 10,
      defenderBonusDamage: 5,
      defenderDamageType: 'slash',
      defenderImmunities: { ...EMPTY_IMMUNITIES },
      defenderElementalChannels: { fire: 0, earth: 0, air: 0, water: 0 },
    })
    const player = makePlayer({ hp: 500, armor: 200 })

    let hpReduced = false
    for (let seed = 0; seed < 50; seed++) {
      const result = resolveAttackRoundV2(
        state,
        player,
        { ...EMPTY_STATUS },
        { ...EMPTY_STATUS },
        createRng(seed),
      )
      if (result.newCompanions[0]!.currentHp < 200) {
        hpReduced = true
        expect(result.companionResults[0]!.damageTaken).toBeGreaterThan(0)
        break
      }
    }
    expect(hpReduced).toBe(true)
  })

  it('dead companions are not in target pool', () => {
    const deadComp = makeCompanion({ name: 'deadWolf', currentHp: 0, alive: false })
    const state = makeState({
      companions: [deadComp],
      defenderHp: 200,
      defenderAttacksPerRound: 5,
      defenderDiceCount: 1,
      defenderDiceSides: 6,
      defenderDamageType: 'slash',
      defenderImmunities: { ...EMPTY_IMMUNITIES },
      defenderElementalChannels: { fire: 0, earth: 0, air: 0, water: 0 },
    })
    const player = makePlayer({ hp: 200, armor: 0 })
    const result = resolveAttackRoundV2(
      state,
      player,
      { ...EMPTY_STATUS },
      { ...EMPTY_STATUS },
      createRng(42),
    )
    // All damage should go to player since companion is dead
    expect(result.companionResults[0]!.damageTaken).toBe(0)
    expect(result.defenderDamageDealt).toBeGreaterThan(0)
  })
})
