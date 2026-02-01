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

      <!-- Board (rectangular track like Monopoly) -->
      <div class="relative w-full max-w-4xl mx-auto bg-gray-800 rounded-lg p-2" style="aspect-ratio: 11/8;">
        <!-- Inner area (empty center) -->
        <div class="absolute inset-[12%] bg-gray-900 rounded-lg flex items-center justify-center">
          <div class="text-center text-gray-600">
            <div class="text-2xl font-bold">COMEBACK</div>
            <div class="text-sm">Turn {{ game.turn }}</div>
          </div>
        </div>

        <!-- Board squares -->
        <div
          v-for="square in game.board"
          :key="square.index"
          class="absolute flex flex-col items-center justify-center rounded text-xs cursor-pointer transition-all hover:scale-105 hover:z-10 border border-gray-600"
          :class="[
            square.isUtility ? 'bg-purple-900/50' : 'bg-green-900/50',
            isPlayerHere(square.index) ? 'ring-2 ring-yellow-400' : '',
            square.owner !== null ? 'border-2' : ''
          ]"
          :style="{
            left: `calc(${square.coords.x}% - 4%)`,
            top: `calc(${square.coords.y}% - 5%)`,
            width: '8%',
            height: '10%',
            borderColor: square.owner !== null ? game.players[square.owner]?.color : undefined
          }"
          :title="square.name"
        >
          <span class="font-semibold truncate w-full text-center px-0.5 text-[10px] leading-tight">
            {{ square.name.slice(0, 10) }}
          </span>
          <!-- Player markers -->
          <div class="flex flex-wrap gap-0.5 justify-center mt-0.5">
            <div
              v-for="player in getPlayersAtSquare(square.index)"
              :key="player.index"
              class="w-3 h-3 rounded-full border border-white shadow-lg"
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
            <span v-if="player.title !== 'commoner'" class="text-xs text-yellow-400">
              {{ getTitleDisplayName(player.title) }}
            </span>
          </div>
          <div class="text-sm text-gray-400 space-y-1">
            <div>HP: {{ player.hp }}/{{ player.maxHp }}</div>
            <div class="text-yellow-400">Gold: {{ player.gold }}</div>
            <div class="truncate" :title="getItemName(player.equipment.weapon)">
              ⚔️ {{ getItemName(player.equipment.weapon) }}
            </div>
            <div class="truncate" :title="getItemName(player.equipment.armor)">
              🛡️ {{ getItemName(player.equipment.armor) }}
            </div>
            <!-- Mana display -->
            <div v-if="getPlayerTotalMana(player) > 0" class="flex flex-wrap gap-1 mt-1">
              <span
                v-for="(amount, type) in player.mana"
                :key="type"
                v-show="amount > 0"
                class="text-xs px-1 rounded"
                :style="{ backgroundColor: getManaTypeColor(type as ManaType) + '40', color: getManaTypeColor(type as ManaType) }"
                :title="getManaTypeName(type as ManaType) + ' mana'"
              >
                {{ amount }}
              </span>
            </div>
            <div class="text-xs text-gray-500">
              {{ game.board[player.position]?.name }}
              <span v-if="getPlayerLandCount(player.index) > 0" class="text-green-400">
                ({{ getPlayerLandCount(player.index) }} lands)
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Dice Roll Display -->
      <div v-if="game.lastDiceRoll" class="mt-4 text-center">
        <div class="inline-flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2">
          <span class="text-2xl">🎲</span>
          <span class="text-xl font-bold">{{ game.lastDiceRoll.dice[0] }} + {{ game.lastDiceRoll.dice[1] }} = {{ game.lastDiceRoll.total }}</span>
          <!-- Doubles indicator -->
          <span v-if="game.doubles?.awaitingDecision" class="ml-2 text-yellow-400 font-bold animate-pulse">
            DOUBLES!
          </span>
        </div>
        <!-- Doubles bonus and decision UI -->
        <div v-if="game.doubles?.awaitingDecision" class="mt-3 bg-yellow-900/50 border border-yellow-500 rounded-lg p-4 max-w-md mx-auto">
          <div class="text-yellow-300 mb-2">
            <span class="font-bold">Consecutive doubles: {{ game.doubles.consecutiveCount }}</span>
            <span class="ml-2">+{{ getDoublesBonus(game.doubles.consecutiveCount) }} gold!</span>
          </div>
          <p class="text-sm text-gray-300 mb-3">
            You rolled doubles! Keep this roll to move {{ game.doubles.pendingMove }} spaces, or roll again for a chance at more bonus gold.
          </p>
          <div class="flex gap-3 justify-center">
            <button
              @click="game.keepDoublesRoll()"
              class="bg-green-600 hover:bg-green-700 rounded px-4 py-2 font-semibold"
            >
              Keep (Move {{ game.doubles.pendingMove }})
            </button>
            <button
              @click="game.rerollDoubles()"
              class="bg-yellow-600 hover:bg-yellow-700 rounded px-4 py-2 font-semibold"
            >
              Roll Again
            </button>
          </div>
          <p class="text-xs text-gray-400 mt-2">
            Next doubles bonus: +{{ getDoublesBonus(game.doubles.consecutiveCount + 1) }} gold
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="game.activePlayer" class="mt-4 flex gap-2 justify-center flex-wrap">
        <button
          @click="game.rollAndMove()"
          :disabled="game.actionsRemaining <= 0 || game.doubles?.awaitingDecision"
          class="bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded px-4 py-2"
        >
          🎲 Roll & Move
        </button>
        <button
          @click="showInventory = true"
          class="bg-purple-600 hover:bg-purple-700 rounded px-4 py-2"
        >
          🎒 Inventory
        </button>
        <button
          v-if="game.activePlayer && (Object.keys(game.activePlayer.spellKnowledge).length > 0 || game.playerTotalMana > 0)"
          @click="showMagic = true"
          class="bg-indigo-600 hover:bg-indigo-700 rounded px-4 py-2"
        >
          ✨ Magic
          <span v-if="game.playerTotalMana > 0" class="ml-1 text-xs opacity-75">
            ({{ game.playerTotalMana }})
          </span>
        </button>
        <button
          v-if="game.isAtShop"
          @click="showShop = true"
          class="bg-yellow-600 hover:bg-yellow-700 rounded px-4 py-2"
        >
          🏪 Shop
        </button>
        <button
          v-if="game.canBuild"
          @click="showBuildMenu = true"
          class="bg-orange-600 hover:bg-orange-700 rounded px-4 py-2"
        >
          🏗️ Build
        </button>
        <button
          v-if="game.isAtTrainingGrounds"
          @click="trainStatPrompt"
          :disabled="game.actionsRemaining !== 3 || game.actionPhase !== 'morning' || !canTrainAnyStat"
          class="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 rounded px-4 py-2"
          :title="getTrainStatTooltip()"
        >
          💪 Train STR/DEX
        </button>
        <button
          v-if="game.isAtMageGuild"
          @click="game.trainPower()"
          :disabled="game.actionsRemaining !== 3 || game.actionPhase !== 'morning' || (game.activePlayer?.gold ?? 0) < powerTrainingCost"
          class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded px-4 py-2"
          :title="`Train Power stat (${powerTrainingCost}g, full day)`"
        >
          ✨ Train Power ({{ powerTrainingCost }}g)
        </button>
        <button
          @click="game.endTurn()"
          class="bg-blue-600 hover:bg-blue-700 rounded px-4 py-2"
        >
          Rest (End Turn)
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
        <div class="text-sm text-gray-400 space-y-1">
          <!-- Owner info -->
          <div v-if="game.activePlayerSquare.owner !== null" class="flex items-center gap-2">
            <span>Owner:</span>
            <div
              class="w-3 h-3 rounded-full"
              :style="{ backgroundColor: game.players[game.activePlayerSquare.owner]?.color }"
            />
            <span :style="{ color: game.players[game.activePlayerSquare.owner]?.color }">
              {{ game.players[game.activePlayerSquare.owner]?.name }}
            </span>
          </div>
          <div v-else>
            Neutral territory
          </div>

          <!-- Land type info -->
          <div v-if="game.activePlayerSquare.isUtility" class="text-mana-arcane">
            Utility Land (cannot be owned)
          </div>
          <template v-else>
            <div>Price: {{ currentLandPrice }} gold</div>
            <div>
              Tax Income: {{ currentLandIncome }} gold/turn
              <span v-if="game.activePlayerSquare.incomeBonus > 0" class="text-green-400">
                (+{{ game.activePlayerSquare.incomeBonus }})
              </span>
            </div>
            <div>Defender: {{ currentDefenderName }} (Tier {{ game.activePlayerSquare.defenderTier }})</div>
            <div v-if="game.activePlayerSquare.fortificationLevel > 0" class="text-orange-400">
              🏰 {{ getFortificationName(game.activePlayerSquare.fortificationLevel) }}
              ({{ game.activePlayerSquare.archerCount }} archers)
            </div>
            <div v-if="game.activePlayerSquare.buildings.length > 0" class="text-purple-400">
              Buildings: {{ game.activePlayerSquare.buildings.join(', ') }}
            </div>
          </template>
        </div>

        <!-- Land Actions -->
        <div v-if="!game.activePlayerSquare.isUtility" class="mt-3 flex flex-wrap gap-2">
          <!-- Buy Land (neutral only, requires full day) -->
          <button
            v-if="game.activePlayerSquare.owner === null"
            @click="game.buyLand()"
            :disabled="!game.canBuyCurrentSquare"
            class="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded px-3 py-1.5 text-sm"
            :title="game.actionPhase !== 'morning' ? 'Requires full day (morning)' : ''"
          >
            Buy Land ({{ currentLandPrice }}g)
          </button>

          <!-- Conquer Land (neutral or enemy) - starts combat -->
          <button
            v-if="game.activePlayerSquare.owner !== game.currentPlayer"
            @click="game.startCombat()"
            :disabled="!game.canConquerCurrentSquare"
            class="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded px-3 py-1.5 text-sm"
          >
            ⚔️ Attack Defender
          </button>

          <!-- Upgrade Defender (own land only) -->
          <button
            v-if="game.activePlayerSquare.owner === game.currentPlayer && game.activePlayerSquare.defenderTier < 4"
            @click="game.upgradeDefender()"
            :disabled="!game.canUpgradeDefender"
            class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded px-3 py-1.5 text-sm"
          >
            Upgrade Defender ({{ getUpgradeCost() }}g)
          </button>

          <!-- Improve Income (own land only, uses rest of day) -->
          <button
            v-if="game.activePlayerSquare.owner === game.currentPlayer"
            @click="game.improveIncome()"
            :disabled="!game.canImproveIncome || currentIncomeImprovement === 0"
            class="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed rounded px-3 py-1.5 text-sm"
            :title="currentIncomeImprovement === 0 ? 'Income at maximum for this land' : `Ends turn, income bonus: +${currentIncomeImprovement} (more if done earlier in day)`"
          >
            Improve Income (+{{ currentIncomeImprovement }})
          </button>

          <!-- Max tier indicator -->
          <span
            v-if="game.activePlayerSquare.owner === game.currentPlayer && game.activePlayerSquare.defenderTier >= 4"
            class="text-sm text-gray-500 py-1.5"
          >
            Defender at max tier
          </span>
        </div>
      </div>
    </div>

    <!-- Build Menu -->
    <div
      v-if="showBuildMenu && game.canBuild && game.activePlayer"
      class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
      @click.self="showBuildMenu = false"
    >
      <div class="bg-gray-800 rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Build</h2>
          <button @click="showBuildMenu = false" class="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div class="mb-4 text-sm text-gray-400">
          Gold: <span class="text-yellow-400 font-semibold">{{ game.activePlayer.gold }}</span>
        </div>

        <!-- Land Type Selection -->
        <div class="mb-4">
          <h3 class="text-sm text-gray-400 mb-2">Select Land Type (you own all squares)</h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="landTypeId in game.completedLandTypes"
              :key="landTypeId"
              @click="selectedLandTypeForBuild = landTypeId"
              class="px-3 py-1 rounded text-sm"
              :class="selectedLandTypeForBuild === landTypeId ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'"
            >
              {{ getLandTypeName(landTypeId) }}
            </button>
          </div>
        </div>

        <!-- Available Buildings -->
        <div v-if="selectedLandTypeForBuild !== null">
          <h3 class="text-sm text-gray-400 mb-2">Available Buildings</h3>
          <div v-if="getAvailableBuildings(selectedLandTypeForBuild).length === 0" class="text-gray-500 text-sm">
            No buildings available (all built or missing prerequisites)
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="building in getAvailableBuildings(selectedLandTypeForBuild)"
              :key="building.id"
              class="flex items-center justify-between bg-gray-700 rounded p-3"
            >
              <div>
                <div class="font-medium">{{ building.name.en }}</div>
                <div class="text-xs text-gray-400">
                  <span v-if="building.grantsSpells.length">Grants spells</span>
                  <span v-if="building.unlocksMercenaries.length">Unlocks mercenaries</span>
                  <span v-if="building.prerequisites.length">Requires: {{ building.prerequisites.join(', ') }}</span>
                </div>
              </div>
              <button
                @click="buildBuilding(selectedLandTypeForBuild!, building.name.et)"
                :disabled="game.activePlayer!.gold < building.cost || game.actionsRemaining <= 0"
                class="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded px-3 py-1 text-sm"
              >
                Build ({{ building.cost }}g)
              </button>
            </div>
          </div>
        </div>

        <div class="mt-4 text-xs text-gray-500 text-center">
          Building costs 1 action point
        </div>
      </div>
    </div>

    <!-- King's Gift Modal -->
    <div
      v-if="game.activePlayer?.pendingKingsGift"
      class="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full text-center">
        <h2 class="text-2xl font-bold mb-2 text-yellow-400">King's Gift!</h2>
        <p class="text-gray-300 mb-4">
          You have been promoted to <span class="text-yellow-400 font-semibold">{{ getTitleDisplayName(game.activePlayer.title) }}</span>!
        </p>
        <p class="text-sm text-gray-400 mb-6">Choose your gift from the King:</p>
        <div class="space-y-3">
          <button
            @click="game.acceptKingsGift(0)"
            class="w-full bg-yellow-600 hover:bg-yellow-700 rounded py-2"
          >
            💰 100 Gold
          </button>
          <button
            @click="game.acceptKingsGift(1)"
            class="w-full bg-yellow-600 hover:bg-yellow-700 rounded py-2"
          >
            💰 150 Gold
          </button>
          <button
            @click="game.acceptKingsGift(2)"
            class="w-full bg-yellow-600 hover:bg-yellow-700 rounded py-2"
          >
            💰 200 Gold
          </button>
        </div>
        <p class="mt-4 text-xs text-gray-500">
          (TODO: Real gift choices from original game)
        </p>
      </div>
    </div>

    <!-- Inventory Panel -->
    <div
      v-if="showInventory && game.activePlayer"
      class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
      @click.self="showInventory = false"
    >
      <div class="bg-gray-800 rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Inventory</h2>
          <button @click="showInventory = false" class="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <!-- Player Stats -->
        <div class="bg-gray-900 rounded p-3 mb-4">
          <h3 class="font-semibold mb-2 text-sm text-gray-400">Stats (with equipment)</h3>
          <div class="grid grid-cols-3 gap-2 text-sm">
            <div>STR: {{ playerTotalStats?.strength }}</div>
            <div>DEX: {{ playerTotalStats?.dexterity }}</div>
            <div>POW: {{ playerTotalStats?.power }}</div>
            <div>Armor: {{ playerTotalStats?.armor }}</div>
            <div>Strikes: {{ playerTotalStats?.strikes }}</div>
            <div>HP: {{ playerTotalStats?.hp }}/{{ playerTotalStats?.maxHp }}</div>
          </div>
        </div>

        <!-- Equipment Slots -->
        <div class="mb-4">
          <h3 class="font-semibold mb-2 text-sm text-gray-400">Equipment</h3>
          <div class="space-y-2">
            <div class="flex items-center justify-between bg-gray-700 rounded p-2">
              <span class="text-sm text-gray-400">Weapon:</span>
              <div class="flex items-center gap-2">
                <span>{{ getItemName(game.activePlayer.equipment.weapon) }}</span>
                <button
                  v-if="game.activePlayer.equipment.weapon !== null"
                  @click="unequipSlot('weapon')"
                  :disabled="game.actionsRemaining <= 0"
                  class="text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded px-2 py-0.5"
                >
                  Unequip
                </button>
              </div>
            </div>
            <div class="flex items-center justify-between bg-gray-700 rounded p-2">
              <span class="text-sm text-gray-400">Armor:</span>
              <div class="flex items-center gap-2">
                <span>{{ getItemName(game.activePlayer.equipment.armor) }}</span>
                <button
                  v-if="game.activePlayer.equipment.armor !== null"
                  @click="unequipSlot('armor')"
                  :disabled="game.actionsRemaining <= 0"
                  class="text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded px-2 py-0.5"
                >
                  Unequip
                </button>
              </div>
            </div>
            <div class="flex items-center justify-between bg-gray-700 rounded p-2">
              <span class="text-sm text-gray-400">Helm:</span>
              <div class="flex items-center gap-2">
                <span>{{ getItemName(game.activePlayer.equipment.helm) }}</span>
                <button
                  v-if="game.activePlayer.equipment.helm !== null"
                  @click="unequipSlot('helm')"
                  :disabled="game.actionsRemaining <= 0"
                  class="text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded px-2 py-0.5"
                >
                  Unequip
                </button>
              </div>
            </div>
            <div class="flex items-center justify-between bg-gray-700 rounded p-2">
              <span class="text-sm text-gray-400">Accessory:</span>
              <div class="flex items-center gap-2">
                <span>{{ getItemName(game.activePlayer.equipment.accessory) }}</span>
                <button
                  v-if="game.activePlayer.equipment.accessory !== null"
                  @click="unequipSlot('accessory')"
                  :disabled="game.actionsRemaining <= 0"
                  class="text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded px-2 py-0.5"
                >
                  Unequip
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Inventory Items -->
        <div>
          <h3 class="font-semibold mb-2 text-sm text-gray-400">
            Backpack ({{ game.activePlayer.inventory.length }} items)
          </h3>
          <div v-if="game.activePlayer.inventory.length === 0" class="text-gray-500 text-sm">
            No items in inventory
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="itemId in game.activePlayer.inventory"
              :key="itemId"
              class="flex items-center justify-between bg-gray-700 rounded p-2"
            >
              <div>
                <span class="font-medium">{{ getItemName(itemId) }}</span>
                <span class="text-xs text-gray-400 ml-2">{{ getItemType(itemId) }}</span>
              </div>
              <div class="flex gap-1">
                <button
                  @click="equipFromInventory(itemId)"
                  :disabled="game.actionsRemaining <= 0 || !canEquipItem(itemId)"
                  class="text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded px-2 py-0.5"
                  :title="getEquipTooltip(itemId)"
                >
                  Equip
                </button>
                <button
                  v-if="game.isAtShop"
                  @click="sellFromInventory(itemId)"
                  :disabled="game.actionsRemaining <= 0"
                  class="text-xs bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 rounded px-2 py-0.5"
                >
                  Sell ({{ getSellPrice(itemId) }}g)
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Known Spells -->
        <div v-if="Object.keys(game.activePlayer.spellKnowledge).length > 0" class="mt-4">
          <h3 class="font-semibold mb-2 text-sm text-gray-400">
            ✨ Known Spells ({{ Object.keys(game.activePlayer.spellKnowledge).length }})
          </h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(level, spellName) in game.activePlayer.spellKnowledge"
              :key="spellName"
              class="bg-purple-700/50 rounded px-2 py-1 text-xs"
            >
              {{ spellName }} (Lv{{ level }})
            </span>
          </div>
        </div>

        <!-- Active Buffs -->
        <div v-if="game.activePlayer.buffs.length > 0" class="mt-4">
          <h3 class="font-semibold mb-2 text-sm text-gray-400">
            ✨ Active Buffs ({{ game.activePlayer.buffs.length }})
          </h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(buff, index) in game.activePlayer.buffs"
              :key="index"
              class="rounded px-2 py-1 text-xs"
              :class="{
                'bg-blue-700/50': buff.type === 'armor',
                'bg-red-700/50': buff.type === 'strength',
                'bg-yellow-700/50': buff.type === 'haste'
              }"
            >
              {{ buff.type.charAt(0).toUpperCase() + buff.type.slice(1) }} +{{ buff.power }}
              <span class="opacity-75">({{ buff.duration }}t)</span>
            </span>
          </div>
        </div>

        <!-- Companions (Summons/Pets) -->
        <div v-if="game.activePlayer.companions.length > 0" class="mt-4">
          <h3 class="font-semibold mb-2 text-sm text-gray-400">
            🐾 Companions ({{ game.activePlayer.companions.length }})
          </h3>
          <div class="space-y-2">
            <div
              v-for="companion in game.activePlayer.companions"
              :key="companion.id"
              class="bg-green-700/30 rounded p-2 text-sm"
            >
              <div class="flex justify-between items-center">
                <span class="font-medium">{{ companion.name }}</span>
                <span v-if="companion.isPet" class="text-xs bg-yellow-600 rounded px-1">Pet</span>
                <span v-else-if="companion.turnsRemaining" class="text-xs text-gray-400">
                  {{ companion.turnsRemaining }}t left
                </span>
              </div>
              <div class="text-xs text-gray-400 mt-1">
                HP: {{ companion.hp }}/{{ companion.maxHp }} |
                Armor: {{ companion.armor }} |
                DMG: {{ companion.damage.diceCount }}d{{ companion.damage.diceSides }}
              </div>
            </div>
          </div>
        </div>

        <!-- Active Mercenaries -->
        <div v-if="game.activePlayer.mercenaries.length > 0" class="mt-4">
          <h3 class="font-semibold mb-2 text-sm text-gray-400">
            ⚔️ Hired Mercenaries ({{ game.activePlayer.mercenaries.length }})
          </h3>
          <div class="space-y-2">
            <div
              v-for="merc in game.activePlayer.mercenaries"
              :key="merc.id"
              class="bg-red-700/30 rounded p-2 text-sm"
            >
              <div class="flex justify-between items-center">
                <span class="font-medium">{{ merc.name }}</span>
                <span class="text-xs text-gray-400">{{ merc.contractTurns }}t contract</span>
              </div>
              <div class="text-xs text-gray-400 mt-1">
                HP: {{ merc.hp }}/{{ merc.maxHp }} |
                Armor: {{ merc.armor }} |
                DMG: {{ merc.damage.diceCount }}d{{ merc.damage.diceSides }}
              </div>
            </div>
          </div>
        </div>

        <!-- Unlocked Mercenaries (available to hire) -->
        <div v-if="game.activePlayer.unlockedMercenaries.length > 0" class="mt-4">
          <h3 class="font-semibold mb-2 text-sm text-gray-400">
            🏰 Available Mercenaries ({{ game.activePlayer.unlockedMercenaries.length }})
          </h3>
          <div class="space-y-2">
            <div
              v-for="mercName in game.activePlayer.unlockedMercenaries"
              :key="mercName"
              class="flex items-center justify-between bg-gray-700 rounded p-2"
            >
              <span class="text-sm">{{ mercName }}</span>
              <button
                @click="hireMercenary(mercName)"
                :disabled="game.actionsRemaining <= 0"
                class="text-xs bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded px-2 py-1"
              >
                Hire (5 turns)
              </button>
            </div>
          </div>
        </div>

        <div class="mt-4 text-xs text-gray-500 text-center">
          Equipping/Unequipping costs 1 action point
        </div>
      </div>
    </div>

    <!-- Shop Panel -->
    <div
      v-if="showShop && game.isAtShop && game.activePlayer"
      class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
      @click.self="showShop = false"
    >
      <div class="bg-gray-800 rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">{{ game.activePlayerSquare?.name }}</h2>
          <button @click="showShop = false" class="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div class="mb-4 text-sm text-gray-400">
          Your gold: <span class="text-yellow-400 font-semibold">{{ game.activePlayer.gold }}</span>
        </div>

        <!-- Items for Sale -->
        <div class="space-y-2">
          <div
            v-for="item in game.shopItems"
            :key="item.id"
            class="flex items-center justify-between bg-gray-700 rounded p-3"
          >
            <div>
              <div class="font-medium">{{ item.name.en }}</div>
              <div class="text-xs text-gray-400">
                {{ item.type }}
                <span v-if="item.weapon"> • {{ item.weapon.diceCount }}d{{ item.weapon.diceSides }} {{ item.weapon.damageType }}</span>
                <span v-if="item.bonuses.armor"> • +{{ item.bonuses.armor }} armor</span>
                <span v-if="item.requiredStrength > 1"> • Req STR: {{ item.requiredStrength }}</span>
              </div>
            </div>
            <button
              @click="buyFromShop(item.id)"
              :disabled="!canBuyShopItem(item)"
              class="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded px-3 py-1 text-sm"
            >
              Buy ({{ item.value }}g)
            </button>
          </div>
        </div>

        <div class="mt-4 text-xs text-gray-500 text-center">
          Buying costs 1 action point
        </div>
      </div>
    </div>

    <!-- Magic Panel -->
    <div
      v-if="showMagic && game.activePlayer"
      class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
      @click.self="showMagic = false"
    >
      <div class="bg-gray-800 rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Magic</h2>
          <button @click="showMagic = false" class="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <!-- Mana Pool -->
        <div class="bg-gray-900 rounded p-3 mb-4">
          <h3 class="font-semibold mb-2 text-sm text-gray-400">Mana Pool</h3>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="(amount, type) in game.activePlayer.mana"
              :key="type"
              class="flex items-center gap-1 px-2 py-1 rounded text-sm"
              :style="{ backgroundColor: getManaTypeColor(type as ManaType) + '30' }"
            >
              <span
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: getManaTypeColor(type as ManaType) }"
              />
              <span :style="{ color: getManaTypeColor(type as ManaType) }">
                {{ getManaTypeName(type as ManaType) }}:
              </span>
              <span class="font-bold">{{ amount }}</span>
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            Mana is collected when passing Royal Court
          </p>
        </div>

        <!-- Last Spell Result -->
        <div v-if="lastSpellResult" class="bg-purple-900/50 border border-purple-500 rounded p-3 mb-4 text-sm">
          {{ lastSpellResult }}
        </div>

        <!-- Known Spells -->
        <div>
          <h3 class="font-semibold mb-2 text-sm text-gray-400">
            Known Spells ({{ Object.keys(game.activePlayer.spellKnowledge).length }})
          </h3>
          <div v-if="Object.keys(game.activePlayer.spellKnowledge).length === 0" class="text-gray-500 text-sm">
            No spells learned yet. Build altars and temples to learn spells.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="(level, spellName) in game.activePlayer.spellKnowledge"
              :key="spellName"
              class="bg-gray-700 rounded p-3"
            >
              <div class="flex justify-between items-start">
                <div>
                  <div class="font-medium flex items-center gap-2">
                    {{ getSpellDisplayName(spellName) }}
                    <span class="text-xs text-purple-400">(Lv{{ level }})</span>
                    <span
                      class="w-2 h-2 rounded-full"
                      :style="{ backgroundColor: getSpellManaColor(spellName) }"
                      :title="getSpellManaType(spellName)"
                    />
                  </div>
                  <div class="text-xs text-gray-400">
                    {{ getSpellDescription(spellName) }}
                  </div>
                  <div class="text-xs mt-1">
                    <span :style="{ color: getSpellManaColor(spellName) }">
                      Cost: {{ getSpellManaCost(spellName) }} {{ getSpellManaType(spellName) }}
                    </span>
                    <span v-if="getSpellPower(spellName) > 0" class="ml-2 text-red-400">
                      Power: {{ getSpellPower(spellName) }}
                    </span>
                  </div>
                </div>
                <button
                  @click="castSpellFromPanel(spellName)"
                  :disabled="!canCastSpellByName(spellName)"
                  class="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded px-3 py-1 text-sm"
                >
                  Cast
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 text-xs text-gray-500 text-center">
          Casting a spell costs 1 action point + mana
        </div>
      </div>
    </div>

    <!-- Combat Screen -->
    <div
      v-if="game.phase === 'combat' && game.combat"
      class="fixed inset-0 bg-black/90 flex items-center justify-center p-4"
    >
      <div class="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 class="text-2xl font-bold mb-4 text-center text-red-400">Combat!</h2>

        <!-- Combatants -->
        <div class="flex justify-between items-center mb-6">
          <!-- Player -->
          <div class="text-center">
            <div
              class="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl"
              :style="{ backgroundColor: game.activePlayer?.color }"
            >
              ⚔️
            </div>
            <div class="font-semibold">{{ game.activePlayer?.name }}</div>
            <div class="text-sm">
              HP: <span :class="(game.activePlayer?.hp ?? 0) <= 5 ? 'text-red-400' : 'text-green-400'">
                {{ game.activePlayer?.hp }}
              </span>/{{ game.activePlayer?.maxHp }}
            </div>
          </div>

          <!-- VS -->
          <div class="text-3xl font-bold text-gray-500">VS</div>

          <!-- Defender -->
          <div class="text-center">
            <div class="w-16 h-16 rounded-full mx-auto mb-2 bg-red-900 flex items-center justify-center text-2xl">
              👹
            </div>
            <div class="font-semibold">{{ game.combat.defenderName }}</div>
            <div class="text-sm">
              HP: <span :class="game.combat.defenderHp <= 5 ? 'text-red-400' : 'text-green-400'">
                {{ game.combat.defenderHp }}
              </span>/{{ game.combat.defenderMaxHp }}
            </div>
            <div class="text-xs text-gray-400">Armor: {{ game.combat.defenderArmor }}</div>
          </div>
        </div>

        <!-- HP Bars -->
        <div class="mb-4 space-y-2">
          <div>
            <div class="text-xs text-gray-400 mb-1">{{ game.activePlayer?.name }}</div>
            <div class="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-green-500 transition-all"
                :style="{ width: `${((game.activePlayer?.hp || 0) / (game.activePlayer?.maxHp || 1)) * 100}%` }"
              />
            </div>
          </div>
          <div>
            <div class="text-xs text-gray-400 mb-1">{{ game.combat.defenderName }}</div>
            <div class="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-red-500 transition-all"
                :style="{ width: `${(game.combat.defenderHp / game.combat.defenderMaxHp) * 100}%` }"
              />
            </div>
          </div>
        </div>

        <!-- Combat Log -->
        <div class="bg-gray-900 rounded p-3 mb-4 h-32 overflow-y-auto text-sm">
          <div
            v-for="(entry, i) in game.combat.log"
            :key="i"
            :class="{
              'text-yellow-400': entry.action === 'start',
              'text-green-400': entry.action === 'victory',
              'text-red-400': entry.action === 'defeat' || entry.action === 'timeout',
              'text-blue-300': entry.actor === game.activePlayer?.name,
              'text-orange-300': entry.actor === game.combat.defenderName,
            }"
          >
            {{ entry.message }}
          </div>
        </div>

        <!-- Actions remaining -->
        <div class="text-center text-sm text-gray-400 mb-4">
          Round {{ game.combat.round }} • Actions: {{ game.actionsRemaining }}/3
        </div>

        <!-- Combat Actions -->
        <div class="flex flex-wrap gap-3 justify-center">
          <button
            @click="game.attackInCombat()"
            :disabled="game.actionsRemaining <= 0 || !game.combat.active"
            class="bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded px-6 py-2 font-semibold"
          >
            ⚔️ Attack
          </button>
          <button
            @click="game.fleeCombat()"
            :disabled="game.actionsRemaining <= 0 || !game.combat.active"
            class="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 rounded px-6 py-2 font-semibold"
          >
            🏃 Flee
          </button>
        </div>

        <!-- Combat Spells -->
        <div v-if="getCombatSpells().length > 0 && game.combat.active" class="mt-4">
          <h4 class="text-sm text-gray-400 text-center mb-2">Combat Spells</h4>
          <div class="flex flex-wrap gap-2 justify-center">
            <button
              v-for="spell in getCombatSpells()"
              :key="spell.id"
              @click="castCombatSpell(spell)"
              :disabled="!canCastCombatSpell(spell)"
              class="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded px-3 py-1 text-sm flex items-center gap-1"
              :title="`${spell.description.en} (${spell.manaCost} ${spell.manaType} mana)`"
            >
              <span
                class="w-2 h-2 rounded-full"
                :style="{ backgroundColor: getManaTypeColor(spell.manaType) }"
              />
              {{ spell.name.en }}
              <span class="text-xs opacity-75">({{ spell.manaCost }})</span>
            </button>
          </div>
        </div>

        <!-- Combat ended message -->
        <div v-if="!game.combat.active" class="mt-4 text-center">
          <button
            @click="game.combat = null"
            class="bg-blue-600 hover:bg-blue-700 rounded px-6 py-2"
          >
            Continue
          </button>
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

    <!-- Event Modal -->
    <div
      v-if="game.phase === 'event' && game.event"
      class="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 class="text-2xl font-bold mb-2 text-yellow-400">{{ game.event.eventName }}</h2>
        <p class="text-gray-300 mb-4">{{ game.event.eventDescription }}</p>

        <!-- Choice-based events -->
        <div v-if="game.event.choices && game.event.choices.length > 0" class="space-y-2">
          <p class="text-sm text-gray-400 mb-2">Choose your path:</p>
          <button
            v-for="(choice, index) in game.event.choices"
            :key="index"
            @click="resolveEventChoice(index)"
            class="w-full bg-indigo-600 hover:bg-indigo-700 rounded py-2 px-4 text-left"
          >
            {{ choice.text.en }}
          </button>
        </div>

        <!-- Non-choice events -->
        <div v-else class="flex gap-3 justify-center">
          <button
            @click="resolveEventChoice()"
            class="bg-green-600 hover:bg-green-700 rounded px-6 py-2"
          >
            Continue
          </button>
          <button
            @click="dismissEvent()"
            class="bg-gray-600 hover:bg-gray-700 rounded px-6 py-2"
          >
            Skip
          </button>
        </div>

        <div v-if="eventResult" class="mt-4 text-center text-green-400">
          {{ eventResult }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore, getLandType, getLandPrice, getLandIncome, getItemById, getPlayerTotalStats, getBuildingByName, getTitleDisplayName, getSpellByName, getManaTypeName, getManaTypeColor, getTrainingCost, MAX_TRAINING_STAT_CAP, getDefenderUpgradeCost, calculateIncomeImprovement, type ItemType, type Equipment, type BuildingType, type ManaType, type SpellType } from '~/stores/game'

const game = useGameStore()

// UI state
const showInventory = ref(false)
const showShop = ref(false)
const showBuildMenu = ref(false)
const showMagic = ref(false)
const selectedLandTypeForBuild = ref<number | null>(null)
const lastSpellResult = ref<string | null>(null)

function getItemName(itemId: number | null): string {
  if (itemId === null) return 'None'
  const item = getItemById(itemId)
  return item?.name.en ?? 'Unknown'
}

// Alias for backwards compatibility
function getWeaponName(weaponId: number | null): string {
  return getItemName(weaponId)
}

const playerColors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308']
const playerCount = ref(2)
const playerNames = ref(['', '', '', ''])

// Current land type data
const currentLandType = computed(() => {
  const square = game.activePlayerSquare
  if (!square) return null
  return getLandType(square.landTypeId)
})

// Current land price (with 10x multiplier)
const currentLandPrice = computed(() => {
  const landType = currentLandType.value
  if (!landType) return 0
  return getLandPrice(landType)
})

// Current land total income (base + bonus)
const currentLandIncome = computed(() => {
  const square = game.activePlayerSquare
  if (!square) return 0
  return getLandIncome(square)
})

// Current defender name based on tier
const currentDefenderName = computed(() => {
  const square = game.activePlayerSquare
  const landType = currentLandType.value
  if (!square || !landType) return 'None'
  const defenderIndex = Math.min(square.defenderTier - 1, landType.defenders.length - 1)
  return landType.defenders[defenderIndex] || 'None'
})

// Current income improvement amount (using VBA formula)
const currentIncomeImprovement = computed(() => {
  const square = game.activePlayerSquare
  if (!square) return 0
  return calculateIncomeImprovement(
    square.landTypeId,
    square.incomeBonus,
    game.actionPhase
  )
})

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

function getUpgradeCost(): number {
  const square = game.activePlayerSquare
  if (!square) return 0
  return getDefenderUpgradeCost(square)
}

// Player stats with equipment bonuses
const playerTotalStats = computed(() => {
  const player = game.activePlayer
  if (!player) return null
  return getPlayerTotalStats(player)
})

// Item helpers
function getItemType(itemId: number): string {
  const item = getItemById(itemId)
  return item?.type ?? 'unknown'
}

function getSellPrice(itemId: number): number {
  const item = getItemById(itemId)
  if (!item) return 0
  return Math.floor(item.value * 0.5)
}

function canEquipItem(itemId: number): boolean {
  const player = game.activePlayer
  if (!player) return false
  const item = getItemById(itemId)
  if (!item) return false
  return player.stats.strength >= item.requiredStrength
}

function getEquipTooltip(itemId: number): string {
  const player = game.activePlayer
  if (!player) return ''
  const item = getItemById(itemId)
  if (!item) return ''
  if (player.stats.strength < item.requiredStrength) {
    return `Requires ${item.requiredStrength} STR (you have ${player.stats.strength})`
  }
  return ''
}

function canBuyShopItem(item: ItemType): boolean {
  const player = game.activePlayer
  if (!player) return false
  if (game.actionsRemaining <= 0) return false
  if (player.gold < item.value) return false
  if (player.stats.strength < item.requiredStrength) return false
  return true
}

// Doubles mechanic helpers
function getDoublesBonus(consecutiveCount: number): number {
  // Formula from VBA: 50 * consecutive_count²
  return 50 * (consecutiveCount * consecutiveCount)
}

// Shop/Inventory actions
function buyFromShop(itemId: number) {
  game.buyItem(itemId)
}

function sellFromInventory(itemId: number) {
  game.sellItem(itemId)
}

function equipFromInventory(itemId: number) {
  game.equipItem(itemId)
}

function unequipSlot(slot: keyof Equipment) {
  game.unequipItem(slot)
}

// Building helpers
function getLandTypeName(landTypeId: number): string {
  const landType = getLandType(landTypeId)
  return landType?.name.long.en ?? 'Unknown'
}

function getAvailableBuildings(landTypeId: number): BuildingType[] {
  return game.getAvailableBuildingsForLand(landTypeId)
}

function buildBuilding(landTypeId: number, buildingName: string) {
  game.buildOnLand(landTypeId, buildingName)
}

function getPlayerLandCount(playerIndex: number): number {
  return game.board.filter(sq => sq.owner === playerIndex).length
}

// Training - cost = current_stat² * 5, max cap = 6 for STR/DEX
const strTrainingCost = computed(() => {
  const player = game.activePlayer
  if (!player) return 0
  return getTrainingCost(player.stats.strength)
})

const dexTrainingCost = computed(() => {
  const player = game.activePlayer
  if (!player) return 0
  return getTrainingCost(player.stats.dexterity)
})

const powerTrainingCost = computed(() => {
  const player = game.activePlayer
  if (!player) return 0
  return getTrainingCost(player.stats.power)
})

const canTrainStrength = computed(() => {
  const player = game.activePlayer
  if (!player) return false
  return player.stats.strength < MAX_TRAINING_STAT_CAP && player.gold >= strTrainingCost.value
})

const canTrainDexterity = computed(() => {
  const player = game.activePlayer
  if (!player) return false
  return player.stats.dexterity < MAX_TRAINING_STAT_CAP && player.gold >= dexTrainingCost.value
})

const canTrainAnyStat = computed(() => {
  return canTrainStrength.value || canTrainDexterity.value
})

function getTrainStatTooltip(): string {
  const player = game.activePlayer
  if (!player) return 'Requires full day (morning with 3 actions)'

  const strCost = strTrainingCost.value
  const dexCost = dexTrainingCost.value
  const strMaxed = player.stats.strength >= MAX_TRAINING_STAT_CAP
  const dexMaxed = player.stats.dexterity >= MAX_TRAINING_STAT_CAP

  const parts: string[] = []
  if (strMaxed) {
    parts.push('STR maxed')
  } else {
    parts.push(`STR ${player.stats.strength}->${player.stats.strength + 1}: ${strCost}g`)
  }
  if (dexMaxed) {
    parts.push('DEX maxed')
  } else {
    parts.push(`DEX ${player.stats.dexterity}->${player.stats.dexterity + 1}: ${dexCost}g`)
  }
  return parts.join(' | ') + ' | Requires full day'
}

function trainStatPrompt() {
  const player = game.activePlayer
  if (!player) return

  const strCost = strTrainingCost.value
  const dexCost = dexTrainingCost.value
  const strMaxed = player.stats.strength >= MAX_TRAINING_STAT_CAP
  const dexMaxed = player.stats.dexterity >= MAX_TRAINING_STAT_CAP

  let message = 'Choose stat to train:\n\n'
  if (strMaxed) {
    message += 'Strength: MAXED (level 6)\n'
  } else {
    message += `Strength ${player.stats.strength} -> ${player.stats.strength + 1}: ${strCost}g${player.gold < strCost ? ' (not enough gold)' : ''}\n`
  }
  if (dexMaxed) {
    message += 'Dexterity: MAXED (level 6)\n'
  } else {
    message += `Dexterity ${player.stats.dexterity} -> ${player.stats.dexterity + 1}: ${dexCost}g${player.gold < dexCost ? ' (not enough gold)' : ''}\n`
  }
  message += '\nTrain Strength? (Cancel for Dexterity)'

  const choice = window.confirm(message)
  if (choice) {
    game.trainStat('strength')
  } else {
    game.trainStat('dexterity')
  }
}

// Fortification display
function getFortificationName(level: number): string {
  const names = ['None', 'Fort', 'Citadel', 'Castle']
  return names[level] ?? 'Unknown'
}

// Mana/Magic helpers
function getPlayerTotalMana(player: { mana: Record<string, number> }): number {
  return Object.values(player.mana).reduce((sum, val) => sum + val, 0)
}

function getSpellDisplayName(spellNameEt: string): string {
  const spell = getSpellByName(spellNameEt)
  return spell?.name.en ?? spellNameEt
}

function getSpellDescription(spellNameEt: string): string {
  const spell = getSpellByName(spellNameEt)
  return spell?.description.en ?? ''
}

function getSpellManaType(spellNameEt: string): string {
  const spell = getSpellByName(spellNameEt)
  return spell ? getManaTypeName(spell.manaType) : ''
}

function getSpellManaColor(spellNameEt: string): string {
  const spell = getSpellByName(spellNameEt)
  return spell ? getManaTypeColor(spell.manaType) : '#888'
}

function getSpellManaCost(spellNameEt: string): number {
  const spell = getSpellByName(spellNameEt)
  return spell?.manaCost ?? 0
}

function getSpellPower(spellNameEt: string): number {
  const spell = getSpellByName(spellNameEt)
  return spell?.basePower ?? 0
}

function canCastSpellByName(spellNameEt: string): boolean {
  const spell = getSpellByName(spellNameEt)
  if (!spell) return false
  return game.canCastSpell(spell.id)
}

function castSpellFromPanel(spellNameEt: string) {
  const spell = getSpellByName(spellNameEt)
  if (!spell) return

  const result = game.castSpell(spell.id)
  lastSpellResult.value = result.message

  // Clear message after a few seconds
  setTimeout(() => {
    lastSpellResult.value = null
  }, 3000)
}

// Combat spell helpers
function getCombatSpells(): SpellType[] {
  const player = game.activePlayer
  if (!player) return []

  return Object.keys(player.spellKnowledge)
    .map(name => getSpellByName(name))
    .filter((s): s is SpellType => s !== null)
    .filter(s => s.effectType === 'singleTarget' || s.effectType === 'aoe')
}

function canCastCombatSpell(spell: SpellType): boolean {
  const player = game.activePlayer
  if (!player) return false
  if (!(spell.name.et in player.spellKnowledge)) return false
  return player.mana[spell.manaType] >= spell.manaCost
}

function castCombatSpell(spell: SpellType) {
  game.castCombatSpell(spell.id)
}

// Event helpers
const eventResult = ref<string | null>(null)

function resolveEventChoice(choiceIndex?: number) {
  const result = game.resolveEvent(choiceIndex)
  if (result.success) {
    eventResult.value = result.message
    // Clear after showing
    setTimeout(() => {
      eventResult.value = null
    }, 2000)
  }
}

function dismissEvent() {
  game.dismissEvent()
}

// Mercenary helpers
function hireMercenary(mercName: string) {
  const result = game.hireMercenary(mercName, 5) // 5 turn contract
  if (result.success) {
    // Show success message
    lastSpellResult.value = result.message
    setTimeout(() => {
      lastSpellResult.value = null
    }, 3000)
  }
}
</script>
