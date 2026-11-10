import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { useDispatch, useSelector } from 'react-redux';
import { adventureApi } from '../services/adventureApi';
import profileReducer from './profileSlice';

export function createAppStore() {
  return configureStore({
    reducer: { profile: profileReducer, [adventureApi.reducerPath]: adventureApi.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(adventureApi.middleware),
  });
}

export const store = createAppStore();
setupListeners(store.dispatch);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

let lastProfile = '';
store.subscribe(() => {
  const profile = store.getState().profile;
  if (!profile.accountId) return;
  const key = `${profile.accountId}:${profile.active}`;
  if (key === lastProfile) return;
  lastProfile = key;
  try { localStorage.setItem(`trailquest.profile.${profile.accountId}`, profile.active); }
  catch { /* The active profile still works when browser storage is disabled. */ }
});
