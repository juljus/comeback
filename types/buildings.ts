/**
 * Building definition
 *
 * Buildings can be constructed on owned land.
 * They provide bonuses, unlock spells, and allow hiring mercenaries.
 */

export interface Building {
  /** Unique identifier (row index from original data) */
  id: number

  /** Display names */
  name: {
    en: string
    et: string
  }

  /** Construction cost in gold */
  cost: number

  /**
   * Buildings that must be built first (building names)
   * Empty strings if no prerequisites
   */
  prerequisites: string[]

  /** Spells granted when this building is constructed */
  grantsSpells: string[]

  /** Mercenary types that can be hired from this building */
  unlocksMercenaries: string[]
}

/**
 * Building categories based on function
 */
export type BuildingCategory =
  | 'fortification'  // Fort, Citadel, Castle
  | 'altar'          // Fire Altar, Earth Altar, etc.
  | 'temple'         // Fire Temple, Life Temple, etc.
  | 'military'       // Barracks, Stables, etc.
  | 'economic'       // Treasury, Bank
  | 'utility'        // Sanctuary, Fighting Pit

/**
 * Fortification levels
 * Higher levels provide better defense bonuses
 */
export const FORTIFICATION_LEVELS = ['Fort', 'Citadel', 'Castle'] as const
export type FortificationLevel = (typeof FORTIFICATION_LEVELS)[number]
