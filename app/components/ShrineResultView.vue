<template>
  <div v-if="shrineResult" class="shrine-result">
    <h3 class="shrine-result__title">{{ $t('ui.shrineHealing') }}</h3>

    <div class="shrine-result__stats">
      <p class="shrine-result__line">
        {{ $t('ui.shrinePlayerHealed', { amount: shrineResult.playerHealAmount }) }}
      </p>
      <p v-for="comp in shrineResult.companionHealing" :key="comp.name" class="shrine-result__line">
        {{ $t('ui.shrineCompanionHealed', { name: comp.name, amount: comp.healAmount }) }}
      </p>
      <p class="shrine-result__cost">{{ $t('ui.shrineCost') }}</p>
    </div>

    <button class="shrine-result__continue" @click="dismissShrineResult">
      {{ $t('combat.continue') }}
    </button>
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const { shrineResult, dismissShrineResult } = useGameState()
</script>

<style scoped>
.shrine-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #4a4035;
}

.shrine-result__title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: #3d3029;
}

.shrine-result__stats {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  align-items: center;
}

.shrine-result__line {
  font-size: 0.8rem;
  margin: 0;
  color: #3d3029;
}

.shrine-result__cost {
  font-size: 0.75rem;
  color: #8a7e6e;
  margin: 0.25rem 0 0;
}

.shrine-result__continue {
  padding: 0.3rem 0.8rem;
  border: 1px solid #c4b899;
  background: #f5f0e6;
  color: #4a4035;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.15s;
  margin-top: 0.25rem;
}

.shrine-result__continue:hover {
  background: #ebe4d4;
}
</style>
