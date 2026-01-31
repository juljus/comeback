<template>
  <div class="min-h-screen bg-gray-900 text-white p-8">
    <h1 class="text-4xl font-bold mb-4">Comeback</h1>
    <p class="text-gray-400 mb-8">A fantasy board game RPG</p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Mobs count -->
      <div class="bg-gray-800 rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-2">Mobs</h2>
        <p class="text-3xl text-mana-fire">{{ mobCount }}</p>
      </div>

      <!-- Spells count -->
      <div class="bg-gray-800 rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-2">Spells</h2>
        <p class="text-3xl text-mana-arcane">{{ spellCount }}</p>
      </div>

      <!-- Items count -->
      <div class="bg-gray-800 rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-2">Items</h2>
        <p class="text-3xl text-mana-earth">{{ itemCount }}</p>
      </div>
    </div>

    <div class="mt-8">
      <h2 class="text-2xl font-semibold mb-4">Sample Mobs</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="mob in sampleMobs"
          :key="mob.id"
          class="bg-gray-800 rounded-lg p-4"
        >
          <h3 class="font-semibold">{{ mob.name.en }}</h3>
          <p class="text-sm text-gray-400">{{ mob.name.et }}</p>
          <p class="text-sm mt-2">
            HP: {{ mob.hp }} | ATK: {{ mob.damage.diceCount }}d{{ mob.damage.diceSides }}+{{ mob.damage.bonus }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import mobsData from './data/mobs.json'
import spellsData from './data/spells.json'
import itemsData from './data/items.json'

const mobCount = mobsData.length
const spellCount = spellsData.length
const itemCount = itemsData.length

const sampleMobs = mobsData.slice(0, 8)
</script>
