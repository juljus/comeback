<template>
  <div v-if="combatState && currentPlayer" class="combat">
    <div class="combat__header">
      <span class="combat__side-label combat__side-label--ally">{{ currentPlayer.name }}</span>
      <span class="combat__vs">vs</span>
      <span class="combat__side-label combat__side-label--enemy">{{
        $t(`creature.${combatState.defenderKey}`)
      }}</span>
    </div>

    <div class="combat__arena">
      <div class="combat__allies">
        <div
          v-for="(card, i) in allyCards"
          :key="card.key"
          class="combat__slot"
          :style="allySlotStyles[i]"
        >
          <CombatantCard
            :hp="card.hp"
            :max-hp="card.maxHp"
            :ascii="card.ascii"
            side="ally"
            :alive="card.alive"
          />
        </div>
      </div>

      <div class="combat__enemies">
        <div class="combat__slot" :style="enemySlotStyles[0]">
          <CombatantCard
            :hp="combatState.defenderHp"
            :max-hp="combatState.defenderMaxHp"
            :ascii="getCombatAscii(combatState.defenderHp > 0 ? 'defender' : 'dead')"
            side="enemy"
            :alive="combatState.defenderHp > 0"
          />
        </div>
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
import { getCombatAscii } from '~/utils/combatAscii'
import { getFormationSlots, type FormationSlot } from '~/utils/formations'

const GRID_PX = 40

const { combatState, currentPlayer, combatAttack, combatRetreat, combatFinish } = useGameState()
const { t } = useI18n()

const canAct = computed(() => {
  if (!currentPlayer.value || !combatState.value) return false
  return currentPlayer.value.actionsUsed < 3 && !combatState.value.resolved
})

type AllyCard = { key: string; hp: number; maxHp: number; ascii: string; alive: boolean }

const allyCards = computed<AllyCard[]>(() => {
  if (!currentPlayer.value || !combatState.value) return []
  const cards: AllyCard[] = [
    {
      key: '__player',
      hp: currentPlayer.value.hp,
      maxHp: currentPlayer.value.strength * 10,
      ascii: getCombatAscii('player'),
      alive: currentPlayer.value.alive,
    },
  ]
  for (const comp of combatState.value.companions) {
    cards.push({
      key: comp.name,
      hp: comp.currentHp,
      maxHp: comp.maxHp,
      ascii: getCombatAscii(comp.alive ? 'companion' : 'dead'),
      alive: comp.alive,
    })
  }
  return cards
})

function slotsToStyles(slots: FormationSlot[], mirror: boolean): Record<string, string>[] {
  return slots.map((slot) => {
    const xDir = mirror ? -1 : 1
    const tx = slot.x * GRID_PX * xDir
    const ty = slot.y * GRID_PX
    // Higher y = lower on screen = rendered in front (higher z-index)
    const z = Math.round(slot.y * 10) + 10
    return {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`,
      zIndex: String(z),
    }
  })
}

const allySlotStyles = computed(() => {
  const slots = getFormationSlots(allyCards.value.length)
  return slotsToStyles(slots, false)
})

const enemySlotStyles = computed(() => {
  const slots = getFormationSlots(1)
  return slotsToStyles(slots, true)
})

type LogEntry = { text: string; css: string }

const logEntries = computed<LogEntry[]>(() => {
  if (!combatState.value) return []
  return combatState.value.actions.flatMap((action): LogEntry[] => {
    if (action.type === 'attack') {
      const entries: LogEntry[] = [
        {
          text: t('combat.roundResult', {
            dealt: action.result.playerDamageDealt,
            taken: action.result.defenderDamageDealt,
          }),
          css: '',
        },
      ]
      for (const comp of action.result.companionResults) {
        if (comp.damageDealt > 0) {
          entries.push({
            text: t('combat.companionHit', {
              name: t(`creature.${comp.name}`),
              dealt: comp.damageDealt,
            }),
            css: 'combat__round--companion',
          })
        }
      }
      return entries
    }
    if (action.result.escaped) {
      return [{ text: t('combat.fleeSuccess'), css: 'combat__round--flee' }]
    }
    return [
      {
        text: t('combat.fleeFail', { taken: action.result.defenderDamageDealt }),
        css: 'combat__round--flee-fail',
      },
    ]
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

.combat__header {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  margin-bottom: 0.5rem;
}

.combat__side-label {
  font-size: 1rem;
  font-weight: 700;
}

.combat__side-label--ally {
  color: #2d6a4f;
}

.combat__side-label--enemy {
  color: #c0392b;
}

.combat__vs {
  font-size: 0.85rem;
  color: #8a7e6e;
  font-style: italic;
}

.combat__arena {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
}

.combat__allies,
.combat__enemies {
  position: relative;
  flex: 1;
  height: 120px;
}

.combat__slot {
  position: absolute;
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

.combat__round--companion {
  color: #2d6a4f;
  padding-left: 0.5rem;
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
