# GymBuddy

A mobile-friendly web app for tracking your lifts at the gym. You set up several
workout routines (e.g. Push / Pull / Legs), each with its own ordered list of
exercises. GymBuddy round-robins through the routines and tells you which one is
next. During a session you log the weight you hit for each exercise on a simple
checklist and mark the routine done, which advances the rotation. Your last
weight for each exercise is always shown for reference.

Single-user, no login. Everything saves locally in the browser — no accounts, no
server.

## Status

Phase 1 (core loop) is complete: configure routines, see what's next, log
weight-only on a checklist, and mark routines done to advance the rotation, all
persisting across reloads. See [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md) for
the full roadmap (next up: stagnation detection, then a stretch-routine timer).

## Getting started

```bash
npm install
npm run dev      # start the Vite dev server
```

Open the printed URL in a browser. Resize to a phone-width viewport to check the
mobile layout. On first run the app seeds a set of demo routines so there's
something to try immediately.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint over the repo |
| `npm test` | Run the test suite once (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

## Tech stack

React 19 · TypeScript · Vite · plain CSS · `localStorage` for persistence.

State lives in a single reducer (`src/reducer.ts`) wired to `localStorage`
through a context provider; the reducer is pure and framework-free, and is what
the tests exercise. See [`CLAUDE.md`](CLAUDE.md) for an architecture overview.
