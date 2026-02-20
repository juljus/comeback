import type { Companion, ImmunityType, PhysicalDamageType, StatusEffect } from '../types'
import type { PlayerState } from '../types/player'
import type { BoardSquare } from '../types/board'
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
// Fortified combat: defender snapshot
// ---------------------------------------------------------------------------

export type DefenderSnapshot = {
  key: string
  currentHp: number
  maxHp: number
  armor: number
  diceCount: number
  diceSides: number
  bonusDamage: number
  attacksPerRound: number
  damageType: PhysicalDamageType
  strength: number
  dexterity: number
  power: number
  immunities: Record<ImmunityType, number>
  elementalDamage: { fire: number; earth: number; air: number; water: number }
  statusEffects: CombatStatusEffects
  behindWall: boolean
  alive: boolean
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
  damageTaken: number
  statusEffectDamage: number
  appliedEffects: { effect: StatusEffect; amount: number }[]
  stunned: boolean
  alive: boolean
  currentHp: number
  newStatus: CombatStatusEffects
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
  appliedEffects: {
    target: 'player' | 'defender' | `companion:${string}`
    effect: StatusEffect
    amount: number
  }[]
  playerStunned: boolean
  defenderStunned: boolean
  newPlayerStatus: CombatStatusEffects
  newDefenderStatus: CombatStatusEffects
  newCompanions: CompanionCombatSnapshot[]
  retaliationDamage: number
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
  | { type: 'attack'; result: CombatRoundResult | FortifiedRoundResult }
  | { type: 'flee'; result: FleeResult }
  | { type: 'spell'; result: import('./combatMagic').SpellCombatResult }

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
  retaliationPercent: number
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
  defenders: DefenderSnapshot[]
  actions: CombatAction[]
  resolved: boolean
  victory: boolean
  pvpOpponentId?: number
  pvpOpponentName?: string
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
    defenders: [
      {
        key: defenderKey,
        currentHp: creature.hp,
        maxHp: creature.hp,
        armor: creature.armor,
        diceCount: creature.diceCount,
        diceSides: creature.diceSides,
        bonusDamage: creature.bonusDamage,
        attacksPerRound: creature.attacksPerRound,
        damageType: creature.damageType,
        strength: creature.strength,
        dexterity: creature.dexterity,
        power: creature.power,
        immunities: { ...creature.immunities },
        elementalDamage: { ...creature.elementalDamage },
        statusEffects: { ...EMPTY_STATUS },
        behindWall: false,
        alive: true,
      },
    ],
    actions: [],
    resolved: false,
    victory: false,
  }
}

// ---------------------------------------------------------------------------
// initFortifiedCombat
// ---------------------------------------------------------------------------

function snapshotCreature(key: string, behindWall: boolean): DefenderSnapshot {
  const creature = CREATURES[key as keyof typeof CREATURES]
  if (!creature) throw new Error(`Unknown creature key: ${key}`)
  return {
    key,
    currentHp: creature.hp,
    maxHp: creature.hp,
    armor: creature.armor,
    diceCount: creature.diceCount,
    diceSides: creature.diceSides,
    bonusDamage: creature.bonusDamage,
    attacksPerRound: creature.attacksPerRound,
    damageType: creature.damageType,
    strength: creature.strength,
    dexterity: creature.dexterity,
    power: creature.power,
    immunities: { ...creature.immunities },
    elementalDamage: { ...creature.elementalDamage },
    statusEffects: { ...EMPTY_STATUS },
    behindWall,
    alive: true,
  }
}

/**
 * Create combat state for attacking a fortified land.
 * Defenders: [gate, archer1, ..., archerN, landDefender].
 * Gate at index 0. All non-gate defenders have behindWall=true.
 * Flat defender* fields on state point to the gate (primary target).
 */
export function initFortifiedCombat(
  gateKey: string,
  archerKey: string,
  archerCount: number,
  landDefenderKey: string,
  playerHp: number,
  companions: Companion[] = [],
): NeutralCombatState {
  const gate = snapshotCreature(gateKey, false)
  const archers: DefenderSnapshot[] = []
  for (let i = 0; i < archerCount; i++) {
    archers.push(snapshotCreature(archerKey, true))
  }
  const landDefender = snapshotCreature(landDefenderKey, true)

  const defenders = [gate, ...archers, landDefender]

  // Flat fields point to gate (primary target)
  const gateCreature = CREATURES[gateKey as keyof typeof CREATURES]!
  const gateElemTotal =
    gateCreature.elementalDamage.fire +
    gateCreature.elementalDamage.earth +
    gateCreature.elementalDamage.air +
    gateCreature.elementalDamage.water

  return {
    defenderKey: gateKey,
    defenderHp: gateCreature.hp,
    defenderMaxHp: gateCreature.hp,
    defenderArmor: gateCreature.armor,
    defenderDiceCount: gateCreature.diceCount,
    defenderDiceSides: gateCreature.diceSides,
    defenderBonusDamage: gateCreature.bonusDamage,
    defenderAttacksPerRound: gateCreature.attacksPerRound,
    defenderElementalDamage: gateElemTotal,
    defenderDexterity: gateCreature.dexterity,
    defenderDamageType: gateCreature.damageType,
    defenderStrength: gateCreature.strength,
    defenderPower: gateCreature.power,
    defenderImmunities: { ...gateCreature.immunities },
    defenderElementalChannels: { ...gateCreature.elementalDamage },
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
    defenders,
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
      companionResults.push({
        name: comp.name,
        damageRoll: 0,
        damageDealt: 0,
        damageTaken: 0,
        statusEffectDamage: 0,
        appliedEffects: [],
        stunned: false,
        alive: comp.alive,
        currentHp: comp.currentHp,
        newStatus: { ...comp.statusEffects },
      })
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
    companionResults.push({
      name: comp.name,
      damageRoll: compRaw,
      damageDealt: compDealt,
      damageTaken: 0,
      statusEffectDamage: 0,
      appliedEffects: [],
      stunned: false,
      alive: comp.alive,
      currentHp: comp.currentHp,
      newStatus: { ...comp.statusEffects },
    })
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
    newCompanions: state.companions,
    retaliationDamage: 0,
  }
}

// ---------------------------------------------------------------------------
// Status effect tick helper
// ---------------------------------------------------------------------------

type TickResult = {
  damage: number
  newStatus: CombatStatusEffects
}

export function tickStatusEffects(
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
// resolveAttackHits -- shared attack logic for player, companion, defender
// ---------------------------------------------------------------------------

export type AttackHitParams = {
  diceCount: number
  diceSides: number
  bonusDamage: number
  attacksPerRound: number
  damageType: PhysicalDamageType
  strength: number
  dexterity: number
  elementalDamage: { fire: number; earth: number; air: number; water: number }
}

export type DefenseParams = {
  armor: number
  dexterity: number
  strength: number
  power: number
  immunities: Record<ImmunityType, number>
}

export type HitResult = {
  totalRaw: number
  totalDealt: number
  targetHpAfter: number
  critEffects: { effect: StatusEffect; amount: number }[]
}

export function resolveAttackHits(
  attacker: AttackHitParams,
  target: DefenseParams,
  targetHp: number,
  targetStatus: CombatStatusEffects,
  rng: () => number,
): HitResult {
  let totalRaw = 0
  let totalDealt = 0
  let hp = targetHp
  const critEffects: HitResult['critEffects'] = []

  for (let i = 0; i < attacker.attacksPerRound && hp > 0; i++) {
    const raw = calcMeleeDamage(attacker.diceCount, attacker.diceSides, attacker.bonusDamage, rng)
    const critResult = checkPhysicalCrit(
      attacker.damageType,
      raw,
      attacker.strength,
      attacker.dexterity,
      target.dexterity,
      target.immunities,
      rng,
    )

    let physical: number
    if (critResult.crit && critResult.type === 'pierce') {
      physical = raw
    } else {
      physical = calcArmorReduction(raw, target.armor)
    }

    let elemTotal = 0
    for (const ch of ['fire', 'earth', 'air', 'water'] as const) {
      if (attacker.elementalDamage[ch] > 0) {
        elemTotal += calcElementalAfterResistance(
          ch,
          attacker.elementalDamage[ch],
          target.strength,
          target.dexterity,
          target.power,
          target.immunities,
          rng,
        )
      }
    }

    if (attacker.elementalDamage.fire > 0 && elemTotal > 0) {
      if (checkFireCrit(elemTotal, target.strength, target.immunities, rng)) {
        targetStatus.burning += elemTotal
        critEffects.push({ effect: 'burning', amount: elemTotal })
      }
    }
    if (attacker.elementalDamage.water > 0 && elemTotal > 0) {
      if (checkColdCrit(elemTotal, target.strength, target.immunities, rng)) {
        targetStatus.frozen += 1
        critEffects.push({ effect: 'frozen', amount: 1 })
      }
    }

    if (critResult.crit && critResult.type === 'slash') {
      targetStatus.bleeding += critResult.bleedAmount
      critEffects.push({ effect: 'bleeding', amount: critResult.bleedAmount })
    } else if (critResult.crit && critResult.type === 'crush') {
      targetStatus.stun += critResult.stunDuration
      critEffects.push({ effect: 'stun', amount: critResult.stunDuration })
    }

    const dealt = physical + elemTotal
    totalRaw += raw
    totalDealt += dealt
    hp = Math.max(0, hp - dealt)
  }

  return { totalRaw, totalDealt, targetHpAfter: hp, critEffects }
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

  // Deep-copy companion snapshots for mutation during the round
  const compSnapshots: CompanionCombatSnapshot[] = state.companions.map((c) => ({
    ...c,
    immunities: { ...c.immunities },
    elementalDamage: { ...c.elementalDamage },
    statusEffects: { ...c.statusEffects },
  }))

  // Record stun/frozen state BEFORE tick (determines who can act this round)
  const playerStunned = pStatus.stun > 0 || pStatus.frozen > 0
  const defenderStunned = dStatus.stun > 0 || dStatus.frozen > 0

  // Per-companion metadata for the round
  const compMeta: {
    stunned: boolean
    tickDamage: number
    damageTaken: number
    appliedEffects: { effect: StatusEffect; amount: number }[]
  }[] = compSnapshots.map((c) => ({
    stunned: c.statusEffects.stun > 0 || c.statusEffects.frozen > 0,
    tickDamage: 0,
    damageTaken: 0,
    appliedEffects: [],
  }))

  // 1. Status tick -- player, defender, then each living companion
  const playerTick = tickStatusEffects(pStatus, player.strength, rng)
  playerHp = Math.max(0, playerHp - playerTick.damage)
  pStatus = playerTick.newStatus

  const defenderTick = tickStatusEffects(dStatus, state.defenderStrength, rng)
  defenderHp = Math.max(0, defenderHp - defenderTick.damage)
  dStatus = defenderTick.newStatus

  for (let ci = 0; ci < compSnapshots.length; ci++) {
    const comp = compSnapshots[ci]!
    if (!comp.alive) continue
    const tick = tickStatusEffects(comp.statusEffects, comp.strength, rng)
    comp.currentHp = Math.max(0, comp.currentHp - tick.damage)
    comp.statusEffects = tick.newStatus
    compMeta[ci]!.tickDamage = tick.damage
    if (comp.currentHp <= 0) {
      comp.alive = false
    }
  }

  const statusEffectDamage = { player: playerTick.damage, defender: defenderTick.damage }

  // Helper to build a no-action CompanionRoundResult
  function noActionCompResult(ci: number): CompanionRoundResult {
    const comp = compSnapshots[ci]!
    const meta = compMeta[ci]!
    return {
      name: comp.name,
      damageRoll: 0,
      damageDealt: 0,
      damageTaken: meta.damageTaken,
      statusEffectDamage: meta.tickDamage,
      appliedEffects: meta.appliedEffects,
      stunned: meta.stunned,
      alive: comp.alive,
      currentHp: comp.currentHp,
      newStatus: { ...comp.statusEffects },
    }
  }

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
      companionResults: compSnapshots.map((_, ci) => noActionCompResult(ci)),
      statusEffectDamage,
      appliedEffects,
      playerStunned,
      defenderStunned,
      newPlayerStatus: pStatus,
      newDefenderStatus: dStatus,
      newCompanions: compSnapshots,
      retaliationDamage: 0,
    }
  }

  // 2. Player attacks defender (if not stunned)
  let totalPlayerRaw = 0
  let totalPlayerDealt = 0

  if (!playerStunned) {
    const defenseParams: DefenseParams = {
      armor: state.defenderArmor,
      dexterity: state.defenderDexterity,
      strength: state.defenderStrength,
      power: state.defenderPower,
      immunities: state.defenderImmunities,
    }
    const hit = resolveAttackHits(
      {
        diceCount: player.diceCount,
        diceSides: player.diceSides,
        bonusDamage: player.bonusDamage,
        attacksPerRound: player.attacksPerRound,
        damageType: player.damageType,
        strength: player.strength,
        dexterity: player.dexterity,
        elementalDamage: player.elementalDamage,
      },
      defenseParams,
      defenderHp,
      dStatus,
      rng,
    )
    totalPlayerRaw = hit.totalRaw
    totalPlayerDealt = hit.totalDealt
    defenderHp = hit.targetHpAfter
    for (const e of hit.critEffects) {
      appliedEffects.push({ target: 'defender', ...e })
    }
  }

  // 3. Companion attacks defender (full crit/elemental logic)
  const companionResults: CompanionRoundResult[] = []
  for (let ci = 0; ci < compSnapshots.length; ci++) {
    const comp = compSnapshots[ci]!
    const meta = compMeta[ci]!
    if (!comp.alive || defenderHp <= 0 || meta.stunned) {
      companionResults.push(noActionCompResult(ci))
      continue
    }

    const defenseParams: DefenseParams = {
      armor: state.defenderArmor,
      dexterity: state.defenderDexterity,
      strength: state.defenderStrength,
      power: state.defenderPower,
      immunities: state.defenderImmunities,
    }
    const hit = resolveAttackHits(
      {
        diceCount: comp.diceCount,
        diceSides: comp.diceSides,
        bonusDamage: 0,
        attacksPerRound: comp.attacksPerRound,
        damageType: comp.damageType,
        strength: comp.strength,
        dexterity: comp.dexterity,
        elementalDamage: comp.elementalDamage,
      },
      defenseParams,
      defenderHp,
      dStatus,
      rng,
    )
    defenderHp = hit.targetHpAfter
    for (const e of hit.critEffects) {
      appliedEffects.push({ target: `companion:${comp.name}` as const, ...e })
    }

    companionResults.push({
      name: comp.name,
      damageRoll: hit.totalRaw,
      damageDealt: hit.totalDealt,
      damageTaken: meta.damageTaken,
      statusEffectDamage: meta.tickDamage,
      appliedEffects: [...meta.appliedEffects, ...hit.critEffects],
      stunned: meta.stunned,
      alive: comp.alive,
      currentHp: comp.currentHp,
      newStatus: { ...comp.statusEffects },
    })
  }

  // 4. Defender attacks random targets (player + living companions)
  let totalDefenderRaw = 0
  let totalDefenderDealt = 0

  if (defenderHp > 0 && !defenderStunned) {
    for (let i = 0; i < state.defenderAttacksPerRound; i++) {
      // Build target pool: player (if alive) + living companions
      type TargetEntry = { kind: 'player' } | { kind: 'companion'; index: number }
      const pool: TargetEntry[] = []
      if (playerHp > 0) pool.push({ kind: 'player' })
      for (let ci = 0; ci < compSnapshots.length; ci++) {
        if (compSnapshots[ci]!.alive && compSnapshots[ci]!.currentHp > 0) {
          pool.push({ kind: 'companion', index: ci })
        }
      }
      if (pool.length === 0) break

      const target = pool[Math.floor(rng() * pool.length)]!

      if (target.kind === 'player') {
        const hit = resolveAttackHits(
          {
            diceCount: state.defenderDiceCount,
            diceSides: state.defenderDiceSides,
            bonusDamage: state.defenderBonusDamage,
            attacksPerRound: 1,
            damageType: state.defenderDamageType,
            strength: state.defenderStrength,
            dexterity: state.defenderDexterity,
            elementalDamage: state.defenderElementalChannels,
          },
          {
            armor: player.armor,
            dexterity: player.dexterity,
            strength: player.strength,
            power: player.power,
            immunities: player.immunities,
          },
          playerHp,
          pStatus,
          rng,
        )
        totalDefenderRaw += hit.totalRaw
        totalDefenderDealt += hit.totalDealt
        playerHp = hit.targetHpAfter
        for (const e of hit.critEffects) {
          appliedEffects.push({ target: 'player', ...e })
        }
      } else {
        const ci = target.index
        const comp = compSnapshots[ci]!
        const hit = resolveAttackHits(
          {
            diceCount: state.defenderDiceCount,
            diceSides: state.defenderDiceSides,
            bonusDamage: state.defenderBonusDamage,
            attacksPerRound: 1,
            damageType: state.defenderDamageType,
            strength: state.defenderStrength,
            dexterity: state.defenderDexterity,
            elementalDamage: state.defenderElementalChannels,
          },
          {
            armor: comp.armor,
            dexterity: comp.dexterity,
            strength: comp.strength,
            power: comp.power,
            immunities: comp.immunities,
          },
          comp.currentHp,
          comp.statusEffects,
          rng,
        )
        comp.currentHp = hit.targetHpAfter
        if (comp.currentHp <= 0) comp.alive = false
        compMeta[ci]!.damageTaken += hit.totalDealt
        for (const e of hit.critEffects) {
          compMeta[ci]!.appliedEffects.push(e)
          appliedEffects.push({ target: `companion:${comp.name}` as const, ...e })
        }

        // Update the companion result if already pushed (only if they attacked earlier)
        const existing = companionResults.find((r) => r.name === comp.name)
        if (existing) {
          existing.damageTaken = compMeta[ci]!.damageTaken
          existing.appliedEffects = [...compMeta[ci]!.appliedEffects]
          existing.alive = comp.alive
          existing.currentHp = comp.currentHp
          existing.newStatus = { ...comp.statusEffects }
        }
      }
    }
  }

  // Fill in companion results for any companions not yet in companionResults
  // (this handles the case where companion was dead/stunned/defender-died before their turn)
  if (companionResults.length === 0) {
    for (let ci = 0; ci < compSnapshots.length; ci++) {
      companionResults.push(noActionCompResult(ci))
    }
  }

  // Final update: sync companion results with post-defender-attack state
  for (const cr of companionResults) {
    const ci = compSnapshots.findIndex((c) => c.name === cr.name)
    if (ci >= 0) {
      cr.damageTaken = compMeta[ci]!.damageTaken
      cr.appliedEffects = [...compMeta[ci]!.appliedEffects]
      cr.alive = compSnapshots[ci]!.alive
      cr.currentHp = compSnapshots[ci]!.currentHp
      cr.newStatus = { ...compSnapshots[ci]!.statusEffects }
    }
  }

  // 5. Retaliation: reflect melee damage back to defender
  let retaliationDamage = 0
  if (player.retaliationPercent > 0 && totalDefenderDealt > 0 && defenderHp > 0) {
    retaliationDamage = Math.floor((totalDefenderDealt * player.retaliationPercent) / 100)
    defenderHp = Math.max(0, defenderHp - retaliationDamage)
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
    newCompanions: compSnapshots,
    retaliationDamage,
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

// ---------------------------------------------------------------------------
// Fortified combat types
// ---------------------------------------------------------------------------

export type DefenderRoundResult = {
  index: number
  key: string
  damageDealt: number
  damageTaken: number
  statusEffectDamage: number
  appliedEffects: { effect: StatusEffect; amount: number }[]
  stunned: boolean
  alive: boolean
  currentHp: number
  newStatus: CombatStatusEffects
}

export type FortifiedRoundResult = {
  playerHp: number
  playerDamageDealt: number
  defenderResults: DefenderRoundResult[]
  companionResults: CompanionRoundResult[]
  newCompanions: CompanionCombatSnapshot[]
  newDefenders: DefenderSnapshot[]
  gateDestroyed: boolean
  allDefendersDefeated: boolean
  playerDefeated: boolean
  statusEffectDamage: { player: number }
  appliedEffects: {
    target: 'player' | `defender:${number}` | `companion:${string}`
    effect: StatusEffect
    amount: number
  }[]
  playerStunned: boolean
  newPlayerStatus: CombatStatusEffects
}

export type FortifiedCombatAction =
  | { type: 'attack'; result: FortifiedRoundResult }
  | { type: 'flee'; result: FleeResult }

// ---------------------------------------------------------------------------
// resolveFortifiedRound
// ---------------------------------------------------------------------------

/**
 * Resolve one round of fortified combat.
 * targetAssignments maps allyIndex -> defenderIndex.
 * allyIndex 0 = player, 1+ = companions[i-1].
 */
export function resolveFortifiedRound(
  state: NeutralCombatState,
  player: AttackerProfile,
  targetAssignments: Map<number, number>,
  rng: () => number,
): FortifiedRoundResult {
  const appliedEffects: FortifiedRoundResult['appliedEffects'] = []

  let playerHp = player.hp

  // Deep-copy defenders
  const defs: DefenderSnapshot[] = state.defenders.map((d) => ({
    ...d,
    immunities: { ...d.immunities },
    elementalDamage: { ...d.elementalDamage },
    statusEffects: { ...d.statusEffects },
  }))

  // Deep-copy companion snapshots
  const compSnapshots: CompanionCombatSnapshot[] = state.companions.map((c) => ({
    ...c,
    immunities: { ...c.immunities },
    elementalDamage: { ...c.elementalDamage },
    statusEffects: { ...c.statusEffects },
  }))

  // Record pre-tick stun state
  let pStatus = { ...state.playerStatusEffects }
  const playerStunned = pStatus.stun > 0 || pStatus.frozen > 0

  const defMeta: {
    stunned: boolean
    tickDamage: number
    damageTaken: number
    damageDealt: number
    appliedEffects: { effect: StatusEffect; amount: number }[]
  }[] = defs.map((d) => ({
    stunned: d.statusEffects.stun > 0 || d.statusEffects.frozen > 0,
    tickDamage: 0,
    damageTaken: 0,
    damageDealt: 0,
    appliedEffects: [],
  }))

  const compMeta: {
    stunned: boolean
    tickDamage: number
    damageTaken: number
    appliedEffects: { effect: StatusEffect; amount: number }[]
  }[] = compSnapshots.map((c) => ({
    stunned: c.statusEffects.stun > 0 || c.statusEffects.frozen > 0,
    tickDamage: 0,
    damageTaken: 0,
    appliedEffects: [],
  }))

  // 1. Status tick -- player
  const playerTick = tickStatusEffects(pStatus, player.strength, rng)
  playerHp = Math.max(0, playerHp - playerTick.damage)
  pStatus = playerTick.newStatus

  // Status tick -- each living defender
  for (let di = 0; di < defs.length; di++) {
    const def = defs[di]!
    if (!def.alive) continue
    const tick = tickStatusEffects(def.statusEffects, def.strength, rng)
    def.currentHp = Math.max(0, def.currentHp - tick.damage)
    def.statusEffects = tick.newStatus
    defMeta[di]!.tickDamage = tick.damage
    if (def.currentHp <= 0) def.alive = false
  }

  // Status tick -- each living companion
  for (let ci = 0; ci < compSnapshots.length; ci++) {
    const comp = compSnapshots[ci]!
    if (!comp.alive) continue
    const tick = tickStatusEffects(comp.statusEffects, comp.strength, rng)
    comp.currentHp = Math.max(0, comp.currentHp - tick.damage)
    comp.statusEffects = tick.newStatus
    compMeta[ci]!.tickDamage = tick.damage
    if (comp.currentHp <= 0) comp.alive = false
  }

  // Check early deaths
  const allDeadEarly = defs.every((d) => !d.alive)
  if (playerHp <= 0 || allDeadEarly) {
    return buildFortifiedResult(
      playerHp,
      0,
      defs,
      defMeta,
      compSnapshots,
      compMeta,
      appliedEffects,
      playerStunned,
      pStatus,
      playerTick.damage,
    )
  }

  // 2. Behind-wall enforcement: if gate alive, force melee to gate (index 0)
  const gateAlive = defs[0]!.alive
  const enforced = new Map<number, number>()
  for (const [allyIdx, defIdx] of targetAssignments) {
    if (gateAlive && defIdx !== 0) {
      // Force to gate -- melee cannot reach behind wall
      enforced.set(allyIdx, 0)
    } else {
      enforced.set(allyIdx, defIdx)
    }
  }

  // 3. Player attacks assigned defender (if not stunned)
  let totalPlayerDealt = 0
  if (!playerStunned && playerHp > 0) {
    const targetIdx = enforced.get(0) ?? 0
    const target = defs[targetIdx]!
    if (target.alive) {
      const defParams: DefenseParams = {
        armor: target.armor,
        dexterity: target.dexterity,
        strength: target.strength,
        power: target.power,
        immunities: target.immunities,
      }
      const hit = resolveAttackHits(
        {
          diceCount: player.diceCount,
          diceSides: player.diceSides,
          bonusDamage: player.bonusDamage,
          attacksPerRound: player.attacksPerRound,
          damageType: player.damageType,
          strength: player.strength,
          dexterity: player.dexterity,
          elementalDamage: player.elementalDamage,
        },
        defParams,
        target.currentHp,
        target.statusEffects,
        rng,
      )
      totalPlayerDealt += hit.totalDealt
      target.currentHp = hit.targetHpAfter
      defMeta[targetIdx]!.damageTaken += hit.totalDealt
      if (target.currentHp <= 0) target.alive = false
      for (const e of hit.critEffects) {
        defMeta[targetIdx]!.appliedEffects.push(e)
        appliedEffects.push({ target: `defender:${targetIdx}`, ...e })
      }
    }
  }

  // 4. Companion attacks assigned defenders (if not stunned/dead)
  for (let ci = 0; ci < compSnapshots.length; ci++) {
    const comp = compSnapshots[ci]!
    if (!comp.alive || compMeta[ci]!.stunned) continue

    const allyIdx = ci + 1
    const targetIdx = enforced.get(allyIdx) ?? 0
    const target = defs[targetIdx]!
    if (!target.alive) continue

    const defParams: DefenseParams = {
      armor: target.armor,
      dexterity: target.dexterity,
      strength: target.strength,
      power: target.power,
      immunities: target.immunities,
    }
    const hit = resolveAttackHits(
      {
        diceCount: comp.diceCount,
        diceSides: comp.diceSides,
        bonusDamage: 0,
        attacksPerRound: comp.attacksPerRound,
        damageType: comp.damageType,
        strength: comp.strength,
        dexterity: comp.dexterity,
        elementalDamage: comp.elementalDamage,
      },
      defParams,
      target.currentHp,
      target.statusEffects,
      rng,
    )
    target.currentHp = hit.targetHpAfter
    defMeta[targetIdx]!.damageTaken += hit.totalDealt
    if (target.currentHp <= 0) target.alive = false
    for (const e of hit.critEffects) {
      defMeta[targetIdx]!.appliedEffects.push(e)
      appliedEffects.push({ target: `defender:${targetIdx}`, ...e })
    }
  }

  // 5. Each living non-gate, non-stunned defender attacks random target
  for (let di = 0; di < defs.length; di++) {
    const def = defs[di]!
    if (!def.alive || defMeta[di]!.stunned) continue
    // Gates don't attack (diceCount=0)
    if (def.diceCount === 0) continue

    for (let atk = 0; atk < def.attacksPerRound; atk++) {
      // Build target pool: player (if alive) + living companions
      type TargetEntry = { kind: 'player' } | { kind: 'companion'; index: number }
      const pool: TargetEntry[] = []
      if (playerHp > 0) pool.push({ kind: 'player' })
      for (let ci = 0; ci < compSnapshots.length; ci++) {
        if (compSnapshots[ci]!.alive && compSnapshots[ci]!.currentHp > 0) {
          pool.push({ kind: 'companion', index: ci })
        }
      }
      if (pool.length === 0) break

      const target = pool[Math.floor(rng() * pool.length)]!

      if (target.kind === 'player') {
        const hit = resolveAttackHits(
          {
            diceCount: def.diceCount,
            diceSides: def.diceSides,
            bonusDamage: def.bonusDamage,
            attacksPerRound: 1,
            damageType: def.damageType,
            strength: def.strength,
            dexterity: def.dexterity,
            elementalDamage: def.elementalDamage,
          },
          {
            armor: player.armor,
            dexterity: player.dexterity,
            strength: player.strength,
            power: player.power,
            immunities: player.immunities,
          },
          playerHp,
          pStatus,
          rng,
        )
        defMeta[di]!.damageDealt += hit.totalDealt
        playerHp = hit.targetHpAfter
        for (const e of hit.critEffects) {
          appliedEffects.push({ target: 'player', ...e })
        }
      } else {
        const ci = target.index
        const comp = compSnapshots[ci]!
        const hit = resolveAttackHits(
          {
            diceCount: def.diceCount,
            diceSides: def.diceSides,
            bonusDamage: def.bonusDamage,
            attacksPerRound: 1,
            damageType: def.damageType,
            strength: def.strength,
            dexterity: def.dexterity,
            elementalDamage: def.elementalDamage,
          },
          {
            armor: comp.armor,
            dexterity: comp.dexterity,
            strength: comp.strength,
            power: comp.power,
            immunities: comp.immunities,
          },
          comp.currentHp,
          comp.statusEffects,
          rng,
        )
        comp.currentHp = hit.targetHpAfter
        if (comp.currentHp <= 0) comp.alive = false
        defMeta[di]!.damageDealt += hit.totalDealt
        compMeta[ci]!.damageTaken += hit.totalDealt
        for (const e of hit.critEffects) {
          compMeta[ci]!.appliedEffects.push(e)
          appliedEffects.push({ target: `companion:${comp.name}` as const, ...e })
        }
      }
    }
  }

  // 6. Gate check -- if gate HP=0, clear behindWall on remaining
  let gateDestroyed = false
  if (!defs[0]!.alive && gateAlive) {
    gateDestroyed = true
    for (const d of defs) {
      d.behindWall = false
    }
  }

  return buildFortifiedResult(
    playerHp,
    totalPlayerDealt,
    defs,
    defMeta,
    compSnapshots,
    compMeta,
    appliedEffects,
    playerStunned,
    pStatus,
    playerTick.damage,
    gateDestroyed,
  )
}

function buildFortifiedResult(
  playerHp: number,
  totalPlayerDealt: number,
  defs: DefenderSnapshot[],
  defMeta: {
    stunned: boolean
    tickDamage: number
    damageTaken: number
    damageDealt: number
    appliedEffects: { effect: StatusEffect; amount: number }[]
  }[],
  compSnapshots: CompanionCombatSnapshot[],
  compMeta: {
    stunned: boolean
    tickDamage: number
    damageTaken: number
    appliedEffects: { effect: StatusEffect; amount: number }[]
  }[],
  appliedEffects: FortifiedRoundResult['appliedEffects'],
  playerStunned: boolean,
  pStatus: CombatStatusEffects,
  playerTickDamage: number,
  gateDestroyed = false,
): FortifiedRoundResult {
  const defenderResults: DefenderRoundResult[] = defs.map((d, i) => ({
    index: i,
    key: d.key,
    damageDealt: defMeta[i]!.damageDealt,
    damageTaken: defMeta[i]!.damageTaken,
    statusEffectDamage: defMeta[i]!.tickDamage,
    appliedEffects: defMeta[i]!.appliedEffects,
    stunned: defMeta[i]!.stunned,
    alive: d.alive,
    currentHp: d.currentHp,
    newStatus: { ...d.statusEffects },
  }))

  const companionResults: CompanionRoundResult[] = compSnapshots.map((comp, ci) => ({
    name: comp.name,
    damageRoll: 0,
    damageDealt: 0,
    damageTaken: compMeta[ci]!.damageTaken,
    statusEffectDamage: compMeta[ci]!.tickDamage,
    appliedEffects: compMeta[ci]!.appliedEffects,
    stunned: compMeta[ci]!.stunned,
    alive: comp.alive,
    currentHp: comp.currentHp,
    newStatus: { ...comp.statusEffects },
  }))

  return {
    playerHp,
    playerDamageDealt: totalPlayerDealt,
    defenderResults,
    companionResults,
    newCompanions: compSnapshots,
    newDefenders: defs,
    gateDestroyed,
    allDefendersDefeated: defs.every((d) => !d.alive),
    playerDefeated: playerHp <= 0,
    statusEffectDamage: { player: playerTickDamage },
    appliedEffects,
    playerStunned,
    newPlayerStatus: pStatus,
  }
}

// ---------------------------------------------------------------------------
// resolveFortifiedFlee
// ---------------------------------------------------------------------------

/**
 * Flee from fortified combat. Uses highest dexterity among living defenders
 * for chase roll. On failure, each living non-gate defender gets one free attack.
 */
export function resolveFortifiedFlee(
  state: NeutralCombatState,
  playerDexterity: number,
  playerArmor: number,
  playerHp: number,
  rng: () => number,
  playerStatus: CombatStatusEffects,
): FleeResult {
  // Stun/frozen prevents fleeing
  if (playerStatus.stun > 0 || playerStatus.frozen > 0) {
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

  // Use highest dexterity among living defenders
  let maxDex = 0
  for (const d of state.defenders) {
    if (d.alive && d.dexterity > maxDex) maxDex = d.dexterity
  }

  const dexDiff = playerDexterity - maxDex
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
      bleedingCleared: playerStatus.bleeding > 0,
    }
  }

  // Failed flee: each living non-gate defender gets one free attack
  let totalRaw = 0
  let totalDealt = 0
  let playerHpAfter = playerHp

  for (const d of state.defenders) {
    if (!d.alive || d.diceCount === 0) continue
    if (playerHpAfter <= 0) break

    const elemTotal =
      d.elementalDamage.fire +
      d.elementalDamage.earth +
      d.elementalDamage.air +
      d.elementalDamage.water

    for (let i = 0; i < d.attacksPerRound && playerHpAfter > 0; i++) {
      const raw = calcMeleeDamage(d.diceCount, d.diceSides, d.bonusDamage, rng)
      const physical = calcArmorReduction(raw, playerArmor)
      const dealt = physical + elemTotal
      totalRaw += raw
      totalDealt += dealt
      playerHpAfter = Math.max(0, playerHpAfter - dealt)
    }
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

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

export type DetectionResult = {
  detected: boolean
  rolls: number[]
  threshold: number
}

/**
 * Roll detection for a party encountering another party.
 * Each unit in the detecting party rolls 1-10.
 * Success threshold: roll > (9 - targetPartySize).
 * Any single success means detected.
 */
export function rollDetection(params: {
  detectingPartySize: number
  targetPartySize: number
  rng: () => number
}): DetectionResult {
  const { detectingPartySize, targetPartySize, rng } = params
  const threshold = 9 - targetPartySize
  const rolls: number[] = []
  let detected = false

  for (let i = 0; i < detectingPartySize; i++) {
    const roll = randomInt(1, 10, rng)
    rolls.push(roll)
    if (roll > threshold) {
      detected = true
    }
  }

  return { detected, rolls, threshold }
}

// ---------------------------------------------------------------------------
// PvP combat initialization
// ---------------------------------------------------------------------------

/**
 * Snapshot a player as a DefenderSnapshot for PvP combat.
 * Players have no immunities (EMPTY_IMMUNITIES).
 */
function snapshotPlayer(player: PlayerState, behindWall: boolean): DefenderSnapshot {
  return {
    key: `player:${player.id}`,
    currentHp: player.hp,
    maxHp: player.maxHp,
    armor: player.armor,
    diceCount: player.diceCount,
    diceSides: player.diceSides,
    bonusDamage: 0,
    attacksPerRound: player.attacksPerRound,
    damageType: player.damageType,
    strength: player.strength,
    dexterity: player.dexterity,
    power: player.power,
    immunities: { ...EMPTY_IMMUNITIES },
    elementalDamage: { ...player.elementalDamage },
    statusEffects: { ...EMPTY_STATUS },
    behindWall,
    alive: player.hp > 0,
  }
}

/** Snapshot a companion as a DefenderSnapshot for PvP combat. */
function snapshotCompanionAsDefender(comp: Companion, behindWall: boolean): DefenderSnapshot {
  return {
    key: comp.name,
    currentHp: comp.currentHp,
    maxHp: comp.maxHp,
    armor: comp.armor,
    diceCount: comp.diceCount,
    diceSides: comp.diceSides,
    bonusDamage: 0,
    attacksPerRound: comp.attacksPerRound,
    damageType: comp.damageType,
    strength: comp.strength,
    dexterity: comp.dexterity,
    power: comp.power,
    immunities: { ...comp.immunities },
    elementalDamage: { ...comp.elementalDamage },
    statusEffects: { ...EMPTY_STATUS },
    behindWall,
    alive: comp.currentHp > 0,
  }
}

/**
 * Initialize PvP combat state.
 * The defending player + their companions are placed in the defenders array.
 * If the land has fortifications (gateLevel > 0), the gate is first and all others are behind the wall.
 * Otherwise all defenders are in the open (behindWall = false).
 *
 * Flat defender* fields point to the first defender (gate if fortified, else the defending player).
 */
export function initPvPCombat(params: {
  attacker: PlayerState
  defender: PlayerState
  board: ReadonlyArray<BoardSquare>
  defenderPosition: number
}): NeutralCombatState {
  const { attacker, defender, board, defenderPosition } = params
  const square = board[defenderPosition]!

  const defenders: DefenderSnapshot[] = []
  const isFortified = square.gateLevel > 0

  if (isFortified) {
    // Gate first (not behind wall -- melee target)
    const gateKeyMap: Record<number, string> = {
      1: 'fortGate',
      2: 'citadelGate',
      3: 'castleGate',
    }
    const gateKey = gateKeyMap[square.gateLevel] ?? 'fortGate'
    defenders.push(snapshotCreature(gateKey, false))

    // Defending player behind wall
    defenders.push(snapshotPlayer(defender, true))

    // Defender's living companions behind wall
    for (const comp of defender.companions) {
      if (comp.currentHp > 0) {
        defenders.push(snapshotCompanionAsDefender(comp, true))
      }
    }
  } else {
    // No fortification: defending player in the open
    defenders.push(snapshotPlayer(defender, false))

    // Defender's living companions in the open
    for (const comp of defender.companions) {
      if (comp.currentHp > 0) {
        defenders.push(snapshotCompanionAsDefender(comp, false))
      }
    }
  }

  // Primary defender (first in the array) determines flat fields
  const primary = defenders[0]!
  const elemTotal =
    primary.elementalDamage.fire +
    primary.elementalDamage.earth +
    primary.elementalDamage.air +
    primary.elementalDamage.water

  return {
    defenderKey: primary.key,
    defenderHp: primary.currentHp,
    defenderMaxHp: primary.maxHp,
    defenderArmor: primary.armor,
    defenderDiceCount: primary.diceCount,
    defenderDiceSides: primary.diceSides,
    defenderBonusDamage: primary.bonusDamage,
    defenderAttacksPerRound: primary.attacksPerRound,
    defenderElementalDamage: elemTotal,
    defenderDexterity: primary.dexterity,
    defenderDamageType: primary.damageType,
    defenderStrength: primary.strength,
    defenderPower: primary.power,
    defenderImmunities: { ...primary.immunities },
    defenderElementalChannels: { ...primary.elementalDamage },
    defenderStatusEffects: { ...EMPTY_STATUS },
    playerStatusEffects: { ...EMPTY_STATUS },
    playerHpSnapshot: attacker.hp,
    companions: attacker.companions
      .filter((c) => c.currentHp > 0)
      .map((c) => ({
        name: c.name,
        currentHp: c.currentHp,
        maxHp: c.maxHp,
        armor: c.armor,
        diceCount: c.diceCount,
        diceSides: c.diceSides,
        attacksPerRound: c.attacksPerRound,
        alive: true,
        damageType: c.damageType,
        strength: c.strength,
        dexterity: c.dexterity,
        power: c.power,
        immunities: { ...c.immunities },
        elementalDamage: { ...c.elementalDamage },
        statusEffects: { ...EMPTY_STATUS },
      })),
    defenders,
    actions: [],
    resolved: false,
    victory: false,
    pvpOpponentId: defender.id,
    pvpOpponentName: defender.name,
  }
}
