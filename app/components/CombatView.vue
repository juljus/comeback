<template>
  <div v-if="combatState && currentPlayer" class="combat">
    <div class="combat__header">
      <span class="combat__side-label combat__side-label--ally">{{ currentPlayer.name }}</span>
      <span class="combat__vs">vs</span>
      <span class="combat__side-label combat__side-label--enemy">{{
        isFortified ? $t('combat.fortress') : $t(`creature.${combatState.defenderKey}`)
      }}</span>
    </div>

    <div ref="arenaRef" class="combat__arena">
      <div class="combat__allies">
        <div
          v-for="(card, i) in allyCards"
          :key="card.key"
          :ref="(el) => setAllySlotRef(i, el)"
          class="combat__slot"
          :class="{ 'combat__slot--selected': selectedAllyIndex === i }"
          :style="allySlotStyles[i]"
          @click="onAllyClick(i)"
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

      <svg v-if="targetingLines.length" class="combat__targeting" width="100%" height="100%">
        <line
          v-for="(line, i) in targetingLines"
          :key="i"
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
          stroke="#c0392b"
          stroke-width="1.5"
          stroke-dasharray="4 3"
          opacity="0.5"
        />
      </svg>

      <div class="combat__enemies">
        <div
          v-for="(card, i) in enemyCards"
          :key="card.key + i"
          :ref="(el) => setEnemySlotRef(i, el)"
          class="combat__slot"
          :style="enemySlotStyles[i]"
          @click="onEnemyClick(i)"
        >
          <CombatantCard
            :hp="card.hp"
            :max-hp="card.maxHp"
            :ascii="card.ascii"
            side="enemy"
            :alive="card.alive"
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
      <button class="combat__btn" :disabled="!canAct || !allAssigned" @click="doAttack">
        {{ $t('action.attack') }}
      </button>
      <button class="combat__btn" :disabled="!canAct" @click="combatRetreat">
        {{ $t('action.retreat') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CombatRoundResult, FortifiedRoundResult } from '~~/game/engine'
import { getCombatAscii } from '~/utils/combatAscii'
import { getFormationSlots, type FormationSlot } from '~/utils/formations'

const GRID_PX = 40

const {
  combatState,
  currentPlayer,
  combatAttack,
  combatRetreat,
  combatFinish,
  fortTargetAssignments,
} = useGameState()
const { t } = useI18n()

const isFortified = computed(() => {
  return (combatState.value?.defenders.length ?? 0) > 1
})

const canAct = computed(() => {
  if (!currentPlayer.value || !combatState.value) return false
  return currentPlayer.value.actionsUsed < 3 && !combatState.value.resolved
})

type AllyCard = { key: string; hp: number; maxHp: number; ascii: string; alive: boolean }
type EnemyCard = { key: string; hp: number; maxHp: number; ascii: string; alive: boolean }

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

const enemyCards = computed<EnemyCard[]>(() => {
  if (!combatState.value) return []
  return combatState.value.defenders.map((d) => ({
    key: d.key,
    hp: d.currentHp,
    maxHp: d.maxHp,
    ascii: getCombatAscii(d.alive ? 'defender' : 'dead'),
    alive: d.alive,
  }))
})

// --- Template refs for targeting lines ---
const arenaRef = ref<HTMLElement | null>(null)
const allySlotRefs = ref<(HTMLElement | null)[]>([])
const enemySlotRefs = ref<(HTMLElement | null)[]>([])

function setAllySlotRef(i: number, el: unknown) {
  allySlotRefs.value[i] = el as HTMLElement | null
}

function setEnemySlotRef(i: number, el: unknown) {
  enemySlotRefs.value[i] = el as HTMLElement | null
}

// --- Targeting state ---
const selectedAllyIndex = ref<number | null>(null)
const manualAssignments = ref(new Map<number, number>())

const enemyCount = computed(() => combatState.value?.defenders.length ?? 1)

/** Is the gate still alive? (fortified only) */
const gateAlive = computed(() => {
  if (!isFortified.value || !combatState.value) return false
  return combatState.value.defenders[0]!.alive
})

const targetAssignments = computed(() => {
  const assignments = new Map<number, number>()
  if (enemyCount.value === 1 || gateAlive.value) {
    // Single enemy or gate alive: auto-assign all to index 0
    for (let i = 0; i < allyCards.value.length; i++) {
      if (allyCards.value[i]!.alive) {
        assignments.set(i, 0)
      }
    }
  } else {
    // Manual assignment mode (gate down, multiple enemies)
    for (const [allyIdx, enemyIdx] of manualAssignments.value) {
      if (allyIdx < allyCards.value.length && allyCards.value[allyIdx]!.alive) {
        // Validate enemy is alive
        if (combatState.value && combatState.value.defenders[enemyIdx]?.alive) {
          assignments.set(allyIdx, enemyIdx)
        }
      }
    }
  }
  return assignments
})

const allAssigned = computed(() => {
  for (let i = 0; i < allyCards.value.length; i++) {
    if (allyCards.value[i]!.alive && !targetAssignments.value.has(i)) {
      return false
    }
  }
  return true
})

function onAllyClick(index: number) {
  if (enemyCount.value === 1 || gateAlive.value) return
  if (!allyCards.value[index]!.alive) return
  selectedAllyIndex.value = selectedAllyIndex.value === index ? null : index
}

function onEnemyClick(enemyIndex: number) {
  if (enemyCount.value === 1 || gateAlive.value) return
  if (selectedAllyIndex.value === null) return
  manualAssignments.value.set(selectedAllyIndex.value, enemyIndex)
  selectedAllyIndex.value = null
}

function doAttack() {
  if (isFortified.value) {
    fortTargetAssignments.value = targetAssignments.value
  }
  combatAttack(isFortified.value ? targetAssignments.value : undefined)
  // Reset manual assignments when gate falls (so user has to re-assign)
  if (isFortified.value && combatState.value && !combatState.value.defenders[0]!.alive) {
    manualAssignments.value = new Map()
  }
}

// --- Targeting lines ---
type LineCoords = { x1: number; y1: number; x2: number; y2: number }

const targetingLines = ref<LineCoords[]>([])

function recomputeLines() {
  const arena = arenaRef.value
  if (!arena) {
    targetingLines.value = []
    return
  }
  const arenaRect = arena.getBoundingClientRect()
  const lines: LineCoords[] = []

  for (const [allyIdx, enemyIdx] of targetAssignments.value) {
    const allyEl = allySlotRefs.value[allyIdx]
    const enemyEl = enemySlotRefs.value[enemyIdx]
    if (!allyEl || !enemyEl) continue

    const allyRect = allyEl.getBoundingClientRect()
    const enemyRect = enemyEl.getBoundingClientRect()

    lines.push({
      x1: allyRect.left + allyRect.width / 2 - arenaRect.left,
      y1: allyRect.top + allyRect.height / 2 - arenaRect.top,
      x2: enemyRect.left + enemyRect.width / 2 - arenaRect.left,
      y2: enemyRect.top + enemyRect.height / 2 - arenaRect.top,
    })
  }

  targetingLines.value = lines
}

watch([targetAssignments, allyCards], () => recomputeLines(), { flush: 'post' })
onMounted(() => recomputeLines())

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
  const slots = getFormationSlots(enemyCount.value)
  return slotsToStyles(slots, true)
})

// --- Type guard to distinguish result types ---
function isFortifiedResult(r: CombatRoundResult | FortifiedRoundResult): r is FortifiedRoundResult {
  return 'defenderResults' in r
}

type LogEntry = { text: string; css: string }

const logEntries = computed<LogEntry[]>(() => {
  if (!combatState.value) return []
  return combatState.value.actions.flatMap((action): LogEntry[] => {
    if (action.type === 'attack') {
      const r = action.result
      if (isFortifiedResult(r)) {
        return buildFortifiedLogEntries(r)
      }
      return buildStandardLogEntries(r)
    }
    // Flee action
    if (action.result.cannotFlee) {
      return [{ text: t('combat.cannotFlee'), css: 'combat__round--flee-fail' }]
    }
    if (action.result.escaped) {
      const entries: LogEntry[] = [{ text: t('combat.fleeSuccess'), css: 'combat__round--flee' }]
      if (action.result.bleedingCleared) {
        entries.push({ text: t('combat.bleedCleared'), css: 'combat__round--flee' })
      }
      return entries
    }
    return [
      {
        text: t('combat.fleeFail', { taken: action.result.defenderDamageDealt }),
        css: 'combat__round--flee-fail',
      },
    ]
  })
})

function buildStandardLogEntries(r: CombatRoundResult): LogEntry[] {
  const entries: LogEntry[] = []

  // Status effect damage
  if (r.statusEffectDamage.defender > 0) {
    entries.push({
      text: t('combat.bleedDamage', { amount: r.statusEffectDamage.defender }),
      css: 'combat__round--status',
    })
  }
  if (r.statusEffectDamage.player > 0) {
    entries.push({
      text: t('combat.bleedDamage', { amount: r.statusEffectDamage.player }),
      css: 'combat__round--status combat__round--status-player',
    })
  }

  // Stun/frozen messages
  if (r.playerStunned) {
    entries.push({ text: t('combat.stunned'), css: 'combat__round--status-player' })
  }
  if (r.defenderStunned) {
    entries.push({ text: t('combat.stunned'), css: 'combat__round--status' })
  }

  // Main round result
  if (!r.playerStunned || !r.defenderStunned) {
    entries.push({
      text: t('combat.roundResult', { dealt: r.playerDamageDealt, taken: r.defenderDamageDealt }),
      css: '',
    })
  }

  // Critical hit effects
  for (const eff of r.appliedEffects) {
    entries.push(...critEffectEntries(eff))
  }

  // Companion results
  for (const comp of r.companionResults) {
    entries.push(...companionLogEntries(comp))
  }

  return entries
}

function buildFortifiedLogEntries(r: FortifiedRoundResult): LogEntry[] {
  const entries: LogEntry[] = []

  // Player status damage
  if (r.statusEffectDamage.player > 0) {
    entries.push({
      text: t('combat.bleedDamage', { amount: r.statusEffectDamage.player }),
      css: 'combat__round--status combat__round--status-player',
    })
  }

  if (r.playerStunned) {
    entries.push({ text: t('combat.stunned'), css: 'combat__round--status-player' })
  }

  // Per-defender status tick damage
  for (const dr of r.defenderResults) {
    if (dr.statusEffectDamage > 0) {
      entries.push({
        text: t('combat.defenderStatusDamage', {
          name: t(`creature.${dr.key}`),
          amount: dr.statusEffectDamage,
        }),
        css: 'combat__round--status',
      })
    }
    if (dr.stunned) {
      entries.push({
        text: t('combat.defenderStunned', { name: t(`creature.${dr.key}`) }),
        css: 'combat__round--status',
      })
    }
  }

  // Gate destruction
  if (r.gateDestroyed) {
    entries.push({
      text: t('combat.gateDestroyed'),
      css: 'combat__round--crit',
    })
  }

  // Player damage dealt
  if (r.playerDamageDealt > 0) {
    entries.push({
      text: t('combat.fortPlayerDealt', { dealt: r.playerDamageDealt }),
      css: '',
    })
  }

  // Per-defender damage dealt (archer attacks)
  for (const dr of r.defenderResults) {
    if (dr.damageDealt > 0) {
      entries.push({
        text: t('combat.archerAttack', {
          name: t(`creature.${dr.key}`),
          dealt: dr.damageDealt,
        }),
        css: 'combat__round--flee-fail',
      })
    }
    if (!dr.alive && dr.damageTaken > 0) {
      entries.push({
        text: t('combat.defenderDefeated', { name: t(`creature.${dr.key}`) }),
        css: 'combat__round--companion',
      })
    }
  }

  // Critical hit effects
  for (const eff of r.appliedEffects) {
    entries.push(...critEffectEntries(eff))
  }

  // Companion results
  for (const comp of r.companionResults) {
    entries.push(...companionLogEntries(comp))
  }

  return entries
}

function critEffectEntries(eff: { effect: string; amount: number }): LogEntry[] {
  if (eff.effect === 'bleeding') {
    return [{ text: t('combat.critSlash', { amount: eff.amount }), css: 'combat__round--crit' }]
  }
  if (eff.effect === 'stun') {
    return [{ text: t('combat.critCrush'), css: 'combat__round--crit' }]
  }
  if (eff.effect === 'burning') {
    return [{ text: t('combat.burnDamage', { amount: eff.amount }), css: 'combat__round--status' }]
  }
  if (eff.effect === 'frozen') {
    return [{ text: t('combat.frozen'), css: 'combat__round--status' }]
  }
  return []
}

function companionLogEntries(comp: {
  name: string
  statusEffectDamage: number
  stunned: boolean
  damageDealt: number
  damageTaken: number
  appliedEffects: { effect: string; amount: number }[]
  alive: boolean
}): LogEntry[] {
  const entries: LogEntry[] = []
  const compName = t(`creature.${comp.name}`)

  if (comp.statusEffectDamage > 0) {
    entries.push({
      text: t('combat.companionStatusDamage', { name: compName, amount: comp.statusEffectDamage }),
      css: 'combat__round--status',
    })
  }
  if (comp.stunned) {
    entries.push({
      text: t('combat.companionStunned', { name: compName }),
      css: 'combat__round--status',
    })
  }
  if (comp.damageDealt > 0) {
    entries.push({
      text: t('combat.companionHit', { name: compName, dealt: comp.damageDealt }),
      css: 'combat__round--companion',
    })
  }
  if (comp.damageTaken > 0) {
    entries.push({
      text: t('combat.companionTookDamage', { name: compName, amount: comp.damageTaken }),
      css: 'combat__round--status-player',
    })
  }
  for (const eff of comp.appliedEffects) {
    if (eff.effect === 'bleeding') {
      entries.push({
        text: t('combat.companionBleeding', { name: compName, amount: eff.amount }),
        css: 'combat__round--crit',
      })
    } else if (eff.effect === 'stun') {
      entries.push({
        text: t('combat.companionCritStun', { name: compName }),
        css: 'combat__round--crit',
      })
    } else if (eff.effect === 'burning') {
      entries.push({
        text: t('combat.companionBurning', { name: compName, amount: eff.amount }),
        css: 'combat__round--status',
      })
    } else if (eff.effect === 'frozen') {
      entries.push({
        text: t('combat.companionFrozen', { name: compName }),
        css: 'combat__round--status',
      })
    }
  }
  if (!comp.alive) {
    entries.push({
      text: t('combat.companionDied', { name: compName }),
      css: 'combat__round--flee-fail',
    })
  }
  return entries
}
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
  position: relative;
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

.combat__slot--selected {
  filter: drop-shadow(0 0 3px #d4a017);
}

.combat__targeting {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 100;
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

.combat__round--crit {
  color: #d4a017;
  font-weight: 600;
}

.combat__round--status {
  color: #8e44ad;
}

.combat__round--status-player {
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
