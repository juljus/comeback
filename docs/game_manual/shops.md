# Shops

Shops are special board squares where players can buy and sell items.

## Shop Mechanics

> "Buy_item — when landing on various locations on the board where you can buy and sell various items (depending on location: weapons, potions, spells, etc.), this button appears. Buying one item always costs one action point."
> — Help file, line 142

> "Sell — selling. Appears similarly to the Buy_item button. Also costs one action point."
> — Help file, line 143

**Key mechanics:**

- Buying costs **1 action point**
- Selling costs **1 action point**
- Shops cannot be owned (special squares)
- Shop inventories refresh over time

---

## Shop Types

### Shop

> "Shop — sells various, not very expensive items."
> — Help file, line 32

| Property           | Value          |
| ------------------ | -------------- |
| Board Spawn Chance | 20%            |
| Item Price Range   | 25–10,000 gold |

**Sells:** Rings, weapons, potions, scrolls, and miscellaneous items.

---

### Smithy

> "Smithy — a blacksmith's shop. Weapons and armor are for sale."
> — Help file, line 33

| Property           | Value          |
| ------------------ | -------------- |
| Board Spawn Chance | 10%            |
| Item Price Range   | 25–10,000 gold |

**Sells:** Helmets, body armor, boots, rings, and weapons.

---

### Bazaar

> "Bazaar — a market. May sell 'anything'."
> — Help file, line 34

| Property           | Value       |
| ------------------ | ----------- |
| Board Spawn Chance | 10%         |
| Item Price Range   | 25–400 gold |

**Sells:** All item types, but only cheaper items (max 400 gold value).

---

### Library

> "Library — from the library you can acquire spells. Additionally, you can develop spells you already know."
> — Help file, line 35

| Property           | Value          |
| ------------------ | -------------- |
| Board Spawn Chance | 10%            |
| Item Price Range   | 25–10,000 gold |

**Sells:** Scrolls only.

**Training:** Can train spell levels for spells you already know.

> "Scrolls can be acquired from the library and mage guild. Sometimes old scrolls can be found in old tombs and treasure chests."
> — Help file, line 122

---

### Mage Guild

> "Mage Guild — likewise, you can acquire spells and train your magical power (power) to be greater."
> — Help file, line 36

| Property           | Value          |
| ------------------ | -------------- |
| Board Spawn Chance | 80%            |
| Item Price Range   | 25–10,000 gold |

**Sells:** Primarily scrolls, sometimes potions and elixirs.

**Training:** Can train the Power stat.

---

## Shop Summary

| Shop       | Spawn % | Price Range | Primary Stock    |
| ---------- | ------- | ----------- | ---------------- |
| Shop       | 20%     | 25–10,000   | Mixed items      |
| Smithy     | 10%     | 25–10,000   | Weapons & armor  |
| Bazaar     | 10%     | 25–400      | Cheap everything |
| Library    | 10%     | 25–10,000   | Scrolls          |
| Mage Guild | 80%     | 25–10,000   | Scrolls, potions |

---

## Item Categories

Items sold in shops fall into these categories:

| Type       | Examples                                           |
| ---------- | -------------------------------------------------- |
| Helmets    | Iron Helm, Steel Helmet, Mithril Helm              |
| Body Armor | Leather Suit, Chain Mail, Plate Mail               |
| Boots      | Iron Boots, Boots of Speed, Elven Boots            |
| Rings      | Ring of Power, Ring of Protection, Elemental Rings |
| Weapons    | Daggers, Swords, Maces, Axes                       |
| Potions    | Healing Potion, Strength Potion, Mana Elixirs      |
| Scrolls    | Spell scrolls for all magic schools                |

---

## Scrolls

Scrolls teach spells when read. If you already know the spell, reading the scroll increases its level.

> "The ability to cast spells is acquired by reading a corresponding scroll or by building a temple or altar. If you already have an altar that grants the same spell, reading a scroll increases your spell's power."
> — Help file, line 121

| Scroll                   | Price | Teaches          |
| ------------------------ | ----- | ---------------- |
| Scroll of Magic Arrow    | 50    | Magic Arrow      |
| Scroll of Fire Bolt      | 80    | Fire Bolt        |
| Scroll of Frost Bolt     | 80    | Frost Bolt       |
| Scroll of Pot of Gold    | 70    | Pot of Gold      |
| Scroll of Create Item    | 80    | Create Item      |
| Scroll of Summon Angel   | 200   | Summon Angel     |
| Scroll of Spirit         | 50    | Spirit Guardian  |
| Scroll of Raise Dead     | 80    | Raise Dead       |
| Scroll of Heal           | 150   | Heal             |
| Scroll of Fireball       | 200   | Fireball         |
| Scroll of Lightning Bolt | 100   | Lightning Bolt   |
| Scroll of Wrath          | 300   | Wrath of God     |
| Scroll of Summon Fire    | 120   | Summon Fire      |
| Scroll of Summon Earth   | 120   | Summon Earth     |
| Scroll of Summon Air     | 120   | Summon Air       |
| Scroll of Summon Water   | 120   | Summon Water     |
| Scroll of Summon Golem   | 80    | Summon Golem     |
| Scroll of Armor          | 80    | Armor            |
| Scroll of Earth Hammer   | 80    | Earth Hammer     |
| Scroll of the Beast      | 100   | Summon Beasts    |
| Scroll of the Winds      | 100   | Manipulate Winds |
| Scroll of Haste          | 150   | Haste            |
| Scroll of Death          | 200   | Death Grasp      |
| Scroll of Dark Strength  | 100   | Unholy Strength  |

---

## Potions

Potions are consumable items with immediate effects.

| Potion               | Price | Effect                  |
| -------------------- | ----- | ----------------------- |
| Healing Potion       | 80    | +15 HP                  |
| Major Healing Potion | 200   | +30 HP                  |
| Elixir of Life       | 600   | +60 HP                  |
| Strength Potion      | 100   | +1 Strength (permanent) |
| Power Potion         | 100   | +1 Power (permanent)    |
| Elixir of Mana       | 300   | +3 Arcane mana          |
| Elixir of Fire       | 250   | +2 Fire mana            |
| Elixir of Air        | 250   | +2 Air mana             |
| Elixir of Ice        | 250   | +2 Water mana           |
