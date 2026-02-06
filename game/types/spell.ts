import type { ManaType, SpellEffectType, SpellType } from './enums'

/** Summon table entry: creature name and count at a given knowledge level */
export type SummonTier = {
  readonly creature: string
  readonly count: number
}

/** Static spell definition from spells.csv */
export type SpellDefinition = {
  readonly name: string
  readonly nameEn: string
  readonly nameEt: string
  readonly description: string
  readonly descriptionEn: string
  readonly descriptionEt: string

  // Core (cols 1, 6-8, 10)
  readonly type: SpellType
  readonly manaType: ManaType
  readonly effectType: SpellEffectType
  readonly manaCost: number
  readonly basePower: number

  // Effect flags (cols 11-13)
  readonly generatesGold: boolean
  readonly generatesItem: boolean
  readonly isSummon: boolean

  // Summon data (cols 14-23) -- 5 knowledge tiers
  readonly summonTiers: readonly SummonTier[]

  // Targeting flags (cols 24-32)
  readonly isAggressive: boolean
  readonly canTargetFriendly: boolean
  readonly canTargetHostile: boolean
  readonly canTargetGroup: boolean
  readonly canTargetSingle: boolean
  readonly canTargetLand: boolean
  readonly hasHealEffectAlt: boolean
  readonly canTargetPlayer: boolean
  readonly hasGlobalRange: boolean

  // Effect modifiers (cols 33-40)
  readonly hasHealEffect: boolean
  readonly hasArmorBuff: boolean
  readonly hasHasteEffect: boolean
  readonly hasStrengthBuff: boolean
  readonly hasWindEffect: boolean
  readonly vampiricPercent: number
}
