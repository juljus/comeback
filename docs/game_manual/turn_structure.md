# Turn Structure

## Action Points

Each turn has **3 action points** representing times of day:

| Points Used | Time of Day |
|-------------|-------------|
| 0 | Pre-move (turn just started) |
| 1 | Morning |
| 2 | Noon |
| 3 | Evening |

When all 3 points are used (or player ends turn), turn is over.

## Action Costs

### Costs 1 Action Point
- Attack (each attempt)
- Buy item
- Sell item
- Cast spell (out of combat)
- Upgrade defender
- Pillage land
- Hire mercenary
- Most special location actions

### Requires Full Day (Morning Only)
These actions can only be done if no action points have been used yet:
- **Buy Land** - purchasing unowned land
- **Train Stat** - at Training Grounds
- **Train Spell** - at Library or Mage Guild

### Uses All Remaining Points
- **Rest** - can be used at any time during turn, consumes all remaining action points

## Rest Healing

```
healing = (land_healing_value + sanctuary_bonus) / 3 × remaining_action_points
```

- Rest at morning (3 points left): 3× multiplier
- Rest at noon (2 points left): 2× multiplier
- Rest at evening (1 point left): 1× multiplier

Healing applies to player and all companions.

## Board

- **34 squares** total
- Square 1 is always **Royal Court**
- Other squares are randomly placed each game
- Board wraps (moving past square 34 returns to square 1)

## Starting Values (New Game)

| Attribute | Value |
|-----------|-------|
| Gold | 200 |
| HP | 20 |
| Max HP | 10000 |
| Strength | 2 |
| Dexterity | 2 |
| Power | 2 |
| Attacks per round | 1 |
| Starting weapon | Knife (1d4 damage) |
| Armor | 0 |
| Mana (all types) | 0 |
