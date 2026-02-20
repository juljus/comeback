import type { ActiveEffect, GameState, ItemSlot, TimeOfDay } from '~~/game/types'
import type {
  AttackerProfile,
  FleeResult,
  FortifiedRoundResult,
  MovementRoll,
  NeutralCombatState,
  SpellTarget,
  BuffResult,
  SummonResult,
  RoyalCourtResult,
  VictoryCheckResult,
  ShrineHealResult,
  TeleportDestination,
  MercenaryCampOffer,
} from '~~/game/engine'
import {
  calcDoubleBonus,
  calcRestHealing,
  canEquipItem,
  createRng,
  EMPTY_IMMUNITIES,
  generateBoard,
  createPlayer,
  createSummonedCompanion,
  equipItemFromInventory,
  initFortifiedCombat,
  initNeutralCombat,
  resolveAttackRoundV2,
  resolveCombatSpellRound,
  resolveFleeAttempt,
  resolveFortifiedFlee,
  resolveFortifiedRound,
  rollMovement,
  unequipItemToInventory,
  validateCast,
  deductManaCost,
  calcBuffEffect,
  calcSummonResult,
  calcGoldGeneration,
  calcItemGeneration,
  recalcDerivedStats,
  learnFromScroll,
  learnFromBuilding,
  calcTrainingCost,
  trainSpell,
  calcLandManaRegen,
  calcTotalManaRegen,
  applyManaRegen,
  tickEffectDurations,
  expireSummonedCompanions,
  didPassRoyalCourt,
  resolveRoyalCourtPassing,
  checkVictoryCondition,
  eliminatePlayer,
  generateShopInventory,
  buyItem,
  sellItem,
  landKeyToShopType,
  applyShrineHealing,
  canTeleport,
  getAvailableTeleportDestinations,
  getTrainingOptions,
  getRecruitableUnit,
  generateMercenaryCampOffers,
  calcStatTrainingCost,
  trainStat,
  hireMercenary,
  canBuildBuilding,
  buildBuilding,
  pillageLand,
  calcVampiricBatsDrain,
} from '~~/game/engine'
import { BUILDINGS, CREATURES, ITEMS, LANDS, SPELLS } from '~~/game/data'

type CenterView =
  | 'location'
  | 'inventory'
  | 'movement'
  | 'rest'
  | 'landPreview'
  | 'combat'
  | 'royalCourt'
  | 'victory'
  | 'shop'
  | 'shrineResult'
  | 'mercenaryCamp'
  | 'teleport'
  | 'build'

/** Map actionsUsed to time of day. Move is separate (dawn -> morning). */
function timeOfDayFromActions(actionsUsed: number): TimeOfDay {
  if (actionsUsed <= 0) return 'morning'
  if (actionsUsed === 1) return 'noon'
  if (actionsUsed === 2) return 'evening'
  return 'nightfall'
}

/** Extract built building keys from square's boolean[] using the land definition. */
function getBuiltBuildingKeys(
  square: { buildings: boolean[] },
  landDef: { buildings: readonly string[] },
): string[] {
  const result: string[] = []
  for (let i = 0; i < landDef.buildings.length; i++) {
    if (square.buildings[i]) {
      result.push(landDef.buildings[i]!)
    }
  }
  return result
}

const BOARD_SIZE = 34

type ItemSource = 'equipment' | 'inventory'

const gameState = ref<GameState | null>(null)
const centerView = ref<CenterView>('location')
const movementRoll = ref<MovementRoll | null>(null)
const doublesCount = ref(0)
const doublesGold = ref(0)
const restResult = ref<number | null>(null)
const selectedSquareIndex = ref<number | null>(null)
const hasMoved = ref(false)
const combatState = ref<NeutralCombatState | null>(null)
const selectedItemKey = ref<string | null>(null)
const selectedItemSource = ref<ItemSource | null>(null)
const selectedEquipSlot = ref<ItemSlot | null>(null)
const fortTargetAssignments = ref(new Map<number, number>())
const combatEnemyName = ref<string | null>(null)
const adventureSpellResult = ref<{
  type:
    | 'summon'
    | 'buff'
    | 'heal'
    | 'gold'
    | 'item'
    | 'teleport'
    | 'dispel'
    | 'fireCastle'
    | 'entrapment'
    | 'vampiricBats'
  buffResult?: BuffResult
  summonResult?: SummonResult
  goldAmount?: number
  healAmount?: number
  itemKey?: string
  dispelCount?: number
  vampiricBatsDrain?: number
  vampiricBatsTargetId?: number
} | null>(null)
const royalCourtResult = ref<RoyalCourtResult | null>(null)
const victoryResult = ref<VictoryCheckResult | null>(null)
const shopInventory = ref<string[]>([])
const shopMode = ref<'buy' | 'sell'>('buy')
const shrineResult = ref<ShrineHealResult | null>(null)
const mercOffers = ref<MercenaryCampOffer[]>([])
const teleportDestinations = ref<TeleportDestination[]>([])
/** Pending land-targeted spell (fireCastle, entrapment) waiting for square selection. */
const pendingLandSpell = ref<{ spellKey: string; spellLevel: number; casterPower: number } | null>(
  null,
)
/** Fire castle damage dealt to current player on landing (for UI display). */
const fireCastleDamageDealt = ref(0)
/** Pending vampiricBats cast: waiting for player target selection. */
const pendingVampiricBats = ref<{ spellLevel: number; casterPower: number } | null>(null)
/** Persistent per-square shop inventories, keyed by board position index. */
const shopInventories = ref<Record<number, string[]>>({})
/** Tracks which shop positions have been restocked this turn. */
const shopsRestockedThisTurn = ref(new Set<number>())

let rng: () => number = () => 0

export function useGameState() {
  /** The contextual "home" view based on current game state. */
  const baseView = computed<CenterView>(() => {
    if (combatState.value && !combatState.value.resolved) return 'combat'
    if (movementRoll.value) return 'movement'
    return 'location'
  })

  /** Single entry point for all center view transitions. Cleans up stale state. */
  function showView(view: CenterView) {
    if (view !== 'landPreview') {
      selectedSquareIndex.value = null
    }
    centerView.value = view
  }

  /** Recompute player.manaRegen to include item + land + arcane tower regen.
   *  Idempotent: always recomputes item regen from equipment first. */
  function updateManaRegenWithLands(
    player: GameState['players'][number],
    board: GameState['board'],
  ) {
    // Recompute item-only mana regen from equipment (same logic as recalcDerivedStats)
    const itemManaRegen = { fire: 0, earth: 0, air: 0, water: 0, death: 0, life: 0, arcane: 0 }
    const slots = ['weapon', 'head', 'body', 'feet', 'ringRight', 'ringLeft', 'usable'] as const
    for (const slot of slots) {
      const itemKey = player.equipment[slot]
      if (!itemKey) continue
      const item = ITEMS[itemKey as keyof typeof ITEMS]
      if (!item) continue
      for (const mana of ['fire', 'earth', 'air', 'water', 'death', 'life', 'arcane'] as const) {
        itemManaRegen[mana] += item.manaBonus[mana]
      }
    }

    const landManaRegen = calcLandManaRegen(player.ownedLands, board)
    let arcaneTowerCount = 0
    for (const landIdx of player.ownedLands) {
      const sq = board[landIdx]!
      if (sq.landKey === 'arcaneTower') {
        arcaneTowerCount++
      }
    }
    player.manaRegen = calcTotalManaRegen({
      itemManaRegen,
      landManaRegen,
      arcaneTowerCount,
    })
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
    initShopInventories(board)
  }

  /** Generate persistent shop inventories for all shop-type squares on the board. */
  function initShopInventories(board: GameState['board']) {
    const inventories: Record<number, string[]> = {}
    for (let i = 0; i < board.length; i++) {
      const sq = board[i]!
      const st = landKeyToShopType(sq.landKey)
      if (st) {
        inventories[i] = generateShopInventory({ shopType: st, rng })
      }
    }
    shopInventories.value = inventories
    shopsRestockedThisTurn.value.clear()
  }

  async function loadDevState() {
    const { createDevState } = await import('~/utils/devState')
    const dev = createDevState()
    gameState.value = dev.gameState
    rng = dev.rng
    hasMoved.value = dev.hasMoved
    movementRoll.value = null
    restResult.value = null
    combatState.value = null
    initShopInventories(dev.gameState.board)
  }

  function awardDoublesGold(roll: MovementRoll) {
    if (!gameState.value || !roll.isDoubles) return
    const player = gameState.value.players[gameState.value.currentPlayerIndex]!

    doublesCount.value++

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
    doublesGold.value = 0
    awardDoublesGold(roll)
    showView('movement')
  }

  /** Initialize combat on the given square. Sets combatState, combatEnemyName, and shows combat view. */
  function initCombatOnSquare(
    state: GameState,
    player: GameState['players'][number],
    square: GameState['board'][number],
  ) {
    const landDef = LANDS[square.landKey as keyof typeof LANDS]
    if (!landDef) return

    const defenderKey = landDef.defenders[square.defenderId]
    if (!defenderKey) return

    if (square.gateLevel > 0 && square.archerySlots > 0) {
      const gateKeyMap: Record<number, string> = {
        1: 'fortGate',
        2: 'citadelGate',
        3: 'castleGate',
      }
      const gateKey = gateKeyMap[square.gateLevel] ?? 'fortGate'
      const archerKey = 'archer'
      combatState.value = initFortifiedCombat(
        gateKey,
        archerKey,
        square.archerySlots,
        defenderKey,
        player.hp,
        player.companions,
      )
    } else {
      combatState.value = initNeutralCombat(defenderKey, player.hp, player.companions)
    }

    if (square.owner !== 0) {
      const enemy = state.players.find((p) => p.id === square.owner)
      combatEnemyName.value = enemy?.name ?? null
    } else {
      combatEnemyName.value = null
    }

    fortTargetAssignments.value = new Map()
    showView('combat')
  }

  /** Check if the current square is enemy-owned and initiate mandatory combat if so.
   *  Returns true if combat was initiated. */
  function tryInitEnemyCombat(): boolean {
    if (!gameState.value) return false
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    const square = state.board[player.position]!

    // Only trigger on enemy-owned lands (not neutral, not own)
    if (square.owner === 0 || square.owner === player.id) return false

    const landDef = LANDS[square.landKey as keyof typeof LANDS]
    if (!landDef) return false

    // Skip service squares with 'god' defender
    if (landDef.defenders[0] === 'god') return false

    initCombatOnSquare(state, player, square)
    return true
  }

  function confirmMove() {
    if (!gameState.value || !movementRoll.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    const windsBonus = state.effects
      .filter((e) => e.targetId === player.id && e.windsPower > 0)
      .reduce((sum, e) => sum + e.windsPower, 0)
    const moveDistance = Math.max(1, movementRoll.value.total + windsBonus)

    // Check Royal Court pass BEFORE wrapping position
    const passedRC = didPassRoyalCourt(player.position, moveDistance)

    // Update position (with modulo wrap)
    player.position = (player.position + moveDistance) % BOARD_SIZE
    hasMoved.value = true
    movementRoll.value = null
    state.timeOfDay = 'morning'

    // Fire Castle trap: deal accumulated fire damage on landing
    const landedSquare = state.board[player.position]!
    if (landedSquare.fireCastleDamage > 0) {
      player.hp = Math.max(0, player.hp - landedSquare.fireCastleDamage)
      fireCastleDamageDealt.value = landedSquare.fireCastleDamage
      landedSquare.fireCastleDamage = 0
      if (player.hp <= 0) {
        player.alive = false
      }
    }

    if (passedRC) {
      const { newPlayer, newBoard, result } = resolveRoyalCourtPassing({
        player,
        board: state.board,
        rng,
      })
      state.players[state.currentPlayerIndex] = newPlayer
      state.board = newBoard
      royalCourtResult.value = result
      showView('royalCourt')
    } else if (!tryInitEnemyCombat()) {
      showView('location')
    }
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
    updateManaRegenWithLands(player, state.board)
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
    const bonus = Math.floor(((landDef.healing / 2 + 10) / 3) * remainingActions)
    const maxIncome = landDef.taxIncome * 3

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
    initCombatOnSquare(state, player, square)
  }

  function combatAttack(targetAssignments?: Map<number, number>) {
    if (!gameState.value || !combatState.value || combatState.value.resolved) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    if (player.actionsUsed >= 3) return

    const combat = combatState.value
    const retaliationPercent = state.effects
      .filter((e) => e.targetId === player.id && e.retaliationPercent > 0)
      .reduce((sum, e) => sum + e.retaliationPercent, 0)
    const attackerProfile: AttackerProfile = {
      diceCount: player.diceCount,
      diceSides: player.diceSides,
      bonusDamage: 0,
      armor: player.armor,
      hp: player.hp,
      attacksPerRound: player.attacksPerRound,
      damageType: player.damageType,
      strength: player.strength,
      dexterity: player.dexterity,
      power: player.power,
      immunities: { ...EMPTY_IMMUNITIES },
      elementalDamage: { ...player.elementalDamage },
      retaliationPercent,
    }

    if (combat.defenders.length > 1) {
      // Fortified combat
      const assignments = targetAssignments ?? fortTargetAssignments.value
      const fortResult = resolveFortifiedRound(combat, attackerProfile, assignments, rng)

      combat.defenders = fortResult.newDefenders
      combat.playerStatusEffects = fortResult.newPlayerStatus
      combat.companions = fortResult.newCompanions
      combat.actions.push({ type: 'attack', result: fortResult as FortifiedRoundResult })
      player.hp = fortResult.playerHp
      player.actionsUsed += 1

      if (fortResult.allDefendersDefeated) {
        combat.resolved = true
        combat.victory = true
      } else if (fortResult.playerDefeated) {
        combat.resolved = true
        combat.victory = false
        player.alive = false
      }
    } else {
      // Standard single-defender combat
      const result = resolveAttackRoundV2(
        combat,
        attackerProfile,
        combat.playerStatusEffects,
        combat.defenderStatusEffects,
        rng,
      )

      combat.defenderHp = result.defenderHp
      combat.defenders[0]!.currentHp = result.defenderHp
      combat.defenders[0]!.alive = result.defenderHp > 0
      combat.playerStatusEffects = result.newPlayerStatus
      combat.defenderStatusEffects = result.newDefenderStatus
      combat.companions = result.newCompanions
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
    }

    state.timeOfDay = timeOfDayFromActions(player.actionsUsed)
  }

  function combatCastSpell(spellKey: string, target: SpellTarget) {
    if (!gameState.value || !combatState.value || combatState.value.resolved) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    if (player.actionsUsed >= 3) return

    const combat = combatState.value
    const spellRetaliationPercent = state.effects
      .filter((e) => e.targetId === player.id && e.retaliationPercent > 0)
      .reduce((sum, e) => sum + e.retaliationPercent, 0)
    const attackerProfile: AttackerProfile = {
      diceCount: player.diceCount,
      diceSides: player.diceSides,
      bonusDamage: 0,
      armor: player.armor,
      hp: player.hp,
      attacksPerRound: player.attacksPerRound,
      damageType: player.damageType,
      strength: player.strength,
      dexterity: player.dexterity,
      power: player.power,
      immunities: { ...EMPTY_IMMUNITIES },
      elementalDamage: { ...player.elementalDamage },
      retaliationPercent: spellRetaliationPercent,
    }

    const result = resolveCombatSpellRound(
      combat,
      attackerProfile,
      spellKey,
      player.spellbook,
      player.mana,
      target,
      rng,
    )

    combat.playerStatusEffects = result.newPlayerStatus
    combat.defenderStatusEffects = result.newDefenderStatus
    combat.companions = result.newCompanions
    combat.defenders = result.newDefenders
    combat.actions.push({ type: 'spell', result })
    player.hp = Math.min(result.playerHp, player.maxHp)
    player.mana = result.newMana
    player.actionsUsed += 1

    // Sync flat defenderHp + snapshot for non-fortified combat
    if (combat.defenders.length <= 1) {
      combat.defenderHp = result.defenderHp
      combat.defenders[0]!.currentHp = result.defenderHp
      combat.defenders[0]!.alive = result.defenderHp > 0
    }

    // Polymorph: sync flat defender fields with the new creature
    if (result.polymorphResult?.success) {
      const def = combat.defenders[0]!
      combat.defenderKey = def.key
      combat.defenderHp = def.currentHp
      combat.defenderMaxHp = def.maxHp
      combat.defenderArmor = def.armor
      combat.defenderDiceCount = def.diceCount
      combat.defenderDiceSides = def.diceSides
      combat.defenderBonusDamage = def.bonusDamage
      combat.defenderAttacksPerRound = def.attacksPerRound
      combat.defenderDamageType = def.damageType
      combat.defenderStrength = def.strength
      combat.defenderPower = def.power
      combat.defenderDexterity = def.dexterity
      combat.defenderImmunities = { ...def.immunities }
      combat.defenderElementalChannels = { ...def.elementalDamage }
      const elemTotal =
        def.elementalDamage.fire +
        def.elementalDamage.earth +
        def.elementalDamage.air +
        def.elementalDamage.water
      combat.defenderElementalDamage = elemTotal
    }

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

  function pushBuffEffect(
    state: GameState,
    player: GameState['players'][number],
    buff: BuffResult,
  ) {
    const effect: ActiveEffect = {
      spellKey: buff.spellKey,
      casterId: player.id,
      targetId: player.id,
      duration: buff.duration,
      armorBonus: buff.armorBonus,
      hasteBonus: buff.hasteBonus,
      strengthBonus: buff.strengthBonus,
      windsPower: buff.windsPower,
      checkedFlag: false,
      moneyReward: 0,
      itemReward: 0,
      landReward: 0,
      fireDamageBonus: buff.fireDamageBonus,
      buildingCostReduction: buff.buildingCostReduction,
      speedBonus: buff.speedBonus,
      retaliationPercent: buff.retaliationPercent,
      vampiricBatsDrain: 0,
    }
    state.effects.push(effect)
    const updated = recalcDerivedStats(player, state.effects)
    Object.assign(player, updated)
    updateManaRegenWithLands(player, state.board)
  }

  function castAdventureSpell(spellKey: string): boolean {
    if (!gameState.value) return false
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!

    const spell = (SPELLS as Record<string, (typeof SPELLS)[keyof typeof SPELLS]>)[spellKey]
    if (!spell) return false

    const validation = validateCast({
      spellKey,
      spellbook: player.spellbook,
      mana: player.mana,
      spell,
      actionsUsed: player.actionsUsed,
      inCombat: false,
    })
    if (!validation.canCast) return false

    player.mana = deductManaCost(player.mana, spell)
    const level = player.spellbook[spellKey]!

    // TELEPORT: deduct mana and open destination picker (all squares, not just owned)
    if (spellKey === 'teleport') {
      teleportDestinations.value = state.board
        .map((sq, i) => ({ squareIndex: i, landKey: sq.landKey }))
        .filter((d) => d.squareIndex !== player.position)
      adventureSpellResult.value = { type: 'teleport' }
      // Don't increment actionsUsed here -- teleportTo() sets actionsUsed=3
      showView('teleport')
      return true
    }

    // DISPEL MAGIC (adventure): remove all buff effects targeting this player
    if (spellKey === 'dispelMagic') {
      const before = state.effects.length
      state.effects = state.effects.filter((e) => e.targetId !== player.id)
      const removed = before - state.effects.length
      const updated = recalcDerivedStats(player, state.effects)
      Object.assign(player, updated)
      updateManaRegenWithLands(player, state.board)
      adventureSpellResult.value = { type: 'dispel', dispelCount: removed }
      player.actionsUsed += 1
      state.timeOfDay = timeOfDayFromActions(player.actionsUsed)
      return true
    }

    // SUMMON spells
    if (spell.isSummon) {
      const result = calcSummonResult({
        spellLevel: level,
        casterPower: player.power,
        summonTiers: spell.summonTiers,
      })
      for (let i = 0; i < result.count; i++) {
        player.companions.push(
          createSummonedCompanion(result.creatureKey, result.statMultiplier, result.duration),
        )
      }
      adventureSpellResult.value = { type: 'summon', summonResult: result }
    }

    // BUFF spells (armor, haste, unholyStrength, airShield, fireEnchant, earthbuild, slow, retaliation)
    if (
      spell.hasArmorBuff ||
      spell.hasHasteEffect ||
      spell.hasStrengthBuff ||
      spellKey === 'airShield' ||
      spellKey === 'fireEnchant' ||
      spellKey === 'earthbuild' ||
      spellKey === 'slow' ||
      spellKey === 'retaliation'
    ) {
      const buff = calcBuffEffect({
        spellKey,
        spellLevel: level,
        casterPower: player.power,
        spell,
      })
      pushBuffEffect(state, player, buff)
      adventureSpellResult.value = { type: 'buff', buffResult: buff }
    }

    // HEAL
    if (spell.hasHealEffect) {
      const buff = calcBuffEffect({
        spellKey,
        spellLevel: level,
        casterPower: player.power,
        spell,
      })
      player.hp = Math.min(player.hp + buff.healAmount, player.maxHp)
      adventureSpellResult.value = { type: 'heal', healAmount: buff.healAmount }
    }

    // POT OF GOLD
    if (spell.generatesGold) {
      const gold = calcGoldGeneration({ spellLevel: level, casterPower: player.power, rng })
      player.gold += gold
      adventureSpellResult.value = { type: 'gold', goldAmount: gold }
    }

    // CREATE ITEM
    if (spell.generatesItem) {
      const itemKey = calcItemGeneration({ spellLevel: level, casterPower: player.power, rng })
      if (player.inventory.length < 20) {
        player.inventory.push(itemKey)
      }
      adventureSpellResult.value = { type: 'item', itemKey }
    }

    // FIRE CASTLE: open square picker for owned lands
    if (spellKey === 'fireCastle') {
      const ownedSquares = state.board
        .map((sq, i) => ({ squareIndex: i, landKey: sq.landKey }))
        .filter((d) => state.board[d.squareIndex]!.owner === player.id)
      if (ownedSquares.length === 0) {
        // Refund mana -- no valid targets
        player.mana = {
          ...player.mana,
          [spell.manaType]: player.mana[spell.manaType] + spell.manaCost,
        }
        return false
      }
      pendingLandSpell.value = { spellKey, spellLevel: level, casterPower: player.power }
      teleportDestinations.value = ownedSquares
      adventureSpellResult.value = { type: 'fireCastle' }
      showView('teleport')
      return true
    }

    // ENTRAPMENT: open square picker for any non-current square
    if (spellKey === 'entrapment') {
      pendingLandSpell.value = { spellKey, spellLevel: level, casterPower: player.power }
      teleportDestinations.value = state.board
        .map((sq, i) => ({ squareIndex: i, landKey: sq.landKey }))
        .filter((d) => d.squareIndex !== player.position)
      adventureSpellResult.value = { type: 'entrapment' }
      showView('teleport')
      return true
    }

    // VAMPIRIC BATS: targets another player -- show player picker
    if (spellKey === 'vampiricBats') {
      const otherPlayers = state.players.filter((p) => p.alive && p.id !== player.id)
      if (otherPlayers.length === 0) {
        // Refund mana -- no valid targets
        player.mana = {
          ...player.mana,
          [spell.manaType]: player.mana[spell.manaType] + spell.manaCost,
        }
        return false
      }
      pendingVampiricBats.value = { spellLevel: level, casterPower: player.power }
      adventureSpellResult.value = { type: 'vampiricBats' }
      return true
    }

    player.actionsUsed += 1
    state.timeOfDay = timeOfDayFromActions(player.actionsUsed)
    return true
  }

  function combatRetreat() {
    if (!gameState.value || !combatState.value || combatState.value.resolved) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    if (player.actionsUsed >= 3) return

    // Entrapment: cannot flee from squares with entrapment enchantment
    const square = state.board[player.position]!
    if (square.entrapment) {
      const combat = combatState.value
      const result: FleeResult = {
        escaped: false,
        defenderDamageRoll: 0,
        defenderDamageDealt: 0,
        playerHp: player.hp,
        playerDefeated: false,
        cannotFlee: true,
        bleedingCleared: false,
      }
      combat.actions.push({ type: 'flee', result })
      return
    }

    const combat = combatState.value

    let result
    if (combat.defenders.length > 1) {
      result = resolveFortifiedFlee(
        combat,
        player.dexterity,
        player.armor,
        player.hp,
        rng,
        combat.playerStatusEffects,
      )
    } else {
      result = resolveFleeAttempt(
        combat,
        player.dexterity,
        player.armor,
        player.hp,
        rng,
        combat.playerStatusEffects,
      )
    }

    if (result.cannotFlee) {
      combat.actions.push({ type: 'flee', result })
      return
    }

    combat.actions.push({ type: 'flee', result })
    player.hp = result.playerHp
    player.actionsUsed += 1

    if (result.escaped) {
      if (result.bleedingCleared) {
        combat.playerStatusEffects = { ...combat.playerStatusEffects, bleeding: 0 }
      }
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
      const previousOwner = square.owner
      if (previousOwner !== 0) {
        const prev = state.players.find((p) => p.id === previousOwner)
        if (prev) {
          prev.ownedLands = prev.ownedLands.filter((pos) => pos !== player.position)
          updateManaRegenWithLands(prev, state.board)
        }
      }
      square.owner = player.id
      player.ownedLands.push(player.position)
      updateManaRegenWithLands(player, state.board)
    }

    // Sync companion HP from combat snapshots and remove dead companions
    player.companions = player.companions.filter((comp) => {
      const snapshot = combat.companions.find((s) => s.name === comp.name)
      if (snapshot) {
        comp.currentHp = snapshot.currentHp
        return snapshot.alive
      }
      return true
    })

    // Clear entrapment after combat (one-time trap)
    const combatSquare = state.board[player.position]!
    if (combatSquare.entrapment) {
      combatSquare.entrapment = false
    }

    combatState.value = null

    // If player died in combat, eliminate them and check victory
    if (!player.alive) {
      const { newPlayer, newBoard } = eliminatePlayer({ player, board: state.board })
      state.players[state.currentPlayerIndex] = newPlayer
      state.board = newBoard

      const check = checkVictoryCondition(state.players)
      if (check.state !== 'ongoing') {
        victoryResult.value = check
        showView('victory')
        return
      }

      // Auto-advance to next alive player
      endTurn()
      return
    }

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
    updateManaRegenWithLands(updated, state.board)
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
    updateManaRegenWithLands(updated, state.board)
    state.timeOfDay = timeOfDayFromActions(updated.actionsUsed)
    clearSelection()
  }

  function toggleInventory() {
    clearSelection()
    showView(centerView.value === 'inventory' ? baseView.value : 'inventory')
  }

  function selectSquare(index: number) {
    if (!gameState.value) return
    if (selectedSquareIndex.value === index && centerView.value === 'landPreview') {
      closePreview()
      return
    }
    selectedSquareIndex.value = index
    centerView.value = 'landPreview'
  }

  function closePreview() {
    showView(baseView.value)
  }

  function endTurn() {
    if (!gameState.value) return
    const state = gameState.value

    // Victory check
    const check = checkVictoryCondition(state.players)
    if (check.state !== 'ongoing') {
      victoryResult.value = check
      showView('victory')
      return
    }

    const alivePlayers = state.players.filter((p) => p.alive)
    if (alivePlayers.length === 0) return

    // Tick global effect durations
    const { remaining, expired } = tickEffectDurations(state.effects)
    state.effects = remaining

    // If any effects expired, recalc affected players' derived stats
    if (expired.length > 0) {
      const affectedIds = new Set(expired.map((e) => e.targetId))
      for (const pid of affectedIds) {
        const p = state.players.find((pl) => pl.id === pid)
        if (p) {
          const updated = recalcDerivedStats(p, state.effects)
          Object.assign(p, updated)
          updateManaRegenWithLands(p, state.board)
        }
      }
    }

    // Expire summoned companions for all players
    for (const p of state.players) {
      if (!p.alive) continue
      const { remaining: remainingComps } = expireSummonedCompanions(p.companions)
      p.companions = remainingComps
    }

    let nextIndex = state.currentPlayerIndex
    do {
      nextIndex = (nextIndex + 1) % state.players.length
    } while (!state.players[nextIndex]!.alive)

    const wrapped = nextIndex <= state.currentPlayerIndex
    state.currentPlayerIndex = nextIndex
    const nextPlayer = state.players[nextIndex]!
    nextPlayer.actionsUsed = 0
    state.timeOfDay = 'dawn'

    if (wrapped) {
      state.currentDay++
    }

    // Recompute total mana regen (items + lands + towers) and apply it
    updateManaRegenWithLands(nextPlayer, state.board)
    nextPlayer.mana = applyManaRegen(nextPlayer.mana, nextPlayer.manaRegen)

    // Vampiric bats: drain HP from next player and heal caster(s)
    for (const eff of state.effects) {
      if (eff.spellKey !== 'vampiricBats' || eff.vampiricBatsDrain <= 0) continue
      if (eff.targetId !== nextPlayer.id) continue
      const drain = Math.min(eff.vampiricBatsDrain, nextPlayer.hp)
      if (drain > 0) {
        nextPlayer.hp -= drain
        const caster = state.players.find((p) => p.id === eff.casterId && p.alive)
        if (caster) {
          caster.hp = Math.min(caster.hp + drain, caster.maxHp)
        }
        if (nextPlayer.hp <= 0) {
          nextPlayer.alive = false
        }
      }
    }

    hasMoved.value = false
    movementRoll.value = null
    restResult.value = null
    combatState.value = null
    fireCastleDamageDealt.value = 0
    shopsRestockedThisTurn.value.clear()
    showView('location')
  }

  function learnSpellFromCurrentBuilding() {
    if (!gameState.value || !canLearnSpell.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    const square = state.board[player.position]!
    const landDef = LANDS[square.landKey as keyof typeof LANDS]
    if (!landDef) return

    // Find a built building that grants spells for this land type
    for (let bi = 0; bi < landDef.buildings.length; bi++) {
      if (!square.buildings[bi]) continue
      const buildingKey = landDef.buildings[bi]!
      const result = learnFromBuilding({
        spellbook: player.spellbook,
        buildingKey,
        landType: landDef.landType,
      })
      if (result) {
        player.spellbook = result.newSpellbook
        player.actionsUsed += 1
        state.timeOfDay = timeOfDayFromActions(player.actionsUsed)
        showView('location')
        return
      }
    }
  }

  function useScroll(scrollItemKey: string): { spellKey: string; newLevel: number } | null {
    if (!gameState.value) return null
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    if (player.actionsUsed >= 3) return null

    const result = learnFromScroll({
      spellbook: player.spellbook,
      inventory: player.inventory,
      scrollItemKey,
    })
    if (result) {
      player.spellbook = result.newSpellbook
      player.inventory = result.newInventory
      player.actionsUsed++
      state.timeOfDay = timeOfDayFromActions(player.actionsUsed)
      return { spellKey: result.spellKey, newLevel: result.newLevel }
    }
    return null
  }

  function trainPlayerSpell(spellKey: string) {
    if (!gameState.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!

    const result = trainSpell({
      spellbook: player.spellbook,
      gold: player.gold,
      spellKey,
      actionsUsed: player.actionsUsed,
    })
    if (result.success) {
      player.spellbook = result.newSpellbook
      player.gold -= result.goldSpent
      player.actionsUsed = 3
      state.timeOfDay = timeOfDayFromActions(player.actionsUsed)
      showView('location')
    }
  }

  function acceptKingsGift(itemKey: string | null) {
    if (!gameState.value || !royalCourtResult.value) return
    const player = gameState.value.players[gameState.value.currentPlayerIndex]!

    if (itemKey && player.inventory.length < 20) {
      player.inventory.push(itemKey)
    }

    royalCourtResult.value = null
    if (!tryInitEnemyCombat()) {
      showView('location')
    }
  }

  function dismissRoyalCourt() {
    royalCourtResult.value = null
    if (!tryInitEnemyCombat()) {
      showView('location')
    }
  }

  function startNewGameFromVictory() {
    victoryResult.value = null
    gameState.value = null
    shopInventories.value = {}
    shopsRestockedThisTurn.value.clear()
    showView('location')
  }

  function openShop() {
    if (!gameState.value || !canOpenShop.value || !shopType.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    const pos = player.position

    // Restock 1 item on first visit this turn
    if (!shopsRestockedThisTurn.value.has(pos)) {
      const restockItem = generateShopInventory({ shopType: shopType.value, rng, count: 1 })
      if (restockItem.length > 0) {
        const inv = shopInventories.value[pos]
        if (inv) {
          inv.push(restockItem[0]!)
        }
      }
      shopsRestockedThisTurn.value.add(pos)
    }

    shopInventory.value = [...(shopInventories.value[pos] ?? [])]
    shopMode.value = 'buy'
    showView('shop')
  }

  function buyFromShop(itemKey: string) {
    if (!gameState.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    if (player.actionsUsed >= 3) return

    const item = ITEMS[itemKey as keyof typeof ITEMS]
    if (!item) return

    const { newPlayer, success } = buyItem({
      player,
      itemKey,
      price: item.value,
    })

    if (success) {
      state.players[state.currentPlayerIndex] = newPlayer
      const updatedPlayer = state.players[state.currentPlayerIndex]!
      updatedPlayer.actionsUsed += 1
      state.timeOfDay = timeOfDayFromActions(updatedPlayer.actionsUsed)
      // Remove from persistent inventory and sync display
      const pos = updatedPlayer.position
      const persistent = shopInventories.value[pos]
      if (persistent) {
        const idx = persistent.indexOf(itemKey)
        if (idx !== -1) persistent.splice(idx, 1)
      }
      shopInventory.value = [...(persistent ?? [])]
    }
  }

  function sellToShop(itemKey: string) {
    if (!gameState.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    if (player.actionsUsed >= 3) return

    const { newPlayer, success } = sellItem({ player, itemKey })

    if (success) {
      state.players[state.currentPlayerIndex] = newPlayer
      const updatedPlayer = state.players[state.currentPlayerIndex]!
      updatedPlayer.actionsUsed += 1
      state.timeOfDay = timeOfDayFromActions(updatedPlayer.actionsUsed)
      // Add sold item to persistent shop inventory and sync display
      const pos = updatedPlayer.position
      const persistent = shopInventories.value[pos]
      if (persistent) {
        persistent.push(itemKey)
      }
      shopInventory.value = [...(persistent ?? [])]
    }
  }

  function closeShop() {
    shopInventory.value = []
    showView('location')
  }

  function useShrineHeal() {
    if (!gameState.value || !canUseShrineHeal.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!

    const { result, newPlayer, success } = applyShrineHealing({ player })
    if (!success) return

    state.players[state.currentPlayerIndex] = newPlayer
    state.timeOfDay = timeOfDayFromActions(newPlayer.actionsUsed)
    shrineResult.value = result
    showView('shrineResult')
  }

  function dismissShrineResult() {
    shrineResult.value = null
    showView('location')
  }

  function trainStatAction(stat: 'baseStrength' | 'baseDexterity' | 'basePower') {
    if (!gameState.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    const options = getTrainingOptions(currentSquare.value?.landKey ?? '')
    const opt = options.find((o) => o.stat === stat)
    if (!opt) return

    const { newPlayer, success } = trainStat({
      player,
      stat,
      maxStat: opt.maxStat,
    })

    if (success) {
      state.players[state.currentPlayerIndex] = newPlayer
      state.timeOfDay = timeOfDayFromActions(newPlayer.actionsUsed)
      showView('location')
    }
  }

  function openMercenaryCamp() {
    if (!gameState.value || !canVisitMercCamp.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!

    mercOffers.value = generateMercenaryCampOffers({
      titleRank: player.title,
      rng,
    })
    showView('mercenaryCamp')
  }

  function hireMerc(offerIndex: number) {
    if (!gameState.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    const offer = mercOffers.value[offerIndex]
    if (!offer) return

    const { newPlayer, success } = hireMercenary({
      player,
      creatureKey: offer.creatureKey,
      cost: offer.cost,
      contractTurns: offer.contractTurns,
    })

    if (success) {
      state.players[state.currentPlayerIndex] = newPlayer
      mercOffers.value = mercOffers.value.filter((_, i) => i !== offerIndex)
    }
  }

  function recruitUnit() {
    if (!gameState.value || !recruitableUnit.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    const { creatureKey, cost } = recruitableUnit.value

    const { newPlayer, success } = hireMercenary({
      player,
      creatureKey,
      cost,
    })

    if (success) {
      state.players[state.currentPlayerIndex] = newPlayer
      const updatedPlayer = state.players[state.currentPlayerIndex]!
      updatedPlayer.actionsUsed += 1
      state.timeOfDay = timeOfDayFromActions(updatedPlayer.actionsUsed)
      showView('location')
    }
  }

  function closeMercenaryCamp() {
    mercOffers.value = []
    showView('location')
  }

  function openTeleport() {
    if (!gameState.value || !canTeleportFromHere.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!

    teleportDestinations.value = getAvailableTeleportDestinations({
      player,
      board: state.board,
      currentPosition: player.position,
    })
    showView('teleport')
  }

  function teleportTo(squareIndex: number) {
    if (!gameState.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!

    // Land-targeted spell (fireCastle, entrapment)
    if (pendingLandSpell.value) {
      const { spellKey, spellLevel, casterPower } = pendingLandSpell.value
      const square = state.board[squareIndex]!
      if (spellKey === 'fireCastle') {
        square.fireCastleDamage = spellLevel * casterPower * 3
      } else if (spellKey === 'entrapment') {
        square.entrapment = true
      }
      pendingLandSpell.value = null
      teleportDestinations.value = []
      player.actionsUsed += 1
      state.timeOfDay = timeOfDayFromActions(player.actionsUsed)
      showView('location')
      return
    }

    player.position = squareIndex
    player.actionsUsed = 3
    state.timeOfDay = timeOfDayFromActions(player.actionsUsed)
    teleportDestinations.value = []
    showView('location')
  }

  function closeTeleport() {
    pendingLandSpell.value = null
    teleportDestinations.value = []
    showView('location')
  }

  function selectVampiricBatsTarget(targetPlayerId: number) {
    if (!gameState.value || !pendingVampiricBats.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    const { spellLevel, casterPower } = pendingVampiricBats.value

    const { drain, duration } = calcVampiricBatsDrain({ spellLevel, casterPower })
    const effect: ActiveEffect = {
      spellKey: 'vampiricBats',
      casterId: player.id,
      targetId: targetPlayerId,
      duration,
      armorBonus: 0,
      hasteBonus: 0,
      strengthBonus: 0,
      windsPower: 0,
      checkedFlag: false,
      moneyReward: 0,
      itemReward: 0,
      landReward: 0,
      fireDamageBonus: 0,
      buildingCostReduction: 0,
      speedBonus: 0,
      retaliationPercent: 0,
      vampiricBatsDrain: drain,
    }
    state.effects.push(effect)

    adventureSpellResult.value = {
      type: 'vampiricBats',
      vampiricBatsDrain: drain,
      vampiricBatsTargetId: targetPlayerId,
    }
    pendingVampiricBats.value = null
    player.actionsUsed += 1
    state.timeOfDay = timeOfDayFromActions(player.actionsUsed)
  }

  function cancelVampiricBats() {
    if (!gameState.value || !pendingVampiricBats.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    // Refund mana
    const spell = SPELLS.vampiricBats
    player.mana = { ...player.mana, [spell.manaType]: player.mana[spell.manaType] + spell.manaCost }
    pendingVampiricBats.value = null
    adventureSpellResult.value = null
  }

  function openBuildMenu() {
    if (!gameState.value || !canBuild.value) return
    showView('build')
  }

  function constructBuilding(buildingKey: string) {
    if (!gameState.value || !currentSquare.value || !currentPlayer.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    const square = state.board[player.position]!
    const landDef = LANDS[square.landKey as keyof typeof LANDS]
    if (!landDef) return

    const builtKeys = getBuiltBuildingKeys(square, landDef)

    const { newPlayer, success } = buildBuilding({
      player,
      buildingKey,
      landKey: square.landKey,
      existingBuildings: builtKeys,
    })

    if (success) {
      // Earthbuild effect: refund half the building cost
      const hasEarthbuild = state.effects.some(
        (e) => e.spellKey === 'earthbuild' && e.targetId === player.id && e.duration > 0,
      )
      if (hasEarthbuild) {
        const building = BUILDINGS[buildingKey as keyof typeof BUILDINGS]
        if (building) {
          newPlayer.gold += Math.floor(building.cost / 2)
        }
      }

      state.players[state.currentPlayerIndex] = newPlayer

      const buildingIndex = (landDef.buildings as readonly string[]).indexOf(buildingKey)
      if (buildingIndex !== -1) {
        square.buildings[buildingIndex] = true
      }

      const building = BUILDINGS[buildingKey as keyof typeof BUILDINGS]
      if (building) {
        if (building.fortificationLevel > 0) {
          square.gateLevel = Math.max(square.gateLevel, building.fortificationLevel)
        }
        if (building.archerySlots > 0) {
          square.archerySlots += building.archerySlots
        }
        if (building.recruitableUnit) {
          square.recruitableUnit = building.recruitableUnit
          square.recruitableCount = building.recruitableCount
        }
        if (building.healingBonus > 0) {
          square.healing += building.healingBonus
        }
      }

      const updatedPlayer = state.players[state.currentPlayerIndex]!
      updateManaRegenWithLands(updatedPlayer, state.board)
      updatedPlayer.actionsUsed += 1
      state.timeOfDay = timeOfDayFromActions(updatedPlayer.actionsUsed)

      if (updatedPlayer.actionsUsed >= 3) {
        showView('location')
      }
    }
  }

  function closeBuildMenu() {
    showView('location')
  }

  function pillageLandAction() {
    if (!gameState.value || !canPillage.value) return
    const state = gameState.value
    const player = state.players[state.currentPlayerIndex]!
    const square = state.board[player.position]!

    const { newSquare, goldGained } = pillageLand({ square })

    state.board[player.position] = newSquare
    player.gold += goldGained
    player.actionsUsed += 1
    state.timeOfDay = timeOfDayFromActions(player.actionsUsed)
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

  /** Location/timing check only -- no gold check. Used for v-if to show greyed-out button. */
  const showBuyLand = computed(() => {
    if (!gameState.value || !currentPlayer.value || !currentSquare.value) return false
    const square = currentSquare.value
    if (!hasMoved.value) return false
    if (square.owner !== 0) return false
    if (currentPlayer.value.actionsUsed !== 0) return false
    if (!(square.landKey in LANDS)) return false
    return true
  })

  const canBuyLand = computed(() => {
    if (!showBuyLand.value || !currentPlayer.value || !currentSquare.value) return false
    if (currentPlayer.value.gold < currentSquare.value.price * 10) return false
    return true
  })

  /** Whether the player is on their own land (used by multiple computeds). */
  const isOnOwnLand = computed(() => {
    if (!currentPlayer.value || !currentSquare.value || !hasMoved.value) return false
    return currentSquare.value.owner === currentPlayer.value.id
  })

  /** Whether the player is on an enemy-owned land (not neutral, not own). */
  const isOnEnemyLand = computed(() => {
    if (!currentPlayer.value || !currentSquare.value || !hasMoved.value) return false
    const owner = currentSquare.value.owner
    return owner !== 0 && owner !== currentPlayer.value.id
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

  /** Location/timing check only -- no gold check. Used for v-if to show greyed-out button. */
  const showUpgradeDefender = computed(() => {
    if (!isOnOwnLand.value || !currentPlayer.value) return false
    if (currentPlayer.value.actionsUsed >= 3) return false
    if (defenderUpgradeCost.value === null) return false
    return true
  })

  const canUpgradeDefender = computed(() => {
    if (!showUpgradeDefender.value || !currentPlayer.value) return false
    if (currentPlayer.value.gold < defenderUpgradeCost.value!) return false
    return true
  })

  const canAttackLand = computed(() => {
    if (!gameState.value || !currentPlayer.value || !currentSquare.value) return false
    if (!hasMoved.value) return false
    const player = currentPlayer.value
    const square = currentSquare.value
    if (square.owner === player.id) return false
    if (player.actionsUsed >= 3) return false
    const landDef = LANDS[square.landKey as keyof typeof LANDS]
    if (!landDef) return false
    if (landDef.defenders[0] === 'god') return false
    return true
  })

  /** Info about the spell that can be learned from the current building, or null. */
  const learnableSpellInfo = computed<{ spellKey: string; buildingKey: string } | null>(() => {
    if (!isOnOwnLand.value || !currentSquare.value || !currentPlayer.value) return null
    const player = currentPlayer.value
    if (player.actionsUsed >= 3) return null
    const square = currentSquare.value
    const landDef = LANDS[square.landKey as keyof typeof LANDS]
    if (!landDef) return null

    for (let bi = 0; bi < landDef.buildings.length; bi++) {
      if (!square.buildings[bi]) continue
      const buildingKey = landDef.buildings[bi]!
      const building = BUILDINGS[buildingKey as keyof typeof BUILDINGS]
      if (!building) continue
      const match = building.grantsSpells.find(
        (entry) => entry.landTypeRestriction === landDef.landType,
      )
      if (match) return { spellKey: match.spell, buildingKey }
    }
    return null
  })

  const canLearnSpell = computed(() => learnableSpellInfo.value !== null)

  /** Location/timing check only -- no gold check. Used for v-if to show greyed-out button. */
  const showTrainSpell = computed(() => {
    if (!currentPlayer.value || !hasMoved.value || !currentSquare.value) return false
    const landKey = currentSquare.value.landKey
    if (landKey !== 'library' && landKey !== 'mageGuild') return false
    if (currentPlayer.value.actionsUsed !== 0) return false
    return Object.keys(currentPlayer.value.spellbook).length > 0
  })

  const canTrainSpell = computed(() => {
    if (!showTrainSpell.value || !currentPlayer.value) return false
    const player = currentPlayer.value
    for (const key of Object.keys(player.spellbook)) {
      const level = player.spellbook[key]!
      const cost = calcTrainingCost(level)
      if (player.gold >= cost.gold) return true
    }
    return false
  })

  const shopType = computed(() => {
    if (!currentSquare.value) return null
    return landKeyToShopType(currentSquare.value.landKey)
  })

  const canOpenShop = computed(() => {
    if (!hasMoved.value || !currentPlayer.value || !shopType.value) return false
    if (currentPlayer.value.actionsUsed >= 3) return false
    return true
  })

  /** Location/timing check only -- no gold check. Used for v-if to show greyed-out button. */
  const showShrineHeal = computed(() => {
    if (!currentSquare.value || !currentPlayer.value || !hasMoved.value) return false
    if (currentSquare.value.landKey !== 'shrine') return false
    if (currentPlayer.value.actionsUsed !== 0) return false
    return true
  })

  const canUseShrineHeal = computed(() => {
    if (!showShrineHeal.value || !currentPlayer.value) return false
    if (currentPlayer.value.gold < 50) return false
    return true
  })

  const trainingOptions = computed(() => {
    if (!currentSquare.value || !currentPlayer.value || !hasMoved.value) return []
    if (currentPlayer.value.actionsUsed !== 0) return []
    const options = getTrainingOptions(currentSquare.value.landKey)
    return options.map((opt) => {
      const currentValue = currentPlayer.value![opt.stat]
      const cost = calcStatTrainingCost(currentValue)
      const atMax = opt.maxStat !== undefined && currentValue >= opt.maxStat
      const canAfford = currentPlayer.value!.gold >= cost
      return {
        ...opt,
        currentValue,
        cost,
        atMax,
        canAfford,
        canTrain: !atMax && canAfford,
      }
    })
  })

  const canTrain = computed(() => trainingOptions.value.some((o) => o.canTrain))

  const canTeleportFromHere = computed(() => {
    if (!currentSquare.value || !currentPlayer.value || !hasMoved.value) return false
    return canTeleport({
      player: currentPlayer.value,
      square: currentSquare.value,
    })
  })

  const canVisitMercCamp = computed(() => {
    if (!currentSquare.value || !currentPlayer.value || !hasMoved.value) return false
    if (currentSquare.value.landKey !== 'mercenaryCamp') return false
    if (currentPlayer.value.actionsUsed >= 3) return false
    return true
  })

  const recruitableUnit = computed(() => {
    if (!currentSquare.value || !isOnOwnLand.value || !currentPlayer.value) return null
    if (currentPlayer.value.actionsUsed >= 3) return null
    return getRecruitableUnit({ square: currentSquare.value })
  })

  /** Location/timing check only -- no gold check. Used for v-if to show greyed-out button. */
  const showBuild = computed(() => {
    if (!isOnOwnLand.value || !currentSquare.value || !currentPlayer.value) return false
    if (currentPlayer.value.actionsUsed >= 3) return false
    const landDef = LANDS[currentSquare.value.landKey as keyof typeof LANDS]
    if (!landDef) return false
    return landDef.buildings.length > 0
  })

  const canBuild = computed(() => {
    if (!showBuild.value || !currentSquare.value || !currentPlayer.value) return false
    const landDef = LANDS[currentSquare.value.landKey as keyof typeof LANDS]
    if (!landDef) return false
    const builtKeys = getBuiltBuildingKeys(currentSquare.value, landDef)
    for (const bKey of landDef.buildings) {
      const check = canBuildBuilding({
        buildingKey: bKey as string,
        landKey: currentSquare.value.landKey,
        existingBuildings: builtKeys,
        playerGold: currentPlayer.value.gold,
      })
      if (check.canBuild) return true
    }
    return false
  })

  const availableBuildings = computed(() => {
    if (!isOnOwnLand.value || !currentSquare.value || !currentPlayer.value) return []
    const landDef = LANDS[currentSquare.value.landKey as keyof typeof LANDS]
    if (!landDef) return []
    const builtKeys = getBuiltBuildingKeys(currentSquare.value, landDef)
    return landDef.buildings.map((bKey) => {
      const building = BUILDINGS[bKey as keyof typeof BUILDINGS]
      const isBuilt = builtKeys.includes(bKey as string)
      const check = canBuildBuilding({
        buildingKey: bKey as string,
        landKey: currentSquare.value!.landKey,
        existingBuildings: builtKeys,
        playerGold: currentPlayer.value!.gold,
      })
      return {
        key: bKey as string,
        cost: building?.cost ?? 0,
        isBuilt,
        canBuild: check.canBuild,
        reason: check.reason,
        prereqs: building?.prereqs ?? [],
      }
    })
  })

  const restHealPreview = computed(() => {
    if (!currentPlayer.value || !currentSquare.value) return 0
    const player = currentPlayer.value
    const square = currentSquare.value
    const remainingActions = 3 - player.actionsUsed
    if (remainingActions <= 0) return 0
    return calcRestHealing(square.healing, 0, remainingActions)
  })

  const canPillage = computed(() => {
    if (!gameState.value || !currentPlayer.value || !currentSquare.value || !hasMoved.value)
      return false
    const player = currentPlayer.value
    const square = currentSquare.value
    if (square.owner === 0 || square.owner === player.id) return false
    if (player.actionsUsed >= 3) return false
    if (square.taxIncome <= 0) return false
    return true
  })

  return {
    gameState,
    centerView,
    movementRoll,
    doublesCount,
    doublesGold,
    restResult,
    selectedSquareIndex,
    hasMoved,
    combatState,
    combatEnemyName,
    adventureSpellResult,
    fortTargetAssignments,
    selectedItemKey,
    selectedItemSource,
    selectedEquipSlot,
    startNewGame,
    loadDevState,
    move,
    confirmMove,
    reroll,
    rest,
    buyLand,
    improveIncome,
    upgradeDefender,
    attackLand,
    combatAttack,
    combatCastSpell,
    castAdventureSpell,
    combatRetreat,
    combatFinish,
    showView,
    toggleInventory,
    selectSquare,
    closePreview,
    selectInventoryItem,
    selectEquippedItem,
    doEquip,
    doUnequip,
    clearSelection,
    endTurn,
    currentPlayer,
    currentSquare,
    selectedSquare,
    showBuyLand,
    canBuyLand,
    canImproveIncome,
    showUpgradeDefender,
    canUpgradeDefender,
    canAttackLand,
    canLearnSpell,
    showTrainSpell,
    canTrainSpell,
    showBuild,
    defenderUpgradeCost,
    learnableSpellInfo,
    learnSpellFromCurrentBuilding,
    useScroll,
    trainPlayerSpell,
    royalCourtResult,
    victoryResult,
    acceptKingsGift,
    dismissRoyalCourt,
    startNewGameFromVictory,
    shopInventory,
    shopMode,
    shopType,
    canOpenShop,
    openShop,
    buyFromShop,
    sellToShop,
    closeShop,
    shrineResult,
    mercOffers,
    teleportDestinations,
    showShrineHeal,
    canUseShrineHeal,
    trainingOptions,
    canTrain,
    canTeleportFromHere,
    canVisitMercCamp,
    recruitableUnit,
    useShrineHeal,
    dismissShrineResult,
    trainStatAction,
    openMercenaryCamp,
    hireMerc,
    recruitUnit,
    closeMercenaryCamp,
    openTeleport,
    teleportTo,
    closeTeleport,
    canBuild,
    availableBuildings,
    canPillage,
    restHealPreview,
    isOnEnemyLand,
    openBuildMenu,
    constructBuilding,
    closeBuildMenu,
    pillageLandAction,
    fireCastleDamageDealt,
    pendingVampiricBats,
    selectVampiricBatsTarget,
    cancelVampiricBats,
  }
}
