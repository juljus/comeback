import { describe, expect, it } from 'vitest'
import type { ManaType, SpellType, SpellUsability } from '../types'
import { SPELLS } from './spells'

const VALID_MANA_TYPES: ManaType[] = ['fire', 'earth', 'air', 'water', 'death', 'life', 'arcane']

const VALID_SPELL_TYPES: SpellType[] = ['damage', 'utility', 'buff']

const VALID_USABILITY: SpellUsability[] = ['combat', 'adventure', 'both']

describe('SPELLS', () => {
  it('has 37 spells matching spells.csv row count', () => {
    expect(Object.keys(SPELLS)).toHaveLength(37)
  })

  it('every spell has a valid manaType', () => {
    for (const [key, s] of Object.entries(SPELLS)) {
      expect(VALID_MANA_TYPES, `${key} manaType "${s.manaType}"`).toContain(s.manaType)
    }
  })

  it('every spell has a valid type', () => {
    for (const [key, s] of Object.entries(SPELLS)) {
      expect(VALID_SPELL_TYPES, `${key} type "${s.type}"`).toContain(s.type)
    }
  })

  it('every spell has a valid usableIn', () => {
    for (const [key, s] of Object.entries(SPELLS)) {
      expect(VALID_USABILITY, `${key} usableIn "${s.usableIn}"`).toContain(s.usableIn)
    }
  })

  it('every spell has non-empty nameEn and nameEt', () => {
    for (const [key, s] of Object.entries(SPELLS)) {
      expect(s.nameEn, `${key} nameEn`).toBeTruthy()
      expect(s.nameEt, `${key} nameEt`).toBeTruthy()
    }
  })

  it('summon spells have non-empty summonTiers', () => {
    const summonSpells = Object.entries(SPELLS).filter(([, s]) => s.isSummon)
    expect(summonSpells.length).toBeGreaterThan(0)
    for (const [key, s] of summonSpells) {
      expect(s.summonTiers.length, `${key} summonTiers`).toBeGreaterThan(0)
    }
  })

  it('damage spells have basePower > 0', () => {
    const damageSpells = Object.entries(SPELLS).filter(([, s]) => s.type === 'damage')
    expect(damageSpells.length).toBeGreaterThan(0)
    for (const [key, s] of damageSpells) {
      expect(s.basePower, `${key} basePower`).toBeGreaterThan(0)
    }
  })

  describe('spot-checks from CSV', () => {
    it('Magic Arrow has basePower 7 and manaType arcane', () => {
      const spell = Object.values(SPELLS).find((s) => s.nameEn === 'Magic Arrow')
      expect(spell).toBeDefined()
      expect(spell!.basePower).toBe(7)
      expect(spell!.manaType).toBe('arcane')
    })

    it('Fire Bolt has basePower 9 and manaType fire', () => {
      const spell = Object.values(SPELLS).find((s) => s.nameEn === 'Fire Bolt')
      expect(spell).toBeDefined()
      expect(spell!.basePower).toBe(9)
      expect(spell!.manaType).toBe('fire')
    })

    it('Heal has manaType life', () => {
      const spell = Object.values(SPELLS).find((s) => s.nameEn === 'Heal')
      expect(spell).toBeDefined()
      expect(spell!.manaType).toBe('life')
    })

    it('Death Grasp has manaType death', () => {
      const spell = Object.values(SPELLS).find((s) => s.nameEn === 'Death Grasp')
      expect(spell).toBeDefined()
      expect(spell!.manaType).toBe('death')
    })
  })
})
