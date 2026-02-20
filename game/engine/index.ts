export { createRng, randomInt, rollDice, rollMovement } from './dice'
export type { MovementRoll } from './dice'

export {
  calcArcaneManaProduction,
  calcArmorReduction,
  calcBankBonus,
  calcBleedingDamage,
  calcBleedingDecay,
  calcBurningDecay,
  calcColdResistance,
  calcCompanionHealing,
  calcCrushCritChance,
  calcDoubleBonus,
  calcElementalAfterResistance,
  calcFireResistance,
  calcLightningResistance,
  calcMeleeDamage,
  calcPierceCritChance,
  calcPoisonDamage,
  calcPoisonResistance,
  calcRestHealing,
  calcShrineHealing,
  calcSlashCritChance,
  calcStunDecay,
  calcTaxIncome,
  calcTitleSalary,
  calcTreasureGold,
  checkColdCrit,
  checkFireCrit,
  checkPhysicalCrit,
} from './formulas'
export type { CritResult } from './formulas'

export { generateBoard } from './board'

export {
  calcBuildingStatBonuses,
  calcNaturalHpRegen,
  canEquipItem,
  createCompanionFromCreature,
  createSummonedCompanion,
  createPlayer,
  equipItem,
  equipItemFromInventory,
  itemTypeToSlot,
  recalcDerivedStats,
  resolveUpkeep,
  unequipItem,
  unequipItemToInventory,
} from './player'
export type { PoisonTickEntry, UpkeepResult } from './player'

export {
  EMPTY_IMMUNITIES,
  EMPTY_STATUS,
  initFortifiedCombat,
  initNeutralCombat,
  initPvPCombat,
  rollDetection,
  resolveAttackHits,
  resolveAttackRound,
  resolveAttackRoundV2,
  resolveFleeAttempt,
  resolveFortifiedFlee,
  resolveFortifiedRound,
  tickStatusEffects,
} from './combat'
export type {
  AttackHitParams,
  AttackerProfile,
  CombatAction,
  CombatRoundResult,
  CombatStatusEffects,
  CompanionCombatSnapshot,
  CompanionRoundResult,
  DefenderRoundResult,
  DefenderSnapshot,
  DefenseParams,
  DetectionResult,
  FleeResult,
  FortifiedCombatAction,
  FortifiedRoundResult,
  HitResult,
  NeutralCombatState,
} from './combat'

export { resolveCombatSpellRound } from './combatMagic'
export type { SpellCombatResult, SpellTarget } from './combatMagic'

export {
  calcSpellDamage,
  calcBuffEffect,
  calcSummonResult,
  calcGoldGeneration,
  calcItemGeneration,
  calcPolymorphResult,
  calcVampiricBatsDrain,
  validateCast,
  deductManaCost,
} from './magic'
export type {
  SpellDamageResult,
  BuffResult,
  SummonResult,
  PolymorphResult,
  CastValidation,
} from './magic'

export { learnFromScroll, learnFromBuilding, calcTrainingCost, trainSpell } from './spellLearning'

export {
  calcLandManaRegen,
  calcTotalManaRegen,
  applyManaRegen,
  tickEffectDurations,
  expireSummonedCompanions,
} from './mana'

export {
  MAX_INVENTORY_SIZE,
  MAX_COMPANIONS,
  SHRINE_HEALING_COST,
  STAT_MAX_TRAINING_GROUNDS,
  LAND_PRICE_MULTIPLIER,
  calcSellPrice,
  buyItem,
  sellItem,
  buyLand,
  canBuildBuilding,
  buildBuilding,
  getBuildableLandTypes,
  calcLandIncome,
  regenLandIncome,
  calcIncomeImprovement,
  improveLandIncome,
  pillageLand,
  calcStatTrainingCost,
  trainStat,
  calcMercHireCost,
  calcRecruitCost,
  hireMercenary,
  generateShopInventory,
  calcDefenderUpgradeCost,
  calcTitle,
  generateKingsGift,
} from './economy'
export type { BuildableLandType } from './economy'

export { didPassRoyalCourt, countBanks, resolveRoyalCourtPassing } from './royalCourt'
export type { RoyalCourtResult, LandRegenEntry, RecruitReplenishEntry } from './royalCourt'

export { checkVictoryCondition, eliminatePlayer } from './victory'
export type { VictoryCheckResult } from './victory'

export {
  applyShrineHealing,
  canTeleport,
  getAvailableTeleportDestinations,
  getTrainingOptions,
  landKeyToShopType,
  getRecruitableUnit,
  generateMercenaryCampOffers,
  meetsPetTypeRequirements,
} from './specialSquares'
export type { ShrineHealResult, TeleportDestination, MercenaryCampOffer } from './specialSquares'

export {
  EVENT_TABLES,
  selectEvent,
  triggerAdventureEvent,
  resolveSmallTreasure,
  resolveGuardedTreasure,
  resolveMobWithItem,
  resolveDexterityChallenge,
  resolveStrengthChallenge,
  resolvePowerChallenge,
  resolveHermitHealing,
  resolveHermitTraining,
  generateManaFountainOptions,
  applyManaFountain,
  resolveFreePrisoner,
  applyElementalRiver,
  generateSageSpells,
  applySageLesson,
  resolveChoiceEvent,
  selectGuardian,
  selectTreasureItem,
  TREASURE_GUARDIANS,
  ITEM_GUARDIANS,
} from './events'
export type {
  AdventureLocationType,
  EventType,
  EventDefinition,
  EventResult,
  SmallTreasureResult,
  GuardedTreasureResult,
  MobWithItemResult,
  StatChallengeResult,
  PowerChallengeResult,
  HermitResult,
  ManaFountainResult,
  FreePrisonerResult,
  ElementalRiverResult,
  SageResult,
  ChoiceEventResult,
  GuardianPoolEntry,
} from './events'
