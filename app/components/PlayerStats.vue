<template>
  <div
    class="player-stats"
    :class="{ 'player-stats--active': isActive }"
    :style="{ borderColor: color }"
  >
    <div class="player-stats__name" :style="{ color }">{{ player.name }}</div>
    <div class="player-stats__row">
      <span class="player-stats__label">HP</span>
      <span class="player-stats__value">{{ player.hp }}</span>
    </div>
    <div class="player-stats__row">
      <span class="player-stats__label">{{ $t('stat.gold') }}</span>
      <span class="player-stats__value">{{ player.gold }}</span>
    </div>
    <div class="player-stats__divider" />
    <div class="player-stats__row">
      <span class="player-stats__label">{{ $t('stat.strength') }}</span>
      <span class="player-stats__value">{{ player.strength }}</span>
    </div>
    <div class="player-stats__row">
      <span class="player-stats__label">{{ $t('stat.dexterity') }}</span>
      <span class="player-stats__value">{{ player.dexterity }}</span>
    </div>
    <div class="player-stats__row">
      <span class="player-stats__label">{{ $t('stat.power') }}</span>
      <span class="player-stats__value">{{ player.power }}</span>
    </div>
    <div class="player-stats__row">
      <span class="player-stats__label">{{ $t('stat.armor') }}</span>
      <span class="player-stats__value">{{ player.armor }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlayerState } from '~~/game/types'

const PLAYER_COLORS = ['#8b6914', '#2d6a4f', '#7b2d8b', '#9c3a3a']

const props = defineProps<{
  player: PlayerState
  isActive: boolean
}>()

const color = computed(() => PLAYER_COLORS[(props.player.id - 1) % PLAYER_COLORS.length]!)
</script>

<style scoped>
.player-stats {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d9d0c1;
  background: #faf6ee;
  min-width: 120px;
  font-size: 0.75rem;
  opacity: 0.65;
  transition:
    opacity 0.2s,
    border-color 0.2s;
}

.player-stats--active {
  opacity: 1;
  border-width: 2px;
  background: #f5f0e6;
}

.player-stats__name {
  font-weight: 700;
  font-size: 0.85rem;
  text-align: center;
  margin-bottom: 0.15rem;
}

.player-stats__row {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.player-stats__label {
  color: #8a7e6e;
}

.player-stats__value {
  font-weight: 600;
  color: #4a4035;
}

.player-stats__divider {
  border-top: 1px solid #e0d8c8;
  margin: 0.15rem 0;
}
</style>
