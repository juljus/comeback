/**
 * Building and Training Store
 *
 * This module contains all building construction and stat/spell training logic
 * extracted from the main game store.
 *
 * Building Effects:
 * - Grant spells to player (at knowledge level 1)
 * - Unlock mercenaries for hiring
 * - Grant fortification and archer bonuses:
 *   - Kants (Fort): fortificationLevel 1, 2 archers
 *   - Linnus (Citadel): fortificationLevel 2, 3 archers total
 *   - Kindlus (Castle): fortificationLevel 3, 4 archers total
 *
 * Training Mechanics:
 * - STR/DEX: Train at Training Grounds, max cap 6, costs current_stat² × 5 gold
 * - Power: Train at Mage Guild, no explicit cap, costs current_stat² × 5 gold
 * - Spells: Train at Mage Guild/Library, costs current_knowledge × 200 gold
 *
 * All training requires full day (morning phase, all 3 action points consumed)
 */

import type {
  GameState,
  Player,
  BoardSquare,
  BuildingType,
  LandType,
} from './types'
import { getBuildingByName } from '~/data/schemas'
import { getLandType } from './helpers'

/**
 * Get available buildings for a specific land type that player can build
 * Filters out already built and checks prerequisites
 */
export function getAvailableBuildingsForLand(
  board: BoardSquare[],
  player: Player,
  landTypeId: number
): BuildingType[] {
  const landType = getLandType(landTypeId)
  if (!landType) return []

  // Get all buildings on this land type across all squares owned by player
  const builtOnThisType = new Set<string>()
  for (const square of board) {
    if (square.landTypeId === landTypeId && square.owner === player.index) {
      square.buildings.forEach(b => builtOnThisType.add(b))
    }
  }

  // Filter available buildings
  return landType.availableBuildings
    .map(name => getBuildingByName(name))
    .filter((b): b is BuildingType => b !== null)
    .filter(b => {
      // Not already built
      if (builtOnThisType.has(b.name.et)) return false
      // Can afford
      if (player.gold < b.cost) return false
      // Prerequisites met
      return b.prerequisites.every(prereq => builtOnThisType.has(prereq))
    })
}

/**
 * Build a building on a land type
 *
 * Prerequisites:
 * - Player must have completed (own all squares of) the land type
 * - Player must have enough gold for building cost
 * - Cannot build without having moved first (canTakeActions)
 *
 * Effects:
 * - Deducts building cost from player gold
 * - Adds building to a square of the land type
 * - Grants spells (at level 1) to player
 * - Unlocks mercenaries for hiring
 * - Updates fortification levels and archer counts
 * - Triggers title promotion check
 *
 * @param state - Current game state
 * @param landTypeId - Land type ID to build on (must be completed)
 * @param buildingName - Estonian building name (e.g. "Kants", "Linnus", "Kindlus")
 * @param getBuildingByName - Helper to get building data by name
 * @param getCompletedLandTypes - Helper to get player's completed land types
 * @param canTakeActions - Whether player has moved first
 * @param consumeAction - Callback to consume action point
 * @param checkTitlePromotion - Callback to check for title promotion
 * @returns true if building was successfully built, false otherwise
 */
export function buildOnLand(
  state: GameState,
  landTypeId: number,
  buildingName: string,
  helpers: {
    getBuildingByName: (name: string) => BuildingType | undefined
    getCompletedLandTypes: (player: Player) => number[]
    canTakeActions: boolean
  },
  callbacks: {
    consumeAction: () => void
    checkTitlePromotion: () => void
  }
): boolean {
  // Check if player can take building actions
  if (!helpers.canTakeActions) {
    return false
  }

  const player = state.players[state.currentPlayer]
  if (!player) {
    return false
  }

  // Check if player has completed this land type
  const completedLandTypes = helpers.getCompletedLandTypes(player)
  if (!completedLandTypes.includes(landTypeId)) {
    return false
  }

  // Get building data
  const building = helpers.getBuildingByName(buildingName)
  if (!building) {
    return false
  }

  // Check if player can afford the building
  if (player.gold < building.cost) {
    return false
  }

  // Find a square of this land type owned by player to add building to
  const targetSquare = state.board.find(
    sq => sq.landTypeId === landTypeId && sq.owner === player.index
  )
  if (!targetSquare) {
    return false
  }

  // Pay building cost
  player.gold -= building.cost

  // Add building to square
  targetSquare.buildings.push(building.name.et)

  // Apply building effects
  // 1. Grant spells to player (VBA: adds at level 1)
  for (const spellName of building.grantsSpells) {
    if (!player.spellKnowledge[spellName]) {
      player.spellKnowledge[spellName] = 1
    }
    // Buildings grant spells, training increases knowledge separately
  }

  // 2. Unlock mercenaries for player
  for (const mercName of building.unlocksMercenaries) {
    if (!player.unlockedMercenaries.includes(mercName)) {
      player.unlockedMercenaries.push(mercName)
    }
  }

  // 3. Update fortification level and archer count
  // VBA: Buildings column 19 = archery slots (cumulative per land type)
  // Kants (Fort) = 2 archers, Linnus (Citadel) = +1 = 3 total, Kindlus (Castle) = +1 = 4 total
  if (building.name.et === 'Kants') {
    // Apply to all squares of this land type owned by player
    for (const sq of state.board) {
      if (sq.landTypeId === landTypeId && sq.owner === player.index) {
        sq.fortificationLevel = 1
        sq.archerCount = 2 // Fort: 2 archers (VBA col_18)
      }
    }
  } else if (building.name.et === 'Linnus') {
    // Citadel upgrades existing fort
    for (const sq of state.board) {
      if (sq.landTypeId === landTypeId && sq.owner === player.index) {
        sq.fortificationLevel = 2
        sq.archerCount = 3 // Fort + Citadel: 2+1 = 3 archers
      }
    }
  } else if (building.name.et === 'Kindlus') {
    // Castle upgrades existing citadel
    for (const sq of state.board) {
      if (sq.landTypeId === landTypeId && sq.owner === player.index) {
        sq.fortificationLevel = 3
        sq.archerCount = 4 // Fort + Citadel + Castle: 2+1+1 = 4 archers
      }
    }
  }

  // Consume action point for building
  callbacks.consumeAction()

  // Check for title promotion after building
  callbacks.checkTitlePromotion()

  return true
}

/**
 * Maximum stat cap for STR and DEX training
 * Verified from VBA lines 17608, 17614
 */
export const MAX_TRAINING_STAT_CAP = 6

/**
 * Train a character stat (STR or DEX) at Training Grounds
 *
 * Prerequisites:
 * - Must be at Training Grounds
 * - Must be in morning phase with all 3 action points (full day)
 * - Current stat must be below max cap of 6
 * - Must have enough gold for training cost
 *
 * Training Cost:
 * - Formula: current_stat² × 5 (verified from VBA)
 * - Cost increases as stat increases: 5, 20, 45, 80, 125, 180 gold
 *
 * Effect:
 * - Deducts training cost from player gold
 * - Increases stat by 1
 * - Ends the turn (consumes all action points for the day)
 *
 * @param state - Current game state
 * @param stat - Which stat to train: 'strength' or 'dexterity'
 * @param isAtTrainingGrounds - Whether player is currently at Training Grounds
 * @param getTrainingCost - Helper to calculate cost: current_stat² × 5
 * @param endTurn - Callback to end the turn
 * @returns true if training was successful, false otherwise
 */
export function trainStat(
  state: GameState,
  stat: 'strength' | 'dexterity',
  isAtTrainingGrounds: boolean,
  getTrainingCost: (currentStatValue: number) => number,
  endTurn: () => void
): boolean {
  // Check location and timing
  if (!isAtTrainingGrounds) {
    return false
  }

  // Must start in morning with full 3 action points
  if (state.actionsRemaining !== 3 || state.actionPhase !== 'morning') {
    return false
  }

  const player = state.players[state.currentPlayer]
  if (!player) {
    return false
  }

  // Check stat cap (STR and DEX max out at 6)
  if (player.stats[stat] >= MAX_TRAINING_STAT_CAP) {
    return false
  }

  // Calculate and check training cost
  const trainingCost = getTrainingCost(player.stats[stat])
  if (player.gold < trainingCost) {
    return false
  }

  // Pay cost and increase stat
  player.gold -= trainingCost
  player.stats[stat]++

  // Training takes entire day
  endTurn()

  return true
}

/**
 * Train Power stat at Mage Guild
 *
 * Prerequisites:
 * - Must be at Mage Guild
 * - Must be in morning phase with all 3 action points (full day)
 * - Must have enough gold for training cost
 *
 * Training Cost:
 * - Formula: current_power² × 5 (verified from VBA)
 * - Cost increases as power increases: 5, 20, 45, 80, 125, ...
 *
 * Note:
 * - Power has no explicit cap in VBA (unlike STR/DEX which cap at 6)
 * - Same cost formula as STR/DEX training
 *
 * @param state - Current game state
 * @param isAtMageGuild - Whether player is currently at Mage Guild
 * @param getTrainingCost - Helper to calculate cost: current_power² × 5
 * @param endTurn - Callback to end the turn
 * @returns true if training was successful, false otherwise
 */
export function trainPower(
  state: GameState,
  isAtMageGuild: boolean,
  getTrainingCost: (currentStatValue: number) => number,
  endTurn: () => void
): boolean {
  // Check location and timing
  if (!isAtMageGuild) {
    return false
  }

  // Must start in morning with full 3 action points
  if (state.actionsRemaining !== 3 || state.actionPhase !== 'morning') {
    return false
  }

  const player = state.players[state.currentPlayer]
  if (!player) {
    return false
  }

  // Calculate and check training cost
  const trainingCost = getTrainingCost(player.stats.power)
  if (player.gold < trainingCost) {
    return false
  }

  // Pay cost and increase power
  player.gold -= trainingCost
  player.stats.power++

  // Training takes entire day
  endTurn()

  return true
}

/**
 * Train a spell to increase its knowledge level at Mage Guild or Library
 *
 * Prerequisites:
 * - Must be at Mage Guild (same as power training)
 * - Must be in morning phase with all 3 action points (full day)
 * - Must already know the spell (spell must be in spellKnowledge)
 * - Must have enough gold for training cost
 *
 * Training Cost:
 * - Formula: current_knowledge × 200 gold (VBA line 1345)
 * - Cost escalates quickly: level 1→2 = 200, level 2→3 = 400, level 3→4 = 600, etc.
 *
 * Effect:
 * - Deducts training cost from player gold
 * - Increases spell knowledge by 1 level
 * - Ends the turn (consumes all action points for the day)
 *
 * VBA References:
 * - Line 1345: cost = current_knowledge × 200
 * - Lines 1365/1381: training takes full day (phase = 4)
 *
 * @param state - Current game state
 * @param spellName - Estonian spell name to train
 * @param isAtMageGuild - Whether player is currently at Mage Guild
 * @param endTurn - Callback to end the turn
 * @returns object with success boolean and message string
 */
export function trainSpell(
  state: GameState,
  spellName: string,
  isAtMageGuild: boolean,
  endTurn: () => void
): { success: boolean; message: string } {
  // Check location
  if (!isAtMageGuild) {
    return { success: false, message: 'Must be at Mage Guild to train spells' }
  }

  // Check timing - must start in morning with full 3 action points
  if (state.actionsRemaining !== 3 || state.actionPhase !== 'morning') {
    return { success: false, message: 'Spell training requires a full day (start in morning)' }
  }

  const player = state.players[state.currentPlayer]
  if (!player) {
    return { success: false, message: 'No active player' }
  }

  // Check if player knows the spell
  const currentKnowledge = player.spellKnowledge[spellName]
  if (!currentKnowledge) {
    return { success: false, message: 'You do not know this spell' }
  }

  // Calculate training cost: current_knowledge × 200
  const trainingCost = currentKnowledge * 200
  if (player.gold < trainingCost) {
    return { success: false, message: `Not enough gold (need ${trainingCost})` }
  }

  // Pay cost and increase knowledge
  player.gold -= trainingCost
  player.spellKnowledge[spellName] = currentKnowledge + 1

  // Training takes entire day
  endTurn()

  return {
    success: true,
    message: `Trained ${spellName} to level ${currentKnowledge + 1} for ${trainingCost} gold`,
  }
}

/**
 * Calculate training cost for stat/power training
 *
 * Formula: current_stat² × 5
 * Verified from VBA for both STR/DEX and Power training
 *
 * Examples:
 * - Stat 0: 0 × 0 × 5 = 0
 * - Stat 1: 1 × 1 × 5 = 5
 * - Stat 2: 2 × 2 × 5 = 20
 * - Stat 3: 3 × 3 × 5 = 45
 * - Stat 4: 4 × 4 × 5 = 80
 * - Stat 5: 5 × 5 × 5 = 125
 * - Stat 6: 6 × 6 × 5 = 180
 *
 * @param currentStatValue - The current value of the stat to train
 * @returns Gold cost to increase this stat by 1
 */
export function getTrainingCost(currentStatValue: number): number {
  return currentStatValue * currentStatValue * 5
}
