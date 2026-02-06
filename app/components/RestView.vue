<template>
  <div class="rest">
    <h2 class="rest__title">{{ $t('ui.rested') }}</h2>
    <p class="rest__healing">{{ $t('ui.healed', { amount: restResult }) }}</p>
  </div>
</template>

<script setup lang="ts">
const { restResult } = useGameState()
</script>

<style scoped>
.rest {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #4a4035;
}

.rest__title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: #8a7e6e;
}

.rest__healing {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: #2d6a4f;
}
</style>
