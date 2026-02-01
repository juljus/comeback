import type {
  GameState,
  EventState,
  Player,
  BuffEffect,
  CompanionInstance,
} from './types'
import type {
  EventType,
  ManaType,
} from '~/data/schemas'
import {
  lands as landsData,
  mobs as mobsData,
  items as itemsData,
  events as eventsData,
  spells as spellsData,
} from '~/data/schemas'
import {
  CAVE_LAND_ID,
  TREASURE_ISLAND_LAND_ID,
  DUNGEON_LAND_ID,
} from './types'

/**
 * Check if current location triggers an event
 * Events can occur at Cave, Dungeon, or Treasure Island locations
 * VBA: vali_event() line 17920
 */
export function checkForEvent(state: GameState, landTypeId: number): void {
  let location: 'cave' | 'dungeon' | 'treasureIsland' | null = null

  if (landTypeId === CAVE_LAND_ID) {
    location = 'cave'
  } else if (landTypeId === DUNGEON_LAND_ID) {
    location = 'dungeon'
  } else if (landTypeId === TREASURE_ISLAND_LAND_ID) {
    location = 'treasureIsland'
  }

  if (!location) return // Not an event location

  // Select event based on weighted odds
  const selectedEvent = selectRandomEvent(location)
  if (!selectedEvent) return

  // Trigger the event
  state.event = {
    active: true,
    eventId: selectedEvent.id,
    eventName: selectedEvent.name.en,
    eventDescription: selectedEvent.description.en,
    location,
    choices: selectedEvent.choices,
    resolved: false,
  }

  // Set phase to event
  state.phase = 'event'
}

/**
 * Resolve an event and apply its effects
 * VBA: event_in_main_turn() line 17963
 */
export function resolveEvent(
  state: GameState,
  choiceIndex?: number
): { success: boolean; message: string } {
  if (!state.event?.active) {
    return { success: false, message: 'No active event' }
  }

  const player = state.players[state.currentPlayer]
  if (!player) return { success: false, message: 'No active player' }

  const event = eventsData.find(e => e.id === state.event!.eventId)
  if (!event) {
    state.event = null
    state.phase = 'playing'
    return { success: false, message: 'Event not found' }
  }

  let resultMessage = ''

  // Handle choice events
  if (event.choices && choiceIndex !== undefined) {
    const choice = event.choices[choiceIndex]
    if (choice) {
      switch (choice.effect) {
        case 'treasure':
          const goldAmount = 50 + Math.floor(Math.random() * 100)
          player.gold += goldAmount
          resultMessage = `You found treasure: ${goldAmount} gold!`
          break
        case 'combat':
          // Start combat with a random enemy
          resultMessage = 'You encounter an enemy!'
          // TODO: Could trigger combat here
          break
        case 'heal':
          const healAmount = Math.floor(Math.random() * 15) + 5
          const actualHeal = Math.min(healAmount, player.maxHp - player.hp)
          player.hp += actualHeal
          resultMessage = `The spring heals you for ${actualHeal} HP!`
          break
        case 'nothing':
          resultMessage = 'Nothing happens...'
          break
        default:
          resultMessage = 'You continue on your way.'
      }
    }
  } else if (event.effect) {
    // Apply event effect
    if (event.effect.gold) {
      const goldAmount = event.effect.gold.min +
        Math.floor(Math.random() * (event.effect.gold.max - event.effect.gold.min + 1))
      player.gold += goldAmount
      resultMessage = `You found ${goldAmount} gold!`
    }

    if (event.effect.stat && event.effect.amount) {
      player.stats[event.effect.stat] += event.effect.amount
      resultMessage = `Your ${event.effect.stat} increased by ${event.effect.amount}!`
    }

    if (event.effect.heal) {
      const healAmount = event.effect.heal.min +
        Math.floor(Math.random() * (event.effect.heal.max - event.effect.heal.min + 1))
      const actualHeal = Math.min(healAmount, player.maxHp - player.hp)
      player.hp += actualHeal
      resultMessage = `You were healed for ${actualHeal} HP!`
    }

    if (event.effect.mana) {
      const manaAmount = event.effect.mana.amount.min +
        Math.floor(Math.random() * (event.effect.mana.amount.max - event.effect.mana.amount.min + 1))
      // Random mana type if specified as 'random'
      const manaType = event.effect.mana.type === 'random'
        ? (['fire', 'earth', 'air', 'water', 'death', 'life', 'arcane'] as ManaType[])[Math.floor(Math.random() * 7)]!
        : event.effect.mana.type as ManaType
      player.mana[manaType] += manaAmount
      resultMessage = `You gained ${manaAmount} ${manaType} mana!`
    }

    if (event.effect.learnSpell) {
      // Learn a random spell the player doesn't know
      const allSpells = getAllSpells()
      const unknownSpells = allSpells.filter(s => !player.spellKnowledge[s.name.et])
      if (unknownSpells.length > 0) {
        const randomSpell = unknownSpells[Math.floor(Math.random() * unknownSpells.length)]!
        player.spellKnowledge[randomSpell.name.et] = 1
        resultMessage = `You learned ${randomSpell.name.en}!`
      } else {
        resultMessage = 'You have already learned all available spells.'
      }
    }

    if (event.effect.companion) {
      // Add a random companion (simple implementation)
      const companionMobs = mobsData.filter(m => m.mercTier <= 2) // Low-tier mobs
      if (companionMobs.length > 0) {
        const randomMob = companionMobs[Math.floor(Math.random() * companionMobs.length)]!
        const companion: CompanionInstance = {
          id: `event-companion-${Date.now()}`,
          mobId: randomMob.id,
          name: randomMob.name.en,
          hp: randomMob.hp,
          maxHp: randomMob.hp,
          armor: randomMob.armor,
          damage: randomMob.damage,
          attacksPerRound: randomMob.attacksPerRound,
          damageType: randomMob.damageType ?? 'crush',
          stats: randomMob.stats,
          turnsRemaining: null, // Permanent companion from event
          isPet: true,
          evolutionProgress: 0,
          evolvesInto: randomMob.evolvesInto ?? '', // Can evolve if mob has evolution path
          summonsLevel: 1,
        }
        player.companions.push(companion)
        resultMessage = `${randomMob.name.en} joins you!`
      }
    }

    if (event.effect.buff) {
      // Apply a buff
      const buff: BuffEffect = {
        type: 'strength',
        duration: 5,
        power: 2,
        sourceSpell: 'event',
      }
      player.buffs.push(buff)
      resultMessage = 'You feel empowered!'
    }

    if (event.effect.combat) {
      // Combat events would start combat
      resultMessage = 'You must fight for the treasure!'
      // TODO: Could trigger special combat here
    }

    if (event.effect.itemReward) {
      // Give a random item
      const affordableItems = itemsData.filter(i => i.value >= 20 && i.value <= 200)
      if (affordableItems.length > 0) {
        const randomItem = affordableItems[Math.floor(Math.random() * affordableItems.length)]!
        player.inventory.push(randomItem.id)
        resultMessage = `You found ${randomItem.name.en}!`
      }
    }
  }

  // Clear event and return to playing
  state.event.resolved = true
  state.event = null
  state.phase = 'playing'

  return { success: true, message: resultMessage || 'Event resolved.' }
}

/**
 * Dismiss/skip an event without resolving it
 */
export function dismissEvent(state: GameState): boolean {
  if (!state.event?.active) return false
  state.event = null
  state.phase = 'playing'
  return true
}

/**
 * Select a random event based on location and weighted odds
 * VBA: vali_event() line 17920
 */
function selectRandomEvent(location: 'cave' | 'dungeon' | 'treasureIsland'): EventType | null {
  // Filter events that are enabled for this location and build weighted pool
  const eligibleEvents: { event: EventType; chance: number }[] = []

  for (const event of eventsData) {
    // Check if event is enabled for this location
    const locationConfig = event.locations[location]
    if (locationConfig?.enabled && locationConfig.chance > 0) {
      eligibleEvents.push({ event, chance: locationConfig.chance })
    }
  }

  if (eligibleEvents.length === 0) return null

  // Create weighted pool and select
  let totalChance = 0
  for (const item of eligibleEvents) {
    totalChance += item.chance
  }

  let random = Math.random() * totalChance
  for (const item of eligibleEvents) {
    random -= item.chance
    if (random <= 0) {
      return item.event
    }
  }

  return eligibleEvents[eligibleEvents.length - 1]?.event ?? null
}

/**
 * Get all valid spells (filters out corrupted entries)
 */
function getAllSpells() {
  // Filter out corrupted entries (ID 37, 38 have invalid data)
  return spellsData.filter(s => s.name.et && s.name.et.length > 0 && !s.name.et.match(/^\d+$/))
}
