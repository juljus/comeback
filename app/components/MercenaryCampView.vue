<template>
  <div v-if="currentPlayer" class="merc-camp">
    <h3 class="merc-camp__title">{{ $t('ui.mercCampTitle') }}</h3>

    <div class="merc-camp__info">
      <span>{{ currentPlayer.gold }} {{ $t('ui.gold') }}</span>
      <span>{{
        $t('ui.companionCount', { count: currentPlayer.companions.length, max: 20 })
      }}</span>
    </div>

    <div class="merc-camp__list">
      <p v-if="mercOffers.length === 0" class="merc-camp__empty">{{ $t('ui.shopEmpty') }}</p>
      <div v-for="(offer, i) in mercOffers" :key="i" class="merc-camp__offer">
        <span class="merc-camp__creature">{{ $t(`creature.${offer.creatureKey}`) }}</span>
        <span class="merc-camp__contract">{{
          $t('ui.mercContract', { turns: offer.contractTurns })
        }}</span>
        <button
          class="merc-camp__hire-btn"
          :disabled="currentPlayer.gold < offer.cost || currentPlayer.companions.length >= 20"
          @click="hireMerc(i)"
        >
          {{ $t('ui.mercHire', { cost: offer.cost }) }}
        </button>
      </div>
    </div>

    <button class="merc-camp__close" @click="closeMercenaryCamp">{{ $t('ui.close') }}</button>
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const { currentPlayer, mercOffers, hireMerc, closeMercenaryCamp } = useGameState()
</script>

<style scoped>
.merc-camp {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  color: #4a4035;
  width: 100%;
}

.merc-camp__title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: #3d3029;
}

.merc-camp__info {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #8a7e6e;
}

.merc-camp__list {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  width: 100%;
  max-width: 18rem;
}

.merc-camp__empty {
  font-size: 0.75rem;
  color: #8a7e6e;
  text-align: center;
  margin: 0;
}

.merc-camp__offer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.merc-camp__creature {
  flex: 1;
  color: #3d3029;
}

.merc-camp__contract {
  color: #8a7e6e;
  font-size: 0.7rem;
}

.merc-camp__hire-btn {
  padding: 0.2rem 0.5rem;
  border: 1px solid #c4b899;
  background: #f5f0e6;
  color: #4a4035;
  font-size: 0.7rem;
  cursor: pointer;
  transition: background-color 0.15s;
  white-space: nowrap;
}

.merc-camp__hire-btn:hover:not(:disabled) {
  background: #ebe4d4;
}

.merc-camp__hire-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.merc-camp__close {
  padding: 0.3rem 0.8rem;
  border: 1px solid #c4b899;
  background: #f5f0e6;
  color: #4a4035;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.15s;
  margin-top: 0.25rem;
}

.merc-camp__close:hover {
  background: #ebe4d4;
}
</style>
