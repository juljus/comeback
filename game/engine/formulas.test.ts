import { describe, expect, it } from 'vitest'
import type { ImmunityType } from '../types'
import { createRng } from './dice'
import {
  calcArcaneManaProduction,
  calcArmorReduction,
  calcBankBonus,
  calcBleedingDamage,
  calcBleedingDecay,
  calcBurningDecay,
  calcColdResistance,
  calcCompanionHealing,
  calcCrushCritChance,
  calcDoubleBonus,
  calcElementalAfterResistance,
  calcFireResistance,
  calcLightningResistance,
  calcMeleeDamage,
  calcPierceCritChance,
  calcPoisonDamage,
  calcPoisonResistance,
  calcRestHealing,
  calcShrineHealing,
  calcSlashCritChance,
  calcStunDecay,
  calcTaxIncome,
  calcTitleSalary,
  calcTreasureGold,
  checkColdCrit,
  checkFireCrit,
  checkPhysicalCrit,
} from './formulas'

describe('calcRestHealing', () => {
  // Formula: (landHealing + sanctuaryBonus) / 3 * remainingActions
  it('heals more with more remaining actions', () => {
    const heal3 = calcRestHealing(6, 0, 3)
    const heal2 = calcRestHealing(6, 0, 2)
    const heal1 = calcRestHealing(6, 0, 1)
    expect(heal3).toBeGreaterThan(heal2)
    expect(heal2).toBeGreaterThan(heal1)
  })

  it('includes sanctuary bonus in calculation', () => {
    const withoutSanctuary = calcRestHealing(6, 0, 3)
    const withSanctuary = calcRestHealing(6, 3, 3)
    expect(withSanctuary).toBeGreaterThan(withoutSanctuary)
  })

  it('returns 0 when remainingActions is 0', () => {
    expect(calcRestHealing(6, 0, 0)).toBe(0)
  })

  it('calculates correctly with known values', () => {
    // (6 + 0) / 3 * 3 = 6
    expect(calcRestHealing(6, 0, 3)).toBe(6)
    // (6 + 0) / 3 * 2 = 4
    expect(calcRestHealing(6, 0, 2)).toBe(4)
    // (6 + 0) / 3 * 1 = 2
    expect(calcRestHealing(6, 0, 1)).toBe(2)
  })

  it('handles sanctuary bonus correctly', () => {
    // (6 + 3) / 3 * 3 = 9
    expect(calcRestHealing(6, 3, 3)).toBe(9)
  })
})

describe('calcShrineHealing', () => {
  // Formula: (strength * 3) + healingBonus
  // healingBonus = 3 + (60 + currentHp) / (5 + currentHp)
  it('heals more with higher strength', () => {
    const lowStr = calcShrineHealing(2, 20)
    const highStr = calcShrineHealing(10, 20)
    expect(highStr).toBeGreaterThan(lowStr)
  })

  it('matches manual table spot-checks approximately', () => {
    // str=2, hp=20: bonus ~= 3 + 80/25 = 3 + 3.2 = ~6.2, total ~= 6 + 6.2 ~= 12.2
    const heal1 = calcShrineHealing(2, 20)
    expect(heal1).toBeGreaterThanOrEqual(10)
    expect(heal1).toBeLessThanOrEqual(13)

    // str=4, hp=20: bonus ~= 6.2, total ~= 12 + 6.2 = ~18.2
    const heal2 = calcShrineHealing(4, 20)
    expect(heal2).toBeGreaterThanOrEqual(16)
    expect(heal2).toBeLessThanOrEqual(20)

    // str=10, hp=50: bonus ~= 3 + 110/55 = 3 + 2 = 5, total ~= 30 + 5 = 35
    const heal3 = calcShrineHealing(10, 50)
    expect(heal3).toBeGreaterThanOrEqual(33)
    expect(heal3).toBeLessThanOrEqual(37)
  })

  it('healing bonus decreases as currentHp increases', () => {
    // At very high HP the bonus portion converges toward 4
    const lowHpHeal = calcShrineHealing(5, 10)
    const highHpHeal = calcShrineHealing(5, 1000)
    // The strength portion (15) is the same, but bonus differs
    // lowHp: bonus = 3 + 70/15 ~= 7.67
    // highHp: bonus = 3 + 1060/1005 ~= 4.05
    expect(lowHpHeal).toBeGreaterThan(highHpHeal)
  })
})

describe('calcCompanionHealing', () => {
  // Formula: 6 + (companionStrength * 2)
  it('returns 6 for companion with 0 strength', () => {
    expect(calcCompanionHealing(0)).toBe(6)
  })

  it('returns correct values for known inputs', () => {
    expect(calcCompanionHealing(1)).toBe(8)
    expect(calcCompanionHealing(3)).toBe(12)
    expect(calcCompanionHealing(5)).toBe(16)
    expect(calcCompanionHealing(10)).toBe(26)
  })
})

describe('calcTaxIncome', () => {
  it('returns 0 for empty land list', () => {
    expect(calcTaxIncome([])).toBe(0)
  })

  it('sums tax income from owned lands', () => {
    const lands = [{ taxIncome: 8 }, { taxIncome: 6 }, { taxIncome: 4 }] as Array<{
      taxIncome: number
    }>
    expect(calcTaxIncome(lands)).toBe(18)
  })

  it('handles single land', () => {
    const lands = [{ taxIncome: 5 }] as Array<{ taxIncome: number }>
    expect(calcTaxIncome(lands)).toBe(5)
  })
})

describe('calcBankBonus', () => {
  // Formula: ownedLandCount * banksOwned * 10
  it('returns 0 when no banks owned', () => {
    expect(calcBankBonus(5, 0)).toBe(0)
  })

  it('returns 0 when no lands owned', () => {
    expect(calcBankBonus(0, 2)).toBe(0)
  })

  it('calculates correctly with known values', () => {
    // 5 lands, 2 banks = 5 * 2 * 10 = 100
    expect(calcBankBonus(5, 2)).toBe(100)
    // 10 lands, 1 bank = 10 * 1 * 10 = 100
    expect(calcBankBonus(10, 1)).toBe(100)
    // 3 lands, 3 banks = 3 * 3 * 10 = 90
    expect(calcBankBonus(3, 3)).toBe(90)
  })
})

describe('calcTitleSalary', () => {
  // None=20, Baron=30, Count=40, Duke=50
  it('returns 20 for no title', () => {
    expect(calcTitleSalary('none')).toBe(20)
  })

  it('returns 30 for Baron', () => {
    expect(calcTitleSalary('baron')).toBe(30)
  })

  it('returns 40 for Count', () => {
    expect(calcTitleSalary('count')).toBe(40)
  })

  it('returns 50 for Duke', () => {
    expect(calcTitleSalary('duke')).toBe(50)
  })

  it('higher titles yield higher salary', () => {
    const none = calcTitleSalary('none')
    const baron = calcTitleSalary('baron')
    const count = calcTitleSalary('count')
    const duke = calcTitleSalary('duke')
    expect(duke).toBeGreaterThan(count)
    expect(count).toBeGreaterThan(baron)
    expect(baron).toBeGreaterThan(none)
  })
})

describe('calcDoubleBonus', () => {
  // Formula: 50 * consecutiveCount^2
  it('returns 50 for first double', () => {
    expect(calcDoubleBonus(1)).toBe(50)
  })

  it('returns 200 for second consecutive same double', () => {
    expect(calcDoubleBonus(2)).toBe(200)
  })

  it('returns 450 for third consecutive same double', () => {
    expect(calcDoubleBonus(3)).toBe(450)
  })

  it('returns 800 for fourth consecutive same double', () => {
    expect(calcDoubleBonus(4)).toBe(800)
  })

  it('scales quadratically', () => {
    for (let n = 1; n <= 10; n++) {
      expect(calcDoubleBonus(n)).toBe(50 * n * n)
    }
  })
})

describe('calcTreasureGold', () => {
  // Small: random(3-7)*10 + gameDays
  // Medium: random(7-12)*10 + gameDays
  // Large: random(1-10)*10 + 100 + gameDays
  // Huge: random(1-3)*1000 + gameDays
  describe('small treasure', () => {
    it('returns values in correct range', () => {
      const rng = createRng(42)
      for (let i = 0; i < 100; i++) {
        const gold = calcTreasureGold('small', 10, rng)
        // 3*10 + 10 = 40 to 7*10 + 10 = 80
        expect(gold).toBeGreaterThanOrEqual(40)
        expect(gold).toBeLessThanOrEqual(80)
      }
    })
  })

  describe('medium treasure', () => {
    it('returns values in correct range', () => {
      const rng = createRng(42)
      for (let i = 0; i < 100; i++) {
        const gold = calcTreasureGold('medium', 5, rng)
        // 7*10 + 5 = 75 to 12*10 + 5 = 125
        expect(gold).toBeGreaterThanOrEqual(75)
        expect(gold).toBeLessThanOrEqual(125)
      }
    })
  })

  describe('large treasure', () => {
    it('returns values in correct range', () => {
      const rng = createRng(42)
      for (let i = 0; i < 100; i++) {
        const gold = calcTreasureGold('large', 20, rng)
        // 1*10 + 100 + 20 = 130 to 10*10 + 100 + 20 = 220
        expect(gold).toBeGreaterThanOrEqual(130)
        expect(gold).toBeLessThanOrEqual(220)
      }
    })
  })

  describe('huge treasure', () => {
    it('returns values in correct range', () => {
      const rng = createRng(42)
      for (let i = 0; i < 100; i++) {
        const gold = calcTreasureGold('huge', 50, rng)
        // 1*1000 + 50 = 1050 to 3*1000 + 50 = 3050
        expect(gold).toBeGreaterThanOrEqual(1050)
        expect(gold).toBeLessThanOrEqual(3050)
      }
    })
  })

  it('gameDays increases all treasure amounts', () => {
    const rng1 = createRng(42)
    const rng2 = createRng(42)
    const earlyGold = calcTreasureGold('small', 0, rng1)
    const lateGold = calcTreasureGold('small', 100, rng2)
    // Same RNG seed means same random roll, so difference = gameDays difference
    expect(lateGold - earlyGold).toBe(100)
  })

  it('produces deterministic results with same seed', () => {
    const rng1 = createRng(42)
    const rng2 = createRng(42)
    expect(calcTreasureGold('medium', 10, rng1)).toBe(calcTreasureGold('medium', 10, rng2))
  })
})

describe('calcMeleeDamage', () => {
  it('returns values in correct range for known inputs', () => {
    const rng = createRng(42)
    for (let i = 0; i < 100; i++) {
      // 2d6 + 3 bonus: range [2+3, 12+3] = [5, 15]
      const dmg = calcMeleeDamage(2, 6, 3, rng)
      expect(dmg).toBeGreaterThanOrEqual(5)
      expect(dmg).toBeLessThanOrEqual(15)
    }
  })

  it('returns bonusDamage when diceCount is 0', () => {
    const rng = createRng(42)
    expect(calcMeleeDamage(0, 6, 5, rng)).toBe(5)
  })

  it('produces deterministic results with same seed', () => {
    const rng1 = createRng(42)
    const rng2 = createRng(42)
    const results1 = Array.from({ length: 20 }, () => calcMeleeDamage(2, 6, 0, rng1))
    const results2 = Array.from({ length: 20 }, () => calcMeleeDamage(2, 6, 0, rng2))
    expect(results1).toEqual(results2)
  })
})

describe('calcArmorReduction', () => {
  // Formula: max(0, rawDamage - armor)
  it('reduces damage by armor amount', () => {
    expect(calcArmorReduction(10, 3)).toBe(7)
  })

  it('returns 0 when armor exceeds raw damage', () => {
    expect(calcArmorReduction(5, 10)).toBe(0)
  })

  it('returns 0 when armor equals raw damage', () => {
    expect(calcArmorReduction(8, 8)).toBe(0)
  })

  it('returns full damage when armor is 0', () => {
    expect(calcArmorReduction(15, 0)).toBe(15)
  })

  it('never returns negative values', () => {
    expect(calcArmorReduction(0, 5)).toBe(0)
    expect(calcArmorReduction(1, 100)).toBe(0)
  })
})

describe('calcArcaneManaProduction', () => {
  // 1->1, 2->3, 3->6, 4->10
  it('returns correct mana for 1 tower', () => {
    expect(calcArcaneManaProduction(1)).toBe(1)
  })

  it('returns correct mana for 2 towers', () => {
    expect(calcArcaneManaProduction(2)).toBe(3)
  })

  it('returns correct mana for 3 towers', () => {
    expect(calcArcaneManaProduction(3)).toBe(6)
  })

  it('returns correct mana for 4 towers', () => {
    expect(calcArcaneManaProduction(4)).toBe(10)
  })

  it('returns 0 for 0 towers', () => {
    expect(calcArcaneManaProduction(0)).toBe(0)
  })

  it('production increases with each additional tower', () => {
    let prev = calcArcaneManaProduction(0)
    for (let towers = 1; towers <= 4; towers++) {
      const current = calcArcaneManaProduction(towers)
      expect(current).toBeGreaterThan(prev)
      prev = current
    }
  })
})

// ---------------------------------------------------------------------------
// Critical hit chance formulas
// ---------------------------------------------------------------------------

const NO_IMMUNITIES: Record<ImmunityType, number> = {
  fire: 0,
  lightning: 0,
  cold: 0,
  poison: 0,
  bleeding: 0,
  stun: 0,
}

describe('calcPierceCritChance', () => {
  it('returns correct value for known inputs', () => {
    // 10 / (10 + 5 + 5) = 0.5
    expect(calcPierceCritChance(10, 5)).toBeCloseTo(0.5)
  })

  it('increases with higher attacker dex', () => {
    expect(calcPierceCritChance(20, 5)).toBeGreaterThan(calcPierceCritChance(5, 5))
  })

  it('decreases with higher defender dex', () => {
    expect(calcPierceCritChance(10, 20)).toBeLessThan(calcPierceCritChance(10, 5))
  })
})

describe('calcSlashCritChance', () => {
  it('returns correct value for known inputs', () => {
    // num = 10 + floor(6/2) = 13, denom = 13 + 5 + 3 = 21
    expect(calcSlashCritChance(10, 6, 5)).toBeCloseTo(13 / 21)
  })

  it('increases with higher attacker str', () => {
    expect(calcSlashCritChance(20, 5, 5)).toBeGreaterThan(calcSlashCritChance(5, 5, 5))
  })
})

describe('calcCrushCritChance', () => {
  it('returns correct value for known inputs', () => {
    // 10*2 / (10*2 + 2^3 + 2) = 20 / (20 + 8 + 2) = 20/30
    expect(calcCrushCritChance(10, 2)).toBeCloseTo(20 / 30)
  })

  it('drops sharply with high defender dex', () => {
    // defDex=10: 20/(20+1000+2) = 20/1022
    expect(calcCrushCritChance(10, 10)).toBeLessThan(0.03)
  })
})

describe('checkPhysicalCrit', () => {
  it('pierce crit when rng below threshold', () => {
    // atkDex=10, defDex=5 -> chance=0.5. rng returns 0.1 -> crit
    const result = checkPhysicalCrit('pierce', 10, 5, 10, 5, NO_IMMUNITIES, () => 0.1)
    expect(result).toEqual({ crit: true, type: 'pierce' })
  })

  it('pierce no crit when rng above threshold', () => {
    const result = checkPhysicalCrit('pierce', 10, 5, 10, 5, NO_IMMUNITIES, () => 0.9)
    expect(result).toEqual({ crit: false })
  })

  it('slash crit returns bleed amount', () => {
    // atkStr=10, atkDex=6, defDex=5 -> chance ~0.619. rng=0.1 -> crit. damageDealt=10 -> bleed=5
    const result = checkPhysicalCrit('slash', 10, 10, 6, 5, NO_IMMUNITIES, () => 0.1)
    expect(result).toEqual({ crit: true, type: 'slash', bleedAmount: 5 })
  })

  it('slash crit fails when damage too low', () => {
    const result = checkPhysicalCrit('slash', 3, 10, 6, 5, NO_IMMUNITIES, () => 0.1)
    expect(result).toEqual({ crit: false })
  })

  it('slash crit fails when target is bleed-immune', () => {
    const immunities = { ...NO_IMMUNITIES, bleeding: 1 }
    const result = checkPhysicalCrit('slash', 10, 10, 6, 5, immunities, () => 0.1)
    expect(result).toEqual({ crit: false })
  })

  it('crush crit returns stun duration', () => {
    // atkStr=10, defDex=2 -> chance ~0.667. rng=0.1 -> crit. damageDealt=10 -> stun=2
    const result = checkPhysicalCrit('crush', 10, 10, 5, 2, NO_IMMUNITIES, () => 0.1)
    expect(result).toEqual({ crit: true, type: 'crush', stunDuration: 2 })
  })

  it('crush crit fails when damage too low', () => {
    const result = checkPhysicalCrit('crush', 5, 10, 5, 2, NO_IMMUNITIES, () => 0.1)
    expect(result).toEqual({ crit: false })
  })

  it('crush crit fails when target is stun-immune', () => {
    const immunities = { ...NO_IMMUNITIES, stun: 1 }
    const result = checkPhysicalCrit('crush', 10, 10, 5, 2, immunities, () => 0.1)
    expect(result).toEqual({ crit: false })
  })
})

// ---------------------------------------------------------------------------
// Elemental resistance formulas
// ---------------------------------------------------------------------------

describe('calcFireResistance', () => {
  it('returns base when defender has 0 stats', () => {
    expect(calcFireResistance(10, 0, 0, createRng(42))).toBe(10)
  })

  it('reduces damage with higher power', () => {
    const rng = createRng(42)
    const results = Array.from({ length: 50 }, () => calcFireResistance(20, 10, 0, rng))
    const avg = results.reduce((a, b) => a + b, 0) / results.length
    expect(avg).toBeLessThan(20)
    expect(avg).toBeGreaterThan(0)
  })

  it('never goes below 0', () => {
    const rng = createRng(42)
    for (let i = 0; i < 100; i++) {
      expect(calcFireResistance(1, 50, 50, rng)).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('calcPoisonResistance', () => {
  it('returns base when defender has 0 str', () => {
    expect(calcPoisonResistance(10, 0, createRng(42))).toBe(10)
  })

  it('reduces with higher str', () => {
    const rng = createRng(42)
    const results = Array.from({ length: 50 }, () => calcPoisonResistance(20, 10, rng))
    const avg = results.reduce((a, b) => a + b, 0) / results.length
    expect(avg).toBeLessThan(20)
  })
})

describe('calcLightningResistance', () => {
  it('uses same formula as fire', () => {
    const r1 = calcLightningResistance(10, 5, 3, createRng(42))
    const r2 = calcFireResistance(10, 5, 3, createRng(42))
    expect(r1).toBe(r2)
  })
})

describe('calcColdResistance', () => {
  it('returns base when defender has 0 stats', () => {
    expect(calcColdResistance(10, 0, 0, createRng(42))).toBe(10)
  })

  it('reduces with higher str and dex', () => {
    const rng = createRng(42)
    const results = Array.from({ length: 50 }, () => calcColdResistance(20, 10, 10, rng))
    const avg = results.reduce((a, b) => a + b, 0) / results.length
    expect(avg).toBeLessThan(20)
  })
})

describe('calcElementalAfterResistance', () => {
  it('returns 0 for base <= 0', () => {
    expect(calcElementalAfterResistance('fire', 0, 5, 5, 5, NO_IMMUNITIES, createRng(42))).toBe(0)
  })

  it('returns 0 when fire-immune', () => {
    const immunities = { ...NO_IMMUNITIES, fire: 1 }
    expect(calcElementalAfterResistance('fire', 10, 5, 5, 5, immunities, createRng(42))).toBe(0)
  })

  it('returns 0 when poison-immune for earth channel', () => {
    const immunities = { ...NO_IMMUNITIES, poison: 1 }
    expect(calcElementalAfterResistance('earth', 10, 5, 5, 5, immunities, createRng(42))).toBe(0)
  })

  it('returns 0 when lightning-immune for air channel', () => {
    const immunities = { ...NO_IMMUNITIES, lightning: 1 }
    expect(calcElementalAfterResistance('air', 10, 5, 5, 5, immunities, createRng(42))).toBe(0)
  })

  it('returns 0 when cold-immune for water channel', () => {
    const immunities = { ...NO_IMMUNITIES, cold: 1 }
    expect(calcElementalAfterResistance('water', 10, 5, 5, 5, immunities, createRng(42))).toBe(0)
  })

  it('applies fire resistance for fire channel', () => {
    const rng = createRng(42)
    const result = calcElementalAfterResistance('fire', 10, 0, 0, 5, NO_IMMUNITIES, rng)
    expect(result).toBeLessThanOrEqual(10)
    expect(result).toBeGreaterThanOrEqual(0)
  })
})

// ---------------------------------------------------------------------------
// Elemental criticals
// ---------------------------------------------------------------------------

describe('checkFireCrit', () => {
  it('returns false when dealt <= 4', () => {
    expect(checkFireCrit(4, 5, NO_IMMUNITIES, () => 0)).toBe(false)
  })

  it('returns false when fire-immune', () => {
    const immunities = { ...NO_IMMUNITIES, fire: 1 }
    expect(checkFireCrit(10, 5, immunities, () => 0)).toBe(false)
  })

  it('returns true when rng below threshold', () => {
    // chance = 2/(2+5+3) = 0.2; rng=0.1 -> true
    expect(checkFireCrit(10, 5, NO_IMMUNITIES, () => 0.1)).toBe(true)
  })

  it('returns false when rng above threshold', () => {
    expect(checkFireCrit(10, 5, NO_IMMUNITIES, () => 0.9)).toBe(false)
  })
})

describe('checkColdCrit', () => {
  it('returns false when dealt <= 4', () => {
    expect(checkColdCrit(4, 5, NO_IMMUNITIES, () => 0)).toBe(false)
  })

  it('returns false when cold-immune', () => {
    const immunities = { ...NO_IMMUNITIES, cold: 1 }
    expect(checkColdCrit(10, 5, immunities, () => 0)).toBe(false)
  })

  it('returns true when rng below threshold', () => {
    expect(checkColdCrit(10, 5, NO_IMMUNITIES, () => 0.1)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Status effect ticks
// ---------------------------------------------------------------------------

describe('calcBleedingDamage', () => {
  it('returns at least 1', () => {
    expect(calcBleedingDamage(0, createRng(42))).toBeGreaterThanOrEqual(1)
  })

  it('range is [1, floor(level/2)+1]', () => {
    const rng = createRng(42)
    for (let i = 0; i < 100; i++) {
      const dmg = calcBleedingDamage(10, rng)
      expect(dmg).toBeGreaterThanOrEqual(1)
      expect(dmg).toBeLessThanOrEqual(6)
    }
  })
})

describe('calcBleedingDecay', () => {
  it('returns at least 1', () => {
    expect(calcBleedingDecay(0, createRng(42))).toBeGreaterThanOrEqual(1)
  })

  it('range is [1, floor(level/2)+1]', () => {
    const rng = createRng(42)
    for (let i = 0; i < 100; i++) {
      const decay = calcBleedingDecay(10, rng)
      expect(decay).toBeGreaterThanOrEqual(1)
      expect(decay).toBeLessThanOrEqual(6)
    }
  })
})

describe('calcBurningDecay', () => {
  it('returns at least 1', () => {
    expect(calcBurningDecay(0, createRng(42))).toBeGreaterThanOrEqual(1)
  })

  it('range is [1, floor(str/2)+1]', () => {
    const rng = createRng(42)
    for (let i = 0; i < 100; i++) {
      const decay = calcBurningDecay(10, rng)
      expect(decay).toBeGreaterThanOrEqual(1)
      expect(decay).toBeLessThanOrEqual(6)
    }
  })
})

describe('calcStunDecay', () => {
  it('always returns 1', () => {
    expect(calcStunDecay()).toBe(1)
  })
})

describe('calcPoisonDamage', () => {
  it('returns level when defender has 0 str', () => {
    expect(calcPoisonDamage(10, 0, createRng(42))).toBe(10)
  })

  it('reduces with higher str', () => {
    const rng = createRng(42)
    const results = Array.from({ length: 50 }, () => calcPoisonDamage(20, 10, rng))
    const avg = results.reduce((a, b) => a + b, 0) / results.length
    expect(avg).toBeLessThan(20)
  })

  it('never goes below 0', () => {
    const rng = createRng(42)
    for (let i = 0; i < 100; i++) {
      expect(calcPoisonDamage(1, 50, rng)).toBeGreaterThanOrEqual(0)
    }
  })
})
