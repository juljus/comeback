<template>
  <div
    class="board-square"
    :class="{
      'board-square--royal': isRoyalCourt,
      'board-square--current': isCurrent,
    }"
  >
    <span class="board-square__index">{{ index + 1 }}</span>
    <span class="board-square__name">{{ displayName }}</span>
    <div v-if="playersHere.length" class="board-square__players">
      <span
        v-for="p in playersHere"
        :key="p.id"
        class="board-square__token"
        :style="{ color: playerColor(p.id) }"
      >
        {{ p.name[0] }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BoardSquare, PlayerState } from '~~/game/types'

const props = defineProps<{
  square: BoardSquare
  index: number
  players: PlayerState[]
  currentPlayerId: number
}>()

const isRoyalCourt = computed(() => props.index === 0)
const isCurrent = computed(() =>
  props.players.some((p) => p.id === props.currentPlayerId && p.position === props.index),
)

const displayName = computed(() => {
  if (props.index === 0) return 'Royal Court'
  return props.square.name
})

const playersHere = computed(() => props.players.filter((p) => p.position === props.index))

const PLAYER_COLORS = ['#8b6914', '#2d6a4f', '#7b2d8b', '#9c3a3a']

function playerColor(id: number): string {
  return PLAYER_COLORS[(id - 1) % PLAYER_COLORS.length]!
}
</script>

<style scoped>
.board-square {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2px 4px;
  min-width: 0;
  overflow: hidden;
  border: 1px solid #d9d0c1;
  background: #faf6ee;
  font-size: 0.65rem;
  line-height: 1.2;
  cursor: default;
  user-select: none;
}

.board-square--royal {
  background: #f0e8d4;
  border-color: #c4b899;
}

.board-square--current {
  background: #efe6d0;
  box-shadow: inset 0 0 0 2px #b8a882;
}

.board-square__index {
  font-size: 0.55rem;
  color: #b0a590;
}

.board-square__name {
  font-weight: 500;
  color: #4a4035;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.board-square__players {
  display: flex;
  gap: 1px;
  margin-top: 1px;
}

.board-square__token {
  font-weight: 700;
  font-size: 0.7rem;
}
</style>
