import { useState } from 'react';
import type { StretchRoutine } from '../types';
import { useGym } from '../gymContext';

const DEFAULT_DURATION = '30';

export default function StretchRoutineEditor({
  routine,
  onBack,
}: {
  routine: StretchRoutine;
  onBack: () => void;
}) {
  const { dispatch } = useGym();
  const [newName, setNewName] = useState('');
  const [newDuration, setNewDuration] = useState(DEFAULT_DURATION);

  const addStretch = () => {
    const name = newName.trim();
    if (!name) return;
    const duration = newDuration === '' ? 30 : Number(newDuration);
    dispatch({ type: 'addStretch', routineId: routine.id, name, duration });
    setNewName('');
    setNewDuration(DEFAULT_DURATION);
  };

  return (
    <section>
      <button className="link" onClick={onBack}>
        ‹ Back
      </button>

      <header>
        <input
          className="title-input"
          aria-label="Stretch routine name"
          value={routine.name}
          onChange={(e) =>
            dispatch({ type: 'renameStretchRoutine', id: routine.id, name: e.target.value })
          }
        />
      </header>

      <form
        className="add-row"
        onSubmit={(e) => {
          e.preventDefault();
          addStretch();
        }}
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New stretch name"
        />
        <input
          className="dur-input"
          type="number"
          inputMode="numeric"
          min="1"
          aria-label="Duration in seconds"
          placeholder="secs"
          value={newDuration}
          onChange={(e) => setNewDuration(e.target.value)}
        />
        <button type="submit" className="primary">
          Add
        </button>
      </form>

      {routine.stretches.length === 0 ? (
        <p className="muted">No stretches yet. Add one above.</p>
      ) : (
        <ul className="list">
          {routine.stretches.map((s, i) => (
            <li key={s.id} className="list-row">
              <div className="reorder">
                <button
                  aria-label="Move up"
                  disabled={i === 0}
                  onClick={() =>
                    dispatch({
                      type: 'moveStretch',
                      routineId: routine.id,
                      stretchId: s.id,
                      dir: -1,
                    })
                  }
                >
                  ↑
                </button>
                <button
                  aria-label="Move down"
                  disabled={i === routine.stretches.length - 1}
                  onClick={() =>
                    dispatch({
                      type: 'moveStretch',
                      routineId: routine.id,
                      stretchId: s.id,
                      dir: 1,
                    })
                  }
                >
                  ↓
                </button>
              </div>

              <input
                className="list-main edit"
                aria-label="Stretch name"
                value={s.name}
                onChange={(e) =>
                  dispatch({
                    type: 'renameStretch',
                    routineId: routine.id,
                    stretchId: s.id,
                    name: e.target.value,
                  })
                }
              />

              <div className="dur">
                <input
                  className="dur-input"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  aria-label="Duration in seconds"
                  value={s.duration}
                  onChange={(e) =>
                    dispatch({
                      type: 'setStretchDuration',
                      routineId: routine.id,
                      stretchId: s.id,
                      duration: Number(e.target.value || 0),
                    })
                  }
                />
                <span className="unit">s</span>
              </div>

              <button
                className="danger ghost"
                aria-label={`Remove ${s.name}`}
                onClick={() =>
                  dispatch({
                    type: 'removeStretch',
                    routineId: routine.id,
                    stretchId: s.id,
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
