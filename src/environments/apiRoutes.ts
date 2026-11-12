export const apiRoutes = {
  routes: '/routes',
  dashboard: (profile: string) => `/profiles/${profile}/dashboard`,
  day: (profile: string, date: string) => `/profiles/${profile}/days/${date}`,
  settings: (profile: string) => `/profiles/${profile}/settings`,
  journeys: (profile: string) => `/profiles/${profile}/journeys`,
  journey: (profile: string, routeId: string) => `/profiles/${profile}/journeys/${routeId}`,
  garminSync: '/profiles/personal/garmin/sync',
  demoAdvance: '/demo/advance',
  demoReset: '/demo/reset',
  export: (profile: string) => `/api/v1/profiles/${profile}/export`,
  garminExport: (profile: string) => `/api/v1/profiles/${profile}/health/export`,
};
