# Training

Training allows players to improve their stats and spell levels at special locations.

## Training Mechanics

> "Train_n_stat — train. When this button appears, you can train the corresponding n-attribute. Can be either a stat or a spell. Training something usually takes the whole day (requires all action points)."
> — Help file, line 160

**Key mechanics:**
- Training requires **all action points** (must start in the morning)
- Training consumes the full day
- Different locations offer different training options

---

## Training Grounds

> "Training G. — (training grounds) training grounds. At TG. you can develop strength and dexterity."
> — Help file, line 38

| Property | Value |
|----------|-------|
| Board Spawn Chance | 80% |
| Trainable Stats | Strength, Dexterity |
| Maximum Stat | 6 |

### Stat Training Cost

**Cost Formula:**
```
cost = current_stat² × 5
```

| Current Stat | Training Cost |
|--------------|---------------|
| 1 | 5 gold |
| 2 | 20 gold |
| 3 | 45 gold |
| 4 | 80 gold |
| 5 | 125 gold |

**Note:** At the Training Grounds, Strength and Dexterity can only be trained up to 6. Once a stat reaches 6, training for that stat is no longer available.

---

## Library

> "Library — from the library you can acquire spells. Additionally, you can develop spells you already know."
> — Help file, line 35

| Property | Value |
|----------|-------|
| Board Spawn Chance | 10% |
| Services | Buy scrolls, Train spells |

### Spell Training

You can increase the level of spells you already know.

**Spell Training Cost Formula:**
```
cost = current_spell_level × 200
```

| Current Level | Training Cost |
|---------------|---------------|
| 1 | 200 gold |
| 2 | 400 gold |
| 3 | 600 gold |

> "Scrolls can be acquired from the library and mage guild. Sometimes old scrolls can be found in old tombs and treasure chests."
> — Help file, line 122

---

## Mage Guild

> "Mage Guild — likewise, you can acquire spells and train your magical power (power) to be greater."
> — Help file, line 36

| Property | Value |
|----------|-------|
| Board Spawn Chance | 80% |
| Services | Buy scrolls/potions, Train Power, Train spells |

### Power Training

At the Mage Guild, you can train the Power stat using the same formula as other stats:

**Power Training Cost Formula:**
```
cost = current_power² × 5
```

| Current Power | Training Cost |
|---------------|---------------|
| 1 | 5 gold |
| 2 | 20 gold |
| 3 | 45 gold |
| 4 | 80 gold |
| 5 | 125 gold |
| 6 | 180 gold |

**Note:** Unlike Strength and Dexterity at Training Grounds, Power training at the Mage Guild does not appear to have a maximum limit.

---

## Training Summary

| Location | Stats | Spells | Max Stat |
|----------|-------|--------|----------|
| Training Grounds | Strength, Dexterity | No | 6 |
| Library | No | Yes | — |
| Mage Guild | Power | Yes | No limit |

---

## Cost Formula Summary

| Training Type | Formula |
|---------------|---------|
| Stats (Str/Dex/Pow) | current_stat² × 5 |
| Spells | current_level × 200 |
