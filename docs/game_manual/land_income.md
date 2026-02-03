# Land Income

Land ownership generates gold through tax collection when passing Royal Court.

## Key Concepts

> "Tax income — income from land."
> — Help file, line 27

> "Base income — the land's original tax rate."
> — Help file, line 29

Each land has two income values:
- **Current income** — the amount you collect as tax (can be depleted or increased)
- **Base income** — the land's default tax rate (used for regeneration calculations)

---

## Tax Collection

> "Gold is received by passing the 'Royal Court' square. The amount of gold received depends on the tax rate of your owned lands."
> — Help file, line 103

When you pass Royal Court (complete a lap around the board):

```
total_gold = sum(all_owned_lands.current_income) + bank_bonus
```

### Bank Bonus

> "Bank — increases income from your lands by percentage."
> — Help file, line 91

```
bank_bonus = number_of_taxed_lands × banks_owned × 10
```

**Example:** You own 5 lands with income, and have 2 Banks:
- Bank bonus = 5 × 2 × 10 = 100 gold extra

---

## Income Regeneration

When passing Royal Court, depleted lands partially regenerate their income:

```
IF current_income < base_income:
    current_income = current_income + floor(base_income / 4)
    IF current_income > base_income:
        current_income = base_income
```

Income regenerates by 25% of base income per lap, capped at base income.

**Example:** Base income 8, current income 2
- Regeneration = floor(8 / 4) = 2
- New income = 2 + 2 = 4
- Next lap: 4 + 2 = 6
- Next lap: 6 + 2 = 8 (at base, stops regenerating)

---

## Improving Land Income

> "'Improve lands income_by_n' — this button appears when you land on your own land. This button allows you to raise the land's value and thereby increase your income. The income growth is greater the more action points you use (you press it once, works like the 'rest' button). If you do this at the start of the day, the land's healing value also increases."
> — Help file, line 165

When you land on your own land, you can invest to improve its income.

### Income Improvement Formula

```
income_bonus = floor((base_income / 2 + 10) / 3 × remaining_action_points)
```

| Action Points | Multiplier |
|--------------|------------|
| 3 (morning) | ×3 |
| 2 (noon) | ×2 |
| 1 (evening) | ×1 |

### Maximum Income Cap

Current income cannot exceed 3× base income:

```
max_income = base_income × 3
```

### Healing Value Bonus

If you improve income at **morning** (all 3 action points), the land's healing value also increases.

**Example:** Land has base income 6, current income 6
- At morning: bonus = floor((6/2 + 10) / 3 × 3) = floor(13/3 × 3) = 12
- New income = 6 + 12 = 18 (max is 18, which is 6 × 3) ✓
- Healing value also increases

---

## Pillaging

When you land on an **enemy** land, you can pillage it instead of capturing.

**Pillage mechanics:**
- **Gold gained:** Current income value of the land
- **Effect on land:** Income is set to 0
- **Cost:** 1 action point

Pillaging is useful when:
- You can't defeat the defender
- You want to weaken the enemy economically without committing to capture
- The land has high current income (especially if improved)

**Note:** Pillaged lands will slowly regenerate income when the owner passes Royal Court.

---

## Treasury Buildings

> "Treasury — grants +50 gold income per [land type] land."
> — Help file, lines 89, 91

Treasury buildings (available on Volcano and Burrows) add flat bonus income:

```
treasury_bonus = 50 × number_of_same_type_lands
```

This bonus is added to regular tax collection.

**Note:** The VBA implementation adds only a flat +50 to the single land where Treasury is built, not per land of that type. The help file (source of truth #1) describes the per-land multiplier, which is the intended design.

---

## Income Summary Table

See [Land Types](land_types.md) for base income values by land type.

| Land Type | Base Income | Max Income (3×) |
|-----------|-------------|-----------------|
| Valley | 8 | 24 |
| Plain | 6 | 18 |
| Woodland | 6 | 18 |
| Highland | 6 | 18 |
| Dark Forest | 6 | 18 |
| Forest | 6 | 18 |
| Volcano | 6 | 18 |
| Hill | 6 | 18 |
| Swamp | 5 | 15 |
| Mountain | 5 | 15 |
| All others | 4 or less | 12 or less |
