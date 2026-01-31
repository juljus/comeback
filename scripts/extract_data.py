#!/usr/bin/env python3
"""
Extract game data from comeback0198e.xls to CSV files.

This script extracts all game data sheets from the original Excel file
into CSV format for review and further processing.

Usage:
    python scripts/extract_data.py

Output:
    docs/extraction/raw/*.csv
"""

import csv
import os
from pathlib import Path

import xlrd

# Paths
EXCEL_FILE = Path(__file__).parent.parent / "comeback0198e.xls"
OUTPUT_DIR = Path(__file__).parent.parent / "docs" / "extraction" / "raw"


def extract_sheet_to_csv(
    workbook: xlrd.book.Book,
    sheet_name: str,
    output_name: str,
    headers: list[str] | None = None,
    skip_rows: int = 0,
    max_cols: int | None = None,
) -> int:
    """
    Extract a sheet to CSV.

    Args:
        workbook: The xlrd workbook
        sheet_name: Name of the sheet to extract
        output_name: Name for the output CSV file (without .csv)
        headers: Optional list of column headers to use
        skip_rows: Number of rows to skip at the start
        max_cols: Maximum number of columns to extract (None = all)

    Returns:
        Number of rows extracted
    """
    sheet = workbook.sheet_by_name(sheet_name)
    output_path = OUTPUT_DIR / f"{output_name}.csv"

    # Determine columns to extract
    num_cols = max_cols if max_cols else sheet.ncols

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)

        # Write headers if provided
        if headers:
            writer.writerow(headers[:num_cols])

        # Write data rows
        rows_written = 0
        for row_idx in range(skip_rows, sheet.nrows):
            row_data = []
            for col_idx in range(num_cols):
                cell = sheet.cell(row_idx, col_idx)
                value = cell.value

                # Clean up values
                if isinstance(value, float):
                    # Convert whole numbers to int
                    if value == int(value):
                        value = int(value)
                elif isinstance(value, str):
                    value = value.strip()

                row_data.append(value)

            # Skip completely empty rows
            if any(v != "" and v != 0 for v in row_data):
                writer.writerow(row_data)
                rows_written += 1

    print(f"  {output_name}.csv: {rows_written} rows, {num_cols} cols")
    return rows_written


def main():
    print(f"Opening {EXCEL_FILE}...")
    wb = xlrd.open_workbook(EXCEL_FILE)

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"\nExtracting to {OUTPUT_DIR}/\n")

    # =========================================================================
    # MOBS - Creatures with stats, abilities, spells
    # =========================================================================
    # Column mapping discovered from VBA code analysis
    mobs_headers = [
        "name",              # 0: Current name (language-dependent)
        "hp",                # 1: Hit points
        "attacks_per_round", # 2: Number of attacks per round
        "dice_count",        # 3: Damage dice count (e.g., 2 in 2d6)
        "dice_sides",        # 4: Damage dice sides (e.g., 6 in 2d6)
        "bonus_damage",      # 5: Flat damage bonus
        "strength",          # 6: Strength stat
        "dexterity",         # 7: Dexterity stat
        "power",             # 8: Power/magic stat
        "col_9",             # 9: Unknown
        "armor",             # 10: Armor value
        "col_11",            # 11: Unknown
        "col_12",            # 12: Unknown
        "col_13",            # 13: Unknown
        "col_14",            # 14: Unknown
        "col_15",            # 15: Unknown
        "col_16",            # 16: Unknown
        "col_17",            # 17: Unknown
        "col_18",            # 18: Unknown
        "col_19",            # 19: Unknown
        "col_20",            # 20: Unknown
        "col_21",            # 21: Unknown
        "col_22",            # 22: Unknown
        "col_23",            # 23: Unknown
        "col_24",            # 24: Unknown
        "col_25",            # 25: Unknown
        "col_26",            # 26: Unknown
        "col_27",            # 27: Unknown
        "col_28",            # 28: Unknown
        "col_29",            # 29: Unknown
        "merc_tier",         # 30: Mercenary price tier
        "col_31",            # 31: Unknown (merc price factor?)
        "spell_1",           # 32: Known spell 1
        "spell_2",           # 33: Known spell 2
        "spell_3",           # 34: Known spell 3
        "spell_4",           # 35: Known spell 4
        "col_36",            # 36: Unknown
        "col_37",            # 37: Unknown
        "col_38",            # 38: Unknown
        "col_39",            # 39: Unknown
        "elemental_fire",    # 40: Fire elemental damage
        "elemental_earth",   # 41: Earth elemental damage
        "elemental_air",     # 42: Air elemental damage
        "elemental_water",   # 43: Water elemental damage
        "col_44",            # 44: Unknown
        "col_45",            # 45: Unknown
        "col_46",            # 46: Unknown
        "col_47",            # 47: Unknown
        "col_48",            # 48: Unknown
        "col_49",            # 49: Unknown
        "col_50",            # 50: Unknown
        "levelup_into",      # 51: Evolution target
        "col_52",            # 52: Unknown
        "col_53",            # 53: Unknown
        "col_54",            # 54: Unknown
        "col_55",            # 55: Unknown
        "col_56",            # 56: Unknown
        "col_57",            # 57: Unknown
        "col_58",            # 58: Unknown
        "name_en",           # 59: English name
        "name_et",           # 60: Estonian name
    ]
    extract_sheet_to_csv(wb, "Mobs", "mobs", mobs_headers, max_cols=61)

    # =========================================================================
    # SPELLS - Magic abilities
    # =========================================================================
    spells_headers = [
        "name",              # 0: Current name
        "type",              # 1: Spell type (1=damage, 2=summon, 3=buff)
        "col_2",             # 2: Player 1 knows? (runtime)
        "col_3",             # 3: Player 2 knows? (runtime)
        "mana_cost",         # 4: Mana cost
        "col_5",             # 5: Player 3 knows? (runtime)
        "mana_type",         # 6: Mana type required
        "effect_type",       # 7: Effect type
        "col_8",             # 8: Unknown
        "description",       # 9: Current description
        "base_power",        # 10: Base damage/power
        "col_11",            # 11: Unknown
        "col_12",            # 12: Unknown
        "col_13",            # 13: Unknown
        "summon_1",          # 14: Summoned mob 1
        "summon_2",          # 15: Summoned mob 2
        "summon_3",          # 16: Summoned mob 3
        "summon_4",          # 17: Summoned mob 4
        "col_18",            # 18: Unknown
        "col_19",            # 19: Unknown
        "col_20",            # 20: Unknown
        "flag_1",            # 21: Flag
        "col_22",            # 22: Unknown
        "flag_2",            # 23: Flag
        "col_24",            # 24: Unknown
        "flag_3",            # 25: Flag
        "col_26",            # 26: Unknown
        "col_27",            # 27: Unknown
        "col_28",            # 28: Unknown
        "col_29",            # 29: Unknown
        "col_30",            # 30: Unknown
        "col_31",            # 31: Unknown
        "col_32",            # 32: Unknown
        "col_33",            # 33: Unknown
        "col_34",            # 34: Unknown
        "col_35",            # 35: Unknown
        "col_36",            # 36: Unknown
        "col_37",            # 37: Unknown
        "col_38",            # 38: Unknown
        "col_39",            # 39: Unknown
        "col_40",            # 40: Unknown
        "col_41",            # 41: Unknown
        "col_42",            # 42: Unknown
        "col_43",            # 43: Unknown
        "col_44",            # 44: Unknown
        "col_45",            # 45: Unknown
        "col_46",            # 46: Unknown
        "col_47",            # 47: Unknown
        "col_48",            # 48: Unknown
        "name_en",           # 49: English name
        "description_en",    # 50: English description
        "name_et",           # 51: Estonian name
        "description_et",    # 52: Estonian description
    ]
    extract_sheet_to_csv(wb, "Spells", "spells", spells_headers, max_cols=53)

    # =========================================================================
    # ITEMS - Weapons, armor, consumables
    # =========================================================================
    # Items sheet has headers in row 0, but we'll use our own cleaner names
    items_headers = [
        "name",              # 0: Name
        "type",              # 1: Item type (6=weapon, etc.)
        "dice_count",        # 2: Damage dice count
        "dice_sides",        # 3: Damage dice sides
        "value",             # 4: Price/value
        "req_strength",      # 5: Required strength
        "damage_type",       # 6: Damage type (1=pierce, 2=slash, 3=crush)
        "bonus_hp",          # 7: HP bonus
        "bonus_strength",    # 8: Strength bonus
        "bonus_dexterity",   # 9: Dexterity bonus
        "bonus_power",       # 10: Power bonus
        "bonus_armor",       # 11: Armor bonus
        "bonus_strikes",     # 12: Extra attacks
        "grants_spell",      # 13: Spell granted by item
        "bonus_healing",     # 14: Healing bonus
        "bonus_speed",       # 15: Speed bonus
        "mana_fire",         # 16: Fire mana bonus
        "mana_earth",        # 17: Earth mana bonus
        "mana_air",          # 18: Air mana bonus
        "mana_water",        # 19: Water mana bonus
        "mana_death",        # 20: Death mana bonus
        "mana_life",         # 21: Life mana bonus
        "mana_arcane",       # 22: Arcane mana bonus
        "damage_fire",       # 23: Fire damage bonus
        "damage_earth",      # 24: Earth damage bonus
        "damage_air",        # 25: Air damage bonus
        "damage_water",      # 26: Water damage bonus
        "col_27",            # 27: Unknown
        "col_28",            # 28: Unknown
        "col_29",            # 29: Unknown
        "col_30",            # 30: Unknown
        "col_31",            # 31: Unknown
        "col_32",            # 32: Unknown
        "col_33",            # 33: Unknown
        "col_34",            # 34: Unknown
        "col_35",            # 35: Unknown
        "col_36",            # 36: Unknown
        "col_37",            # 37: Unknown
        "name_en",           # 38: English name
        "name_et",           # 39: Estonian name
    ]
    extract_sheet_to_csv(wb, "Items", "items", items_headers, skip_rows=1, max_cols=40)

    # =========================================================================
    # BUILDINGS - Structures that can be built on land
    # =========================================================================
    buildings_headers = [
        "name",              # 0: Current name
        "prereq_1",          # 1: Prerequisite building 1
        "prereq_2",          # 2: Prerequisite building 2
        "prereq_3",          # 3: Prerequisite building 3
        "prereq_4",          # 4: Prerequisite building 4
        "cost",              # 5: Build cost
        "col_6",             # 6: Unknown
        "col_7",             # 7: Unknown
        "grants_spell_1",    # 8: Spell granted 1
        "grants_spell_2",    # 9: Spell granted 2
        "col_10",            # 10: Unknown
        "col_11",            # 11: Unknown
        "col_12",            # 12: Unknown
        "col_13",            # 13: Unknown
        "col_14",            # 14: Unknown
        "col_15",            # 15: Unknown
        "col_16",            # 16: Unknown
        "col_17",            # 17: Unknown
        "col_18",            # 18: Unknown
        "unlocks_merc_1",    # 19: Mercenary unlocked 1
        "unlocks_merc_2",    # 20: Mercenary unlocked 2
        "col_21",            # 21: Unknown
        "col_22",            # 22: Unknown
        "col_23",            # 23: Unknown
        "col_24",            # 24: Unknown
        "col_25",            # 25: Unknown
        "col_26",            # 26: Unknown
        "col_27",            # 27: Unknown
        "col_28",            # 28: Unknown
        "col_29",            # 29: Unknown
        "col_30",            # 30: Unknown
        "col_31",            # 31: Unknown
        "col_32",            # 32: Unknown
        "col_33",            # 33: Unknown
        "col_34",            # 34: Unknown
        "col_35",            # 35: Unknown
        "col_36",            # 36: Unknown
        "col_37",            # 37: Unknown
        "col_38",            # 38: Unknown
        "name_en",           # 39: English name
        "name_et",           # 40: Estonian name
    ]
    extract_sheet_to_csv(wb, "Buildings", "buildings", buildings_headers, max_cols=41)

    # =========================================================================
    # MAP_DEFAULTS - Land types and their properties
    # =========================================================================
    lands_headers = [
        "name_short",        # 0: Short name
        "name_long",         # 1: Long name
        "price",             # 2: Purchase price
        "tax_income",        # 3: Tax income
        "healing",           # 4: Healing value when resting
        "col_5",             # 5: Unknown
        "col_6",             # 6: Unknown
        "col_7",             # 7: Unknown
        "defender_1",        # 8: Tier 1 defender (mob name)
        "defender_2",        # 9: Tier 2 defender
        "defender_3",        # 10: Tier 3 defender
        "defender_4",        # 11: Tier 4 defender
        "spawn_chance",      # 12: Chance to appear on map
        "building_1",        # 13: Available building 1
        "building_2",        # 14: Available building 2
        "building_3",        # 15: Available building 3
        "building_4",        # 16: Available building 4
        "building_5",        # 17: Available building 5
        "building_6",        # 18: Available building 6
        "building_7",        # 19: Available building 7
        "building_8",        # 20: Available building 8
        "building_9",        # 21: Available building 9
        "building_10",       # 22: Available building 10
        "building_11",       # 23: Available building 11
        "building_12",       # 24: Available building 12
        "col_25",            # 25: "Buildings without castle"
        "col_26",            # 26: Unknown
        "name_short_en",     # 27: English short name
        "name_long_en",      # 28: English long name
        "name_short_et",     # 29: Estonian short name
        "name_long_et",      # 30: Estonian long name
        "col_31",            # 31: Unknown
        "col_32",            # 32: Unknown
        "col_33",            # 33: Unknown
    ]
    extract_sheet_to_csv(wb, "Map_defaults", "lands", lands_headers, skip_rows=1, max_cols=34)

    # =========================================================================
    # LEVELUP - Pet/summon evolution paths
    # =========================================================================
    levelup_headers = [
        "name",              # 0: Current name
        "hp_bonus",          # 1: HP gained
        "col_2",             # 2: Unknown
        "col_3",             # 3: Unknown
        "col_4",             # 4: Unknown
        "col_5",             # 5: Unknown
        "col_6",             # 6: Unknown
        "col_7",             # 7: Unknown
        "col_8",             # 8: Unknown
        "col_9",             # 9: Unknown
        "col_10",            # 10: Unknown
        "col_11",            # 11: Unknown
        "col_12",            # 12: Unknown
        "col_13",            # 13: Unknown
        "col_14",            # 14: Unknown
        "col_15",            # 15: Unknown
        "col_16",            # 16: Unknown
        "col_17",            # 17: Unknown
        "col_18",            # 18: Unknown
        "col_19",            # 19: Unknown
        "col_20",            # 20: Unknown
        "learns_spell_1",    # 21: Spell learned on evolution 1
        "learns_spell_2",    # 22: Spell learned on evolution 2
        "learns_spell_3",    # 23: Spell learned on evolution 3
        "learns_spell_4",    # 24: Spell learned on evolution 4
        "col_25",            # 25: Unknown
        "col_26",            # 26: Unknown
        "col_27",            # 27: Unknown
        "col_28",            # 28: Unknown
        "col_29",            # 29: Unknown
        "col_30",            # 30: Unknown
        "col_31",            # 31: Unknown
        "col_32",            # 32: Unknown
        "col_33",            # 33: Unknown
        "col_34",            # 34: Unknown
        "col_35",            # 35: Unknown
        "col_36",            # 36: Unknown
        "col_37",            # 37: Unknown
        "col_38",            # 38: Unknown
        "col_39",            # 39: Unknown
        "col_40",            # 40: Unknown
        "col_41",            # 41: Unknown
        "col_42",            # 42: Unknown
        "col_43",            # 43: Unknown
        "col_44",            # 44: Unknown
        "col_45",            # 45: Unknown
        "col_46",            # 46: Unknown
        "evolves_into",      # 47: What this evolves into
        "col_48",            # 48: Unknown
        "name_en",           # 49: English name
        "name_et",           # 50: Estonian name
    ]
    extract_sheet_to_csv(wb, "Levelup", "levelup", levelup_headers, max_cols=51)

    # =========================================================================
    # EFFECTS - Status effects
    # =========================================================================
    # Effects sheet is small and structure unclear, extract as-is
    effects_headers = [f"col_{i}" for i in range(11)]
    extract_sheet_to_csv(wb, "Effects", "effects", effects_headers, max_cols=11)

    # =========================================================================
    # HELP - Game manual text
    # =========================================================================
    help_headers = ["text_col_1", "text_col_2"]
    extract_sheet_to_csv(wb, "Help", "help", help_headers, max_cols=2)

    # =========================================================================
    # LAN1 - English UI strings
    # =========================================================================
    strings_en_headers = ["string"]
    extract_sheet_to_csv(wb, "Lan1", "strings_en", strings_en_headers, max_cols=1)

    # =========================================================================
    # LAN2 - Estonian UI strings (with grammatical forms)
    # =========================================================================
    strings_et_headers = ["string", "col_1", "col_2", "col_3", "col_4", "col_5", "col_6", "col_7", "col_8"]
    extract_sheet_to_csv(wb, "Lan2", "strings_et", strings_et_headers, max_cols=9)

    # =========================================================================
    # EVENTS - Random events
    # =========================================================================
    event_headers = [f"col_{i}" for i in range(10)]
    extract_sheet_to_csv(wb, "event", "events", event_headers, max_cols=10)

    print("\nExtraction complete!")
    print(f"\nFiles saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
