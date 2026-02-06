# Fortifications

Fortifications are defensive structures that dramatically increase a land's defensive power.

## Building Requirements

> "'Build' button appears when you have all lands of one type. Pressing this button shows you which buildings you can build. Each building construction takes one action point, assuming you have the required gold."
> — Help file, line 167

**Prerequisites:**

- Own **all lands of a single type** (e.g., all 2 Forests)
- Have sufficient gold
- Each building costs 1 action point

> "Fortifications and other buildings can be built while on any square - you don't need to be on the square where you want to build."
> — Help file, line 124

## Fortification Tiers

> "There are three different levels of fortifications: smallest is fort, middle is citadel, largest is castle. Building fortifications increases the number of land defenders."
> — Help file, line 126

| Tier | Name    | Cost | Prerequisite | Gate HP | Archers Added |
| ---- | ------- | ---- | ------------ | ------- | ------------- |
| 1    | Fort    | 200  | —            | 15      | +2            |
| 2    | Citadel | 150  | Fort         | 30      | +1            |
| 3    | Castle  | 200  | Citadel      | 50      | +1            |

**Total investment for Castle:** 550 gold
**Total archers with Castle:** 4

---

## Gates

Each fortification level has a gate that must be destroyed for attackers to storm the fortress.

| Gate         | HP  |
| ------------ | --- |
| Fort Gate    | 15  |
| Citadel Gate | 30  |
| Castle Gate  | 50  |

Gates:

- Have HP but do not attack
- Must be destroyed before melee attackers can engage defenders
- Are targetable by spells and ranged attacks

---

## Archers

> "For the best archers to defend the fortification, additional buildings must be built (fletchery, archery guild)."
> — Help file, line 126

### Archer Upgrade Path

| Building      | Cost | Prerequisite       | Archer Type  | HP  | Damage |
| ------------- | ---- | ------------------ | ------------ | --- | ------ |
| (Fort)        | —    | —                  | Archer       | 9   | 1d4    |
| Fletchery     | 30   | Citadel            | Crossbowman  | 11  | 1d7    |
| Archery Guild | 100  | Castle + Fletchery | Elite Archer | 14  | 3d3    |

### Archer Behavior

- Archers are positioned **behind the wall** while the gate stands
- Behind-wall units can only be targeted by ranged weapons or spells
- Archers do not flee (enhanced bravery)

> "Losing 20 or more HP in one round against elite archers - that can be quite common."
> — Help file, line 130

---

## Strategic Importance

> "Fortifications are power. The player who succeeds in building a fortification first has a strong advantage compared to other players."
> — Help file, line 125

> "Once you have gathered same-type lands, immediately secure your position there - build fortifications. End-game fortifications are your main strength if you want to eliminate opponent players from the board."
> — Help file, line 101

---

## Portal

The ultimate defensive building:

| Building | Cost | Prerequisite |
| -------- | ---- | ------------ |
| Portal   | 600  | Castle       |

Portal allows you to teleport to your castle for additional defense when it's under attack.

---

## Building Unlock Tree

```
Fort (200g)
├── Citadel (150g)
│   ├── Castle (200g)
│   │   ├── Archery Guild (100g) [requires Fletchery]
│   │   └── Portal (600g)
│   └── Fletchery (30g)
└── [Land-specific buildings - see Buildings by Land]
```

---

## Combat Impact Summary

| Fortification Level    | Gate HP | Total Archers | Archer Type        |
| ---------------------- | ------- | ------------- | ------------------ |
| None                   | —       | 0             | —                  |
| Fort                   | 15      | 2             | Archer (1d4)       |
| Fort + Fletchery       | 15      | 2             | Crossbowman (1d7)  |
| Citadel                | 30      | 3             | Crossbowman (1d7)  |
| Castle                 | 50      | 4             | Crossbowman (1d7)  |
| Castle + Archery Guild | 50      | 4             | Elite Archer (3d3) |

**Note:** Fletchery and Archery Guild upgrade ALL archers on that land, not just new ones.
