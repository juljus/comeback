import { describe, expect, it } from 'vitest'
import { LANDS } from './lands'

describe('LANDS', () => {
  it('has 40 lands matching lands.csv row count', () => {
    expect(Object.keys(LANDS)).toHaveLength(40)
  })

  it('every land has non-negative price, taxIncome, healing', () => {
    for (const [key, land] of Object.entries(LANDS)) {
      expect(land.price, `${key} price`).toBeGreaterThanOrEqual(0)
      expect(land.taxIncome, `${key} taxIncome`).toBeGreaterThanOrEqual(0)
      expect(land.healing, `${key} healing`).toBeGreaterThanOrEqual(0)
    }
  })

  it('territory lands have 4 defender tiers', () => {
    // Territory lands have price < 100 (utility lands use price=100)
    const territoryLands = Object.entries(LANDS).filter(([, land]) => land.price < 100)
    expect(territoryLands.length).toBeGreaterThan(0)
    for (const [key, land] of territoryLands) {
      expect(land.defenders, `${key} defenders`).toHaveLength(4)
      for (const defender of land.defenders) {
        expect(defender, `${key} defender`).toBeTruthy()
      }
    }
  })

  it('every land has non-empty name strings', () => {
    for (const [key, land] of Object.entries(LANDS)) {
      expect(land.nameShortEn, `${key} nameShortEn`).toBeTruthy()
      expect(land.nameLongEn, `${key} nameLongEn`).toBeTruthy()
      expect(land.nameShortEt, `${key} nameShortEt`).toBeTruthy()
      expect(land.nameLongEt, `${key} nameLongEt`).toBeTruthy()
    }
  })

  describe('spot-checks from CSV', () => {
    it('Valley has correct economics', () => {
      const valley = Object.values(LANDS).find((land) => land.nameLongEn === 'Valley')
      expect(valley).toBeDefined()
      expect(valley!.price).toBe(6)
      expect(valley!.taxIncome).toBe(8)
      expect(valley!.healing).toBe(5)
    })

    it('Volcano has correct stats', () => {
      const volcano = Object.values(LANDS).find((land) => land.nameLongEn === 'Volcano')
      expect(volcano).toBeDefined()
      expect(volcano!.price).toBe(25)
      expect(volcano!.spawnChance).toBe(3)
    })
  })
})
