import { describe, expect, it } from 'vitest'
import { createPlayer, equipItem, recalcDerivedStats, unequipItem } from './player'
import { ITEMS } from '../data'

describe('createPlayer', () => {
  it('returns a player with the given id, name, and gender', () => {
    const player = createPlayer(1, 'Alice', 'female')
    expect(player.id).toBe(1)
    expect(player.name).toBe('Alice')
    expect(player.gender).toBe('female')
  })

  it('sets starting gold to 200', () => {
    const player = createPlayer(1, 'Bob', 'male')
    expect(player.gold).toBe(200)
  })

  it('sets starting hp to 20', () => {
    const player = createPlayer(1, 'Bob', 'male')
    expect(player.hp).toBe(20)
  })

  it('sets maxHp to 10000', () => {
    const player = createPlayer(1, 'Bob', 'male')
    expect(player.maxHp).toBe(10000)
  })

  it('sets starting stats (str=2, dex=2, pow=2)', () => {
    const player = createPlayer(1, 'Bob', 'male')
    expect(player.strength).toBe(2)
    expect(player.dexterity).toBe(2)
    expect(player.power).toBe(2)
  })

  it('sets attacksPerRound to 1', () => {
    const player = createPlayer(1, 'Bob', 'male')
    expect(player.attacksPerRound).toBe(1)
  })

  it('sets armor to 0', () => {
    const player = createPlayer(1, 'Bob', 'male')
    expect(player.armor).toBe(0)
  })

  it('sets speed to 0', () => {
    const player = createPlayer(1, 'Bob', 'male')
    expect(player.speed).toBe(0)
  })

  it('equips a knife as starting weapon', () => {
    const player = createPlayer(1, 'Bob', 'male')
    expect(player.equipment.weapon).toBe('knife')
  })

  it('has empty slots for non-weapon equipment', () => {
    const player = createPlayer(1, 'Bob', 'male')
    expect(player.equipment.head).toBe('')
    expect(player.equipment.body).toBe('')
    expect(player.equipment.feet).toBe('')
    expect(player.equipment.ringRight).toBe('')
    expect(player.equipment.ringLeft).toBe('')
    expect(player.equipment.usable).toBe('')
  })

  it('sets diceCount and diceSides from knife (1d4)', () => {
    const player = createPlayer(1, 'Bob', 'male')
    expect(player.diceCount).toBe(1)
    expect(player.diceSides).toBe(4)
  })

  it('starts with empty spellbook', () => {
    const player = createPlayer(1, 'Bob', 'male')
    expect(player.spellbook).toEqual([])
  })

  it('starts with zero mana for all types', () => {
    const player = createPlayer(1, 'Bob', 'male')
    expect(player.mana.fire).toBe(0)
    expect(player.mana.earth).toBe(0)
    expect(player.mana.air).toBe(0)
    expect(player.mana.water).toBe(0)
    expect(player.mana.death).toBe(0)
    expect(player.mana.life).toBe(0)
    expect(player.mana.arcane).toBe(0)
  })

  it('starts with no companions', () => {
    const player = createPlayer(1, 'Bob', 'male')
    expect(player.companions).toEqual([])
  })

  it('starts with no owned lands', () => {
    const player = createPlayer(1, 'Bob', 'male')
    expect(player.ownedLands).toEqual([])
  })

  it('starts at position 0', () => {
    const player = createPlayer(1, 'Bob', 'male')
    expect(player.position).toBe(0)
  })

  it('starts with 0 actions used', () => {
    const player = createPlayer(1, 'Bob', 'male')
    expect(player.actionsUsed).toBe(0)
  })

  it('starts alive', () => {
    const player = createPlayer(1, 'Bob', 'male')
    expect(player.alive).toBe(true)
  })

  it('starts with no title', () => {
    const player = createPlayer(1, 'Bob', 'male')
    expect(player.title).toBe('none')
  })

  it('starts with empty inventory', () => {
    const player = createPlayer(1, 'Bob', 'male')
    expect(player.inventory).toEqual([])
  })
})

describe('equipItem', () => {
  it('equips a weapon and updates dice stats', () => {
    const player = createPlayer(1, 'Bob', 'male')
    const updated = equipItem(player, 'ironDagger', 'weapon')
    expect(updated.equipment.weapon).toBe('ironDagger')
    // Iron Dagger is 1d6
    expect(updated.diceCount).toBe(ITEMS.ironDagger.diceCount)
    expect(updated.diceSides).toBe(ITEMS.ironDagger.diceSides)
  })

  it('equips a helm and updates armor', () => {
    const player = createPlayer(1, 'Bob', 'male')
    const updated = equipItem(player, 'ironHelm', 'head')
    expect(updated.equipment.head).toBe('ironHelm')
    // Iron Helm gives +1 armor
    expect(updated.armor).toBe(1)
  })

  it('equips body armor and updates armor', () => {
    const player = createPlayer(1, 'Bob', 'male')
    const updated = equipItem(player, 'leatherSuit', 'body')
    expect(updated.equipment.body).toBe('leatherSuit')
    // Leather Suit gives +1 armor
    expect(updated.armor).toBe(1)
  })

  it('does not mutate the original player object', () => {
    const player = createPlayer(1, 'Bob', 'male')
    const originalArmor = player.armor
    equipItem(player, 'ironHelm', 'head')
    expect(player.armor).toBe(originalArmor)
    expect(player.equipment.head).toBe('')
  })

  it('stacks armor from multiple equipment slots', () => {
    let player = createPlayer(1, 'Bob', 'male')
    player = equipItem(player, 'ironHelm', 'head')
    player = equipItem(player, 'leatherSuit', 'body')
    // ironHelm +1 armor + leatherSuit +1 armor = 2 total
    expect(player.armor).toBe(2)
  })
})

describe('unequipItem', () => {
  it('removes item from slot', () => {
    let player = createPlayer(1, 'Bob', 'male')
    player = equipItem(player, 'ironHelm', 'head')
    const updated = unequipItem(player, 'head')
    expect(updated.equipment.head).toBe('')
  })

  it('recalculates armor after unequip', () => {
    let player = createPlayer(1, 'Bob', 'male')
    player = equipItem(player, 'ironHelm', 'head')
    expect(player.armor).toBe(1)
    player = unequipItem(player, 'head')
    expect(player.armor).toBe(0)
  })

  it('does not mutate the original player object', () => {
    let player = createPlayer(1, 'Bob', 'male')
    player = equipItem(player, 'ironHelm', 'head')
    const equipped = player
    unequipItem(player, 'head')
    expect(equipped.equipment.head).toBe('ironHelm')
  })

  it('weapon unequip resets dice stats', () => {
    let player = createPlayer(1, 'Bob', 'male')
    player = equipItem(player, 'ironDagger', 'weapon')
    player = unequipItem(player, 'weapon')
    expect(player.equipment.weapon).toBe('')
    // Without weapon, dice should be 0 or defaults
    expect(player.diceCount).toBe(0)
    expect(player.diceSides).toBe(0)
  })
})

describe('recalcDerivedStats', () => {
  it('calculates total armor from all equipment', () => {
    let player = createPlayer(1, 'Bob', 'male')
    player = equipItem(player, 'ironHelm', 'head')
    player = equipItem(player, 'leatherSuit', 'body')
    const recalced = recalcDerivedStats(player)
    // ironHelm +1 + leatherSuit +1 = 2
    expect(recalced.armor).toBe(2)
  })

  it('sets weapon dice from equipped weapon', () => {
    let player = createPlayer(1, 'Bob', 'male')
    player = equipItem(player, 'mithrilLongsword', 'weapon')
    const recalced = recalcDerivedStats(player)
    // Mithril Longsword: 3d5, +1 strikes
    expect(recalced.diceCount).toBe(3)
    expect(recalced.diceSides).toBe(5)
  })

  it('applies bonus strikes from equipment', () => {
    let player = createPlayer(1, 'Bob', 'male')
    player = equipItem(player, 'mithrilLongsword', 'weapon')
    const recalced = recalcDerivedStats(player)
    // Base 1 + mithrilLongsword +1 strikes = 2
    expect(recalced.attacksPerRound).toBe(2)
  })

  it('returns 0 dice when no weapon equipped', () => {
    let player = createPlayer(1, 'Bob', 'male')
    player = unequipItem(player, 'weapon')
    const recalced = recalcDerivedStats(player)
    expect(recalced.diceCount).toBe(0)
    expect(recalced.diceSides).toBe(0)
  })

  it('does not mutate the original player object', () => {
    const player = createPlayer(1, 'Bob', 'male')
    const originalDice = player.diceCount
    recalcDerivedStats(player)
    expect(player.diceCount).toBe(originalDice)
  })
})
