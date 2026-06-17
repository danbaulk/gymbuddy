import { useEffect, useReducer } from 'react';
import type { ReactNode } from 'react';
import { gymReducer } from './reducer';
import { load, save } from './storage';
import { GymContext } from './gymContext';

export function GymProvider({ children }: { children: ReactNode }) {
  // Lazily seed the reducer from localStorage on first render.
  const [state, dispatch] = useReducer(gymReducer, undefined, load);

  // Persist on every change.
  useEffect(() => {
    save(state);
  }, [state]);

  return <GymContext.Provider value={{ state, dispatch }}>{children}</GymContext.Provider>;
}
