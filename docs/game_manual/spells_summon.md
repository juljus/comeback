# Summon Spells

Summon spells create companions that fight alongside the caster.

## Summon Mechanics

> "For example the spell 'Summon Fire Elemental', if the caster's power is 2 and the spell level is 1, then casting this spell creates 1 fire elemental (who stays as the caster's companion for 4 days/turns). But if the caster's power is 5 and the spell level is 3, then casting this spell creates 3 fire elementals, who all stay under the caster's command for 10 days/turns."
> — Help file, line 120

**Key mechanics:**

- **Spell level** determines creature quality and quantity
- **Power** determines duration (how many turns companions serve)
- Companions fight alongside you in combat
- Companions expire after duration ends

---

## Arcane Summons

### Summon Golem

| Property  | Value  |
| --------- | ------ |
| Mana Type | Arcane |
| Mana Cost | 15     |

| Spell Level | Creature    | Count |
| ----------- | ----------- | ----- |
| 1           | Clay Golem  | 1     |
| 2           | Stone Golem | 2     |
| 3           | Iron Golem  | 3     |
| 4           | Steel Golem | 4     |

> "Summon Golem — creates a golem, a living figure made of stone or iron, who serves the caster."
> — Help file, line 50

---

## Fire Summons

### Summon Fire

| Property  | Value |
| --------- | ----- |
| Mana Type | Fire  |
| Mana Cost | 40    |

| Spell Level | Creature       | Count |
| ----------- | -------------- | ----- |
| 1           | Fire Elemental | 1     |
| 2           | Fire Elemental | 2     |
| 3           | Fire Elemental | 3     |
| 4           | Fire Elemental | 4     |

> "Summon Fire — creates a fire elemental."
> — Help file, line 54

---

## Earth Summons

### Summon Earth

| Property  | Value |
| --------- | ----- |
| Mana Type | Earth |
| Mana Cost | 40    |

| Spell Level | Creature        | Count |
| ----------- | --------------- | ----- |
| 1           | Earth Elemental | 1     |
| 2           | Earth Elemental | 2     |
| 3           | Earth Elemental | 3     |
| 4           | Earth Elemental | 4     |

> "Summon Earth — creates an earth elemental."
> — Help file, line 57

---

### Summon Beasts

| Property  | Value |
| --------- | ----- |
| Mana Type | Earth |
| Mana Cost | 25    |

| Spell Level | Creature | Count |
| ----------- | -------- | ----- |
| 1           | Wolf     | 2     |
| 2           | Bear     | 3     |
| 3           | Bear     | 4     |
| 4           | Lion     | 4     |

> "Summon Beasts — summons forest creatures as your companions and allies."
> — Help file, line 59

---

## Air Summons

### Summon Air

| Property  | Value |
| --------- | ----- |
| Mana Type | Air   |
| Mana Cost | 40    |

| Spell Level | Creature      | Count |
| ----------- | ------------- | ----- |
| 1           | Air Elemental | 1     |
| 2           | Air Elemental | 2     |
| 3           | Air Elemental | 3     |
| 4           | Air Elemental | 4     |

> "Summon Air — creates an air elemental."
> — Help file, line 63

---

## Water Summons

### Summon Water

| Property  | Value |
| --------- | ----- |
| Mana Type | Water |
| Mana Cost | 40    |

| Spell Level | Creature        | Count |
| ----------- | --------------- | ----- |
| 1           | Water Elemental | 1     |
| 2           | Water Elemental | 2     |
| 3           | Water Elemental | 3     |
| 4           | Water Elemental | 4     |

> "Summon Water — creates a water elemental."
> — Help file, line 68

---

## Death Summons

### Raise Dead

| Property  | Value |
| --------- | ----- |
| Mana Type | Death |
| Mana Cost | 20    |

| Spell Level | Creature | Count |
| ----------- | -------- | ----- |
| 1           | Skeleton | 2     |
| 2           | Skeleton | 3     |
| 3           | Ghoul    | 4     |
| 4           | Ghoul    | 5     |

> "Raise Dead — raises the dead (skeletons or others) to serve you."
> — Help file, line 71

---

## Life Summons

### Summon Angel

| Property  | Value |
| --------- | ----- |
| Mana Type | Life  |
| Mana Cost | 50    |

| Spell Level | Creature  | Count |
| ----------- | --------- | ----- |
| 1           | Angel     | 1     |
| 2           | Angel     | 2     |
| 3           | Angel     | 3     |
| 4           | Archangel | 3     |

> "Summon Angel — summons an angel from heaven as your companion and ally."
> — Help file, line 75

---

### Spirit Guardian

| Property  | Value |
| --------- | ----- |
| Mana Type | Life  |
| Mana Cost | 20    |

| Spell Level | Creature        | Count |
| ----------- | --------------- | ----- |
| 1           | Spirit          | 1     |
| 2           | Spirit          | 2     |
| 3           | Guardian Spirit | 3     |
| 4           | Guardian Spirit | 4     |

> "Spirit Guardian — summons a guardian spirit as your companion."
> — Help file, line 76

---

## Summon Spells Summary

| Spell           | Mana   | Cost | Level 1            | Level 4            |
| --------------- | ------ | ---- | ------------------ | ------------------ |
| Summon Golem    | Arcane | 15   | 1× Clay Golem      | 4× Steel Golem     |
| Summon Fire     | Fire   | 40   | 1× Fire Elemental  | 4× Fire Elemental  |
| Summon Earth    | Earth  | 40   | 1× Earth Elemental | 4× Earth Elemental |
| Summon Beasts   | Earth  | 25   | 2× Wolf            | 4× Lion            |
| Summon Air      | Air    | 40   | 1× Air Elemental   | 4× Air Elemental   |
| Summon Water    | Water  | 40   | 1× Water Elemental | 4× Water Elemental |
| Raise Dead      | Death  | 20   | 2× Skeleton        | 5× Ghoul           |
| Summon Angel    | Life   | 50   | 1× Angel           | 3× Archangel       |
| Spirit Guardian | Life   | 20   | 1× Spirit          | 4× Guardian Spirit |

---

## Duration

Summoned companions stay for a number of turns based on caster's Power:

| Power | Duration (turns) |
| ----- | ---------------- |
| 2     | 4                |
| 5     | 10               |
| ...   | ~2× Power        |

**Formula:** Duration ≈ Power × 2 (approximate, based on help file example)
