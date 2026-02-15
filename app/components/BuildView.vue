<template>
  <div v-if="currentPlayer" class="build-view">
    <h3 class="build-view__title">{{ $t('ui.buildTitle') }}</h3>
    <div class="build-view__gold">{{ currentPlayer.gold }} {{ $t('ui.gold') }}</div>

    <div class="build-view__list">
      <p v-if="availableBuildings.length === 0" class="build-view__empty">
        {{ $t('ui.noBuildingsAvailable') }}
      </p>
      <div v-for="b in availableBuildings" :key="b.key" class="build-view__item">
        <div class="build-view__item-info">
          <span class="build-view__item-name">{{ $t(`building.${b.key}`) }}</span>
          <span v-if="!b.isBuilt" class="build-view__item-cost">
            {{ $t('ui.buildCost', { cost: b.cost }) }}
          </span>
        </div>
        <span v-if="b.isBuilt" class="build-view__built">{{ $t('ui.buildBuilt') }}</span>
        <button
          v-else
          class="build-view__build-btn"
          :disabled="!b.canBuild"
          :title="b.reason ?? ''"
          @click="constructBuilding(b.key)"
        >
          {{ $t('ui.build') }}
        </button>
      </div>
    </div>

    <button class="build-view__close" @click="closeBuildMenu">{{ $t('ui.close') }}</button>
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const { currentPlayer, availableBuildings, constructBuilding, closeBuildMenu } = useGameState()
</script>

<style scoped>
.build-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  color: #4a4035;
  width: 100%;
  max-height: 100%;
  overflow: hidden;
}

.build-view__title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: #3d3029;
}

.build-view__gold {
  font-size: 0.75rem;
  font-weight: 600;
  color: #8b6914;
}

.build-view__list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
  max-width: 18rem;
  overflow-y: auto;
  max-height: 10rem;
  padding: 0 0.5rem;
}

.build-view__empty {
  font-size: 0.75rem;
  color: #8a7e6e;
  text-align: center;
  margin: 0;
}

.build-view__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  gap: 0.5rem;
}

.build-view__item-info {
  display: flex;
  flex-direction: column;
}

.build-view__item-name {
  color: #3d3029;
}

.build-view__item-cost {
  font-size: 0.65rem;
  color: #8a7e6e;
}

.build-view__built {
  font-size: 0.7rem;
  color: #6a9a3a;
  font-weight: 600;
}

.build-view__build-btn {
  padding: 0.2rem 0.5rem;
  border: 1px solid #c4b899;
  background: #f5f0e6;
  color: #4a4035;
  font-size: 0.7rem;
  cursor: pointer;
  transition: background-color 0.15s;
  white-space: nowrap;
}

.build-view__build-btn:hover:not(:disabled) {
  background: #ebe4d4;
}

.build-view__build-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.build-view__close {
  padding: 0.3rem 0.8rem;
  border: 1px solid #c4b899;
  background: #f5f0e6;
  color: #4a4035;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.15s;
  margin-top: 0.25rem;
}

.build-view__close:hover {
  background: #ebe4d4;
}
</style>
