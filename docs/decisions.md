# Architecture Decision Records

## ADR-1: Pure TypeScript Game Engine

The `game/` directory contains a pure TypeScript domain layer with zero Vue/Nuxt imports. This keeps the game logic framework-agnostic, testable in plain Node, and potentially reusable outside a browser context.

## ADR-2: English Internally, i18n at Presentation Layer

The game engine uses English identifiers for all domain concepts (creature names, spell IDs, land types, etc.). Translation is purely a presentation concern handled by the Nuxt layer via `@nuxtjs/i18n`. The engine never imports or references translation files.

## ADR-3: Estonian Default, English Fallback

Estonian (`et`) is the default locale, matching the original 2004 VBA game's primary audience. English (`en`) is the fallback locale. Browser language detection uses a cookie so the choice persists across sessions.

## ADR-4: Nested Domain Folders with Colocated Tests

Test files live next to their source files in `game/` (e.g., `game/combat.ts` and `game/combat.test.ts`). This keeps related code together and makes it easy to find tests for any module.

## ADR-5: Shared Types and Static Data Directories

Shared TypeScript types live in `game/types/`. Static game data (creature stats, spell definitions, land configs) will live in `game/data/`. Both are consumed by domain modules within `game/`.

## ADR-6: Public API via index.ts

Each domain module in `game/` exports its public API through `game/index.ts`. The Nuxt app layer imports only from this barrel file, keeping internal module structure as an implementation detail.

## ADR-7: TDD with Vitest

Development follows test-driven development. Vitest runs in a plain Node environment targeting `game/**/*.test.ts`. Tests are written before implementation.

## ADR-8: URL Strategy (no_prefix) for i18n

The `no_prefix` strategy is used for i18n routing -- no `/et/` or `/en/` URL prefixes. This is a game application, not a content site. Language selection is stored in a cookie and detected on the root route.

## ADR-9: Board-Centered UI Layout

The game board IS the UI frame. The 34 squares are arranged in a rectangular ring (11x8 CSS grid), and the center of the board serves as a context-sensitive viewport. When moving, the center shows land info and action buttons. During combat, it wipes to show the combat scene. For shops, it shows the shop interface. This eliminates the need for separate sidebars, navbars, or overlays -- everything lives inside the board.

## ADR-10: Minimalist Parchment Theme

The UI uses a light parchment color palette (#f5f0e6 background, #3d3029 text) with minimal borders and pastel accents. No dark mode. Serif font (Georgia) for an old-world game feel. The design is primarily text-based with minimal graphical elements. Combat scenes may use ASCII-style character representations.

## ADR-11: Flat Component Structure

Components live directly in `app/components/` without deep folder nesting. The main components are: `GameBoard.vue` (the ring layout), `BoardSquare.vue` (one square), `CenterView.vue` (context router for the center viewport), and feature-specific views like `CombatView.vue`, `ShopView.vue`, `EventView.vue`. Composables in `app/composables/` bridge the pure game engine to Vue reactivity.

## ADR-12: Parallel Engine + UI Development

The game engine and UI are built in parallel rather than engine-first. Each engine feature gets a corresponding UI piece immediately, providing visual feedback, validating the engine API's usability from Vue, and keeping development motivating. The engine remains pure and testable -- Vue components just call engine functions and render the result.

## ADR-13: Pure Functions, No Classes

The game engine uses only pure functions and plain objects. No classes, no `this`, no mutation of inputs. Functions take state in and return new state. This makes the engine trivially testable and eliminates a class of bugs related to shared mutable state. Vue reactivity wraps the engine state at the composable layer.

## ADR-14: CamelCase Keys as Cross-Reference IDs

All cross-references between data domains use camelCase object keys (not Estonian names, not numeric IDs). A building's `prereqs` array contains `['fort', 'castle']`, not `['Kants', 'Kindlus']`. A spell's `summonTiers` reference `'fireElemental'`, not `'Tule Elemental'`. This ensures type safety and makes lookups trivial via bracket notation on the data objects.
