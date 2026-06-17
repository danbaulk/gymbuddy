import { useState } from 'react';
import { GymProvider } from './store';
import Today from './components/Today';
import Routines from './components/Routines';

type Tab = 'today' | 'routines';

export default function App() {
  const [tab, setTab] = useState<Tab>('today');

  return (
    <GymProvider>
      <div className="app">
        <main className="content">
          {tab === 'today' ? (
            <Today onGoToRoutines={() => setTab('routines')} />
          ) : (
            <Routines />
          )}
        </main>

        <nav className="tabbar">
          <button
            className={tab === 'today' ? 'tab active' : 'tab'}
            onClick={() => setTab('today')}
          >
            Today
          </button>
          <button
            className={tab === 'routines' ? 'tab active' : 'tab'}
            onClick={() => setTab('routines')}
          >
            Routines
          </button>
        </nav>
      </div>
    </GymProvider>
  );
}
