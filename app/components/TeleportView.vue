<template>
  <div class="teleport-view">
    <h3 class="teleport-view__title">{{ $t('ui.teleportTitle') }}</h3>
    <p class="teleport-view__prompt">{{ $t('ui.teleportSelect') }}</p>

    <div class="teleport-view__list">
      <button
        v-for="dest in teleportDestinations"
        :key="dest.squareIndex"
        class="teleport-view__dest-btn"
        @click="teleportTo(dest.squareIndex)"
      >
        {{ $t(`land.${dest.landKey}`) }} (#{{ dest.squareIndex + 1 }})
      </button>
    </div>

    <button class="teleport-view__cancel" @click="closeTeleport">{{ $t('ui.cancel') }}</button>
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const { teleportDestinations, teleportTo, closeTeleport } = useGameState()
</script>

<style scoped>
.teleport-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  color: #4a4035;
}

.teleport-view__title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: #3d3029;
}

.teleport-view__prompt {
  font-size: 0.75rem;
  color: #8a7e6e;
  margin: 0;
}

.teleport-view__list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 10rem;
  overflow-y: auto;
}

.teleport-view__dest-btn {
  padding: 0.3rem 0.8rem;
  border: 1px solid #c4b899;
  background: #f5f0e6;
  color: #4a4035;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.teleport-view__dest-btn:hover {
  background: #ebe4d4;
}

.teleport-view__cancel {
  padding: 0.3rem 0.8rem;
  border: 1px solid #c4b899;
  background: #f5f0e6;
  color: #4a4035;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.15s;
  margin-top: 0.25rem;
}

.teleport-view__cancel:hover {
  background: #ebe4d4;
}
</style>
