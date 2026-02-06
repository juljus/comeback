import { describe, expect, it } from 'vitest'
import type { ItemType } from '../types'
import { ITEMS } from './items'

const VALID_ITEM_TYPES: ItemType[] = ['helm', 'body', 'boots', 'ring', 'weapon', 'consumable']

describe('ITEMS', () => {
  it('has 92 items matching items.csv base item row count', () => {
    expect(Object.keys(ITEMS)).toHaveLength(92)
  })

  it('every item has a valid type', () => {
    for (const [key, item] of Object.entries(ITEMS)) {
      expect(VALID_ITEM_TYPES, `${key} type "${item.type}"`).toContain(item.type)
    }
  })

  it('weapons have diceCount > 0 and diceSides > 0', () => {
    const weapons = Object.entries(ITEMS).filter(([, item]) => item.type === 'weapon')
    expect(weapons.length).toBeGreaterThan(0)
    for (const [key, item] of weapons) {
      expect(item.diceCount, `${key} diceCount`).toBeGreaterThan(0)
      expect(item.diceSides, `${key} diceSides`).toBeGreaterThan(0)
    }
  })

  it('non-weapons have diceCount=0 and diceSides=0', () => {
    const nonWeapons = Object.entries(ITEMS).filter(([, item]) => item.type !== 'weapon')
    expect(nonWeapons.length).toBeGreaterThan(0)
    for (const [key, item] of nonWeapons) {
      expect(item.diceCount, `${key} diceCount`).toBe(0)
      expect(item.diceSides, `${key} diceSides`).toBe(0)
    }
  })

  it('every item has positive value (price)', () => {
    for (const [key, item] of Object.entries(ITEMS)) {
      expect(item.value, `${key} value`).toBeGreaterThan(0)
    }
  })

  it('every item has non-empty nameEn and nameEt', () => {
    for (const [key, item] of Object.entries(ITEMS)) {
      expect(item.nameEn, `${key} nameEn`).toBeTruthy()
      expect(item.nameEt, `${key} nameEt`).toBeTruthy()
    }
  })

  it('items with grantsSpell have a non-empty spell name', () => {
    const withSpells = Object.entries(ITEMS).filter(([, item]) => item.grantsSpell !== '')
    expect(withSpells.length).toBeGreaterThan(0)
    for (const [key, item] of withSpells) {
      expect(item.grantsSpell, `${key} grantsSpell`).toBeTruthy()
    }
  })

  describe('spot-checks from CSV', () => {
    it('Knife has correct stats', () => {
      const knife = Object.values(ITEMS).find((item) => item.nameEn === 'Knife')
      expect(knife).toBeDefined()
      expect(knife!.diceCount).toBe(1)
      expect(knife!.diceSides).toBe(4)
      expect(knife!.value).toBe(20)
    })

    it('Mithril Longsword has 3d5 and extra strikes', () => {
      const sword = Object.values(ITEMS).find((item) => item.nameEn === 'Mithril Longsword')
      expect(sword).toBeDefined()
      expect(sword!.diceCount).toBe(3)
      expect(sword!.diceSides).toBe(5)
      expect(sword!.bonusStrikes).toBe(1)
    })
  })
})
