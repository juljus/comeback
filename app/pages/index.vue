<template>
  <div class="menu">
    <h1 class="menu__title">{{ $t('ui.gameTitle') }}</h1>

    <div class="menu__form">
      <div v-for="(_, i) in playerNames" :key="i" class="menu__player-row">
        <label class="menu__label">
          {{ $t('ui.player') }} {{ i + 1 }}
          <input v-model="playerNames[i]" class="menu__input" type="text" />
        </label>
        <button v-if="playerNames.length > 2" class="menu__remove-btn" @click="removePlayer(i)">
          &times;
        </button>
      </div>

      <button v-if="playerNames.length < 4" class="menu__add-btn" @click="playerNames.push('')">
        + {{ $t('ui.addPlayer') }}
      </button>

      <button class="menu__btn" :disabled="!canStart" @click="startGame">
        {{ $t('ui.newGame') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { startNewGame } = useGameState()

const playerNames = ref(['', ''])

const canStart = computed(() => playerNames.value.every((n) => n.trim().length > 0))

function removePlayer(index: number) {
  playerNames.value.splice(index, 1)
}

function startGame() {
  const names = playerNames.value.map((n) => n.trim())
  if (names.some((n) => !n)) return
  startNewGame(names)
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

.menu__player-row {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
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

.menu__remove-btn {
  padding: 0.35rem 0.55rem;
  border: 1px solid #d9d0c1;
  background: transparent;
  color: #8a7e6e;
  font-size: 1rem;
  cursor: pointer;
  line-height: 1;
}

.menu__remove-btn:hover {
  color: #9c3a3a;
  border-color: #9c3a3a;
}

.menu__add-btn {
  padding: 0.35rem 1rem;
  border: 1px dashed #c4b899;
  background: transparent;
  color: #8a7e6e;
  font-size: 0.8rem;
  cursor: pointer;
}

.menu__add-btn:hover {
  color: #6b5e50;
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
  margin-top: 0.5rem;
}

.menu__btn:hover:not(:disabled) {
  background: #dfd6c2;
}

.menu__btn:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
