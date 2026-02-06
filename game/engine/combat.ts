import { CREATURES } from '../data'
import { randomInt } from './dice'
import { calcArmorReduction, calcMeleeDamage } from './formulas'

export type CombatRoundResult = {
  playerDamageRoll: number
  playerDamageDealt: number
  defenderDamageRoll: number
  defenderDamageDealt: number
  defenderHp: number
  playerHp: number
  defenderDefeated: boolean
  playerDefeated: boolean
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
  defenderDexterity: number
  playerHpSnapshot: number
  actions: CombatAction[]
  resolved: boolean
  victory: boolean
}

/** Create initial combat state from a creature key in CREATURES. */
export function initNeutralCombat(defenderKey: string, playerHp: number): NeutralCombatState {
  const creature = CREATURES[defenderKey as keyof typeof CREATURES]
  if (!creature) {
    throw new Error(`Unknown creature key: ${defenderKey}`)
  }

  return {
    defenderKey,
    defenderHp: creature.hp,
    defenderMaxHp: creature.hp,
    defenderArmor: creature.armor,
    defenderDiceCount: creature.diceCount,
    defenderDiceSides: creature.diceSides,
    defenderBonusDamage: creature.bonusDamage,
    defenderDexterity: creature.dexterity,
    playerHpSnapshot: playerHp,
    actions: [],
    resolved: false,
    victory: false,
  }
}

/**
 * Resolve one combat round: player attacks defender, then defender attacks back (if alive).
 * Returns the round result without mutating state.
 */
export function resolveAttackRound(
  state: NeutralCombatState,
  playerDiceCount: number,
  playerDiceSides: number,
  playerBonusDamage: number,
  playerArmor: number,
  playerHp: number,
  rng: () => number,
): CombatRoundResult {
  // Player attacks defender
  const playerRawDamage = calcMeleeDamage(playerDiceCount, playerDiceSides, playerBonusDamage, rng)
  const playerDamageDealt = calcArmorReduction(playerRawDamage, state.defenderArmor)
  const defenderHpAfter = Math.max(0, state.defenderHp - playerDamageDealt)

  // Defender attacks back (only if still alive)
  let defenderRawDamage = 0
  let defenderDamageDealt = 0
  let playerHpAfter = playerHp

  if (defenderHpAfter > 0) {
    defenderRawDamage = calcMeleeDamage(
      state.defenderDiceCount,
      state.defenderDiceSides,
      state.defenderBonusDamage,
      rng,
    )
    defenderDamageDealt = calcArmorReduction(defenderRawDamage, playerArmor)
    playerHpAfter = Math.max(0, playerHp - defenderDamageDealt)
  }

  return {
    playerDamageRoll: playerRawDamage,
    playerDamageDealt,
    defenderDamageRoll: defenderRawDamage,
    defenderDamageDealt,
    defenderHp: defenderHpAfter,
    playerHp: playerHpAfter,
    defenderDefeated: defenderHpAfter <= 0,
    playerDefeated: playerHpAfter <= 0,
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

  // Caught: defender gets a free hit
  const defenderRawDamage = calcMeleeDamage(
    state.defenderDiceCount,
    state.defenderDiceSides,
    state.defenderBonusDamage,
    rng,
  )
  const defenderDamageDealt = calcArmorReduction(defenderRawDamage, playerArmor)
  const playerHpAfter = Math.max(0, playerHp - defenderDamageDealt)

  return {
    escaped: false,
    defenderDamageRoll: defenderRawDamage,
    defenderDamageDealt,
    playerHp: playerHpAfter,
    playerDefeated: playerHpAfter <= 0,
  }
}
