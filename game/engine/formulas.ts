import type { TitleRank } from '../types'
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
