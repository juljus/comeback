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
  canEquipItem,
  createCompanionFromCreature,
  createPlayer,
  equipItem,
  equipItemFromInventory,
  itemTypeToSlot,
  recalcDerivedStats,
  unequipItem,
  unequipItemToInventory,
} from './player'

export {
  EMPTY_IMMUNITIES,
  EMPTY_STATUS,
  initFortifiedCombat,
  initNeutralCombat,
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
  FleeResult,
  FortifiedCombatAction,
  FortifiedRoundResult,
  HitResult,
  NeutralCombatState,
} from './combat'
