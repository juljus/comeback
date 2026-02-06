<template>
  <div class="movement">
    <h2 class="movement__title">{{ $t('ui.rolled') }}</h2>

    <div class="movement__dice">
      <span class="movement__die">{{ movementRoll!.die1 }}</span>
      <span class="movement__die">{{ movementRoll!.die2 }}</span>
      <span class="movement__total">= {{ movementRoll!.total }}</span>
    </div>

    <p v-if="movementRoll!.isDoubles" class="movement__doubles">{{ $t('ui.doubles') }}</p>
    <p v-if="doublesGold" class="movement__gold">
      {{ $t('ui.doublesGold', { amount: doublesGold }) }}
    </p>

    <div class="movement__actions">
      <button class="action-btn" @click="confirmMove">{{ $t('ui.keepRoll') }}</button>
      <button v-if="movementRoll!.isDoubles" class="action-btn" @click="reroll">
        {{ $t('ui.reroll') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { movementRoll, doublesGold, confirmMove, reroll } = useGameState()
</script>

<style scoped>
.movement {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #4a4035;
}

.movement__title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: #8a7e6e;
}

.movement__dice {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.movement__die {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border: 2px solid #c4b899;
  background: #faf6ee;
  font-size: 1.5rem;
  font-weight: 700;
  color: #3d3029;
}

.movement__total {
  font-size: 1.5rem;
  font-weight: 600;
  color: #3d3029;
}

.movement__doubles {
  font-size: 0.85rem;
  font-weight: 600;
  color: #8b6914;
  margin: 0;
}

.movement__gold {
  font-size: 0.85rem;
  font-weight: 600;
  color: #8b6914;
  margin: 0;
}

.movement__actions {
  display: flex;
  gap: 0.75rem;
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
