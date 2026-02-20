# PvP Combat - Unfinished Work

## Status: Paused

The PvP encounter system was partially implemented but combat rendering has fundamental issues. The encounter detection and flow logic is in place but the actual PvP combat view is broken.

## What Works

- **Detection engine** (`game/engine/combat.ts`): `rollDetection()` and `initPvPCombat()` with full test coverage (20 tests)
- **6-phase encounter prompt** (`EncounterPromptView.vue`): handles all hotseat screen transitions
  - Detected -> Owner attacks / lets be
  - Not detected -> Sneak past
  - Invader attacks land -> Owner defends / walks away
  - "Pass the screen" messages between players
- **Composable encounter functions** (`useGameState.ts`): `ownerAttack`, `ownerLetBe`, `ownerDefend`, `ownerWalkAway`, `encounterDismiss`, `ownerWalkAwayDismiss`, `invaderAttackWithOwnerPresent`
- **Ownership transfer on combat victory** (`combatFinish`): castle takeover of all same-landKey squares
- **Dev state** (`app/utils/devState.ts`): seed 398, P1 at position 3, P2 fortified at position 9

## What's Broken

### 1. PvP combat rendering shows wrong combatants

- **Symptom**: "2 versions of me" -- the ally side and defender side both show the same player
- **Root cause**: `CombatView.vue` reads `currentPlayer` (= `players[currentPlayerIndex]`) for the ally cards. But `currentPlayerIndex` is always the **invader** (the player whose turn it is). When the **owner** attacks via `ownerAttack()`, the attacker is the owner but `currentPlayerIndex` still points to the invader. So:
  - Ally side shows invader's stats (wrong -- should show owner)
  - Defender side has invader in defenders array (correct from `initPvPCombat`)
  - Result: invader appears on both sides
- **Applies to**: `ownerAttack()` only. `ownerDefend()` should work correctly since the invader IS the `currentPlayer` and IS the attacker.

### 2. Archers not rendered in fortified PvP combat

- **Symptom**: Fortified combat with archers shows gate + defenders but archers are missing
- **Likely cause**: `initPvPCombat` for fortified creates [gate, player, companions] but does NOT include land archers. In normal `initFortifiedCombat`, archers are added from `archerySlots` as separate defenders. The PvP version skips this.
- **Location**: `game/engine/combat.ts` lines 1706-1734 -- fortified branch only adds gate + defender player + defender companions. Missing: archer units from `square.archerySlots`.

### 3. Combat round logic assumes `currentPlayer` is attacker

- **Symptom**: `combatAttack()` in the composable uses `state.players[state.currentPlayerIndex]!` as the attacker profile for damage calculations. When owner attacks, the wrong player's stats are used.
- **Fundamental issue**: The combat system was designed for player-vs-neutral where `currentPlayer` is always the attacker. PvP with owner-as-attacker breaks this assumption.
- **Possible fix**: Either temporarily swap `currentPlayerIndex` during owner-attacks PvP, or pass the actual attacker explicitly to combat functions.

### 4. `combatFinish` damage sync for owner-attacks scenario

- The HP sync in `combatFinish` syncs damage to `player = state.players[state.currentPlayerIndex]!` and to `pvpOpponentId`. When the owner attacks, the damage dealt to the "defender" (invader) should sync to `currentPlayerIndex`, and damage to the attacker (owner) should sync to the owner. This mapping may be inverted.

## Recommended Approach

The `ownerAttack` scenario is the hardest because it requires the combat system to work with a non-current player as attacker. Two options:

**Option A (simpler)**: Temporarily swap `currentPlayerIndex` to the owner for the duration of PvP combat when the owner initiates. Swap back in `combatFinish`. This makes all existing combat code work correctly since `currentPlayer` = attacker.

**Option B (cleaner)**: Add an explicit `attackerPlayerId` to `NeutralCombatState` and update all combat functions to use that instead of `currentPlayerIndex`. More changes but architecturally correct.

## Other Unfinished Items

### Dev state position drift

- The seeded RNG (seed 398) produces a dice roll of 5 at the engine level, but shop/merc camp initialization in the composable consumes extra RNG values, shifting the actual in-game roll to 6. P2 was moved to position 9 to compensate, but this hasn't been verified in the actual game.

### Persistent poison - composable wiring

- Engine is complete (resolveUpkeep with poison ticks, decay, death check)
- Composable carries poison over from combat and runs upkeep with rng
- Needs playtesting to verify the full loop works (combat -> poison carry-over -> upkeep tick -> death)

## Test Counts

- Total: 958 tests passing
- Engine: combat 131, player 102, formulas 92, events 99, economy 124, combatMagic 52, magic 72, royalCourt 42, specialSquares 46, spellLearning 34, mana 30, victory 23, board 13, dice 21
- Data: 62 (creatures 18, spells 11, items 9, lands 6, buildings 7, cross-refs 11)
