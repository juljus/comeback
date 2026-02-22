<template>
  <div class="game-page">
    <template v-if="gameState">
      <GameBoard
        :board="gameState.board"
        :players="gameState.players"
        :current-player-id="currentPlayer?.id ?? 0"
        :selected-index="selectedSquareIndex"
        @select-square="selectSquare"
      />
    </template>
    <div v-else class="game-page__empty">
      <p>{{ $t('ui.noGame') }}</p>
      <NuxtLink to="/" class="game-page__link">{{ $t('ui.newGame') }}</NuxtLink>
    </div>

    <BugReportFab @click="showBugReport = true" />
    <BugReportModal
      :visible="showBugReport"
      :game-state="gameState"
      @close="showBugReport = false"
    />
  </div>
</template>

<script setup lang="ts">
const showBugReport = ref(false)
const { gameState, currentPlayer, selectedSquareIndex, selectSquare, loadDevState } = useGameState()

onMounted(async () => {
  if (import.meta.dev && !gameState.value) {
    await loadDevState()
  }
})
</script>

<style scoped>
.game-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
  gap: 0.75rem;
  background: #f5f0e6;
}

.game-page__empty {
  text-align: center;
  color: #6b5e50;
}

.game-page__link {
  color: #8b6914;
  text-decoration: underline;
}
</style>
