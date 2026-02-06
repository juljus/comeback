<template>
  <div class="locale-toggle">
    <button
      class="locale-toggle__btn"
      :class="{ 'locale-toggle__btn--active': currentLocale === 'et' }"
      @click="setLocale('et')"
    >
      et
    </button>
    <button
      class="locale-toggle__btn"
      :class="{ 'locale-toggle__btn--active': currentLocale === 'en' }"
      @click="setLocale('en')"
    >
      en
    </button>
  </div>
</template>

<script setup lang="ts">
const { locale: currentLocale, setLocale } = useI18n()
</script>

<style scoped>
.locale-toggle {
  position: fixed;
  top: 0.5rem;
  right: 0.75rem;
  display: flex;
  align-items: center;
  border: 1px solid #d9d0c1;
  background: #faf6ee;
  z-index: 100;
}

.locale-toggle__btn {
  padding: 0.3rem 0.5rem;
  border: none;
  background: transparent;
  color: #8a7e6e;
  font-size: 0.7rem;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.15s;
}

.locale-toggle__btn:hover:not(.locale-toggle__btn--active) {
  background: #ebe4d4;
}

.locale-toggle__btn--active {
  background: #ebe4d4;
  color: #3d3029;
  font-weight: 600;
}
</style>
