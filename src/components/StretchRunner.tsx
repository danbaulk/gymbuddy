import { useEffect, useState } from 'react';
import type { StretchRoutine } from '../types';

/** Seconds as a bare count under a minute, otherwise M:SS. */
function formatTime(total: number): string {
  if (total < 60) return String(total);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Counts a single stretch down and holds at 0 — visual only, never auto-advances.
 * Remounted (via `key`) for each stretch so its state resets to the new duration.
 */
function Countdown({ seconds }: { seconds: number }) {
  const [secondsLeft, setSecondsLeft] = useState(seconds);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return <div className="runner-count">{formatTime(secondsLeft)}</div>;
}

export default function StretchRunner({
  routine,
  onExit,
}: {
  routine: StretchRoutine;
  onExit: () => void;
}) {
  const stretches = routine.stretches;
  const [index, setIndex] = useState(0);

  const current = stretches[index];
  const next = stretches[index + 1];

  if (!current) {
    return (
      <section className="runner">
        <h1 className="runner-stretch">Routine complete</h1>
        <p className="muted">Nice work — {routine.name} done.</p>
        <button className="primary big" onClick={() => setIndex(0)}>
          Restart
        </button>
        <button className="link" onClick={onExit}>
          Exit
        </button>
      </section>
    );
  }

  return (
    <section className="runner">
      <p className="eyebrow runner-progress">
        {index + 1} of {stretches.length}
      </p>
      <h1 className="runner-stretch">{current.name}</h1>
      <Countdown key={current.id} seconds={current.duration} />
      <p className="runner-next muted">{next ? `Next: ${next.name}` : 'Last stretch'}</p>

      <button className="primary big" onClick={() => setIndex((i) => i + 1)}>
        Next
      </button>
      <button className="link" onClick={onExit}>
        Exit
      </button>
    </section>
  );
}
