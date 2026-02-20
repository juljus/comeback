<template>
  <div
    class="player-stats"
    :class="{ 'player-stats--active': isActive }"
    :style="{ borderColor: color }"
  >
    <div class="player-stats__name" :style="{ color }">{{ player.name }}</div>
    <div class="player-stats__row">
      <span class="player-stats__label">HP</span>
      <span class="player-stats__value">{{ player.hp }} / {{ player.maxHp }}</span>
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
    <template v-if="nonZeroMana.length > 0">
      <div class="player-stats__divider" />
      <div class="player-stats__mana">
        <span
          v-for="[type, amount] in nonZeroMana"
          :key="type"
          class="player-stats__mana-badge"
          :data-tooltip="`${$t(`mana.${type}`)} (+${player.manaRegen[type]}${$t('mana.perTurn')})`"
        >
          <span class="player-stats__mana-dot" :style="{ background: MANA_COLORS[type] }" />
          {{ amount }}
        </span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ManaType } from '~~/game/types/enums'
import type { PlayerState } from '~~/game/types'
import { MANA_COLORS } from '~/composables/manaColors'
import { PLAYER_COLORS } from '~/composables/playerColors'

const props = defineProps<{
  player: PlayerState
  isActive: boolean
}>()

const color = computed(() => PLAYER_COLORS[(props.player.id - 1) % PLAYER_COLORS.length]!)

const nonZeroMana = computed(() =>
  (Object.entries(props.player.mana) as [ManaType, number][]).filter(([, v]) => v > 0),
)
</script>

<style scoped>
.player-stats {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid #d9d0c1;
  background: #faf6ee;
  min-width: 110px;
  max-width: 130px;
  font-size: 0.65rem;
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
  font-size: 0.7rem;
  text-align: center;
  margin-bottom: 0.05rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-stats__row {
  display: flex;
  justify-content: space-between;
  gap: 0.3rem;
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
  margin: 0.05rem 0;
}

.player-stats__mana {
  display: flex;
  flex-wrap: wrap;
  gap: 0.1rem 0.3rem;
  justify-content: center;
}

.player-stats__mana-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  color: #4a4035;
  font-size: 0.6rem;
  font-weight: 600;
  line-height: 1;
  cursor: default;
}

.player-stats__mana-dot {
  display: inline-block;
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
