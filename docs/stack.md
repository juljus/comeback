# Comeback - Technology Stack

## Overview

Web-based port of "Comeback" - a fantasy board game RPG originally built in Excel/VBA by Kristjan Stolin (2004-2007).

## Stack Decisions

| Layer                | Choice       | Notes                                                                    |
| -------------------- | ------------ | ------------------------------------------------------------------------ |
| **Language**         | TypeScript   | Strong typing for complex game state (130+ mobs, 40+ spells, 170+ items) |
| **Framework**        | Vue 3        | User preference                                                          |
| **Meta-framework**   | Nuxt 3       | SSR for landing/lobby, Nitro server for future multiplayer API           |
| **State Management** | Pinia        | Reactive, serializable game state, Vue DevTools support                  |
| **Styling**          | Tailwind CSS | Fast iteration, custom theme for fantasy aesthetic                       |
| **UI Components**    | Custom       | Game needs its own visual identity, not a "web app" look                 |
| **Database**         | Supabase     | Postgres + Auth + Realtime (for multiplayer phase)                       |
| **Deployment**       | TBD          | Nuxt supports Vercel, Netlify, Cloudflare, self-hosted                   |

## Architecture Approach

### Phase 1: Local Play

- Game logic as pure functions
- Pinia store holds game state locally
- Hot-seat multiplayer (2-4 players, same device)
- Faithful to original game design

### Phase 2: Online Multiplayer

- Pinia syncs with Supabase instead of local-only
- Actions become server calls (validated server-side)
- Supabase Realtime notifies players of turn changes
- User accounts, saved games, leaderboards

### Game State Pattern

```typescript
// Pure function approach - same logic works local or networked
function executeAction(gameState: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'MOVE':
      return handleMove(gameState, action.payload)
    case 'ATTACK':
      return handleAttack(gameState, action.payload)
    case 'END_TURN':
      return handleEndTurn(gameState)
    // ...
  }
}
```

- **Local**: Pinia calls `executeAction()` directly
- **Multiplayer**: Client sends action to server, server validates & executes, broadcasts new state

## Original Game Data

Extracted from `comeback0198e.xls`:

| Data      | Count | Description                                              |
| --------- | ----- | -------------------------------------------------------- |
| Mobs      | 130+  | Creatures with stats, abilities, immunities              |
| Spells    | 40+   | 7 mana types, 3 categories (damage, summon, buff)        |
| Items     | 170+  | Weapons, armor, consumables                              |
| Lands     | 18+   | Terrain types with mana production, defenders, buildings |
| Buildings | 40+   | Structures that unlock spells, mercenaries, bonuses      |

Game supports Estonian and English languages (original has both).

## Key Game Systems

- **Board**: 34 squares, randomly generated each game
- **Players**: 2-4 players, turn-based
- **Actions**: 3 action points per turn (morning, noon, evening)
- **Combat**: Dice-based (D&D style), status effects, immunities
- **Magic**: 7 mana types, spell levels affect power drastically
- **Progression**: Land ownership, buildings, titles (Baron/Count/Duke)
- **Win Condition**: Last player standing
