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

## Pre-commit Hooks

Every commit runs two checks via Husky:

1. **lint-staged** -- ESLint + Prettier on staged files only (fast feedback).
2. **vue-tsc --noEmit** -- Full project type-check (catches cross-file type errors).

## Code Style

- **ESLint**: Nuxt flat config with `eslint-config-prettier` to avoid conflicts.
- **Prettier**: No semicolons, single quotes, trailing commas, 100 char width, 2-space indent.
