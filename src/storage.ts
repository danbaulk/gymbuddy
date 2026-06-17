import type {
  AppState,
  Exercise,
  Routine,
  Session,
  SessionEntry,
  Stretch,
  StretchRoutine,
} from './types';

const STORAGE_KEY = 'gymbuddy:state';
const CURRENT_VERSION = 1 as const;

// Bumping SEED_VERSION re-runs the one-time seed below (replacing saved data once).
const SEED_KEY = 'gymbuddy:seedVersion';
const SEED_VERSION = 2 as const;

export function defaultState(): AppState {
  return {
    version: CURRENT_VERSION,
    routines: [],
    currentIndex: 0,
    sessions: [],
    draft: null,
    stretchRoutines: [],
  };
}

function clampIndex(i: number, len: number): number {
  if (len <= 0) return 0;
  return Math.min(Math.max(0, Math.trunc(i) || 0), len - 1);
}

/** Read persisted state. On first run (or a new SEED_VERSION) replace it with the seed. */
export function load(): AppState {
  try {
    if (localStorage.getItem(SEED_KEY) !== String(SEED_VERSION)) {
      const seeded = seedState();
      save(seeded);
      localStorage.setItem(SEED_KEY, String(SEED_VERSION));
      return seeded;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    // No migrations exist yet; an unknown version means we can't trust the shape.
    if (parsed.version !== CURRENT_VERSION || !Array.isArray(parsed.routines)) {
      return defaultState();
    }
    const merged: AppState = { ...defaultState(), ...parsed, version: CURRENT_VERSION };
    merged.currentIndex = clampIndex(merged.currentIndex, merged.routines.length);
    return merged;
  } catch {
    return defaultState();
  }
}

export function save(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable or full — acceptable to drop for a local-only prototype.
  }
}

// --- Seed data ----------------------------------------------------------------

type SeedExercise = { name: string; reps?: number; weight?: number };
type SeedRoutine = { name: string; exercises: SeedExercise[] };

// Array order is the round-robin rotation order. `weight`, where present, seeds a
// starting logged session so it shows as the exercise's "last" weight.
const SEED_ROUTINES: SeedRoutine[] = [
  {
    name: 'Push 1',
    exercises: [
      { name: 'Overhead Press', reps: 6, weight: 45 },
      { name: 'Bench Press', reps: 8, weight: 60 },
      { name: 'Cable Lateral Raises', reps: 12, weight: 5 },
      { name: 'Overhead Tricep Extensions', reps: 10, weight: 9 },
      { name: 'Hanging Leg Raises', reps: 10 },
    ],
  },
  {
    name: 'Push 2',
    exercises: [
      { name: 'Incline Bench', reps: 6 },
      { name: 'Dips', reps: 8 },
      { name: 'Cable Flyes', reps: 12 },
      { name: 'Tricep Pushdowns', reps: 10 },
      { name: 'Cable Crunches', reps: 12 },
    ],
  },
  {
    name: 'Pull 1',
    exercises: [
      { name: 'Lat Pull Down', reps: 8 },
      { name: 'Facepulls', reps: 15 },
      { name: 'Bayesian Cable Curls', reps: 10 },
      { name: 'Hammer Curls', reps: 10 },
      { name: 'Palloff Press', reps: 12 },
    ],
  },
  {
    name: 'Pull 2',
    exercises: [
      { name: 'Chest Supported Rows', reps: 8 },
      { name: 'Pull Ups', reps: 8 },
      { name: 'Dumbbell Shrugs', reps: 10 },
      { name: 'Preacher/Machine Curls', reps: 10 },
      { name: 'Ab Wheel Rollouts', reps: 8 },
    ],
  },
  {
    name: 'Legs 1',
    exercises: [
      { name: 'Back Squat', reps: 6 },
      { name: 'Leg Extensions', reps: 12 },
      { name: 'Adductor Machine', reps: 12 },
      { name: 'Standing Calf Raises', reps: 12 },
      { name: 'Side Plank with Hip Dips', reps: 10 },
    ],
  },
  {
    name: 'Legs 2',
    exercises: [
      { name: 'Romanian Deadlift', reps: 6, weight: 50 },
      { name: 'Bulgarian Split Squats', reps: 8, weight: 30 },
      { name: 'Leg Curls', reps: 10, weight: 27 },
      { name: 'Seated Calf Raises', reps: 12, weight: 100 },
      { name: 'Machine Crunch', reps: 12, weight: 27 },
    ],
  },
];

type SeedStretch = { name: string; duration: number };
type SeedStretchRoutine = { name: string; stretches: SeedStretch[] };

// One demo stretch routine so a fresh install has something runnable.
const SEED_STRETCH_ROUTINES: SeedStretchRoutine[] = [
  {
    name: 'Mobility',
    stretches: [
      { name: 'Thunder Clap Circles', duration: 30 },
      { name: 'Hip Swivels', duration: 30 },
      { name: 'Side Stretch', duration: 30 },
      { name: 'Calf Stretches', duration: 30 },
      { name: 'Elephant Walks', duration: 30 },
      { name: 'Squats & Pikes', duration: 30 },
      { name: 'Cosack Squats', duration: 30 },
      { name: 'Deep Lunges', duration: 30 },
      { name: 'Pancake Stretch', duration: 30 },
      { name: 'Figure 4 Stretch', duration: 30 },
      { name: 'Open Book Stretch', duration: 30 },
      { name: 'Child Pose', duration: 30 },
      { name: 'Cobras', duration: 30 },
      { name: 'Neck Stretch & Massage Gun', duration: 30 },
    ],
  },
];

export function seedState(): AppState {
  const now = new Date().toISOString();
  const routines: Routine[] = [];
  const sessions: Session[] = [];

  for (const sr of SEED_ROUTINES) {
    const routineId = crypto.randomUUID();
    const exercises: Exercise[] = sr.exercises.map((se) => ({
      id: crypto.randomUUID(),
      name: se.name,
      ...(se.reps !== undefined && { reps: se.reps }),
    }));
    routines.push({ id: routineId, name: sr.name, exercises });

    const entries: SessionEntry[] = sr.exercises
      .map((se, i): SessionEntry | null =>
        se.weight !== undefined ? { exerciseId: exercises[i].id, weight: se.weight } : null,
      )
      .filter((e): e is SessionEntry => e !== null);
    if (entries.length > 0) {
      sessions.push({ id: crypto.randomUUID(), routineId, date: now, entries });
    }
  }

  const stretchRoutines: StretchRoutine[] = SEED_STRETCH_ROUTINES.map((sr) => ({
    id: crypto.randomUUID(),
    name: sr.name,
    stretches: sr.stretches.map(
      (ss): Stretch => ({ id: crypto.randomUUID(), name: ss.name, duration: ss.duration }),
    ),
  }));

  return {
    version: CURRENT_VERSION,
    routines,
    currentIndex: 0,
    sessions,
    draft: null,
    stretchRoutines,
  };
}
