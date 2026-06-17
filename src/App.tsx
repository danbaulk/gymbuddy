import { useState } from 'react';
import { GymProvider } from './store';
import Today from './components/Today';
import Routines from './components/Routines';
import Stretches from './components/Stretches';

type Tab = 'today' | 'routines' | 'stretches';

export default function App() {
  const [tab, setTab] = useState<Tab>('today');

  return (
    <GymProvider>
      <div className="app">
        <main className="content">
          {tab === 'today' ? (
            <Today onGoToRoutines={() => setTab('routines')} />
          ) : tab === 'routines' ? (
            <Routines />
          ) : (
            <Stretches />
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
          <button
            className={tab === 'stretches' ? 'tab active' : 'tab'}
            onClick={() => setTab('stretches')}
          >
            Stretches
          </button>
        </nav>
      </div>
    </GymProvider>
  );
}
