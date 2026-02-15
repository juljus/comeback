<template>
  <div v-if="selectedSquare" class="land-preview">
    <h3 class="land-preview__name">{{ $t(`land.${selectedSquare.landKey}`) }}</h3>

    <div v-if="landDef" class="land-preview__stats">
      <div class="land-preview__row">
        <span class="land-preview__label">{{ $t('ui.price') }}</span>
        <span class="land-preview__value">{{ selectedSquare.price * 10 }} {{ $t('ui.gold') }}</span>
      </div>
      <div class="land-preview__row">
        <span class="land-preview__label">{{ $t('ui.taxIncome') }}</span>
        <span class="land-preview__value">{{ selectedSquare.taxIncome }}</span>
      </div>
      <div class="land-preview__row">
        <span class="land-preview__label">{{ $t('ui.healing') }}</span>
        <span class="land-preview__value">{{ selectedSquare.healing }}</span>
      </div>
      <div class="land-preview__row">
        <span class="land-preview__label">{{ $t('ui.defender') }}</span>
        <span class="land-preview__value">{{ $t(`creature.${defenderKey}`) }}</span>
      </div>
      <div v-if="landDef.manaType" class="land-preview__row">
        <span class="land-preview__label">{{ $t('ui.mana') }}</span>
        <span class="land-preview__value">{{ $t(`mana.${landDef.manaType}`) }}</span>
      </div>
      <div class="land-preview__row">
        <span class="land-preview__label">{{ $t('ui.owner') }}</span>
        <span class="land-preview__value">{{ ownerName }}</span>
      </div>
    </div>

    <button class="land-preview__close" @click="close">{{ $t('ui.close') }}</button>
  </div>
</template>

<script setup lang="ts">
import { LANDS } from '~~/game/data'

const { gameState, selectedSquare, closePreview } = useGameState()

const landDef = computed(() => {
  if (!selectedSquare.value) return null
  const key = selectedSquare.value.landKey as keyof typeof LANDS
  return LANDS[key] ?? null
})

const defenderKey = computed(() => {
  if (!selectedSquare.value || !landDef.value) return ''
  return landDef.value.defenders[selectedSquare.value.defenderId] ?? ''
})

const ownerName = computed(() => {
  if (!gameState.value || !selectedSquare.value) return null
  if (selectedSquare.value.owner === 0) return $t('ui.unowned')
  const owner = gameState.value.players.find((p) => p.id === selectedSquare.value!.owner)
  return owner?.name ?? null
})

const { t: $t } = useI18n()

function close() {
  closePreview()
}
</script>

<style scoped>
.land-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #4a4035;
}

.land-preview__name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: #3d3029;
}

.land-preview__stats {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 10rem;
}

.land-preview__row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
}

.land-preview__label {
  color: #8a7e6e;
}

.land-preview__value {
  font-weight: 600;
  color: #3d3029;
}

.land-preview__close {
  padding: 0.3rem 0.8rem;
  border: 1px solid #c4b899;
  background: #f5f0e6;
  color: #4a4035;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.15s;
  margin-top: 0.25rem;
}

.land-preview__close:hover {
  background: #ebe4d4;
}
</style>
