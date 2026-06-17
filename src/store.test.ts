import { describe, it, expect } from 'vitest';
import { gymReducer, getLastWeight, getWeightHistory, getCyclesSinceImproved } from './reducer';
import type { Action } from './reducer';
import { defaultState, seedState } from './storage';
import type { AppState } from './types';

/** Apply a sequence of actions to a starting state. */
function run(state: AppState, ...actions: Action[]): AppState {
  return actions.reduce(gymReducer, state);
}

/** Build a state with two routines (Push, Pull), each with one exercise. */
function twoRoutines(): AppState {
  const s = run(
    defaultState(),
    { type: 'addRoutine', name: 'Push' },
    { type: 'addRoutine', name: 'Pull' },
  );
  const push = s.routines[0].id;
  const pull = s.routines[1].id;
  return run(
    s,
    { type: 'addExercise', routineId: push, name: 'Bench' },
    { type: 'addExercise', routineId: pull, name: 'Row' },
  );
}

describe('routine CRUD', () => {
  it('adds routines and ignores blank names', () => {
    const s = run(
      defaultState(),
      { type: 'addRoutine', name: 'Legs' },
      { type: 'addRoutine', name: '   ' },
    );
    expect(s.routines.map((r) => r.name)).toEqual(['Legs']);
  });

  it('renames and deletes routines', () => {
    let s = twoRoutines();
    const pushId = s.routines[0].id;
    s = run(s, { type: 'renameRoutine', id: pushId, name: 'Chest' });
    expect(s.routines[0].name).toBe('Chest');
    s = run(s, { type: 'deleteRoutine', id: pushId });
    expect(s.routines.map((r) => r.name)).toEqual(['Pull']);
  });

  it('reorders routines while keeping the same routine "next up"', () => {
    let s = twoRoutines(); // currentIndex 0 -> Push
    s = run(s, { type: 'moveRoutine', id: s.routines[1].id, dir: -1 }); // Pull up
    expect(s.routines.map((r) => r.name)).toEqual(['Pull', 'Push']);
    // Push was next; it moved to index 1, so the pointer should follow it.
    expect(s.routines[s.currentIndex].name).toBe('Push');
  });
});

describe('exercise CRUD', () => {
  it('adds, renames, removes and reorders exercises', () => {
    let s = run(defaultState(), { type: 'addRoutine', name: 'Push' });
    const rid = s.routines[0].id;
    s = run(
      s,
      { type: 'addExercise', routineId: rid, name: 'Bench' },
      { type: 'addExercise', routineId: rid, name: 'Dips' },
    );
    expect(s.routines[0].exercises.map((e) => e.name)).toEqual(['Bench', 'Dips']);

    const benchId = s.routines[0].exercises[0].id;
    s = run(s, { type: 'renameExercise', routineId: rid, exerciseId: benchId, name: 'Incline' });
    expect(s.routines[0].exercises[0].name).toBe('Incline');

    s = run(s, { type: 'moveExercise', routineId: rid, exerciseId: benchId, dir: 1 });
    expect(s.routines[0].exercises.map((e) => e.name)).toEqual(['Dips', 'Incline']);

    s = run(s, { type: 'removeExercise', routineId: rid, exerciseId: benchId });
    expect(s.routines[0].exercises.map((e) => e.name)).toEqual(['Dips']);
  });
});

describe('logging and rotation', () => {
  it('records a session, advances the rotation with wraparound, and clears the draft', () => {
    let s = twoRoutines();
    const pushId = s.routines[0].id;
    const benchId = s.routines[0].exercises[0].id;

    s = run(s, { type: 'setDraftWeight', routineId: pushId, exerciseId: benchId, weight: 60 });
    expect(s.draft?.entries[benchId].weight).toBe(60);

    s = run(s, { type: 'markRoutineDone', routineId: pushId });
    expect(s.sessions).toHaveLength(1);
    expect(s.sessions[0].entries).toEqual([{ exerciseId: benchId, weight: 60 }]);
    expect(s.currentIndex).toBe(1); // advanced Push -> Pull
    expect(s.draft).toBeNull();

    // Completing Pull wraps the rotation back to Push (index 0).
    s = run(s, { type: 'markRoutineDone', routineId: s.routines[1].id });
    expect(s.currentIndex).toBe(0);
  });

  it('only logs exercises with a weight entered or ticked off', () => {
    let s = run(defaultState(), { type: 'addRoutine', name: 'Push' });
    const rid = s.routines[0].id;
    s = run(
      s,
      { type: 'addExercise', routineId: rid, name: 'Bench' },
      { type: 'addExercise', routineId: rid, name: 'Dips' },
    );
    const benchId = s.routines[0].exercises[0].id;
    s = run(
      s,
      { type: 'setDraftWeight', routineId: rid, exerciseId: benchId, weight: 40 },
      { type: 'markRoutineDone', routineId: rid },
    );
    // Dips was neither weighed nor ticked, so it isn't logged.
    expect(s.sessions[0].entries).toEqual([{ exerciseId: benchId, weight: 40 }]);
  });

  it('assumes the prefilled last weight when an exercise is ticked off blank', () => {
    let s = twoRoutines();
    const pushId = s.routines[0].id;
    const benchId = s.routines[0].exercises[0].id;
    const pullId = s.routines[1].id;

    // Baseline of 60 kg, then cycle back to Push.
    s = run(
      s,
      { type: 'setDraftWeight', routineId: pushId, exerciseId: benchId, weight: 60 },
      { type: 'markRoutineDone', routineId: pushId },
      { type: 'markRoutineDone', routineId: pullId },
    );
    expect(getLastWeight(s, pushId, benchId)).toBe(60);

    // This time enter nothing, just tick Bench off → repeats 60 kg.
    s = run(
      s,
      { type: 'toggleDraftDone', routineId: pushId, exerciseId: benchId },
      { type: 'markRoutineDone', routineId: pushId },
    );
    const last = s.sessions[s.sessions.length - 1];
    expect(last.entries).toEqual([{ exerciseId: benchId, weight: 60 }]);
    // A repeat at the same weight counts as a stale cycle.
    expect(getCyclesSinceImproved(s, pushId, benchId)).toBe(1);
  });

  it('does not invent a weight for a ticked-off exercise with no history', () => {
    let s = run(defaultState(), { type: 'addRoutine', name: 'Core' });
    const rid = s.routines[0].id;
    s = run(s, { type: 'addExercise', routineId: rid, name: 'Hanging Leg Raises' });
    const exId = s.routines[0].exercises[0].id;
    s = run(
      s,
      { type: 'toggleDraftDone', routineId: rid, exerciseId: exId },
      { type: 'markRoutineDone', routineId: rid },
    );
    expect(s.sessions[0].entries).toEqual([]);
  });
});

describe('deleting the current routine keeps the rotation valid', () => {
  it('clamps currentIndex when the last routine (which is next) is deleted', () => {
    let s = twoRoutines();
    // Advance so Pull (index 1) is next.
    s = run(s, { type: 'markRoutineDone', routineId: s.routines[0].id });
    expect(s.currentIndex).toBe(1);
    // Delete Pull — currentIndex must not point past the end.
    s = run(s, { type: 'deleteRoutine', id: s.routines[1].id });
    expect(s.routines).toHaveLength(1);
    expect(s.currentIndex).toBe(0);
    expect(s.routines[s.currentIndex]).toBeDefined();
  });
});

describe('exercise reps', () => {
  it('stores reps on add and updates them via setExerciseReps', () => {
    let s = run(defaultState(), { type: 'addRoutine', name: 'Push' });
    const rid = s.routines[0].id;
    s = run(s, { type: 'addExercise', routineId: rid, name: 'Bench', reps: 8 });
    expect(s.routines[0].exercises[0].reps).toBe(8);

    const exId = s.routines[0].exercises[0].id;
    s = run(s, { type: 'setExerciseReps', routineId: rid, exerciseId: exId, reps: 6 });
    expect(s.routines[0].exercises[0].reps).toBe(6);

    s = run(s, { type: 'setExerciseReps', routineId: rid, exerciseId: exId, reps: undefined });
    expect(s.routines[0].exercises[0].reps).toBeUndefined();
  });

  it('treats reps as optional when adding', () => {
    let s = run(defaultState(), { type: 'addRoutine', name: 'Push' });
    const rid = s.routines[0].id;
    s = run(s, { type: 'addExercise', routineId: rid, name: 'Dips' });
    expect(s.routines[0].exercises[0].reps).toBeUndefined();
  });
});

describe('seedState', () => {
  it('builds the six routines in rotation order with reps and seeded weights', () => {
    const s = seedState();
    expect(s.routines.map((r) => r.name)).toEqual([
      'Push 1',
      'Push 2',
      'Pull 1',
      'Pull 2',
      'Legs 1',
      'Legs 2',
    ]);
    expect(s.currentIndex).toBe(0);

    const push1 = s.routines[0];
    expect(push1.exercises).toHaveLength(5);
    const ohp = push1.exercises[0];
    expect(ohp.name).toBe('Overhead Press');
    expect(ohp.reps).toBe(6);
    expect(getLastWeight(s, push1.id, ohp.id)).toBe(45);

    // A bodyweight seed exercise keeps its reps but has no logged weight.
    const hlr = push1.exercises[4];
    expect(hlr.name).toBe('Hanging Leg Raises');
    expect(getLastWeight(s, push1.id, hlr.id)).toBeUndefined();

    // Only Push 1 and Legs 2 carry weights → exactly two seeded sessions.
    expect(s.sessions).toHaveLength(2);

    const legs2 = s.routines[5];
    const rdl = legs2.exercises[0];
    expect(rdl.name).toBe('Romanian Deadlift');
    expect(getLastWeight(s, legs2.id, rdl.id)).toBe(50);
  });
});

describe('stagnation detection', () => {
  /**
   * Complete one full Push→Pull rotation, logging `weight` for Push's Bench
   * (omit to leave it bodyweight/blank). Routine + exercise ids stay stable
   * across cycles, so callers can chain this to simulate repeated sessions.
   */
  function cyclePushBench(s: AppState, weight: number | undefined): AppState {
    const pushId = s.routines[0].id;
    const benchId = s.routines[0].exercises[0].id;
    const pullId = s.routines[1].id;
    const actions: Action[] = [];
    if (weight !== undefined) {
      actions.push({ type: 'setDraftWeight', routineId: pushId, exerciseId: benchId, weight });
    }
    actions.push({ type: 'markRoutineDone', routineId: pushId });
    actions.push({ type: 'markRoutineDone', routineId: pullId });
    return run(s, ...actions);
  }

  it('reports 0 cycles with no history or a single logged session', () => {
    let s = twoRoutines();
    const pushId = s.routines[0].id;
    const benchId = s.routines[0].exercises[0].id;

    expect(getCyclesSinceImproved(s, pushId, benchId)).toBe(0);

    s = cyclePushBench(s, 60);
    expect(getCyclesSinceImproved(s, pushId, benchId)).toBe(0); // only one data point
  });

  it('counts flat sessions and resets when the weight improves', () => {
    let s = twoRoutines();
    const pushId = s.routines[0].id;
    const benchId = s.routines[0].exercises[0].id;

    s = cyclePushBench(s, 60);
    s = cyclePushBench(s, 60); // flat
    expect(getCyclesSinceImproved(s, pushId, benchId)).toBe(1);

    s = cyclePushBench(s, 60); // flat again
    expect(getCyclesSinceImproved(s, pushId, benchId)).toBe(2);

    s = cyclePushBench(s, 65); // improved → reset
    expect(getCyclesSinceImproved(s, pushId, benchId)).toBe(0);
  });

  it('treats a weight decrease as not improved', () => {
    let s = twoRoutines();
    const pushId = s.routines[0].id;
    const benchId = s.routines[0].exercises[0].id;

    s = cyclePushBench(s, 60);
    s = cyclePushBench(s, 65); // improved
    s = cyclePushBench(s, 62); // below previous → not improved
    expect(getCyclesSinceImproved(s, pushId, benchId)).toBe(1);
  });

  it('ignores sessions where the exercise had no weight logged', () => {
    let s = twoRoutines();
    const pushId = s.routines[0].id;
    const benchId = s.routines[0].exercises[0].id;

    s = cyclePushBench(s, 60);
    s = cyclePushBench(s, 60); // flat → 1
    s = cyclePushBench(s, undefined); // bodyweight: no data point, carries no signal

    expect(getWeightHistory(s, pushId, benchId)).toEqual([60, 60]);
    expect(getCyclesSinceImproved(s, pushId, benchId)).toBe(1);
  });

  it('only considers sessions for the matching routine', () => {
    let s = twoRoutines();
    const pushId = s.routines[0].id;
    const benchId = s.routines[0].exercises[0].id;
    const pullId = s.routines[1].id;
    const rowId = s.routines[1].exercises[0].id;

    s = run(
      s,
      // Cycle 1: Bench 60, Row 40.
      { type: 'setDraftWeight', routineId: pushId, exerciseId: benchId, weight: 60 },
      { type: 'markRoutineDone', routineId: pushId },
      { type: 'setDraftWeight', routineId: pullId, exerciseId: rowId, weight: 40 },
      { type: 'markRoutineDone', routineId: pullId },
      // Cycle 2: Bench left bodyweight, Row 40 (flat).
      { type: 'markRoutineDone', routineId: pushId },
      { type: 'setDraftWeight', routineId: pullId, exerciseId: rowId, weight: 40 },
      { type: 'markRoutineDone', routineId: pullId },
    );

    // Row stalled (40, 40) but that must not leak into Bench's single data point.
    expect(getCyclesSinceImproved(s, pushId, benchId)).toBe(0);
    expect(getCyclesSinceImproved(s, pullId, rowId)).toBe(1);
  });
});

describe('getLastWeight', () => {
  it('returns the most recent logged weight for an exercise', () => {
    let s = twoRoutines();
    const pushId = s.routines[0].id;
    const benchId = s.routines[0].exercises[0].id;

    expect(getLastWeight(s, pushId, benchId)).toBeUndefined();

    // Cycle 1: 60kg on Push, then complete Pull to get back to Push.
    s = run(
      s,
      { type: 'setDraftWeight', routineId: pushId, exerciseId: benchId, weight: 60 },
      { type: 'markRoutineDone', routineId: pushId },
      { type: 'markRoutineDone', routineId: s.routines[1].id },
    );
    expect(getLastWeight(s, pushId, benchId)).toBe(60);

    // Cycle 2: 65kg — getLastWeight should reflect the newer session.
    s = run(
      s,
      { type: 'setDraftWeight', routineId: pushId, exerciseId: benchId, weight: 65 },
      { type: 'markRoutineDone', routineId: pushId },
    );
    expect(getLastWeight(s, pushId, benchId)).toBe(65);
  });
});
