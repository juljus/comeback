<template>
  <div class="center-view">
    <template v-if="currentPlayer && currentSquare">
      <div class="center-view__corner center-view__corner--tl">
        <PlayerStats
          v-if="gameState!.players[0]"
          :player="gameState!.players[0]"
          :is-active="gameState!.players[0].id === currentPlayer!.id"
        />
      </div>
      <div class="center-view__corner center-view__corner--tr">
        <PlayerStats
          v-if="gameState!.players[1]"
          :player="gameState!.players[1]"
          :is-active="gameState!.players[1].id === currentPlayer!.id"
        />
      </div>
      <div class="center-view__corner center-view__corner--bl">
        <PlayerStats
          v-if="gameState!.players[2]"
          :player="gameState!.players[2]"
          :is-active="gameState!.players[2].id === currentPlayer!.id"
        />
      </div>
      <div class="center-view__corner center-view__corner--br">
        <PlayerStats
          v-if="gameState!.players[3]"
          :player="gameState!.players[3]"
          :is-active="gameState!.players[3].id === currentPlayer!.id"
        />
      </div>

      <div class="center-view__content">
        <div class="center-view__header">
          <h2 class="center-view__title">{{ $t(`land.${currentSquare.landKey}`) }}</h2>
          <p class="center-view__subtitle">
            {{ $t('ui.day') }} {{ gameState!.currentDay }}
            &middot;
            {{ $t(`ui.${gameState!.timeOfDay}`) }}
          </p>
        </div>

        <div class="center-view__middle">
          <button v-if="!hasMoved && centerView === 'location'" class="move-btn" @click="move">
            {{ $t('action.move') }}
          </button>
          <div v-else-if="centerView === 'location' && hasActions" class="center-view__actions">
            <button v-if="canBuyLand" class="action-btn" @click="buyLand">
              {{ $t('action.buyLand') }} ({{ currentSquare!.price * 10 }})
            </button>
            <button v-if="canImproveIncome" class="action-btn" @click="improveIncome">
              {{ $t('action.improveIncome') }}
            </button>
            <button v-if="canUpgradeDefender" class="action-btn" @click="upgradeDefender">
              {{ $t('action.upgradeDefender') }} ({{ defenderUpgradeCost }})
            </button>
            <button v-if="canAttackLand" class="action-btn" @click="attackLand">
              {{ $t('action.attackLand') }}
            </button>
          </div>
          <CombatView v-else-if="centerView === 'combat'" />
          <InventoryView v-else-if="centerView === 'inventory'" />
          <MovementView v-else-if="centerView === 'movement'" />
          <RestView v-else-if="centerView === 'rest'" />
          <LandPreviewView v-else-if="centerView === 'landPreview'" />
        </div>

        <div class="center-view__bottom">
          <button class="action-btn" :disabled="!hasMoved || hasRested" @click="rest">
            {{ $t('action.rest') }}
          </button>
          <button
            class="action-btn"
            :class="{ 'action-btn--active': centerView === 'inventory' }"
            :disabled="!hasMoved"
            @click="toggleInventory"
          >
            {{ $t('ui.inventory') }}
          </button>
          <button class="action-btn" :disabled="!hasMoved" @click="endTurn">
            {{ $t('ui.endTurn') }}
          </button>
        </div>
      </div>
    </template>

    <template v-else>
      <p class="center-view__empty">{{ $t('ui.gameTitle') }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
const {
  gameState,
  centerView,
  hasMoved,
  canBuyLand,
  canImproveIncome,
  canUpgradeDefender,
  canAttackLand,
  defenderUpgradeCost,
  endTurn,
  move,
  rest,
  buyLand,
  improveIncome,
  upgradeDefender,
  attackLand,
  toggleInventory,
  currentPlayer,
  currentSquare,
} = useGameState()

const hasRested = computed(() =>
  currentPlayer.value ? currentPlayer.value.actionsUsed >= 3 : false,
)

const hasActions = computed(
  () =>
    canBuyLand.value || canImproveIncome.value || canUpgradeDefender.value || canAttackLand.value,
)
</script>

<style scoped>
.center-view {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #4a4035;
}

.center-view__corner {
  position: absolute;
  z-index: 1;
}

.center-view__corner--tl {
  top: 0.3rem;
  left: 0.3rem;
}

.center-view__corner--tr {
  top: 0.3rem;
  right: 0.3rem;
}

.center-view__corner--bl {
  bottom: 0.3rem;
  left: 0.3rem;
}

.center-view__corner--br {
  bottom: 0.3rem;
  right: 0.3rem;
}

.center-view__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.center-view__header {
  text-align: center;
  padding: 0.4rem 0.5rem 0;
}

.center-view__title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: #3d3029;
}

.center-view__subtitle {
  font-size: 0.7rem;
  color: #8a7e6e;
  margin: 0.1rem 0 0;
}

.center-view__middle {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 0;
}

.center-view__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.move-btn {
  padding: 0.6rem 2rem;
  border: 1px solid #c4b899;
  background: #f5f0e6;
  color: #4a4035;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.move-btn:hover {
  background: #ebe4d4;
}

.center-view__bottom {
  display: flex;
  gap: 0.75rem;
  padding: 0 1rem 0.75rem;
}

.center-view__empty {
  font-size: 1.25rem;
  color: #8a7e6e;
}

.action-btn {
  padding: 0.4rem 1rem;
  border: 1px solid #c4b899;
  background: #f5f0e6;
  color: #4a4035;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.action-btn:hover:not(:disabled) {
  background: #ebe4d4;
}

.action-btn--active {
  background: #ebe4d4;
  border-color: #b8a882;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
