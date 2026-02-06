import type { GameState, ItemSlot, TimeOfDay } from '~~/game/types'
import type { MovementRoll, NeutralCombatState } from '~~/game/engine'
import {
  calcDoubleBonus,
  calcRestHealing,
  canEquipItem,
  createRng,
  generateBoard,
  createPlayer,
  equipItemFromInventory,
  initNeutralCombat,
  resolveAttackRound,
  resolveFleeAttempt,
  rollMovement,
  unequipItemToInventory,
} from '~~/game/engine'
import { CREATURES, LANDS } from '~~/game/data'

type CenterView = 'location' | 'inventory' | 'movement' | 'rest' | 'landPreview' | 'combat'

/** Map actionsUsed to time of day. Move is separate (dawn -> morning). */
function timeOfDayFromActions(actionsUsed: number): TimeOfDay {
  if (actionsUsed <= 0) return 'morning'
  if (actionsUsed === 1) return 'noon'
  if (actionsUsed === 2) return 'evening'
  return 'nightfall'
}

const BOARD_SIZE = 34

type ItemSource = 'equipment' | 'inventory'

const gameState = ref<GameState | null>(null)
const centerView = ref<CenterView>('location')
const movementRoll = ref<MovementRoll | null>(null)
const doublesCount = ref(0)
const doublesValue = ref(0)
const doublesGold = ref(0)
const restResult = ref<number | null>(null)
const selectedSquareIndex = ref<number | null>(null)
const hasMoved = ref(false)
const combatState = ref<NeutralCombatState | null>(null)
const selectedItemKey = ref<string | null>(null)
const selectedItemSource = ref<ItemSource | null>(null)
const selectedEquipSlot = ref<ItemSlot | null>(null)

let rng: () => number = () => 0

export function useGameState() {
  /** Single entry point for all center view transitions. Cleans up stale state. */
  function showView(view: CenterView) {
    if (view !== 'landPreview') {
      selectedSquareIndex.value = null
    }
    centerView.value = view
  }

  function startNewGame(playerNames: string[]) {
    rng = createRng(Date.now())
    const board = generateBoard(rng)
    const players = playerNames.map((name, i) => createPlayer(i + 1, name, 'male'))

    gameState.value = {
      players,
      board,
      effects: [],
      currentPlayerIndex: 0,
      currentDay: 1,
      timeOfDay: 'dawn',
      turn: 1,
    }
    hasMoved.value = false
    movementRoll.value = null
    restResult.value = null
    combatState.value = null
  }

  function awardDoublesGold(roll: MovementRoll) {
    if (!gameState.value || !roll.isDoubles) return
    const player = gameState.value.players[gameState.value.currentPlayerIndex]!

    if (roll.die1 === doublesValue.value) {
      doublesCount.value++
    } else {
      doublesCount.value = 1
      doublesValue.value = roll.die1
    }

    const bonus = calcDoubleBonus(doublesCount.value)
    player.gold += bonus
    doublesGold.value = bonus
  }

  function move() {
    if (!gameState.value || hasMoved.value) return
    const player = gameState.value.players[gameState.value.currentPlayerIndex]!
    const roll = rollMovement(player.speed, rng)
    movementRoll.value = roll
    doublesCount.value = 0
    doublesValue.value = 0
    doublesGold.value = 0
    awardDoublesGold(roll)
    showView('movement')
  }

  function confirmMove() {
    if (!gameState.value || !movementRoll.value) return
    const player = gameState.value.players[gameState.value.currentPlayerIndex]!
    player.position = (player.position + movementRoll.value.total) % BOARD_SIZE
    hasMoved.value = true
    movementRoll.value = null
    gameState.value.timeOfDay = 'morning'
    showView('location')
  }

  function reroll() {
    if (!gameState.value || !movementRoll.value || !movementRoll.value.isDoubles) return
    const player = gameState.value.players[gameState.value.currentPlayerIndex]!
    const roll = rollMovement(player.speed, rng)
    movementRoll.value = roll
    doublesGold.value = 0
    awardDoublesGold(roll)
  }

  function rest() {
    if (!gameState.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    const square = state.board[player.position]!
    const remainingActions = 3 - player.actionsUsed
    if (remainingActions <= 0) return

    const healing = calcRestHealing(square.healing, 0, remainingActions)
    const hpCap = Math.min(player.strength * 10, player.maxHp)
    const hpBefore = player.hp
    player.hp = Math.min(player.hp + healing, hpCap)

    for (const companion of player.companions) {
      companion.currentHp = Math.min(companion.currentHp + healing, companion.maxHp)
    }

    player.actionsUsed = 3
    state.timeOfDay = timeOfDayFromActions(player.actionsUsed)
    restResult.value = player.hp - hpBefore
    showView('rest')
  }

  function buyLand() {
    if (!gameState.value || !canBuyLand.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    const square = state.board[player.position]!
    const cost = square.price * 10

    player.gold -= cost
    square.owner = player.id
    player.ownedLands.push(player.position)
    player.actionsUsed = 3
    state.timeOfDay = timeOfDayFromActions(player.actionsUsed)
    showView('location')
  }

  function improveIncome() {
    if (!gameState.value || !canImproveIncome.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    const square = state.board[player.position]!
    const landDef = LANDS[square.landKey as keyof typeof LANDS]
    if (!landDef) return

    const remainingActions = 3 - player.actionsUsed
    const baseIncome = landDef.taxIncome
    const bonus = Math.floor(((baseIncome / 2 + 10) / 3) * remainingActions)
    const maxIncome = baseIncome * 3

    square.taxIncome = Math.min(square.taxIncome + bonus, maxIncome)

    if (player.actionsUsed === 0 && square.healing < landDef.healing * 2) {
      square.healing += 1
    }

    player.actionsUsed = 3
    state.timeOfDay = timeOfDayFromActions(player.actionsUsed)
    showView('location')
  }

  function upgradeDefender() {
    if (!gameState.value || !canUpgradeDefender.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    const square = state.board[player.position]!
    const cost = defenderUpgradeCost.value
    if (cost === null) return

    player.gold -= cost
    square.defenderId += 1
    player.actionsUsed += 1
    state.timeOfDay = timeOfDayFromActions(player.actionsUsed)
    showView('location')
  }

  function attackLand() {
    if (!gameState.value || !canAttackLand.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    const square = state.board[player.position]!
    const landDef = LANDS[square.landKey as keyof typeof LANDS]
    if (!landDef) return

    const defenderKey = landDef.defenders[square.defenderId]
    if (!defenderKey) return

    combatState.value = initNeutralCombat(defenderKey, player.hp)
    showView('combat')
  }

  function combatAttack() {
    if (!gameState.value || !combatState.value || combatState.value.resolved) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    if (player.actionsUsed >= 3) return

    const combat = combatState.value
    const result = resolveAttackRound(
      combat,
      player.diceCount,
      player.diceSides,
      0, // bonusDamage -- base melee only for Phase 1
      player.armor,
      player.hp,
      rng,
    )

    combat.defenderHp = result.defenderHp
    combat.actions.push({ type: 'attack', result })
    player.hp = result.playerHp
    player.actionsUsed += 1

    if (result.defenderDefeated) {
      combat.resolved = true
      combat.victory = true
    } else if (result.playerDefeated) {
      combat.resolved = true
      combat.victory = false
      player.alive = false
    }

    state.timeOfDay = timeOfDayFromActions(player.actionsUsed)
  }

  function combatRetreat() {
    if (!gameState.value || !combatState.value || combatState.value.resolved) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    if (player.actionsUsed >= 3) return

    const combat = combatState.value
    const result = resolveFleeAttempt(combat, player.dexterity, player.armor, player.hp, rng)

    combat.actions.push({ type: 'flee', result })
    player.hp = result.playerHp
    player.actionsUsed += 1

    if (result.escaped) {
      combat.resolved = true
      combat.victory = false
    } else if (result.playerDefeated) {
      combat.resolved = true
      combat.victory = false
      player.alive = false
    }

    state.timeOfDay = timeOfDayFromActions(player.actionsUsed)
  }

  function combatFinish() {
    if (!gameState.value || !combatState.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    const combat = combatState.value

    if (combat.victory) {
      const square = state.board[player.position]!
      square.owner = player.id
      player.ownedLands.push(player.position)
    }

    combatState.value = null
    showView('location')
  }

  function clearSelection() {
    selectedItemKey.value = null
    selectedItemSource.value = null
    selectedEquipSlot.value = null
  }

  function selectInventoryItem(itemKey: string) {
    if (selectedItemKey.value === itemKey && selectedItemSource.value === 'inventory') {
      clearSelection()
      return
    }
    selectedItemKey.value = itemKey
    selectedItemSource.value = 'inventory'
    selectedEquipSlot.value = null
  }

  function selectEquippedItem(slot: ItemSlot) {
    if (selectedEquipSlot.value === slot && selectedItemSource.value === 'equipment') {
      clearSelection()
      return
    }
    const player = currentPlayer.value
    if (!player) return
    const itemKey = player.equipment[slot]
    if (!itemKey) return
    selectedItemKey.value = itemKey
    selectedItemSource.value = 'equipment'
    selectedEquipSlot.value = slot
  }

  function doEquip(slot: ItemSlot) {
    if (!gameState.value || !selectedItemKey.value || selectedItemSource.value !== 'inventory')
      return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    if (player.actionsUsed >= 3) return
    if (!canEquipItem(player, selectedItemKey.value)) return

    const updated = equipItemFromInventory(player, selectedItemKey.value, slot)
    updated.actionsUsed += 1
    state.players[state.currentPlayerIndex] = updated
    state.timeOfDay = timeOfDayFromActions(updated.actionsUsed)
    clearSelection()
  }

  function doUnequip() {
    if (!gameState.value || !selectedEquipSlot.value || selectedItemSource.value !== 'equipment')
      return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    if (player.actionsUsed >= 3) return

    const updated = unequipItemToInventory(player, selectedEquipSlot.value)
    updated.actionsUsed += 1
    state.players[state.currentPlayerIndex] = updated
    state.timeOfDay = timeOfDayFromActions(updated.actionsUsed)
    clearSelection()
  }

  function toggleInventory() {
    clearSelection()
    showView(centerView.value === 'inventory' ? 'location' : 'inventory')
  }

  function selectSquare(index: number) {
    if (!gameState.value) return
    if (selectedSquareIndex.value === index && centerView.value === 'landPreview') {
      showView('location')
      return
    }
    selectedSquareIndex.value = index
    centerView.value = 'landPreview'
  }

  function endTurn() {
    if (!gameState.value) return
    const state = gameState.value
    const alivePlayers = state.players.filter((p) => p.alive)
    if (alivePlayers.length === 0) return

    let nextIndex = state.currentPlayerIndex
    do {
      nextIndex = (nextIndex + 1) % state.players.length
    } while (!state.players[nextIndex]!.alive)

    const wrapped = nextIndex <= state.currentPlayerIndex
    state.currentPlayerIndex = nextIndex
    state.players[nextIndex]!.actionsUsed = 0
    state.timeOfDay = 'dawn'

    if (wrapped) {
      state.currentDay++
    }

    hasMoved.value = false
    movementRoll.value = null
    restResult.value = null
    combatState.value = null
    showView('location')
  }

  const currentPlayer = computed(() =>
    gameState.value ? gameState.value.players[gameState.value.currentPlayerIndex] : null,
  )

  const currentSquare = computed(() =>
    gameState.value && currentPlayer.value
      ? gameState.value.board[currentPlayer.value.position]
      : null,
  )

  const selectedSquare = computed(() =>
    gameState.value && selectedSquareIndex.value !== null
      ? gameState.value.board[selectedSquareIndex.value]
      : null,
  )

  const canBuyLand = computed(() => {
    if (!gameState.value || !currentPlayer.value || !currentSquare.value) return false
    const player = currentPlayer.value
    const square = currentSquare.value
    if (!hasMoved.value) return false
    if (square.owner !== 0) return false
    if (player.actionsUsed !== 0) return false
    if (!(square.landKey in LANDS)) return false
    if (player.gold < square.price * 10) return false
    return true
  })

  /** Whether the player is on their own land (used by multiple computeds). */
  const isOnOwnLand = computed(() => {
    if (!currentPlayer.value || !currentSquare.value || !hasMoved.value) return false
    return currentSquare.value.owner === currentPlayer.value.id
  })

  const canImproveIncome = computed(() => {
    if (!isOnOwnLand.value || !currentSquare.value) return false
    const player = currentPlayer.value!
    const square = currentSquare.value
    const landDef = LANDS[square.landKey as keyof typeof LANDS]
    if (!landDef) return false
    if (player.actionsUsed >= 3) return false
    if (square.taxIncome >= landDef.taxIncome * 3) return false
    return true
  })

  const defenderUpgradeCost = computed<number | null>(() => {
    if (!currentSquare.value) return null
    const square = currentSquare.value
    const landDef = LANDS[square.landKey as keyof typeof LANDS]
    if (!landDef) return null
    const nextTier = square.defenderId + 1
    if (nextTier > 3) return null
    const nextDefenderKey = landDef.defenders[nextTier]
    if (!nextDefenderKey) return null
    const creature = CREATURES[nextDefenderKey as keyof typeof CREATURES]
    if (!creature) return null
    // VBA formula: slot 2 = cost*4*2, slot 3 = cost*5*3, slot 4 = cost*6*4
    const slot = nextTier + 1
    return creature.mercTier * (slot + 2) * slot
  })

  const canUpgradeDefender = computed(() => {
    if (!isOnOwnLand.value || !currentPlayer.value) return false
    const player = currentPlayer.value
    if (player.actionsUsed >= 3) return false
    if (defenderUpgradeCost.value === null) return false
    if (player.gold < defenderUpgradeCost.value) return false
    return true
  })

  const canAttackLand = computed(() => {
    if (!gameState.value || !currentPlayer.value || !currentSquare.value) return false
    if (!hasMoved.value) return false
    const player = currentPlayer.value
    const square = currentSquare.value
    if (square.owner !== 0) return false
    if (player.actionsUsed >= 3) return false
    if (!(square.landKey in LANDS)) return false
    return true
  })

  return {
    gameState,
    centerView,
    movementRoll,
    doublesGold,
    restResult,
    selectedSquareIndex,
    hasMoved,
    combatState,
    selectedItemKey,
    selectedItemSource,
    selectedEquipSlot,
    startNewGame,
    move,
    confirmMove,
    reroll,
    rest,
    buyLand,
    improveIncome,
    upgradeDefender,
    attackLand,
    combatAttack,
    combatRetreat,
    combatFinish,
    showView,
    toggleInventory,
    selectSquare,
    selectInventoryItem,
    selectEquippedItem,
    doEquip,
    doUnequip,
    clearSelection,
    endTurn,
    currentPlayer,
    currentSquare,
    selectedSquare,
    canBuyLand,
    canImproveIncome,
    canUpgradeDefender,
    canAttackLand,
    defenderUpgradeCost,
  }
}
