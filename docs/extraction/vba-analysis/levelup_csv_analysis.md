# LevelUp.CSV Column Analysis

## Overview
The `levelup.csv` file contains pet/summon evolution data. When a creature evolves, the VBA code in `level_up_mob()` function (lines 13520-13637) applies stat bonuses and learns new spells.

**Key Reference:**
- Function: `level_up_mob()` at lines 13520-13637 in `/Users/juljus/Projects/comeback/docs/extraction/vba/all_modules.txt`
- Mobs sheet initialization: `Add_new_mob()` at lines 10940-11065
- Evolution mechanics demonstrated around lines 13539-13607

---

## Complete Column Mapping

### Columns 1-2: Basic Info
| Col # | CSV Name | VBA Col | Description | Notes |
|-------|----------|---------|-------------|-------|
| 1 | name | 1 | Creature name (post-evolution) | Used in display and lookups |
| 2 | hp_bonus | 2 | HP increase on evolution | Added to both current and max HP (lines 13604-13605) |

### Columns 3-10: Base Stat Changes (Stats without Modifiers)
| Col # | CSV Name | VBA Col | Description | Notes |
|-------|----------|---------|-------------|-------|
| 3 | col_2 | 3 | Extra attacks bonus | Added to number of attacks per round (line 13539) |
| 4 | col_3 | 4 | Damage dice 1 (d1) bonus | Bonus to min damage roll (line 13542) |
| 5 | col_4 | 5 | Damage dice 2 (d2) bonus | Bonus to max damage roll (line 13543) |
| 6 | col_5 | 6 | Damage type | If non-zero, replaces damage type (line 13546) |
| 7 | col_6 | 7 | Strength (STR) bonus | Base stat change (line 13549) |
| 8 | col_7 | 8 | Dexterity (DEX) bonus | Base stat change (line 13550) |
| 9 | col_8 | 9 | Power (POW) bonus | Base stat change (line 13551) |
| 10 | col_9 | 10 | Armor/Defense bonus | Added to armor stat (line 13557) |

### Columns 11-20: Modified Stat Changes (Stats with Modifiers) + Mana Regen
| Col # | CSV Name | VBA Col | Description | Notes |
|-------|----------|---------|-------------|-------|
| 11 | col_10 | 11 | Modified STR bonus | Applies to modified STR (line 13553) |
| 12 | col_11 | 12 | Modified DEX bonus | Applies to modified DEX (line 13554) |
| 13 | col_12 | 13 | Modified POW bonus | Applies to modified POW (line 13555) |
| 14 | col_13 | 14 | ???Relative STR (unused) | Comment: "relative str ei tehta moment midagi" (line 13559) - not currently used |
| 15 | col_14 | 15 | Mana pool Fire | Mana capacity for Fire element |
| 16 | col_15 | 16 | Mana pool Lightning | Mana capacity for Lightning element |
| 17 | col_16 | 17 | Mana pool Cold | Mana capacity for Cold element |
| 18 | col_17 | 18 | Mana pool Poison | Mana capacity for Poison element |
| 19 | col_18 | 19 | Mana pool Life | Mana capacity for Life element |
| 20 | col_19 | 20 | Mana pool Death | Mana capacity for Death element |
| 21 | col_20 | 21 | Mana pool Arcane | Mana capacity for Arcane element |

### Columns 22-25: Spell Learning
| Col # | CSV Name | VBA Col | Description | Notes |
|-------|----------|---------|-------------|-------|
| 22 | learns_spell_1 | 21 | Number of spells to learn | Loop counter (line 13577) |
| 23 | learns_spell_2 | 22 | First spell learned | Spell ID or name (line 13581, 13593) |
| 24 | learns_spell_3 | 23 | Second spell learned | Spell ID or name |
| 25 | learns_spell_4 | 24 | Third/Fourth spell learned | Spell ID or name |

### Columns 26-46: Spell Learning Power/Bonus + Elemental Damage Bonuses
| Col # | CSV Name | VBA Col | Description | Notes |
|-------|----------|---------|-------------|-------|
| 26-29 | col_25 to col_28 | 25-28 | **Spell power bonuses** | Loop: `For x=1 To 4`, indexed as `Levelup.Cells(into_what, 24+x)` (line 13583, 13594) - power levels for learned spells |
| 30 | col_29 | 29 | **Fire damage bonus** | Added to Fire extra damage (line 13568, x=1) |
| 31 | col_30 | 30 | **Lightning damage bonus** | Added to Lightning extra damage (line 13568, x=2) |
| 32 | col_31 | 31 | **Cold damage bonus** | Added to Cold extra damage (line 13568, x=3) |
| 33 | col_32 | 32 | **Poison damage bonus** | Added to Poison extra damage (line 13568, x=4) |
| 34 | col_33 | 33 | **Fire resistance bonus** | Resistance/immunity to Fire (line 13573, x=1) |
| 35 | col_34 | 34 | **Lightning resistance bonus** | Resistance/immunity to Lightning (line 13573, x=2) |
| 36 | col_35 | 35 | **Cold resistance bonus** | Resistance/immunity to Cold (line 13573, x=3) |
| 37 | col_36 | 36 | **Poison resistance bonus** | Resistance/immunity to Poison (line 13573, x=4) |
| 38 | col_37 | 37 | **Bleeding resistance bonus** | Resistance to Bleeding (line 13573, x=5) |
| 39 | col_38 | 38 | **Stun resistance bonus** | Resistance to Stun (line 13573, x=6) |
| 40-46 | col_39 to col_45 | 39-45 | **[UNUSED]** | Empty/unused columns in current evolution system |

### Columns 47-51: Evolution Chain & Metadata
| Col # | CSV Name | VBA Col | Description | Notes |
|-------|----------|---------|-------------|-------|
| 47 | col_46 | 46 | Previous evolution | Typically 0 or name of previous form (used in lookups) |
| 48 | evolves_into | 47 | Next evolution target | Name of creature to evolve into (line 13607) |
| 49 | col_48 | 48 | **Evolution requirement/Pet type** | Currently being investigated - likely pet designation (lines 13918-13922 check `Mobs.Cells(pet_nr, 52)`) |
| 50 | name_en | 49 | English name override | Language localization (ID 49 + Language variable) |
| 51 | name_et | 50 | Estonian name override | Language localization (ID 49 + Language variable) |

---

## Stat Application Logic During Evolution

### Direct Stat Replacements
- **HP** (Col 2): Adds to both current and max HP (lines 13604-13605)
- **Extra Attacks** (Col 3): Adds to number of attacks/round (line 13539)
- **Damage Dice** (Cols 4-5): Adds to min/max damage rolls (lines 13542-13543)
- **Damage Type** (Col 6): If non-zero, **replaces** damage type entirely (line 13546)

### Stat Modifications Loop (Lines 13549-13555)
Uses `add_stat()` function which intelligently updates both base and modified stats:
- **Base STR** (Col 7): Adds to Side column 8 AND modified version at column 11 (lines 13549, 13553)
- **Base DEX** (Col 8): Adds to Side column 9 AND modified version at column 12 (lines 13550, 13554)
- **Base POW** (Col 9): Adds to Side column 10 AND modified version at column 13 (lines 13551, 13555)

### Armor/Defense (Col 10, Line 13557)
- Uses `add_stat()` to add to armor stat at Side column 14

### Mana Regeneration (Cols 15-21, Lines 13563)
- **Loop:** `For x = 1 To 7`
- **Formula:** `Levelup.Cells(into_what, 11+x) → Side columns 22+x`
- **Mapping:**
  - Col 15 (LU:15) → Fire mana regen (Side:29)
  - Col 16 (LU:16) → Lightning mana regen (Side:30)
  - Col 17 (LU:17) → Cold mana regen (Side:31)
  - Col 18 (LU:18) → Poison mana regen (Side:32)
  - Col 19 (LU:19) → Life mana regen (Side:33)
  - Col 20 (LU:20) → Death mana regen (Side:34)
  - Col 21 (LU:21) → Arcane mana regen (Side:35)

### Spell Learning (Cols 22-29, Lines 13577-13599)
- **Col 22:** Number of spells to learn (loop counter, 0-4 typically)
- **Cols 23-26:** Spell IDs/names to teach (indices 21, 22, 23, 24 in VBA)
- **Cols 27-30:** Power level for each spell (indices 25-28 in VBA, added to spell knowledge level)
- **Behavior:**
  - If creature already knows spell, power is added to existing knowledge level (line 13583)
  - If new spell, added to next available slot (max 4 spells) with associated power (line 13593-13594)

### Elemental Damage Bonuses (Cols 30-33, Lines 13568)
- **Loop:** `For x = 1 To 4`
- **Formula:** `Levelup.Cells(into_what, 28+x) → Side columns 49+x`
- **Mapping:**
  - Col 30 (LU:30, x=1) → Fire damage bonus (Side:50)
  - Col 31 (LU:31, x=2) → Lightning damage bonus (Side:51)
  - Col 32 (LU:32, x=3) → Cold damage bonus (Side:52)
  - Col 33 (LU:33, x=4) → Poison damage bonus (Side:53)

### Elemental Resistance Bonuses (Cols 34-39, Lines 13573)
- **Loop:** `For x = 1 To 6`
- **Formula:** `Levelup.Cells(into_what, 32+x) → Side columns 58+x`
- **Mapping:**
  - Col 34 (LU:34, x=1) → Fire resistance (Side:59)
  - Col 35 (LU:35, x=2) → Lightning resistance (Side:60)
  - Col 36 (LU:36, x=3) → Cold resistance (Side:61)
  - Col 37 (LU:37, x=4) → Poison resistance (Side:62)
  - Col 38 (LU:38, x=5) → Bleeding resistance (Side:63)
  - Col 39 (LU:39, x=6) → Stun resistance (Side:64)

### Evolution Chain (Col 48, Line 13607)
- Sets the next evolution target: `Side.Cells(mob, 66) = Levelup.Cells(into_what, 47)`
- This creature will evolve into whatever is specified in this column

---

## Known Issues & Anomalies

1. **Col 14 (Relative STR)** - Marked as unused in code (line 13559): "relative str ei tehta moment midagi"
2. **Cols 40-46 (Empty slots)** - Currently unused in evolution calculations
3. **Col 49 (Col 48 in CSV)** - Purpose unclear from evolution code alone; appears related to pet type designation based on Mobs sheet reference (lines 13918-13922)
4. **Spell Power Loop** - Uses indices 24+x for Levelup columns 25-28, which corresponds to CSV columns 26-29

---

## References to VBA Code

| Aspect | VBA Line(s) | Function |
|--------|-------------|----------|
| Full Evolution Function | 13520-13637 | `level_up_mob()` |
| HP Application | 13604-13605 | Direct addition |
| Extra Attacks | 13539 | Direct addition |
| Damage Dice | 13542-13543 | Direct addition |
| Damage Type | 13546 | Replacement (if non-zero) |
| STR/DEX/POW Changes | 13549-13555 | `add_stat()` function |
| Armor Bonus | 13557 | `add_stat()` function |
| Mana Regen Loop | 13563 | Loop x=1 to 7 |
| Spell Learning | 13577-13599 | Complex loop with spell slot management |
| Elemental Damage | 13568 | Loop x=1 to 4 |
| Elemental Resistance | 13573 | Loop x=1 to 6 |
| Evolution Target | 13607 | Direct assignment |
| Add_stat Function | 2611-2690+ | Intelligent stat modifier |
| Mob Creation | 10940-11065 | `Add_new_mob()` |

---

## Summary of Unknown Columns

### Originally Unknown - Now Identified
- **Cols 2-20 (VBA 3-21):** Stat changes on evolution (HP, attacks, damage, STR, DEX, POW, armor, mana regen)
- **Col 48 (VBA 49):** Further investigation needed - appears to be pet/summon type flag

### Columns 25-46 (VBA 26-47)
- **Cols 25-28 (VBA 26-29):** Spell learning power bonuses (4 spells max)
- **Cols 29-33 (VBA 30-34):** Elemental damage bonuses (Fire, Lightning, Cold, Poison)
- **Cols 34-39 (VBA 35-40):** Elemental/status resistances (Fire, Lightning, Cold, Poison, Bleeding, Stun)
- **Cols 40-46 (VBA 41-47):** Currently unused/empty slots

### Evolution-Related
- **Col 48 (VBA 49):** Next evolution target name (evolves_into)
