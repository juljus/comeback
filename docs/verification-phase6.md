# Verification Report: Phase 6 (Buildings & Progression)

**Date:** 2026-01-31
**Verified by:** Verifier Developer
**Status:** PARTIAL PASS - Critical issues found

---

## Original Rules (from help.csv)

### Building System (lines 123-127, 167)

> "Kindluste rajamine muutub võimalikuks kui üks mängija on saanud kokku kõik sama tüüpi maad (ilmub „build" nupp). Kindluseid ja muid ehitisi on võimalik ehitada ükskõik millisel ruudul olles, sa ei pea ise olema samal ruudul kuhu ehitada tahad."

**Translation:** "Fortification building becomes possible when a player has collected all squares of the same land type (the 'build' button appears). Fortifications and other buildings can be built from any square, you don't need to be on the square where you want to build."

> "„Build" – nupp tekib, kui sul on koos kõik ühte tüüpi maad. Vajutades seda nuppu näed sa milliseid ehitisi on sul võimalik ehitada. Iga ehitise ülesehitamine võtab ühe tegevus-punkti, eeldusel muidugi, et vajalik kuld on olemas."

**Translation:** "Build button appears when you have all squares of one land type. Each building construction takes one action point, assuming you have the required gold."

### Fortifications (line 126)

> "Kindlustuste erinevaid astmeid on kolm: väikseim on kants (fort), keskmine on linnus (citadel), suurim on loss (castle). Kindlustuste ehitamine suurendab maa kaitsjate arvu."

**Translation:** "There are three levels of fortifications: smallest is fort (kants), middle is citadel (linnus), largest is castle (kindlus/loss). Building fortifications increases the number of land defenders."

### Titles (line 111)

> "Tiitleid on kolm. Parun (baron) - 3 maad, krahv (count) - 9 maad, hertsog (duke) – 15 maad."

**Translation:** "There are three titles. Baron - 3 lands, Count - 9 lands, Duke - 15 lands."

### King's Gift (line 109)

> "*Kink kuningalt (Kings gift). Iga tiitliga kaasneb ka kink kuningalt. Õieti on tegemist valikuga kolme erineva asja vahel. Vali hoolikalt, sellest võib mängus oleneda palju."

**Translation:** "King's Gift. Each title comes with a gift from the king. It's actually a choice between three different things. Choose carefully, this can matter a lot in the game."

### Training (line 160)

> "„Train_n_stat" – treenima. Selle nupu tekkides on sul võimalik treenida vastavat n-omadust. Võib olla nii stat kui ka loits. Millegi treenimiseks läheb reeglina terve päev (nõutav kõikide tegevus-punktide olemasolu)."

**Translation:** "Train - When this button appears, you can train a specific attribute. Can be either stat or spell. Training usually requires a whole day (all action points required)."

---

## Verification Results

### Building System

| Feature | Original Rule | Implementation | Status |
|---------|---------------|----------------|--------|
| Build requires ALL lands of type | "kõik sama tüüpi maad" | `completedLandTypes` getter (lines 446-472) | ✅ PASS |
| Can build from any square | "ükskõik millisel ruudul olles" | No position check in `buildOnLand` | ✅ PASS |
| Build = 1 action point | "ühe tegevus-punkti" | `consumeAction()` at line 1132 | ✅ PASS |
| Building cost (gold) | "vajalik kuld" | Gold check at line 1118 | ✅ PASS |
| Prerequisites checked | Implied by "ehitisi" | `getAvailableBuildingsForLand` checks prerequisites | ✅ PASS |
| **Building effects applied** | "lisavad erinevaid võimalusi" | **NOT IMPLEMENTED** | ❌ FAIL |

#### Critical Issue: Building Effects Not Applied

The `buildOnLand` function (lines 1107-1138) adds the building name to `square.buildings` array but does NOT:
- Grant spells from `grantsSpells` to the player
- Unlock mercenaries from `unlocksMercenaries`
- Apply any actual gameplay effect

This is a **CRITICAL** discrepancy - buildings are visual only, not functional.

### Fortifications

| Feature | Original Rule | Implementation | Status |
|---------|---------------|----------------|--------|
| Fort (Kants) | "väikseim on kants" | buildings.json ID 0, cost 200 | ✅ PASS |
| Citadel (Linnus) | "keskmine on linnus" | buildings.json ID 1, cost 150, requires Fort | ✅ PASS |
| Castle (Kindlus) | "suurim on loss" | buildings.json ID 2, cost 200, requires Citadel | ✅ PASS |
| Increases defenders | "suurendab maa kaitsjate arvu" | **NOT IMPLEMENTED** | ❌ FAIL |

### Title System

| Feature | Original Rule | Implementation | Status |
|---------|---------------|----------------|--------|
| Baron = 3 lands | "Parun - 3 maad" | `TITLE_THRESHOLDS.baron = 3` (line 96) | ✅ PASS |
| Count = 9 lands | "krahv - 9 maad" | `TITLE_THRESHOLDS.count = 9` (line 97) | ✅ PASS |
| Duke = 15 lands | "hertsog – 15 maad" | `TITLE_THRESHOLDS.duke = 15` (line 98) | ✅ PASS |
| Title promotion triggers | On land acquisition | `checkTitlePromotion()` called after buy/conquer | ✅ PASS |
| Title display | N/A | `getTitleDisplayName()` function | ✅ PASS |

### King's Gift

| Feature | Original Rule | Implementation | Status |
|---------|---------------|----------------|--------|
| Gift on promotion | "Iga tiitliga kaasneb" | `pendingKingsGift = true` on promotion | ✅ PASS |
| Choice of 3 options | "valikuga kolme erineva asja vahel" | ⚠️ PLACEHOLDER (gold only) | ⚠️ PARTIAL |
| Meaningful choices | "võib mängus oleneda palju" | ❌ Just gold amounts (100/150/200) | ❌ FAIL |

The King's Gift is acknowledged as placeholder in the code (line 395-396 in app.vue: "TODO: Real gift choices from original game").

### Training System

| Feature | Original Rule | Implementation | Status |
|---------|---------------|----------------|--------|
| Requires full day | "terve päev" | Check: `actionsRemaining !== 3 || actionPhase !== 'morning'` | ✅ PASS |
| Consumes all actions | "kõikide tegevus-punktide" | Calls `endTurn()` (line 1161) | ✅ PASS |
| Train STR/DEX | "stat" | `trainStat('strength' | 'dexterity')` | ✅ PASS |
| Train spells | "Võib olla... ka loits" | **NOT IMPLEMENTED** | ❌ FAIL |
| Training cost | Unverified | 50 gold (line 1153) - **UNVERIFIED** | ⚠️ UNKNOWN |
| Training location | "Training Grounds" | `TRAINING_GROUNDS_ID = 10` | ✅ PASS |

---

## Code Locations

### game.ts
- `TITLE_THRESHOLDS`: lines 95-99
- `Player.title` and `pendingKingsGift`: lines 145-146
- `BoardSquare.buildings`: line 163
- `completedLandTypes` getter: lines 446-472
- `canBuild` getter: lines 477-482
- `getAvailableBuildingsForLand` getter: lines 488-517
- `buildOnLand` action: lines 1107-1138
- `trainStat` action: lines 1145-1163
- `checkTitlePromotion` action: lines 1168-1192
- `acceptKingsGift` action: lines 1199-1209
- `getBuildingByName`: lines 1572-1575

### app.vue
- Build button: lines 174-180
- Build menu modal: lines 294-361
- King's Gift modal: lines 363-398
- Train button: lines 181-189
- Title display in player panel: lines 121-123

---

## Data Quality Issues

### buildings.json Corrupted Entry

Building ID 48 has corrupted data:
```json
{
  "id": 48,
  "name": { "en": "40", "et": "41" },
  "cost": 6,
  "prerequisites": ["2", "3", "4", "5"],
  "grantsSpells": ["9", "10"],
  "unlocksMercenaries": ["20", "21"]
}
```

This should be removed or fixed.

---

## Summary

### Passed ✅
- Building prerequisite system
- Building action cost (1 action point)
- Can build from any square
- Title thresholds (Baron: 3, Count: 9, Duke: 15)
- Title promotion detection
- Training requires full day
- Training location check

### Failed ❌
1. **Building effects NOT applied** - Critical: buildings don't grant spells or unlock mercenaries
2. **Fortifications don't increase defenders** - buildings have no gameplay impact
3. **King's Gift is placeholder** - just gold amounts, not real choices
4. **Training spells NOT supported** - only STR/DEX trainable

### Unverified ⚠️
- Training cost (50 gold) - needs VBA verification
- King's Gift actual options from original game

---

## Required Fixes

### Critical (Must Fix)
1. **Building effects**: When building is constructed, apply `grantsSpells` to player's known spells and `unlocksMercenaries` to available mercenaries
2. **Fortification defender count**: Track number of archers/defenders based on fortification level

### Important (Should Fix)
3. **King's Gift choices**: Research and implement actual gift options from original game
4. **Training spells**: Add ability to train spell levels at Library/Mage Guild

### Data Cleanup
5. **Remove corrupted building ID 48** from buildings.json

---

## Recommendations

Before marking Phase 6 as complete, the implementer should:

1. Add `knownSpells: string[]` to Player interface
2. Modify `buildOnLand` to call `grantSpellsFromBuilding(building)`
3. Add defender count tracking to BoardSquare
4. Research original VBA code for King's Gift options
5. Clean corrupted building data
