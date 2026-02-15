import type { ManaType, ManaPool, ManaRegen, ActiveEffect, Companion } from '../types'
import { LANDS } from '../data'
import { calcArcaneManaProduction } from './formulas'

const MANA_TYPES: ManaType[] = ['fire', 'earth', 'air', 'water', 'death', 'life', 'arcane']

function emptyMana(): ManaRegen {
  return { fire: 0, earth: 0, air: 0, water: 0, death: 0, life: 0, arcane: 0 }
}

/**
 * Calculate mana regeneration from owned lands.
 * Each owned land with a non-empty manaType contributes +1 to that mana type.
 */
export function calcLandManaRegen(
  ownedLandIndices: number[],
  board: ReadonlyArray<{ landKey: string }>,
): ManaRegen {
  const regen = emptyMana()
  for (const index of ownedLandIndices) {
    const landKey = board[index]!.landKey
    const land = LANDS[landKey as keyof typeof LANDS]
    const manaType = land.manaType
    if (manaType !== '') {
      regen[manaType as ManaType] += 1
    }
  }
  return regen
}

/**
 * Calculate total mana regen by summing item regen, land regen, and arcane tower production.
 */
export function calcTotalManaRegen(params: {
  itemManaRegen: ManaRegen
  landManaRegen: ManaRegen
  arcaneTowerCount: number
}): ManaRegen {
  const { itemManaRegen, landManaRegen, arcaneTowerCount } = params
  const total = emptyMana()
  for (const type of MANA_TYPES) {
    total[type] = itemManaRegen[type] + landManaRegen[type]
  }
  total.arcane += calcArcaneManaProduction(arcaneTowerCount)
  return total
}

/**
 * Apply mana regeneration to a mana pool, returning a new pool without mutating the original.
 */
export function applyManaRegen(mana: ManaPool, regen: ManaRegen): ManaPool {
  const result = { ...mana }
  for (const type of MANA_TYPES) {
    result[type] += regen[type]
  }
  return result
}

/**
 * Tick effect durations: decrement each by 1, partition into remaining (duration > 0) and expired.
 * Does not mutate the original array or its elements.
 */
export function tickEffectDurations(effects: ActiveEffect[]): {
  remaining: ActiveEffect[]
  expired: ActiveEffect[]
} {
  const remaining: ActiveEffect[] = []
  const expired: ActiveEffect[] = []
  for (const effect of effects) {
    const newDuration = effect.duration - 1
    const copy = { ...effect, duration: newDuration }
    if (newDuration > 0) {
      remaining.push(copy)
    } else {
      expired.push(copy)
    }
  }
  return { remaining, expired }
}

/**
 * Expire summoned companions: decrement duration, remove those reaching 0.
 * Permanent companions (duration undefined or -1) are always kept.
 * Does not mutate the original array or its elements.
 */
export function expireSummonedCompanions(companions: Companion[]): {
  remaining: Companion[]
  expired: Companion[]
} {
  const remaining: Companion[] = []
  const expired: Companion[] = []
  for (const comp of companions) {
    if (comp.duration == null || comp.duration < 0) {
      remaining.push({
        ...comp,
        immunities: { ...comp.immunities },
        elementalDamage: { ...comp.elementalDamage },
      })
      continue
    }
    const newDuration = comp.duration - 1
    const copy = {
      ...comp,
      duration: newDuration,
      immunities: { ...comp.immunities },
      elementalDamage: { ...comp.elementalDamage },
    }
    if (newDuration > 0) {
      remaining.push(copy)
    } else {
      expired.push(copy)
    }
  }
  return { remaining, expired }
}
