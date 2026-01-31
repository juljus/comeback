# Comeback - Development Roadmap

Each phase includes the feature implementation + minimal functional UI.
Polish and visual design comes at the end.

## Development Process

Before implementing each phase:
1. **Verify in original** - Check the Excel game to confirm features exist and understand exact mechanics
2. **Document findings** - Note any details not captured in our current data/types
3. **Implement** - Build the verified features
4. **Test** - Verify behavior matches original

---

## Phase 1: Foundation + Basic UI Shell ✅
- [x] Pinia game store (GameState structure)
- [x] Board generation (34 random squares from land types)
- [x] Simple board display (rectangular Monopoly-style layout)
- [x] Player setup (2-4 players, names)
- [x] Basic game initialization
- [x] Royal Court as first square (fixed: was missing from lands.json)

## Phase 2: Turn & Movement ✅
- [x] Turn system (3 actions per turn: morning, noon, evening)
- [x] Player rotation (whose turn)
- [x] Movement: 2d6 dice roll (fixed: was +1/-1 step movement)
- [x] Action point consumption
- [x] End turn / Rest functionality
- [x] Basic player position display on board
- [x] Dice roll display in UI

## Phase 3: Land Ownership ✅
**Verified in original:** "Osta maa" (buy), "Valluta maa" (conquer), "Improve lands income", "Upgrade defender"

- [x] Buy land action (requires full day - all 3 actions, morning only)
- [x] Land defenders (tier 1-4 from land type's defenders array)
- [x] Conquer land action (fight defender → stub as auto-win for now → own land)
- [x] Ownership tracking (owner: null=neutral, player index=owned)
- [x] Ownership display (player color border on owned squares)
- [x] Land info panel (shows name, owner, defender tier, price, tax income + bonus)
- [x] Upgrade defender tier action (on owned land, costs 20/40/80 gold - unverified)
- [x] Improve income action (uses ALL remaining actions, morning gives +1 healing)
- [x] Utility lands cannot be bought (isUtility=true)
- [x] Income collection when passing Royal Court (sum of all owned lands' tax income)

## Phase 4: Combat ✅ (Verified 2026-01-31)
**Verified mechanics from help.csv:**

### Combat Flow
- Each attack attempt = 1 action point (up to 3 per turn)
- 1 round = 1 action point
- If defender not defeated by evening, combat ends, land NOT captured
- Both attacker and defender attack each round

### Damage Calculation
- Format: XdY+bonus (e.g., 1d5+1 = roll 1-5, add 1)
- Damage reduced by target's armor
- Attacks per round: 1 + (dexterity / 5)

### Damage Types
- **Pierce**: Penetrates armor (ignores some armor)
- **Slash**: Causes bleeding (damage over time)
- **Crush**: Can stun enemy (skip their turn)

### Stats in Combat
- **Strength**: Every 4th point = +1 armor
- **Dexterity**: Every 5th point = +1 attack per round, affects flee
- **Power**: Spell strength, spell resistance

### Mob Stats (from mobs.json)
- hp, armor, attacksPerRound
- damage: {diceCount, diceSides, bonus}
- stats: {strength, dexterity, power}

Tasks:
- [x] Combat state interface (CombatState, CombatLogEntry)
- [x] Start combat action (startCombat replaces conquerLand stub)
- [x] Damage calculation with dice rolls (rollDamage helper)
- [x] Armor reduction (damage - armor)
- [ ] Damage type effects (pierce/slash/crush) - deferred to Phase 4b
- [x] Attacks per round from dexterity (1 + dex/5)
- [x] Combat round resolution (attackInCombat)
- [x] Victory: take land ownership
- [x] Defeat: player dies
- [x] Evening timeout: combat ends, no land
- [x] Combat log/history
- [x] Combat UI panel (full-screen overlay)
- [x] Flee mechanics (chance based on dexterity)

## Phase 5: Economy ✅ (Verified 2026-01-31)
**Verified mechanics from help.csv:**
- Shop: Basic cheap items (value < 200 gold)
- Smithy: Weapons and armor only
- Bazaar: Random selection of any items
- Buy item: 1 action point
- Sell item: 1 action point (50% of value)
- Equip/Unequip: 1 action point
- Viewing inventory: Free (no action cost)

- [x] Gold tracking per player (was already done in Phase 1)
- [x] Income when passing Royal Court (was done in Phase 3)
- [x] Tax income from lands (was done in Phase 3)
- [x] Shop interaction (buy items at Shop/Smithy/Bazaar)
- [x] Sell items (50% of value)
- [x] Inventory management (backpack system)
- [x] Equipment system (weapon, armor, helm, accessory slots)
- [x] Equipment bonuses applied to stats in combat
- [x] Strength requirement check for items

## Phase 6: Buildings & Progression ✅ (Verified 2026-01-31 - FIXED)
**Verified mechanics from help.csv:**
- Building requires owning ALL squares of a land type ("Build" button appears)
- Can build from any square, don't need to be on the land
- Each building: 1 action point + gold cost
- Fortifications: Fort → Citadel → Castle (increases defenders)
- Titles: Baron (3 lands), Count (9 lands), Duke (15 lands)
- King's Gift: Choice of 3 rewards on title promotion
- Training: Takes full day (all 3 action points, morning)

### Implementation
- [x] Building construction on owned land (when all squares of type owned)
- [x] Building prerequisites (checked before allowing construction)
- [x] Building effects applied (spells granted, mercenaries unlocked)
- [x] Fortification defender bonus (Fort=2, Citadel=4, Castle=6 archers)
- [ ] Mercenary hiring - deferred to Phase 6b (needs companion system)
- [x] Title system (Baron at 3 lands, Count at 9, Duke at 15)
- [x] King's gift selection (placeholder - gold amounts) ⚠️ needs VBA research
- [x] Training grounds (improve STR/DEX, costs full day + 50g)
- [x] Training Power at Mage Guild (costs full day + 50g)

### Fixes Applied (from verification-phase6.md)
1. **Building effects now work:**
   - `buildOnLand()` grants spells from `grantsSpells` → `player.knownSpells`
   - `buildOnLand()` unlocks mercenaries from `unlocksMercenaries` → `player.unlockedMercenaries`
   - Added `knownSpells: string[]` and `unlockedMercenaries: string[]` to Player interface

2. **Fortifications increase defenders:**
   - Added `fortificationLevel` (0-3) and `archerCount` to BoardSquare
   - Fort (Kants) = level 1, 2 archers
   - Citadel (Linnus) = level 2, 4 archers
   - Castle (Kindlus) = level 3, 6 archers
   - Applied to ALL squares of the land type when built

3. **Training Power added:**
   - `trainPower()` action at Mage Guild (MAGE_GUILD_ID = 5)
   - Costs 50g + full day (morning, 3 actions)

4. **UI updates:**
   - Current square shows fortification level and archer count
   - Current square shows buildings built
   - Inventory shows known spells section
   - Inventory shows unlocked mercenaries section
   - Train Power button at Mage Guild

### Data cleanup
- [x] Removed corrupted building entries (IDs 48-49 from buildings.json)

## Phase 7: Magic System ✅ (Verified 2026-01-31 - ISSUES FIXED)
**Verified mechanics from help.csv:**
- 7 mana types: Fire, Earth, Air, Water, Death, Life, Arcane
- Mana generated from owned lands when passing Royal Court
- Each land type generates specific mana (e.g., Mountain=Fire, Forest=Earth)
- Arcane Tower scaling: 1→1, 2→3, 3→6, 4→10 arcane mana
- Spells learned from buildings (altars, temples)
- Spell power affected by Power stat (ratio formula, not flat bonus)

### Implementation
- [x] Mana pool per player (7 types)
- [x] Mana generation from owned lands (when passing Royal Court) ✅ VERIFIED
- [x] Arcane Tower scaling formula ✅ VERIFIED (1→1, 2→3, 3→6, 4→10)
- [x] Land-to-mana mapping ✅ VERIFIED (all 18 land types correct)
- [x] Spell casting (outside combat - utility spells like Heal, Gold)
- [x] Combat spells (damage spells during combat)
- [x] Mana display in player panels
- [x] Magic panel UI (shows mana pool, known spells)
- [x] Combat spell casting UI
- [ ] Buff spells (need buff tracking system) - deferred to Phase 7b
- [ ] Summon spells (create companions) - deferred to Phase 7b
- [ ] Companion management - deferred to Phase 7b
- [ ] Spell learning at Library/Mage Guild - needs implementation
- [ ] Spell level system - needs implementation

### Issues Found (from verification-phase7.md) → FIXED
1. ~~**Spell mana costs = 0**~~ - ✅ FIXED: Added mana costs to all spells (2-5 based on power)
2. **Spell power formula** - ⚠️ DEFERRED: Uses flat bonus, power ratio needs VBA research
3. ~~**Mana colors wrong**~~ - ✅ FIXED: Air→light blue (#38bdf8), Arcane→golden (#fbbf24)
4. ~~**Spell effectTypes wrong**~~ - ✅ FIXED: Corrected all misclassified spells

### Data Cleanup
- [x] Removed corrupted spell entries (IDs 37-38 from spells.json)
- [x] Fixed spell mana costs (all spells now have reasonable costs)
- [x] Fixed mana colors (Air→light blue, Arcane→golden)
- [x] Fixed spell effectTypes (Pot of Gold→utility, Summon Golem→summon, buffs fixed)

## Phase 8: Advanced Features
- [ ] Random events (Cave, Dungeon, Treasure Island)
- [ ] Pet evolution system
- [ ] AI opponents (optional)
- [ ] Adjacent land reinforcements in combat

## Phase 9: Polish & Multiplayer
- [ ] UI design and styling
- [ ] Animations and transitions
- [ ] Sound effects (optional)
- [ ] Supabase integration
- [ ] User accounts
- [ ] Online multiplayer (real-time sync)
- [ ] Game lobbies
- [ ] Saved games

---

## Known Issues / TODO

### Fixed (from verification report)
- [x] Land prices: Applied 10x multiplier (LAND_PRICE_MULTIPLIER constant)
- [x] Starting weapon: Knife (ID 0, 1d4 pierce) given to all players at init
- [x] Removed corrupted lands.json entries (IDs 40-41)
- [x] Added Royal Court to lands.json with isRoyalCourt flag

### Still Unverified (needs VBA code check)
- [ ] Defender upgrade costs (20/40/80) are estimates
- [ ] Player starting stats (str/dex/pow = 2) - source unknown
- [ ] Starting damage "1d5" mentioned in help.csv vs knife "1d4" - may be base+weapon
- [ ] Improve income cost formula (using estimate: 10 + currentIncome * 5)
- [ ] Training cost (50g) is an estimate
- [ ] Fortification archer counts (2/4/6) are estimates
- [ ] King's Gift actual options from original game

---

## Current Status

**Phase 7: Complete** - Magic System (Core Complete, Issues Fixed)

Completed:
- [x] Data extraction from original Excel
- [x] TypeScript types defined
- [x] JSON data files created
- [x] Nuxt project initialized
- [x] Tailwind configured with mana colors
- [x] Pinia game store
- [x] Board generation (rectangular Monopoly-style layout)
- [x] Player setup UI
- [x] Turn system with 3 actions
- [x] Movement on board
- [x] Basic game UI
- [x] Land ownership (buy, conquer, upgrade defender)
- [x] Land info panel with actions
- [x] Combat system (attack, flee, damage calculation, armor)
- [x] Shop system (buy items at shops)
- [x] Inventory management (backpack, equip/unequip)
- [x] Equipment bonuses in combat
- [x] Building system (construct when owning all lands of type)
- [x] Building effects (spells granted, mercenaries unlocked)
- [x] Fortifications (archers added to defense)
- [x] Title system (Baron/Count/Duke based on land count)
- [x] King's Gift rewards on promotion (placeholder)
- [x] Training at Training Grounds (STR/DEX)
- [x] Training Power at Mage Guild
- [x] Mana pool system (7 mana types) ✅ VERIFIED
- [x] Mana generation when passing Royal Court ✅ VERIFIED
- [x] Arcane Tower scaling (1/3/6/10 mana) ✅ VERIFIED
- [x] Land-to-mana mapping (18 land types) ✅ VERIFIED
- [x] Spell casting (utility spells like Heal, Pot of Gold)
- [x] Combat spell casting (damage spells)
- [x] Magic panel UI
- [x] Fixed spell mana costs (all spells now have costs 2-5)
- [x] Fixed mana colors (Air→light blue, Arcane→golden)
- [x] Fixed spell effectTypes (corrected misclassified spells)
- [ ] ⚠️ Spell damage formula (power ratio) - needs VBA research

Verification Reports:
- [x] Phase 1 & 2: docs/verification-phase1-2.md
- [x] Phase 4 & 5: docs/verification-phase4-5.md
- [x] Phase 6: docs/verification-phase6.md (ISSUES FOUND → FIXED)
- [x] Phase 7: docs/verification-phase7.md (ISSUES FOUND)
