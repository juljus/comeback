import type { ImmunityType, PhysicalDamageType, TitleRank } from '../types'
import { randomInt, rollDice } from './dice'

/**
 * Rest healing: (landHealing + sanctuaryBonus) / 3 * remainingActions.
 * Uses integer division (floor).
 */
export function calcRestHealing(
  landHealing: number,
  sanctuaryBonus: number,
  remainingActions: number,
): number {
  return Math.floor(((landHealing + sanctuaryBonus) / 3) * remainingActions)
}

/**
 * Shrine healing ritual for a player.
 * heal = (strength * 3) + healingBonus
 * healingBonus = 3 + (60 + currentHp) / (5 + currentHp)
 */
export function calcShrineHealing(strength: number, currentHp: number): number {
  const healingBonus = 3 + (60 + currentHp) / (5 + currentHp)
  return Math.floor(strength * 3 + healingBonus)
}

/** Companion healing at shrine: 6 + (companionStrength * 2). */
export function calcCompanionHealing(companionStrength: number): number {
  return 6 + companionStrength * 2
}

/** Sum of tax income from all owned lands. */
export function calcTaxIncome(lands: ReadonlyArray<{ taxIncome: number }>): number {
  return lands.reduce((sum, land) => sum + land.taxIncome, 0)
}

/** Bank bonus: ownedLandCount * banksOwned * 10. */
export function calcBankBonus(ownedLandCount: number, banksOwned: number): number {
  return ownedLandCount * banksOwned * 10
}

/** King's salary by title rank. */
export function calcTitleSalary(title: TitleRank): number {
  switch (title) {
    case 'none':
      return 20
    case 'baron':
      return 30
    case 'count':
      return 40
    case 'duke':
      return 50
  }
}

/** Consecutive doubles gold bonus: 50 * consecutiveCount^2. */
export function calcDoubleBonus(consecutiveCount: number): number {
  return 50 * consecutiveCount * consecutiveCount
}

type TreasureTier = 'small' | 'medium' | 'large' | 'huge'

/**
 * Treasure gold by tier, scaled by game days.
 * small:  random(3-7)*10 + gameDays
 * medium: random(7-12)*10 + gameDays
 * large:  random(1-10)*10 + 100 + gameDays
 * huge:   random(1-3)*1000 + gameDays
 */
export function calcTreasureGold(tier: TreasureTier, gameDays: number, rng: () => number): number {
  switch (tier) {
    case 'small':
      return randomInt(3, 7, rng) * 10 + gameDays
    case 'medium':
      return randomInt(7, 12, rng) * 10 + gameDays
    case 'large':
      return randomInt(1, 10, rng) * 10 + 100 + gameDays
    case 'huge':
      return randomInt(1, 3, rng) * 1000 + gameDays
  }
}

/** Melee damage: roll diceCount d diceSides + bonusDamage. */
export function calcMeleeDamage(
  diceCount: number,
  diceSides: number,
  bonusDamage: number,
  rng: () => number,
): number {
  return rollDice(diceCount, diceSides, rng) + bonusDamage
}

/** Damage after armor: max(0, rawDamage - armor). */
export function calcArmorReduction(rawDamage: number, armor: number): number {
  return Math.max(0, rawDamage - armor)
}

/**
 * Arcane mana production from towers. Pattern: triangular numbers.
 * 0->0, 1->1, 2->3, 3->6, 4->10
 * Formula: towersOwned * (towersOwned + 1) / 2
 */
export function calcArcaneManaProduction(towersOwned: number): number {
  return (towersOwned * (towersOwned + 1)) / 2
}

// ---------------------------------------------------------------------------
// Critical hit chances (deterministic, no rng)
// ---------------------------------------------------------------------------

/** Pierce crit chance: atkDex / (atkDex + defDex + 5). */
export function calcPierceCritChance(atkDex: number, defDex: number): number {
  return atkDex / (atkDex + defDex + 5)
}

/** Slash crit chance: (atkStr + floor(atkDex/2)) / (atkStr + floor(atkDex/2) + defDex + 3). */
export function calcSlashCritChance(atkStr: number, atkDex: number, defDex: number): number {
  const numerator = atkStr + Math.floor(atkDex / 2)
  return numerator / (numerator + defDex + 3)
}

/** Crush crit chance: (atkStr*2) / (atkStr*2 + defDex^3 + 2). */
export function calcCrushCritChance(atkStr: number, defDex: number): number {
  return (atkStr * 2) / (atkStr * 2 + defDex * defDex * defDex + 2)
}

// ---------------------------------------------------------------------------
// Critical hit dispatch
// ---------------------------------------------------------------------------

export type CritResult =
  | { crit: false }
  | { crit: true; type: 'pierce' }
  | { crit: true; type: 'slash'; bleedAmount: number }
  | { crit: true; type: 'crush'; stunDuration: number }

/**
 * Check for a physical critical hit.
 * Pierce crit: armor bypassed (caller handles).
 * Slash crit: requires damageDealt > 3 AND not bleed-immune; bleedAmount = floor(damageDealt/2).
 * Crush crit: requires damageDealt > 5 AND not stun-immune; stunDuration = 2.
 */
export function checkPhysicalCrit(
  damageType: PhysicalDamageType,
  damageDealt: number,
  atkStr: number,
  atkDex: number,
  defDex: number,
  defImmunities: Record<ImmunityType, number>,
  rng: () => number,
): CritResult {
  switch (damageType) {
    case 'pierce': {
      const chance = calcPierceCritChance(atkDex, defDex)
      if (rng() < chance) return { crit: true, type: 'pierce' }
      return { crit: false }
    }
    case 'slash': {
      const chance = calcSlashCritChance(atkStr, atkDex, defDex)
      if (rng() < chance) {
        if (damageDealt <= 3 || defImmunities.bleeding > 0) return { crit: false }
        return { crit: true, type: 'slash', bleedAmount: Math.floor(damageDealt / 2) }
      }
      return { crit: false }
    }
    case 'crush': {
      const chance = calcCrushCritChance(atkStr, defDex)
      if (rng() < chance) {
        if (damageDealt <= 5 || defImmunities.stun > 0) return { crit: false }
        return { crit: true, type: 'crush', stunDuration: 2 }
      }
      return { crit: false }
    }
  }
}

// ---------------------------------------------------------------------------
// Elemental resistance (per-channel)
// ---------------------------------------------------------------------------

/** Fire resistance: max(0, base - rand(0..pow-1) - rand(0..floor(dex/2)-1)). */
export function calcFireResistance(
  base: number,
  defPow: number,
  defDex: number,
  rng: () => number,
): number {
  const powReduction = defPow > 0 ? randomInt(0, defPow - 1, rng) : 0
  const dexHalf = Math.floor(defDex / 2)
  const dexReduction = dexHalf > 0 ? randomInt(0, dexHalf - 1, rng) : 0
  return Math.max(0, base - powReduction - dexReduction)
}

/** Poison resistance: max(0, base - rand(0..str*2-1)). */
export function calcPoisonResistance(base: number, defStr: number, rng: () => number): number {
  const strDouble = defStr * 2
  const reduction = strDouble > 0 ? randomInt(0, strDouble - 1, rng) : 0
  return Math.max(0, base - reduction)
}

/** Lightning resistance: same formula as fire. */
export function calcLightningResistance(
  base: number,
  defPow: number,
  defDex: number,
  rng: () => number,
): number {
  return calcFireResistance(base, defPow, defDex, rng)
}

/** Cold resistance: max(0, base - rand(0..str-1) - rand(0..floor(dex/2)-1)). */
export function calcColdResistance(
  base: number,
  defStr: number,
  defDex: number,
  rng: () => number,
): number {
  const strReduction = defStr > 0 ? randomInt(0, defStr - 1, rng) : 0
  const dexHalf = Math.floor(defDex / 2)
  const dexReduction = dexHalf > 0 ? randomInt(0, dexHalf - 1, rng) : 0
  return Math.max(0, base - strReduction - dexReduction)
}

type ElementalChannel = 'fire' | 'earth' | 'air' | 'water'

/** Apply elemental resistance for a channel. Returns 0 if immune. */
export function calcElementalAfterResistance(
  channel: ElementalChannel,
  base: number,
  defStr: number,
  defDex: number,
  defPow: number,
  defImmunities: Record<ImmunityType, number>,
  rng: () => number,
): number {
  if (base <= 0) return 0

  switch (channel) {
    case 'fire':
      if (defImmunities.fire > 0) return 0
      return calcFireResistance(base, defPow, defDex, rng)
    case 'earth':
      if (defImmunities.poison > 0) return 0
      return calcPoisonResistance(base, defStr, rng)
    case 'air':
      if (defImmunities.lightning > 0) return 0
      return calcLightningResistance(base, defPow, defDex, rng)
    case 'water':
      if (defImmunities.cold > 0) return 0
      return calcColdResistance(base, defStr, defDex, rng)
  }
}

// ---------------------------------------------------------------------------
// Elemental criticals
// ---------------------------------------------------------------------------

/** Fire crit check: if dealt > 4 and not burn-immune, chance = 2/(2+defStr+3). */
export function checkFireCrit(
  dealt: number,
  defStr: number,
  defImmunities: Record<ImmunityType, number>,
  rng: () => number,
): boolean {
  if (dealt <= 4 || defImmunities.fire > 0) return false
  const chance = 2 / (2 + defStr + 3)
  return rng() < chance
}

/** Cold crit check: if dealt > 4 and not cold-immune, chance = 2/(2+defStr+3). */
export function checkColdCrit(
  dealt: number,
  defStr: number,
  defImmunities: Record<ImmunityType, number>,
  rng: () => number,
): boolean {
  if (dealt <= 4 || defImmunities.cold > 0) return false
  const chance = 2 / (2 + defStr + 3)
  return rng() < chance
}

// ---------------------------------------------------------------------------
// Status effect ticks
// ---------------------------------------------------------------------------

/** Bleeding damage: rand(0..floor(level/2)) + 1. */
export function calcBleedingDamage(level: number, rng: () => number): number {
  return randomInt(0, Math.floor(level / 2), rng) + 1
}

/** Bleeding decay: rand(0..floor(level/2)) + 1. */
export function calcBleedingDecay(level: number, rng: () => number): number {
  return randomInt(0, Math.floor(level / 2), rng) + 1
}

/** Burning decay: rand(0..floor(str/2)) + 1. */
export function calcBurningDecay(defStr: number, rng: () => number): number {
  return randomInt(0, Math.floor(defStr / 2), rng) + 1
}

/** Stun decay: always 1. */
export function calcStunDecay(): number {
  return 1
}

/** Poison damage: max(0, level - rand(0..str*2-1)). */
export function calcPoisonDamage(level: number, defStr: number, rng: () => number): number {
  const strDouble = defStr * 2
  const reduction = strDouble > 0 ? randomInt(0, strDouble - 1, rng) : 0
  return Math.max(0, level - reduction)
}
