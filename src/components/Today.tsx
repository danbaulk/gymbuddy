import { Fragment, useState } from 'react';
import { useGym } from '../gymContext';
import { getCyclesSinceImproved, getLastWeight, getWeightHistory } from '../reducer';
import EmptyState from './EmptyState';

/** Map a stale-cycle count to its badge severity class (green → yellow → red). */
function staleClass(cycles: number): string {
  if (cycles >= 3) return 'stale-high';
  if (cycles === 2) return 'stale-mid';
  return 'stale-low';
}

const SPARK_W = 100;
const SPARK_H = 48;
const SPARK_PAD = 4; // SPARK_PAD / SPARK_H (1/12) is mirrored by .spark-axis padding-block
const MAX_HISTORY_POINTS = 20; // sparkline shows at most the last N logged sessions

/** Polyline point string for a sparkline over `weights`; all-equal values sit mid-height. */
function sparklinePoints(weights: number[]): string {
  const n = weights.length;
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const innerW = SPARK_W - SPARK_PAD * 2;
  const innerH = SPARK_H - SPARK_PAD * 2;
  return weights
    .map((wt, i) => {
      const x = n === 1 ? SPARK_W / 2 : SPARK_PAD + (innerW * i) / (n - 1);
      const ratio = max === min ? 0.5 : (wt - min) / (max - min);
      const y = SPARK_PAD + innerH * (1 - ratio);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export default function Today({ onGoToRoutines }: { onGoToRoutines: () => void }) {
  const { state, dispatch } = useGym();
  const { routines, currentIndex } = state;
  const [openHistory, setOpenHistory] = useState<string | null>(null);

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
            const cycles = getCyclesSinceImproved(state, routine.id, ex.id);
            const beatLast =
              last !== undefined && typeof entry.weight === 'number' && entry.weight > last;
            const open = openHistory === ex.id;
            // Step from the current entry, falling back to the last logged weight, then 0.
            const stepWeight = (delta: number) => {
              const base = entry.weight ?? last ?? 0;
              const next = Math.max(0, Math.round((base + delta) * 100) / 100);
              dispatch({
                type: 'setDraftWeight',
                routineId: routine.id,
                exerciseId: ex.id,
                weight: next,
              });
            };
            return (
              <Fragment key={ex.id}>
                <li className={entry.done ? 'row done' : 'row'}>
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
                    <span className="ex-name">
                      {ex.name}
                      {cycles >= 1 ? (
                        <span
                          className={`badge ${staleClass(cycles)}`}
                          aria-label={`${cycles} cycle${cycles === 1 ? '' : 's'} without improvement`}
                        >
                          {cycles} cyc
                        </span>
                      ) : null}
                    </span>
                    <span className="muted small">
                      {[
                        ex.reps !== undefined ? `${ex.reps} reps` : null,
                        last !== undefined ? `last: ${last} kg` : 'no history yet',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                      {beatLast ? <span className="beat-last"> · ↑ beat last</span> : null}
                    </span>
                    <button
                      type="button"
                      className="link small history-toggle"
                      aria-expanded={open}
                      onClick={() => setOpenHistory(open ? null : ex.id)}
                    >
                      {open ? 'Hide history' : 'History'}
                    </button>
                  </div>

                  <div className="weight">
                    <button
                      type="button"
                      className="step"
                      aria-label={`Decrease ${ex.name} weight`}
                      onClick={() => stepWeight(-2.5)}
                    >
                      −
                    </button>
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
                    <button
                      type="button"
                      className="step"
                      aria-label={`Increase ${ex.name} weight`}
                      onClick={() => stepWeight(2.5)}
                    >
                      +
                    </button>
                    <span className="unit">kg</span>
                  </div>
                </li>

                {open ? <HistoryPanel weights={getWeightHistory(state, routine.id, ex.id)} /> : null}
              </Fragment>
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

/** Full-width expandable row: a sparkline of the exercise's logged weights over time. */
function HistoryPanel({ weights }: { weights: number[] }) {
  if (weights.length === 0) {
    return (
      <li className="history">
        <p className="muted small">No history yet — log a weight and mark the routine done.</p>
      </li>
    );
  }
  const recent = weights.slice(-MAX_HISTORY_POINTS);
  const max = Math.max(...recent);
  const min = Math.min(...recent);
  return (
    <li className="history">
      <div className="spark-wrap">
        <div className={`spark-axis muted small${min === max ? ' single' : ''}`}>
          <span>{max} kg</span>
          {min === max ? null : <span>{min} kg</span>}
        </div>
        <svg
          className="sparkline"
          viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {recent.length === 1 ? (
            <circle cx={SPARK_W / 2} cy={SPARK_H / 2} r="2.5" />
          ) : (
            <polyline points={sparklinePoints(recent)} />
          )}
        </svg>
      </div>
    </li>
  );
}
