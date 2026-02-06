# Victory Conditions

## Objective

Be the **last player remaining** on the board.

## Game End States

### Victory

- Only 1 player remains alive
- That player wins

### Draw (Tie)

- All remaining players die during the same turn
- No winner is declared

## Player Death

A player dies when their **HP reaches 0 or below**.

### Death Sources

- Combat damage (melee hits)
- Spell damage
- Status effects (bleeding, poison, burning)
- Event effects

### Death Timing

Death is checked:

- After each hit in combat
- After status effect damage ticks
- After event resolution

### What Happens When a Player Dies

1. Player is removed from turn order
2. All their lands become **neutral** (unowned)
3. Turn passes to next surviving player
4. If it was their turn, turn ends immediately

## Day Counter

The day counter increments by 1 when the **last player in turn order** finishes their turn.

This tracks game duration (no gameplay effect).
