# Side Sheet Documentation - Combat Participant Tracking

The **Side** sheet (one per player side: Side1, Side2, Side3, Side4, Side5) tracks all combat participants (player characters, summoned creatures, mercenaries, enemies, and buildings) during combat.

## Sheet Structure

Each Side sheet contains rows for combatants and columns for their combat-related data. Data is populated from the **Mobs** sheet (base mob definitions) when combatants join a battle, and modified during combat.

---

## Column Reference

### Identity & Combat State

| Col | Name | Data Type | Source | Purpose | VBA References |
|-----|------|-----------|--------|---------|-----------------|
| 1 | Combatant Name | String | Mobs col 1 | Display name of the combatant | Line 10965: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 1).Value = Sheets("Mobs").Cells(mob, 1).Value` |
| 2 | Current HP | Integer | Mobs col 2 | Current health points (decreases when damaged) | Line 10967: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 2).Value = Sheets("Mobs").Cells(mob, 2).Value` |
| 3 | Max HP | Integer | Mobs col 2 | Maximum health points (static reference) | Line 10969: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 3).Value = Sheets("Mobs").Cells(mob, 2).Value` |
| 35 | Mob ID / Unique Entity Number | Integer | Game_data1 col 46 (incremented) | Unique identifier for this specific combatant instance | Line 10962: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 35).Value = Sheets("Game_data1").Cells(46, 2).Value` |

### Combat Mechanics - Damage

| Col | Name | Data Type | Source | Purpose | VBA References |
|-----|------|-----------|--------|---------|-----------------|
| 4 | Number of Attacks | Integer | Mobs col 3 | How many attacks per round this combatant makes | Line 10971: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 4).Value = Sheets("Mobs").Cells(mob, 3).Value` |
| 5 | Damage Dice 1 (d1) | Integer | Mobs col 4 | First die roll for damage calculation (e.g., 1 in 1d4) | Line 10973: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 5).Value = Sheets("Mobs").Cells(mob, 4).Value` |
| 6 | Damage Dice 2 (d2) | Integer | Mobs col 5 | Second die roll for damage calculation (e.g., 4 in 1d4) | Line 10975: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 6).Value = Sheets("Mobs").Cells(mob, 5).Value` |
| 7 | Damage Type | Integer | Mobs col 6 | Physical/magical damage type classification | Line 10977: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 7).Value = Sheets("Mobs").Cells(mob, 6).Value` |
| 14 | Armor / Defense | Integer | Mobs col 10 | Armor rating (damage reduction) | Line 10987: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 14).Value = Sheets("Mobs").Cells(mob, 10).Value` |
| 15 | Weapon Name | String | Items sheet | Currently equipped weapon name (e.g., "No weapon" for unarmed) | Line 92: `Sheets("Side" & what_player).Cells(..., 15).Value = "No weapon"` |

### Character Stats

| Col | Name | Data Type | Source | Purpose | VBA References |
|-----|------|-----------|--------|---------|-----------------|
| 8 | Strength | Integer | Mobs col 7 | Base strength stat | Line 10979: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 8).Value = Sheets("Mobs").Cells(mob, 7).Value` |
| 9 | Dexterity | Integer | Mobs col 8 | Base dexterity stat | Line 10980: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 9).Value = Sheets("Mobs").Cells(mob, 8).Value` |
| 10 | Power/Magic | Integer | Mobs col 9 | Base power/magic stat | Line 10981: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 10).Value = Sheets("Mobs").Cells(mob, 9).Value` |
| 11 | Modified Strength | Integer | Mobs col 7 (initial) | Current strength after buffs/debuffs | Line 10983: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 11).Value = Sheets("Mobs").Cells(mob, 7).Value` |
| 12 | Modified Dexterity | Integer | Mobs col 8 (initial) | Current dexterity after buffs/debuffs | Line 10984: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 12).Value = Sheets("Mobs").Cells(mob, 8).Value` |
| 13 | Modified Power/Magic | Integer | Mobs col 9 (initial) | Current power/magic after buffs/debuffs | Line 10985: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 13).Value = Sheets("Mobs").Cells(mob, 9).Value` |

### Mana & Spellcasting

| Col | Name | Data Type | Source | Purpose | VBA References |
|-----|------|-----------|--------|---------|-----------------|
| 16 | Mana 1 (Spell School 1) | Integer | Mobs col 16 | Current mana for spell school 1 | Line 11042: `Sheets("Side" & what_side).Cells(mitmes_tabelis, x).Value = Sheets("Mobs").Cells(mob, x).Value` (x: 16-29) |
| 17 | Mana 2 (Spell School 2) | Integer | Mobs col 17 | Current mana for spell school 2 | Line 11042 |
| 18 | Mana 3 (Spell School 3) | Integer | Mobs col 18 | Current mana for spell school 3 | Line 11042 |
| 19 | Mana 4 (Spell School 4) | Integer | Mobs col 19 | Current mana for spell school 4 | Line 11042 |
| 20 | Mana 5 (Spell School 5) | Integer | Mobs col 20 | Current mana for spell school 5 | Line 11042 |
| 21 | Mana 6 (Spell School 6) | Integer | Mobs col 21 | Current mana for spell school 6 | Line 11042 |
| 22 | Mana Regen 1 | Integer | Mobs col 22 | Mana regeneration per round for school 1 | Line 11042 |
| 23 | Mana Regen 2 | Integer | Mobs col 23 | Mana regeneration per round for school 2 | Line 11042 |
| 24 | Mana Regen 3 | Integer | Mobs col 24 | Mana regeneration per round for school 3 | Line 11042 |
| 25 | Mana Regen 4 | Integer | Mobs col 25 | Mana regeneration per round for school 4 | Line 11042 |
| 26 | Mana Regen 5 | Integer | Mobs col 26 | Mana regeneration per round for school 5 | Line 11042 |
| 27 | Mana Regen 6 | Integer | Mobs col 27 | Mana regeneration per round for school 6 | Line 11042 |
| 28 | Mana Knowledge 1 | Integer | Mobs col 28 | Spell knowledge/level for school 1 | Line 11042 |
| 29 | Mana Knowledge 2 | Integer | Mobs col 29 | Spell knowledge/level for school 2 | Line 11042 |

### Combat Actions (Real-Time)

| Col | Name | Data Type | Source | Purpose | VBA References |
|-----|------|-----------|--------|---------|-----------------|
| 30 | Current Action | Integer | Runtime | Action type for this round: 0=fleeing, 1=melee attacking, 2=ranged attacking, 10=peaceful spell, 11=target single enemy spell, 12=mass offensive spell, 20=defending/inactive | Line 10641-10708, 11429-11496: Various action assignments |
| 31 | Action Target | Integer | Runtime | Target entity ID (Col 35 value) or side number for mass spells; stored as (100 + side_number) for side-wide effects | Line 10654, 10662, 10712, 11436, 11443, 11479, 12008: Target tracking |

### Classification & Affiliation

| Col | Name | Data Type | Source | Purpose | VBA References |
|-----|------|-----------|--------|---------|-----------------|
| 32 | AI Behavior 1 | Integer | Mobs col 11 | AI flag for behavior type 1 | Line 10994: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 32).Value = Sheets("Mobs").Cells(mob, 11).Value` |
| 33 | AI Behavior 2 | Integer | Mobs col 12 | AI flag for behavior type 2 | Line 10995: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 33).Value = Sheets("Mobs").Cells(mob, 12).Value` |
| 34 | AI Behavior 3 (Bravery) | Integer | Mobs col 13 | AI flag for bravery/fleeing threshold (10 = never flee) | Line 10996: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 34).Value = Sheets("Mobs").Cells(mob, 13).Value` |
| 37 | Mob Type / Building | Integer | Mobs col 30 | Mob classification or building type identifier (0 = normal mob, >0 = building/special) | Line 10990: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 37).Value = Sheets("Mobs").Cells(mob, 30).Value` |
| 38 | Archery Position (Wall Defense) | Boolean (0/1) | Runtime | 1 = behind wall (protected from melee attacks, can shoot out), 0 = exposed | Line 11045-11048: Set based on behind_Wall parameter |
| 39 | Mercenary Contract Countdown | Integer | Runtime | Contract duration: >0 = rounds remaining on contract, 0 = no contract | Line 10997: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 39).Value = merc` |

### Spellcasting Data

| Col | Name | Data Type | Source | Purpose | VBA References |
|-----|------|-----------|--------|---------|-----------------|
| 40 | Spell Knowledge Control | Integer | Mobs col 32 | Number of known spells (spell casting capability) | Line 11001: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 40).Value = Sheets("Mobs").Cells(mob, 32).Value` |
| 41 | Spell Slots 1 | Integer | Mobs col 33 | Spell slot count for spell 1 | Line 11002: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 41).Value = Sheets("Mobs").Cells(mob, 33).Value` |
| 42 | Spell Slots 2 | Integer | Mobs col 34 | Spell slot count for spell 2 | Line 11003: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 42).Value = Sheets("Mobs").Cells(mob, 34).Value` |
| 43 | Spell Slots 3 | Integer | Mobs col 35 | Spell slot count for spell 3 | Line 11004: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 43).Value = Sheets("Mobs").Cells(mob, 35).Value` |
| 44 | Spell Slots 4 | Integer | Mobs col 36 | Spell slot count for spell 4 | Line 11005: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 44).Value = Sheets("Mobs").Cells(mob, 36).Value` |
| 45 | Spell Knowledge 1 | Integer | Mobs col 37 | Knowledge level for spell 1 | Line 11006: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 45).Value = Sheets("Mobs").Cells(mob, 37).Value` |
| 46 | Spell Knowledge 2 | Integer | Mobs col 38 | Knowledge level for spell 2 | Line 11007: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 46).Value = Sheets("Mobs").Cells(mob, 38).Value` |
| 47 | Spell Knowledge 3 | Integer | Mobs col 39 | Knowledge level for spell 3 | Line 11008: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 47).Value = Sheets("Mobs").Cells(mob, 39).Value` |
| 48 | Spell Knowledge 4 | Integer | Mobs col 40 | Knowledge level for spell 4 | Line 11009: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 48).Value = Sheets("Mobs").Cells(mob, 40).Value` |
| 49 | Speed Bonus | Integer | Runtime | Speed/initiative bonus (modified by equipment, typically starts at 0) | Line 11010: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 49).Value = 0` |

### Elemental & Special Damage Modifiers

| Col | Name | Data Type | Source | Purpose | VBA References |
|-----|------|-----------|--------|---------|-----------------|
| 50 | Fire Damage Bonus | Integer | Mobs col 41 | Extra damage dealt as fire | Line 11013: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 50).Value = Sheets("Mobs").Cells(mob, 41).Value` |
| 51 | Extra Damage Type 1 | Integer | Mobs col 42 | Additional damage modifier type 1 | Line 11014: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 51).Value = Sheets("Mobs").Cells(mob, 42).Value` |
| 52 | Extra Damage Type 2 | Integer | Mobs col 43 | Additional damage modifier type 2 | Line 11015: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 52).Value = Sheets("Mobs").Cells(mob, 43).Value` |
| 53 | Poison Damage Bonus | Integer | Mobs col 44 | Extra damage dealt as poison | Line 11016: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 53).Value = Sheets("Mobs").Cells(mob, 44).Value` |

### Negative Status Effects (Applied During Combat)

| Col | Name | Data Type | Source | Purpose | VBA References |
|-----|------|-----------|--------|---------|-----------------|
| 54 | Bleeding Status | Integer | Runtime (0) | Bleeds per round damage counter; >0 = bleeding, 0 = not bleeding | Line 11019: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 54).Value = 0 'bleeding` |
| 55 | Stun Status | Integer | Runtime (0) | Rounds remaining stunned; >0 = stunned, 0 = not stunned | Line 11020: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 55).Value = 0 'stun` |
| 56 | Poison Status | Integer | Runtime (0) | Poison damage per round counter; >0 = poisoned, 0 = not poisoned | Line 11021: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 56).Value = 0 'poison` |
| 57 | Frozen Status | Integer | Runtime (0) | Rounds remaining frozen; >0 = frozen, 0 = not frozen | Line 11022: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 57).Value = 0 'frozen` |
| 58 | Burning Status | Integer | Runtime (0) | Rounds remaining burning; >0 = burning, 0 = not burning | Line 11023: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 58).Value = 0 'burning` |

### Elemental Resistances/Immunities

| Col | Name | Data Type | Source | Purpose | VBA References |
|-----|------|-----------|--------|---------|-----------------|
| 59 | Fire Immunity | Integer | Mobs col 45 | Fire damage resistance level | Line 11026: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 59).Value = Sheets("Mobs").Cells(mob, 45).Value 'fire` |
| 60 | Poison Immunity | Integer | Mobs col 48 | Poison damage resistance level | Line 11027: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 60).Value = Sheets("Mobs").Cells(mob, 48).Value 'poison` |
| 61 | Lightning Immunity | Integer | Mobs col 46 | Lightning damage resistance level | Line 11028: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 61).Value = Sheets("Mobs").Cells(mob, 46).Value 'lightning` |
| 62 | Cold Immunity | Integer | Mobs col 47 | Cold damage resistance level | Line 11029: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 62).Value = Sheets("Mobs").Cells(mob, 47).Value 'cold` |
| 63 | Bleeding Immunity | Integer | Mobs col 49 | Resistance to bleeding status effect | Line 11030: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 63).Value = Sheets("Mobs").Cells(mob, 49).Value` |
| 64 | Stun Immunity | Integer | Mobs col 50 | Resistance to stun status effect | Line 11031: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 64).Value = Sheets("Mobs").Cells(mob, 50).Value` |

### Pet & Evolution System

| Col | Name | Data Type | Source | Purpose | VBA References |
|-----|------|-----------|--------|---------|-----------------|
| 65 | Evolution Counter | Integer | Runtime | Counter for pet evolution progress (combat rounds active) | Line 11034: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 65).Value = evolve` |
| 66 | Upgrade Target Mob | Integer | Mobs col 51 | Mob ID this creature evolves into when conditions met | Line 11035: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 66).Value = Sheets("Mobs").Cells(mob, 51).Value` |
| 67 | Is Pet Flag | Boolean (0/1) | Runtime | 0 = normal unit, 1 = summoned pet/not original combatant | Line 11036: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 67).Value = pet` |

### Spell Level Bonuses

| Col | Name | Data Type | Source | Purpose | VBA References |
|-----|------|-----------|--------|---------|-----------------|
| 68 | Spell Level Bonus | Integer | Mobs col 53 | Extra spell level/bonus for spell casting calculations | Line 11038: `Sheets("Side" & what_side).Cells(mitmes_tabelis, 68).Value = Sheets("Mobs").Cells(mob, 53).Value 'spelllevel extra` |

---

## Data Flow Summary

1. **Initialization** (Lines 86-135): Player characters initialized at game start with default values
2. **Mob Addition** (Lines 10940-11065): When `Add_new_mob()` is called:
   - Mob data copied from Mobs sheet (Columns 1-53)
   - Combat-specific initialization (status effects, actions)
   - Special flags applied (mercenary, pet, evolution status)
3. **Combat Runtime** (Throughout combat functions):
   - Column 2 (HP) decreases due to damage
   - Columns 54-58 track active status effects
   - Column 30-31 updated each round with action decisions
   - Columns 11-13 modified by buffs/debuffs
   - Columns 16-21 (mana) consumed during spellcasting
   - Column 65 incremented for pet evolution tracking

---

## Special Notes

- **Side Numbers**: Sides 1-4 are players, Side 5 is neutral (enemies/wildlife)
- **Entity IDs (Col 35)**: Global sequential IDs across all sides, used to uniquely identify combatants
- **Mana Columns (16-29)**: Only spell schools present are populated; unused schools = 0
- **Stats (8-13)**: Columns 8-10 are base stats, Columns 11-13 are modified versions affected by spells/items
- **Immunities (59-64)**: Higher values = stronger resistance; immunity mechanics handled in spell_effect() function
- **Action Column (30)**: Controls what happens during combat round; specific values trigger different code paths
- **Target Column (31)**: For side-wide effects, stored as (100 + target_side_number); for single targets, stores Col 35 (entity ID)
