# Power

## Spell Damage

For damage spells:

```
bonus_damage = caster_power / 2
life_loss = floor(
    (spell_level × base_damage + random(0, bonus_damage-1))
    × caster_power / target_power
    - random(0, target_power-1)
)
```

Key factors:

- Damage scales with spell level (knowledge)
- Damage scales with caster_power / target_power ratio
- Target's power provides flat reduction via random roll

**Example:** Spell level 2, base damage 10, caster power 6, target power 3

- bonus_damage = 3
- damage = floor((2×10 + random(0,2)) × 6/3 - random(0,2))
- damage ≈ floor(20-22 × 2 - 0-2) = 38-44 damage

## Spell Resistance (Manipulate Winds)

When casting spells that can be resisted:

```
resist_roll = random(0, target_power × 2 - 1) + 10
IF resist_roll <= spell_strength:
    spell affects target
ELSE:
    target resists
```

Higher target power = higher chance to resist.

## Buff Spell Effects

Different buff spells scale differently with power:

### Magic Armor

- Armor bonus: `spell_level + floor(power / 2)`
- Duration: `2 + power²` turns

### Haste

- Extra attacks: `spell_level + floor(power / 8)`
- Duration: `2 + power` turns

### Unholy Strength

- Strength bonus: `2 × spell_level + floor(power / 10)`
- Duration: `2 + power²` turns

### Manipulate Winds

- Winds strength: `spell_level + floor(power / 2)`
- Duration: `power - 1` turns

## Summon Duration

Summoned creatures last:

```
duration = power × 2 turns
```

Number summoned = spell level (knowledge of that spell)

## Summon Stat Scaling

If spell level > 1, summoned creatures get boosted stats:

```
stat_multiplier = (20 + (spell_level - 1) × 2) / 10
```

| Spell Level | Multiplier  |
| ----------- | ----------- |
| 1           | 1.0× (base) |
| 2           | 2.2×        |
| 3           | 2.4×        |
| 4           | 2.6×        |
| 5           | 2.8×        |

Applies to: HP, max HP, damage die

## Elemental Resistance

Power contributes to resisting certain elements:

| Element   | Resistance Formula  |
| --------- | ------------------- |
| Fire      | power + dexterity/2 |
| Lightning | power + dexterity/2 |

## Heal Spell

```
heal_amount = spell_level × power × 3
```
