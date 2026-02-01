/**
 * Pure utility and helper functions for the game store
 * These are extracted from game.ts and can be used across modules
 *
 * Functions are pure (no store mutations) and reusable.
 * All data lookups use imported schemas.
 */

import {
  // Validated data exports
  lands as landsData,
  items as itemsData,
  spells as spellsData,
  events as eventsData,
  // Helper functions
  getMobByName,
  getSpellByName,
  // Types
  type LandType,
  type ItemType,
  type SpellType,
  type EventType,
  type ManaType,
  type ManaPool,
} from '~/data/schemas'

import type {
  Player,
  BoardSquare,
  Equipment,
  ActionPhase,
  PlayerTitle,
} from './types'

/**
 * King's Gift value ranges by title
 */
const KINGS_GIFT_VALUE_RANGES: Record<'baron' | 'count' | 'duke', { min: number; max: number }> = {
  baron: { min: 50, max: 120 },
  count: { min: 121, max: 300 },
  duke: { min: 301, max: 1000 },
}

/**
 * Land price multiplier
 * Base prices in lands.json are multiplied by this for actual purchase cost
 * Verified: game_map.csv shows ~10x base prices (Desert 4→40, Volcano 25→250)
 */
const LAND_PRICE_MULTIPLIER = 10

/**
 * Max stat cap for STR and DEX training
 * Verified from VBA lines 17608, 17614
 */
export const MAX_TRAINING_STAT_CAP = 6

// ============================================================================
// BOARD GENERATION HELPERS
// ============================================================================

/**
 * Generate a random game board
 * First square is always Royal Court, rest are random land types
 */
export function generateBoard(): BoardSquare[] {
  const board: BoardSquare[] = []

  if (landsData.length === 0) {
    throw new Error('No land types loaded')
  }

  // Find Royal Court / Palace
  const royalCourt = landsData.find(l =>
    l.isRoyalCourt === true ||
    l.name.long.en === 'Royal Court' ||
    l.name.long.et === 'Palee'
  ) ?? landsData[0]!

  // Separate utility and territory lands
  const utilityLands = landsData.filter(l => l.isUtility && l.spawnChance > 0)
  const territoryLands = landsData.filter(l => !l.isUtility && l.spawnChance > 0)

  // First square is always Royal Court
  board.push(createSquare(0, royalCourt))

  // Generate remaining 33 squares
  // Mix of utility (shops, etc.) and territory lands
  const targetUtilityCount = 8 // Roughly how many utility lands we want
  const targetTerritoryCount = 25

  // Create weighted pools
  const utilityPool = createWeightedPool(utilityLands)
  const territoryPool = createWeightedPool(territoryLands)

  // Distribute lands
  const landSequence: LandType[] = []

  // Add utility lands
  for (let i = 0; i < targetUtilityCount && utilityPool.length > 0; i++) {
    const land = pickFromPool(utilityPool)
    if (land) landSequence.push(land)
  }

  // Add territory lands
  for (let i = 0; i < targetTerritoryCount && territoryPool.length > 0; i++) {
    const land = pickFromPool(territoryPool)
    if (land) landSequence.push(land)
  }

  // Shuffle the sequence
  shuffleArray(landSequence)

  // Create board squares
  for (let i = 0; i < landSequence.length && board.length < 34; i++) {
    const land = landSequence[i]
    if (land) board.push(createSquare(board.length, land))
  }

  // Calculate coordinates for display (rectangular track like Monopoly)
  // Layout: 11 squares on top, 6 on right, 11 on bottom, 6 on left = 34 total
  const TOP_COUNT = 11
  const RIGHT_COUNT = 6
  const BOTTOM_COUNT = 11
  const LEFT_COUNT = 6

  for (let i = 0; i < board.length; i++) {
    const square = board[i]
    if (!square) continue

    let x: number, y: number

    if (i < TOP_COUNT) {
      // Top row: left to right
      x = (i / (TOP_COUNT - 1)) * 100
      y = 0
    } else if (i < TOP_COUNT + RIGHT_COUNT) {
      // Right column: top to bottom
      const idx = i - TOP_COUNT
      x = 100
      y = ((idx + 1) / (RIGHT_COUNT + 1)) * 100
    } else if (i < TOP_COUNT + RIGHT_COUNT + BOTTOM_COUNT) {
      // Bottom row: right to left
      const idx = i - TOP_COUNT - RIGHT_COUNT
      x = 100 - (idx / (BOTTOM_COUNT - 1)) * 100
      y = 100
    } else {
      // Left column: bottom to top
      const idx = i - TOP_COUNT - RIGHT_COUNT - BOTTOM_COUNT
      x = 0
      y = 100 - ((idx + 1) / (LEFT_COUNT + 1)) * 100
    }

    square.coords = { x, y }
  }

  return board
}

/**
 * Create a board square from a land type
 */
export function createSquare(index: number, land: LandType): BoardSquare {
  // Get first defender (tier 1)
  const defender = land.defenders[0]

  return {
    index,
    landTypeId: land.id,
    name: land.name.long.en || land.name.short.en,
    owner: null,
    defenderId: defender ? getMobIdByName(defender) : null,
    defenderTier: 1,
    defenderCurrentHp: null, // Will be set to actual HP when combat starts
    coords: { x: 0, y: 0 },
    isUtility: land.isUtility,
    incomeBonus: 0,
    healingBonus: 0,
    buildings: [],
    fortificationLevel: 0,
    archerCount: 0,
    reinforcedThisTurn: false,
    attackedThisTurn: false,
  }
}

/**
 * Create a weighted pool based on spawn chances
 */
export function createWeightedPool(lands: LandType[]): LandType[] {
  const pool: LandType[] = []
  for (const land of lands) {
    // Add land multiple times based on spawn chance
    const count = Math.ceil(land.spawnChance / 10)
    for (let i = 0; i < count; i++) {
      pool.push(land)
    }
  }
  return pool
}

/**
 * Pick and remove a random item from pool
 */
export function pickFromPool(pool: LandType[]): LandType | undefined {
  if (pool.length === 0) return undefined
  const index = Math.floor(Math.random() * pool.length)
  return pool.splice(index, 1)[0]
}

/**
 * Fisher-Yates shuffle
 */
export function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]
    const swapItem = array[j]
    if (temp !== undefined && swapItem !== undefined) {
      array[i] = swapItem
      array[j] = temp
    }
  }
}

// ============================================================================
// MOB AND ITEM LOOKUPS
// ============================================================================

/**
 * Get mob ID by name
 */
export function getMobIdByName(name: string): number | null {
  const mob = getMobByName(name)
  return mob?.id ?? null
}

/**
 * Get item by ID
 */
export function getItemById(id: number): ItemType | undefined {
  return itemsData.find(i => i.id === id)
}

/**
 * Get shop inventory based on shop type
 * VBA shop mechanics (lines 3032-3080):
 * - Shop (id 1): Item types 4-9, value 25-10000
 * - Smithy (id 2): Item types 1-6 (weapons/armor focused)
 * - Bazaar (id 3): All types, value 25-400 gold max
 */
export function getShopInventory(landTypeId: number): ItemType[] {
  const SHOP_LAND_ID = 1
  const SMITHY_LAND_ID = 2
  const BAZAAR_LAND_ID = 3

  switch (landTypeId) {
    case SHOP_LAND_ID:
      // Shop: VBA value range 25-10000 (line 3044-3046)
      return itemsData.filter(i => i.value >= 25 && i.value <= 10000)

    case SMITHY_LAND_ID:
      // Smithy: Weapons and armor only (VBA types 1-6)
      return itemsData.filter(i => i.type === 'weapon' || i.type === 'armor')

    case BAZAAR_LAND_ID:
      // Bazaar: Random selection, max 400 gold (VBA line 3054-3057)
      const bazaarItems = itemsData.filter(i => i.value >= 25 && i.value <= 400)
      // Shuffle and return up to 10 items
      const shuffled = [...bazaarItems]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = shuffled[i]
        const other = shuffled[j]
        if (temp && other) {
          shuffled[i] = other
          shuffled[j] = temp
        }
      }
      return shuffled.slice(0, 10)

    default:
      return []
  }
}

/**
 * Generate 3 random items for King's Gift based on title
 * - Baron (3 lands): Items worth 50-120 gold
 * - Count (9 lands): Items worth 121-300 gold
 * - Duke (15 lands): Items worth 301-1000 gold
 */
export function generateKingsGiftOptions(title: 'baron' | 'count' | 'duke'): ItemType[] {
  const range = KINGS_GIFT_VALUE_RANGES[title]

  // Filter items within the value range for this title
  const eligibleItems = itemsData.filter(item =>
    item.value >= range.min && item.value <= range.max
  )

  // If we don't have enough eligible items, return what we have
  if (eligibleItems.length <= 3) {
    return eligibleItems
  }

  // Shuffle the eligible items using Fisher-Yates
  const shuffled = [...eligibleItems]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]
    const other = shuffled[j]
    if (temp && other) {
      shuffled[i] = other
      shuffled[j] = temp
    }
  }

  // Return the first 3 items
  return shuffled.slice(0, 3)
}

// ============================================================================
// DAMAGE AND COMBAT HELPERS
// ============================================================================

/**
 * Roll damage dice
 */
export function rollDamage(diceCount: number, diceSides: number, bonus: number = 0): number {
  let total = bonus
  for (let i = 0; i < diceCount; i++) {
    total += Math.floor(Math.random() * diceSides) + 1
  }
  return total
}

/**
 * Check if a status effect is resisted based on immunity value.
 * @param immunityValue - 0-100, percentage chance to resist
 * @returns true if effect is resisted
 */
export function checkImmunity(immunityValue: number): boolean {
  if (immunityValue <= 0) return false
  if (immunityValue >= 100) return true
  return Math.random() * 100 < immunityValue
}

/**
 * Calculate damage reduction from elemental resistance.
 * @param damage - raw damage
 * @param resistanceValue - 0-100, percentage reduction
 * @returns reduced damage (minimum 0)
 */
export function applyResistance(damage: number, resistanceValue: number): number {
  if (resistanceValue <= 0) return damage
  if (resistanceValue >= 100) return 0
  return Math.max(0, Math.floor(damage * (1 - resistanceValue / 100)))
}

/**
 * Check for critical hit based on damage type (from VBA research)
 *
 * Critical roll function: weighted random where roll = random(0 to attacker_value + defender_value)
 * If roll < attacker_value then critical succeeds.
 *
 * Pierce: attacker DEX vs defender DEX+5
 * Slash: (attacker STR + DEX/2) vs defender DEX+3
 * Crush: attacker STR*2 vs defender DEX^3+2
 */
export function checkCriticalHit(
  damageType: 'pierce' | 'slash' | 'crush',
  attackerStrength: number,
  attackerDexterity: number,
  defenderDexterity: number
): boolean {
  let attackerValue: number
  let defenderValue: number

  switch (damageType) {
    case 'pierce':
      // Pierce: attacker DEX vs defender DEX+5
      attackerValue = attackerDexterity
      defenderValue = defenderDexterity + 5
      break
    case 'slash':
      // Slash: (attacker STR + DEX/2) vs defender DEX+3
      attackerValue = attackerStrength + Math.floor(attackerDexterity / 2)
      defenderValue = defenderDexterity + 3
      break
    case 'crush':
      // Crush: attacker STR*2 vs defender DEX^3+2
      // Note: DEX^3 would be extremely high (e.g., DEX 3 = 27), so crush crits are rare
      attackerValue = attackerStrength * 2
      defenderValue = Math.pow(defenderDexterity, 3) + 2
      break
    default:
      return false
  }

  // Weighted random roll: if roll < attacker_value, critical succeeds
  const totalRange = attackerValue + defenderValue
  const roll = Math.floor(Math.random() * totalRange)

  return roll < attackerValue
}

// ============================================================================
// AI HELPERS
// ============================================================================

/**
 * Check if defender should attempt to flee based on bravery and HP
 * VBA: check_AI_flee (line 11826-11853)
 *
 * Flee is attempted when:
 * - Bravery < 10 (bravery 10 = utterly brave, never flees)
 * - HP percentage < (100 - bravery * 10)
 *   - Bravery 0: flees at any HP
 *   - Bravery 5: flees below 50% HP
 *   - Bravery 9: flees below 10% HP
 */
export function shouldDefenderFlee(
  bravery: number,
  currentHp: number,
  maxHp: number
): boolean {
  // Bravery 10 = never flee
  if (bravery >= 10) return false

  const hpPercent = (currentHp / maxHp) * 100
  const fleeThreshold = 100 - (bravery * 10)

  return hpPercent < fleeThreshold
}

/**
 * Calculate flee success using DEX-based formula
 * VBA: hit_fleeing (line 12556)
 *
 * Formula:
 * - Base flee bonus: 2
 * - Base chase bonus: 1
 * - DEX difference adds (1 + |diff|)² to the appropriate side
 * - Success: random(1, total) > chaser_bonus
 */
export function attemptFlee(
  defenderDex: number,
  attackerDex: number
): { success: boolean; roll: number; needed: number } {
  let fleeBonus = 2
  let chaseBonus = 1

  const dexDiff = defenderDex - attackerDex

  if (dexDiff > 0) {
    // Defender is faster, add to flee bonus
    fleeBonus += Math.pow(1 + dexDiff, 2)
  } else if (dexDiff < 0) {
    // Attacker is faster, add to chase bonus
    chaseBonus += Math.pow(1 + Math.abs(dexDiff), 2)
  }

  const total = fleeBonus + chaseBonus
  const roll = Math.floor(Math.random() * total) + 1

  // Flee succeeds if roll > chase bonus
  return {
    success: roll > chaseBonus,
    roll,
    needed: chaseBonus + 1,
  }
}

/**
 * Select a spell for the defender to cast
 * VBA: check_for_mob_spells (line 10558-10626)
 *
 * AI logic:
 * - Build list of spells with sufficient mana
 * - Prefer highest base damage spell
 * - Return null if no valid spells
 */
export function selectDefenderSpell(
  spellNames: string[],
  mana: ManaPool,
  _power: number // Not used yet but available for future AI improvements
): SpellType | null {
  if (spellNames.length === 0) return null

  const validSpells: SpellType[] = []

  for (const spellName of spellNames) {
    const spell = getSpellByName(spellName)
    if (!spell) continue

    // Check if defender has enough mana
    const manaType = spell.manaType as keyof ManaPool
    if (mana[manaType] >= spell.manaCost) {
      validSpells.push(spell)
    }
  }

  if (validSpells.length === 0) return null

  // Select spell with highest base power (baseDamage in VBA)
  // For now, simple highest damage selection
  validSpells.sort((a, b) => b.basePower - a.basePower)

  return validSpells[0] ?? null
}

// ============================================================================
// LAND UTILITIES
// ============================================================================

/**
 * Get land type data by ID
 */
export function getLandType(id: number): LandType | undefined {
  return landsData.find(l => l.id === id)
}

/**
 * Get actual land purchase price (base price × multiplier)
 */
export function getLandPrice(landType: LandType): number {
  return landType.price * LAND_PRICE_MULTIPLIER
}

/**
 * Get cost to upgrade defender to next tier
 * Formula from VBA:
 * - Tier 1->2: merc_tier * 4 * 1
 * - Tier 2->3: merc_tier * 4 * 2
 * - Tier 3->4: merc_tier * 5 * 3
 * Where merc_tier comes from the NEXT defender mob's data
 */
export function getDefenderUpgradeCost(square: BoardSquare): number {
  const currentTier = square.defenderTier
  if (currentTier >= 4) return 0 // Already at max tier

  const landType = getLandType(square.landTypeId)
  if (!landType) return 0

  // Get the next defender name (next tier = currentTier, since array is 0-indexed)
  const nextDefenderName = landType.defenders[currentTier]
  if (!nextDefenderName) return 0

  // Look up the mob's merc_tier
  const nextDefender = getMobByName(nextDefenderName)
  if (!nextDefender) return 0

  const mercTier = nextDefender.mercTier

  // Apply formula based on which tier upgrade this is
  switch (currentTier) {
    case 1: return mercTier * 4 * 1 // Tier 1->2
    case 2: return mercTier * 4 * 2 // Tier 2->3
    case 3: return mercTier * 5 * 3 // Tier 3->4
    default: return 0
  }
}

/**
 * Get cost to improve land income
 * Cost increases with current income level
 * Note: Formula is unverified - using estimate
 */
export function getIncomeImproveCost(square: BoardSquare): number {
  const landType = getLandType(square.landTypeId)
  if (!landType) return 999999

  // Base cost + bonus cost
  // Estimate: 10 gold per existing income point
  const currentIncome = landType.taxIncome + square.incomeBonus
  return 10 + currentIncome * 5
}

/**
 * Calculate income improvement bonus based on VBA formula (line 2039):
 * income_bonus = Int((base_tax / 2 + 10) / 3 * (4 - current_phase))
 *
 * Where:
 * - base_tax is the land's base taxIncome (Game_map column 7)
 * - current_phase: 1=morning, 2=noon, 3=evening
 * - Max income is capped at base_tax * 3
 *
 * The income bonus decreases as the day progresses (more bonus if done in morning).
 */
export function calculateIncomeImprovement(
  landTypeId: number,
  currentIncomeBonus: number,
  actionPhase: ActionPhase
): number {
  const landType = getLandType(landTypeId)
  if (!landType) return 0

  const baseTax = landType.taxIncome

  // Convert action phase to numeric: morning=1, noon=2, evening=3
  const phaseNumber = actionPhase === 'morning' ? 1 : actionPhase === 'noon' ? 2 : 3

  // VBA formula: Int((base_tax / 2 + 10) / 3 * (4 - current_phase))
  const incomeBonus = Math.floor((baseTax / 2 + 10) / 3 * (4 - phaseNumber))

  // Calculate what the new total would be
  const newTotal = currentIncomeBonus + incomeBonus

  // Max income bonus is capped at base_tax * 3
  const maxBonus = baseTax * 3
  const cappedBonus = Math.min(newTotal, maxBonus) - currentIncomeBonus

  // Return the actual increase (may be less than calculated if at cap)
  return Math.max(0, cappedBonus)
}

/**
 * Get total income from a land (base + bonus)
 */
export function getLandIncome(square: BoardSquare): number {
  const landType = getLandType(square.landTypeId)
  if (!landType) return 0
  return landType.taxIncome + square.incomeBonus
}

// ============================================================================
// EVENT HELPERS
// ============================================================================

/**
 * Select a random event based on location and weighted odds
 * VBA: vali_event() line 17920
 */
export function selectRandomEvent(location: 'cave' | 'dungeon' | 'treasureIsland'): EventType | null {
  // Filter events that are enabled for this location and build weighted pool
  const eligibleEvents: { event: EventType; chance: number }[] = []

  for (const event of eventsData) {
    const locationConfig = event.locations[location]
    if (locationConfig?.enabled && locationConfig.chance > 0) {
      eligibleEvents.push({ event, chance: locationConfig.chance })
    }
  }

  if (eligibleEvents.length === 0) return null

  // Calculate total weight
  const totalWeight = eligibleEvents.reduce((sum, e) => sum + e.chance, 0)

  // Random selection based on weight
  let random = Math.random() * totalWeight
  for (const { event, chance } of eligibleEvents) {
    random -= chance
    if (random <= 0) {
      return event
    }
  }

  // Fallback to first eligible event
  return eligibleEvents[0]?.event ?? null
}

// ============================================================================
// PLAYER STAT HELPERS
// ============================================================================

/**
 * Calculate total player stats including equipment bonuses
 */
export function getPlayerTotalStats(player: Player): {
  hp: number
  maxHp: number
  strength: number
  dexterity: number
  power: number
  armor: number
  strikes: number
} {
  let bonusHp = 0
  let bonusStrength = 0
  let bonusDexterity = 0
  let bonusPower = 0
  let bonusArmor = 0
  let bonusStrikes = 0

  // Add equipment bonuses
  const slots: (keyof Equipment)[] = ['weapon', 'armor', 'helm', 'accessory']
  for (const slot of slots) {
    const itemId = player.equipment[slot]
    if (itemId !== null) {
      const item = getItemById(itemId)
      if (item) {
        bonusHp += item.bonuses.hp
        bonusStrength += item.bonuses.strength
        bonusDexterity += item.bonuses.dexterity
        bonusPower += item.bonuses.power
        bonusArmor += item.bonuses.armor
        bonusStrikes += item.bonuses.strikes
      }
    }
  }

  // Add buff bonuses
  for (const buff of player.buffs) {
    switch (buff.type) {
      case 'armor':
        bonusArmor += buff.power
        break
      case 'strength':
        bonusStrength += buff.power
        break
      case 'haste':
        // Haste adds to strikes (attacks per round)
        bonusStrikes += buff.power
        break
    }
  }

  // Base armor from strength (every 4th point)
  const baseArmor = Math.floor((player.stats.strength + bonusStrength) / 4)

  return {
    hp: player.hp,
    maxHp: player.maxHp + bonusHp,
    strength: player.stats.strength + bonusStrength,
    dexterity: player.stats.dexterity + bonusDexterity,
    power: player.stats.power + bonusPower,
    armor: baseArmor + bonusArmor,
    strikes: 1 + Math.floor((player.stats.dexterity + bonusDexterity) / 5) + bonusStrikes,
  }
}

/**
 * Get weapon damage dice for a player
 * Includes STR-based damage bonus from VBA formula:
 * - If STR >= required: bonus = strength - weapon_required_strength
 * - If STR < required: bonus = 2 * (strength - required) (double penalty!)
 */
export function getPlayerWeaponDamage(player: Player): { diceCount: number; diceSides: number; bonus: number; damageType: string } {
  const weaponId = player.equipment.weapon

  // Calculate total strength including equipment bonuses
  let totalStrength = player.stats.strength
  const slots: (keyof Equipment)[] = ['weapon', 'armor', 'helm', 'accessory']
  for (const slot of slots) {
    const itemId = player.equipment[slot]
    if (itemId !== null) {
      const item = getItemById(itemId)
      if (item) {
        totalStrength += item.bonuses.strength
      }
    }
  }

  // Add strength buff bonuses
  for (const buff of player.buffs) {
    if (buff.type === 'strength') {
      totalStrength += buff.power
    }
  }

  if (weaponId !== null) {
    const weapon = getItemById(weaponId)
    if (weapon?.weapon) {
      // Calculate STR bonus/penalty
      const requiredStr = weapon.requiredStrength
      let strBonus: number

      if (totalStrength >= requiredStr) {
        // Bonus = STR - required (1 damage per point above requirement)
        strBonus = totalStrength - requiredStr
      } else {
        // Penalty = 2 * (STR - required) = double penalty for being under requirement!
        strBonus = 2 * (totalStrength - requiredStr)
      }

      return {
        diceCount: weapon.weapon.diceCount,
        diceSides: weapon.weapon.diceSides,
        bonus: strBonus,
        damageType: weapon.weapon.damageType,
      }
    }
  }
  // Unarmed: 1d[STR] damage (VBA lines 15449-15452)
  return { diceCount: 1, diceSides: totalStrength, bonus: 0, damageType: 'crush' }
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get title display name
 */
export function getTitleDisplayName(title: PlayerTitle): string {
  const names: Record<PlayerTitle, string> = {
    commoner: 'Commoner',
    baron: 'Baron',
    count: 'Count',
    duke: 'Duke',
  }
  return names[title]
}

/**
 * Get arcane mana from Arcane Towers based on count
 * Verified from VBA tower_check() at line 3844:
 * - 1 tower: +1 (total 1)
 * - 2 towers: +2 (total 3)
 * - 3 towers: +3 (total 6)
 * - 4 towers: +6 (total 12)
 *
 * Note: help.csv says 4 towers = 10, but VBA code calculates 12.
 * Following VBA implementation for faithful port.
 */
export function getArcaneTowerMana(towerCount: number): number {
  const manaByCount = [0, 1, 3, 6, 12]
  return manaByCount[Math.min(towerCount, 4)] ?? 12
}

/**
 * Get all valid spells (filters out corrupted entries)
 */
export function getAllSpells(): SpellType[] {
  // Filter out corrupted entries (ID 37, 38 have invalid data)
  return spellsData.filter(s => s.name.et && s.name.et.length > 0 && !s.name.et.match(/^\d+$/))
}

/**
 * Get mana type display name
 */
export function getManaTypeName(manaType: ManaType): string {
  const names: Record<ManaType, string> = {
    fire: 'Fire',
    earth: 'Earth',
    air: 'Air',
    water: 'Water',
    death: 'Death',
    life: 'Life',
    arcane: 'Arcane',
  }
  return names[manaType]
}

/**
 * Get mana type color for UI display
 * Verified from help.csv lines 46-73
 */
export function getManaTypeColor(manaType: ManaType): string {
  const colors: Record<ManaType, string> = {
    fire: '#ef4444',    // punane (red)
    earth: '#a3e635',   // roheline (green/lime)
    air: '#38bdf8',     // helesinine (light blue) - fixed from yellow
    water: '#3b82f6',   // tumesinine (dark blue)
    death: '#6b7280',   // sinakashall (grayish-blue)
    life: '#f9fafb',    // valge (white)
    arcane: '#fbbf24',  // kuldne (golden) - fixed from purple
  }
  return colors[manaType]
}

/**
 * Calculate training cost for a stat
 * Formula: current_stat² * 5 (verified from VBA)
 * Examples: 2→3 costs 20g, 3→4 costs 45g, 4→5 costs 80g, 5→6 costs 125g
 */
export function getTrainingCost(currentStatValue: number): number {
  return currentStatValue * currentStatValue * 5
}
