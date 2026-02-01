# Comeback - Faithful Port Roadmap

A 100% faithful port of the original Excel/VBA game (2004-2007) to Vue/Nuxt.

**Source of Truth:** VBA code in `docs/extraction/vba/all_modules.txt` (890 functions, 20,502 lines)

---

## Priority 1: Fix Incorrect Data

### Spell Mana Costs (CRITICAL) - DONE
- [x] Fix column mapping error (CSV col 4 was mislabeled as mana_cost)
- [x] Real mana cost is in VBA column 9 = CSV position 8
- [x] Updated all 37 spells with correct costs (6-50 mana range)
- [x] Verified against VBA line ~5911 (mana cost check)
- [x] Updated columns.md documentation

---

## Priority 2: VBA Verification - Core Mechanics

### Turn System - VERIFIED
- [x] 4 phases: 0=move, 1=morning, 2=noon, 3=evening, 4=end (VBA line 1976-1998)
- [x] Combat ends at phase 4 if still fighting (line 1988)
- [x] Functions: `Main_turn()` (line 1928), `end_turn()` (line 4033)

### Movement - VERIFIED
- [x] 2d6 dice roll: `Int((Rnd * (6 + speed_add)) + 1)` for each die (line 4286-4287)
- [x] Speed bonus from items/buffs added to dice range
- [x] Board wraps at 34 squares (line 4314-4316)
- [x] **Doubles mechanic**: Roll same on both dice → can keep or reroll
- [x] **Consecutive doubles bonus**: 50 * count^2 gold (50/200/450...)
- [x] Functions: `move_player()` (line 4230), `liigutamise_veeretus()` (line 4264)

### Land Ownership - VERIFIED
- [x] Buy land uses land's price from Game_map column 3 (line 3786)
- [x] Buy land takes ENTIRE turn: sets phase to 4 (line 3778)
- [x] **Defender upgrade cost formula** (line 2778-2790):
  - Tier 2: `merc_tier * 4 * 1`
  - Tier 3: `merc_tier * 4 * 2`
  - Tier 4: `merc_tier * 5 * 3`
  - (uses mob's merc_tier from mobs.csv column 31)
- [x] **Improve income formula** (line 2039):
  - `Int((base_tax / 2 + 10) / 3 * (4 - current_phase))`
  - Max income = base_tax * 3
- [x] Functions: `buy_land()` (line 3761), `upgrade_defender()` (line 2747)

---

## Priority 3: VBA Verification - Combat

### Combat Flow - VERIFIED
- [x] Each attack = 1 action point (col 4 = strikes, Game_data1(17,2) = attack counter)
- [x] Combat ends at round 4 (evening) - Game_data1(84,2) tracks round
- [x] Attacker and defender exchange attacks each round
- [x] Functions: `add_combat` (10719), `combat_global` (11914), `one_hit_round` (12215)

### Damage Calculation - VERIFIED
- [x] XdY+bonus: `Int(Rnd * d2 + 1)` looped d1 times (line 12239-12250)
- [x] Armor reduction: `damage - armor` (min 0) (line 12332-12341)
- [x] Attacks per round: `1 + Int(dex/5)` (line 5513)
- [x] Functions: `one_hit_round` (12215), `hitting_enemy` (12512)

### Damage Types - VERIFIED & IMPLEMENTED
- [x] **Pierce** (type=1): DEX vs DEX+5, armor bypass on crit (line 12268-12275)
- [x] **Slash** (type=2): (STR+DEX/2) vs DEX+3, bleed=dmg/2 if dmg>3 (line 12278-12285)
- [x] **Crush** (type=3): STR×2 vs DEX³+2, stun 2 turns if dmg>5 (line 12288-12295)
- [x] Damage type stored in column 7 of mob/weapon data

### Combat Stats - VERIFIED & IMPLEMENTED
- [x] Strength → armor: `Int(str/4)` (line 5495) ✓ Implemented
- [x] Dexterity → attacks: `1 + Int(dex/5)` (line 5513) ✓ Implemented
- [x] Power → spell damage: `(knowledge × base + Rnd(power/2)) × power/enemyPower` (line 12112)

### Flee Mechanics - VERIFIED & IMPLEMENTED (VBA line 12556-12626)
- [x] **Flee formula**: `hit_fleeing()` function
  - fleeja_Bonus = 2 (base for runner)
  - chasija_Bonus = 1 (base for chaser)
  - If player DEX > defender DEX: fleeja_Bonus += (1 + diff)²
  - If defender DEX > player DEX: chasija_Bonus += (1 + diff)²
  - Success if roll > chasija_Bonus (flee_chance = fleeja_Bonus / total)
- [x] **Failed flee consequence**: Defender gets free attack (line 12616)
- [x] Cannot flee again same round after failed attempt

### Adjacent Land Reinforcements - VERIFIED & IMPLEMENTED
- [x] **Conditions** (all must be true):
  - Adjacent land has same landTypeId as combat location
  - Adjacent land has same owner (not neutral)
  - Adjacent land's defender hasn't already reinforced this turn
- [x] Reinforcements arrive next round (pending → active)
- [x] Reinforcements attack after main defender
- [x] Killed reinforcements promote to main defender if main dies

---

## Priority 4: VBA Verification - Economy

### Shops - VERIFIED & IMPLEMENTED
- [x] Shop inventory: VBA types 4-9, value 25-10000
- [x] Smithy inventory: VBA types 1-6 (weapons/armor only) ✓
- [x] **Bazaar inventory**: All types, **max 400 gold** (line 3054-3057) - FIXED
- [x] Buy = 1 action point (line 14472) ✓
- [x] Sell = 50% value (line 14215) ✓
- [x] **Inventory limit**: 20 items max (line 14428) - FIXED
- [x] Shop capacity: 9 items max (line 4888)
- [x] Functions: `outfit_shop` (3032), `Buy_item` (14405), `Sell_item` (14179)

### Equipment - VERIFIED
- [x] Equip/unequip = 1 action point (line 14722) ✓
- [x] 7 equipment slots: helm, armor, boots, 2 rings, weapon, consumables
- [x] STR requirements: If STR < req, penalty = 2×(STR-req) ✓ Already implemented
- [x] Equipment bonuses via `change_stats()` function (lines 15678-15878)
- [x] Unarmed damage: 1d[STR] (lines 15449-15452)
- [x] Functions: `Equip_item` (14622), `equip_weapon` (15254), `equip_armor` (15470)

### Starting Conditions - VERIFIED (VBA lines 63-152)
- [x] Starting gold: **200** (line 68)
- [x] Starting HP: **20** (line 86)
- [x] Starting weapon: **Knife** (item ID 2, **1d4** pierce) (lines 89-90, 146)
- [x] Starting armor: **0** (line 94)
- [x] Starting stats: **ALL 6 stats = 2** (lines 137-139)
- [x] Starting mana: **0** for all types (lines 141-143)
- [x] Function: `start_game()` (line 35)

---

## Priority 5: VBA Verification - Buildings

### Construction - VERIFIED
- [x] "Own all lands of type" required (line 16499) ✓
- [x] Building costs from Buildings sheet column 6 (line 16665)
- [x] Building = 1 action point (line 16726-16728)
- [x] Functions: `check_build` (16467), `build_fortification` (16574), `build_building` (16642)

### Building Effects - VERIFIED
- [x] Spell grants: Buildings columns 8-10 (lines 16888-16923)
- [x] Mercenary unlocks: Buildings columns 25-26 (lines 17101-17104)
- [x] Mana regen bonuses: columns 12-18
- [x] Stat bonuses: columns 29-31 (STR, DEX, POW)
- [x] Combat rounds bonus: column 24
- [x] Functions: `building_bonus_to_player` (16817), `building_bonus_to_land` (17067)

### Fortifications - VERIFIED & FIXED
- [x] **Archer counts**: Fort=2, Citadel=+1 (3 total), Castle=+1 (4 total) - FIXED (was 2/4/6)
- [x] Archers fight from behind wall (Side column 38 = 1)
- [x] Can only be targeted by ranged (type 11) or spells (lines 10681-10689)
- [x] Fortification level: Buildings column 7 → Game_map column 12
- [x] Archery slots: Buildings column 19 → Game_map column 14
- [x] Upgrade chain: Fort → Citadel → Castle (prerequisites in columns 2-5)

### Training - VERIFIED (VBA line 17622)
- [x] **Training cost formula**: `current_stat^2 * 5` gold (line 17657)
  - STR 2→3: 20 gold
  - STR 3→4: 45 gold
  - STR 4→5: 80 gold
  - STR 5→6: 125 gold
- [x] Training only available in morning (phase 1)
- [x] Training takes full day (sets phase to 4)
- [x] Max trainable: 6 for STR/DEX (lines 17608, 17614)
- [x] Functions: `training_ground()` (17597), `train_stat()` (17622)

---

## Priority 6: VBA Verification - Titles & Rewards

### Title System - VERIFIED
- [x] Thresholds stored in cells 77-79, checked at line 4018
- [x] Baron = 3 lands, Count = 9 lands, Duke = 15 lands ✓ (matches our impl)
- [x] **Title salary** (line 3974-3980): Base 20 gold + title bonus from cells 74-76
  - Need to extract Game_data1 to get actual bonus values
- [x] Functions: `titles_check` (3913), `title_name` (3888)

### King's Gift - VERIFIED
- [x] Baron gift: Items worth 50-120 gold (line 19023) ✓
- [x] Count gift: Items worth 121-300 gold (line 19029) ✓
- [x] Duke gift: Items worth 301-1000 gold (line 19035) ✓
- [x] Generates 3 items to choose from (line 19059)
- [x] VBA uses weighted odds: `Round(2000 / item_value + 1, 0)` (cheaper more likely)
  - Our impl uses uniform random (minor deviation)
- [x] Functions: `kings_gift` (19002), `kings_item_selection` (19041)

### TODO: Extract Game_data1
- [ ] Extract Game_data1 sheet to get title salary values (cells 74-76)
- [ ] Implement title salary in collectIncome()

---

## Priority 7: VBA Verification - Magic System

### Mana Generation - VERIFIED
- [x] 7 mana types confirmed
- [x] Land-to-mana mappings verified (18 land types)
- [x] **Arcane Tower scaling CORRECTED** (VBA line 3844-3877):
  - 1 tower: +1 (total 1)
  - 2 towers: +2 (total 3)
  - 3 towers: +3 (total 6)
  - 4 towers: +6 (total **12**, NOT 10!)
- [x] Mana collected when passing Royal Court

### Spell Casting
- [ ] Verify spell casting action cost
- [ ] Verify spell damage formula (power ratio, not flat bonus)
- [ ] Verify spell healing formula
- [ ] Verify buff spell durations
- [ ] Find VBA functions: `CastSpell`, spell effect handlers

### Spell Learning
- [ ] Research how spells are learned (buildings only?)
- [ ] Verify Library/Mage Guild spell learning
- [ ] Verify spell level system (if exists)
- [ ] Find VBA spell learning functions

### Specific Spell Effects
- [ ] Verify Heal spell formula
- [ ] Verify Pot of Gold amounts
- [ ] Verify damage spell formulas (Magic Arrow, Fireball, etc.)
- [ ] Verify buff effects (Bless, Shield, Haste, etc.)
- [ ] Verify summon mechanics

---

## Priority 8: Missing Features

### Events System
- [ ] Research VBA for Cave mechanics
- [ ] Research VBA for Dungeon mechanics
- [ ] Research VBA for Treasure Island mechanics
- [ ] Implement event triggers (landing on special squares)
- [ ] Implement event resolution
- [ ] Connect events.json data to game logic

### Companion/Pet System
- [ ] Research VBA for companion mechanics
- [ ] Research VBA for pet evolution
- [ ] Implement companion combat participation
- [ ] Implement summon spell companions

### Buff System
- [ ] Research VBA for buff duration tracking
- [ ] Implement buff state on player
- [ ] Implement buff expiration
- [ ] Implement buff effects in combat

### Mercenary System
- [ ] Research VBA for mercenary hiring
- [ ] Research VBA for mercenary combat
- [ ] Implement mercenary recruitment
- [ ] Implement mercenary management

---

## Priority 9: Data Verification

### lands.json (38 entries)
- [ ] Verify all land prices against VBA
- [ ] Verify all land tax income values
- [ ] Verify all land defender arrays
- [ ] Verify land-to-mana type mappings

### mobs.json (132 entries)
- [ ] Verify mob HP values
- [ ] Verify mob armor values
- [ ] Verify mob damage formulas
- [ ] Verify mob stats (STR/DEX/POW)
- [ ] Verify which mobs appear as land defenders

### items.json
- [ ] Verify item prices
- [ ] Verify item stats/bonuses
- [ ] Verify strength requirements
- [ ] Verify damage formulas for weapons

### buildings.json (48 entries)
- [ ] Verify building costs
- [ ] Verify building prerequisites
- [ ] Verify building effects
- [ ] Verify spell grants
- [ ] Verify mercenary unlocks

### spells.json (37 entries)
- [x] Mana costs fixed (VBA column 9 = CSV position 8, range 6-50)
- [ ] Verify spell effects
- [ ] Verify spell damage/healing formulas
- [ ] Verify mana type requirements

---

## Priority 10: Polish (After Verification Complete)

### UI Improvements
- [ ] Better board layout
- [ ] Animations for movement
- [ ] Animations for combat
- [ ] Animations for dice rolls
- [ ] Sound effects (optional)

### Quality of Life
- [ ] Save/load game state
- [ ] Undo last action
- [ ] Game log/history panel
- [ ] Keyboard shortcuts

### Multiplayer (Future)
- [ ] Supabase integration
- [ ] User accounts
- [ ] Online multiplayer
- [ ] Game lobbies

---

## VBA Research Notes

### Key VBA Files to Search
- Combat functions: `Attack`, `Damage`, `Combat`
- Movement functions: `Move`, `Roll`, `Dice`
- Economy functions: `Buy`, `Sell`, `Shop`, `Gold`
- Building functions: `Build`, `Construct`
- Magic functions: `Cast`, `Spell`, `Mana`
- Event functions: `Event`, `Cave`, `Dungeon`, `Treasure`

### VBA Column Mappings (for data sheets)
- Spells: Column 7 = mana type, Column 9 = mana cost
- Items: Need to document
- Mobs: Need to document
- Buildings: Need to document

### Known VBA Findings
- Line 5911: Spell mana cost check (VBA col 9 = CSV pos 8)
- Spell costs range 6-50 mana (NOT free as initially thought)
- Line 1928: Main_turn() - core game loop
- Line 4264: liigutamise_veeretus() - dice roll for movement
- Line 3761: buy_land() - land purchase logic
- Line 2747: upgrade_defender() - defender upgrade with merc_tier formula
- Line 17622: train_stat() - training cost formula (stat^2 * 5)
- Line 3844: tower_check() - Arcane Tower scaling (1/3/6/12)
- Line 12556: hit_fleeing() - flee formula with DEX squared difference
- Line 5495: Armor_check() - STR→armor formula (Int(str/4))
- Line 5513: Extra_rounds_check() - DEX→attacks formula (1+Int(dex/5))
- Line 12215: one_hit_round() - main damage calculation
- Line 12268: Pierce critical check (DEX vs DEX+5)
- Line 12278: Slash critical check ((STR+DEX/2) vs DEX+3)
- Line 12288: Crush critical check (STR×2 vs DEX³+2)
- Line 12112: Spell damage formula with power ratio
- Line 3032: outfit_shop() - shop inventory generation
- Line 14405: Buy_item() - purchase logic
- Line 14179: Sell_item() - sell at 50% value
- Line 14428: Inventory limit check (20 items max)
- Line 14622: Equip_item() - equip costs 1 action
- Line 15298: STR penalty formula (2×difference if below req)

---

## Progress Tracking

### Verified from VBA
- [x] Turn system: 5 phases (0=move, 1-3=actions, 4=end)
- [x] Movement: 2d6 + speed bonus, doubles reroll mechanic
- [x] Buy land: takes full turn, cost from land price
- [x] Title thresholds: stored in Game_data1 cells 77-79
- [x] Arcane Tower: 1→1, 2→3, 3→6, 4→12 mana
- [x] Land-to-mana mappings confirmed
- [x] 7 mana types confirmed
- [x] Spell mana costs: 6-50 range (CSV position 8)
- [x] Starting gold: 200
- [x] Starting HP: 20
- [x] Starting weapon: Knife (1d4)
- [x] Starting stats: ALL = 2
- [x] Training cost: current_stat^2 * 5
- [x] Defender upgrade: merc_tier * multiplier * tier
- [x] Improve income: (base_tax/2 + 10) / 3 * remaining_actions
- [x] Flee mechanics: DEX-based squared difference (line 12556)
- [x] Failed flee: defender gets free attack
- [x] Adjacent land reinforcements: same type + same owner
- [x] Combat flow: round 4 = evening timeout
- [x] Damage dice: Int(Rnd * d2 + 1) looped d1 times
- [x] Armor reduction: damage - armor (min 0)
- [x] STR → armor: Int(str/4)
- [x] DEX → attacks: 1 + Int(dex/5)
- [x] Pierce crit: DEX vs DEX+5, armor bypass
- [x] Slash crit: (STR+DEX/2) vs DEX+3, bleed=dmg/2 if >3
- [x] Crush crit: STR×2 vs DEX³+2, stun 2 turns if >5
- [x] Buy/sell = 1 action each
- [x] Sell = 50% value
- [x] Equip/unequip = 1 action
- [x] Inventory limit: 20 items max
- [x] Bazaar: max 400 gold items
- [x] STR penalty: 2×(STR-req) if below requirement

### Implementation Fixes Needed
- [x] Update Arcane Tower scaling to 1/3/6/12 (was 1/3/6/10) - FIXED
- [x] Implement defender upgrade using merc_tier formula - FIXED
- [x] Implement training cost formula (stat^2 * 5) - FIXED
- [x] Implement improve income formula - FIXED
- [x] Add doubles mechanic to movement - FIXED
- [x] Implement flee mechanics with VBA formula - FIXED
- [x] Implement adjacent land reinforcements - FIXED
- [x] Add inventory limit (20 items) - FIXED
- [x] Add Bazaar value cap (max 400 gold) - FIXED
- [x] Fix fortification archer counts (was 2/4/6, now 2/3/4) - FIXED

### Still Need VBA Research
- [ ] King's Gift options (currently have item tiers, need VBA verification)

---

## Session Log

### 2026-02-01
- **Verified & Implemented**: Flee mechanics with VBA formula (line 12556-12626)
  - DEX-based squared difference formula
  - Failed flee triggers free attack from defender
  - Cannot retry flee same round
- **Verified & Implemented**: Adjacent land reinforcement system
  - Same landTypeId + same owner conditions
  - Pending → active reinforcement flow
  - Reinforcements attack after main defender
- **Verified**: Priority 3 Combat mechanics (all match implementation)
  - Combat flow: round 4 timeout, attack exchange
  - Damage calculation: XdY dice, armor reduction
  - Combat stats: STR→armor (Int(str/4)), DEX→attacks (1+Int(dex/5))
  - Damage types: pierce/slash/crush critical formulas and effects
  - Power→spell damage: ratio formula with knowledge scaling
- **Verified**: Priority 4 Economy mechanics
  - Shop: types 4-9, value 25-10000; Smithy: types 1-6; Bazaar: all types max 400
  - Buy/sell = 1 action each, sell = 50% value
- **Verified**: Priority 5 Buildings mechanics
  - Construction: own all lands of type required, costs from column 6, 1 action
  - Building effects: spells (cols 8-10), mercs (cols 25-26), stats (cols 29-31)
  - Fortifications: archers behind wall, only hit by ranged/spells
- **Fixed**: Fortification archer counts (was 2/4/6, now 2/3/4 per VBA)
  - Equip/unequip = 1 action, 7 equipment slots
  - STR penalty: 2×(STR-req) if below requirement
  - Starting: Knife 1d4, all stats = 2
- **Implemented**: Inventory limit (20 items max)
- **Implemented**: Bazaar value cap (max 400 gold)
- **Verified**: Priority 6 Titles & King's Gift
  - Title thresholds match (3/9/15 lands)
  - King's Gift value ranges match (50-120/121-300/301-1000)
  - Title salary exists but need Game_data1 extraction for values

### 2026-01-31
- Extracted all VBA code (890 functions, 20,502 lines)
- Created archive document
- Fixed spell mana costs (6-50 range from VBA col 9)
- Verified core mechanics: turn system, movement, land ownership
- Verified training cost formula: stat^2 * 5
- Verified Arcane Tower scaling: 1/3/6/12 (not 10)
- Verified defender upgrade formula using merc_tier
- Verified starting conditions (200 gold, 20 HP, Knife, stats=2)
- **Implemented**: Defender upgrade cost using merc_tier formula
- **Implemented**: Training cost formula (current_stat² * 5, max 6 for STR/DEX)
- **Implemented**: Improve income VBA formula with phase-based bonus
- **Implemented**: Doubles dice mechanic (keep/reroll, consecutive gold bonus)
- **Implemented**: Combat damage type effects (pierce/slash/crush with crits)
