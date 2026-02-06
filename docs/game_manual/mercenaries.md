# Mercenaries

Mercenaries are companions you can hire for gold to fight alongside you.

## Mercenary Camp

> "Merc.camp — (mercenary camp) mercenary camp. From the merc.camp you can hire mercenaries for gold. The higher the player's title, the more creatures are willing to serve the player."
> — Help file, line 37

> "Hire_n_creature — hire. Appears when you land on a mercenary camp square, where you can hire companions for gold for some time."
> — Help file, line 159

| Property           | Value |
| ------------------ | ----- |
| Board Spawn Chance | 10%   |
| Maximum Companions | 20    |

---

## Hiring Mechanics

When visiting a mercenary camp:

1. A random selection of mercenaries is generated
2. Number available depends on your title (see Title Bonuses below)
3. Each mercenary has a contract duration (5, 10, 15, or 20 turns)
4. Hiring costs gold based on the creature's base cost and contract length

**Hiring Cost Formula:**

```
cost = base_cost × contract_turns × 2
```

**Example:** A Swordman (base cost 7) for 10 turns costs 7 × 10 × 2 = 140 gold.

---

## Title Bonuses

Your title affects how many and which mercenaries are willing to serve you:

| Title Level | Mercenaries Available | Creature Power Limit |
| ----------- | --------------------- | -------------------- |
| 0 (None)    | 0–2                   | Low                  |
| 1           | 1–3                   | Medium               |
| 2           | 2–4                   | Higher               |
| 3           | 3–5                   | Highest              |

Higher titles unlock access to stronger creatures with higher "gallantry" (willingness to serve) requirements.

---

## Recruitment Buildings

You can build structures on owned lands that allow hiring specific mercenary types:

> "Valley — can build: barracks (from barracks you can hire swordmen)."
> — Help file, line 80

> "Highland — can build: stables (possible to hire horsemen)."
> — Help file, line 82

> "Barren — can build: harpy nest (possible to hire harpies)."
> — Help file, line 85

> "Tundra — can build: hunting camp (possible to hire hunters) and ranger camp (possible to hire rangers)."
> — Help file, line 86

> "Volcano — can build: dragon nest (possible to hire red dragons)."
> — Help file, line 89

### Recruitment Building Summary

| Building     | Land     | Prerequisite          | Cost | Hires         |
| ------------ | -------- | --------------------- | ---- | ------------- |
| Barracks     | Valley   | Fort                  | 50   | Swordmen      |
| Stables      | Highland | Citadel               | 100  | Horsemen      |
| War Academy  | Highland | Castle + Stables      | 300  | Cavalry       |
| Hunting Camp | Tundra   | Fort                  | 50   | Hunters       |
| Ranger Camp  | Tundra   | Castle + Hunting Camp | 100  | Horse Archers |
| Harpy Nest   | Barren   | Citadel               | 100  | Harpies       |
| Dragon Nest  | Volcano  | Citadel               | 300  | Red Dragons   |

---

## Mercenary Stats

Common mercenaries available for hire:

### Basic Mercenaries

| Creature | HP  | Attacks | Damage | Armor | Base Cost |
| -------- | --- | ------- | ------ | ----- | --------- |
| Pikeman  | 12  | 1       | 1d5+1  | 3     | 5         |
| Swordman | 15  | 1       | 1d6+2  | 4     | 7         |
| Hunter   | 12  | 1       | 1d4+11 | 1     | 5         |
| Horseman | 18  | 1       | 1d7+3  | 3     | 9         |
| Harpy    | 18  | 1       | 1d6    | 1     | 9         |

### Advanced Mercenaries

| Creature     | HP  | Attacks | Damage | Armor | Base Cost |
| ------------ | --- | ------- | ------ | ----- | --------- |
| Ranger       | 20  | 1       | 2d3+2  | 7     | 12        |
| Horse Archer | 20  | 1       | 2d4+11 | 0     | 7         |
| Cavalier     | 28  | 2       | 2d3+2  | 4     | 11        |
| Knight       | 25  | 1       | 3d5+2  | 7     | 16        |

### Elite Mercenaries

| Creature   | HP  | Attacks | Damage | Armor | Base Cost |
| ---------- | --- | ------- | ------ | ----- | --------- |
| Paladin    | 38  | 2       | 3d6+2  | 9     | 18        |
| Warlord    | 45  | 2       | 4d4+2  | 9     | 17        |
| Red Dragon | 40  | 2       | 2d4-1  | 0     | 45        |
| Titan      | 70  | 1       | 4d6+3  | 0     | 40        |

---

## Mercenary Duration

Mercenaries serve for a limited number of turns based on their contract:

- Contracts are randomly 5, 10, 15, or 20 turns
- When contract expires, the mercenary leaves
- Longer contracts cost proportionally more gold

---

## Upgrade Defender

> "Upgrade defender — this button appears when you land on your own land. This button allows you to hire a stronger creature to defend your land. Each 'Upgrade defender' costs one action point and gold."
> — Help file, line 166

On owned lands, you can also upgrade the defending creature to a stronger tier. This is separate from hiring personal companions.

**Upgrade Cost Formula:**

```
Tier 2: base_cost × 4 × 2 = base_cost × 8
Tier 3: base_cost × 5 × 3 = base_cost × 15
Tier 4: base_cost × 6 × 4 = base_cost × 24
```
