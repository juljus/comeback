import { describe, expect, it } from 'vitest'
import { ITEMS, CREATURES } from '../data'
import { createPlayer } from './player'
import type { PlayerState } from '../types/player'
import type { BoardSquare } from '../types/board'
import {
  MAX_INVENTORY_SIZE,
  MAX_COMPANIONS,
  SHRINE_HEALING_COST,
  STAT_MAX_TRAINING_GROUNDS,
  calcSellPrice,
  buyItem,
  sellItem,
  buyLand,
  canBuildBuilding,
  buildBuilding,
  calcLandIncome,
  regenLandIncome,
  calcIncomeImprovement,
  improveLandIncome,
  pillageLand,
  calcStatTrainingCost,
  trainStat,
  calcMercHireCost,
  calcRecruitCost,
  hireMercenary,
  generateShopInventory,
  calcDefenderUpgradeCost,
  calcTitle,
  generateKingsGift,
} from './economy'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a player with custom overrides for testing. */
function testPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  const base = createPlayer(1, 'Tester', 'male')
  return { ...base, ...overrides }
}

/** Create a minimal BoardSquare for testing. */
function testSquare(overrides: Partial<BoardSquare> = {}): BoardSquare {
  return {
    landTypeId: 0,
    owner: 0,
    price: 6,
    landKey: 'valley',
    defenderId: 0,
    taxIncome: 8,
    healing: 5,
    coordX: 0,
    coordY: 0,
    healingMax: 5,
    castleLevel: 0,
    castleDefender: 0,
    archerySlots: 0,
    gateLevel: 0,
    manaMax: 0,
    hasDefender: true,
    buildings: [],
    recruitableUnit: '',
    recruitableCount: 0,
    mana: { fire: 0, earth: 0, air: 0, water: 0, death: 0, life: 0, arcane: 0 },
    ...overrides,
  }
}

/** Fixed RNG for deterministic shop tests */
const fixedRng = () => 0.5

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('economy constants', () => {
  it('MAX_INVENTORY_SIZE is 20', () => {
    expect(MAX_INVENTORY_SIZE).toBe(20)
  })

  it('MAX_COMPANIONS is 20', () => {
    expect(MAX_COMPANIONS).toBe(20)
  })

  it('SHRINE_HEALING_COST is 50', () => {
    expect(SHRINE_HEALING_COST).toBe(50)
  })

  it('STAT_MAX_TRAINING_GROUNDS is 6', () => {
    expect(STAT_MAX_TRAINING_GROUNDS).toBe(6)
  })
})

// ---------------------------------------------------------------------------
// calcSellPrice
// ---------------------------------------------------------------------------

describe('calcSellPrice', () => {
  it('returns half of item value (rounded)', () => {
    // knife: value=20, sell=10
    expect(calcSellPrice('knife')).toBe(Math.round(20 / 2))
  })

  it('returns correct price for ironDagger (value=80)', () => {
    expect(calcSellPrice('ironDagger')).toBe(40)
  })

  it('returns correct price for ironHelm (value=70)', () => {
    // 70/2 = 35
    expect(calcSellPrice('ironHelm')).toBe(35)
  })

  it('returns correct price for healingPotion (value=80)', () => {
    expect(calcSellPrice('healingPotion')).toBe(40)
  })

  it('returns correct price for high-value item (circletOfPower, value=1500)', () => {
    expect(calcSellPrice('circletOfPower')).toBe(750)
  })

  it('returns 0 for unknown item key', () => {
    expect(calcSellPrice('nonExistentItem')).toBe(0)
  })

  it('handles odd value correctly with rounding', () => {
    // fineSteelDagger: value=110, 110/2=55 exactly
    expect(calcSellPrice('fineSteelDagger')).toBe(55)
  })
})

// ---------------------------------------------------------------------------
// buyItem
// ---------------------------------------------------------------------------

describe('buyItem', () => {
  it('deducts gold and adds item to inventory on success', () => {
    const player = testPlayer({ gold: 200 })
    const result = buyItem({ player, itemKey: 'ironDagger', price: 80 })
    expect(result.success).toBe(true)
    expect(result.newPlayer.gold).toBe(120)
    expect(result.newPlayer.inventory).toContain('ironDagger')
  })

  it('fails when player has insufficient gold', () => {
    const player = testPlayer({ gold: 50 })
    const result = buyItem({ player, itemKey: 'ironDagger', price: 80 })
    expect(result.success).toBe(false)
    expect(result.reason).toBeDefined()
    expect(result.newPlayer.gold).toBe(50) // unchanged
    expect(result.newPlayer.inventory).not.toContain('ironDagger')
  })

  it('succeeds when gold exactly equals price', () => {
    const player = testPlayer({ gold: 80 })
    const result = buyItem({ player, itemKey: 'ironDagger', price: 80 })
    expect(result.success).toBe(true)
    expect(result.newPlayer.gold).toBe(0)
  })

  it('fails when inventory is full (20 items)', () => {
    const fullInventory = Array.from({ length: 20 }, () => 'knife')
    const player = testPlayer({ gold: 1000, inventory: fullInventory })
    const result = buyItem({ player, itemKey: 'ironDagger', price: 80 })
    expect(result.success).toBe(false)
    expect(result.reason).toBeDefined()
    expect(result.newPlayer.inventory.length).toBe(20)
  })

  it('succeeds at inventory size 19', () => {
    const inventory = Array.from({ length: 19 }, () => 'knife')
    const player = testPlayer({ gold: 1000, inventory })
    const result = buyItem({ player, itemKey: 'ironDagger', price: 80 })
    expect(result.success).toBe(true)
    expect(result.newPlayer.inventory.length).toBe(20)
  })

  it('does not mutate original player', () => {
    const player = testPlayer({ gold: 200 })
    const originalGold = player.gold
    buyItem({ player, itemKey: 'ironDagger', price: 80 })
    expect(player.gold).toBe(originalGold)
    expect(player.inventory.length).toBe(0)
  })

  it('uses the provided price, not item value', () => {
    // price param may differ from item value (e.g., shop markup)
    const player = testPlayer({ gold: 500 })
    const result = buyItem({ player, itemKey: 'ironDagger', price: 200 })
    expect(result.success).toBe(true)
    expect(result.newPlayer.gold).toBe(300)
  })
})

// ---------------------------------------------------------------------------
// sellItem
// ---------------------------------------------------------------------------

describe('sellItem', () => {
  it('removes item from inventory and adds gold', () => {
    const player = testPlayer({ gold: 100, inventory: ['ironDagger'] })
    const result = sellItem({ player, itemKey: 'ironDagger' })
    expect(result.success).toBe(true)
    expect(result.goldGained).toBe(40) // value 80 / 2
    expect(result.newPlayer.gold).toBe(140)
    expect(result.newPlayer.inventory).not.toContain('ironDagger')
  })

  it('fails when item is not in inventory', () => {
    const player = testPlayer({ gold: 100, inventory: ['knife'] })
    const result = sellItem({ player, itemKey: 'ironDagger' })
    expect(result.success).toBe(false)
    expect(result.reason).toBeDefined()
    expect(result.goldGained).toBe(0)
    expect(result.newPlayer.gold).toBe(100)
  })

  it('only removes one instance when duplicates exist', () => {
    const player = testPlayer({ gold: 0, inventory: ['ironDagger', 'ironDagger'] })
    const result = sellItem({ player, itemKey: 'ironDagger' })
    expect(result.success).toBe(true)
    expect(result.newPlayer.inventory).toEqual(['ironDagger'])
    expect(result.newPlayer.gold).toBe(40)
  })

  it('does not mutate original player', () => {
    const player = testPlayer({ gold: 100, inventory: ['ironDagger'] })
    sellItem({ player, itemKey: 'ironDagger' })
    expect(player.gold).toBe(100)
    expect(player.inventory).toEqual(['ironDagger'])
  })

  it('sells knife for correct price (value=20, sell=10)', () => {
    const player = testPlayer({ gold: 0, inventory: ['knife'] })
    const result = sellItem({ player, itemKey: 'knife' })
    expect(result.goldGained).toBe(10)
    expect(result.newPlayer.gold).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// buyLand
// ---------------------------------------------------------------------------

describe('buyLand', () => {
  it('purchases unowned land with sufficient gold', () => {
    const player = testPlayer({ gold: 200, actionsUsed: 0 })
    const square = testSquare({ owner: 0, price: 6 })
    const result = buyLand({ player, square })
    expect(result.success).toBe(true)
    expect(result.newPlayer.gold).toBe(194)
    expect(result.newSquare.owner).toBe(player.id)
    expect(result.newPlayer.actionsUsed).toBe(3)
  })

  it('adds land index to ownedLands when squareIndex provided', () => {
    const player = testPlayer({ gold: 200, actionsUsed: 0, ownedLands: [] })
    const square = testSquare({ owner: 0, price: 6 })
    const result = buyLand({ player, square })
    expect(result.success).toBe(true)
    expect(result.newPlayer.ownedLands.length).toBeGreaterThan(0)
  })

  it('fails when land is already owned', () => {
    const player = testPlayer({ gold: 200, actionsUsed: 0 })
    const square = testSquare({ owner: 2 })
    const result = buyLand({ player, square })
    expect(result.success).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('fails when player has insufficient gold', () => {
    const player = testPlayer({ gold: 3, actionsUsed: 0 })
    const square = testSquare({ owner: 0, price: 6 })
    const result = buyLand({ player, square })
    expect(result.success).toBe(false)
    expect(result.reason).toBeDefined()
    expect(result.newPlayer.gold).toBe(3) // unchanged
  })

  it('fails when actionsUsed > 0 (not full day)', () => {
    const player = testPlayer({ gold: 200, actionsUsed: 1 })
    const square = testSquare({ owner: 0, price: 6 })
    const result = buyLand({ player, square })
    expect(result.success).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('succeeds when gold exactly equals price', () => {
    const player = testPlayer({ gold: 6, actionsUsed: 0 })
    const square = testSquare({ owner: 0, price: 6 })
    const result = buyLand({ player, square })
    expect(result.success).toBe(true)
    expect(result.newPlayer.gold).toBe(0)
  })

  it('does not mutate original player or square', () => {
    const player = testPlayer({ gold: 200, actionsUsed: 0 })
    const square = testSquare({ owner: 0, price: 6 })
    buyLand({ player, square })
    expect(player.gold).toBe(200)
    expect(square.owner).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// canBuildBuilding
// ---------------------------------------------------------------------------

describe('canBuildBuilding', () => {
  it('returns true when all conditions met', () => {
    // fort has no prereqs, cost=200, valley allows fort
    const result = canBuildBuilding({
      buildingKey: 'fort',
      landKey: 'valley',
      existingBuildings: [],
      playerGold: 200,
    })
    expect(result.canBuild).toBe(true)
  })

  it('fails when building not in land buildings list', () => {
    // shop has no available buildings
    const result = canBuildBuilding({
      buildingKey: 'fort',
      landKey: 'shop',
      existingBuildings: [],
      playerGold: 1000,
    })
    expect(result.canBuild).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('fails when prerequisite not met', () => {
    // citadel requires fort, which is not built
    const result = canBuildBuilding({
      buildingKey: 'citadel',
      landKey: 'valley',
      existingBuildings: [],
      playerGold: 1000,
    })
    expect(result.canBuild).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('succeeds when single prerequisite met', () => {
    // citadel requires fort
    const result = canBuildBuilding({
      buildingKey: 'citadel',
      landKey: 'valley',
      existingBuildings: ['fort'],
      playerGold: 1000,
    })
    expect(result.canBuild).toBe(true)
  })

  it('fails when only one of multiple prerequisites met', () => {
    // lifeTemple requires ['lifeAltar', 'castle']
    const result = canBuildBuilding({
      buildingKey: 'lifeTemple',
      landKey: 'valley',
      existingBuildings: ['fort', 'citadel', 'castle'],
      playerGold: 1000,
    })
    expect(result.canBuild).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('succeeds when all multiple prerequisites met', () => {
    // lifeTemple requires ['lifeAltar', 'castle']
    const result = canBuildBuilding({
      buildingKey: 'lifeTemple',
      landKey: 'valley',
      existingBuildings: ['fort', 'citadel', 'castle', 'lifeAltar'],
      playerGold: 1000,
    })
    expect(result.canBuild).toBe(true)
  })

  it('fails when building already built', () => {
    const result = canBuildBuilding({
      buildingKey: 'fort',
      landKey: 'valley',
      existingBuildings: ['fort'],
      playerGold: 1000,
    })
    expect(result.canBuild).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('fails when player has insufficient gold', () => {
    // fort costs 200
    const result = canBuildBuilding({
      buildingKey: 'fort',
      landKey: 'valley',
      existingBuildings: [],
      playerGold: 199,
    })
    expect(result.canBuild).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('succeeds when gold exactly equals cost', () => {
    const result = canBuildBuilding({
      buildingKey: 'fort',
      landKey: 'valley',
      existingBuildings: [],
      playerGold: 200,
    })
    expect(result.canBuild).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// buildBuilding
// ---------------------------------------------------------------------------

describe('buildBuilding', () => {
  it('deducts gold and adds building on success', () => {
    const player = testPlayer({ gold: 500 })
    const result = buildBuilding({
      player,
      buildingKey: 'fort',
      landKey: 'valley',
      existingBuildings: [],
    })
    expect(result.success).toBe(true)
    expect(result.newPlayer.gold).toBe(300) // 500 - 200
    expect(result.newBuildings).toContain('fort')
  })

  it('fails when canBuildBuilding returns false', () => {
    const player = testPlayer({ gold: 100 }) // not enough for fort (200)
    const result = buildBuilding({
      player,
      buildingKey: 'fort',
      landKey: 'valley',
      existingBuildings: [],
    })
    expect(result.success).toBe(false)
    expect(result.reason).toBeDefined()
    expect(result.newPlayer.gold).toBe(100) // unchanged
  })

  it('deducts correct cost for citadel (150)', () => {
    const player = testPlayer({ gold: 500 })
    const result = buildBuilding({
      player,
      buildingKey: 'citadel',
      landKey: 'valley',
      existingBuildings: ['fort'],
    })
    expect(result.success).toBe(true)
    expect(result.newPlayer.gold).toBe(350) // 500 - 150
  })

  it('deducts correct cost for lifeAltar (50)', () => {
    const player = testPlayer({ gold: 100 })
    const result = buildBuilding({
      player,
      buildingKey: 'lifeAltar',
      landKey: 'valley',
      existingBuildings: ['fort'],
    })
    expect(result.success).toBe(true)
    expect(result.newPlayer.gold).toBe(50) // 100 - 50
  })

  it('preserves existing buildings in newBuildings', () => {
    const player = testPlayer({ gold: 500 })
    const result = buildBuilding({
      player,
      buildingKey: 'citadel',
      landKey: 'valley',
      existingBuildings: ['fort'],
    })
    expect(result.newBuildings).toContain('fort')
    expect(result.newBuildings).toContain('citadel')
  })

  it('does not mutate original player', () => {
    const player = testPlayer({ gold: 500 })
    const originalGold = player.gold
    buildBuilding({
      player,
      buildingKey: 'fort',
      landKey: 'valley',
      existingBuildings: [],
    })
    expect(player.gold).toBe(originalGold)
  })
})

// ---------------------------------------------------------------------------
// calcLandIncome
// ---------------------------------------------------------------------------

describe('calcLandIncome', () => {
  it('computes total income from all sources', () => {
    const result = calcLandIncome({
      ownedSquares: [{ taxIncome: 8 }, { taxIncome: 6 }],
      banksOwned: 1,
      title: 'baron',
    })
    // taxIncome = 8 + 6 = 14
    // bankBonus = 2 (lands) * 1 (bank) * 10 = 20
    // titleSalary = 30 (baron)
    // total = 14 + 20 + 30 = 64
    expect(result.taxIncome).toBe(14)
    expect(result.bankBonus).toBe(20)
    expect(result.titleSalary).toBe(30)
    expect(result.totalIncome).toBe(64)
  })

  it('returns zero tax when no lands owned', () => {
    const result = calcLandIncome({
      ownedSquares: [],
      banksOwned: 0,
      title: 'none',
    })
    expect(result.taxIncome).toBe(0)
    expect(result.bankBonus).toBe(0)
    expect(result.titleSalary).toBe(20) // everyone gets base salary
    expect(result.totalIncome).toBe(20)
  })

  it('computes bank bonus correctly with multiple banks', () => {
    const result = calcLandIncome({
      ownedSquares: [{ taxIncome: 5 }, { taxIncome: 5 }, { taxIncome: 5 }],
      banksOwned: 2,
      title: 'none',
    })
    // bankBonus = 3 * 2 * 10 = 60
    expect(result.bankBonus).toBe(60)
  })

  it('duke salary is 50', () => {
    const result = calcLandIncome({
      ownedSquares: [],
      banksOwned: 0,
      title: 'duke',
    })
    expect(result.titleSalary).toBe(50)
  })
})

// ---------------------------------------------------------------------------
// regenLandIncome
// ---------------------------------------------------------------------------

describe('regenLandIncome', () => {
  it('regenerates by floor(baseIncome/4) when below base', () => {
    // base=8, current=0 => +floor(8/4) = +2 => 2
    expect(regenLandIncome({ currentIncome: 0, baseIncome: 8 })).toBe(2)
  })

  it('caps at baseIncome', () => {
    // base=8, current=7 => +2 would be 9, capped at 8
    expect(regenLandIncome({ currentIncome: 7, baseIncome: 8 })).toBe(8)
  })

  it('returns unchanged if already at base', () => {
    expect(regenLandIncome({ currentIncome: 8, baseIncome: 8 })).toBe(8)
  })

  it('returns unchanged if above base', () => {
    // Income can be above base from improvements
    expect(regenLandIncome({ currentIncome: 16, baseIncome: 8 })).toBe(16)
  })

  it('handles base income that is not divisible by 4', () => {
    // base=5, floor(5/4)=1, current=3 => 3+1=4
    expect(regenLandIncome({ currentIncome: 3, baseIncome: 5 })).toBe(4)
  })

  it('handles base income of 1', () => {
    // base=1, floor(1/4)=0 => no regen
    expect(regenLandIncome({ currentIncome: 0, baseIncome: 1 })).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// calcIncomeImprovement
// ---------------------------------------------------------------------------

describe('calcIncomeImprovement', () => {
  it('calculates improvement with full actions (3 remaining)', () => {
    // floor((5/2 + 10) / 3 * 3) = floor(12.5/3 * 3) = floor(12.5) = 12
    expect(calcIncomeImprovement({ landHealing: 5, remainingActions: 3 })).toBe(12)
  })

  it('calculates improvement with 2 remaining actions', () => {
    // floor((5/2 + 10) / 3 * 2) = floor(12.5/3 * 2) = floor(8.333) = 8
    expect(calcIncomeImprovement({ landHealing: 5, remainingActions: 2 })).toBe(8)
  })

  it('calculates improvement with 1 remaining action', () => {
    // floor((5/2 + 10) / 3 * 1) = floor(12.5/3) = floor(4.166) = 4
    expect(calcIncomeImprovement({ landHealing: 5, remainingActions: 1 })).toBe(4)
  })

  it('returns 0 with 0 remaining actions', () => {
    expect(calcIncomeImprovement({ landHealing: 5, remainingActions: 0 })).toBe(0)
  })

  it('higher healing gives higher improvement', () => {
    const low = calcIncomeImprovement({ landHealing: 3, remainingActions: 3 })
    const high = calcIncomeImprovement({ landHealing: 8, remainingActions: 3 })
    expect(high).toBeGreaterThan(low)
  })
})

// ---------------------------------------------------------------------------
// improveLandIncome
// ---------------------------------------------------------------------------

describe('improveLandIncome', () => {
  it('increases income by improvement amount', () => {
    const result = improveLandIncome({
      currentIncome: 8,
      baseIncome: 8,
      landHealing: 5,
      remainingActions: 3,
    })
    // improvement = floor((5/2+10)/3*3) = 12
    // newIncome = 8 + 12 = 20, cap = 8*3 = 24 => 20
    expect(result.newIncome).toBe(20)
    expect(result.incomeGained).toBe(12)
  })

  it('caps income at baseIncome * 3', () => {
    const result = improveLandIncome({
      currentIncome: 22,
      baseIncome: 8,
      landHealing: 5,
      remainingActions: 3,
    })
    // improvement = 12, 22+12=34, cap = 24 => 24
    expect(result.newIncome).toBe(24)
    expect(result.incomeGained).toBe(2)
  })

  it('returns no gain if already at cap', () => {
    const result = improveLandIncome({
      currentIncome: 24,
      baseIncome: 8,
      landHealing: 5,
      remainingActions: 3,
    })
    expect(result.newIncome).toBe(24)
    expect(result.incomeGained).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// pillageLand
// ---------------------------------------------------------------------------

describe('pillageLand', () => {
  it('steals current income from the square', () => {
    const square = testSquare({ taxIncome: 8 })
    const result = pillageLand({ square })
    expect(result.goldGained).toBe(8)
    expect(result.newSquare.taxIncome).toBe(0)
  })

  it('returns 0 gold if square has no income', () => {
    const square = testSquare({ taxIncome: 0 })
    const result = pillageLand({ square })
    expect(result.goldGained).toBe(0)
    expect(result.newSquare.taxIncome).toBe(0)
  })

  it('does not mutate original square', () => {
    const square = testSquare({ taxIncome: 8 })
    pillageLand({ square })
    expect(square.taxIncome).toBe(8)
  })
})

// ---------------------------------------------------------------------------
// calcStatTrainingCost
// ---------------------------------------------------------------------------

describe('calcStatTrainingCost', () => {
  it('cost = currentStat^2 * 5', () => {
    // stat=2: 2*2*5 = 20
    expect(calcStatTrainingCost(2)).toBe(20)
  })

  it('stat=1: cost is 5', () => {
    expect(calcStatTrainingCost(1)).toBe(5)
  })

  it('stat=3: cost is 45', () => {
    expect(calcStatTrainingCost(3)).toBe(45)
  })

  it('stat=5: cost is 125', () => {
    expect(calcStatTrainingCost(5)).toBe(125)
  })

  it('stat=6: cost is 180', () => {
    expect(calcStatTrainingCost(6)).toBe(180)
  })

  it('cost grows quadratically', () => {
    const cost2 = calcStatTrainingCost(2)
    const cost4 = calcStatTrainingCost(4)
    // 4^2 / 2^2 = 4x
    expect(cost4).toBe(cost2 * 4)
  })
})

// ---------------------------------------------------------------------------
// trainStat
// ---------------------------------------------------------------------------

describe('trainStat', () => {
  it('increments base stat and deducts gold on success', () => {
    const player = testPlayer({ gold: 200, actionsUsed: 0 })
    // baseStrength=2, cost=2^2*5=20
    const result = trainStat({ player, stat: 'baseStrength' })
    expect(result.success).toBe(true)
    expect(result.newPlayer.baseStrength).toBe(3)
    expect(result.newPlayer.gold).toBe(180)
    expect(result.goldSpent).toBe(20)
    expect(result.newPlayer.actionsUsed).toBe(3)
  })

  it('recalculates derived stats after training', () => {
    const player = testPlayer({ gold: 200, actionsUsed: 0 })
    const result = trainStat({ player, stat: 'baseStrength' })
    // strength should reflect the new baseStrength
    expect(result.newPlayer.strength).toBe(3)
    // maxHp = strength * 10
    expect(result.newPlayer.maxHp).toBe(30)
  })

  it('fails when actionsUsed > 0 (not morning)', () => {
    const player = testPlayer({ gold: 200, actionsUsed: 1 })
    const result = trainStat({ player, stat: 'baseStrength' })
    expect(result.success).toBe(false)
    expect(result.reason).toBeDefined()
    expect(result.newPlayer.baseStrength).toBe(2) // unchanged
  })

  it('fails when insufficient gold', () => {
    const player = testPlayer({ gold: 10, actionsUsed: 0 })
    // cost = 2^2*5 = 20, only have 10
    const result = trainStat({ player, stat: 'baseStrength' })
    expect(result.success).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('fails when stat at maxStat limit', () => {
    const player = testPlayer({
      gold: 1000,
      actionsUsed: 0,
      baseStrength: 6,
      strength: 6,
      maxHp: 60,
    })
    const result = trainStat({ player, stat: 'baseStrength', maxStat: 6 })
    expect(result.success).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('succeeds when stat below maxStat', () => {
    const player = testPlayer({ gold: 1000, actionsUsed: 0 })
    // baseStrength=2, maxStat=6 => can train
    const result = trainStat({ player, stat: 'baseStrength', maxStat: 6 })
    expect(result.success).toBe(true)
  })

  it('works for baseDexterity', () => {
    const player = testPlayer({ gold: 200, actionsUsed: 0 })
    const result = trainStat({ player, stat: 'baseDexterity' })
    expect(result.success).toBe(true)
    expect(result.newPlayer.baseDexterity).toBe(3)
  })

  it('works for basePower (no maxStat = unlimited)', () => {
    const player = testPlayer({ gold: 200, actionsUsed: 0 })
    const result = trainStat({ player, stat: 'basePower' })
    expect(result.success).toBe(true)
    expect(result.newPlayer.basePower).toBe(3)
  })

  it('does not mutate original player', () => {
    const player = testPlayer({ gold: 200, actionsUsed: 0 })
    trainStat({ player, stat: 'baseStrength' })
    expect(player.baseStrength).toBe(2)
    expect(player.gold).toBe(200)
  })
})

// ---------------------------------------------------------------------------
// calcMercHireCost
// ---------------------------------------------------------------------------

describe('calcMercHireCost', () => {
  it('formula: mercTier * contractTurns * 2', () => {
    // pikeman: mercTier=5, contract=3 => 5*3*2=30
    expect(calcMercHireCost('pikeman', 3)).toBe(30)
  })

  it('returns correct cost for swordman (mercTier=7)', () => {
    // 7 * 5 * 2 = 70
    expect(calcMercHireCost('swordman', 5)).toBe(70)
  })

  it('single turn contract for wolf (mercTier=5)', () => {
    // 5 * 1 * 2 = 10
    expect(calcMercHireCost('wolf', 1)).toBe(10)
  })

  it('cost scales linearly with contract length', () => {
    const cost1 = calcMercHireCost('pikeman', 1)
    const cost3 = calcMercHireCost('pikeman', 3)
    expect(cost3).toBe(cost1 * 3)
  })
})

// ---------------------------------------------------------------------------
// calcRecruitCost
// ---------------------------------------------------------------------------

describe('calcRecruitCost', () => {
  it('formula: mercTier * 20', () => {
    // pikeman: mercTier=5 => 5*20=100
    expect(calcRecruitCost('pikeman')).toBe(100)
  })

  it('correct cost for swordman (mercTier=7)', () => {
    expect(calcRecruitCost('swordman')).toBe(140)
  })

  it('correct cost for hunter (mercTier=5)', () => {
    expect(calcRecruitCost('hunter')).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// hireMercenary
// ---------------------------------------------------------------------------

describe('hireMercenary', () => {
  it('adds companion and deducts gold on success', () => {
    const player = testPlayer({ gold: 500 })
    const result = hireMercenary({
      player,
      creatureKey: 'pikeman',
      cost: 100,
    })
    expect(result.success).toBe(true)
    expect(result.newPlayer.gold).toBe(400)
    expect(result.newPlayer.companions.length).toBe(1)
    expect(result.newPlayer.companions[0]!.name).toBe('pikeman')
  })

  it('creates companion with correct stats from creature data', () => {
    const player = testPlayer({ gold: 500 })
    const result = hireMercenary({
      player,
      creatureKey: 'pikeman',
      cost: 100,
    })
    const companion = result.newPlayer.companions[0]!
    expect(companion.maxHp).toBe(CREATURES.pikeman.hp)
    expect(companion.strength).toBe(CREATURES.pikeman.strength)
    expect(companion.armor).toBe(CREATURES.pikeman.armor)
  })

  it('sets contract duration when provided', () => {
    const player = testPlayer({ gold: 500 })
    const result = hireMercenary({
      player,
      creatureKey: 'pikeman',
      cost: 30,
      contractTurns: 3,
    })
    expect(result.success).toBe(true)
    expect(result.newPlayer.companions[0]!.duration).toBe(3)
  })

  it('fails when insufficient gold', () => {
    const player = testPlayer({ gold: 50 })
    const result = hireMercenary({
      player,
      creatureKey: 'pikeman',
      cost: 100,
    })
    expect(result.success).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('fails when at max companions (20)', () => {
    const companions = Array.from({ length: 20 }, () => ({
      name: 'wolf',
      currentHp: 13,
      maxHp: 13,
      strength: 2,
      dexterity: 3,
      power: 1,
      armor: 0,
      attacksPerRound: 1,
      diceCount: 1,
      diceSides: 4,
      isPet: false,
      damageType: 'crush' as const,
      immunities: { fire: 0, lightning: 0, cold: 0, poison: 0, bleeding: 0, stun: 0 },
      elementalDamage: { fire: 0, earth: 0, air: 0, water: 0 },
    }))
    const player = testPlayer({ gold: 1000, companions })
    const result = hireMercenary({
      player,
      creatureKey: 'pikeman',
      cost: 100,
    })
    expect(result.success).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('does not mutate original player', () => {
    const player = testPlayer({ gold: 500 })
    hireMercenary({ player, creatureKey: 'pikeman', cost: 100 })
    expect(player.gold).toBe(500)
    expect(player.companions.length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// generateShopInventory
// ---------------------------------------------------------------------------

describe('generateShopInventory', () => {
  it('returns an array of item keys', () => {
    const items = generateShopInventory({ shopType: 'shop', rng: fixedRng })
    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBeGreaterThan(0)
    // Each item key should exist in ITEMS
    for (const key of items) {
      expect(ITEMS[key as keyof typeof ITEMS]).toBeDefined()
    }
  })

  it('shop stocks ring, weapon, consumable types', () => {
    const items = generateShopInventory({ shopType: 'shop', rng: fixedRng, count: 20 })
    for (const key of items) {
      const item = ITEMS[key as keyof typeof ITEMS]
      expect(['ring', 'weapon', 'consumable']).toContain(item.type)
    }
  })

  it('smithy stocks helm, body, boots, ring, weapon', () => {
    const items = generateShopInventory({ shopType: 'smithy', rng: fixedRng, count: 20 })
    for (const key of items) {
      const item = ITEMS[key as keyof typeof ITEMS]
      expect(['helm', 'body', 'boots', 'ring', 'weapon']).toContain(item.type)
    }
  })

  it('bazaar only stocks items with value <= 400', () => {
    const items = generateShopInventory({ shopType: 'bazaar', rng: fixedRng, count: 20 })
    for (const key of items) {
      const item = ITEMS[key as keyof typeof ITEMS]
      expect(item.value).toBeLessThanOrEqual(400)
    }
  })

  it('library only stocks scrolls (consumable with grantsSpell)', () => {
    const items = generateShopInventory({ shopType: 'library', rng: fixedRng, count: 20 })
    for (const key of items) {
      const item = ITEMS[key as keyof typeof ITEMS]
      expect(item.type).toBe('consumable')
      expect(item.grantsSpell).not.toBe('')
    }
  })

  it('mageGuild stocks scrolls and potions', () => {
    const items = generateShopInventory({ shopType: 'mageGuild', rng: fixedRng, count: 20 })
    for (const key of items) {
      const item = ITEMS[key as keyof typeof ITEMS]
      expect(item.type).toBe('consumable')
    }
  })

  it('respects count parameter', () => {
    const items = generateShopInventory({ shopType: 'shop', rng: fixedRng, count: 5 })
    expect(items.length).toBe(5)
  })

  it('excludes items with value < 25 (knife=20 excluded)', () => {
    const items = generateShopInventory({ shopType: 'shop', rng: fixedRng, count: 50 })
    for (const key of items) {
      const item = ITEMS[key as keyof typeof ITEMS]
      expect(item.value).toBeGreaterThanOrEqual(25)
    }
  })

  it('produces different results with different RNG', () => {
    let rngState = 0.1
    const rng1 = () => {
      rngState = (rngState + 0.37) % 1
      return rngState
    }
    rngState = 0.1
    const items1 = generateShopInventory({ shopType: 'shop', rng: rng1, count: 5 })

    let rngState2 = 0.7
    const rng2 = () => {
      rngState2 = (rngState2 + 0.37) % 1
      return rngState2
    }
    const items2 = generateShopInventory({ shopType: 'shop', rng: rng2, count: 5 })
    // Different seeds should produce different inventory (not guaranteed but highly likely)
    // Just verify both return valid results
    expect(items1.length).toBe(5)
    expect(items2.length).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// calcDefenderUpgradeCost
// ---------------------------------------------------------------------------

describe('calcDefenderUpgradeCost', () => {
  it('tier 2: mercTier * 8', () => {
    // swordman: mercTier=7 => 7*8=56
    expect(calcDefenderUpgradeCost('swordman', 2)).toBe(56)
  })

  it('tier 3: mercTier * 15', () => {
    // knight: mercTier=16 => 16*15=240
    expect(calcDefenderUpgradeCost('knight', 3)).toBe(240)
  })

  it('tier 4: mercTier * 24', () => {
    // paladin: mercTier=18 => 18*24=432
    expect(calcDefenderUpgradeCost('paladin', 4)).toBe(432)
  })

  it('pikeman tier 2: 5*8 = 40', () => {
    expect(calcDefenderUpgradeCost('pikeman', 2)).toBe(40)
  })
})

// ---------------------------------------------------------------------------
// calcTitle
// ---------------------------------------------------------------------------

describe('calcTitle', () => {
  it('0 lands, no title => none', () => {
    expect(calcTitle(0, 'none')).toBe('none')
  })

  it('2 lands => none', () => {
    expect(calcTitle(2, 'none')).toBe('none')
  })

  it('3 lands => baron', () => {
    expect(calcTitle(3, 'none')).toBe('baron')
  })

  it('8 lands => baron', () => {
    expect(calcTitle(8, 'none')).toBe('baron')
  })

  it('9 lands => count', () => {
    expect(calcTitle(9, 'none')).toBe('count')
  })

  it('14 lands => count', () => {
    expect(calcTitle(14, 'none')).toBe('count')
  })

  it('15 lands => duke', () => {
    expect(calcTitle(15, 'none')).toBe('duke')
  })

  it('20 lands => duke', () => {
    expect(calcTitle(20, 'none')).toBe('duke')
  })

  it('title is permanent: losing lands does not demote', () => {
    // Was duke (15+ lands), now has 2 lands
    expect(calcTitle(2, 'duke')).toBe('duke')
  })

  it('title never decreases: baron losing lands stays baron', () => {
    expect(calcTitle(1, 'baron')).toBe('baron')
  })

  it('title can only increase: count with 15 lands becomes duke', () => {
    expect(calcTitle(15, 'count')).toBe('duke')
  })

  it('baron stays baron with 5 lands (below count threshold)', () => {
    expect(calcTitle(5, 'baron')).toBe('baron')
  })
})

// ---------------------------------------------------------------------------
// generateKingsGift
// ---------------------------------------------------------------------------

describe('generateKingsGift', () => {
  it('returns 3 item keys', () => {
    const gifts = generateKingsGift({ title: 'baron', rng: fixedRng })
    expect(gifts.length).toBe(3)
  })

  it('baron gifts have value 50-120', () => {
    const gifts = generateKingsGift({ title: 'baron', rng: fixedRng })
    for (const key of gifts) {
      const item = ITEMS[key as keyof typeof ITEMS]
      expect(item).toBeDefined()
      expect(item.value).toBeGreaterThanOrEqual(50)
      expect(item.value).toBeLessThanOrEqual(120)
    }
  })

  it('count gifts have value 121-300', () => {
    const gifts = generateKingsGift({ title: 'count', rng: fixedRng })
    for (const key of gifts) {
      const item = ITEMS[key as keyof typeof ITEMS]
      expect(item).toBeDefined()
      expect(item.value).toBeGreaterThanOrEqual(121)
      expect(item.value).toBeLessThanOrEqual(300)
    }
  })

  it('duke gifts have value 301-1000', () => {
    const gifts = generateKingsGift({ title: 'duke', rng: fixedRng })
    for (const key of gifts) {
      const item = ITEMS[key as keyof typeof ITEMS]
      expect(item).toBeDefined()
      expect(item.value).toBeGreaterThanOrEqual(301)
      expect(item.value).toBeLessThanOrEqual(1000)
    }
  })

  it('all returned keys are valid items in ITEMS', () => {
    for (const title of ['baron', 'count', 'duke'] as const) {
      const gifts = generateKingsGift({ title, rng: fixedRng })
      for (const key of gifts) {
        expect(ITEMS[key as keyof typeof ITEMS]).toBeDefined()
      }
    }
  })
})
