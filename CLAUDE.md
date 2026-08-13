# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server (open at phone-width to check mobile layout)
npm run build        # tsc -b type-check, then vite build
npm run lint         # eslint over the repo
npm test             # vitest run (one-shot)
npm run test:watch   # vitest watch mode
npx vitest run src/store.test.ts -t "advances the rotation"   # single test by name
```

There is one test file, `src/store.test.ts`, covering the reducer and storage logic.

## Architecture

GymBuddy is a single-user, local-only gym tracker: React 19 + Vite + TypeScript, plain CSS (`src/styles.css`), no router, no backend. Persistence is `localStorage` only. Weights are **kilograms throughout** — there is no unit conversion anywhere.

### State flow (the core of the app)

All app state lives in one `AppState` object (`src/types.ts`) driven through a single reducer. The layering is deliberate and worth preserving:

- **`src/reducer.ts`** — pure, framework-free. Holds every domain mutation (`Action` union) plus derived selectors like `getLastWeight`. This is where business logic goes and what the tests exercise directly. Keep it free of React imports.
- **`src/storage.ts`** — `load`/`save` against `localStorage`, plus seed data. Owns schema versioning and first-run seeding (see below).
- **`src/store.tsx`** — `GymProvider`: wires the reducer to storage via `useReducer(gymReducer, undefined, load)` and a `useEffect` that calls `save(state)` on every change.
- **`src/gymContext.ts`** — the `GymContext` object and `useGym()` hook. Components read/dispatch via `useGym()`.

`gymContext.ts` is split out from `store.tsx` on purpose: the `react-refresh/only-export-components` lint rule forbids exporting non-components (the context + hook) from a file that exports a component (`GymProvider`). Don't merge them back together.

`src/App.tsx` is the whole UI shell — a four-tab toggle (`today` / `routines` / `stretches` / `more`) held in local `useState`, no router. Components live in `src/components/`.

### Key domain invariants

- **`routines` array order *is* the round-robin rotation order.** `currentIndex` points at the routine that's "next up". `markRoutineDone` records a `Session` and advances `currentIndex` with wraparound (`(i + 1) % len`).
- Reducer cases that mutate the routines array (`deleteRoutine`, `moveRoutine`) must keep `currentIndex` pointing at the right routine — see how they clamp/follow the current routine. Preserve this when adding routine-list operations.
- **`draft`** is the in-progress log for the routine being done now, persisted so a mid-session reload at the gym doesn't lose entries. `markRoutineDone` turns the draft into a `Session` and clears it. An exercise is logged if it has a numeric weight entered, or if it was ticked done without one — in which case it's logged at its prefilled last weight (`getLastWeight`), counting as a repeat. Exercises that are neither weighed nor ticked (or ticked with no history to prefill) are not logged.
- An exercise's "last weight" is **derived** by scanning `sessions` newest-first (`getLastWeight`), never stored on the exercise.
- `Exercise.reps` is an optional configured target shown for reference only — it is never logged in a session.
- IDs are always `crypto.randomUUID()`.

### Persistence & seeding

- `STORAGE_KEY = 'gymbuddy:state'` holds the serialized `AppState`. `AppState.version` is the schema version; `load()` falls back to `defaultState()` on an unknown version. When you make a breaking shape change, bump `CURRENT_VERSION` and add migration logic in `load()`.
- A separate `SEED_KEY` / `SEED_VERSION` mechanism seeds demo routines on first run. **Bumping `SEED_VERSION` re-runs the seed and overwrites the user's saved state** — only do that intentionally.

## Project plan

The plan is the source of truth for scope and phasing. It lives in the private
[`danbaulk/docs`](https://github.com/danbaulk/docs) repo at `gymbuddy/PROJECT_PLAN.md` (clone it
alongside this one as `~/dev/docs`). Phases 1–3 are shipped: Phase 1 (core loop: routines, rotation, weight logging, persistence), Phase 2 (stagnation detection — "cycles since improved" per exercise, inline stale badges, derived from `Session` history) and Phase 3 (standalone stretch routines + tap-to-advance timer). Phase 4 (quality-of-life) is partly built — per-exercise history sparkline and JSON export/import (`importState`) are done; the remaining candidates (round-robin override, sets/notes, configurable stale threshold, stretch-timer audio/auto-advance, per-side stretches, linked warm-ups) are deferred. Accounts, cloud sync, hosting, and a real database are explicitly deferred to a future productionise pass.
