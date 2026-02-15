<template>
  <div v-if="royalCourtResult" class="royal-court">
    <h3 class="royal-court__title">{{ $t('ui.royalCourtPassed') }}</h3>

    <div class="royal-court__stats">
      <div class="royal-court__row">
        <span class="royal-court__label">{{ $t('ui.taxIncomeLabel') }}</span>
        <span class="royal-court__value"
          >+{{ royalCourtResult.taxIncome }} {{ $t('ui.gold') }}</span
        >
      </div>
      <div class="royal-court__row">
        <span class="royal-court__label">{{ $t('ui.bankBonusLabel') }}</span>
        <span class="royal-court__value"
          >+{{ royalCourtResult.bankBonus }} {{ $t('ui.gold') }}</span
        >
      </div>
      <div class="royal-court__row">
        <span class="royal-court__label">{{ $t('ui.titleSalaryLabel') }}</span>
        <span class="royal-court__value"
          >+{{ royalCourtResult.titleSalary }} {{ $t('ui.gold') }}</span
        >
      </div>
      <div class="royal-court__divider"></div>
      <div class="royal-court__row royal-court__row--total">
        <span class="royal-court__label">{{ $t('ui.totalIncomeLabel') }}</span>
        <span class="royal-court__value"
          >+{{ royalCourtResult.totalIncome }} {{ $t('ui.gold') }}</span
        >
      </div>
    </div>

    <template v-if="royalCourtResult.titleChanged && royalCourtResult.kingsGift.length > 0">
      <p class="royal-court__promotion">{{ $t('ui.promoted', { title: titleLabel }) }}</p>
      <p class="royal-court__gift-prompt">{{ $t('ui.chooseGift') }}</p>
      <div class="royal-court__gifts">
        <button
          v-for="itemKey in royalCourtResult.kingsGift"
          :key="itemKey"
          class="royal-court__gift-btn"
          @click="acceptKingsGift(itemKey)"
        >
          {{ $t(`item.${itemKey}`) }}
        </button>
      </div>
    </template>

    <template v-else>
      <p v-if="royalCourtResult.titleChanged" class="royal-court__promotion">
        {{ $t('ui.promoted', { title: titleLabel }) }}
      </p>
      <button class="royal-court__continue" @click="dismissRoyalCourt">
        {{ $t('combat.continue') }}
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()

const { royalCourtResult, acceptKingsGift, dismissRoyalCourt, currentPlayer } = useGameState()

const GENDERED_TITLES: Record<string, Record<string, string>> = {
  male: { baron: 'baron', count: 'count', duke: 'duke' },
  female: { baron: 'baroness', count: 'countess', duke: 'duchess' },
}

const titleLabel = computed(() => {
  if (!royalCourtResult.value || !currentPlayer.value) return ''
  const gender = currentPlayer.value.gender
  const titleKey = royalCourtResult.value.newTitle
  const genderedKey = GENDERED_TITLES[gender]?.[titleKey] ?? titleKey
  return $t(`title.${genderedKey}`)
})
</script>

<style scoped>
.royal-court {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #4a4035;
}

.royal-court__title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: #3d3029;
}

.royal-court__stats {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 12rem;
}

.royal-court__row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
}

.royal-court__row--total {
  font-weight: 600;
}

.royal-court__label {
  color: #8a7e6e;
}

.royal-court__value {
  font-weight: 600;
  color: #3d3029;
}

.royal-court__divider {
  border-top: 1px solid #c4b899;
  margin: 0.15rem 0;
}

.royal-court__promotion {
  font-size: 0.85rem;
  font-weight: 600;
  color: #8b6914;
  margin: 0.25rem 0 0;
}

.royal-court__gift-prompt {
  font-size: 0.75rem;
  color: #8a7e6e;
  margin: 0;
}

.royal-court__gifts {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.royal-court__gift-btn {
  padding: 0.4rem 0.8rem;
  border: 1px solid #c4b899;
  background: #f5f0e6;
  color: #4a4035;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.royal-court__gift-btn:hover {
  background: #ebe4d4;
}

.royal-court__continue {
  padding: 0.3rem 0.8rem;
  border: 1px solid #c4b899;
  background: #f5f0e6;
  color: #4a4035;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.15s;
  margin-top: 0.25rem;
}

.royal-court__continue:hover {
  background: #ebe4d4;
}
</style>
