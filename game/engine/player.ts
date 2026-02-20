import type {
  ActiveEffect,
  BoardSquare,
  Companion,
  Gender,
  ItemSlot,
  ItemType,
  ManaType,
  PlayerState,
} from '../types'
import { BUILDINGS, CREATURES, ITEMS, LANDS } from '../data'

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

/** Sum stat bonuses from buildings on all owned lands. */
export function calcBuildingStatBonuses(
  ownedLands: readonly number[],
  board: readonly BoardSquare[],
): { strength: number; dexterity: number; power: number } {
  let strength = 0
  let dexterity = 0
  let power = 0

  for (const landIndex of ownedLands) {
    const square = board[landIndex]
    if (!square) continue
    const landDef = LANDS[square.landKey as keyof typeof LANDS]
    if (!landDef) continue

    for (let i = 0; i < square.buildings.length; i++) {
      if (!square.buildings[i]) continue
      const buildingKey = landDef.buildings[i]
      if (!buildingKey) continue
      const building = BUILDINGS[buildingKey as keyof typeof BUILDINGS]
      if (!building) continue
      strength += building.bonusStrength
      dexterity += building.bonusDexterity
      power += building.bonusPower
    }
  }

  return { strength, dexterity, power }
}

/** Recalculate derived stats (armor, dice, attacks, str/dex/pow, manaRegen) from equipped items and active effects. */
export function recalcDerivedStats(
  player: PlayerState,
  effects?: ActiveEffect[],
  buildingBonuses?: { strength: number; dexterity: number; power: number },
): PlayerState {
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
      totalBonusSpeed += eff.speedBonus
      totalElemental.fire += eff.fireDamageBonus
    }
  }

  // Sum stat bonuses from buildings on owned lands
  if (buildingBonuses) {
    totalBonusStrength += buildingBonuses.strength
    totalBonusDexterity += buildingBonuses.dexterity
    totalBonusPower += buildingBonuses.power
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
      const strDiff = result.strength - weapon.reqStrength
      const damageBonus = strDiff >= 0 ? strDiff : 2 * strDiff
      result.diceCount = weapon.diceCount
      result.diceSides = Math.max(1, weapon.diceSides + damageBonus)
      result.damageType = weapon.damageType
    } else {
      result.diceCount = 1
      result.diceSides = result.strength
      result.damageType = 'pierce'
    }
  } else {
    // Unarmed: punch for 1d(strength)
    result.diceCount = 1
    result.diceSides = result.strength
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

// ---------------------------------------------------------------------------
// calcNaturalHpRegen
// ---------------------------------------------------------------------------

/**
 * Natural HP regeneration per VBA upkeep: strength - floor(currentHp / 10).
 * Capped so that hp does not exceed maxHp. Returns 0 if result would be negative.
 */
export function calcNaturalHpRegen(strength: number, currentHp: number, maxHp: number): number {
  const raw = strength - Math.floor(currentHp / 10)
  if (raw <= 0) return 0
  return Math.min(raw, maxHp - currentHp)
}

// ---------------------------------------------------------------------------
// resolveUpkeep
// ---------------------------------------------------------------------------

export type UpkeepResult = {
  playerHpRegen: number
  companionHpRegen: Array<{ name: string; regen: number }>
}

/**
 * Resolve start-of-turn upkeep: natural HP regeneration for player and companions.
 * Returns a new player state and a report of HP changes.
 *
 * Note: Mercenary contract countdown and summoned companion expiry are handled
 * by expireSummonedCompanions (already called in endTurn).
 * Mana regen and effect ticks are also already handled in endTurn.
 */
export function resolveUpkeep(params: { player: PlayerState }): {
  newPlayer: PlayerState
  result: UpkeepResult
} {
  const { player } = params

  // Player HP regen
  const playerHpRegen = calcNaturalHpRegen(player.strength, player.hp, player.maxHp)

  // Companion HP regen
  const companionHpRegen: Array<{ name: string; regen: number }> = []
  const newCompanions = player.companions.map((comp) => {
    const regen = calcNaturalHpRegen(comp.strength, comp.currentHp, comp.maxHp)
    companionHpRegen.push({ name: comp.name, regen })
    return {
      ...comp,
      currentHp: comp.currentHp + regen,
      immunities: { ...comp.immunities },
      elementalDamage: { ...comp.elementalDamage },
    }
  })

  const newPlayer: PlayerState = {
    ...player,
    hp: player.hp + playerHpRegen,
    companions: newCompanions,
    equipment: { ...player.equipment },
    mana: { ...player.mana },
    manaRegen: { ...player.manaRegen },
    elementalDamage: { ...player.elementalDamage },
    inventory: [...player.inventory],
    ownedLands: [...player.ownedLands],
    spellbook: { ...player.spellbook },
  }

  return {
    newPlayer,
    result: { playerHpRegen, companionHpRegen },
  }
}
