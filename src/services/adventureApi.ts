import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { apiRoutes } from '../environments/apiRoutes';
import type { AdventureRoute, Dashboard, ProfileId, Settings, SyncResult } from '../models/adventure';
import type { AppUser, GarminConnection, Session } from '../models/account';
import type { ActivityDetail, Challenge, Community, Dataset, DatasetResult, Grant, HealthOverview, Post, RawDocument, ShareRequest, SyncPreferences } from '../models/health';

const request = fetchBaseQuery({
  baseUrl: '/api/v1', timeout: 90_000, credentials: 'same-origin', cache: 'no-store',
  prepareHeaders: (headers) => { headers.set('X-TrailQuest-Client', 'local-web'); return headers; },
});

const authenticatedRequest: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extra) => {
  const result = await request(args, api, extra);
  if (result.error?.status === 401 && (typeof args === 'string' ? args : args.url) !== '/auth/session') {
    api.dispatch(adventureApi.util.resetApiState());
  }
  return result;
};

export const adventureApi = createApi({
  reducerPath: 'adventureApi',
  baseQuery: authenticatedRequest,
  tagTypes: ['Dashboard', 'Connection', 'Users', 'Health', 'Sync', 'Community', 'Grants'],
  endpoints: (builder) => ({
    getDemoStatus: builder.query<{ available: boolean }, void>({ query: () => '/demo/status' }),
    getHealth: builder.query<HealthOverview, { profile: ProfileId; accountId: string; startDate?: string; endDate?: string }>({
      query: ({ profile, startDate, endDate }) => ({ url: `/profiles/${profile}/health`, params: { startDate, endDate } }),
      providesTags: (_r, _e, { profile }) => [{ type: 'Health', id: profile }],
    }),
    getActivity: builder.query<ActivityDetail, { profile: ProfileId; accountId: string; id: number }>({ query: ({ profile, id }) => `/profiles/${profile}/activities/${id}`, providesTags: ['Health'] }),
    getDocuments: builder.query<RawDocument[], { profile: ProfileId; accountId: string; dataset: string; limit?: number }>({ query: ({ profile, dataset, limit }) => ({ url: `/profiles/${profile}/health/documents/${encodeURIComponent(dataset)}`, params: { limit } }), providesTags: ['Health'] }),
    getChallenges: builder.query<Challenge[], { profile: ProfileId; accountId: string }>({ query: ({ profile }) => `/profiles/${profile}/challenges`, providesTags: (_r, _e, { profile }) => [{ type: 'Health', id: profile }] }),
    getDatasets: builder.query<Dataset[], void>({ query: () => '/connections/garmin/datasets' }),
    getSyncPreferences: builder.query<SyncPreferences, string>({ query: () => '/connections/garmin/preferences', providesTags: ['Sync'] }),
    saveSyncPreferences: builder.mutation<void, Pick<SyncPreferences, 'datasets' | 'intervalHours' | 'lookbackDays' | 'importOriginals'>>({ query: (body) => ({ url: '/connections/garmin/preferences', method: 'PUT', body }), invalidatesTags: ['Sync'] }),
    syncAllGarmin: builder.mutation<{ completedAtUtc: string; results: DatasetResult[] }, { startDate?: string; endDate?: string }>({ query: (body) => ({ url: '/connections/garmin/sync', method: 'POST', body, timeout: 600_000 }), invalidatesTags: ['Health', 'Sync', 'Dashboard'] }),
    getCommunity: builder.query<Community, { profile: ProfileId; accountId: string }>({ query: ({ profile }) => `/community?profile=${profile}`, providesTags: ['Community'] }),
    requestFriend: builder.mutation<void, string>({ query: (username) => ({ url: '/community/friends', method: 'POST', body: { username } }), invalidatesTags: ['Community'] }),
    acceptFriend: builder.mutation<void, string>({ query: (id) => ({ url: `/community/friends/${id}/accept`, method: 'POST', body: {} }), invalidatesTags: ['Community'] }),
    removeFriend: builder.mutation<void, string>({ query: (id) => ({ url: `/community/friends/${id}`, method: 'DELETE' }), invalidatesTags: ['Community'] }),
    blockUser: builder.mutation<void, string>({ query: (id) => ({ url: `/community/blocks/${id}`, method: 'POST', body: {} }), invalidatesTags: ['Community'] }),
    previewShare: builder.mutation<Post, ShareRequest>({ query: (body) => ({ url: '/community/preview', method: 'POST', body }) }),
    publishShare: builder.mutation<Post, ShareRequest>({ query: (body) => ({ url: '/community/posts', method: 'POST', body }), invalidatesTags: ['Community'] }),
    deletePost: builder.mutation<void, string>({ query: (id) => ({ url: `/community/posts/${id}`, method: 'DELETE' }), invalidatesTags: ['Community'] }),
    getGrants: builder.query<Grant[], string>({ query: () => '/integrations/grants', providesTags: ['Grants'] }),
    revokeGrant: builder.mutation<void, string>({ query: (id) => ({ url: `/integrations/grants/${id}`, method: 'DELETE' }), invalidatesTags: ['Grants'] }),
    getSession: builder.query<Session, void>({ query: () => '/auth/session' }),
    getConnection: builder.query<GarminConnection, string>({ query: () => '/connections/garmin', providesTags: ['Connection'] }),
    getUsers: builder.query<AppUser[], string>({ query: () => '/auth/users', providesTags: ['Users'] }),
    getRoutes: builder.query<AdventureRoute[], void>({ query: () => apiRoutes.routes }),
    getDashboard: builder.query<Dashboard, { profile: ProfileId; accountId: string }>({
      query: ({ profile }) => apiRoutes.dashboard(profile),
      providesTags: (_result, _error, { profile }) => [{ type: 'Dashboard', id: profile }],
    }),
    saveDay: builder.mutation<void, { profile: ProfileId; date: string; steps: number }>({
      query: ({ profile, date, steps }) => ({ url: apiRoutes.day(profile, date), method: 'PUT', body: { steps } }),
      invalidatesTags: (_result, _error, { profile }) => [{ type: 'Dashboard', id: profile }],
    }),
    saveSettings: builder.mutation<void, { profile: ProfileId; settings: Settings }>({
      query: ({ profile, settings }) => ({ url: apiRoutes.settings(profile), method: 'PUT', body: settings }),
      invalidatesTags: (_result, _error, { profile }) => [{ type: 'Dashboard', id: profile }],
    }),
    startJourney: builder.mutation<void, { profile: ProfileId; routeId: string; startedOn?: string; replacingRouteId?: string }>({
      query: ({ profile, routeId, startedOn, replacingRouteId }) => ({ url: apiRoutes.journeys(profile), method: 'POST', body: { routeId, startedOn, replacingRouteId } }),
      invalidatesTags: (_result, _error, { profile }) => [{ type: 'Dashboard', id: profile }],
    }),
    leaveJourney: builder.mutation<void, { profile: ProfileId; routeId: string }>({
      query: ({ profile, routeId }) => ({ url: apiRoutes.journey(profile,routeId), method: 'DELETE' }),
      invalidatesTags: (_result, _error, { profile }) => [{ type: 'Dashboard', id: profile }],
    }),
    updateJourney: builder.mutation<void, { profile: ProfileId; routeId: string; startedOn: string }>({
      query: ({ profile, routeId, startedOn }) => ({ url: apiRoutes.journey(profile, routeId), method: 'PUT', body: { startedOn } }),
      invalidatesTags: (_result, _error, { profile }) => [{ type: 'Dashboard', id: profile }],
    }),
    updateJourneyContent: builder.mutation<void, { profile: ProfileId; routeId: string }>({
      query: ({ profile, routeId }) => ({ url: `/profiles/${profile}/journeys/${encodeURIComponent(routeId)}/content`, method: 'PUT', body: {} }),
      invalidatesTags: (_result, _error, { profile }) => [{ type: 'Dashboard', id: profile }],
    }),
    advanceDemo: builder.mutation<void, void>({
      query: () => ({ url: apiRoutes.demoAdvance, method: 'POST', body: {} }),
      invalidatesTags: [{ type: 'Dashboard', id: 'demo' }, { type: 'Health', id: 'demo' }, 'Community'],
    }),
    resetDemo: builder.mutation<void, void>({
      query: () => ({ url: apiRoutes.demoReset, method: 'POST', body: {} }),
      invalidatesTags: [{ type: 'Dashboard', id: 'demo' }, { type: 'Health', id: 'demo' }, 'Community'],
    }),
    syncGarmin: builder.mutation<SyncResult, { startDate: string; endDate: string }>({
      query: (body) => ({ url: apiRoutes.garminSync, method: 'POST', body }),
      invalidatesTags: [{ type: 'Dashboard', id: 'personal' }],
    }),
  }),
});

export const {
  useGetDemoStatusQuery,
  useGetSessionQuery, useGetConnectionQuery, useGetUsersQuery,
  useGetRoutesQuery, useGetDashboardQuery, useSaveDayMutation, useSaveSettingsMutation,
  useStartJourneyMutation, useUpdateJourneyMutation, useAdvanceDemoMutation,
  useLeaveJourneyMutation,
  useResetDemoMutation, useSyncGarminMutation,
  useUpdateJourneyContentMutation,
  useGetHealthQuery, useGetActivityQuery, useGetDocumentsQuery, useGetChallengesQuery,
  useGetDatasetsQuery, useGetSyncPreferencesQuery, useSaveSyncPreferencesMutation, useSyncAllGarminMutation,
  useGetCommunityQuery, useRequestFriendMutation, useAcceptFriendMutation, useRemoveFriendMutation, useBlockUserMutation,
  usePreviewShareMutation, usePublishShareMutation, useDeletePostMutation, useGetGrantsQuery, useRevokeGrantMutation,
} = adventureApi;
