# Effects Sheet Research - Complete Documentation Index

## Overview

This directory contains comprehensive documentation of the Effects sheet structure discovered through analysis of the VBA code in the Comeback game system. The Effects sheet manages all active status effects during combat, including spell buffs/debuffs, conquest rewards, and environmental effects.

---

## Documentation Files

### 1. EFFECTS_STRUCTURE.md (14 KB)
**Comprehensive Technical Reference**

The primary detailed documentation covering:
- All 11 columns with full technical descriptions
- How effects are applied (which functions, spell types)
- How effects are removed and rewards distributed
- Effect duration mechanics and turn-based countdown
- Complete VBA line references for every operation
- Known effects mapping table
- Summary reference table

**Best for**: Deep technical understanding, development reference, debugging

**Key Sections**:
- Column-by-column breakdown (columns 1-11)
- Effect application mechanics
- `reset_all_effect_Bonuses()` function
- `is_effect_on_target()` function
- `remove_effect()` function
- Duration mechanics with code examples

---

### 2. EFFECTS_CSV_STRUCTURE.txt (3.1 KB)
**Quick Reference Format**

A concise, at-a-glance reference showing:
- Column names and types
- Example values
- Purpose of each column
- Quick column details
- Example data rows
- Related functions and file locations

**Best for**: Quick lookups, data entry, understanding structure at a glance

**Use When**: You need to quickly understand what goes in each column

---

### 3. EFFECTS_MECHANICS_FLOW.txt (7.5 KB)
**System Behavior and Process Flow**

Visual and textual description of:
- Effect creation process (flowchart style)
- Effect processing during turns
- Effect removal process
- Effect display mechanics
- Column 8 (checked flag) logic and purpose
- Duration decrement triggers
- Effect interaction rules
- Complete data flow summary

**Best for**: Understanding how the system works, troubleshooting behavior

**Use When**: You need to understand "how" and "why" effects work

---

## Source Material

**VBA File**: `/Users/juljus/Projects/comeback/docs/extraction/vba/all_modules.txt` (822 KB)

This is the extracted VBA code from the Excel macro that implements all Effects sheet operations.

---

## Quick Facts About Effects Sheet

| Property | Value |
|----------|-------|
| Total Columns | 40 (columns 1-11 used, 12-40 reserved) |
| Active Rows | 9 entries (typical, dynamically managed) |
| Row Capacity | Unlimited (tracked in Game_data1.Cells(208, 2)) |
| Max Turns | Variable by effect (typically 1-3 turns) |
| Reward Types | Money, Items, Territory/Land |

---

## Column Quick Reference

| Col | Name | Type | Purpose |
|-----|------|------|---------|
| 1 | Caster ID | Integer | Who created effect |
| 2 | Target ID | Integer | Who is affected (0 = environmental) |
| 3 | Duration | Integer | Turns remaining |
| 4 | Armor Bonus | Integer | Defense modification |
| 5 | Haste Bonus | Integer | Speed/dexterity modification |
| 6 | Strength Bonus | Integer | Strength modification |
| 7 | Winds Power | Integer | Movement difficulty (environmental) |
| 8 | Checked Flag | Boolean | Processing lock (internal) |
| 9 | Money Reward | Integer | Gold on expiration |
| 10 | Item Reward | Integer | Item ID on expiration |
| 11 | Land Reward | Integer | Territory ID on expiration |

---

## Key Functions

### `reset_all_effect_Bonuses(mitmes_effect)`
**VBA Line**: 6703
- Initializes effect row by zeroing all bonus columns
- Called when creating new effect

### `is_effect_on_target(target_id, column_number)`
**VBA Line**: 2546
- Checks if effect is active on specific target
- Used for UI display of active effects
- Returns: 1 if active, 0 if not

### `remove_effect(mitmes)`
**VBA Line**: 2583
- Removes effect when duration expires
- Reverses all stat modifications
- Applies all accumulated rewards
- Handles text output messages

### `remove_effect_from_list(mitmes)`
**VBA Line**: 2699
- Removes effect row from sheet
- Shifts subsequent rows up
- Updates total effect count

---

## How Effects Work (Simplified)

1. **Creation**: Spell cast or conquest action → new effect row created
2. **Storage**: Effect data stored in columns 1-11
3. **Processing**: Each turn, active character's effects duration decrements
4. **Expiration**: When duration ≤ 0 → effect removed
5. **Rewards**: Gold/items/territory granted to player
6. **Cleanup**: Effect row deleted, subsequent rows shifted up

---

## Effect Types by Purpose

### Stat Modification Effects
- **Armor** (Column 4): Reduces target's armor defense
- **Haste** (Column 5): Reduces target's speed/attacks
- **Strength** (Column 6): Reduces target's strength, HP, and damage

### Environmental Effects
- **Winds** (Column 7): Modifies movement probability (no target)

### Reward Effects
- **Conquest** (Columns 9, 11): Grants gold and territory when expires

---

## Duration Mechanics

- **Decrement Trigger**: Once per active turn (when character takes turn)
- **Typical Values**: 1 (instant) or 3 (three-turn duration)
- **Removal Check**: After decrement, if ≤ 0 → remove_effect() called
- **Special Case**: Winds effects may not decrement if caster is inactive

---

## Processing Order (Each Turn)

1. Reset all Column 8 (checked flags) to 0
2. For each effect in Effects sheet:
   - Skip if Column 8 = 1 (already processed)
   - Mark Column 8 = 1
   - Check if caster is in active party
   - Decrement Column 3 (duration)
   - If duration ≤ 0: Call remove_effect()

---

## Important Notes

### Column 8 (Checked Flag)
Prevents double-processing of effects in a single turn cycle. Always reset to 0 at turn start, marked 1 when processed.

### Rewards Only Apply on Expiration
Gold (Column 9), items (Column 10), and land (Column 11) are ONLY given when effect expires. Not given when effect is manually removed or target dies.

### Winds Effect is Special
- Column 7 is unique (environmental, affects movement)
- Targets the caster (Column 1), not affected character
- Column 2 = 0 for winds effects
- Only one winds per caster can be active

### Effect Interaction
- Multiple effects can coexist on same target
- Each column (4-7) is independent
- Spell replacement logic checks if new effect is better before replacing

---

## File Locations

| File | Type | Location |
|------|------|----------|
| Source VBA | .txt | `/Users/juljus/Projects/comeback/docs/extraction/vba/all_modules.txt` |
| Full Docs | .md | `/Users/juljus/Projects/comeback/EFFECTS_STRUCTURE.md` |
| Quick Ref | .txt | `/Users/juljus/Projects/comeback/EFFECTS_CSV_STRUCTURE.txt` |
| Flow Diagram | .txt | `/Users/juljus/Projects/comeback/EFFECTS_MECHANICS_FLOW.txt` |
| This Index | .md | `/Users/juljus/Projects/comeback/EFFECTS_RESEARCH_INDEX.md` |

---

## Research Methodology

This documentation was created by analyzing the extracted VBA code with focus on:

1. **Sheet References**: Found all `Sheets("Effects").Cells()` references
2. **Function Analysis**: Traced key functions:
   - `reset_all_effect_Bonuses` (initialization)
   - `is_effect_on_target` (detection)
   - `remove_effect` (removal & rewards)
   - `remove_effect_from_list` (cleanup)
3. **Column Discovery**: Identified all columns 1-11 through function parameters
4. **Mechanic Discovery**: Traced how effects are created, processed, and removed
5. **Line Mapping**: Documented every relevant VBA line reference

---

## Known Limitations

The following status effects mentioned in help text are NOT found in this Effects sheet analysis:
- Bleeding
- Stun
- Poison
- Frozen
- Burning

These may be handled as:
- Damage-over-time calculations in combat resolution
- Stored in separate structures outside Effects sheet
- Applied as weapon effects in attack calculations
- Tracked in character status separately

---

## Contact & Notes

- All documentation created: 2026-02-01
- Source: Comeback game VBA macro extraction
- Research focus: Effects sheet structure for CSV documentation
- Total columns analyzed: 11 (data) + 29 (reserved)

For questions about specific mechanics, refer to:
- Technical details → EFFECTS_STRUCTURE.md
- Quick lookups → EFFECTS_CSV_STRUCTURE.txt
- Process flow → EFFECTS_MECHANICS_FLOW.txt
- Specific VBA → `/Users/juljus/Projects/comeback/docs/extraction/vba/all_modules.txt`

