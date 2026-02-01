# Comeback - Roadmap v2

A 100% faithful port of the original Excel/VBA game (2004-2007) to Vue/Nuxt.

**Source of Truth:** VBA code in `docs/extraction/vba/all_modules.txt` (890 functions, 20,502 lines)
**Column Documentation:** `docs/extraction/columns.md` (100% verified)

---

## Status Overview

| Priority | Feature | Status |
|----------|---------|--------|
| 1-7 | Core mechanics | COMPLETE |
| 8 | Buffs, Companions, Mercenaries, Events | COMPLETE (basic) |
| 9 | **Missing Combat Mechanics** | COMPLETE |
| 10 | **Mob AI & Spellcasting** | NOT STARTED |
| 11 | **Pet Evolution System** | NOT STARTED |
| 12 | **Data Extraction Completion** | COMPLETE |
| 13 | Polish & Multiplayer | FUTURE |

---

## Priority 9: Missing Combat Mechanics - DONE

### Status Effects - IMPLEMENTED
- [x] **Poison** - DoT damage per round, applied by poison elemental attacks (25% chance)
- [x] **Frozen** - Skip turns (1 turn), applied by cold elemental attacks (15% chance)
- [x] **Burning** - 3 damage per round for 3 turns, applied by fire attacks (20% chance)
- [x] All effects processed at start of combat round
- [x] Death checks after each damage type

### Immunities - IMPLEMENTED
- [x] `checkImmunity(immunityValue)` - percentage-based resistance check
- [x] `applyResistance(damage, resistanceValue)` - damage reduction
- [x] Immunity checks on bleeding application (slash crits)
- [x] Immunity checks on stun application (crush crits)
- [x] Immunity checks on elemental status effects (fire, cold, poison)

### Elemental Damage - IMPLEMENTED
- [x] Defender elemental damage applied to player attacks
- [x] Fire damage + burning status chance
- [x] Cold damage + frozen status chance
- [x] Poison damage + poison DoT chance
- [x] Air damage (pure damage, no status)
- [x] CombatState stores defenderElementalDamage and defenderImmunities

### Wall/Ranged Mechanics - DEFERRED
- [ ] behind_wall flag not in current mob data extraction
- [ ] Will implement when ranged combat is added

---

## Priority 10: Mob AI & Spellcasting

**Data already extracted** (done in Priority 12):
- Mobs have: `aiBehavior: {gallantry, obedience, bravery}`
- Mobs have: `mana: {fire, earth, air, water, death, life, arcane}`
- Mobs have: `manaRegen: {fire, earth, air, water, death, life, arcane}`
- Mobs have: `hasSpells`, `spells[]`, `spellLevelBonus`
- Spells have: `effects.vampiricPercent`, `effects.hasWindEffect`

### AI Behavior System
- [ ] Implement flee decision based on bravery (10 = never flee)
- [ ] Implement spell vs melee preference based on gallantry/obedience
- [ ] Add defender flee attempts in combat

### Mob Spellcasting
- [ ] Track mob mana during combat (start with mob.mana values)
- [ ] AI selects spell based on mana available and situation
- [ ] Apply spell effects (damage, healing, buffs)
- [ ] Deduct mana cost after casting

### Spell Effects (not yet implemented)
- [ ] Vampiric: heal caster by `vampiricPercent`% of spell damage
- [ ] Wind: affects movement difficulty (power: `knowledge + power/2`, duration: `power - 1`)

---

## Priority 11: Pet Evolution System

**Data already extracted** (done in Priority 12):
- `levelup.json` created with 51 evolution entries
- `LevelupType` schema in schemas.ts
- Each entry has: hpBonus, attacksBonus, damageBonus, statBonuses, armorBonus, learnsSpells, resistances
- Mobs have: `evolvesInto` field linking to evolution target

### Evolution Tracking
- [ ] Increment evolution counter in combat (VBA formula: `(4 - turn_number) * 3`)
- [ ] Track evolution progress on CompanionInstance
- [ ] Check evolution threshold after combat
- [ ] Trigger evolution when ready

### Evolution Logic
- [ ] Look up evolution data from levelup.json by mob name
- [ ] Apply stat bonuses when evolving
- [ ] Learn new spells on evolution
- [ ] Gain resistances on evolution

### Evolution UI
- [ ] Training menu for pets
- [ ] Evolution progress display
- [ ] Evolution animation/notification

---

## Priority 12: Data Extraction Completion - DONE

All CSV columns now extracted and validated with strict Zod schemas.

**Mobs - Extracted fields:**
- [x] AI behavior: gallantry, obedience, bravery
- [x] Mana pools: fire, earth, air, water, death, life, arcane (7 fields)
- [x] Mana regen: all 7 types
- [x] Immunities: fire, lightning, cold, poison, bleeding, stun (6 fields)
- [x] Elemental damage: fire, poison, air, cold
- [x] spellLevelBonus

**Spells - Extracted fields:**
- [x] Fixed mana cost (was in wrong column)
- [x] Effects: generatesGold, generatesItem, isSummon, hasHeal, hasArmorBuff, hasHaste, hasStrengthBuff, hasWindEffect, vampiricPercent
- [x] Targeting: isAggressive, canTargetFriendly, canTargetHostile, canTargetGroup, canTargetSingle, canTargetLand, canTargetPlayer, hasGlobalRange
- [x] Fixed summonTiers with correct creature/count mapping

**Buildings - Extracted fields:**
- [x] Fortification: level, archerySlots, castleDefender, gateDefense
- [x] Bonuses: healingBonus, incomeBonus, manaRegen (7 types), statBonuses (3 stats)
- [x] Flags: isPortal, isBank, combatRoundsBonus, spellLevelBonus

**Levelup - NEW file created:**
- [x] 51 evolution entries with stat bonuses, spells learned, resistances

---

## Priority 13: Polish & Future

### UI Improvements
- [ ] Better board layout
- [ ] Movement animations
- [ ] Combat animations
- [ ] Dice roll animations
- [ ] Sound effects

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

## Completed Priorities (1-8)

### Priority 1: Spell Mana Costs - DONE
- Fixed column mapping (CSV col 8 = mana cost)
- Costs range 6-50 mana

### Priority 2: Core Mechanics - DONE
- Turn system (5 phases)
- Movement (2d6 + speed, doubles mechanic)
- Land ownership (buy, upgrade defenders, improve income)

### Priority 3: Combat - DONE
- Damage calculation (XdY dice, armor reduction)
- Damage types (pierce/slash/crush with crits)
- Combat stats (STR→armor, DEX→attacks, POW→spell damage)
- Flee mechanics (DEX-based formula)
- Adjacent land reinforcements

### Priority 4: Economy - DONE
- Shops (Shop, Smithy, Bazaar with caps)
- Equipment (7 slots, STR requirements)
- Inventory limit (20 items)

### Priority 5: Buildings - DONE
- Construction (prerequisites, costs)
- Building effects (spells, mercs, stats)
- Fortifications (archer counts fixed to 2/3/4)
- Training (cost = stat² × 5)

### Priority 6: Titles & Rewards - DONE
- Title thresholds (3/9/15 lands)
- Title salary (20/30/40/50 gold)
- King's Gift (item value tiers)

### Priority 7: Magic System - DONE
- Mana generation (land types, Arcane Tower scaling)
- Spell casting (damage/heal formulas)
- Spell learning (buildings, Mage Guild training)
- Buff system (armor, strength, haste with durations)

### Priority 8: Missing Features - DONE (basic)
- Buff system (BuffEffect interface, expiration)
- Companion system (summons, HP tracking)
- Mercenary system (hiring, contracts)
- Events system (Cave, Dungeon, Treasure Island triggers)

---

## Implementation Order

```
Priority 12 (Data Extraction)     ✓ DONE
    ↓
Priority 9 (Combat Mechanics)     ✓ DONE
    ↓
Priority 10 (Mob AI)              ← NEXT
    ↓
Priority 11 (Pet Evolution)
    ↓
Priority 13 (Polish)
```

---

## Quick Reference

### Key VBA Line Numbers
- Main turn loop: 1928
- Combat: 11914 (combat_global), 12215 (one_hit_round)
- Spellcasting: 5751 (cast_spell), 6007 (spell_effect)
- Pet training: 13724 (train_pet_menu), 13815 (add_pet)
- AI flee check: 12556 (hit_fleeing)
- Evolution: level_up_mob() references levelup.csv col 46

### File Locations
- VBA source: `docs/extraction/vba/all_modules.txt`
- Column docs: `docs/extraction/columns.md`
- Raw CSV: `docs/extraction/raw/*.csv`
- Schemas: `app/data/schemas.ts`
- Game logic: `app/stores/game.ts`
