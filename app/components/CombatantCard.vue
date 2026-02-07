<template>
  <div class="combatant" :class="{ 'combatant--dead': !alive }">
    <span class="combatant__hp">{{ hp }}/{{ maxHp }}</span>
    <div class="combatant__bar">
      <div class="combatant__bar-fill" :class="barClass" :style="{ width: hpPercent + '%' }" />
    </div>
    <pre class="combatant__ascii" :class="colorClass">{{ ascii }}</pre>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  hp: number
  maxHp: number
  ascii: string
  side: 'ally' | 'enemy'
  alive: boolean
}>()

const hpPercent = computed(() => (props.maxHp > 0 ? (props.hp / props.maxHp) * 100 : 0))

const colorClass = computed(() => {
  if (!props.alive) return 'combatant--gray'
  return props.side === 'ally' ? 'combatant--ally' : 'combatant--enemy'
})

const barClass = computed(() => {
  if (!props.alive) return 'combatant__bar-fill--gray'
  return props.side === 'ally' ? 'combatant__bar-fill--ally' : 'combatant__bar-fill--enemy'
})
</script>

<style scoped>
.combatant {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 65px;
  gap: 1px;
}

.combatant--dead {
  opacity: 0.5;
}

.combatant__ascii {
  font-family: monospace;
  font-size: 0.55rem;
  line-height: 1.1;
  margin: 0;
  text-align: center;
  white-space: pre;
}

.combatant__bar {
  width: 70%;
  height: 4px;
  background: #e8e0d0;
  border: 1px solid #c4b899;
  overflow: hidden;
}

.combatant__bar-fill {
  height: 100%;
  transition: width 0.2s;
}

.combatant__bar-fill--ally {
  background: #2d6a4f;
}

.combatant__bar-fill--enemy {
  background: #c0392b;
}

.combatant__bar-fill--gray {
  background: #999;
}

.combatant__hp {
  font-size: 0.5rem;
  color: #8a7e6e;
}

.combatant--ally {
  color: #2d6a4f;
}

.combatant--enemy {
  color: #c0392b;
}

.combatant--gray {
  color: #999;
}
</style>
