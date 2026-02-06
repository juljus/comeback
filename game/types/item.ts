import type { ItemType, PhysicalDamageType } from './enums'
import type { ManaRegen } from './mana'

/** Static item definition from items.csv */
export type ItemDefinition = {
  readonly name: string
  readonly nameEn: string
  readonly nameEt: string

  // Core (cols 1-6)
  readonly type: ItemType
  readonly diceCount: number
  readonly diceSides: number
  readonly value: number
  readonly reqStrength: number
  readonly damageType: PhysicalDamageType

  // Stat bonuses (cols 7-15)
  readonly bonusHp: number
  readonly bonusStrength: number
  readonly bonusDexterity: number
  readonly bonusPower: number
  readonly bonusArmor: number
  readonly bonusStrikes: number
  readonly grantsSpell: string
  readonly bonusHealing: number
  readonly bonusSpeed: number

  // Mana bonuses (cols 16-22)
  readonly manaBonus: ManaRegen

  // Elemental damage (cols 23-26)
  readonly elementalDamage: {
    readonly fire: number
    readonly earth: number
    readonly air: number
    readonly water: number
  }
}
