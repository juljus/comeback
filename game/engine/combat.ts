import type { Companion } from '../types'
import { CREATURES } from '../data'
import { randomInt } from './dice'
import { calcArmorReduction, calcMeleeDamage } from './formulas'

export type CompanionCombatSnapshot = {
  name: string
  currentHp: number
  maxHp: number
  armor: number
  diceCount: number
  diceSides: number
  attacksPerRound: number
  alive: boolean
}

export type CompanionRoundResult = {
  name: string
  damageRoll: number
  damageDealt: number
}

export type CombatRoundResult = {
  playerDamageRoll: number
  playerDamageDealt: number
  defenderDamageRoll: number
  defenderDamageDealt: number
  defenderHp: number
  playerHp: number
  defenderDefeated: boolean
  playerDefeated: boolean
  companionResults: CompanionRoundResult[]
}

export type FleeResult = {
  escaped: boolean
  defenderDamageRoll: number
  defenderDamageDealt: number
  playerHp: number
  playerDefeated: boolean
}

export type CombatAction =
  | { type: 'attack'; result: CombatRoundResult }
  | { type: 'flee'; result: FleeResult }

export type NeutralCombatState = {
  defenderKey: string
  defenderHp: number
  defenderMaxHp: number
  defenderArmor: number
  defenderDiceCount: number
  defenderDiceSides: number
  defenderBonusDamage: number
  defenderAttacksPerRound: number
  defenderElementalDamage: number
  defenderDexterity: number
  playerHpSnapshot: number
  companions: CompanionCombatSnapshot[]
  actions: CombatAction[]
  resolved: boolean
  victory: boolean
}

/** Create initial combat state from a creature key in CREATURES. */
export function initNeutralCombat(
  defenderKey: string,
  playerHp: number,
  companions: Companion[] = [],
): NeutralCombatState {
  const creature = CREATURES[defenderKey as keyof typeof CREATURES]
  if (!creature) {
    throw new Error(`Unknown creature key: ${defenderKey}`)
  }

  const elemTotal =
    creature.elementalDamage.fire +
    creature.elementalDamage.earth +
    creature.elementalDamage.air +
    creature.elementalDamage.water

  return {
    defenderKey,
    defenderHp: creature.hp,
    defenderMaxHp: creature.hp,
    defenderArmor: creature.armor,
    defenderDiceCount: creature.diceCount,
    defenderDiceSides: creature.diceSides,
    defenderBonusDamage: creature.bonusDamage,
    defenderAttacksPerRound: creature.attacksPerRound,
    defenderElementalDamage: elemTotal,
    defenderDexterity: creature.dexterity,
    playerHpSnapshot: playerHp,
    companions: companions.map((c) => ({
      name: c.name,
      currentHp: c.currentHp,
      maxHp: c.maxHp,
      armor: c.armor,
      diceCount: c.diceCount,
      diceSides: c.diceSides,
      attacksPerRound: c.attacksPerRound,
      alive: c.currentHp > 0,
    })),
    actions: [],
    resolved: false,
    victory: false,
  }
}

/**
 * Resolve one combat round: player attacks defender, companions attack, then defender attacks player.
 * Each side attacks attacksPerRound times. Elemental damage bypasses armor.
 * Returns the round result without mutating state.
 */
export function resolveAttackRound(
  state: NeutralCombatState,
  playerDiceCount: number,
  playerDiceSides: number,
  playerBonusDamage: number,
  playerArmor: number,
  playerHp: number,
  playerAttacksPerRound: number,
  playerElementalDamage: number,
  rng: () => number,
): CombatRoundResult {
  // 1. Player attacks defender
  let totalPlayerRaw = 0
  let totalPlayerDealt = 0
  let defenderHpAfter = state.defenderHp

  for (let i = 0; i < playerAttacksPerRound && defenderHpAfter > 0; i++) {
    const raw = calcMeleeDamage(playerDiceCount, playerDiceSides, playerBonusDamage, rng)
    const physical = calcArmorReduction(raw, state.defenderArmor)
    const dealt = physical + playerElementalDamage
    totalPlayerRaw += raw
    totalPlayerDealt += dealt
    defenderHpAfter = Math.max(0, defenderHpAfter - dealt)
  }

  // 2. Each living companion attacks defender (if still alive)
  const companionResults: CompanionRoundResult[] = []
  for (const comp of state.companions) {
    if (!comp.alive || defenderHpAfter <= 0) {
      companionResults.push({ name: comp.name, damageRoll: 0, damageDealt: 0 })
      continue
    }
    let compRaw = 0
    let compDealt = 0
    for (let i = 0; i < comp.attacksPerRound && defenderHpAfter > 0; i++) {
      const raw = calcMeleeDamage(comp.diceCount, comp.diceSides, 0, rng)
      const physical = calcArmorReduction(raw, state.defenderArmor)
      compRaw += raw
      compDealt += physical
      defenderHpAfter = Math.max(0, defenderHpAfter - physical)
    }
    companionResults.push({ name: comp.name, damageRoll: compRaw, damageDealt: compDealt })
  }

  // 3. Defender attacks player only (if still alive)
  let totalDefenderRaw = 0
  let totalDefenderDealt = 0
  let playerHpAfter = playerHp

  if (defenderHpAfter > 0) {
    for (let i = 0; i < state.defenderAttacksPerRound && playerHpAfter > 0; i++) {
      const raw = calcMeleeDamage(
        state.defenderDiceCount,
        state.defenderDiceSides,
        state.defenderBonusDamage,
        rng,
      )
      const physical = calcArmorReduction(raw, playerArmor)
      const dealt = physical + state.defenderElementalDamage
      totalDefenderRaw += raw
      totalDefenderDealt += dealt
      playerHpAfter = Math.max(0, playerHpAfter - dealt)
    }
  }

  return {
    playerDamageRoll: totalPlayerRaw,
    playerDamageDealt: totalPlayerDealt,
    defenderDamageRoll: totalDefenderRaw,
    defenderDamageDealt: totalDefenderDealt,
    defenderHp: defenderHpAfter,
    playerHp: playerHpAfter,
    defenderDefeated: defenderHpAfter <= 0,
    playerDefeated: playerHpAfter <= 0,
    companionResults,
  }
}

/**
 * Resolve a flee attempt using the chase roll mechanic.
 *
 * Chase roll formula from the original VBA game:
 * - Base: runner = 2, chaser = 1
 * - dex_diff = runner_dex - chaser_dex
 * - If dex_diff > 0: runner_bonus = 2 + (1 + dex_diff)^2
 * - If dex_diff < 0: chaser_bonus = 1 + (1 + |dex_diff|)^2
 * - Roll 1..(runner_bonus + chaser_bonus); escape if roll > chaser_bonus
 *
 * On failure: defender gets a free hit.
 */
export function resolveFleeAttempt(
  state: NeutralCombatState,
  playerDexterity: number,
  playerArmor: number,
  playerHp: number,
  rng: () => number,
): FleeResult {
  const dexDiff = playerDexterity - state.defenderDexterity

  let runnerBonus = 2
  let chaserBonus = 1

  if (dexDiff > 0) {
    runnerBonus = 2 + (1 + dexDiff) * (1 + dexDiff)
  } else if (dexDiff < 0) {
    chaserBonus = 1 + (1 + Math.abs(dexDiff)) * (1 + Math.abs(dexDiff))
  }

  const roll = randomInt(1, runnerBonus + chaserBonus, rng)
  const escaped = roll > chaserBonus

  if (escaped) {
    return {
      escaped: true,
      defenderDamageRoll: 0,
      defenderDamageDealt: 0,
      playerHp,
      playerDefeated: false,
    }
  }

  // Caught: defender gets a free round of attacks
  let totalRaw = 0
  let totalDealt = 0
  let playerHpAfter = playerHp

  for (let i = 0; i < state.defenderAttacksPerRound && playerHpAfter > 0; i++) {
    const raw = calcMeleeDamage(
      state.defenderDiceCount,
      state.defenderDiceSides,
      state.defenderBonusDamage,
      rng,
    )
    const physical = calcArmorReduction(raw, playerArmor)
    const dealt = physical + state.defenderElementalDamage
    totalRaw += raw
    totalDealt += dealt
    playerHpAfter = Math.max(0, playerHpAfter - dealt)
  }

  return {
    escaped: false,
    defenderDamageRoll: totalRaw,
    defenderDamageDealt: totalDealt,
    playerHp: playerHpAfter,
    playerDefeated: playerHpAfter <= 0,
  }
}
