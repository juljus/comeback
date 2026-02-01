/**
 * Movement-related game logic
 * Handles player movement, doubles mechanics, income collection, and events
 */

import type {
  GameState,
  Player,
  DiceRoll,
  DoublesState,
  BoardSquare,
  ManaPool,
  ManaType,
  ActionPhase,
  EventState,
  EventType,
} from './types'
import {
  TITLE_SALARIES,
  CAVE_LAND_ID,
  DUNGEON_LAND_ID,
  TREASURE_ISLAND_LAND_ID,
} from './types'
import { events as eventsData } from '~/data/schemas'
import { getLandType, getLandIncome } from './helpers'

/**
 * Arcane Tower mana scaling formula
 * 1 tower → 1 mana, 2 towers → 3 mana, 3 towers → 6 mana, 4+ towers → 12 mana
 * Verified from help.csv
 */
function getArcaneTowerMana(towerCount: number): number {
  const manaByCount = [0, 1, 3, 6, 12]
  return manaByCount[Math.min(towerCount, 4)] ?? 12
}

/**
 * Roll 2d6 and initiate movement
 *
 * Doubles mechanic (from VBA lines 4303-4370):
 * 1. Player can choose to KEEP the roll or ROLL AGAIN
 * 2. Consecutive doubles award gold bonus: 50 * consecutive_count²
 *    - 1st double: 50 gold
 *    - 2nd consecutive: 200 gold (50 * 2²)
 *    - 3rd consecutive: 450 gold (50 * 3²)
 *
 * @param state The game state
 * @returns The dice roll result, or null if the action is invalid
 */
export function rollAndMove(state: GameState): DiceRoll | null {
  if (state.phase !== 'playing') return null

  // Can roll if: mustMoveFirst (round 0) OR has actions remaining
  if (!state.mustMoveFirst && state.actionsRemaining <= 0) return null

  // Don't allow rolling if awaiting doubles decision
  if (state.doubles?.awaitingDecision) return null

  const player = state.players[state.currentPlayer]
  if (!player) return null

  // Roll 2d6
  const die1 = Math.floor(Math.random() * 6) + 1
  const die2 = Math.floor(Math.random() * 6) + 1
  const total = die1 + die2

  state.lastDiceRoll = {
    dice: [die1, die2],
    total,
  }

  // Check for doubles
  const isDoubles = die1 === die2

  if (isDoubles) {
    // Increment consecutive doubles count
    const previousCount = state.doubles?.consecutiveCount ?? 0
    const newCount = previousCount + 1

    // Award gold bonus for consecutive doubles: 50 * count²
    const goldBonus = 50 * (newCount * newCount)
    player.gold += goldBonus

    // Set up doubles state - player must decide to keep or reroll
    state.doubles = {
      consecutiveCount: newCount,
      awaitingDecision: true,
      pendingMove: total,
    }

    // Don't consume action yet - wait for player decision
    return state.lastDiceRoll
  }

  // Not doubles - execute the move normally
  executeMove(state, player, total)

  // Reset doubles state since non-doubles was rolled
  state.doubles = null

  // First move is free (VBA round 0), subsequent moves cost an action
  if (state.mustMoveFirst) {
    state.mustMoveFirst = false
  } else {
    consumeAction(state)
  }

  return state.lastDiceRoll
}

/**
 * Keep the current doubles roll and move
 * Called when player decides not to reroll after rolling doubles
 *
 * @param state The game state
 * @returns True if action was successful, false otherwise
 */
export function keepDoublesRoll(state: GameState): boolean {
  if (!state.doubles?.awaitingDecision) return false

  const player = state.players[state.currentPlayer]
  if (!player) return false

  // Execute the pending move
  executeMove(state, player, state.doubles.pendingMove)

  // Reset doubles state (consecutive count resets when keeping)
  state.doubles = null

  // First move is free (VBA round 0), subsequent moves cost an action
  if (state.mustMoveFirst) {
    state.mustMoveFirst = false
  } else {
    consumeAction(state)
  }

  return true
}

/**
 * Reroll after rolling doubles
 * Player forfeits current roll to try for another doubles
 *
 * @param state The game state
 * @returns The new dice roll result, or null if the action is invalid
 */
export function rerollDoubles(state: GameState): DiceRoll | null {
  if (!state.doubles?.awaitingDecision) return null

  // Clear the awaiting decision flag but keep the consecutive count
  const currentCount = state.doubles.consecutiveCount
  state.doubles = {
    consecutiveCount: currentCount,
    awaitingDecision: false,
    pendingMove: 0,
  }

  // Roll again (this will handle the new roll)
  return rollAndMove(state)
}

/**
 * Execute a move by the given amount
 * Handles position update, Royal Court income collection, and event triggering
 *
 * @param state The game state
 * @param player The player moving
 * @param moveAmount The number of spaces to move
 */
export function executeMove(state: GameState, player: Player, moveAmount: number): void {
  const oldPosition = player.position

  // Move forward by dice total
  const boardSize = state.board.length
  player.position = (player.position + moveAmount) % boardSize

  // Check if player passed Royal Court (position 0)
  // Player passes if they wrapped around (new position < old position + total means they crossed 0)
  const passedRoyalCourt = player.position < oldPosition || oldPosition + moveAmount >= boardSize

  if (passedRoyalCourt) {
    collectIncome(state, player)
  }

  // Check for event location and trigger event
  const landedSquare = state.board[player.position]
  if (landedSquare) {
    checkForEvent(state, landedSquare.landTypeId)
  }
}

/**
 * Collect tax income and mana from all owned lands
 * Called when passing Royal Court
 *
 * Title salaries verified from Game_data1 cells 74-76 (VBA lines 3974-3977):
 * - Commoner: 20 gold
 * - Baron: 30 gold
 * - Count: 40 gold
 * - Duke: 50 gold
 *
 * Arcane Towers have special scaling formula (verified from help.csv):
 * 1→1 mana, 2→3 mana, 3→6 mana, 4→12 mana
 *
 * @param state The game state
 * @param player The player collecting income
 * @returns Object with gold earned and mana gained by type
 */
export function collectIncome(
  state: GameState,
  player: Player
): { gold: number; mana: Partial<ManaPool> } {
  let totalIncome = 0
  const manaGained: Partial<ManaPool> = {}

  // Add title salary
  const salary = TITLE_SALARIES[player.title] ?? 20 // Default to commoner salary
  totalIncome += salary

  // Count Arcane Towers for scaling formula
  let arcaneTowerCount = 0

  for (const square of state.board) {
    if (square.owner === player.index) {
      // Include both base income and bonus from improvements
      totalIncome += getLandIncome(square)

      // Collect mana based on land type
      const landType = getLandType(square.landTypeId)
      if (landType?.manaType) {
        if (landType.manaType === 'arcane') {
          arcaneTowerCount++
        } else {
          // Normal lands give 1 mana each
          manaGained[landType.manaType] = (manaGained[landType.manaType] ?? 0) + 1
        }
      }
    }
  }

  // Arcane Towers have special scaling
  const arcaneFromTowers = getArcaneTowerMana(arcaneTowerCount)
  if (arcaneFromTowers > 0) {
    manaGained.arcane = (manaGained.arcane ?? 0) + arcaneFromTowers
  }

  // Apply income and mana
  player.gold += totalIncome

  for (const [type, amount] of Object.entries(manaGained)) {
    if (amount && amount > 0) {
      player.mana[type as ManaType] += amount
    }
  }

  return { gold: totalIncome, mana: manaGained }
}

/**
 * Check if landed square is an event location and trigger random event
 *
 * Event locations:
 * - Cave (ID 12)
 * - Dungeon (ID 14)
 * - Treasure Island (ID 13)
 *
 * @param state The game state
 * @param landTypeId The land type ID of the square
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
 * Consume one action point and update action phase
 *
 * Action phases:
 * - 3 actions remaining: morning
 * - 2 actions remaining: noon
 * - 1 action remaining: evening
 * - 0 actions remaining: turn ends
 *
 * @param state The game state
 */
export function consumeAction(state: GameState): void {
  state.actionsRemaining--

  // Update action phase
  if (state.actionsRemaining === 2) {
    state.actionPhase = 'noon'
  } else if (state.actionsRemaining === 1) {
    state.actionPhase = 'evening'
  }
}

/**
 * Select a random event based on location and weighted odds
 * VBA: vali_event() line 17920
 *
 * @param location The event location
 * @returns The selected event, or null if none are available
 */
function selectRandomEvent(location: 'cave' | 'dungeon' | 'treasureIsland'): EventType | null {
  // Filter events that are enabled for this location and build weighted pool
  const eligibleEvents: { event: EventType; chance: number }[] = []

  for (const event of eventsData) {
    const locationConfig = event.locations[location]
    if (locationConfig?.enabled && locationConfig.chance > 0) {
      eligibleEvents.push({ event, chance: locationConfig.chance })
    }
  }

  if (eligibleEvents.length === 0) return null

  // Calculate total weight
  const totalWeight = eligibleEvents.reduce((sum, e) => sum + e.chance, 0)

  // Random selection based on weight
  let random = Math.random() * totalWeight
  for (const { event, chance } of eligibleEvents) {
    random -= chance
    if (random <= 0) {
      return event
    }
  }

  // Fallback to first eligible event
  return eligibleEvents[0]?.event ?? null
}
