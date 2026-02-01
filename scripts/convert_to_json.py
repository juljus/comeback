#!/usr/bin/env python3
"""
Convert extracted CSV data to JSON files matching TypeScript types.

Based on VBA research and Excel column headers (found in mobs.csv row 130).

Usage:
    python scripts/convert_to_json.py

Output:
    app/data/*.json
"""

import csv
import json
from pathlib import Path

# Paths
CSV_DIR = Path(__file__).parent.parent / "docs" / "extraction" / "raw"
OUTPUT_DIR = Path(__file__).parent.parent / "app" / "data"


def read_csv(filename: str) -> list[dict]:
    """Read CSV file and return list of row dicts, filtering out header rows."""
    with open(CSV_DIR / filename, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    # Filter out any rows that look like headers (name_en = "English Name" etc)
    return [r for r in rows if r.get("name_en") != "English Name" and r.get("name") != "Name"]


def clean_string(val: str) -> str:
    """Clean string value."""
    if not val:
        return ""
    val = val.strip()
    return val


def clean_string_or_empty(val: str) -> str:
    """Clean string value. Treat '0' as empty for reference fields."""
    if not val:
        return ""
    val = val.strip()
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


def convert_mobs():
    """
    Convert mobs.csv to mobs.json

    Column mappings (from Excel header row):
    - 0: name (Estonian)
    - 1: hp (hits)
    - 2: attacks_per_round (attacks)
    - 3: dice_count (d1)
    - 4: dice_sides (d2)
    - 5: bonus_damage (Dam_Type) - actually damage type
    - 6: strength (Str)
    - 7: dexterity (Dex)
    - 8: power (Power)
    - 9: col_9 = ARMOR (the real armor column!)
    - 10: armor = Gallantry (AI behavior 1) - MISLABELED!
    - 11: col_11 = Obedience (AI behavior 2)
    - 12: col_12 = Bravery (AI behavior 3)
    - 13: col_13 = Relative Str (unused)
    - 14: col_14 = (unused)
    - 15-21: Mana pools (Fire, Earth, Air, Water, Death, Life, Arcane)
    - 22-28: Mana regen (Fire+, Earth+, Air+, Water+, Death+, Life+, Arcane+)
    - 29: col_29 = Building flag
    - 30: merc_tier = Cost to Hire
    - 31: col_31 = Spells flag (has spells)
    - 32-35: spell_1-4 = Known spells
    - 36-39: col_36-39 = Spell knowledge levels
    - 40-43: elemental damage (Fire, Poison/Earth, Air, Cold/Water)
    - 44-49: col_44-49 = Immunities (Fire, Lightning, Cold, Poison, Bleed, Stun)
    - 50: col_50 = evolves_into (Estonian text)
    - 51: levelup_into = Pet type flag
    - 52: col_52 = Spell level bonus
    - 59-60: name_en, name_et
    """
    rows = read_csv("mobs.csv")
    mobs = []

    # Damage type mapping (from bonus_damage column which is actually damage type)
    damage_types = {0: "crush", 1: "pierce", 2: "slash"}

    for i, row in enumerate(rows):
        damage_type_val = clean_int(row.get("bonus_damage"))

        # Filter non-empty spells
        spells = []
        for j in range(1, 5):
            s = clean_string_or_empty(row.get(f"spell_{j}", ""))
            if s:
                spells.append(s)

        mob = {
            "id": i,
            "name": {
                "en": clean_string(row.get("name_en", "")),
                "et": clean_string(row.get("name_et", "")),
            },
            "hp": clean_int(row.get("hp")),
            "attacksPerRound": clean_int(row.get("attacks_per_round"), 1),
            # col_9 is the REAL armor column (not the mislabeled "armor" which is AI behavior)
            "armor": clean_int(row.get("col_9")),
            "damage": {
                "diceCount": clean_int(row.get("dice_count"), 1),
                "diceSides": clean_int(row.get("dice_sides"), 4),
            },
            "stats": {
                "strength": clean_int(row.get("strength"), 1),
                "dexterity": clean_int(row.get("dexterity"), 1),
                "power": clean_int(row.get("power"), 1),
            },
            "damageType": damage_types.get(damage_type_val, "crush"),
            # AI Behavior (the mislabeled "armor" column is actually AI gallantry!)
            "aiBehavior": {
                "gallantry": clean_int(row.get("armor")),  # Mislabeled as "armor"
                "obedience": clean_int(row.get("col_11")),
                "bravery": clean_int(row.get("col_12")),
            },
            # Mana pools (cols 15-21: Fire, Earth, Air, Water, Death, Life, Arcane)
            "mana": {
                "fire": clean_int(row.get("col_15")),
                "earth": clean_int(row.get("col_16")),
                "air": clean_int(row.get("col_17")),
                "water": clean_int(row.get("col_18")),
                "death": clean_int(row.get("col_19")),
                "life": clean_int(row.get("col_20")),
                "arcane": clean_int(row.get("col_21")),
            },
            # Mana regen (cols 22-28)
            "manaRegen": {
                "fire": clean_int(row.get("col_22")),
                "earth": clean_int(row.get("col_23")),
                "air": clean_int(row.get("col_24")),
                "water": clean_int(row.get("col_25")),
                "death": clean_int(row.get("col_26")),
                "life": clean_int(row.get("col_27")),
                "arcane": clean_int(row.get("col_28")),
            },
            "mercTier": clean_int(row.get("merc_tier")),
            "hasSpells": clean_int(row.get("col_31")) > 0,
            "spells": spells,
            # Elemental damage (Fire, Poison, Air, Cold)
            "elementalDamage": {
                "fire": clean_int(row.get("elemental_fire")),
                "poison": clean_int(row.get("elemental_earth")),  # Actually poison damage
                "air": clean_int(row.get("elemental_air")),
                "cold": clean_int(row.get("elemental_water")),  # Actually cold damage
            },
            # Immunities (cols 44-49)
            "immunities": {
                "fire": clean_int(row.get("col_44")),
                "lightning": clean_int(row.get("col_45")),
                "cold": clean_int(row.get("col_46")),
                "poison": clean_int(row.get("col_47")),
                "bleeding": clean_int(row.get("col_48")),
                "stun": clean_int(row.get("col_49")),
            },
            "spellLevelBonus": clean_int(row.get("col_52")),
        }

        # Only add evolvesInto if present (from col_50 or levelup_into)
        evolves = clean_string_or_empty(row.get("col_50", "")) or clean_string_or_empty(row.get("levelup_into", ""))
        if evolves:
            mob["evolvesInto"] = evolves

        mobs.append(mob)

    return mobs


def convert_spells():
    """
    Convert spells.csv to spells.json

    Corrected column mappings (based on raw data analysis):
    - 0: name (Estonian)
    - 1: type (1=damage, 2=summon, 3=buff)
    - 2-5: Player knowledge levels (runtime, skip)
    - 6: mana_type (4=fire, 5=earth, 6=air, 7=water, 8=death, 9=life, 10=arcane)
    - 7: effect_type (0=utility, 8=summon, 11=singleTarget, 12=aoe)
    - 8: col_8 = MANA COST (not mana_cost field!)
    - 9: description
    - 10: base_power
    - 11: col_11 = generates_gold
    - 12: col_12 = generates_item
    - 13: col_13 = summon_creature_1 (first summon creature!)
    - 14-17: summon_1-4 = summon creatures 2-5
    - 18-22: col_18-22 = summon counts 1-5
    - 21-29: targeting flags
    - 30-35: effect flags
    - 49-52: localized names and descriptions
    """
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

        # Summon creatures are in col_13, summon_1, summon_2, summon_3, summon_4
        summon_creatures = [
            clean_string_or_empty(row.get("col_13", "")),
            clean_string_or_empty(row.get("summon_1", "")),
            clean_string_or_empty(row.get("summon_2", "")),
            clean_string_or_empty(row.get("summon_3", "")),
            clean_string_or_empty(row.get("summon_4", "")),
        ]
        # Filter empty and numeric-only strings
        summons = [s for s in summon_creatures if s and not s.isdigit()]

        # Summon counts are in summon_4, col_18, col_19, col_20, col_21
        summon_counts = [
            clean_int(row.get("summon_4") if not row.get("summon_4", "").isalpha() else "1", 1),
            clean_int(row.get("col_18"), 1),
            clean_int(row.get("col_19"), 1),
            clean_int(row.get("col_20"), 1),
            clean_int(row.get("col_21"), 1),
        ]

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
            # CORRECT: mana cost is in col_8, not mana_cost field
            "manaCost": clean_int(row.get("col_8")),
            "manaType": mana_types.get(mana_type_val, "arcane"),
            "basePower": clean_int(row.get("base_power")),
            "summons": summons,
            "effectType": effect_types.get(effect_type_val, "utility"),
            # Effect flags
            "effects": {
                "generatesGold": clean_int(row.get("col_11")) > 0,
                "generatesItem": clean_int(row.get("col_12")) > 0,
                "isSummon": spell_type_val == 2 or len(summons) > 0,
                "hasHeal": clean_int(row.get("col_30")) > 0,
                "hasArmorBuff": clean_int(row.get("col_31")) > 0,
                "hasHaste": clean_int(row.get("col_32")) > 0,
                "hasStrengthBuff": clean_int(row.get("col_33")) > 0,
                "hasWindEffect": clean_int(row.get("col_36")) > 0,
                "vampiricPercent": clean_int(row.get("col_37")),
            },
            # Targeting flags
            "targeting": {
                "isAggressive": clean_int(row.get("flag_1")) > 0,
                "canTargetFriendly": clean_int(row.get("col_22")) > 0,
                "canTargetHostile": clean_int(row.get("flag_2")) > 0,
                "canTargetGroup": clean_int(row.get("col_24")) > 0,
                "canTargetSingle": clean_int(row.get("flag_3")) > 0,
                "canTargetLand": clean_int(row.get("col_26")) > 0,
                "canTargetPlayer": clean_int(row.get("col_28")) > 0,
                "hasGlobalRange": clean_int(row.get("col_29")) > 0,
            },
        }

        # Build summonTiers if this is a summon spell
        if len(summons) > 0:
            tiers = []
            for j, creature in enumerate(summons):
                if j < len(summon_counts):
                    tiers.append({"creature": creature, "count": summon_counts[j]})
            if tiers:
                spell["summonTiers"] = tiers

        spells.append(spell)

    return spells


def convert_items():
    """Convert items.csv to items.json"""
    rows = read_csv("items.csv")

    # Item type mapping
    item_types = {
        1: "helm",
        2: "armor",
        3: "boots",
        4: "ring",
        6: "weapon",
        7: "consumable",
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
            "type": item_types.get(item_type_val, "consumable"),
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
            "grantsSpell": clean_string_or_empty(row.get("grants_spell", "")),
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
    """
    Convert buildings.csv to buildings.json

    Column mappings (from columns.md):
    - 0: name
    - 1-4: prereq_1-4
    - 5: cost
    - 6: build_time (always 1)
    - 7: col_7 = fortification_level
    - 8-9: grants_spell_1-2
    - 10-11: spell land type restrictions
    - 12-18: mana regen bonuses (fire, earth, air, water, life, death, arcane)
    - 19-20: unlocks_merc_1-2
    - 21: col_21 = archery_slots
    - 22: col_22 = castle_defender
    - 23: col_23 = gate_defense
    - 24: col_24 = healing_bonus
    - 25: col_25 = income_bonus
    - 26: col_26 = combat_rounds_bonus
    - 27: col_27 = portal_flag
    - 28: col_28 = bank_flag
    - 29-31: col_29-31 = stat bonuses (STR, DEX, POW)
    - 32: col_32 = spell_level_bonus
    """
    rows = read_csv("buildings.csv")
    buildings = []

    for i, row in enumerate(rows):
        # Collect non-empty prerequisites
        prereqs = []
        for j in range(1, 5):
            p = clean_string_or_empty(row.get(f"prereq_{j}", ""))
            if p:
                prereqs.append(p)

        # Collect non-empty granted spells
        spells = []
        for j in range(1, 3):
            s = clean_string_or_empty(row.get(f"grants_spell_{j}", ""))
            if s:
                spells.append(s)

        # Collect non-empty mercenaries
        mercs = []
        for j in range(1, 3):
            m = clean_string_or_empty(row.get(f"unlocks_merc_{j}", ""))
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
            # Fortification
            "fortificationLevel": clean_int(row.get("col_7")),
            "archerySlots": clean_int(row.get("col_21")),
            "castleDefender": clean_string_or_empty(row.get("col_22", "")),
            "gateDefense": clean_int(row.get("col_23")),
            # Land bonuses
            "healingBonus": clean_int(row.get("col_24")),
            "incomeBonus": clean_int(row.get("col_25")),
            # Player bonuses
            "manaRegen": {
                "fire": clean_int(row.get("col_12")),
                "earth": clean_int(row.get("col_13")),
                "air": clean_int(row.get("col_14")),
                "water": clean_int(row.get("col_15")),
                "life": clean_int(row.get("col_16")),
                "death": clean_int(row.get("col_17")),
                "arcane": clean_int(row.get("col_18")),
            },
            "statBonuses": {
                "strength": clean_int(row.get("col_29")),
                "dexterity": clean_int(row.get("col_30")),
                "power": clean_int(row.get("col_31")),
            },
            "combatRoundsBonus": clean_int(row.get("col_26")),
            "spellLevelBonus": clean_int(row.get("col_32")),
            # Special flags
            "isPortal": clean_int(row.get("col_27")) > 0,
            "isBank": clean_int(row.get("col_28")) > 0,
        }
        buildings.append(building)

    return buildings


def convert_lands():
    """
    Convert lands.csv to lands.json

    Column mappings:
    - 0-1: name_short, name_long (Estonian)
    - 2: price
    - 3: tax_income
    - 4: healing
    - 5-7: reserved
    - 8-11: defender_1-4
    - 12: spawn_chance
    - 13-24: building_1-12
    - 25: col_25 = mana_type
    - 26: col_26 = mana_building_flag
    - 27-30: localized names
    """
    rows = read_csv("lands.csv")

    # Mana type mapping from string
    mana_type_map = {
        "Fire mana": "fire",
        "Earth mana": "earth",
        "Air mana": "air",
        "Water mana": "water",
        "Death mana": "death",
        "Life mana": "life",
        "Arcane mana": "arcane",
    }

    lands = []

    for i, row in enumerate(rows):
        # Collect non-empty available buildings
        buildings = []
        for j in range(1, 13):
            b = clean_string_or_empty(row.get(f"building_{j}", ""))
            if b:
                buildings.append(b)

        # Collect defenders
        defenders = []
        for j in range(1, 5):
            d = clean_string(row.get(f"defender_{j}", ""))
            defenders.append(d)

        price = clean_int(row.get("price"))
        tax_income = clean_int(row.get("tax_income"))
        defender_1 = clean_string(row.get("defender_1", ""))

        # Utility lands have no tax income and "Jumal" (God) as defenders
        is_utility = tax_income == 0 or defender_1 == "Jumal"

        # Special case for Royal Court
        is_royal_court = "Palee" in row.get("name_short", "") or "Palace" in row.get("name_short_en", "")

        # Mana type
        mana_type_str = clean_string(row.get("col_25", ""))
        mana_type = mana_type_map.get(mana_type_str)

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
            "defenders": defenders,
            "spawnChance": clean_int(row.get("spawn_chance")),
            "availableBuildings": buildings,
            "isUtility": is_utility,
            "manaType": mana_type,
        }

        if is_royal_court:
            land["isRoyalCourt"] = True

        lands.append(land)

    return lands


def convert_events():
    """Convert events - using existing events.json as base since events.csv is minimal."""
    # Events are manually curated, just validate the existing file
    events_file = OUTPUT_DIR / "events.json"
    if events_file.exists():
        with open(events_file, encoding="utf-8") as f:
            return json.load(f)
    return []


def convert_levelup():
    """
    Convert levelup.csv to levelup.json

    Column mappings:
    - 0: name (creature to evolve from)
    - 1: hp_bonus
    - 2: attacks_bonus
    - 3-4: damage dice bonuses
    - 5: damage_type
    - 6-8: base stat bonuses (STR, DEX, POW)
    - 9: armor_bonus
    - 10-12: modified stat bonuses
    - 14-20: mana regen bonuses (7 types)
    - 21-24: learns_spell_1-4
    - 25-28: spell power bonuses
    - 29-33: elemental damage bonuses
    - 34-39: resistance bonuses
    - 40-46: reserved
    - 47: evolves_into
    - 49-50: name_en, name_et
    """
    rows = read_csv("levelup.csv")
    levelups = []

    for i, row in enumerate(rows):
        # Collect spells learned
        spells = []
        for j in range(1, 5):
            s = clean_string_or_empty(row.get(f"learns_spell_{j}", ""))
            if s:
                spells.append(s)

        levelup = {
            "id": i,
            "name": {
                "en": clean_string(row.get("name_en", "")),
                "et": clean_string(row.get("name_et", row.get("name", ""))),
            },
            "evolvesInto": clean_string_or_empty(row.get("evolves_into", "")),
            "hpBonus": clean_int(row.get("hp_bonus")),
            "attacksBonus": clean_int(row.get("col_2")),
            "damageBonus": {
                "diceCount": clean_int(row.get("col_3")),
                "diceSides": clean_int(row.get("col_4")),
            },
            "statBonuses": {
                "strength": clean_int(row.get("col_6")),
                "dexterity": clean_int(row.get("col_7")),
                "power": clean_int(row.get("col_8")),
            },
            "armorBonus": clean_int(row.get("col_9")),
            "learnsSpells": spells,
            "resistances": {
                "fire": clean_int(row.get("col_34")),
                "lightning": clean_int(row.get("col_35")),
                "cold": clean_int(row.get("col_36")),
                "poison": clean_int(row.get("col_37")),
                "bleeding": clean_int(row.get("col_38")),
                "stun": clean_int(row.get("col_39")),
            },
        }

        # Only include if there's valid data
        if levelup["name"]["en"] or levelup["name"]["et"]:
            levelups.append(levelup)

    return levelups


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
    write_json(convert_levelup(), "levelup.json")

    # Events are manually maintained
    events = convert_events()
    if events:
        print(f"  events.json: {len(events)} entries (unchanged)")

    print(f"\nDone! Files saved to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
