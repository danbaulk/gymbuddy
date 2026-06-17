import { useState } from 'react';
import { useGym } from '../gymContext';
import StretchRoutineEditor from './StretchRoutineEditor';
import StretchRunner from './StretchRunner';

export default function Stretches() {
  const { state, dispatch } = useGym();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  if (runningId) {
    const routine = state.stretchRoutines.find((r) => r.id === runningId);
    if (routine && routine.stretches.length > 0) {
      return <StretchRunner routine={routine} onExit={() => setRunningId(null)} />;
    }
    // Routine vanished or emptied — fall back to the list.
    setRunningId(null);
  }

  if (editingId) {
    const routine = state.stretchRoutines.find((r) => r.id === editingId);
    if (routine) {
      return <StretchRoutineEditor routine={routine} onBack={() => setEditingId(null)} />;
    }
    setEditingId(null);
  }

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    dispatch({ type: 'addStretchRoutine', name });
    setNewName('');
  };

  return (
    <section>
      <header>
        <h1>Stretches</h1>
        <p className="muted small">Build a routine, then press Go for a guided timer.</p>
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
          placeholder="New stretch routine name"
        />
        <button type="submit" className="primary">
          Add
        </button>
      </form>

      {state.stretchRoutines.length === 0 ? (
        <p className="muted">No stretch routines yet. Add one above.</p>
      ) : (
        <ul className="list">
          {state.stretchRoutines.map((r) => {
            const count = r.stretches.length;
            const total = r.stretches.reduce((sum, s) => sum + s.duration, 0);
            return (
              <li key={r.id} className="list-row">
                <button className="list-main" onClick={() => setEditingId(r.id)}>
                  <span className="ex-name">{r.name}</span>
                  <span className="muted small">
                    {count} stretch{count === 1 ? '' : 'es'}
                    {count > 0 ? ` · ${total}s total` : ''}
                  </span>
                </button>

                <button
                  className="primary"
                  disabled={count === 0}
                  onClick={() => setRunningId(r.id)}
                >
                  Go
                </button>

                <button
                  className="danger ghost"
                  aria-label={`Delete ${r.name}`}
                  onClick={() => {
                    if (confirm(`Delete "${r.name}"? This can't be undone.`)) {
                      dispatch({ type: 'deleteStretchRoutine', id: r.id });
                    }
                  }}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
