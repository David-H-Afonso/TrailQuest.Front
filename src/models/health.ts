export interface TrackPoint { latitude: number; longitude: number; atUtc: string | null; elevationMeters: number | null }
export interface Exercise { name: string; sets: number | null; repetitions: number | null; maxWeightKg: number | null; volumeKg: number | null }
export interface Activity { id: number; name: string; sport: string; source: string; startedAtUtc: string; durationSeconds: number | null; distanceMeters: number | null; caloriesKcal: number | null; averageHeartRate: number | null; repetitions: number | null; sets: number | null; volumeKg: number | null; exercises: Exercise[]; originalStatus: string; trackPoints: number }
export interface ActivityDetail { activity: Activity; track: TrackPoint[] }
export interface Metric { id: string; label: string; value: number | null; unit: string; date: string; source: string }
export interface MetricSample { atUtc: string; value: number }
export interface MetricSeries { id: string; label: string; unit: string; samples: MetricSample[] }
export interface HealthDay { date: string; metrics: Metric[]; series: MetricSeries[] }
export interface Coverage { id: string; documents: number; updatedAtUtc: string | null }
export interface HealthOverview { profileId: string; startDate: string; endDate: string; activities: Activity[]; days: HealthDay[]; coverage: Coverage[]; lastSyncAtUtc: string | null }
export interface Dataset { id: string; name: string; description: string; sensitive: boolean; granularity: string }
export interface DatasetResult { dataset: string; status: string; records: number; message: string | null }
export interface SyncPreferences { datasets: string[]; intervalHours: number; lookbackDays: number; importOriginals: boolean; lastAttemptAtUtc: string | null; lastCompletedAtUtc: string | null; lastResults: DatasetResult[] }
export interface RawDocument { id: number; dataset: string; date: string; source: string; retrievedAtUtc: string; data: unknown }
export interface GarminExportStep { steps: number; distanceMeters: number; stepLengthCm: number; distanceEstimated: boolean }
export interface GarminExportActivity { name: string; sport: string; startedAtUtc: string; durationSeconds: number | null; distanceMeters: number | null; caloriesKcal: number | null; averageHeartRate: number | null; repetitions: number | null; sets: number | null; volumeKg: number | null; exercises: Exercise[] }
export interface GarminExportHealthRecord { dataset: string; data: unknown }
export interface GarminExportDay { date: string; steps: GarminExportStep[]; activities: GarminExportActivity[]; healthRecords: GarminExportHealthRecord[] }
export interface GarminExport { schemaVersion: number; exportedAtUtc: string; profileId: string; startDate: string; endDate: string; datasets: string[]; sensitiveDatasets: string[]; privacy: { includesCredentials: boolean; includesOriginalActivityFiles: boolean; includesGpsTracks: boolean }; days: GarminExportDay[] }
export interface Challenge { id: string; name: string; description: string; metric: string; unit: string; target: number; value: number; progressPercent: number; completed: boolean; comparisonNote: string }
export interface Friend { id: string; userId: string; displayName: string; status: string; incoming: boolean }
export interface Post { id: string; userId: string; displayName: string; kind: string; title: string; summary: string; createdAtUtc: string; isOwn: boolean; track: TrackPoint[] }
export interface Community { friends: Friend[]; posts: Post[] }
export interface ShareRequest { kind: string; sourceId: string; checkpointId?: string; includeTrack: boolean; profileId?: 'demo' | 'personal' }
export interface Grant { id: string; application: string; scopes: string[]; expiresAtUtc: string }
