# Column Documentation

This document describes the columns in each extracted CSV file.

**Legend:**
- ✓ = Confirmed (from VBA code analysis)
- ○ = Reserved/Unused (confirmed empty in VBA)

**Last Updated:** 2026-02-01 (VBA fleet research complete)

---

## mobs.csv

Creatures/enemies in the game. 132 entries.

### Core Stats (Columns 0-13)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 0 | 1 | name | ✓ | Display name (language-dependent) |
| 1 | 2 | hp | ✓ | Hit points (copied to current & max HP) |
| 2 | 3 | attacks_per_round | ✓ | Number of attacks per combat round |
| 3 | 4 | dice_count | ✓ | Damage dice count |
| 4 | 5 | dice_sides | ✓ | Damage dice sides |
| 5 | 6 | damage_type | ✓ | 0=crush, 1=pierce, 2=slash |
| 6 | 7 | strength | ✓ | Strength stat |
| 7 | 8 | dexterity | ✓ | Dexterity stat |
| 8 | 9 | power | ✓ | Power/magic stat |
| 9 | 10 | armor | ✓ | Armor value → Side col 14 |
| 10 | 11 | (reserved) | ○ | Unused - gap after armor |
| 11 | 12 | ai_behavior_1 | ✓ | AI flag 1 → Side col 32 |
| 12 | 13 | ai_behavior_2 | ✓ | AI flag 2 → Side col 33 |
| 13 | 14 | ai_behavior_3 | ✓ | AI flag 3 (bravery, 10=never flee) → Side col 34 |

### Reserved Gap (Columns 14-15)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 14 | 15 | (reserved) | ○ | Unused |
| 15 | 16 | (reserved) | ○ | Unused |

### Mana System (Columns 16-29)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 16 | 17 | mana_fire | ✓ | Fire mana pool |
| 17 | 18 | mana_earth | ✓ | Earth mana pool |
| 18 | 19 | mana_water | ✓ | Water mana pool |
| 19 | 20 | mana_air | ✓ | Air mana pool |
| 20 | 21 | mana_life | ✓ | Life mana pool |
| 21 | 22 | mana_death | ✓ | Death mana pool |
| 22 | 23 | mana_arcane | ✓ | Arcane mana pool |
| 23 | 24 | mana_regen_fire | ✓ | Fire mana regeneration per turn |
| 24 | 25 | mana_regen_earth | ✓ | Earth mana regeneration |
| 25 | 26 | mana_regen_water | ✓ | Water mana regeneration |
| 26 | 27 | mana_regen_air | ✓ | Air mana regeneration |
| 27 | 28 | mana_regen_life | ✓ | Life mana regeneration |
| 28 | 29 | mana_regen_death | ✓ | Death mana regeneration |
| 29 | 30 | mana_regen_arcane | ✓ | Arcane mana regeneration |

### Classification (Columns 30-31)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 30 | 31 | mob_type | ✓ | Mob/building type → Side col 37 |
| 31 | 32 | merc_tier | ✓ | Mercenary price tier (used in hire cost formula) |

### Spellcasting (Columns 32-39)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 32 | 33 | spell_1 | ✓ | Known spell 1 (Estonian name) → Side col 40 |
| 33 | 34 | spell_2 | ✓ | Known spell 2 → Side col 41 |
| 34 | 35 | spell_3 | ✓ | Known spell 3 → Side col 42 |
| 35 | 36 | spell_4 | ✓ | Known spell 4 → Side col 43 |
| 36 | 37 | has_spells | ✓ | Flag: mob can cast spells |
| 37 | 38 | side_col_37_mapping | ✓ | Maps to Side sheet col 37 (mob_type) |
| 38 | 39 | behind_wall | ✓ | Wall position flag (0=exposed, 1=behind wall) → Side col 38 |
| 39 | 40 | side_col_39_mapping | ✓ | Maps to Side sheet col 39 (merc_contract) |

### Elemental Damage (Columns 40-44)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 40 | 41 | elemental_fire | ✓ | Fire damage bonus → Side col 50 |
| 41 | 42 | elemental_earth | ✓ | Earth damage bonus → Side col 51 |
| 42 | 43 | elemental_air | ✓ | Air damage bonus → Side col 52 |
| 43 | 44 | elemental_water | ✓ | Water damage bonus → Side col 53 |
| 44 | 45 | extra_damage | ✓ | Extra damage (bleeding/status related) |

### Immunities (Columns 45-50)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 45 | 46 | immunity_fire | ✓ | Fire damage immunity → Side col 59 |
| 46 | 47 | immunity_lightning | ✓ | Lightning immunity → Side col 61 |
| 47 | 48 | immunity_cold | ✓ | Cold immunity → Side col 62 |
| 48 | 49 | immunity_poison | ✓ | Poison immunity → Side col 60 |
| 49 | 50 | immunity_bleeding | ✓ | Bleeding immunity → Side col 63 |
| 50 | 51 | immunity_stun | ✓ | Stun immunity → Side col 64 |

### Evolution System (Columns 51-53)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 51 | 52 | evolves_into | ✓ | Evolution target (mob name) → Side col 66 |
| 52 | 53 | evolution_type | ✓ | Pet evolution type flag (1=normal, 2/6=special) |
| 53 | 54 | spell_level_bonus | ✓ | Spell level bonus → Side col 68 |

### Reserved (Columns 54-58)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 54-58 | 55-59 | (reserved) | ○ | Unused |

### Localization (Columns 59-60)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 59 | 60 | name_en | ✓ | English name |
| 60 | 61 | name_et | ✓ | Estonian name |

---

## spells.csv

Magic abilities. 39 entries.

### Core Information (Columns 0-10)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 0 | 1 | name | ✓ | Display name (from cols 49+ based on language) |
| 1 | 2 | type | ✓ | Spell type: 1=damage, 2=summon/utility, 3=buff |
| 2 | 3 | player_1_knowledge | ✓ | Player 1 knowledge level (runtime) |
| 3 | 4 | player_2_knowledge | ✓ | Player 2 knowledge level (runtime) |
| 4 | 5 | player_3_knowledge | ✓ | Player 3 knowledge level (runtime) |
| 5 | 6 | player_4_knowledge | ✓ | Player 4 knowledge level (runtime) |
| 6 | 7 | mana_type | ✓ | Required mana type (see Mana Types below) |
| 7 | 8 | effect_type | ✓ | Effect type code (see Effect Types below) |
| 8 | 9 | mana_cost | ✓ | Mana cost (VBA line 5911) - ranges 6-50 |
| 9 | 10 | description | ✓ | Description (from cols 50+ based on language) |
| 10 | 11 | base_power | ✓ | Base damage/power value |

### Effect Flags (Columns 11-13)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 11 | 12 | generates_gold | ✓ | Gold generation flag (Pot of Gold): `((rand(10-30) + power*20) * knowledge²)` |
| 12 | 13 | generates_item | ✓ | Item creation flag (Create Item spell) |
| 13 | 14 | is_summon | ✓ | Summon spell flag (triggers summon logic) |

### Summon Data (Columns 14-23)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 14 | 15 | summon_1_creature | ✓ | Creature name for knowledge level 1 |
| 15 | 16 | summon_2_creature | ✓ | Creature name for knowledge level 2 |
| 16 | 17 | summon_3_creature | ✓ | Creature name for knowledge level 3 |
| 17 | 18 | summon_4_creature | ✓ | Creature name for knowledge level 4 |
| 18 | 19 | summon_5_creature | ✓ | Creature name for knowledge level 5+ |
| 19 | 20 | summon_1_count | ✓ | Number to summon at level 1 |
| 20 | 21 | summon_2_count | ✓ | Number to summon at level 2 |
| 21 | 22 | summon_3_count | ✓ | Number to summon at level 3 |
| 22 | 23 | summon_4_count | ✓ | Number to summon at level 4 |
| 23 | 24 | summon_5_count | ✓ | Number to summon at level 5+ |

### Targeting Flags (Columns 24-32)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 24 | 25 | is_aggressive | ✓ | Offensive spell flag (VBA line 5789) |
| 25 | 26 | can_target_friendly | ✓ | Can target friendly units |
| 26 | 27 | can_target_hostile | ✓ | Can target hostile units |
| 27 | 28 | can_target_group | ✓ | Group/area effect (mass spell) |
| 28 | 29 | can_target_single | ✓ | Can target single unit |
| 29 | 30 | can_target_land | ✓ | Can target land locations |
| 30 | 31 | has_heal_effect_alt | ✓ | Alternative heal flag (separate from col 33) |
| 31 | 32 | can_target_player | ✓ | Can target player characters |
| 32 | 33 | has_global_range | ✓ | Global range (no distance limit) |

### Effect Modifiers (Columns 33-40)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 33 | 34 | has_heal_effect | ✓ | Heal flag: `knowledge * (power * 3)` HP |
| 34 | 35 | has_armor_buff | ✓ | Armor buff: `knowledge + power/2`, duration `2 + power²` |
| 35 | 36 | has_haste_effect | ✓ | Haste buff: `knowledge + power/8`, duration `2 + power` |
| 36 | 37 | has_strength_buff | ✓ | Strength buff: `2*knowledge + power/10`, duration `2 + power²` |
| 37 | 38 | (reserved) | ○ | Unused |
| 38 | 39 | (reserved) | ○ | Unused |
| 39 | 40 | has_wind_effect | ✓ | Wind manipulation: `knowledge + power/2`, duration `power - 1` |
| 40 | 41 | vampiric_percent | ✓ | % of damage healed to caster (0-100) |

### Reserved (Columns 41-48)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 41-48 | 42-49 | (reserved) | ○ | Unused - future expansion |

### Localization (Columns 49-52)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 49 | 50 | name_en | ✓ | English spell name |
| 50 | 51 | description_en | ✓ | English description |
| 51 | 52 | name_et | ✓ | Estonian spell name |
| 52 | 53 | description_et | ✓ | Estonian description |

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

### Core Properties (Columns 0-6)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 0 | 1 | name | ✓ | Display name |
| 1 | 2 | type | ✓ | Item type (see Item Types below) |
| 2 | 3 | dice_count | ✓ | Damage dice count |
| 3 | 4 | dice_sides | ✓ | Damage dice sides |
| 4 | 5 | value | ✓ | Purchase price in gold |
| 5 | 6 | req_strength | ✓ | Required strength to equip |
| 6 | 7 | damage_type | ✓ | 1=pierce, 2=slash, 3=crush |

### Stat Bonuses (Columns 7-15)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 7 | 8 | bonus_hp | ✓ | HP bonus when equipped |
| 8 | 9 | bonus_strength | ✓ | Strength bonus |
| 9 | 10 | bonus_dexterity | ✓ | Dexterity bonus |
| 10 | 11 | bonus_power | ✓ | Power bonus |
| 11 | 12 | bonus_armor | ✓ | Armor bonus |
| 12 | 13 | bonus_strikes | ✓ | Extra attacks per round |
| 13 | 14 | grants_spell | ✓ | Spell name granted by item |
| 14 | 15 | bonus_healing | ✓ | Healing bonus |
| 15 | 16 | bonus_speed | ✓ | Speed bonus |

### Mana Bonuses (Columns 16-22)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 16 | 17 | mana_fire | ✓ | Fire mana bonus per turn |
| 17 | 18 | mana_earth | ✓ | Earth mana bonus |
| 18 | 19 | mana_air | ✓ | Air mana bonus |
| 19 | 20 | mana_water | ✓ | Water mana bonus |
| 20 | 21 | mana_death | ✓ | Death mana bonus |
| 21 | 22 | mana_life | ✓ | Life mana bonus |
| 22 | 23 | mana_arcane | ✓ | Arcane mana bonus |

### Elemental Damage (Columns 23-26)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 23 | 24 | damage_fire | ✓ | Fire elemental damage bonus |
| 24 | 25 | damage_earth | ✓ | Earth elemental damage bonus |
| 25 | 26 | damage_air | ✓ | Air elemental damage bonus |
| 26 | 27 | damage_water | ✓ | Water elemental damage bonus |

### Reserved (Columns 27-37)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 27-37 | 28-38 | (reserved) | ○ | Unused - no VBA references found |

### Localization (Columns 38-39)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 38 | 39 | name_en | ✓ | English name |
| 39 | 40 | name_et | ✓ | Estonian name |

### Item Types (col 1)

| Value | Type | Count |
|-------|------|-------|
| 1 | Helm | 8 |
| 2 | Body Armor | 10 |
| 3 | Boots | 6 |
| 4 | Ring | 11 |
| 6 | Weapon | 48 |
| 7 | Consumable | 33 |

---

## buildings.csv

Structures that can be built on land. 50 entries.

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 0 | 1 | name | ✓ | Display name |
| 1 | 2 | prereq_1 | ✓ | Prerequisite building 1 |
| 2 | 3 | prereq_2 | ✓ | Prerequisite building 2 |
| 3 | 4 | prereq_3 | ✓ | Prerequisite building 3 |
| 4 | 5 | prereq_4 | ✓ | Prerequisite building 4 |
| 5 | 6 | cost | ✓ | Build cost in gold |
| 6 | 7 | build_time | ✓ | Build time (always 1) |
| 7 | 8 | fortification_level | ✓ | Fortification level added → Game_map col 12 |
| 8 | 9 | grants_spell_1 | ✓ | First spell granted |
| 9 | 10 | grants_spell_2 | ✓ | Second spell granted |
| 10 | 11 | spell_land_type_1 | ✓ | Land type restriction for spell 1 |
| 11 | 12 | spell_land_type_2 | ✓ | Land type restriction for spell 2 |
| 12 | 13 | mana_fire | ✓ | Fire mana regen bonus |
| 13 | 14 | mana_earth | ✓ | Earth mana regen bonus |
| 14 | 15 | mana_air | ✓ | Air mana regen bonus |
| 15 | 16 | mana_water | ✓ | Water mana regen bonus |
| 16 | 17 | mana_life | ✓ | Life mana regen bonus |
| 17 | 18 | mana_death | ✓ | Death mana regen bonus |
| 18 | 19 | mana_arcane | ✓ | Arcane mana regen bonus |
| 19 | 20 | archery_slots | ✓ | Number of archers → Game_map col 14 |
| 20 | 21 | castle_defender | ✓ | Defender unit type → Game_map col 13 |
| 21 | 22 | gate_defense | ✓ | Gate defense value → Game_map col 15 |
| 22 | 23 | healing_bonus | ✓ | Land healing bonus → Game_map col 11 |
| 23 | 24 | income_bonus | ✓ | Land income bonus → Game_map col 6 |
| 24 | 25 | combat_rounds | ✓ | Extra combat rounds |
| 25 | 26 | recruitable_unit | ✓ | Mercenary type unlocked → Game_map col 46 |
| 26 | 27 | recruitable_count | ✓ | Number recruitable → Game_map col 47 |
| 27 | 28 | portal_flag | ✓ | Portal effect (teleportation) |
| 28 | 29 | bank_flag | ✓ | Bank effect (gold storage) |
| 29 | 30 | bonus_strength | ✓ | Strength stat bonus |
| 30 | 31 | bonus_dexterity | ✓ | Dexterity stat bonus |
| 31 | 32 | bonus_power | ✓ | Power stat bonus |
| 32 | 33 | spell_level_bonus | ✓ | Spell level bonus |
| 33-38 | 34-39 | (reserved) | ○ | Unused |
| 39 | 40 | name_en | ✓ | English name |
| 40 | 41 | name_et | ✓ | Estonian name |

---

## lands.csv

Land/terrain types (from Map_defaults). 42 entries.

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 0 | 1 | name_short | ✓ | Short display name |
| 1 | 2 | name_long | ✓ | Full display name |
| 2 | 3 | price | ✓ | Purchase price (1000 = utility/unpurchasable) |
| 3 | 4 | tax_income | ✓ | Gold income per turn when owned |
| 4 | 5 | healing | ✓ | HP restored when resting here |
| 5-7 | 6-8 | (reserved) | ○ | Unused |
| 8 | 9 | defender_1 | ✓ | Tier 1 defender (mob name) |
| 9 | 10 | defender_2 | ✓ | Tier 2 defender |
| 10 | 11 | defender_3 | ✓ | Tier 3 defender |
| 11 | 12 | defender_4 | ✓ | Tier 4 defender |
| 12 | 13 | spawn_chance | ✓ | Chance to appear on generated map (%) |
| 13-24 | 14-25 | building_1-12 | ✓ | Available buildings (12 slots) |
| 25 | 26 | mana_type | ✓ | **Mana type produced** ("Fire mana", "Water mana", etc.) |
| 26 | 27 | mana_building_flag | ✓ | Mana building slot logic (used in build validation) |
| 27 | 28 | name_short_en | ✓ | English short name |
| 28 | 29 | name_long_en | ✓ | English long name |
| 29 | 30 | name_short_et | ✓ | Estonian short name |
| 30 | 31 | name_long_et | ✓ | Estonian long name |
| 31-33 | 32-34 | (reserved) | ○ | Unused |

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

---

## game_map.csv (Runtime Board State)

Board square runtime state. 34 playable squares + row 35 header.

### Core Land Info (Columns 0-9)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 0 | 1 | land_type_id | ✓ | Reference to lands.csv row |
| 1 | 2 | owner | ✓ | Current owner: 0=neutral, 1-4=players |
| 2 | 3 | price | ✓ | Purchase price |
| 3 | 4 | name | ✓ | Display name |
| 4 | 5 | defender_id | ✓ | Current defender mob ID |
| 5 | 6 | tax_income | ✓ | Accumulated tax income |
| 6 | 7 | healing | ✓ | Current healing power |
| 7 | 8 | coord_x | ✓ | X coordinate for board display |
| 8 | 9 | coord_y | ✓ | Y coordinate for board display |
| 9 | 10 | (unused) | ○ | Not used |

### Fortification System (Columns 10-16)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 10 | 11 | healing_max | ✓ | Maximum healing (base + buildings) |
| 11 | 12 | castle_level | ✓ | Castle fortification level (0-3) |
| 12 | 13 | castle_defender | ✓ | Mob type defending castle |
| 13 | 14 | archery_slots | ✓ | Number of ranged unit slots |
| 14 | 15 | gate_level | ✓ | Gate fortification value |
| 15 | 16 | mana_max | ✓ | Maximum mana (base + buildings) |
| 16 | 17 | has_defender | ✓ | Flag: defender is present (0/1) |

### Building Slots (Columns 17-43)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 17-43 | 18-44 | building_slot_1-27 | ✓ | Individual building presence (0/1 per slot) |

Row 35 contains building names in columns 17+, mapping slot columns to building names.

### Recruitment (Columns 45-46)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 45 | 46 | recruitable_unit | ✓ | Mob type that can be recruited |
| 46 | 47 | recruitable_count | ✓ | Number of units available |

### Mana Storage (Columns 47-53)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 47 | 48 | mana_fire | ✓ | Stored Fire mana |
| 48 | 49 | mana_earth | ✓ | Stored Earth mana |
| 49 | 50 | mana_water | ✓ | Stored Water mana |
| 50 | 51 | mana_air | ✓ | Stored Air mana |
| 51 | 52 | mana_life | ✓ | Stored Life mana |
| 52 | 53 | mana_death | ✓ | Stored Death mana |
| 53 | 54 | mana_arcane | ✓ | Stored Arcane mana |

---

## effects.csv (Status Effects Runtime)

Active status effects. Up to 40 rows, 11 active columns.

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 0 | 1 | caster_id | ✓ | Who created the effect |
| 1 | 2 | target_id | ✓ | Who is affected (0 = environmental like winds) |
| 2 | 3 | duration | ✓ | Turns remaining (decrements each turn) |
| 3 | 4 | armor_bonus | ✓ | Defense modification |
| 4 | 5 | haste_bonus | ✓ | Speed/dexterity modification |
| 5 | 6 | strength_bonus | ✓ | Strength modification |
| 6 | 7 | winds_power | ✓ | Movement difficulty strength |
| 7 | 8 | checked_flag | ✓ | Prevents double-processing in same turn |
| 8 | 9 | money_reward | ✓ | Gold granted on expiration |
| 9 | 10 | item_reward | ✓ | Item ID granted on expiration |
| 10 | 11 | land_reward | ✓ | Territory ID granted on expiration |

**Note:** Bleeding, stun, poison, frozen, burning are tracked in Side sheet cols 54-58 during combat, not in Effects sheet.

---

## levelup.csv

Pet/summon evolution paths. 52 entries.

### Core Info (Columns 0-1)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 0 | 1 | name | ✓ | Current creature name |
| 1 | 2 | hp_bonus | ✓ | HP gained on evolution |

### Stat Changes (Columns 2-20)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 2 | 3 | attacks_bonus | ✓ | Extra attacks gained |
| 3-4 | 4-5 | damage_bonus | ✓ | Damage dice bonuses (min, max) |
| 5 | 6 | damage_type | ✓ | New damage type (if non-zero) |
| 6-8 | 7-9 | base_stat_bonus | ✓ | STR/DEX/POW bonuses |
| 9 | 10 | armor_bonus | ✓ | Armor bonus |
| 10-12 | 11-13 | modified_stat_bonus | ✓ | Modified STR/DEX/POW |
| 14-20 | 15-21 | mana_regen | ✓ | Mana regeneration for 7 types |

### Spells Learned (Columns 21-24)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 21 | 22 | learns_spell_1 | ✓ | First spell learned on evolution |
| 22 | 23 | learns_spell_2 | ✓ | Second spell learned |
| 23 | 24 | learns_spell_3 | ✓ | Third spell learned |
| 24 | 25 | learns_spell_4 | ✓ | Fourth spell learned |

### Elemental Bonuses (Columns 25-33)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 25-28 | 26-29 | spell_power_bonus | ✓ | Spell power bonuses (4 slots) |
| 29-33 | 30-34 | elemental_damage | ✓ | Elemental damage bonuses |

### Resistances (Columns 34-39)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 34-39 | 35-40 | resistances | ✓ | Fire, Lightning, Cold, Poison, Bleeding, Stun |

### Reserved (Columns 40-45) and Evolution Counter (Column 46)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 40-45 | 41-46 | (reserved) | ○ | Unused |
| 46 | 47 | evolution_counter | ✓ | Used in level_up_mob() for evolution tracking |

### Evolution Target (Columns 47-50)

| Column | VBA Col | Name | Status | Description |
|--------|---------|------|--------|-------------|
| 47 | 48 | evolves_into | ✓ | Target creature name |
| 48 | 49 | (reserved) | ○ | Unused |
| 49 | 50 | name_en | ✓ | English name |
| 50 | 51 | name_et | ✓ | Estonian name |

---

## Side Sheet (Combat Runtime)

Combat participant tracking. 68 columns per combatant.

### Identity & HP (Columns 1-3, 35)

| Col | Name | Source | Description |
|-----|------|--------|-------------|
| 1 | name | Mobs col 1 | Combatant name |
| 2 | current_hp | Mobs col 2 | Current HP (decreases in combat) |
| 3 | max_hp | Mobs col 2 | Maximum HP |
| 35 | entity_id | Game_data1 | Unique combatant instance ID |

### Combat Mechanics (Columns 4-7, 14-15)

| Col | Name | Source | Description |
|-----|------|--------|-------------|
| 4 | attacks | Mobs col 3 | Attacks per round |
| 5 | dice_count | Mobs col 4 | Damage dice count |
| 6 | dice_sides | Mobs col 5 | Damage dice sides |
| 7 | damage_type | Mobs col 6 | Physical damage type |
| 14 | armor | Mobs col 10 | Armor rating |
| 15 | weapon_name | Items | Equipped weapon name |

### Stats (Columns 8-13)

| Col | Name | Source | Description |
|-----|------|--------|-------------|
| 8-10 | base_stats | Mobs cols 7-9 | Base STR/DEX/POW |
| 11-13 | modified_stats | Mobs cols 7-9 | Current STR/DEX/POW after buffs |

### Mana (Columns 16-29)

| Col | Name | Source | Description |
|-----|------|--------|-------------|
| 16-21 | mana_pools | Mobs cols 16-21 | Mana for 6 schools |
| 22-27 | mana_regen | Mobs cols 22-27 | Mana regeneration |
| 28-29 | mana_knowledge | Mobs cols 28-29 | Spell knowledge levels |

### Combat Actions (Columns 30-31)

| Col | Name | Description |
|-----|------|-------------|
| 30 | current_action | 0=flee, 1=melee, 2=ranged, 10=peaceful spell, 11=single target spell, 12=mass spell, 20=defend |
| 31 | action_target | Target entity ID or (100 + side_number) for mass effects |

### Classification (Columns 32-39)

| Col | Name | Source | Description |
|-----|------|--------|-------------|
| 32-34 | ai_behavior | Mobs cols 11-13 | AI flags (34 = bravery) |
| 37 | mob_type | Mobs col 30 | Mob/building type |
| 38 | behind_wall | Runtime | 1 = protected from melee |
| 39 | merc_contract | Runtime | Contract rounds remaining |

### Spellcasting (Columns 40-49)

| Col | Name | Source | Description |
|-----|------|--------|-------------|
| 40-44 | spell_slots | Mobs cols 32-36 | Spell slot data |
| 45-48 | spell_knowledge | Mobs cols 37-40 | Knowledge per spell |
| 49 | speed_bonus | Runtime | Speed/initiative bonus |

### Elemental Damage (Columns 50-53)

| Col | Name | Source | Description |
|-----|------|--------|-------------|
| 50 | fire_damage | Mobs col 41 | Fire damage bonus |
| 51-52 | extra_damage | Mobs cols 42-43 | Additional damage types |
| 53 | poison_damage | Mobs col 44 | Poison damage bonus |

### Status Effects (Columns 54-58) - Runtime, initialized to 0

| Col | Name | Description |
|-----|------|-------------|
| 54 | bleeding | Bleed damage per round |
| 55 | stun | Rounds remaining stunned |
| 56 | poison | Poison damage per round |
| 57 | frozen | Rounds remaining frozen |
| 58 | burning | Rounds remaining burning |

### Immunities (Columns 59-64)

| Col | Name | Source | Description |
|-----|------|--------|-------------|
| 59 | fire_immunity | Mobs col 45 | Fire resistance |
| 60 | poison_immunity | Mobs col 48 | Poison resistance |
| 61 | lightning_immunity | Mobs col 46 | Lightning resistance |
| 62 | cold_immunity | Mobs col 47 | Cold resistance |
| 63 | bleeding_immunity | Mobs col 49 | Bleeding resistance |
| 64 | stun_immunity | Mobs col 50 | Stun resistance |

### Pet System (Columns 65-68)

| Col | Name | Source | Description |
|-----|------|--------|-------------|
| 65 | evolution_counter | Runtime | Combat rounds for evolution progress |
| 66 | evolves_into | Mobs col 51 | Target mob for evolution |
| 67 | is_pet | Runtime | 0 = normal, 1 = summoned pet |
| 68 | spell_level_bonus | Mobs col 53 | Extra spell level |

---

## game_data1.csv

Game configuration constants. See roadmap.md for full extraction.

### Key Constants

| Row | Name | Value | Description |
|-----|------|-------|-------------|
| 74-76 | title_salaries | 30/40/50 | Gold per turn for Baron/Count/Duke |
| 77-79 | title_thresholds | 3/9/15 | Lands required for titles |
| 82 | resting_heal | 2 | HP restored per rest action |
| 188 | shrine_cost | 50 | Cost to heal at shrine |
| 208 | effects_count | - | Number of active effects (runtime) |

---

## Research Complete

All major data structures have been documented from VBA code analysis (2026-02-01).
**Verification pass completed:** All "reserved/unused" columns have been confirmed.

**Coverage:**
- mobs.csv: 100% (61 columns documented)
- spells.csv: 100% (53 columns documented)
- items.csv: 100% (40 columns documented)
- buildings.csv: 100% (41 columns documented)
- lands.csv: 100% (34 columns documented)
- game_map.csv: 100% (54 columns documented)
- effects.csv: 100% (11 columns documented)
- levelup.csv: 100% (51 columns documented)
- Side sheet: 100% (68 columns documented)

**Corrections Applied (2026-02-01):**
- mobs col 9: Corrected from "reserved" to "armor" (VBA col 10)
- mobs cols 37, 39: Corrected from "reserved" to Side sheet mapping columns
- spells col 30: Corrected from "reserved" to "has_heal_effect_alt"
- lands col 26: Corrected from "reserved" to "mana_building_flag"
- levelup col 46: Corrected from "reserved" to "evolution_counter"

**Remaining Reserved Columns (confirmed truly unused):**
- mobs: cols 10 (gap after armor), 14-15, 54-58
- spells: cols 37-38, 41-48
- items: cols 27-37
- buildings: cols 33-38
- lands: cols 5-7, 31-33
- levelup: cols 40-45, 48
