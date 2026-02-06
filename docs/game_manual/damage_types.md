# Damage Types

## Physical Weapon Types

Three weapon types exist, each with unique critical hit mechanics:

### Pierce (Type 1, 11)

**Examples:** Daggers, spears, rapiers

**Critical Check:**

```
attacker_value = attacker_dexterity
defender_value = defender_dexterity + 5
critical_chance = attacker_value / (attacker_value + defender_value)
```

**Critical Effect:**

- **Ignores armor completely**
- Full damage passes through regardless of target armor
- Buildings are immune to pierce criticals

**Strategy:** Good against heavily armored targets. Dex-based characters benefit most.

---

### Slash (Type 2)

**Examples:** Swords, axes

**Critical Check:**

```
attacker_value = attacker_strength + floor(attacker_dexterity / 2)
defender_value = defender_dexterity + 3
critical_chance = attacker_value / (attacker_value + defender_value)
```

**Critical Effect:**

- Requires: damage > 3 AND target not bleed-immune
- **Applies bleeding** = floor(damage / 2)
- Bleeding deals damage each combat round

**Strategy:** Good for sustained damage. Strength+Dex hybrid characters benefit.

---

### Crush (Type 3)

**Examples:** Maces, hammers, clubs

**Critical Check:**

```
attacker_value = attacker_strength × 2
defender_value = defender_dexterity³ + 2
```

(Note: defender uses dexterity cubed!)

**Critical Effect:**

- Requires: damage > 5 AND target not stun-immune
- **Applies stun** for 2 turns
- Stunned targets cannot act

**Strategy:** High risk/reward. Very hard to crit against high-dex targets, but stun is powerful.

---

## Elemental Damage Types

Weapons can have elemental damage bonuses (columns 50-53). Elemental damage is applied separately after physical damage.

### Fire (Column 50)

**Resistance Formula:**

```
damage = base_elemental - random(0, target_power-1) - random(0, floor(target_dex/2)-1)
```

**Immunity:** Column 59 > 0

**Critical Check:** (if damage > 4)

```
attacker_value = 2
defender_value = target_strength + 3
```

**Critical Effect:** Applies **burning** status

---

### Poison (Column 51)

**Resistance Formula:**

```
damage = base_elemental - random(0, target_strength × 2 - 1)
```

**Immunity:** Column 60 > 0

---

### Lightning (Column 52)

**Resistance Formula:**

```
damage = base_elemental - random(0, target_power-1) - random(0, floor(target_dex/2)-1)
```

**Immunity:** Column 61 > 0

---

### Cold (Column 53)

**Resistance Formula:**

```
damage = base_elemental - random(0, target_strength-1) - random(0, floor(target_dex/2)-1)
```

**Immunity:** Column 62 > 0

**Critical Effect:** Can apply **frozen** status

---

## Status Effect Summary

| Status   | Source     | Effect           | Decay                   |
| -------- | ---------- | ---------------- | ----------------------- |
| Bleeding | Slash crit | Damage per round | -random(0, bleed/2) - 1 |
| Burning  | Fire crit  | Damage per round | -random(0, str/2) - 1   |
| Stun     | Crush crit | Cannot act       | -1 per round            |
| Frozen   | Cold crit  | Cannot act       | -1 per round            |

Bleeding is cleared when successfully fleeing combat.
