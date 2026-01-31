#!/usr/bin/env python3
"""
Convert extracted CSV data to JSON files matching TypeScript types.

Only includes confirmed columns - unknown col_N fields are skipped.

Usage:
    python scripts/convert_to_json.py

Output:
    data/*.json
"""

import csv
import json
from pathlib import Path

# Paths
CSV_DIR = Path(__file__).parent.parent / "docs" / "extraction" / "raw"
OUTPUT_DIR = Path(__file__).parent.parent / "data"


def read_csv(filename: str) -> list[dict]:
    """Read CSV file and return list of row dicts."""
    with open(CSV_DIR / filename, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def clean_string(val: str) -> str:
    """Clean string value. Treat '0' as empty for reference fields."""
    if not val:
        return ""
    val = val.strip()
    # "0" often means "none" in the original data
    if val == "0":
        return ""
    return val


def clean_int(val: str, default: int = 0) -> int:
    """Convert to int, return default if empty/invalid."""
    if not val or val == "":
        return default
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return default


def clean_float(val: str, default: float = 0.0) -> float:
    """Convert to float, return default if empty/invalid."""
    if not val or val == "":
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def convert_mobs():
    """Convert mobs.csv to mobs.json"""
    rows = read_csv("mobs.csv")
    mobs = []

    for i, row in enumerate(rows):
        mob = {
            "id": i,
            "name": {
                "en": clean_string(row.get("name_en", "")),
                "et": clean_string(row.get("name_et", "")),
            },
            "hp": clean_int(row.get("hp")),
            "attacksPerRound": clean_int(row.get("attacks_per_round"), 1),
            "armor": clean_int(row.get("armor")),
            "damage": {
                "diceCount": clean_int(row.get("dice_count"), 1),
                "diceSides": clean_int(row.get("dice_sides"), 4),
                "bonus": clean_int(row.get("bonus_damage")),
            },
            "stats": {
                "strength": clean_int(row.get("strength"), 1),
                "dexterity": clean_int(row.get("dexterity"), 1),
                "power": clean_int(row.get("power"), 1),
            },
            "spells": [
                clean_string(row.get("spell_1", "")),
                clean_string(row.get("spell_2", "")),
                clean_string(row.get("spell_3", "")),
                clean_string(row.get("spell_4", "")),
            ],
            "elementalDamage": {
                "fire": clean_int(row.get("elemental_fire")),
                "earth": clean_int(row.get("elemental_earth")),
                "air": clean_int(row.get("elemental_air")),
                "water": clean_int(row.get("elemental_water")),
            },
            "mercTier": clean_int(row.get("merc_tier")),
            "evolvesInto": clean_string(row.get("levelup_into", "")),
        }
        mobs.append(mob)

    return mobs


def convert_spells():
    """Convert spells.csv to spells.json"""
    rows = read_csv("spells.csv")

    # Mana type mapping
    mana_types = {
        4: "fire",
        5: "earth",
        6: "air",
        7: "water",
        8: "death",
        9: "life",
        10: "arcane",
    }

    # Spell type mapping
    spell_types = {
        1: "damage",
        2: "summon",
        3: "buff",
    }

    # Effect type mapping
    effect_types = {
        0: "utility",
        8: "summon",
        11: "singleTarget",
        12: "aoe",
    }

    spells = []

    for i, row in enumerate(rows):
        mana_type_val = clean_int(row.get("mana_type"))
        spell_type_val = clean_int(row.get("type"), 1)
        effect_type_val = clean_int(row.get("effect_type"))

        spell = {
            "id": i,
            "name": {
                "en": clean_string(row.get("name_en", "")),
                "et": clean_string(row.get("name_et", "")),
            },
            "description": {
                "en": clean_string(row.get("description_en", "")),
                "et": clean_string(row.get("description_et", "")),
            },
            "type": spell_types.get(spell_type_val, "damage"),
            "manaCost": clean_int(row.get("mana_cost")),
            "manaType": mana_types.get(mana_type_val, "arcane"),
            "basePower": clean_int(row.get("base_power")),
            "summons": [
                clean_string(row.get("summon_1", "")),
                clean_string(row.get("summon_2", "")),
                clean_string(row.get("summon_3", "")),
                clean_string(row.get("summon_4", "")),
            ],
            "effectType": effect_types.get(effect_type_val, "utility"),
        }
        spells.append(spell)

    return spells


def convert_items():
    """Convert items.csv to items.json"""
    rows = read_csv("items.csv")

    # Item type mapping
    item_types = {
        1: "consumable",
        2: "armor",
        3: "accessory",
        4: "unknown",
        5: "unknown",
        6: "weapon",
    }

    # Damage type mapping
    damage_types = {
        1: "pierce",
        2: "slash",
        3: "crush",
    }

    items = []

    for i, row in enumerate(rows):
        item_type_val = clean_int(row.get("type"))
        damage_type_val = clean_int(row.get("damage_type"), 1)

        item = {
            "id": i,
            "name": {
                "en": clean_string(row.get("name_en", "")),
                "et": clean_string(row.get("name_et", "")),
            },
            "type": item_types.get(item_type_val, "unknown"),
            "value": clean_int(row.get("value")),
            "requiredStrength": clean_int(row.get("req_strength")),
            "bonuses": {
                "hp": clean_int(row.get("bonus_hp")),
                "strength": clean_int(row.get("bonus_strength")),
                "dexterity": clean_int(row.get("bonus_dexterity")),
                "power": clean_int(row.get("bonus_power")),
                "armor": clean_int(row.get("bonus_armor")),
                "strikes": clean_int(row.get("bonus_strikes")),
                "healing": clean_int(row.get("bonus_healing")),
                "speed": clean_int(row.get("bonus_speed")),
            },
            "manaBonus": {
                "fire": clean_int(row.get("mana_fire")),
                "earth": clean_int(row.get("mana_earth")),
                "air": clean_int(row.get("mana_air")),
                "water": clean_int(row.get("mana_water")),
                "death": clean_int(row.get("mana_death")),
                "life": clean_int(row.get("mana_life")),
                "arcane": clean_int(row.get("mana_arcane")),
            },
            "elementalDamage": {
                "fire": clean_int(row.get("damage_fire")),
                "earth": clean_int(row.get("damage_earth")),
                "air": clean_int(row.get("damage_air")),
                "water": clean_int(row.get("damage_water")),
            },
            "grantsSpell": clean_string(row.get("grants_spell", "")),
        }

        # Add weapon-specific fields only for weapons
        if item["type"] == "weapon":
            item["weapon"] = {
                "diceCount": clean_int(row.get("dice_count"), 1),
                "diceSides": clean_int(row.get("dice_sides"), 4),
                "damageType": damage_types.get(damage_type_val, "pierce"),
            }

        items.append(item)

    return items


def convert_buildings():
    """Convert buildings.csv to buildings.json"""
    rows = read_csv("buildings.csv")
    buildings = []

    for i, row in enumerate(rows):
        # Collect non-empty prerequisites
        prereqs = []
        for j in range(1, 5):
            p = clean_string(row.get(f"prereq_{j}", ""))
            if p:
                prereqs.append(p)

        # Collect non-empty granted spells
        spells = []
        for j in range(1, 3):
            s = clean_string(row.get(f"grants_spell_{j}", ""))
            if s:
                spells.append(s)

        # Collect non-empty mercenaries
        mercs = []
        for j in range(1, 3):
            m = clean_string(row.get(f"unlocks_merc_{j}", ""))
            if m:
                mercs.append(m)

        building = {
            "id": i,
            "name": {
                "en": clean_string(row.get("name_en", "")),
                "et": clean_string(row.get("name_et", "")),
            },
            "cost": clean_int(row.get("cost")),
            "prerequisites": prereqs,
            "grantsSpells": spells,
            "unlocksMercenaries": mercs,
        }
        buildings.append(building)

    return buildings


def convert_lands():
    """Convert lands.csv to lands.json"""
    rows = read_csv("lands.csv")
    lands = []

    for i, row in enumerate(rows):
        # Collect non-empty available buildings
        buildings = []
        for j in range(1, 13):
            b = clean_string(row.get(f"building_{j}", ""))
            if b:
                buildings.append(b)

        price = clean_int(row.get("price"))
        tax_income = clean_int(row.get("tax_income"))
        defender_1 = clean_string(row.get("defender_1", ""))

        # Utility lands have no tax income and "Jumal" (God) as defenders
        # meaning they cannot be conquered
        is_utility = tax_income == 0 and defender_1 == "Jumal"

        land = {
            "id": i,
            "name": {
                "short": {
                    "en": clean_string(row.get("name_short_en", "")),
                    "et": clean_string(row.get("name_short_et", "")),
                },
                "long": {
                    "en": clean_string(row.get("name_long_en", "")),
                    "et": clean_string(row.get("name_long_et", "")),
                },
            },
            "price": price,
            "taxIncome": tax_income,
            "healing": clean_int(row.get("healing")),
            "defenders": [
                defender_1,
                clean_string(row.get("defender_2", "")),
                clean_string(row.get("defender_3", "")),
                clean_string(row.get("defender_4", "")),
            ],
            "spawnChance": clean_int(row.get("spawn_chance")),
            "availableBuildings": buildings,
            "isUtility": is_utility,
        }
        lands.append(land)

    return lands


def write_json(data: list, filename: str):
    """Write data to JSON file with nice formatting."""
    output_path = OUTPUT_DIR / filename
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  {filename}: {len(data)} entries")


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Converting CSV to JSON...\n")

    # Convert each entity type
    write_json(convert_mobs(), "mobs.json")
    write_json(convert_spells(), "spells.json")
    write_json(convert_items(), "items.json")
    write_json(convert_buildings(), "buildings.json")
    write_json(convert_lands(), "lands.json")

    print(f"\nDone! Files saved to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
