<template>
  <div v-if="currentPlayer" class="shop-view">
    <div class="shop-view__tabs">
      <button
        class="shop-view__tab"
        :class="{ 'shop-view__tab--active': shopMode === 'buy' }"
        @click="shopMode = 'buy'"
      >
        {{ $t('ui.buyTab') }}
      </button>
      <button
        class="shop-view__tab"
        :class="{ 'shop-view__tab--active': shopMode === 'sell' }"
        @click="shopMode = 'sell'"
      >
        {{ $t('ui.sellTab') }}
      </button>
    </div>

    <div class="shop-view__gold">{{ currentPlayer.gold }} {{ $t('ui.gold') }}</div>

    <div v-if="shopMode === 'buy'" class="shop-view__list">
      <p v-if="buyList.length === 0" class="shop-view__empty">{{ $t('ui.shopEmpty') }}</p>
      <div v-for="(entry, i) in buyList" :key="i" class="shop-view__item">
        <span class="shop-view__item-name">{{ entry.name }}</span>
        <button
          class="shop-view__item-btn"
          :disabled="!entry.canBuy"
          @click="buyFromShop(entry.key)"
        >
          {{ $t('ui.shopBuy', { price: entry.price }) }}
        </button>
      </div>
    </div>

    <div v-else class="shop-view__list">
      <p v-if="sellList.length === 0" class="shop-view__empty">{{ $t('ui.inventoryEmpty') }}</p>
      <div v-for="(entry, i) in sellList" :key="i" class="shop-view__item">
        <span class="shop-view__item-name">{{ entry.name }}</span>
        <button class="shop-view__item-btn" :disabled="!canSell" @click="sellToShop(entry.key)">
          {{ $t('ui.shopSell', { price: entry.sellPrice }) }}
        </button>
      </div>
    </div>

    <button class="shop-view__close" @click="closeShop">{{ $t('ui.close') }}</button>
  </div>
</template>

<script setup lang="ts">
import { ITEMS } from '~~/game/data'
import { calcSellPrice } from '~~/game/engine'

const { t: $t } = useI18n()

const { currentPlayer, shopInventory, shopMode, buyFromShop, sellToShop, closeShop } =
  useGameState()

const buyList = computed(() => {
  return shopInventory.value.map((key) => {
    const item = ITEMS[key as keyof typeof ITEMS]
    return {
      key,
      name: $t(`item.${key}`),
      price: item?.value ?? 0,
      canBuy:
        (currentPlayer.value?.gold ?? 0) >= (item?.value ?? 0) &&
        (currentPlayer.value?.inventory.length ?? 20) < 20 &&
        (currentPlayer.value?.actionsUsed ?? 3) < 3,
    }
  })
})

const sellList = computed(() => {
  if (!currentPlayer.value) return []
  return currentPlayer.value.inventory.map((key) => {
    return {
      key,
      name: $t(`item.${key}`),
      sellPrice: calcSellPrice(key),
    }
  })
})

const canSell = computed(() => (currentPlayer.value?.actionsUsed ?? 3) < 3)
</script>

<style scoped>
.shop-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  color: #4a4035;
  width: 100%;
  max-height: 100%;
  overflow: hidden;
}

.shop-view__tabs {
  display: flex;
  gap: 0.5rem;
}

.shop-view__tab {
  padding: 0.3rem 0.8rem;
  border: 1px solid #c4b899;
  background: #f5f0e6;
  color: #4a4035;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.shop-view__tab:hover {
  background: #ebe4d4;
}

.shop-view__tab--active {
  background: #ebe4d4;
  border-color: #b8a882;
}

.shop-view__gold {
  font-size: 0.75rem;
  font-weight: 600;
  color: #8b6914;
}

.shop-view__list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
  max-width: 18rem;
  overflow-y: auto;
  max-height: 10rem;
  padding: 0 0.5rem;
}

.shop-view__empty {
  font-size: 0.75rem;
  color: #8a7e6e;
  text-align: center;
  margin: 0;
}

.shop-view__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  gap: 0.5rem;
}

.shop-view__item-name {
  color: #3d3029;
}

.shop-view__item-btn {
  padding: 0.2rem 0.5rem;
  border: 1px solid #c4b899;
  background: #f5f0e6;
  color: #4a4035;
  font-size: 0.7rem;
  cursor: pointer;
  transition: background-color 0.15s;
  white-space: nowrap;
}

.shop-view__item-btn:hover:not(:disabled) {
  background: #ebe4d4;
}

.shop-view__item-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.shop-view__close {
  padding: 0.3rem 0.8rem;
  border: 1px solid #c4b899;
  background: #f5f0e6;
  color: #4a4035;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.15s;
  margin-top: 0.25rem;
}

.shop-view__close:hover {
  background: #ebe4d4;
}
</style>
