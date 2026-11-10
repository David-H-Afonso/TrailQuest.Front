export type ProfileId = 'demo' | 'personal';
export type StepSource = 'demo' | 'manual' | 'garmin' | 'none';
export type Position = [number, number];

export interface Checkpoint {
  id: string;
  name: string;
  localName: string;
  distanceKm: number;
  position: Position;
  category: string;
  description: string;
  fact: string;
  story: string[];
  stamp: string;
  image?: string | null;
  gallery: AdventureMedia[];
}

export interface AdventureMedia { file: string; alt: string; caption: string; credit: string; license: string; sourceUrl?: string | null; licenseUrl?: string | null }
export interface PassportDefinition { title: string; subtitle: string; regionLabel: string; color: string; motif: string; closingText: string }

export interface AdventureRoute {
  id: string;
  name: string;
  subtitle: string;
  region: string;
  kind: 'city' | 'fantasy';
  difficulty: string;
  distanceKm: number;
  description: string;
  color: string;
  coordinates: Position[];
  checkpoints: Checkpoint[];
  attribution: string;
  schemaVersion: number;
  contentVersion: string;
  setting: 'real' | 'fiction';
  introduction: string;
  cover: string | null;
  passport: PassportDefinition;
  map: { kind: 'geographic' | 'illustrated' | 'schematic'; artwork?: string | null; label: string };
  gallery: AdventureMedia[];
  references: { title: string; url: string }[];
}

export interface Settings {
  dailyStepGoal: number;
  stepLengthCm: number;
  timeZoneId: string;
}

export interface DailySteps {
  date: string;
  steps: number;
  distanceKm: number;
  isDistanceEstimated: boolean;
  source: StepSource;
  updatedAtUtc: string | null;
}

export interface Journey {
  routeId: string;
  startedOn: string;
  steps: number;
  distanceKm: number;
  progressPercent: number;
  remainingKm: number;
  nextCheckpointId: string | null;
  nextCheckpointRemainingKm: number;
  visits: { checkpointId: string; unlockedAtUtc: string }[];
  contentVersion?: string;
  definition?: AdventureRoute;
  isActive: boolean;
  leftAtUtc?: string | null;
  countingFrom?: string | null;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAtUtc: string | null;
}

export interface Dashboard {
  profileId: ProfileId;
  today: string;
  settings: Settings;
  todayActivity: DailySteps;
  week: DailySteps[];
  history: DailySteps[];
  totals: {
    steps: number;
    distanceKm: number;
    activeDays: number;
    xp: number;
    level: number;
    levelXp: number;
    xpPerLevel: number;
    goalDays: number;
  };
  currentJourney: Journey | null;
  journeyPolicy?: 'single-active';
  journeys: Journey[];
  achievements: Achievement[];
  garmin: { configured: boolean; lastSyncAtUtc: string | null };
}

export interface SyncResult {
  daysReceived: number;
  daysChanged: number;
  syncedAtUtc: string;
}

export interface ApiProblem {
  code?: string;
  title?: string;
  status?: number;
}
