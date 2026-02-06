import { describe, expect, it } from 'vitest'
import { BUILDINGS } from './buildings'

describe('BUILDINGS', () => {
  it('has 48 buildings matching buildings.csv row count', () => {
    expect(Object.keys(BUILDINGS)).toHaveLength(48)
  })

  it('every building with cost > 0 has a non-negative cost', () => {
    for (const [key, b] of Object.entries(BUILDINGS)) {
      expect(b.cost, `${key} cost`).toBeGreaterThanOrEqual(0)
    }
  })

  it('every building has non-empty nameEn and nameEt', () => {
    for (const [key, b] of Object.entries(BUILDINGS)) {
      expect(b.nameEn, `${key} nameEn`).toBeTruthy()
      expect(b.nameEt, `${key} nameEt`).toBeTruthy()
    }
  })

  it('buildings that grant spells have non-empty spell names', () => {
    const withSpells = Object.entries(BUILDINGS).filter(([, b]) => b.grantsSpells.length > 0)
    expect(withSpells.length).toBeGreaterThan(0)
    for (const [key, b] of withSpells) {
      for (const gs of b.grantsSpells) {
        expect(gs.spell, `${key} grantsSpells spell`).toBeTruthy()
      }
    }
  })

  describe('Fort/Citadel/Castle prerequisite chain', () => {
    it('Fort costs 200', () => {
      const fort = Object.values(BUILDINGS).find((b) => b.nameEn === 'Fort')
      expect(fort).toBeDefined()
      expect(fort!.cost).toBe(200)
    })

    it('Citadel requires Fort', () => {
      const citadel = Object.values(BUILDINGS).find((b) => b.nameEn === 'Citadel')
      expect(citadel).toBeDefined()
      expect(citadel!.prereqs).toContain('fort')
    })

    it('Castle requires Citadel', () => {
      const castle = Object.values(BUILDINGS).find((b) => b.nameEn === 'Castle')
      expect(castle).toBeDefined()
      expect(castle!.prereqs).toContain('citadel')
    })
  })
})
