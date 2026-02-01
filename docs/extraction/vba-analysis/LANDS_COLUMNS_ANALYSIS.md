# Complete Lands.csv Column Analysis

**File**: `/Users/juljus/Projects/comeback/docs/extraction/raw/lands.csv`
**Source Sheet**: `Map_defaults` (VBA)
**Rows**: 42 entries (1 header + 1 utility lands + 21 territory lands + others)

---

## Column Mapping (CSV vs VBA)

CSV uses 0-based indexing, VBA uses 1-based indexing:
- CSV Column N = VBA Column N+1

---

## Complete Column Definitions

| CSV Col | VBA Col | Current CSV Header | Status | Type | Description |
|---------|---------|-------------------|--------|------|-------------|
| 0 | 1 | name_short | ✓ | string | Short display name (current language) |
| 1 | 2 | name_long | ✓ | string | Full display name (current language) |
| 2 | 3 | price | ✓ | int | Purchase price in gold (1000 = unpurchasable utility land) |
| 3 | 4 | tax_income | ✓ | int | Gold income per turn when owned |
| 4 | 5 | healing | ✓ | int | HP restored when player rests on this land |
| 5 | 6 | col_5 | ✗ | *unknown* | **EMPTY - Never used** |
| 6 | 7 | col_6 | ✗ | *unknown* | **EMPTY - Never used** |
| 7 | 8 | col_7 | ✗ | *unknown* | **EMPTY - Never used** |
| 8 | 9 | defender_1 | ✓ | string | Tier 1 defender (mob name) - weakest |
| 9 | 10 | defender_2 | ✓ | string | Tier 2 defender (mob name) |
| 10 | 11 | defender_3 | ✓ | string | Tier 3 defender (mob name) |
| 11 | 12 | defender_4 | ✓ | string | Tier 4 defender (mob name) - strongest |
| 12 | 13 | spawn_chance | ✓ | int | Percentage chance to appear on randomly generated map (0-100) |
| 13 | 14 | building_1 | ✓ | string | Available building slot 1 (building name) |
| 14 | 15 | building_2 | ✓ | string | Available building slot 2 |
| 15 | 16 | building_3 | ✓ | string | Available building slot 3 |
| 16 | 17 | building_4 | ✓ | string | Available building slot 4 |
| 17 | 18 | building_5 | ✓ | string | Available building slot 5 |
| 18 | 19 | building_6 | ✓ | string | Available building slot 6 |
| 19 | 20 | building_7 | ✓ | string | Available building slot 7 |
| 20 | 21 | building_8 | ✓ | string | Available building slot 8 |
| 21 | 22 | building_9 | ✓ | string | Available building slot 9 |
| 22 | 23 | building_10 | ✓ | string | Available building slot 10 |
| 23 | 24 | building_11 | ✓ | string | Available building slot 11 |
| 24 | 25 | building_12 | ✓ | string | Available building slot 12 |
| 25 | 26 | col_25 | **CORRECTED** | string | **MANA TYPE** - Type of mana this land produces |
| 26 | 27 | col_26 | ✗ | *unused* | **UNUSED - Reserved for mana building (always empty)** |
| 27 | 28 | name_short_en | ✓ | string | English short name |
| 28 | 29 | name_long_en | ✓ | string | English full name |
| 29 | 30 | name_short_et | ✓ | string | Estonian short name |
| 30 | 31 | name_long_et | ✓ | string | Estonian full name |
| 31 | 32 | col_31 | ✗ | *unknown* | **EMPTY - Never used** |
| 32 | 33 | col_32 | ✗ | *unknown* | **EMPTY - Never used** |
| 33 | 34 | col_33 | ✗ | *unknown* | **EMPTY - Never used** |

---

## VBA Code References

### Column 5 (Healing) - VBA Lines 740-741
```vba
'healing value
Sheets("Game_map").Cells(x, 11).Value = Sheets("Map_defaults").Cells(Land_type, 5).Value
Sheets("Game_map").Cells(x, 16).Value = Sheets("Map_defaults").Cells(Land_type, 5).Value
```
**Usage**: Copied to Game_map columns 11 and 16 during map initialization.

### Columns 6-7 (Unused Utility Columns) - VBA Line 736-737
```vba
'päevane tax
Sheets("Game_map").Cells(x, 6).Value = Sheets("Map_defaults").Cells(Land_type, 4).Value * 5
Sheets("Game_map").Cells(x, 7).Value = Sheets("Map_defaults").Cells(Land_type, 4).Value * 5
```
**Usage**: Game_map columns 6-7 are populated from Map_defaults column 4 (tax_income), NOT from columns 6-7. Columns 6-7 of Map_defaults are never referenced and always empty.

### Columns 9-12 (Defenders) - VBA Lines 727, 733
```vba
'kaitsja
bonus = 0
If mitu_basicut_reas = 3 Then
    bonus = Int(Rnd * 2)
    Sheets("Game_map").Cells(x - 1, 5).Value = find_mob_by_name(Sheets("Map_defaults").Cells(Land_type, 9 + bonus).Value)
    bonus = 0
End If

'kaitsja
Sheets("Game_map").Cells(x, 5).Value = find_mob_by_name(Sheets("Map_defaults").Cells(Land_type, 9 + bonus).Value)
```
**Usage**: VBA columns 9-12 (with bonus randomizing between 0-1) to select defender mobs. Converted via `find_mob_by_name()` to mob IDs.

### Column 13 (Spawn Chance) - VBA Various
Referenced in map generation logic to determine random appearance frequency.

### Columns 14-25 (Buildings 1-12) - VBA Lines 367-369, 16606-16633
```vba
For y = 1 To 12
    If Sheets("Map_defaults").Cells(x, 13 + y).Value <> "" Then
        temp_name = Sheets("Map_defaults").Cells(x, 13 + y).Value
        Sheets("Map_defaults").Cells(x, 13 + y).Value = Sheets("Buildings").Cells(find_building_by_name(temp_name), 39 + Language).Value
    End If
Next
```
**Usage**: VBA columns 14-25 (13+1 through 13+12) store building names. Loop converts them to localized display names. Also used to list buildable structures in build menu (VBA lines 16608-16633).

### Column 26 (MANA TYPE) - VBA Line 743-744
```vba
'mana building
If Sheets("Map_defaults").Cells(Land_type, 26).Value <> "" Then
    Sheets("Game_map").Cells(x, find_building_slot_in_map(Sheets("Map_defaults").Cells(Land_type, 26).Value)).Value = 1
End If
```
**Usage**: Stores mana building name for territory lands (Fire mana, Water mana, etc.). If not empty, places the building in the appropriate slot on Game_map. **Currently all values in CSV column 26 are "mana type names" like "Life mana", not building names.**

### Column 27 (Unused/Reserved) - Never Referenced
**Usage**: Reserved for mana building, but always empty in actual data.

### Columns 28-31 (Localized Names) - VBA Lines 359-360
```vba
'landinimed
For x = 2 To Sheets("Game_data1").Cells(173, 2).Value + 20
    Sheets("Map_defaults").Cells(x, 1).Value = Sheets("Map_defaults").Cells(x, 28 + (Language - 1) * 2).Value
    Sheets("Map_defaults").Cells(x, 2).Value = Sheets("Map_defaults").Cells(x, 29 + (Language - 1) * 2).Value
Next
```
**Usage**: VBA columns 28-31 store English and Estonian versions of names. During init, the current language versions are copied to columns 1-2. Formula uses `28 + (Language - 1) * 2`:
- Language 1 (English): columns 28-29
- Language 2 (Estonian): columns 30-31

### Columns 32-34 (Unused) - Never Referenced
**Usage**: Empty, never used in VBA code.

---

## Mana Type Mapping

VBA Column 26 (CSV Column 25) contains mana type as **string names**:

| Mana Type String | Used By | Territory Lands |
|------------------|---------|-----------------|
| "Fire mana" | Spells requiring fire mana | Hill, Mountain |
| "Earth mana" | Spells requiring earth mana | Forest, Brushland |
| "Air mana" | Spells requiring air mana | Desert, Rocks |
| "Water mana" | Spells requiring water mana | Jungle, Iceland |
| "Life mana" | Spells requiring life mana | Valley, Plain, Org |
| "Death mana" | Spells requiring death mana | Swamp, Dark Forest |
| "Arcane mana" | Spells requiring arcane mana | (no territory produces this) |
| (empty) | Utility lands | Shop, Smithy, Library, Shrine, etc. |

**VBA Reference** (VBA lines 1058-1064, 3687-3693, 7527-7533):
```vba
If Sheets("Game_map").Cells(35, 17 + y).Value = "Fire mana" _
Or Sheets("Game_map").Cells(35, 17 + y).Value = "Earth mana" _
Or Sheets("Game_map").Cells(35, 17 + y).Value = "Water mana" _
...
```

---

## Investigation Conclusions

### Unknown Columns 5-7 (CSV) / 6-8 (VBA)
**STATUS**: Definitely unused/empty
- Never written to by any VBA code
- Never read by any VBA code
- Always empty in all 42 data rows
- **VERDICT**: Reserved columns, likely for future use or legacy features

### Column 25 (CSV) / 26 (VBA) - "Buildings without castle" flag?
**ACTUAL MEANING**: **MANA TYPE** (Fire mana, Water mana, etc.)
- **NOT** a flag at all, but a string identifier
- Determines which spells can be cast on the land
- All values are either empty (utility lands) or mana type names
- **VERDICT**: Previous documentation was incorrect. This is the mana production type.

### Column 26 (CSV) / 27 (VBA)
**ACTUAL MEANING**: **Unused/Reserved (for mana buildings)**
- Code at VBA line 743 expects this to contain a building name
- Building would be placed on lands that produce mana
- Always empty in actual data
- **VERDICT**: Feature not implemented - all lands get mana buildings through a different mechanism

### Columns 31-33 (CSV) / 32-34 (VBA)
**STATUS**: Completely unused
- Never referenced in VBA code
- Always empty in data
- **VERDICT**: Reserved columns, never used

---

## Summary Table for Unknown Columns

| Original Task | CSV Col | VBA Col | Finding | Status |
|---------------|---------|---------|---------|--------|
| Columns 5-7 unknown | 5-7 | 6-8 | Reserved/unused columns - always empty | ✓ Investigated |
| Column 25 "castle flag"? | 25 | 26 | **Mana type** (Fire mana, Water mana, etc.) | ✓ **Corrected** |
| Column 26 unknown | 26 | 27 | Reserved for mana buildings - always empty | ✓ Investigated |
| Columns 31-33 unknown | 31-33 | 32-34 | Reserved/unused columns - always empty | ✓ Investigated |

---

## Recommended CSV Header Corrections

Current headers are misleading. Recommended changes:

```
col_5              → reserved_5              (always empty)
col_6              → reserved_6              (always empty)
col_7              → reserved_7              (always empty)
col_25             → mana_type               (Fire mana, Water mana, Life mana, etc.)
col_26             → reserved_mana_building  (always empty, reserved for mana building)
col_31             → reserved_31             (always empty)
col_32             → reserved_32             (always empty)
col_33             → reserved_33             (always empty)
```

