export interface AppUser {
  id: string;
  username: string;
  displayName: string;
  isOwner: boolean;
}

export interface Session {
  user: AppUser | null;
  setupRequired: boolean;
  expiresAtUtc?: string | null;
}

export interface GarminConnection {
  configured: boolean;
  verifiedAtUtc: string | null;
}
