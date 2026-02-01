# Mobs.csv Column Analysis

## VBA Code References
- **File**: /Users/juljus/Projects/comeback/docs/extraction/vba/all_modules.txt
- **Key Function**: `Add_new_mob()` at line 10940
- **Key Loop**: Lines 10968-11043 (copies Mobs sheet to Side sheet during combat)
- **Mana Loop**: Lines 141-143 and 11041-11043

## Complete Column Mapping

### Core Stats (Columns 1-13)

| Col | CSV Name | Type | Purpose | VBA Reference |
|-----|----------|------|---------|---|
| 1 | name | String | Mob name | Line 10965 |
| 2 | hp | Integer | Current/Max HP (copied to both during init) | Line 10967-10969 |
| 3 | attacks_per_round | Integer | Number of attacks per combat round | Line 10971 |
| 4 | dice_count | Integer | Dice count for damage calculation | Line 10973 |
| 5 | dice_sides | Integer | Dice sides for damage calculation | Line 10975 |
| 6 | bonus_damage / damage_type | Integer | Bonus damage or damage type modifier | Line 10977 |
| 7 | strength | Integer | Strength stat | Line 10979, 10983 |
| 8 | dexterity | Integer | Dexterity stat | Line 10980, 10984 |
| 9 | power | Integer | Power/Wisdom stat | Line 10981, 10985 |
| 10 | col_9 (unknown) | Integer | Unknown - Not referenced in mapping, possibly reserved | - |
| 11 | armor | Integer | Armor value | Line 10987 |
| 12 | col_11 (AI flag 1) | Integer | AI behavior flag 1 | Line 10995 |
| 13 | col_12 (AI flag 2) | Integer | AI behavior flag 2 | Line 10996 |
| 14 | col_13 (AI flag 3) | Integer | AI behavior flag 3 - NOTES: Maps to Side col 34 | Line 10996 (col 13 in Mobs) |

### Reserved/Gap Columns (Columns 14-15)

| Col | CSV Name | Type | Purpose | VBA Reference |
|-----|----------|------|---------|---|
| 14 | col_14 | Unknown | Not referenced in initialization; possibly unused | - |
| 15 | col_15 | Unknown | Not referenced in initialization; possibly unused | - |

### Mana Columns (Columns 16-29)

These 14 columns represent mana and mana regeneration for 7 mana types:
- Fire, Earth, Water, Air, Life, Death, Arcane

**Structure** (derived from loop at lines 11041-11043 and line 141):
```
Columns 16-29 are copied directly from Mobs to Side during combat initialization
For x = 16 To 29 'mana + manaregen
    Sheets("Side" & what_side).Cells(mitmes_tabelis, x).Value = Sheets("Mobs").Cells(mob, x).Value
Next
```

**Likely distribution** (based on 7 mana types):
- Columns 16-22: Mana values for 7 mana types (Fire, Earth, Water, Air, Life, Death, Arcane)
- Columns 23-29: Mana regeneration for 7 mana types

| Col | CSV Name | Type | Inferred Purpose |
|-----|----------|------|---|
| 16 | col_16 | Integer | Fire mana value |
| 17 | col_17 | Integer | Earth mana value |
| 18 | col_18 | Integer | Water mana value |
| 19 | col_19 | Integer | Air mana value |
| 20 | col_20 | Integer | Life mana value |
| 21 | col_21 | Integer | Death mana value |
| 22 | col_22 | Integer | Arcane mana value |
| 23 | col_23 | Integer | Fire mana regeneration |
| 24 | col_24 | Integer | Earth mana regeneration |
| 25 | col_25 | Integer | Water mana regeneration |
| 26 | col_26 | Integer | Air mana regeneration |
| 27 | col_27 | Integer | Life mana regeneration |
| 28 | col_28 | Integer | Death mana regeneration |
| 29 | col_29 | Integer | Arcane mana regeneration |

### Mercenary & Spell Columns (Columns 30-36)

| Col | CSV Name | Type | Purpose | VBA Reference |
|-----|----------|------|---------|---|
| 30 | merc_tier | Integer | Mercenary tier level (determines hire cost multiplier) | Line 10990 |
| 31 | col_31 | Unknown | Not directly referenced in mapping code shown | - |
| 32 | spell_1 | Integer | First spell ID/name | Line 11001 |
| 33 | spell_2 | Integer | Second spell ID/name | Line 11002 |
| 34 | spell_3 | Integer | Third spell ID/name | Line 11003 |
| 35 | spell_4 | Integer | Fourth spell ID/name | Line 11004 |
| 36 | col_36 | Unknown | Probably spell-related, not directly referenced | Line 11005 |

### Wall/Location Flag (Column 37-39)

| Col | CSV Name | Type | Purpose | VBA Reference |
|-----|----------|------|---------|---|
| 37 | col_37 | Unknown | Not directly mapped in loop; may be unused | - |
| 38 | col_38 (behind_wall) | Integer | Wall/cover status flag (0=not behind wall, 1=behind wall) | Lines 11045-11049 |
| 39 | col_39 | Unknown | Not directly mapped in loop; possibly reserved | - |

### Spell Effects & Extra Damage (Columns 40-44)

| Col | CSV Name | Type | Purpose | VBA Reference |
|-----|----------|------|---------|---|
| 40 | elemental_fire | Integer | Fire element damage multiplier | Line 11009 |
| 41 | elemental_earth | Integer | Earth element damage multiplier | Line 11013 |
| 42 | elemental_air | Integer | Air element damage multiplier | Line 11014 |
| 43 | elemental_water | Integer | Water element damage multiplier | Line 11015 |
| 44 | col_44 | Integer | Unknown extra damage (possibly bleeding or status effect) | Line 11016 |

### Immunities & Resistances (Columns 45-50)

| Col | CSV Name | Type | Purpose | VBA Reference |
|-----|----------|------|---------|---|
| 45 | col_45 | Integer | Fire immunity/resistance | Line 11026 |
| 46 | col_46 | Integer | Lightning immunity/resistance | Line 11028 |
| 47 | col_47 | Integer | Cold immunity/resistance | Line 11029 |
| 48 | col_48 | Integer | Poison immunity/resistance | Line 11027 |
| 49 | col_49 | Integer | Unknown immunity type (possibly life/death) | Line 11030 |
| 50 | col_50 | Integer | Unknown immunity type (possibly arcane) | Line 11031 |

### Pet/Evolution & Spell Level (Columns 51-59)

| Col | CSV Name | Type | Purpose | VBA Reference |
|-----|----------|------|---------|---|
| 51 | levelup_into | String | Pet evolution or mob upgrade chain name | Lines 11035, 443-445 |
| 52 | col_52 | Integer | Pet evolution type flag (1=evolution, 2 or 6=special form) | Lines 13918, 13922 |
| 53 | col_53 | Integer | Spell level bonus (added to spell casting levels) | Line 11038 |
| 54 | col_54 | Unknown | Not referenced in mapping; possibly unused | - |
| 55 | col_55 | Unknown | Not referenced in mapping; possibly unused | - |
| 56 | col_56 | Unknown | Not referenced in mapping; possibly unused | - |
| 57 | col_57 | Unknown | Not referenced in mapping; possibly unused | - |
| 58 | col_58 | Unknown | Not referenced in mapping; possibly unused | - |
| 59 | name_en | String | English name (language translation) | Lines 363, 386, 392, 428, 442 |

### Additional Columns (Beyond CSV standard)

| Col | Type | Purpose | VBA Reference |
|-----|------|---------|---|
| 60-64 | Integer | Combat statistics (not directly from Mobs table during initial copy) | Various |
| 66 | Integer | Pet-related stats | Line 11035 |
| 68 | Integer | Spell level extra/bonus | Line 11038 |

---

## Summary of Unknown/Unclear Columns

### From Your Original Request:

1. **Column 10 (CSV, VBA col 11)**: `col_9` - **Not referenced in mapping code**
   - Status: Appears to be unused or reserved space
   - Located between power (col 9) and armor (col 11)

2. **Columns 14-15 (CSV, VBA cols 15-16)**: `col_14`, `col_15`
   - Status: Not referenced in mapping code
   - Located between AI flags (cols 11-13) and mana (cols 16-29)

3. **Columns 37-39 (CSV, VBA cols 38-40)**: `col_37`, `col_38`, `col_39`
   - Status: Col 38 is **behind_wall** flag (see lines 11045-11049)
   - Cols 37 and 39: Not referenced in direct mapping

4. **Columns 44-50 (CSV, VBA cols 45-51)**: `col_44` through `col_50`
   - Status: All are elemental damage/immunity related
   - Col 45 = Fire immunity (confirmed by comment at line 11026)
   - Col 46 = Lightning immunity (confirmed by comment at line 11028)
   - Col 47 = Cold immunity (confirmed by comment at line 11029)
   - Col 48 = Poison immunity (confirmed by comment at line 11027)
   - Cols 49-50 = Unknown immunity types (possibly Life/Death and Arcane)

5. **Columns 52-58 (CSV, VBA cols 53-59)**: `col_52` through `col_58`
   - Col 52 = Pet evolution type flag (see lines 13918, 13922)
   - Col 53 = Spell level bonus (see line 11038)
   - Cols 54-58 = Not referenced; possibly unused

---

## Key Code Sections

### Main Mapping Function (Add_new_mob)
**Location**: Lines 10940-11065
**Purpose**: Copies mob stats from Mobs sheet to Side sheet during combat initialization

**Critical Loop for Mana**:
```vba
For x = 16 To 29 'mana + manaregen
    Sheets("Side" & what_side).Cells(mitmes_tabelis, x).Value = Sheets("Mobs").Cells(mob, x).Value
Next
```

**Behind Wall Logic**:
```vba
If behind_Wall = 0 Then
    Sheets("Side" & what_side).Cells(mitmes_tabelis, 38).Value = 0
Else
    Sheets("Side" & what_side).Cells(mitmes_tabelis, 38).Value = 1
End If
```

**Elemental Immunities** (lines 11026-11031):
- Fire immunity: Mobs col 45 → Side col 59
- Poison immunity: Mobs col 48 → Side col 60
- Lightning immunity: Mobs col 46 → Side col 61
- Cold immunity: Mobs col 47 → Side col 62
- Unknown (col 49) → Side col 63
- Unknown (col 50) → Side col 64

### Spell-to-Name Translation (Lines 435-440)
Shows that Mobs columns 32-35 contain spell names that get converted to spell IDs

### Pet Evolution Logic (Lines 443-445)
Shows that Mobs col 51 contains evolution/levelup chain names

### Pet Type Check (Lines 13918-13924)
Shows that Mobs col 52 determines pet evolution behavior
