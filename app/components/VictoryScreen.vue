<template>
  <div v-if="victoryResult" class="victory-screen">
    <template v-if="victoryResult.state === 'victory'">
      <h2 class="victory-screen__title">{{ $t('ui.victoryTitle', { name: winnerName }) }}</h2>
    </template>
    <template v-else-if="victoryResult.state === 'draw'">
      <h2 class="victory-screen__title">{{ $t('ui.drawTitle') }}</h2>
      <p class="victory-screen__message">{{ $t('ui.drawMessage') }}</p>
    </template>

    <button class="victory-screen__btn" @click="startNewGameFromVictory">
      {{ $t('ui.newGameBtn') }}
    </button>
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()

const { gameState, victoryResult, startNewGameFromVictory } = useGameState()

const winnerName = computed(() => {
  const result = victoryResult.value
  if (!result || result.state !== 'victory' || !gameState.value) return ''
  const winner = gameState.value.players.find((p) => p.id === result.winnerId)
  return winner?.name ?? ''
})
</script>

<style scoped>
.victory-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #4a4035;
}

.victory-screen__title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #3d3029;
}

.victory-screen__message {
  font-size: 0.85rem;
  color: #8a7e6e;
  margin: 0;
}

.victory-screen__btn {
  padding: 0.5rem 1.5rem;
  border: 1px solid #c4b899;
  background: #f5f0e6;
  color: #4a4035;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.victory-screen__btn:hover {
  background: #ebe4d4;
}
</style>
