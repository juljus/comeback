<template>
  <div class="inventory">
    <div class="inventory__columns">
      <div class="inventory__col">
        <h3 class="inventory__subtitle">{{ $t('ui.equipped') }}</h3>
        <div class="inventory__slots">
          <div
            v-for="slot in SLOTS"
            :key="slot"
            class="inventory__slot"
            :class="{
              'inventory__slot--selected':
                selectedEquipSlot === slot && selectedItemSource === 'equipment',
            }"
            @click="equipped[slot] ? selectEquippedItem(slot) : undefined"
          >
            <span class="inventory__slot-label">{{ $t(`slot.${slot}`) }}</span>
            <span
              class="inventory__slot-value"
              :class="{ 'inventory__slot-value--empty': !equipped[slot] }"
            >
              {{ equipped[slot] ? $t(`item.${equipped[slot]}`) : '---' }}
            </span>
          </div>
        </div>
      </div>

      <div class="inventory__col inventory__col--middle">
        <h3 class="inventory__subtitle">{{ $t('ui.backpack') }}</h3>
        <div v-if="currentPlayer!.inventory.length" class="inventory__items">
          <div
            v-for="(itemKey, idx) in currentPlayer!.inventory"
            :key="`${itemKey}-${idx}`"
            class="inventory__item"
            :class="{
              'inventory__item--selected':
                selectedItemKey === itemKey && selectedItemSource === 'inventory',
            }"
            @click="selectInventoryItem(itemKey)"
          >
            {{ $t(`item.${itemKey}`) }}
          </div>
        </div>
        <p v-else class="inventory__empty">{{ $t('ui.empty') }}</p>
      </div>

      <div class="inventory__col inventory__col--detail">
        <template v-if="selectedItemKey && selectedItemDef">
          <div class="inventory__detail-name">{{ $t(`item.${selectedItemKey}`) }}</div>
          <div class="inventory__detail-stats">
            <span v-if="selectedItemDef.diceCount"
              >{{ selectedItemDef.diceCount }}d{{ selectedItemDef.diceSides }}
              {{ selectedItemDef.damageType }}</span
            >
            <span v-if="selectedItemDef.bonusArmor"
              >+{{ selectedItemDef.bonusArmor }} {{ $t('stat.armor') }}</span
            >
            <span v-if="selectedItemDef.bonusStrength"
              >+{{ selectedItemDef.bonusStrength }} {{ $t('stat.strength') }}</span
            >
            <span v-if="selectedItemDef.bonusDexterity"
              >+{{ selectedItemDef.bonusDexterity }} {{ $t('stat.dexterity') }}</span
            >
            <span v-if="selectedItemDef.bonusPower"
              >+{{ selectedItemDef.bonusPower }} {{ $t('stat.power') }}</span
            >
            <span v-if="selectedItemDef.bonusSpeed">+{{ selectedItemDef.bonusSpeed }} speed</span>
            <span v-if="selectedItemDef.bonusStrikes"
              >+{{ selectedItemDef.bonusStrikes }} strikes</span
            >
          </div>
          <div v-if="selectedItemDef.reqStrength > 1" class="inventory__detail-req">
            {{ $t('ui.requiresStrength', { amount: selectedItemDef.reqStrength }) }}
          </div>
          <div class="inventory__detail-actions">
            <template v-if="selectedItemSource === 'inventory'">
              <button
                v-if="isScroll"
                class="inventory__btn"
                :disabled="!hasActions"
                @click="onUseScroll"
              >
                {{ $t('action.useScroll') }}
              </button>
              <template v-if="selectedItemDef.type === 'ring'">
                <button
                  class="inventory__btn"
                  :disabled="!canEquipSelected"
                  @click="doEquip('ringRight')"
                >
                  {{ equipButtonLabel('ringRight') }} -- {{ $t('slot.ringRight') }}
                </button>
                <button
                  class="inventory__btn"
                  :disabled="!canEquipSelected"
                  @click="doEquip('ringLeft')"
                >
                  {{ equipButtonLabel('ringLeft') }} -- {{ $t('slot.ringLeft') }}
                </button>
              </template>
              <button
                v-else-if="defaultSlot"
                class="inventory__btn"
                :disabled="!canEquipSelected"
                @click="doEquip(defaultSlot)"
              >
                {{ equipButtonLabel(defaultSlot) }}
              </button>
            </template>
            <button
              v-if="selectedItemSource === 'equipment'"
              class="inventory__btn"
              :disabled="!hasActions"
              @click="doUnequip()"
            >
              {{ $t('action.unequip') }}
            </button>
          </div>
        </template>
        <p v-if="scrollMessage" class="inventory__scroll-msg">{{ scrollMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ItemSlot } from '~~/game/types'
import { ITEMS } from '~~/game/data'
import { canEquipItem, itemTypeToSlot } from '~~/game/engine'

const { t: $t } = useI18n()

const {
  currentPlayer,
  selectedItemKey,
  selectedItemSource,
  selectedEquipSlot,
  selectInventoryItem,
  selectEquippedItem,
  doEquip,
  doUnequip,
  useScroll,
} = useGameState()

const SLOTS: ItemSlot[] = ['weapon', 'head', 'body', 'feet', 'ringRight', 'ringLeft', 'usable']

const equipped = computed(() => currentPlayer.value!.equipment)

const selectedItemDef = computed(() => {
  if (!selectedItemKey.value) return null
  return ITEMS[selectedItemKey.value as keyof typeof ITEMS] ?? null
})

const defaultSlot = computed(() => {
  if (!selectedItemDef.value) return null
  return itemTypeToSlot(selectedItemDef.value.type)
})

const hasActions = computed(() => {
  if (!currentPlayer.value) return false
  return currentPlayer.value.actionsUsed < 3
})

const canEquipSelected = computed(() => {
  if (!hasActions.value || !currentPlayer.value || !selectedItemKey.value) return false
  return canEquipItem(currentPlayer.value, selectedItemKey.value)
})

const isScroll = computed(() => {
  if (!selectedItemDef.value || !selectedItemKey.value) return false
  return selectedItemDef.value.type === 'consumable' && !!selectedItemDef.value.grantsSpell
})

const scrollMessage = ref<string | null>(null)

function onUseScroll() {
  if (!selectedItemKey.value) return
  const result = useScroll(selectedItemKey.value)
  selectedItemKey.value = null
  selectedItemSource.value = null
  if (result) {
    scrollMessage.value = $t('action.spellLearned', {
      spell: $t(`spell.${result.spellKey}`),
      level: result.newLevel,
    })
  }
}

function equipButtonLabel(slot: ItemSlot): string {
  const player = currentPlayer.value
  if (!player) return $t('action.equip')
  return player.equipment[slot] ? $t('action.swap') : $t('action.equip')
}
</script>

<style scoped>
.inventory {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0.5rem 1.5rem;
  color: #4a4035;
}

.inventory__columns {
  display: flex;
  gap: 1.5rem;
  min-height: 0;
}

.inventory__col {
  flex: 1;
  min-width: 0;
}

.inventory__col--middle {
  border-left: 1px solid #d5ccbc;
  padding-left: 1.5rem;
}

.inventory__col--detail {
  border-left: 1px solid #d5ccbc;
  padding-left: 1.5rem;
}

.inventory__subtitle {
  font-size: 0.8rem;
  font-weight: 600;
  color: #8a7e6e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.5rem;
}

.inventory__slots {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.inventory__slot {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.8rem;
  padding: 0.25rem 0.4rem;
  border-bottom: 1px solid #ede7da;
  cursor: pointer;
  border-radius: 3px;
}

.inventory__slot:hover {
  background: #f5f0e8;
}

.inventory__slot--selected {
  background: #e8dfd0;
}

.inventory__slot-label {
  color: #8a7e6e;
}

.inventory__slot-value {
  font-weight: 500;
  color: #4a4035;
}

.inventory__slot-value--empty {
  font-weight: 400;
  font-style: italic;
  color: #b0a590;
}

.inventory__items {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.inventory__item {
  font-size: 0.8rem;
  padding: 0.25rem 0.4rem;
  border-bottom: 1px solid #ede7da;
  cursor: pointer;
  border-radius: 3px;
}

.inventory__item:hover {
  background: #f5f0e8;
}

.inventory__item--selected {
  background: #e8dfd0;
}

.inventory__empty {
  font-size: 0.8rem;
  font-style: italic;
  color: #b0a590;
  margin: 0;
}

.inventory__detail-name {
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.inventory__detail-stats {
  font-size: 0.75rem;
  color: #6b6052;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin-bottom: 0.25rem;
}

.inventory__detail-req {
  font-size: 0.75rem;
  color: #a0522d;
  margin-bottom: 0.25rem;
}

.inventory__detail-actions {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.inventory__btn {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border: 1px solid #c4b89c;
  background: #f5f0e8;
  color: #4a4035;
  border-radius: 3px;
  cursor: pointer;
}

.inventory__btn:hover:not(:disabled) {
  background: #e8dfd0;
}

.inventory__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.inventory__scroll-msg {
  font-size: 0.8rem;
  font-weight: 600;
  color: #8b6914;
  margin: 0.5rem 0 0;
}
</style>
