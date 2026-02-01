# Spells.csv Column Analysis

Complete documentation of all columns in the Spells sheet based on VBA code analysis.

## Column Reference Map

### Core Information Columns (1-10)
| VBA Col | CSV Col | Name | Purpose | VBA Line |
|---------|---------|------|---------|----------|
| 1 | 1 | name | Spell name (language-dependent via col 50+) | 484, 794, 5846 |
| 2 | 2 | type | Player knowledge level (runtime variable, updated as players train) | 218-221 (initialization), 1363, 1379 |
| 3-6 | 3-6 | col_3-col_5 | Player knowledge flags (players 1-4) - runtime knowledge storage | 210, 3+col |
| 7 | 7 | mana_type | Damage type / mana type (used to reference mana costs) | 1299, 1394, 1431, 5843 |
| 8 | 8 | effect_type | Effect type classifier (checked for specific spell categories) | 11644 |
| 9 | 9 | mana_cost | Base mana cost for spell casting | 1429, 5890, 5911, 11519 |
| 10 | 10 | description | Spell description (language-dependent via col 51+) | 485, 1434, 5901 |
| 11 | 11 | base_power | Base spell power value | (referenced implicitly as power parameter) |

### Spell Effect Flag Columns (12-14)
These columns control whether a spell has specific effects when cast:

| VBA Col | CSV Col | Name | Purpose | VBA Line |
|---------|---------|------|---------|----------|
| 12 | 12 | col_11 | **Adds Gold Effect Flag** - If non-zero, spell adds gold to player: `x = ((Int(Rnd * 3 + 1) * 10) + power * 20) * (knowledge * knowledge)` | 6062-6069 |
| 13 | 13 | col_12 | **Generates Treasure Item Flag** - If non-zero, spell generates random treasure item with min/max values based on knowledge and power | 6078-6094 |
| 14 | 14 | col_13 | **Summon Spell Flag** - If non-zero, spell summons creatures (triggers summon logic) | 6099-6190 |

### Summon Creature Columns (15-21)
Used for summon spells. The spell loops through knowledge level (x=1 to knowledge) to determine which summon entries to use.

Structure: For each summon slot (4 maximum based on knowledge 1-4):
- **Slot 1-4** use columns 13-20 (when x < 5 in loop)
- **Slot 5+** uses column 17 (creature name) and column 21 (count)

| VBA Col | CSV Col | Name | Purpose | VBA Line |
|---------|---------|------|---------|----------|
| 15 | 15 | summon_1 | **Summon Level 1 Creature Name** (x=1 reference: col 13+x) | 6107 |
| 16 | 16 | summon_2 | **Summon Level 2 Creature Name** (x=2 reference: col 13+x) | 6107 |
| 17 | 17 | summon_3 | **Summon Level 3 Creature Name** (x=3 reference: col 13+x) | 6107 |
| 18 | 18 | summon_4 | **Summon Level 4 Creature Name** (x=4 reference: col 13+x) | 6107 |
| 19 | 19 | col_18 | **Summon Level 5+ Creature Name** (used when x >= 5, or accessed as col 17) | 6119-6120 |
| 20 | 20 | col_19 | **Summon Level 1 Count** (x=1 reference: col 17+x) | 6108 |
| 21 | 21 | col_20 | **Summon Level 2 Count** (x=2 reference: col 17+x) | 6108 |
| 22 | 22 | col_21 | **Summon Level 3 Count** (x=3 reference: col 17+x) | 6108 |
| 23 | 23 | col_22 | **Summon Level 4 Count** (x=4 reference: col 17+x) | 6108 |
| 24 | 24 | col_23 | **Summon Level 5+ Count** (used when x >= 5, directly accessed as col 21) | 6120 |

**Note on Summon Logic**: The VBA code at lines 6110 checks if current and previous summon names/counts match to determine `summons_Level` (escalation multiplier).

### Targeting & Scope Flag Columns (22-30)
Binary flags (0 or 1) that control spell targeting behavior:

| VBA Col | CSV Col | Name | Purpose | VBA Line |
|---------|---------|------|---------|----------|
| 22 | 22 | flag_1 | **is_spell_Aggressive** - Determines if spell is aggressive/offensive (affects combat logic) | 5789-5791, 11303, 11425, 12104 |
| 23 | 23 | col_22 | **can_target_Friendly** - If 1, spell can target friendly units | 5795-5797 |
| 24 | 24 | flag_2 | **can_target_Hostile** - If 1, spell can target hostile/enemy units | 5801-5803 |
| 25 | 25 | flag_3 | **can_target_Group** - If 1, spell targets group/area (mass spell) | 5807-5809, 11431, 11658, 11737 |
| 26 | 26 | col_24 | **can_target_Single_unit** - If 1, spell targets single unit only | 5814-5816, 11439 |
| 27 | 27 | col_25 | **can_target_Land** - If 1, spell can target land locations | 5821-5823 |
| 28 | 28 | col_26 | **UNUSED** - Not referenced in spell casting code (currently skipped) | - |
| 29 | 29 | col_27 | **can_target_Player** - If 1, spell can target player characters | 5827-5829 |
| 30 | 30 | col_28 | **has_global_Range** - If 1, spell has global range (affects scope/distance) | 5833-5835 |

### Spell Effect Columns (31-36)
These columns contain effect modifier values used in combat/effect calculations:

| VBA Col | CSV Col | Name | Purpose | VBA Line |
|---------|---------|------|---------|----------|
| 31 | 31 | col_29 | **Heal Effect Flag** - If non-zero, spell heals target HP by: `knowledge * (power * 3)` | 6225-6245 |
| 32 | 32 | col_30 | **Armor/Defense Boost Flag** - If non-zero, grants armor buff with: `Stat_Bonus = (1 * knowledge) + Int(power / 2)`, duration = `2 + power * power` | 6262-6300+ |
| 33 | 33 | col_31 | **Haste Effect Flag** - If non-zero, grants speed buff with: `Stat_Bonus = (1 * knowledge) + Int(power / 8)`, duration = `2 + power` | 6365-6410+ |
| 34 | 34 | col_32 | **Strength Boost Flag** - If non-zero, grants strength buff with: `Stat_Bonus = 2 * knowledge + Int(power / 10)`, duration = `2 + power * power` | 6479-6520+ |
| 35 | 35 | col_33 | **UNUSED in targeting** - Not found in spell casting (reserved/placeholder) | - |
| 36 | 36 | col_34 | **Manipulate Winds Effect Flag** - If non-zero, applies wind manipulation effect with: `Stat_Bonus = (1 * knowledge) + Int(power / 2)`, duration = `power - 1` | 6605-6650+ |

### Unknown/Vampiric Column (37)
| VBA Col | CSV Col | Name | Purpose | VBA Line |
|---------|---------|------|---------|----------|
| 37 | 37 | col_35 | **Vampiric Effect Percentage** - Percentage of damage dealt that heals caster (0-100). Only applies if target is not immune (target col 37 <> 1) | 12171 |

### Reserved/Unknown Columns (38-49)
| VBA Col | CSV Col | Name | Purpose | VBA Line |
|---------|---------|------|---------|----------|
| 38-49 | 38-49 | col_36-col_47 | **UNUSED/RESERVED** - Not referenced in any spell casting or effect code. Available for future expansion | - |

### Language-Specific Description Columns (50-53)
These columns store localized spell names and descriptions:

| VBA Col | CSV Col | Name | Purpose | VBA Line |
|---------|---------|------|---------|----------|
| 50 | 50 | name_en | **English Spell Name** (Language=1) or Estonian (Language=2) | 484 |
| 51 | 51 | description_en | **English Description** (Language=1) or Estonian (Language=2) | 485 |
| 52 | 52 | name_et | **Estonian Spell Name** (Language=2 specific) | 484 (formula: 50 + (Language-1)*2) |
| 53 | 53 | description_et | **Estonian Description** (Language=2 specific) | 485 (formula: 51 + (Language-1)*2) |

**Formula for Language Selection**:
- `Sheets("Spells").Cells(x, 50 + (Language - 1) * 2)` for spell name
- `Sheets("Spells").Cells(x, 51 + (Language - 1) * 2)` for spell description
- Language 1 = English (cols 50-51), Language 2 = Estonian (cols 52-53)

## Summary Table: All 53 Columns

| CSV Col | VBA Col | Purpose | Type | Notes |
|---------|---------|---------|------|-------|
| 1 | 1 | Spell Name | String | Dynamic (from cols 50+ based on language) |
| 2 | 2 | Type/Knowledge | Integer | Runtime variable, player training level |
| 3 | 3 | Player 1 Knowledge | Integer | Runtime player knowledge (0-100) |
| 4 | 4 | Player 2 Knowledge | Integer | Runtime player knowledge (0-100) |
| 5 | 5 | Player 3 Knowledge | Integer | Runtime player knowledge (0-100) |
| 6 | 6 | Player 4 Knowledge | Integer | Runtime player knowledge (0-100) |
| 7 | 7 | Mana Type | Integer | Damage/mana type reference |
| 8 | 8 | Effect Type | Integer | Spell category classifier |
| 9 | 9 | Mana Cost | Integer | Base mana cost (per cast) |
| 10 | 10 | Description | String | Dynamic (from cols 50+ based on language) |
| 11 | 11 | Base Power | Integer | Spell power modifier |
| 12 | 12 | Add Gold Flag | Binary | 0=no, 1=adds gold on cast |
| 13 | 13 | Generate Item Flag | Binary | 0=no, 1=generates treasure |
| 14 | 14 | Summon Flag | Binary | 0=no, 1=summons creatures |
| 15 | 15 | Summon 1 Name | String | Creature name for level 1 summon |
| 16 | 16 | Summon 2 Name | String | Creature name for level 2 summon |
| 17 | 17 | Summon 3 Name | String | Creature name for level 3 summon |
| 18 | 18 | Summon 4 Name | String | Creature name for level 4 summon |
| 19 | 19 | Summon 5+ Name | String | Creature name for knowledge >= 5 |
| 20 | 20 | Summon 1 Count | Integer | Number of creatures to summon at level 1 |
| 21 | 21 | Summon 2 Count | Integer | Number of creatures to summon at level 2 |
| 22 | 22 | Summon 3 Count | Integer | Number of creatures to summon at level 3 |
| 23 | 23 | Summon 4 Count | Integer | Number of creatures to summon at level 4 |
| 24 | 24 | Summon 5+ Count | Integer | Number of creatures to summon for knowledge >= 5 |
| 25 | 25 | Aggressive Flag | Binary | 0=not aggressive, 1=offensive spell |
| 26 | 26 | Target Friendly Flag | Binary | 0=cannot target friendly, 1=can |
| 27 | 27 | Target Hostile Flag | Binary | 0=cannot target hostile, 1=can |
| 28 | 28 | Target Group Flag | Binary | 0=single target, 1=group/area effect |
| 29 | 29 | Target Single Flag | Binary | 0=cannot target single, 1=can |
| 30 | 30 | Target Land Flag | Binary | 0=cannot target land, 1=can |
| 31 | 31 | UNUSED | - | Not used in current spell code |
| 32 | 32 | Target Player Flag | Binary | 0=cannot target player, 1=can |
| 33 | 33 | Global Range Flag | Binary | 0=limited range, 1=global range |
| 34 | 34 | Heal Effect Flag | Binary | 0=no heal, 1=heals HP |
| 35 | 35 | Armor Buff Flag | Binary | 0=no armor, 1=grants armor buff |
| 36 | 36 | Haste Effect Flag | Binary | 0=no haste, 1=grants speed buff |
| 37 | 37 | Strength Boost Flag | Binary | 0=no strength, 1=grants strength buff |
| 38 | 38 | RESERVED | - | Unused/future expansion |
| 39 | 39 | RESERVED | - | Unused/future expansion |
| 40 | 40 | RESERVED | - | Unused/future expansion |
| 41 | 41 | Wind Manipulation Flag | Binary | 0=no wind, 1=applies wind effect |
| 42 | 42 | RESERVED | - | Unused/future expansion |
| 43 | 43 | RESERVED | - | Unused/future expansion |
| 44 | 44 | RESERVED | - | Unused/future expansion |
| 45 | 45 | RESERVED | - | Unused/future expansion |
| 46 | 46 | RESERVED | - | Unused/future expansion |
| 47 | 47 | RESERVED | - | Unused/future expansion |
| 48 | 48 | Vampiric Percent | Integer | % of damage healed to caster (0-100) |
| 49 | 49 | RESERVED | - | Unused/future expansion |
| 50 | 50 | Name (Language 1) | String | English spell name |
| 51 | 51 | Description (Language 1) | String | English spell description |
| 52 | 52 | Name (Language 2) | String | Estonian spell name |
| 53 | 53 | Description (Language 2) | String | Estonian spell description |

## Key Discoveries

### Corrected Column Mapping

The task mentioned investigating unknown columns but many were actually known:
- **Columns 11-13** are NOT just "flags" - they're actual effect toggles (gold, item generation, summon)
- **Columns 18-24** are NOT just "summon counts" - they're a mix of creature names (18-19) and counts (20-24) organized by knowledge level
- **Columns 25-30** are targeting flags that control spell scope and target type
- **Column 35** is Vampiric life drain percentage
- **Column 36** is Wind manipulation
- **Columns 37-49** are mostly unused/reserved

### Effect Calculations

Spell effects use standardized formulas:
- **Heal**: `knowledge * (power * 3)` HP restored
- **Armor**: `Stat_Bonus = knowledge + Int(power / 2)`, lasts `2 + power²` turns
- **Haste**: `Stat_Bonus = knowledge + Int(power / 8)`, lasts `2 + power` turns
- **Strength**: `Stat_Bonus = 2*knowledge + Int(power / 10)`, lasts `2 + power²` turns
- **Winds**: `Stat_Bonus = knowledge + Int(power / 2)`, lasts `power - 1` turns
- **Vampiric**: Heals caster by `(vampiric_percent + 25*spell_knowledge) / 100 * damage_dealt` HP

### Summon Logic

Summon spells use a knowledge-based escalation system:
1. Loop through knowledge level (1 to knowledge level)
2. For levels 1-4: Read creature names from cols 15-18, counts from cols 20-23
3. For level 5+: Use col 19 (creature name) and col 24 (count)
4. If creature name matches previous level AND count matches, increment `summons_Level` (affects HP scaling)
5. Each summoned creature gets boosted HP: `(base_hp / 10) * (20 + (summons_level-1) * 2)`

### Language System

The spreadsheet uses a clever formula-based language system:
- Column formula: `50 + (Language - 1) * 2` selects language-specific columns
- Language 1 = English, Language 2 = Estonian
- Spell name column dynamically pulls from col 50 or 52 at runtime
- Spell description column dynamically pulls from col 51 or 53 at runtime

## References

All line numbers refer to `/Users/juljus/Projects/comeback/docs/extraction/vba/all_modules.txt`

Key function locations:
- Spell casting main logic: Lines 5789-6650+
- Summon spell implementation: Lines 6099-6190
- Heal effect: Lines 6225-6245
- Armor/Defense buff: Lines 6262-6300+
- Haste effect: Lines 6365-6410+
- Strength buff: Lines 6479-6520+
- Wind manipulation: Lines 6605-6650+
- Vampiric drain: Lines 12171-12172
- Language setup: Lines 484-485
