<template>
  <div class="game-page">
    <GameBoard
      v-if="gameState"
      :board="gameState.board"
      :players="gameState.players"
      :current-player-id="currentPlayer?.id ?? 0"
    />
    <div v-else class="game-page__empty">
      <p>{{ $t('ui.noGame') }}</p>
      <NuxtLink to="/" class="game-page__link">{{ $t('ui.newGame') }}</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { gameState, currentPlayer } = useGameState()
</script>

<style scoped>
.game-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
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
