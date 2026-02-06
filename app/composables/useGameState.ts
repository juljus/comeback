import type { GameState } from '~~/game/types'
import { createRng, generateBoard, createPlayer } from '~~/game/engine'

type CenterView = 'location' | 'inventory'

const gameState = ref<GameState | null>(null)
const centerView = ref<CenterView>('location')

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

  function endTurn() {
    if (!gameState.value) return
    const state = gameState.value
    const alivePlayers = state.players.filter((p) => p.alive)
    if (alivePlayers.length === 0) return

    let nextIndex = state.currentPlayerIndex
    do {
      nextIndex = (nextIndex + 1) % state.players.length
    } while (!state.players[nextIndex]!.alive)

    const wrapped = nextIndex <= state.currentPlayerIndex
    state.currentPlayerIndex = nextIndex
    state.players[nextIndex]!.actionsUsed = 0
    state.timeOfDay = 'morning'

    if (wrapped) {
      state.currentDay++
    }

    centerView.value = 'location'
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
    centerView,
    startNewGame,
    endTurn,
    currentPlayer,
    currentSquare,
  }
}
