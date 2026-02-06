# Damage Spells

Damage spells deal direct damage to enemies. Damage scales with caster's Power and spell level.

## Damage Formula

> "If your power is 2 and your opponent's power is also 2, then your 'Fire Bolt' spell does about as much damage as stated in the spell info - about 9 damage. If the opponent had 2× less power than you (1), then your Fire Bolt would burn them for at least 2× more - at least 18 damage. The same ratio applies if your power is 6 and opponent's is 3."
> — Help file, line 118

> "If you manage to increase your spell's level, then you have gained a powerful weapon. The damage you deal is multiplied by 2× or 3× at level 2 or 3."
> — Help file, line 119

**Damage calculation:**

```
base_damage × spell_level × (caster_power / target_power)
```

---

## Single Target Spells

### Magic Arrow

| Property    | Value        |
| ----------- | ------------ |
| Mana Type   | Arcane       |
| Mana Cost   | 3            |
| Base Damage | 7            |
| Target      | Single enemy |

> "Magic Arrow — shoots a magical arrow at one enemy (base damage 7)."
> — Help file, line 47

---

### Fire Bolt

| Property    | Value        |
| ----------- | ------------ |
| Mana Type   | Fire         |
| Mana Cost   | 20           |
| Base Damage | 9            |
| Target      | Single enemy |

> "Fire Bolt — shoots magical fire at one enemy."
> — Help file, line 52

---

### Earth Hammer

| Property    | Value        |
| ----------- | ------------ |
| Mana Type   | Earth        |
| Mana Cost   | 20           |
| Base Damage | 7            |
| Target      | Single enemy |

> "Earth Hammer — shoots a magical charge at one enemy (base damage 7)."
> — Help file, line 58

---

### Lightning Bolt

| Property    | Value        |
| ----------- | ------------ |
| Mana Type   | Air          |
| Mana Cost   | 20           |
| Base Damage | 8            |
| Target      | Single enemy |

> "Lightning Bolt — shoots lightning at one enemy (base damage 8)."
> — Help file, line 62

---

### Frost Bolt

| Property    | Value        |
| ----------- | ------------ |
| Mana Type   | Water        |
| Mana Cost   | 20           |
| Base Damage | 8            |
| Target      | Single enemy |

> "Frost Bolt — shoots magical cold at one enemy (base damage 8)."
> — Help file, line 65

---

### Death Grasp

| Property    | Value                   |
| ----------- | ----------------------- |
| Mana Type   | Death                   |
| Mana Cost   | 25                      |
| Base Damage | 7                       |
| Target      | Single enemy            |
| Special     | Vampiric (heals caster) |

> "Death Grasp — shoots a magical black arrow that takes life from the enemy and gives it to the caster (base damage 7)."
> — Help file, line 70

---

## Group Target Spells

Group spells hit **all enemies in one group** (all defenders on a land, for example).

### Fireball

| Property    | Value       |
| ----------- | ----------- |
| Mana Type   | Fire        |
| Mana Cost   | 40          |
| Base Damage | 6           |
| Target      | Enemy group |

> "Fireball — burns all enemies in one group (base damage 6)."
> — Help file, line 53

---

### Blizzard

| Property    | Value       |
| ----------- | ----------- |
| Mana Type   | Water       |
| Mana Cost   | 35          |
| Base Damage | 5           |
| Target      | Enemy group |

> "Blizzard — freezes all enemies in one group (base damage 5)."
> — Help file, line 67

---

### Wrath of God

| Property    | Value       |
| ----------- | ----------- |
| Mana Type   | Life        |
| Mana Cost   | 50          |
| Base Damage | 10          |
| Target      | Enemy group |

> "Wrath of God — calls forth a powerful charge that hits all enemies in one group (base damage 7)."
> — Help file, line 77

**Note:** Help file says base damage 7, but spells.csv shows base damage 10. VBA confirms 10.

---

## Damage Spells Summary

| Spell          | Mana   | Cost | Base Damage | Target            |
| -------------- | ------ | ---- | ----------- | ----------------- |
| Magic Arrow    | Arcane | 3    | 7           | Single            |
| Fire Bolt      | Fire   | 20   | 9           | Single            |
| Earth Hammer   | Earth  | 20   | 7           | Single            |
| Lightning Bolt | Air    | 20   | 8           | Single            |
| Frost Bolt     | Water  | 20   | 8           | Single            |
| Death Grasp    | Death  | 25   | 7           | Single (vampiric) |
| Fireball       | Fire   | 40   | 6           | Group             |
| Blizzard       | Water  | 35   | 5           | Group             |
| Wrath of God   | Life   | 50   | 10          | Group             |

---

## Spell Level Effects

Spells can be trained to higher levels at Libraries and Mage Guilds, or by reading scrolls when you already know the spell.

| Spell Level | Damage Multiplier |
| ----------- | ----------------- |
| 1           | ×1                |
| 2           | ×2                |
| 3           | ×3                |

**Example:** Fire Bolt (base 9) at level 3 deals 27 base damage before power scaling.
