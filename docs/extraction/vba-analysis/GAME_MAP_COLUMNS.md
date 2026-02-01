# Game_map Column Structure (Runtime Board State)

This document describes the complete structure of the `Game_map` sheet in the VBA application, which represents the runtime state of the game board.

## Overview

The `Game_map` sheet has 34 rows of data (one per game tile/land) plus special rows:
- **Rows 1-34**: Individual land/tile data
- **Row 35**: Header/reference row containing building names (columns 17+) and mana type names (columns 47+)

---

## Column Reference

### Core Land Information

| Column | VBA Col | Name | Description | Example Values | VBA Reference |
|--------|---------|------|-------------|-----------------|---|
| 1 | 1 | `land_type_id` | Type of land (terrain type) | 1-20 (basic lands), 21+ (custom) | Line 715 |
| 2 | 2 | `owner` | Player who owns the land (0 = neutral) | 0-4 (player numbers) | Line 287 |
| 3 | 3 | `price` | Purchase price of the land | Integer (gold amount) | Line 718 |
| 4 | 4 | `name` | Name of the land location | String (land name) | Line 721 |
| 5 | 5 | `defender_id` | Mob/creature defending the land | Mob ID from Mobs sheet | Line 733 |
| 6 | 6 | `tax_income` | Current accumulated tax income | Integer (gold amount) | Line 2035, 17088 |
| 7 | 7 | `healing` | Healing power provided to units | Integer (healing value) | Line 737, 2092 |
| 8 | 8 | `x_coordinate` | X position on the game board display | Integer (row position) | Line 7467 |
| 9 | 9 | `y_coordinate` | Y position on the game board display | Integer (column position) | Line 7467 |

### Mana/Fortification System

| Column | VBA Col | Name | Description | Values | VBA Reference |
|--------|---------|------|-------------|--------|---|
| 10 | 10 | *(UNUSED)* | Not used in runtime board state | - | - |
| 11 | 11 | `healing_max` | Maximum healing value (base + buildings) | Integer | Line 740, 2090 |
| 12 | 12 | `castle_level` | Castle fortification level | 0-3 (0=none, 1-3=levels) | Line 1643, 17076 |
| 13 | 13 | `castle_defender` | Mob type for castle defense | Mob ID from Mobs sheet | Line 17080 |
| 14 | 14 | `archery_slots` | Number of archer/ranged unit slots | Integer | Line 17084 |
| 15 | 15 | `gate_level` | Gate fortification level | Integer (gates value) | Line 17098 |
| 16 | 16 | `mana_max` | Maximum mana amount (base + buildings) | Integer | Line 741, 3385 |

### Defense & Status

| Column | VBA Col | Name | Description | Values | VBA Reference |
|--------|---------|------|-------------|--------|---|
| 17 | 17 | `has_defender` | Flag: whether land has an active defender | 0 or 1 | Line 293, 4082 |

### Building Slots

| Column | VBA Col | Name | Description | Values | VBA Reference |
|--------|---------|------|-------------|--------|---|
| 18-44 | 18-44 | `building_slot_[1-27]` | Individual building status slots | 0 or 1 (present/absent) | Line 744, 17076 |

**Building Slots Logic:**
- Each building occupies one column (18-44)
- Value = 1 means the building is present on this land
- Value = 0 means the building is not present
- Building names are stored in row 35, columns 17+ (maps to building slot columns)
- Function `find_building_slot_in_map()` (line 16777) maps building names to column numbers: `return 17 + y`
- Buildings are referenced from the `Buildings` sheet

**Example:**
- If `Game_map.Cells(35, 18).Value = "Barracks"` and `Game_map.Cells(x, 18).Value = 1`, the land has a Barracks
- Buildings are queried by: checking if `Game_map.Cells(x, find_building_slot_in_map("Barracks")).Value = 1`

**VBA References:**
- Line 17076-17115: Building properties mapped to columns
- Line 16777: Function that maps building names to slot columns
- Line 744, 3592-3594: Building slot checking logic

### Recruitment System

| Column | VBA Col | Name | Description | Values | VBA Reference |
|--------|---------|------|-------------|--------|---|
| 45 | 45 | *(Reserved)* | Not documented in examined code | - | - |
| 46 | 46 | `recruitable_unit` | Mob type that can be recruited at this location | Mob ID from Mobs sheet | Line 2073, 17102 |
| 47 | 47 | `recruitable_count` | Number of recruitable units currently available | Integer (recruitment slots) | Line 2071, 17104 |

### Mana Storage (Type & Amount)

Row 35 contains the mana type names at columns 47-54 (Fire, Earth, Water, Air, Life, Death, Arcane).
Each land stores mana amounts in corresponding columns:

| Column | VBA Col | Mana Type | Description | Values | VBA Reference |
|--------|---------|-----------|-------------|--------|---|
| 48 | 48 | Fire Mana | Amount of Fire mana stored | Integer | Line 7527, 7535 |
| 49 | 49 | Earth Mana | Amount of Earth mana stored | Integer | Line 7528, 7535 |
| 50 | 50 | Water Mana | Amount of Water mana stored | Integer | Line 7529, 7535 |
| 51 | 51 | Air Mana | Amount of Air mana stored | Integer | Line 7530, 7535 |
| 52 | 52 | Life Mana | Amount of Life mana stored | Integer | Line 7531, 7535 |
| 53 | 53 | Death Mana | Amount of Death mana stored | Integer | Line 7532, 7535 |
| 54 | 54 | Arcane Mana | Amount of Arcane mana stored | Integer | Line 7533, 7535 |

**Mana Logic:**
- Mana types are identified by checking if `Game_map.Cells(35, 47 + c).Value` matches a mana type string
- The mana amounts are stored in the corresponding column of each land: `Game_map.Cells(land_row, 47 + c).Value`
- Mana production buildings are identified in building slots (columns 18-44)
- When a land has a mana-producing building, the building slot contains 1

---

## Summary Table

### Complete Column Mapping

| Col | Purpose | Type | Notes |
|-----|---------|------|-------|
| 1 | Land Type ID | Integer | 1-20 basic, 21+ custom |
| 2 | Owner | Integer | 0=neutral, 1-4=players |
| 3 | Price | Integer | Gold cost to purchase |
| 4 | Name | String | Location name |
| 5 | Defender ID | Integer | Mob ID defending land |
| 6 | Tax Income | Integer | Accumulated gold |
| 7 | Healing | Integer | Current healing power |
| 8 | X Coordinate | Integer | Board display row |
| 9 | Y Coordinate | Integer | Board display column |
| 10 | *(UNUSED)* | - | Not used |
| 11 | Healing Max | Integer | Base + building bonuses |
| 12 | Castle Level | Integer | 0-3 fortification level |
| 13 | Castle Defender | Integer | Mob defending castle |
| 14 | Archery Slots | Integer | Ranged unit slots |
| 15 | Gate Level | Integer | Gate fortification |
| 16 | Mana Max | Integer | Base + building bonuses |
| 17 | Has Defender | Integer | 0 or 1 flag |
| 18-44 | Building Slots | Integer | 0/1 presence (27 buildings) |
| 46 | Recruitable Unit | Integer | Mob ID to recruit |
| 47 | Recruitable Count | Integer | Available units |
| 48-54 | Mana Amounts | Integer | Fire, Earth, Water, Air, Life, Death, Arcane |

---

## Key Building System Details

### Building Properties Stored Per Land

When a building is constructed on a land, the following properties are updated:

From VBA lines 17076-17115:

- **Column 12** (`castle_level`): Increased by Buildings sheet column 7
- **Column 13** (`castle_defender`): Set to Buildings sheet column 20
- **Column 14** (`archery_slots`): Increased by Buildings sheet column 19
- **Column 11** (`healing_max`): Increased by Buildings sheet column 22
- **Column 6** (`tax_income`): Increased by Buildings sheet column 23
- **Column 15** (`gate_level`): Set to Buildings sheet column 21
- **Column 46** (`recruitable_unit`): Set to Buildings sheet column 25
- **Column 47** (`recruitable_count`): Increased by Buildings sheet column 26

Building slots (columns 18-44):
- **Column 18-44**: Individual bits representing which buildings are present
- Each column matches a building name in row 35
- When a building is placed, the corresponding slot is set to 1

---

## Usage Examples

### Checking if a land has a specific building:
```vba
If Game_map.Cells(land_row, find_building_slot_in_map("Barracks")).Value = 1 Then
    ' Land has a Barracks
End If
```

### Checking mana amounts:
```vba
If Game_map.Cells(35, 47).Value = "Fire mana" Then
    fire_mana_amount = Game_map.Cells(land_row, 47).Value
End If
```

### Updating castle fortification:
```vba
Game_map.Cells(land_row, 12).Value = Game_map.Cells(land_row, 12).Value + 1  ' Increase level
Game_map.Cells(land_row, 13).Value = defender_mob_id  ' Set castle defender
Game_map.Cells(land_row, 14).Value = Game_map.Cells(land_row, 14).Value + 2  ' Add archery slots
```

---

## File Reference

Source: `/Users/juljus/Projects/comeback/docs/extraction/vba/all_modules.txt`

Key functions:
- `find_building_slot_in_map()` - Line 16777
- `Joonista_asukoht()` - Line 7268 (handles map visualization and comments)
- Map initialization - Lines 690-750
