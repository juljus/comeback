/**
 * Land/Terrain type definition
 *
 * Lands make up the game board. Each land type has defenders,
 * produces specific mana, and allows certain buildings.
 */

export interface LandType {
  /** Unique identifier (row index from original data) */
  id: number

  /** Display names (short and long versions) */
  name: {
    short: { en: string; et: string }
    long: { en: string; et: string }
  }

  /** Purchase price in gold (0 = cannot be purchased, utility land) */
  price: number

  /** Gold income per turn when owned */
  taxIncome: number

  /** HP restored when resting on this land */
  healing: number

  /**
   * Defenders by tier (mob names)
   * Tier 1 is weakest, Tier 4 is strongest
   */
  defenders: [string, string, string, string]

  /** Chance to appear on randomly generated map (0-100) */
  spawnChance: number

  /** Buildings that can be constructed on this land type */
  availableBuildings: string[]

  /** Whether this is a utility land (shop, shrine, etc.) vs territory */
  isUtility: boolean
}

/**
 * Land categories
 */
export type LandCategory = 'utility' | 'territory'

/**
 * Mana production by land type
 * Territory lands produce specific mana types
 */
export const LAND_MANA_PRODUCTION: Record<string, string> = {
  // Life mana
  Valley: 'life',
  Plain: 'life',

  // Earth mana
  Forest: 'earth',
  Brushland: 'earth',

  // Fire mana
  Hill: 'fire',
  Mountain: 'fire',

  // Air mana
  Desert: 'air',
  Rocks: 'air',

  // Water mana
  Jungle: 'water',
  Iceland: 'water',

  // Death mana
  Swamp: 'death',
  'Dark Forest': 'death',

  // No mana
  Highland: 'none',
  Barren: 'none',
  Tundra: 'none',
  Volcano: 'none',
  Burrows: 'none',
  Woodland: 'none',
}

/**
 * Utility land types (cannot be purchased, provide services)
 */
export const UTILITY_LANDS = [
  'Shop',
  'Smithy',
  'Bazaar',
  'Library',
  'Mage Guild',
  'Merc. Camp',
  'Training G.',
  'Shrine',
  'Arc. Tower',
  'Cave',
  'T. Island',
  'Dungeon',
] as const

export type UtilityLand = (typeof UTILITY_LANDS)[number]
