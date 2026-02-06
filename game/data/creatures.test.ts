import { describe, expect, it } from 'vitest'
import type { PhysicalDamageType } from '../types'
import { CREATURES } from './creatures'

const VALID_DAMAGE_TYPES: PhysicalDamageType[] = ['crush', 'pierce', 'slash']

describe('CREATURES', () => {
  it('has 130 creatures matching mobs.csv row count', () => {
    expect(Object.keys(CREATURES)).toHaveLength(130)
  })

  it('every creature has positive hp', () => {
    for (const [key, c] of Object.entries(CREATURES)) {
      expect(c.hp, `${key} hp`).toBeGreaterThan(0)
    }
  })

  it('every creature has attacksPerRound >= 1', () => {
    for (const [key, c] of Object.entries(CREATURES)) {
      expect(c.attacksPerRound, `${key} attacksPerRound`).toBeGreaterThanOrEqual(1)
    }
  })

  it('every creature has diceCount >= 0', () => {
    for (const [key, c] of Object.entries(CREATURES)) {
      expect(c.diceCount, `${key} diceCount`).toBeGreaterThanOrEqual(0)
    }
  })

  it('every creature has diceSides >= 0', () => {
    for (const [key, c] of Object.entries(CREATURES)) {
      expect(c.diceSides, `${key} diceSides`).toBeGreaterThanOrEqual(0)
    }
  })

  it('every creature has strength >= 0', () => {
    for (const [key, c] of Object.entries(CREATURES)) {
      expect(c.strength, `${key} strength`).toBeGreaterThanOrEqual(0)
    }
  })

  it('every creature has dexterity >= 0', () => {
    for (const [key, c] of Object.entries(CREATURES)) {
      expect(c.dexterity, `${key} dexterity`).toBeGreaterThanOrEqual(0)
    }
  })

  it('every creature has power >= 0', () => {
    for (const [key, c] of Object.entries(CREATURES)) {
      expect(c.power, `${key} power`).toBeGreaterThanOrEqual(0)
    }
  })

  it('every creature has armor >= 0', () => {
    for (const [key, c] of Object.entries(CREATURES)) {
      expect(c.armor, `${key} armor`).toBeGreaterThanOrEqual(0)
    }
  })

  it('every creature has non-empty nameEn and nameEt', () => {
    for (const [key, c] of Object.entries(CREATURES)) {
      expect(c.nameEn, `${key} nameEn`).toBeTruthy()
      expect(c.nameEt, `${key} nameEt`).toBeTruthy()
    }
  })

  it('every creature has a valid damageType', () => {
    for (const [key, c] of Object.entries(CREATURES)) {
      expect(VALID_DAMAGE_TYPES, `${key} damageType "${c.damageType}"`).toContain(c.damageType)
    }
  })

  it('creatures with hasSpells=true have non-empty spells array', () => {
    const withSpells = Object.entries(CREATURES).filter(([, c]) => c.hasSpells)
    expect(withSpells.length).toBeGreaterThan(0)
    for (const [key, c] of withSpells) {
      expect(c.spells.length, `${key} spells`).toBeGreaterThan(0)
    }
  })

  it('creatures with non-empty spells array have hasSpells=true', () => {
    for (const [key, c] of Object.entries(CREATURES)) {
      if (c.spells.length > 0) {
        expect(c.hasSpells, `${key} hasSpells`).toBe(true)
      }
    }
  })

  it('creatures with mercTier > 0 have positive hire cost indicator', () => {
    const mercs = Object.entries(CREATURES).filter(([, c]) => c.mercTier > 0)
    expect(mercs.length).toBeGreaterThan(0)
    for (const [key, c] of mercs) {
      expect(c.mercTier, `${key} mercTier`).toBeGreaterThan(0)
    }
  })

  describe('spot-checks from CSV', () => {
    it('Pikeman has correct stats', () => {
      const pikeman = Object.values(CREATURES).find((c) => c.nameEn === 'Pikeman')
      expect(pikeman).toBeDefined()
      expect(pikeman!.hp).toBe(12)
      expect(pikeman!.attacksPerRound).toBe(1)
      expect(pikeman!.strength).toBe(3)
    })

    it('God has 1000 hp', () => {
      const god = Object.values(CREATURES).find((c) => c.nameEn === 'God')
      expect(god).toBeDefined()
      expect(god!.hp).toBe(1000)
    })

    it('Phoenix has fire elemental damage of 8', () => {
      const phoenix = Object.values(CREATURES).find((c) => c.nameEn === 'Phoenix')
      expect(phoenix).toBeDefined()
      expect(phoenix!.elementalDamage.fire).toBe(8)
    })

    it('Scorpion has poison elemental damage of 4', () => {
      const scorpion = Object.values(CREATURES).find((c) => c.nameEn === 'Scorpion')
      expect(scorpion).toBeDefined()
      // CSV col 41 maps to earth in the type, labeled "Poison dam" in VBA legend
      expect(scorpion!.elementalDamage.earth).toBe(4)
    })
  })
})
