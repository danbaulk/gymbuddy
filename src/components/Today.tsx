import { useGym } from '../gymContext';
import { getLastWeight } from '../reducer';
import EmptyState from './EmptyState';

export default function Today({ onGoToRoutines }: { onGoToRoutines: () => void }) {
  const { state, dispatch } = useGym();
  const { routines, currentIndex } = state;

  if (routines.length === 0) {
    return <EmptyState onCreate={onGoToRoutines} />;
  }

  const routine = routines[currentIndex];
  const draftEntries = state.draft?.routineId === routine.id ? state.draft.entries : {};

  return (
    <section>
      <header className="today-header">
        <p className="eyebrow">
          Next up · {currentIndex + 1} of {routines.length}
        </p>
        <h1>{routine.name}</h1>
      </header>

      {routine.exercises.length === 0 ? (
        <p className="muted">
          No exercises in this routine yet. Add some on the{' '}
          <button className="link inline" onClick={onGoToRoutines}>
            Routines
          </button>{' '}
          tab.
        </p>
      ) : (
        <ul className="checklist">
          {routine.exercises.map((ex) => {
            const last = getLastWeight(state, routine.id, ex.id);
            const entry = draftEntries[ex.id] ?? {};
            return (
              <li key={ex.id} className={entry.done ? 'row done' : 'row'}>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={!!entry.done}
                    onChange={() =>
                      dispatch({
                        type: 'toggleDraftDone',
                        routineId: routine.id,
                        exerciseId: ex.id,
                      })
                    }
                  />
                </label>

                <div className="row-main">
                  <span className="ex-name">{ex.name}</span>
                  <span className="muted small">
                    {[
                      ex.reps !== undefined ? `${ex.reps} reps` : null,
                      last !== undefined ? `last: ${last} kg` : 'no history yet',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>

                <div className="weight">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="2.5"
                    min="0"
                    placeholder={last !== undefined ? String(last) : 'kg'}
                    value={entry.weight ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      dispatch({
                        type: 'setDraftWeight',
                        routineId: routine.id,
                        exerciseId: ex.id,
                        weight: v === '' ? undefined : Number(v),
                      });
                    }}
                  />
                  <span className="unit">kg</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <button
        className="primary big"
        onClick={() => dispatch({ type: 'markRoutineDone', routineId: routine.id })}
      >
        Mark routine done
      </button>
    </section>
  );
}
