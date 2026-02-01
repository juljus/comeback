import type { GameState, Equipment } from './types'
import { SELL_PRICE_MULTIPLIER } from './types'
import { getItemById } from './helpers'

/**
 * Buy an item from the current shop
 * Costs 1 action point
 * VBA: Max inventory = 20 items (line 14428)
 *
 * Checks:
 * - Player has room in inventory (max 20 items)
 * - Item exists in game database
 * - Item is in shop inventory
 * - Player can afford the item
 * - Player meets strength requirement
 *
 * @returns true if purchase was successful, false otherwise
 */
export function buyItem(player: GameState['players'][0], shopItems: any[], itemId: number): boolean {
  if (!player) return false

  // VBA inventory limit: 20 items max (line 14428)
  if (player.inventory.length >= 20) return false

  const item = getItemById(itemId)
  if (!item) return false

  // Check if item is available at this shop
  if (!shopItems.find(i => i.id === itemId)) return false

  // Check affordability
  if (player.gold < item.value) return false

  // Check strength requirement
  if (player.stats.strength < item.requiredStrength) return false

  // Buy the item
  player.gold -= item.value
  player.inventory.push(itemId)

  return true
}

/**
 * Sell an item from inventory
 * Costs 1 action point
 * Item sells for 50% of its value
 *
 * Checks:
 * - Player has the item in their inventory
 * - Item exists in game database
 *
 * @returns true if sale was successful, false otherwise
 */
export function sellItem(player: GameState['players'][0], itemId: number): boolean {
  if (!player) return false

  // Check if player has the item
  const itemIndex = player.inventory.indexOf(itemId)
  if (itemIndex === -1) return false

  const item = getItemById(itemId)
  if (!item) return false

  // Sell the item (50% value)
  const sellPrice = Math.floor(item.value * SELL_PRICE_MULTIPLIER)
  player.gold += sellPrice
  player.inventory.splice(itemIndex, 1)

  return true
}

/**
 * Equip an item from inventory
 * Costs 1 action point
 * Unequips any existing item in that slot and returns it to inventory
 *
 * Checks:
 * - Player has the item in inventory
 * - Item exists in game database
 * - Player meets strength requirement
 * - Item type is equippable (not consumable)
 *
 * @returns true if equip was successful, false otherwise
 */
export function equipItem(player: GameState['players'][0], itemId: number): boolean {
  if (!player) return false

  // Check if player has the item in inventory
  const itemIndex = player.inventory.indexOf(itemId)
  if (itemIndex === -1) return false

  const item = getItemById(itemId)
  if (!item) return false

  // Check strength requirement
  if (player.stats.strength < item.requiredStrength) return false

  // Determine equipment slot based on item type
  // CSV types: 1=helm, 2=armor, 3=boots, 4=ring, 6=weapon, 7=consumable
  let slot: keyof Equipment | null = null
  if (item.type === 'weapon') slot = 'weapon'
  else if (item.type === 'helm') slot = 'helm'
  else if (item.type === 'armor') slot = 'armor'
  else if (item.type === 'boots' || item.type === 'ring') slot = 'accessory'
  // Consumables can't be equipped (they're used, not worn)

  if (!slot) return false

  // Unequip current item in that slot (if any) and add to inventory
  const currentEquippedId = player.equipment[slot]
  if (currentEquippedId !== null) {
    player.inventory.push(currentEquippedId)
  }

  // Equip the new item
  player.equipment[slot] = itemId

  // Remove from inventory
  player.inventory.splice(itemIndex, 1)

  return true
}

/**
 * Unequip an item and return to inventory
 * Costs 1 action point
 *
 * Checks:
 * - Equipment slot has an item equipped
 * - Inventory has room (max 20 items)
 *
 * @returns true if unequip was successful, false otherwise
 */
export function unequipItem(player: GameState['players'][0], slot: keyof Equipment): boolean {
  if (!player) return false

  const equippedId = player.equipment[slot]
  if (equippedId === null) return false

  // Check inventory limit before unequipping
  if (player.inventory.length >= 20) return false

  // Move to inventory
  player.inventory.push(equippedId)
  player.equipment[slot] = null

  return true
}
