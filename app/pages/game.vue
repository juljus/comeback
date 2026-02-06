<template>
  <div class="game-page">
    <template v-if="gameState">
      <div class="game-page__players">
        <PlayerStats
          v-for="player in gameState.players"
          :key="player.id"
          :player="player"
          :is-active="player.id === currentPlayer?.id"
        />
      </div>
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
  </div>
</template>

<script setup lang="ts">
const { gameState, currentPlayer, selectedSquareIndex, selectSquare } = useGameState()
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

.game-page__players {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
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
