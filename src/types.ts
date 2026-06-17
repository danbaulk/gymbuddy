// Domain model for GymBuddy. Weights are always in kilograms (Phase 1).

export type Exercise = {
  id: string;
  name: string;
  reps?: number; // configured target rep count (reference only — not logged)
};

export type Routine = {
  id: string;
  name: string;
  exercises: Exercise[];
};

export type SessionEntry = {
  exerciseId: string;
  weight: number; // kg
};

/** A completed routine session — the source of each exercise's "last weight". */
export type Session = {
  id: string;
  routineId: string;
  date: string; // ISO timestamp
  entries: SessionEntry[];
};

export type DraftEntry = {
  weight?: number;
  done?: boolean;
};

export type Stretch = {
  id: string;
  name: string;
  duration: number; // seconds
};

/** A named stretch routine; its `stretches` array order is the run order. */
export type StretchRoutine = {
  id: string;
  name: string;
  stretches: Stretch[];
};

/**
 * The in-progress log for the routine currently being done. Persisted so a
 * mid-session reload at the gym doesn't lose what's been logged so far.
 */
export type Draft = {
  routineId: string;
  entries: Record<string, DraftEntry>; // keyed by exerciseId
} | null;

export type AppState = {
  version: 1; // schema version — bump + migrate in storage.ts on breaking changes
  routines: Routine[]; // array order == round-robin rotation order
  currentIndex: number; // index into routines = the routine that's "next up"
  sessions: Session[]; // completed sessions, in chronological order
  draft: Draft;
  stretchRoutines: StretchRoutine[]; // standalone stretch routines (no rotation)
};
