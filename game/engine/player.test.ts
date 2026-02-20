import { describe, expect, it } from 'vitest'
import {
  canEquipItem,
  createPlayer,
  equipItem,
  equipItemFromInventory,
  itemTypeToSlot,
  recalcDerivedStats,
  unequipItem,
  unequipItemToInventory,
} from './player'
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

  it('sets maxHp to strength * 10', () => {
    const player = createPlayer(1, 'Bob', 'male')
    expect(player.maxHp).toBe(player.strength * 10)
  })

  it('sets starting stats (str=2, dex=2, pow=2)', () => {
    const player = createPlayer(1, 'Bob', 'male')
    expect(player.strength).toBe(2)
    expect(player.dexterity).toBe(2)
    expect(player.power).toBe(2)
    expect(player.baseStrength).toBe(2)
    expect(player.baseDexterity).toBe(2)
    expect(player.basePower).toBe(2)
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
    expect(player.spellbook).toEqual({})
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

  it('applies bonusStrength/Dexterity/Power from equipment', () => {
    let player = createPlayer(1, 'Bob', 'male')
    // paladinsHelm: +1 str, +1 pow
    player = equipItem(player, 'paladinsHelm', 'head')
    expect(player.strength).toBe(2 + 1) // baseStrength(2) + bonusStrength(1)
    expect(player.power).toBe(2 + 1) // basePower(2) + bonusPower(1)
    expect(player.dexterity).toBe(2) // unchanged
  })

  it('preserves baseStrength when equipment adds bonusStrength', () => {
    let player = createPlayer(1, 'Bob', 'male')
    player = equipItem(player, 'paladinsHelm', 'head')
    expect(player.baseStrength).toBe(2)
    expect(player.strength).toBe(3)
  })

  it('sums manaRegen from equipment', () => {
    let player = createPlayer(1, 'Bob', 'male')
    // circletOfPower: manaBonus death=5, life=5, arcane=5
    player = equipItem(player, 'circletOfPower', 'head')
    expect(player.manaRegen.death).toBe(5)
    expect(player.manaRegen.life).toBe(5)
    expect(player.manaRegen.arcane).toBe(5)
    expect(player.manaRegen.fire).toBe(0)
  })

  it('resets manaRegen on recalc (no stacking from repeated calls)', () => {
    let player = createPlayer(1, 'Bob', 'male')
    player = equipItem(player, 'circletOfPower', 'head')
    // Calling recalc again should not double the mana regen
    const recalced = recalcDerivedStats(player)
    expect(recalced.manaRegen.death).toBe(5)
  })
})

describe('canEquipItem', () => {
  it('returns true when player meets strength requirement', () => {
    const player = createPlayer(1, 'Bob', 'male')
    // knife: reqStrength=1, player baseStrength=2
    expect(canEquipItem(player, 'knife')).toBe(true)
  })

  it('returns false when player does not meet strength requirement', () => {
    const player = createPlayer(1, 'Bob', 'male')
    // paladinsHelm: reqStrength=3, player baseStrength=2
    expect(canEquipItem(player, 'paladinsHelm')).toBe(false)
  })

  it('returns false for unknown item key', () => {
    const player = createPlayer(1, 'Bob', 'male')
    expect(canEquipItem(player, 'nonExistentItem')).toBe(false)
  })
})

describe('itemTypeToSlot', () => {
  it('maps weapon to weapon slot', () => {
    expect(itemTypeToSlot('weapon')).toBe('weapon')
  })

  it('maps helm to head slot', () => {
    expect(itemTypeToSlot('helm')).toBe('head')
  })

  it('maps body to body slot', () => {
    expect(itemTypeToSlot('body')).toBe('body')
  })

  it('maps boots to feet slot', () => {
    expect(itemTypeToSlot('boots')).toBe('feet')
  })

  it('maps consumable to usable slot', () => {
    expect(itemTypeToSlot('consumable')).toBe('usable')
  })

  it('returns null for ring (caller must choose left/right)', () => {
    expect(itemTypeToSlot('ring')).toBeNull()
  })
})

describe('equipItemFromInventory', () => {
  it('moves item from inventory to equipment slot', () => {
    let player = createPlayer(1, 'Bob', 'male')
    player = { ...player, inventory: ['ironDagger'] }
    const updated = equipItemFromInventory(player, 'ironDagger', 'weapon')
    expect(updated.equipment.weapon).toBe('ironDagger')
    expect(updated.inventory).not.toContain('ironDagger')
  })

  it('swaps old item to inventory if slot is occupied', () => {
    let player = createPlayer(1, 'Bob', 'male')
    // Player starts with knife equipped, ironDagger in inventory
    player = { ...player, inventory: ['ironDagger'] }
    const updated = equipItemFromInventory(player, 'ironDagger', 'weapon')
    expect(updated.equipment.weapon).toBe('ironDagger')
    expect(updated.inventory).toContain('knife')
    expect(updated.inventory).not.toContain('ironDagger')
  })

  it('recalculates stats after equipping', () => {
    let player = createPlayer(1, 'Bob', 'male')
    player = { ...player, inventory: ['ironDagger'] }
    const updated = equipItemFromInventory(player, 'ironDagger', 'weapon')
    expect(updated.diceCount).toBe(ITEMS.ironDagger.diceCount)
    expect(updated.diceSides).toBe(ITEMS.ironDagger.diceSides)
  })

  it('returns unchanged player if item not in inventory', () => {
    const player = createPlayer(1, 'Bob', 'male')
    const result = equipItemFromInventory(player, 'ironDagger', 'weapon')
    expect(result).toBe(player)
  })
})

describe('unequipItemToInventory', () => {
  it('moves equipped item to inventory', () => {
    const player = createPlayer(1, 'Bob', 'male')
    const updated = unequipItemToInventory(player, 'weapon')
    expect(updated.equipment.weapon).toBe('')
    expect(updated.inventory).toContain('knife')
  })

  it('recalculates stats after unequipping', () => {
    const player = createPlayer(1, 'Bob', 'male')
    const updated = unequipItemToInventory(player, 'weapon')
    expect(updated.diceCount).toBe(0)
    expect(updated.diceSides).toBe(0)
  })

  it('returns unchanged player if slot is empty', () => {
    const player = createPlayer(1, 'Bob', 'male')
    const result = unequipItemToInventory(player, 'head')
    expect(result).toBe(player)
  })
})

describe('dex bonus attacks (floor(dex/5))', () => {
  function playerWithDex(baseDex: number) {
    const player = createPlayer(1, 'Bob', 'male')
    return recalcDerivedStats({ ...player, baseDexterity: baseDex })
  }

  it('dex 1-4 gives 0 bonus attacks', () => {
    expect(playerWithDex(1).attacksPerRound).toBe(1)
    expect(playerWithDex(2).attacksPerRound).toBe(1)
    expect(playerWithDex(4).attacksPerRound).toBe(1)
  })

  it('dex 5 gives +1 bonus attack', () => {
    expect(playerWithDex(5).attacksPerRound).toBe(2)
  })

  it('dex 9 still gives +1 bonus attack', () => {
    expect(playerWithDex(9).attacksPerRound).toBe(2)
  })

  it('dex 10 gives +2 bonus attacks', () => {
    expect(playerWithDex(10).attacksPerRound).toBe(3)
  })

  it('dex 14 gives +2 bonus attacks', () => {
    expect(playerWithDex(14).attacksPerRound).toBe(3)
  })

  it('dex 15 gives +3 bonus attacks', () => {
    expect(playerWithDex(15).attacksPerRound).toBe(4)
  })

  it('stacks with item bonusStrikes', () => {
    let player = createPlayer(1, 'Bob', 'male')
    player = { ...player, baseDexterity: 10 }
    // mithrilLongsword has +1 bonusStrikes
    player = equipItem(player, 'mithrilLongsword', 'weapon')
    // base 1 + floor(10/5)=2 + itemStrikes 1 = 4
    expect(player.attacksPerRound).toBe(4)
  })
})

describe('str bonus armor (floor(str/4))', () => {
  function playerWithStr(baseStr: number) {
    const player = createPlayer(1, 'Bob', 'male')
    return recalcDerivedStats({ ...player, baseStrength: baseStr })
  }

  it('str 1-3 gives 0 bonus armor', () => {
    expect(playerWithStr(1).armor).toBe(0)
    expect(playerWithStr(2).armor).toBe(0)
    expect(playerWithStr(3).armor).toBe(0)
  })

  it('str 4 gives +1 bonus armor', () => {
    expect(playerWithStr(4).armor).toBe(1)
  })

  it('str 7 gives +1 bonus armor', () => {
    expect(playerWithStr(7).armor).toBe(1)
  })

  it('str 8 gives +2 bonus armor', () => {
    expect(playerWithStr(8).armor).toBe(2)
  })

  it('str 11 gives +2 bonus armor', () => {
    expect(playerWithStr(11).armor).toBe(2)
  })

  it('str 12 gives +3 bonus armor', () => {
    expect(playerWithStr(12).armor).toBe(3)
  })

  it('stacks with item armor', () => {
    let player = createPlayer(1, 'Bob', 'male')
    player = { ...player, baseStrength: 8 }
    // ironHelm gives +1 armor
    player = equipItem(player, 'ironHelm', 'head')
    // itemArmor 1 + floor(8/4)=2 = 3
    expect(player.armor).toBe(3)
  })
})
