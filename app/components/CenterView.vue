<template>
  <div class="center-view">
    <template v-if="currentPlayer && currentSquare">
      <InventoryView v-if="centerView === 'inventory'" />

      <template v-else>
        <div class="center-view__location">
          <h2 class="center-view__title">{{ $t(`land.${currentSquare.landKey}`) }}</h2>
          <p class="center-view__subtitle">
            {{ $t('ui.day') }} {{ gameState!.currentDay }}
            &middot;
            {{ $t(`ui.${gameState!.timeOfDay}`) }}
          </p>
        </div>

        <div class="center-view__actions">
          <button class="action-btn">{{ $t('action.move') }}</button>
          <button class="action-btn">{{ $t('action.rest') }}</button>
          <button class="action-btn" @click="centerView = 'inventory'">
            {{ $t('ui.inventory') }}
          </button>
          <button class="action-btn" @click="endTurn">{{ $t('ui.endTurn') }}</button>
        </div>
      </template>
    </template>

    <template v-else>
      <p class="center-view__empty">{{ $t('ui.gameTitle') }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
const { gameState, centerView, endTurn, currentPlayer, currentSquare } = useGameState()
</script>

<style scoped>
.center-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1.5rem;
  padding: 1.5rem;
  color: #4a4035;
}

.center-view__location {
  text-align: center;
}

.center-view__title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #3d3029;
}

.center-view__subtitle {
  font-size: 0.85rem;
  color: #8a7e6e;
  margin: 0.25rem 0 0;
}

.center-view__actions {
  display: flex;
  gap: 0.75rem;
}

.center-view__empty {
  font-size: 1.25rem;
  color: #8a7e6e;
}

.action-btn {
  padding: 0.4rem 1rem;
  border: 1px solid #c4b899;
  background: #f5f0e6;
  color: #4a4035;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.action-btn:hover {
  background: #ebe4d4;
}
</style>
