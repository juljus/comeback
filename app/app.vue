<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- Setup Screen -->
    <div v-if="game.phase === 'setup'" class="p-8 max-w-md mx-auto">
      <h1 class="text-4xl font-bold mb-2">Comeback</h1>
      <p class="text-gray-400 mb-8">A fantasy board game RPG</p>

      <div class="space-y-4">
        <div>
          <label class="block text-sm text-gray-400 mb-1">Number of Players</label>
          <select
            v-model="playerCount"
            class="w-full bg-gray-800 rounded px-3 py-2"
          >
            <option :value="2">2 Players</option>
            <option :value="3">3 Players</option>
            <option :value="4">4 Players</option>
          </select>
        </div>

        <div v-for="i in playerCount" :key="i" class="flex items-center gap-2">
          <div
            class="w-4 h-4 rounded-full"
            :style="{ backgroundColor: playerColors[i - 1] }"
          />
          <input
            v-model="playerNames[i - 1]"
            :placeholder="`Player ${i}`"
            class="flex-1 bg-gray-800 rounded px-3 py-2"
          />
        </div>

        <button
          @click="startGame"
          class="w-full bg-green-600 hover:bg-green-700 rounded py-3 font-semibold mt-4"
        >
          Start Game
        </button>
      </div>
    </div>

    <!-- Game Screen -->
    <div v-else class="p-4">
      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <div>
          <span class="text-gray-400">Turn {{ game.turn }}</span>
          <span class="mx-2">•</span>
          <span
            class="font-semibold"
            :style="{ color: game.activePlayer?.color }"
          >
            {{ game.activePlayer?.name }}
          </span>
          <span class="text-gray-400 ml-2">({{ game.actionPhase }})</span>
        </div>
        <div class="text-gray-400">
          Actions: {{ game.actionsRemaining }}/3
        </div>
      </div>

      <!-- Board -->
      <div class="relative w-full aspect-square max-w-2xl mx-auto bg-gray-800 rounded-lg">
        <!-- Board squares -->
        <div
          v-for="square in game.board"
          :key="square.index"
          class="absolute w-16 h-16 -ml-8 -mt-8 flex flex-col items-center justify-center rounded-lg text-xs cursor-pointer transition-transform hover:scale-110"
          :class="[
            square.isUtility ? 'bg-gray-700' : 'bg-gray-600',
            isPlayerHere(square.index) ? 'ring-2 ring-white' : ''
          ]"
          :style="{
            left: square.coords.x + '%',
            top: square.coords.y + '%',
          }"
          :title="square.name"
        >
          <span class="font-semibold truncate w-full text-center px-1">
            {{ square.name.slice(0, 8) }}
          </span>
          <span v-if="square.owner !== null" class="text-[10px]">
            👑 P{{ square.owner + 1 }}
          </span>
          <!-- Player markers -->
          <div class="flex gap-0.5 mt-1">
            <div
              v-for="player in getPlayersAtSquare(square.index)"
              :key="player.index"
              class="w-3 h-3 rounded-full border border-white"
              :style="{ backgroundColor: player.color }"
            />
          </div>
        </div>
      </div>

      <!-- Player Panel -->
      <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="player in game.players"
          :key="player.index"
          class="bg-gray-800 rounded-lg p-3"
          :class="{ 'ring-2': game.currentPlayer === player.index }"
          :style="{ '--tw-ring-color': player.color }"
        >
          <div class="flex items-center gap-2 mb-2">
            <div
              class="w-3 h-3 rounded-full"
              :style="{ backgroundColor: player.color }"
            />
            <span class="font-semibold">{{ player.name }}</span>
          </div>
          <div class="text-sm text-gray-400 space-y-1">
            <div>HP: {{ player.hp }}/{{ player.maxHp }}</div>
            <div>Gold: {{ player.gold }}</div>
            <div>Position: {{ game.board[player.position]?.name }}</div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="game.activePlayer" class="mt-4 flex gap-2 justify-center">
        <button
          @click="game.movePlayer('backward')"
          :disabled="game.actionsRemaining <= 0"
          class="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded px-4 py-2"
        >
          ← Back
        </button>
        <button
          @click="game.movePlayer('forward')"
          :disabled="game.actionsRemaining <= 0"
          class="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded px-4 py-2"
        >
          Forward →
        </button>
        <button
          @click="game.endTurn()"
          class="bg-blue-600 hover:bg-blue-700 rounded px-4 py-2"
        >
          End Turn
        </button>
        <button
          @click="game.resetGame()"
          class="bg-red-600 hover:bg-red-700 rounded px-4 py-2"
        >
          Reset
        </button>
      </div>

      <!-- Current Square Info -->
      <div v-if="game.activePlayerSquare" class="mt-4 max-w-md mx-auto bg-gray-800 rounded-lg p-4">
        <h3 class="font-semibold mb-2">{{ game.activePlayerSquare.name }}</h3>
        <div class="text-sm text-gray-400">
          <div v-if="game.activePlayerSquare.owner !== null">
            Owner: Player {{ game.activePlayerSquare.owner + 1 }}
          </div>
          <div v-else>
            Neutral territory
          </div>
          <div v-if="game.activePlayerSquare.isUtility" class="text-mana-arcane">
            Utility Land
          </div>
        </div>
      </div>
    </div>

    <!-- Game Over -->
    <div
      v-if="game.phase === 'finished'"
      class="fixed inset-0 bg-black/80 flex items-center justify-center"
    >
      <div class="bg-gray-800 rounded-lg p-8 text-center">
        <h2 class="text-3xl font-bold mb-4">Game Over!</h2>
        <p v-if="game.alivePlayers.length === 1" class="text-xl mb-4">
          <span :style="{ color: game.alivePlayers[0]?.color }">
            {{ game.alivePlayers[0]?.name }}
          </span>
          wins!
        </p>
        <button
          @click="game.resetGame()"
          class="bg-green-600 hover:bg-green-700 rounded px-6 py-2"
        >
          Play Again
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '~/stores/game'

const game = useGameStore()

const playerColors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308']
const playerCount = ref(2)
const playerNames = ref(['', '', '', ''])

function startGame() {
  const names = playerNames.value
    .slice(0, playerCount.value)
    .map((name, i) => name || `Player ${i + 1}`)
  game.initGame(names)
}

function isPlayerHere(squareIndex: number): boolean {
  return game.players.some(p => p.position === squareIndex)
}

function getPlayersAtSquare(squareIndex: number) {
  return game.players.filter(p => p.position === squareIndex)
}
</script>
