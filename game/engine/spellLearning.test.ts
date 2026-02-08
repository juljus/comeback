import { describe, expect, it } from 'vitest'
import { learnFromScroll, learnFromBuilding, calcTrainingCost, trainSpell } from './spellLearning'

// ---------------------------------------------------------------------------
// learnFromScroll
// ---------------------------------------------------------------------------
describe('learnFromScroll', () => {
  it('learns a new spell at level 1 from a scroll', () => {
    const result = learnFromScroll({
      spellbook: {},
      inventory: ['scrollOfMagicArrow'],
      scrollItemKey: 'scrollOfMagicArrow',
    })
    expect(result).not.toBeNull()
    expect(result!.spellKey).toBe('magicArrow')
    expect(result!.newLevel).toBe(1)
    expect(result!.newSpellbook).toEqual({ magicArrow: 1 })
  })

  it('levels up an already-known spell', () => {
    const result = learnFromScroll({
      spellbook: { magicArrow: 2 },
      inventory: ['scrollOfMagicArrow'],
      scrollItemKey: 'scrollOfMagicArrow',
    })
    expect(result).not.toBeNull()
    expect(result!.spellKey).toBe('magicArrow')
    expect(result!.newLevel).toBe(3)
    expect(result!.newSpellbook).toEqual({ magicArrow: 3 })
  })

  it('removes one copy of the scroll from inventory', () => {
    const result = learnFromScroll({
      spellbook: {},
      inventory: ['scrollOfFireBolt', 'scrollOfFireBolt', 'knife'],
      scrollItemKey: 'scrollOfFireBolt',
    })
    expect(result).not.toBeNull()
    expect(result!.newInventory).toEqual(['scrollOfFireBolt', 'knife'])
  })

  it('returns null when the item has no grantsSpell', () => {
    const result = learnFromScroll({
      spellbook: {},
      inventory: ['knife'],
      scrollItemKey: 'knife',
    })
    expect(result).toBeNull()
  })

  it('returns null when the item is not in inventory', () => {
    const result = learnFromScroll({
      spellbook: {},
      inventory: [],
      scrollItemKey: 'scrollOfMagicArrow',
    })
    expect(result).toBeNull()
  })

  it('returns null for an unknown item key', () => {
    const result = learnFromScroll({
      spellbook: {},
      inventory: ['nonExistentItem'],
      scrollItemKey: 'nonExistentItem',
    })
    expect(result).toBeNull()
  })

  it('does not mutate the original spellbook', () => {
    const spellbook = { magicArrow: 1 }
    const spellbookCopy = { ...spellbook }
    learnFromScroll({
      spellbook,
      inventory: ['scrollOfMagicArrow'],
      scrollItemKey: 'scrollOfMagicArrow',
    })
    expect(spellbook).toEqual(spellbookCopy)
  })

  it('does not mutate the original inventory', () => {
    const inventory = ['scrollOfMagicArrow', 'knife']
    const inventoryCopy = [...inventory]
    learnFromScroll({
      spellbook: {},
      inventory,
      scrollItemKey: 'scrollOfMagicArrow',
    })
    expect(inventory).toEqual(inventoryCopy)
  })

  it('preserves other spells in the spellbook', () => {
    const result = learnFromScroll({
      spellbook: { fireBolt: 3, heal: 1 },
      inventory: ['scrollOfMagicArrow'],
      scrollItemKey: 'scrollOfMagicArrow',
    })
    expect(result).not.toBeNull()
    expect(result!.newSpellbook).toEqual({ fireBolt: 3, heal: 1, magicArrow: 1 })
  })

  it('works with scrollOfFireBolt granting fireBolt', () => {
    const result = learnFromScroll({
      spellbook: {},
      inventory: ['scrollOfFireBolt'],
      scrollItemKey: 'scrollOfFireBolt',
    })
    expect(result).not.toBeNull()
    expect(result!.spellKey).toBe('fireBolt')
    expect(result!.newLevel).toBe(1)
  })

  it('works with scrollOfRaiseDead granting raiseDead', () => {
    const result = learnFromScroll({
      spellbook: { raiseDead: 4 },
      inventory: ['scrollOfRaiseDead'],
      scrollItemKey: 'scrollOfRaiseDead',
    })
    expect(result).not.toBeNull()
    expect(result!.spellKey).toBe('raiseDead')
    expect(result!.newLevel).toBe(5)
  })

  it('removes only the first occurrence of the scroll from inventory', () => {
    const result = learnFromScroll({
      spellbook: {},
      inventory: ['knife', 'scrollOfMagicArrow', 'shield', 'scrollOfMagicArrow'],
      scrollItemKey: 'scrollOfMagicArrow',
    })
    expect(result).not.toBeNull()
    expect(result!.newInventory).toEqual(['knife', 'shield', 'scrollOfMagicArrow'])
  })
})

// ---------------------------------------------------------------------------
// learnFromBuilding
// ---------------------------------------------------------------------------
describe('learnFromBuilding', () => {
  it('grants a spell when land type matches building restriction', () => {
    // lifeAltar grants spiritGuardian on plain, heal on valley
    const result = learnFromBuilding({
      spellbook: {},
      buildingKey: 'lifeAltar',
      landType: 'plain',
    })
    expect(result).not.toBeNull()
    expect(result!.spellKey).toBe('spiritGuardian')
    expect(result!.newLevel).toBe(1)
    expect(result!.newSpellbook).toEqual({ spiritGuardian: 1 })
  })

  it('grants the correct spell for a different land type on the same building', () => {
    // lifeAltar grants heal on valley
    const result = learnFromBuilding({
      spellbook: {},
      buildingKey: 'lifeAltar',
      landType: 'valley',
    })
    expect(result).not.toBeNull()
    expect(result!.spellKey).toBe('heal')
    expect(result!.newLevel).toBe(1)
  })

  it('returns null when land type does not match any restriction', () => {
    // lifeAltar only grants on plain/valley, not desert
    const result = learnFromBuilding({
      spellbook: {},
      buildingKey: 'lifeAltar',
      landType: 'desert',
    })
    expect(result).toBeNull()
  })

  it('returns null for a building with no grantsSpells', () => {
    // fort has grantsSpells: []
    const result = learnFromBuilding({
      spellbook: {},
      buildingKey: 'fort',
      landType: 'plain',
    })
    expect(result).toBeNull()
  })

  it('levels up an already-known spell', () => {
    const result = learnFromBuilding({
      spellbook: { spiritGuardian: 2 },
      buildingKey: 'lifeAltar',
      landType: 'plain',
    })
    expect(result).not.toBeNull()
    expect(result!.spellKey).toBe('spiritGuardian')
    expect(result!.newLevel).toBe(3)
  })

  it('does not mutate the original spellbook', () => {
    const spellbook = { fireBolt: 1 }
    const copy = { ...spellbook }
    learnFromBuilding({
      spellbook,
      buildingKey: 'fireAltar',
      landType: 'mountain',
    })
    expect(spellbook).toEqual(copy)
  })

  it('preserves other spells in the spellbook', () => {
    const result = learnFromBuilding({
      spellbook: { magicArrow: 5 },
      buildingKey: 'fireAltar',
      landType: 'mountain',
    })
    expect(result).not.toBeNull()
    expect(result!.newSpellbook).toEqual({ magicArrow: 5, fireBolt: 1 })
  })

  it('works with sarcophagus granting summonGolem on pyramids', () => {
    const result = learnFromBuilding({
      spellbook: {},
      buildingKey: 'sarcophagus',
      landType: 'pyramids',
    })
    expect(result).not.toBeNull()
    expect(result!.spellKey).toBe('summonGolem')
    expect(result!.newLevel).toBe(1)
  })

  it('returns null for an unknown building key', () => {
    const result = learnFromBuilding({
      spellbook: {},
      buildingKey: 'nonExistentBuilding',
      landType: 'plain',
    })
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// calcTrainingCost
// ---------------------------------------------------------------------------
describe('calcTrainingCost', () => {
  it('returns 200 gold for level 1', () => {
    const cost = calcTrainingCost(1)
    expect(cost.gold).toBe(200)
  })

  it('returns 600 gold for level 3', () => {
    const cost = calcTrainingCost(3)
    expect(cost.gold).toBe(600)
  })

  it('returns 1000 gold for level 5', () => {
    const cost = calcTrainingCost(5)
    expect(cost.gold).toBe(1000)
  })

  it('always returns 3 action points', () => {
    expect(calcTrainingCost(1).actionPoints).toBe(3)
    expect(calcTrainingCost(3).actionPoints).toBe(3)
    expect(calcTrainingCost(10).actionPoints).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// trainSpell
// ---------------------------------------------------------------------------
describe('trainSpell', () => {
  it('succeeds when player knows spell, has enough gold, and 0 actionsUsed', () => {
    const result = trainSpell({
      spellbook: { fireBolt: 1 },
      gold: 500,
      spellKey: 'fireBolt',
      actionsUsed: 0,
    })
    expect(result.success).toBe(true)
    expect(result.newSpellbook.fireBolt).toBe(2)
    expect(result.goldSpent).toBe(200) // level 1 * 200
  })

  it('deducts the correct amount of gold', () => {
    const result = trainSpell({
      spellbook: { heal: 3 },
      gold: 1000,
      spellKey: 'heal',
      actionsUsed: 0,
    })
    expect(result.success).toBe(true)
    expect(result.goldSpent).toBe(600) // level 3 * 200
  })

  it('fails when spell is not in spellbook', () => {
    const result = trainSpell({
      spellbook: {},
      gold: 1000,
      spellKey: 'fireBolt',
      actionsUsed: 0,
    })
    expect(result.success).toBe(false)
    expect(result.reason).toBeDefined()
    expect(result.goldSpent).toBe(0)
  })

  it('fails when player does not have enough gold', () => {
    const result = trainSpell({
      spellbook: { fireBolt: 2 },
      gold: 300, // needs 400 (level 2 * 200)
      spellKey: 'fireBolt',
      actionsUsed: 0,
    })
    expect(result.success).toBe(false)
    expect(result.reason).toBeDefined()
    expect(result.goldSpent).toBe(0)
  })

  it('fails when actionsUsed is not 0', () => {
    const result = trainSpell({
      spellbook: { fireBolt: 1 },
      gold: 1000,
      spellKey: 'fireBolt',
      actionsUsed: 1,
    })
    expect(result.success).toBe(false)
    expect(result.reason).toBeDefined()
    expect(result.goldSpent).toBe(0)
  })

  it('does not mutate the original spellbook', () => {
    const spellbook = { fireBolt: 1 }
    const copy = { ...spellbook }
    trainSpell({
      spellbook,
      gold: 500,
      spellKey: 'fireBolt',
      actionsUsed: 0,
    })
    expect(spellbook).toEqual(copy)
  })

  it('preserves other spells in the spellbook on success', () => {
    const result = trainSpell({
      spellbook: { fireBolt: 1, heal: 3 },
      gold: 500,
      spellKey: 'fireBolt',
      actionsUsed: 0,
    })
    expect(result.success).toBe(true)
    expect(result.newSpellbook).toEqual({ fireBolt: 2, heal: 3 })
  })

  it('succeeds when gold exactly equals the training cost', () => {
    // level 2 costs 400 gold
    const result = trainSpell({
      spellbook: { fireBolt: 2 },
      gold: 400,
      spellKey: 'fireBolt',
      actionsUsed: 0,
    })
    expect(result.success).toBe(true)
    expect(result.goldSpent).toBe(400)
    expect(result.newSpellbook.fireBolt).toBe(3)
  })

  it('fails when gold is one short of the training cost', () => {
    // level 2 costs 400 gold
    const result = trainSpell({
      spellbook: { fireBolt: 2 },
      gold: 399,
      spellKey: 'fireBolt',
      actionsUsed: 0,
    })
    expect(result.success).toBe(false)
    expect(result.goldSpent).toBe(0)
  })
})
