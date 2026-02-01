import { z } from 'zod'

// Import raw JSON data
import landsJson from './lands.json'
import mobsJson from './mobs.json'
import itemsJson from './items.json'
import buildingsJson from './buildings.json'
import spellsJson from './spells.json'
import eventsJson from './events.json'
import levelupJson from './levelup.json'

// ============================================================================
// SHARED SCHEMAS
// ============================================================================

/**
 * Localized string (English and Estonian)
 */
export const LocalizedStringSchema = z.object({
  en: z.string(),
  et: z.string(),
})

/**
 * Mana types (7 total)
 */
export const ManaTypeSchema = z.enum(['fire', 'earth', 'air', 'water', 'death', 'life', 'arcane'])
export type ManaType = z.infer<typeof ManaTypeSchema>

/**
 * Damage types for weapons
 */
export const DamageTypeSchema = z.enum(['pierce', 'slash', 'crush'])
export type DamageType = z.infer<typeof DamageTypeSchema>

/**
 * Mana pool - one value per mana type
 */
export const ManaPoolSchema = z.object({
  fire: z.number(),
  earth: z.number(),
  air: z.number(),
  water: z.number(),
  death: z.number(),
  life: z.number(),
  arcane: z.number(),
})
export type ManaPool = z.infer<typeof ManaPoolSchema>

/**
 * Elemental damage values (fire, poison, air, cold)
 */
export const ElementalDamageSchema = z.object({
  fire: z.number(),
  poison: z.number(),
  air: z.number(),
  cold: z.number(),
})
export type ElementalDamage = z.infer<typeof ElementalDamageSchema>

/**
 * Immunities - resistance to status effects and elemental damage
 */
export const ImmunitiesSchema = z.object({
  fire: z.number(),
  lightning: z.number(),
  cold: z.number(),
  poison: z.number(),
  bleeding: z.number(),
  stun: z.number(),
})
export type Immunities = z.infer<typeof ImmunitiesSchema>

/**
 * AI behavior flags for mobs
 */
export const AIBehaviorSchema = z.object({
  gallantry: z.number(),
  obedience: z.number(),
  bravery: z.number(),
})
export type AIBehavior = z.infer<typeof AIBehaviorSchema>

// ============================================================================
// LAND SCHEMA
// ============================================================================

export const LandTypeSchema = z.object({
  id: z.number(),
  name: z.object({
    short: LocalizedStringSchema,
    long: LocalizedStringSchema,
  }),
  price: z.number(),
  taxIncome: z.number(),
  healing: z.number(),
  defenders: z.array(z.string()),
  spawnChance: z.number(),
  availableBuildings: z.array(z.string()),
  isUtility: z.boolean(),
  isRoyalCourt: z.boolean().optional(),
  manaType: ManaTypeSchema.nullable(),
})

export type LandType = z.infer<typeof LandTypeSchema>

// ============================================================================
// MOB SCHEMA
// ============================================================================

export const MobTypeSchema = z.object({
  id: z.number(),
  name: LocalizedStringSchema,
  hp: z.number(),
  attacksPerRound: z.number(),
  armor: z.number(),
  damage: z.object({
    diceCount: z.number(),
    diceSides: z.number(),
  }),
  stats: z.object({
    strength: z.number(),
    dexterity: z.number(),
    power: z.number(),
  }),
  damageType: DamageTypeSchema,
  aiBehavior: AIBehaviorSchema,
  mana: ManaPoolSchema,
  manaRegen: ManaPoolSchema,
  mercTier: z.number(),
  hasSpells: z.boolean(),
  spells: z.array(z.string()),
  elementalDamage: ElementalDamageSchema,
  immunities: ImmunitiesSchema,
  spellLevelBonus: z.number(),
  evolvesInto: z.string().optional(),
})

export type MobType = z.infer<typeof MobTypeSchema>

// ============================================================================
// ITEM SCHEMA
// ============================================================================

// Item elemental damage uses different keys (earth/water instead of poison/cold)
export const ItemElementalDamageSchema = z.object({
  fire: z.number(),
  earth: z.number(),
  air: z.number(),
  water: z.number(),
})

export const ItemTypeSchema = z.object({
  id: z.number(),
  name: LocalizedStringSchema,
  type: z.enum(['weapon', 'helm', 'armor', 'boots', 'ring', 'consumable']),
  value: z.number(),
  requiredStrength: z.number(),
  bonuses: z.object({
    hp: z.number(),
    strength: z.number(),
    dexterity: z.number(),
    power: z.number(),
    armor: z.number(),
    strikes: z.number(),
    healing: z.number(),
    speed: z.number(),
  }),
  manaBonus: ManaPoolSchema,
  elementalDamage: ItemElementalDamageSchema,
  grantsSpell: z.string(),
  weapon: z.object({
    diceCount: z.number(),
    diceSides: z.number(),
    damageType: DamageTypeSchema,
  }).optional(),
})

export type ItemType = z.infer<typeof ItemTypeSchema>

// ============================================================================
// BUILDING SCHEMA
// ============================================================================

export const BuildingTypeSchema = z.object({
  id: z.number(),
  name: LocalizedStringSchema,
  cost: z.number(),
  prerequisites: z.array(z.string()),
  grantsSpells: z.array(z.string()),
  unlocksMercenaries: z.array(z.string()),
  // Fortification
  fortificationLevel: z.number(),
  archerySlots: z.number(),
  castleDefender: z.string(),
  gateDefense: z.number(),
  // Land bonuses
  healingBonus: z.number(),
  incomeBonus: z.number(),
  // Player bonuses
  manaRegen: ManaPoolSchema,
  statBonuses: z.object({
    strength: z.number(),
    dexterity: z.number(),
    power: z.number(),
  }),
  combatRoundsBonus: z.number(),
  spellLevelBonus: z.number(),
  // Special flags
  isPortal: z.boolean(),
  isBank: z.boolean(),
})

export type BuildingType = z.infer<typeof BuildingTypeSchema>

// ============================================================================
// SPELL SCHEMA
// ============================================================================

export const SpellEffectsSchema = z.object({
  generatesGold: z.boolean(),
  generatesItem: z.boolean(),
  isSummon: z.boolean(),
  hasHeal: z.boolean(),
  hasArmorBuff: z.boolean(),
  hasHaste: z.boolean(),
  hasStrengthBuff: z.boolean(),
  hasWindEffect: z.boolean(),
  vampiricPercent: z.number(),
})
export type SpellEffects = z.infer<typeof SpellEffectsSchema>

export const SpellTargetingSchema = z.object({
  isAggressive: z.boolean(),
  canTargetFriendly: z.boolean(),
  canTargetHostile: z.boolean(),
  canTargetGroup: z.boolean(),
  canTargetSingle: z.boolean(),
  canTargetLand: z.boolean(),
  canTargetPlayer: z.boolean(),
  hasGlobalRange: z.boolean(),
})
export type SpellTargeting = z.infer<typeof SpellTargetingSchema>

export const SpellTypeSchema = z.object({
  id: z.number(),
  name: LocalizedStringSchema,
  description: LocalizedStringSchema,
  type: z.enum(['damage', 'summon', 'buff']),
  manaType: ManaTypeSchema,
  manaCost: z.number(),
  effectType: z.enum(['singleTarget', 'aoe', 'summon', 'utility', 'buff']),
  basePower: z.number(),
  summons: z.array(z.string()),
  effects: SpellEffectsSchema,
  targeting: SpellTargetingSchema,
  summonTiers: z.array(z.object({
    creature: z.string(),
    count: z.number(),
  })).optional(),
})

export type SpellType = z.infer<typeof SpellTypeSchema>

// ============================================================================
// EVENT SCHEMA
// ============================================================================

export const EventLocationSchema = z.object({
  enabled: z.boolean(),
  chance: z.number(),
})

export const EventTypeSchema = z.object({
  id: z.number(),
  name: LocalizedStringSchema,
  type: z.string(),
  description: LocalizedStringSchema,
  locations: z.object({
    treasureIsland: EventLocationSchema,
    cave: EventLocationSchema,
    dungeon: EventLocationSchema,
  }),
  effect: z.object({
    gold: z.object({
      min: z.number(),
      max: z.number(),
    }).optional(),
    stat: z.enum(['strength', 'dexterity', 'power']).optional(),
    amount: z.number().optional(),
    combat: z.boolean().optional(),
    itemReward: z.boolean().optional(),
    heal: z.object({
      min: z.number(),
      max: z.number(),
    }).optional(),
    mana: z.object({
      type: z.string(),
      amount: z.object({
        min: z.number(),
        max: z.number(),
      }),
    }).optional(),
    companion: z.boolean().optional(),
    buff: z.string().optional(),
    learnSpell: z.boolean().optional(),
  }).optional(),
  choices: z.array(z.object({
    text: LocalizedStringSchema,
    effect: z.string(),
  })).optional(),
})

export type EventType = z.infer<typeof EventTypeSchema>

// ============================================================================
// LEVELUP SCHEMA (Pet Evolution)
// ============================================================================

export const LevelupTypeSchema = z.object({
  id: z.number(),
  name: LocalizedStringSchema,
  evolvesInto: z.string(),
  hpBonus: z.number(),
  attacksBonus: z.number(),
  damageBonus: z.object({
    diceCount: z.number(),
    diceSides: z.number(),
  }),
  statBonuses: z.object({
    strength: z.number(),
    dexterity: z.number(),
    power: z.number(),
  }),
  armorBonus: z.number(),
  learnsSpells: z.array(z.string()),
  resistances: ImmunitiesSchema,
})

export type LevelupType = z.infer<typeof LevelupTypeSchema>

// ============================================================================
// COMBAT STATE SCHEMAS (for runtime data)
// ============================================================================

/**
 * Status effects tracked during combat
 */
export const StatusEffectsSchema = z.object({
  bleeding: z.number(),
  stun: z.number(),
  poison: z.number(),
  frozen: z.number(),
  burning: z.number(),
})
export type StatusEffects = z.infer<typeof StatusEffectsSchema>

/**
 * Combat action types
 */
export const CombatActionSchema = z.enum([
  'flee',
  'melee',
  'ranged',
  'peacefulSpell',
  'targetSpell',
  'massSpell',
  'defend',
])
export type CombatAction = z.infer<typeof CombatActionSchema>

/**
 * Active effect (buff/debuff)
 */
export const ActiveEffectSchema = z.object({
  casterId: z.number(),
  targetId: z.number(),
  duration: z.number(),
  armorBonus: z.number(),
  hasteBonus: z.number(),
  strengthBonus: z.number(),
  windsPower: z.number(),
  checkedFlag: z.number(),
  moneyReward: z.number(),
  itemReward: z.number(),
  landReward: z.number(),
})
export type ActiveEffect = z.infer<typeof ActiveEffectSchema>

// ============================================================================
// VALIDATED DATA EXPORTS
// ============================================================================

/**
 * Parse and validate all data at module load time.
 * This will throw immediately if any data is invalid.
 */
function parseArrayStrict<T>(schema: z.ZodType<T>, data: unknown[], name: string): T[] {
  const results: T[] = []
  for (let i = 0; i < data.length; i++) {
    const result = schema.safeParse(data[i])
    if (!result.success) {
      const errors = result.error.issues.map((e: z.ZodIssue) => `  ${e.path.join('.')}: ${e.message}`).join('\n')
      throw new Error(`Invalid ${name}[${i}]:\n${errors}`)
    }
    results.push(result.data)
  }
  return results
}

// Validate and export all data
export const lands: LandType[] = parseArrayStrict(LandTypeSchema, landsJson, 'lands')
export const mobs: MobType[] = parseArrayStrict(MobTypeSchema, mobsJson, 'mobs')
export const items: ItemType[] = parseArrayStrict(ItemTypeSchema, itemsJson, 'items')
export const buildings: BuildingType[] = parseArrayStrict(BuildingTypeSchema, buildingsJson, 'buildings')
export const spells: SpellType[] = parseArrayStrict(SpellTypeSchema, spellsJson, 'spells')
export const events: EventType[] = parseArrayStrict(EventTypeSchema, eventsJson, 'events')
export const levelups: LevelupType[] = parseArrayStrict(LevelupTypeSchema, levelupJson, 'levelups')

// ============================================================================
// HELPER LOOKUP FUNCTIONS
// ============================================================================

export function getLandById(id: number): LandType | undefined {
  return lands.find(l => l.id === id)
}

export function getMobById(id: number): MobType | undefined {
  return mobs.find(m => m.id === id)
}

export function getMobByName(name: string): MobType | undefined {
  return mobs.find(m => m.name.et === name || m.name.en === name)
}

export function getItemById(id: number): ItemType | undefined {
  return items.find(i => i.id === id)
}

export function getBuildingById(id: number): BuildingType | undefined {
  return buildings.find(b => b.id === id)
}

export function getBuildingByName(name: string): BuildingType | undefined {
  return buildings.find(b => b.name.et === name || b.name.en === name)
}

export function getSpellById(id: number): SpellType | undefined {
  return spells.find(s => s.id === id)
}

export function getSpellByName(name: string): SpellType | undefined {
  return spells.find(s => s.name.et === name || s.name.en === name)
}

export function getEventById(id: number): EventType | undefined {
  return events.find(e => e.id === id)
}

export function getLevelupByName(name: string): LevelupType | undefined {
  return levelups.find(l => l.name.et === name || l.name.en === name)
}
