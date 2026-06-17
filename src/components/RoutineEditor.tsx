import { useState } from 'react';
import type { Routine } from '../types';
import { useGym } from '../gymContext';

export default function RoutineEditor({
  routine,
  onBack,
}: {
  routine: Routine;
  onBack: () => void;
}) {
  const { dispatch } = useGym();
  const [newName, setNewName] = useState('');
  const [newReps, setNewReps] = useState('');

  const addExercise = () => {
    const name = newName.trim();
    if (!name) return;
    const reps = newReps === '' ? undefined : Number(newReps);
    dispatch({ type: 'addExercise', routineId: routine.id, name, reps });
    setNewName('');
    setNewReps('');
  };

  return (
    <section>
      <button className="link" onClick={onBack}>
        ‹ Back
      </button>

      <header>
        <input
          className="title-input"
          aria-label="Routine name"
          value={routine.name}
          onChange={(e) =>
            dispatch({ type: 'renameRoutine', id: routine.id, name: e.target.value })
          }
        />
      </header>

      <form
        className="add-row"
        onSubmit={(e) => {
          e.preventDefault();
          addExercise();
        }}
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New exercise name"
        />
        <input
          className="reps-input"
          type="number"
          inputMode="numeric"
          min="0"
          aria-label="Reps"
          placeholder="reps"
          value={newReps}
          onChange={(e) => setNewReps(e.target.value)}
        />
        <button type="submit" className="primary">
          Add
        </button>
      </form>

      {routine.exercises.length === 0 ? (
        <p className="muted">No exercises yet. Add one above.</p>
      ) : (
        <ul className="list">
          {routine.exercises.map((ex, i) => (
            <li key={ex.id} className="list-row">
              <div className="reorder">
                <button
                  aria-label="Move up"
                  disabled={i === 0}
                  onClick={() =>
                    dispatch({
                      type: 'moveExercise',
                      routineId: routine.id,
                      exerciseId: ex.id,
                      dir: -1,
                    })
                  }
                >
                  ↑
                </button>
                <button
                  aria-label="Move down"
                  disabled={i === routine.exercises.length - 1}
                  onClick={() =>
                    dispatch({
                      type: 'moveExercise',
                      routineId: routine.id,
                      exerciseId: ex.id,
                      dir: 1,
                    })
                  }
                >
                  ↓
                </button>
              </div>

              <input
                className="list-main edit"
                aria-label="Exercise name"
                value={ex.name}
                onChange={(e) =>
                  dispatch({
                    type: 'renameExercise',
                    routineId: routine.id,
                    exerciseId: ex.id,
                    name: e.target.value,
                  })
                }
              />

              <input
                className="reps-input"
                type="number"
                inputMode="numeric"
                min="0"
                aria-label="Reps"
                placeholder="reps"
                value={ex.reps ?? ''}
                onChange={(e) =>
                  dispatch({
                    type: 'setExerciseReps',
                    routineId: routine.id,
                    exerciseId: ex.id,
                    reps: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />

              <button
                className="danger ghost"
                aria-label={`Remove ${ex.name}`}
                onClick={() =>
                  dispatch({
                    type: 'removeExercise',
                    routineId: routine.id,
                    exerciseId: ex.id,
                  })
                }
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
