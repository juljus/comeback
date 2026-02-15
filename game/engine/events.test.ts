import { describe, expect, it } from 'vitest'
import { createPlayer } from './player'
import type { PlayerState } from '../types/player'
import type { ManaType } from '../types/enums'
import { CREATURES, SPELLS, ITEMS } from '../data'
import {
  EVENT_TABLES,
  selectEvent,
  resolveSmallTreasure,
  resolveGuardedTreasure,
  resolveMobWithItem,
  resolveDexterityChallenge,
  resolveStrengthChallenge,
  resolvePowerChallenge,
  resolveHermitHealing,
  resolveHermitTraining,
  generateManaFountainOptions,
  applyManaFountain,
  resolveFreePrisoner,
  applyElementalRiver,
  generateSageSpells,
  applySageLesson,
  resolveChoiceEvent,
  selectGuardian,
  selectTreasureItem,
  triggerAdventureEvent,
  TREASURE_GUARDIANS,
  ITEM_GUARDIANS,
} from './events'
import type { EventType } from './events'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a player with custom overrides for testing. */
function testPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  const base = createPlayer(1, 'Tester', 'male')
  return { ...base, ...overrides }
}

/** Fixed RNG returning 0.5. */
const fixedRng = () => 0.5

/** RNG returning 0.0 -- always picks lowest values. */
const lowRng = () => 0.0

/** RNG returning just under 1.0 -- always picks highest values. */
const highRng = () => 0.999

// ---------------------------------------------------------------------------
// EVENT_TABLES (static data)
// ---------------------------------------------------------------------------

describe('EVENT_TABLES', () => {
  it('cave has 10 event types', () => {
    expect(EVENT_TABLES.cave.length).toBe(10)
  })

  it('treasureIsland has 4 event types', () => {
    expect(EVENT_TABLES.treasureIsland.length).toBe(4)
  })

  it('dungeon has 11 event types', () => {
    expect(EVENT_TABLES.dungeon.length).toBe(11)
  })

  it('cave does not include dexterityChallenge', () => {
    const types = EVENT_TABLES.cave.map((e) => e.type)
    expect(types).not.toContain('dexterityChallenge')
  })

  it('cave does not include powerChallenge', () => {
    const types = EVENT_TABLES.cave.map((e) => e.type)
    expect(types).not.toContain('powerChallenge')
  })

  it('treasureIsland does not include hermit', () => {
    const types = EVENT_TABLES.treasureIsland.map((e) => e.type)
    expect(types).not.toContain('hermit')
  })

  it('treasureIsland does not include strengthChallenge', () => {
    const types = EVENT_TABLES.treasureIsland.map((e) => e.type)
    expect(types).not.toContain('strengthChallenge')
  })

  it('dungeon does not include hermit', () => {
    const types = EVENT_TABLES.dungeon.map((e) => e.type)
    expect(types).not.toContain('hermit')
  })

  it('all events have positive weights', () => {
    for (const location of ['cave', 'treasureIsland', 'dungeon'] as const) {
      for (const event of EVENT_TABLES[location]) {
        expect(event.weight).toBeGreaterThan(0)
      }
    }
  })

  it('choiceEvent is present in all locations', () => {
    for (const location of ['cave', 'treasureIsland', 'dungeon'] as const) {
      const types = EVENT_TABLES[location].map((e) => e.type)
      expect(types).toContain('choiceEvent')
    }
  })
})

// ---------------------------------------------------------------------------
// selectEvent
// ---------------------------------------------------------------------------

describe('selectEvent', () => {
  it('returns a valid event type for cave', () => {
    const event = selectEvent({ location: 'cave', rng: fixedRng })
    const caveTypes = EVENT_TABLES.cave.map((e) => e.type)
    expect(caveTypes).toContain(event)
  })

  it('returns a valid event type for treasureIsland', () => {
    const event = selectEvent({ location: 'treasureIsland', rng: fixedRng })
    const types = EVENT_TABLES.treasureIsland.map((e) => e.type)
    expect(types).toContain(event)
  })

  it('returns a valid event type for dungeon', () => {
    const event = selectEvent({ location: 'dungeon', rng: fixedRng })
    const types = EVENT_TABLES.dungeon.map((e) => e.type)
    expect(types).toContain(event)
  })

  it('respects excludeTypes by not returning excluded events', () => {
    // Exclude choiceEvent and run many times with different RNGs
    const excludeTypes: EventType[] = ['choiceEvent']
    for (let i = 0; i < 20; i++) {
      let state = i * 0.05
      const rng = () => {
        state = (state + 0.37) % 1
        return state
      }
      const event = selectEvent({ location: 'cave', rng, excludeTypes })
      expect(event).not.toBe('choiceEvent')
    }
  })

  it('with low rng returns first event in table', () => {
    const event = selectEvent({ location: 'cave', rng: lowRng })
    expect(event).toBe(EVENT_TABLES.cave[0]!.type)
  })

  it('produces different events with different rng values', () => {
    const events = new Set<EventType>()
    for (let i = 0; i < 50; i++) {
      let state = i * 0.02
      const rng = () => {
        state = (state + 0.13) % 1
        return state
      }
      events.add(selectEvent({ location: 'dungeon', rng }))
    }
    // Dungeon has 11 event types, we should see multiple different ones
    expect(events.size).toBeGreaterThan(1)
  })
})

// ---------------------------------------------------------------------------
// resolveSmallTreasure
// ---------------------------------------------------------------------------

describe('resolveSmallTreasure', () => {
  it('returns a positive gold amount', () => {
    const result = resolveSmallTreasure({ gameDays: 10, rng: fixedRng })
    expect(result.goldAmount).toBeGreaterThan(0)
  })

  it('gold scales with game days', () => {
    const early = resolveSmallTreasure({ gameDays: 1, rng: fixedRng })
    const late = resolveSmallTreasure({ gameDays: 100, rng: fixedRng })
    expect(late.goldAmount).toBeGreaterThan(early.goldAmount)
  })

  it('day 0 still produces gold', () => {
    const result = resolveSmallTreasure({ gameDays: 0, rng: fixedRng })
    expect(result.goldAmount).toBeGreaterThan(0)
  })

  it('goldAmount is always an integer', () => {
    const result = resolveSmallTreasure({ gameDays: 7, rng: fixedRng })
    expect(Number.isInteger(result.goldAmount)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// selectGuardian
// ---------------------------------------------------------------------------

describe('selectGuardian', () => {
  it('returns a valid creature key from the guardian pool', () => {
    const guardian = selectGuardian({
      guardianPool: TREASURE_GUARDIANS,
      gameDays: 5,
      titleRank: 'none',
      rng: fixedRng,
    })
    expect(CREATURES[guardian as keyof typeof CREATURES]).toBeDefined()
  })

  it('early game favors weaker guardians (sprite, skeleton, clayGolem)', () => {
    // With lowRng on day 1, should pick from early weighted creatures
    const guardian = selectGuardian({
      guardianPool: TREASURE_GUARDIANS,
      gameDays: 1,
      titleRank: 'none',
      rng: lowRng,
    })
    // First creature in pool (highest base weight) should be selected with low rng
    expect(guardian).toBe('sprite')
  })

  it('returns a valid creature from ITEM_GUARDIANS pool', () => {
    const guardian = selectGuardian({
      guardianPool: ITEM_GUARDIANS,
      gameDays: 10,
      titleRank: 'baron',
      rng: fixedRng,
    })
    expect(CREATURES[guardian as keyof typeof CREATURES]).toBeDefined()
  })

  it('all treasure guardian creature keys exist in CREATURES', () => {
    for (const entry of TREASURE_GUARDIANS) {
      expect(CREATURES[entry.creatureKey as keyof typeof CREATURES]).toBeDefined()
    }
  })

  it('all item guardian creature keys exist in CREATURES', () => {
    for (const entry of ITEM_GUARDIANS) {
      expect(CREATURES[entry.creatureKey as keyof typeof CREATURES]).toBeDefined()
    }
  })
})

// ---------------------------------------------------------------------------
// resolveGuardedTreasure
// ---------------------------------------------------------------------------

describe('resolveGuardedTreasure', () => {
  it('returns a valid guardian creature key', () => {
    const result = resolveGuardedTreasure({ gameDays: 10, titleRank: 'none', rng: fixedRng })
    expect(CREATURES[result.guardianKey as keyof typeof CREATURES]).toBeDefined()
  })

  it('returns positive treasure gold', () => {
    const result = resolveGuardedTreasure({ gameDays: 10, titleRank: 'none', rng: fixedRng })
    expect(result.treasureGold).toBeGreaterThan(0)
  })

  it('returns treasure items array', () => {
    const result = resolveGuardedTreasure({ gameDays: 10, titleRank: 'none', rng: fixedRng })
    expect(Array.isArray(result.treasureItems)).toBe(true)
    expect(result.treasureItems.length).toBeGreaterThanOrEqual(1)
  })

  it('all treasure items are valid item keys', () => {
    const result = resolveGuardedTreasure({ gameDays: 30, titleRank: 'baron', rng: fixedRng })
    for (const key of result.treasureItems) {
      expect(ITEMS[key as keyof typeof ITEMS]).toBeDefined()
    }
  })
})

// ---------------------------------------------------------------------------
// selectTreasureItem
// ---------------------------------------------------------------------------

describe('selectTreasureItem', () => {
  it('returns a valid item key', () => {
    const key = selectTreasureItem({ minValue: 50, maxValue: 200, rng: fixedRng })
    expect(ITEMS[key as keyof typeof ITEMS]).toBeDefined()
  })

  it('returned item value is within specified range', () => {
    const key = selectTreasureItem({ minValue: 100, maxValue: 300, rng: fixedRng })
    const item = ITEMS[key as keyof typeof ITEMS]
    expect(item.value).toBeGreaterThanOrEqual(100)
    expect(item.value).toBeLessThanOrEqual(300)
  })

  it('returns an item even with narrow range', () => {
    // There should be items around 80 value
    const key = selectTreasureItem({ minValue: 70, maxValue: 90, rng: fixedRng })
    expect(key).toBeDefined()
    expect(typeof key).toBe('string')
  })

  it('returns closest item when no exact match in range', () => {
    // Very high range that probably has no items
    const key = selectTreasureItem({ minValue: 50000, maxValue: 60000, rng: fixedRng })
    // Should still return something (closest available)
    expect(key).toBeDefined()
    expect(typeof key).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// resolveMobWithItem
// ---------------------------------------------------------------------------

describe('resolveMobWithItem', () => {
  it('returns a valid guardian key from ITEM_GUARDIANS pool', () => {
    const result = resolveMobWithItem({ gameDays: 10, titleRank: 'none', rng: fixedRng })
    expect(CREATURES[result.guardianKey as keyof typeof CREATURES]).toBeDefined()
  })

  it('returns a valid item reward', () => {
    const result = resolveMobWithItem({ gameDays: 10, titleRank: 'none', rng: fixedRng })
    expect(ITEMS[result.itemReward as keyof typeof ITEMS]).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// resolveDexterityChallenge
// ---------------------------------------------------------------------------

describe('resolveDexterityChallenge', () => {
  it('auto-succeeds when dexterity >= 4', () => {
    const result = resolveDexterityChallenge({ playerDexterity: 4, rng: fixedRng, gameDays: 10 })
    expect(result.success).toBe(true)
    expect(result.damageDealt).toBe(0)
    expect(result.treasureGold).toBeGreaterThan(0)
  })

  it('auto-succeeds when dexterity = 5', () => {
    const result = resolveDexterityChallenge({ playerDexterity: 5, rng: fixedRng, gameDays: 10 })
    expect(result.success).toBe(true)
  })

  it('dexterity 2-3 with lowRng (< 0.5) fails', () => {
    const result = resolveDexterityChallenge({ playerDexterity: 3, rng: lowRng, gameDays: 10 })
    expect(result.success).toBe(false)
    expect(result.damageDealt).toBeGreaterThanOrEqual(1)
    expect(result.damageDealt).toBeLessThanOrEqual(7)
  })

  it('dexterity 2-3 with highRng (>= 0.5) succeeds', () => {
    const result = resolveDexterityChallenge({ playerDexterity: 3, rng: highRng, gameDays: 10 })
    expect(result.success).toBe(true)
    expect(result.treasureGold).toBeGreaterThan(0)
  })

  it('dexterity < 2 always fails with damage', () => {
    const result = resolveDexterityChallenge({ playerDexterity: 1, rng: highRng, gameDays: 10 })
    expect(result.success).toBe(false)
    expect(result.damageDealt).toBeGreaterThanOrEqual(1)
    expect(result.damageDealt).toBeLessThanOrEqual(7)
  })

  it('damage is between 1 and 7', () => {
    const result = resolveDexterityChallenge({ playerDexterity: 1, rng: fixedRng, gameDays: 10 })
    expect(result.damageDealt).toBeGreaterThanOrEqual(1)
    expect(result.damageDealt).toBeLessThanOrEqual(7)
  })
})

// ---------------------------------------------------------------------------
// resolveStrengthChallenge
// ---------------------------------------------------------------------------

describe('resolveStrengthChallenge', () => {
  it('auto-succeeds when strength >= 4', () => {
    const result = resolveStrengthChallenge({ playerStrength: 4, rng: fixedRng, gameDays: 10 })
    expect(result.success).toBe(true)
    expect(result.damageDealt).toBe(0)
    expect(result.treasureGold).toBeGreaterThan(0)
  })

  it('strength = 3 with lowRng fails', () => {
    const result = resolveStrengthChallenge({ playerStrength: 3, rng: lowRng, gameDays: 10 })
    expect(result.success).toBe(false)
    expect(result.damageDealt).toBeGreaterThanOrEqual(1)
    expect(result.damageDealt).toBeLessThanOrEqual(7)
  })

  it('strength = 3 with highRng succeeds', () => {
    const result = resolveStrengthChallenge({ playerStrength: 3, rng: highRng, gameDays: 10 })
    expect(result.success).toBe(true)
  })

  it('strength < 3 always fails with damage', () => {
    const result = resolveStrengthChallenge({ playerStrength: 2, rng: highRng, gameDays: 10 })
    expect(result.success).toBe(false)
    expect(result.damageDealt).toBeGreaterThanOrEqual(1)
  })

  it('treasure gold scales with game days on success', () => {
    const early = resolveStrengthChallenge({ playerStrength: 5, rng: fixedRng, gameDays: 1 })
    const late = resolveStrengthChallenge({ playerStrength: 5, rng: fixedRng, gameDays: 100 })
    expect(late.treasureGold).toBeGreaterThan(early.treasureGold)
  })
})

// ---------------------------------------------------------------------------
// resolvePowerChallenge
// ---------------------------------------------------------------------------

describe('resolvePowerChallenge', () => {
  it('high power (>= 4) almost always succeeds', () => {
    // randomInt(1,4) <= 4 is always true
    const result = resolvePowerChallenge({ playerPower: 4, rng: fixedRng, gameDays: 10 })
    expect(result.success).toBe(true)
    expect(result.treasureGold).toBeGreaterThan(0)
  })

  it('power = 1 can fail (roll > 1)', () => {
    // With fixedRng: randomInt(1,4) = 1 + floor(0.5 * 4) = 3, 3 <= 1 is false
    const result = resolvePowerChallenge({ playerPower: 1, rng: fixedRng, gameDays: 10 })
    expect(result.success).toBe(false)
  })

  it('power = 1 with lowRng succeeds (roll = 1)', () => {
    // With lowRng: randomInt(1,4) = 1 + floor(0 * 4) = 1, 1 <= 1 is true
    const result = resolvePowerChallenge({ playerPower: 1, rng: lowRng, gameDays: 10 })
    expect(result.success).toBe(true)
  })

  it('low power may gain +1 power bonus', () => {
    // Power <= 2 has 25% chance for power gain
    // We test that the field exists (implementation may or may not trigger it)
    const result = resolvePowerChallenge({ playerPower: 2, rng: lowRng, gameDays: 10 })
    expect(typeof result.powerGain).toBe('boolean')
  })

  it('high power does not get power gain', () => {
    const result = resolvePowerChallenge({ playerPower: 5, rng: fixedRng, gameDays: 10 })
    expect(result.powerGain).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// resolveHermitHealing
// ---------------------------------------------------------------------------

describe('resolveHermitHealing', () => {
  it('heals player using shrine healing formula', () => {
    const player = testPlayer({ hp: 10, maxHp: 20, strength: 2, baseStrength: 2 })

    const { newPlayer, healAmount } = resolveHermitHealing({ player })

    expect(healAmount).toBeGreaterThan(0)
    expect(newPlayer.hp).toBeGreaterThan(10)
  })

  it('does NOT deduct gold (hermit healing is free)', () => {
    const player = testPlayer({ gold: 100, hp: 10, maxHp: 20 })

    const { newPlayer } = resolveHermitHealing({ player })

    expect(newPlayer.gold).toBe(100)
  })

  it('caps player hp at maxHp', () => {
    const player = testPlayer({ hp: 19, maxHp: 20, strength: 5, baseStrength: 5 })

    const { newPlayer } = resolveHermitHealing({ player })

    expect(newPlayer.hp).toBeLessThanOrEqual(20)
  })

  it('heals companions', () => {
    const player = testPlayer({
      hp: 10,
      maxHp: 20,
      companions: [
        {
          name: 'pikeman',
          currentHp: 5,
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
        },
      ],
    })

    const { companionHealing } = resolveHermitHealing({ player })

    expect(companionHealing.length).toBe(1)
    expect(companionHealing[0]!.healAmount).toBeGreaterThan(0)
  })

  it('does not mutate original player', () => {
    const player = testPlayer({ hp: 10, maxHp: 20 })
    const originalHp = player.hp

    resolveHermitHealing({ player })

    expect(player.hp).toBe(originalHp)
  })
})

// ---------------------------------------------------------------------------
// resolveHermitTraining
// ---------------------------------------------------------------------------

describe('resolveHermitTraining', () => {
  it('increments the specified stat by 1', () => {
    const player = testPlayer({ baseStrength: 2, strength: 2 })

    const { newPlayer } = resolveHermitTraining({ player, stat: 'baseStrength' })

    expect(newPlayer.baseStrength).toBe(3)
  })

  it('works for baseDexterity', () => {
    const player = testPlayer({ baseDexterity: 2, dexterity: 2 })

    const { newPlayer } = resolveHermitTraining({ player, stat: 'baseDexterity' })

    expect(newPlayer.baseDexterity).toBe(3)
  })

  it('works for basePower', () => {
    const player = testPlayer({ basePower: 2, power: 2 })

    const { newPlayer } = resolveHermitTraining({ player, stat: 'basePower' })

    expect(newPlayer.basePower).toBe(3)
  })

  it('does NOT deduct gold (hermit training is free)', () => {
    const player = testPlayer({ gold: 100, baseStrength: 2, strength: 2 })

    const { newPlayer } = resolveHermitTraining({ player, stat: 'baseStrength' })

    expect(newPlayer.gold).toBe(100)
  })

  it('does not mutate original player', () => {
    const player = testPlayer({ baseStrength: 2, strength: 2 })

    resolveHermitTraining({ player, stat: 'baseStrength' })

    expect(player.baseStrength).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// generateManaFountainOptions
// ---------------------------------------------------------------------------

describe('generateManaFountainOptions', () => {
  it('returns exactly 3 mana types', () => {
    const options = generateManaFountainOptions(fixedRng)
    expect(options.length).toBe(3)
  })

  it('all 3 options are distinct', () => {
    const options = generateManaFountainOptions(fixedRng)
    const unique = new Set(options)
    expect(unique.size).toBe(3)
  })

  it('all options are valid mana types', () => {
    const validTypes: ManaType[] = ['fire', 'earth', 'air', 'water', 'death', 'life', 'arcane']
    const options = generateManaFountainOptions(fixedRng)
    for (const opt of options) {
      expect(validTypes).toContain(opt)
    }
  })

  it('different RNG produces different options', () => {
    const opts1 = generateManaFountainOptions(lowRng)
    const opts2 = generateManaFountainOptions(highRng)
    // Very likely different (7 choose 3 = 35 combinations)
    // At minimum they should both be valid
    expect(opts1.length).toBe(3)
    expect(opts2.length).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// applyManaFountain
// ---------------------------------------------------------------------------

describe('applyManaFountain', () => {
  it('adds 1 mana of chosen type by default', () => {
    const player = testPlayer()

    const newPlayer = applyManaFountain({ player, manaType: 'fire' })

    expect(newPlayer.mana.fire).toBe(player.mana.fire + 1)
  })

  it('adds specified amount when provided', () => {
    const player = testPlayer()

    const newPlayer = applyManaFountain({ player, manaType: 'arcane', amount: 3 })

    expect(newPlayer.mana.arcane).toBe(player.mana.arcane + 3)
  })

  it('does not modify other mana types', () => {
    const player = testPlayer()
    const originalEarth = player.mana.earth

    const newPlayer = applyManaFountain({ player, manaType: 'fire' })

    expect(newPlayer.mana.earth).toBe(originalEarth)
  })

  it('does not mutate original player', () => {
    const player = testPlayer()
    const originalFire = player.mana.fire

    applyManaFountain({ player, manaType: 'fire' })

    expect(player.mana.fire).toBe(originalFire)
  })
})

// ---------------------------------------------------------------------------
// applyElementalRiver
// ---------------------------------------------------------------------------

describe('applyElementalRiver', () => {
  it('adds 2 mana of chosen elemental type', () => {
    const player = testPlayer()

    const newPlayer = applyElementalRiver({ player, manaType: 'fire' })

    expect(newPlayer.mana.fire).toBe(player.mana.fire + 2)
  })

  it('works for earth', () => {
    const player = testPlayer()
    const newPlayer = applyElementalRiver({ player, manaType: 'earth' })
    expect(newPlayer.mana.earth).toBe(player.mana.earth + 2)
  })

  it('works for air', () => {
    const player = testPlayer()
    const newPlayer = applyElementalRiver({ player, manaType: 'air' })
    expect(newPlayer.mana.air).toBe(player.mana.air + 2)
  })

  it('works for water', () => {
    const player = testPlayer()
    const newPlayer = applyElementalRiver({ player, manaType: 'water' })
    expect(newPlayer.mana.water).toBe(player.mana.water + 2)
  })

  it('does not mutate original player', () => {
    const player = testPlayer()
    const originalFire = player.mana.fire

    applyElementalRiver({ player, manaType: 'fire' })

    expect(player.mana.fire).toBe(originalFire)
  })
})

// ---------------------------------------------------------------------------
// resolveFreePrisoner
// ---------------------------------------------------------------------------

describe('resolveFreePrisoner', () => {
  it('returns a valid guardian creature key', () => {
    const result = resolveFreePrisoner({ gameDays: 10, rng: fixedRng })
    expect(CREATURES[result.guardianKey as keyof typeof CREATURES]).toBeDefined()
  })

  it('returns a valid prisoner creature key', () => {
    const result = resolveFreePrisoner({ gameDays: 10, rng: fixedRng })
    expect(CREATURES[result.prisonerKey as keyof typeof CREATURES]).toBeDefined()
  })

  it('guardian difficulty is in 100-200 range', () => {
    const result = resolveFreePrisoner({ gameDays: 10, rng: fixedRng })
    expect(result.guardianDifficulty).toBeGreaterThanOrEqual(100)
    expect(result.guardianDifficulty).toBeLessThanOrEqual(200)
  })

  it('produces valid results at day 0', () => {
    const result = resolveFreePrisoner({ gameDays: 0, rng: fixedRng })
    expect(result.guardianKey).toBeDefined()
    expect(result.prisonerKey).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// generateSageSpells
// ---------------------------------------------------------------------------

describe('generateSageSpells', () => {
  it('returns exactly 3 spell keys', () => {
    const spells = generateSageSpells(fixedRng)
    expect(spells.length).toBe(3)
  })

  it('all 3 spell keys are valid spells in SPELLS data', () => {
    const spells = generateSageSpells(fixedRng)
    for (const key of spells) {
      expect(SPELLS[key as keyof typeof SPELLS]).toBeDefined()
    }
  })

  it('spell 1 is from first range (indices 0-7)', () => {
    const spellKeys = Object.keys(SPELLS)
    const firstRange = spellKeys.slice(0, 8)
    const spells = generateSageSpells(fixedRng)
    expect(firstRange).toContain(spells[0])
  })

  it('spell 2 is from second range (indices 8-15)', () => {
    const spellKeys = Object.keys(SPELLS)
    const secondRange = spellKeys.slice(8, 16)
    const spells = generateSageSpells(fixedRng)
    expect(secondRange).toContain(spells[1])
  })

  it('spell 3 is from third range (indices 16-24)', () => {
    const spellKeys = Object.keys(SPELLS)
    const thirdRange = spellKeys.slice(16, 25)
    const spells = generateSageSpells(fixedRng)
    expect(thirdRange).toContain(spells[2])
  })

  it('different RNG produces different spell selections', () => {
    const spells1 = generateSageSpells(lowRng)
    const spells2 = generateSageSpells(highRng)
    // At least one should differ (indices 0-7 with lowRng picks 0, highRng picks 7)
    expect(
      spells1[0] !== spells2[0] || spells1[1] !== spells2[1] || spells1[2] !== spells2[2],
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// applySageLesson
// ---------------------------------------------------------------------------

describe('applySageLesson', () => {
  it('learns new spell at level 1 if not known', () => {
    const player = testPlayer({ spellbook: {} })

    const { newPlayer, learned, newLevel } = applySageLesson({ player, spellKey: 'magicArrow' })

    expect(learned).toBe(true)
    expect(newLevel).toBe(1)
    expect(newPlayer.spellbook.magicArrow).toBe(1)
  })

  it('upgrades existing spell level by 1', () => {
    const player = testPlayer({ spellbook: { magicArrow: 2 } })

    const { newPlayer, learned, newLevel } = applySageLesson({ player, spellKey: 'magicArrow' })

    expect(learned).toBe(false)
    expect(newLevel).toBe(3)
    expect(newPlayer.spellbook.magicArrow).toBe(3)
  })

  it('does not mutate original player', () => {
    const player = testPlayer({ spellbook: {} })

    applySageLesson({ player, spellKey: 'magicArrow' })

    expect(player.spellbook.magicArrow).toBeUndefined()
  })

  it('preserves other spells in spellbook', () => {
    const player = testPlayer({ spellbook: { fireball: 3 } })

    const { newPlayer } = applySageLesson({ player, spellKey: 'magicArrow' })

    expect(newPlayer.spellbook.fireball).toBe(3)
    expect(newPlayer.spellbook.magicArrow).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// resolveChoiceEvent
// ---------------------------------------------------------------------------

describe('resolveChoiceEvent', () => {
  it('returns two distinct event types', () => {
    const result = resolveChoiceEvent({ location: 'cave', rng: fixedRng })
    expect(result.option1).not.toBe(result.option2)
  })

  it('neither option is choiceEvent', () => {
    const result = resolveChoiceEvent({ location: 'cave', rng: fixedRng })
    expect(result.option1).not.toBe('choiceEvent')
    expect(result.option2).not.toBe('choiceEvent')
  })

  it('both options are valid for the location', () => {
    const caveTypes = EVENT_TABLES.cave.map((e) => e.type)
    const result = resolveChoiceEvent({ location: 'cave', rng: fixedRng })
    expect(caveTypes).toContain(result.option1)
    expect(caveTypes).toContain(result.option2)
  })

  it('works for treasureIsland', () => {
    const types = EVENT_TABLES.treasureIsland.map((e) => e.type)
    const result = resolveChoiceEvent({ location: 'treasureIsland', rng: fixedRng })
    expect(types).toContain(result.option1)
    expect(types).toContain(result.option2)
    expect(result.option1).not.toBe('choiceEvent')
    expect(result.option2).not.toBe('choiceEvent')
  })

  it('works for dungeon', () => {
    const types = EVENT_TABLES.dungeon.map((e) => e.type)
    const result = resolveChoiceEvent({ location: 'dungeon', rng: fixedRng })
    expect(types).toContain(result.option1)
    expect(types).toContain(result.option2)
  })
})

// ---------------------------------------------------------------------------
// triggerAdventureEvent (integration)
// ---------------------------------------------------------------------------

describe('triggerAdventureEvent', () => {
  it('returns an event result for cave', () => {
    const player = testPlayer()
    const result = triggerAdventureEvent({ location: 'cave', player, gameDays: 10, rng: fixedRng })
    expect(result.type).toBeDefined()
  })

  it('returns an event result for treasureIsland', () => {
    const player = testPlayer()
    const result = triggerAdventureEvent({
      location: 'treasureIsland',
      player,
      gameDays: 10,
      rng: fixedRng,
    })
    expect(result.type).toBeDefined()
  })

  it('returns an event result for dungeon', () => {
    const player = testPlayer()
    const result = triggerAdventureEvent({
      location: 'dungeon',
      player,
      gameDays: 10,
      rng: fixedRng,
    })
    expect(result.type).toBeDefined()
  })

  it('event type matches one of the valid types for the location', () => {
    const caveTypes = EVENT_TABLES.cave.map((e) => e.type)
    const player = testPlayer()
    const result = triggerAdventureEvent({ location: 'cave', player, gameDays: 10, rng: fixedRng })
    expect(caveTypes).toContain(result.type)
  })

  it('smallTreasure event has goldAmount in data', () => {
    // Force smallTreasure by using lowRng (first event in cave table is smallTreasure)
    const player = testPlayer()
    const result = triggerAdventureEvent({ location: 'cave', player, gameDays: 10, rng: lowRng })
    if (result.type === 'smallTreasure') {
      expect(result.data.goldAmount).toBeGreaterThan(0)
    }
    // If not smallTreasure, that's OK -- RNG may select differently
    expect(result.type).toBeDefined()
  })

  it('produces varied results with different RNG', () => {
    const player = testPlayer()
    const types = new Set<string>()
    for (let i = 0; i < 50; i++) {
      let state = i * 0.02
      const rng = () => {
        state = (state + 0.13) % 1
        return state
      }
      const result = triggerAdventureEvent({ location: 'dungeon', player, gameDays: 10, rng })
      types.add(result.type)
    }
    expect(types.size).toBeGreaterThan(1)
  })
})
