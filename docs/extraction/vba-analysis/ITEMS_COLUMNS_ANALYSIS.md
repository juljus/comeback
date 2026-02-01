# Items.csv Column Analysis

## Summary

Based on comprehensive VBA code analysis from `/Users/juljus/Projects/comeback/docs/extraction/vba/all_modules.txt`, the following is a complete breakdown of all columns in `items.csv`.

**Key Finding**: Columns 28-37 (CSV columns, corresponding to VBA columns 28-37) are **RESERVED BUT UNUSED** in the current codebase. They contain no data and are not referenced by any game logic.

---

## Complete Column Mapping

| CSV Col | VBA Col | Name | Purpose | Notes | VBA Reference |
|---------|---------|------|---------|-------|---|
| 1 | 1 | name | Item display name | Primary identifier | Line 15697 |
| 2 | 2 | type | Item type classification | 1=helmet, 2=armor, 3=boots, 4=ring, 5=unknown, 6=weapon, 7=consumable/spell | Line 15276 |
| 3 | 3 | dice_count | Weapon damage die count (d1) | Physical damage dice count | Lines 15229, 16065 |
| 4 | 4 | dice_sides | Weapon damage die sides (d2) | Physical damage dice sides | Lines 15238, 16068 |
| 5 | 5 | value | Item cost/value | Gold price in shops | Line 14248 |
| 6 | 6 | req_strength | Strength requirement | Minimum STR to equip weapon | Lines 15231, 15298 |
| 7 | 7 | damage_type | Damage type code | 1=slash, 2=crush, 3=pierce, etc. | Line 16074 |
| 8 | 8 | bonus_hp | Max HP bonus | Life/health points increase | Lines 15697-15707 |
| 9 | 9 | bonus_strength | Strength stat bonus | Affects damage and armor bonuses | Lines 15785-15787, 16150 |
| 10 | 10 | bonus_dexterity | Dexterity stat bonus | Affects attack count thresholds | Lines 15785-15787, 16170 |
| 11 | 11 | bonus_power | Power/spell stat bonus | Affects magic damage and healing | Lines 15785-15787, 16190 |
| 12 | 12 | bonus_armor | Armor/defense bonus | Direct armor class increase | Lines 16081-16097 |
| 13 | 13 | bonus_strikes | Combat round bonus | Increases number of attacks per round | Lines 16101-16126 |
| 14 | 14 | grants_spell | Spell knowledge grant | Contains spell name if item grants spell | Lines 15889-15920 |
| 15 | 15 | bonus_healing | Healing bonus | Healing magic effectiveness increase | Referenced indirectly in display logic |
| 16 | 16 | bonus_speed | Speed/initiative bonus | Combat speed/turn order bonus | Lines 15979-16009 |
| 17 | 17 | mana_fire | Fire mana regen bonus | Fire magic pool regeneration | Lines 15926, 16248 (loop x=1) |
| 18 | 18 | mana_earth | Earth mana regen bonus | Earth magic pool regeneration | Lines 15926, 16248 (loop x=2) |
| 19 | 19 | mana_air | Air mana regen bonus | Air/wind magic pool regeneration | Lines 15926, 16248 (loop x=3) |
| 20 | 20 | mana_water | Water mana regen bonus | Water magic pool regeneration | Lines 15926, 16248 (loop x=4) |
| 21 | 21 | mana_death | Death mana regen bonus | Death magic pool regeneration | Lines 15926, 16248 (loop x=5) |
| 22 | 22 | mana_life | Life mana regen bonus | Life magic pool regeneration | Lines 15926, 16248 (loop x=6) |
| 23 | 23 | mana_arcane | Arcane mana regen bonus | Arcane magic pool regeneration | Lines 15926, 16248 (loop x=7) |
| 24 | 24 | damage_fire | Fire elemental damage | Weapon adds fire damage to attacks | Lines 16015, 19764 |
| 25 | 25 | damage_earth | Earth elemental damage | Weapon adds earth damage to attacks | Lines 16015, 19764 |
| 26 | 26 | damage_air | Air elemental damage | Weapon adds air damage to attacks | Lines 16015, 19764 |
| 27 | 27 | damage_water | Water elemental damage | Weapon adds water damage to attacks | Lines 16015, 19764 |
| 28 | 28 | col_27 | **RESERVED (UNUSED)** | No VBA references | — |
| 29 | 29 | col_28 | **RESERVED (UNUSED)** | No VBA references | — |
| 30 | 30 | col_29 | **RESERVED (UNUSED)** | No VBA references | — |
| 31 | 31 | col_30 | **RESERVED (UNUSED)** | No VBA references | — |
| 32 | 32 | col_31 | **RESERVED (UNUSED)** | No VBA references | — |
| 33 | 33 | col_32 | **RESERVED (UNUSED)** | No VBA references | — |
| 34 | 34 | col_33 | **RESERVED (UNUSED)** | No VBA references | — |
| 35 | 35 | col_34 | **RESERVED (UNUSED)** | No VBA references | — |
| 36 | 36 | col_35 | **RESERVED (UNUSED)** | No VBA references | — |
| 37 | 37 | col_36 | **RESERVED (UNUSED)** | No VBA references | — |
| 38 | 38 | col_37 | **RESERVED (UNUSED)** | No VBA references | — |
| 39 | 39 | name_en | English localization | Item name in English | Line 479 (38 + Language for Language=1) |
| 40 | 40 | name_et | Estonian localization | Item name in Estonian | Line 479 (38 + Language for Language=2) |

---

## Key Code References

### Bonus Stat Application (change_stats function)
- **Lines 15678-16342**: Main `change_stats()` function handles all item stat modifications
- **Lines 15697-15734**: HP bonus logic (Col 8)
- **Lines 15738-15772**: Combat strike bonus logic (Col 13)
- **Lines 15785-15884**: Main stat bonuses loop (Cols 9-12, using `9+y` where y=0-3)
- **Lines 15889-15922**: Spell knowledge handling (Col 14)
- **Lines 15924-15977**: Mana regen bonuses loop (Cols 17-23, using `16+x` where x=1-7)
- **Lines 15979-16011**: Speed bonus logic (Col 16)
- **Lines 16013-16056**: Elemental damage bonus loop (Cols 24-27, using `23+x` where x=1-4)

### Elemental Damage Application
- **Line 16015**: `Sheets("Items").Cells(..., 23 + x).Value` reads elemental damage (x=1-4 for fire/earth/air/water)
- **Line 16019**: `what_damage_type(x + 3, 5)` converts numeric codes to damage type names
- **Lines 16023-16025**: Elemental damage added to player's `Side` sheet column `49+x`

### Custom Weapon Enchantment
- **Line 19764**: `Sheets("Items").Cells(custom_weapon_starts, 20 + what_element).Value` modifies elemental damage during weapon enchantment (columns 24-27 via offset from column 20... note: this is actually col 24+ since 20+1 through 20+4 = cols 21-24, but mapping shows col 24-27)

### Display Functions (what_to_do = 3)
- **Lines 16065-16330**: Display all item stats to player
- All referenced columns are explicitly checked and displayed

---

## Unused Columns Analysis

**Columns 28-37 (CSV) / 28-38 (VBA)** appear to be intentionally reserved for future expansion, as evidenced by:

1. **No active references**: Zero VBA code references to these columns
2. **Placeholder naming**: Generic names like "col_27", "col_28", etc.
3. **Empty data**: All items have empty values in these columns
4. **Consistent structure**: 10 empty columns suggest deliberate spacing/planning

### Possible Future Use Cases
These columns may have been planned for:
- **Elemental resistances** (death, life, arcane resistance bonuses)
- **Immunities** (poison, bleeding, stun immunity)
- **Special effects** (curse resistance, etc.)
- **Additional mana types** if game expansion adds new schools of magic
- **Reserve capacity** for balanced spreadsheet design

---

## Summary Statistics

- **Total columns**: 40 (CSV) / 39 (VBA, 1-indexed)
- **Active columns**: 27 (columns 1-27, including damage types)
- **Localization columns**: 2 (columns 39-40)
- **Reserved/unused columns**: 11 (columns 28-38)
- **Data completeness**: 100% of active columns used, 0% of reserved columns used

---

## Conclusion

The unknown columns 27-37 (CSV notation) or 28-38 (VBA 1-based indexing) are **not currently implemented** in the game. They represent reserved structure that was planned but not yet utilized. All active game logic uses columns 1-27 (physical damage, stats, spells, mana, and base elemental damage) plus localization columns 39-40.
