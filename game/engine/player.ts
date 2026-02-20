import type {
  ActiveEffect,
  Companion,
  Gender,
  ItemSlot,
  ItemType,
  ManaType,
  PlayerState,
} from '../types'
import { CREATURES, ITEMS } from '../data'

const MANA_TYPES: ManaType[] = ['fire', 'earth', 'air', 'water', 'death', 'life', 'arcane']

const EMPTY_MANA = {
  fire: 0,
  earth: 0,
  air: 0,
  water: 0,
  death: 0,
  life: 0,
  arcane: 0,
} as const

/** Create a new player with starting values from the game manual. */
export function createPlayer(id: number, name: string, gender: Gender): PlayerState {
  const player: PlayerState = {
    id,
    name,
    gender,
    title: 'none',
    alive: true,
    strength: 2,
    dexterity: 2,
    power: 2,
    baseStrength: 2,
    baseDexterity: 2,
    basePower: 2,
    hp: 20,
    maxHp: 20,
    armor: 0,
    attacksPerRound: 1,
    diceCount: 1,
    diceSides: 4,
    elementalDamage: { fire: 0, earth: 0, air: 0, water: 0 },
    damageType: 'pierce',
    speed: 0,
    gold: 200,
    equipment: {
      weapon: 'knife',
      head: '',
      body: '',
      feet: '',
      ringRight: '',
      ringLeft: '',
      usable: '',
    },
    inventory: [],
    spellbook: {},
    mana: { ...EMPTY_MANA },
    manaRegen: { ...EMPTY_MANA },
    companions: [],
    ownedLands: [],
    position: 0,
    actionsUsed: 0,
  }
  return recalcDerivedStats(player)
}

/** Recalculate derived stats (armor, dice, attacks, str/dex/pow, manaRegen) from equipped items and active effects. */
export function recalcDerivedStats(player: PlayerState, effects?: ActiveEffect[]): PlayerState {
  const result = {
    ...player,
    equipment: { ...player.equipment },
    mana: { ...player.mana },
    manaRegen: { ...EMPTY_MANA },
  }

  let totalArmor = 0
  let totalBonusStrikes = 0
  let totalBonusSpeed = 0
  let totalBonusStrength = 0
  let totalBonusDexterity = 0
  let totalBonusPower = 0
  const totalElemental = { fire: 0, earth: 0, air: 0, water: 0 }

  const slots: ItemSlot[] = ['weapon', 'head', 'body', 'feet', 'ringRight', 'ringLeft', 'usable']

  for (const slot of slots) {
    const itemKey = result.equipment[slot]
    if (!itemKey) continue
    const item = ITEMS[itemKey as keyof typeof ITEMS]
    if (!item) continue

    totalArmor += item.bonusArmor
    totalBonusStrikes += item.bonusStrikes
    totalBonusSpeed += item.bonusSpeed
    totalBonusStrength += item.bonusStrength
    totalBonusDexterity += item.bonusDexterity
    totalBonusPower += item.bonusPower
    totalElemental.fire += item.elementalDamage.fire
    totalElemental.earth += item.elementalDamage.earth
    totalElemental.air += item.elementalDamage.air
    totalElemental.water += item.elementalDamage.water

    for (const mana of MANA_TYPES) {
      result.manaRegen[mana] += item.manaBonus[mana]
    }
  }

  // Sum buff bonuses from active effects targeting this player
  if (effects) {
    for (const eff of effects) {
      if (eff.targetId !== player.id) continue
      totalArmor += eff.armorBonus
      totalBonusStrikes += eff.hasteBonus
      totalBonusStrength += eff.strengthBonus
    }
  }

  result.strength = result.baseStrength + totalBonusStrength
  result.dexterity = result.baseDexterity + totalBonusDexterity
  result.power = result.basePower + totalBonusPower
  result.armor = totalArmor + Math.floor(result.strength / 4)
  result.attacksPerRound = 1 + totalBonusStrikes + Math.floor(result.dexterity / 5)
  result.speed = totalBonusSpeed
  result.elementalDamage = totalElemental
  result.maxHp = result.strength * 10

  // Weapon dice and damage type
  const weaponKey = result.equipment.weapon
  if (weaponKey) {
    const weapon = ITEMS[weaponKey as keyof typeof ITEMS]
    if (weapon) {
      result.diceCount = weapon.diceCount
      result.diceSides = weapon.diceSides
      result.damageType = weapon.damageType
    } else {
      result.diceCount = 0
      result.diceSides = 0
      result.damageType = 'pierce'
    }
  } else {
    result.diceCount = 0
    result.diceSides = 0
    result.damageType = 'pierce'
  }

  return result
}

/** Equip an item to a slot. Returns a new player with recalculated stats. */
export function equipItem(player: PlayerState, itemKey: string, slot: ItemSlot): PlayerState {
  const updated = {
    ...player,
    equipment: { ...player.equipment, [slot]: itemKey },
    mana: { ...player.mana },
    manaRegen: { ...player.manaRegen },
  }
  return recalcDerivedStats(updated)
}

/** Unequip an item from a slot. Returns a new player with recalculated stats. */
export function unequipItem(player: PlayerState, slot: ItemSlot): PlayerState {
  const updated = {
    ...player,
    equipment: { ...player.equipment, [slot]: '' },
    mana: { ...player.mana },
    manaRegen: { ...player.manaRegen },
  }
  return recalcDerivedStats(updated)
}

/** Map an ItemType to its default equipment slot. Returns null for rings (caller must choose). */
export function itemTypeToSlot(type: ItemType): ItemSlot | null {
  switch (type) {
    case 'weapon':
      return 'weapon'
    case 'helm':
      return 'head'
    case 'body':
      return 'body'
    case 'boots':
      return 'feet'
    case 'consumable':
      return 'usable'
    case 'ring':
      return null
  }
}

/** Check whether a player meets the strength requirement to equip an item. */
export function canEquipItem(player: PlayerState, itemKey: string): boolean {
  const item = ITEMS[itemKey as keyof typeof ITEMS]
  if (!item) return false
  return player.baseStrength >= item.reqStrength
}

/** Equip an item from inventory to a slot. Swaps old item to inventory if slot occupied. */
export function equipItemFromInventory(
  player: PlayerState,
  itemKey: string,
  slot: ItemSlot,
): PlayerState {
  const idx = player.inventory.indexOf(itemKey)
  if (idx === -1) return player

  const newInventory = [...player.inventory]
  newInventory.splice(idx, 1)

  const oldItemKey = player.equipment[slot]
  if (oldItemKey) {
    newInventory.push(oldItemKey)
  }

  const updated = {
    ...player,
    inventory: newInventory,
    equipment: { ...player.equipment, [slot]: itemKey },
    mana: { ...player.mana },
    manaRegen: { ...player.manaRegen },
  }
  return recalcDerivedStats(updated)
}

/** Unequip an item from a slot and place it in inventory. */
export function unequipItemToInventory(player: PlayerState, slot: ItemSlot): PlayerState {
  const itemKey = player.equipment[slot]
  if (!itemKey) return player

  const updated = {
    ...player,
    inventory: [...player.inventory, itemKey],
    equipment: { ...player.equipment, [slot]: '' },
    mana: { ...player.mana },
    manaRegen: { ...player.manaRegen },
  }
  return recalcDerivedStats(updated)
}

/** Create a companion from a creature definition. */
export function createCompanionFromCreature(creatureKey: string): Companion {
  const creature = CREATURES[creatureKey as keyof typeof CREATURES]
  if (!creature) {
    throw new Error(`Unknown creature key: ${creatureKey}`)
  }

  return {
    name: creatureKey,
    currentHp: creature.hp,
    maxHp: creature.hp,
    strength: creature.strength,
    dexterity: creature.dexterity,
    power: creature.power,
    armor: creature.armor,
    attacksPerRound: creature.attacksPerRound,
    diceCount: creature.diceCount,
    diceSides: creature.diceSides,
    isPet: false,
    damageType: creature.damageType,
    immunities: { ...creature.immunities },
    elementalDamage: { ...creature.elementalDamage },
  }
}

/** Create a summoned companion with stat multiplier and duration. */
export function createSummonedCompanion(
  creatureKey: string,
  statMultiplier: number,
  duration: number,
): Companion {
  const creature = CREATURES[creatureKey as keyof typeof CREATURES]
  if (!creature) {
    throw new Error(`Unknown creature key: ${creatureKey}`)
  }

  const hp = Math.floor(creature.hp * statMultiplier)
  return {
    name: creatureKey,
    currentHp: hp,
    maxHp: hp,
    strength: Math.floor(creature.strength * statMultiplier),
    dexterity: Math.floor(creature.dexterity * statMultiplier),
    power: Math.floor(creature.power * statMultiplier),
    armor: Math.floor(creature.armor * statMultiplier),
    attacksPerRound: creature.attacksPerRound,
    diceCount: creature.diceCount,
    diceSides: creature.diceSides,
    isPet: false,
    damageType: creature.damageType,
    immunities: { ...creature.immunities },
    elementalDamage: { ...creature.elementalDamage },
    duration,
  }
}
