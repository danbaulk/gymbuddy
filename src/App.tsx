import { useState } from 'react';
import { GymProvider } from './store';
import Today from './components/Today';
import Routines from './components/Routines';
import Stretches from './components/Stretches';
import More from './components/More';

type Tab = 'today' | 'routines' | 'stretches' | 'more';

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
          ) : tab === 'stretches' ? (
            <Stretches />
          ) : (
            <More />
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
          <button
            className={tab === 'more' ? 'tab active' : 'tab'}
            onClick={() => setTab('more')}
          >
            More
          </button>
        </nav>
      </div>
    </GymProvider>
  );
}
