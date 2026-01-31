# Comeback - Development Roadmap

Each phase includes the feature implementation + minimal functional UI.
Polish and visual design comes at the end.

---

## Phase 1: Foundation + Basic UI Shell ✅
- [x] Pinia game store (GameState structure)
- [x] Board generation (34 random squares from land types)
- [x] Simple board display (circular layout)
- [x] Player setup (2-4 players, names)
- [x] Basic game initialization

## Phase 2: Turn & Movement ✅
- [x] Turn system (3 actions per turn: morning, noon, evening)
- [x] Player rotation (whose turn)
- [x] Movement on board (forward/backward)
- [x] Action point consumption
- [x] End turn functionality
- [x] Basic player position display on board

## Phase 3: Land Ownership
- [ ] Buy land (if neutral, pay price)
- [ ] Land defenders (tier 1-4 based on land type)
- [ ] Conquering land (fight defender → own land)
- [ ] Ownership display (player colors on board)
- [ ] Land info panel (name, owner, defender, income)

## Phase 4: Combat
- [ ] Combat state (attackers vs defenders)
- [ ] Turn-based combat flow
- [ ] Attack action (dice rolls, damage calculation)
- [ ] HP tracking and death
- [ ] Armor and damage types (pierce/slash/crush)
- [ ] Status effects (bleeding, stun, poison, etc.)
- [ ] Flee mechanics
- [ ] Victory/defeat resolution
- [ ] Combat log display

## Phase 5: Economy
- [ ] Gold tracking per player
- [ ] Income when passing Royal Court (based on owned lands)
- [ ] Tax income from lands
- [ ] Shop interaction (buy items)
- [ ] Sell items
- [ ] Inventory management
- [ ] Equipment (weapon, armor)

## Phase 6: Buildings & Progression
- [ ] Building construction on owned land
- [ ] Building prerequisites
- [ ] Building effects (unlock mercs, grant spells)
- [ ] Fortifications (Fort → Citadel → Castle)
- [ ] Mercenary hiring
- [ ] Title system (Baron at 3 lands, Count at 9, Duke at 15)
- [ ] King's gift selection
- [ ] Training grounds (improve stats)

## Phase 7: Magic System
- [ ] Mana pool per player (7 types)
- [ ] Mana generation from owned lands
- [ ] Mana from Arcane Towers
- [ ] Spell casting (outside combat)
- [ ] Combat spells
- [ ] Buff spells
- [ ] Summon spells (create companions)
- [ ] Companion management
- [ ] Spell learning (Library, Mage Guild)

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

## Current Status

**Phase 3: Up Next**

Completed:
- [x] Data extraction from original Excel
- [x] TypeScript types defined
- [x] JSON data files created
- [x] Nuxt project initialized
- [x] Tailwind configured with mana colors
- [x] Pinia game store
- [x] Board generation
- [x] Player setup UI
- [x] Turn system with 3 actions
- [x] Movement on board
- [x] Basic game UI
