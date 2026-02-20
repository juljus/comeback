import type { ManaPool, SpellDefinition, SummonTier } from '../types'
import { CREATURES } from '../data'
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
  fireDamageBonus: number
  buildingCostReduction: number
  speedBonus: number
  retaliationPercent: number
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
  let fireDamageBonus = 0
  let buildingCostReduction = 0
  const speedBonus = 0
  let retaliationPercent = 0

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

  // airShield: armor buff (same formula as armor spell)
  if (spellKey === 'airShield') {
    armorBonus = spellLevel + Math.floor(casterPower / 2)
    duration = 2 + casterPower * casterPower
  }

  // fireEnchant: adds fire elemental damage
  if (spellKey === 'fireEnchant') {
    fireDamageBonus = spellLevel + Math.floor(casterPower / 4)
    duration = casterPower
  }

  // earthbuild: halves building costs
  if (spellKey === 'earthbuild') {
    buildingCostReduction = 0.5
    duration = casterPower
  }

  // slow: reduces dexterity (negative haste)
  if (spellKey === 'slow') {
    hasteBonus = -(spellLevel + Math.floor(casterPower / 8))
    duration = 2 + casterPower
  }

  // retaliation: damage reflection buff
  if (spellKey === 'retaliation') {
    retaliationPercent = 25 + spellLevel * 10
    duration = casterPower
  }

  return {
    spellKey,
    armorBonus,
    hasteBonus,
    strengthBonus,
    windsPower,
    healAmount,
    duration,
    fireDamageBonus,
    buildingCostReduction,
    speedBonus,
    retaliationPercent,
  }
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

export function calcGoldGeneration({
  spellLevel,
  casterPower,
  rng,
}: {
  spellLevel: number
  casterPower: number
  rng: () => number
}): number {
  const randComponent = randomInt(1, 3, rng) * 10
  return (randComponent + casterPower * 20) * (spellLevel * spellLevel)
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
// calcPolymorphResult
// ---------------------------------------------------------------------------

export type PolymorphResult = {
  newCreatureKey: string
  success: boolean
}

/**
 * Pick a random creature to polymorph the target into.
 * Higher spell level biases toward weaker creatures (lower HP).
 * Excludes non-combatant creatures (gates/doors with diceCount=0).
 */
export function calcPolymorphResult({
  targetHp,
  spellLevel,
  rng,
}: {
  targetHp: number
  spellLevel: number
  rng: () => number
}): PolymorphResult {
  // Build pool of valid creatures (exclude gates/doors)
  const pool: { key: string; hp: number }[] = []
  for (const [key, creature] of Object.entries(CREATURES)) {
    if (creature.diceCount === 0) continue
    pool.push({ key, hp: creature.hp })
  }

  if (pool.length === 0) {
    return { newCreatureKey: '', success: false }
  }

  // HP range: higher spell level shifts the range lower (weaker targets)
  // Level 1: 50%-150% of target HP, Level 5: 10%-100%, Level 10: 5%-60%
  const lowerFactor = Math.max(0.05, 0.5 - spellLevel * 0.05)
  const upperFactor = Math.max(0.3, 1.5 - spellLevel * 0.1)
  const minHp = Math.floor(targetHp * lowerFactor)
  const maxHp = Math.floor(targetHp * upperFactor)

  // Filter pool to HP range
  const candidates = pool.filter((c) => c.hp >= minHp && c.hp <= maxHp)

  if (candidates.length > 0) {
    const idx = Math.floor(rng() * candidates.length)
    return { newCreatureKey: candidates[idx]!.key, success: true }
  }

  // No exact match: pick the closest creature by HP
  pool.sort((a, b) => Math.abs(a.hp - targetHp) - Math.abs(b.hp - targetHp))
  return { newCreatureKey: pool[0]!.key, success: true }
}

// ---------------------------------------------------------------------------
// calcVampiricBatsDrain
// ---------------------------------------------------------------------------

/**
 * Calculate vampiric bats HP drain per turn.
 * Drain = spellLevel * casterPower.
 * Duration = casterPower turns.
 */
export function calcVampiricBatsDrain({
  spellLevel,
  casterPower,
}: {
  spellLevel: number
  casterPower: number
}): { drain: number; duration: number } {
  const drain = spellLevel * casterPower
  const duration = casterPower
  return { drain, duration }
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
