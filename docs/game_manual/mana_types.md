# Mana Types

Mana is the energy required to cast spells.

> "Mana — energy required for casting spells. Mana can be obtained from lands, potions, magical items. Each spell you want to cast requires a certain amount of mana."
> — Help file, line 23

> "Each spell requires one specific type of mana. There are seven mana types: fire, earth, air, water, death (black), life (white), arcane mana."
> — Help file, line 114

> "If the required amount of mana is not available, casting the spell is not possible."
> — Help file, line 115

---

## The Seven Mana Types

| Mana Type | Color      | Source Lands           |
| --------- | ---------- | ---------------------- |
| Fire      | Red        | Hill, Mountain         |
| Earth     | Green      | Forest, Brushland      |
| Air       | Light Blue | Desert, Rocks          |
| Water     | Dark Blue  | Jungle, Iceland, Coast |
| Death     | Blue-Gray  | Swamp, Dark Forest     |
| Life      | White      | Valley, Plain          |
| Arcane    | Gold       | Arcane Tower, Pyramids |

---

## Mana Sources

### From Owned Lands

When you own a land that produces mana, you gain mana regeneration of that type. Mana regenerates each turn based on the lands you own.

Each mana-producing land grants **+1 mana regeneration** of its type per turn.

### From Arcane Towers

> "Arcane Tower — One arcane tower produces 1 arcane mana per day, two arcane towers produce 3 arcane mana per day, 3 arcane towers produce 6 and 4 arcane towers owned by one player produce 10 arcane mana per day."
> — Help file, line 40

Arcane Towers are special locations that produce Arcane mana with stacking bonuses:

| Towers Owned | Arcane Mana per Turn |
| ------------ | -------------------- |
| 1            | 1                    |
| 2            | 3                    |
| 3            | 6                    |
| 4            | 10                   |

**Note:** VBA implementation shows 1/3/6/12 instead of 1/3/6/10. Help file value (10) is documented here as source of truth.

### From Items

Magical items and potions can provide mana or mana regeneration.

---

## Mana and Spells

Each spell belongs to one mana type and requires a specific amount of that mana to cast:

| Mana Type | Example Spells                                      |
| --------- | --------------------------------------------------- |
| Fire      | Fire Bolt, Fireball, Summon Fire                    |
| Earth     | Armor, Earth Hammer, Summon Earth, Summon Beasts    |
| Air       | Lightning Bolt, Manipulate Winds, Summon Air        |
| Water     | Frost Bolt, Blizzard, Haste, Summon Water           |
| Death     | Death Grasp, Raise Dead, Unholy Strength            |
| Life      | Heal, Spirit Guardian, Summon Angel, Wrath of God   |
| Arcane    | Magic Arrow, Pot of Gold, Create Item, Summon Golem |

---

## Mana Colors in UI

The help file specifies display colors for each mana type:

| Mana Type | Color                   |
| --------- | ----------------------- |
| Fire      | Red (punane)            |
| Earth     | Green (roheline)        |
| Air       | Light Blue (helesinine) |
| Water     | Dark Blue (tumesinine)  |
| Death     | Blue-Gray (sinakashall) |
| Life      | White (valge)           |
| Arcane    | Gold (kuldne)           |

---

## Land-Mana Summary

### Lands That Produce Mana

| Mana Type | Lands                  |
| --------- | ---------------------- |
| Fire      | Hill, Mountain         |
| Earth     | Forest, Brushland      |
| Air       | Desert, Rocks          |
| Water     | Jungle, Iceland, Coast |
| Death     | Swamp, Dark Forest     |
| Life      | Valley, Plain          |
| Arcane    | Pyramids (special)     |

### Lands That Do NOT Produce Mana

- Highland
- Barren
- Tundra
- Woodland
- Burrows
- Volcano
- Ruins

These lands have other advantages (combat bonuses, economic buildings, healing) but do not generate mana.
