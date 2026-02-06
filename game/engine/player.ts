import type { Gender, ItemSlot, PlayerState } from '../types'
import { ITEMS } from '../data'

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
    hp: 20,
    maxHp: 10000,
    armor: 0,
    attacksPerRound: 1,
    diceCount: 1,
    diceSides: 4,
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
    spellbook: [],
    mana: { ...EMPTY_MANA },
    manaRegen: { ...EMPTY_MANA },
    companions: [],
    ownedLands: [],
    position: 0,
    actionsUsed: 0,
  }
  return player
}

/** Recalculate derived stats (armor, dice, attacks) from equipped items. */
export function recalcDerivedStats(player: PlayerState): PlayerState {
  const result = {
    ...player,
    equipment: { ...player.equipment },
    mana: { ...player.mana },
    manaRegen: { ...player.manaRegen },
  }

  let totalArmor = 0
  let totalBonusStrikes = 0
  let totalBonusSpeed = 0

  const slots: ItemSlot[] = ['weapon', 'head', 'body', 'feet', 'ringRight', 'ringLeft', 'usable']

  for (const slot of slots) {
    const itemKey = result.equipment[slot]
    if (!itemKey) continue
    const item = ITEMS[itemKey as keyof typeof ITEMS]
    if (!item) continue

    totalArmor += item.bonusArmor
    totalBonusStrikes += item.bonusStrikes
    totalBonusSpeed += item.bonusSpeed
  }

  result.armor = totalArmor
  result.attacksPerRound = 1 + totalBonusStrikes
  result.speed = totalBonusSpeed

  // Weapon dice
  const weaponKey = result.equipment.weapon
  if (weaponKey) {
    const weapon = ITEMS[weaponKey as keyof typeof ITEMS]
    if (weapon) {
      result.diceCount = weapon.diceCount
      result.diceSides = weapon.diceSides
    } else {
      result.diceCount = 0
      result.diceSides = 0
    }
  } else {
    result.diceCount = 0
    result.diceSides = 0
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
