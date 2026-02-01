/**
 * Comeback Game Store
 *
 * Main Pinia store that orchestrates all game logic.
 * Business logic is delegated to domain modules for better organization.
 *
 * Module Structure:
 * - types.ts: All type definitions, interfaces, constants
 * - helpers.ts: Pure utility functions, lookups
 * - combat.ts: Combat actions, damage, status effects
 * - magic.ts: Spellcasting, mana, buffs
 * - economy.ts: Shops, items, inventory
 * - movement.ts: Dice, movement, doubles
 * - buildings.ts: Construction, training
 * - events.ts: Event triggers and resolution
 * - companions.ts: Pets, mercenaries, evolution
 */

import { defineStore } from 'pinia'

// Re-export all types for external consumers (app.vue etc.)
export * from './types'

// Import types for internal use
import type {
  GameState,
  GamePhase,
  ActionPhase,
  Player,
  PlayerTitle,
  BoardSquare,
  Equipment,
  DiceRoll,
  CombatState,
  CombatLogEntry,
  DoublesState,
  KingsGiftState,
  EventState,
  BuffEffect,
  CompanionInstance,
  MercenaryInstance,
  ItemType,
  ManaType,
  ManaPool,
} from './types'

import {
  PLAYER_COLORS,
  STARTING_WEAPON_ID,
  DEFAULT_PLAYER_STATS,
  TITLE_THRESHOLDS,
  SHOP_LAND_ID,
  SMITHY_LAND_ID,
  BAZAAR_LAND_ID,
  LIBRARY_ID,
  MAGE_GUILD_ID,
  TRAINING_GROUNDS_ID,
} from './types'

// Import and re-export helpers for external use
export {
  getLandType,
  getLandPrice,
  getDefenderUpgradeCost,
  getLandIncome,
  calculateIncomeImprovement,
  getItemById,
  getPlayerTotalStats,
  getPlayerWeaponDamage,
  getTitleDisplayName,
  getAllSpells,
  getManaTypeName,
  getManaTypeColor,
  getTrainingCost,
  MAX_TRAINING_STAT_CAP,
  generateBoard,
  generateKingsGiftOptions,
  getShopInventory,
} from './helpers'

import {
  getLandType,
  getLandPrice,
  getDefenderUpgradeCost,
  getIncomeImproveCost,
  calculateIncomeImprovement,
  getItemById,
  getPlayerTotalStats,
  getPlayerWeaponDamage,
  generateBoard,
  generateKingsGiftOptions,
  getShopInventory,
} from './helpers'

// Import domain functions
import * as combatModule from './combat'
import * as magicModule from './magic'
import * as economyModule from './economy'
import * as movementModule from './movement'
import * as buildingsModule from './buildings'
import * as eventsModule from './events'
import * as companionsModule from './companions'

// Import and re-export schema helpers
import { getBuildingByName, getBuildingById, getSpellByName, getSpellById } from '~/data/schemas'
export { getBuildingByName, getBuildingById, getSpellByName, getSpellById }

/**
 * Main game store
 */
export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    phase: 'setup',
    turn: 0,
    currentPlayer: 0,
    actionPhase: 'morning',
    actionsRemaining: 3,
    mustMoveFirst: true,
    players: [],
    board: [],
    lastDiceRoll: null,
    combat: null,
    doubles: null,
    kingsGiftPending: null,
    event: null,
  }),

  getters: {
    /**
     * Get current player object
     */
    activePlayer(): Player | null {
      if (this.players.length === 0) return null
      return this.players[this.currentPlayer] ?? null
    },

    /**
     * Get current player's position on board
     */
    activePlayerSquare(): BoardSquare | null {
      const player = this.activePlayer
      if (!player) return null
      return this.board[player.position] ?? null
    },

    /**
     * Check if game is in progress
     */
    isPlaying(): boolean {
      return this.phase === 'playing'
    },

    /**
     * Get living players
     */
    alivePlayers(): Player[] {
      return this.players.filter(p => p.isAlive)
    },

    /**
     * Check if player can take actions (not in round 0, must move first)
     */
    canTakeActions(): boolean {
      return !this.mustMoveFirst && this.actionsRemaining > 0
    },

    /**
     * Check if current player can buy current square
     */
    canBuyCurrentSquare(): boolean {
      const player = this.activePlayer
      const square = this.activePlayerSquare
      if (!player || !square) return false
      if (this.mustMoveFirst) return false
      if (this.actionsRemaining !== 3 || this.actionPhase !== 'morning') return false
      if (square.isUtility) return false
      if (square.owner !== null) return false
      const landType = getLandType(square.landTypeId)
      if (!landType) return false
      return player.gold >= getLandPrice(landType)
    },

    /**
     * Check if current player can conquer current square
     */
    canConquerCurrentSquare(): boolean {
      const player = this.activePlayer
      const square = this.activePlayerSquare
      if (!player || !square) return false
      if (!this.canTakeActions) return false
      if (square.isUtility) return false
      if (square.owner === player.index) return false
      if (square.attackedThisTurn) return false
      return true
    },

    /**
     * Check if current player can upgrade defender on current square
     */
    canUpgradeDefender(): boolean {
      const player = this.activePlayer
      const square = this.activePlayerSquare
      if (!player || !square) return false
      if (!this.canTakeActions) return false
      if (square.owner !== player.index) return false
      if (square.defenderTier >= 4) return false
      const upgradeCost = getDefenderUpgradeCost(square)
      return player.gold >= upgradeCost
    },

    /**
     * Check if current player can improve income on current square
     */
    canImproveIncome(): boolean {
      const player = this.activePlayer
      const square = this.activePlayerSquare
      if (!player || !square) return false
      if (!this.canTakeActions) return false
      if (square.owner !== player.index) return false
      if (square.isUtility) return false
      const improveCost = getIncomeImproveCost(square)
      return player.gold >= improveCost
    },

    /**
     * Check if current square is a shop
     */
    isAtShop(): boolean {
      const square = this.activePlayerSquare
      if (!square) return false
      const landType = getLandType(square.landTypeId)
      if (!landType) return false
      return [SHOP_LAND_ID, SMITHY_LAND_ID, BAZAAR_LAND_ID].includes(landType.id)
    },

    /**
     * Get items available for purchase at current shop
     */
    shopItems(): ItemType[] {
      const square = this.activePlayerSquare
      if (!square) return []
      const landType = getLandType(square.landTypeId)
      if (!landType) return []
      return getShopInventory(landType.id)
    },

    /**
     * Check if player can buy items
     */
    canBuyItems(): boolean {
      const player = this.activePlayer
      if (!player) return false
      if (!this.canTakeActions) return false
      return this.isAtShop
    },

    /**
     * Check if player can sell items
     */
    canSellItems(): boolean {
      const player = this.activePlayer
      if (!player) return false
      if (!this.canTakeActions) return false
      if (!this.isAtShop) return false
      return player.inventory.length > 0
    },

    /**
     * Check if at Training Grounds
     */
    isAtTrainingGrounds(): boolean {
      const square = this.activePlayerSquare
      if (!square) return false
      const landType = getLandType(square.landTypeId)
      return landType?.id === TRAINING_GROUNDS_ID
    },

    /**
     * Check if at Library
     */
    isAtLibrary(): boolean {
      const square = this.activePlayerSquare
      if (!square) return false
      const landType = getLandType(square.landTypeId)
      return landType?.id === LIBRARY_ID
    },

    /**
     * Check if at Mage Guild
     */
    isAtMageGuild(): boolean {
      const square = this.activePlayerSquare
      if (!square) return false
      const landType = getLandType(square.landTypeId)
      return landType?.id === MAGE_GUILD_ID
    },

    /**
     * Get count of lands owned by current player
     */
    playerLandCount(): number {
      const player = this.activePlayer
      if (!player) return 0
      return this.board.filter(sq => sq.owner === player.index).length
    },

    /**
     * Get completed land types (player owns all squares)
     */
    completedLandTypes(): number[] {
      const player = this.activePlayer
      if (!player) return []

      const landTypeSquares = new Map<number, { owned: number; total: number }>()

      for (const square of this.board) {
        if (square.isUtility) continue
        const existing = landTypeSquares.get(square.landTypeId) ?? { owned: 0, total: 0 }
        existing.total++
        if (square.owner === player.index) existing.owned++
        landTypeSquares.set(square.landTypeId, existing)
      }

      const completed: number[] = []
      for (const [landTypeId, counts] of landTypeSquares) {
        if (counts.owned === counts.total && counts.total > 0) {
          completed.push(landTypeId)
        }
      }
      return completed
    },

    /**
     * Check if player can build
     */
    canBuild(): boolean {
      const player = this.activePlayer
      if (!player) return false
      if (!this.canTakeActions) return false
      return this.completedLandTypes.length > 0
    },

    /**
     * Get available buildings for a land type
     */
    getAvailableBuildingsForLand(): (landTypeId: number) => import('./types').BuildingType[] {
      return (landTypeId: number) => {
        const player = this.activePlayer
        if (!player) return []
        return buildingsModule.getAvailableBuildingsForLand(this.board, player, landTypeId)
      }
    },

    /**
     * Get current player's known spells
     */
    playerKnownSpells(): import('./types').SpellType[] {
      const player = this.activePlayer
      if (!player) return []
      return magicModule.getPlayerKnownSpells(player)
    },

    /**
     * Check if player can cast a spell
     */
    canCastSpell(): (spellId: number) => boolean {
      return (spellId: number) => {
        const player = this.activePlayer
        if (!player) return false
        if (!this.canTakeActions) return false
        return magicModule.canCastSpell(player, spellId)
      }
    },

    /**
     * Get total mana count
     */
    playerTotalMana(): number {
      const player = this.activePlayer
      if (!player) return 0
      return Object.values(player.mana).reduce((sum, val) => sum + val, 0)
    },
  },

  actions: {
    /**
     * Initialize a new game
     */
    initGame(playerNames: string[]) {
      if (playerNames.length < 2 || playerNames.length > 4) {
        throw new Error('Game requires 2-4 players')
      }

      this.players = playerNames.map((name, index) => ({
        index,
        name,
        isAlive: true,
        position: 0,
        gold: DEFAULT_PLAYER_STATS.gold,
        hp: DEFAULT_PLAYER_STATS.hp,
        maxHp: DEFAULT_PLAYER_STATS.maxHp,
        stats: { ...DEFAULT_PLAYER_STATS.stats },
        color: PLAYER_COLORS[index] ?? '#888888',
        equipment: {
          weapon: STARTING_WEAPON_ID,
          armor: null,
          helm: null,
          accessory: null,
        },
        inventory: [],
        title: 'commoner' as PlayerTitle,
        pendingKingsGift: false,
        spellKnowledge: {
          'Maagia nool': 1,
          'Maagiline turvis': 1,
          'Kutsu metsloomi': 1,
          'Jumalate viha': 1,
        },
        unlockedMercenaries: [],
        mana: { fire: 0, earth: 0, air: 0, water: 0, death: 0, life: 0, arcane: 0 },
        buffs: [],
        companions: [],
        mercenaries: [],
      }))

      this.board = generateBoard()
      this.phase = 'playing'
      this.turn = 1
      this.currentPlayer = 0
      this.actionPhase = 'morning'
      this.actionsRemaining = 3
      this.mustMoveFirst = true
    },

    /**
     * Roll dice and move
     */
    rollAndMove() {
      const result = movementModule.rollAndMove(this.$state)
      return result
    },

    /**
     * Keep doubles roll
     */
    keepDoublesRoll() {
      return movementModule.keepDoublesRoll(this.$state)
    },

    /**
     * Reroll doubles
     */
    rerollDoubles() {
      return movementModule.rerollDoubles(this.$state)
    },

    /**
     * Consume one action
     */
    consumeAction() {
      this.actionsRemaining--
      if (this.actionsRemaining === 2) this.actionPhase = 'noon'
      else if (this.actionsRemaining === 1) this.actionPhase = 'evening'
      if (this.actionsRemaining <= 0) this.endTurn()
    },

    /**
     * End current player's turn
     */
    endTurn() {
      const currentPlayer = this.players[this.currentPlayer]

      if (currentPlayer) {
        // Expire buffs
        currentPlayer.buffs = currentPlayer.buffs.filter(buff => {
          buff.duration--
          return buff.duration > 0
        })

        // Expire summons
        currentPlayer.companions = currentPlayer.companions.filter(companion => {
          if (companion.turnsRemaining === null) return true
          companion.turnsRemaining--
          return companion.turnsRemaining > 0
        })

        // Expire mercenary contracts
        currentPlayer.mercenaries = currentPlayer.mercenaries.filter(merc => {
          merc.contractTurns--
          return merc.contractTurns > 0
        })
      }

      // Find next alive player
      let nextPlayer = (this.currentPlayer + 1) % this.players.length
      let attempts = 0
      while (this.players[nextPlayer]?.isAlive === false && attempts < this.players.length) {
        nextPlayer = (nextPlayer + 1) % this.players.length
        attempts++
      }

      // Check for game over
      if (this.alivePlayers.length <= 1) {
        this.phase = 'finished'
        return
      }

      if (nextPlayer <= this.currentPlayer) this.turn++

      this.currentPlayer = nextPlayer
      this.actionPhase = 'morning'
      this.actionsRemaining = 3
      this.mustMoveFirst = true

      // Reset per-turn flags
      for (const square of this.board) {
        square.reinforcedThisTurn = false
        square.attackedThisTurn = false
      }
    },

    /**
     * Reset game
     */
    resetGame() {
      this.$reset()
    },

    /**
     * Buy the current land
     */
    buyLand() {
      if (!this.canBuyCurrentSquare) return false

      const player = this.players[this.currentPlayer]
      if (!player) return false
      const square = this.board[player.position]
      if (!square) return false
      const landType = getLandType(square.landTypeId)
      if (!landType) return false

      player.gold -= getLandPrice(landType)
      square.owner = player.index

      this.checkTitlePromotion()
      this.endTurn()
      return true
    },

    /**
     * Start combat
     */
    startCombat() {
      if (!this.canConquerCurrentSquare) return false
      return combatModule.startCombat(this.$state)
    },

    /**
     * Attack in combat
     */
    attackInCombat() {
      if (this.phase !== 'combat' || !this.combat?.active) return null
      if (this.actionsRemaining <= 0) return null
      return combatModule.attackInCombat(this.$state)
    },

    /**
     * Flee from combat
     */
    fleeCombat() {
      return combatModule.fleeCombat(this.$state)
    },

    /**
     * End combat
     */
    endCombat(victory: boolean) {
      combatModule.endCombat(this.$state, victory)
    },

    /**
     * Upgrade defender
     */
    upgradeDefender() {
      if (!this.canUpgradeDefender) return false

      const player = this.players[this.currentPlayer]
      if (!player) return false
      const square = this.board[player.position]
      if (!square) return false

      player.gold -= getDefenderUpgradeCost(square)
      square.defenderTier++
      square.defenderCurrentHp = null

      this.consumeAction()
      return true
    },

    /**
     * Improve income
     */
    improveIncome() {
      if (!this.canImproveIncome) return false

      const player = this.players[this.currentPlayer]
      if (!player) return false
      const square = this.board[player.position]
      if (!square) return false

      player.gold -= getIncomeImproveCost(square)
      const incomeIncrease = calculateIncomeImprovement(
        square.landTypeId,
        square.incomeBonus,
        this.actionPhase
      )
      square.incomeBonus += incomeIncrease

      if (this.actionPhase === 'morning') square.healingBonus += 1

      this.endTurn()
      return true
    },

    /**
     * Buy an item
     */
    buyItem(itemId: number) {
      if (!this.canBuyItems) return false
      const player = this.players[this.currentPlayer]
      if (!player) return false

      const success = economyModule.buyItem(player, this.shopItems, itemId)
      if (success) this.consumeAction()
      return success
    },

    /**
     * Sell an item
     */
    sellItem(itemId: number) {
      if (!this.canSellItems) return false
      const player = this.players[this.currentPlayer]
      if (!player) return false

      const success = economyModule.sellItem(player, itemId)
      if (success) this.consumeAction()
      return success
    },

    /**
     * Equip an item
     */
    equipItem(itemId: number) {
      if (!this.canTakeActions) return false
      const player = this.players[this.currentPlayer]
      if (!player) return false

      const success = economyModule.equipItem(player, itemId)
      if (success) this.consumeAction()
      return success
    },

    /**
     * Unequip an item
     */
    unequipItem(slot: keyof Equipment) {
      if (!this.canTakeActions) return false
      const player = this.players[this.currentPlayer]
      if (!player) return false

      const success = economyModule.unequipItem(player, slot)
      if (success) this.consumeAction()
      return success
    },

    /**
     * Build on a land type
     */
    buildOnLand(landTypeId: number, buildingName: string) {
      if (!this.canBuild) return false
      if (!this.completedLandTypes.includes(landTypeId)) return false

      const player = this.players[this.currentPlayer]
      if (!player) return false

      const success = buildingsModule.buildOnLand(
        this.$state,
        landTypeId,
        buildingName,
        {
          getBuildingByName,
          getCompletedLandTypes: () => this.completedLandTypes,
          canTakeActions: this.canTakeActions,
        },
        {
          consumeAction: () => this.consumeAction(),
          checkTitlePromotion: () => this.checkTitlePromotion(),
        }
      )
      return success
    },

    /**
     * Hire a mercenary
     */
    hireMercenary(mercName: string, contractLength?: number) {
      if (!this.canTakeActions) return { success: false, message: 'Must move first' }
      const result = companionsModule.hireMercenary(this.$state, mercName, contractLength)
      if (result.success) this.consumeAction()
      return result
    },

    /**
     * Train a stat
     */
    trainStat(stat: 'strength' | 'dexterity') {
      if (!this.isAtTrainingGrounds) return false
      if (this.actionsRemaining !== 3 || this.actionPhase !== 'morning') return false

      const success = buildingsModule.trainStat(
        this.$state,
        stat,
        this.isAtTrainingGrounds,
        buildingsModule.getTrainingCost,
        () => this.endTurn()
      )
      return success
    },

    /**
     * Train power
     */
    trainPower() {
      if (!this.isAtMageGuild) return false
      if (this.actionsRemaining !== 3 || this.actionPhase !== 'morning') return false

      const success = buildingsModule.trainPower(
        this.$state,
        this.isAtMageGuild,
        buildingsModule.getTrainingCost,
        () => this.endTurn()
      )
      return success
    },

    /**
     * Train a spell
     */
    trainSpell(spellName: string) {
      if (!this.isAtMageGuild) return { success: false, message: 'Must be at Mage Guild' }
      if (this.actionsRemaining !== 3 || this.actionPhase !== 'morning') {
        return { success: false, message: 'Requires full day' }
      }

      const result = buildingsModule.trainSpell(
        this.$state,
        spellName,
        this.isAtMageGuild,
        () => this.endTurn()
      )
      return result
    },

    /**
     * Check title promotion
     */
    checkTitlePromotion() {
      const player = this.players[this.currentPlayer]
      if (!player) return

      const landCount = this.board.filter(sq => sq.owner === player.index).length
      let newTitle: PlayerTitle = 'commoner'

      if (landCount >= TITLE_THRESHOLDS.duke) newTitle = 'duke'
      else if (landCount >= TITLE_THRESHOLDS.count) newTitle = 'count'
      else if (landCount >= TITLE_THRESHOLDS.baron) newTitle = 'baron'

      const titleRanks: PlayerTitle[] = ['commoner', 'baron', 'count', 'duke']
      const currentRank = titleRanks.indexOf(player.title)
      const newRank = titleRanks.indexOf(newTitle)

      if (newRank > currentRank) {
        player.title = newTitle
        player.pendingKingsGift = true

        if (newTitle !== 'commoner') {
          const giftOptions = generateKingsGiftOptions(newTitle as 'baron' | 'count' | 'duke')
          this.kingsGiftPending = {
            playerIndex: player.index,
            title: newTitle as 'baron' | 'count' | 'duke',
            options: giftOptions,
          }
        }
      }
    },

    /**
     * Select King's Gift
     */
    selectKingsGift(itemId: number) {
      const player = this.players[this.currentPlayer]
      if (!player || !player.pendingKingsGift || !this.kingsGiftPending) return false
      if (this.kingsGiftPending.playerIndex !== player.index) return false

      const selectedItem = this.kingsGiftPending.options.find(item => item.id === itemId)
      if (!selectedItem) return false

      player.inventory.push(itemId)
      player.pendingKingsGift = false
      this.kingsGiftPending = null
      return true
    },

    /**
     * Accept King's Gift by index
     */
    acceptKingsGift(optionIndex: number) {
      if (!this.kingsGiftPending) return false
      if (optionIndex < 0 || optionIndex >= this.kingsGiftPending.options.length) return false
      const selectedItem = this.kingsGiftPending.options[optionIndex]
      if (!selectedItem) return false
      return this.selectKingsGift(selectedItem.id)
    },

    /**
     * Cast a spell
     */
    castSpell(spellId: number, targetIndex?: number) {
      if (!this.canTakeActions) return { success: false, message: 'Must move first' }
      const result = magicModule.castSpell(this.$state, spellId, targetIndex)
      if (result.success) this.consumeAction()
      return result
    },

    /**
     * Cast combat spell
     */
    castCombatSpell(spellId: number) {
      return magicModule.castCombatSpell(this.$state, spellId)
    },

    /**
     * Resolve event
     */
    resolveEvent(choiceIndex?: number) {
      return eventsModule.resolveEvent(this.$state, choiceIndex)
    },

    /**
     * Dismiss event
     */
    dismissEvent() {
      return eventsModule.dismissEvent(this.$state)
    },
  },
})
