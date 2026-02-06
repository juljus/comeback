# Buildings by Land

Beyond fortifications, each land type has unique buildings that grant spells or allow hiring mercenaries.

> "After building fortifications, you can build various buildings (altar, temple, barracks, etc.), which all add different abilities and bonuses."
> — Help file, line 127

## Universal Buildings

Available on **all** capturable lands:

| Building      | Cost | Prerequisite       | Effect                         |
| ------------- | ---- | ------------------ | ------------------------------ |
| Fort          | 200  | —                  | +2 Archers, Gate               |
| Citadel       | 150  | Fort               | +1 Archer, Stronger Gate       |
| Castle        | 200  | Citadel            | +1 Archer, Strongest Gate      |
| Fletchery     | 30   | Citadel            | Upgrades Archers → Crossbowmen |
| Archery Guild | 100  | Castle + Fletchery | Upgrades → Elite Archers       |
| Portal        | 600  | Castle             | Teleport to defend castle      |

---

## Altars & Temples

Altars and Temples grant spells. Building an altar teaches you the spell.

> "The ability to cast spells is acquired by reading a corresponding scroll or by building a temple or altar. If you already have an altar that grants the same spell, reading a scroll increases your spell's power."
> — Help file, line 121

### Altar Pattern

- **Cost:** 50 gold
- **Prerequisite:** Fort
- **Effect:** Grants a spell

### Temple Pattern

- **Cost:** 100 gold
- **Prerequisite:** Castle + corresponding Altar
- **Effect:** Grants a more powerful spell

---

## Spell Buildings by Element

### Life (White) Magic

**Available on:** Valley, Plain

| Land   | Altar Spell     | Temple Spell |
| ------ | --------------- | ------------ |
| Valley | Heal            | Summon Angel |
| Plain  | Spirit Guardian | Wrath of God |

### Death (Black) Magic

**Available on:** Swamp, Dark Forest

| Land        | Altar Spell     | Temple Spell |
| ----------- | --------------- | ------------ |
| Swamp       | Raise Dead      | Death Grasp  |
| Dark Forest | Unholy Strength | Death Grasp  |

### Fire Magic

**Available on:** Hill, Mountain

| Land     | Altar Spell | Temple Spell |
| -------- | ----------- | ------------ |
| Hill     | Fire Bolt   | Summon Fire  |
| Mountain | Fire Bolt   | Fireball     |

### Earth Magic

**Available on:** Forest, Brushland

| Land      | Altar Spell  | Temple Spell  |
| --------- | ------------ | ------------- |
| Forest    | Armor        | Summon Beasts |
| Brushland | Earth Hammer | Summon Earth  |

### Air Magic

**Available on:** Desert, Rocks

| Land   | Altar Spell    | Temple Spell     |
| ------ | -------------- | ---------------- |
| Desert | Lightning Bolt | Manipulate Winds |
| Rocks  | Lightning Bolt | Summon Air       |

**Note:** Help file says Desert temple grants Manipulate Winds, but buildings.csv shows Summon Air for both. Help file is source of truth.

### Water Magic

**Available on:** Jungle, Iceland

| Land    | Altar Spell | Temple Spell |
| ------- | ----------- | ------------ |
| Jungle  | Frost Bolt  | Summon Water |
| Iceland | Frost Bolt  | Summon Water |

---

## Combat Buildings

### Fighting Pits

**Available on:** Highland, Barren

| Building      | Cost | Prerequisite | Effect              |
| ------------- | ---- | ------------ | ------------------- |
| Fighting Pits | 100  | Fort         | +1 attack per round |

---

## Economic Buildings

### Treasury & Bank

**Available on:** Volcano, Burrows

| Building | Cost | Prerequisite       | Effect                           |
| -------- | ---- | ------------------ | -------------------------------- |
| Treasury | 50   | Fort               | +50 income to land               |
| Bank     | 100  | Treasury + Citadel | +10 gold per taxed land per bank |

### Healing Buildings

**Available on:** Woodland

| Building     | Cost | Prerequisite           | Effect                         |
| ------------ | ---- | ---------------------- | ------------------------------ |
| Elven Shrine | 30   | Fort                   | +healing on all Woodland lands |
| Sanctuary    | 100  | Citadel + Elven Shrine | +healing on ALL lands          |

---

## Recruitment Buildings

These buildings allow hiring mercenaries of specific types.

| Building     | Cost | Prerequisite          | Land     | Hires         |
| ------------ | ---- | --------------------- | -------- | ------------- |
| Barracks     | 50   | Fort                  | Valley   | Swordmen      |
| Stables      | 100  | Citadel               | Highland | Horsemen      |
| War Academy  | 300  | Castle + Stables      | Highland | Cavalry       |
| Hunting Camp | 50   | Fort                  | Tundra   | Hunters       |
| Ranger Camp  | 100  | Castle + Hunting Camp | Tundra   | Horse Archers |
| Harpy Nest   | 100  | Citadel               | Barren   | Harpies       |
| Dragon Nest  | 300  | Citadel               | Volcano  | Red Dragons   |

---

## Additional Land Buildings (from data files)

Buildings for lands not documented in help file:

### Pyramids

| Building        | Cost | Prerequisite | Effect              |
| --------------- | ---- | ------------ | ------------------- |
| Sarcophagus     | 50   | Fort         | Grants Summon Golem |
| Stone of Wisdom | 500  | Castle       | Unknown effect      |

### Ruins

| Building          | Cost | Prerequisite             | Effect             |
| ----------------- | ---- | ------------------------ | ------------------ |
| Precision Stone   | 70   | Citadel                  | +1 Dexterity bonus |
| Precision Crystal | 150  | Castle + Precision Stone | +2 Dexterity bonus |

### Coast

| Building      | Cost | Prerequisite        | Effect          |
| ------------- | ---- | ------------------- | --------------- |
| Water Altar   | 50   | Citadel             | Grants Blizzard |
| Magic Room    | 70   | Citadel             | +1 Power bonus  |
| Magic Hallway | 150  | Castle + Magic Room | +2 Power bonus  |

### Woodland (from data, differs from help)

| Building          | Cost | Prerequisite | Effect            |
| ----------------- | ---- | ------------ | ----------------- |
| Stone of Strength | 70   | Fort         | +1 Strength bonus |
| Totem of Strength | 150  | Castle       | +2 Strength bonus |

**Note:** Help file describes Woodland as having Elven Shrine and Sanctuary. The data files show different buildings (Stone/Totem of Strength). This may be a data vs design discrepancy.

---

## Building Prerequisite Summary

```
Fort (any land)
├── Altar (element-specific)
│   └── Temple (requires Castle)
├── Citadel
│   ├── Castle
│   │   ├── Portal
│   │   ├── Archery Guild (requires Fletchery)
│   │   └── Temple (requires Altar)
│   ├── Fletchery
│   └── Stables / Harpy Nest / Dragon Nest
└── Fighting Pits / Treasury / Elven Shrine / Barracks / Hunting Camp
```
