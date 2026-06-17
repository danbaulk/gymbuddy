import type { AppState, Draft, DraftEntry, Routine, Session, SessionEntry } from './types';

export type Action =
  | { type: 'addRoutine'; name: string }
  | { type: 'renameRoutine'; id: string; name: string }
  | { type: 'deleteRoutine'; id: string }
  | { type: 'moveRoutine'; id: string; dir: -1 | 1 }
  | { type: 'addExercise'; routineId: string; name: string; reps?: number }
  | { type: 'renameExercise'; routineId: string; exerciseId: string; name: string }
  | { type: 'setExerciseReps'; routineId: string; exerciseId: string; reps: number | undefined }
  | { type: 'removeExercise'; routineId: string; exerciseId: string }
  | { type: 'moveExercise'; routineId: string; exerciseId: string; dir: -1 | 1 }
  | { type: 'setDraftWeight'; routineId: string; exerciseId: string; weight: number | undefined }
  | { type: 'toggleDraftDone'; routineId: string; exerciseId: string }
  | { type: 'markRoutineDone'; routineId: string };

function uid(): string {
  return crypto.randomUUID();
}

function clampIndex(i: number, len: number): number {
  if (len <= 0) return 0;
  return Math.min(Math.max(0, i), len - 1);
}

/** Swap an item one slot in `dir`; returns null if the move would fall off an edge. */
function move<T extends { id: string }>(arr: T[], id: string, dir: -1 | 1): T[] | null {
  const i = arr.findIndex((x) => x.id === id);
  if (i === -1) return null;
  const j = i + dir;
  if (j < 0 || j >= arr.length) return null;
  const next = arr.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function updateRoutine(state: AppState, routineId: string, fn: (r: Routine) => Routine): AppState {
  return {
    ...state,
    routines: state.routines.map((r) => (r.id === routineId ? fn(r) : r)),
  };
}

/** Patch a single exercise's draft entry, creating the draft for this routine if needed. */
function withDraft(
  state: AppState,
  routineId: string,
  exerciseId: string,
  patch: Partial<DraftEntry>,
): AppState {
  const base: NonNullable<Draft> =
    state.draft && state.draft.routineId === routineId
      ? state.draft
      : { routineId, entries: {} };
  const entry: DraftEntry = { ...base.entries[exerciseId], ...patch };
  return {
    ...state,
    draft: { routineId, entries: { ...base.entries, [exerciseId]: entry } },
  };
}

export function gymReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'addRoutine': {
      const name = action.name.trim();
      if (!name) return state;
      const routine: Routine = { id: uid(), name, exercises: [] };
      return { ...state, routines: [...state.routines, routine] };
    }

    case 'renameRoutine': {
      // Allow empty while typing — the input is controlled directly off state.
      return {
        ...state,
        routines: state.routines.map((r) =>
          r.id === action.id ? { ...r, name: action.name } : r,
        ),
      };
    }

    case 'deleteRoutine': {
      const idx = state.routines.findIndex((r) => r.id === action.id);
      if (idx === -1) return state;
      const routines = state.routines.filter((r) => r.id !== action.id);
      // Keep the rotation pointer sensible after removal.
      let currentIndex = state.currentIndex;
      if (idx < currentIndex) currentIndex -= 1;
      currentIndex = clampIndex(currentIndex, routines.length);
      const draft = state.draft?.routineId === action.id ? null : state.draft;
      return { ...state, routines, currentIndex, draft };
    }

    case 'moveRoutine': {
      const routines = move(state.routines, action.id, action.dir);
      if (!routines) return state;
      // Keep the same routine "next up" regardless of reordering.
      const currentId = state.routines[state.currentIndex]?.id;
      const currentIndex = currentId
        ? clampIndex(
            routines.findIndex((r) => r.id === currentId),
            routines.length,
          )
        : state.currentIndex;
      return { ...state, routines, currentIndex };
    }

    case 'addExercise': {
      const name = action.name.trim();
      if (!name) return state;
      const exercise = { id: uid(), name, ...(action.reps !== undefined && { reps: action.reps }) };
      return updateRoutine(state, action.routineId, (r) => ({
        ...r,
        exercises: [...r.exercises, exercise],
      }));
    }

    case 'renameExercise': {
      return updateRoutine(state, action.routineId, (r) => ({
        ...r,
        exercises: r.exercises.map((e) =>
          e.id === action.exerciseId ? { ...e, name: action.name } : e,
        ),
      }));
    }

    case 'setExerciseReps': {
      return updateRoutine(state, action.routineId, (r) => ({
        ...r,
        exercises: r.exercises.map((e) =>
          e.id === action.exerciseId ? { ...e, reps: action.reps } : e,
        ),
      }));
    }

    case 'removeExercise': {
      return updateRoutine(state, action.routineId, (r) => ({
        ...r,
        exercises: r.exercises.filter((e) => e.id !== action.exerciseId),
      }));
    }

    case 'moveExercise': {
      return updateRoutine(state, action.routineId, (r) => {
        const exercises = move(r.exercises, action.exerciseId, action.dir);
        return exercises ? { ...r, exercises } : r;
      });
    }

    case 'setDraftWeight': {
      return withDraft(state, action.routineId, action.exerciseId, { weight: action.weight });
    }

    case 'toggleDraftDone': {
      const current =
        state.draft?.routineId === action.routineId
          ? (state.draft.entries[action.exerciseId]?.done ?? false)
          : false;
      return withDraft(state, action.routineId, action.exerciseId, { done: !current });
    }

    case 'markRoutineDone': {
      const routine = state.routines.find((r) => r.id === action.routineId);
      if (!routine) return state;
      const draftEntries = state.draft?.routineId === routine.id ? state.draft.entries : {};
      const entries: SessionEntry[] = routine.exercises
        .map((e): SessionEntry | null => {
          const draft = draftEntries[e.id];
          const weight = draft?.weight;
          if (typeof weight === 'number' && !Number.isNaN(weight)) {
            return { exerciseId: e.id, weight };
          }
          // Ticked off without a new weight → assume the prefilled last weight
          // (i.e. you repeated it). Skip if there's no history to prefill from.
          if (draft?.done) {
            const last = getLastWeight(state, routine.id, e.id);
            if (last !== undefined) return { exerciseId: e.id, weight: last };
          }
          return null;
        })
        .filter((e): e is SessionEntry => e !== null);
      const session: Session = {
        id: uid(),
        routineId: routine.id,
        date: new Date().toISOString(),
        entries,
      };
      const len = state.routines.length;
      const currentIndex = len > 0 ? (state.currentIndex + 1) % len : 0;
      return {
        ...state,
        sessions: [...state.sessions, session],
        currentIndex,
        draft: null,
      };
    }

    default:
      return state;
  }
}

/** Most recent logged weight for an exercise in a routine, or undefined if never logged. */
export function getLastWeight(
  state: AppState,
  routineId: string,
  exerciseId: string,
): number | undefined {
  for (let i = state.sessions.length - 1; i >= 0; i--) {
    const s = state.sessions[i];
    if (s.routineId !== routineId) continue;
    const entry = s.entries.find((e) => e.exerciseId === exerciseId);
    if (entry) return entry.weight;
  }
  return undefined;
}

/** Chronological logged weights for an exercise in its routine, oldest first. */
export function getWeightHistory(
  state: AppState,
  routineId: string,
  exerciseId: string,
): number[] {
  const out: number[] = [];
  for (const s of state.sessions) {
    if (s.routineId !== routineId) continue;
    const entry = s.entries.find((e) => e.exerciseId === exerciseId);
    if (entry) out.push(entry.weight);
  }
  return out;
}

/**
 * Cycles since this exercise's weight last strictly increased over the previous
 * logged session — the staleness count. Returns 0 when it improved last time or
 * there are fewer than two logged sessions to compare. Sessions where the
 * exercise has no weight (bodyweight / skipped) carry no signal and are ignored.
 */
export function getCyclesSinceImproved(
  state: AppState,
  routineId: string,
  exerciseId: string,
): number {
  const w = getWeightHistory(state, routineId, exerciseId);
  let count = 0;
  for (let i = w.length - 1; i >= 1; i--) {
    if (w[i] > w[i - 1]) break; // most recent improvement — stop counting
    count++;
  }
  return count;
}
