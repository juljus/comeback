# Fighting for Player-Owned Land

Combat on player-owned land is more complex than neutral land. It involves automatic attacks, defenders, fortifications, and potentially the owning player themselves.

## Automatic Attack

> "If a player lands on a land that already belongs to another player, they are attacked automatically."
> — Help file, line 147

When you land on enemy-owned land:
- Combat starts **automatically**
- The land's defender(s) fight you
- If the owner is present, they join the defense

## Attacking a Present Player

> "Sometimes, when a player lands on a land where another player is present, the opportunity arises to attack that player. Use this opportunity only if you are confident in your strength, because the mobs on the land also enter battle against you on the side of the land owner."
> — Help file, line 146

When the land owner is present on their land:
- You have the **option** to attack (not automatic)
- All land defenders fight alongside the owner
- This is high-risk combat

---

## Adjacent Land Reinforcement

> "If you already have two adjacent lands, then when one land is attacked, the adjacent land's defender comes to help. Help arrives on the next round; if you manage to defeat the land's defender in one round, the adjacent land's defender doesn't arrive."
> — Help file, line 108

**Key mechanics:**
- Reinforcement arrives on the **next round** (next action point)
- Triggers when owner has **two adjacent lands**
- If you kill the defender in **one round**, reinforcements don't arrive
- "Middle lands" (same type on both sides) are especially valuable for this reason

---

## Fortifications

Fortifications can only be built when you own **all lands of the same type**. They dramatically increase defensive power.

### Fortification Levels

| Level | Name | Cost | Gate HP | Archers Added |
|-------|------|------|---------|---------------|
| 1 | Fort (Kants) | 200 | 15 | +2 |
| 2 | Citadel (Linnus) | 150 | 30 | +1 |
| 3 | Castle (Kindlus) | 200 | 50 | +1 |

Total archers with full castle: 4

### Archer Types

Archer quality depends on additional buildings:

| Building | Requires | Cost | Archer Type | HP | Damage |
|----------|----------|------|-------------|-----|--------|
| (none) | Fort | — | Archer | 9 | 1d4 |
| Fletchery | Citadel | 30 | Crossbowman | 11 | 1d7 |
| Archery Guild | Castle + Fletchery | 100 | Elite Archer | 14 | 3d3 |

> "Losing 20 or more HP in one round against elite archers - that can be quite common."
> — Help file, line 130

---

## The Gate Mechanic

Fortifications have a **gate** that must be destroyed before your melee companions can engage defenders.

### Gate as Combat Target

- The gate is a targetable "mob" in combat
- It has HP but does not attack
- Must be destroyed for melee units to enter

### Behind-Wall Protection

While the gate stands:
- Archers are positioned **behind the wall**
- Behind-wall units can **only be targeted by**:
  - Ranged weapons (missile type)
  - Spells
- Melee attacks **cannot reach** units behind the wall
- Your companions cannot storm the fortress yet

Once the gate falls:
- Your companions can "storm the fortress"
- Close combat with defenders becomes possible
- Archers are no longer protected by the wall

---

## Capturing a Fortified Land

> "Conquering a fortress is an action that must be well thought out and well prepared."
> — Help file, line 129

### Preparation

> "To even go conquer a fortress, you should have companions. Why? Primarily companions are needed so that all the fortress archers' fire doesn't fall on you."
> — Help file, line 130

**Recommended preparation:**
- Gather companions (bought, hired, or summoned)
- Have sufficient HP
- Have enough mana for multiple damage spells (3 is good)

### Attack Strategy

From the help file (line 131):

1. **First action point (morning):** Cast a spell at the fortress gate
2. **Gate falls:** Your companions can storm the fortress
3. **Continue:** If you're a good mage, use spells; if you're skilled with weapons, use weapons

### Recommended Spells

> "Especially good spells for conquering fortresses are Wrath of God and Fireball, which can hit all land defenders at once."
> — Help file, line 131

- **Wrath of God** — hits all enemies in a group
- **Fireball** — hits all enemies in a group

---

## Land Defenders

Each land type has 4 tiers of defenders. The default is tier 1.

### Upgrading Defenders

> "'Upgrade defender' - this button appears when you land on your own land. This button allows you to hire a stronger defender to protect your land. Each 'Upgrade defender' takes one action point and gold."
> — Help file, line 166

- Each upgrade costs 1 action point + gold
- Upgrades the defender to the next tier
- Maximum tier is 4

### Defender Behavior in Fortifications

Fortification defenders (gates, archers) have enhanced bravery:
- They **do not flee** from combat
- They fight until defeated


---

## Combat Flow Summary

**Attacking unfortified player land:**
1. Combat starts (automatic or by choice)
2. Fight the defender + owner if present
3. Adjacent reinforcements may arrive next round
4. Defeat all enemies to capture

**Attacking fortified player land:**
1. Combat starts
2. Archers behind walls shoot at you (only ranged/spells can hit them back)
3. Destroy the gate (spells recommended)
4. Gate falls → companions can storm the fortress, melee can now engage
5. Defeat all defenders
6. Adjacent reinforcements may arrive
7. Defeat all enemies to capture

---

## Defender Tiers by Land Type

See [Land Types](land_types.md) for the complete list. Example:

| Land | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|------|--------|--------|--------|--------|
| Valley | Pikeman | Swordman | Knight | Paladin |
| Forest | Wolf | Bear | Treant | Druid |
| Highland | Barbarian | Horseman | Warchief | Titan |
| Hill | Orc | Troll | Hill Giant | Devil |
| Mountain | Dwarf | Golem | Battlemaster | Rock Giant |
