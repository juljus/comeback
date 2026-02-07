import type { Companion, ImmunityType, PhysicalDamageType, StatusEffect } from '../types'
import { CREATURES } from '../data'
import { randomInt } from './dice'
import {
  calcArmorReduction,
  calcBleedingDamage,
  calcBleedingDecay,
  calcBurningDecay,
  calcElementalAfterResistance,
  calcMeleeDamage,
  calcPoisonDamage,
  calcStunDecay,
  checkColdCrit,
  checkFireCrit,
  checkPhysicalCrit,
} from './formulas'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

export type CombatStatusEffects = Record<StatusEffect, number>

export const EMPTY_STATUS: CombatStatusEffects = {
  bleeding: 0,
  stun: 0,
  poison: 0,
  frozen: 0,
  burning: 0,
}

export const EMPTY_IMMUNITIES: Record<ImmunityType, number> = {
  fire: 0,
  lightning: 0,
  cold: 0,
  poison: 0,
  bleeding: 0,
  stun: 0,
}

// ---------------------------------------------------------------------------
// Combat snapshots & result types
// ---------------------------------------------------------------------------

export type CompanionCombatSnapshot = {
  name: string
  currentHp: number
  maxHp: number
  armor: number
  diceCount: number
  diceSides: number
  attacksPerRound: number
  alive: boolean
  damageType: PhysicalDamageType
  strength: number
  dexterity: number
  power: number
  immunities: Record<ImmunityType, number>
  elementalDamage: { fire: number; earth: number; air: number; water: number }
  statusEffects: CombatStatusEffects
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
  // V2 fields (populated by resolveAttackRoundV2, zero/empty in V1)
  statusEffectDamage: { player: number; defender: number }
  appliedEffects: { target: 'player' | 'defender'; effect: StatusEffect; amount: number }[]
  playerStunned: boolean
  defenderStunned: boolean
  newPlayerStatus: CombatStatusEffects
  newDefenderStatus: CombatStatusEffects
}

export type FleeResult = {
  escaped: boolean
  defenderDamageRoll: number
  defenderDamageDealt: number
  playerHp: number
  playerDefeated: boolean
  cannotFlee: boolean
  bleedingCleared: boolean
}

export type CombatAction =
  | { type: 'attack'; result: CombatRoundResult }
  | { type: 'flee'; result: FleeResult }

// ---------------------------------------------------------------------------
// AttackerProfile (used by V2)
// ---------------------------------------------------------------------------

export type AttackerProfile = {
  diceCount: number
  diceSides: number
  bonusDamage: number
  armor: number
  hp: number
  attacksPerRound: number
  damageType: PhysicalDamageType
  strength: number
  dexterity: number
  power: number
  immunities: Record<ImmunityType, number>
  elementalDamage: { fire: number; earth: number; air: number; water: number }
}

// ---------------------------------------------------------------------------
// NeutralCombatState
// ---------------------------------------------------------------------------

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
  defenderDamageType: PhysicalDamageType
  defenderStrength: number
  defenderPower: number
  defenderImmunities: Record<ImmunityType, number>
  defenderElementalChannels: { fire: number; earth: number; air: number; water: number }
  defenderStatusEffects: CombatStatusEffects
  playerStatusEffects: CombatStatusEffects
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
    defenderDamageType: creature.damageType,
    defenderStrength: creature.strength,
    defenderPower: creature.power,
    defenderImmunities: { ...creature.immunities },
    defenderElementalChannels: { ...creature.elementalDamage },
    defenderStatusEffects: { ...EMPTY_STATUS },
    playerStatusEffects: { ...EMPTY_STATUS },
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
      damageType: c.damageType,
      strength: c.strength,
      dexterity: c.dexterity,
      power: c.power,
      immunities: { ...c.immunities },
      elementalDamage: { ...c.elementalDamage },
      statusEffects: { ...EMPTY_STATUS },
    })),
    actions: [],
    resolved: false,
    victory: false,
  }
}

// ---------------------------------------------------------------------------
// resolveAttackRound (V1 -- thin wrapper for backward compat)
// ---------------------------------------------------------------------------

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
    statusEffectDamage: { player: 0, defender: 0 },
    appliedEffects: [],
    playerStunned: false,
    defenderStunned: false,
    newPlayerStatus: { ...EMPTY_STATUS },
    newDefenderStatus: { ...EMPTY_STATUS },
  }
}

// ---------------------------------------------------------------------------
// Status effect tick helper
// ---------------------------------------------------------------------------

type TickResult = {
  damage: number
  newStatus: CombatStatusEffects
}

function tickStatusEffects(
  status: CombatStatusEffects,
  strength: number,
  rng: () => number,
): TickResult {
  let damage = 0
  const newStatus: CombatStatusEffects = { ...status }

  if (status.bleeding > 0) {
    damage += calcBleedingDamage(status.bleeding, rng)
    newStatus.bleeding = Math.max(0, status.bleeding - calcBleedingDecay(status.bleeding, rng))
  }

  if (status.burning > 0) {
    damage += status.burning
    newStatus.burning = Math.max(0, status.burning - calcBurningDecay(strength, rng))
  }

  if (status.poison > 0) {
    damage += calcPoisonDamage(status.poison, strength, rng)
    newStatus.poison = Math.max(0, status.poison - 1)
  }

  if (status.stun > 0) {
    newStatus.stun = Math.max(0, status.stun - calcStunDecay())
  }

  if (status.frozen > 0) {
    newStatus.frozen = Math.max(0, status.frozen - 1)
  }

  return { damage, newStatus }
}

// ---------------------------------------------------------------------------
// resolveAttackRoundV2
// ---------------------------------------------------------------------------

/**
 * Full combat round with criticals, elemental resistance, and status effects.
 * Does not mutate state -- returns new values for caller to apply.
 */
export function resolveAttackRoundV2(
  state: NeutralCombatState,
  player: AttackerProfile,
  playerStatus: CombatStatusEffects,
  defenderStatus: CombatStatusEffects,
  rng: () => number,
): CombatRoundResult {
  const appliedEffects: CombatRoundResult['appliedEffects'] = []

  // Work with mutable copies
  let playerHp = player.hp
  let defenderHp = state.defenderHp
  let pStatus = { ...playerStatus }
  let dStatus = { ...defenderStatus }

  // Record stun/frozen state BEFORE tick (determines who can act this round)
  const playerStunned = pStatus.stun > 0 || pStatus.frozen > 0
  const defenderStunned = dStatus.stun > 0 || dStatus.frozen > 0

  // 1. Status tick -- both sides
  const playerTick = tickStatusEffects(pStatus, player.strength, rng)
  playerHp = Math.max(0, playerHp - playerTick.damage)
  pStatus = playerTick.newStatus

  const defenderTick = tickStatusEffects(dStatus, state.defenderStrength, rng)
  defenderHp = Math.max(0, defenderHp - defenderTick.damage)
  dStatus = defenderTick.newStatus

  const statusEffectDamage = { player: playerTick.damage, defender: defenderTick.damage }

  // Check deaths from status
  if (playerHp <= 0 || defenderHp <= 0) {
    return {
      playerDamageRoll: 0,
      playerDamageDealt: 0,
      defenderDamageRoll: 0,
      defenderDamageDealt: 0,
      defenderHp,
      playerHp,
      defenderDefeated: defenderHp <= 0,
      playerDefeated: playerHp <= 0,
      companionResults: state.companions.map((c) => ({
        name: c.name,
        damageRoll: 0,
        damageDealt: 0,
      })),
      statusEffectDamage,
      appliedEffects,
      playerStunned,
      defenderStunned,
      newPlayerStatus: pStatus,
      newDefenderStatus: dStatus,
    }
  }

  // 3. Player attacks defender (if not stunned)
  let totalPlayerRaw = 0
  let totalPlayerDealt = 0

  if (!playerStunned) {
    for (let i = 0; i < player.attacksPerRound && defenderHp > 0; i++) {
      // Check crit before armor (pierce needs to know)
      const raw = calcMeleeDamage(player.diceCount, player.diceSides, player.bonusDamage, rng)
      const critResult = checkPhysicalCrit(
        player.damageType,
        raw,
        player.strength,
        player.dexterity,
        state.defenderDexterity,
        state.defenderImmunities,
        rng,
      )

      // Physical damage: pierce crit bypasses armor
      let physical: number
      if (critResult.crit && critResult.type === 'pierce') {
        physical = raw
      } else {
        physical = calcArmorReduction(raw, state.defenderArmor)
      }

      // Per-channel elemental with resistance
      let elemTotal = 0
      for (const ch of ['fire', 'earth', 'air', 'water'] as const) {
        if (player.elementalDamage[ch] > 0) {
          elemTotal += calcElementalAfterResistance(
            ch,
            player.elementalDamage[ch],
            state.defenderStrength,
            state.defenderDexterity,
            state.defenderPower,
            state.defenderImmunities,
            rng,
          )
        }
      }

      // Check elemental crits
      if (player.elementalDamage.fire > 0 && elemTotal > 0) {
        if (checkFireCrit(elemTotal, state.defenderStrength, state.defenderImmunities, rng)) {
          dStatus.burning += elemTotal
          appliedEffects.push({ target: 'defender', effect: 'burning', amount: elemTotal })
        }
      }
      if (player.elementalDamage.water > 0 && elemTotal > 0) {
        if (checkColdCrit(elemTotal, state.defenderStrength, state.defenderImmunities, rng)) {
          dStatus.frozen += 1
          appliedEffects.push({ target: 'defender', effect: 'frozen', amount: 1 })
        }
      }

      // Apply slash crit (bleeding) / crush crit (stun)
      if (critResult.crit && critResult.type === 'slash') {
        dStatus.bleeding += critResult.bleedAmount
        appliedEffects.push({
          target: 'defender',
          effect: 'bleeding',
          amount: critResult.bleedAmount,
        })
      } else if (critResult.crit && critResult.type === 'crush') {
        dStatus.stun += critResult.stunDuration
        appliedEffects.push({
          target: 'defender',
          effect: 'stun',
          amount: critResult.stunDuration,
        })
      }

      const dealt = physical + elemTotal
      totalPlayerRaw += raw
      totalPlayerDealt += dealt
      defenderHp = Math.max(0, defenderHp - dealt)
    }
  }

  // 4. Companion attacks (same per-hit logic)
  const companionResults: CompanionRoundResult[] = []
  for (const comp of state.companions) {
    if (
      !comp.alive ||
      defenderHp <= 0 ||
      comp.statusEffects.stun > 0 ||
      comp.statusEffects.frozen > 0
    ) {
      companionResults.push({ name: comp.name, damageRoll: 0, damageDealt: 0 })
      continue
    }
    let compRaw = 0
    let compDealt = 0
    for (let i = 0; i < comp.attacksPerRound && defenderHp > 0; i++) {
      const raw = calcMeleeDamage(comp.diceCount, comp.diceSides, 0, rng)
      const physical = calcArmorReduction(raw, state.defenderArmor)
      compRaw += raw
      compDealt += physical
      defenderHp = Math.max(0, defenderHp - physical)
    }
    companionResults.push({ name: comp.name, damageRoll: compRaw, damageDealt: compDealt })
  }

  // 5. Defender attacks player (if alive and not stunned)
  let totalDefenderRaw = 0
  let totalDefenderDealt = 0

  if (defenderHp > 0 && !defenderStunned) {
    for (let i = 0; i < state.defenderAttacksPerRound && playerHp > 0; i++) {
      const raw = calcMeleeDamage(
        state.defenderDiceCount,
        state.defenderDiceSides,
        state.defenderBonusDamage,
        rng,
      )
      const critResult = checkPhysicalCrit(
        state.defenderDamageType,
        raw,
        state.defenderStrength,
        state.defenderDexterity,
        player.dexterity,
        player.immunities,
        rng,
      )

      let physical: number
      if (critResult.crit && critResult.type === 'pierce') {
        physical = raw
      } else {
        physical = calcArmorReduction(raw, player.armor)
      }

      // Defender elemental with resistance against player
      let elemTotal = 0
      for (const ch of ['fire', 'earth', 'air', 'water'] as const) {
        if (state.defenderElementalChannels[ch] > 0) {
          elemTotal += calcElementalAfterResistance(
            ch,
            state.defenderElementalChannels[ch],
            player.strength,
            player.dexterity,
            player.power,
            player.immunities,
            rng,
          )
        }
      }

      // Elemental crits on player
      if (state.defenderElementalChannels.fire > 0 && elemTotal > 0) {
        if (checkFireCrit(elemTotal, player.strength, player.immunities, rng)) {
          pStatus.burning += elemTotal
          appliedEffects.push({ target: 'player', effect: 'burning', amount: elemTotal })
        }
      }
      if (state.defenderElementalChannels.water > 0 && elemTotal > 0) {
        if (checkColdCrit(elemTotal, player.strength, player.immunities, rng)) {
          pStatus.frozen += 1
          appliedEffects.push({ target: 'player', effect: 'frozen', amount: 1 })
        }
      }

      // Physical crits on player
      if (critResult.crit && critResult.type === 'slash') {
        pStatus.bleeding += critResult.bleedAmount
        appliedEffects.push({
          target: 'player',
          effect: 'bleeding',
          amount: critResult.bleedAmount,
        })
      } else if (critResult.crit && critResult.type === 'crush') {
        pStatus.stun += critResult.stunDuration
        appliedEffects.push({
          target: 'player',
          effect: 'stun',
          amount: critResult.stunDuration,
        })
      }

      const dealt = physical + elemTotal
      totalDefenderRaw += raw
      totalDefenderDealt += dealt
      playerHp = Math.max(0, playerHp - dealt)
    }
  }

  return {
    playerDamageRoll: totalPlayerRaw,
    playerDamageDealt: totalPlayerDealt,
    defenderDamageRoll: totalDefenderRaw,
    defenderDamageDealt: totalDefenderDealt,
    defenderHp,
    playerHp,
    defenderDefeated: defenderHp <= 0,
    playerDefeated: playerHp <= 0,
    companionResults,
    statusEffectDamage,
    appliedEffects,
    playerStunned,
    defenderStunned,
    newPlayerStatus: pStatus,
    newDefenderStatus: dStatus,
  }
}

// ---------------------------------------------------------------------------
// resolveFleeAttempt
// ---------------------------------------------------------------------------

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
 * If stunned/frozen: cannot flee at all.
 * On success: bleeding is cleared.
 */
export function resolveFleeAttempt(
  state: NeutralCombatState,
  playerDexterity: number,
  playerArmor: number,
  playerHp: number,
  rng: () => number,
  playerStatusEffects?: CombatStatusEffects,
): FleeResult {
  // Stun/frozen prevents fleeing
  if (playerStatusEffects && (playerStatusEffects.stun > 0 || playerStatusEffects.frozen > 0)) {
    return {
      escaped: false,
      defenderDamageRoll: 0,
      defenderDamageDealt: 0,
      playerHp,
      playerDefeated: false,
      cannotFlee: true,
      bleedingCleared: false,
    }
  }

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
      cannotFlee: false,
      bleedingCleared: playerStatusEffects ? playerStatusEffects.bleeding > 0 : false,
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
    cannotFlee: false,
    bleedingCleared: false,
  }
}
