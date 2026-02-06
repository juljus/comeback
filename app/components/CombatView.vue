<template>
  <div v-if="combatState && currentPlayer" class="combat">
    <div class="combat__arena">
      <div class="combat__side">
        <span class="combat__name">{{ currentPlayer.name }}</span>
        <div class="combat__hp-bar">
          <div class="combat__bar">
            <div
              class="combat__bar-fill combat__bar-fill--player"
              :style="{ width: playerHpPercent + '%' }"
            />
          </div>
          <span class="combat__hp-label">{{ currentPlayer.hp }}/{{ currentPlayer.maxHp }}</span>
        </div>
        <div class="combat__figure combat__figure--player">&#9876;</div>
      </div>

      <div class="combat__vs">vs</div>

      <div class="combat__side">
        <span class="combat__name">{{ $t(`creature.${combatState.defenderKey}`) }}</span>
        <div class="combat__hp-bar">
          <div class="combat__bar">
            <div
              class="combat__bar-fill combat__bar-fill--defender"
              :style="{ width: defenderHpPercent + '%' }"
            />
          </div>
          <span class="combat__hp-label"
            >{{ combatState.defenderHp }}/{{ combatState.defenderMaxHp }}</span
          >
        </div>
        <div class="combat__figure combat__figure--defender">&#9760;</div>
      </div>
    </div>

    <div v-if="logEntries.length > 0" class="combat__log">
      <p v-for="(entry, i) in logEntries" :key="i" class="combat__round" :class="entry.css">
        {{ i + 1 }}. {{ entry.text }}
      </p>
    </div>

    <div v-if="combatState.resolved" class="combat__result">
      <p v-if="combatState.victory" class="combat__victory">{{ $t('combat.victory') }}</p>
      <p v-else-if="!currentPlayer.alive" class="combat__defeat">{{ $t('combat.defeat') }}</p>
      <p v-else class="combat__retreat-msg">{{ $t('combat.retreat') }}</p>
      <button class="combat__btn" @click="combatFinish">{{ $t('combat.continue') }}</button>
    </div>

    <div v-else class="combat__actions">
      <button class="combat__btn" :disabled="!canAct" @click="combatAttack">
        {{ $t('action.attack') }}
      </button>
      <button class="combat__btn" :disabled="!canAct" @click="combatRetreat">
        {{ $t('action.retreat') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { combatState, currentPlayer, combatAttack, combatRetreat, combatFinish } = useGameState()
const { t } = useI18n()

const defenderHpPercent = computed(() => {
  if (!combatState.value) return 0
  return (combatState.value.defenderHp / combatState.value.defenderMaxHp) * 100
})

const playerHpPercent = computed(() => {
  if (!currentPlayer.value) return 0
  return (currentPlayer.value.hp / currentPlayer.value.maxHp) * 100
})

const canAct = computed(() => {
  if (!currentPlayer.value || !combatState.value) return false
  return currentPlayer.value.actionsUsed < 3 && !combatState.value.resolved
})

type LogEntry = { text: string; css: string }

const logEntries = computed<LogEntry[]>(() => {
  if (!combatState.value) return []
  return combatState.value.actions.map((action): LogEntry => {
    if (action.type === 'attack') {
      return {
        text: t('combat.roundResult', {
          dealt: action.result.playerDamageDealt,
          taken: action.result.defenderDamageDealt,
        }),
        css: '',
      }
    }
    if (action.result.escaped) {
      return { text: t('combat.fleeSuccess'), css: 'combat__round--flee' }
    }
    return {
      text: t('combat.fleeFail', { taken: action.result.defenderDamageDealt }),
      css: 'combat__round--flee-fail',
    }
  })
})
</script>

<style scoped>
.combat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #4a4035;
  width: 100%;
  padding: 0.5rem;
}

.combat__arena {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  width: 100%;
}

.combat__side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  max-width: 120px;
}

.combat__name {
  font-size: 0.75rem;
  font-weight: 600;
  color: #3d3029;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.combat__hp-bar {
  width: 100%;
  text-align: center;
}

.combat__bar {
  width: 100%;
  height: 6px;
  background: #e8e0d0;
  border: 1px solid #c4b899;
  overflow: hidden;
}

.combat__bar-fill {
  height: 100%;
  transition: width 0.2s;
}

.combat__bar-fill--player {
  background: #2d6a4f;
}

.combat__bar-fill--defender {
  background: #c0392b;
}

.combat__hp-label {
  font-size: 0.6rem;
  color: #8a7e6e;
}

.combat__figure {
  font-size: 2rem;
  line-height: 1;
}

.combat__figure--player {
  color: #2d6a4f;
}

.combat__figure--defender {
  color: #c0392b;
}

.combat__vs {
  font-size: 0.75rem;
  color: #8a7e6e;
  font-style: italic;
  align-self: flex-end;
  margin-bottom: 1rem;
}

.combat__log {
  width: 100%;
  max-width: 300px;
  max-height: 100px;
  overflow-y: auto;
  font-size: 0.7rem;
  color: #6a6055;
  border: 1px solid #e8e0d0;
  padding: 0.25rem 0.4rem;
}

.combat__round {
  margin: 0.1rem 0;
}

.combat__round--flee {
  color: #2d6a4f;
}

.combat__round--flee-fail {
  color: #c0392b;
}

.combat__result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.combat__victory {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2d6a4f;
  margin: 0;
}

.combat__defeat {
  font-size: 0.9rem;
  font-weight: 600;
  color: #c0392b;
  margin: 0;
}

.combat__retreat-msg {
  font-size: 0.9rem;
  color: #8a7e6e;
  margin: 0;
}

.combat__actions {
  display: flex;
  gap: 0.75rem;
}

.combat__btn {
  padding: 0.4rem 1rem;
  border: 1px solid #c4b899;
  background: #f5f0e6;
  color: #4a4035;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.combat__btn:hover:not(:disabled) {
  background: #ebe4d4;
}

.combat__btn:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
