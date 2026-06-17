import { createContext, useContext } from 'react';
import type { Dispatch } from 'react';
import type { AppState } from './types';
import type { Action } from './reducer';

export type GymContextValue = {
  state: AppState;
  dispatch: Dispatch<Action>;
};

export const GymContext = createContext<GymContextValue | null>(null);

export function useGym(): GymContextValue {
  const ctx = useContext(GymContext);
  if (!ctx) throw new Error('useGym must be used within a GymProvider');
  return ctx;
}
