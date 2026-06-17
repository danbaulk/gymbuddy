import { useState } from 'react';
import { useGym } from '../gymContext';
import RoutineEditor from './RoutineEditor';

export default function Routines() {
  const { state, dispatch } = useGym();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  if (editingId) {
    const routine = state.routines.find((r) => r.id === editingId);
    if (routine) {
      return <RoutineEditor routine={routine} onBack={() => setEditingId(null)} />;
    }
    // Routine vanished (e.g. deleted elsewhere) — fall back to the list.
    setEditingId(null);
  }

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    dispatch({ type: 'addRoutine', name });
    setNewName('');
  };

  return (
    <section>
      <header>
        <h1>Routines</h1>
        <p className="muted small">Order sets the rotation.</p>
      </header>

      <form
        className="add-row"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New routine name"
        />
        <button type="submit" className="primary">
          Add
        </button>
      </form>

      {state.routines.length === 0 ? (
        <p className="muted">No routines yet. Add one above.</p>
      ) : (
        <ul className="list">
          {state.routines.map((r, i) => (
            <li key={r.id} className="list-row">
              <div className="reorder">
                <button
                  aria-label="Move up"
                  disabled={i === 0}
                  onClick={() => dispatch({ type: 'moveRoutine', id: r.id, dir: -1 })}
                >
                  ↑
                </button>
                <button
                  aria-label="Move down"
                  disabled={i === state.routines.length - 1}
                  onClick={() => dispatch({ type: 'moveRoutine', id: r.id, dir: 1 })}
                >
                  ↓
                </button>
              </div>

              <button className="list-main" onClick={() => setEditingId(r.id)}>
                <span className="ex-name">
                  {r.name}
                  {i === state.currentIndex ? <span className="badge">next</span> : null}
                </span>
                <span className="muted small">
                  {r.exercises.length} exercise{r.exercises.length === 1 ? '' : 's'}
                </span>
              </button>

              <button
                className="danger ghost"
                aria-label={`Delete ${r.name}`}
                onClick={() => {
                  if (confirm(`Delete "${r.name}"? This can't be undone.`)) {
                    dispatch({ type: 'deleteRoutine', id: r.id });
                  }
                }}
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
