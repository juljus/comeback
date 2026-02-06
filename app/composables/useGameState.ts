import type { GameState } from '~~/game/types'
import { createRng, generateBoard, createPlayer } from '~~/game/engine'

const gameState = ref<GameState | null>(null)

export function useGameState() {
  function startNewGame(playerNames: string[]) {
    const rng = createRng(Date.now())
    const board = generateBoard(rng)
    const players = playerNames.map((name, i) => createPlayer(i + 1, name, 'male'))

    gameState.value = {
      players,
      board,
      effects: [],
      currentPlayerIndex: 0,
      currentDay: 1,
      timeOfDay: 'morning',
      turn: 1,
    }
  }

  const currentPlayer = computed(() =>
    gameState.value ? gameState.value.players[gameState.value.currentPlayerIndex] : null,
  )

  const currentSquare = computed(() =>
    gameState.value && currentPlayer.value
      ? gameState.value.board[currentPlayer.value.position]
      : null,
  )

  return {
    gameState,
    startNewGame,
    currentPlayer,
    currentSquare,
  }
}
