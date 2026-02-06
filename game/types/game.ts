import type { TimeOfDay } from './enums'
import type { ActiveEffect } from './effect'
import type { BoardSquare } from './board'
import type { PlayerState } from './player'

/** Top-level runtime game state */
export type GameState = {
  players: PlayerState[]
  board: BoardSquare[]
  effects: ActiveEffect[]
  currentPlayerIndex: number
  currentDay: number
  timeOfDay: TimeOfDay
  turn: number
}
