# Special Squares

Special squares are board locations that provide services or trigger events. Most cannot be owned, but Arcane Towers are capturable.

## Royal Court

> "For each game, the computer generates a new game board where the first square is always 'Royal Court'; all other squares are placed on the board 'randomly' by the computer."
> — Help file, line 6

> "Gold is obtained by passing through the 'Royal Court' square. The amount of gold received depends on the tax rate of the lands you own."
> — Help file, line 103

| Property   | Value           |
| ---------- | --------------- |
| Position   | Always Square 1 |
| Capturable | No              |

### Tax Collection

When passing through Royal Court, you collect the sum of tax income from all lands you own. Each land contributes its individual tax value (column 6 in game data).

**Bank Bonus:** If you own a Bank building, you receive additional gold:

```
bank_bonus = owned_lands × banks_owned × 10
```

### King's Salary

Players also receive a salary based on their title:

| Title | Lands Required | Salary  |
| ----- | -------------- | ------- |
| None  | 0–2            | 20 gold |
| Baron | 3+             | 30 gold |
| Count | 9+             | 40 gold |
| Duke  | 15+            | 50 gold |

---

## Shrine

> "Shrine — a temple/sanctuary, also a rest house. The shrine is an excellent place to rest."
> — Help file, line 39

| Property      | Value |
| ------------- | ----- |
| Spawn Chance  | 10%   |
| Healing Value | 8     |
| Capturable    | No    |

### Healing Ritual

The Shrine offers a healing ritual that restores HP to you and your companions.

**Cost:** 50 gold

**Player Healing Formula:**

```
heal = (strength × 3) + healing_bonus
healing_bonus = 3 + (60 + current_hp) / (5 + current_hp)
```

| Strength | Current HP | Healing Bonus | Total Heal |
| -------- | ---------- | ------------- | ---------- |
| 2        | 20         | ~5            | ~11        |
| 4        | 20         | ~5            | ~17        |
| 6        | 50         | ~5            | ~23        |
| 10       | 50         | ~5            | ~35        |

**Companion Healing Formula:**

```
heal = 6 + (companion_strength × 2)
```

Companions are healed up to their maximum HP.

**Availability:** The healing ritual is only available in the morning (requires full action points).

---

## Arcane Tower

> "Arcane Tower — a magic tower. One magic tower produces 1 arcane mana per day, two magic towers produce 3 arcane mana per day, 3 magic towers produce 6, and 4 magic towers in one player's possession produce 10 arcane mana per day."
> — Help file, line 40

> "When returning to your own tower, you can use the ability to teleport selectively to any of the locations listed here."
> — Help file, line 41

| Property       | Value   |
| -------------- | ------- |
| Spawn Chance   | 15%     |
| Price          | 8 gold  |
| Healing Value  | 5       |
| **Capturable** | **Yes** |

**Note:** Unlike other special squares, Arcane Towers CAN be captured and owned.

### Arcane Mana Production

Mana production scales with the number of towers owned:

| Towers Owned | Arcane Mana per Day |
| ------------ | ------------------- |
| 1            | 1                   |
| 2            | 3                   |
| 3            | 6                   |
| 4            | 10                  |

### Teleportation

When on your own Arcane Tower in the morning, you can teleport to any other land you own. After completing actions at the destination, you return to the tower.

### Tower Defenders

| Tier | Defender   |
| ---- | ---------- |
| 1    | Apprentice |
| 2    | Mage       |
| 3    | Sorcerer   |
| 4    | Wizard     |

---

## Adventure Locations

Three special squares trigger random events when entered. The game intentionally leaves discovery to the player.

### Event System

Each adventure location uses a weighted random event selection:

1. Build list of available events for that location
2. Select event based on probability weights
3. Execute selected event

Events scale with game progress (days passed) and player rank (title).

---

## Cave

> "Cave — cave, cavern. What surprises and events might await you there — that remains for you to discover. Generally there is not much danger, though various obstacles may occur."
> — Help file, line 42

| Property      | Value |
| ------------- | ----- |
| Spawn Chance  | 10%   |
| Healing Value | 3     |
| Capturable    | No    |

### Cave Events

| Event              | Chance | Description                         |
| ------------------ | ------ | ----------------------------------- |
| Small Treasure     | 10%    | Find gold (scales with game day)    |
| Guarded Treasure   | 15%    | Combat guardian protecting treasure |
| Mob with Item      | 15%    | Combat creature carrying an item    |
| Strength Challenge | 10%    | Clear obstacle, requires Strength   |
| Hermit             | 20%    | Offers healing or training          |
| Mana Fountain      | 10%    | Choose mana type to gain            |
| Free Prisoner      | 10%    | Rescue prisoner (may join you)      |
| Elemental River    | 10%    | Elemental mana opportunity          |
| Sage               | 20%    | Learn or upgrade spells             |
| Choice Event       | 30%    | Choose between two random events    |

---

## Treasure Island

> "Treasure Island — 'treasure island'. What surprises and events might await you there — that remains for you to discover. Generally there is not much danger, though various obstacles may occur. As a hint, one can say that the hope of finding gold and treasures there (treasures always have guardians) is quite great."
> — Help file, line 43

| Property      | Value |
| ------------- | ----- |
| Spawn Chance  | 10%   |
| Healing Value | 4     |
| Capturable    | No    |

### Treasure Island Events

| Event               | Chance | Description                         |
| ------------------- | ------ | ----------------------------------- |
| Small Treasure      | 20%    | Find gold                           |
| Guarded Treasure    | 25%    | Combat guardian protecting treasure |
| Dexterity Challenge | 10%    | Obstacle requiring agility          |
| Choice Event        | 100%   | Always available as fallback        |

**Note:** Treasure Island focuses on treasure-finding events. Guardians always protect valuable treasures.

---

## Dungeon

> "Dungeon — (underground) cave, dungeon. Anything can happen there."
> — Help file, line 44

| Property      | Value |
| ------------- | ----- |
| Spawn Chance  | 10%   |
| Healing Value | 3     |
| Capturable    | No    |

### Dungeon Events

| Event               | Chance | Description                         |
| ------------------- | ------ | ----------------------------------- |
| Small Treasure      | 10%    | Find gold                           |
| Guarded Treasure    | 15%    | Combat guardian protecting treasure |
| Mob with Item       | 20%    | Combat creature carrying an item    |
| Dexterity Challenge | 10%    | Obstacle requiring agility          |
| Strength Challenge  | 15%    | Clear obstacle, requires Strength   |
| Power Challenge     | 20%    | Solve riddle, requires Power        |
| Mana Fountain       | 15%    | Choose mana type to gain            |
| Free Prisoner       | 20%    | Rescue prisoner (may join you)      |
| Elemental River     | 15%    | Elemental mana opportunity          |
| Sage                | 5%     | Learn or upgrade spells             |
| Choice Event        | 100%   | Always available as fallback        |

**Note:** Hermit encounters do not occur in Dungeons.

**Note:** The Dungeon has the widest variety of events and highest danger.

---

## Event Details

### Treasure Events

**Small Treasure (Event 1):**

- 50% chance: Small gold pile
- 50% chance: Medium gold pile

**Gold Scaling:**

```
small_gold = random(3–7) × 10 + game_days     (30–70 + days)
medium_gold = random(7–12) × 10 + game_days   (70–120 + days)
large_gold = random(1–10) × 10 + 100 + game_days (110–200 + days)
huge_gold = random(1–3) × 1000 + game_days    (1000–3000 + days)
```

**Guarded Treasure (Event 2):**
Spawns a guardian creature. Defeating it yields:

- Gold: Medium or large pile
- Items: 1–2 items (value: 100 + days to 485 + days)

**Special Guardian — Black Dragon:**

- 2 high-value items (999–10000 gold value)
- 1 medium-value item (500–10000 gold value)
- Huge gold pile (1000+ gold)

### Guardian Scaling

Guardians become stronger as the game progresses:

**Treasure Guardians (Event 2):**

| Guardian     | Early Game | Late Game |
| ------------ | ---------- | --------- |
| Sprite       | Common     | Rare      |
| Skeleton     | Common     | Rare      |
| Clay Golem   | Common     | Rare      |
| Gargoyle     | Moderate   | Moderate  |
| Troll        | Moderate   | Moderate  |
| Wraith       | Rare       | Common    |
| Black Dragon | Very Rare  | Uncommon  |

**Item Guardians (Event 3):**

| Guardian | Early Game | Late Game |
| -------- | ---------- | --------- |
| Kobold   | Common     | Rare      |
| Goblin   | Common     | Rare      |
| Dark Elf | Common     | Rare      |
| Harpy    | Moderate   | Moderate  |
| Gargoyle | Moderate   | Moderate  |
| Minotaur | Very Rare  | Common    |
| Vampire  | Very Rare  | Common    |

Player rank (title) also increases stronger guardian probability.

### Stat Challenges

**Strength Challenge (Event 5):**

- Strength ≥ 4: Automatic success, gain treasure + action bonus
- Strength = 3: 50% success, 50% take 1–7 damage
- Strength < 3: Guaranteed damage

**Dexterity Challenge (Event 4):**

- Dexterity ≥ 4: Automatic success
- Dexterity 2–3: 50% obstacle (jump check)
- Dexterity < 2: Guaranteed obstacle
- Failure: 1–7 HP damage

**Power Challenge (Event 6) — Riddle:**

- Success if: random(1–4) ≤ Power
- Success: Access treasure
- Low Power bonus: Small chance to gain +1 Power

### Special Events

**Hermit (Event 7):**
Offers choice of:

1. Healing ritual (like Shrine)
2. Training (Strength, Dexterity, or Power)

**Mana Fountain (Event 8):**

- Displays 3 random mana types
- Player chooses one to gain

**Free Prisoner (Event 9):**

- Guardian protects prisoner (difficulty scales 100–200)
- Options: Dispel magic (if magical prison) or fight guardian
- Success: Prisoner may join as companion

**Elemental River (Event 10):**

- 4 elemental mana options displayed
- Player chooses mana to receive

**Sage (Event 11):**

- Presents 3 spells from different ranges:
  - Spell 1: From spells 1–8
  - Spell 2: From spells 9–16
  - Spell 3: From spells 17–25
- Player can learn or upgrade selected spell

**Choice Event (Event 12):**

- Randomly generates 2 different events
- Player chooses which to pursue

---

## Summary Table

| Square          | Spawn % | Capturable | Primary Function               |
| --------------- | ------- | ---------- | ------------------------------ |
| Royal Court     | Fixed   | No         | Tax + salary collection        |
| Shrine          | 10%     | No         | Healing ritual                 |
| Arcane Tower    | 15%     | **Yes**    | Arcane mana + teleport         |
| Cave            | 10%     | No         | Random events (exploration)    |
| Treasure Island | 10%     | No         | Random events (treasure focus) |
| Dungeon         | 10%     | No         | Random events (high variety)   |
