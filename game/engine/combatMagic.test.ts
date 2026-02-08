import { describe, expect, it } from 'vitest'
import { resolveCombatSpellRound } from './combatMagic'
import type { SpellCombatResult } from './combatMagic'
import { initNeutralCombat, EMPTY_STATUS, EMPTY_IMMUNITIES } from './combat'
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
})
