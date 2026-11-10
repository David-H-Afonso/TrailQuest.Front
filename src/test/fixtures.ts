import type { AdventureRoute, Dashboard, Journey, Position } from '../models/adventure';

// Owned, synthetic CONTRACT fixtures. They neither import the backend repository
// nor require installed production adventures or the removable demo fixture.
function routeFixture(id: string, name: string, title: string, region: string, map: AdventureRoute['map']['kind'], stops: [string,string,number][]): AdventureRoute {
  const coordinates: Position[] = stops.map((_, index) => map === 'illustrated' ? [80+index*100,100+index*50] : [35+index*.005,139+index*.004]);
  return { id,name,subtitle:'Synthetic contract fixture',region,kind:map==='illustrated'?'fantasy':'city',setting:map==='illustrated'?'fiction':'real',difficulty:'Fixture',distanceKm:stops.at(-1)![2],color:'#176e67',schemaVersion:1,contentVersion:'1.0.0',description:'Synthetic test description; not production editorial content.',introduction:'Synthetic test introduction.',cover:null,attribution:'Synthetic geometry created for tests, not navigation data.',coordinates,
    passport:{title,subtitle:'Fixture',regionLabel:region,color:'#176e67',motif:'map-pin',closingText:'Fixture complete'},map:{kind:map,label:`Esquema de ${region}`},gallery:[],references:[],
    checkpoints:stops.map(([stopId,stopName,distanceKm],index)=>({id:stopId,name:stopName,localName:stopName,distanceKm,position:coordinates[index],category:'Fixture',description:'Synthetic checkpoint description.',fact:'Synthetic contract fact.',story:[`Synthetic story for ${stopName}; fixture only.`],stamp:'map-pin',gallery:[]})) };
}
export const routes: AdventureRoute[] = [
  routeFixture('tokyo','Tokio, paso a paso','Tokio','Tokio · Japón','geographic',[
    ['shinjuku','Shinjuku',0],['meiji','Meiji Jingū',2.042],['shibuya','Cruce de Shibuya',4.211],['tower','Tokyo Tower',8.77],['ginza','Ginza',11.531],['station','Estación de Tokio',12.84],['akihabara','Akihabara',15.414],['ueno','Parque de Ueno',17.623],['sensoji','Sensō-ji',20.14],['skytree','Tokyo Skytree',21.925]]),
  routeFixture('mistvale','Cartas de Brumavalle','Cartas de Brumavalle','BRUMAVALLE','illustrated',[
    ['gate','La puerta',0],['forest','El bosque',12],['bridge','El puente',24],['hill','La colina',40],['river','El río',55],['town','La aldea',70],['home','El regreso',82]]),
  routeFixture('hokkaido','Hokkaidō: de Sapporo a Furano','Hokkaidō','Hokkaidō · Japón','schematic',[
    ['sapporo','Sapporo',0],['otaru','Otaru',24],['asahikawa','Asahikawa',58],['biei','Biei',90],['furano','Furano',120]])
];
export const demoDashboard: Dashboard & { currentJourney: Journey } = {
  journeyPolicy: 'single-active',
  profileId: 'demo', today: '2026-11-09', settings: { dailyStepGoal: 8000, stepLengthCm: 72, timeZoneId: 'UTC' },
  todayActivity: { date: '2026-11-09', steps: 3800, distanceKm: 2.736, isDistanceEstimated: true, source: 'demo', updatedAtUtc: '2026-11-09T12:00:00Z' },
  week: [1100, 2300, 1600, 0, 2100, 2800, 3800].map((steps, index) => ({ date: `2026-11-${String(index + 3).padStart(2, '0')}`, steps, distanceKm: steps * .00072, isDistanceEstimated: true, source: 'demo', updatedAtUtc: '2026-11-09T12:00:00Z' })),
  history: [{ date: '2026-11-09', steps: 3800, distanceKm: 2.736, isDistanceEstimated: true, source: 'demo', updatedAtUtc: '2026-11-09T12:00:00Z' }],
  totals: { steps: 13700, distanceKm: 9.864, activeDays: 6, xp: 1370, level: 2, levelXp: 370, xpPerLevel: 1000, goalDays: 0 },
  currentJourney: { isActive: true, leftAtUtc: null, routeId: 'tokyo', startedOn: '2026-11-03', steps: 13700, distanceKm: 9.864, progressPercent: 44.99, remainingKm: 12.061, nextCheckpointId: 'ginza', nextCheckpointRemainingKm: 1.667, visits: ['shinjuku', 'meiji', 'shibuya', 'tower'].map((checkpointId) => ({ checkpointId, unlockedAtUtc: '2026-11-09T12:00:00Z' })) },
  journeys: [],
  achievements: [{ id: 'first-step', name: 'El primer paso', description: 'Registra tus primeros pasos.', icon: 'footprints', unlocked: true, unlockedAtUtc: '2026-11-09T12:00:00Z' }],
  garmin: { configured: false, lastSyncAtUtc: null },
};
demoDashboard.journeys = [demoDashboard.currentJourney];
