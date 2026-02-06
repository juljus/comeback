# Strength

## Armor Bonus

Strength grants **+1 armor for every 4th strength point**:

| Strength | Armor Bonus |
| -------- | ----------- |
| 4+       | +1          |
| 8+       | +2          |
| 12+      | +3          |
| 16+      | +4          |
| ...      | ...         |

Formula: `armor_bonus = floor(strength / 4)`

This scaling continues indefinitely.

## Weapon Damage Bonus

When wielding a weapon:

```
IF strength < weapon_requirement:
    damage_bonus = 2 × (strength - requirement)    [negative penalty, doubled]
ELSE:
    damage_bonus = strength - requirement          [positive bonus]

final_die_size = weapon_base_die + damage_bonus
```

**Example:** Weapon requires 3 strength, deals 1d8

- Strength 2: penalty = 2 × (2-3) = -2 → deals 1d6
- Strength 3: bonus = 3-3 = 0 → deals 1d8
- Strength 5: bonus = 5-3 = +2 → deals 1d10

## Barehanded Damage

Without a weapon equipped:

```
damage = 1d[strength]
```

At strength 2 (starting): 1d2 damage
At strength 6: 1d6 damage

## HP Regeneration

At end of each turn, characters regenerate HP:

```
IF current_HP < strength × 10:
    hp_gain = strength - floor(current_HP / 10)
    current_HP = min(current_HP + hp_gain, max_HP)
```

**Example:** Strength 5, current HP 23

- Check: 23 < 50? Yes
- hp_gain = 5 - floor(23/10) = 5 - 2 = 3
- New HP: 26

Regeneration stops when HP reaches strength × 10 (or max_HP).

## Elemental Resistance

Strength contributes to resisting certain elements:

| Element | Resistance Formula     |
| ------- | ---------------------- |
| Cold    | strength + dexterity/2 |
| Poison  | strength × 2           |
