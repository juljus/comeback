import type { ManaPool, SpellDefinition, SummonTier } from '../types'
import { randomInt } from './dice'
import { selectTreasureItem } from './events'

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export type SpellDamageResult = { damage: number; vampiricHealing: number }

export type BuffResult = {
  spellKey: string
  armorBonus: number
  hasteBonus: number
  strengthBonus: number
  windsPower: number
  healAmount: number
  duration: number
}

export type SummonResult = {
  creatureKey: string
  count: number
  duration: number
  statMultiplier: number
}

export type CastValidation = { canCast: boolean; reason?: string }

// ---------------------------------------------------------------------------
// calcSpellDamage
// ---------------------------------------------------------------------------

export function calcSpellDamage({
  spellLevel,
  basePower,
  casterPower,
  targetPower,
  vampiricPercent,
  rng,
}: {
  spellLevel: number
  basePower: number
  casterPower: number
  targetPower: number
  vampiricPercent: number
  rng: () => number
}): SpellDamageResult {
  const rand1Upper = Math.floor(casterPower / 2) - 1
  const rand1 = rand1Upper < 0 ? 0 : randomInt(0, rand1Upper, rng)
  const rand2 = randomInt(0, targetPower - 1, rng)

  const raw = Math.floor(((spellLevel * basePower + rand1) * casterPower) / targetPower - rand2)
  const damage = Math.max(0, raw)
  const vampiricHealing = Math.floor((damage * vampiricPercent) / 100)

  return { damage, vampiricHealing }
}

// ---------------------------------------------------------------------------
// calcBuffEffect
// ---------------------------------------------------------------------------

export function calcBuffEffect({
  spellKey,
  spellLevel,
  casterPower,
  spell,
}: {
  spellKey: string
  spellLevel: number
  casterPower: number
  spell: SpellDefinition
}): BuffResult {
  let armorBonus = 0
  let hasteBonus = 0
  let strengthBonus = 0
  let windsPower = 0
  let healAmount = 0
  let duration = 0

  if (spell.hasArmorBuff) {
    armorBonus = spellLevel + Math.floor(casterPower / 2)
    duration = 2 + casterPower * casterPower
  }

  if (spell.hasHasteEffect) {
    hasteBonus = spellLevel + Math.floor(casterPower / 8)
    duration = 2 + casterPower
  }

  if (spell.hasStrengthBuff) {
    strengthBonus = 2 * spellLevel + Math.floor(casterPower / 10)
    duration = 2 + casterPower * casterPower
  }

  if (spell.hasHealEffect) {
    healAmount = spellLevel * casterPower * 3
    duration = 0
  }

  if (spell.hasWindEffect) {
    windsPower = spellLevel + Math.floor(casterPower / 2)
    duration = casterPower - 1
  }

  return { spellKey, armorBonus, hasteBonus, strengthBonus, windsPower, healAmount, duration }
}

// ---------------------------------------------------------------------------
// calcSummonResult
// ---------------------------------------------------------------------------

export function calcSummonResult({
  spellLevel,
  casterPower,
  summonTiers,
}: {
  spellLevel: number
  casterPower: number
  summonTiers: readonly SummonTier[]
}): SummonResult {
  const tierIndex = Math.min(spellLevel - 1, summonTiers.length - 1)
  const tier = summonTiers[tierIndex]!
  const duration = casterPower * 2
  const statMultiplier = spellLevel > 1 ? (20 + (spellLevel - 1) * 2) / 10 : 1.0

  return { creatureKey: tier.creature, count: tier.count, duration, statMultiplier }
}

// ---------------------------------------------------------------------------
// calcGoldGeneration
// ---------------------------------------------------------------------------

const BASE_GOLD = 50

export function calcGoldGeneration({
  spellLevel,
  casterPower,
}: {
  spellLevel: number
  casterPower: number
}): number {
  const multiplier = spellLevel + Math.floor(casterPower / 2)
  return BASE_GOLD * multiplier
}

// ---------------------------------------------------------------------------
// calcItemGeneration
// ---------------------------------------------------------------------------

export function calcItemGeneration({
  spellLevel,
  casterPower,
  rng,
}: {
  spellLevel: number
  casterPower: number
  rng: () => number
}): string {
  const minValue = Math.max(21, Math.min(spellLevel * 50 - 100, 900))
  const maxValue = (50 + casterPower * 20) * spellLevel
  return selectTreasureItem({ minValue, maxValue, rng })
}

// ---------------------------------------------------------------------------
// validateCast
// ---------------------------------------------------------------------------

export function validateCast({
  spellKey,
  spellbook,
  mana,
  spell,
  actionsUsed,
  inCombat,
}: {
  spellKey: string
  spellbook: Record<string, number>
  mana: ManaPool
  spell: SpellDefinition
  actionsUsed?: number
  inCombat?: boolean
}): CastValidation {
  const combat = inCombat ?? false

  if (!(spellKey in spellbook)) {
    return { canCast: false, reason: 'Spell not in spellbook' }
  }

  if (mana[spell.manaType] < spell.manaCost) {
    return { canCast: false, reason: 'Not enough mana' }
  }

  if (!combat && (actionsUsed ?? 0) > 0) {
    return { canCast: false, reason: 'Must cast at start of turn (no actions used)' }
  }

  return { canCast: true }
}

// ---------------------------------------------------------------------------
// deductManaCost
// ---------------------------------------------------------------------------

export function deductManaCost(mana: ManaPool, spell: SpellDefinition): ManaPool {
  return { ...mana, [spell.manaType]: mana[spell.manaType] - spell.manaCost }
}
