import { CREATURES } from '../data'
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

export type NeutralCombatState = {
  defenderKey: string
  defenderHp: number
  defenderMaxHp: number
  defenderArmor: number
  defenderDiceCount: number
  defenderDiceSides: number
  defenderBonusDamage: number
  playerHpSnapshot: number
  rounds: CombatRoundResult[]
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
    playerHpSnapshot: playerHp,
    rounds: [],
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
