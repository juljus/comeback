import { describe, expect, it } from 'vitest'
import {
  calcNaturalHpRegen,
  canEquipItem,
  createCompanionFromCreature,
  createPlayer,
  equipItem,
  equipItemFromInventory,
  itemTypeToSlot,
  recalcDerivedStats,
  resolveUpkeep,
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

  it('sets diceCount and diceSides from knife with strength bonus', () => {
    const player = createPlayer(1, 'Bob', 'male')
    // knife: diceSides=4, reqStrength=1, strength=2, bonus=1 -> diceSides=5
    expect(player.diceCount).toBe(1)
    expect(player.diceSides).toBe(5)
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
  it('equips a weapon and updates dice stats with strength bonus', () => {
    const player = createPlayer(1, 'Bob', 'male')
    const updated = equipItem(player, 'ironDagger', 'weapon')
    expect(updated.equipment.weapon).toBe('ironDagger')
    // ironDagger: diceSides=6, reqStrength=1, strength=2, bonus=1 -> diceSides=7
    expect(updated.diceCount).toBe(ITEMS.ironDagger.diceCount)
    expect(updated.diceSides).toBe(ITEMS.ironDagger.diceSides + 1)
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

  it('weapon unequip gives unarmed dice (1d strength)', () => {
    let player = createPlayer(1, 'Bob', 'male')
    player = equipItem(player, 'ironDagger', 'weapon')
    player = unequipItem(player, 'weapon')
    expect(player.equipment.weapon).toBe('')
    // Unarmed: diceCount=1, diceSides=strength=2
    expect(player.diceCount).toBe(1)
    expect(player.diceSides).toBe(2)
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

  it('sets weapon dice with strength penalty when under-strength', () => {
    let player = createPlayer(1, 'Bob', 'male')
    player = equipItem(player, 'mithrilLongsword', 'weapon')
    const recalced = recalcDerivedStats(player)
    // mithrilLongsword: diceSides=5, reqStrength=4, strength=2, bonus=2*(2-4)=-4 -> diceSides=1
    expect(recalced.diceCount).toBe(3)
    expect(recalced.diceSides).toBe(1)
  })

  it('applies bonus strikes from equipment', () => {
    let player = createPlayer(1, 'Bob', 'male')
    player = equipItem(player, 'mithrilLongsword', 'weapon')
    const recalced = recalcDerivedStats(player)
    // Base 1 + mithrilLongsword +1 strikes = 2
    expect(recalced.attacksPerRound).toBe(2)
  })

  it('returns unarmed dice when no weapon equipped', () => {
    let player = createPlayer(1, 'Bob', 'male')
    player = unequipItem(player, 'weapon')
    const recalced = recalcDerivedStats(player)
    // Unarmed: diceCount=1, diceSides=strength=2
    expect(recalced.diceCount).toBe(1)
    expect(recalced.diceSides).toBe(2)
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

  it('recalculates stats after equipping with strength bonus', () => {
    let player = createPlayer(1, 'Bob', 'male')
    player = { ...player, inventory: ['ironDagger'] }
    const updated = equipItemFromInventory(player, 'ironDagger', 'weapon')
    // ironDagger: diceSides=6, reqStrength=1, strength=2, bonus=1 -> diceSides=7
    expect(updated.diceCount).toBe(ITEMS.ironDagger.diceCount)
    expect(updated.diceSides).toBe(ITEMS.ironDagger.diceSides + 1)
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

  it('recalculates stats after unequipping to unarmed', () => {
    const player = createPlayer(1, 'Bob', 'male')
    const updated = unequipItemToInventory(player, 'weapon')
    // Unarmed: diceCount=1, diceSides=strength=2
    expect(updated.diceCount).toBe(1)
    expect(updated.diceSides).toBe(2)
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

// ---------------------------------------------------------------------------
// Weapon damage bonus from strength
// ---------------------------------------------------------------------------

describe('weapon damage bonus from strength', () => {
  it('bonus when strength exceeds reqStrength: knife(req=1) at str=5 gives diceSides = 4 + 4 = 8', () => {
    // knife: diceSides=4, reqStrength=1
    let player = createPlayer(1, 'Test', 'male')
    player = { ...player, baseStrength: 5 }
    player = recalcDerivedStats(player)
    // strength=5, reqStrength=1, bonus = 5-1 = 4, diceSides = 4+4 = 8
    expect(player.diceSides).toBe(8)
    expect(player.diceCount).toBe(1)
  })

  it('bonus with ironLongsword(req=4) at str=6: diceSides = 6 + 2 = 8', () => {
    let player = createPlayer(1, 'Test', 'male')
    player = { ...player, baseStrength: 6 }
    player = equipItem(player, 'ironLongsword', 'weapon')
    // strength=6, reqStrength=4, bonus = 6-4 = 2, diceSides = 6+2 = 8
    expect(player.diceSides).toBe(8)
    expect(player.diceCount).toBe(2)
  })

  it('double penalty when under reqStrength: ironLongsword(req=4) at str=2: diceSides = 6 + 2*(2-4) = 2', () => {
    let player = createPlayer(1, 'Test', 'male')
    player = { ...player, baseStrength: 2 }
    player = equipItem(player, 'ironLongsword', 'weapon')
    // strength=2, reqStrength=4, bonus = 2*(2-4) = -4, diceSides = 6+(-4) = 2
    expect(player.diceSides).toBe(2)
  })

  it('diceSides floors at 1 when heavily under-strength', () => {
    let player = createPlayer(1, 'Test', 'male')
    player = { ...player, baseStrength: 1 }
    player = equipItem(player, 'ironLongsword', 'weapon')
    // strength=1, reqStrength=4, bonus = 2*(1-4) = -6, diceSides = 6+(-6) = 0 -> capped at 1
    expect(player.diceSides).toBe(1)
  })

  it('unarmed at strength 4: diceCount=1, diceSides=4', () => {
    let player = createPlayer(1, 'Test', 'male')
    player = { ...player, baseStrength: 4, equipment: { ...player.equipment, weapon: '' } }
    player = recalcDerivedStats(player)
    expect(player.diceCount).toBe(1)
    expect(player.diceSides).toBe(4)
  })

  it('unarmed at strength 1: diceCount=1, diceSides=1', () => {
    let player = createPlayer(1, 'Test', 'male')
    player = { ...player, baseStrength: 1, equipment: { ...player.equipment, weapon: '' } }
    player = recalcDerivedStats(player)
    expect(player.diceCount).toBe(1)
    expect(player.diceSides).toBe(1)
  })

  it('exact reqStrength gives no bonus: knife(req=1) at str=1', () => {
    let player = createPlayer(1, 'Test', 'male')
    player = { ...player, baseStrength: 1 }
    player = recalcDerivedStats(player)
    // strength=1, reqStrength=1, bonus = 0, diceSides = 4
    expect(player.diceSides).toBe(4)
  })
})

// ---------------------------------------------------------------------------
// recalcDerivedStats with active effects (batch A spell integration)
// ---------------------------------------------------------------------------

describe('recalcDerivedStats with active effects', () => {
  function makeEffect(
    overrides: Partial<import('../types').ActiveEffect> = {},
  ): import('../types').ActiveEffect {
    return {
      spellKey: '',
      casterId: 0,
      targetId: 1,
      duration: 10,
      armorBonus: 0,
      hasteBonus: 0,
      strengthBonus: 0,
      windsPower: 0,
      checkedFlag: false,
      moneyReward: 0,
      itemReward: 0,
      landReward: 0,
      fireDamageBonus: 0,
      buildingCostReduction: 0,
      speedBonus: 0,
      retaliationPercent: 0,
      vampiricBatsDrain: 0,
      ...overrides,
    }
  }

  it('airShield effect adds armor bonus', () => {
    const player = createPlayer(1, 'Test', 'male')
    const baseArmor = player.armor
    const effects = [makeEffect({ spellKey: 'airShield', armorBonus: 5 })]
    const result = recalcDerivedStats(player, effects)
    expect(result.armor).toBe(baseArmor + 5)
  })

  it('fireEnchant effect adds fire elemental damage', () => {
    const player = createPlayer(1, 'Test', 'male')
    const effects = [makeEffect({ spellKey: 'fireEnchant', fireDamageBonus: 3 })]
    const result = recalcDerivedStats(player, effects)
    expect(result.elementalDamage.fire).toBe(3)
  })

  it('fireEnchant stacks with item fire damage', () => {
    let player = createPlayer(1, 'Test', 'male')
    // daggerOfFlames has fire: 5 elemental damage
    player = equipItem(player, 'daggerOfFlames', 'weapon')
    const itemFire = player.elementalDamage.fire
    expect(itemFire).toBe(5)
    const effects = [makeEffect({ spellKey: 'fireEnchant', fireDamageBonus: 4 })]
    const result = recalcDerivedStats(player, effects)
    expect(result.elementalDamage.fire).toBe(9)
  })

  it('slow effect reduces attacksPerRound via negative haste', () => {
    const player = createPlayer(1, 'Test', 'male')
    // Base: 1 attack per round (1 + 0 bonusStrikes + floor(2/5) = 1)
    const effects = [makeEffect({ spellKey: 'slow', hasteBonus: -3 })]
    const result = recalcDerivedStats(player, effects)
    // 1 + (-3) + floor(2/5) = -2, but attacksPerRound can go negative in the formula
    expect(result.attacksPerRound).toBe(1 + -3 + Math.floor(player.baseDexterity / 5))
  })

  it('speed bonus from effect adds to player speed', () => {
    const player = createPlayer(1, 'Test', 'male')
    const effects = [makeEffect({ speedBonus: 2 })]
    const result = recalcDerivedStats(player, effects)
    expect(result.speed).toBe(2)
  })

  it('effects only apply to matching targetId', () => {
    const player = createPlayer(1, 'Test', 'male')
    // Effect targets player 2, not player 1
    const effects = [makeEffect({ targetId: 2, armorBonus: 10 })]
    const result = recalcDerivedStats(player, effects)
    expect(result.armor).toBe(player.armor)
  })

  it('multiple effects stack', () => {
    const player = createPlayer(1, 'Test', 'male')
    const effects = [
      makeEffect({ spellKey: 'airShield', armorBonus: 3 }),
      makeEffect({ spellKey: 'fireEnchant', fireDamageBonus: 2, armorBonus: 0 }),
    ]
    const result = recalcDerivedStats(player, effects)
    expect(result.armor).toBe(player.armor + 3)
    expect(result.elementalDamage.fire).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// calcNaturalHpRegen
// ---------------------------------------------------------------------------

describe('calcNaturalHpRegen', () => {
  it('returns strength - floor(currentHp / 10)', () => {
    // str=5, hp=30 -> 5 - floor(30/10) = 5 - 3 = 2
    expect(calcNaturalHpRegen(5, 30, 100)).toBe(2)
  })

  it('returns 0 when regen would be negative', () => {
    // str=2, hp=50 -> 2 - floor(50/10) = 2 - 5 = -3 -> 0
    expect(calcNaturalHpRegen(2, 50, 100)).toBe(0)
  })

  it('returns 0 when regen would be exactly 0', () => {
    // str=3, hp=30 -> 3 - 3 = 0
    expect(calcNaturalHpRegen(3, 30, 100)).toBe(0)
  })

  it('caps at maxHp', () => {
    // str=10, hp=18, maxHp=20 -> raw = 10 - 1 = 9, but cap at 20-18=2
    expect(calcNaturalHpRegen(10, 18, 20)).toBe(2)
  })

  it('returns 0 when already at maxHp', () => {
    expect(calcNaturalHpRegen(5, 50, 50)).toBe(0)
  })

  it('handles low hp correctly (high regen)', () => {
    // str=4, hp=5 -> 4 - floor(5/10) = 4 - 0 = 4
    expect(calcNaturalHpRegen(4, 5, 100)).toBe(4)
  })

  it('handles hp=0', () => {
    // str=3, hp=0 -> 3 - 0 = 3
    expect(calcNaturalHpRegen(3, 0, 100)).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// resolveUpkeep
// ---------------------------------------------------------------------------

describe('resolveUpkeep', () => {
  it('applies natural HP regen to player', () => {
    const player = createPlayer(1, 'Test', 'male')
    player.hp = 10
    // strength=2, hp=10 -> regen = 2 - floor(10/10) = 2 - 1 = 1

    const { newPlayer, result } = resolveUpkeep({ player })

    expect(result.playerHpRegen).toBe(1)
    expect(newPlayer.hp).toBe(11)
  })

  it('applies natural HP regen to companions', () => {
    const player = createPlayer(1, 'Test', 'male')
    const comp = createCompanionFromCreature('wolf')
    comp.currentHp = 5
    player.companions = [comp]

    const { newPlayer, result } = resolveUpkeep({ player })

    expect(result.companionHpRegen).toHaveLength(1)
    expect(result.companionHpRegen[0]!.name).toBe('wolf')
    expect(result.companionHpRegen[0]!.regen).toBeGreaterThanOrEqual(0)
    expect(newPlayer.companions[0]!.currentHp).toBe(
      comp.currentHp + result.companionHpRegen[0]!.regen,
    )
  })

  it('does not exceed maxHp for player', () => {
    const player = createPlayer(1, 'Test', 'male')
    // maxHp = strength * 10 = 20. Set hp to 19.
    player.hp = 19

    const { newPlayer } = resolveUpkeep({ player })

    expect(newPlayer.hp).toBeLessThanOrEqual(player.maxHp)
  })

  it('does not exceed maxHp for companions', () => {
    const player = createPlayer(1, 'Test', 'male')
    const comp = createCompanionFromCreature('wolf')
    comp.currentHp = comp.maxHp - 1
    player.companions = [comp]

    const { newPlayer } = resolveUpkeep({ player })

    expect(newPlayer.companions[0]!.currentHp).toBeLessThanOrEqual(comp.maxHp)
  })

  it('returns 0 regen when player is at full HP', () => {
    const player = createPlayer(1, 'Test', 'male')
    // Default player: hp=maxHp=20

    const { result } = resolveUpkeep({ player })

    expect(result.playerHpRegen).toBe(0)
  })

  it('does not mutate original player', () => {
    const player = createPlayer(1, 'Test', 'male')
    player.hp = 10
    const origHp = player.hp

    resolveUpkeep({ player })

    expect(player.hp).toBe(origHp)
  })

  it('handles player with no companions', () => {
    const player = createPlayer(1, 'Test', 'male')
    player.hp = 5

    const { newPlayer, result } = resolveUpkeep({ player })

    expect(result.companionHpRegen).toEqual([])
    expect(newPlayer.companions).toEqual([])
    expect(newPlayer.hp).toBeGreaterThan(5)
  })
})
