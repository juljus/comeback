<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-8">
    <h1 class="text-4xl font-bold">{{ $t('ui.gameTitle') }}</h1>

    <div class="flex gap-4 text-lg">
      <span class="text-gray-400">{{ $t('action.move') }}</span>
      <span class="text-gray-400">{{ $t('action.attackLand') }}</span>
      <span class="text-gray-400">{{ $t('ui.endTurn') }}</span>
      <span class="text-gray-400">{{ $t('ui.spells') }}</span>
    </div>

    <div class="flex gap-3">
      <button
        v-for="locale in locales"
        :key="locale.code"
        class="px-4 py-2 rounded transition-colors"
        :class="
          locale.code === currentLocale
            ? 'bg-white text-gray-900 font-bold'
            : 'bg-gray-700 hover:bg-gray-600'
        "
        @click="setLocale(locale.code)"
      >
        {{ locale.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { locale: currentLocale, locales: rawLocales, setLocale } = useI18n()

const locales = computed(() => rawLocales.value.filter((l) => typeof l !== 'string'))
</script>
