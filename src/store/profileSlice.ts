import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ProfileId } from '../models/adventure';

export function readSavedProfile(accountId?: string, fallback: ProfileId = 'personal'): ProfileId {
  try { const saved = localStorage.getItem(accountId ? `trailquest.profile.${accountId}` : 'trailquest.profile'); return saved === 'personal' || saved === 'demo' ? saved : fallback; }
  catch { return fallback; }
}

const profileSlice = createSlice({
  name: 'profile',
  initialState: { active: readSavedProfile(), accountId: null } as { active: ProfileId; accountId?: string | null },
  reducers: {
    setProfile: (state, action: PayloadAction<ProfileId>) => { state.active = action.payload; },
    selectAccountProfile: (state, action: PayloadAction<{ accountId: string; profile: ProfileId }>) => {
      state.active = action.payload.profile; state.accountId = action.payload.accountId;
    },
  },
});

export const { setProfile, selectAccountProfile } = profileSlice.actions;
export default profileSlice.reducer;
