# Buff Spells

Buff spells enhance allies or the caster with temporary bonuses.

## Buff Mechanics

Buff spells can be cast on yourself or friendly targets. Effects last for a duration based on caster's Power (similar to summon spells).

---

## Earth Buffs

### Armor

| Property  | Value                 |
| --------- | --------------------- |
| Mana Type | Earth                 |
| Mana Cost | 15                    |
| Target    | Self or friendly unit |

> "Armor — surrounds the caster (or target) with magical protective armor."
> — Help file, line 56

Increases the target's armor class, reducing physical damage taken.

---

## Water Buffs

### Haste

| Property  | Value                 |
| --------- | --------------------- |
| Mana Type | Water                 |
| Mana Cost | 30                    |
| Target    | Self or friendly unit |

> "Haste — adds speed to the caster (or target) (extra attack per round)."
> — Help file, line 66

Grants an additional attack per combat round and bonus movement speed.

---

## Death Buffs

### Unholy Strength

| Property  | Value                 |
| --------- | --------------------- |
| Mana Type | Death                 |
| Mana Cost | 25                    |
| Target    | Self or friendly unit |

> "Unholy Strength — increases the caster's (or target's) physical strength."
> — Help file, line 72

Temporarily increases the target's Strength stat.

---

## Life Buffs

### Heal

| Property  | Value                 |
| --------- | --------------------- |
| Mana Type | Life                  |
| Mana Cost | 20                    |
| Target    | Self or friendly unit |

> "Heal — restores health (points)."
> — Help file, line 74

Restores HP to the target. Healing amount scales with caster's Power and spell level.

---

## Air Utility

### Manipulate Winds

| Property  | Value                 |
| --------- | --------------------- |
| Mana Type | Air                   |
| Mana Cost | 40                    |
| Target    | Movement manipulation |

> "Manipulate Winds — allows you to influence your own and sometimes others' movement."
> — Help file, line 61

Modifies dice rolls for movement. Can add or subtract from roll results.

---

## Arcane Utility

### Pot of Gold

| Property  | Value  |
| --------- | ------ |
| Mana Type | Arcane |
| Mana Cost | 12     |
| Target    | Self   |

> "Pot of Gold — generates gold (the more power, the more gold)."
> — Help file, line 48

Creates gold directly. Amount scales with caster's Power and spell level.

---

### Create Item

| Property  | Value  |
| --------- | ------ |
| Mana Type | Arcane |
| Mana Cost | 12     |
| Target    | Self   |

> "Create Item — creates a new item."
> — Help file, line 49

Generates a random magical item. Item quality scales with caster's Power and spell level.

---

## Buff Spells Summary

| Spell            | Mana   | Cost | Effect                  |
| ---------------- | ------ | ---- | ----------------------- |
| Armor            | Earth  | 15   | +Armor class            |
| Haste            | Water  | 30   | +1 attack/round, +speed |
| Unholy Strength  | Death  | 25   | +Strength               |
| Heal             | Life   | 20   | Restore HP              |
| Manipulate Winds | Air    | 40   | Modify dice rolls       |
| Pot of Gold      | Arcane | 12   | Generate gold           |
| Create Item      | Arcane | 12   | Generate item           |

---

## Additional Spells (from data files)

The following spells exist in the game data but are not documented in the help file:

| Spell         | Mana   | Cost | Effect                                 |
| ------------- | ------ | ---- | -------------------------------------- |
| Dispel Magic  | Arcane | 6    | Removes a spell effect                 |
| Polymorph     | Arcane | 20   | Transforms mob into different creature |
| Fire Enchant  | Fire   | 6    | Adds fire damage to attacks            |
| Fire Castle   | Fire   | 6    | Trap spell for castles                 |
| Entrapment    | Earth  | 6    | Prevents fleeing from square           |
| Earthbuild    | Earth  | 6    | Halves building costs                  |
| Slow          | Earth  | 6    | Reduces dexterity or flee chance       |
| Teleport      | Air    | 20   | Teleports caster to another location   |
| Air Shield    | Air    | 20   | +Armor, missile protection             |
| Retaliation   | Water  | 7    | Reflects damage back to attacker       |
| Possession    | Water  | 7    | Attempts to control enemy              |
| Vampiric Bats | Death  | 30   | Drains life each turn                  |

**Note:** These spells appear in spells.csv but lack help file documentation. They may be later additions or planned content.
