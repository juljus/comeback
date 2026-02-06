<template>
  <div class="inventory">
    <div class="inventory__header">
      <h2 class="inventory__title">{{ $t('ui.inventory') }}</h2>
      <button class="inventory__back" @click="centerView = 'location'">
        {{ $t('ui.back') }}
      </button>
    </div>

    <div class="inventory__sections">
      <div class="inventory__section">
        <h3 class="inventory__subtitle">{{ $t('ui.equipped') }}</h3>
        <div class="inventory__slots">
          <div v-for="slot in SLOTS" :key="slot" class="inventory__slot">
            <span class="inventory__slot-label">{{ $t(`slot.${slot}`) }}</span>
            <span
              class="inventory__slot-value"
              :class="{ 'inventory__slot-value--empty': !equipped[slot] }"
            >
              {{ equipped[slot] ? $t(`item.${equipped[slot]}`) : $t('ui.empty') }}
            </span>
          </div>
        </div>
      </div>

      <div class="inventory__section">
        <h3 class="inventory__subtitle">{{ $t('ui.backpack') }}</h3>
        <div v-if="currentPlayer!.inventory.length" class="inventory__items">
          <div v-for="itemKey in currentPlayer!.inventory" :key="itemKey" class="inventory__item">
            {{ $t(`item.${itemKey}`) }}
          </div>
        </div>
        <p v-else class="inventory__empty">{{ $t('ui.empty') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ItemSlot } from '~~/game/types'

const { currentPlayer, centerView } = useGameState()

const SLOTS: ItemSlot[] = ['weapon', 'head', 'body', 'feet', 'ringRight', 'ringLeft', 'usable']

const equipped = computed(() => currentPlayer.value!.equipment)
</script>

<style scoped>
.inventory {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem 1.5rem;
  color: #4a4035;
}

.inventory__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.inventory__title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #3d3029;
}

.inventory__back {
  padding: 0.3rem 0.75rem;
  border: 1px solid #c4b899;
  background: #f5f0e6;
  color: #4a4035;
  font-size: 0.75rem;
  cursor: pointer;
}

.inventory__back:hover {
  background: #ebe4d4;
}

.inventory__sections {
  display: flex;
  gap: 2rem;
  flex: 1;
  min-height: 0;
}

.inventory__section {
  flex: 1;
}

.inventory__subtitle {
  font-size: 0.8rem;
  font-weight: 600;
  color: #8a7e6e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.5rem;
}

.inventory__slots {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.inventory__slot {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.8rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid #ede7da;
}

.inventory__slot-label {
  color: #8a7e6e;
}

.inventory__slot-value {
  font-weight: 500;
  color: #4a4035;
}

.inventory__slot-value--empty {
  font-weight: 400;
  font-style: italic;
  color: #b0a590;
}

.inventory__items {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.inventory__item {
  font-size: 0.8rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid #ede7da;
}

.inventory__empty {
  font-size: 0.8rem;
  font-style: italic;
  color: #b0a590;
  margin: 0;
}
</style>
