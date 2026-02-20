import { describe, expect, it } from 'vitest'
import { resolveCombatSpellRound } from './combatMagic'
import type { SpellCombatResult } from './combatMagic'
import { initNeutralCombat, initFortifiedCombat, EMPTY_STATUS, EMPTY_IMMUNITIES } from './combat'
import type { AttackerProfile, CompanionCombatSnapshot } from './combat'
import type { ManaPool } from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fixedRng = () => 0.5
const lowRng = () => 0.0

function emptyMana(): ManaPool {
  return { fire: 0, earth: 0, air: 0, water: 0, death: 0, life: 0, arcane: 0 }
}

function makePlayer(overrides: Partial<AttackerProfile> = {}): AttackerProfile {
  return {
    diceCount: 1,
    diceSides: 4,
    bonusDamage: 0,
    armor: 0,
    hp: 100,
    attacksPerRound: 1,
    damageType: 'pierce',
    strength: 5,
    dexterity: 5,
    power: 10,
    immunities: { ...EMPTY_IMMUNITIES },
    elementalDamage: { fire: 0, earth: 0, air: 0, water: 0 },
    retaliationPercent: 0,
    ...overrides,
  }
}

function makeCompanion(overrides: Partial<CompanionCombatSnapshot> = {}): CompanionCombatSnapshot {
  return {
    name: 'TestCompanion',
    currentHp: 50,
    maxHp: 50,
    armor: 2,
    diceCount: 1,
    diceSides: 4,
    attacksPerRound: 1,
    alive: true,
    damageType: 'slash',
    strength: 4,
    dexterity: 4,
    power: 3,
    immunities: { ...EMPTY_IMMUNITIES },
    elementalDamage: { fire: 0, earth: 0, air: 0, water: 0 },
    statusEffects: { ...EMPTY_STATUS },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Basic damage spell casting
// ---------------------------------------------------------------------------

describe('resolveCombatSpellRound', () => {
  describe('basic damage spell casting', () => {
    it('casting magicArrow deals spell damage to defender', () => {
      // magicArrow: basePower=7, manaCost=10, manaType=arcane, isAggressive=true
      const state = initNeutralCombat('wolf', 100)
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { magicArrow: 3 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'magicArrow',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      expect(result.spellDamage).toBeGreaterThan(0)
      expect(result.spellKey).toBe('magicArrow')
    })

    it('mana is deducted after casting', () => {
      const state = initNeutralCombat('wolf', 100)
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { magicArrow: 3 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'magicArrow',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      // magicArrow costs 10 arcane
      expect(result.newMana.arcane).toBe(40)
    })

    it('defender HP reduced by spell damage', () => {
      const state = initNeutralCombat('wolf', 100)
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { magicArrow: 3 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'magicArrow',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      // Wolf has 13 HP; spell damage should reduce it (clamped to 0 min)
      expect(result.defenderHp).toBeLessThan(state.defenderHp)
      expect(result.defenderHp).toBe(Math.max(0, state.defenderHp - result.spellDamage))
    })

    it('defender defeated when HP reaches 0', () => {
      // Use a high-power caster to ensure kill
      const state = initNeutralCombat('wolf', 100)
      const player = makePlayer({ power: 50 })
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { magicArrow: 10 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'magicArrow',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      expect(result.defenderDefeated).toBe(true)
      expect(result.defenderHp).toBe(0)
    })

    it('vampiric healing from deathGrasp heals player', () => {
      // deathGrasp: basePower=7, manaCost=25, manaType=death, vampiricPercent=25
      const state = initNeutralCombat('wolf', 80)
      const player = makePlayer({ hp: 80 })
      const mana: ManaPool = { ...emptyMana(), death: 50 }
      const spellbook = { deathGrasp: 3 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'deathGrasp',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      expect(result.vampiricHealing).toBeGreaterThan(0)
      // Player HP should reflect vampiric healing
      expect(result.playerHp).toBeGreaterThanOrEqual(80)
    })

    it('vampiric healing adds to playerHp (no cap in this function)', () => {
      // Even if player is at full HP, vampiric adds on top
      const state = initNeutralCombat('wolf', 100)
      const player = makePlayer({ hp: 100 })
      const mana: ManaPool = { ...emptyMana(), death: 50 }
      const spellbook = { deathGrasp: 3 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'deathGrasp',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      // Vampiric healing is added; no capping in this function
      expect(result.vampiricHealing).toBeGreaterThan(0)
    })
  })

  // ---------------------------------------------------------------------------
  // Buff spell casting
  // ---------------------------------------------------------------------------

  describe('buff spell casting', () => {
    it('casting armor spell returns buffApplied with correct armor bonus', () => {
      // armor: manaCost=15, manaType=earth, hasArmorBuff=true
      const state = initNeutralCombat('wolf', 100)
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), earth: 50 }
      const spellbook = { armor: 3 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'armor',
        spellbook,
        mana,
        { type: 'self' },
        fixedRng,
      )

      expect(result.buffApplied).toBeDefined()
      expect(result.buffApplied!.armorBonus).toBeGreaterThan(0)
      expect(result.buffApplied!.spellKey).toBe('armor')
    })

    it('casting haste returns buffApplied with haste bonus', () => {
      // haste: manaCost=30, manaType=water, hasHasteEffect=true
      const state = initNeutralCombat('wolf', 100)
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), water: 50 }
      const spellbook = { haste: 2 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'haste',
        spellbook,
        mana,
        { type: 'self' },
        fixedRng,
      )

      expect(result.buffApplied).toBeDefined()
      expect(result.buffApplied!.hasteBonus).toBeGreaterThan(0)
    })

    it('casting heal returns buffApplied with heal amount', () => {
      // heal: manaCost=20, manaType=life, hasHealEffect=true
      const state = initNeutralCombat('wolf', 100)
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), life: 50 }
      const spellbook = { heal: 3 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'heal',
        spellbook,
        mana,
        { type: 'self' },
        fixedRng,
      )

      expect(result.buffApplied).toBeDefined()
      expect(result.buffApplied!.healAmount).toBeGreaterThan(0)
    })

    it('buff spells do not damage defender', () => {
      const state = initNeutralCombat('wolf', 100)
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), earth: 50 }
      const spellbook = { armor: 3 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'armor',
        spellbook,
        mana,
        { type: 'self' },
        fixedRng,
      )

      expect(result.spellDamage).toBe(0)
    })
  })

  // ---------------------------------------------------------------------------
  // Summon spell casting
  // ---------------------------------------------------------------------------

  describe('summon spell casting', () => {
    it('casting summonGolem returns summonsCreated with creature info', () => {
      // summonGolem: manaCost=15, manaType=arcane, isSummon=true
      const state = initNeutralCombat('wolf', 100)
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { summonGolem: 2 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'summonGolem',
        spellbook,
        mana,
        { type: 'self' },
        fixedRng,
      )

      expect(result.summonsCreated).toBeDefined()
      expect(result.summonsCreated!.creatureKey).toBeDefined()
      expect(result.summonsCreated!.count).toBeGreaterThan(0)
    })

    it('summon duration based on caster power', () => {
      const state = initNeutralCombat('wolf', 100)
      const player = makePlayer({ power: 10 })
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { summonGolem: 1 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'summonGolem',
        spellbook,
        mana,
        { type: 'self' },
        fixedRng,
      )

      // Duration = casterPower * 2 = 10 * 2 = 20
      expect(result.summonsCreated).toBeDefined()
      expect(result.summonsCreated!.duration).toBe(20)
    })
  })

  // ---------------------------------------------------------------------------
  // Status tick phase
  // ---------------------------------------------------------------------------

  describe('status tick phase', () => {
    it('player bleeding ticks before spell', () => {
      const state = initNeutralCombat('wolf', 100)
      state.playerStatusEffects = { ...EMPTY_STATUS, bleeding: 5 }
      const player = makePlayer({ hp: 100 })
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { magicArrow: 3 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'magicArrow',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      expect(result.statusEffectDamage.player).toBeGreaterThan(0)
    })

    it('defender bleeding ticks before spell', () => {
      const state = initNeutralCombat('wolf', 100)
      state.defenderStatusEffects = { ...EMPTY_STATUS, bleeding: 5 }
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { magicArrow: 3 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'magicArrow',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      expect(result.statusEffectDamage.defender).toBeGreaterThan(0)
    })

    it('player can die from status tick (before casting)', () => {
      const state = initNeutralCombat('wolf', 100)
      // Massive burning will kill the player
      state.playerStatusEffects = { ...EMPTY_STATUS, burning: 200 }
      const player = makePlayer({ hp: 5 })
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { magicArrow: 3 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'magicArrow',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      expect(result.playerHp).toBe(0)
      expect(result.playerDefeated).toBe(true)
      // Spell should not fire (player died before casting)
      expect(result.spellDamage).toBe(0)
    })

    it('defender can die from status tick (spell is skipped)', () => {
      const state = initNeutralCombat('wolf', 100)
      // Wolf has 13 HP; massive burning kills it
      state.defenderStatusEffects = { ...EMPTY_STATUS, burning: 200 }
      state.defenderHp = 5
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { magicArrow: 3 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'magicArrow',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      expect(result.defenderHp).toBe(0)
      expect(result.defenderDefeated).toBe(true)
      // Spell should not have fired since defender died in tick
      expect(result.spellDamage).toBe(0)
    })
  })

  // ---------------------------------------------------------------------------
  // Stun/freeze prevents casting
  // ---------------------------------------------------------------------------

  describe('stun/freeze prevents casting', () => {
    it('stunned player cannot cast (spellDamage=0, mana unchanged)', () => {
      const state = initNeutralCombat('wolf', 100)
      state.playerStatusEffects = { ...EMPTY_STATUS, stun: 3 }
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { magicArrow: 3 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'magicArrow',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      expect(result.spellDamage).toBe(0)
      expect(result.playerStunned).toBe(true)
      // Mana should NOT be spent
      expect(result.newMana.arcane).toBe(50)
    })

    it('frozen player cannot cast', () => {
      const state = initNeutralCombat('wolf', 100)
      state.playerStatusEffects = { ...EMPTY_STATUS, frozen: 2 }
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { magicArrow: 3 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'magicArrow',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      expect(result.spellDamage).toBe(0)
      expect(result.playerStunned).toBe(true)
      expect(result.newMana.arcane).toBe(50)
    })

    it('stunned defender still takes spell damage (does not prevent targeting)', () => {
      const state = initNeutralCombat('wolf', 100)
      state.defenderStatusEffects = { ...EMPTY_STATUS, stun: 3 }
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { magicArrow: 3 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'magicArrow',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      expect(result.spellDamage).toBeGreaterThan(0)
      expect(result.defenderStunned).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // Defender counterattack
  // ---------------------------------------------------------------------------

  describe('defender counterattack', () => {
    it('defender attacks player after spell cast', () => {
      const state = initNeutralCombat('wolf', 100)
      // Set wolf HP high enough to survive the spell
      state.defenderHp = 500
      const player = makePlayer({ armor: 0 })
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { magicArrow: 1 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'magicArrow',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      // Player should take some damage from the wolf attack
      expect(result.playerHp).toBeLessThan(100)
    })

    it('defender does not attack if defeated by spell', () => {
      const state = initNeutralCombat('wolf', 100)
      // Use high power to kill the wolf
      const player = makePlayer({ power: 50 })
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { magicArrow: 10 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'magicArrow',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      expect(result.defenderDefeated).toBe(true)
      // Player should still be at full HP (no counterattack)
      expect(result.playerHp).toBe(100)
    })

    it('stunned defender does not attack back', () => {
      const state = initNeutralCombat('wolf', 100)
      state.defenderStatusEffects = { ...EMPTY_STATUS, stun: 3 }
      state.defenderHp = 500
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { magicArrow: 1 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'magicArrow',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      // Player should not take any melee damage from stunned defender
      expect(result.playerHp).toBe(100)
      expect(result.defenderStunned).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // Companion behavior
  // ---------------------------------------------------------------------------

  describe('companion behavior', () => {
    it('living companions still melee attack defender during spell round', () => {
      const state = initNeutralCombat('wolf', 100)
      state.defenderHp = 500 // High HP so defender survives
      state.companions = [makeCompanion()]
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { magicArrow: 1 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'magicArrow',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      expect(result.companionResults).toHaveLength(1)
      expect(result.companionResults[0]!.damageDealt).toBeGreaterThan(0)
    })

    it('stunned companion does not attack', () => {
      const state = initNeutralCombat('wolf', 100)
      state.defenderHp = 500
      state.companions = [makeCompanion({ statusEffects: { ...EMPTY_STATUS, stun: 3 } })]
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { magicArrow: 1 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'magicArrow',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      expect(result.companionResults).toHaveLength(1)
      expect(result.companionResults[0]!.stunned).toBe(true)
      expect(result.companionResults[0]!.damageDealt).toBe(0)
    })

    it('dead companion does not attack', () => {
      const state = initNeutralCombat('wolf', 100)
      state.defenderHp = 500
      state.companions = [makeCompanion({ currentHp: 0, alive: false })]
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { magicArrow: 1 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'magicArrow',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      expect(result.companionResults).toHaveLength(1)
      expect(result.companionResults[0]!.alive).toBe(false)
      expect(result.companionResults[0]!.damageDealt).toBe(0)
    })
  })

  // ---------------------------------------------------------------------------
  // Validation failures
  // ---------------------------------------------------------------------------

  describe('validation failures', () => {
    it('unknown spell (not in spellbook) -> no cast, no mana spent', () => {
      const state = initNeutralCombat('wolf', 100)
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      // fireball is NOT in the spellbook
      const spellbook = { magicArrow: 3 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'fireball',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      expect(result.spellDamage).toBe(0)
      // All mana types should be unchanged
      expect(result.newMana.arcane).toBe(50)
      expect(result.newMana.fire).toBe(0)
    })

    it('not enough mana -> no cast, mana unchanged', () => {
      const state = initNeutralCombat('wolf', 100)
      const player = makePlayer()
      // magicArrow costs 10 arcane, only 5 available
      const mana: ManaPool = { ...emptyMana(), arcane: 5 }
      const spellbook = { magicArrow: 3 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'magicArrow',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      expect(result.spellDamage).toBe(0)
      expect(result.newMana.arcane).toBe(5)
    })
  })

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  describe('edge cases', () => {
    it('defender defeated by companion attacks after spell', () => {
      const state = initNeutralCombat('wolf', 100)
      // Wolf has 13 HP. Use low power so spell alone doesn't kill.
      // Give companion high damage to finish the wolf.
      state.defenderHp = 13
      state.companions = [makeCompanion({ diceCount: 5, diceSides: 10, attacksPerRound: 3 })]
      const player = makePlayer({ power: 2 })
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { magicArrow: 1 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'magicArrow',
        spellbook,
        mana,
        { type: 'hostile' },
        lowRng,
      )

      // Defender should be defeated (by spell + companion damage combined)
      expect(result.defenderDefeated).toBe(true)
      expect(result.defenderHp).toBe(0)
    })

    it('player defeated by defender counterattack after casting', () => {
      const state = initNeutralCombat('wolf', 100)
      state.defenderHp = 500
      // Give wolf high damage; give player low HP
      state.defenderDiceCount = 10
      state.defenderDiceSides = 20
      state.defenderBonusDamage = 50
      state.defenderAttacksPerRound = 5
      const player = makePlayer({ hp: 1, armor: 0 })
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { magicArrow: 1 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'magicArrow',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      // Spell should have fired (damage > 0)
      expect(result.spellDamage).toBeGreaterThan(0)
      // But player should be defeated by the counterattack
      expect(result.playerHp).toBe(0)
      expect(result.playerDefeated).toBe(true)
    })

    it('all outputs are populated correctly', () => {
      const state = initNeutralCombat('wolf', 100)
      state.defenderHp = 500
      state.companions = [makeCompanion()]
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { magicArrow: 3 }

      const result: SpellCombatResult = resolveCombatSpellRound(
        state,
        player,
        'magicArrow',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      // Core spell fields
      expect(result.spellKey).toBe('magicArrow')
      expect(typeof result.spellDamage).toBe('number')
      expect(typeof result.vampiricHealing).toBe('number')

      // HP fields
      expect(typeof result.playerHp).toBe('number')
      expect(typeof result.defenderHp).toBe('number')
      expect(typeof result.defenderDefeated).toBe('boolean')
      expect(typeof result.playerDefeated).toBe('boolean')

      // Mana
      expect(result.newMana).toBeDefined()
      expect(typeof result.newMana.arcane).toBe('number')

      // Buff/summon fields (should be undefined for damage spell)
      expect(result.buffApplied).toBeUndefined()
      expect(result.summonsCreated).toBeUndefined()

      // Companion results
      expect(result.companionResults).toHaveLength(1)
      expect(result.newCompanions).toHaveLength(1)

      // Status effect tracking
      expect(result.statusEffectDamage).toBeDefined()
      expect(typeof result.statusEffectDamage.player).toBe('number')
      expect(typeof result.statusEffectDamage.defender).toBe('number')
      expect(result.appliedEffects).toBeDefined()
      expect(Array.isArray(result.appliedEffects)).toBe(true)

      // Status outputs
      expect(result.newPlayerStatus).toBeDefined()
      expect(result.newDefenderStatus).toBeDefined()
      expect(typeof result.playerStunned).toBe('boolean')
      expect(typeof result.defenderStunned).toBe('boolean')

      // New targeting fields
      expect(Array.isArray(result.immuneDefenders)).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // Spell targeting
  // ---------------------------------------------------------------------------

  describe('spell targeting', () => {
    it('friendly-target heal on self sets buffTarget to player', () => {
      const state = initNeutralCombat('wolf', 100)
      state.defenderHp = 500
      const player = makePlayer({ hp: 50 })
      const mana: ManaPool = { ...emptyMana(), life: 50 }
      const spellbook = { heal: 3 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'heal',
        spellbook,
        mana,
        { type: 'self' },
        fixedRng,
      )

      expect(result.buffApplied).toBeDefined()
      expect(result.buffApplied!.healAmount).toBeGreaterThan(0)
      expect(result.buffTarget).toBe('player')
    })

    it('friendly-target armor on companion sets buffTarget correctly', () => {
      const state = initNeutralCombat('wolf', 100)
      state.defenderHp = 500
      state.companions = [makeCompanion({ name: 'Wolf' })]
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), earth: 50 }
      const spellbook = { armor: 2 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'armor',
        spellbook,
        mana,
        { type: 'friendly', companionIndex: 0 },
        fixedRng,
      )

      expect(result.buffApplied).toBeDefined()
      expect(result.buffApplied!.armorBonus).toBeGreaterThan(0)
      expect(result.buffTarget).toBe('companion:Wolf')
    })

    it('elemental immunity nullifies fire spell damage', () => {
      const state = initNeutralCombat('wolf', 100)
      state.defenderHp = 500
      // Set fire immunity on defender
      state.defenderImmunities = { ...EMPTY_IMMUNITIES, fire: 1 }
      const player = makePlayer({ power: 10 })
      const mana: ManaPool = { ...emptyMana(), fire: 50 }
      const spellbook = { fireBolt: 3 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'fireBolt',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      expect(result.spellDamage).toBe(0)
      expect(result.immuneDefenders).toContain('wolf')
      // Mana still spent
      expect(result.newMana.fire).toBe(30)
    })

    it('stun still prevents casting for all spell types', () => {
      const state = initNeutralCombat('wolf', 100)
      state.playerStatusEffects = { ...EMPTY_STATUS, stun: 3 }
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), earth: 50 }
      const spellbook = { armor: 3 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'armor',
        spellbook,
        mana,
        { type: 'self' },
        fixedRng,
      )

      expect(result.buffApplied).toBeUndefined()
      expect(result.playerStunned).toBe(true)
      expect(result.newMana.earth).toBe(50)
    })
  })

  // ---------------------------------------------------------------------------
  // Fortified spell combat
  // ---------------------------------------------------------------------------

  describe('fortified spell combat', () => {
    // Helper: create a fortified state with gate + 1 archer + wolf as land defender
    // fortGate: hp=15, diceCount=0, armor=1, strength=0, dexterity=0, power=1
    //   immunities: cold=1, poison=1, bleeding=1
    // archer: hp=9, diceCount=1, diceSides=4, bonusDamage=11, armor=0,
    //   strength=2, dexterity=3, power=2
    // wolf: hp=13, diceCount=1, diceSides=4, bonusDamage=-1, armor=0,
    //   strength=2, dexterity=3, power=1
    function makeFortState() {
      return initFortifiedCombat('fortGate', 'archer', 1, 'wolf', 100)
    }

    // -----------------------------------------------------------------------
    // BUG 3: Status tick should tick individual defender status effects
    // -----------------------------------------------------------------------

    describe('per-defender status tick', () => {
      it('ticks each living defender status effects individually', () => {
        const state = makeFortState()
        // Apply bleeding to archer (index 1) only -- gate and wolf have none
        state.defenders[1]!.statusEffects = { ...EMPTY_STATUS, bleeding: 10 }
        const player = makePlayer({ power: 1 })
        const mana: ManaPool = { ...emptyMana(), arcane: 50 }
        const spellbook = { magicArrow: 1 }

        const result = resolveCombatSpellRound(
          state,
          player,
          'magicArrow',
          spellbook,
          mana,
          { type: 'hostile', defenderIndex: 0 },
          fixedRng,
        )

        // The archer (index 1) should have taken status tick damage
        const archerDef = result.newDefenders[1]!
        // bleeding=10 should have dealt damage, reducing archer HP below max (9)
        expect(archerDef.currentHp).toBeLessThan(9)
      })

      it('uses each defender own strength for status tick (not gate strength)', () => {
        const state = makeFortState()
        // Apply burning to wolf (index 2) -- wolf has strength=2, gate has strength=0
        // Burning damage = burning amount, decay depends on strength
        state.defenders[2]!.statusEffects = { ...EMPTY_STATUS, burning: 5 }
        const player = makePlayer({ power: 1 })
        const mana: ManaPool = { ...emptyMana(), arcane: 50 }
        const spellbook = { magicArrow: 1 }

        const result = resolveCombatSpellRound(
          state,
          player,
          'magicArrow',
          spellbook,
          mana,
          { type: 'hostile', defenderIndex: 0 },
          fixedRng,
        )

        // Wolf (index 2) should have taken burning damage = 5
        const wolfDef = result.newDefenders[2]!
        expect(wolfDef.currentHp).toBeLessThan(13)
        // Burning decay uses wolf strength (2), not gate strength (0)
        // With strength=2, calcBurningDecay should produce a different value
        // than with strength=0. The new burning value should reflect wolf's strength.
        expect(wolfDef.statusEffects.burning).toBeLessThan(5)
      })

      it('defender killed by status tick is marked not alive in newDefenders', () => {
        const state = makeFortState()
        // Archer has hp=9, give it massive burning to kill it
        state.defenders[1]!.statusEffects = { ...EMPTY_STATUS, burning: 100 }
        const player = makePlayer({ power: 1 })
        const mana: ManaPool = { ...emptyMana(), arcane: 50 }
        const spellbook = { magicArrow: 1 }

        const result = resolveCombatSpellRound(
          state,
          player,
          'magicArrow',
          spellbook,
          mana,
          { type: 'hostile', defenderIndex: 0 },
          fixedRng,
        )

        // Archer should be dead from status tick
        expect(result.newDefenders[1]!.alive).toBe(false)
        expect(result.newDefenders[1]!.currentHp).toBe(0)
      })
    })

    // -----------------------------------------------------------------------
    // BUG 1: Companion melee should target per-defender, with behind-wall
    // -----------------------------------------------------------------------

    describe('companion melee targeting in fortified combat', () => {
      it('companions use per-defender defense stats (not flat gate stats)', () => {
        const state = makeFortState()
        // Kill the gate so companions can reach other defenders
        state.defenders[0]!.alive = false
        state.defenders[0]!.currentHp = 0
        // Give archer (index 1) high armor to test per-defender stats
        state.defenders[1]!.armor = 50
        state.defenders[1]!.currentHp = 500

        const comp = makeCompanion({
          diceCount: 2,
          diceSides: 6,
          attacksPerRound: 3,
          strength: 10,
          dexterity: 10,
        })
        state.companions = [comp]

        const player = makePlayer({ power: 1 })
        const mana: ManaPool = { ...emptyMana(), arcane: 50 }
        const spellbook = { magicArrow: 1 }

        const result = resolveCombatSpellRound(
          state,
          player,
          'magicArrow',
          spellbook,
          mana,
          { type: 'hostile', defenderIndex: 1 },
          lowRng,
        )

        // Companion should have attacked a specific defender, dealing damage
        // reflected in newDefenders (not just flat defenderHp)
        const archerAfter = result.newDefenders[1]!
        // With armor=50, the companion's damage should be heavily reduced
        // The key assertion: companion damage shows up on the actual defender snapshot
        expect(result.companionResults[0]!.damageDealt).toBeGreaterThanOrEqual(0)
        // Archer HP in newDefenders should reflect the companion's attack
        expect(archerAfter.currentHp).toBeLessThan(500)
      })

      it('companions are forced to attack gate while gate is alive (behind-wall)', () => {
        const state = makeFortState()
        // Gate is alive at index 0 with hp=15
        const comp = makeCompanion({
          diceCount: 2,
          diceSides: 6,
          attacksPerRound: 1,
          strength: 5,
          dexterity: 5,
        })
        state.companions = [comp]

        const player = makePlayer({ power: 1 })
        const mana: ManaPool = { ...emptyMana(), arcane: 50 }
        const spellbook = { magicArrow: 1 }

        const result = resolveCombatSpellRound(
          state,
          player,
          'magicArrow',
          spellbook,
          mana,
          { type: 'hostile', defenderIndex: 0 },
          lowRng,
        )

        // Gate should have taken companion melee damage
        const gateAfter = result.newDefenders[0]!
        expect(gateAfter.currentHp).toBeLessThan(15)
        // Archer and wolf should be untouched by companion melee
        expect(result.newDefenders[1]!.currentHp).toBe(9)
        expect(result.newDefenders[2]!.currentHp).toBe(13)
      })

      it('companion damage is reflected in newDefenders (not just flat defenderHp)', () => {
        const state = makeFortState()
        // Kill gate, leave only archer (index 1) alive with low hp
        state.defenders[0]!.alive = false
        state.defenders[0]!.currentHp = 0
        state.defenders[2]!.alive = false
        state.defenders[2]!.currentHp = 0

        const comp = makeCompanion({
          diceCount: 3,
          diceSides: 10,
          attacksPerRound: 3,
          strength: 10,
        })
        state.companions = [comp]
        state.defenders[1]!.currentHp = 100

        const player = makePlayer({ power: 1 })
        const mana: ManaPool = { ...emptyMana(), arcane: 50 }
        const spellbook = { magicArrow: 1 }

        const result = resolveCombatSpellRound(
          state,
          player,
          'magicArrow',
          spellbook,
          mana,
          { type: 'hostile', defenderIndex: 1 },
          lowRng,
        )

        // newDefenders should show the archer with reduced HP from companion attack
        const archerAfter = result.newDefenders[1]!
        expect(archerAfter.currentHp).toBeLessThan(100)
      })
    })

    // -----------------------------------------------------------------------
    // BUG 2: Defender counterattack should use per-defender stats
    // -----------------------------------------------------------------------

    describe('per-defender counterattack', () => {
      it('each living non-gate defender counterattacks with own stats', () => {
        const state = makeFortState()
        // All defenders alive, gate has diceCount=0 so it never attacks
        // archer: diceCount=1, diceSides=4, bonusDamage=11
        // wolf: diceCount=1, diceSides=4, bonusDamage=-1
        const player = makePlayer({ hp: 500, armor: 0, power: 1 })
        const mana: ManaPool = { ...emptyMana(), arcane: 50 }
        const spellbook = { magicArrow: 1 }

        const result = resolveCombatSpellRound(
          state,
          player,
          'magicArrow',
          spellbook,
          mana,
          { type: 'hostile', defenderIndex: 0 },
          fixedRng,
        )

        // Player should take damage from both archer AND wolf (not just one defender using gate stats)
        // Gate has diceCount=0 so it should NOT attack
        // With fixedRng=0.5 and no companions, all attacks target the player
        // archer deals: 1d4+11 = about 13-14 damage
        // wolf deals: 1d4-1 = about 1-2 damage
        // Combined should be around 14-16
        expect(result.playerHp).toBeLessThan(500)

        // The total damage should be more than what a single gate attack (0 dice) would do
        const damageTaken = 500 - result.playerHp
        expect(damageTaken).toBeGreaterThan(0)
      })

      it('gate (diceCount=0) never counterattacks', () => {
        const state = makeFortState()
        // Kill archer and wolf, leave only gate alive
        state.defenders[1]!.alive = false
        state.defenders[1]!.currentHp = 0
        state.defenders[2]!.alive = false
        state.defenders[2]!.currentHp = 0

        const player = makePlayer({ hp: 100, armor: 0, power: 1 })
        const mana: ManaPool = { ...emptyMana(), arcane: 50 }
        const spellbook = { magicArrow: 1 }

        const result = resolveCombatSpellRound(
          state,
          player,
          'magicArrow',
          spellbook,
          mana,
          { type: 'hostile', defenderIndex: 0 },
          fixedRng,
        )

        // Gate has diceCount=0 so player should take no counterattack damage
        expect(result.playerHp).toBe(100)
      })

      it('stunned defender does not counterattack in fortified combat', () => {
        const state = makeFortState()
        // Stun the archer (index 1) and wolf (index 2)
        state.defenders[1]!.statusEffects = { ...EMPTY_STATUS, stun: 3 }
        state.defenders[2]!.statusEffects = { ...EMPTY_STATUS, stun: 3 }

        const player = makePlayer({ hp: 100, armor: 0, power: 1 })
        const mana: ManaPool = { ...emptyMana(), arcane: 50 }
        const spellbook = { magicArrow: 1 }

        const result = resolveCombatSpellRound(
          state,
          player,
          'magicArrow',
          spellbook,
          mana,
          { type: 'hostile', defenderIndex: 0 },
          fixedRng,
        )

        // No defender can attack: gate has diceCount=0, archer+wolf are stunned
        expect(result.playerHp).toBe(100)
      })

      it('defenders target random pool of player + living companions', () => {
        const state = makeFortState()
        // Give archer high damage so we can verify companion takes hits too
        state.defenders[1]!.diceCount = 3
        state.defenders[1]!.diceSides = 10
        state.defenders[1]!.bonusDamage = 20
        state.defenders[1]!.attacksPerRound = 5

        const comp = makeCompanion({ currentHp: 500, maxHp: 500 })
        state.companions = [comp]

        const player = makePlayer({ hp: 500, armor: 0, power: 1 })
        const mana: ManaPool = { ...emptyMana(), arcane: 50 }
        const spellbook = { magicArrow: 1 }

        // Use rng that alternates targets: 0.75 picks index 1 from pool of 2
        let callCount = 0
        const alternatingRng = () => {
          callCount++
          return callCount % 2 === 0 ? 0.75 : 0.1
        }

        const result = resolveCombatSpellRound(
          state,
          player,
          'magicArrow',
          spellbook,
          mana,
          { type: 'hostile', defenderIndex: 0 },
          alternatingRng,
        )

        // With multiple high-damage attacks and alternating targeting,
        // both player and companion should take damage
        const playerDamage = 500 - result.playerHp
        const compDamage = 500 - result.newCompanions[0]!.currentHp
        // At least one should have taken damage from per-defender attacks
        expect(playerDamage + compDamage).toBeGreaterThan(0)
      })
    })

    // -----------------------------------------------------------------------
    // BUG 4: Gate destruction should clear behindWall
    // -----------------------------------------------------------------------

    describe('gate destruction clears behindWall', () => {
      it('spell killing gate clears behindWall on remaining defenders', () => {
        const state = makeFortState()
        // fortGate has hp=15, use high power to kill it
        const player = makePlayer({ power: 50 })
        const mana: ManaPool = { ...emptyMana(), arcane: 50 }
        const spellbook = { magicArrow: 10 }

        const result = resolveCombatSpellRound(
          state,
          player,
          'magicArrow',
          spellbook,
          mana,
          { type: 'hostile', defenderIndex: 0 },
          fixedRng,
        )

        // Gate should be dead
        expect(result.newDefenders[0]!.alive).toBe(false)
        // Remaining defenders should have behindWall cleared
        expect(result.newDefenders[1]!.behindWall).toBe(false)
        expect(result.newDefenders[2]!.behindWall).toBe(false)
      })

      it('companion melee killing gate clears behindWall', () => {
        const state = makeFortState()
        // Use a weak spell that won't kill the gate, but a strong companion will
        // Gate has hp=15, armor=1
        const comp = makeCompanion({
          diceCount: 5,
          diceSides: 10,
          attacksPerRound: 3,
          strength: 10,
          dexterity: 10,
        })
        state.companions = [comp]

        const player = makePlayer({ power: 1 })
        const mana: ManaPool = { ...emptyMana(), arcane: 50 }
        const spellbook = { magicArrow: 1 }

        const result = resolveCombatSpellRound(
          state,
          player,
          'magicArrow',
          spellbook,
          mana,
          { type: 'hostile', defenderIndex: 0 },
          lowRng,
        )

        // Gate should be dead (companion dealt enough damage)
        expect(result.newDefenders[0]!.alive).toBe(false)
        // Remaining defenders should have behindWall cleared
        expect(result.newDefenders[1]!.behindWall).toBe(false)
        expect(result.newDefenders[2]!.behindWall).toBe(false)
      })

      it('AoE spell kills gate and clears behindWall', () => {
        const state = makeFortState()
        // fireball: canTargetGroup=true, manaType=fire, basePower=6, manaCost=40
        // Use high power to ensure gate dies from AoE
        const player = makePlayer({ power: 50 })
        const mana: ManaPool = { ...emptyMana(), fire: 50 }
        const spellbook = { fireball: 10 }

        const result = resolveCombatSpellRound(
          state,
          player,
          'fireball',
          spellbook,
          mana,
          { type: 'hostile' },
          fixedRng,
        )

        // Gate should be dead from AoE
        expect(result.newDefenders[0]!.alive).toBe(false)
        // Behind wall should be cleared
        expect(result.newDefenders[1]!.behindWall).toBe(false)
        expect(result.newDefenders[2]!.behindWall).toBe(false)
      })
    })
  })

  // -------------------------------------------------------------------------
  // Dispel Magic in combat
  // -------------------------------------------------------------------------

  describe('dispelMagic', () => {
    it('self target clears player status effects', () => {
      const state = initNeutralCombat('wolf', 100)
      state.playerStatusEffects = { bleeding: 3, stun: 0, poison: 2, frozen: 0, burning: 1 }
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { dispelMagic: 1 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'dispelMagic',
        spellbook,
        mana,
        { type: 'self' },
        fixedRng,
      )

      expect(result.newPlayerStatus.bleeding).toBe(0)
      expect(result.newPlayerStatus.poison).toBe(0)
      expect(result.newPlayerStatus.burning).toBe(0)
    })

    it('hostile target clears defender status effects (non-fortified)', () => {
      const state = initNeutralCombat('wolf', 100)
      state.defenderStatusEffects = { bleeding: 0, stun: 2, poison: 0, frozen: 3, burning: 0 }
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { dispelMagic: 1 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'dispelMagic',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      expect(result.newDefenderStatus.stun).toBe(0)
      expect(result.newDefenderStatus.frozen).toBe(0)
    })

    it('friendly target clears companion status effects', () => {
      const state = initNeutralCombat('wolf', 100)
      // Manually add a companion snapshot with status effects
      const comp = makeCompanion()
      comp.statusEffects = { bleeding: 2, stun: 0, poison: 1, frozen: 0, burning: 0 }
      state.companions = [comp]
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { dispelMagic: 1 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'dispelMagic',
        spellbook,
        mana,
        { type: 'friendly', companionIndex: 0 },
        fixedRng,
      )

      const clearedComp = result.newCompanions[0]!
      expect(clearedComp.statusEffects.bleeding).toBe(0)
      expect(clearedComp.statusEffects.poison).toBe(0)
    })

    it('hostile target clears all living defenders in fortified combat', () => {
      const state = initFortifiedCombat('fortGate', 'archer', 1, 'wolf', 100)
      // Set status effects on all defenders
      for (const def of state.defenders) {
        def.statusEffects = { bleeding: 1, stun: 1, poison: 1, frozen: 1, burning: 1 }
      }
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { dispelMagic: 1 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'dispelMagic',
        spellbook,
        mana,
        { type: 'hostile' },
        fixedRng,
      )

      for (const def of result.newDefenders) {
        if (def.alive) {
          expect(def.statusEffects.bleeding).toBe(0)
          expect(def.statusEffects.stun).toBe(0)
          expect(def.statusEffects.poison).toBe(0)
          expect(def.statusEffects.frozen).toBe(0)
          expect(def.statusEffects.burning).toBe(0)
        }
      }
    })

    it('deducts mana cost', () => {
      const state = initNeutralCombat('wolf', 100)
      const player = makePlayer()
      const mana: ManaPool = { ...emptyMana(), arcane: 50 }
      const spellbook = { dispelMagic: 1 }

      const result = resolveCombatSpellRound(
        state,
        player,
        'dispelMagic',
        spellbook,
        mana,
        { type: 'self' },
        fixedRng,
      )

      // dispelMagic costs 6 arcane mana
      expect(result.newMana.arcane).toBe(44)
    })
  })
})
