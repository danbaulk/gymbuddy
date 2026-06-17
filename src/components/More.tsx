import { useRef, useState, type ChangeEvent } from 'react';
import { useGym } from '../gymContext';
import { normalizeState } from '../storage';

/** Backup screen: export the whole app state to a JSON file and import one back. */
export default function More() {
  const { state, dispatch } = useGym();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleExport() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymbuddy-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same file be picked again later
    if (!file) return;
    try {
      const next = normalizeState(JSON.parse(await file.text()));
      if (!next) {
        setError("That file isn't a valid GymBuddy backup.");
        return;
      }
      if (confirm('Replace all current data with this backup? This cannot be undone.')) {
        dispatch({ type: 'importState', state: next });
      }
    } catch {
      setError("Couldn't read that file — is it valid JSON?");
    }
  }

  return (
    <section>
      <header>
        <h1>More</h1>
        <p className="muted small">
          Your data lives only in this browser. Export a copy to back it up or move it to another
          device, and import it to restore.
        </p>
      </header>

      <div className="backup-actions">
        <button className="primary" onClick={handleExport}>
          Export data
        </button>
        <button className="link" onClick={() => fileRef.current?.click()}>
          Import data
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => void handleImport(e)}
      />
    </section>
  );
}
