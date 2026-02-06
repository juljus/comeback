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
