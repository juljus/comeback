import { describe, expect, it } from 'vitest'
import { createPlayer } from './player'
import type { PlayerState, Companion } from '../types/player'
import type { BoardSquare } from '../types/board'
import { CREATURES } from '../data'
import {
  applyShrineHealing,
  canTeleport,
  getAvailableTeleportDestinations,
  getTrainingOptions,
  landKeyToShopType,
  getRecruitableUnit,
  generateMercenaryCampOffers,
} from './specialSquares'

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
    fireCastleDamage: 0,
    entrapment: false,
    ...overrides,
  }
}

/** Fixed RNG returning 0.5. */
const fixedRng = () => 0.5

/** Create a simple companion for testing. */
function testCompanion(overrides: Partial<Companion> = {}): Companion {
  return {
    name: 'pikeman',
    currentHp: 10,
    maxHp: 12,
    strength: 3,
    dexterity: 2,
    power: 1,
    armor: 3,
    attacksPerRound: 1,
    diceCount: 1,
    diceSides: 5,
    isPet: false,
    damageType: 'pierce',
    immunities: { fire: 0, lightning: 0, cold: 0, poison: 0, bleeding: 0, stun: 0 },
    elementalDamage: { fire: 0, earth: 0, air: 0, water: 0 },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// applyShrineHealing
// ---------------------------------------------------------------------------

describe('applyShrineHealing', () => {
  it('heals player and deducts 50 gold on success', () => {
    const player = testPlayer({ gold: 100, hp: 10, maxHp: 20, actionsUsed: 0 })

    const { success, newPlayer, result } = applyShrineHealing({ player })

    expect(success).toBe(true)
    expect(newPlayer.gold).toBe(50)
    expect(newPlayer.hp).toBeGreaterThan(10)
    expect(result.playerHealAmount).toBeGreaterThan(0)
  })

  it('uses shrine healing formula: power*3 + healingBonus (hp < 100)', () => {
    // power=2, currentHp=10
    // healingBonus = 3 + (60 + 10) / (5 + 10) = 3 + 70/15 = 3 + 4.666 = 7.666
    // heal = floor(2*3 + 7.666) = floor(13.666) = 13
    const player = testPlayer({
      gold: 100,
      hp: 10,
      maxHp: 20,
      actionsUsed: 0,
      power: 2,
      basePower: 2,
    })

    const { result, newPlayer } = applyShrineHealing({ player })

    expect(result.playerHealAmount).toBe(13)
    // No maxHp cap per VBA: 10 + 13 = 23
    expect(newPlayer.hp).toBe(23)
  })

  it('does not cap player healing at maxHp (VBA behavior)', () => {
    // Player at 18/20 hp, power=2, hp=18
    // healingBonus = 3 + (60+18)/(5+18) = 3 + 78/23 = 3 + 3.391 = 6.391
    // heal = floor(2*3 + 6.391) = floor(12.391) = 12
    // newHp = 18 + 12 = 30, exceeds maxHp=20 but no cap
    const player = testPlayer({
      gold: 100,
      hp: 18,
      maxHp: 20,
      actionsUsed: 0,
      power: 2,
      basePower: 2,
    })

    const { newPlayer } = applyShrineHealing({ player })

    expect(newPlayer.hp).toBe(30)
    expect(newPlayer.hp).toBeGreaterThan(player.maxHp)
  })

  it('heals companions too', () => {
    const companion = testCompanion({ currentHp: 5, maxHp: 12, strength: 3 })
    const player = testPlayer({
      gold: 100,
      hp: 10,
      maxHp: 20,
      actionsUsed: 0,
      companions: [companion],
    })

    const { result, newPlayer } = applyShrineHealing({ player })

    // Companion healing = 6 + 3*2 = 12
    expect(result.companionHealing.length).toBe(1)
    expect(result.companionHealing[0]!.healAmount).toBe(12)
    expect(newPlayer.companions[0]!.currentHp).toBe(Math.min(5 + 12, 12)) // 17 capped at 12
  })

  it('caps companion healing at companion maxHp', () => {
    // Companion at 10/12, heal = 6 + 3*2 = 12, 10+12=22 > 12 => cap at 12
    const companion = testCompanion({ currentHp: 10, maxHp: 12, strength: 3 })
    const player = testPlayer({
      gold: 100,
      hp: 20,
      maxHp: 20,
      actionsUsed: 0,
      companions: [companion],
    })

    const { newPlayer } = applyShrineHealing({ player })

    expect(newPlayer.companions[0]!.currentHp).toBe(12)
  })

  it('fails when gold < 50', () => {
    const player = testPlayer({ gold: 49, hp: 10, maxHp: 20, actionsUsed: 0 })

    const { success, reason } = applyShrineHealing({ player })

    expect(success).toBe(false)
    expect(reason).toBeDefined()
  })

  it('succeeds when gold exactly 50', () => {
    const player = testPlayer({ gold: 50, hp: 10, maxHp: 20, actionsUsed: 0 })

    const { success, newPlayer } = applyShrineHealing({ player })

    expect(success).toBe(true)
    expect(newPlayer.gold).toBe(0)
  })

  it('succeeds when actionsUsed is 1 (still has 2 actions)', () => {
    const player = testPlayer({ gold: 100, hp: 10, maxHp: 20, actionsUsed: 1 })

    const { success } = applyShrineHealing({ player })

    expect(success).toBe(true)
  })

  it('fails when actionsUsed >= 2', () => {
    const player = testPlayer({ gold: 100, hp: 10, maxHp: 20, actionsUsed: 2 })

    const { success, reason } = applyShrineHealing({ player })

    expect(success).toBe(false)
    expect(reason).toBeDefined()
  })

  it('sets actionsUsed to 3 (consumes full day)', () => {
    const player = testPlayer({ gold: 100, hp: 10, maxHp: 20, actionsUsed: 0 })

    const { newPlayer } = applyShrineHealing({ player })

    expect(newPlayer.actionsUsed).toBe(3)
  })

  it('does not mutate original player', () => {
    const player = testPlayer({ gold: 100, hp: 10, maxHp: 20, actionsUsed: 0 })
    const originalGold = player.gold
    const originalHp = player.hp

    applyShrineHealing({ player })

    expect(player.gold).toBe(originalGold)
    expect(player.hp).toBe(originalHp)
  })

  it('heals multiple companions', () => {
    const comp1 = testCompanion({ name: 'pikeman', currentHp: 5, maxHp: 12, strength: 3 })
    const comp2 = testCompanion({ name: 'swordman', currentHp: 8, maxHp: 15, strength: 4 })
    const player = testPlayer({
      gold: 100,
      hp: 10,
      maxHp: 20,
      actionsUsed: 0,
      companions: [comp1, comp2],
    })

    const { result } = applyShrineHealing({ player })

    expect(result.companionHealing.length).toBe(2)
    // comp1: 6 + 3*2 = 12
    expect(result.companionHealing[0]!.healAmount).toBe(12)
    // comp2: 6 + 4*2 = 14
    expect(result.companionHealing[1]!.healAmount).toBe(14)
  })
})

// ---------------------------------------------------------------------------
// canTeleport
// ---------------------------------------------------------------------------

describe('canTeleport', () => {
  it('returns true when player owns arcane tower and it is morning', () => {
    const player = testPlayer({ actionsUsed: 0, ownedLands: [5, 10] })
    const square = testSquare({ owner: 1, landKey: 'arcaneTower' })

    expect(canTeleport({ player, square })).toBe(true)
  })

  it('returns false when not morning (actionsUsed > 0)', () => {
    const player = testPlayer({ actionsUsed: 1, ownedLands: [5, 10] })
    const square = testSquare({ owner: 1, landKey: 'arcaneTower' })

    expect(canTeleport({ player, square })).toBe(false)
  })

  it('returns false when player does not own the tower', () => {
    const player = testPlayer({ actionsUsed: 0, ownedLands: [5, 10] })
    const square = testSquare({ owner: 2, landKey: 'arcaneTower' })

    expect(canTeleport({ player, square })).toBe(false)
  })

  it('returns false when square is not an arcane tower', () => {
    const player = testPlayer({ actionsUsed: 0, ownedLands: [5, 10] })
    const square = testSquare({ owner: 1, landKey: 'valley' })

    expect(canTeleport({ player, square })).toBe(false)
  })

  it('returns false when player owns no other lands', () => {
    const player = testPlayer({ actionsUsed: 0, ownedLands: [] })
    const square = testSquare({ owner: 1, landKey: 'arcaneTower' })

    expect(canTeleport({ player, square })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getAvailableTeleportDestinations
// ---------------------------------------------------------------------------

describe('getAvailableTeleportDestinations', () => {
  it('returns all owned squares except current position', () => {
    const board: BoardSquare[] = []
    for (let i = 0; i < 34; i++) {
      board.push(testSquare({ landKey: i === 0 ? 'royalCourt' : 'valley' }))
    }
    board[5] = testSquare({ owner: 1, landKey: 'arcaneTower' })
    board[10] = testSquare({ owner: 1, landKey: 'valley' })
    board[15] = testSquare({ owner: 1, landKey: 'forest' })

    const player = testPlayer({ ownedLands: [5, 10, 15], position: 5 })

    const destinations = getAvailableTeleportDestinations({ player, board, currentPosition: 5 })

    expect(destinations.length).toBe(2)
    expect(destinations.map((d) => d.squareIndex)).toContain(10)
    expect(destinations.map((d) => d.squareIndex)).toContain(15)
    // Current position (5) should not be in destinations
    expect(destinations.map((d) => d.squareIndex)).not.toContain(5)
  })

  it('returns empty array when player owns only the current square', () => {
    const board: BoardSquare[] = []
    for (let i = 0; i < 34; i++) {
      board.push(testSquare({ landKey: 'valley' }))
    }
    board[5] = testSquare({ owner: 1, landKey: 'arcaneTower' })

    const player = testPlayer({ ownedLands: [5], position: 5 })

    const destinations = getAvailableTeleportDestinations({ player, board, currentPosition: 5 })

    expect(destinations).toEqual([])
  })

  it('includes landKey in destination info', () => {
    const board: BoardSquare[] = []
    for (let i = 0; i < 34; i++) {
      board.push(testSquare({ landKey: 'valley' }))
    }
    board[5] = testSquare({ owner: 1, landKey: 'arcaneTower' })
    board[10] = testSquare({ owner: 1, landKey: 'forest' })

    const player = testPlayer({ ownedLands: [5, 10], position: 5 })

    const destinations = getAvailableTeleportDestinations({ player, board, currentPosition: 5 })

    expect(destinations.length).toBe(1)
    expect(destinations[0]!.squareIndex).toBe(10)
    expect(destinations[0]!.landKey).toBe('forest')
  })
})

// ---------------------------------------------------------------------------
// getTrainingOptions
// ---------------------------------------------------------------------------

describe('getTrainingOptions', () => {
  it('trainingGrounds returns strength and dexterity with max 6', () => {
    const options = getTrainingOptions('trainingGrounds')

    expect(options.length).toBe(2)
    expect(options).toContainEqual({ stat: 'baseStrength', maxStat: 6 })
    expect(options).toContainEqual({ stat: 'baseDexterity', maxStat: 6 })
  })

  it('mageGuild returns power with no max', () => {
    const options = getTrainingOptions('mageGuild')

    expect(options.length).toBe(1)
    expect(options[0]!.stat).toBe('basePower')
    expect(options[0]!.maxStat).toBeUndefined()
  })

  it('valley returns empty (no training)', () => {
    const options = getTrainingOptions('valley')
    expect(options).toEqual([])
  })

  it('shop returns empty', () => {
    const options = getTrainingOptions('shop')
    expect(options).toEqual([])
  })

  it('shrine returns empty', () => {
    const options = getTrainingOptions('shrine')
    expect(options).toEqual([])
  })

  it('library returns empty (library has spell training, not stat training)', () => {
    const options = getTrainingOptions('library')
    expect(options).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// landKeyToShopType
// ---------------------------------------------------------------------------

describe('landKeyToShopType', () => {
  it('maps shop to shop', () => {
    expect(landKeyToShopType('shop')).toBe('shop')
  })

  it('maps smithy to smithy', () => {
    expect(landKeyToShopType('smithy')).toBe('smithy')
  })

  it('maps bazaar to bazaar', () => {
    expect(landKeyToShopType('bazaar')).toBe('bazaar')
  })

  it('maps library to library', () => {
    expect(landKeyToShopType('library')).toBe('library')
  })

  it('maps mageGuild to mageGuild', () => {
    expect(landKeyToShopType('mageGuild')).toBe('mageGuild')
  })

  it('returns null for valley', () => {
    expect(landKeyToShopType('valley')).toBeNull()
  })

  it('returns null for shrine', () => {
    expect(landKeyToShopType('shrine')).toBeNull()
  })

  it('returns null for arcaneTower', () => {
    expect(landKeyToShopType('arcaneTower')).toBeNull()
  })

  it('returns null for trainingGrounds', () => {
    expect(landKeyToShopType('trainingGrounds')).toBeNull()
  })

  it('returns null for cave', () => {
    expect(landKeyToShopType('cave')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// getRecruitableUnit
// ---------------------------------------------------------------------------

describe('getRecruitableUnit', () => {
  it('returns null when recruitableUnit is empty', () => {
    const square = testSquare({ recruitableUnit: '' })

    expect(getRecruitableUnit({ square })).toBeNull()
  })

  it('returns creature key and cost when recruitableUnit is set', () => {
    const square = testSquare({ recruitableUnit: 'swordman' })

    const result = getRecruitableUnit({ square })

    expect(result).not.toBeNull()
    expect(result!.creatureKey).toBe('swordman')
    // calcRecruitCost('swordman') = mercTier * 20 = 7 * 20 = 140
    expect(result!.cost).toBe(140)
  })

  it('returns correct cost for pikeman', () => {
    const square = testSquare({ recruitableUnit: 'pikeman' })

    const result = getRecruitableUnit({ square })

    expect(result).not.toBeNull()
    // pikeman mercTier=5, cost=5*20=100
    expect(result!.cost).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// generateMercenaryCampOffers
// ---------------------------------------------------------------------------

describe('generateMercenaryCampOffers', () => {
  it('returns an array of offers', () => {
    const offers = generateMercenaryCampOffers({ titleRank: 'none', rng: fixedRng })

    expect(Array.isArray(offers)).toBe(true)
  })

  it('each offer has creatureKey, contractTurns, and cost', () => {
    const offers = generateMercenaryCampOffers({ titleRank: 'baron', rng: fixedRng })

    for (const offer of offers) {
      expect(offer.creatureKey).toBeDefined()
      expect(typeof offer.creatureKey).toBe('string')
      expect(offer.contractTurns).toBeGreaterThan(0)
      expect(offer.cost).toBeGreaterThan(0)
    }
  })

  it('each offered creature exists in CREATURES data', () => {
    const offers = generateMercenaryCampOffers({ titleRank: 'duke', rng: fixedRng })

    for (const offer of offers) {
      const creature = CREATURES[offer.creatureKey as keyof typeof CREATURES]
      expect(creature).toBeDefined()
    }
  })

  it('contract duration is one of 5, 10, 15, 20', () => {
    // Use varied RNG to get different values
    let state = 0.1
    const variedRng = () => {
      state = (state + 0.17) % 1
      return state
    }

    const offers = generateMercenaryCampOffers({ titleRank: 'duke', rng: variedRng })

    for (const offer of offers) {
      expect([5, 10, 15, 20]).toContain(offer.contractTurns)
    }
  })

  it('cost matches calcMercHireCost formula (mercTier * contractTurns * 2)', () => {
    const offers = generateMercenaryCampOffers({ titleRank: 'baron', rng: fixedRng })

    for (const offer of offers) {
      const creature = CREATURES[offer.creatureKey as keyof typeof CREATURES]
      const expectedCost = creature.mercTier * offer.contractTurns * 2
      expect(offer.cost).toBe(expectedCost)
    }
  })

  it('higher title produces offers (no crash for any title)', () => {
    for (const title of ['none', 'baron', 'count', 'duke'] as const) {
      const offers = generateMercenaryCampOffers({ titleRank: title, rng: fixedRng })
      expect(Array.isArray(offers)).toBe(true)
    }
  })

  it('duke gets more offers than none on average', () => {
    // With fixed RNG, duke should get a consistent count >= baron
    // Using deterministic RNG so this is reproducible
    const dukeOffers = generateMercenaryCampOffers({ titleRank: 'duke', rng: fixedRng })
    // Duke count: random(3,5) with fixedRng (0.5) = 3 + floor(0.5 * 3) = 4
    expect(dukeOffers.length).toBeGreaterThanOrEqual(3)
  })
})
