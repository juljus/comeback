<template>
  <div v-if="encounterResult" class="encounter">
    <!-- Phase 1: Invader sees detection result -->
    <template v-if="phase === 'invaderResult'">
      <p v-if="!encounterResult.detected" class="encounter__msg encounter__msg--success">
        {{ $t('encounter.sneakPast') }}
      </p>
      <p v-else class="encounter__msg encounter__msg--detected">
        <span :style="{ color: ownerColor }">{{ encounterResult.ownerName }}</span>
        {{ ' ' }}{{ $t('encounter.detected', { owner: '' }).trim() }}
      </p>

      <template v-if="encounterResult.detected">
        <p class="encounter__pass-screen">
          {{ $t('encounter.passScreen', { owner: encounterResult.ownerName }) }}
        </p>
        <button class="action-btn" @click="goToOwnerDecision">
          {{ $t('combat.continue') }}
        </button>
      </template>
      <template v-else>
        <button class="action-btn" @click="encounterContinue">
          {{ $t('combat.continue') }}
        </button>
      </template>
    </template>

    <!-- Phase 2: Owner decides what to do (initial detection) -->
    <template v-if="phase === 'ownerDecision'">
      <p class="encounter__msg">
        {{
          $t('encounter.ownerChoice', {
            owner: encounterResult.ownerName,
            invader: encounterResult.invaderName,
          })
        }}
      </p>
      <div class="encounter__actions">
        <button class="action-btn" @click="ownerAttack">
          {{ $t('encounter.attack', { name: encounterResult.invaderName }) }}
        </button>
        <button class="action-btn" @click="doOwnerLetBe">
          {{ $t('encounter.letBe') }}
        </button>
      </div>
    </template>

    <!-- Phase 3: Pass screen back to invader after owner "Let Be" -->
    <template v-if="phase === 'passBackToInvader'">
      <p class="encounter__pass-screen">
        {{ $t('encounter.passBackToInvader', { invader: encounterResult.invaderName }) }}
      </p>
      <button class="action-btn" @click="encounterDismiss">
        {{ $t('combat.continue') }}
      </button>
    </template>

    <!-- Phase 4: Owner alerted that invader is attacking (isInvaderAttacking) -->
    <template v-if="phase === 'ownerAlert'">
      <p class="encounter__msg encounter__msg--detected">
        <span :style="{ color: invaderColor }">{{ encounterResult.invaderName }}</span>
        {{ ' ' }}{{ $t('encounter.attackingLand', { invader: '' }).trim() }}
      </p>
      <p class="encounter__pass-screen">
        {{ $t('encounter.passScreen', { owner: encounterResult.ownerName }) }}
      </p>
      <button class="action-btn" @click="goToOwnerDefendDecision">
        {{ $t('combat.continue') }}
      </button>
    </template>

    <!-- Phase 5: Owner decides to defend or walk away -->
    <template v-if="phase === 'ownerDefendDecision'">
      <p class="encounter__msg">
        <span :style="{ color: ownerColor }">{{ encounterResult.ownerName }}</span
        >,
        <span :style="{ color: invaderColor }">{{ encounterResult.invaderName }}</span>
        {{ ' ' }}{{ $t('encounter.attackingLand', { invader: '' }).trim() }}
      </p>
      <div class="encounter__actions">
        <button class="action-btn" @click="ownerDefend">
          {{ $t('encounter.defend', { name: encounterResult.invaderName }) }}
        </button>
        <button class="action-btn" @click="doOwnerWalkAway">
          {{ $t('encounter.walkAway') }}
        </button>
      </div>
    </template>

    <!-- Phase 6: Pass screen back after owner walks away -->
    <template v-if="phase === 'passBackAfterWalkAway'">
      <p class="encounter__msg">
        {{ $t('encounter.ownerWalkedAway', { owner: encounterResult.ownerName }) }}
      </p>
      <p class="encounter__pass-screen">
        {{ $t('encounter.passBackToInvader', { invader: encounterResult.invaderName }) }}
      </p>
      <button class="action-btn" @click="ownerWalkAwayDismiss">
        {{ $t('combat.continue') }}
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { PLAYER_COLORS } from '~/composables/playerColors'

const {
  encounterResult,
  encounterContinue,
  ownerAttack,
  ownerLetBe,
  encounterDismiss,
  ownerDefend,
  ownerWalkAway,
  ownerWalkAwayDismiss,
} = useGameState()

type Phase =
  | 'invaderResult'
  | 'ownerDecision'
  | 'passBackToInvader'
  | 'ownerAlert'
  | 'ownerDefendDecision'
  | 'passBackAfterWalkAway'

const phase = ref<Phase>('invaderResult')

function goToOwnerDecision() {
  phase.value = 'ownerDecision'
}

function goToOwnerDefendDecision() {
  phase.value = 'ownerDefendDecision'
}

function doOwnerLetBe() {
  ownerLetBe()
  phase.value = 'passBackToInvader'
}

function doOwnerWalkAway() {
  ownerWalkAway()
  phase.value = 'passBackAfterWalkAway'
}

// Reset phase when encounter result changes
watch(encounterResult, (val) => {
  if (!val) return
  if (val.isInvaderAttacking) {
    phase.value = 'ownerAlert'
  } else {
    phase.value = 'invaderResult'
  }
})

const ownerColor = computed(() => {
  if (!encounterResult.value) return '#4a4035'
  return PLAYER_COLORS[(encounterResult.value.ownerId - 1) % PLAYER_COLORS.length]!
})

const invaderColor = computed(() => {
  if (!encounterResult.value) return '#4a4035'
  return PLAYER_COLORS[(encounterResult.value.invaderId - 1) % PLAYER_COLORS.length]!
})
</script>

<style scoped>
.encounter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  max-width: 280px;
}

.encounter__msg {
  font-size: 0.85rem;
  color: #4a4035;
  text-align: center;
  margin: 0;
  font-weight: 600;
}

.encounter__msg--success {
  color: #2d6a4f;
}

.encounter__msg--detected {
  color: #c0392b;
}

.encounter__pass-screen {
  font-size: 0.75rem;
  color: #8a7e6e;
  text-align: center;
  margin: 0;
  font-style: italic;
}

.encounter__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
</style>
