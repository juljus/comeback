import type { PlayerState } from '../types/player'
import type { BoardSquare } from '../types/board'
import type { TitleRank } from '../types/enums'
import { ITEMS, BUILDINGS, CREATURES, LANDS } from '../data'
import { calcTaxIncome, calcBankBonus, calcTitleSalary } from './formulas'
import { createCompanionFromCreature, recalcDerivedStats } from './player'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_INVENTORY_SIZE = 20
export const MAX_COMPANIONS = 20
export const SHRINE_HEALING_COST = 50
export const STAT_MAX_TRAINING_GROUNDS = 6

// ---------------------------------------------------------------------------
// calcSellPrice
// ---------------------------------------------------------------------------

/** Calculate the sell price of an item (half of value, rounded). */
export function calcSellPrice(itemKey: string): number {
  const item = ITEMS[itemKey as keyof typeof ITEMS]
  if (!item) return 0
  return Math.round(item.value / 2)
}

// ---------------------------------------------------------------------------
// buyItem
// ---------------------------------------------------------------------------

/** Buy an item, adding it to inventory and deducting gold. */
export function buyItem(params: { player: PlayerState; itemKey: string; price: number }): {
  newPlayer: PlayerState
  success: boolean
  reason?: string
} {
  const { player, itemKey, price } = params

  if (player.gold < price) {
    return { newPlayer: player, success: false, reason: 'Not enough gold' }
  }

  if (player.inventory.length >= MAX_INVENTORY_SIZE) {
    return { newPlayer: player, success: false, reason: 'Inventory full' }
  }

  const newPlayer: PlayerState = {
    ...player,
    gold: player.gold - price,
    inventory: [...player.inventory, itemKey],
  }

  return { newPlayer, success: true }
}

// ---------------------------------------------------------------------------
// sellItem
// ---------------------------------------------------------------------------

/** Sell an item from inventory. */
export function sellItem(params: { player: PlayerState; itemKey: string }): {
  newPlayer: PlayerState
  goldGained: number
  success: boolean
  reason?: string
} {
  const { player, itemKey } = params

  const idx = player.inventory.indexOf(itemKey)
  if (idx === -1) {
    return { newPlayer: player, goldGained: 0, success: false, reason: 'Item not in inventory' }
  }

  const goldGained = calcSellPrice(itemKey)
  const newInventory = [...player.inventory]
  newInventory.splice(idx, 1)

  const newPlayer: PlayerState = {
    ...player,
    gold: player.gold + goldGained,
    inventory: newInventory,
  }

  return { newPlayer, goldGained, success: true }
}

// ---------------------------------------------------------------------------
// buyLand
// ---------------------------------------------------------------------------

/** Purchase an unowned land. Requires full day and enough gold. */
export function buyLand(params: { player: PlayerState; square: BoardSquare }): {
  newPlayer: PlayerState
  newSquare: BoardSquare
  success: boolean
  reason?: string
} {
  const { player, square } = params

  if (player.actionsUsed !== 0) {
    return {
      newPlayer: player,
      newSquare: square,
      success: false,
      reason: 'Must be morning (no actions used)',
    }
  }

  if (square.owner !== 0) {
    return { newPlayer: player, newSquare: square, success: false, reason: 'Land is already owned' }
  }

  if (player.gold < square.price) {
    return { newPlayer: player, newSquare: square, success: false, reason: 'Not enough gold' }
  }

  const newPlayer: PlayerState = {
    ...player,
    gold: player.gold - square.price,
    ownedLands: [...player.ownedLands, square.landTypeId],
    actionsUsed: 3,
  }

  const newSquare: BoardSquare = {
    ...square,
    owner: player.id,
  }

  return { newPlayer, newSquare, success: true }
}

// ---------------------------------------------------------------------------
// canBuildBuilding
// ---------------------------------------------------------------------------

/** Check whether a building can be built on a given land. */
export function canBuildBuilding(params: {
  buildingKey: string
  landKey: string
  existingBuildings: string[]
  playerGold: number
}): {
  canBuild: boolean
  reason?: string
} {
  const { buildingKey, landKey, existingBuildings, playerGold } = params

  const building = BUILDINGS[buildingKey as keyof typeof BUILDINGS]
  if (!building) {
    return { canBuild: false, reason: 'Unknown building' }
  }

  const land = LANDS[landKey as keyof typeof LANDS]
  if (!land) {
    return { canBuild: false, reason: 'Unknown land' }
  }

  if (!(land.buildings as readonly string[]).includes(buildingKey)) {
    return { canBuild: false, reason: 'Building not available on this land type' }
  }

  if (existingBuildings.includes(buildingKey)) {
    return { canBuild: false, reason: 'Building already built' }
  }

  for (const prereq of building.prereqs) {
    if (!existingBuildings.includes(prereq)) {
      return { canBuild: false, reason: `Missing prerequisite: ${prereq}` }
    }
  }

  if (playerGold < building.cost) {
    return { canBuild: false, reason: 'Not enough gold' }
  }

  return { canBuild: true }
}

// ---------------------------------------------------------------------------
// buildBuilding
// ---------------------------------------------------------------------------

/** Construct a building on owned land. */
export function buildBuilding(params: {
  player: PlayerState
  buildingKey: string
  landKey: string
  existingBuildings: string[]
}): {
  newPlayer: PlayerState
  newBuildings: string[]
  success: boolean
  reason?: string
} {
  const { player, buildingKey, landKey, existingBuildings } = params

  const validation = canBuildBuilding({
    buildingKey,
    landKey,
    existingBuildings,
    playerGold: player.gold,
  })

  if (!validation.canBuild) {
    return {
      newPlayer: player,
      newBuildings: existingBuildings,
      success: false,
      reason: validation.reason,
    }
  }

  const building = BUILDINGS[buildingKey as keyof typeof BUILDINGS]!

  const newPlayer: PlayerState = {
    ...player,
    gold: player.gold - building.cost,
  }

  const newBuildings = [...existingBuildings, buildingKey]

  return {
    newPlayer: recalcDerivedStats(newPlayer),
    newBuildings,
    success: true,
  }
}

// ---------------------------------------------------------------------------
// calcLandIncome
// ---------------------------------------------------------------------------

/** Calculate total income from all sources when passing Royal Court. */
export function calcLandIncome(params: {
  ownedSquares: ReadonlyArray<{ taxIncome: number }>
  banksOwned: number
  title: TitleRank
}): {
  taxIncome: number
  bankBonus: number
  titleSalary: number
  totalIncome: number
} {
  const { ownedSquares, banksOwned, title } = params

  const taxIncome = calcTaxIncome(ownedSquares)
  const bankBonus = calcBankBonus(ownedSquares.length, banksOwned)
  const titleSalary = calcTitleSalary(title)
  const totalIncome = taxIncome + bankBonus + titleSalary

  return { taxIncome, bankBonus, titleSalary, totalIncome }
}

// ---------------------------------------------------------------------------
// regenLandIncome
// ---------------------------------------------------------------------------

/** Regenerate depleted land income when passing Royal Court. */
export function regenLandIncome(params: { currentIncome: number; baseIncome: number }): number {
  const { currentIncome, baseIncome } = params

  if (currentIncome >= baseIncome) {
    return currentIncome
  }

  const regen = Math.floor(baseIncome / 4)
  return Math.min(currentIncome + regen, baseIncome)
}

// ---------------------------------------------------------------------------
// calcIncomeImprovement
// ---------------------------------------------------------------------------

/** Calculate income improvement bonus from land healing value. */
export function calcIncomeImprovement(params: {
  landHealing: number
  remainingActions: number
}): number {
  const { landHealing, remainingActions } = params
  return Math.floor(((landHealing / 2 + 10) / 3) * remainingActions)
}

// ---------------------------------------------------------------------------
// improveLandIncome
// ---------------------------------------------------------------------------

/** Apply income improvement to a land. */
export function improveLandIncome(params: {
  currentIncome: number
  baseIncome: number
  landHealing: number
  remainingActions: number
}): {
  newIncome: number
  incomeGained: number
} {
  const { currentIncome, baseIncome, landHealing, remainingActions } = params

  const improvement = calcIncomeImprovement({ landHealing, remainingActions })
  const cap = baseIncome * 3
  const newIncome = Math.min(currentIncome + improvement, cap)
  const incomeGained = newIncome - currentIncome

  return { newIncome, incomeGained }
}

// ---------------------------------------------------------------------------
// pillageLand
// ---------------------------------------------------------------------------

/** Pillage an enemy land to steal its current income. */
export function pillageLand(params: { square: BoardSquare }): {
  newSquare: BoardSquare
  goldGained: number
} {
  const { square } = params

  return {
    newSquare: { ...square, taxIncome: 0 },
    goldGained: square.taxIncome,
  }
}

// ---------------------------------------------------------------------------
// calcStatTrainingCost
// ---------------------------------------------------------------------------

/** Calculate gold cost to train a stat. Formula: stat^2 * 5 */
export function calcStatTrainingCost(currentStat: number): number {
  return currentStat * currentStat * 5
}

// ---------------------------------------------------------------------------
// trainStat
// ---------------------------------------------------------------------------

/** Train a stat at a training location. */
export function trainStat(params: {
  player: PlayerState
  stat: 'baseStrength' | 'baseDexterity' | 'basePower'
  maxStat?: number
}): {
  newPlayer: PlayerState
  goldSpent: number
  success: boolean
  reason?: string
} {
  const { player, stat, maxStat } = params

  if (player.actionsUsed !== 0) {
    return {
      newPlayer: player,
      goldSpent: 0,
      success: false,
      reason: 'Must be morning (no actions used)',
    }
  }

  const currentValue = player[stat]

  if (maxStat !== undefined && currentValue >= maxStat) {
    return { newPlayer: player, goldSpent: 0, success: false, reason: 'Stat already at maximum' }
  }

  const cost = calcStatTrainingCost(currentValue)

  if (player.gold < cost) {
    return { newPlayer: player, goldSpent: 0, success: false, reason: 'Not enough gold' }
  }

  const newPlayer: PlayerState = {
    ...player,
    gold: player.gold - cost,
    [stat]: currentValue + 1,
    actionsUsed: 3,
  }

  return {
    newPlayer: recalcDerivedStats(newPlayer),
    goldSpent: cost,
    success: true,
  }
}

// ---------------------------------------------------------------------------
// calcMercHireCost
// ---------------------------------------------------------------------------

/** Calculate cost to hire a mercenary. Formula: mercTier * contractTurns * 2 */
export function calcMercHireCost(creatureKey: string, contractTurns: number): number {
  const creature = CREATURES[creatureKey as keyof typeof CREATURES]
  if (!creature) return 0
  return creature.mercTier * contractTurns * 2
}

// ---------------------------------------------------------------------------
// calcRecruitCost
// ---------------------------------------------------------------------------

/** Calculate cost to recruit from a building. Formula: mercTier * 20 */
export function calcRecruitCost(creatureKey: string): number {
  const creature = CREATURES[creatureKey as keyof typeof CREATURES]
  if (!creature) return 0
  return creature.mercTier * 20
}

// ---------------------------------------------------------------------------
// hireMercenary
// ---------------------------------------------------------------------------

/** Hire a mercenary, creating a companion and deducting gold. */
export function hireMercenary(params: {
  player: PlayerState
  creatureKey: string
  cost: number
  contractTurns?: number
}): {
  newPlayer: PlayerState
  success: boolean
  reason?: string
} {
  const { player, creatureKey, cost, contractTurns } = params

  if (player.gold < cost) {
    return { newPlayer: player, success: false, reason: 'Not enough gold' }
  }

  if (player.companions.length >= MAX_COMPANIONS) {
    return { newPlayer: player, success: false, reason: 'Too many companions' }
  }

  const companion = createCompanionFromCreature(creatureKey)
  if (contractTurns !== undefined) {
    companion.duration = contractTurns
  }

  const newPlayer: PlayerState = {
    ...player,
    gold: player.gold - cost,
    companions: [...player.companions, companion],
  }

  return { newPlayer, success: true }
}

// ---------------------------------------------------------------------------
// generateShopInventory
// ---------------------------------------------------------------------------

type ShopType = 'shop' | 'smithy' | 'bazaar' | 'library' | 'mageGuild'

const SHOP_TYPE_FILTERS: Record<
  ShopType,
  (item: (typeof ITEMS)[keyof typeof ITEMS], key: string) => boolean
> = {
  shop: (item) => ['ring', 'weapon', 'consumable'].includes(item.type) && item.value >= 25,
  smithy: (item) =>
    ['helm', 'body', 'boots', 'ring', 'weapon'].includes(item.type) && item.value >= 25,
  bazaar: (item) => item.value >= 25 && item.value <= 400,
  library: (item) => item.type === 'consumable' && item.grantsSpell !== '' && item.value >= 25,
  mageGuild: (item) => item.type === 'consumable' && item.value >= 25,
}

/** Generate items available for purchase at a shop location. */
export function generateShopInventory(params: {
  shopType: ShopType
  rng: () => number
  count?: number
}): string[] {
  const { shopType, rng, count = 8 } = params

  const filter = SHOP_TYPE_FILTERS[shopType]
  const eligibleKeys: string[] = []

  for (const [key, item] of Object.entries(ITEMS)) {
    if (filter(item, key)) {
      eligibleKeys.push(key)
    }
  }

  if (eligibleKeys.length === 0) return []

  const result: string[] = []
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * eligibleKeys.length)
    result.push(eligibleKeys[idx]!)
  }

  return result
}

// ---------------------------------------------------------------------------
// calcDefenderUpgradeCost
// ---------------------------------------------------------------------------

/** Calculate cost to upgrade a land defender. */
export function calcDefenderUpgradeCost(targetCreatureKey: string, tier: 2 | 3 | 4): number {
  const creature = CREATURES[targetCreatureKey as keyof typeof CREATURES]
  if (!creature) return 0

  const multipliers: Record<number, number> = { 2: 8, 3: 15, 4: 24 }
  return creature.mercTier * multipliers[tier]!
}

// ---------------------------------------------------------------------------
// calcTitle
// ---------------------------------------------------------------------------

const TITLE_RANKS: TitleRank[] = ['none', 'baron', 'count', 'duke']

function titleIndex(title: TitleRank): number {
  return TITLE_RANKS.indexOf(title)
}

/** Determine title rank from land count. Title never decreases. */
export function calcTitle(landCount: number, currentTitle: TitleRank): TitleRank {
  let newTitle: TitleRank = 'none'

  if (landCount >= 15) {
    newTitle = 'duke'
  } else if (landCount >= 9) {
    newTitle = 'count'
  } else if (landCount >= 3) {
    newTitle = 'baron'
  }

  // Title can only increase, never decrease
  return titleIndex(newTitle) > titleIndex(currentTitle) ? newTitle : currentTitle
}

// ---------------------------------------------------------------------------
// generateKingsGift
// ---------------------------------------------------------------------------

const GIFT_VALUE_RANGES: Record<string, [number, number]> = {
  baron: [50, 120],
  count: [121, 300],
  duke: [301, 1000],
}

/** Generate 3 item choices for a king's gift when earning a new title. */
export function generateKingsGift(params: { title: TitleRank; rng: () => number }): string[] {
  const { title, rng } = params

  const range = GIFT_VALUE_RANGES[title]
  if (!range) return []

  const [minValue, maxValue] = range

  const eligibleKeys: string[] = []
  for (const [key, item] of Object.entries(ITEMS)) {
    if (item.value >= minValue && item.value <= maxValue) {
      eligibleKeys.push(key)
    }
  }

  if (eligibleKeys.length === 0) return []

  const result: string[] = []
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(rng() * eligibleKeys.length)
    result.push(eligibleKeys[idx]!)
  }

  return result
}
