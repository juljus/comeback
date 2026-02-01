# Effects Sheet Structure - Complete Column Analysis

## Overview
The Effects sheet stores active status effects applied to characters during combat. Each row represents one active effect, with up to 40 columns reserved for future use. The actual data uses columns 1-11, with column 8 serving as a processing flag.

**File Location**: `/Users/juljus/Projects/comeback/docs/extraction/vba/all_modules.txt`
**Max Rows**: Dynamic (tracked in `Game_data1.Cells(208, 2)`)
**Column Capacity**: 40 columns

---

## Column Structure (1-11)

### Column 1: Caster ID
- **Type**: Integer (Character/NPC ID)
- **Purpose**: Identifies who cast/applied the effect
- **Special Note**:
  - For winds effect (column 7): Contains the caster ID
  - For other effects: Usually same as the affected target in conquest effects
- **VBA Line References**:
  - Set: 1626, 1909, 6308, 6644
  - Read: 2557, 2563, 2572-2574, 6273, 6308, 6619, 6644

### Column 2: Target ID
- **Type**: Integer (Character/NPC ID)
- **Purpose**: Identifies who is affected by this effect
- **Special Note**:
  - For winds effect: Set to 0 (no individual target, affects environment)
  - For other buff/debuff effects: Contains the target character ID
- **VBA Line References**:
  - Set: 1627, 1910, 6350, 6464, 6589, 6645
  - Read: 2557, 2596, 6273, 6378, 6491

### Column 3: Duration (Turns Remaining)
- **Type**: Integer
- **Purpose**: Countdown timer for effect expiration
- **Mechanics**:
  - Value > 0: Effect is active
  - Decremented each turn if the caster is alive and active
  - When ≤ 0: Effect is removed via `remove_effect()`
  - Typical values: 1 (instant/same turn) or 3 (3 turns)
- **VBA Line References**:
  - Set: 1631, 1633, 1916, 1918, 6307, 6412, 6525, 6650
  - Read: 2521-2522, 2572, 6284, 6389, 6502, 6628
  - Decrement: 2522
  - Check/Remove: 2523, 2525

### Column 4: Armor Bonus/Malus
- **Type**: Integer
- **Purpose**: Adjusts target's armor defense stat
- **Application**:
  - Applied on removal: Subtracted from target's armor (column 14 in Side sheet)
  - Positive value = decreased armor (debuff)
  - Negative value = increased armor (buff, though uncommon)
- **Related Functions**:
  - Applied via: `remove_effect()` at line 2602-2607
  - Reset by: `reset_all_effect_Bonuses()` at line 6704
- **VBA Line References**:
  - Set: 6302
  - Read/Check: 2602, 6275
  - Reset: 6704

### Column 5: Haste/Speed Bonus
- **Type**: Integer
- **Purpose**: Modifies target's dexterity and extra attacks
- **Application**:
  - Dexterity stat reduced by this amount (line 2611)
  - Extra attacks (column 4 in Side sheet) reduced by this amount (line 2613)
  - Both effects reversed on removal
- **Related Functions**:
  - Applied via: `remove_effect()` at line 2609-2617
  - Reset by: `reset_all_effect_Bonuses()` at line 6705
- **VBA Line References**:
  - Set: 6406
  - Read/Check: 2609, 6380
  - Reset: 6705

### Column 6: Strength Bonus/Malus
- **Type**: Integer
- **Purpose**: Modifies target's strength stat and related combat calculations
- **Application**:
  - Strength stat reduced by this amount (line 2620)
  - If player is under strength: Applies additional malus to HP (line 2637) and damage (line 2638)
  - Complex removal logic checks if target is the active player
- **Related Functions**:
  - Applied via: `remove_effect()` at line 2619-2641
  - Reset by: `reset_all_effect_Bonuses()` at line 6706
- **VBA Line References**:
  - Set: 6520
  - Read/Check: 2619, 6493
  - Reset: 6706

### Column 7: Winds/Movement Manipulation
- **Type**: Integer
- **Purpose**: Strength of wind spell effect on movement probability
- **Special Mechanics**:
  - Only for wind manipulation spells (check: Spell sheet column 36)
  - Not tied to a specific target (column 2 = 0)
  - Increases or decreases probability of successful movement
  - Formula: `how_many_buttons = 1 + Int(winds_Strength / 3)` (controls movement options)
- **Related Functions**:
  - Applied via: Spell casting (column 36 check at line 6605)
  - Used in: `manipulate_check()` at line 4488, 4522
  - Controller variable: line 4393-4394
- **VBA Line References**:
  - Set: 6646
  - Read/Check: 2618, 4391, 4393-4394, 6618-6622
  - Reset: 6707

### Column 8: Checked Flag (Processing Lock)
- **Type**: Integer (Boolean: 0=unchecked, 1=checked)
- **Purpose**: Prevents duplicate effect processing within a single turn cycle
- **Mechanics**:
  - Reset to 0 at start of turn cycle (line 2510)
  - Set to 1 when effect is first processed (line 2518)
  - Checked to avoid re-processing same effect in nested loop (line 2516)
- **VBA Line References**:
  - Reset: 2510
  - Set: 2518
  - Check: 2516

### Column 9: Receive Money Reward
- **Type**: Integer (Gold amount)
- **Purpose**: Gold granted to player when effect expires/is removed
- **Application**:
  - Only applied when effect is removed via `remove_effect()`
  - Added to player's gold (Game_data1.Cells(24 + player, 2))
- **Related Functions**:
  - Applied via: `remove_effect()` at line 2643-2653
  - Reset by: `reset_all_effect_Bonuses()` at line 6708
- **VBA Line References**:
  - Set: 1636, 1921, 6708
  - Read/Check: 2643, 2645-2646, 2652

### Column 10: Receive Item Reward
- **Type**: Integer (Item ID from Items sheet)
- **Purpose**: Item granted to player when effect expires/is removed
- **Application**:
  - Only applied when effect is removed via `remove_effect()`
  - Item is added to player's inventory
  - Set condition: column value ≠ 0
- **Related Functions**:
  - Applied via: `remove_effect()` at line 2655-2662
  - Reset by: `reset_all_effect_Bonuses()` at line 6709
  - Uses: Items sheet lookup (line 2657)
- **VBA Line References**:
  - Set: 6302, 14285
  - Read/Check: 2655, 2657, 2660
  - Reset: 6709

### Column 11: Receive Land Reward
- **Type**: Integer (Land/Map tile ID)
- **Purpose**: Territory/land granted to player when effect expires/is removed
- **Application**:
  - Only applied when effect is removed via `remove_effect()`
  - Transfers land ownership to current player (via `give_active_land_ownership_to_player()`)
  - Checks: Target land must belong to original owner, land must exist
- **Related Functions**:
  - Applied via: `remove_effect()` at line 2665-2687
  - Reset by: `reset_all_effect_Bonuses()` at line 6710
  - Uses: Game_map sheet for land info
- **VBA Line References**:
  - Set: 1636, 6710
  - Read/Check: 2665-2666, 2669, 2680, 2685

---

## Effect Application Mechanics

### Function: `reset_all_effect_Bonuses(mitmes_effect)`
**Location**: Lines 6703-6711

Initializes all bonus columns (4-7, 9-11) to 0 for a new effect row.

```vba
Function reset_all_effect_Bonuses(mitmes_effect As Integer)
    Sheets("Effects").Cells(mitmes_effect, 4).Value = 0  'armor
    Sheets("Effects").Cells(mitmes_effect, 5).Value = 0  'haste
    Sheets("Effects").Cells(mitmes_effect, 6).Value = 0  'strength
    Sheets("Effects").Cells(mitmes_effect, 7).Value = 0  'winds
    Sheets("Effects").Cells(mitmes_effect, 9).Value = 0  'money reward
    Sheets("Effects").Cells(mitmes_effect, 10).Value = 0 'item reward
    Sheets("Effects").Cells(mitmes_effect, 11).Value = 0 'land reward
End Function
```

**Called By**: Lines 1624, 1906, 6297, 6402, 6515, 6640, 14271

---

### Function: `is_effect_on_target(target_id, column_number)`
**Location**: Lines 2546-2581

Checks if an effect is active on a specific target and returns its power.

**Parameters**:
- `target_id`: Character ID to check
- `column_number`: Which effect column to check (4=armor, 5=haste, 6=strength, 7=winds)

**Special Logic**:
- For winds (column 7): Checks column 1 (caster) instead of column 2 (target)
- For other effects: Checks column 2 (target)

**Output** (stored in Game_data1):
- Cell(268, 2): Duration remaining
- Cell(269, 2): Power/magnitude of the effect
- Return value: 1 if active, 0 if not

**Used For**: UI display of active effects in status window (lines 7079, 7094, 7110, 7127, 7838, 7853, 7869, 7886)

---

### Function: `remove_effect(mitmes)`
**Location**: Lines 2583-2698

Removes an effect and applies all accumulated rewards and stat reversals.

**Process**:
1. Checks if target is still alive in game (line 2596)
2. If alive:
   - Reverses armor malus (line 2604)
   - Reverses haste/dexterity reduction (line 2611-2613)
   - Reverses strength reduction (line 2620-2638)
   - Awards money (line 2652)
   - Awards item (line 2660)
   - Awards land (line 2685)
3. Removes effect from Effects sheet via `remove_effect_from_list()` (line 2696)

**Text Output**:
- Character name
- Effect type removed (Lan sheet references 777=armor, 778=haste, 779=strength)
- Reward messages (Lan sheet references 914-918)

---

### Function: `remove_effect_from_list(mitmes)`
**Location**: Lines 2699-2722

Removes effect row and shifts all subsequent rows up.

**Process**:
1. Determines how many rows to shift (lines 2709)
2. Copies all 40 columns from row N+1 to row N (lines 2712-2714)
3. Decrements total effect count (line 2719)

**Note**: Always operates on 40 columns per row to match Effects sheet capacity.

---

## Duration Mechanics

### Turn-Based Countdown
**Location**: Main_turn() function, lines 2509-2533

Each turn for an active character:
1. Resets the "checked" flag (column 8) for all effects
2. Iterates through all effects
3. For each unchecked effect belonging to the character's party:
   - Marks it as checked
   - Decrements duration (column 3) by 1
   - If duration ≤ 0: Calls `remove_effect()`

**Triggers**: Only when character takes their turn, not opponent's turn

**VBA Line References**: 2509-2533

---

## Effect Creation Examples

### Conquest Effect (Land Rewards)
**Location**: Lines 1620-1685

Creates an effect that grants land ownership when expires.

```
Column 1 (Caster): Target side's active unit
Column 2 (Target): Conquering side's unit
Column 3 (Duration): 1 (same turn) or 3 (3 turns)
Column 11 (Land): The conquered territory ID
```

### Spell Effect (Stat Bonuses)
**Location**: Lines 6260-6651

Creates effects for armor, haste, strength, or winds spells.

**Armor Spell** (lines 6260-6350):
```
Column 1 (Caster): Spell caster ID
Column 2 (Target): Target character ID
Column 3 (Duration): Calculated from spell power
Column 4 (Armor): Stat bonus amount
```

**Haste Spell** (lines 6360-6465):
```
Column 1 (Caster): Spell caster ID
Column 2 (Target): Target character ID
Column 3 (Duration): Calculated from spell power
Column 5 (Haste): Dexterity/attacks bonus amount
```

**Strength Spell** (lines 6475-6590):
```
Column 1 (Caster): Spell caster ID
Column 2 (Target): Target character ID
Column 3 (Duration): Calculated from spell power
Column 6 (Strength): Strength bonus amount
```

**Winds Spell** (lines 6605-6700):
```
Column 1 (Caster): Spell caster ID
Column 2 (Target): 0 (no individual target, environmental)
Column 3 (Duration): Calculated from spell power
Column 7 (Winds): Movement difficulty strength
```

---

## Reward Application Timing

Rewards are ONLY applied when an effect expires naturally or is removed:

1. **Money (Column 9)**:
   - Added to current player's gold reserve
   - Displayed with gold icon (color 45)
   - Plural handling: "coins" vs "coin" (Lan 915/920)

2. **Item (Column 10)**:
   - Item ID references Items sheet
   - Added to player's inventory
   - Displayed with item icon (color 5)

3. **Land (Column 11)**:
   - Land ID references Game_map sheet
   - Ownership transferred to current player
   - Function: `give_active_land_ownership_to_player()`
   - Only transferred if land still belongs to original owner

---

## Known Effects Mapping

Based on VBA code analysis, the following status effects use specific columns:

| Effect Type | Column(s) | Created By | Duration |
|-----------|-----------|-----------|----------|
| Armor Reduction | 4 | Armor spell | Variable (power-based) |
| Haste Boost | 5 | Haste spell | Variable (power-based) |
| Strength Reduction | 6 | Strength spell | Variable (power-based) |
| Winds Manipulation | 7 | Winds spell | Variable (power-based) |
| Conquest Reward | 9,11 | Conquest mechanic | 1-3 turns |

**Note**: Bleeding, stun, poison, frozen, and burning effects mentioned in help text are not visible in this VBA code section, suggesting they may be:
- Handled in weapon/combat calculations outside Effects sheet
- Applied as damage-over-time without stat columns
- Stored in different sheet structures

---

## Summary Table

| Col | Name | Type | Purpose | Reset | Used In |
|-----|------|------|---------|-------|---------|
| 1 | Caster ID | Integer | Who cast effect | No | `is_effect_on_target`, removal |
| 2 | Target ID | Integer | Who is affected | No | `is_effect_on_target`, removal |
| 3 | Duration | Integer | Turns remaining | No | Decrement, removal check |
| 4 | Armor Bonus | Integer | Defense adjustment | `reset_all_effect_Bonuses` | Spell casting, removal |
| 5 | Haste Bonus | Integer | Speed adjustment | `reset_all_effect_Bonuses` | Spell casting, removal |
| 6 | Strength Bonus | Integer | Strength adjustment | `reset_all_effect_Bonuses` | Spell casting, removal |
| 7 | Winds Power | Integer | Movement difficulty | `reset_all_effect_Bonuses` | Spell casting, manipulation check |
| 8 | Checked Flag | Integer | Turn processing lock | Every turn | Prevent duplicate processing |
| 9 | Money Reward | Integer | Gold on removal | `reset_all_effect_Bonuses` | Removal payout |
| 10 | Item Reward | Integer | Item ID on removal | `reset_all_effect_Bonuses` | Removal payout |
| 11 | Land Reward | Integer | Land ID on removal | `reset_all_effect_Bonuses` | Removal payout |

---

## File References

**All VBA references**: `/Users/juljus/Projects/comeback/docs/extraction/vba/all_modules.txt`

Key function locations:
- `reset_all_effect_Bonuses`: 6703
- `is_effect_on_target`: 2546
- `remove_effect`: 2583
- `remove_effect_from_list`: 2699
- Effect processing loop: 2509
- Spell application: 6260 (armor), 6360 (haste), 6475 (strength), 6605 (winds)

