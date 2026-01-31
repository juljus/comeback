# Column Documentation

This document describes the columns in each extracted CSV file.

**Legend:**
- ✓ = Confirmed (from headers or VBA code)
- ? = Inferred (educated guess based on data patterns)
- ✗ = Unknown (needs investigation)

---

## mobs.csv

Creatures/enemies in the game. 132 entries.

| Column | Name | Status | Description |
|--------|------|--------|-------------|
| 0 | name | ✓ | Current display name (language-dependent) |
| 1 | hp | ✓ | Hit points |
| 2 | attacks_per_round | ✓ | Number of attacks per combat round |
| 3 | dice_count | ✓ | Damage dice count (e.g., 2 in "2d6") |
| 4 | dice_sides | ✓ | Damage dice sides (e.g., 6 in "2d6") |
| 5 | bonus_damage | ✓ | Flat damage bonus added to roll |
| 6 | strength | ✓ | Strength stat |
| 7 | dexterity | ✓ | Dexterity stat |
| 8 | power | ✓ | Power/magic stat |
| 9 | col_9 | ✗ | Unknown |
| 10 | armor | ✓ | Armor value (damage reduction) |
| 11 | col_11 | ? | Possibly damage type or AI behavior |
| 12 | col_12 | ? | Possibly related to combat |
| 13 | col_13 | ? | Possibly tier/level |
| 14-29 | col_N | ✗ | Unknown |
| 30 | merc_tier | ✓ | Mercenary price tier (used in hiring cost calculation) |
| 31 | col_31 | ? | Mercenary price multiplier? |
| 32 | spell_1 | ✓ | Known spell 1 (spell name) |
| 33 | spell_2 | ✓ | Known spell 2 |
| 34 | spell_3 | ✓ | Known spell 3 |
| 35 | spell_4 | ✓ | Known spell 4 |
| 36 | col_36 | ? | Has spells flag? |
| 37-39 | col_N | ✗ | Unknown |
| 40 | elemental_fire | ✓ | Fire elemental damage bonus |
| 41 | elemental_earth | ✓ | Earth elemental damage bonus |
| 42 | elemental_air | ✓ | Air elemental damage bonus |
| 43 | elemental_water | ✓ | Water elemental damage bonus |
| 44-50 | col_N | ✗ | Unknown |
| 51 | levelup_into | ✓ | Evolution target (mob name this evolves into) |
| 52-58 | col_N | ✗ | Unknown |
| 59 | name_en | ✓ | English name |
| 60 | name_et | ✓ | Estonian name |

---

## spells.csv

Magic abilities. 39 entries.

| Column | Name | Status | Description |
|--------|------|--------|-------------|
| 0 | name | ✓ | Current display name |
| 1 | type | ✓ | Spell type: 1=damage, 2=summon/utility, 3=buff |
| 2 | col_2 | ? | Player 1 knows this spell (runtime) |
| 3 | col_3 | ? | Player 2 knows this spell (runtime) |
| 4 | mana_cost | ✓ | Mana cost to cast |
| 5 | col_5 | ? | Player 3 knows this spell (runtime) |
| 6 | mana_type | ✓ | Required mana type (see Mana Types below) |
| 7 | effect_type | ✓ | Effect type code (see Effect Types below) |
| 8 | col_8 | ✗ | Unknown |
| 9 | description | ✓ | Current description text |
| 10 | base_power | ✓ | Base damage/power value |
| 11 | col_11 | ? | Gold generation flag (for Pot of Gold) |
| 12 | col_12 | ? | Item creation flag (for Create Item) |
| 13 | col_13 | ✗ | Unknown |
| 14 | summon_1 | ✓ | Summoned mob tier 1 (mob name) |
| 15 | summon_2 | ✓ | Summoned mob tier 2 |
| 16 | summon_3 | ✓ | Summoned mob tier 3 |
| 17 | summon_4 | ✓ | Summoned mob tier 4 |
| 18-20 | col_N | ? | Summon counts per power level? |
| 21 | flag_1 | ? | Single target flag? |
| 22 | col_22 | ✗ | Unknown |
| 23 | flag_2 | ? | Unknown flag |
| 24 | col_24 | ✗ | Unknown |
| 25 | flag_3 | ? | AOE flag? |
| 26-48 | col_N | ✗ | Unknown |
| 49 | name_en | ✓ | English name |
| 50 | description_en | ✓ | English description |
| 51 | name_et | ✓ | Estonian name |
| 52 | description_et | ✓ | Estonian description |

### Mana Types (col 6)

| Value | Type |
|-------|------|
| 4 | Fire |
| 5 | Earth |
| 6 | Air |
| 7 | Water |
| 8 | Death |
| 9 | Life |
| 10 | Arcane |

### Effect Types (col 7)

| Value | Effect |
|-------|--------|
| 0 | Buff/utility |
| 8 | Summon/create |
| 11 | Single target damage |
| 12 | AOE damage |

---

## items.csv

Weapons, armor, and consumables. 117 entries.

| Column | Name | Status | Description |
|--------|------|--------|-------------|
| 0 | name | ✓ | Current display name |
| 1 | type | ✓ | Item type (see Item Types below) |
| 2 | dice_count | ✓ | Damage dice count |
| 3 | dice_sides | ✓ | Damage dice sides |
| 4 | value | ✓ | Purchase price in gold |
| 5 | req_strength | ✓ | Required strength to equip |
| 6 | damage_type | ✓ | Damage type: 1=pierce, 2=slash, 3=crush |
| 7 | bonus_hp | ✓ | HP bonus when equipped |
| 8 | bonus_strength | ✓ | Strength bonus |
| 9 | bonus_dexterity | ✓ | Dexterity bonus |
| 10 | bonus_power | ✓ | Power bonus |
| 11 | bonus_armor | ✓ | Armor bonus |
| 12 | bonus_strikes | ✓ | Extra attacks per round |
| 13 | grants_spell | ✓ | Spell name granted by item |
| 14 | bonus_healing | ✓ | Healing bonus |
| 15 | bonus_speed | ✓ | Speed bonus |
| 16 | mana_fire | ✓ | Fire mana bonus per turn |
| 17 | mana_earth | ✓ | Earth mana bonus |
| 18 | mana_air | ✓ | Air mana bonus |
| 19 | mana_water | ✓ | Water mana bonus |
| 20 | mana_death | ✓ | Death mana bonus |
| 21 | mana_life | ✓ | Life mana bonus |
| 22 | mana_arcane | ✓ | Arcane mana bonus |
| 23 | damage_fire | ✓ | Fire elemental damage bonus |
| 24 | damage_earth | ✓ | Earth elemental damage bonus |
| 25 | damage_air | ✓ | Air elemental damage bonus |
| 26 | damage_water | ✓ | Water elemental damage bonus |
| 27-37 | col_N | ✗ | Unknown (possibly death/life/arcane damage, immunities) |
| 38 | name_en | ✓ | English name |
| 39 | name_et | ✓ | Estonian name |

### Item Types (col 1)

| Value | Type |
|-------|------|
| 1 | Consumable/Potion? |
| 2 | Armor? |
| 3 | Accessory? |
| 4 | ? |
| 5 | ? |
| 6 | Weapon |

---

## buildings.csv

Structures that can be built on land. 50 entries.

| Column | Name | Status | Description |
|--------|------|--------|-------------|
| 0 | name | ✓ | Current display name |
| 1 | prereq_1 | ✓ | Prerequisite building 1 (must build first) |
| 2 | prereq_2 | ✓ | Prerequisite building 2 |
| 3 | prereq_3 | ✓ | Prerequisite building 3 |
| 4 | prereq_4 | ✓ | Prerequisite building 4 |
| 5 | cost | ✓ | Build cost in gold |
| 6 | col_6 | ? | Build time? Always 1 |
| 7 | col_7 | ✗ | Unknown |
| 8 | grants_spell_1 | ✓ | Spell granted by building |
| 9 | grants_spell_2 | ✓ | Second spell granted |
| 10-17 | col_N | ✗ | Unknown (possibly stat bonuses) |
| 18 | col_18 | ? | Upgrade level? |
| 19 | unlocks_merc_1 | ✓ | Mercenary type unlocked for hiring |
| 20 | unlocks_merc_2 | ✓ | Second mercenary type |
| 21-38 | col_N | ✗ | Unknown |
| 39 | name_en | ✓ | English name |
| 40 | name_et | ✓ | Estonian name |

---

## lands.csv

Land/terrain types (from Map_defaults). 42 entries.

| Column | Name | Status | Description |
|--------|------|--------|-------------|
| 0 | name_short | ✓ | Short display name |
| 1 | name_long | ✓ | Full display name |
| 2 | price | ✓ | Purchase price (1000 = utility/unpurchasable) |
| 3 | tax_income | ✓ | Gold income per turn when owned |
| 4 | healing | ✓ | HP restored when resting here |
| 5-7 | col_N | ✗ | Unknown |
| 8 | defender_1 | ✓ | Tier 1 defender (mob name) |
| 9 | defender_2 | ✓ | Tier 2 defender |
| 10 | defender_3 | ✓ | Tier 3 defender |
| 11 | defender_4 | ✓ | Tier 4 defender |
| 12 | spawn_chance | ✓ | Chance to appear on generated map (%) |
| 13 | building_1 | ✓ | Available building 1 |
| 14 | building_2 | ✓ | Available building 2 |
| 15 | building_3 | ✓ | Available building 3 |
| 16 | building_4 | ✓ | Available building 4 |
| 17 | building_5 | ✓ | Available building 5 |
| 18 | building_6 | ✓ | Available building 6 |
| 19 | building_7 | ✓ | Available building 7 |
| 20 | building_8 | ✓ | Available building 8 |
| 21 | building_9 | ✓ | Available building 9 |
| 22 | building_10 | ✓ | Available building 10 |
| 23 | building_11 | ✓ | Available building 11 |
| 24 | building_12 | ✓ | Available building 12 |
| 25 | col_25 | ? | "Buildings without castle" flag |
| 26 | col_26 | ✗ | Unknown |
| 27 | name_short_en | ✓ | English short name |
| 28 | name_long_en | ✓ | English long name |
| 29 | name_short_et | ✓ | Estonian short name |
| 30 | name_long_et | ✓ | Estonian long name |
| 31-33 | col_N | ✗ | Unknown |

### Land Categories

**Utility Lands** (price=1000, unpurchasable):
- Shop, Smithy, Bazaar, Library, Mage Guild
- Mercenary Camp, Training Grounds, Shrine
- Arcane Tower, Cave, Treasure Island, Dungeon

**Territory Lands** (purchasable, produce mana):
- Valley (Life mana)
- Forest, Brushland (Earth mana)
- Hill, Mountain (Fire mana)
- Desert, Rocks (Air mana)
- Jungle, Iceland (Water mana)
- Swamp, Dark Forest (Death mana)
- Highland, Barren, Tundra, Volcano, Burrows, Woodland, Plain (various)

---

## game_map.csv

Board square template/structure. 39 entries (34 playable + extras).

| Column | Name | Status | Description |
|--------|------|--------|-------------|
| 0 | land_type_id | ✓ | Reference to lands.csv row |
| 1 | owner | ✓ | Current owner: 0=neutral, 1-4=players |
| 2 | price | ✓ | Purchase price |
| 3 | name | ✓ | Display name |
| 4 | defender_id | ✓ | Current defender mob ID |
| 5 | tax_income | ✓ | Tax income value |
| 6 | healing | ✓ | Healing value |
| 7 | coord_x | ✓ | X coordinate for board display |
| 8 | coord_y | ✓ | Y coordinate for board display |
| 9 | col_9 | ✗ | Unknown |
| 10 | col_10 | ? | Mana type produced? |
| 11-14 | col_N | ? | Castle level, fortification state? |
| 15 | col_15 | ? | Mana production amount? |
| 16 | col_16 | ✗ | Unknown |
| 17 | has_defender | ✓ | Whether defender is present (1=yes) |
| 18+ | building_N | ✓ | Building slots (which buildings are built) |

---

## levelup.csv

Pet/summon evolution paths. 52 entries.

| Column | Name | Status | Description |
|--------|------|--------|-------------|
| 0 | name | ✓ | Current creature name |
| 1 | hp_bonus | ? | HP gained on evolution |
| 2-20 | col_N | ✗ | Unknown (stat changes?) |
| 21 | learns_spell_1 | ✓ | Spell learned on evolution |
| 22 | learns_spell_2 | ✓ | Second spell learned |
| 23 | learns_spell_3 | ✓ | Third spell learned |
| 24 | learns_spell_4 | ✓ | Fourth spell learned |
| 25-46 | col_N | ✗ | Unknown |
| 47 | evolves_into | ✓ | Target creature name |
| 48 | col_48 | ✗ | Unknown |
| 49 | name_en | ✓ | English name |
| 50 | name_et | ✓ | Estonian name |

---

## effects.csv

Status effects. 9 entries. Structure unclear.

| Column | Name | Status | Description |
|--------|------|--------|-------------|
| 0-10 | col_N | ✗ | Unknown - needs VBA investigation |

Known effects from Help text:
- Bleeding (from slash weapons)
- Stun (from crush weapons)
- Poison
- Frozen
- Burning

---

## events.csv

Random events. 17 entries. Structure unclear.

| Column | Name | Status | Description |
|--------|------|--------|-------------|
| 0-9 | col_N | ✗ | Unknown - needs VBA investigation |

---

## strings_en.csv / strings_et.csv

UI text strings. ~880 entries each.

| Column | Name | Status | Description |
|--------|------|--------|-------------|
| 0 | string | ✓ | UI text in respective language |
| 1-8 | col_N | ? | Estonian only: grammatical forms (genitive, etc.) |

These are referenced by row number in VBA code, e.g., `Sheets("Lan1").Cells(17, 1).Value` = row 17 string.

---

## help.csv

Game manual text. 168 entries.

| Column | Name | Status | Description |
|--------|------|--------|-------------|
| 0 | text_col_1 | ✓ | Primary text content |
| 1 | text_col_2 | ✓ | Secondary text (translations?) |

---

## Next Steps

1. **Investigate unknowns**: Dig into VBA code for remaining `col_N` meanings
2. **Validate data**: Cross-reference mobs ↔ spells ↔ items to ensure references resolve
3. **Create TypeScript types**: Based on confirmed columns
4. **Convert to JSON**: Final structured data files
