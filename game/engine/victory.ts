import type { PlayerState } from '../types/player'
import type { BoardSquare } from '../types/board'

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

/** Handle player death: mark dead, release all lands to neutral (owner=0). */
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
      return { ...sq, owner: 0, mana: { ...sq.mana } }
    }
    return { ...sq, mana: { ...sq.mana } }
  })

  return { newPlayer, newBoard }
}
