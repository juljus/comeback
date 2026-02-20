import { describe, expect, it } from 'vitest'
import { SPELLS } from '../data'
import type { ManaPool } from '../types/mana'
import {
  calcSpellDamage,
  calcBuffEffect,
  calcSummonResult,
  validateCast,
  deductManaCost,
  calcGoldGeneration,
} from './magic'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** RNG that always returns 0.5 -- randomInt(min, max) = min + floor(0.5*(max-min+1)) */
const fixedRng = () => 0.5

/** RNG that always returns 0.0 -- randomInt(min, max) = min */
const lowRng = () => 0.0

/** RNG that returns just under 1.0 -- randomInt(min, max) = max */
const highRng = () => 0.999

/** Helper to build a zeroed mana pool */
function emptyMana(): ManaPool {
  return { fire: 0, earth: 0, air: 0, water: 0, death: 0, life: 0, arcane: 0 }
}

// ---------------------------------------------------------------------------
// calcSpellDamage
// ---------------------------------------------------------------------------
// Formula: floor((spellLevel * basePower + rand(0, floor(casterPower/2)-1)) * casterPower / targetPower - rand(0, targetPower-1))
// Min 0. vampiricHealing = floor(damage * vampiricPercent / 100)

describe('calcSpellDamage', () => {
  it('basic damage calc with magicArrow (rng=0.5)', () => {
    // spellLevel=3, basePower=7, casterPower=10, targetPower=5
    // rand1 = rand(0, floor(10/2)-1) = rand(0,4) = 0+floor(0.5*5) = 2
    // rand2 = rand(0, 4) = 2
    // floor((3*7+2)*10/5 - 2) = floor(23*2 - 2) = 44
    const result = calcSpellDamage({
      spellLevel: 3,
      basePower: SPELLS.magicArrow.basePower,
      casterPower: 10,
      targetPower: 5,
      vampiricPercent: 0,
      rng: fixedRng,
    })
    expect(result.damage).toBe(44)
    expect(result.vampiricHealing).toBe(0)
  })

  it('high level scaling increases damage', () => {
    // spellLevel=8, basePower=7, casterPower=10, targetPower=5
    // rand1 = 2 (same rng), rand2 = 2
    // floor((8*7+2)*10/5 - 2) = floor(58*2 - 2) = 114
    const result = calcSpellDamage({
      spellLevel: 8,
      basePower: 7,
      casterPower: 10,
      targetPower: 5,
      vampiricPercent: 0,
      rng: fixedRng,
    })
    expect(result.damage).toBe(114)
  })

  it('vampiric healing with deathGrasp (25%)', () => {
    // spellLevel=3, basePower=7, casterPower=10, targetPower=5, vampiricPercent=25
    // damage = 44 (same as first test)
    // vampiricHealing = floor(44 * 25 / 100) = floor(11) = 11
    const result = calcSpellDamage({
      spellLevel: 3,
      basePower: SPELLS.deathGrasp.basePower,
      casterPower: 10,
      targetPower: 5,
      vampiricPercent: SPELLS.deathGrasp.vampiricPercent,
      rng: fixedRng,
    })
    expect(result.damage).toBe(44)
    expect(result.vampiricHealing).toBe(11)
  })

  it('zero vampiric percent yields no healing', () => {
    const result = calcSpellDamage({
      spellLevel: 2,
      basePower: 7,
      casterPower: 6,
      targetPower: 4,
      vampiricPercent: 0,
      rng: fixedRng,
    })
    expect(result.vampiricHealing).toBe(0)
  })

  it('damage clamped to minimum 0 when target power overwhelms', () => {
    // spellLevel=1, basePower=1, casterPower=1, targetPower=100
    // rand1 = rand(0, floor(1/2)-1) = rand(0, -1) -> 0 (empty range)
    // rand2 = rand(0, 99) = 0+floor(0.5*100) = 50
    // floor((1*1+0)*1/100 - 50) = floor(0.01 - 50) = -50 -> clamped to 0
    const result = calcSpellDamage({
      spellLevel: 1,
      basePower: 1,
      casterPower: 1,
      targetPower: 100,
      vampiricPercent: 25,
      rng: fixedRng,
    })
    expect(result.damage).toBe(0)
    expect(result.vampiricHealing).toBe(0)
  })

  it('low rng rolls produce minimum random values', () => {
    // spellLevel=2, basePower=7, casterPower=10, targetPower=5
    // rand1 = rand(0,4) with lowRng = 0
    // rand2 = rand(0,4) with lowRng = 0
    // floor((2*7+0)*10/5 - 0) = floor(14*2) = 28
    const result = calcSpellDamage({
      spellLevel: 2,
      basePower: 7,
      casterPower: 10,
      targetPower: 5,
      vampiricPercent: 0,
      rng: lowRng,
    })
    expect(result.damage).toBe(28)
  })

  it('high rng rolls produce maximum random values', () => {
    // spellLevel=2, basePower=7, casterPower=10, targetPower=5
    // rand1 = rand(0,4) with highRng = 4
    // rand2 = rand(0,4) with highRng = 4
    // floor((2*7+4)*10/5 - 4) = floor(18*2 - 4) = 32
    const result = calcSpellDamage({
      spellLevel: 2,
      basePower: 7,
      casterPower: 10,
      targetPower: 5,
      vampiricPercent: 0,
      rng: highRng,
    })
    expect(result.damage).toBe(32)
  })

  it('level 1 spell with equal power yields positive damage', () => {
    // spellLevel=1, basePower=7, casterPower=5, targetPower=5
    // rand1 = rand(0, floor(5/2)-1) = rand(0,1) = 0+floor(0.5*2)=1
    // rand2 = rand(0,4) = 2
    // floor((1*7+1)*5/5 - 2) = floor(8 - 2) = 6
    const result = calcSpellDamage({
      spellLevel: 1,
      basePower: 7,
      casterPower: 5,
      targetPower: 5,
      vampiricPercent: 0,
      rng: fixedRng,
    })
    expect(result.damage).toBe(6)
  })

  it('fireball aoe spell uses same formula', () => {
    // spellLevel=2, basePower=6 (fireball), casterPower=8, targetPower=4
    // rand1 = rand(0, floor(8/2)-1) = rand(0,3) = 0+floor(0.5*4)=2
    // rand2 = rand(0,3) = 0+floor(0.5*4)=2
    // floor((2*6+2)*8/4 - 2) = floor(14*2 - 2) = 26
    const result = calcSpellDamage({
      spellLevel: 2,
      basePower: SPELLS.fireball.basePower,
      casterPower: 8,
      targetPower: 4,
      vampiricPercent: 0,
      rng: fixedRng,
    })
    expect(result.damage).toBe(26)
  })
})

// ---------------------------------------------------------------------------
// calcBuffEffect
// ---------------------------------------------------------------------------

describe('calcBuffEffect', () => {
  it('armor buff: bonus = spellLevel + floor(power/2), duration = 2 + power*power', () => {
    const result = calcBuffEffect({
      spellKey: 'armor',
      spellLevel: 3,
      casterPower: 6,
      spell: SPELLS.armor,
    })
    // bonus = 3 + floor(6/2) = 3+3 = 6
    // duration = 2 + 6*6 = 38
    expect(result.spellKey).toBe('armor')
    expect(result.armorBonus).toBe(6)
    expect(result.duration).toBe(38)
    // Other bonuses should be 0
    expect(result.hasteBonus).toBe(0)
    expect(result.strengthBonus).toBe(0)
    expect(result.windsPower).toBe(0)
    expect(result.healAmount).toBe(0)
  })

  it('haste buff: extra = spellLevel + floor(power/8), duration = 2 + power', () => {
    const result = calcBuffEffect({
      spellKey: 'haste',
      spellLevel: 2,
      casterPower: 16,
      spell: SPELLS.haste,
    })
    // extra = 2 + floor(16/8) = 2+2 = 4
    // duration = 2 + 16 = 18
    expect(result.hasteBonus).toBe(4)
    expect(result.duration).toBe(18)
    expect(result.armorBonus).toBe(0)
    expect(result.strengthBonus).toBe(0)
  })

  it('unholy strength: str = 2*spellLevel + floor(power/10), duration = 2 + power*power', () => {
    const result = calcBuffEffect({
      spellKey: 'unholyStrength',
      spellLevel: 4,
      casterPower: 20,
      spell: SPELLS.unholyStrength,
    })
    // str = 2*4 + floor(20/10) = 8+2 = 10
    // duration = 2 + 20*20 = 402
    expect(result.strengthBonus).toBe(10)
    expect(result.duration).toBe(402)
    expect(result.armorBonus).toBe(0)
    expect(result.hasteBonus).toBe(0)
  })

  it('heal: amount = spellLevel * power * 3, duration = 0 (instant)', () => {
    const result = calcBuffEffect({
      spellKey: 'heal',
      spellLevel: 3,
      casterPower: 8,
      spell: SPELLS.heal,
    })
    // amount = 3 * 8 * 3 = 72
    expect(result.healAmount).toBe(72)
    expect(result.duration).toBe(0)
    expect(result.armorBonus).toBe(0)
  })

  it('manipulate winds: strength = spellLevel + floor(power/2), duration = power - 1', () => {
    const result = calcBuffEffect({
      spellKey: 'manipulateWinds',
      spellLevel: 2,
      casterPower: 10,
      spell: SPELLS.manipulateWinds,
    })
    // strength = 2 + floor(10/2) = 2+5 = 7
    // duration = 10 - 1 = 9
    expect(result.windsPower).toBe(7)
    expect(result.duration).toBe(9)
    expect(result.armorBonus).toBe(0)
    expect(result.hasteBonus).toBe(0)
  })

  it('spell with no buff flags returns all zeroes', () => {
    const result = calcBuffEffect({
      spellKey: 'magicArrow',
      spellLevel: 5,
      casterPower: 10,
      spell: SPELLS.magicArrow,
    })
    expect(result.armorBonus).toBe(0)
    expect(result.hasteBonus).toBe(0)
    expect(result.strengthBonus).toBe(0)
    expect(result.windsPower).toBe(0)
    expect(result.healAmount).toBe(0)
    expect(result.duration).toBe(0)
  })

  it('armor buff with low power still works', () => {
    const result = calcBuffEffect({
      spellKey: 'armor',
      spellLevel: 1,
      casterPower: 1,
      spell: SPELLS.armor,
    })
    // bonus = 1 + floor(1/2) = 1+0 = 1
    // duration = 2 + 1*1 = 3
    expect(result.armorBonus).toBe(1)
    expect(result.duration).toBe(3)
  })

  it('haste with low power gives minimal extra', () => {
    const result = calcBuffEffect({
      spellKey: 'haste',
      spellLevel: 1,
      casterPower: 1,
      spell: SPELLS.haste,
    })
    // extra = 1 + floor(1/8) = 1+0 = 1
    // duration = 2 + 1 = 3
    expect(result.hasteBonus).toBe(1)
    expect(result.duration).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// calcSummonResult
// ---------------------------------------------------------------------------

describe('calcSummonResult', () => {
  it('level 1 selects tier 0', () => {
    const result = calcSummonResult({
      spellLevel: 1,
      casterPower: 5,
      summonTiers: SPELLS.summonGolem.summonTiers,
    })
    // tier index = min(1-1, 3) = 0 -> clayGolem, count=1
    expect(result.creatureKey).toBe('clayGolem')
    expect(result.count).toBe(1)
  })

  it('level 2 selects tier 1', () => {
    const result = calcSummonResult({
      spellLevel: 2,
      casterPower: 5,
      summonTiers: SPELLS.summonGolem.summonTiers,
    })
    // tier index = min(2-1, 3) = 1 -> stoneGolem, count=2
    expect(result.creatureKey).toBe('stoneGolem')
    expect(result.count).toBe(2)
  })

  it('level 5 with 4 tiers caps at last tier (index 3)', () => {
    const result = calcSummonResult({
      spellLevel: 5,
      casterPower: 5,
      summonTiers: SPELLS.summonGolem.summonTiers,
    })
    // tier index = min(5-1, 3) = 3 -> steelGolem, count=4
    expect(result.creatureKey).toBe('steelGolem')
    expect(result.count).toBe(4)
  })

  it('duration = casterPower * 2', () => {
    const result = calcSummonResult({
      spellLevel: 1,
      casterPower: 7,
      summonTiers: SPELLS.summonGolem.summonTiers,
    })
    expect(result.duration).toBe(14)
  })

  it('level 1 has stat multiplier 1.0', () => {
    const result = calcSummonResult({
      spellLevel: 1,
      casterPower: 5,
      summonTiers: SPELLS.summonGolem.summonTiers,
    })
    expect(result.statMultiplier).toBe(1.0)
  })

  it('level 2 has stat multiplier 2.2', () => {
    // multiplier = (20 + (2-1)*2) / 10 = 22/10 = 2.2
    const result = calcSummonResult({
      spellLevel: 2,
      casterPower: 5,
      summonTiers: SPELLS.summonGolem.summonTiers,
    })
    expect(result.statMultiplier).toBeCloseTo(2.2)
  })

  it('level 4 has stat multiplier 2.6', () => {
    // multiplier = (20 + (4-1)*2) / 10 = 26/10 = 2.6
    const result = calcSummonResult({
      spellLevel: 4,
      casterPower: 5,
      summonTiers: SPELLS.summonGolem.summonTiers,
    })
    expect(result.statMultiplier).toBeCloseTo(2.6)
  })

  it('summonBeasts level 3 selects bear with count 4', () => {
    const result = calcSummonResult({
      spellLevel: 3,
      casterPower: 10,
      summonTiers: SPELLS.summonBeasts.summonTiers,
    })
    // tier index = min(3-1, 3) = 2 -> bear, count=4
    expect(result.creatureKey).toBe('bear')
    expect(result.count).toBe(4)
    expect(result.duration).toBe(20)
  })

  it('summonAngel level 4 caps at arcangel tier', () => {
    const result = calcSummonResult({
      spellLevel: 4,
      casterPower: 3,
      summonTiers: SPELLS.summonAngel.summonTiers,
    })
    // tier index = min(4-1, 3) = 3 -> arcangel, count=3
    expect(result.creatureKey).toBe('arcangel')
    expect(result.count).toBe(3)
    expect(result.duration).toBe(6)
  })
})

// ---------------------------------------------------------------------------
// validateCast
// ---------------------------------------------------------------------------

describe('validateCast', () => {
  it('returns canCast=true when spell is known and mana sufficient', () => {
    const result = validateCast({
      spellKey: 'magicArrow',
      spellbook: { magicArrow: 1 },
      mana: { ...emptyMana(), arcane: 10 },
      spell: SPELLS.magicArrow,
      inCombat: true,
    })
    expect(result.canCast).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('rejects unknown spell (not in spellbook)', () => {
    const result = validateCast({
      spellKey: 'fireball',
      spellbook: { magicArrow: 1 },
      mana: { ...emptyMana(), fire: 100 },
      spell: SPELLS.fireball,
      inCombat: true,
    })
    expect(result.canCast).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('rejects when not enough mana', () => {
    const result = validateCast({
      spellKey: 'fireball',
      spellbook: { fireball: 1 },
      mana: { ...emptyMana(), fire: 39 },
      spell: SPELLS.fireball,
      inCombat: true,
    })
    // fireball costs 40 fire mana, only 39 available
    expect(result.canCast).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('allows cast when mana exactly equals cost', () => {
    const result = validateCast({
      spellKey: 'fireball',
      spellbook: { fireball: 1 },
      mana: { ...emptyMana(), fire: 40 },
      spell: SPELLS.fireball,
      inCombat: true,
    })
    expect(result.canCast).toBe(true)
  })

  it('in combat: skips action check', () => {
    const result = validateCast({
      spellKey: 'magicArrow',
      spellbook: { magicArrow: 1 },
      mana: { ...emptyMana(), arcane: 10 },
      spell: SPELLS.magicArrow,
      actionsUsed: 2,
      inCombat: true,
    })
    expect(result.canCast).toBe(true)
  })

  it('overworld: rejects if actionsUsed > 0 (not full turn)', () => {
    const result = validateCast({
      spellKey: 'heal',
      spellbook: { heal: 1 },
      mana: { ...emptyMana(), life: 20 },
      spell: SPELLS.heal,
      actionsUsed: 1,
      inCombat: false,
    })
    expect(result.canCast).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('overworld: allows when actionsUsed is 0', () => {
    const result = validateCast({
      spellKey: 'heal',
      spellbook: { heal: 1 },
      mana: { ...emptyMana(), life: 20 },
      spell: SPELLS.heal,
      actionsUsed: 0,
      inCombat: false,
    })
    expect(result.canCast).toBe(true)
  })

  it('defaults inCombat to false if omitted', () => {
    const result = validateCast({
      spellKey: 'heal',
      spellbook: { heal: 1 },
      mana: { ...emptyMana(), life: 20 },
      spell: SPELLS.heal,
      actionsUsed: 1,
    })
    // Not in combat, actionsUsed=1 -> blocked
    expect(result.canCast).toBe(false)
  })

  it('checks the correct mana type for the spell', () => {
    // Has plenty of arcane but not enough death for deathGrasp
    const result = validateCast({
      spellKey: 'deathGrasp',
      spellbook: { deathGrasp: 1 },
      mana: { ...emptyMana(), arcane: 100, death: 24 },
      spell: SPELLS.deathGrasp,
      inCombat: true,
    })
    // deathGrasp costs 25 death, only 24 available
    expect(result.canCast).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// deductManaCost
// ---------------------------------------------------------------------------

describe('deductManaCost', () => {
  it('reduces the correct mana type by manaCost', () => {
    const mana: ManaPool = { ...emptyMana(), arcane: 50 }
    const result = deductManaCost(mana, SPELLS.magicArrow)
    // magicArrow costs 10 arcane
    expect(result.arcane).toBe(40)
  })

  it('does NOT mutate the original mana pool', () => {
    const mana: ManaPool = { ...emptyMana(), arcane: 50 }
    deductManaCost(mana, SPELLS.magicArrow)
    expect(mana.arcane).toBe(50)
  })

  it('other mana types remain unchanged', () => {
    const mana: ManaPool = {
      fire: 10,
      earth: 20,
      air: 30,
      water: 40,
      death: 50,
      life: 60,
      arcane: 70,
    }
    const result = deductManaCost(mana, SPELLS.fireball)
    // fireball costs 40 fire mana
    expect(result.fire).toBe(-30)
    expect(result.earth).toBe(20)
    expect(result.air).toBe(30)
    expect(result.water).toBe(40)
    expect(result.death).toBe(50)
    expect(result.life).toBe(60)
    expect(result.arcane).toBe(70)
  })

  it('works with death mana spells', () => {
    const mana: ManaPool = { ...emptyMana(), death: 30 }
    const result = deductManaCost(mana, SPELLS.deathGrasp)
    // deathGrasp costs 25 death
    expect(result.death).toBe(5)
  })

  it('can reduce mana to exactly 0', () => {
    const mana: ManaPool = { ...emptyMana(), life: 20 }
    const result = deductManaCost(mana, SPELLS.heal)
    // heal costs 20 life
    expect(result.life).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// calcGoldGeneration (VBA formula)
// ---------------------------------------------------------------------------
// VBA: ((Int(Rnd * 3 + 1) * 10) + power * 20) * (knowledge * knowledge)
// knowledge = spellLevel, power = casterPower
// With fixedRng (0.5): randomInt(1,3) = 1 + floor(0.5*3) = 2, so randComponent = 20

describe('calcGoldGeneration', () => {
  it('level 1 power 2 with fixedRng: (20 + 40) * 1 = 60', () => {
    const gold = calcGoldGeneration({ spellLevel: 1, casterPower: 2, rng: fixedRng })
    expect(gold).toBe(60)
  })

  it('level 3 power 4 with fixedRng: (20 + 80) * 9 = 900', () => {
    const gold = calcGoldGeneration({ spellLevel: 3, casterPower: 4, rng: fixedRng })
    expect(gold).toBe(900)
  })

  it('level 1 power 2 with lowRng: (10 + 40) * 1 = 50', () => {
    const gold = calcGoldGeneration({ spellLevel: 1, casterPower: 2, rng: lowRng })
    expect(gold).toBe(50)
  })

  it('level 1 power 2 with highRng: (30 + 40) * 1 = 70', () => {
    const gold = calcGoldGeneration({ spellLevel: 1, casterPower: 2, rng: highRng })
    expect(gold).toBe(70)
  })

  it('spell level is squared: level 2 gives 4x of level 1 at same power/rng', () => {
    const g1 = calcGoldGeneration({ spellLevel: 1, casterPower: 4, rng: fixedRng })
    const g2 = calcGoldGeneration({ spellLevel: 2, casterPower: 4, rng: fixedRng })
    expect(g2).toBe(g1 * 4)
  })

  it('higher caster power produces more gold', () => {
    const low = calcGoldGeneration({ spellLevel: 2, casterPower: 2, rng: fixedRng })
    const high = calcGoldGeneration({ spellLevel: 2, casterPower: 20, rng: fixedRng })
    expect(high).toBeGreaterThan(low)
  })

  it('power 0 still produces gold from random component', () => {
    const gold = calcGoldGeneration({ spellLevel: 1, casterPower: 0, rng: fixedRng })
    // (20 + 0) * 1 = 20
    expect(gold).toBe(20)
  })

  it('result is always an integer', () => {
    const gold = calcGoldGeneration({ spellLevel: 1, casterPower: 3, rng: fixedRng })
    expect(Number.isInteger(gold)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// calcBuffEffect -- additional coverage for adventure spell context
// ---------------------------------------------------------------------------

describe('calcBuffEffect (adventure-specific coverage)', () => {
  it('heal level 1 with high power', () => {
    const result = calcBuffEffect({
      spellKey: 'heal',
      spellLevel: 1,
      casterPower: 20,
      spell: SPELLS.heal,
    })
    // amount = 1 * 20 * 3 = 60
    expect(result.healAmount).toBe(60)
    expect(result.duration).toBe(0)
  })

  it('heal level 4 with power 1 gives minimal heal', () => {
    const result = calcBuffEffect({
      spellKey: 'heal',
      spellLevel: 4,
      casterPower: 1,
      spell: SPELLS.heal,
    })
    // amount = 4 * 1 * 3 = 12
    expect(result.healAmount).toBe(12)
  })

  it('unholy strength level 1 with power 0', () => {
    const result = calcBuffEffect({
      spellKey: 'unholyStrength',
      spellLevel: 1,
      casterPower: 0,
      spell: SPELLS.unholyStrength,
    })
    // str = 2*1 + floor(0/10) = 2
    // duration = 2 + 0*0 = 2
    expect(result.strengthBonus).toBe(2)
    expect(result.duration).toBe(2)
  })

  it('armor level 4 with high power', () => {
    const result = calcBuffEffect({
      spellKey: 'armor',
      spellLevel: 4,
      casterPower: 10,
      spell: SPELLS.armor,
    })
    // bonus = 4 + floor(10/2) = 4+5 = 9
    // duration = 2 + 10*10 = 102
    expect(result.armorBonus).toBe(9)
    expect(result.duration).toBe(102)
  })

  it('haste level 4 with power 8', () => {
    const result = calcBuffEffect({
      spellKey: 'haste',
      spellLevel: 4,
      casterPower: 8,
      spell: SPELLS.haste,
    })
    // extra = 4 + floor(8/8) = 4+1 = 5
    // duration = 2 + 8 = 10
    expect(result.hasteBonus).toBe(5)
    expect(result.duration).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// calcSummonResult -- additional coverage for other summon spells
// ---------------------------------------------------------------------------

describe('calcSummonResult (additional summon spell coverage)', () => {
  it('summonFire level 1 selects first tier', () => {
    const result = calcSummonResult({
      spellLevel: 1,
      casterPower: 5,
      summonTiers: SPELLS.summonFire.summonTiers,
    })
    expect(result.creatureKey).toBeDefined()
    expect(result.count).toBeGreaterThanOrEqual(1)
    expect(result.statMultiplier).toBe(1.0)
    expect(result.duration).toBe(10)
  })

  it('summonEarth level 3 selects tier 2', () => {
    const result = calcSummonResult({
      spellLevel: 3,
      casterPower: 4,
      summonTiers: SPELLS.summonEarth.summonTiers,
    })
    // tier index = min(3-1, len-1) = 2
    expect(result.creatureKey).toBeDefined()
    expect(result.statMultiplier).toBeCloseTo(2.4) // (20+4)/10
    expect(result.duration).toBe(8)
  })

  it('summonWater level 4 caps at last tier', () => {
    const result = calcSummonResult({
      spellLevel: 4,
      casterPower: 6,
      summonTiers: SPELLS.summonWater.summonTiers,
    })
    // tier index = min(4-1, len-1) = min(3, last)
    expect(result.creatureKey).toBeDefined()
    expect(result.statMultiplier).toBeCloseTo(2.6)
    expect(result.duration).toBe(12)
  })

  it('raiseDead level 2 selects tier 1', () => {
    const result = calcSummonResult({
      spellLevel: 2,
      casterPower: 8,
      summonTiers: SPELLS.raiseDead.summonTiers,
    })
    expect(result.creatureKey).toBeDefined()
    expect(result.count).toBeGreaterThanOrEqual(1)
    expect(result.duration).toBe(16)
  })

  it('spiritGuardian level 1 with low power', () => {
    const result = calcSummonResult({
      spellLevel: 1,
      casterPower: 1,
      summonTiers: SPELLS.spiritGuardian.summonTiers,
    })
    expect(result.creatureKey).toBeDefined()
    expect(result.duration).toBe(2)
    expect(result.statMultiplier).toBe(1.0)
  })

  it('summonAir level 4', () => {
    const result = calcSummonResult({
      spellLevel: 4,
      casterPower: 10,
      summonTiers: SPELLS.summonAir.summonTiers,
    })
    expect(result.creatureKey).toBeDefined()
    expect(result.duration).toBe(20)
    expect(result.statMultiplier).toBeCloseTo(2.6)
  })

  it('level 3 stat multiplier is 2.4', () => {
    // multiplier = (20 + (3-1)*2) / 10 = 24/10 = 2.4
    const result = calcSummonResult({
      spellLevel: 3,
      casterPower: 5,
      summonTiers: SPELLS.summonGolem.summonTiers,
    })
    expect(result.statMultiplier).toBeCloseTo(2.4)
  })
})

// ---------------------------------------------------------------------------
// calcBuffEffect -- batch A spells (airShield, fireEnchant, earthbuild, slow)
// ---------------------------------------------------------------------------

describe('calcBuffEffect (batch A spells)', () => {
  describe('airShield', () => {
    it('level 1 power 4: armorBonus = 1 + floor(4/2) = 3, duration = 2 + 16 = 18', () => {
      const result = calcBuffEffect({
        spellKey: 'airShield',
        spellLevel: 1,
        casterPower: 4,
        spell: SPELLS.airShield,
      })
      expect(result.armorBonus).toBe(3)
      expect(result.duration).toBe(18)
    })

    it('level 3 power 10: armorBonus = 3 + 5 = 8, duration = 2 + 100 = 102', () => {
      const result = calcBuffEffect({
        spellKey: 'airShield',
        spellLevel: 3,
        casterPower: 10,
        spell: SPELLS.airShield,
      })
      expect(result.armorBonus).toBe(8)
      expect(result.duration).toBe(102)
    })

    it('does not set other buff fields', () => {
      const result = calcBuffEffect({
        spellKey: 'airShield',
        spellLevel: 2,
        casterPower: 6,
        spell: SPELLS.airShield,
      })
      expect(result.hasteBonus).toBe(0)
      expect(result.strengthBonus).toBe(0)
      expect(result.fireDamageBonus).toBe(0)
      expect(result.buildingCostReduction).toBe(0)
    })
  })

  describe('fireEnchant', () => {
    it('level 1 power 4: fireDamageBonus = 1 + floor(4/4) = 2, duration = 4', () => {
      const result = calcBuffEffect({
        spellKey: 'fireEnchant',
        spellLevel: 1,
        casterPower: 4,
        spell: SPELLS.fireEnchant,
      })
      expect(result.fireDamageBonus).toBe(2)
      expect(result.duration).toBe(4)
    })

    it('level 4 power 12: fireDamageBonus = 4 + floor(12/4) = 7, duration = 12', () => {
      const result = calcBuffEffect({
        spellKey: 'fireEnchant',
        spellLevel: 4,
        casterPower: 12,
        spell: SPELLS.fireEnchant,
      })
      expect(result.fireDamageBonus).toBe(7)
      expect(result.duration).toBe(12)
    })

    it('does not set armor or haste', () => {
      const result = calcBuffEffect({
        spellKey: 'fireEnchant',
        spellLevel: 2,
        casterPower: 8,
        spell: SPELLS.fireEnchant,
      })
      expect(result.armorBonus).toBe(0)
      expect(result.hasteBonus).toBe(0)
    })
  })

  describe('earthbuild', () => {
    it('always returns buildingCostReduction 0.5', () => {
      const result = calcBuffEffect({
        spellKey: 'earthbuild',
        spellLevel: 1,
        casterPower: 5,
        spell: SPELLS.earthbuild,
      })
      expect(result.buildingCostReduction).toBe(0.5)
    })

    it('duration equals casterPower', () => {
      const r1 = calcBuffEffect({
        spellKey: 'earthbuild',
        spellLevel: 1,
        casterPower: 3,
        spell: SPELLS.earthbuild,
      })
      const r2 = calcBuffEffect({
        spellKey: 'earthbuild',
        spellLevel: 4,
        casterPower: 10,
        spell: SPELLS.earthbuild,
      })
      expect(r1.duration).toBe(3)
      expect(r2.duration).toBe(10)
    })

    it('does not set combat-related buffs', () => {
      const result = calcBuffEffect({
        spellKey: 'earthbuild',
        spellLevel: 2,
        casterPower: 6,
        spell: SPELLS.earthbuild,
      })
      expect(result.armorBonus).toBe(0)
      expect(result.fireDamageBonus).toBe(0)
      expect(result.hasteBonus).toBe(0)
      expect(result.strengthBonus).toBe(0)
    })
  })

  describe('slow', () => {
    it('level 1 power 8: hasteBonus = -(1 + floor(8/8)) = -2, duration = 2 + 8 = 10', () => {
      const result = calcBuffEffect({
        spellKey: 'slow',
        spellLevel: 1,
        casterPower: 8,
        spell: SPELLS.slow,
      })
      expect(result.hasteBonus).toBe(-2)
      expect(result.duration).toBe(10)
    })

    it('level 4 power 16: hasteBonus = -(4 + floor(16/8)) = -6, duration = 2 + 16 = 18', () => {
      const result = calcBuffEffect({
        spellKey: 'slow',
        spellLevel: 4,
        casterPower: 16,
        spell: SPELLS.slow,
      })
      expect(result.hasteBonus).toBe(-6)
      expect(result.duration).toBe(18)
    })

    it('does not modify speedBonus', () => {
      const result = calcBuffEffect({
        spellKey: 'slow',
        spellLevel: 2,
        casterPower: 4,
        spell: SPELLS.slow,
      })
      expect(result.speedBonus).toBe(0)
    })
  })
})
