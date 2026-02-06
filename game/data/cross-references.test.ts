import { describe, expect, it } from 'vitest'
import { BUILDINGS } from './buildings'
import { CREATURES } from './creatures'
import { ITEMS } from './items'
import { LANDS } from './lands'
import { SPELLS } from './spells'

const creatureKeys = new Set(Object.keys(CREATURES))
const spellKeys = new Set(Object.keys(SPELLS))
const buildingKeys = new Set(Object.keys(BUILDINGS))
const landKeys = new Set(Object.keys(LANDS))

describe('cross-reference validation', () => {
  describe('creatures -> spells', () => {
    it('every creature spell references a valid spell key', () => {
      for (const [key, c] of Object.entries(CREATURES)) {
        for (const spell of c.spells) {
          expect(spellKeys.has(spell), `${key} spell "${spell}" not in SPELLS`).toBe(true)
        }
      }
    })

    it('every creature evolvesInto is empty or a numeric evolution group ID', () => {
      for (const [key, c] of Object.entries(CREATURES)) {
        if (c.evolvesInto !== '') {
          expect(
            /^\d+$/.test(c.evolvesInto),
            `${key} evolvesInto "${c.evolvesInto}" should be empty or numeric group ID`,
          ).toBe(true)
        }
      }
    })
  })

  describe('spells -> creatures', () => {
    it('every summonTier creature references a valid creature key', () => {
      for (const [key, s] of Object.entries(SPELLS)) {
        for (const tier of s.summonTiers) {
          expect(
            creatureKeys.has(tier.creature),
            `${key} summonTier creature "${tier.creature}" not in CREATURES`,
          ).toBe(true)
        }
      }
    })
  })

  describe('items -> spells', () => {
    it('every item grantsSpell references a valid spell key or empty', () => {
      for (const [key, item] of Object.entries(ITEMS)) {
        if (item.grantsSpell !== '') {
          expect(
            spellKeys.has(item.grantsSpell),
            `${key} grantsSpell "${item.grantsSpell}" not in SPELLS`,
          ).toBe(true)
        }
      }
    })
  })

  describe('lands -> creatures', () => {
    it('every land defender references a valid creature key', () => {
      for (const [key, land] of Object.entries(LANDS)) {
        for (const defender of land.defenders) {
          expect(creatureKeys.has(defender), `${key} defender "${defender}" not in CREATURES`).toBe(
            true,
          )
        }
      }
    })
  })

  describe('lands -> buildings', () => {
    it('every land building references a valid building key', () => {
      for (const [key, land] of Object.entries(LANDS)) {
        for (const building of land.buildings) {
          expect(buildingKeys.has(building), `${key} building "${building}" not in BUILDINGS`).toBe(
            true,
          )
        }
      }
    })
  })

  describe('buildings -> buildings', () => {
    it('every building prereq references a valid building key', () => {
      for (const [key, b] of Object.entries(BUILDINGS)) {
        for (const prereq of b.prereqs) {
          expect(buildingKeys.has(prereq), `${key} prereq "${prereq}" not in BUILDINGS`).toBe(true)
        }
      }
    })
  })

  describe('buildings -> spells', () => {
    it('every building grantsSpells spell references a valid spell key', () => {
      for (const [key, b] of Object.entries(BUILDINGS)) {
        for (const gs of b.grantsSpells) {
          expect(
            spellKeys.has(gs.spell),
            `${key} grantsSpells spell "${gs.spell}" not in SPELLS`,
          ).toBe(true)
        }
      }
    })

    it('every building grantsSpells landTypeRestriction references a valid land key', () => {
      for (const [key, b] of Object.entries(BUILDINGS)) {
        for (const gs of b.grantsSpells) {
          expect(
            landKeys.has(gs.landTypeRestriction),
            `${key} grantsSpells landTypeRestriction "${gs.landTypeRestriction}" not in LANDS`,
          ).toBe(true)
        }
      }
    })
  })

  describe('buildings -> creatures', () => {
    it('every building castleDefender references a valid creature key or empty', () => {
      for (const [key, b] of Object.entries(BUILDINGS)) {
        if (b.castleDefender !== '') {
          expect(
            creatureKeys.has(b.castleDefender),
            `${key} castleDefender "${b.castleDefender}" not in CREATURES`,
          ).toBe(true)
        }
      }
    })

    it('every building recruitableUnit references a valid creature key or empty', () => {
      for (const [key, b] of Object.entries(BUILDINGS)) {
        if (b.recruitableUnit !== '') {
          expect(
            creatureKeys.has(b.recruitableUnit),
            `${key} recruitableUnit "${b.recruitableUnit}" not in CREATURES`,
          ).toBe(true)
        }
      }
    })
  })
})
