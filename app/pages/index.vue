<template>
  <div class="menu">
    <h1 class="menu__title">{{ $t('ui.gameTitle') }}</h1>

    <div class="menu__form">
      <label class="menu__label">
        {{ $t('ui.playerName') }}
        <input v-model="playerName" class="menu__input" type="text" />
      </label>

      <button class="menu__btn" :disabled="!playerName.trim()" @click="startGame">
        {{ $t('ui.newGame') }}
      </button>
    </div>

    <div class="menu__lang">
      <button
        v-for="locale in locales"
        :key="locale.code"
        class="menu__lang-btn"
        :class="{ 'menu__lang-btn--active': locale.code === currentLocale }"
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

const router = useRouter()
const { startNewGame } = useGameState()

const playerName = ref('')

function startGame() {
  const name = playerName.value.trim()
  if (!name) return
  startNewGame([name])
  router.push('/game')
}
</script>

<style scoped>
.menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 2rem;
  background: #f5f0e6;
  color: #3d3029;
}

.menu__title {
  font-size: 2.5rem;
  font-weight: 300;
  letter-spacing: 0.05em;
}

.menu__form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.menu__label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: #6b5e50;
}

.menu__input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #c4b899;
  background: #faf6ee;
  color: #3d3029;
  font-size: 1rem;
  outline: none;
  width: 220px;
}

.menu__input:focus {
  border-color: #a89878;
}

.menu__btn {
  padding: 0.5rem 1.5rem;
  border: 1px solid #c4b899;
  background: #ebe4d4;
  color: #3d3029;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.menu__btn:hover:not(:disabled) {
  background: #dfd6c2;
}

.menu__btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.menu__lang {
  display: flex;
  gap: 0.5rem;
}

.menu__lang-btn {
  padding: 0.3rem 0.75rem;
  border: 1px solid #d9d0c1;
  background: transparent;
  color: #6b5e50;
  font-size: 0.75rem;
  cursor: pointer;
}

.menu__lang-btn--active {
  background: #ebe4d4;
  color: #3d3029;
  font-weight: 600;
}
</style>
