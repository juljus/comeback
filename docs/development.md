# Development Guide

## Commands

| Command                | Purpose                        |
| ---------------------- | ------------------------------ |
| `npm run dev`          | Start Nuxt dev server          |
| `npm run build`        | Production build               |
| `npm run lint`         | Run ESLint                     |
| `npm run lint:fix`     | Run ESLint with auto-fix       |
| `npm run format`       | Format all files with Prettier |
| `npm run format:check` | Check formatting (CI)          |
| `npm run typecheck`    | Type-check with vue-tsc        |
| `npm run test`         | Run Vitest in watch mode (TDD) |
| `npm run test:run`     | Single Vitest run (CI)         |

## Project Structure

```
app/              # Nuxt 4 app directory (pages, components, layouts)
game/             # Pure TypeScript game engine (no Vue/Nuxt imports)
  *.ts            # Domain modules
  *.test.ts       # Colocated tests
docs/             # Project documentation
```

## Testing Approach

- **TDD**: Write tests before implementation.
- **Colocated tests**: Test files live next to their source files in `game/` (e.g., `game/combat.ts` and `game/combat.test.ts`).
- **Node environment**: Game engine tests run in a plain Node environment -- no Vue/Nuxt test utils needed.
- Vitest config targets only `game/**/*.test.ts`.

## Architectural Rules

- `game/` must have **zero** Vue/Nuxt imports. It is a pure TypeScript domain layer.
- The Nuxt app layer (`app/`) consumes `game/` via Pinia stores or composables.
- **No hardcoded user-facing text** in templates or components. All visible text must use `$t()` translation keys.

## Pre-commit Hooks

Every commit runs two checks via Husky:

1. **lint-staged** -- ESLint + Prettier on staged files only (fast feedback).
2. **vue-tsc --noEmit** -- Full project type-check (catches cross-file type errors).

## Code Style

- **ESLint**: Nuxt flat config with `eslint-config-prettier` to avoid conflicts.
- **Prettier**: No semicolons, single quotes, trailing commas, 100 char width, 2-space indent.

## Internationalization (i18n)

### Architecture

Translation is a **presentation-layer concern only**. The game engine (`game/`) uses English identifiers internally and never imports translation files. The Nuxt layer handles all i18n via `@nuxtjs/i18n`.

**No hardcoded user-facing text.** All text visible to the user must go through `$t()` or `t()`. Never write raw strings like `<span>End Turn</span>` in templates -- always use `<span>{{ $t('ui.endTurn') }}</span>` instead. If a translation key doesn't exist yet, add it to both `et.json` and `en.json` before using it.

- **Default locale**: Estonian (`et`)
- **Fallback locale**: English (`en`)
- **URL strategy**: `no_prefix` -- no `/et/` or `/en/` in URLs
- **Persistence**: Cookie-based (`i18n_locale`)

### Translation Key Pattern

Keys use `{namespace}.{camelCaseId}` where the camelCase ID matches the game engine's internal English identifier:

```
$t('creature.pikeman')  // "Piigimees" (et) / "Pikeman" (en)
$t('spell.fireBolt')    // "Tulenool" (et) / "Fire Bolt" (en)
$t('land.valley')       // "Org" (et) / "Valley" (en)
```

### Namespaces

| Namespace          | Purpose                          |
| ------------------ | -------------------------------- |
| `ui`               | General UI labels and buttons    |
| `action`           | Player action labels             |
| `creature`         | Creature/mob display names       |
| `spell`            | Spell display names              |
| `spellDescription` | Spell flavor text / descriptions |
| `land`             | Land type display names          |
| `building`         | Building display names           |
| `item`             | Item display names               |
| `stat`             | Character stat labels            |
| `title`            | Nobility title display names     |

### File Structure

```
i18n/
  i18n.config.ts      # Vue I18n runtime config (fallback, warnings)
  locales/
    et.json            # Estonian translations
    en.json            # English translations
```

### Usage in Components

```vue
<template>
  <span>{{ $t('creature.pikeman') }}</span>
</template>

<script setup lang="ts">
const { locale, setLocale } = useI18n()
setLocale('en')
</script>
```
