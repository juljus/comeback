<template>
  <div class="game-board">
    <BoardSquare
      v-for="(square, i) in board"
      :key="i"
      :square="square"
      :index="i"
      :players="players"
      :current-player-id="currentPlayerId"
      :style="gridPosition(i)"
      class="game-board__square"
    />
    <div class="game-board__center">
      <CenterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BoardSquare as BoardSquareType, PlayerState } from '~~/game/types'

defineProps<{
  board: BoardSquareType[]
  players: PlayerState[]
  currentPlayerId: number
}>()

/**
 * Map square index to CSS grid position.
 * Board is an 11x8 grid rectangle:
 *   Top:    sq 0-10  → row 1, cols 1-11 (left to right)
 *   Right:  sq 11-17 → col 11, rows 2-8 (top to bottom)
 *   Bottom: sq 18-27 → row 8, cols 10-1 (right to left)
 *   Left:   sq 28-33 → col 1, rows 7-2 (bottom to top)
 */
function gridPosition(index: number): Record<string, string> {
  let col: number
  let row: number

  if (index <= 10) {
    // Top row
    col = index + 1
    row = 1
  } else if (index <= 17) {
    // Right column
    col = 11
    row = index - 10 + 1
  } else if (index <= 27) {
    // Bottom row (right to left)
    col = 11 - (index - 17)
    row = 8
  } else {
    // Left column (bottom to top)
    col = 1
    row = 8 - (index - 27)
  }

  return {
    gridColumn: String(col),
    gridRow: String(row),
  }
}
</script>

<style scoped>
.game-board {
  display: grid;
  grid-template-columns: repeat(11, minmax(60px, 1fr));
  grid-template-rows: repeat(8, minmax(42px, 1fr));
  gap: 0;
  width: 100%;
  max-width: 900px;
  aspect-ratio: 11 / 8;
  margin: 0 auto;
}

.game-board__center {
  grid-column: 2 / 11;
  grid-row: 2 / 8;
  background: #f5f0e6;
  border: 1px solid #e0d8c8;
}
</style>
