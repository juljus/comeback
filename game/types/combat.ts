import type { CombatAction, ImmunityType, MobType, PhysicalDamageType, StatusEffect } from './enums'
import type { ManaPool, ManaRegen } from './mana'

/** Runtime state for a single combatant in the Side sheet (68 columns) */
export type Combatant = {
  // Identity (cols 1, 35)
  name: string
  entityId: number

  // HP (cols 2-3)
  currentHp: number
  maxHp: number

  // Combat mechanics (cols 4-7, 14-15)
  attacks: number
  diceCount: number
  diceSides: number
  damageType: PhysicalDamageType
  armor: number
  weaponName: string

  // Base stats (cols 8-10)
  baseStrength: number
  baseDexterity: number
  basePower: number

  // Modified stats after buffs (cols 11-13)
  modifiedStrength: number
  modifiedDexterity: number
  modifiedPower: number

  // Mana (cols 16-29)
  mana: ManaPool
  manaRegen: ManaRegen

  // Combat actions (cols 30-31)
  currentAction: CombatAction
  actionTarget: number

  // AI behavior (cols 32-34)
  aiBehavior1: number
  aiBehavior2: number
  aiBravery: number

  // Classification (cols 37-39)
  mobType: MobType
  behindWall: boolean
  mercContract: number

  // Spellcasting (cols 40-49)
  spellSlots: [string, string, string, string]
  hasSpells: boolean
  spellKnowledge: [number, number, number, number]
  speedBonus: number

  // Elemental damage (cols 50-53)
  elementalDamage: {
    fire: number
    earth: number
    air: number
    water: number
  }

  // Status effects (cols 54-58)
  statusEffects: Record<StatusEffect, number>

  // Immunities (cols 59-64)
  immunities: Record<ImmunityType, number>

  // Pet system (cols 65-68)
  evolutionCounter: number
  evolvesInto: string
  isPet: boolean
  spellLevelBonus: number
}
