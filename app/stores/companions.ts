/**
 * Companion and Mercenary Store
 * Handles all companion (summons/pets) and mercenary-related game logic
 * Extracted from game.ts for better organization and reusability
 */

import type { GameState, Player, CompanionInstance, MercenaryInstance } from './types'
import { getMobByName, getLevelupByName } from '~/data/schemas'

/**
 * Hire a mercenary (hired combatant)
 * VBA: mercenary_camp() line 17310, hire_mercenary() line 17372
 *
 * Cost formula: mercTier × contractLength × 2
 * Requires mercenary to be unlocked via buildings
 *
 * @param state GameState (for accessing current player)
 * @param mercName Estonian mercenary name
 * @param contractLength Number of turns the mercenary fights (default: 5)
 * @returns Result with success status and message
 */
export function hireMercenary(
  state: GameState,
  mercName: string,
  contractLength: number = 5
): { success: boolean; message: string } {
  const player = state.players[state.currentPlayer]
  if (!player) return { success: false, message: 'No active player' }

  // Check if mercenary is unlocked
  if (!player.unlockedMercenaries.includes(mercName)) {
    return { success: false, message: 'Mercenary not unlocked (build required building first)' }
  }

  // Get mob data for the mercenary
  const mercMob = getMobByName(mercName)
  if (!mercMob) return { success: false, message: 'Mercenary not found' }

  // Calculate cost: mercTier × contractLength × 2
  const cost = mercMob.mercTier * contractLength * 2
  if (player.gold < cost) {
    return { success: false, message: `Not enough gold (need ${cost})` }
  }

  // Deduct gold
  player.gold -= cost

  // Create mercenary instance
  const mercenary: MercenaryInstance = {
    id: `merc-${Date.now()}`,
    mobId: mercMob.id,
    name: mercMob.name.en,
    hp: mercMob.hp,
    maxHp: mercMob.hp,
    armor: mercMob.armor,
    damage: mercMob.damage,
    attacksPerRound: mercMob.attacksPerRound,
    damageType: mercMob.damageType ?? 'crush',
    stats: mercMob.stats,
    contractTurns: contractLength,
    mercTier: mercMob.mercTier,
  }

  player.mercenaries.push(mercenary)

  return {
    success: true,
    message: `Hired ${mercMob.name.en} for ${contractLength} turns (${cost}g)`,
  }
}

/**
 * Evolve a pet to its next form
 * VBA: level_up_mob (lines 13525-13637)
 *
 * Applies stat bonuses, learns spells, gains resistances
 * Called when pet's evolutionProgress reaches 10 (after accumulating combat rounds)
 *
 * @param player Player state (for updating spell knowledge)
 * @param companion Pet to evolve
 * @param log Optional combat log to record evolution event
 */
export function evolvePet(
  player: Player,
  companion: CompanionInstance,
  log?: Array<{ round: number; actor: string; action: string; message: string }>
): void {
  const evolutionData = getLevelupByName(companion.evolvesInto)
  if (!evolutionData) return

  // Apply HP bonus
  companion.maxHp += evolutionData.hpBonus
  companion.hp = Math.min(companion.hp + evolutionData.hpBonus, companion.maxHp)

  // Apply attacks bonus
  companion.attacksPerRound += evolutionData.attacksBonus

  // Apply damage bonus
  companion.damage.diceCount += evolutionData.damageBonus.diceCount
  companion.damage.diceSides += evolutionData.damageBonus.diceSides

  // Apply stat bonuses
  companion.stats.strength += evolutionData.statBonuses.strength
  companion.stats.dexterity += evolutionData.statBonuses.dexterity
  companion.stats.power += evolutionData.statBonuses.power

  // Apply armor bonus
  companion.armor += evolutionData.armorBonus

  // Learn new spells (add to player's spell knowledge if not already known)
  for (const spellName of evolutionData.learnsSpells) {
    if (!player.spellKnowledge[spellName]) {
      player.spellKnowledge[spellName] = 1
    } else {
      // Already known - increase knowledge level
      player.spellKnowledge[spellName]++
    }
  }

  // Update name to evolved form
  const oldName = companion.name
  companion.name = evolutionData.name.en

  // Set next evolution target
  companion.evolvesInto = evolutionData.evolvesInto

  // Log evolution if combat log provided
  if (log) {
    log.push({
      round: log.length > 0 ? log[log.length - 1]!.round : 1,
      actor: 'System',
      action: 'evolution',
      message: `${oldName} evolved into ${companion.name}!`,
    })
  }
}

/**
 * Create a summon companion instance
 * VBA mechanics (lines 6099-6192): Stat multiplier based on spell knowledge tier level
 *
 * When a summon spell is cast with multiple knowledge levels, summons can be "leveled up"
 * by advancing through creature tiers that are the same. This increases summonsLevel,
 * which applies a stat multiplier: (20 + (summonsLevel - 1) * 2) / 10
 *
 * @param summonMob Mob data for the creature to summon
 * @param summonDuration Number of turns summon persists
 * @param summonsLevel Stat multiplier level (1+)
 * @param playerPower Player's power stat (for HP bonus calculation)
 * @returns CompanionInstance configured for summon mechanics
 */
export function createSummonCompanion(
  summonMob: ReturnType<typeof getMobByName>,
  summonDuration: number,
  summonsLevel: number,
  playerPower: number
): CompanionInstance | null {
  if (!summonMob) return null

  // VBA line 6170: Summons get HP bonus = power × 2
  const hpBonus = playerPower * 2

  // VBA lines 6174-6178: If summonsLevel > 1, stats get multiplied
  // Multiplier = (20 + (summonsLevel - 1) * 2) / 10
  const statMultiplier = summonsLevel > 1 ? (20 + (summonsLevel - 1) * 2) / 10 : 1

  const companion: CompanionInstance = {
    id: `summon-${Date.now()}-${Math.random()}`,
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
    isPet: false, // Summons are not permanent pets
    evolutionProgress: 0,
    evolvesInto: summonMob.evolvesInto ?? '', // Summons can't evolve
    summonsLevel,
  }

  return companion
}

/**
 * Calculate summon tier and level based on spell knowledge
 * VBA lines 6103-6124: Determine summon tier based on knowledge
 *
 * Loops through knowledge levels to find the final summon creature and count,
 * and calculates the summonsLevel multiplier.
 *
 * @param tiers Array of { creature: string; count: number } for each knowledge level
 * @param knowledge Player's current knowledge level for this spell
 * @returns Object with summon creature, count, and summonsLevel
 */
export function calculateSummonTier(
  tiers: Array<{ creature: string; count: number }>,
  knowledge: number
): { summonCreature: string; summonCount: number; summonsLevel: number } {
  let summonsLevel = 1
  let summonCreature = tiers[0]!.creature
  let summonCount = tiers[0]!.count

  for (let x = 1; x <= knowledge; x++) {
    const tierIndex = Math.min(x - 1, tiers.length - 1)
    const prevIndex = Math.max(0, tierIndex - 1)

    const currentTier = tiers[tierIndex]!
    const prevTier = tiers[prevIndex]!

    if (x > 1 && currentTier.creature === prevTier.creature && currentTier.count === prevTier.count) {
      // Same creature and count as previous tier = increase summons level
      summonsLevel++
    } else if (x > 1) {
      // Different creature or count = reset summons level
      summonsLevel = 1
    }

    summonCreature = currentTier.creature
    summonCount = currentTier.count
  }

  return { summonCreature, summonCount, summonsLevel }
}

/**
 * Decrement mercenary contracts at end of turn
 * Removes mercenaries whose contracts have expired
 *
 * @param player Player state
 */
export function decrementMercenaryContracts(player: Player): void {
  player.mercenaries = player.mercenaries.filter(merc => {
    merc.contractTurns--
    return merc.contractTurns > 0
  })
}

/**
 * Remove expired summons at end of turn
 * Permanent pets are never expired (turnsRemaining === null)
 *
 * @param player Player state
 */
export function removeExpiredSummons(player: Player): void {
  player.companions = player.companions.filter(companion => {
    if (companion.turnsRemaining === null) return true // Permanent pets never expire
    companion.turnsRemaining--
    return companion.turnsRemaining > 0
  })
}
