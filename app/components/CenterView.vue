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
          <h2 class="center-view__title">
            {{ $t(`land.${currentSquare.landKey}`) }}
            <span v-if="centerView === 'combat' && combatLabel" class="center-view__combat-label">
              ({{ combatLabel }})
            </span>
          </h2>
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
            <button v-if="canLearnSpell" class="action-btn" @click="learnSpellFromCurrentBuilding">
              {{ $t('action.learnSpell') }}
              <template v-if="learnableSpellInfo">
                ({{ spellName(learnableSpellInfo.spellKey) }})
              </template>
            </button>
            <button
              v-if="canTrainSpell"
              class="action-btn"
              :class="{ 'action-btn--active': trainExpanded }"
              @click="toggleTrainSpells"
            >
              {{ $t('action.trainSpell') }}
            </button>
            <template v-if="trainExpanded && canTrainSpell">
              <button
                v-for="entry in trainableSpells"
                :key="entry.key"
                class="action-btn action-btn--spell"
                :disabled="!entry.canAfford"
                @click="trainPlayerSpell(entry.key)"
              >
                {{ spellName(entry.key) }} Lv{{ entry.level }} ({{ entry.cost }}
                {{ $t('ui.gold') }})
              </button>
            </template>
            <button v-if="canOpenShop" class="action-btn" @click="openShop">
              {{ $t('action.buyItems') }}
            </button>
            <button v-if="canUseShrineHeal" class="action-btn" @click="useShrineHeal">
              {{ $t('action.rest') }} (50 {{ $t('ui.gold') }})
            </button>
            <button
              v-for="opt in trainingOptions"
              :key="opt.stat"
              class="action-btn"
              :disabled="!opt.canTrain"
              @click="trainStatAction(opt.stat)"
            >
              {{ $t(`action.train${statLabel(opt.stat)}`) }}
              ({{ opt.cost }} {{ $t('ui.gold') }})
            </button>
            <button v-if="canVisitMercCamp" class="action-btn" @click="openMercenaryCamp">
              {{ $t('action.recruit') }}
            </button>
            <button v-if="recruitableUnit" class="action-btn" @click="recruitUnit">
              {{ $t('action.recruit') }} {{ $t(`creature.${recruitableUnit.creatureKey}`) }} ({{
                recruitableUnit.cost
              }}
              {{ $t('ui.gold') }})
            </button>
            <button v-if="canTeleportFromHere" class="action-btn" @click="openTeleport">
              {{ $t('action.teleport') }}
            </button>
            <button v-if="canBuild" class="action-btn" @click="openBuildMenu">
              {{ $t('ui.build') }}
            </button>
            <button v-if="canPillage" class="action-btn" @click="pillageLandAction">
              {{ $t('action.pillage') }}
            </button>
          </div>
          <CombatView v-else-if="centerView === 'combat'" />
          <InventoryView v-else-if="centerView === 'inventory'" />
          <MovementView v-else-if="centerView === 'movement'" />
          <RestView v-else-if="centerView === 'rest'" />
          <LandPreviewView v-else-if="centerView === 'landPreview'" />
          <RoyalCourtView v-else-if="centerView === 'royalCourt'" />
          <VictoryScreen v-else-if="centerView === 'victory'" />
          <ShopView v-else-if="centerView === 'shop'" />
          <ShrineResultView v-else-if="centerView === 'shrineResult'" />
          <MercenaryCampView v-else-if="centerView === 'mercenaryCamp'" />
          <TeleportView v-else-if="centerView === 'teleport'" />
          <BuildView v-else-if="centerView === 'build'" />
        </div>

        <div class="center-view__bottom-wrapper">
          <p v-if="spellCastMessage" class="center-view__spell-msg">{{ spellCastMessage }}</p>
          <div v-if="spellsExpanded" class="center-view__spell-row">
            <button
              v-for="s in adventureSpells"
              :key="s.key"
              class="action-btn action-btn--spell"
              :disabled="!s.hasMana || hasRested"
              @click="onAdventureSpellClick(s.key)"
            >
              <span
                class="center-view__spell-dot"
                :style="{ background: MANA_COLORS[s.spell.manaType] }"
              ></span>
              {{ spellName(s.key) }}
              <span class="center-view__spell-cost">{{ s.spell.manaCost }}</span>
            </button>
          </div>
          <div class="center-view__bottom">
            <button class="action-btn" :disabled="!hasMoved || hasRested || inCombat" @click="rest">
              {{ $t('action.rest') }}
            </button>
            <button
              class="action-btn"
              :class="{ 'action-btn--active': centerView === 'inventory' }"
              :disabled="!hasMoved || inCombat"
              @click="toggleInventory"
            >
              {{ $t('ui.inventory') }}
            </button>
            <button
              v-if="adventureSpells.length > 0"
              class="action-btn"
              :class="{ 'action-btn--active': spellsExpanded }"
              :disabled="!hasMoved || hasRested || inCombat"
              @click="toggleAdventureSpells"
            >
              {{ $t('ui.spells') }}
            </button>
            <button class="action-btn" :disabled="!hasMoved || inCombat" @click="endTurn">
              {{ $t('ui.endTurn') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <p class="center-view__empty">{{ $t('ui.gameTitle') }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ManaType } from '~~/game/types'
import { SPELLS } from '~~/game/data'

const { t, locale } = useI18n()

const MANA_COLORS: Record<ManaType, string> = {
  fire: '#c0392b',
  earth: '#8B4513',
  air: '#5dade2',
  water: '#2471a3',
  death: '#6c3483',
  life: '#d4a017',
  arcane: '#7f8c8d',
}

const {
  gameState,
  centerView,
  hasMoved,
  canBuyLand,
  canImproveIncome,
  canUpgradeDefender,
  canAttackLand,
  canLearnSpell,
  canTrainSpell,
  defenderUpgradeCost,
  learnableSpellInfo,
  endTurn,
  move,
  rest,
  buyLand,
  improveIncome,
  upgradeDefender,
  attackLand,
  learnSpellFromCurrentBuilding,
  trainPlayerSpell,
  toggleInventory,
  castAdventureSpell,
  adventureSpellResult,
  currentPlayer,
  currentSquare,
  combatState,
  combatEnemyName,
  canOpenShop,
  openShop,
  canUseShrineHeal,
  useShrineHeal,
  trainingOptions,
  canTrain,
  trainStatAction,
  canVisitMercCamp,
  openMercenaryCamp,
  canTeleportFromHere,
  openTeleport,
  recruitableUnit,
  recruitUnit,
  canBuild,
  canPillage,
  openBuildMenu,
  pillageLandAction,
} = useGameState()

const spellsExpanded = ref(false)
const trainExpanded = ref(false)
const spellCastMessage = ref<string | null>(null)

const inCombat = computed(() => centerView.value === 'combat')

const hasRested = computed(() =>
  currentPlayer.value ? currentPlayer.value.actionsUsed >= 3 : false,
)

const hasActions = computed(
  () =>
    canBuyLand.value ||
    canImproveIncome.value ||
    canUpgradeDefender.value ||
    canAttackLand.value ||
    canLearnSpell.value ||
    canTrainSpell.value ||
    canOpenShop.value ||
    canUseShrineHeal.value ||
    canTrain.value ||
    canVisitMercCamp.value ||
    canTeleportFromHere.value ||
    recruitableUnit.value !== null ||
    canBuild.value ||
    canPillage.value,
)

function spellName(key: string): string {
  const spell = SPELLS[key as keyof typeof SPELLS]
  if (!spell) return key
  return locale.value === 'et' ? spell.nameEt : spell.nameEn
}

const adventureSpells = computed(() => {
  if (!currentPlayer.value) return []
  const player = currentPlayer.value
  return Object.entries(player.spellbook)
    .map(([key, level]) => {
      const spell = SPELLS[key as keyof typeof SPELLS]
      if (!spell) return null
      if (spell.usableIn !== 'adventure' && spell.usableIn !== 'both') return null
      const hasMana = player.mana[spell.manaType] >= spell.manaCost
      return { key, level, spell, hasMana }
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
})

function creatureName(key: string): string {
  return t(`creature.${key}`)
}

function onAdventureSpellClick(key: string) {
  const ok = castAdventureSpell(key)
  if (ok) {
    const result = adventureSpellResult.value
    if (result?.type === 'summon' && result.summonResult) {
      const s = result.summonResult
      spellCastMessage.value = t('spell.summoned', {
        count: s.count,
        creature: creatureName(s.creatureKey),
        duration: s.duration,
      })
    } else if (result?.type === 'buff' && result.buffResult) {
      spellCastMessage.value = t('spell.buffApplied', {
        spell: spellName(key),
        duration: result.buffResult.duration,
      })
    } else if (result?.type === 'heal' && result.healAmount != null) {
      spellCastMessage.value = t('spell.healed', { amount: result.healAmount })
    } else if (result?.type === 'gold' && result.goldAmount != null) {
      spellCastMessage.value = t('spell.goldGenerated', { amount: result.goldAmount })
    } else {
      spellCastMessage.value = t('combat.spellCast', { spell: spellName(key) })
    }
    spellsExpanded.value = false
    setTimeout(() => {
      spellCastMessage.value = null
    }, 2000)
  }
}

function statLabel(stat: string): string {
  return stat.replace('base', '')
}

function toggleAdventureSpells() {
  spellsExpanded.value = !spellsExpanded.value
}

function toggleTrainSpells() {
  trainExpanded.value = !trainExpanded.value
}

const trainableSpells = computed(() => {
  if (!currentPlayer.value) return []
  const player = currentPlayer.value
  return Object.entries(player.spellbook).map(([key, level]) => {
    const cost = level * 200
    return { key, level, cost, canAfford: player.gold >= cost }
  })
})

const combatLabel = computed(() => {
  if (!combatState.value || !currentPlayer.value) return ''
  const playerName = currentPlayer.value.name
  const enemyName =
    combatEnemyName.value ??
    ((combatState.value.defenders.length ?? 0) > 1
      ? t('combat.fortress')
      : t(`creature.${combatState.value.defenderKey}`))
  return `${playerName} vs ${enemyName}`
})
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
  padding: 1.2rem 0.5rem 0;
}

.center-view__title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: #3d3029;
}

.center-view__combat-label {
  font-size: 0.8rem;
  font-weight: 400;
  color: #8a7e6e;
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

.center-view__bottom-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding-bottom: 0.75rem;
}

.center-view__spell-msg {
  font-size: 0.7rem;
  color: #5b4a8a;
  font-weight: 600;
  margin: 0;
}

.center-view__spell-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.35rem;
  padding: 0 1rem;
}

.center-view__spell-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 0.2rem;
  vertical-align: middle;
}

.center-view__spell-cost {
  font-size: 0.65rem;
  opacity: 0.6;
}

.center-view__bottom {
  display: flex;
  gap: 0.75rem;
  padding: 0 1rem;
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

.action-btn--spell {
  border-color: #8e7cc3;
  color: #5b4a8a;
  font-size: 0.7rem;
  padding: 0.3rem 0.6rem;
}

.action-btn--spell:hover:not(:disabled) {
  background: #e8e0f4;
}
</style>
