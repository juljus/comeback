# Dexterity

## Attacks Per Round

Dexterity grants **+1 attack for every 5th dexterity point**:

| Dexterity | Attacks per Round |
|-----------|-------------------|
| 1-4 | 1 |
| 5-9 | 2 |
| 10-14 | 3 |
| 15-19 | 4 |
| ... | ... |

Formula: `attacks = 1 + floor(dexterity / 5)`

This scaling continues indefinitely.

## Flee Mechanic

When a character tries to flee and an enemy attacks them:

### Base Values
- Runner (fleeing): 2
- Chaser (attacking): 1

### Dexterity Bonus
```
dex_difference = runner_dex - chaser_dex

IF dex_difference > 0:  (runner faster)
    runner_bonus = 2 + (1 + dex_difference)²
    chaser_bonus = 1
ELSE IF dex_difference < 0:  (chaser faster)
    runner_bonus = 2
    chaser_bonus = 1 + (1 + |dex_difference|)²
ELSE:  (equal dex)
    runner_bonus = 2
    chaser_bonus = 1
```

### Flee Roll
```
roll = random(1, runner_bonus + chaser_bonus)
IF roll > chaser_bonus: escape succeeds
ELSE: caught (takes a hit, stays in combat)
```

### Examples

**Equal dex (both 5):**
- Runner: 2, Chaser: 1, Total: 3
- Roll 2 or 3 = escape (67% chance)
- Roll 1 = caught (33% chance)

**Runner has +2 dex advantage:**
- dex_difference = 2
- Runner: 2 + (1+2)² = 2 + 9 = 11
- Chaser: 1
- Escape chance: 11/12 = 92%

**Chaser has +2 dex advantage:**
- dex_difference = -2
- Runner: 2
- Chaser: 1 + (1+2)² = 1 + 9 = 10
- Escape chance: 2/12 = 17%

## Flee Blocking Conditions

Cannot flee if:
- Stunned (stun counter > 0)
- Frozen (frozen counter > 0)

## Critical Hit Chance (Pierce Weapons)

Pierce weapons use dexterity for armor penetration criticals:
```
attacker_roll = attacker_dexterity
defender_roll = defender_dexterity + 5
```
(Uses rolling_odds comparison function)

## Elemental Resistance

Dexterity contributes to resisting certain elements:

| Element | Resistance Formula |
|---------|-------------------|
| Fire | power + dexterity/2 |
| Lightning | power + dexterity/2 |
| Cold | strength + dexterity/2 |
