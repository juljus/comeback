# Movement

## Dice Rolling

Roll **two dice** to determine movement:

```
die_1 = random(1 to 6 + speed_bonus)
die_2 = random(1 to 6 + speed_bonus)
movement = die_1 + die_2
```

- Base range: 2-12
- Speed bonuses (from items) expand the die range (e.g., +2 speed means rolling 1d8 instead of 1d6)

## Doubles

When both dice show the **same value**:

1. Player sees their current movement total
2. **Choice**: Keep current roll OR roll again
3. If rolling again, both dice are re-rolled completely
4. New roll can also be doubles (chain possible)

### Consecutive Same Doubles Bonus

Rolling doubles multiple times **with the same die value** gives gold:

```
gold_bonus = 50 × (consecutive_count)²
```

| Consecutive Same       | Gold |
| ---------------------- | ---- |
| 1 (first double)       | 50   |
| 2 (e.g., 4-4 then 4-4) | 200  |
| 3                      | 450  |
| 4                      | 800  |

Rolling different doubles (e.g., 3-3 then 5-5) resets the counter.

## Passing Royal Court

When movement takes you past square 34 (wrapping to square 1):

1. **Collect taxes** from all owned lands (sum of all land tax values)
2. **Bank bonus**: If you own Bank buildings, add `(number_of_taxed_lands × banks_owned × 10)` gold
3. **Land income regenerates**: Each owned land regains `base_income / 4` toward its base value
4. **Title check**: Game checks if you qualify for a new title

## Manipulate Winds Spell

- If **one player** has Manipulate Winds active: they can modify other players' movement
- If **multiple players** have it active: effects cancel out ("winds rage back and forth")
