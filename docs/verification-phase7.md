# Verification Report: Phase 7 (Magic System)

**Date:** 2026-01-31
**Verified by:** Verifier Developer
**Status:** PARTIAL PASS - Critical data issues found

---

## Original Rules (from help.csv)

### Mana System (lines 23, 114)

> "Mana - mana. Loitsude nõidumiseks vajalik energia. Mana on võimalik saada maadest, võlujookidest, maagilistest asjadest. Iga loits, mida sa soovid nõiduda vajab teatud hulka mana."

**Translation:** "Mana - mana. Energy needed for casting spells. Mana can be obtained from lands, magic potions, magical items. Every spell you want to cast needs a certain amount of mana."

> "Iga loits vajab ühte kindlat tüüpi mana. Manatüüpe on seitse: tuli (fire), maa (earth), õhk (air), vesi (water), must (death), valge (life), arkaane (arcane) mana."

**Translation:** "Every spell needs one specific type of mana. There are seven mana types: fire, earth, air, water, death, life, arcane mana."

### Mana Colors (lines 46-73)

| Mana Type | Estonian | Original Color |
|-----------|----------|----------------|
| Fire | tuli | punane (red) |
| Earth | maa | roheline (green) |
| Air | õhk | helesinine (light blue) |
| Water | vesi | tumesinine (dark blue) |
| Death | must | sinakashall (grayish-blue) |
| Life | valge | valge (white) |
| Arcane | arkaane | kuldne (golden) |

### Arcane Tower Scaling (line 40)

> "Arc. Tower – (arcane tower) maagi torn. Üks maagi torn toodab ühes päevas 1 arkaane mana, kaks maagi torni toodavad 1-s päevas 3 arkaane mana, 3 maagi torni toodavad 6 ja 4 maagi torni ühe mängija omanduses toodavad 10 arkaane mana päevas."

**Translation:** "One Arcane Tower produces 1 arcane mana per day, two towers produce 3, three towers produce 6, and four towers produce 10 arcane mana per day."

Formula: 1→1, 2→3, 3→6, 4→10

### Land Mana Generation (lines 80-97)

| Land Type | Mana Generated |
|-----------|----------------|
| Valley | Life (valge) |
| Forest | Earth (maa) |
| Highland | None |
| Hill | Fire (tuli) |
| Mountain | Fire (tuli) |
| Barren | None |
| Tundra | None |
| Desert | Air (õhk) |
| Swamp | Death (must) |
| Volcano | None |
| Brushland | Earth (maa) |
| Burrows | None |
| Jungle | Water (vesi) |
| Rocks | Air (õhk) |
| Iceland | Water (vesi) |
| Woodland | None |
| Dark Forest | Death (must) |
| Plain | Life (valge) |

### Spell Power (line 116)

> "Loitsu tugevuse määrab nõiduja võluvõime (power) ja loitsu tugevusaste (level). Kui võluvõime suurus mõjutab loitsu tugevust märkimisväärselt, siis loitsu tugevusaste (level) mõjutab loitsu tugevust drastiliselt."

**Translation:** "Spell strength is determined by the caster's power stat and spell level. While power affects spell strength significantly, spell level affects it drastically."

### Power Ratio Mechanics (lines 117-118)

> "Kui sinu võluvõime (power) on 2 ja su vastase võluvõime on sama (ka 2), siis sinu nõidus „Fire Bolt" teebki talle umbers nii palju haiget kui nõiduse infos kirjas on - umbes 9 võrra haiget. Kui vastasel oleks aga 2x väiksem power kui sul (1)- siis põletaks su Fire Bolt talle juba 2x rohkem - vähemalt 18 võrra elusid vähemaks."

**Translation:** "If your power is 2 and your opponent's power is also 2, your Fire Bolt does the base damage (~9). If the opponent has 2x less power (1), your Fire Bolt does 2x damage (~18)."

This indicates damage scales by power ratio: `damage = basePower * (casterPower / targetPower)`

---

## Verification Results

### Mana Types

| Feature | Original Rule | Implementation | Status |
|---------|---------------|----------------|--------|
| 7 mana types | "Manatüüpe on seitse" | `ManaType` union with 7 types | ✅ PASS |
| Mana pool per player | Implied | `Player.mana: ManaPool` | ✅ PASS |
| Initial mana = 0 | Implied | All values init to 0 | ✅ PASS |

### Mana Colors

| Mana Type | Original | Implementation | Status |
|-----------|----------|----------------|--------|
| Fire | punane (red) | #ef4444 (red) | ✅ PASS |
| Earth | roheline (green) | #a3e635 (lime) | ✅ PASS |
| Air | helesinine (light blue) | #facc15 (yellow) | ⚠️ WRONG |
| Water | tumesinine (dark blue) | #3b82f6 (blue) | ✅ PASS |
| Death | sinakashall (grayish-blue) | #6b7280 (gray) | ✅ PASS |
| Life | valge (white) | #f9fafb (white) | ✅ PASS |
| Arcane | kuldne (golden) | #a855f7 (purple) | ⚠️ WRONG |

### Mana Generation from Lands

| Land ID | Land Name | Expected | Implementation | Status |
|---------|-----------|----------|----------------|--------|
| 19 | Arcane Tower | arcane | arcane | ✅ |
| 20 | Valley | life | life | ✅ |
| 21 | Forest | earth | earth | ✅ |
| 22 | Highland | none | null | ✅ |
| 23 | Hill | fire | fire | ✅ |
| 24 | Mountain | fire | fire | ✅ |
| 25 | Barren | none | null | ✅ |
| 26 | Tundra | none | null | ✅ |
| 27 | Desert | air | air | ✅ |
| 28 | Swamp | death | death | ✅ |
| 29 | Volcano | none | null | ✅ |
| 30 | Brushland | earth | earth | ✅ |
| 31 | Burrows | none | null | ✅ |
| 32 | Jungle | water | water | ✅ |
| 33 | Rocks | air | air | ✅ |
| 34 | Iceland | water | water | ✅ |
| 35 | Woodland | none | null | ✅ |
| 36 | Dark Forest | death | death | ✅ |
| 37 | Plain | life | life | ✅ |

**All land-to-mana mappings VERIFIED** ✅

### Arcane Tower Scaling

| Towers | Expected Mana | Implementation | Status |
|--------|---------------|----------------|--------|
| 0 | 0 | 0 | ✅ |
| 1 | 1 | 1 | ✅ |
| 2 | 3 | 3 | ✅ |
| 3 | 6 | 6 | ✅ |
| 4+ | 10 | 10 | ✅ |

Implementation at `getArcaneTowerMana()` (game.ts:2005-2008): `manaByCount = [0, 1, 3, 6, 10]` ✅

### Mana Collection

| Feature | Original Rule | Implementation | Status |
|---------|---------------|----------------|--------|
| Collect on Royal Court pass | "saada maadest" | `collectIncome()` lines 748-792 | ✅ PASS |
| Each land gives 1 mana | Implied | `manaGained[manaType] += 1` | ✅ PASS |
| Arcane uses special scaling | Line 40 | `getArcaneTowerMana()` called | ✅ PASS |

### Spell System

| Feature | Original Rule | Implementation | Status |
|---------|---------------|----------------|--------|
| Spell type interface | Various | `SpellType` interface | ✅ PASS |
| Known spells per player | Line 121 | `Player.knownSpells: string[]` | ✅ PASS |
| Mana cost check | Line 115 | `player.mana[spell.manaType] < spell.manaCost` | ✅ PASS |
| Spell casting action | Implied | `castSpell()` action | ✅ PASS |
| Combat spell casting | Implied | `castCombatSpell()` action | ✅ PASS |

### Spell Power Calculation

| Feature | Original Rule | Implementation | Status |
|---------|---------------|----------------|--------|
| Power affects damage | Line 116 | `damage = basePower + power/2` | ⚠️ PARTIAL |
| Power ratio formula | Line 117-118 | **NOT IMPLEMENTED** | ❌ FAIL |
| Spell level system | Line 116, 119 | **NOT IMPLEMENTED** | ❌ FAIL |
| Spell resistance | Line 16 | **NOT IMPLEMENTED** | ❌ FAIL |

**Critical Issue:** Current formula `damage = basePower + power/2` does not match original power ratio mechanics.

### Spell Effects

| Effect Type | Original Rule | Implementation | Status |
|-------------|---------------|----------------|--------|
| singleTarget damage | Lines 47, 52, 58, 62, 65, 70 | `castCombatSpell()` | ✅ PASS |
| AOE damage | Lines 53, 67, 77 | `effectType: 'aoe'` recognized | ✅ PASS |
| Heal | Line 74 | `castSpell()` heals `5 + power*2` | ✅ PASS |
| Pot of Gold | Line 48 | `castSpell()` gives `10 + power*5` gold | ✅ PASS |
| Buff spells | Lines 56, 66, 72 | Message only, no tracking | ❌ FAIL |
| Summon spells | Lines 50, 54, 57, etc. | Message only, no companions | ❌ FAIL |

### Spell Learning

| Feature | Original Rule | Implementation | Status |
|---------|---------------|----------------|--------|
| Learn from buildings | Lines 80-97, 121 | `buildOnLand()` grants from `grantsSpells` | ✅ PASS |
| Learn from scrolls | Line 121, 122 | **NOT IMPLEMENTED** | ❌ FAIL |
| Train spells at Library | Line 35 | **NOT IMPLEMENTED** | ❌ FAIL |
| Train spells at Mage Guild | Line 36 | **NOT IMPLEMENTED** | ❌ FAIL |
| Improve spell level | Line 119, 121 | **NOT IMPLEMENTED** | ❌ FAIL |

---

## Data Quality Issues

### spells.json Mana Costs

**CRITICAL:** Almost all spells have `manaCost: 0`, which is clearly incorrect.

| Spell | Current Cost | Expected |
|-------|--------------|----------|
| Magic Arrow | 3 | ✅ Correct |
| Fire Bolt | 0 | ❌ Should be > 0 |
| Fireball | 0 | ❌ Should be > 0 |
| Lightning Bolt | 0 | ❌ Should be > 0 |
| Heal | 0 | ❌ Should be > 0 |
| All others | 0 | ❌ Should be > 0 |

This appears to be a data extraction error. Spells should cost mana to cast.

### spells.json Effect Types

Some spells have incorrect effectType:

| Spell | Current effectType | Expected |
|-------|-------------------|----------|
| Pot of Gold (ID 1) | summon | utility |
| Summon Golem (ID 3) | utility | summon |
| Haste (ID 15) | utility | buff |
| Unholy Strength (ID 20) | utility | buff |

---

## Code Locations

### game.ts
- `ManaType` and `ManaPool`: lines 82-95
- `Player.mana`: line 211
- `LAND_MANA_MAP`: lines 116-136
- `collectIncome()` (mana collection): lines 748-792
- `getArcaneTowerMana()`: lines 2005-2008
- `castSpell()`: lines 1455-1541
- `castCombatSpell()`: lines 1547-1604
- `canCastSpell` getter: lines 623-640
- `playerKnownSpells` getter: lines 611-617
- `getSpellByName()`: lines 2013-2016
- `getSpellById()`: lines 2021-2024

### app.vue
- Magic button: lines 181-189
- Mana display in player panels: lines 134-146
- Magic panel modal: lines 653-747
- Combat spells section: lines 855-875
- Spell helper functions: lines 1095-1163

---

## Summary

### Passed ✅
- 7 mana types defined correctly
- Mana pool per player
- Land-to-mana mapping (100% verified against help.csv)
- Arcane Tower scaling formula (1→1, 2→3, 3→6, 4→10)
- Mana collection when passing Royal Court
- Basic spell casting framework
- Combat spell casting
- Spell learning from buildings
- Mana display in UI
- Magic panel UI

### Failed ❌
1. **Spell mana costs = 0** - Critical data corruption, most spells are free
2. **Spell power formula incorrect** - Should use power ratio, not flat bonus
3. **Spell level system NOT implemented** - Can't level up spells
4. **Buff spells NOT functional** - No buff tracking/duration system
5. **Summon spells NOT functional** - No companion system
6. **Spell learning at Library/Mage Guild** - Not implemented
7. **Scrolls don't teach spells** - Not implemented

### Partial ⚠️
- Mana colors: Air should be light blue (not yellow), Arcane should be golden (not purple)
- Some spell effectTypes are miscategorized in data

---

## Required Fixes

### Critical (Must Fix)

1. **Fix spell mana costs in spells.json**
   - Verify actual costs from original VBA code
   - All damage spells should cost mana (estimate: 2-5 based on power)
   - Utility spells should cost mana (estimate: 1-3)

2. **Implement power ratio damage formula**
   ```typescript
   // Current (wrong):
   const damage = spell.basePower + Math.floor(player.stats.power / 2)

   // Should be:
   const powerRatio = casterPower / targetPower
   const damage = Math.floor(spell.basePower * powerRatio * spellLevel)
   ```

### Important (Should Fix)

3. **Fix mana colors**
   - Air: Change from yellow (#facc15) to light blue (#38bdf8)
   - Arcane: Change from purple (#a855f7) to golden (#fbbf24)

4. **Fix spell effectTypes in data**
   - Pot of Gold: summon → utility
   - Summon Golem: utility → summon

### Deferred (Phase 7b)

5. **Buff spell system** - Needs buff tracking with duration
6. **Summon spell system** - Needs companion management
7. **Spell level system** - Needs spell XP or training mechanism
8. **Library/Mage Guild spell learning** - Needs shop-like spell purchase UI

---

## Verification Notes

### Verified Correctly
The core mana system is solid:
- Land-to-mana mappings match original exactly
- Arcane Tower scaling matches the help.csv formula exactly
- Mana collection timing (on Royal Court pass) is correct

### Needs VBA Research
- Exact mana costs for each spell
- Spell power formula (power ratio calculation)
- Spell level up mechanics
- Buff duration formulas

---

## Recommendation

Phase 7 **PARTIALLY COMPLETE**. The mana generation and collection system is correctly implemented and verified. However, the spell casting system has significant issues:

1. **Immediate:** Fix spell mana costs in spells.json (data corruption issue)
2. **Immediate:** Fix mana colors for Air and Arcane
3. **Before Phase 8:** Implement correct power ratio damage formula
4. **Deferred:** Buff/Summon systems can wait for Phase 7b

The game is playable but magic is currently overpowered (free spells) and underpowered (flat damage instead of scaling).
