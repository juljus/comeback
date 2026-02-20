import type { PlayerState } from '../types/player'
import type { TitleRank, ManaType } from '../types/enums'
import { CREATURES, SPELLS, ITEMS } from '../data'
import { calcTreasureGold, calcShrineHealing, calcCompanionHealing } from './formulas'
import { randomInt } from './dice'
import { recalcDerivedStats } from './player'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdventureLocationType = 'cave' | 'treasureIsland' | 'dungeon'

export type EventType =
  | 'smallTreasure'
  | 'guardedTreasure'
  | 'mobWithItem'
  | 'dexterityChallenge'
  | 'strengthChallenge'
  | 'powerChallenge'
  | 'hermit'
  | 'manaFountain'
  | 'freePrisoner'
  | 'elementalRiver'
  | 'sage'
  | 'choiceEvent'

export type EventDefinition = {
  type: EventType
  weight: number
}

export type GuardianPoolEntry = {
  creatureKey: string
  baseWeight: number
  dayScaling: number
  titleBonus: number
}

export type SmallTreasureResult = { goldAmount: number }

export type GuardedTreasureResult = {
  guardianKey: string
  treasureGold: number
  treasureItems: string[]
}

export type MobWithItemResult = {
  guardianKey: string
  itemReward: string
}

export type StatChallengeResult = {
  success: boolean
  damageDealt: number
  treasureGold: number
  statGain?: { stat: string; amount: number }
}

export type PowerChallengeResult = {
  success: boolean
  treasureGold: number
  powerGain: boolean
}

export type ManaFountainResult = {
  options: [ManaType, ManaType, ManaType]
}

export type FreePrisonerResult = {
  guardianKey: string
  guardianDifficulty: number
  prisonerKey: string
}

export type ElementalRiverResult = {
  options: [ManaType, ManaType, ManaType, ManaType]
}

export type SageResult = {
  spellOptions: [string, string, string]
}

export type ChoiceEventResult = {
  option1: EventType
  option2: EventType
}

export type HermitResult = {
  choice: 'healing' | 'training'
  healAmount?: number
  companionHealing?: Array<{ name: string; healAmount: number }>
  trainingStat?: 'baseStrength' | 'baseDexterity' | 'basePower'
}

export type EventResult =
  | { type: 'smallTreasure'; data: SmallTreasureResult }
  | { type: 'guardedTreasure'; data: GuardedTreasureResult }
  | { type: 'mobWithItem'; data: MobWithItemResult }
  | { type: 'dexterityChallenge'; data: StatChallengeResult }
  | { type: 'strengthChallenge'; data: StatChallengeResult }
  | { type: 'powerChallenge'; data: PowerChallengeResult }
  | { type: 'hermit' }
  | { type: 'manaFountain'; data: ManaFountainResult }
  | { type: 'freePrisoner'; data: FreePrisonerResult }
  | { type: 'elementalRiver'; data: ElementalRiverResult }
  | { type: 'sage'; data: SageResult }
  | { type: 'choiceEvent'; data: ChoiceEventResult }

// ---------------------------------------------------------------------------
// Event Tables
// ---------------------------------------------------------------------------

export const EVENT_TABLES: Record<AdventureLocationType, EventDefinition[]> = {
  treasureIsland: [
    { type: 'smallTreasure', weight: 20 },
    { type: 'guardedTreasure', weight: 25 },
    { type: 'dexterityChallenge', weight: 10 },
    { type: 'choiceEvent', weight: 100 },
  ],
  cave: [
    { type: 'smallTreasure', weight: 10 },
    { type: 'guardedTreasure', weight: 15 },
    { type: 'mobWithItem', weight: 15 },
    { type: 'strengthChallenge', weight: 10 },
    { type: 'hermit', weight: 20 },
    { type: 'manaFountain', weight: 10 },
    { type: 'freePrisoner', weight: 10 },
    { type: 'elementalRiver', weight: 10 },
    { type: 'sage', weight: 20 },
    { type: 'choiceEvent', weight: 30 },
  ],
  dungeon: [
    { type: 'smallTreasure', weight: 10 },
    { type: 'guardedTreasure', weight: 15 },
    { type: 'mobWithItem', weight: 20 },
    { type: 'dexterityChallenge', weight: 10 },
    { type: 'strengthChallenge', weight: 15 },
    { type: 'powerChallenge', weight: 20 },
    { type: 'manaFountain', weight: 15 },
    { type: 'freePrisoner', weight: 20 },
    { type: 'elementalRiver', weight: 15 },
    { type: 'sage', weight: 5 },
    { type: 'choiceEvent', weight: 100 },
  ],
}

// ---------------------------------------------------------------------------
// Guardian Pools
// ---------------------------------------------------------------------------

export const TREASURE_GUARDIANS: GuardianPoolEntry[] = [
  { creatureKey: 'sprite', baseWeight: 30, dayScaling: -1, titleBonus: -5 },
  { creatureKey: 'skeleton', baseWeight: 25, dayScaling: -0.5, titleBonus: -3 },
  { creatureKey: 'clayGolem', baseWeight: 25, dayScaling: -0.5, titleBonus: -3 },
  { creatureKey: 'gargoyle', baseWeight: 15, dayScaling: 0, titleBonus: 0 },
  { creatureKey: 'troll', baseWeight: 15, dayScaling: 0, titleBonus: 0 },
  { creatureKey: 'wraith', baseWeight: 5, dayScaling: 1, titleBonus: 3 },
  { creatureKey: 'blackDragon', baseWeight: 1, dayScaling: 0.5, titleBonus: 5 },
]

export const ITEM_GUARDIANS: GuardianPoolEntry[] = [
  { creatureKey: 'kobold', baseWeight: 25, dayScaling: -1, titleBonus: -5 },
  { creatureKey: 'goblin', baseWeight: 25, dayScaling: -0.5, titleBonus: -3 },
  { creatureKey: 'darkElf', baseWeight: 20, dayScaling: -0.5, titleBonus: -3 },
  { creatureKey: 'harpy', baseWeight: 15, dayScaling: 0, titleBonus: 0 },
  { creatureKey: 'gargoyle', baseWeight: 15, dayScaling: 0, titleBonus: 0 },
  { creatureKey: 'minotaur', baseWeight: 3, dayScaling: 1, titleBonus: 5 },
  { creatureKey: 'vampire', baseWeight: 3, dayScaling: 1, titleBonus: 5 },
]

// ---------------------------------------------------------------------------
// Title level helper
// ---------------------------------------------------------------------------

const TITLE_LEVELS: Record<TitleRank, number> = {
  none: 0,
  baron: 1,
  count: 2,
  duke: 3,
}

// ---------------------------------------------------------------------------
// selectEvent
// ---------------------------------------------------------------------------

/** Select a random event using weighted random selection. */
export function selectEvent(params: {
  location: AdventureLocationType
  rng: () => number
  excludeTypes?: EventType[]
}): EventType {
  const { location, rng, excludeTypes } = params
  const table = EVENT_TABLES[location]

  const filtered = excludeTypes ? table.filter((e) => !excludeTypes.includes(e.type)) : table

  const totalWeight = filtered.reduce((sum, e) => sum + e.weight, 0)
  const roll = rng() * totalWeight

  let cumulative = 0
  for (const event of filtered) {
    cumulative += event.weight
    if (roll < cumulative) {
      return event.type
    }
  }

  // Fallback: return last event (should not happen unless rng returns exactly 1.0)
  return filtered[filtered.length - 1]!.type
}

// ---------------------------------------------------------------------------
// selectGuardian
// ---------------------------------------------------------------------------

/** Select a guardian creature based on weighted pool, game progression, and title. */
export function selectGuardian(params: {
  guardianPool: GuardianPoolEntry[]
  gameDays: number
  titleRank: TitleRank
  rng: () => number
}): string {
  const { guardianPool, gameDays, titleRank, rng } = params
  const titleLevel = TITLE_LEVELS[titleRank]

  const weights = guardianPool.map((entry) => ({
    creatureKey: entry.creatureKey,
    weight: Math.max(
      1,
      entry.baseWeight + entry.dayScaling * gameDays + entry.titleBonus * titleLevel,
    ),
  }))

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0)
  const roll = rng() * totalWeight

  let cumulative = 0
  for (const w of weights) {
    cumulative += w.weight
    if (roll < cumulative) {
      return w.creatureKey
    }
  }

  return weights[weights.length - 1]!.creatureKey
}

// ---------------------------------------------------------------------------
// selectTreasureItem
// ---------------------------------------------------------------------------

/** Select a random item within a value range. Falls back to closest item if none in range. */
export function selectTreasureItem(params: {
  minValue: number
  maxValue: number
  rng: () => number
}): string {
  const { minValue, maxValue, rng } = params

  const eligibleKeys: string[] = []
  for (const [key, item] of Object.entries(ITEMS)) {
    if (item.value >= minValue && item.value <= maxValue) {
      eligibleKeys.push(key)
    }
  }

  if (eligibleKeys.length > 0) {
    const idx = Math.floor(rng() * eligibleKeys.length)
    return eligibleKeys[idx]!
  }

  // Fallback: find closest item by value to the midpoint of the range
  const midpoint = (minValue + maxValue) / 2
  let closestKey = ''
  let closestDist = Infinity
  for (const [key, item] of Object.entries(ITEMS)) {
    const dist = Math.abs(item.value - midpoint)
    if (dist < closestDist) {
      closestDist = dist
      closestKey = key
    }
  }

  return closestKey
}

// ---------------------------------------------------------------------------
// resolveSmallTreasure
// ---------------------------------------------------------------------------

/** Resolve small treasure event: 50/50 small or medium gold pile. */
export function resolveSmallTreasure(params: {
  gameDays: number
  rng: () => number
}): SmallTreasureResult {
  const { gameDays, rng } = params

  const tier = rng() < 0.5 ? 'small' : 'medium'
  const goldAmount = calcTreasureGold(tier as 'small' | 'medium', gameDays, rng)

  return { goldAmount }
}

// ---------------------------------------------------------------------------
// resolveGuardedTreasure
// ---------------------------------------------------------------------------

/** Resolve guarded treasure event: select guardian, determine treasure rewards. */
export function resolveGuardedTreasure(params: {
  gameDays: number
  titleRank: TitleRank
  rng: () => number
}): GuardedTreasureResult {
  const { gameDays, titleRank, rng } = params

  const guardianKey = selectGuardian({
    guardianPool: TREASURE_GUARDIANS,
    gameDays,
    titleRank,
    rng,
  })

  if (guardianKey === 'blackDragon') {
    // Special: huge gold, 2 high-value + 1 medium-value items
    const treasureGold = calcTreasureGold('huge', gameDays, rng)
    const item1 = selectTreasureItem({ minValue: 999, maxValue: 10000, rng })
    const item2 = selectTreasureItem({ minValue: 999, maxValue: 10000, rng })
    const item3 = selectTreasureItem({ minValue: 500, maxValue: 10000, rng })
    return { guardianKey, treasureGold, treasureItems: [item1, item2, item3] }
  }

  // Normal guardian: medium + large gold, 1-2 items
  const medGold = calcTreasureGold('medium', gameDays, rng)
  const lgGold = calcTreasureGold('large', gameDays, rng)
  const treasureGold = medGold + lgGold

  const itemCount = randomInt(1, 2, rng)
  const treasureItems: string[] = []
  for (let i = 0; i < itemCount; i++) {
    treasureItems.push(
      selectTreasureItem({
        minValue: 100 + gameDays,
        maxValue: 485 + gameDays,
        rng,
      }),
    )
  }

  return { guardianKey, treasureGold, treasureItems }
}

// ---------------------------------------------------------------------------
// resolveMobWithItem
// ---------------------------------------------------------------------------

/** Resolve mob-with-item event: select guardian from item pool, pick item reward. */
export function resolveMobWithItem(params: {
  gameDays: number
  titleRank: TitleRank
  rng: () => number
}): MobWithItemResult {
  const { gameDays, titleRank, rng } = params

  const guardianKey = selectGuardian({
    guardianPool: ITEM_GUARDIANS,
    gameDays,
    titleRank,
    rng,
  })

  const itemReward = selectTreasureItem({
    minValue: 100 + gameDays,
    maxValue: 485 + gameDays,
    rng,
  })

  return { guardianKey, itemReward }
}

// ---------------------------------------------------------------------------
// resolveDexterityChallenge
// ---------------------------------------------------------------------------

/** Resolve dexterity challenge. */
export function resolveDexterityChallenge(params: {
  playerDexterity: number
  rng: () => number
  gameDays: number
}): StatChallengeResult {
  const { playerDexterity, rng, gameDays } = params

  if (playerDexterity >= 4) {
    const treasureGold = calcTreasureGold('small', gameDays, rng)
    return { success: true, damageDealt: 0, treasureGold }
  }

  if (playerDexterity >= 2) {
    // 50/50 chance
    if (rng() >= 0.5) {
      const treasureGold = calcTreasureGold('small', gameDays, rng)
      return { success: true, damageDealt: 0, treasureGold }
    }
    const damage = randomInt(1, 7, rng)
    return { success: false, damageDealt: damage, treasureGold: 0 }
  }

  // Dex < 2: guaranteed failure
  const damage = randomInt(1, 7, rng)
  return { success: false, damageDealt: damage, treasureGold: 0 }
}

// ---------------------------------------------------------------------------
// resolveStrengthChallenge
// ---------------------------------------------------------------------------

/** Resolve strength challenge. */
export function resolveStrengthChallenge(params: {
  playerStrength: number
  rng: () => number
  gameDays: number
}): StatChallengeResult {
  const { playerStrength, rng, gameDays } = params

  if (playerStrength >= 4) {
    const treasureGold = calcTreasureGold('small', gameDays, rng)
    return { success: true, damageDealt: 0, treasureGold }
  }

  if (playerStrength === 3) {
    if (rng() >= 0.5) {
      const treasureGold = calcTreasureGold('small', gameDays, rng)
      return { success: true, damageDealt: 0, treasureGold }
    }
    const damage = randomInt(1, 7, rng)
    return { success: false, damageDealt: damage, treasureGold: 0 }
  }

  // Str < 3: guaranteed failure
  const damage = randomInt(1, 7, rng)
  return { success: false, damageDealt: damage, treasureGold: 0 }
}

// ---------------------------------------------------------------------------
// resolvePowerChallenge
// ---------------------------------------------------------------------------

/** Resolve power challenge (riddle). */
export function resolvePowerChallenge(params: {
  playerPower: number
  rng: () => number
  gameDays: number
}): PowerChallengeResult {
  const { playerPower, rng, gameDays } = params

  const roll = randomInt(1, 4, rng)
  const success = roll <= playerPower

  if (success) {
    const treasureGold = calcTreasureGold('medium', gameDays, rng)
    return { success: true, treasureGold, powerGain: false }
  }

  // Failed: low power may gain +1 power
  let powerGain = false
  if (playerPower <= 2) {
    powerGain = rng() < 0.25
  }

  return { success: false, treasureGold: 0, powerGain }
}

// ---------------------------------------------------------------------------
// resolveHermitHealing
// ---------------------------------------------------------------------------

/** Resolve hermit healing: same as shrine but free. */
export function resolveHermitHealing(params: { player: PlayerState }): {
  newPlayer: PlayerState
  healAmount: number
  companionHealing: Array<{ name: string; healAmount: number }>
} {
  const { player } = params

  const healAmount = calcShrineHealing(player.power, player.hp)
  const newHp = player.hp + healAmount

  const companionHealing: Array<{ name: string; healAmount: number }> = []
  const newCompanions = player.companions.map((comp) => {
    const compHeal = calcCompanionHealing(comp.strength)
    companionHealing.push({ name: comp.name, healAmount: compHeal })
    return {
      ...comp,
      currentHp: Math.min(comp.currentHp + compHeal, comp.maxHp),
      immunities: { ...comp.immunities },
      elementalDamage: { ...comp.elementalDamage },
    }
  })

  const newPlayer: PlayerState = {
    ...player,
    hp: newHp,
    companions: newCompanions,
    equipment: { ...player.equipment },
    mana: { ...player.mana },
    manaRegen: { ...player.manaRegen },
    elementalDamage: { ...player.elementalDamage },
    inventory: [...player.inventory],
    ownedLands: [...player.ownedLands],
    spellbook: { ...player.spellbook },
  }

  return { newPlayer, healAmount, companionHealing }
}

// ---------------------------------------------------------------------------
// resolveHermitTraining
// ---------------------------------------------------------------------------

/** Resolve hermit training: +1 to a chosen stat, free of charge. */
export function resolveHermitTraining(params: {
  player: PlayerState
  stat: 'baseStrength' | 'baseDexterity' | 'basePower'
}): { newPlayer: PlayerState } {
  const { player, stat } = params

  const updated: PlayerState = {
    ...player,
    [stat]: player[stat] + 1,
    equipment: { ...player.equipment },
    mana: { ...player.mana },
    manaRegen: { ...player.manaRegen },
    elementalDamage: { ...player.elementalDamage },
    inventory: [...player.inventory],
    companions: [...player.companions],
    ownedLands: [...player.ownedLands],
    spellbook: { ...player.spellbook },
  }

  return { newPlayer: recalcDerivedStats(updated) }
}

// ---------------------------------------------------------------------------
// generateManaFountainOptions
// ---------------------------------------------------------------------------

const ALL_MANA_TYPES: ManaType[] = ['fire', 'earth', 'air', 'water', 'death', 'life', 'arcane']

/** Generate 3 distinct random mana type options. */
export function generateManaFountainOptions(rng: () => number): [ManaType, ManaType, ManaType] {
  const pool = [...ALL_MANA_TYPES]
  const result: ManaType[] = []

  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(rng() * pool.length)
    result.push(pool[idx]!)
    pool.splice(idx, 1)
  }

  return result as [ManaType, ManaType, ManaType]
}

// ---------------------------------------------------------------------------
// applyManaFountain
// ---------------------------------------------------------------------------

/** Add mana of chosen type to player. */
export function applyManaFountain(params: {
  player: PlayerState
  manaType: ManaType
  amount?: number
}): PlayerState {
  const { player, manaType, amount = 1 } = params

  return {
    ...player,
    mana: {
      ...player.mana,
      [manaType]: player.mana[manaType] + amount,
    },
    equipment: { ...player.equipment },
    manaRegen: { ...player.manaRegen },
    elementalDamage: { ...player.elementalDamage },
    inventory: [...player.inventory],
    companions: [...player.companions],
    ownedLands: [...player.ownedLands],
    spellbook: { ...player.spellbook },
  }
}

// ---------------------------------------------------------------------------
// applyElementalRiver
// ---------------------------------------------------------------------------

/** Add 2 mana of chosen elemental type. */
export function applyElementalRiver(params: {
  player: PlayerState
  manaType: 'fire' | 'earth' | 'air' | 'water'
}): PlayerState {
  return applyManaFountain({ player: params.player, manaType: params.manaType, amount: 2 })
}

// ---------------------------------------------------------------------------
// resolveFreePrisoner
// ---------------------------------------------------------------------------

/** Resolve free prisoner event: select guardian and prisoner. */
export function resolveFreePrisoner(params: {
  gameDays: number
  rng: () => number
}): FreePrisonerResult {
  const { gameDays, rng } = params

  // Guardian from item guardian pool (mid-tier)
  const guardianKey = selectGuardian({
    guardianPool: ITEM_GUARDIANS,
    gameDays,
    titleRank: 'none',
    rng,
  })

  // Difficulty scales 100-200 based on game days
  const guardianDifficulty = Math.min(200, 100 + Math.floor(gameDays * 2))

  // Prisoner: random mercenary creature
  const mercKeys: string[] = []
  for (const [key, creature] of Object.entries(CREATURES)) {
    if (creature.mercTier > 0) {
      mercKeys.push(key)
    }
  }
  const prisonerKey = mercKeys[Math.floor(rng() * mercKeys.length)]!

  return { guardianKey, guardianDifficulty, prisonerKey }
}

// ---------------------------------------------------------------------------
// generateSageSpells
// ---------------------------------------------------------------------------

/** Generate 3 spell options from different ranges. */
export function generateSageSpells(rng: () => number): [string, string, string] {
  const spellKeys = Object.keys(SPELLS)

  // Range 1: indices 0-7
  const range1 = spellKeys.slice(0, 8)
  const spell1 = range1[Math.floor(rng() * range1.length)]!

  // Range 2: indices 8-15
  const range2 = spellKeys.slice(8, 16)
  const spell2 = range2[Math.floor(rng() * range2.length)]!

  // Range 3: indices 16-24
  const range3 = spellKeys.slice(16, 25)
  const spell3 = range3[Math.floor(rng() * range3.length)]!

  return [spell1, spell2, spell3]
}

// ---------------------------------------------------------------------------
// applySageLesson
// ---------------------------------------------------------------------------

/** Learn or upgrade a spell from the sage. */
export function applySageLesson(params: { player: PlayerState; spellKey: string }): {
  newPlayer: PlayerState
  learned: boolean
  newLevel: number
} {
  const { player, spellKey } = params

  const currentLevel = player.spellbook[spellKey] ?? 0
  const learned = currentLevel === 0
  const newLevel = currentLevel + 1

  const newPlayer: PlayerState = {
    ...player,
    spellbook: { ...player.spellbook, [spellKey]: newLevel },
    equipment: { ...player.equipment },
    mana: { ...player.mana },
    manaRegen: { ...player.manaRegen },
    elementalDamage: { ...player.elementalDamage },
    inventory: [...player.inventory],
    companions: [...player.companions],
    ownedLands: [...player.ownedLands],
  }

  return { newPlayer, learned, newLevel }
}

// ---------------------------------------------------------------------------
// resolveChoiceEvent
// ---------------------------------------------------------------------------

/** Generate two distinct event choices (neither is choiceEvent). */
export function resolveChoiceEvent(params: {
  location: AdventureLocationType
  rng: () => number
}): ChoiceEventResult {
  const { location, rng } = params

  const option1 = selectEvent({ location, rng, excludeTypes: ['choiceEvent'] })
  const option2 = selectEvent({ location, rng, excludeTypes: ['choiceEvent', option1] })

  return { option1, option2 }
}

// ---------------------------------------------------------------------------
// triggerAdventureEvent
// ---------------------------------------------------------------------------

/** Main entry point: select and resolve an adventure event. */
export function triggerAdventureEvent(params: {
  location: AdventureLocationType
  player: PlayerState
  gameDays: number
  rng: () => number
}): EventResult {
  const { location, player, gameDays, rng } = params

  const eventType = selectEvent({ location, rng })

  switch (eventType) {
    case 'smallTreasure':
      return { type: 'smallTreasure', data: resolveSmallTreasure({ gameDays, rng }) }

    case 'guardedTreasure':
      return {
        type: 'guardedTreasure',
        data: resolveGuardedTreasure({ gameDays, titleRank: player.title, rng }),
      }

    case 'mobWithItem':
      return {
        type: 'mobWithItem',
        data: resolveMobWithItem({ gameDays, titleRank: player.title, rng }),
      }

    case 'dexterityChallenge':
      return {
        type: 'dexterityChallenge',
        data: resolveDexterityChallenge({ playerDexterity: player.dexterity, rng, gameDays }),
      }

    case 'strengthChallenge':
      return {
        type: 'strengthChallenge',
        data: resolveStrengthChallenge({ playerStrength: player.strength, rng, gameDays }),
      }

    case 'powerChallenge':
      return {
        type: 'powerChallenge',
        data: resolvePowerChallenge({ playerPower: player.power, rng, gameDays }),
      }

    case 'hermit':
      return { type: 'hermit' }

    case 'manaFountain':
      return { type: 'manaFountain', data: { options: generateManaFountainOptions(rng) } }

    case 'freePrisoner':
      return { type: 'freePrisoner', data: resolveFreePrisoner({ gameDays, rng }) }

    case 'elementalRiver':
      return { type: 'elementalRiver', data: { options: ['fire', 'earth', 'air', 'water'] } }

    case 'sage':
      return { type: 'sage', data: { spellOptions: generateSageSpells(rng) } }

    case 'choiceEvent':
      return { type: 'choiceEvent', data: resolveChoiceEvent({ location, rng }) }
  }
}
