# GymBuddy — Plan

_Last updated: 2026-06-14 · Status: discovery_

## What this is
GymBuddy is a mobile-friendly web app you use at the gym to track your lifts and
see what needs work. You configure several workout routines (e.g. Push / Pull /
Legs), each with its own list of exercises. The app round-robins through the
routines and tells you which one is next. During a session you log the weight you
hit for each exercise on a simple checklist and mark the routine done, which
advances the rotation. Over time it flags exercises whose weight hasn't gone up,
showing how many cycles it's been since each last improved — so you can see what
to push on. It also has a standalone stretches section where you build stretch
routines (a stretch plus a duration per item) and run them as a guided,
tap-to-advance timer that shows the current stretch and what's next. It's
single-user and saves locally on the device, no login.

## Feature groups
- **Routine configuration** — create/edit/delete named routines; each routine holds
  an ordered list of exercises (name only); reorder routines to set the round-robin
  sequence.
- **Round-robin rotation** — track which routine is "next"; advance to the next
  routine when the current one is marked done.
- **Live logging** — per-session checklist of today's exercises; weight-only entry
  per exercise; show last weight for reference; mark routine complete.
- **Stagnation detection** — per-exercise weight history; compute "cycles since
  improved"; inline badge/flag on each exercise.
- **Stretch routines & timer** — create/edit/delete named stretch routines; each an
  ordered list of stretches with a per-stretch duration; a standalone Go screen that
  shows the current stretch, its countdown, and the next stretch, advancing on tap.
- **Persistence** — everything saved locally in the browser (no accounts).

## Phases

### Phase 1 — Core loop (simplest runnable slice)
**Goal:** Open the app, set up your routines, see which routine is next, log
weight-only for today's exercises on a checklist, and mark the routine done to
advance the rotation — all persisting locally between visits.
**Includes:**
- Configure routines: create / rename / delete routines; add / remove / reorder
  exercises within a routine (name only); reorder routines (this is the rotation
  order).
- "Next routine" view: shows the current routine in the rotation and its exercises
  as a checklist.
- Log weight per exercise (single numeric input), with the last logged weight shown
  for reference; tick exercises off as done.
- "Mark routine done" → records the session and advances the round-robin to the
  next routine.
- Local persistence in the browser (e.g. localStorage), so data survives reloads.
- Empty/first-run state that guides creating the first routine.
**Explicitly not yet:** stagnation / cycle counting, history views or charts,
reps/sets/notes, accounts or cross-device sync, overriding which routine is next.
**How we'll run & test it locally:** build it with the simplest tooling that works
— a single static HTML/JS page opened directly in a browser, or a minimal dev
server (e.g. `npm run dev` with Vite). Open on the laptop in a browser; resize to a
phone-width viewport to sanity-check the mobile layout. Manual test: create two
routines, log weights, mark done, confirm the "next routine" advances and data
persists across a reload.

### Phase 2 — Stagnation detection ("what to work on")
**Goal:** As you log, each exercise shows how many cycles it's been since its weight
last improved, and stale weights are visually flagged inline — so you can see at a
glance what to push on.
**Includes:**
- Persist per-exercise weight history across completed sessions (each completed
  routine adds a data point for its exercises).
- Compute "cycles since improved" per exercise: a cycle = each time that exercise's
  routine is completed; improved = weight strictly greater than the previous time.
- Inline badge on each exercise on the "next routine" checklist showing the count,
  with a visual flag when it crosses a "stale" threshold.
- After logging, indicate whether you beat your last weight.
**Explicitly not yet:** separate summary screen, charts, configurable thresholds.
**How we'll run & test it locally:** log a routine across several simulated cycles
(complete the routine repeatedly), verify the badge increments each cycle without
improvement and resets to zero when the weight goes up.

### Phase 3 — Stretch timer (standalone)
**Goal:** Define stretching routines and run one as a guided, tap-to-advance timer
that shows the current stretch, its countdown, and what's next.
**Includes:**
- Configure stretch routines: create / rename / delete named routines (e.g.
  Pre-workout, Cooldown, Mobility); each holds an ordered list of stretches, each
  with a name and a duration in seconds; add / remove / reorder stretches.
- A stretches section separate from workouts: pick a routine and press **Go**.
- Running screen: large current-stretch name + countdown of its duration, a preview
  of the next stretch, and a progress indicator (e.g. "3 of 8").
- Manual advance: the countdown runs down then holds; a prominent **Next** button
  moves to the next stretch (works whether or not the countdown has finished).
  Visual only — no sound or vibration.
- End-of-routine state after the last stretch; exit / restart.
- Persist stretch-routine definitions locally (same localStorage approach as
  workouts).
**Explicitly not yet:** audio/vibration cues, auto-advance / rest gaps, per-side
(left/right) stretches, linking stretches to workout routines, history of completed
stretch sessions.
**How we'll run & test it locally:** create a stretch routine with 2–3 short
stretches, press Go, confirm the current stretch + countdown + "next" preview show,
tap Next through to the end state, and confirm the routine persists across a reload.

### Phase 4 — Quality-of-life (nice-to-haves, order flexible)
**Goal:** Make it nicer to live with over time.
**Includes (candidates):**
- Per-exercise history view (list/sparkline of past weights).
- Override the round-robin: skip or pick a different routine for a given visit.
- Optional reps / sets / notes per exercise.
- Configurable "stale" threshold and/or a minimum increment to count as "improved".
- Audio / vibration cues and optional auto-advance (+ rest gaps) for the stretch timer.
- Per-side (left/right) stretches.
- Attach a stretch routine as a workout's warm-up/cooldown (the "linked" option
  deferred for now).
- Export / import data as JSON (manual backup).

## Deferred to productionise
- Accounts and **cross-device cloud sync** (use it on your phone at the gym while
  config lives elsewhere).
- **Hosting / deployment** so it's reachable on your phone away from the laptop;
  installable PWA / offline support.
- A real database instead of browser localStorage; backups.
- Hardening, error handling at scale, analytics.

## Open questions
- **Units:** kg vs lb — default to kg with a simple setting? (minor; build-time call)
- **Stale threshold:** how many cycles-without-improvement before an exercise is
  visually flagged in Phase 2 (e.g. 3)? (minor; build-time call)
- **Default stretch duration:** what duration to pre-fill when adding a stretch (e.g.
  30s)? (minor; build-time call)

## Decisions log
- 2026-06-14 — Routines are named days (Push/Pull/Legs-style), each containing an
  ordered exercise list. Round-robin operates at the routine level.
- 2026-06-14 — Rotation advances when the user marks the routine done (not by date),
  to tolerate skipped gym days.
- 2026-06-14 — In-routine UX is a checklist (log in any order), not one-exercise-at-
  a-time.
- 2026-06-14 — Log weight only (no reps/sets) for the first versions.
- 2026-06-14 — "Cycle" = each time you return to an exercise's routine; "improved" =
  any strict weight increase.
- 2026-06-14 — Stagnation shown as inline per-exercise badges; no separate summary
  screen.
- 2026-06-14 — Single-user, single-device, browser-local storage, no login.
- 2026-06-14 — Mobile-friendly web app; built with the simplest local-first tooling.
- 2026-06-14 — Stagnation detection deferred to Phase 2 (needs logged history first).
- 2026-06-14 — Added a standalone Stretches section: multiple named stretch routines,
  each an ordered list of stretches with per-stretch durations.
- 2026-06-14 — Stretch timer advances manually (tap Next); countdown is visual-only
  (no sound or vibration); no auto-advance.
- 2026-06-14 — Stretches are standalone, not linked to workout routines, for now.
- 2026-06-14 — Stretch timer placed as Phase 3; Quality-of-life becomes Phase 4; the
  stretch phase is independent of logging/stagnation, so its order is flexible.
