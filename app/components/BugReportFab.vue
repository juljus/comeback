<template>
  <button
    v-if="isAuthenticated"
    class="bug-fab"
    :title="$t('bug.reportBug')"
    @click="$emit('click')"
  >
    &#x1F41B;
  </button>
</template>

<script setup lang="ts">
defineEmits<{ click: [] }>()
const { isAuthenticated } = useAuth()
</script>

<style scoped>
.bug-fab {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  border: 2px solid #8b6914;
  background: #f5f0e6;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
}

.bug-fab:hover {
  transform: scale(1.1);
  background: #ebe5d6;
}
</style>
