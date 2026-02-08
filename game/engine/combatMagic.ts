import type { ManaPool, ManaType, StatusEffect } from '../types'
import { SPELLS } from '../data'
import { tickStatusEffects, resolveAttackHits } from './combat'
import type {
  NeutralCombatState,
  AttackerProfile,
  CombatStatusEffects,
  CompanionCombatSnapshot,
  CompanionRoundResult,
  DefenderSnapshot,
  DefenseParams,
} from './combat'
import {
  calcSpellDamage,
  calcBuffEffect,
  calcSummonResult,
  validateCast,
  deductManaCost,
} from './magic'
import type { BuffResult, SummonResult } from './magic'

// ---------------------------------------------------------------------------
// Spell targeting
// ---------------------------------------------------------------------------

export type SpellTarget =
  | { type: 'hostile'; defenderIndex?: number }
  | { type: 'friendly'; companionIndex?: number }
  | { type: 'self' }

/** Mana type -> immunity type mapping for elemental immunity checks */
const MANA_TO_IMMUNITY: Partial<Record<ManaType, string>> = {
  fire: 'fire',
  air: 'lightning',
  water: 'cold',
  death: 'poison',
}

// ---------------------------------------------------------------------------
// SpellCombatResult
// ---------------------------------------------------------------------------

export type SpellCombatResult = {
  spellKey: string
  spellDamage: number
  vampiricHealing: number
  playerHp: number
  defenderHp: number
  defenderDefeated: boolean
  playerDefeated: boolean
  newMana: ManaPool
  buffApplied?: BuffResult
  buffTarget?: string
  summonsCreated?: SummonResult
  companionResults: CompanionRoundResult[]
  newCompanions: CompanionCombatSnapshot[]
  newDefenders: DefenderSnapshot[]
  statusEffectDamage: { player: number; defender: number }
  appliedEffects: {
    target: 'player' | 'defender' | `defender:${number}` | `companion:${string}`
    effect: StatusEffect
    amount: number
  }[]
  newPlayerStatus: CombatStatusEffects
  newDefenderStatus: CombatStatusEffects
  playerStunned: boolean
  defenderStunned: boolean
  immuneDefenders: string[]
}

// ---------------------------------------------------------------------------
// resolveCombatSpellRound
// ---------------------------------------------------------------------------

export function resolveCombatSpellRound(
  state: NeutralCombatState,
  player: AttackerProfile,
  spellKey: string,
  spellbook: Record<string, number>,
  mana: ManaPool,
  target: SpellTarget,
  rng: () => number,
): SpellCombatResult {
  const appliedEffects: SpellCombatResult['appliedEffects'] = []

  let playerHp = player.hp
  let defenderHp = state.defenderHp
  let pStatus = { ...state.playerStatusEffects }
  let dStatus = { ...state.defenderStatusEffects }
  let currentMana: ManaPool = { ...mana }

  // Deep-copy companion snapshots
  const compSnapshots: CompanionCombatSnapshot[] = state.companions.map((c) => ({
    ...c,
    immunities: { ...c.immunities },
    elementalDamage: { ...c.elementalDamage },
    statusEffects: { ...c.statusEffects },
  }))

  // Deep-copy defender snapshots (same pattern as fortified melee)
  const defSnapshots: DefenderSnapshot[] = state.defenders.map((d) => ({
    ...d,
    immunities: { ...d.immunities },
    statusEffects: { ...d.statusEffects },
  }))

  // Record stun/frozen state BEFORE tick
  const playerStunned = pStatus.stun > 0 || pStatus.frozen > 0
  const defenderStunned = dStatus.stun > 0 || dStatus.frozen > 0

  // Per-companion metadata
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

  // -----------------------------------------------------------------------
  // Phase 1: Status tick
  // -----------------------------------------------------------------------

  const playerTick = tickStatusEffects(pStatus, player.strength, rng)
  playerHp = Math.max(0, playerHp - playerTick.damage)
  pStatus = playerTick.newStatus

  let totalDefenderTickDamage = 0
  if (defSnapshots.length > 1) {
    // Fortified: tick each living defender individually with their own strength
    for (let di = 0; di < defSnapshots.length; di++) {
      const def = defSnapshots[di]!
      if (!def.alive) continue
      const tick = tickStatusEffects(def.statusEffects, def.strength, rng)
      def.currentHp = Math.max(0, def.currentHp - tick.damage)
      def.statusEffects = tick.newStatus
      totalDefenderTickDamage += tick.damage
      if (def.currentHp <= 0) def.alive = false
    }
  } else {
    const defenderTick = tickStatusEffects(dStatus, state.defenderStrength, rng)
    defenderHp = Math.max(0, defenderHp - defenderTick.damage)
    dStatus = defenderTick.newStatus
    totalDefenderTickDamage = defenderTick.damage
  }

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

  const statusEffectDamage = { player: playerTick.damage, defender: totalDefenderTickDamage }

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

  // Early exit if someone died from status tick
  const earlyDefenderDead =
    defSnapshots.length > 1 ? defSnapshots.every((d) => !d.alive) : defenderHp <= 0
  if (playerHp <= 0 || earlyDefenderDead) {
    return {
      spellKey,
      spellDamage: 0,
      vampiricHealing: 0,
      playerHp,
      defenderHp,
      defenderDefeated: earlyDefenderDead,
      playerDefeated: playerHp <= 0,
      newMana: currentMana,
      companionResults: compSnapshots.map((_, ci) => noActionCompResult(ci)),
      newCompanions: compSnapshots,
      newDefenders: defSnapshots,
      statusEffectDamage,
      appliedEffects,
      newPlayerStatus: pStatus,
      newDefenderStatus: dStatus,
      playerStunned,
      defenderStunned,
      immuneDefenders: [],
    }
  }

  // -----------------------------------------------------------------------
  // Phase 2: Player casts spell (if not stunned)
  // -----------------------------------------------------------------------

  let spellDamage = 0
  let vampiricHealing = 0
  let buffApplied: BuffResult | undefined
  let buffTarget: string | undefined
  let summonsCreated: SummonResult | undefined
  const immuneDefenders: string[] = []

  if (!playerStunned && playerHp > 0) {
    const spell = SPELLS[spellKey as keyof typeof SPELLS]

    if (spell) {
      const validation = validateCast({
        spellKey,
        spellbook,
        mana: currentMana,
        spell,
        inCombat: true,
      })

      if (validation.canCast) {
        currentMana = deductManaCost(currentMana, spell)
        const spellLevel = spellbook[spellKey] ?? 1
        const immunityKey = MANA_TO_IMMUNITY[spell.manaType]

        // Damage spells
        if (spell.isAggressive && spell.type === 'damage') {
          if (spell.canTargetGroup) {
            // AoE: hit all living defenders
            if (defSnapshots.length > 1) {
              const result = calcSpellDamage({
                spellLevel,
                basePower: spell.basePower,
                casterPower: player.power,
                targetPower: state.defenderPower,
                vampiricPercent: spell.vampiricPercent,
                rng,
              })
              for (const def of defSnapshots) {
                if (!def.alive) continue
                if (immunityKey && def.immunities[immunityKey as keyof typeof def.immunities]) {
                  immuneDefenders.push(def.key)
                  continue
                }
                const dealt = Math.min(result.damage, def.currentHp)
                def.currentHp -= dealt
                spellDamage += dealt
                if (def.currentHp <= 0) def.alive = false
              }
              vampiricHealing = result.vampiricHealing
              playerHp = playerHp + vampiricHealing
            } else {
              // AoE against single defender (non-fortified)
              if (
                immunityKey &&
                state.defenderImmunities[immunityKey as keyof typeof state.defenderImmunities]
              ) {
                immuneDefenders.push(state.defenderKey)
              } else {
                const result = calcSpellDamage({
                  spellLevel,
                  basePower: spell.basePower,
                  casterPower: player.power,
                  targetPower: state.defenderPower,
                  vampiricPercent: spell.vampiricPercent,
                  rng,
                })
                spellDamage = Math.min(result.damage, defenderHp)
                vampiricHealing = result.vampiricHealing
                defenderHp = defenderHp - spellDamage
                playerHp = playerHp + vampiricHealing
              }
            }
          } else {
            // Single target hostile
            if (
              defSnapshots.length > 1 &&
              target.type === 'hostile' &&
              target.defenderIndex != null
            ) {
              const def = defSnapshots[target.defenderIndex]
              if (def && def.alive) {
                if (immunityKey && def.immunities[immunityKey as keyof typeof def.immunities]) {
                  immuneDefenders.push(def.key)
                } else {
                  const result = calcSpellDamage({
                    spellLevel,
                    basePower: spell.basePower,
                    casterPower: player.power,
                    targetPower: state.defenderPower,
                    vampiricPercent: spell.vampiricPercent,
                    rng,
                  })
                  const dealt = Math.min(result.damage, def.currentHp)
                  def.currentHp -= dealt
                  spellDamage = dealt
                  vampiricHealing = result.vampiricHealing
                  if (def.currentHp <= 0) def.alive = false
                  playerHp = playerHp + vampiricHealing
                }
              }
            } else {
              // Single target against non-fortified defender
              if (
                immunityKey &&
                state.defenderImmunities[immunityKey as keyof typeof state.defenderImmunities]
              ) {
                immuneDefenders.push(state.defenderKey)
              } else {
                const result = calcSpellDamage({
                  spellLevel,
                  basePower: spell.basePower,
                  casterPower: player.power,
                  targetPower: state.defenderPower,
                  vampiricPercent: spell.vampiricPercent,
                  rng,
                })
                spellDamage = Math.min(result.damage, defenderHp)
                vampiricHealing = result.vampiricHealing
                defenderHp = defenderHp - spellDamage
                playerHp = playerHp + vampiricHealing
              }
            }
          }
        }

        // Buff/heal spells with targeting
        if (
          spell.hasArmorBuff ||
          spell.hasHasteEffect ||
          spell.hasStrengthBuff ||
          spell.hasHealEffect ||
          spell.hasWindEffect
        ) {
          buffApplied = calcBuffEffect({
            spellKey,
            spellLevel,
            casterPower: player.power,
            spell,
          })
          if (target.type === 'self') {
            buffTarget = 'player'
            if (buffApplied.healAmount > 0) {
              playerHp += buffApplied.healAmount
            }
          } else if (target.type === 'friendly' && target.companionIndex != null) {
            const comp = compSnapshots[target.companionIndex]
            if (comp) {
              buffTarget = `companion:${comp.name}`
              if (buffApplied.healAmount > 0) {
                comp.currentHp = Math.min(comp.currentHp + buffApplied.healAmount, comp.maxHp)
              }
            } else {
              buffTarget = 'player'
              if (buffApplied.healAmount > 0) {
                playerHp += buffApplied.healAmount
              }
            }
          } else {
            buffTarget = 'player'
            if (buffApplied.healAmount > 0) {
              playerHp += buffApplied.healAmount
            }
          }
        }

        // Summon spells
        if (spell.isSummon) {
          summonsCreated = calcSummonResult({
            spellLevel,
            casterPower: player.power,
            summonTiers: spell.summonTiers,
          })
        }
      }
    }
  }

  // Sync defenderHp from defenders array for fortified combat
  if (defSnapshots.length > 1) {
    defenderHp = defSnapshots.some((d) => d.alive) ? 1 : 0
  }

  // -----------------------------------------------------------------------
  // Phase 3: Companion melee attacks (if defender still alive)
  // -----------------------------------------------------------------------

  const isFortified = defSnapshots.length > 1
  const gateAliveBeforeCompanions = isFortified && defSnapshots[0]!.alive

  const companionResults: CompanionRoundResult[] = []
  for (let ci = 0; ci < compSnapshots.length; ci++) {
    const comp = compSnapshots[ci]!
    const meta = compMeta[ci]!
    if (!comp.alive || defenderHp <= 0 || meta.stunned) {
      companionResults.push(noActionCompResult(ci))
      continue
    }

    if (isFortified) {
      // Fortified: behind-wall enforcement -- forced to gate while gate alive
      const targetIdx = gateAliveBeforeCompanions
        ? 0
        : (() => {
            // Pick first living defender
            for (let di = 0; di < defSnapshots.length; di++) {
              if (defSnapshots[di]!.alive) return di
            }
            return 0
          })()
      const targetDef = defSnapshots[targetIdx]!
      if (!targetDef.alive) {
        companionResults.push(noActionCompResult(ci))
        continue
      }

      const defParams: DefenseParams = {
        armor: targetDef.armor,
        dexterity: targetDef.dexterity,
        strength: targetDef.strength,
        power: targetDef.power,
        immunities: targetDef.immunities,
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
        targetDef.currentHp,
        targetDef.statusEffects,
        rng,
      )
      targetDef.currentHp = hit.targetHpAfter
      if (targetDef.currentHp <= 0) targetDef.alive = false
      for (const e of hit.critEffects) {
        appliedEffects.push({ target: `defender:${targetIdx}`, ...e })
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
    } else {
      // Non-fortified: use flat defender stats
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
  }

  // Fill in companion results if none were added (e.g. no companions)
  if (companionResults.length === 0) {
    for (let ci = 0; ci < compSnapshots.length; ci++) {
      companionResults.push(noActionCompResult(ci))
    }
  }

  // Re-sync sentinel for fortified combat after companion melee
  if (defSnapshots.length > 1) {
    defenderHp = defSnapshots.some((d) => d.alive) ? 1 : 0
  }

  // -----------------------------------------------------------------------
  // Phase 4: Defender counterattack (if alive and not stunned)
  // -----------------------------------------------------------------------

  if (isFortified) {
    // Fortified: each living non-gate, non-stunned defender attacks with own stats
    for (let di = 0; di < defSnapshots.length; di++) {
      const def = defSnapshots[di]!
      if (!def.alive) continue
      // Gate never attacks (diceCount=0)
      if (def.diceCount === 0) continue
      // Check stun/frozen BEFORE tick (recorded in statusEffects at start of round)
      const defStunned =
        state.defenders[di]!.statusEffects.stun > 0 || state.defenders[di]!.statusEffects.frozen > 0
      if (defStunned) continue

      for (let atk = 0; atk < def.attacksPerRound; atk++) {
        type TargetEntry = { kind: 'player' } | { kind: 'companion'; index: number }
        const pool: TargetEntry[] = []
        if (playerHp > 0) pool.push({ kind: 'player' })
        for (let ci = 0; ci < compSnapshots.length; ci++) {
          if (compSnapshots[ci]!.alive && compSnapshots[ci]!.currentHp > 0) {
            pool.push({ kind: 'companion', index: ci })
          }
        }
        if (pool.length === 0) break

        const picked = pool[Math.floor(rng() * pool.length)]!

        if (picked.kind === 'player') {
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
          playerHp = hit.targetHpAfter
          for (const e of hit.critEffects) {
            appliedEffects.push({ target: 'player', ...e })
          }
        } else {
          const ci = picked.index
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
          compMeta[ci]!.damageTaken += hit.totalDealt
          for (const e of hit.critEffects) {
            compMeta[ci]!.appliedEffects.push(e)
            appliedEffects.push({ target: `companion:${comp.name}` as const, ...e })
          }
        }
      }
    }
  } else if (defenderHp > 0 && !defenderStunned) {
    // Non-fortified: single defender counterattack
    for (let i = 0; i < state.defenderAttacksPerRound; i++) {
      type TargetEntry = { kind: 'player' } | { kind: 'companion'; index: number }
      const pool: TargetEntry[] = []
      if (playerHp > 0) pool.push({ kind: 'player' })
      for (let ci = 0; ci < compSnapshots.length; ci++) {
        if (compSnapshots[ci]!.alive && compSnapshots[ci]!.currentHp > 0) {
          pool.push({ kind: 'companion', index: ci })
        }
      }
      if (pool.length === 0) break

      const picked = pool[Math.floor(rng() * pool.length)]!

      if (picked.kind === 'player') {
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
        playerHp = hit.targetHpAfter
        for (const e of hit.critEffects) {
          appliedEffects.push({ target: 'player', ...e })
        }
      } else {
        const ci = picked.index
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
      }
    }
  }

  // Final sync companion results with post-defender-attack state
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

  // Final re-sync sentinel for fortified combat
  if (defSnapshots.length > 1) {
    defenderHp = defSnapshots.some((d) => d.alive) ? 1 : 0
  }

  // Gate destruction check: if gate was alive at start but is now dead, clear behindWall
  if (isFortified && !defSnapshots[0]!.alive) {
    for (const d of defSnapshots) {
      d.behindWall = false
    }
  }

  // For fortified combat, check if all defenders are defeated
  const allDefendersDefeated =
    defSnapshots.length > 1 ? defSnapshots.every((d) => !d.alive) : defenderHp <= 0

  return {
    spellKey,
    spellDamage,
    vampiricHealing,
    playerHp: Math.max(0, playerHp),
    defenderHp: Math.max(0, defenderHp),
    defenderDefeated: allDefendersDefeated,
    playerDefeated: playerHp <= 0,
    newMana: currentMana,
    buffApplied,
    buffTarget,
    summonsCreated,
    companionResults,
    newCompanions: compSnapshots,
    newDefenders: defSnapshots,
    statusEffectDamage,
    appliedEffects,
    newPlayerStatus: pStatus,
    newDefenderStatus: dStatus,
    playerStunned,
    defenderStunned,
    immuneDefenders,
  }
}
