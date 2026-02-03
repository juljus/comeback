# Fleeing

## Flee Action

A combatant can choose to flee (action = 0) instead of attacking.

## Flee Resolution

When a melee attacker targets someone trying to flee:

### Blocking Conditions
Flee automatically fails if target is:
- **Stunned** (stun counter > 0)
- **Frozen** (frozen counter > 0)

### Chase Roll

If not blocked, a chase roll determines escape:

**Base Values:**
- Runner (fleeing): 2
- Chaser (attacking): 1

**Dexterity Modifier:**
```
dex_diff = runner_dexterity - chaser_dexterity

IF dex_diff > 0:  (runner faster)
    runner_bonus = 2 + (1 + dex_diff)²
    chaser_bonus = 1
ELSE IF dex_diff < 0:  (chaser faster)
    runner_bonus = 2
    chaser_bonus = 1 + (1 + |dex_diff|)²
ELSE:  (equal)
    runner_bonus = 2
    chaser_bonus = 1
```

**Resolution:**
```
roll = random(1, runner_bonus + chaser_bonus)
IF roll > chaser_bonus:
    ESCAPE SUCCESS
ELSE:
    CAUGHT - takes normal attack, stays in combat
```

## Escape Chance Examples

| Runner Dex | Chaser Dex | Diff | Runner | Chaser | Escape % |
|------------|------------|------|--------|--------|----------|
| 5 | 5 | 0 | 2 | 1 | 67% |
| 7 | 5 | +2 | 11 | 1 | 92% |
| 5 | 7 | -2 | 2 | 10 | 17% |
| 10 | 5 | +5 | 38 | 1 | 97% |
| 5 | 10 | -5 | 2 | 37 | 5% |

## Successful Escape Effects

When escape succeeds:
1. Fleeing character is **removed from combat**
2. **Bleeding is cleared** (wounds bandaged during escape)
3. Attacker's turn continues (may attack another target)

## Failed Escape Effects

When caught:
1. Attacker gets a **free hit** on the fleeing target
2. Target **remains in combat**
3. Target's action is wasted for this round

## Ranged Attackers

Ranged attackers (action = 2) do **not** trigger chase rolls. They simply shoot at the fleeing target normally.

## Global Flee

Players can order all their characters to flee simultaneously. Each character resolves their flee attempt individually when attacked.
