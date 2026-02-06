// ---------------------------------------------------------------------------
// Damage & combat
// ---------------------------------------------------------------------------

/** Physical damage types -- maps to CSV damage_type column in mobs/items */
export type PhysicalDamageType = 'crush' | 'pierce' | 'slash'

/** Elemental damage channels applied after physical damage */
export type ElementalDamageType = 'fire' | 'poison' | 'lightning' | 'cold'

/** All damage categories that can be dealt */
export type DamageType = PhysicalDamageType | ElementalDamageType

/** Runtime status effects tracked per-combatant (Side cols 54-58) */
export type StatusEffect = 'bleeding' | 'stun' | 'poison' | 'frozen' | 'burning'

/** Immunity channels (mobs cols 45-50 / Side cols 59-64) */
export type ImmunityType = 'fire' | 'lightning' | 'cold' | 'poison' | 'bleeding' | 'stun'

// ---------------------------------------------------------------------------
// Mana & magic
// ---------------------------------------------------------------------------

/** Seven schools of mana */
export type ManaType = 'fire' | 'earth' | 'air' | 'water' | 'death' | 'life' | 'arcane'

/**
 * Spell type from spells.csv col 1.
 * 1 = damage, 2 = summon/utility, 3 = buff
 */
export type SpellType = 'damage' | 'utility' | 'buff'

/**
 * Spell effect type from spells.csv col 7.
 * 0 = buff/utility, 8 = summon/create, 11 = single target, 12 = AOE
 */
export type SpellEffectType = 'buffUtility' | 'summonCreate' | 'singleTarget' | 'aoe'

// ---------------------------------------------------------------------------
// Items & equipment
// ---------------------------------------------------------------------------

/**
 * Item type from items.csv col 1.
 * 1=helm, 2=body, 3=boots, 4=ring, 6=weapon, 7=consumable
 */
export type ItemType = 'helm' | 'body' | 'boots' | 'ring' | 'weapon' | 'consumable'

/** Equipment slots on a player character */
export type ItemSlot = 'weapon' | 'head' | 'body' | 'feet' | 'ringRight' | 'ringLeft' | 'usable'

// ---------------------------------------------------------------------------
// Land & board
// ---------------------------------------------------------------------------

/** All land type identifiers (territory + utility + adventure) */
export type LandType =
  | 'valley'
  | 'forest'
  | 'highland'
  | 'hill'
  | 'mountain'
  | 'barren'
  | 'tundra'
  | 'desert'
  | 'swamp'
  | 'volcano'
  | 'brushland'
  | 'burrows'
  | 'jungle'
  | 'rocks'
  | 'iceland'
  | 'woodland'
  | 'darkForest'
  | 'plain'
  | 'pyramids'
  | 'ruins'
  | 'coast'
  | 'shop'
  | 'smithy'
  | 'bazaar'
  | 'library'
  | 'mageGuild'
  | 'mercenaryCamp'
  | 'trainingGrounds'
  | 'shrine'
  | 'arcaneTower'
  | 'cave'
  | 'treasureIsland'
  | 'dungeon'
  | 'royalCourt'
  | 'vabaKoht'
  | 'thievesGuild'
  | 'robbersGuild'

// ---------------------------------------------------------------------------
// Player & titles
// ---------------------------------------------------------------------------

export type Gender = 'male' | 'female'

/** Nobility titles -- thresholds: baron=3, count=9, duke=15 lands */
export type TitleRank = 'none' | 'baron' | 'count' | 'duke'

/**
 * Time-of-day phases within a turn.
 * Each player gets 3 action points per turn.
 */
export type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'evening'

// ---------------------------------------------------------------------------
// Combat actions
// ---------------------------------------------------------------------------

/**
 * Actions a combatant can choose during a combat round.
 * Maps to Side col 30 values.
 */
export type CombatAction =
  | 'flee'
  | 'melee'
  | 'ranged'
  | 'peacefulSpell'
  | 'singleTargetSpell'
  | 'massSpell'
  | 'defend'

// ---------------------------------------------------------------------------
// AI behavior
// ---------------------------------------------------------------------------

/**
 * Mob type classification from mobs.csv col 30 / Side col 37.
 * Determines AI targeting priorities and special behavior.
 */
export type MobType = number

/**
 * AI bravery threshold from mobs.csv col 13.
 * 10 = never flee.
 */
export type AiBravery = number
