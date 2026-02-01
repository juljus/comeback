/**
 * Magic/Spell Store Module
 * Extracted spell casting logic from the main game store
 * Handles utility, damage, summon, and buff spells
 */

import type {
  GameState,
  Player,
  SpellType,
  BuffEffect,
  CompanionInstance,
  CombatState,
} from './types'
import { getSpellById, getSpellByName, getMobByName } from '~/data/schemas'

/**
 * Get player's known spells as SpellType objects
 */
export function getPlayerKnownSpells(player: Player): SpellType[] {
  return Object.keys(player.spellKnowledge)
    .map(name => getSpellByName(name))
    .filter((s): s is SpellType => s !== null)
}

/**
 * Check if player can cast a specific spell
 */
export function canCastSpell(player: Player, spellId: number): boolean {
  const spell = getSpellById(spellId)
  if (!spell) return false
  if (!player.spellKnowledge[spell.name.et]) return false
  if (player.mana[spell.manaType] < spell.manaCost) return false
  return true
}

/**
 * Cast a spell outside of combat
 * Costs mana only (action point already deducted by caller)
 * Returns result of the spell effect
 *
 * VBA Reference: Main_turn() lines 6200-6300+
 */
export function castSpell(
  state: GameState,
  spellId: number,
  targetIndex?: number
): { success: boolean; message: string; effect?: unknown } {
  const player = state.players[state.currentPlayer]
  if (!player) return { success: false, message: 'No active player' }

  const spell = getSpellById(spellId)
  if (!spell) return { success: false, message: 'Spell not found' }

  // Must know the spell (have knowledge level >= 1)
  if (!player.spellKnowledge[spell.name.et]) {
    return { success: false, message: 'You do not know this spell' }
  }

  // Must have enough mana
  if (player.mana[spell.manaType] < spell.manaCost) {
    return {
      success: false,
      message: `Not enough ${spell.manaType} mana (need ${spell.manaCost})`,
    }
  }

  // Deduct mana cost
  player.mana[spell.manaType] -= spell.manaCost

  // Apply spell effect based on type
  let result: { success: boolean; message: string; effect?: unknown }

  switch (spell.effectType) {
    case 'utility':
      // Utility spells like Heal, Armor, etc.
      if (spell.name.et === 'Paranda haavu') {
        // VBA line 6227: healvalue = knowledge * (power * 3)
        const knowledge = player.spellKnowledge[spell.name.et] || 1
        const healAmount = knowledge * (player.stats.power * 3)
        const actualHeal = Math.min(healAmount, player.maxHp - player.hp)
        player.hp += actualHeal
        result = {
          success: true,
          message: `Healed for ${actualHeal} HP`,
          effect: { healAmount: actualHeal },
        }
      } else if (spell.name.et === 'Maagiline turvis') {
        // Magic armor - buff effect
        // VBA line 6264: duration = 2 + power * power
        const knowledge = player.spellKnowledge[spell.name.et] || 1
        const duration = 2 + player.stats.power * player.stats.power
        // Armor buff power = knowledge level (each level adds +1 armor)
        const armorBuff: BuffEffect = {
          type: 'armor',
          duration,
          power: knowledge,
          sourceSpell: spell.name.et,
        }
        player.buffs.push(armorBuff)
        result = {
          success: true,
          message: `Magic armor +${knowledge} for ${duration} turns`,
          effect: { buff: 'armor', duration, power: knowledge },
        }
      } else if (spell.name.et === 'Kullapott') {
        // VBA line 6066: gold = ((random 10-30) + power × 20) × knowledge²
        const knowledge = player.spellKnowledge[spell.name.et] || 1
        const randomBase = (Math.floor(Math.random() * 3) + 1) * 10 // 10, 20, or 30
        const goldAmount = (randomBase + player.stats.power * 20) * (knowledge * knowledge)
        player.gold += goldAmount
        result = {
          success: true,
          message: `Generated ${goldAmount} gold`,
          effect: { gold: goldAmount },
        }
      } else {
        result = {
          success: true,
          message: `Cast ${spell.name.en}`,
          effect: { type: 'utility' },
        }
      }
      break

    case 'singleTarget':
    case 'aoe':
      // Damage spells - these are primarily for combat
      // Outside combat, they could be used on land defenders
      result = {
        success: true,
        message: `${spell.name.en} ready (use in combat)`,
        effect: { type: 'damage', basePower: spell.basePower },
      }
      break

    case 'summon':
      // Summon spells - create companions using VBA mechanics (lines 6099-6192)
      if (spell.summonTiers && spell.summonTiers.length > 0) {
        const knowledge = player.spellKnowledge[spell.name.et] || 1
        const tiers = spell.summonTiers

        // VBA lines 6103-6124: Determine summon tier based on knowledge
        // Loop through knowledge levels to find final summon and calculate summons_Level
        let summonsLevel = 1
        let summonCreature = tiers[0]!.creature
        let summonCount = tiers[0]!.count

        for (let x = 1; x <= knowledge; x++) {
          const tierIndex = Math.min(x - 1, tiers.length - 1)
          const prevIndex = Math.max(0, tierIndex - 1)

          const currentTier = tiers[tierIndex]!
          const prevTier = tiers[prevIndex]!

          if (
            x > 1 &&
            currentTier.creature === prevTier.creature &&
            currentTier.count === prevTier.count
          ) {
            // Same creature and count as previous tier = increase summons level
            summonsLevel++
          } else if (x > 1) {
            // Different creature or count = reset summons level
            summonsLevel = 1
          }

          summonCreature = currentTier.creature
          summonCount = currentTier.count
        }

        // VBA line 6170: Summons get HP bonus = power × 2
        const hpBonus = player.stats.power * 2

        // VBA lines 6174-6178: If summonsLevel > 1, stats get multiplied
        // Multiplier = (20 + (summonsLevel - 1) * 2) / 10
        const statMultiplier = summonsLevel > 1 ? (20 + (summonsLevel - 1) * 2) / 10 : 1

        // Get mob data for the summoned creature
        const summonMob = getMobByName(summonCreature)
        if (summonMob) {
          // Summon duration = 3 + knowledge turns
          const summonDuration = 3 + knowledge

          // Create companion instances for each summon
          for (let i = 0; i < summonCount; i++) {
            const companion: CompanionInstance = {
              id: `summon-${Date.now()}-${i}`,
              mobId: summonMob.id,
              name: summonMob.name.en,
              hp: Math.floor((summonMob.hp + hpBonus) * statMultiplier),
              maxHp: Math.floor((summonMob.hp + hpBonus) * statMultiplier),
              armor: Math.floor(summonMob.armor * statMultiplier),
              damage: summonMob.damage,
              attacksPerRound: summonMob.attacksPerRound,
              damageType: summonMob.damageType ?? 'crush',
              stats: {
                strength: Math.floor(summonMob.stats.strength * statMultiplier),
                dexterity: Math.floor(summonMob.stats.dexterity * statMultiplier),
                power: Math.floor(summonMob.stats.power * statMultiplier),
              },
              turnsRemaining: summonDuration,
              isPet: false,
              evolutionProgress: 0,
              evolvesInto: summonMob.evolvesInto ?? '', // Summons can't evolve
              summonsLevel,
            }
            player.companions.push(companion)
          }
        }

        result = {
          success: true,
          message: `Summoned ${summonCount}x ${summonCreature}${
            summonsLevel > 1 ? ` (Lv${summonsLevel})` : ''
          }`,
          effect: {
            type: 'summon',
            creature: summonCreature,
            count: summonCount,
            summonsLevel,
            hpBonus,
            statMultiplier,
          },
        }
      } else if (spell.summons && spell.summons[0]) {
        // Legacy fallback - try to create companion from first summon name
        const summonName = spell.summons[0]
        const summonMob = getMobByName(summonName)
        if (summonMob) {
          const knowledge = player.spellKnowledge[spell.name.et] || 1
          const companion: CompanionInstance = {
            id: `summon-${Date.now()}-0`,
            mobId: summonMob.id,
            name: summonMob.name.en,
            hp: summonMob.hp + player.stats.power * 2,
            maxHp: summonMob.hp + player.stats.power * 2,
            armor: summonMob.armor,
            damage: summonMob.damage,
            attacksPerRound: summonMob.attacksPerRound,
            damageType: summonMob.damageType ?? 'crush',
            stats: summonMob.stats,
            turnsRemaining: 3 + knowledge,
            isPet: false,
            evolutionProgress: 0,
            evolvesInto: summonMob.evolvesInto ?? '',
            summonsLevel: 1,
          }
          player.companions.push(companion)
        }
        result = {
          success: true,
          message: `Summoned ${summonName}`,
          effect: { type: 'summon', creature: summonName },
        }
      } else {
        result = {
          success: true,
          message: `Cast ${spell.name.en}`,
          effect: { type: 'summon' },
        }
      }
      break

    case 'buff':
      // Buff spells - generic buff application
      // This handles spells with effectType: 'buff' (different from utility buffs)
      {
        const knowledge = player.spellKnowledge[spell.name.et] || 1
        const duration = 2 + player.stats.power * player.stats.power

        // Determine buff type based on spell (can be extended)
        let buffType: 'armor' | 'strength' | 'haste' = 'armor'

        // Create and apply the buff
        const buff: BuffEffect = {
          type: buffType,
          duration,
          power: knowledge,
          sourceSpell: spell.name.et,
        }
        player.buffs.push(buff)

        result = {
          success: true,
          message: `${spell.name.en} applied for ${duration} turns`,
          effect: { type: 'buff', buffType, duration, power: knowledge },
        }
      }
      break

    default:
      result = { success: true, message: `Cast ${spell.name.en}` }
  }

  return result
}

/**
 * Cast a damage spell during combat
 * Uses mana but NOT an action point (done alongside attack)
 *
 * VBA Reference: combat_actions() lines 12100-12150
 */
export function castCombatSpell(
  state: GameState,
  spellId: number
): { success: boolean; damage: number; message: string } {
  if (state.phase !== 'combat' || !state.combat?.active) {
    return { success: false, damage: 0, message: 'Not in combat' }
  }

  const player = state.players[state.currentPlayer]
  if (!player) return { success: false, damage: 0, message: 'No active player' }

  const spell = getSpellById(spellId)
  if (!spell) return { success: false, damage: 0, message: 'Spell not found' }

  // Must know the spell (have knowledge level >= 1)
  const spellKnowledge = player.spellKnowledge[spell.name.et] || 0
  if (!spellKnowledge) {
    return { success: false, damage: 0, message: 'You do not know this spell' }
  }

  // Must have enough mana
  if (player.mana[spell.manaType] < spell.manaCost) {
    return {
      success: false,
      damage: 0,
      message: `Not enough ${spell.manaType} mana`,
    }
  }

  // Must be a damage spell
  if (spell.effectType !== 'singleTarget' && spell.effectType !== 'aoe') {
    return { success: false, damage: 0, message: 'Cannot use this spell in combat' }
  }

  // Deduct mana
  player.mana[spell.manaType] -= spell.manaCost

  // Calculate damage using VBA formula (line 12127):
  // damage = floor((spell_knowledge * base_damage + random(0, power/2)) * (caster_power / target_power) - random(0, target_power))
  const casterPower = player.stats.power
  const targetPower = state.combat.defenderStats.power || 1 // Avoid division by zero
  const baseDamage = spell.basePower
  const randomBonus = Math.floor(Math.random() * (casterPower / 2 + 1))
  const randomReduction = Math.floor(Math.random() * (targetPower + 1))

  // VBA formula: knowledge multiplies base damage, then power ratio applied
  const rawDamage =
    (spellKnowledge * baseDamage + randomBonus) * (casterPower / targetPower) - randomReduction
  const damage = Math.max(0, Math.floor(rawDamage))

  // Apply damage to defender
  state.combat.defenderHp -= damage

  // Log it
  state.combat.log.push({
    round: state.combat.round,
    actor: player.name,
    action: 'spell',
    damage,
    message: `${player.name} casts ${spell.name.en} for ${damage} damage!`,
  })

  // Check if defender defeated
  if (state.combat.defenderHp <= 0) {
    state.combat.defenderHp = 0
    state.combat.log.push({
      round: state.combat.round,
      actor: 'System',
      action: 'victory',
      message: `${state.combat.defenderName} defeated by magic!`,
    })
    // Note: endCombat() should be called by the game store, not here
  }

  return {
    success: true,
    damage,
    message: `Dealt ${damage} damage with ${spell.name.en}`,
  }
}
