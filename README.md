# GymBuddy

A mobile-friendly web app for tracking your lifts at the gym. You set up several
workout routines (e.g. Push / Pull / Legs), each with its own ordered list of
exercises. GymBuddy round-robins through the routines and tells you which one is
next. During a session you log the weight you hit for each exercise on a simple
checklist and mark the routine done, which advances the rotation. Your last
weight for each exercise is always shown for reference, and exercises whose
weight hasn't gone up are flagged inline with how many cycles it's been since
they last improved. There's also a standalone stretches section: build stretch
routines and run one as a guided, tap-to-advance timer.

Single-user, no login. Everything saves locally in the browser — no accounts, no
server.

## Status

Phases 1–3 are shipped: the core loop (configure routines, see what's next, log
weight-only on a checklist, mark routines done to advance the rotation, all
persisting across reloads), stagnation detection (inline "cycles since improved"
stale badges), and the standalone stretch-routine timer. Phase 4
(quality-of-life) is partly done — per-exercise history sparkline and JSON
export/import are in; the rest is deferred. See
`gymbuddy/PROJECT_PLAN.md` in the private `danbaulk/docs` repo for the full roadmap.

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
