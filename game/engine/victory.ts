import type { PlayerState } from '../types/player'
import type { BoardSquare } from '../types/board'
import { LANDS, BUILDINGS } from '../data'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VictoryCheckResult =
  | { state: 'ongoing' }
  | { state: 'victory'; winnerId: number }
  | { state: 'draw' }

// ---------------------------------------------------------------------------
// checkVictoryCondition
// ---------------------------------------------------------------------------

/** Check victory condition: 0 alive = draw, 1 alive = victory, 2+ = ongoing. */
export function checkVictoryCondition(
  players: ReadonlyArray<{ alive: boolean; id: number }>,
): VictoryCheckResult {
  const alivePlayers = players.filter((p) => p.alive)

  if (alivePlayers.length === 0) {
    return { state: 'draw' }
  }

  if (alivePlayers.length === 1) {
    return { state: 'victory', winnerId: alivePlayers[0]!.id }
  }

  return { state: 'ongoing' }
}

// ---------------------------------------------------------------------------
// eliminatePlayer
// ---------------------------------------------------------------------------

/** Check if a building key corresponds to a mana-producing building. */
function isManaBuilding(buildingKey: string): boolean {
  const building = BUILDINGS[buildingKey as keyof typeof BUILDINGS]
  if (!building) return false
  const regen = building.manaRegen
  return (
    regen.fire + regen.earth + regen.air + regen.water + regen.death + regen.life + regen.arcane > 0
  )
}

/** Handle player death: mark dead, release all lands to neutral, reset fortifications and non-mana buildings. */
export function eliminatePlayer(params: { player: PlayerState; board: BoardSquare[] }): {
  newPlayer: PlayerState
  newBoard: BoardSquare[]
} {
  const { player, board } = params

  const newPlayer: PlayerState = {
    ...player,
    alive: false,
    ownedLands: [],
    equipment: { ...player.equipment },
    mana: { ...player.mana },
    manaRegen: { ...player.manaRegen },
    elementalDamage: { ...player.elementalDamage },
    inventory: [...player.inventory],
    companions: [...player.companions],
    spellbook: { ...player.spellbook },
  }

  const newBoard = board.map((sq) => {
    if (sq.owner === player.id) {
      const landDef = LANDS[sq.landKey as keyof typeof LANDS]
      const buildingKeys: readonly string[] = landDef ? landDef.buildings : []

      // Reset buildings, preserving only mana buildings
      const newBuildings = sq.buildings.map((built, i) => {
        if (!built) return false
        const bKey = buildingKeys[i]
        return bKey ? isManaBuilding(bKey) : false
      })

      return {
        ...sq,
        owner: 0,
        gateLevel: 0,
        archerySlots: 0,
        buildings: newBuildings,
        mana: { ...sq.mana },
      }
    }
    return { ...sq, mana: { ...sq.mana } }
  })

  return { newPlayer, newBoard }
}
