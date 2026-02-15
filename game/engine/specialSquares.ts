import type { PlayerState } from '../types/player'
import type { BoardSquare } from '../types/board'
import type { TitleRank } from '../types/enums'
import { CREATURES } from '../data'
import { calcShrineHealing, calcCompanionHealing } from './formulas'
import { calcRecruitCost, calcMercHireCost, SHRINE_HEALING_COST } from './economy'
import { randomInt } from './dice'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ShopType = 'shop' | 'smithy' | 'bazaar' | 'library' | 'mageGuild'

export type ShrineHealResult = {
  playerHealAmount: number
  companionHealing: Array<{ name: string; healAmount: number }>
  newPlayer: PlayerState
}

export type TeleportDestination = {
  squareIndex: number
  landKey: string
}

export type MercenaryCampOffer = {
  creatureKey: string
  contractTurns: number
  cost: number
}

// ---------------------------------------------------------------------------
// applyShrineHealing
// ---------------------------------------------------------------------------

/** Apply shrine healing ritual: heals player and companions, costs 50 gold, requires morning. */
export function applyShrineHealing(params: { player: PlayerState }): {
  result: ShrineHealResult
  newPlayer: PlayerState
  success: boolean
  reason?: string
} {
  const { player } = params

  if (player.actionsUsed !== 0) {
    return {
      result: { playerHealAmount: 0, companionHealing: [], newPlayer: player },
      newPlayer: player,
      success: false,
      reason: 'Must be morning (no actions used)',
    }
  }

  if (player.gold < SHRINE_HEALING_COST) {
    return {
      result: { playerHealAmount: 0, companionHealing: [], newPlayer: player },
      newPlayer: player,
      success: false,
      reason: 'Not enough gold',
    }
  }

  // Player healing
  const playerHealAmount = calcShrineHealing(player.strength, player.hp)
  const newHp = Math.min(player.hp + playerHealAmount, player.maxHp)

  // Companion healing
  const companionHealing: Array<{ name: string; healAmount: number }> = []
  const newCompanions = player.companions.map((comp) => {
    const healAmount = calcCompanionHealing(comp.strength)
    companionHealing.push({ name: comp.name, healAmount })
    return {
      ...comp,
      currentHp: Math.min(comp.currentHp + healAmount, comp.maxHp),
      immunities: { ...comp.immunities },
      elementalDamage: { ...comp.elementalDamage },
    }
  })

  const newPlayer: PlayerState = {
    ...player,
    gold: player.gold - SHRINE_HEALING_COST,
    hp: newHp,
    actionsUsed: 3,
    companions: newCompanions,
    equipment: { ...player.equipment },
    mana: { ...player.mana },
    manaRegen: { ...player.manaRegen },
    elementalDamage: { ...player.elementalDamage },
    inventory: [...player.inventory],
    ownedLands: [...player.ownedLands],
    spellbook: { ...player.spellbook },
  }

  const result: ShrineHealResult = {
    playerHealAmount,
    companionHealing,
    newPlayer,
  }

  return { result, newPlayer, success: true }
}

// ---------------------------------------------------------------------------
// canTeleport
// ---------------------------------------------------------------------------

/** Check if player can teleport from this square. */
export function canTeleport(params: { player: PlayerState; square: BoardSquare }): boolean {
  const { player, square } = params
  return (
    player.actionsUsed === 0 &&
    square.owner === player.id &&
    square.landKey === 'arcaneTower' &&
    player.ownedLands.length > 0
  )
}

// ---------------------------------------------------------------------------
// getAvailableTeleportDestinations
// ---------------------------------------------------------------------------

/** Get list of squares the player can teleport to (all owned except current position). */
export function getAvailableTeleportDestinations(params: {
  player: PlayerState
  board: ReadonlyArray<BoardSquare>
  currentPosition: number
}): TeleportDestination[] {
  const { player, board, currentPosition } = params
  const destinations: TeleportDestination[] = []

  for (let i = 0; i < board.length; i++) {
    if (i === currentPosition) continue
    if (board[i]!.owner === player.id) {
      destinations.push({
        squareIndex: i,
        landKey: board[i]!.landKey,
      })
    }
  }

  return destinations
}

// ---------------------------------------------------------------------------
// getTrainingOptions
// ---------------------------------------------------------------------------

/** Get available stat training options for a land type. */
export function getTrainingOptions(landKey: string): Array<{
  stat: 'baseStrength' | 'baseDexterity' | 'basePower'
  maxStat?: number
}> {
  switch (landKey) {
    case 'trainingGrounds':
      return [
        { stat: 'baseStrength', maxStat: 6 },
        { stat: 'baseDexterity', maxStat: 6 },
      ]
    case 'mageGuild':
      return [{ stat: 'basePower' }]
    default:
      return []
  }
}

// ---------------------------------------------------------------------------
// landKeyToShopType
// ---------------------------------------------------------------------------

/** Map a land key to its shop type, or null if not a shop. */
export function landKeyToShopType(landKey: string): ShopType | null {
  switch (landKey) {
    case 'shop':
      return 'shop'
    case 'smithy':
      return 'smithy'
    case 'bazaar':
      return 'bazaar'
    case 'library':
      return 'library'
    case 'mageGuild':
      return 'mageGuild'
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// getRecruitableUnit
// ---------------------------------------------------------------------------

/** Check if a square has a recruitable unit and return its info. */
export function getRecruitableUnit(params: {
  square: BoardSquare
}): { creatureKey: string; cost: number } | null {
  const { square } = params

  if (!square.recruitableUnit) return null

  const cost = calcRecruitCost(square.recruitableUnit)
  return { creatureKey: square.recruitableUnit, cost }
}

// ---------------------------------------------------------------------------
// generateMercenaryCampOffers
// ---------------------------------------------------------------------------

const CONTRACT_DURATIONS = [5, 10, 15, 20] as const

const TITLE_MERC_THRESHOLDS: Record<
  TitleRank,
  { minCount: number; maxCount: number; maxTier: number }
> = {
  none: { minCount: 0, maxCount: 2, maxTier: 10 },
  baron: { minCount: 1, maxCount: 3, maxTier: 15 },
  count: { minCount: 2, maxCount: 4, maxTier: 20 },
  duke: { minCount: 3, maxCount: 5, maxTier: 45 },
}

/** Generate mercenary camp hire offers based on title rank. */
export function generateMercenaryCampOffers(params: {
  titleRank: TitleRank
  rng: () => number
}): MercenaryCampOffer[] {
  const { titleRank, rng } = params
  const config = TITLE_MERC_THRESHOLDS[titleRank]

  // Determine count of offers
  const count = randomInt(config.minCount, config.maxCount, rng)

  // Build eligible mercenary pool
  const eligibleKeys: string[] = []
  for (const [key, creature] of Object.entries(CREATURES)) {
    if (creature.mercTier > 0 && creature.mercTier <= config.maxTier) {
      eligibleKeys.push(key)
    }
  }

  if (eligibleKeys.length === 0) return []

  const offers: MercenaryCampOffer[] = []
  for (let i = 0; i < count; i++) {
    // Pick random creature
    const creatureKey = eligibleKeys[Math.floor(rng() * eligibleKeys.length)]!

    // Pick random contract duration
    const contractTurns = CONTRACT_DURATIONS[Math.floor(rng() * CONTRACT_DURATIONS.length)]!

    // Calculate cost
    const cost = calcMercHireCost(creatureKey, contractTurns)

    offers.push({ creatureKey, contractTurns, cost })
  }

  return offers
}
